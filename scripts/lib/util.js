'use strict';
// 공통 유틸 — 의존성 제로 (Node 18+ 내장 기능만 사용)

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');

const paths = {
  root: ROOT,
  strategyJson: path.join(ROOT, 'strategy', 'active-strategy.json'),
  strategyMd: path.join(ROOT, 'strategy', 'active-strategy.md'),
  strategyHistory: path.join(ROOT, 'strategy', 'history'),
  performance: path.join(ROOT, 'portfolio', 'performance.json'),
  realAccounts: path.join(ROOT, 'portfolio', 'real-accounts.json'),
  journalDir: path.join(ROOT, 'trading-journal'),
  recDir: path.join(ROOT, 'analysis', 'stock-recommendations'),
  insightsDir: path.join(ROOT, 'analysis', 'team-insights'),
  dashboardData: path.join(ROOT, 'dashboard', 'data', 'latest-run.json'),
  dashboardHtml: path.join(ROOT, 'dashboard', 'minimi-room.html'),
  sampleData: path.join(ROOT, 'scripts', 'lib', 'sample-rs-data.json'),
};

// .env 파일을 process.env 로 로드 (dotenv 없이)
function loadEnv() {
  const envPath = path.join(ROOT, '.env');
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = val;
  }
}

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    return fallback;
  }
}

function writeJson(file, obj) {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, JSON.stringify(obj, null, 2) + '\n', 'utf8');
}

function writeText(file, text) {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, text, 'utf8');
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

// 날짜 (실행 시점에 주입 — 스크립트 상단에서 한 번만 계산)
function today() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function money(n) {
  return '$' + Number(n).toLocaleString('en-US', { maximumFractionDigits: 2 });
}

function pct(n, digits = 2) {
  const v = Number(n);
  return (v >= 0 ? '+' : '') + v.toFixed(digits) + '%';
}

// RS 순위(백분위, 높을수록 강함) → "상위 N%" 표기
function topPct(rsRank) {
  if (rsRank === null || rsRank === undefined) return '—';
  return (100 - Number(rsRank)).toFixed(1);
}

// 콘솔 컬러 (미니미별)
const AGENT_COLORS = {
  Alex: '\x1b[36m', Sara: '\x1b[35m', Jordan: '\x1b[33m',
  Morgan: '\x1b[32m', RICH: '\x1b[91m', SYSTEM: '\x1b[90m',
};
const RESET = '\x1b[0m';

function say(agent, msg) {
  const c = AGENT_COLORS[agent] || '';
  console.log(`${c}[${agent}]${RESET} ${msg}`);
}

module.exports = {
  paths, loadEnv, readJson, writeJson, writeText, ensureDir,
  today, money, pct, topPct, say,
};
