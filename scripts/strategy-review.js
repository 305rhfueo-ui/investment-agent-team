'use strict';
// Morgan(전략가): 매매일지 분석 → 전략 리뷰 작성, 주기+데이터 충족 시 전략 버전업

const path = require('path');
const { paths, writeJson, writeText, readJson, say, pct } = require('./lib/util');

const MIN_TRADES_FOR_BUMP = 8; // 이보다 적으면 노이즈 → 버전업 보류

// 청산 거래 통계 (전략별)
function analyze(portfolio) {
  const trades = portfolio.closed_trades.filter((t) => t.exit_reason !== 'tier1_partial' || true);
  const byStrat = {};
  for (const t of portfolio.closed_trades) {
    const k = t.strategy || 'unknown';
    byStrat[k] = byStrat[k] || { n: 0, wins: 0, pnl: 0 };
    byStrat[k].n += 1;
    byStrat[k].pnl += t.realized_pnl;
    if (t.realized_pnl >= 0) byStrat[k].wins += 1;
  }
  const total = portfolio.closed_trades.length;
  const wins = portfolio.closed_trades.filter((t) => t.realized_pnl >= 0).length;
  return {
    total,
    winRate: total ? wins / total : 0,
    byStrat,
    totalReturnPct: portfolio.cumulative_stats.total_return_pct,
  };
}

// 리뷰 주기 판단
function isDue(portfolio, dateStr) {
  const meta = portfolio.meta;
  const month = dateStr.slice(0, 7);
  const monthlyDue = meta.last_monthly_review !== month && portfolio.closed_trades.length >= MIN_TRADES_FOR_BUMP;
  const weeklyDue = (portfolio.meta.run_count || 0) % 5 === 0 && portfolio.closed_trades.length > 0;
  return { monthlyDue, weeklyDue, any: monthlyDue || weeklyDue };
}

// 성과 기반 파라미터 개선안 도출 (보수적)
function proposeChanges(strategy, a) {
  const changes = [];
  const next = JSON.parse(JSON.stringify(strategy));

  const ps = a.byStrat.perfect_storm;
  const eb = a.byStrat.eungbong;

  // 전략별 승률 격차 → 약한 경로 조이기
  if (ps && eb && ps.n >= 3 && eb.n >= 3) {
    const psW = ps.wins / ps.n, ebW = eb.wins / eb.n;
    if (psW - ebW > 0.2) {
      next.eungbong_pullback.div10_low = Math.max(-2, strategy.eungbong_pullback.div10_low + 1);
      next.eungbong_pullback.div10_high = Math.min(2, strategy.eungbong_pullback.div10_high - 1);
      changes.push(`응봉 눌림목 승률(${(ebW * 100).toFixed(0)}%)이 돌파(${(psW * 100).toFixed(0)}%)보다 낮음 → 눌림목 진입폭 -2~+2%로 축소`);
    }
  }

  // 목표 페이스 미달 → RS 필터 강화
  if (a.totalReturnPct < 5 && strategy.screening.rs_rank_pct_min < 85) {
    next.screening.rs_rank_pct_min = Math.min(85, strategy.screening.rs_rank_pct_min + 5);
    changes.push(`누적 ${pct(a.totalReturnPct)}로 목표 미달 → RS 필터 상위 ${100 - next.screening.rs_rank_pct_min}%로 강화`);
  }

  // 전체 승률 낮으면 손절 타이트하게 유지 + 트레일링 소폭 타이트
  if (a.winRate < 0.45) {
    const cur = strategy.exit.trail_from_peak_pct || 12;
    next.exit.trail_from_peak_pct = Math.max(8, cur - 2);
    changes.push(`승률 ${(a.winRate * 100).toFixed(0)}% 낮음 → 트레일링 폭 ${next.exit.trail_from_peak_pct}%로 타이트하게`);
  }

  return { next, changes };
}

