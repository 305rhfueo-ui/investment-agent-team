'use strict';
// 티커 현재가 조회 — Yahoo Finance chart 엔드포인트(무인증·키 불필요).
// RS 유니버스 밖 종목(IBM·TSLA 등) 가격 보완용. Node 18+ global fetch.

async function getPrice(ticker) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=1d`;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(url, { signal: controller.signal, headers: { 'User-Agent': 'Mozilla/5.0' } });
    clearTimeout(timer);
    if (!res.ok) return null;
    const j = await res.json();
    const meta = j && j.chart && j.chart.result && j.chart.result[0] && j.chart.result[0].meta;
    const p = meta && (meta.regularMarketPrice != null ? meta.regularMarketPrice : meta.previousClose);
    return typeof p === 'number' && isFinite(p) ? p : null;
  } catch (e) {
    return null;
  }
}

// 여러 티커 순차(레이트리밋 회피). 반환 {TICKER: price|null}
async function getPrices(tickers, { delayMs = 120 } = {}) {
  const out = {};
  for (const t of tickers) {
    const key = String(t).toUpperCase();
    out[key] = await getPrice(key);
    if (delayMs) await new Promise((r) => setTimeout(r, delayMs));
  }
  return out;
}

module.exports = { getPrice, getPrices };

if (require.main === module) {
  const tks = process.argv.slice(2).length ? process.argv.slice(2) : ['MU', 'TSLA', 'AAPL'];
  getPrices(tks).then((m) => console.log(JSON.stringify(m, null, 2)));
}
