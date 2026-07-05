'use strict';
// Nova(커뮤니티 스카우트): 미국 투자 커뮤니티에서 회자되는 종목 스캔
// - StockTwits 트렌딩 API(실데이터) + 우리 RS 유니버스 교차검증
// - Reddit/X(FinTwit)는 봇 차단이라 AI 웹검색으로 보완(별도 에이전트)
// ⚠️ 버즈 = 인기 신호일 뿐, 매수 근거 아님. 펌핑/고점 경고로도 쓰인다.

const { say } = require('./lib/util');

const STOCKTWITS_URL = 'https://api.stocktwits.com/api/2/trending/symbols.json';

function isEquityTicker(sym) {
  if (!sym) return false;
  if (sym.includes('.X')) return false;      // 크립토 (BTC, SUI.X 등)
  if (!/^[A-Z]{1,5}$/.test(sym)) return false; // 정상 티커 형태만
  return true;
}

async function fetchStockTwitsTrending() {
  try {
    const c = new AbortController();
    const t = setTimeout(() => c.abort(), 12000);
    const r = await fetch(STOCKTWITS_URL, { signal: c.signal, headers: { 'User-Agent': 'Mozilla/5.0 research' } });
    clearTimeout(t);
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const j = await r.json();
    const list = (j.symbols || []).map((s) => ({ symbol: s.symbol, title: s.title || '', watchers: s.watchlist_count || null }));
    return list;
  } catch (e) {
    say('SYSTEM', `StockTwits 트렌딩 수신 실패: ${e.message}`);
    return [];
  }
}

// RS 유니버스와 교차검증
function crossReference(trending, rsRows) {
  const byTicker = {};
  for (const row of rsRows || []) {
    const tk = row.Ticker || row.ticker;
    if (tk) byTicker[tk] = row;
  }
  const num = (v) => { const n = parseFloat(v); return Number.isFinite(n) ? n : null; };

  const equities = trending.filter((t) => isEquityTicker(t.symbol));
  const crypto = trending.filter((t) => t.symbol.includes('.X')).map((t) => t.symbol.replace('.X', ''));

  const enriched = equities.map((t) => {
    const row = byTicker[t.symbol];
    if (!row) return { symbol: t.symbol, title: t.title, inUniverse: false };
    return {
      symbol: t.symbol, title: t.title, inUniverse: true,
      rsRank: num(row.RS_Rank_Pct),
      price: num(row.Price),
      sector: row.Sector || '',
      div50: num(row['50DIV']),
      jeongbaeyeol: String(row['Jungjanggi Jeongbaeyeol']).toUpperCase() === 'YES',
      high52: num(row.High_52W_Pct),
      brk60: String(row.BRK_60D).toUpperCase() === 'YES',
    };
  });

  // RS 순위 높은 순 (유니버스 내), 유니버스 밖은 뒤로
  enriched.sort((a, b) => {
    if (a.inUniverse !== b.inUniverse) return a.inUniverse ? -1 : 1;
    return (b.rsRank || 0) - (a.rsRank || 0);
  });
  return { enriched, crypto };
}

// 메인: 커뮤니티 버즈 스캔
async function scanBuzz(rsRows) {
  const trending = await fetchStockTwitsTrending();
  if (trending.length === 0) {
    return { source: 'stocktwits', ok: false, hot: [], strong: [], crypto: [], note: 'StockTwits 수신 실패' };
  }
  const { enriched, crypto } = crossReference(trending, rsRows);
  // "버즈 + RS 강세" 교집합 = 관심 우선순위
  const strong = enriched.filter((e) => e.inUniverse && e.rsRank !== null && e.rsRank >= 70);
  say('Nova', `StockTwits 트렌딩 ${trending.length}개 스캔 → 우리 유니버스 ${enriched.filter((e) => e.inUniverse).length}개, RS강세 교집합 ${strong.length}개`);
  return {
    source: 'stocktwits', ok: true,
    hot: enriched.slice(0, 15),
    strong,
    crypto: crypto.slice(0, 6),
    note: '버즈는 인기 신호일 뿐 매수 근거 아님. RS강세 교집합만 관심 리스트로.',
  };
}

module.exports = { scanBuzz, fetchStockTwitsTrending, crossReference, isEquityTicker };

if (require.main === module) {
  require('./lib/util').loadEnv();
  const { fetchRsData } = require('./fetch-rs-data');
  fetchRsData().then(async ({ rows }) => {
    const buzz = await scanBuzz(rows);
    console.log('\n=== 🛰️ 커뮤니티 버즈 (StockTwits) ===');
    console.log('\n[버즈 + RS강세 교집합 = 관심 우선]');
    for (const s of buzz.strong) console.log(`  🔥 ${s.symbol} (${s.title}) RS상위 ${(100 - s.rsRank).toFixed(1)}% · ${s.sector} · ${s.brk60 ? '60일돌파✓' : ''}`);
    console.log('\n[유니버스 내 기타 버즈]');
    for (const s of buzz.hot.filter((h) => h.inUniverse && (!h.rsRank || h.rsRank < 70))) console.log(`  · ${s.symbol} RS상위 ${s.rsRank ? (100 - s.rsRank).toFixed(1) + '%' : '—'}`);
    console.log('\n[유니버스 밖(ETF/기타)]:', buzz.hot.filter((h) => !h.inUniverse).map((h) => h.symbol).join(', '));
    console.log('[크립토]:', buzz.crypto.join(', '));
  });
}
