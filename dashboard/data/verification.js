window.VERIFY_DATA = {
  "last_run": "2026-07-11 (v2 · heavy · RS개선)",
  "mode": "heavy",
  "picked": [],
  "models": [
    { "name": "Opus", "ko": "오퍼스", "role": "심의위원장 · 시장판단 · 펀더멘털 · 악마의변호인 · 최종판정" },
    { "name": "Sonnet", "ko": "소넷", "role": "기술적 · 모멘텀 구조 검증" },
    { "name": "Haiku", "ko": "하이쿠", "role": "팩트체크(함정 거르기) · 촉매/테마" }
  ],
  "market": {
    "regime": "risk_on",
    "invest_ok": true,
    "note": "진입 환경 자체는 우호적(QQQ 상승추세·상대강도 우위·VIX 15). 단 7/29 FOMC(인상 확률 25%)·물가 4.2%는 역풍 — 개별 셋업이 유효할 때만 의미"
  },
  "scores": [
    { "ticker": "AMD", "avg": 62, "recommend": "2/3", "fact": "clear", "veto": true,
      "votes": [
        { "model": "opus", "score": 71, "recommend": true, "opinion": "실적 가속 뚜렷 — 매출 42.8%→55.4% 재가속, 데이터센터 +57%, 내년 EPS +78%. RS 최상위." },
        { "model": "sonnet", "score": 58, "recommend": false, "opinion": "rs1=0.15로 1개월 상대강도 소멸, 거래량 평균 이하, brk60=NO — 돌파 없음." },
        { "model": "haiku", "score": 58, "recommend": true, "opinion": "AI/데이터센터 슈퍼사이클, MI450 GPU 촉매. 단 이미 +138% 급등." }
      ],
      "devil": { "veto": true, "reason": "응봉(폭발 돌파) 진입 조건 미성립 — brk60=NO(신고가 돌파 없음)·volx 0.9(거래량 평균 이하). 매집도 돌파도 없이 +138% 꼬리 추격." } },
    { "ticker": "PANW", "avg": 50, "recommend": "0/3", "fact": "caution", "veto": true,
      "votes": [
        { "model": "opus", "score": 58, "recommend": false, "opinion": "매출 감속(23.9%→20.7%)·내년 EPS 역성장(-48%, CyberArk 인수 희석)." },
        { "model": "sonnet", "score": 38, "recommend": false, "opinion": "단기 모멘텀 급락(RS3 1.08→RS1 0.3), 상승 탄력 소진." },
        { "model": "haiku", "score": 55, "recommend": false, "opinion": "증권사기 집단소송 진행·주식 희석. 사상 최고가 근접." }
      ],
      "devil": { "veto": true, "reason": "이익 훼손(내년 EPS 역성장) + 모멘텀 소진 동시 발생 — 매출 감속과 겹침." } },
    { "ticker": "FLXS", "avg": 50, "recommend": "0/3", "fact": "clear", "veto": true,
      "votes": [
        { "model": "opus", "score": 46, "recommend": false, "opinion": "매출 정체(CY+2.8%·NY+3.9%)·Q3 매출 예상 하회." },
        { "model": "sonnet", "score": 47, "recommend": false, "opinion": "rs6→rs3→rs1 단기로 갈수록 둔화 — '폭발 후 식는' 패턴." },
        { "model": "haiku", "score": 57, "recommend": false, "opinion": "6개월 +86% 과매수·3개월 고점서 하락 중·Q3 미스." }
      ],
      "devil": { "veto": true, "reason": "이미 폭발을 끝낸 상태(6개월 +86%), 52주 고점 대비 -22.8% 되돌림 중. 신규 돌파 부재." } },
    { "ticker": "ORKA", "avg": 46, "recommend": "0/3", "fact": "caution", "veto": true,
      "votes": [
        { "model": "opus", "score": 32, "recommend": false, "opinion": "상용 매출 0(saleCY·NY 모두 0)·EPS 적자·근거 취약." },
        { "model": "sonnet", "score": 38, "recommend": false, "opinion": "RS 급둔화(1.76→0.44→0.32), 거래량 평균의 31%." },
        { "model": "haiku", "score": 68, "recommend": false, "opinion": "CFO 대량 주식 매도·Going Concern 우려·상용 수익 0." }
      ],
      "devil": { "veto": true, "reason": "모멘텀 소진 + 이진(binary) 생존 리스크 결합. 52주 신고가 바로 밑서 거래량 실종." } },
    { "ticker": "SNEX", "avg": 33, "recommend": "0/3", "fact": "caution", "veto": true,
      "votes": [
        { "model": "opus", "score": 34, "recommend": false, "opinion": "내년 EPS +3.7%로 급감 — 이익 성장 정점 통과 신호." },
        { "model": "sonnet", "score": 28, "recommend": false, "opinion": "RS 0.82→0.23→0.005로 사실상 소멸, 모멘텀 꺾임." },
        { "model": "haiku", "score": 38, "recommend": false, "opinion": "Forward P/E 21x(산업 2배) 고평가·$1B+ 규제 리스크." }
      ],
      "devil": { "veto": true, "reason": "모멘텀·셋업 소멸 + brk60=NO. 응봉 돌파 진입 근거 자체가 성립 안 함." } }
  ],
  "final": {
    "invest": false,
    "picks": 0,
    "note": "시장은 우호적(risk_on)이나 5종목 전부 veto → 0종목. 공통 결함: 회사는 좋아도(AMD·FLXS 팩트 clear) '응봉 돌파 진입 트리거'가 없음 — 전부 60일 신고가 돌파 부재(brk60 NO), 단기 RS 소멸(rs6→rs1 급감), 급등 직후 이격/조정. 즉 '돌파 시작점'이 아니라 '이미 지나간 폭발의 꼬리 추격'. 7/29 FOMC 이벤트 직전이라 셋업 불명확 진입은 손익비 역전."
  },
  "top_watch": "AMD — 1순위 감시. 펀더멘털 최상급(팩트 clear, 데이터센터 +57%, 내년 EPS+78%, RS 상위 1.3%). 단 지금은 +138% 급등 후 숨고르기라 추격 금지. '거래량 동반 60일 신고가 돌파'(7/22 AI행사·8/4 실적 이후) 확인 시 진입."
};
