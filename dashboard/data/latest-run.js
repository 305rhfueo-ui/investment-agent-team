window.RUN_DATA = {
  "run_date": "2026-07-12 (데모)",
  "generated_note": "이 파일은 start-investment 실행 시 자동 생성됩니다.",
  "market_light": "green",
  "source": "simulation",
  "strategy_version": 1,
  "hud": {
    "initial_capital": 100000,
    "equity": 101969.27,
    "cash": 95614.82,
    "total_return_pct": 1.97,
    "holdings_count": 1,
    "wins": 4,
    "losses": 2,
    "max_drawdown": -1.04
  },
  "holdings": [
    {
      "symbol": "VIRT",
      "qty": 81,
      "entry": 61.77000045776367,
      "current": 78.45,
      "pnl_pct": 27,
      "strategy": "eungbong"
    }
  ],
  "recommendations": [],
  "timeline": [
    {
      "agent": "Alex",
      "action": "walk",
      "msg": "좋은 아침입니다 팀! 오늘 시장 신호등 확인할게요.",
      "phase": "분석",
      "t": 0
    },
    {
      "agent": "Alex",
      "action": "talk",
      "msg": "QQQ 상태 점검 → 🟢 초록불. 신규 진입 가능!",
      "phase": "분석",
      "t": 1
    },
    {
      "agent": "Alex",
      "action": "talk",
      "msg": "활성 전략 v1 로드 완료. RS 데이터 1412개 스크리닝 시작!",
      "phase": "분석",
      "t": 2
    },
    {
      "agent": "Alex",
      "action": "talk",
      "msg": "오늘은 조건을 만족하는 종목이 없네요. 무리하지 않겠습니다.",
      "phase": "분석",
      "t": 3
    },
    {
      "agent": "Sara",
      "action": "walk",
      "msg": "제가 포지션 사이징 들어갈게요. 거래당 리스크 2% 원칙!",
      "phase": "리스크",
      "t": 4
    },
    {
      "agent": "Sara",
      "action": "talk",
      "msg": "조건 맞는 신규 진입이 없어 관망합니다.",
      "phase": "리스크",
      "t": 5
    },
    {
      "agent": "Jordan",
      "action": "walk",
      "msg": "기록 담당 조던입니다. 매매일지에 남길게요 ✍️",
      "phase": "거래",
      "t": 6
    },
    {
      "agent": "Jordan",
      "action": "talk",
      "msg": "현재 보유 1종목, 현금 $95,614.82.",
      "phase": "거래",
      "t": 7
    },
    {
      "agent": "Morgan",
      "action": "walk",
      "msg": "전략가 모건이에요. 매매일지 돌아볼게요 📖",
      "phase": "검토",
      "t": 8
    },
    {
      "agent": "Morgan",
      "action": "talk",
      "msg": "누적 수익률 +1.97% · 승 4 / 패 2. 이번엔 정기 리뷰 주기 아니라 관찰만 합니다.",
      "phase": "검토",
      "t": 9
    },
    {
      "agent": "RICH",
      "action": "walk",
      "msg": "CEO 리치다. 좋았어 팀! 사장님께 보고 들어간다 👑",
      "phase": "보고",
      "t": 10
    },
    {
      "agent": "RICH",
      "action": "talk",
      "msg": "오늘 추천 0종목, 누적 수익률 +1.97%. 텔레그램 발사! 🚀",
      "phase": "보고",
      "t": 11
    },
    {
      "agent": "RICH",
      "action": "talk",
      "msg": "목표는 월 20~30%! 우리 사장님 부자 만들 때까지 달린다 💪🔥",
      "phase": "보고",
      "t": 12
    }
  ]
};
