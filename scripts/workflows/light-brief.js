export const meta = {
  name: 'light-brief',
  description: 'start investment light — 시황·유동성 심층 분석 + 추천 종목별 상세(쉬운) 분석',
  phases: [
    { title: '시황분석', detail: '오늘 미국 시장·유동성 심층 (웹검색)' },
    { title: '종목분석', detail: '추천 종목별 회사소개·왜주목·셋업·리스크 (웹검색)' },
  ],
}
// 사용법: Workflow({ scriptPath: 'scripts/workflows/light-brief.js', args: { candidates:[...], date:'YYYY-MM-DD' } })

let _A = args
if (typeof _A === 'string') { try { _A = JSON.parse(_A) } catch (e) { _A = null } }
const cands = (_A && _A.candidates) || []
const today = (_A && _A.date) || 'today'

const MARKET_SCHEMA = { type:'object', properties:{
  regime:{type:'string', enum:['risk_on','neutral','risk_off']},
  invest_ok:{type:'boolean'},
  marketBrief:{type:'string'},
  liquidity:{type:'string'},
  keyRisks:{type:'array', items:{type:'string'}},
  easySummary:{type:'array', items:{type:'string'}},
  conclusion:{type:'string'},
}, required:['regime','invest_ok','marketBrief','liquidity','conclusion'] }

const STOCK_SCHEMA = { type:'object', properties:{
  ticker:{type:'string'},
  company:{type:'string'},
  oneLine:{type:'string'},
  whyWatch:{type:'string'},
  setup:{type:'string'},
  risks:{type:'string'},
  watchFor:{type:'string'},
}, required:['ticker','company','whyWatch','risks','watchFor'] }

phase('시황분석')
const market = await agent(
  `당신은 개인 투자자에게 시장을 아주 쉽게 설명하는 매크로 분석가입니다. 지금은 ${today}(2026년).
웹검색으로 미국 시장 상황을 확인하세요: QQQ/S&P500 추세, VIX, 금리·연준, 최근 물가/고용, 시장폭(오르는 종목이 많은지), 유동성.
초보자도 이해하게 **비유를 써서 자세하고 쉽게** 작성하세요. 전문용어는 괄호로 풀어주세요.
- regime, invest_ok(모멘텀 스윙 신규진입 적합 여부)
- marketBrief: 지금 시장이 어떤 상황인지 4~6문장으로 자세히·쉽게
- liquidity: '오르는 종목이 많은지/돈이 도는지'를 쉽게 3~4문장
- keyRisks: 리스크 3~5개(각각 쉽게 한 줄)
- easySummary: 초보자용 3줄 요약
- conclusion: 오늘 어떻게 대응할지 한 문단. 한글로.`,
  { label:'시황심층', phase:'시황분석', schema: MARKET_SCHEMA, model:'opus' }
)

phase('종목분석')
const stocks = await parallel(cands.map((c) => () =>
  agent(
    `당신은 종목을 초보자에게 아주 쉽게 풀어 설명하는 애널리스트입니다. 종목 ${c.ticker}.
데이터: ${JSON.stringify(c)}
웹검색으로 이 회사가 무엇을 하는지, 최근 뉴스/실적/촉매를 확인하세요. **자세하고 쉽게, 비유를 곁들여** 작성:
- company: 이 회사가 뭐 하는 곳인지 2~3문장으로 쉽게 (예: "OO을 만드는 회사")
- oneLine: 한 줄 핵심
- whyWatch: 왜 지금 주목하는지 3~4문장 (실적·테마·촉매를 쉽게)
- setup: 지금 차트/진입 관점을 쉽게 (돌파인지 눌림목인지, 무슨 의미인지)
- risks: 리스크·주의점 2~3개를 쉽게
- watchFor: 앞으로 지켜볼 것(실적발표, 특정 가격 등)
전문용어는 괄호로 풀어주세요. 한글로.`,
    { label:`분석:${c.ticker}`, phase:'종목분석', schema: STOCK_SCHEMA, model:'sonnet' }
  )
))

return { market, stocks: stocks.filter(Boolean) }
