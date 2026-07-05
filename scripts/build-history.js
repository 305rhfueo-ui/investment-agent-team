'use strict';
// 일자별 실행 기록 누적 + 대시보드용 history.js 생성 (수익률 추이/일자별 매수·청산/추천 이력)

const path = require('path');
const { paths, writeText, topPct } = require('./lib/util');
const { companyAnalysis } = require('./analyze-company');

const MAX_RUNS = 90; // history.js 크기 상한 (최근 90회)

// performance.json 에 run_log / equity_history 를 날짜 기준으로 누적(같은 날은 갱신)
function recordRun(p, ctx) {
  p.run_log = p.run_log || [];
  p.equity_history = p.equity_history || [];

  const setupOf = (c) => (c.reasons || []).find((r) => /돌파|눌림목|거래량|종가강도|정배열/.test(r)) || (c.reasons || [])[1] || (c.reasons || [])[0] || '';

  const entry = {
    date: ctx.dateStr,
    market_light: ctx.marketLight,
    strategy_version: ctx.strategyVersion,
    equity: ctx.stats.equity,
    return_pct: ctx.stats.total_return_pct,
    cash: p.cash,
    holdings_count: p.holdings.length,
    opened: ctx.opened.map((h) => ({
      symbol: h.symbol, entry: h.entry_price, qty: h.quantity,
      stop: h.stop_loss, strategy: h.strategy, reason: (h.reasons || [])[0] || '',
    })),
    events: ctx.updateEvents
      .filter((e) => e.type === 'tier1' || e.type === 'close')
      .map((e) => ({
        type: e.type, symbol: e.symbol, price: e.price, realized: e.realized,
        reason: e.reason || (e.type === 'tier1' ? '1차익절' : ''),
        lesson: e.lesson || null, note: e.note || null, rpct: e.rpct,
      })),
    recommendations: ctx.candidates.map((c) => ({
      symbol: c.ticker, strategy: c.strategy, top_pct: topPct(c.rsRank),
      price: c.price, reason: setupOf(c), analysis: companyAnalysis(c),
    })),
  };

  const replaceByDate = (arr, item) => {
    const i = arr.findIndex((x) => x.date === item.date);
    if (i >= 0) arr[i] = item; else arr.push(item);
  };
  replaceByDate(p.run_log, entry);
  replaceByDate(p.equity_history, { date: ctx.dateStr, equity: ctx.stats.equity, return_pct: ctx.stats.total_return_pct });

  // 날짜순 정렬 + 상한
  p.run_log.sort((a, b) => a.date.localeCompare(b.date));
  p.equity_history.sort((a, b) => a.date.localeCompare(b.date));
  if (p.run_log.length > MAX_RUNS) p.run_log = p.run_log.slice(-MAX_RUNS);
  return entry;
}

function writeHistory(p) {
  const data = {
    initial_capital: p.meta.initial_capital,
    equity_history: p.equity_history || [],
    runs: p.run_log || [],
    closed_trades: p.closed_trades || [],
    monthly: p.monthly_summary || {},
    holdings: (p.holdings || []).map((h) => ({
      symbol: h.symbol, qty: h.quantity, entry: h.entry_price, current: h.current_price,
      pnl_pct: h.unrealized_pnl_pct, stop: h.stop_loss, strategy: h.strategy,
      tier1: h.tier1_taken, date: h.entry_date,
    })),
  };
  const jsPath = path.join(path.dirname(paths.dashboardData), 'history.js');
  writeText(jsPath, 'window.HISTORY_DATA = ' + JSON.stringify(data, null, 2) + ';\n');
  return data;
}

module.exports = { recordRun, writeHistory };
