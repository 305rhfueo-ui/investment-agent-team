'use strict';
// 1~2장 투자 브리핑 리포트 생성기.
// - 매 실행마다 결정론적(Node) 기본 리포트를 analysis/reports/ 에 저장
// - ctx.ai 가 주입되면(= 클로드와 함께 실행 시) 시황·유동성 심층/버즈 "왜"/추천 근거 심화까지 채움

const fs = require('fs');
const path = require('path');
const { paths, writeText, money, pct, topPct } = require('./lib/util');

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

function buildReport(ctx) {
  const ai = ctx.ai || {};
  const s = ctx.stats;
  const L = [];

  L.push(`# 📋 투자 브리핑 — ${ctx.dateStr}`);
  L.push('');
  L.push(`> 시장 ${lightKo(ctx.marketLight)} · 활성전략 v${ctx.strategyVersion} · 데이터 ${ctx.source} · ⚠️ 교육용 모의투자, 투자조언 아님`);
  L.push('');

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

  // ② 추천 종목 & 이유
  L.push('## ② 추천 종목 & 이유');
  const picks = ctx.candidates || [];
  if (picks.length === 0) {
    L.push('- 오늘은 추천 종목이 없습니다 (조건 미충족 또는 시장 부적합).');
  } else {
    L.push('| 종목 | 전략 | RS | 진입가 | 핵심 이유 |');
    L.push('|------|------|-----|--------|-----------|');
    for (const c of picks.slice(0, 3)) {
      L.push(`| ${c.ticker} | ${c.strategy === 'perfect_storm' ? '⚡돌파' : '👨‍🏫눌림목'} | 상위 ${topPct(c.rsRank)}% | ${money(c.price)} | ${(c.reasons || [])[0] || ''} |`);
    }
    L.push('');
    for (const c of picks.slice(0, 3)) {
      const why = ai.picksRationale && ai.picksRationale[c.ticker];
      L.push(`**${c.ticker}** (${c.sector})`);
      L.push(`- 근거: ${(c.reasons || []).slice(0, 4).join(' · ')}`);
      if (why) L.push(`- 심화: ${why}`);
    }
  }
  L.push('');

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
  L.push(`— 작성: AI 투자팀 (Alex·Nova·Sara·Jordan·Morgan·RICH)`);

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
