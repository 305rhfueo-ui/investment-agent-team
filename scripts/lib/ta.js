'use strict';
// 기술적 분석(TA) — 야후 파이낸스 과거 OHLCV 봉으로 실제 이동평균·저항·돌파·수축 계산.
// RS 스냅샷엔 없는 "진짜 50일선/돌파" 확인용. 순수 Node(무LLM), 무인증·무료.

// ── 야후 봉 수집 ──
async function fetchBars(ticker, { range = '1y', interval = '1d' } = {}) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=${interval}&range=${range}`;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    const res = await fetch(url, { signal: controller.signal, headers: { 'User-Agent': 'Mozilla/5.0' } });
    clearTimeout(timer);
    if (!res.ok) return { bars: [], meta: null };
    const j = await res.json();
    const r = j && j.chart && j.chart.result && j.chart.result[0];
    if (!r) return { bars: [], meta: null };
    const ts = r.timestamp || [];
    const q = (r.indicators && r.indicators.quote && r.indicators.quote[0]) || {};
    const bars = [];
    for (let i = 0; i < ts.length; i++) {
      const o = q.open && q.open[i], h = q.high && q.high[i], l = q.low && q.low[i], c = q.close && q.close[i], v = q.volume && q.volume[i];
      if (c == null || !isFinite(c)) continue;
      bars.push({ t: ts[i] * 1000, o, h, l, c, v: v || 0 });
    }
    return { bars, meta: r.meta || null };
  } catch (e) {
    return { bars: [], meta: null };
  }
}

// ── 지표 ──
function sma(bars, period, key = 'c') {
  if (bars.length < period) return null;
  let s = 0;
  for (let i = bars.length - period; i < bars.length; i++) s += bars[i][key];
  return s / period;
}

// 스윙 고점(국소 최대) — window 좌우로 가장 높은 봉
function swingHighs(bars, window = 5) {
  const out = [];
  for (let i = window; i < bars.length - window; i++) {
    let isHigh = true;
    for (let j = i - window; j <= i + window; j++) { if (bars[j].h > bars[i].h) { isHigh = false; break; } }
    if (isHigh) out.push({ t: bars[i].t, price: bars[i].h, idx: i });
  }
  return out;
}
function swingLows(bars, window = 5) {
  const out = [];
  for (let i = window; i < bars.length - window; i++) {
    let isLow = true;
    for (let j = i - window; j <= i + window; j++) { if (bars[j].l < bars[i].l) { isLow = false; break; } }
    if (isLow) out.push({ t: bars[i].t, price: bars[i].l, idx: i });
  }
  return out;
}

// 최근 range 수축(변동성 축소): 최근 N봉 평균 진폭 vs 그 이전 N봉
function contractionRatio(bars, n = 10) {
  if (bars.length < n * 2) return null;
  const rng = (b) => (b.h - b.l);
  const recent = bars.slice(-n).reduce((a, b) => a + rng(b), 0) / n;
  const prior = bars.slice(-n * 2, -n).reduce((a, b) => a + rng(b), 0) / n;
  return prior > 0 ? recent / prior : null; // <1 이면 수축
}

function round(n, d = 2) { const p = Math.pow(10, d); return n == null ? null : Math.round(n * p) / p; }

// ── 종합 분석 ──
function analyze(bars) {
  if (!bars.length) return null;
  const last = bars[bars.length - 1];
  const price = last.c;
  const ma20 = sma(bars, 20), ma50 = sma(bars, 50), ma200 = sma(bars, 200);
  const periodHigh = Math.max(...bars.map((b) => b.h));
  const periodLow = Math.min(...bars.map((b) => b.l));
  const pullbackFromHigh = periodHigh > 0 ? ((price - periodHigh) / periodHigh) * 100 : null;

  // 저항: 현재가 위의 가장 가까운 스윙 고점
  const highs = swingHighs(bars, 5).filter((s) => s.price > price * 1.005);
  const resistance = highs.length ? Math.min(...highs.map((s) => s.price)) : null;
  // 지지: 현재가 아래 가장 가까운 스윙 저점
  const lows = swingLows(bars, 5).filter((s) => s.price < price * 0.995);
  const support = lows.length ? Math.max(...lows.map((s) => s.price)) : null;

  // 돌파: 최근 5봉 내 직전 저항(20봉 이전 고점)을 종가로 넘고 거래량 실렸나
  const lookback = bars.slice(-30, -5);
  const priorRes = lookback.length ? Math.max(...lookback.map((b) => b.h)) : null;
  const avgVol = sma(bars, 20, 'v');
  const brokeResistance = priorRes != null && price > priorRes && last.v > (avgVol || 0) * 1.3;

  const contraction = contractionRatio(bars, 10);
  const distMA50 = ma50 ? ((price - ma50) / ma50) * 100 : null;
  const distMA200 = ma200 ? ((price - ma200) / ma200) * 100 : null;

  return {
    price: round(price), ma20: round(ma20), ma50: round(ma50), ma200: round(ma200),
    distMA50: round(distMA50), distMA200: round(distMA200),
    aboveMA50: ma50 != null ? price > ma50 : null, aboveMA200: ma200 != null ? price > ma200 : null,
    near50: distMA50 != null ? Math.abs(distMA50) <= 3 : null,
    periodHigh: round(periodHigh), periodLow: round(periodLow), pullbackFromHigh: round(pullbackFromHigh),
    resistance: round(resistance), support: round(support),
    brokeResistance, contraction: round(contraction),
    trend: (ma50 != null && ma200 != null) ? (ma50 > ma200 && price > ma50 ? 'up' : price < ma50 && price < ma200 ? 'down' : 'mixed') : null,
    bars: bars.length,
  };
}

// ── 한 종목 차트 판독 (일봉 + 월봉10MA) ──
async function chartRead(ticker, opts = {}) {
  const { bars } = await fetchBars(ticker, { range: opts.range || '1y', interval: '1d' });
  const a = analyze(bars);
  if (!a) return { ticker, ok: false, summary: `${ticker}: 봉 데이터 없음` };
  // 월봉 10MA (장기 매도규칙)
  let monthly10 = null;
  const mo = await fetchBars(ticker, { range: '5y', interval: '1mo' });
  if (mo.bars.length) { const m10 = sma(mo.bars, 10); const mp = mo.bars[mo.bars.length - 1].c; monthly10 = { ma: round(m10), above: m10 != null ? mp > m10 : null }; }

  const near = a.near50 ? `50일선 ±3% 근접(${a.distMA50}%)` : (a.distMA50 != null ? `50일선 대비 ${a.distMA50 > 0 ? '+' : ''}${a.distMA50}%` : '');
  const brk = a.brokeResistance ? '거래량 동반 저항 돌파 ✓' : (a.resistance ? `저항 $${a.resistance} 미돌파` : '');
  const con = a.contraction != null ? (a.contraction < 0.8 ? `수축 진행(${a.contraction})` : a.contraction < 1 ? `약수축(${a.contraction})` : `확장(${a.contraction})`) : '';
  const summary = `${ticker} $${a.price} · 고점대비 ${a.pullbackFromHigh}% 되돌림 · ${near} · 200일선 ${a.aboveMA200 ? '위' : '아래'}(${a.distMA200}%) · ${brk}${con ? ' · ' + con : ''}${monthly10 ? ` · 월봉10MA ${monthly10.above ? '위' : '아래(매도규칙 주의)'}` : ''} · 추세 ${a.trend}`;
  return { ticker, ok: true, ...a, monthly10, summary };
}

module.exports = { fetchBars, sma, swingHighs, swingLows, contractionRatio, analyze, chartRead };

if (require.main === module) {
  const t = process.argv[2] || 'SNDK';
  chartRead(t).then((r) => console.log(JSON.stringify(r, null, 2)));
}
