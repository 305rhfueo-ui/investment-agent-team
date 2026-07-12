'use strict';
// ═══════════════════════════════════════════════════════════
//  START INVESTMENT — AI 투자팀 메인 오케스트레이터
//  Alex → Sara → Jordan → Morgan → 미니룸 → RICH(Telegram) → GitHub
// ═══════════════════════════════════════════════════════════

const path = require('path');
const { paths, loadEnv, readJson, writeText, today, money, pct, topPct, say } = require('./lib/util');
const { fetchRsData } = require('./fetch-rs-data');
const { screenStocks, loadStrategy } = require('./screen-stocks');
const { scanBuzz } = require('./community-buzz');
const portfolioLib = require('./calculate-portfolio');
const { companyAnalysis } = require('./analyze-company');
const { maybeReview } = require('./strategy-review');
const { writeTimeline } = require('./build-minimi-run');
const { recordRun, writeHistory } = require('./build-history');
const { writeReport } = require('./build-report');
const { sendReport } = require('./telegram-reporter');
const { openRoom } = require('./open-room');
const { commitAndPush } = require('./update-github');
const { classify } = require('./lib/market-regime');
const realAccounts = require('./lib/real-accounts');
const briefing = require('./build-briefing');

function num(v) { const n = parseFloat(v); return Number.isFinite(n) ? n : null; }

function priceLookupFrom(rows) {
  const map = {};
  for (const r of rows) {
    const tk = r.Ticker || r.ticker;
    if (tk) map[tk] = { price: num(r.Price), div50: num(r['50DIV']) };
  }
  return map;
}

function writeJournal(dateStr, ctx) {
  const L = [];
  L.push(`# 매매일지 — ${dateStr}`);
  L.push('');
  L.push(`- 시장 신호등: ${ctx.marketLight === 'green' ? '🟢' : ctx.marketLight === 'yellow' ? '🟡' : '🔴'} ${ctx.marketLight}`);
  L.push(`- 활성 전략: v${ctx.strategyVersion}  |  데이터 소스: ${ctx.source}`);
  L.push('');
  L.push('## 오늘의 진입');
  if (ctx.opened.length === 0) L.push('- (없음)');
  for (const h of ctx.opened) {
    L.push(`- **${h.symbol}** [${h.strategy}] ${h.quantity}주 @ ${money(h.entry_price)} · 손절 ${money(h.stop_loss)}`);
    L.push(`  - 근거: ${h.reasons.slice(0, 3).join(', ')}`);
  }
  L.push('');
  L.push('## 포지션 변동 (익절/청산)');
  const evs = ctx.updateEvents.filter((e) => e.type === 'tier1' || e.type === 'close');
  if (evs.length === 0) L.push('- (없음)');
  for (const e of evs) {
    if (e.type === 'tier1') L.push(`- ${e.symbol} 1차 익절 ${e.qty}주 @ ${money(e.price)} (실현 ${money(e.realized)})`);
    else L.push(`- ${e.symbol} 청산 @ ${money(e.price)} (${e.reason}, 실현 ${money(e.realized)})`);
  }
  L.push('');
  L.push('## 포트폴리오 상태');
  L.push(`- 총자산: ${money(ctx.stats.equity)} · 누적 수익률: ${pct(ctx.stats.total_return_pct)}`);
  L.push(`- 현금: ${money(ctx.portfolio.cash)} · 보유 ${ctx.portfolio.holdings.length}종목`);
  L.push(`- 승/패: ${ctx.stats.wins}/${ctx.stats.losses} · MDD: ${pct(ctx.stats.max_drawdown)}`);
  L.push('');
  if (ctx.portfolio.holdings.length) {
    L.push('### 현재 보유');
    L.push('| 종목 | 수량 | 진입가 | 현재가 | 손익% | 손절 |');
    L.push('|------|------|--------|--------|-------|------|');
    for (const h of ctx.portfolio.holdings) {
      L.push(`| ${h.symbol} | ${h.quantity} | ${money(h.entry_price)} | ${money(h.current_price)} | ${pct(h.unrealized_pnl_pct)} | ${money(h.stop_loss)} |`);
    }
    L.push('');
  }
  if (ctx.buzz && ctx.buzz.ok) {
    L.push('## 🛰️ 커뮤니티 참고 (Nova · 판단엔 관여 안 함)');
    if (ctx.buzz.reactions && ctx.buzz.reactions.length) {
      L.push('**우리 추천/보유 종목에 대한 커뮤니티 반응:**');
      for (const r of ctx.buzz.reactions) L.push(`- ${r.symbol}: ${r.mood} · ${r.activity} · 관심 ${r.watchers ?? '?'}명`);
    }
    if (ctx.buzz.trending && ctx.buzz.trending.length) {
      L.push(`- 요즘 커뮤니티에서 많이 거론: ${ctx.buzz.trending.map((t) => t.symbol).join(', ')}`);
    }
    L.push('- ⚠️ 참고용 — 커뮤니티 분위기일 뿐 매수 근거 아님');
    L.push('');
  }
  if (ctx.review) {
    L.push('## 전략 리뷰 (Morgan)');
    L.push(ctx.review.headline);
    for (const c of ctx.review.changes) L.push(`- ${c}`);
    L.push('');
  }
  writeText(path.join(paths.journalDir, `${dateStr}.md`), L.join('\n'));
}

