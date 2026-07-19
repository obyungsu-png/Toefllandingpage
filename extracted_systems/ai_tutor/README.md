# AI 튜터 시스템 (AI Tutor)

## 개요
TOEFL 학습을 위한 AI 기반 채팅 튜터 시스템입니다. GLM-4-Flash와 Claude Sonnet 5 두 가지 모델을 지원하며, 현재 보고 있는 문제의 컨텍스트를 AI에게 전달하여 맞춤형 답변을 제공합니다.

## 핵심 기능
- **듀얼 AI 모델**: GLM-4-Flash (빠름) + Claude Sonnet 5 (정밀)
- **실시간 스트리밍**: SSE(Server-Sent Events)로 응답을 청크 단위 실시간 표시
- **문제 컨텍스트 주입**: 현재 문제 데이터를 시스템 프롬프트에 포함
- **추천 질문**: 문제 유형별 맞춤 추천 질문 (이메일/토론/기본)
- **리치 텍스트**: `<b>`, `<u>` 태그 + 마크다운을 스타일링된 텍스트로 변환

## 파일 구조

| 파일 | 설명 |
|------|------|
| `ToeflAiWidget.tsx` | 메인 컴포넌트 — FAB 버튼, 채팅 패널, API 호출, 스트리밍 처리 |
| `chat/completions.ts` | Claude API 프록시 (Vercel 서버리스 함수) — 스트리밍/비스트리밍 지원 |
| `wordTranslate.ts` | Claude API를 통한 단어 한국어 번역 |
| `dictionaryApi.ts` | 영어 단어 정의 API (Free Dictionary API) |
| `button.tsx` | UI 컴포넌트 — Button |
| `input.tsx` | UI 컴포넌트 — Input |
| `App_integration.tsx` | App.tsx 통합 코드 (추출본) |

## 아키텍처

```
사용자 질문 입력
  → ToeflAiWidget.handleSendMessage()
  → buildQuestionContext(questionData) — 문제 데이터 → 컨텍스트 문자열
  → 시스템 프롬프트 조립 (BASE_SYSTEM_PROMPT + 문제 + OUTPUT_FORMAT)
  → 선택된 모델로 API 호출
      ├── GLM: open.bigmodel.cn/api/paas/v4/chat/completions (직접 호출)
      └── Claude: /api/claude/chat/completions (Vercel 프록시 경유)
  → SSE 스트리밍 응답 읽기
  → renderRichContent() — 리치 텍스트 렌더링
  → 채팅 UI에 표시
```

## API 설정

### GLM (智谱 AI)
```
Endpoint: https://open.bigmodel.cn/api/paas/v4/chat/completions
Model: glm-4-flash
Auth: Bearer token (dc2213720f4b4a88ae06ddbd434ab1dd...)
CORS: 직접 호출 가능
```

### Claude (Anthropic)
```
Endpoint (Electron): https://apiclaude.cc/v1/chat/completions
Endpoint (Web): /api/claude/chat/completions (Vercel 프록시)
Model: claude-sonnet-5
Auth: API key (sk-3bd59126ffdfa8ed1fcca872704a87bd...)
CORS: 웹에서는 프록시 필요
```

## Props 인터페이스

```typescript
interface ToeflAiWidgetProps {
  position?: 'left' | 'right';     // FAB 버튼 위치 (기본: right)
  contextLabel?: string;            // 현재 컨텍스트 (예: "Reading · Academic Passage")
  questionData?: any;               // 현재 문제 원본 데이터
  zIndex?: number;                  // z-index (기본: 90)
  open?: boolean;                   // 외부에서 열림 제어 (controlled)
  onOpenChange?: (open: boolean) => void;
  showFab?: boolean;                // FAB 버튼 표시 여부
  suggestedQuestions?: string[];    // 추천 질문 목록
}
```

## 시스템 프롬프트
```
BASE: "TOEFL 튜터 AI. 한국어로 간결·실용적으로 답변. 영어 예문+한글 설명. Reading/Listening/Speaking/Writing 전문."
FORMAT: "[형식] 마크다운(#,**,*,`) 금지. <b>강조</b>, <u>항목명</u> 사용. 목록은 새 줄만. 줄바꿈으로 구조화."
CONTEXT: "[문제] + {questionData} + 반드시 위 문제 데이터 기반으로 답변. 정답 근거·해설·오답 분석 포함."
```

## buildQuestionContext() — 문제 데이터 변환
문제 객체에서 다음 필드를 추출하여 컨텍스트 문자열로 변환:
- 영역, 문제 번호, 문제 유형, 난이도
- 문제/질문, 지문, 선택지, 정답
- 빈칸 정답, 해설, 번역 노트, 어휘 노트
- 오디오 스크립트, 지문 제목
- 이메일 상황/지시/조건 (Writing Email)
- 교수/학생 발언 (Academic Discussion)

노이즈 키는 자동 제거: imageUrl, audioUrl, avatar1ImageUrl, id, words 등

## renderRichContent() — 리치 텍스트 렌더링
- `<b>text</b>` → 굵은 초록색 강조
- `<u>text</u>` → 파란색 밑줄
- `**text**` → 굵은 초록색
- `*text*` → 기울임 회색
- `` `text` `` → 인라인 코드
- `# Heading` → 제목 (레벨별 크기)
- `1. item` → 순서 있는 목록
- `\n\n` → 단락 구분

## 전자(Electron) 환경 지원
- `isElectron` 플래그로 Claude 엔드포인트 분기
- Electron: `https://apiclaude.cc/v1/chat/completions` (세션 인터셉터가 인증+CORS 처리)
- Web: `/api/claude/chat/completions` (Vercel 프록시)

## 인용 시 주의사항
- GLM API 키는 하드코딩되어 있음 → 환경변수로 분리 권장
- Claude API 키는 Vercel 환경변수 `CLAUDE_API_KEY` 사용
- `renderRichContent`는 `<b>`와 `<u>` 태그를 인라인 스타일로 변환 (Tailwind 클래스 아님)
- 컨텍스트/문제 데이터가 바뀌면 대화가 자동 초기화됨
- `showFab=false` + `open` prop으로 패널 내 통합 가능
- SSE 스트리밍 응답 파싱 시 `data: [DONE]` 종료 시그널 처리
- 429 에러 시 사용자에게 모델 전환 제안

## 의존성
- `react`, `lucide-react` (아이콘: Sparkles, Send, Bot, User, ChevronLeft)
- `./ui/button`, `./ui/input` (UI 컴포넌트)
- `wordTranslate.ts`, `dictionaryApi.ts` (단어 검색 — 별도 시스템)