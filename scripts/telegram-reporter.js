'use strict';
// CEO RICH의 Telegram 보고. 토큰/chat_id 없으면 콘솔 출력 후 건너뜀(graceful).

const { loadEnv, money, pct, say } = require('./lib/util');

function buildMessage(ctx) {
  const L = [];
  L.push(`🏦 CEO RICH 투자팀 보고 (${ctx.dateStr})`);
  L.push('');
  const light = ctx.marketLight === 'green' ? '🟢 초록불(진입가능)' : ctx.marketLight === 'yellow' ? '🟡 노랑불(주의)' : '🔴 빨강불(진입중단)';
  L.push(`📡 시장 신호등: ${light}`);
  L.push(`🧬 활성 전략: v${ctx.strategyVersion}`);
  L.push('');

  if (ctx.opened.length > 0) {
    L.push('📊 오늘의 추천/진입 종목');
    ctx.opened.forEach((h, i) => {
      const tag = h.strategy === 'perfect_storm' ? '⚡돌파' : '👨‍🏫눌림목';
      L.push(`${i + 1}. ${h.symbol} ${tag}`);
      L.push(`   진입 ${money(h.entry_price)} · ${h.quantity}주 · 손절 ${money(h.stop_loss)}(-7%)`);
      if (h.reasons && h.reasons[0]) L.push(`   근거: ${h.reasons.slice(0, 2).join(', ')}`);
    });
  } else {
    L.push('📊 오늘은 신규 진입 없음 (조건 미충족 또는 현금 보존)');
  }
  L.push('');

  // 청산/익절 이벤트
  const closes = ctx.updateEvents.filter((e) => e.type === 'close' || e.type === 'tier1');
  if (closes.length) {
    L.push('🔄 포지션 변동');
    for (const e of closes) {
      if (e.type === 'tier1') L.push(`• ${e.symbol} 1차 익절 ${e.qty}주 (+${money(e.realized)})`);
      else L.push(`• ${e.symbol} 청산 (${e.reason}, ${money(e.realized)})`);
    }
    L.push('');
  }

  L.push('💰 포트폴리오');
  L.push(`• 총자산: ${money(ctx.stats.equity)} (초기 ${money(ctx.portfolio.meta.initial_capital)})`);
  L.push(`• 누적 수익률: ${pct(ctx.stats.total_return_pct)}`);
  L.push(`• 현금: ${money(ctx.portfolio.cash)} · 보유 ${ctx.portfolio.holdings.length}종목`);
  L.push(`• 승/패: ${ctx.stats.wins}/${ctx.stats.losses} · MDD ${pct(ctx.stats.max_drawdown)}`);
  L.push('');

  if (ctx.review) {
    L.push('🔍 전략 리뷰 (Morgan)');
    L.push(ctx.review.headline);
    (ctx.review.changes || []).slice(0, 3).forEach((c) => L.push(`• ${c}`));
    if (ctx.review.versionBumped) L.push(`→ 전략 v${ctx.strategyVersion + 1}로 업데이트`);
    L.push('');
  }

  if (ctx.dashboardUrl) L.push(`🏠 미니룸: ${ctx.dashboardUrl}`);
  L.push('— RICH 올림 👑');
  return L.join('\n');
}

async function sendTelegram(text) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    say('SYSTEM', 'Telegram 미설정(.env) → 콘솔 출력으로 대체합니다.');
    console.log('\n----- (Telegram 미리보기) -----\n' + text + '\n-------------------------------\n');
    return { sent: false, reason: 'no_credentials' };
  }
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
    });
    const j = await res.json();
    if (!j.ok) throw new Error(j.description || 'unknown');
    say('RICH', 'Telegram 보고 전송 완료 ✅');
    return { sent: true };
  } catch (e) {
    say('SYSTEM', `Telegram 전송 실패: ${e.message} (무시하고 진행)`);
    console.log('\n----- (전송 실패, 내용) -----\n' + text + '\n----------------------------\n');
    return { sent: false, reason: e.message };
  }
}

async function sendReport(ctx) {
  return sendTelegram(buildMessage(ctx));
}

module.exports = { sendReport, buildMessage, sendTelegram };

// --test: 샘플 메시지 전송 테스트
if (require.main === module) {
  loadEnv();
  if (process.argv.includes('--test')) {
    sendTelegram('🏦 투자팀 텔레그램 연결 테스트 성공! CEO RICH 대기 중 👑').then((r) => {
      console.log(r.sent ? '전송 성공' : '미전송: ' + r.reason);
    });
  } else {
    console.log('사용법: node scripts/telegram-reporter.js --test');
  }
}
