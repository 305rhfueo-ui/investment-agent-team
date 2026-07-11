'use strict';
// 스크리너 후보 → 2단계 리스트(Tier1 돌파확인 / Tier2 관찰) + 차트링크 + 판독안내.
// 기계는 계량 후보까지, 최종 "저항선 거래량 돌파" 판정은 사람(차트 확인).

const { overheatStatus } = require('./leaders');

function chartUrl(ticker) {
  return `https://finviz.com/quote.ashx?t=${encodeURIComponent(ticker)}`;
}

function topPctStr(rsPct) {
  return rsPct == null ? '—' : (100 - Number(rsPct)).toFixed(1);
}

// 후보 1개를 표시용 객체로
function decorate(c, opts) {
  const oh = overheatStatus(c.raw || {}, opts);
  return {
    ticker: c.ticker,
    sector: c.sector,
    industry: c.industry,
    price: c.price,
    rsTop: topPctStr(c.rsRank),
    volx: c.volx,
    div50: c.div50,
    div10: c.div10,
    adr: c.adr,
    high52: c.high52,
    overheat: oh,
    chart: chartUrl(c.ticker),
    strategy: c.strategy,
    reasons: (c.reasons || []).slice(0, 3),
  };
}

// screenStocks 결과(allCandidates)를 2단계로 분류
// Tier1 = 돌파 신호(perfect_storm), Tier2 = 눌림목/관찰(eungbong)
function buildTiers(allCandidates, opts = {}) {
  const cap = opts.cap || 8;
  const t1 = [], t2 = [];
  for (const c of allCandidates || []) {
    const d = decorate(c, opts);
    if (c.strategy === 'perfect_storm') t1.push(d);
    else t2.push(d);
  }
  // 과열(200div +150↑)은 신규매수 주의 → 관찰로 강등 표시(별도 플래그)
  for (const d of t1) if (d.overheat.status === 'overheat') d.caution = '과열 — 신규 추격 주의';
  const sortRs = (a, b) => parseFloat(a.rsTop) - parseFloat(b.rsTop); // 상위%가 작을수록 강함
  t1.sort(sortRs); t2.sort(sortRs);
  return {
    tier1: { label: '🚀 돌파 확인 종목', note: '차트에서 "저항선을 강한 거래량과 함께 돌파"했는지 확인 후 매수', items: t1.slice(0, cap) },
    tier2: { label: '👀 관찰 종목', note: '아직 미돌파(눌림목)지만 RS 주도·실적 강함 → 돌파 시 매수 대기', items: t2.slice(0, cap) },
  };
}

module.exports = { buildTiers, decorate, chartUrl };
