'use strict';
// Alex(분석가)의 스크리닝 엔진 — active-strategy.json 파라미터로 두 경로 필터링

const { paths, readJson, say, topPct } = require('./lib/util');

function num(v) {
  if (v === null || v === undefined || v === '') return null;
  const n = parseFloat(String(v).replace(/[%,]/g, ''));
  return Number.isFinite(n) ? n : null;
}
function yes(v) {
  return String(v).trim().toUpperCase() === 'YES';
}

function loadStrategy() {
  return readJson(paths.strategyJson, null);
}

// 시장 신호등: 환경변수 MARKET_LIGHT(green/yellow/red)로 오버라이드 가능. 기본 green.
function marketLight() {
  const v = (process.env.MARKET_LIGHT || 'green').toLowerCase();
  return ['green', 'yellow', 'red'].includes(v) ? v : 'green';
}

// 공통 관문 통과 여부 + 사유
function passesCommonGate(row, s) {
  const reasons = [];
  const fails = [];
  const rsRank = num(row.RS_Rank_Pct);
  const div50 = num(row['50DIV']);
  const jeong = yes(row['Jungjanggi Jeongbaeyeol']);
  const high52 = num(row.High_52W_Pct);
  const adr = num(row.ADR_20D);
  // Up_Down_Ratio 단위 정규화: 라이브는 퍼센트(0~100), 일부 소스는 비율(0~1)
  let udr = num(row.Up_Down_Ratio);
  if (udr !== null && udr <= 1) udr *= 100;
  const div50Max = s.screening.div50_max;

  if (rsRank !== null && rsRank >= s.screening.rs_rank_pct_min) reasons.push(`RS 상위 ${topPct(rsRank)}%`);
  else fails.push('RS 순위 미달');

  if (div50 !== null && div50 <= div50Max) reasons.push(`50이격 ${div50}% (≤${div50Max})`);
  else fails.push(`50이격 과열(${div50}%)`);

  if (s.screening.require_jungjanggi_jeongbaeyeol ? jeong : true) reasons.push('정배열 20>60>120');
  else fails.push('정배열 아님');

  if (high52 !== null && high52 >= s.screening.high_52w_pct_min) reasons.push(`52주고 ${high52}%`);
  else fails.push(`52주고 근접 부족(${high52}%)`);

  if (adr !== null && adr >= s.screening.adr_min) reasons.push(`ADR ${adr}%`);
  else fails.push(`ADR 부족(${adr}%)`);

  // 애널리스트 비율은 "선호" 조건(soft): 값이 없으면 중립(통과), 있으면 기준 적용
  if (udr === null) { /* 정보 없음 → 중립 */ }
  else if (udr >= s.screening.up_down_ratio_min) reasons.push(`애널 up/down ${udr.toFixed(0)}%`);
  else fails.push(`애널 비율 낮음(${udr.toFixed(0)}%)`);

  return { pass: fails.length === 0, reasons, fails };
}

function perfectStormEntry(row, s) {
  const reasons = [];
  const brk = yes(row.BRK_60D);
  const volx = num(row.VOL_X);
  const cls = num(row.CLS_POS);
  const ok =
    (s.perfect_storm_entry.require_brk_60d ? brk : true) &&
    volx !== null && volx >= s.perfect_storm_entry.vol_x_min &&
    cls !== null && cls >= s.perfect_storm_entry.cls_pos_min;
  if (ok) {
    reasons.push('60일 신고가 돌파(BRK_60D)');
    reasons.push(`거래량 ${volx}배 폭발(VOL_X≥${s.perfect_storm_entry.vol_x_min})`);
    reasons.push(`종가강도 ${cls}(CLS_POS≥${s.perfect_storm_entry.cls_pos_min})`);
  }
  return { ok, reasons };
}

function eungbongPullback(row, s) {
  const reasons = [];
  const div10 = num(row['10DIV']);
  const inZone = div10 !== null && div10 >= s.eungbong_pullback.div10_low && div10 <= s.eungbong_pullback.div10_high;
  const cyTrend = num(row.CY_Trend);
  const accelerating = cyTrend !== null && cyTrend > 0;
  const ok = inZone && accelerating;
  if (ok) {
    reasons.push(`10이격 ${div10}% 눌림목 진입권`);
    reasons.push(`실적 개선 추세(CY_Trend ${cyTrend})`);
  }
  return { ok, reasons };
}

// 메인 스크리닝
function screenStocks(rows, strategy) {
  const s = strategy || loadStrategy();
  if (!s) throw new Error('active-strategy.json 로드 실패');

  const light = marketLight();
  const candidates = [];
  const rejected = [];

  for (const row of rows) {
    const ticker = row.Ticker || row.ticker;
    if (!ticker) continue;
    const gate = passesCommonGate(row, s);
    if (!gate.pass) {
      rejected.push({ ticker, fails: gate.fails });
      continue;
    }
    const ps = perfectStormEntry(row, s);
    const eb = eungbongPullback(row, s);
    if (!ps.ok && !eb.ok) {
      rejected.push({ ticker, fails: ['진입신호 없음(돌파X, 눌림목X)'] });
      continue;
    }
    const strategyTag = ps.ok ? 'perfect_storm' : 'eungbong';
    candidates.push({
      ticker,
      price: num(row.Price),
      sector: row.Sector || '',
      industry: row.Industry || '',
      rsRank: num(row.RS_Rank_Pct),
      div50: num(row['50DIV']),
      div10: num(row['10DIV']),
      adr: num(row.ADR_20D),
      high52: num(row.High_52W_Pct),
      volx: num(row.VOL_X),
      clsPos: num(row.CLS_POS),
      cyTrend: num(row.CY_Trend),
      nyTrend: num(row.NY_Trend),
      strategy: strategyTag,
      reasons: [...gate.reasons, ...(ps.ok ? ps.reasons : eb.reasons)],
      raw: row,
    });
  }

  // RS 순위 내림차순 정렬 후 상위 N
  candidates.sort((a, b) => (b.rsRank || 0) - (a.rsRank || 0));
  const top = candidates.slice(0, s.candidate_count || 5);

  say('Alex', `시장 신호등: ${light === 'green' ? '🟢 초록불' : light === 'yellow' ? '🟡 노랑불' : '🔴 빨강불'}`);
  if (light === 'red') {
    say('Alex', '빨강불 → 신규 진입 전면 중단(현금 보존). 후보만 관찰 리스트로 보고합니다.');
  }
  say('Alex', `전체 ${rows.length}개 중 후보 ${candidates.length}개 → 상위 ${top.length}개 선정`);

  return { candidates: top, allCandidates: candidates, rejected, marketLight: light };
}

module.exports = { screenStocks, loadStrategy, num, yes };

if (require.main === module) {
  require('./lib/util').loadEnv();
  const { fetchRsData } = require('./fetch-rs-data');
  fetchRsData().then(({ rows }) => {
    const res = screenStocks(rows);
    console.log('\n선정 종목:');
    for (const c of res.candidates) {
      console.log(`  ${c.ticker} [${c.strategy}] RS${c.rsRank} — ${c.reasons.slice(0, 3).join(', ')}`);
    }
  });
}
