'use strict';
// Alex(분석가)의 기업분석 생성 — 스냅샷 데이터 기반의 구조화된 분석 텍스트

const { topPct } = require('./lib/util');

function grade(v, good, ok) {
  if (v === null || v === undefined) return '—';
  if (v >= good) return '강함 💪';
  if (v >= ok) return '양호 👍';
  return '주의 ⚠️';
}

function rnd(v, d = 2) {
  return (v === null || v === undefined || v === '') ? '—' : Number(v).toFixed(d);
}

// 후보 1종목의 기업분석 마크다운
function companyAnalysis(c) {
  const r = c.raw || {};
  const lines = [];
  lines.push(`### ${c.ticker} — ${c.sector}${c.industry ? ' / ' + c.industry : ''}`);
  lines.push('');
  lines.push(`- **현재가**: $${c.price}  |  **시총**: ${r['Market Cap'] || '—'}  |  **진입 전략**: ${c.strategy === 'perfect_storm' ? '⚡ Perfect Storm 돌파' : '👨‍🏫 응봉아재 눌림목'}`);
  lines.push('');
  lines.push('**상대강도 (RS)**');
  lines.push(`- 6개월 ${rnd(r.RS_6mo)} / 3개월 ${rnd(r.RS_3mo)} / 1개월 ${rnd(r.RS_1mo)}  → RS 순위 상위 ${topPct(c.rsRank)}% (${grade(c.rsRank, 90, 70)})`);
  const rsAccel = (r.RS_3mo ?? 0) > (r.RS_6mo ?? 0);
  lines.push(`- 모멘텀 가속: ${rsAccel ? '예 (3M RS > 6M RS) — 힘이 붙는 중 🚀' : '보통'}`);
  lines.push('');
  lines.push('**추세·위치**');
  lines.push(`- 정배열(20>60>120): ${String(r['Jungjanggi Jeongbaeyeol']).toUpperCase() === 'YES' ? '✅ 정배열' : '❌'}`);
  lines.push(`- 52주 신고가 대비: ${c.high52}% (${grade(c.high52, 90, 80)})`);
  lines.push(`- 50일 이격도: ${c.div50}% ${c.div50 <= 30 ? '(과열 아님 ✅)' : '(과열 주의 ⚠️)'}  |  10일 이격: ${c.div10}%`);
  lines.push(`- ADR(일 변동폭): ${c.adr}% (${grade(c.adr, 4.5, 3.5)}) — 폭발력 지표`);
  lines.push('');
  lines.push('**진입 신호**');
  if (c.strategy === 'perfect_storm') {
    lines.push(`- 60일 신고가 돌파: ${String(r.BRK_60D).toUpperCase() === 'YES' ? '✅' : '❌'}  |  거래량 ${c.volx}배  |  종가강도 ${c.clsPos}`);
  } else {
    lines.push(`- 눌림목 진입권(10DIV ${c.div10}%) + 실적 개선 추세`);
  }
  lines.push('');
  lines.push('**실적/펀더멘털**');
  lines.push(`- 올해 실적 추세(CY_Trend): ${c.cyTrend ?? '—'}  /  내년(NY_Trend): ${c.nyTrend ?? '—'}`);
  lines.push(`- EPS(CY/NY): ${r.EPS_CY ?? '—'} / ${r.EPS_NY ?? '—'}  |  매출(CY/NY): ${r.SALE_CY ?? '—'} / ${r.SALE_NY ?? '—'}`);
  lines.push(`- 애널리스트 up/down 비율: ${r.Up_Down_Ratio ?? '—'} (${grade(r.Up_Down_Ratio, 0.85, 0.8)})`);
  lines.push('');
  lines.push('**선정 근거 요약**');
  for (const reason of c.reasons) lines.push(`- ${reason}`);
  lines.push('');
  lines.push('**리스크**');
  lines.push(`- 손절: 진입가 -7% (${c.price ? '$' + (c.price * 0.93).toFixed(2) : '—'})  |  ${c.div50 > 30 ? '이격 과열 → 눌림 후 진입 권장' : '이격 정상권'}`);
  lines.push('');
  return lines.join('\n');
}

module.exports = { companyAnalysis };
