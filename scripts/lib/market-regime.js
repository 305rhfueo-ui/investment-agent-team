'use strict';
// 시장 국면 판정 — 사이트 market_condition(정본) + 유니버스 breadth 근사.
// 기존 MARKET_LIGHT=green 하드코딩 버그를 실데이터로 교체.

function num(v) {
  if (v === null || v === undefined || v === '') return null;
  const n = parseFloat(String(v).replace(/[%,]/g, ''));
  return Number.isFinite(n) ? n : null;
}

// marketCondition: 사이트 raw.market_condition (예: "BAD"/"GOOD"/"NEUTRAL"...)
// rows: RS 종목 배열(breadth 계산). 반환 { light, invest_ok, market_condition, breadth_pct, note }
function classify(marketCondition, rows = []) {
  const mc = String(marketCondition == null ? '' : marketCondition).toUpperCase();
  let light = 'yellow';
  if (/BAD|WEAK|RISK.?OFF|BEAR|DANGER|CAUTION|위험|약세|RED/.test(mc)) light = 'red';
  else if (/GOOD|STRONG|BULL|RISK.?ON|HEALTHY|안전|강세|GREEN/.test(mc)) light = 'green';

  // breadth: 200일선 위(200div>0) 종목 비율
  const d200 = rows.map((r) => num(r['200DIV'])).filter((v) => v != null);
  const breadth = d200.length ? d200.filter((v) => v > 0).length / d200.length : null;
  const breadthPct = breadth != null ? Math.round(breadth * 1000) / 10 : null;

  // breadth 보정: market_condition이 애매(yellow)할 때 breadth로 보강
  if (light === 'yellow' && breadthPct != null) {
    if (breadthPct >= 60) light = 'green';
    else if (breadthPct < 40) light = 'red';
  }

  return {
    light,
    invest_ok: light !== 'red',
    market_condition: marketCondition == null ? 'unknown' : marketCondition,
    breadth_pct: breadthPct,
    note: `사이트 market_condition=${marketCondition == null ? 'N/A' : marketCondition}` +
      (breadthPct != null ? ` · 200일선 위 ${breadthPct}%` : '') +
      (light === 'red' ? ' → 신규 진입 주의(현금 보존)' : ''),
  };
}

module.exports = { classify };
