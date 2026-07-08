'use strict';
// 1~2장 투자 브리핑 리포트 생성기.
// - 매 실행마다 결정론적(Node) 기본 리포트를 analysis/reports/ 에 저장
// - ctx.ai 가 주입되면(= 클로드와 함께 실행 시) 시황·유동성 심층/버즈 "왜"/추천 근거 심화까지 채움

const fs = require('fs');
const path = require('path');
const { paths, writeText, readJson, money, pct, topPct } = require('./lib/util');

// 청산 사유를 쉬운 한글로
function exitReasonKo(reason, stopPct, trailMa) {
  if (!reason) return '';
  if (reason === 'stop_-7pct') return `종가가 진입가 대비 -${stopPct}% 손절선을 건드려서, 규칙대로 손실을 짧게 끊고 청산했어요.`;
  if (reason === 'breakeven_stop') return '본전(진입가) 손절선을 건드려 청산 — 1차 익절을 이미 했기 때문에 전체로는 손실이 없어요.';
  if (/^trail_peak/.test(reason)) return '고점 대비 하락폭이 커져서 트레일링 손절이 발동됐어요(벌어둔 이익을 지키며 나옴).';
  if (reason === 'below_50ma') return `${trailMa === '20D' ? '20일' : '50일'} 이동평균선을 이탈해 상승 추세가 꺾인 것으로 보고 청산했어요.`;
  return `청산 사유: ${reason}`;
}

// 🚦 보유 종목 손절/익절 점검
function holdingReview(ctx, s) {
  const hs = ctx.portfolio.holdings || [];
  const events = (ctx.updateEvents || []).filter((e) => e.type === 'close' || e.type === 'tier1');
  const stopPct = s.risk.stop_loss_pct, tier1 = s.exit.tier1_gain_pct, trailMa = s.exit.trail_ma;
  const L = [];
  L.push('## 🚦 보유 종목 점검 — 지금 팔아야 할까?');
  if (!hs.length && !events.length) { L.push('- 현재 보유 종목이 없습니다.'); L.push(''); return L; }

  if (events.length) {
    L.push('### 이번 실행에서 매도·청산된 종목');
    for (const e of events) {
      if (e.type === 'tier1') {
        L.push(`- 💰 **${e.symbol} 1차 익절 완료** — 진입 후 강하게 급등해서 보유량의 1/3을 팔아 이익(${money(e.realized)})을 확보했어요. 그리고 나머지 2/3의 손절선을 **본전으로 올려서**, 이제 이 종목에서 최악의 경우에도 손해 볼 일은 없습니다. 남은 물량은 추세가 살아있는 한 계속 들고 갑니다.`);
      } else {
        const loss = e.realized < 0;
        L.push(`- ${loss ? '🔴' : '🟢'} **${e.symbol} ${loss ? '손절' : '청산'}** — ${exitReasonKo(e.reason, stopPct, trailMa)} 실현 손익 ${money(e.realized)} (${pct(e.rpct)}).${e.lesson ? ' 🔎 원인: ' + e.lesson : ''}${e.note ? ' ✅ ' + e.note : ''}`);
      }
    }
    L.push('');
  }

  if (hs.length) {
    L.push('### 현재 보유 종목 상태');
    for (const h of hs) {
      const toStop = ((h.current_price - h.stop_loss) / h.current_price * 100);
      const pnl = h.unrealized_pnl_pct;
      let verdict, why;
      if (pnl <= -(stopPct - 2)) {
        verdict = '⚠️ 손절 임박';
        why = `현재 손익 ${pct(pnl)}로 -${stopPct}% 손절선(${money(h.stop_loss)})에 바짝 다가섰어요. 만약 종가가 손절가 아래로 마감하면, 다음 실행 때 규칙대로 자동 청산돼요. "손실은 짧게" 원칙이라 여기서 더 버티지 않습니다.`;
      } else if (!h.tier1_taken && pnl >= tier1 - 3) {
        verdict = '💰 1차 익절 임박';
        why = `현재 손익 ${pct(pnl)}로 +${tier1}% 익절 목표에 근접했어요. 도달하면 1/3을 팔아 이익을 확보하고, 나머지 손절선을 본전으로 올려 리스크를 0으로 만듭니다.`;
      } else if (h.tier1_taken) {
        verdict = '🟢 트레일링 중 (이익 확보 상태)';
        why = `이미 1차 익절을 마쳐서 손절선이 본전이에요(= 더 이상 손해 안 봄). 남은 물량은 ${trailMa} 이동평균선을 깨기 전까지 수익을 키우며 계속 들고 갑니다. 현재 ${pct(pnl)}.`;
      } else {
        verdict = '✅ 보유 유지';
        why = `현재 손익 ${pct(pnl)}. 손절가 ${money(h.stop_loss)}까지 약 ${toStop.toFixed(1)}% 여유가 있고, 익절 목표(+${tier1}%)까지도 아직 남았어요. 손절선도 안 건드렸고 추세도 살아있어서, 지금은 팔 이유가 없습니다 — 그대로 들고 갑니다.`;
      }
      L.push(`- **${h.symbol}** (${h.quantity}주 · 진입 ${money(h.entry_price)} → 현재 ${money(h.current_price)}) → ${verdict}`);
      L.push(`  - ${why}`);
    }
    L.push('');
  }
  return L;
}