function writeRecommendation(dateStr, ctx) {
  const L = [];
  L.push(`# 종목 추천 & 기업분석 — ${dateStr}`);
  L.push('');
  L.push(`> 활성 전략 v${ctx.strategyVersion} 기준 · 시장 ${ctx.marketLight} · ⚠️ 교육용 모의투자, 투자조언 아님`);
  L.push('');
  if (ctx.candidates.length === 0) {
    L.push('오늘은 조건을 만족하는 추천 종목이 없습니다.');
  } else {
    L.push(`## 추천 요약 (${ctx.candidates.length}종목)`);
    L.push('| 종목 | 전략 | RS순위 | 진입가 | 근거 |');
    L.push('|------|------|--------|--------|------|');
    for (const c of ctx.candidates) {
      L.push(`| ${c.ticker} | ${c.strategy === 'perfect_storm' ? '⚡돌파' : '👨‍🏫눌림목'} | 상위 ${topPct(c.rsRank)}% | ${money(c.price)} | ${c.reasons[0]} |`);
    }
    L.push('');
    L.push('## 개별 기업분석');
    L.push('');
    for (const c of ctx.candidates) {
      L.push(companyAnalysis(c));
      L.push('---');
      L.push('');
    }
  }
  writeText(path.join(paths.recDir, `${dateStr}-recommendation.md`), L.join('\n'));
}

