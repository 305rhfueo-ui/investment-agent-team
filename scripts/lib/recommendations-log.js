'use strict';
// 추천 트래킹 로그 — 낸 추천을 JSONL로 기록하고, 나중에 성과(오름/내림)로 대조.
// forward 실적 기반 정직한 검증(백테스트 대체 아님). append-only.

const fs = require('fs');
const path = require('path');
const { paths, ensureDir, today } = require('./util');

const LOG = path.join(paths.root, 'analysis', 'recommendations-log.jsonl');

function append(rec) {
  ensureDir(path.dirname(LOG));
  const line = JSON.stringify({ date: rec.date || today(), ...rec }) + '\n';
  fs.appendFileSync(LOG, line, 'utf8');
}

// 여러 추천 한번에
function appendMany(recs) {
  for (const r of recs) append(r);
}

function readAll() {
  if (!fs.existsSync(LOG)) return [];
  return fs.readFileSync(LOG, 'utf8').split(/\r?\n/).filter(Boolean).map((l) => {
    try { return JSON.parse(l); } catch (e) { return null; }
  }).filter(Boolean);
}

// 성과 갱신: priceMap = {TICKER: currentPrice}. 각 추천의 진입가 대비 수익률 계산 요약.
function evaluate(priceMap) {
  const recs = readAll();
  const scored = recs.map((r) => {
    const cur = priceMap[(r.ticker || '').toUpperCase()];
    const entry = Number(r.price);
    const ret = cur != null && entry > 0 ? ((cur - entry) / entry) * 100 : null;
    return { ...r, current: cur != null ? cur : null, return_pct: ret != null ? Math.round(ret * 100) / 100 : null };
  });
  const done = scored.filter((s) => s.return_pct != null);
  const wins = done.filter((s) => s.return_pct > 0).length;
  const byTier = {};
  for (const s of done) {
    const k = s.tier || '기타';
    if (!byTier[k]) byTier[k] = { n: 0, wins: 0, avg: 0 };
    byTier[k].n++; if (s.return_pct > 0) byTier[k].wins++; byTier[k].avg += s.return_pct;
  }
  for (const k of Object.keys(byTier)) byTier[k].avg = Math.round((byTier[k].avg / byTier[k].n) * 100) / 100;
  return {
    total: recs.length, evaluated: done.length,
    win_rate: done.length ? Math.round((wins / done.length) * 1000) / 10 : null,
    avg_return: done.length ? Math.round((done.reduce((a, s) => a + s.return_pct, 0) / done.length) * 100) / 100 : null,
    byTier, items: scored,
  };
}

module.exports = { append, appendMany, readAll, evaluate, LOG };
