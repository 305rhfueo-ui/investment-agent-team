'use strict';
// 주도주·주도섹터·과열/재진입 계산 (aiinvestmentworkbook.tistory.com/6 방법 근거)
// 주의: 사이트의 RS_Rank_Pct·WRS Final_WRS_Rank_Pct 는 노이즈라, 우리 RS 합성으로 직접 랭킹.

const { num, rsComposite, assignRsRank } = require('../screen-stocks');

function div200Of(row) {
  return num(row['200DIV']);
}

// 과열/재진입 상태 판정 (200div 기준, tistory 방법)
// opts: { overheat=150, reentry=-20, extreme=-30, highVolOverheat=125 }
function overheatStatus(row, opts = {}) {
  const d = div200Of(row);
  const OVER = opts.overheat != null ? opts.overheat : 150;
  const WATCH = opts.reentry != null ? opts.reentry : -20;
  const EXTREME = opts.extreme != null ? opts.extreme : -30;
  if (d == null) return { status: 'unknown', label: '–', div200: null };
  if (d <= EXTREME) return { status: 'extreme', label: `🔻극단(${d.toFixed(0)}%)`, div200: d, note: '−30%↓: 매수강도↑ 단 개별악재/주도주 탈락 여부 점검' };
  if (d <= WATCH) return { status: 'reentry', label: `🟢재진입 관찰(${d.toFixed(0)}%)`, div200: d, note: '하락 멈춤 + RS 회복 확인 후 분할매수' };
  if (d >= OVER) return { status: 'overheat', label: `🔥과열(+${d.toFixed(0)}%)`, div200: d, note: '분할 차익검토(유동성 −면 최대 1/2·신규중단, +면 1/3+트레일링). 전량매도 금지' };
  return { status: 'normal', label: `정상(${d.toFixed(0)}%)`, div200: d };
}

// RS 최상위 주도 종목 N개
function leadingStocks(rows, n = 10, opts = {}) {
  assignRsRank(rows);
  return [...rows]
    .filter((r) => r.__rsPct != null && (r.Ticker || r.ticker))
    .sort((a, b) => b.__rsPct - a.__rsPct)
    .slice(0, n)
    .map((r) => ({
      ticker: r.Ticker || r.ticker,
      sector: r.Sector || '',
      industry: r.Industry || '',
      rsPct: r.__rsPct,
      price: num(r.Price),
      div200: div200Of(r),
      overheat: overheatStatus(r, opts),
    }));
}

// 주도 섹터 = RS 최상위 종목들이 어느 섹터/업종에 몰렸나로 집계 (WRS 랭킹 노이즈 회피)
// by: 'Industry' | 'Sector'
function leadingSectors(rows, { topN = 50, sectorN = 5, by = 'Sector' } = {}) {
  assignRsRank(rows);
  const top = [...rows]
    .filter((r) => r.__rsPct != null && (r.Ticker || r.ticker))
    .sort((a, b) => b.__rsPct - a.__rsPct)
    .slice(0, topN);
  const buckets = {};
  for (const r of top) {
    const key = r[by] || r.Sector || '기타';
    if (!buckets[key]) buckets[key] = { name: key, count: 0, tickers: [] };
    buckets[key].count++;
    if (buckets[key].tickers.length < 6) buckets[key].tickers.push(r.Ticker || r.ticker);
  }
  return Object.values(buckets)
    .map((b) => ({ ...b, sharePct: (b.count / top.length) * 100 }))
    .sort((a, b) => b.count - a.count)
    .slice(0, sectorN);
}

// 유니버스 과열도 요약 (몇 종목이 +150%/+100% 이상인지 → 시장 과열 신호)
function marketOverheat(rows, opts = {}) {
  const OVER = opts.overheat != null ? opts.overheat : 150;
  const ds = rows.map(div200Of).filter((v) => v != null);
  const over = ds.filter((v) => v >= OVER).length;
  const over100 = ds.filter((v) => v >= 100).length;
  const max = ds.length ? Math.max(...ds) : null;
  return { count: ds.length, over150: over, over100, max };
}

module.exports = { overheatStatus, leadingStocks, leadingSectors, marketOverheat, div200Of };
