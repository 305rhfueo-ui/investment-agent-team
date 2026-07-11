'use strict';
// heavy/light 브리핑 통합 — 시장국면 + 주도섹터/주도주 + 과열/재진입 + 2단계 후보 + 보유주 점검.
// 결과를 dashboard/data/briefing.js(window.BRIEFING_DATA)로 저장. (계량 파트, LLM 없음)

const path = require('path');
const { fetchRsData } = require('./fetch-rs-data');
const { screenStocks } = require('./screen-stocks');
const { classify } = require('./lib/market-regime');
const { leadingStocks, leadingSectors, marketOverheat } = require('./lib/leaders');
const { buildTiers } = require('./lib/candidates');
const ra = require('./lib/real-accounts');
const { reviewAccounts } = require('./lib/holdings-review');
const { writeText, paths, today, say } = require('./lib/util');

async function build() {
  const { rows, meta } = await fetchRsData();
  const regime = classify(meta && meta.market_condition, rows);
  const res = screenStocks(rows, null, { marketLight: regime.light });
  const realSummary = ra.summarize();

  const briefing = {
    generated: today(),
    market: regime,
    overheat: marketOverheat(rows),
    leading_sectors: leadingSectors(rows, { topN: 50, sectorN: 5, by: 'Sector' }),
    leading_stocks: leadingStocks(rows, 10),
    tiers: buildTiers(res.allCandidates, { cap: 6 }),
    holdings_review: realSummary ? reviewAccounts(realSummary, rows) : null,
    dropoff: res.dropoff,
  };

  const file = path.join(path.dirname(paths.dashboardData), 'briefing.js');
  writeText(file, 'window.BRIEFING_DATA = ' + JSON.stringify(briefing, null, 2) + ';\n');
  return { file, briefing };
}

module.exports = { build };

if (require.main === module) {
  require('./lib/util').loadEnv();
  build().then(({ file, briefing }) => {
    const b = briefing;
    console.log('\n════════ 📋 오늘의 브리핑 ════════');
    console.log(`🚦 시장국면: ${b.market.light.toUpperCase()} (${b.market.note})`);
    console.log(`🔥 과열: 200div +150↑ ${b.overheat.over150}개, 최대 ${b.overheat.max ? b.overheat.max.toFixed(0) : '-'}%`);
    console.log(`🏆 주도섹터: ${b.leading_sectors.map((s) => `${s.name}(${s.sharePct.toFixed(0)}%)`).join(', ')}`);
    console.log(`🎯 주도주: ${b.leading_stocks.slice(0, 6).map((s) => `${s.ticker}${s.overheat.status === 'overheat' ? '🔥' : ''}`).join(', ')}`);
    console.log(`🚀 돌파확인 후보: ${b.tiers.tier1.items.length}개 | 👀 관찰: ${b.tiers.tier2.items.length}개`);
    if (b.holdings_review && b.holdings_review.long) {
      const flags = b.holdings_review.long.holdings.filter((h) => h.advice && h.advice.includes('차익'));
      console.log(`💰 보유주 알림: ${flags.length ? flags.map((h) => `${h.ticker} ${h.advice}`).join(', ') : '전부 홀딩(과열/재진입 없음)'}`);
    }
    console.log(`\n저장: ${file}`);
  }).catch((e) => console.error('[build-briefing]', e.message));
}
