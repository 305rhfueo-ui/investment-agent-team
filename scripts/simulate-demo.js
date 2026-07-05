'use strict';
// 데모 시뮬레이션: 실제 종목으로 며칠간의 가상 시세를 돌려 매수/1차익절/트레일링/손절(부검)
// UI를 모두 채운다. ⚠️ 시뮬레이션임을 명확히 표기하며 performance.json 을 덮어쓴다.
// 실제 매매를 시작하려면: rm portfolio/performance.json  (또는 npm run start-investment)

const { loadEnv, say, pct } = require('./lib/util');
const { fetchRsData } = require('./fetch-rs-data');
const { screenStocks, loadStrategy } = require('./screen-stocks');
const { scanBuzz } = require('./community-buzz');
const P = require('./calculate-portfolio');
const { recordRun, writeHistory } = require('./build-history');
const { writeTimeline } = require('./build-minimi-run');

function addDays(dateStr, n) {
  // 로컬 시간 기준으로 계산 (toISOString 은 UTC 로 변환돼 시간대별 off-by-one 발생)
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + n);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// 종목별 진입 이후 일자별 누적 수익률(%) 경로 — 다양한 결말을 연출
const PATHS = {
  0: [5, 12, 21, 26, 18, 10, 3],      // tier1 후 트레일링(승, 소폭)
  1: [8, 15, 12, 6, -2, -5, -7],      // 상승 실패 후 -7% 손절(손실+부검)
  2: [-3, -6, -8, -8, -8, -8, -8],    // 초반 급락 -8% 손절(손실+부검)
  3: [4, 7, 5, 3, 2, 1, 0],           // 50일선 이탈로 이익 실현(승, 소폭)
  4: [3, 6, 10, 14, 18, 23, 27],      // 계속 상승, tier1 후 보유 유지(미실현 승)
};
const DAYS = 7;

async function main() {
  loadEnv();
  const strategy = loadStrategy();
  const startDate = process.env.RUN_DATE || '2026-07-05';
  say('SYSTEM', '⚠️ 데모 시뮬레이션 시작 (가상 시세). 실제 매매 아님.');

  const { rows } = await fetchRsData();
  const buzz = await scanBuzz(rows);
  const p = P.initPortfolio(100000);
  p.meta.start_date = startDate;

  // Day 1: 실제 후보로 진입
  const { candidates, marketLight } = screenStocks(rows, strategy);
  const opened = P.openPositions(p, candidates, strategy, startDate, marketLight);
  const entryPrices = {};
  opened.forEach((h) => { entryPrices[h.symbol] = h.entry_price; });
  const symbols = opened.map((h) => h.symbol);
  let stats = P.computeStats(p, startDate);
  p.meta.run_count = 1;
  recordRun(p, { dateStr: startDate, marketLight, strategyVersion: strategy.version, stats, opened, updateEvents: [], candidates, portfolio: p });

  // Day 2..N: 가상 시세로 갱신
  for (let day = 1; day <= DAYS; day++) {
    const dateStr = addDays(startDate, day);
    const lookup = {};
    symbols.forEach((sym, i) => {
      const path = PATHS[i] || [0, 0, 0, 0, 0, 0, 0];
      const p2 = path[day - 1] != null ? path[day - 1] : path[path.length - 1];
      const price = +(entryPrices[sym] * (1 + p2 / 100)).toFixed(2);
      // VCYT(index 3): day5부터 50일선 이탈 연출
      const div50 = (i === 3 && day >= 5) ? -2 : 12;
      lookup[sym] = { price, div50 };
    });
    const events = P.updateHoldings(p, lookup, strategy, dateStr);
    stats = P.computeStats(p, dateStr);
    p.meta.run_count += 1;
    recordRun(p, { dateStr, marketLight: 'green', strategyVersion: strategy.version, stats, opened: [], updateEvents: events, candidates: [], portfolio: p });
  }

  // 마지막 날 미니룸 타임라인 (관람용)
  const lastDate = addDays(startDate, DAYS);
  writeTimeline({
    dateStr: lastDate + ' (데모)', source: 'simulation', marketLight: 'green',
    strategyVersion: strategy.version, rowCount: rows.length,
    candidates: [], opened: [], updateEvents: [], buzz,
    stats, portfolio: p, review: null,
  });
  writeHistory(p);
  P.save(p);

  say('SYSTEM', `데모 완료 · 최종 누적수익률 ${pct(stats.total_return_pct)} · 승 ${stats.wins}/패 ${stats.losses}`);
  say('SYSTEM', '실제 매매를 시작하려면: rm portfolio/performance.json  후  npm run start-investment');
}

main().catch((e) => { console.error(e); process.exit(1); });
