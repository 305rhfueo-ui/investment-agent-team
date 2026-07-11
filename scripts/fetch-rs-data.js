'use strict';
// RS 데이터 수집 — 라이브 사이트에서 가져오고, 실패 시 번들 샘플로 폴백

const { paths, readJson, say } = require('./lib/util');

const DEFAULT_URL = 'https://305rhfueo-ui.github.io/RS_Investment/static/result.json';

// 사이트 JSON 에 NaN/Infinity 가 들어있어 표준 JSON.parse 가 실패 → 정제 후 파싱
function parseLooseJson(text) {
  const cleaned = text
    .replace(/\bNaN\b/g, 'null')
    .replace(/-?\bInfinity\b/g, 'null');
  return JSON.parse(cleaned);
}

// 사이트 JSON 은 { "data": [...] } 또는 배열 형태일 수 있음 → 정규화
function normalize(raw) {
  let rows = Array.isArray(raw) ? raw : (raw && raw.data) ? raw.data : [];
  return rows.filter((r) => r && (r.Ticker || r.ticker));
}

// 종목 행 외의 부가 데이터(섹터 랭킹·시장국면) 추출
function extractMeta(raw) {
  if (!raw || Array.isArray(raw)) return { wrs_data: [], market_condition: null, last_updated: null };
  return {
    wrs_data: Array.isArray(raw.wrs_data) ? raw.wrs_data : [],
    market_condition: raw.market_condition != null ? raw.market_condition : null,
    last_updated: raw.last_updated || null,
  };
}

async function fetchRsData(opts = {}) {
  const url = opts.url || process.env.RS_DATA_URL || DEFAULT_URL;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const text = await res.text();
    const raw = parseLooseJson(text);
    const rows = normalize(raw);
    if (rows.length === 0) throw new Error('빈 데이터');
    say('Alex', `RS 데이터 ${rows.length}개 종목 수신 (라이브)`);
    return { rows, source: 'live', url, meta: extractMeta(raw) };
  } catch (e) {
    say('SYSTEM', `라이브 수신 실패(${e.message}) → 번들 샘플 사용`);
    const sample = readJson(paths.sampleData, { data: [] });
    const rows = normalize(sample);
    say('Alex', `RS 데이터 ${rows.length}개 종목 (샘플)`);
    return { rows, source: 'sample', url, meta: extractMeta(sample) };
  }
}

module.exports = { fetchRsData, normalize, parseLooseJson, extractMeta };

// 단독 실행 시
if (require.main === module) {
  require('./lib/util').loadEnv();
  fetchRsData().then((r) => {
    console.log(`source=${r.source}, rows=${r.rows.length}`);
    console.log('첫 종목 샘플:', JSON.stringify(r.rows[0], null, 2).slice(0, 500));
  });
}