// 🧬 현재 전략 + 변경 이력 (쉽게·자세히)
function strategySection(s, changelog) {
  const topRs = 100 - s.screening.rs_rank_pct_min;
  const L = [];
  L.push('## 🧬 지금 우리가 쓰는 투자 전략 (쉽게 풀어서)');
  L.push(`> **현재 버전: v${s.version}** · 최종 수정 ${s.updated}`);
  L.push('');
  L.push('우리 팀은 **"시장에서 제일 잘 나가는 주도주를 골라, 작게 잃고 크게 먹는"** 모멘텀 전략을 씁니다. 단계별로 풀면 이래요:');
  L.push('');
  L.push(`**1️⃣ 어떤 종목을 보나 — "강한 놈만"**`);
  L.push(`- 시장 전체보다 훨씬 잘 나가는 종목, 즉 **상대강도(RS) 상위 ${topRs}%** 안에 드는 종목만 봅니다. (반에서 1~${topRs}등 하는 애들만 보는 셈)`);
  L.push(`- 그중에서도 이동평균선이 **정배열**(단기>중기>장기로 예쁘게 상승 정렬)이고, **52주 최고가의 ${s.screening.high_52w_pct_min}% 이상** 근처에 있는 진짜 강자만 남겨요. 바닥에서 헤매는 종목은 거들떠보지 않습니다.`);
  L.push('');
  L.push(`**2️⃣ 언제 사나 — 두 가지 진입 방법**`);
  L.push(`- ⚡ **돌파 (Perfect Storm)**: 최근 60일 최고가를 **거래량 ${s.perfect_storm_entry.vol_x_min}배** 터뜨리며 뚫을 때. 기관들이 강하게 사들이며 치고 나가는 순간에 같이 올라타는 방식이에요.`);
  L.push(`- 👨‍🏫 **눌림목 (응봉아재)**: 잘 오르던 주식이 잠깐 숨 고르며 10일선 근처(${s.eungbong_pullback.div10_low}~${s.eungbong_pullback.div10_high}%)로 살짝 눌릴 때. 강한 종목을 조금 더 싸게 줍는 방식이에요.`);
  L.push('');
  L.push(`**3️⃣ 손실 관리 — 제일 중요! "손실은 짧게"**`);
  L.push(`- 산 가격에서 **-${s.risk.stop_loss_pct}% 떨어지면 무조건 팝니다.** 미련 없이요. 작은 손실로 끊어야 다음 기회를 노릴 수 있거든요. 큰 손실 한 방이 계좌를 망가뜨리는 걸 막는 안전벨트예요.`);
  L.push(`- 한 번에 거는 돈도 전체의 **${s.risk.risk_per_trade_pct}%만 위험**에 노출되게 크기를 조절하고, 최대 **${s.risk.max_positions}종목**까지만 담아요.`);
  L.push('');
  L.push(`**4️⃣ 수익 관리 — "수익은 길게"**`);
  L.push(`- **+${s.exit.tier1_gain_pct}% 정도 급등**하면 1/3만 먼저 팔아 이익을 챙기고, 남은 것의 **손절선을 본전으로 올려요.** 이 순간부터는 이 종목에서 절대 손해를 안 봐요(최악이 본전).`);
  L.push(`- 나머지 2/3는 **${s.exit.trail_ma === '20D' ? '20일' : s.exit.trail_ma} 이동평균선을 깨기 전까지** 계속 들고 갑니다. 진짜 대박주(2~3배 가는 종목)를 조기에 팔아 놓치지 않으려는 거예요.`);
  L.push('');
  L.push(`**🎯 한 문장 요약**: 강한 종목만 골라 → 아니다 싶으면 -${s.risk.stop_loss_pct}%에 빠르게 손절 → 맞으면 수익을 끝까지 늘린다.`);
  L.push('');
  L.push('**📅 전략 변경 이력 (일자별)**');
  const entries = (changelog && changelog.entries) || [];
  if (!entries.length) {
    L.push('- (아직 변경 없음 — 초기 버전 v1 사용 중)');
  } else {
    L.push('| 일자 | 버전 | 무엇이 · 왜 바뀌었나 (쉽게) |');
    L.push('|------|------|------------------------------|');
    for (const e of entries.slice().reverse()) L.push(`| ${e.date} | v${e.version} | ${e.change} |`);
  }
  L.push('> 전략은 고정이 아니라, 전략가 Morgan이 매매일지를 검토해 계속 발전시킵니다(살아있는 전략).');
  L.push('');
  return L;
}