async function main() {
  loadEnv();
  const dateStr = process.env.RUN_DATE || today();
  console.log('\n═══════════════════════════════════════════');
  say('SYSTEM', `START INVESTMENT — ${dateStr} 🚀`);
  console.log('═══════════════════════════════════════════\n');

  // 0) 전략 로드
  const strategy = loadStrategy();
  if (!strategy) { say('SYSTEM', 'active-strategy.json 없음 → 중단'); process.exit(0); }
  const strategyVersion = strategy.version;
  say('Alex', `활성 전략 v${strategyVersion} 로드`);

  // 1) 데이터 수집
  const { rows, source, meta } = await fetchRsData();
  const priceLookup = priceLookupFrom(rows);
  // 시장국면: 사이트 market_condition(정본) 실데이터 — 가짜 green 하드코딩 대체
  const regime = classify(meta && meta.market_condition, rows);
  say('Alex', `시장국면 ${regime.light.toUpperCase()} — ${regime.note}`);

  // 2) 포트폴리오 로드/초기화
  const p = portfolioLib.loadPortfolio(process.env.INITIAL_CAPITAL || 100000);
  if (!p.meta.start_date) p.meta.start_date = dateStr;
  p.meta.last_run = dateStr;
  p.meta.run_count = (p.meta.run_count || 0) + 1;

  // 3) 기존 보유 갱신 + 트레일링/청산 (Jordan)
  say('Jordan', '기존 보유 종목 시세 갱신 및 트레일링 점검…');
  const updateEvents = portfolioLib.updateHoldings(p, priceLookup, strategy, dateStr);

  // 4) 스크리닝 (Alex) — 실데이터 시장국면 주입(green 버그 대체)
  const { candidates, marketLight } = screenStocks(rows, strategy, { marketLight: regime.light });

  // 4-1) 커뮤니티 스캔 (Nova) — 일반 버즈 + 우리 추천/보유 종목 반응 (참고용)
  say('Nova', '미국 투자 커뮤니티 스캔 중… 🛰️');
  const pickTickers = [...candidates.map((c) => c.ticker), ...p.holdings.map((h) => h.symbol)];
  const buzz = await scanBuzz(rows, pickTickers);

  // 5) 신규 진입 (Sara 사이징 → Jordan 기록). 빨강불이면 진입 안 함.
  let opened = [];
  if (marketLight !== 'red') {
    opened = portfolioLib.openPositions(p, candidates, strategy, dateStr, marketLight);
  } else {
    say('Sara', '🔴 빨강불 → 신규 진입 보류, 현금 보존');
  }

  // 6) 통계 계산
  const stats = portfolioLib.computeStats(p, dateStr);

  // 7) 전략 리뷰 (Morgan) — 주기 도래 시
  say('Morgan', '매매일지 검토 중…');
  const review = maybeReview(p, strategy, dateStr);

  // 컨텍스트
  const ctx = {
    dateStr, source, marketLight, strategyVersion,
    rowCount: rows.length, candidates, opened, updateEvents,
    stats, portfolio: p, review, buzz,
    dashboardUrl: process.env.DASHBOARD_URL || '',
  };

  // 8) 문서 작성 (매매일지 + 추천 + 1~2장 투자 브리핑 리포트)
  writeJournal(dateStr, ctx);
  writeRecommendation(dateStr, ctx);
  const rep = writeReport(ctx);
  say('SYSTEM', `투자 브리핑 리포트 생성: ${rep.file.split(/[\\/]/).slice(-3).join('/')}`);

  // 9) 미니룸 대화 스크립트 + 일자별 히스토리 생성
  writeTimeline(ctx);
  recordRun(p, ctx);
  writeHistory(p);

  // 9-1) 통합 브리핑(시장국면·주도주·과열·2단계후보·보유주점검) + 실제 계좌 대시보드 데이터
  try {
    await briefing.build();
    realAccounts.writeDashboardData();
    say('Alex', '📋 브리핑 + 💼 실제 계좌 대시보드 데이터 생성 완료');
  } catch (e) {
    say('SYSTEM', `브리핑 생성 경고: ${e.message}`);
  }

  // 10) 저장
  portfolioLib.save(p);
  say('SYSTEM', `포트폴리오 저장 완료 · 누적 ${pct(stats.total_return_pct)}`);

  // 11) 미니룸 오픈
  if (!process.env.NO_OPEN) openRoom();

  // 12) Telegram 보고 (RICH)
  await sendReport(ctx);

  // 13) GitHub 커밋
  const summary = `추천 ${opened.length} · 누적 ${pct(stats.total_return_pct)}`;
  if (!process.env.NO_GIT) commitAndPush(dateStr, summary);

  console.log('\n═══════════════════════════════════════════');
  say('RICH', `오늘의 미션 완료! 누적 수익률 ${pct(stats.total_return_pct)} · 목표까지 함께 달립시다 💪👑`);
  console.log('═══════════════════════════════════════════\n');
}

main().catch((e) => {
  console.error('실행 오류:', e);
  process.exit(1);
});
