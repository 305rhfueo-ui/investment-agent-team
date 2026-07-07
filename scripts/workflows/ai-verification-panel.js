export const meta = {
  name: 'ai-verification-panel',
  description: 'AI 다중모델 검증단 — 시장판단 + 종목별 폭발력 검증(팩트체크·3모델패널·악마의변호인) + 최종 3종목 이내 선정',
  phases: [
    { title: '시장판단', detail: '미국 시장 레짐 risk_on/off 판정 (웹검색)' },
    { title: '종목검증', detail: '종목별 팩트체크 → 3모델 패널 → 악마의 변호인' },
    { title: '최종판정', detail: '폭발력 순 3종목 이내(또는 0)' },
  ],
}
// 사용법: Workflow({ scriptPath: 'scripts/workflows/ai-verification-panel.js', args: { candidates: [...], date: 'YYYY-MM-DD' } })
// ⚠️ 모델 구성: Opus(펀더멘털·판정) · Sonnet(기술적) · Haiku(팩트체크 + 촉매·테마). Fable은 요금제로 미사용 → Haiku가 대체.

let _A = args
if (typeof _A === 'string') { try { _A = JSON.parse(_A) } catch (e) { _A = null } }
const cands = (_A && _A.candidates) || []
const today = (_A && _A.date) || 'today'

const MARKET_SCHEMA = { type:'object', properties:{
  regime:{type:'string', enum:['risk_on','neutral','risk_off']},
  invest_ok:{type:'boolean'}, qqq_view:{type:'string'},
  key_risks:{type:'array', items:{type:'string'}}, summary:{type:'string'}
}, required:['regime','invest_ok','summary'] }

const FACT_SCHEMA = { type:'object', properties:{
  ticker:{type:'string'}, is_normal_common_stock:{type:'boolean'},
  red_flags:{type:'array', items:{type:'string'}}, recent_news:{type:'string'},
  catalyst:{type:'string'}, verdict:{type:'string', enum:['clear','caution','veto']}
}, required:['ticker','is_normal_common_stock','verdict','recent_news'] }

const PANEL_SCHEMA = { type:'object', properties:{
  lens:{type:'string'}, explosive_score:{type:'number'},
  bull:{type:'string'}, bear:{type:'string'}, recommend:{type:'boolean'}
}, required:['explosive_score','bull','bear','recommend'] }

const DEVIL_SCHEMA = { type:'object', properties:{
  strongest_bear:{type:'string'}, veto:{type:'boolean'}, reason:{type:'string'}
}, required:['strongest_bear','veto','reason'] }

const FINAL_SCHEMA = { type:'object', properties:{
  invest:{type:'boolean'}, market_note:{type:'string'},
  picks:{type:'array', items:{type:'object', properties:{
    ticker:{type:'string'}, rank:{type:'number'}, explosive_score:{type:'number'},
    thesis:{type:'string'}, entry_note:{type:'string'}, dissent:{type:'string'}
  }, required:['ticker','rank','thesis']}},
  skipped:{type:'array', items:{type:'object', properties:{
    ticker:{type:'string'}, why:{type:'string'}
  }, required:['ticker','why']}},
  overall_rationale:{type:'string'}
}, required:['invest','picks','skipped','overall_rationale'] }

// ── 1단계: 시장 레짐 판단 ──
phase('시장판단')
const market = await agent(
  `당신은 매크로 전략가입니다. 지금은 ${today} (2026년). 미국 주식시장 레짐을 판단하세요.
웹검색으로 QQQ/S&P500 최근 추세, VIX, 금리, 최근 매크로 이벤트를 확인하세요.
모멘텀(상대강도) 스윙 전략으로 신규 진입해도 되는 환경인지 판정: regime(risk_on/neutral/risk_off), invest_ok(true/false), key_risks, summary(한글).
불확실하면 보수적으로.`,
  { label:'시장레짐', phase:'시장판단', schema: MARKET_SCHEMA, model:'opus' }
)

// ── 2단계: 종목별 검증 파이프라인 ──
phase('종목검증')
const LENSES = [
  { model:'opus',   lens:'펀더멘털·실적 가속' },
  { model:'sonnet', lens:'기술적·모멘텀 구조' },
  { model:'haiku',  lens:'촉매·테마·내러티브' }, // (구 Fable 역할 이관)
]

const perStock = await pipeline(
  cands,
  (c) => agent(
    `팩트체크 담당. 종목 ${c.ticker} (${c.sector}/${c.industry}, 시총 ${c.marketCap}, 현재가 $${c.price}).
웹검색으로 확인: (1) 정상 보통주인가? SPAC/워런트/유닛/레버리지·인버스 ETF/상장폐지 임박/역합병 아님?
(2) 최근 뉴스, 실적발표 임박, 소송, 대규모 유상증자·희석, 감사/회계 이슈?
데이터: ${JSON.stringify(c)}
is_normal_common_stock, red_flags(배열), recent_news(한글), catalyst, verdict(clear/caution/veto).`,
    { label:`fact:${c.ticker}`, phase:'종목검증', schema: FACT_SCHEMA, model:'haiku' }
  ),
  (fact, c) => parallel(LENSES.map((L) => () =>
    agent(
      `당신은 '가장 폭발적으로 성장할' 종목을 찾는 성장주 헌터입니다. 관점: ${L.lens}.
종목 ${c.ticker}의 폭발적 상승 잠재력을 0~100(explosive_score)로 평가.
데이터: ${JSON.stringify(c)}  팩트체크: ${JSON.stringify(fact)}
${L.lens} 관점에서 bull/bear를 구체적으로, recommend(true/false). lens에 '${L.lens}' 기입. 근거 없이 높은 점수 금지. 한글.`,
      { label:`panel:${c.ticker}:${L.model}`, phase:'종목검증', schema: PANEL_SCHEMA, model:L.model }
    ).then((v) => v ? { ...v, model:L.model } : null)
  )).then((votes) => ({ ticker:c.ticker, fact, votes: votes.filter(Boolean) })),
  (mid, c) => agent(
    `악마의 변호인. ${c.ticker}을 매수하면 안 되는 가장 강력한 이유. 데이터: ${JSON.stringify(c)}
패널 의견: ${JSON.stringify(mid.votes)}
strongest_bear, veto(치명 결함이면 true), reason. 한글.`,
    { label:`devil:${c.ticker}`, phase:'종목검증', schema: DEVIL_SCHEMA, model:'opus' }
  ).then((devil) => ({ ...mid, devil }))
)

// ── 3단계: 최종 판정 ──
phase('최종판정')
const clean = perStock.filter(Boolean)
const final = await agent(
  `당신은 최종 투자심의위원장입니다. 오늘(${today}) 신규 진입 여부와 종목을 확정하세요.
시장 레짐: ${JSON.stringify(market)}
종목별 검증 결과: ${JSON.stringify(clean)}
규칙: (1) risk_off 또는 invest_ok=false 면 0종목 가능. (2) 폭발력 높은 순 최대 3종목, 확신 없으면 더 적게(0~2). (3) fact verdict=veto 또는 devil veto=true 제외. (4) 각 선정 종목 rank·explosive_score·thesis·entry_note·dissent(한글). (5) 탈락은 skipped에 사유. 정직하게. overall_rationale에 종합.`,
  { label:'최종판정', phase:'최종판정', schema: FINAL_SCHEMA, model:'opus' }
)

return { market, perStock: clean, final }
