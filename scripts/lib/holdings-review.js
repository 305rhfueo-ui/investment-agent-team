'use strict';
// 실제 보유 종목을 RS 데이터와 대조 → 과열/재진입·RS 상태·계좌 규칙 기반 조언.
// 장기: 200div 과열 시 분할 차익 / 월봉10MA·넥라인은 사람 차트 확인.
// 정량으로 되는 것만 자동, 차트 판정은 "사람 확인" 플래그.

const { num, assignRsRank } = require('../screen-stocks');
const { overheatStatus } = require('./leaders');

function indexRows(rows) {
  const map = {};
  for (const r of rows) {
    const t = (r.Ticker || r.ticker || '').toUpperCase();
    if (t) map[t] = r;
  }
  return map;
}

function topPctStr(rsPct) {
  return rsPct == null ? null : (100 - Number(rsPct)).toFixed(1);
}

// account: 'long' | 'short' — 규칙이 다름
function reviewHolding(h, row, account, opts) {
  const out = { ticker: h.ticker, name: h.name, pnl_pct: h.pnl_pct, weight_pct: h.weight_pct, inUniverse: !!row };
  if (!row) {
    out.advice = '홀딩';
    out.note = 'RS 유니버스 밖 — 차트 직접 확인 필요';
    return out;
  }
  const oh = overheatStatus(row, opts);
  out.div200 = oh.div200;
  out.overheat = oh;
  out.rsTop = topPctStr(row.__rsPct);
  out.div50 = num(row['50DIV']);

  if (account === 'long') {
    if (oh.status === 'overheat') { out.advice = '⚠️ 분할 차익 검토'; out.note = `200div ${oh.label} — ${oh.note}`; }
    else if (oh.status === 'reentry' || oh.status === 'extreme') { out.advice = '🟢 재진입 관찰'; out.note = oh.note; }
    else { out.advice = '홀딩'; out.note = '월봉10MA·주봉 넥라인 이탈 여부는 차트 직접 확인'; }
    out.humanCheck = '월봉 10MA / 주봉 헤드앤숄더 넥라인';
  } else {
    // 단기: 돌파 이탈·손절 위주 (차트 확인)
    if (oh.status === 'overheat') { out.advice = '⚠️ 차익/트레일링'; out.note = oh.note; }
    else { out.advice = '홀딩(단기 규칙)'; out.note = '돌파 이탈·손절선 차트 확인'; }
    out.humanCheck = '10/20일선 이탈, 손절선';
  }
  return out;
}

// realSummary = real-accounts.summarize() 결과, rows = RS 데이터
function reviewAccounts(realSummary, rows, opts = {}) {
  assignRsRank(rows); // 유니버스 RS 백분위(__rsPct) 부여
  const idx = indexRows(rows);
  const out = {};
  for (const [key, acc] of Object.entries(realSummary.accounts || {})) {
    out[key] = {
      name: acc.name,
      holdings: (acc.holdings || []).map((h) => reviewHolding(h, idx[(h.ticker || '').toUpperCase()], key, opts)),
    };
  }
  return out;
}

module.exports = { reviewAccounts, reviewHolding };
