'use strict';
// Nova(커뮤니티 스카우트) — 순수 정보 제공. 판단/추천/검증에 관여하지 않는다.
//  ① 일반 버즈: 미국 커뮤니티(StockTwits 트렌딩)에서 많이 거론되는 종목
//  ② 반응 조회: 우리 팀이 추천/보유한 종목에 대한 커뮤니티 강세·약세 분위기
// ⚠️ 전부 참고용. 커뮤니티 분위기일 뿐 매수 근거가 아니며, 펌핑·고점 신호일 수도 있다.

const { say } = require('./lib/util');

const TRENDING_URL = 'https://api.stocktwits.com/api/2/trending/symbols.json';
const SYMBOL_URL = (s) => `https://api.stocktwits.com/api/2/streams/symbol/${encodeURIComponent(s)}.json`;
const UA = { 'User-Agent': 'Mozilla/5.0 research' };

function isEquityTicker(sym) {
  return sym && !sym.includes('.X') && /^[A-Z]{1,5}$/.test(sym);
}

async function getJson(url) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), 12000);
  try {
    const r = await fetch(url, { signal: c.signal, headers: UA });
    clearTimeout(t);
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return await r.json();
  } finally { clearTimeout(t); }
}

// ① 트렌딩(일반 버즈)
async function fetchTrending() {
  try {
    const j = await getJson(TRENDING_URL);
    return (j.symbols || []).map((s) => ({ symbol: s.symbol, title: s.title || '' }));
  } catch (e) {
    say('SYSTEM', `StockTwits 트렌딩 수신 실패: ${e.message}`);
    return [];
  }
}

// ② 종목별 커뮤니티 반응(강세/약세)
async function fetchSentiment(sym) {
  try {
    const j = await getJson(SYMBOL_URL(sym));
    const msgs = j.messages || [];
    let bull = 0, bear = 0;
    for (const m of msgs) {
      const s = m.entities && m.entities.sentiment && m.entities.sentiment.basic;
      if (s === 'Bullish') bull++; else if (s === 'Bearish') bear++;
    }
    const tagged = bull + bear;
    return {
      symbol: sym, messages: msgs.length, bull, bear, tagged,
      bullPct: tagged ? Math.round((bull / tagged) * 100) : null,
      watchers: (j.symbol && j.symbol.watchlist_count) || null,
    };
  } catch (e) {
    return { symbol: sym, error: e.message };
  }
}

function activityLabel(watchers) {
  if (watchers == null) return '';
  if (watchers >= 100000) return '매우 활발';
  if (watchers >= 10000) return '활발';
  if (watchers >= 1000) return '보통';
  return '관심 적음';
}

function moodLabel(r) {
  if (r.tagged < 3) return '표본 적음(참고주의)';
  if (r.bullPct >= 70) return `강세 우위 ${r.bullPct}%`;
  if (r.bullPct <= 40) return `약세 우위 ${100 - r.bullPct}%`;
  return `혼조 (강세 ${r.bullPct}%)`;
}

function classifyTrending(trending) {
  const equities = trending.filter((t) => isEquityTicker(t.symbol));
  const crypto = trending.filter((t) => t.symbol.includes('.X')).map((t) => t.symbol.replace('.X', ''));
  return { equities, crypto };
}

// 메인: 일반 버즈 + (있으면) 우리 종목 반응
async function scanBuzz(rsRows, pickTickers = []) {
  const trending = await fetchTrending();
  const { equities, crypto } = classifyTrending(trending);

  // 우리 추천/보유 종목에 대한 반응 (중복 제거, 최대 8개)
  const uniq = [...new Set(pickTickers.filter(Boolean))].slice(0, 8);
  const reactions = [];
  for (const tk of uniq) {
    const r = await fetchSentiment(tk);
    if (!r.error) reactions.push({ ...r, mood: moodLabel(r), activity: activityLabel(r.watchers) });
  }

  const ok = trending.length > 0 || reactions.length > 0;
  if (ok) {
    say('Nova', `커뮤니티 스캔 — 일반 버즈 ${equities.length}개, 우리 종목 반응 ${reactions.length}개 (참고용)`);
  } else {
    say('Nova', 'StockTwits 수신 실패 — 이번엔 버즈 정보 없음');
  }
  return {
    ok,
    trending: equities.slice(0, 12),   // [{symbol,title}]
    crypto: crypto.slice(0, 6),
    reactions,                         // [{symbol,bullPct,mood,activity,watchers,messages,tagged}]
    note: '참고용 — 커뮤니티 분위기일 뿐 매수 근거 아님. 추천/검증 아님.',
  };
}

module.exports = { scanBuzz, fetchTrending, fetchSentiment, isEquityTicker };

if (require.main === module) {
  require('./lib/util').loadEnv();
  const { fetchRsData } = require('./fetch-rs-data');
  fetchRsData().then(async ({ rows }) => {
    const buzz = await scanBuzz(rows, ['URBN', 'ETSY', 'ECO', 'INSW', 'VIRT']);
    console.log('\n=== 🛰️ 일반 버즈 (커뮤니티에서 많이 거론) ===');
    console.log(buzz.trending.map((t) => t.symbol).join(', '));
    console.log('크립토:', buzz.crypto.join(', '));
    console.log('\n=== 🛰️ 우리 추천 종목에 대한 커뮤니티 반응 ===');
    for (const r of buzz.reactions) console.log(`  ${r.symbol}: ${r.mood} · ${r.activity} · 관심 ${r.watchers ?? '?'}명 · 최근 메시지 ${r.messages}개`);
  });
}
