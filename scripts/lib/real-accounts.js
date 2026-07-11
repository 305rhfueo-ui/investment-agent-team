'use strict';
// 실제 2계좌(장기/단기) 로드·수익률·목표달성률 계산 + 매매 기록.
// 원화(KRW) 정본은 사용자 캡쳐 수치. 매수/매도 보고 시 갱신.

const path = require('path');
const { paths, readJson, writeJson, writeText, today } = require('./util');

function load() {
  return readJson(paths.realAccounts, null);
}
function save(data) {
  writeJson(paths.realAccounts, data);
}

function round(n, d = 0) {
  const p = Math.pow(10, d);
  return Math.round(Number(n) * p) / p;
}

// 계좌 하나의 요약(현재평가·손익·목표달성률)
function summarizeAccount(acc) {
  const holdings = acc.holdings || [];
  const holdEval = holdings.reduce((a, h) => a + (Number(h.eval_krw) || 0), 0);
  const holdBuy = holdings.reduce((a, h) => a + (Number(h.buy_krw) || 0), 0);
  const cash = Number(acc.cash_krw) || 0;
  const current = holdEval + cash;
  const investedPnl = holdEval - holdBuy; // 보유 종목 평가손익
  const target = Number(acc.target_krw) || 0;
  const baseline = Number(acc.baseline_krw) || current;
  return {
    name: acc.name,
    emoji: acc.emoji || '',
    current_krw: round(current),
    cash_krw: round(cash),
    holdings_eval_krw: round(holdEval),
    holdings_buy_krw: round(holdBuy),
    unrealized_pnl_krw: round(investedPnl),
    unrealized_pnl_pct: holdBuy > 0 ? round((investedPnl / holdBuy) * 100, 2) : 0,
    baseline_krw: round(baseline),
    since_baseline_pct: baseline > 0 ? round(((current - baseline) / baseline) * 100, 2) : 0,
    target_krw: target,
    progress_pct: target > 0 ? round((current / target) * 100, 1) : null,
    remaining_krw: round(Math.max(0, target - current)),
    holdings: holdings
      .slice()
      .sort((a, b) => (b.eval_krw || 0) - (a.eval_krw || 0))
      .map((h) => ({
        ...h,
        weight_pct: current > 0 ? round(((h.eval_krw || 0) / current) * 100, 1) : 0,
      })),
  };
}

// 전체 요약(장기+단기 각각 따로, 합산 아님)
function summarize(data) {
  const d = data || load();
  if (!d) return null;
  const out = { meta: d.meta, accounts: {} };
  for (const [key, acc] of Object.entries(d.accounts || {})) {
    out.accounts[key] = summarizeAccount(acc);
  }
  return out;
}

// 매수/매도 보고 기록. trade = {account:'long'|'short', action:'buy'|'sell', ticker, shares, krw, price_usd?, note?, date?}
function recordTrade(trade, data) {
  const d = data || load();
  if (!d) throw new Error('real-accounts.json 없음');
  const acc = d.accounts[trade.account];
  if (!acc) throw new Error('계좌 없음: ' + trade.account);
  const date = trade.date || today();
  d.trade_log = d.trade_log || [];
  d.trade_log.push({ date, ...trade });

  const holdings = acc.holdings || (acc.holdings = []);
  const idx = holdings.findIndex((h) => h.ticker === trade.ticker);
  if (trade.action === 'buy') {
    if (idx >= 0) {
      holdings[idx].shares += Number(trade.shares) || 0;
      holdings[idx].buy_krw = (Number(holdings[idx].buy_krw) || 0) + (Number(trade.krw) || 0);
    } else {
      holdings.push({ ticker: trade.ticker, name: trade.name || trade.ticker, shares: Number(trade.shares) || 0, buy_krw: Number(trade.krw) || 0, eval_krw: Number(trade.krw) || 0, pnl_pct: 0, entry_date: date });
    }
    acc.cash_krw = (Number(acc.cash_krw) || 0) - (Number(trade.krw) || 0);
  } else if (trade.action === 'sell') {
    if (idx >= 0) {
      const h = holdings[idx];
      const sellShares = Number(trade.shares) || h.shares;
      const frac = h.shares > 0 ? sellShares / h.shares : 1;
      h.buy_krw = round((Number(h.buy_krw) || 0) * (1 - frac));
      h.eval_krw = round((Number(h.eval_krw) || 0) * (1 - frac));
      h.shares -= sellShares;
      if (h.shares <= 0) holdings.splice(idx, 1);
    }
    acc.cash_krw = (Number(acc.cash_krw) || 0) + (Number(trade.krw) || 0);
  }
  save(d);
  return d;
}

// 대시보드용 데이터 파일 생성 (window.REAL_ACCOUNTS_DATA)
function writeDashboardData(data) {
  const summary = summarize(data);
  if (!summary) return null;
  summary.generated = today();
  const file = path.join(path.dirname(paths.dashboardData), 'real-accounts.js');
  writeText(file, 'window.REAL_ACCOUNTS_DATA = ' + JSON.stringify(summary, null, 2) + ';\n');
  return file;
}

module.exports = { load, save, summarize, summarizeAccount, recordTrade, writeDashboardData };