function writeStrategyVersion(next, dateStr, rationale) {
  const newVersion = (next.version || 1) + 1;
  next.version = newVersion;
  next.updated = dateStr;
  next.updated_by = 'Morgan (팀 회의)';
  // 활성 전략 갱신
  writeJson(paths.strategyJson, next);
  // 히스토리 스냅샷
  const snap = path.join(paths.strategyHistory, `v${newVersion}-${dateStr.slice(0, 7)}.md`);
  writeText(snap, `# 전략 스냅샷 v${newVersion}\n\n- 생성일: ${dateStr}\n- 작성: Morgan (팀 회의)\n\n## 변경 근거\n${rationale.map((r) => `- ${r}`).join('\n')}\n\n## 파라미터\n\n\`\`\`json\n${JSON.stringify(next, null, 2)}\n\`\`\`\n`);
  // 변경 이력(changelog.json)에 자동 추가
  const clPath = path.join(paths.root, 'strategy', 'changelog.json');
  const cl = readJson(clPath, { entries: [] });
  cl.entries.push({ date: dateStr, version: newVersion, change: rationale.join(' · ') });
  writeJson(clPath, cl);
  return newVersion;
}

// 메인: 필요 시 리뷰 수행
function maybeReview(portfolio, strategy, dateStr) {
  const due = isDue(portfolio, dateStr);
  if (!due.any) return null;

  const a = analyze(portfolio);
  const month = dateStr.slice(0, 7);
  const reviewType = due.monthlyDue ? '월간 딥 리뷰' : '주간 라이트 리뷰';

  let versionBumped = false;
  let changes = [];
  let rationale = [];

  if (due.monthlyDue) {
    const prop = proposeChanges(strategy, a);
    changes = prop.changes;
    if (changes.length > 0) {
      rationale = changes;
      writeStrategyVersion(prop.next, dateStr, rationale);
      versionBumped = true;
      portfolio.meta.last_monthly_review = month;
      say('Morgan', `전략 v${strategy.version}→v${strategy.version + 1} 업데이트 (${changes.length}개 개선)`);
    } else {
      portfolio.meta.last_monthly_review = month;
      changes = ['현 전략 유지 (유의미한 개선 신호 없음)'];
    }
  } else {
    // 주간: 관찰 위주, 소폭 코멘트
    const psW = a.byStrat.perfect_storm ? (a.byStrat.perfect_storm.wins / a.byStrat.perfect_storm.n * 100).toFixed(0) : '—';
    changes = [`이번 주 승률 ${(a.winRate * 100).toFixed(0)}%, 돌파전략 승률 ${psW}%. 파라미터 미세조정 없이 관찰 지속.`];
  }

  const headline = `[${reviewType}] 누적 ${pct(a.totalReturnPct)} · 승률 ${(a.winRate * 100).toFixed(0)}% · 거래 ${a.total}건`;

  // 리뷰 문서 작성
  const md = [
    `# ${month} 전략 진화 리포트 (Morgan)`,
    ``,
    `- 유형: ${reviewType}`,
    `- 작성일: ${dateStr}`,
    ``,
    `## 성과 vs 목표(월 20~30%)`,
    `- 누적 수익률: ${pct(a.totalReturnPct)}`,
    `- 승률: ${(a.winRate * 100).toFixed(0)}% (${a.total}건)`,
    ``,
    `## 전략별 성과`,
    ...Object.entries(a.byStrat).map(([k, v]) => `- ${k}: ${v.n}건, 승률 ${(v.wins / v.n * 100).toFixed(0)}%, 손익 ${v.pnl >= 0 ? '+' : ''}${v.pnl.toFixed(0)}`),
    ``,
    `## 개선안`,
    ...changes.map((c) => `- ${c}`),
    ``,
    versionBumped ? `→ **전략 v${strategy.version + 1}로 업데이트됨** (다음 실행부터 적용)` : `→ 전략 버전 유지`,
    ``,
  ].join('\n');
  writeText(path.join(paths.insightsDir, `${month}-strategy-review.md`), md);

  return { type: reviewType, headline, changes, versionBumped, analysis: a };
}

module.exports = { maybeReview, analyze };
