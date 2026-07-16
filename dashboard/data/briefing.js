window.BRIEFING_DATA = {
  "generated": "2026-07-16",
  "market": {
    "light": "green",
    "invest_ok": true,
    "index": {
      "ticker": "QQQ",
      "price": 717.74,
      "m10": {
        "ma": 661.78,
        "dir": "up",
        "dirKo": "상승↑",
        "pct": 6
      },
      "w30": {
        "ma": 655.92,
        "dir": "up",
        "dirKo": "상승↑",
        "pct": 2,
        "priceAbove": true
      },
      "stage": "Stage 2 강세장",
      "국면": "최강 제2단계",
      "action": "적극 매수·홀딩(비중 최대)",
      "light": "green",
      "invest_ok": true,
      "posture": "aggressive"
    },
    "risk_sensor": {
      "ticker": "ARKK",
      "price": 79.6,
      "m10": {
        "ma": 76.98,
        "dir": "flat",
        "dirKo": "횡보→",
        "pct": -1.3
      },
      "w30": {
        "ma": 75.65,
        "dir": "flat",
        "dirKo": "횡보→",
        "pct": -0.1,
        "priceAbove": true
      },
      "stage": "Stage 1/3 전환기",
      "국면": "방향성 탐색(박스권)",
      "action": "관망 — 위/아래 방향 대기",
      "light": "yellow",
      "invest_ok": false,
      "posture": "wait"
    },
    "market_condition": "BAD",
    "breadth_pct": 71.9,
    "note": "📐 QQQ 매트릭스: 월봉10 상승↑·주봉30 상승↑·가격 >주봉30 → 【최강 제2단계】 → 적극 매수·홀딩(비중 최대) (위험선호 ARKK: 관망 · 사이트 BAD·200일선위 71.9%)"
  },
  "overheat": {
    "count": 1393,
    "over150": 3,
    "over100": 11,
    "max": 230.93
  },
  "leading_sectors": [
    {
      "name": "Technology",
      "count": 31,
      "tickers": [
        "MGRT",
        "BAND",
        "MXL",
        "PENG",
        "DELL",
        "SNDK"
      ],
      "sharePct": 62
    },
    {
      "name": "Healthcare",
      "count": 12,
      "tickers": [
        "AGL",
        "SYRE",
        "CORT",
        "HNGE",
        "LQDA",
        "ORKA"
      ],
      "sharePct": 24
    },
    {
      "name": "Industrials",
      "count": 2,
      "tickers": [
        "CDNL",
        "XMTR"
      ],
      "sharePct": 4
    },
    {
      "name": "Communication Services",
      "count": 1,
      "tickers": [
        "ATEX"
      ],
      "sharePct": 2
    },
    {
      "name": "Financial Services",
      "count": 1,
      "tickers": [
        "SEZL"
      ],
      "sharePct": 2
    }
  ],
  "leading_stocks": [
    {
      "ticker": "MGRT",
      "sector": "Technology",
      "industry": "Information Technology Services",
      "rsPct": 100,
      "price": 74.9800033569336,
      "div200": 100,
      "overheat": {
        "status": "normal",
        "label": "정상(100%)",
        "div200": 100
      }
    },
    {
      "ticker": "AGL",
      "sector": "Healthcare",
      "industry": "Medical Care Facilities",
      "rsPct": 99.92805755395683,
      "price": 124.29000091552734,
      "div200": 230.93,
      "overheat": {
        "status": "overheat",
        "label": "🔥과열(+231%)",
        "div200": 230.93,
        "note": "분할 차익검토(유동성 −면 최대 1/2·신규중단, +면 1/3+트레일링). 전량매도 금지"
      }
    },
    {
      "ticker": "BAND",
      "sector": "Technology",
      "industry": "Software - Infrastructure",
      "rsPct": 99.85611510791367,
      "price": 70.97000122070312,
      "div200": 162.99,
      "overheat": {
        "status": "overheat",
        "label": "🔥과열(+163%)",
        "div200": 162.99,
        "note": "분할 차익검토(유동성 −면 최대 1/2·신규중단, +면 1/3+트레일링). 전량매도 금지"
      }
    },
    {
      "ticker": "MXL",
      "sector": "Technology",
      "industry": "Semiconductors",
      "rsPct": 99.78417266187051,
      "price": 88.83999633789062,
      "div200": 136.83,
      "overheat": {
        "status": "normal",
        "label": "정상(137%)",
        "div200": 136.83
      }
    },
    {
      "ticker": "ATEX",
      "sector": "Communication Services",
      "industry": "Telecom Services",
      "rsPct": 99.71223021582733,
      "price": 105.33999633789062,
      "div200": 163.01,
      "overheat": {
        "status": "overheat",
        "label": "🔥과열(+163%)",
        "div200": 163.01,
        "note": "분할 차익검토(유동성 −면 최대 1/2·신규중단, +면 1/3+트레일링). 전량매도 금지"
      }
    },
    {
      "ticker": "PENG",
      "sector": "Technology",
      "industry": "Information Technology Services",
      "rsPct": 99.64028776978418,
      "price": 72.8499984741211,
      "div200": 136.61,
      "overheat": {
        "status": "normal",
        "label": "정상(137%)",
        "div200": 136.61
      }
    },
    {
      "ticker": "DELL",
      "sector": "Technology",
      "industry": "Computer Hardware",
      "rsPct": 99.568345323741,
      "price": 412.67999267578125,
      "div200": 108.28,
      "overheat": {
        "status": "normal",
        "label": "정상(108%)",
        "div200": 108.28
      }
    },
    {
      "ticker": "SEZL",
      "sector": "Financial Services",
      "industry": "Credit Services",
      "rsPct": 99.49640287769785,
      "price": 188.5500030517578,
      "div200": 120.93,
      "overheat": {
        "status": "normal",
        "label": "정상(121%)",
        "div200": 120.93
      }
    },
    {
      "ticker": "SNDK",
      "sector": "Technology",
      "industry": "Computer Hardware",
      "rsPct": 99.42446043165467,
      "price": 1615,
      "div200": 110.02,
      "overheat": {
        "status": "normal",
        "label": "정상(110%)",
        "div200": 110.02
      }
    },
    {
      "ticker": "AMBQ",
      "sector": "Technology",
      "industry": "Semiconductors",
      "rsPct": 99.35251798561151,
      "price": 82.22000122070312,
      "div200": 99.32,
      "overheat": {
        "status": "normal",
        "label": "정상(99%)",
        "div200": 99.32
      }
    }
  ],
  "tiers": {
    "tier1": {
      "label": "🚀 돌파 확인 종목",
      "note": "차트에서 \"저항선을 강한 거래량과 함께 돌파\"했는지 확인 후 매수",
      "items": []
    },
    "tier2": {
      "label": "👀 관찰 종목",
      "note": "아직 미돌파(눌림목)지만 RS 주도·실적 강함 → 돌파 시 매수 대기",
      "items": [
        {
          "ticker": "PENG",
          "sector": "Technology",
          "industry": "Information Technology Services",
          "price": 72.8499984741211,
          "rsTop": "0.4",
          "volx": 1.96,
          "div50": 22.2,
          "div10": 0.24,
          "adr": 13.13,
          "high52": 81.07,
          "overheat": {
            "status": "normal",
            "label": "정상(137%)",
            "div200": 136.61
          },
          "chart": "https://finviz.com/quote.ashx?t=PENG",
          "strategy": "eungbong",
          "reasons": [
            "RS 상위 0.4%",
            "50이격 22.2% (≤30)",
            "정배열 20>60>120"
          ],
          "ta": {
            "price": 72.85,
            "ma50": 59.61,
            "distMA50": 22.2,
            "near50": false,
            "pullbackFromHigh": -18.93,
            "resistance": 73.24,
            "brokeResistance": false,
            "contraction": 1.36,
            "trend": "up",
            "summary": "PENG $72.85 · 고점대비 -18.93% 되돌림 · 50일선 대비 +22.2% · 200일선 위(136.61%) · 저항 $73.24 미돌파 · 확장(1.36) · 월봉10MA 위 · 추세 up"
          }
        },
        {
          "ticker": "DDOG",
          "sector": "Technology",
          "industry": "Software - Application",
          "price": 264.4599914550781,
          "rsTop": "1.0",
          "volx": 0.68,
          "div50": 15.67,
          "div10": 0.94,
          "adr": 5.33,
          "high52": 94.89,
          "overheat": {
            "status": "normal",
            "label": "정상(64%)",
            "div200": 64.17
          },
          "chart": "https://finviz.com/quote.ashx?t=DDOG",
          "strategy": "eungbong",
          "reasons": [
            "RS 상위 1.0%",
            "50이격 15.67% (≤30)",
            "정배열 20>60>120"
          ],
          "ta": {
            "price": 264.46,
            "ma50": 228.63,
            "distMA50": 15.67,
            "near50": false,
            "pullbackFromHigh": -5.11,
            "resistance": 278.7,
            "brokeResistance": false,
            "contraction": 1.22,
            "trend": "up",
            "summary": "DDOG $264.46 · 고점대비 -5.11% 되돌림 · 50일선 대비 +15.67% · 200일선 위(64.17%) · 저항 $278.7 미돌파 · 확장(1.22) · 월봉10MA 위 · 추세 up"
          }
        },
        {
          "ticker": "HNGE",
          "sector": "Healthcare",
          "industry": "Health Information Services",
          "price": 85.75,
          "rsTop": "1.4",
          "volx": 0.85,
          "div50": 28.67,
          "div10": -2.47,
          "adr": 4.93,
          "high52": 93.72,
          "overheat": {
            "status": "normal",
            "label": "정상(71%)",
            "div200": 71.33
          },
          "chart": "https://finviz.com/quote.ashx?t=HNGE",
          "strategy": "eungbong",
          "reasons": [
            "RS 상위 1.4%",
            "50이격 28.67% (≤30)",
            "정배열 20>60>120"
          ],
          "ta": {
            "price": 85.75,
            "ma50": 66.64,
            "distMA50": 28.67,
            "near50": false,
            "pullbackFromHigh": -6.28,
            "resistance": null,
            "brokeResistance": false,
            "contraction": 0.97,
            "trend": "up",
            "summary": "HNGE $85.75 · 고점대비 -6.28% 되돌림 · 50일선 대비 +28.67% · 200일선 위(71.33%) ·  · 약수축(0.97) · 월봉10MA 위 · 추세 up"
          }
        },
        {
          "ticker": "AMD",
          "sector": "Technology",
          "industry": "Semiconductors",
          "price": 529.1400146484375,
          "rsTop": "1.6",
          "volx": 0.94,
          "div50": 7.31,
          "div10": -1.29,
          "adr": 5.89,
          "high52": 90.49,
          "overheat": {
            "status": "normal",
            "label": "정상(80%)",
            "div200": 80.4
          },
          "chart": "https://finviz.com/quote.ashx?t=AMD",
          "strategy": "eungbong",
          "reasons": [
            "RS 상위 1.6%",
            "50이격 7.31% (≤30)",
            "정배열 20>60>120"
          ],
          "ta": {
            "price": 529.14,
            "ma50": 493.09,
            "distMA50": 7.31,
            "near50": false,
            "pullbackFromHigh": -9.51,
            "resistance": 546.44,
            "brokeResistance": false,
            "contraction": 1.01,
            "trend": "up",
            "summary": "AMD $529.14 · 고점대비 -9.51% 되돌림 · 50일선 대비 +7.31% · 200일선 위(80.4%) · 저항 $546.44 미돌파 · 확장(1.01) · 월봉10MA 위 · 추세 up"
          }
        },
        {
          "ticker": "ORKA",
          "sector": "Healthcare",
          "industry": "Biotechnology",
          "price": 86.6500015258789,
          "rsTop": "2.1",
          "volx": 0.46,
          "div50": 21.51,
          "div10": 0.26,
          "adr": 6.27,
          "high52": 88.62,
          "overheat": {
            "status": "normal",
            "label": "정상(94%)",
            "div200": 93.59
          },
          "chart": "https://finviz.com/quote.ashx?t=ORKA",
          "strategy": "eungbong",
          "reasons": [
            "RS 상위 2.1%",
            "50이격 21.51% (≤30)",
            "정배열 20>60>120"
          ],
          "ta": {
            "price": 86.65,
            "ma50": 71.31,
            "distMA50": 21.51,
            "near50": false,
            "pullbackFromHigh": -11.38,
            "resistance": 91,
            "brokeResistance": false,
            "contraction": 0.9,
            "trend": "up",
            "summary": "ORKA $86.65 · 고점대비 -11.38% 되돌림 · 50일선 대비 +21.51% · 200일선 위(93.59%) · 저항 $91 미돌파 · 약수축(0.9) · 월봉10MA 위 · 추세 up"
          }
        },
        {
          "ticker": "NWPX",
          "sector": "Basic Materials",
          "industry": "Steel",
          "price": 135.11000061035156,
          "rsTop": "2.8",
          "volx": 0.68,
          "div50": 7.45,
          "div10": -1.02,
          "adr": 4.96,
          "high52": 88.87,
          "overheat": {
            "status": "normal",
            "label": "정상(65%)",
            "div200": 64.76
          },
          "chart": "https://finviz.com/quote.ashx?t=NWPX",
          "strategy": "eungbong",
          "reasons": [
            "RS 상위 2.8%",
            "50이격 7.45% (≤30)",
            "정배열 20>60>120"
          ],
          "ta": {
            "price": 135.11,
            "ma50": 125.75,
            "distMA50": 7.45,
            "near50": false,
            "pullbackFromHigh": -11.13,
            "resistance": 152.03,
            "brokeResistance": false,
            "contraction": 1.18,
            "trend": "up",
            "summary": "NWPX $135.11 · 고점대비 -11.13% 되돌림 · 50일선 대비 +7.45% · 200일선 위(64.76%) · 저항 $152.03 미돌파 · 확장(1.18) · 월봉10MA 위 · 추세 up"
          }
        }
      ]
    }
  },
  "holdings_review": {
    "long": {
      "name": "장기용 (장독대)",
      "holdings": [
        {
          "ticker": "MU",
          "name": "마이크론",
          "pnl_pct": 78.2,
          "weight_pct": 50.4,
          "inUniverse": true,
          "div200": 89.97,
          "overheat": {
            "status": "normal",
            "label": "정상(90%)",
            "div200": 89.97
          },
          "rsTop": "1.2",
          "div50": -2.12,
          "advice": "홀딩",
          "note": "월봉10MA·주봉 넥라인 이탈 여부는 차트 직접 확인",
          "humanCheck": "월봉 10MA / 주봉 헤드앤숄더 넥라인"
        },
        {
          "ticker": "TSLA",
          "name": "테슬라",
          "pnl_pct": 40.1,
          "weight_pct": 24.9,
          "inUniverse": true,
          "div200": -5.54,
          "overheat": {
            "status": "normal",
            "label": "정상(-6%)",
            "div200": -5.54
          },
          "rsTop": "77.3",
          "div50": -3.79,
          "advice": "홀딩",
          "note": "월봉10MA·주봉 넥라인 이탈 여부는 차트 직접 확인",
          "humanCheck": "월봉 10MA / 주봉 헤드앤숄더 넥라인"
        },
        {
          "ticker": "TER",
          "name": "테라다인",
          "pnl_pct": -22.44,
          "weight_pct": 7.6,
          "inUniverse": true,
          "div200": 23.54,
          "overheat": {
            "status": "normal",
            "label": "정상(24%)",
            "div200": 23.54
          },
          "rsTop": "35.6",
          "div50": -10.36,
          "advice": "홀딩",
          "note": "월봉10MA·주봉 넥라인 이탈 여부는 차트 직접 확인",
          "humanCheck": "월봉 10MA / 주봉 헤드앤숄더 넥라인"
        },
        {
          "ticker": "KLAC",
          "name": "KLA",
          "pnl_pct": -22.23,
          "weight_pct": 6.3,
          "inUniverse": true,
          "div200": 43.36,
          "overheat": {
            "status": "normal",
            "label": "정상(43%)",
            "div200": 43.36
          },
          "rsTop": "12.2",
          "div50": 4.02,
          "advice": "홀딩",
          "note": "월봉10MA·주봉 넥라인 이탈 여부는 차트 직접 확인",
          "humanCheck": "월봉 10MA / 주봉 헤드앤숄더 넥라인"
        },
        {
          "ticker": "IBM",
          "name": "IBM",
          "pnl_pct": -29.66,
          "weight_pct": 4.3,
          "inUniverse": true,
          "div200": -22.36,
          "overheat": {
            "status": "reentry",
            "label": "🟢재진입 관찰(-22%)",
            "div200": -22.36,
            "note": "하락 멈춤 + RS 회복 확인 후 분할매수"
          },
          "rsTop": "95.7",
          "div50": -19.41,
          "advice": "🟢 재진입 관찰",
          "note": "하락 멈춤 + RS 회복 확인 후 분할매수",
          "humanCheck": "월봉 10MA / 주봉 헤드앤숄더 넥라인"
        },
        {
          "ticker": "AMAT",
          "name": "어플라이드 머티어리얼즈",
          "pnl_pct": -19.19,
          "weight_pct": 4.3,
          "inUniverse": true,
          "div200": 63.49,
          "overheat": {
            "status": "normal",
            "label": "정상(63%)",
            "div200": 63.49
          },
          "rsTop": "4.7",
          "div50": 11.49,
          "advice": "홀딩",
          "note": "월봉10MA·주봉 넥라인 이탈 여부는 차트 직접 확인",
          "humanCheck": "월봉 10MA / 주봉 헤드앤숄더 넥라인"
        },
        {
          "ticker": "INTC",
          "name": "인텔",
          "pnl_pct": -26.82,
          "weight_pct": 1.9,
          "inUniverse": true,
          "div200": 62.03,
          "overheat": {
            "status": "normal",
            "label": "정상(62%)",
            "div200": 62.03
          },
          "rsTop": "4.1",
          "div50": -12.35,
          "advice": "홀딩",
          "note": "월봉10MA·주봉 넥라인 이탈 여부는 차트 직접 확인",
          "humanCheck": "월봉 10MA / 주봉 헤드앤숄더 넥라인"
        }
      ]
    },
    "short": {
      "name": "단기용 (예비 장독대)",
      "holdings": []
    }
  },
  "dropoff": {
    "total": 1412,
    "hasTicker": 1412,
    "gateFail": 1352,
    "byGate": {
      "rs": 1064,
      "div50": 27,
      "jeongbae": 722,
      "high52": 483,
      "adr": 826,
      "udr": 920
    },
    "gatePass": 60,
    "noEntry": 39,
    "entryPass": 21,
    "byStrategy": {
      "perfect_storm": 0,
      "eungbong": 21
    }
  }
};
