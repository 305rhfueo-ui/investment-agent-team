'use strict';
// Sara(포지션 사이징) + Jordan(거래 기록·트레일링·청산) 엔진
// ⚠️ 데이터 한계: 스냅샷에 20일선 시계열이 없어 트레일링을 아래로 근사한다.
//    (1) 1차 익절 후 손절선을 본전으로 → 이후 고점 대비 trail_from_peak_pct 하락 시 청산
//    (2) 최신 50DIV < 0 (가격이 50일선 아래) → 추세 이탈로 간주해 청산
//    이 근사는 매 실행(수동 트리거) 시점의 최신가로만 갱신되며, 매매일지에 기록된다.

const { paths, readJson, writeJson, say, money, pct } = require('./lib/util');

const DEFAULT_TRAIL_FROM_PEAK_PCT = 12;

function initPortfolio(initialCapital) {
  const cap = Number(initialCapital) || 100000;
  return {
    meta: { initial_capital: cap, start_date: null, last_run: null, run_count: 0 },
    cash: cap,
    holdings: [],
    closed_trades: [],
    monthly_summary: {},
    cumulative_stats: {
      total_realized_pnl: 0,
      total_return_pct: 0,
      wins: 0,
      losses: 0,
      max_drawdown: 0,
      peak_equity: cap,
    },
  };
}

function loadPortfolio(initialCapital) {
  const p = readJson(paths.performance, null);
  return p || initPortfolio(initialCapital);
}

function num(v) {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : null;
}

function daysBetween(d1, d2) {
  const a = new Date(d1 + 'T00:00:00'), b = new Date(d2 + 'T00:00:00');
  return Math.max(0, Math.round((b - a) / 86400000));
}

// 손실 거래 부검: 무엇이 문제였는지 한글 진단
function diagnoseLoss(h, exitReason, rpct, daysHeld) {
  const bits = [];
  const ec = h.entry_context || {};
  if (exitReason === 'stop_-7pct') {
    bits.push('-7% 손절 도달');
    if (daysHeld <= 3) bits.push(`매수 ${daysHeld}일 만에 급락 → 가짜 돌파(속임수) 가능성`);
    bits.push(h.strategy === 'perfect_storm' ? '돌파 후 후속 매수세·거래량 소멸' : '눌림목 지지 실패(추세 이탈)');
    if (ec.div50 !== undefined && ec.div50 > 25) bits.push(`진입 시 50이격 ${ec.div50}%로 과열 → 눌림 폭 확대`);
    if (ec.market_light && ec.market_light !== 'green') bits.push('진입 시 시장 신호등이 초록불 아님(시장 리스크)');
  } else if (exitReason === 'below_50ma') {
    bits.push('50일선 이탈 → 중기 추세 훼손');
    bits.push('상승 동력 약화, 조기 이탈로 손실 최소화');
  } else {
    bits.push(`청산 사유: ${exitReason}`);
  }
  return bits.join(' · ');
}

// 수익 거래: 무엇이 통했는지 한 줄
function diagnoseWin(h, exitReason, rpct) {
  if (exitReason === 'tier1_partial') return '급등 초입 1차 익절 성공 · 나머지 트레일링 전환';
  if (exitReason && exitReason.startsWith('trail_peak')) return `트레일링으로 고점 수익 확보(+${rpct}%)`;
  if (exitReason === 'below_50ma') return '추세 이탈 전 이익 실현';
  return `계획대로 익절(+${rpct}%)`;
}

// 총 자산(현금 + 보유 평가액)
function equity(p) {
  const held = p.holdings.reduce((s, h) => s + h.quantity * (h.current_price || h.entry_price), 0);
  return p.cash + held;
}

// Sara: 포지션 사이징
function sizePosition(candidate, p, s) {
  const price = candidate.price;
  if (!price || price <= 0) return null;
  const eq = equity(p);
  const riskBudget = eq * (s.risk.risk_per_trade_pct / 100);
  const perShareRisk = price * (s.risk.stop_loss_pct / 100);
  let shares = Math.floor(riskBudget / perShareRisk);
  let cost = shares * price;

  // 종목당 최대 투입: 총자산의 (max_deploy_pct / max_positions) 근사 상한
  const perPosCap = eq * (s.risk.max_deploy_pct / 100) / s.risk.max_positions;
  if (cost > perPosCap) {
    shares = Math.floor(perPosCap / price);
    cost = shares * price;
  }
  // 현금 한도
  if (cost > p.cash) {
    shares = Math.floor(p.cash / price);
    cost = shares * price;
  }
  if (shares <= 0) return null;

  const stop = +(price * (1 - s.risk.stop_loss_pct / 100)).toFixed(2);
  return {
    shares,
    cost: +cost.toFixed(2),
    stop,
    riskAmount: +(shares * perShareRisk).toFixed(2),
  };
}