// 모든 브리핑 리포트를 대시보드용 data/reports.js 로 인덱싱 (일자별, 최근 60개)
function writeReportsIndex() {
  const dir = path.join(paths.root, 'analysis', 'reports');
  let files = [];
  try { files = fs.readdirSync(dir).filter((f) => /-briefing\.md$/.test(f)); } catch (e) { files = []; }
  const reports = files
    .map((f) => ({ date: f.replace('-briefing.md', ''), md: fs.readFileSync(path.join(dir, f), 'utf8') }))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 60);
  const out = path.join(paths.root, 'dashboard', 'data', 'reports.js');
  writeText(out, 'window.REPORTS_DATA = ' + JSON.stringify(reports, null, 2) + ';\n');
  return reports.length;
}

function lightKo(l) { return l === 'green' ? '🟢 초록불(진입 가능)' : l === 'yellow' ? '🟡 노랑불(주의)' : '🔴 빨강불(진입 중단)'; }

// 쉬운 용어 풀이 (리포트 하단에 항상 첨부)
const GLOSSARY = [
  ['RS (상대강도)', '시장 전체보다 이 종목이 얼마나 더 잘 나가는지. 높을수록 주도주예요.'],
  ['정배열', '단기·중기·장기 평균선이 위에서 아래로 예쁘게 놓인 상승 추세 모양.'],
  ['50이격도', '주가가 50일 평균선에서 얼마나 떨어졌나. 너무 높으면 단기 과열(급등).'],
  ['눌림목', '오르던 주식이 잠깐 숨 고르며 살짝 빠진 자리. 다시 오르기 전 매수 타이밍으로 봄.'],
  ['60일 돌파', '최근 60일 최고가를 뚫고 신고가를 낸 것 = 강한 상승 신호.'],
  ['시장폭(브레드스)', '오르는 종목이 많은지 적은지. 소수만 오르면 겉만 좋고 속은 약한 위험한 장.'],
  ['트레일링 스탑', '수익이 나면 손절선을 따라 올려서, 번 돈을 지키며 더 먹는 방법.'],
  ['VIX', '시장 공포지수. 낮으면 안심 분위기, 높으면 불안.'],
];

// 코다리 부장(Antigravity)에게 붙여넣을 프롬프트 자동 생성
function handoffPrompt(c, ctx) {
  const ai = ctx.ai || {};
  const d = ai.picksDetail && ai.picksDetail[c.ticker];
  const v = ctx.verification && (ctx.verification.scores || []).find((x) => x.ticker === c.ticker);
  const react = ctx.buzz && (ctx.buzz.reactions || []).find((r) => r.symbol === c.ticker);
  const L = [];
  L.push(`${c.ticker} 분석해줘.`);
  L.push(`[우리 AI 투자팀 데이터] ${c.sector} · ${c.strategy === 'perfect_storm' ? '⚡Perfect Storm 돌파' : '👨‍🏫눌림목'} · RS 상위 ${topPct(c.rsRank)}% · 현재가 ${money(c.price)}`);
  L.push(`· 근거: ${(c.reasons || []).slice(0, 3).join(' · ')}`);
  if (d && d.oneLine) L.push(`· 회사: ${d.oneLine}`);
  if (react) L.push(`· 커뮤니티 반응: ${react.mood}`);
  if (v) L.push(`· 우리 검증단: 폭발력 ${v.avg}점 · ${v.veto ? '악마의 변호인 보류(주의)' : '통과'}`);
  L.push(`너(코다리 부장) 관점에서 심층 분석해줘 — 펀더멘털 · 기술적 셋업 · 리스크 · 매수 타이밍.`);
  return L.join('\n');
}

