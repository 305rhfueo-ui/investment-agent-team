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

// ── 스테이지 매트릭스 (사용자 프레임워크: 와인스타인 주봉30 + Faber 월봉10) — 기본 QQQ ──
const { fetchBars, sma } = require('./ta');
const DIR_KO = { up: '상승↑', flat: '횡보→', down: '하락↓' };

function slopeDir(bars, period, lookback) {
  const now = sma(bars, period);
  const past = sma(bars.slice(0, bars.length - lookback), period);
  if (now == null || past == null) return { dir: null };
  const pct = ((now - past) / past) * 100;
  return { now, past, pct: Math.round(pct * 10) / 10, dir: pct > 1.5 ? 'up' : pct < -1.5 ? 'down' : 'flat' };
}

// 월봉10(대세) × 주봉30(중기) × 가격위치 → 9칸 매트릭스
function matrixCell(m, w, priceAboveW) {
  const A = priceAboveW;
  if (m === 'up' && w === 'up' && A) return { 국면: '최강 제2단계', action: '적극 매수·홀딩(비중 최대)', light: 'green', invest_ok: true, posture: 'aggressive' };
  if (m === 'up' && w === 'up' && !A) return { 국면: '일시적 눌림목', action: '추가 매수 기회 — 주봉 지지 확인 후 진입', light: 'green', invest_ok: true, posture: 'buy_dip' };
  if (m === 'up' && w === 'flat') return { 국면: '에너지 응축', action: '관심 등록 — 주봉 돌파 시점이 핵심 타점', light: 'yellow', invest_ok: true, posture: 'watch' };
  if (m === 'up' && w === 'down') return { 국면: '깊은 조정', action: '보수적 — 주봉 위 안착 전 신규 금지', light: 'yellow', invest_ok: false, posture: 'defensive' };
  if (m === 'flat' && w === 'up') return { 국면: '바닥 탈출(1→2)', action: '분할 매수 시작 — 월봉 저항 돌파 시 비중 확대', light: 'green', invest_ok: true, posture: 'scale_in' };
  if (m === 'flat' && w === 'flat') return { 국면: '방향성 탐색(박스권)', action: '관망 — 위/아래 방향 대기', light: 'yellow', invest_ok: false, posture: 'wait' };
  if (m === 'flat' && w === 'down') return { 국면: '하락 전환 전조', action: '리스크 관리 — 보유 축소·현금 확보', light: 'red', invest_ok: false, posture: 'reduce' };
  if (m === 'down' && w === 'up') return { 국면: '기술적 반등', action: '단기 매매만 — 월봉 저항 강하니 짧게 익절', light: 'yellow', invest_ok: false, posture: 'short_only' };
  if (m === 'down' && w === 'down') return { 국면: '공포 제4단계', action: '전량 현금화 — 어떤 반등도 매도 기회', light: 'red', invest_ok: false, posture: 'cash' };
  return { 국면: '혼조', action: '관망', light: 'yellow', invest_ok: false, posture: 'wait' };
}

// 지수 실측 스테이지 (야후 봉) — 기본 QQQ (사용자 전략의 대세 지표). ARKK 등도 가능.
async function stageIndex(ticker = 'QQQ') {
  try {
    const mo = await fetchBars(ticker, { range: '5y', interval: '1mo' });
    const wk = await fetchBars(ticker, { range: '2y', interval: '1wk' });
    if (mo.bars.length < 13 || wk.bars.length < 34) return null;
    const price = mo.bars[mo.bars.length - 1].c;
    const m10 = slopeDir(mo.bars, 10, 3);
    const w30 = slopeDir(wk.bars, 30, 4);
    if (!m10.dir || !w30.dir) return null;
    const priceAboveW = price > w30.now;
    const cell = matrixCell(m10.dir, w30.dir, priceAboveW);
    let stage;
    if (priceAboveW && w30.dir === 'up') stage = 'Stage 2 강세장';
    else if (!priceAboveW && w30.dir === 'down') stage = 'Stage 4 하락장';
    else stage = 'Stage 1/3 전환기';
    return {
      ticker,
      price: Math.round(price * 100) / 100,
      m10: { ma: Math.round(m10.now * 100) / 100, dir: m10.dir, dirKo: DIR_KO[m10.dir], pct: m10.pct },
      w30: { ma: Math.round(w30.now * 100) / 100, dir: w30.dir, dirKo: DIR_KO[w30.dir], pct: w30.pct, priceAbove: priceAboveW },
      stage, ...cell,
    };
  } catch (e) { return null; }
}

// 종합 시장 판단 (규칙 기반):
//   1차 게이트 = QQQ 스테이지 매트릭스(월봉10×주봉30×가격위치, matrixCell 규칙)
//   거부권 센서 = ARKK(위험선호). QQQ green인데 ARKK red면 "내부 균열" → yellow 하향(딱 한 규칙).
//   사이트 market_condition·breadth는 참고 표기.
// ── 검증 근거(2단계): 다지수 2/1/0 점수합산은 폐기함.
//   · SPY는 QQQ와 상관 0.93·종목 86% 중복(이중계산), ARKK는 베타 1.56 노이즈 → 점수 X.
//   · MA 게이트는 "수익 증대"가 아니라 "낙폭 방어"용(느린 거시필터). 후행 ~수개월.
//   · 진입 타이밍은 개별종목 일봉 TA(ta.chartRead)가 담당 — 시간축 분리.
async function regime(marketCondition, rows) {
  const base = classify(marketCondition, rows);
  const [idx, sensor] = await Promise.all([stageIndex('QQQ'), stageIndex('ARKK')]);
  if (!idx) return { ...base, index: null, risk_sensor: sensor || null, note: base.note + ' · (QQQ 매트릭스 계산 실패 → 사이트 판정 사용)' };

  // 기본 = QQQ 판정
  let light = idx.light;
  let invest_ok = idx.invest_ok;
  let veto = '';

  // 거부권 센서: QQQ 강세(green)인데 위험선호(ARKK) 붕괴(red) → 내부 균열, 신규 신중
  if (sensor && idx.light === 'green' && sensor.light === 'red') {
    light = 'yellow';
    invest_ok = true; // 전면 금지는 아님(선별·신중)
    veto = ' · ⚠️ 지수 강세나 위험선호(ARKK) 붕괴 — 내부 균열, 신규 신중';
  }

  const sensorKo = sensor
    ? `위험선호 ARKK: ${sensor.light === 'green' ? '양호' : sensor.light === 'red' ? '경계' : '관망'}`
    : '위험선호 ARKK: 계산불가';
  const note = `📐 QQQ 매트릭스: 월봉10 ${idx.m10.dirKo}·주봉30 ${idx.w30.dirKo}·가격 ${idx.w30.priceAbove ? '>' : '<'}주봉30 → 【${idx.국면}】 → ${idx.action}` +
    ` (${sensorKo} · 사이트 ${marketCondition == null ? 'N/A' : marketCondition}·200일선위 ${base.breadth_pct}%)` + veto;

  return { light, invest_ok, index: idx, risk_sensor: sensor || null, market_condition: marketCondition, breadth_pct: base.breadth_pct, note };
}

module.exports = { classify, stageIndex, regime, matrixCell };
