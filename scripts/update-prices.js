'use strict';
// 매일 자동(경량, 클라우드, LLM 없음) — 실제 계좌 보유 종목 현재가만 갱신 → 수익률 트래킹.
// 신규 스크리닝·검증단·추천 없음. 캡쳐/보고 없으면 "거래 없음" 간주하고 가격만 갱신.
// 첫 실행은 last_price_usd 앵커링(평가액 유지), 이후 실행은 가격 변동 비율로 평가액 스케일.

const { loadEnv, today, say } = require('./lib/util');
const ra = require('./lib/real-accounts');
const { getPrices } = require('./lib/fetch-prices');

async function run() {
  loadEnv();
  const data = ra.load();
  if (!data) { console.log('real-accounts.json 없음 — 스킵'); return; }

  const tickers = new Set();
  for (const acc of Object.values(data.accounts || {})) {
    for (const h of acc.holdings || []) tickers.add(String(h.ticker).toUpperCase());
  }
  if (!tickers.size) { console.log('보유 종목 없음 — 대시보드만 갱신'); ra.writeDashboardData(data); return; }

  say('Jordan', `현재가 조회 ${tickers.size}종목...`);
  const prices = await getPrices([...tickers]);

  let scaled = 0, anchored = 0, missing = 0;
  for (const acc of Object.values(data.accounts || {})) {
    for (const h of acc.holdings || []) {
      const cur = prices[String(h.ticker).toUpperCase()];
      if (cur == null) { missing++; continue; }
      if (h.last_price_usd && h.last_price_usd > 0) {
        h.eval_krw = Math.round((Number(h.eval_krw) || 0) * (cur / h.last_price_usd));
        scaled++;
      } else {
        anchored++; // 첫 실행: 평가액 유지, 가격만 앵커
      }
      h.last_price_usd = cur;
      h.pnl_pct = (Number(h.buy_krw) || 0) > 0
        ? Math.round(((h.eval_krw - h.buy_krw) / h.buy_krw) * 10000) / 100 : 0;
    }
  }
  data.meta = data.meta || {};
  data.meta.last_price_update = today();
  ra.save(data);
  const file = ra.writeDashboardData(data);
  say('Jordan', `가격 갱신: 스케일 ${scaled} · 앵커 ${anchored} · 실패 ${missing} → ${file}`);
}

module.exports = { run };

if (require.main === module) {
  run().catch((e) => { console.error('[update-prices]', e.message); process.exit(0); });
}