// Jordan: 신규 진입 기록
function openPositions(p, candidates, s, dateStr, marketLight) {
  const opened = [];
  const totalDeployedPct = () => (equity(p) - p.cash) / equity(p) * 100;

  for (const c of candidates) {
    if (p.holdings.length >= s.risk.max_positions) { say('Sara', `최대 보유 종목 수(${s.risk.max_positions}) 도달 → ${c.ticker} 보류`); break; }
    if (totalDeployedPct() >= s.risk.max_deploy_pct) { say('Sara', `총 투입 한도(${s.risk.max_deploy_pct}%) 도달 → 신규 진입 중단`); break; }
    if (p.holdings.some((h) => h.symbol === c.ticker)) continue; // 중복 보유 방지

    const sizing = sizePosition(c, p, s);
    if (!sizing) { say('Sara', `${c.ticker} 사이징 불가(현금 부족) → 보류`); continue; }

    const holding = {
      id: `${c.ticker}_${dateStr.replace(/-/g, '')}`,
      symbol: c.ticker,
      strategy: c.strategy,
      entry_date: dateStr,
      entry_price: c.price,
      quantity: sizing.shares,
      cost_basis: sizing.cost,
      stop_loss: sizing.stop,
      stop_type: 'initial',
      tier1_taken: false,
      trail_ma: s.exit.trail_ma,
      high_water_mark: c.price,
      current_price: c.price,
      current_value: +(sizing.shares * c.price).toFixed(2),
      unrealized_pnl: 0,
      unrealized_pnl_pct: 0,
      status: 'open',
      reasons: c.reasons,
      sector: c.sector,
      industry: c.industry,
      entry_context: {
        market_light: marketLight || 'green',
        div50: c.div50, div10: c.div10, rsRank: c.rsRank, adr: c.adr,
      },
    };
    p.cash = +(p.cash - sizing.cost).toFixed(2);
    p.holdings.push(holding);
    opened.push(holding);
    say('Jordan', `${c.ticker} ${sizing.shares}주 @ ${money(c.price)} 진입 (비용 ${money(sizing.cost)}, 손절 ${money(sizing.stop)})`);
  }
  return opened;
}

