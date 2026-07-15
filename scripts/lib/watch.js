'use strict';
// 감시 종목 — 실측 TA(야후 봉)로 진입 트리거(반등) 확인. 매 실행/가격갱신 시 상태 갱신.

const path = require('path');
const { readJson, writeText, paths, today } = require('./util');
const { chartRead } = require('./ta');

const WATCH = path.join(paths.root, 'portfolio', 'watchlist.json');

function load() { return readJson(WATCH, { tickers: [] }); }

// 각 감시 종목의 상태 판정: bounce(반등) / watching(관찰) / broke_down(이탈)
async function check() {
  const wl = load();
  const out = [];
  for (const w of wl.tickers || []) {
    let r = null;
    try { r = await chartRead(w.ticker); } catch (e) { /* skip */ }
    let status = 'watching', flag = '⏳ 관찰중(반등 미확인)';
    if (r && r.ok) {
      if (r.distMA50 != null && r.distMA50 < -5) { status = 'broke_down'; flag = '⚠️ 50일선 -5% 이탈 — 추세 붕괴 위험(감시 재검토)'; }
      else if (r.brokeResistance) { status = 'bounce'; flag = '🟢 진입 신호! 거래량 동반 저항 돌파'; }
      else if (r.aboveMA50 && r.trend === 'up') { status = 'recovering'; flag = `🟡 50일선 재장악(추세 up) — 단 저항 $${r.resistance} 돌파 대기`; }
    }
    out.push({ ...w, status, flag, ta: r && r.ok ? { price: r.price, ma50: r.ma50, distMA50: r.distMA50, resistance: r.resistance, brokeResistance: r.brokeResistance, trend: r.trend, summary: r.summary } : null });
  }
  return out;
}

async function checkAndWrite() {
  const results = await check();
  const file = path.join(path.dirname(paths.dashboardData), 'watchlist.js');
  writeText(file, 'window.WATCHLIST_DATA = ' + JSON.stringify({ generated: today(), items: results }, null, 2) + ';\n');
  return { file, results };
}

module.exports = { load, check, checkAndWrite };

if (require.main === module) {
  require('./util').loadEnv();
  check().then((rs) => rs.forEach((r) => console.log(`${r.ticker} [${r.status}] ${r.flag}\n   ${r.ta ? r.ta.summary : '-'}`)));
}
