export const meta = {
  name: 'research-brief',
  description: '리서치팀(Ria) — 노트북LM 출처 기반 기업·전략·시장 심층 리서치 (heavy 전용)',
  phases: [
    { title: '리서치', detail: '노트북LM(ask_question)으로 종목·주제별 출처 기반 심층분석' },
  ],
}
// 사용법: Workflow({ scriptPath:'scripts/workflows/research-brief.js',
//   args:{ notebookId:'<노트북 id 또는 생략>', tickers:['MU',...], focus:'fundamentals'|'strategy'|'macro' } })
// 전제: NotebookLM MCP 인증 완료(setup_auth) + 소스가 담긴 노트북 1개 이상.
// 각 agent 는 ToolSearch 로 mcp__notebooklm__* (select_notebook/ask_question) 를 불러 사용.

let _A = args
if (typeof _A === 'string') { try { _A = JSON.parse(_A) } catch (e) { _A = null } }
const tickers = (_A && _A.tickers) || []
const notebookId = (_A && _A.notebookId) || null
const focus = (_A && _A.focus) || 'fundamentals'

const RESEARCH_SCHEMA = { type:'object', properties:{
  ticker:{type:'string'},
  keyFindings:{type:'array', items:{type:'string'}},
  thesis:{type:'string'},
  catalysts:{type:'array', items:{type:'string'}},
  risks:{type:'array', items:{type:'string'}},
  sources:{type:'array', items:{type:'string'}},
  verdict:{type:'string', enum:['strong','ok','weak','avoid']},
}, required:['ticker','thesis','risks','verdict'] }

const FOCUS_Q = {
  fundamentals: '실적 추세(가속 여부)·해자·경쟁력·촉매·리스크',
  strategy: '이 종목이 응봉/퍼펙트스톰/미너비니/쿨라매기 셋업에 부합하는지',
  macro: '이 종목이 속한 섹터·시장 국면·자금 흐름',
}

phase('리서치')
const nbHint = notebookId
  ? `mcp__notebooklm__select_notebook 으로 노트북 id=${notebookId} 선택 후,`
  : `기본 노트북(list_notebooks 로 확인)을 사용해,`

const results = await parallel(tickers.map((t) => () =>
  agent(
    `당신은 리서치 애널리스트(Ria 팀)입니다. NotebookLM MCP 도구를 사용해 **출처 기반**으로 ${t}를 리서치하세요.
${nbHint} mcp__notebooklm__ask_question 으로 다음을 질문하세요: "${t}의 ${FOCUS_Q[focus] || FOCUS_Q.fundamentals}".
- 반드시 노트북(문서) 근거에 기반해 답하고, 학습 기억으로 지어내지 마세요(환각 금지).
- keyFindings: 핵심 발견 3~5개(각각 출처 기반)
- thesis: 투자 논거 요약
- catalysts: 상승 촉매
- risks: 리스크
- sources: 참고한 소스(있으면)
- verdict: strong/ok/weak/avoid
노트북에 관련 소스가 없으면 verdict='weak', risks에 '노트북에 근거 소스 부족' 명시. 한글로.`,
    { label:`research:${t}`, phase:'리서치', schema: RESEARCH_SCHEMA, model:'sonnet' }
  )
))

return { focus, notebookId, results: results.filter(Boolean) }
