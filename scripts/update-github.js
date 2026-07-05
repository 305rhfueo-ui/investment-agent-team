'use strict';
// 실행 결과를 git 커밋(+푸시). git 미설정/원격 없음이면 우아하게 건너뜀.

const { execFileSync } = require('child_process');
const { paths, say } = require('./lib/util');

function git(args, opts = {}) {
  return execFileSync('git', args, { cwd: paths.root, encoding: 'utf8', stdio: opts.silent ? 'pipe' : 'pipe' }).trim();
}

function isRepo() {
  try { git(['rev-parse', '--is-inside-work-tree']); return true; } catch { return false; }
}

function hasRemote() {
  try { return git(['remote']).length > 0; } catch { return false; }
}

function commitAndPush(dateStr, summary) {
  if (!isRepo()) {
    say('SYSTEM', 'git 저장소 아님 → 커밋 건너뜀. (git init 후 원격 연결하면 자동 저장됩니다)');
    return { committed: false, reason: 'not_a_repo' };
  }
  try {
    git(['add', '-A']);
    // 변경 없으면 스킵
    const status = git(['status', '--porcelain']);
    if (!status) { say('SYSTEM', '변경 사항 없음 → 커밋 스킵'); return { committed: false, reason: 'no_changes' }; }
    const msg = `chore(run): ${dateStr} 투자 실행 — ${summary}`;
    git(['commit', '-m', msg]);
    say('SYSTEM', `git 커밋 완료: ${msg}`);
    if (hasRemote()) {
      try { git(['push']); say('SYSTEM', 'git push 완료 → GitHub Pages 반영'); }
      catch (e) { say('SYSTEM', `push 실패(${e.message.split('\n')[0]}) — 로컬 커밋은 저장됨`); }
    } else {
      say('SYSTEM', '원격(remote) 없음 → 로컬 커밋만. GitHub 연결 후 push 하세요.');
    }
    return { committed: true };
  } catch (e) {
    say('SYSTEM', `커밋 실패: ${e.message.split('\n')[0]} (무시하고 진행)`);
    return { committed: false, reason: e.message };
  }
}

module.exports = { commitAndPush, isRepo, hasRemote };
