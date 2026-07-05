'use strict';
// 실행 결과 → 미니룸 대화 타임라인(JSON) 생성. 대시보드가 이 파일을 읽어 재생.

const path = require('path');
const { paths, writeJson, writeText, money, pct, topPct } = require('./lib/util');

function buildTimeline(ctx) {
  const t = { v: 0 };
  const line = [];
  const push = (agent, action, msg, phase) => {
    line.push({ agent, action, msg, phase, t: t.v });
    t.v += 1;
  };

  const lightText = ctx.marketLight === 'green' ? '🟢 초록불' : ctx.marketLight === 'yellow' ? '🟡 노랑불' : '🔴 빨강불';

  // ── Phase 1: 분석 (Alex) ─────────────────────────
  push('Alex', 'walk', `좋은 아침입니다 팀! 오늘 시장 신호등 확인할게요.`, '분석');
  push('Alex', 'talk', `QQQ 상태 점검 → ${lightText}. ${ctx.marketLight === 'green' ? '신규 진입 가능!' : ctx.marketLight === 'red' ? '빨강불이라 신규 진입 중단, 현금 지킵니다.' : '조심스럽게 봅니다.'}`, '분석');
  push('Alex', 'talk', `활성 전략 v${ctx.strategyVersion} 로드 완료. RS 데이터 ${ctx.rowCount}개 스크리닝 시작!`, '분석');
  if (ctx.candidates.length === 0) {
    push('Alex', 'talk', `오늘은 조건을 만족하는 종목이 없네요. 무리하지 않겠습니다.`, '분석');
  } else {
    for (const c of ctx.candidates.slice(0, 5)) {
      const tag = c.strategy === 'perfect_storm' ? '⚡돌파' : '👨‍🏫눌림목';
      const setup = (c.reasons || []).find((r) => /돌파|눌림목|거래량|종가강도|정배열/.test(r)) || (c.reasons || [])[1] || '';
      push('Alex', 'talk', `${c.ticker} 포착! ${tag} · RS상위 ${topPct(c.rsRank)}% · ${setup}`, '분석');
    }
  }

  // ── Phase 2: 리스크 (Sara) ───────────────────────
  push('Sara', 'walk', `제가 포지션 사이징 들어갈게요. 거래당 리스크 2% 원칙!`, '리스크');
  if (ctx.opened.length === 0) {
    push('Sara', 'talk', ctx.marketLight === 'red' ? `빨강불이라 신규 진입 안 합니다. 현금 ${money(ctx.portfolio.cash)} 보존.` : `조건 맞는 신규 진입이 없어 관망합니다.`, '리스크');
  } else {
    for (const h of ctx.opened) {
      push('Sara', 'talk', `${h.symbol}: ${h.quantity}주, 손절 ${money(h.stop_loss)} (-7%). 최대 손실 딱 2%로 제한했어요.`, '리스크');
    }
  }

  // ── Phase 3: 거래 (Jordan) ───────────────────────
  push('Jordan', 'walk', `기록 담당 조던입니다. 매매일지에 남길게요 ✍️`, '거래');
  for (const ev of ctx.updateEvents) {
    if (ev.type === 'tier1') push('Jordan', 'talk', `${ev.symbol} 1차 익절 ${ev.qty}주! 실현 ${money(ev.realized)} 💰 손절선은 본전으로 올립니다.`, '거래');
    else if (ev.type === 'close') push('Jordan', 'talk', `${ev.symbol} 청산 (${ev.reason}). 실현 ${money(ev.realized)}.`, '거래');
  }
  for (const h of ctx.opened) {
    push('Jordan', 'talk', `${h.symbol} ${h.quantity}주 @ ${money(h.entry_price)} 진입 기록 완료 ✅`, '거래');
  }
  push('Jordan', 'talk', `현재 보유 ${ctx.portfolio.holdings.length}종목, 현금 ${money(ctx.portfolio.cash)}.`, '거래');

  // ── Phase 4: 검토 (Morgan) ───────────────────────
  push('Morgan', 'walk', `전략가 모건이에요. 매매일지 돌아볼게요 📖`, '검토');
  if (ctx.review) {
    push('Morgan', 'talk', ctx.review.headline, '검토');
    for (const ch of (ctx.review.changes || []).slice(0, 2)) push('Morgan', 'talk', ch, '검토');
    if (ctx.review.versionBumped) push('Morgan', 'talk', `→ 전략 v${ctx.strategyVersion}→v${ctx.strategyVersion + 1} 로 업데이트했습니다!`, '검토');
  } else {
    push('Morgan', 'talk', `누적 수익률 ${pct(ctx.stats.total_return_pct)} · 승 ${ctx.stats.wins} / 패 ${ctx.stats.losses}. 이번엔 정기 리뷰 주기 아니라 관찰만 합니다.`, '검토');
  }

  // ── Phase 5: 보고 (RICH) ─────────────────────────
  push('RICH', 'walk', `CEO 리치다. 좋았어 팀! 사장님께 보고 들어간다 👑`, '보고');
  push('RICH', 'talk', `오늘 추천 ${ctx.opened.length}종목, 누적 수익률 ${pct(ctx.stats.total_return_pct)}. 텔레그램 발사! 🚀`, '보고');
  push('RICH', 'talk', `목표는 월 20~30%! 우리 사장님 부자 만들 때까지 달린다 💪🔥`, '보고');

  const hud = {
    initial_capital: ctx.portfolio.meta.initial_capital,
    equity: ctx.stats.equity,
    cash: ctx.portfolio.cash,
    total_return_pct: ctx.stats.total_return_pct,
    holdings_count: ctx.portfolio.holdings.length,
    wins: ctx.stats.wins,
    losses: ctx.stats.losses,
    max_drawdown: ctx.stats.max_drawdown,
  };

  return {
    run_date: ctx.dateStr,
    generated_note: '이 파일은 start-investment 실행 시 자동 생성됩니다.',
    market_light: ctx.marketLight,
    source: ctx.source,
    strategy_version: ctx.strategyVersion,
    hud,
    holdings: ctx.portfolio.holdings.map((h) => ({
      symbol: h.symbol, qty: h.quantity, entry: h.entry_price,
      current: h.current_price, pnl_pct: h.unrealized_pnl_pct, strategy: h.strategy,
    })),
    recommendations: ctx.opened.map((h) => ({
      symbol: h.symbol, entry: h.entry_price, qty: h.quantity,
      stop: h.stop_loss, strategy: h.strategy, reasons: h.reasons,
    })),
    timeline: line,
  };
}

function writeTimeline(ctx) {
  const data = buildTimeline(ctx);
  writeJson(paths.dashboardData, data);
  // file:// 에서 fetch(CORS) 없이 로드하도록 .js 버전도 생성 (window.RUN_DATA)
  const jsPath = path.join(path.dirname(paths.dashboardData), 'latest-run.js');
  writeText(jsPath, 'window.RUN_DATA = ' + JSON.stringify(data, null, 2) + ';\n');
  return data;
}

module.exports = { buildTimeline, writeTimeline };