// Jordan: 기존 보유 갱신 + 트레일링/청산
function updateHoldings(p, priceLookup, s, dateStr) {
  const events = [];
  const trailPct = s.exit.trail_from_peak_pct || DEFAULT_TRAIL_FROM_PEAK_PCT;
  const stillOpen = [];

  for (const h of p.holdings) {
    const latest = priceLookup[h.symbol] || {};
    const price = num(latest.price) !== null ? num(latest.price) : h.current_price;
    const div50 = num(latest.div50);
    h.current_price = price;
    if (price > h.high_water_mark) h.high_water_mark = price;
    h.current_value = +(h.quantity * price).toFixed(2);
    h.unrealized_pnl = +((price - h.entry_price) * h.quantity).toFixed(2);
    h.unrealized_pnl_pct = +(((price - h.entry_price) / h.entry_price) * 100).toFixed(2);

    let exitReason = null;

    // 1) 하드 손절
    if (price <= h.stop_loss) {
      exitReason = h.stop_type === 'breakeven' ? 'breakeven_stop' : 'stop_-7pct';
    }
    // 2) 1차 익절 (아직 안 했고 목표 도달)
    if (!exitReason && !h.tier1_taken && h.unrealized_pnl_pct >= s.exit.tier1_gain_pct) {
      const sellQty = Math.floor(h.quantity * s.exit.tier1_sell_fraction);
      if (sellQty > 0) {
        const proceeds = +(sellQty * price).toFixed(2);
        const realized = +((price - h.entry_price) * sellQty).toFixed(2);
        p.cash = +(p.cash + proceeds).toFixed(2);
        h.quantity -= sellQty;
        h.tier1_taken = true;
        h.stop_loss = h.entry_price; // 손절선 본전으로
        h.stop_type = 'breakeven';
        p.closed_trades.push({
          id: h.id + '_tier1', symbol: h.symbol, strategy: h.strategy,
          entry_date: h.entry_date, entry_price: h.entry_price,
          exit_date: dateStr, exit_price: price, quantity: sellQty,
          realized_pnl: realized, realized_pnl_pct: +(((price - h.entry_price) / h.entry_price) * 100).toFixed(2),
          exit_reason: 'tier1_partial', status: 'closed_profit',
        });
        recordWin(p, realized);
        events.push({ type: 'tier1', symbol: h.symbol, qty: sellQty, price, realized });
        say('Jordan', `${h.symbol} 1차 익절 ${sellQty}주 @ ${money(price)} (실현 ${money(realized)}), 손절선 본전으로 ↑`);
      }
    }
    // 3) 트레일링: 1차 익절 후 고점 대비 하락 / 50일선 이탈
    if (!exitReason && h.tier1_taken) {
      const dropFromPeak = ((h.high_water_mark - price) / h.high_water_mark) * 100;
      if (dropFromPeak >= trailPct) exitReason = `trail_peak_-${trailPct}pct`;
      else if (div50 !== null && div50 < 0) exitReason = 'below_50ma';
    }
    // 4) 미실현 큰 수익인데 추세 이탈(50일선 아래)이면 청산
    if (!exitReason && div50 !== null && div50 < 0 && h.unrealized_pnl_pct > 0) {
      exitReason = 'below_50ma';
    }

    if (exitReason) {
      const proceeds = +(h.quantity * price).toFixed(2);
      const realized = +((price - h.entry_price) * h.quantity).toFixed(2);
      p.cash = +(p.cash + proceeds).toFixed(2);
      const rpct = +(((price - h.entry_price) / h.entry_price) * 100).toFixed(2);
      const daysHeld = daysBetween(h.entry_date, dateStr);
      const isLoss = realized < 0;
      const lesson = isLoss ? diagnoseLoss(h, exitReason, rpct, daysHeld) : null;
      const note = !isLoss ? diagnoseWin(h, exitReason, rpct) : null;
      p.closed_trades.push({
        id: h.id + '_close', symbol: h.symbol, strategy: h.strategy,
        entry_date: h.entry_date, entry_price: h.entry_price,
        exit_date: dateStr, exit_price: price, quantity: h.quantity,
        realized_pnl: realized, realized_pnl_pct: rpct, days_held: daysHeld,
        exit_reason: exitReason, status: isLoss ? 'closed_loss' : 'closed_profit',
        lesson, note, buy_reason: (h.reasons || [])[0] || '',
      });
      if (realized >= 0) recordWin(p, realized); else recordLoss(p, realized);
      events.push({ type: 'close', symbol: h.symbol, price, realized, reason: exitReason, lesson, note, rpct });
      say('Jordan', `${h.symbol} 청산 @ ${money(price)} (${exitReason}, 실현 ${money(realized)} / ${pct(rpct)})`);
      if (lesson) say('Jordan', `  ↳ 손실 부검: ${lesson}`);
    } else {
      stillOpen.push(h);
    }
  }
  p.holdings = stillOpen;
  return events;
}

function recordWin(p, realized) {
  p.cumulative_stats.total_realized_pnl = +(p.cumulative_stats.total_realized_pnl + realized).toFixed(2);
  if (realized > 0) p.cumulative_stats.wins += 1;
}
function recordLoss(p, realized) {
  p.cumulative_stats.total_realized_pnl = +(p.cumulative_stats.total_realized_pnl + realized).toFixed(2);
  p.cumulative_stats.losses += 1;
}

// 누적 통계 + 월별 요약
function computeStats(p, dateStr) {
  const eq = equity(p);
  const cap = p.meta.initial_capital;
  p.cumulative_stats.total_return_pct = +(((eq - cap) / cap) * 100).toFixed(2);
  p.cumulative_stats.equity = +eq.toFixed(2);
  if (eq > p.cumulative_stats.peak_equity) p.cumulative_stats.peak_equity = +eq.toFixed(2);
  const dd = ((eq - p.cumulative_stats.peak_equity) / p.cumulative_stats.peak_equity) * 100;
  if (dd < p.cumulative_stats.max_drawdown) p.cumulative_stats.max_drawdown = +dd.toFixed(2);

  const month = dateStr.slice(0, 7);
  const monthTrades = p.closed_trades.filter((t) => t.exit_date && t.exit_date.slice(0, 7) === month);
  const realized = monthTrades.reduce((s, t) => s + t.realized_pnl, 0);
  const wins = monthTrades.filter((t) => t.realized_pnl >= 0).length;
  p.monthly_summary[month] = {
    realized_pnl: +realized.toFixed(2),
    realized_pnl_pct: +((realized / cap) * 100).toFixed(2),
    trades: monthTrades.length,
    win_rate: monthTrades.length ? +(wins / monthTrades.length).toFixed(2) : 0,
  };
  return p.cumulative_stats;
}

module.exports = {
  initPortfolio, loadPortfolio, sizePosition, openPositions,
  updateHoldings, computeStats, equity,
  save: (p) => writeJson(paths.performance, p),
};
