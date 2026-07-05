# ⚙️ 설정 가이드 (한 번만 하면 됩니다)

## 0. 지금 바로 실행해보기 (설정 없이도 됨)

```bash
cd investment-agent-team
npm run start-investment
```

- Telegram/GitHub 설정이 없어도 **미니룸 + 매매일지 + 포트폴리오**는 정상 동작합니다.
- 실행하면 브라우저에 미니룸이 자동으로 열립니다.
- "start investment"라고 저(클로드)에게 말해도 실행됩니다.

---

## 1. 📱 Telegram 봇 설정 (CEO RICH 보고용)

### 1-1. 봇 만들기
1. Telegram 앱에서 **@BotFather** 검색 → 대화 시작
2. `/newbot` 입력
3. 봇 이름 입력 (예: `CEO RICH 투자보고`)
4. 봇 사용자명 입력 (예: `rich_invest_bot` — 반드시 `bot`으로 끝나야 함)
5. BotFather가 **토큰**을 줍니다 → 복사
   ```
   예: 8123456789:AAH8x-kQv1u2w3e4r5t6y7u8i9o0p1a2s3d
   ```

### 1-2. 내 Chat ID 확인
1. 방금 만든 봇을 검색 → 대화창에서 아무 메시지나 전송 (예: `안녕`)
2. 브라우저에서 아래 주소 열기 (`<토큰>` 자리에 위 토큰 입력):
   ```
   https://api.telegram.org/bot<토큰>/getUpdates
   ```
3. 결과에서 `"chat":{"id":123456789` 숫자가 **Chat ID**입니다.

### 1-3. .env 파일에 입력
```bash
cp .env.example .env
```
`.env` 파일을 열어 입력:
```
TELEGRAM_BOT_TOKEN=8123456789:AAH8x-kQv1u2w3e4r5t6y7u8i9o0p1a2s3d
TELEGRAM_CHAT_ID=123456789
```

### 1-4. 연결 테스트
```bash
npm run test-telegram
```
→ Telegram에 "연결 테스트 성공" 메시지가 오면 완료! 👑

> ⚠️ `.env`는 절대 GitHub에 올리지 마세요. (`.gitignore`에 이미 제외돼 있습니다)

---

## 2. 🐙 GitHub 저장소 + Pages 배포

### 방법 A — gh CLI (가장 쉬움)
```bash
# GitHub CLI 로그인 (최초 1회)
gh auth login

# 저장소 생성 + 첫 커밋 + 푸시
cd investment-agent-team
git init
git add -A
git commit -m "feat: AI 투자팀 초기 구축"
gh repo create investment-agent-team --public --source=. --push
```

### 방법 B — 웹에서 수동
1. https://github.com/new 에서 `investment-agent-team` 저장소 생성 (Public)
2. 터미널에서:
   ```bash
   cd investment-agent-team
   git init
   git add -A
   git commit -m "feat: AI 투자팀 초기 구축"
   git branch -M main
   git remote add origin https://github.com/305rhfueo/investment-agent-team.git
   git push -u origin main
   ```

### 2-1. GitHub Pages 켜기 (미니룸 상시 관람)
1. 저장소 → **Settings** → **Pages**
2. Source: `Deploy from a branch` → Branch: `main` / `/ (root)` → Save
3. 몇 분 뒤 미니룸 주소:
   ```
   https://305rhfueo.github.io/investment-agent-team/dashboard/minimi-room.html
   ```

이후 `npm run start-investment`를 돌리면 자동으로 커밋·푸시되어 위 주소에서 최신 상태를 볼 수 있습니다. (git 원격이 연결돼 있을 때)

---

## 3. 🚀 매일 사용법

```bash
npm run start-investment
```
또는 저(클로드)에게 **"start investment"** 라고 말하기.

그러면:
1. Alex가 RS 데이터 스크리닝 → 종목 추천
2. Sara·Jordan이 포지션·거래 기록
3. Morgan이 매매일지 검토 (주기 도래 시 전략 진화)
4. 미니룸이 브라우저에 열림 🏠
5. RICH가 Telegram으로 보고 👑
6. GitHub에 자동 저장

---

## 4. 폴더별 결과물 확인

| 폴더 | 내용 |
|------|------|
| `dashboard/minimi-room.html` | 🏠 미니룸 (더블클릭하면 언제든 열림) |
| `portfolio/performance.json` | 💰 누적 수익률·보유·청산 내역 |
| `trading-journal/` | 📓 일자별 매매일지 |
| `analysis/stock-recommendations/` | 📊 종목추천 + 기업분석 |
| `analysis/team-insights/` | 🔍 전략 진화 리포트 |
| `strategy/` | 🧬 살아있는 전략 (버전별) |

---

## 자주 묻는 질문

**Q. 노트북을 꺼두면 그 사이 시세는?**
A. 다음에 `start investment`를 실행할 때 최신 시세로 한 번에 갱신됩니다. 수동 트리거 방식이라 정상입니다.

**Q. 브라우저 자동 오픈을 끄려면?**
A. `NO_OPEN=1 npm run start-investment`

**Q. 실제 돈이 나가나요?**
A. 아니요. 100% 모의투자입니다. 교육·훈련용이며 투자조언이 아닙니다.