function buildReport(ctx) {
  const ai = ctx.ai || {};
  const s = ctx.stats;
  const strat = readJson(paths.strategyJson, null);
  const changelog = readJson(path.join(paths.root, 'strategy', 'changelog.json'), { entries: [] });
  const L = [];

  L.push(`# 📋 투자 브리핑 — ${ctx.dateStr}`);
  L.push('');
  L.push(`> 시장 ${lightKo(ctx.marketLight)} · 활성전략 v${ctx.strategyVersion} · 데이터 ${ctx.source} · ⚠️ 교육용 모의투자, 투자조언 아님`);
  L.push('');

  // 🧾 3줄 요약 (쉽게)
  if (ai.easySummary && ai.easySummary.length) {
    L.push('## 🧾 3줄 요약 (쉽게)');
    for (const s of ai.easySummary) L.push(`- ${s}`);
    L.push('');
  }

  // 🎯 결론
  L.push('## 🎯 오늘의 결론');
  L.push(ai.conclusion || (ctx.opened.length
    ? `신규 ${ctx.opened.length}종목 진입. 누적 ${pct(s.total_return_pct)}.`
    : `신규 진입 없음 — ${ctx.marketLight === 'red' ? '시장 위험, 현금 보존' : '조건 미충족/시장 부적합, 관망'}. 누적 ${pct(s.total_return_pct)}.`));
  L.push('');

  // ① 시황·투자환경
  L.push('## ① 시황 · 투자환경');
  if (ai.marketBrief) {
    L.push(ai.marketBrief);
  } else {
    L.push(`- 시장 신호등: ${lightKo(ctx.marketLight)}`);
    L.push('- 심층 시황·유동성 분석은 AI 리서치와 함께 실행 시 제공됩니다.');
  }
  if (ai.liquidity) { L.push(''); L.push(`**💧 유동성 체크:** ${ai.liquidity}`); }
  if (ai.keyRisks && ai.keyRisks.length) { L.push(''); L.push('**주요 리스크:**'); for (const r of ai.keyRisks) L.push(`- ${r}`); }
  L.push('');

  // ② 추천 종목 & 이유 (상세)
  L.push('## ② 추천 종목 & 이유 (자세히)');
  const picks = ctx.candidates || [];
  if (picks.length === 0) {
    L.push('- 오늘은 추천 종목이 없습니다 (조건 미충족 또는 시장 부적합).');
  } else {
    L.push('| 종목 | 전략 | RS | 진입가 | 한 줄 |');
    L.push('|------|------|-----|--------|-------|');
    for (const c of picks.slice(0, 5)) {
      const d = ai.picksDetail && ai.picksDetail[c.ticker];
      const oneLine = (d && d.oneLine) || (c.reasons || [])[0] || '';
      L.push(`| ${c.ticker} | ${c.strategy === 'perfect_storm' ? '⚡돌파' : '👨‍🏫눌림목'} | 상위 ${topPct(c.rsRank)}% | ${money(c.price)} | ${oneLine} |`);
    }
    L.push('');
    for (const c of picks.slice(0, 5)) {
      const d = ai.picksDetail && ai.picksDetail[c.ticker];
      const react = ctx.buzz && (ctx.buzz.reactions || []).find((r) => r.symbol === c.ticker);
      L.push(`### ${c.ticker} — ${c.sector} ${c.strategy === 'perfect_storm' ? '· ⚡돌파' : '· 👨‍🏫눌림목'}`);
      if (d && d.company) L.push(`> 🏢 ${d.company}`);
      L.push(`- **우리 시스템이 고른 이유**: ${(c.reasons || []).slice(0, 4).join(' · ')}`);
      if (d) {
        if (d.whyWatch) L.push(`- **📈 왜 주목하나 (쉽게)**: ${d.whyWatch}`);
        if (d.setup) L.push(`- **🎯 지금 차트·셋업**: ${d.setup}`);
        if (d.risks) L.push(`- **⚠️ 리스크·주의점**: ${d.risks}`);
        if (d.watchFor) L.push(`- **👀 지켜볼 것**: ${d.watchFor}`);
      } else if (ai.picksRationale && ai.picksRationale[c.ticker]) {
        L.push(`- **심화**: ${ai.picksRationale[c.ticker]}`);
      }
      if (react) L.push(`- **🛰️ 커뮤니티 반응(Nova)**: ${react.mood} · ${react.activity}`);
      L.push('');
    }
  }
  L.push('');

  // ②-b AI 검증단 심의 (heavy 모드)
  const v = ctx.verification;
  if (v) {
    L.push('## ⚖️ AI 검증단 심의 (heavy · Opus·Sonnet·Haiku)');
    L.push(`- **시장 판정**: ${v.market_ok ? '선별 진입 허용(neutral·invest_ok)' : '신규진입 부적합'} ${v.market_note ? '— ' + v.market_note : ''}`);
    L.push('');
    L.push('| 종목 | 폭발력(3모델) | 매수추천 | 팩트체크 | 악마의변호인 |');
    L.push('|------|------|------|------|------|');
    for (const s of v.scores) {
      L.push(`| ${s.ticker} | ${s.avg} | ${s.recommend} | ${s.fact || '—'} | ${s.veto ? '❌ 거부' : '관망'} |`);
    }
    L.push('');
    L.push(`- **최종 판정**: ${v.invest ? '진입' : '신규 0종목'} — ${v.note}`);
    if (v.top_watch) L.push(`- **👀 최우선 감시**: ${v.top_watch}`);
    L.push('');
  }

  // 🤝 코다리 부장 넘길 프롬프트 (자동 생성)
  if (picks.length) {
    L.push('## 🤝 코다리 부장에게 넘길 프롬프트');
    L.push('> 아래를 복사해 Antigravity의 코다리 부장에게 붙여넣으면 심층 분석을 받을 수 있어요.');
    L.push('');
    for (const c of picks.slice(0, 5)) {
      L.push('```');
      L.push(handoffPrompt(c, ctx));
      L.push('```');
      L.push('');
    }
  }

  // ③ Nova 커뮤니티
  L.push('## ③ 🛰️ 커뮤니티 (Nova · 참고용, 판단 관여 안 함)');
  const buzz = ctx.buzz;
  if (buzz && buzz.ok) {
    if ((buzz.reactions || []).length) {
      L.push('**우리 추천/보유 종목에 대한 커뮤니티 반응:**');
      for (const r of buzz.reactions) L.push(`- ${r.symbol}: ${r.mood} · ${r.activity} (관심 ${r.watchers ?? '?'}명)`);
      L.push('');
    }
    if (ai.buzzNarratives && ai.buzzNarratives.length) {
      L.push('**요즘 커뮤니티에서 많이 회자되는 종목 (왜/누가 주목):**');
      for (const n of ai.buzzNarratives) L.push(`- **${n.symbol}** — ${n.why}${n.mood ? ` (${n.mood})` : ''}`);
    } else if ((buzz.trending || []).length) {
      L.push(`**많이 거론:** ${buzz.trending.map((t) => t.symbol).join(', ')}`);
      L.push('- (각 종목이 "왜" 회자되는지는 AI 리서치와 함께 실행 시 제공)');
    }
  } else {
    L.push('- 커뮤니티 데이터 수신 실패');
  }
  L.push('- ⚠️ 커뮤니티 분위기는 참고용일 뿐, 매수 근거·추천 아님 (펌핑·고점 신호일 수 있음)');
  L.push('');

  // ④ 리스크·포트폴리오
  L.push('## ④ 리스크 · 포트폴리오');
  L.push(`- 총자산 ${money(s.equity)} · 누적 수익률 ${pct(s.total_return_pct)} · 현금 ${money(ctx.portfolio.cash)} · 보유 ${ctx.portfolio.holdings.length}종목`);
  L.push(`- 승/패 ${s.wins}/${s.losses} · MDD ${pct(s.max_drawdown)}`);
  L.push('- 규칙: 거래당 2% 리스크 · -7% 손절 · 단계적 익절(1/3)+20일선 트레일링');
  if (ctx.review) { L.push(''); L.push(`**전략 리뷰(Morgan):** ${ctx.review.headline}`); }
  L.push('');

  // 🚦 보유 종목 손절/익절 점검 + 🧬 전략 설명·변경이력
  if (strat) {
    for (const ln of holdingReview(ctx, strat)) L.push(ln);
    for (const ln of strategySection(strat, changelog)) L.push(ln);
  }

  // 📖 용어 풀이
  L.push('## 📖 용어 풀이 (어려운 말 쉽게)');
  for (const [t, d] of GLOSSARY) L.push(`- **${t}**: ${d}`);
  L.push('');
  L.push(`— 작성: AI 투자팀 (Alex·Nova·Sara·Jordan·Morgan·RICH) · 검증: Opus·Sonnet·Haiku 다중모델`);

  return L.join('\n');
}

function writeReport(ctx) {
  const md = buildReport(ctx);
  const file = path.join(paths.root, 'analysis', 'reports', `${ctx.dateStr}-briefing.md`);
  writeText(file, md);
  writeReportsIndex(); // 대시보드 리포트 탭용 인덱스 갱신
  return { md, file };
}

module.exports = { buildReport, writeReport, writeReportsIndex };
