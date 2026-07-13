window.VERIFY_DATA = {
  "last_run": "2026-07-12 (heavy · 실제 검증단 실행)",
  "mode": "heavy",
  "picked": [],
  "models": [
    {
      "name": "Opus",
      "ko": "오퍼스",
      "role": "심의위원장·시장판단·펀더멘털·악마의변호인·최종판정"
    },
    {
      "name": "Sonnet",
      "ko": "소넷",
      "role": "기술적·모멘텀 구조 검증"
    },
    {
      "name": "Haiku",
      "ko": "하이쿠",
      "role": "팩트체크·촉매/테마"
    }
  ],
  "market": {
    "regime": "neutral",
    "invest_ok": true,
    "note": "가격 흐름 자체는 리스크온입니다. S&P500이 사상 처음 7600을 돌파하고 QQQ는 12개월 +28%로 52주 고점에 근접, VIX는 15~17의 낮은 수준이라 모멘텀(상대강도) 스윙 전략이 작동하기 좋은 추세·저변동성 환경입니다. 따라서 신규 진입은 가능(invest_ok=true)하나 조건부 보수적으로 접근해야 합니다. 매크로 배경이 빠르게 악화 중이기 때문입니다: CPI +4.2%로 인플레가 재가속하는 동시에 6월 고용이 5.7만으로 급랭해 스태그플레이션 신호가 나타났고, 신임 워시 연준은 포워드가이던스를 제거하고 7/28…"
  },
  "scores": [
    {
      "ticker": "SNDK",
      "avg": 64,
      "recommend": "1/3",
      "fact": "caution",
      "veto": true,
      "votes": [
        {
          "model": "opus",
          "score": 85,
          "recommend": true,
          "opinion": "실적 가속의 교과서적 사례. EPS 성장률이 당해 +2120%, 차년 +207%로 폭발적이며, 매출도 당해 +168%, 차년 +143%로 2년 연속 세 자릿수 가속이 예상됨. 2026 Q3 실제 실적이 매출 $5.95B(순차 +97%), EPS $23…"
        },
        {
          "model": "sonnet",
          "score": 58,
          "recommend": false,
          "opinion": "1) 200일선 대비 +57.09%(div200=157.09) 극단적 이격 — 전형적인 과열/오버익스텐디드 구간으로, 추세추종 진입 시 되돌림(mean reversion) 리스크가 매우 큼. 2) 거래량 지표 volx=0.88로 평균 거래량에도 못 미…"
        },
        {
          "model": "haiku",
          "score": 48,
          "recommend": false,
          "opinion": "PE 60-74배는 업계 평균(23.3배)의 2.6-3.2배 수준의 극도 고평가이며, P/S 23.23은 업계 평균(1.43)의 16배로 현재 주가에 향후 3-5년 성장이 과도하게 반영됨. 주가 749% 급등은 모멘텀 버블 가능성을 시사하고, $1,9…"
        }
      ],
      "devil": {
        "veto": true,
        "reason": "펀더멘털(EPS +2120%, 매출 +168%, 데이터센터 +233%)은 의심의 여지 없이 폭발적이지만, '지금 이 가격에 신규 매수'라는 행위 자체에 치명적 진입 결함이 있어 veto한다. 첫째, div200=157.09는 주가가 200일선보다 +157% 위에 있다는 뜻으로, 통계적으로 되돌림(mean reversion…"
      }
    },
    {
      "ticker": "ALAB",
      "avg": 55,
      "recommend": "1/3",
      "fact": "caution",
      "veto": true,
      "votes": [
        {
          "model": "opus",
          "score": 66,
          "recommend": true,
          "opinion": "위 bull 참조"
        },
        {
          "model": "sonnet",
          "score": 58,
          "recommend": false,
          "opinion": "단기 모멘텀 구조는 뚜렷하게 훼손된 신호를 보입니다. 10일 이평선 대비 -1.84%로 초단기 추세가 이미 하향 전환했고, 52주 고점 대비 82.68% 수준(고점 대비 약 17% 하락)에서 신고가 갱신에 실패했으며, brk60=NO로 최근 60일간 …"
        },
        {
          "model": "haiku",
          "score": 42,
          "recommend": false,
          "opinion": "극도의 밸류에이션 과다(P/E 196.73, Forward P/E 153) - 분석가 62-77% 과대평가 평가. 고객 집중도 극심(상위 5개가 분기 매출 90%, Amazon 중심). 인사이더 매도 활동(6월-7월 $60.5M 규모)은 경영진 불신 …"
        }
      ],
      "devil": {
        "veto": true,
        "reason": "진입 타이밍 관점에서 치명적이라 판단해 veto=true로 본다. RS Rank 99, epsCY +63.6%, saleCY +81.66%는 분명히 강력하지만, 이는 이미 3월 $36→7월 $413(약 11배) 급등에 대부분 선반영됐다. 문제는 (1) 밸류에이션 안전마진이 사실상 전무한데(P/E ~197, EV/EBITD…"
      }
    },
    {
      "ticker": "DDOG",
      "avg": 49,
      "recommend": "0/3",
      "fact": "caution",
      "veto": true,
      "votes": [
        {
          "model": "opus",
          "score": 56,
          "recommend": false,
          "opinion": "실적 가속 관점에서 핵심 논리가 무너짐. (1) 성장은 '가속'이 아니라 '감속': 매출성장 32%(Q1)→27%(CY)→21%(NY)로 뚜렷한 하강, EPS성장은 CY 18.2%/NY 19.0%로 정체 수준이라 '실적 가속'의 정의에 부합하지 않음.…"
        },
        {
          "model": "sonnet",
          "score": 52,
          "recommend": false,
          "opinion": "1) clsPos 13.31로 당일 변동폭 하단 근처에서 마감하는 캔들이 나타나고 있어, 강한 RS 대비 장중 매도세(분산, distribution)가 유입되고 있음을 시사한다. 2) div10이 0.08%로 10일 이평선에 거의 붙어있어 초단기 모멘…"
        },
        {
          "model": "haiku",
          "score": 40,
          "recommend": false,
          "opinion": "극고평가(112.1x P/E, 22.9x EV/Revenue), Bernstein 다운그레이드(수렴 신호), 기대치 이미 충분히 반영(상반기 88.7% 상승), 비AI 사업 85% 중 성장 둔화 우려, CEO 주식 매도, Q4부터 연 30% 이상 성장…"
        }
      ],
      "devil": {
        "veto": true,
        "reason": "신규 매수 관점에서 치명 결함이 확인된다. (1) 펀더멘털: PEG 6배(P/E 112x vs EPS성장 18%)로 성장 대비 정당화 불가, 게다가 성장률이 '가속'이 아니라 매출 32%→27%→21%로 구조적 감속. 세 패널 모두(옵스·소넷·하이쿠) recommend=false이며 폭발점수도 56/52/40으로 낮다. …"
      }
    },
    {
      "ticker": "PANW",
      "avg": 51,
      "recommend": "0/3",
      "fact": "caution",
      "veto": true,
      "votes": [
        {
          "model": "opus",
          "score": 46,
          "recommend": false,
          "opinion": "차년도 EPS -48.29의 이익 역성장이 실적 가속 논지를 정면으로 부정하고, M&A 희석·소송 리스크·과확장 국면이 겹쳐 '폭발적' 상승의 펀더멘털 근거가 부족."
        },
        {
          "model": "sonnet",
          "score": 44,
          "recommend": false,
          "opinion": "단기 기술 신호가 뚜렷하게 약화. 1) 10일선 대비 -2.91%(div10)로 최근 단기 조정 진입, 상승 추세가 즉각적으로는 꺾인 상태. 2) 거래량비 volx 0.63으로 평균 거래량의 63%에 불과 — 최근 가격 움직임에 기관 수급 동반이 약함…"
        },
        {
          "model": "haiku",
          "score": 62,
          "recommend": false,
          "opinion": "경영진 신뢰 추락: 2024년 2월 증권사기 집단소송 제기(2023.8~2024.2 주가 부풀림 혐의), 2023-2024 순이익 56% 감소 및 EPS 56% 악화, 내년 EPS -48.29% 급락으로 성장성 반전 신호, M&A 통합 리스크, 법적/…"
        }
      ],
      "devil": {
        "veto": true,
        "reason": "치명 결함으로 판단해 veto=true. 핵심은 epsNY -48.29의 차년도 이익 역성장이 이 종목의 유일한 상방 근거인 '실적 가속·AI 보안 성장' 논지를 근본적으로 무너뜨린다는 점. 폭발적 상승 후보의 전제는 '가속되는 펀더멘털 + 진입 가능한 기술적 트리거'인데, PANW는 (1) 미래 이익 궤적이 반전(-48…"
      }
    }
  ],
  "final": {
    "invest": false,
    "picks": 0,
    "note": "결론: 오늘(2026-07-12) 신규 진입 0종목으로 확정한다. 시장 레짐은 neutral·invest_ok=true로 '진입 가능한' 환경이지만, 규칙(3)에 따라 후보 4종목(SNDK·ALAB·DDOG·PANW) 전부가 악마변호인 veto=true로 자동 제외되어 심의 대상으로 남는 종목이 없다. 심의위원장으로서 이 veto들을 형식적 배제로 넘기지 않고 실질을 확인했으며, 네 종목 모두 '좋은 회사(펀더멘털)'와 '좋은 매수 시점(entry)'이 분리된 전형적 사례라는 데 동의한다. 공통 결함이 뚜렷하다: (1) 이미 대규모 선행 랠리 후 극단적 고평가(SND…"
  },
  "top_watch": "주도주(SNDK·ALAB 등)는 펀더멘털 강하나 200div 과열+돌파 부재 → 50일선 눌림 후 거래량 동반 재돌파 확인 시 재검토."
};
