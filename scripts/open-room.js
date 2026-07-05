'use strict';
// 미니룸 HTML을 기본 브라우저로 열기 (크로스플랫폼)

const { spawn } = require('child_process');
const { paths, say } = require('./lib/util');
const fs = require('fs');

function openInBrowser(target) {
  const plt = process.platform;
  try {
    if (plt === 'win32') {
      // start 는 셸 내장 → cmd 경유. 첫 인자는 창 제목(빈 문자열)
      spawn('cmd', ['/c', 'start', '', target], { detached: true, stdio: 'ignore' }).unref();
    } else if (plt === 'darwin') {
      spawn('open', [target], { detached: true, stdio: 'ignore' }).unref();
    } else {
      spawn('xdg-open', [target], { detached: true, stdio: 'ignore' }).unref();
    }
    return true;
  } catch (e) {
    say('SYSTEM', `브라우저 자동 오픈 실패: ${e.message}`);
    return false;
  }
}

function openRoom() {
  if (!fs.existsSync(paths.dashboardHtml)) {
    say('SYSTEM', `대시보드 파일 없음: ${paths.dashboardHtml}`);
    return false;
  }
  say('SYSTEM', `미니룸 여는 중… 🏠  ${paths.dashboardHtml}`);
  return openInBrowser(paths.dashboardHtml);
}

module.exports = { openRoom, openInBrowser };

if (require.main === module) {
  openRoom();
}
