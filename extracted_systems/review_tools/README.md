# Review Tools 시스템 (리뷰 도구)

## 개요
TPO/Test 리뷰 모드에서 지문에 하이라이트, 밑줄, 단어 뜻 검색(영어/한국어)을 지원하는 도구 시스템입니다. 하이라이트는 Supabase에 저장되어 수강권 기간 동안 유지됩니다.

## 핵심 기능
1. **하이라이트** — 3색 (노랑/초록/핑크), `<mark>` 태그로 렌더링
2. **밑줄** — 3색 (파랑/보라/빨강), `<u>` 태그로 렌더링
3. **지우기** — 모든 하이라이트/밑줄 일괄 삭제
4. **단어 뜻** — 영어 정의 (Dictionary API) / 한국어 번역 (Claude API)
5. **다크 모드** — 전체 UI 다크 테마 전환

## 파일 구조

| 파일 | 설명 |
|------|------|
| `ReadingReviewToolbar.tsx` | 툴바 UI — 하이라이트 색상, 밑줄 색상, 지우기, 언어 토글 |
| `ReadingReviewPassage.tsx` | 지문 컴포넌트 — mouseup 이벤트 처리, 하이라이트/팝업 렌더링 |
| `WordPopup.tsx` | 단어 뜻 팝업 — createPortal로 document.body에 렌더링 |
| `readingHighlights.ts` | Supabase CRUD — saveHighlight, loadHighlights, deleteHighlight, deleteAllHighlights |
| `dictionaryApi.ts` | 영어 단어 정의 API (Free Dictionary API) |
| `wordTranslate.ts` | 한국어 번역 API (Claude API 프록시) |
| `ResizableReadingLayout.tsx` | 좌우 분할 레이아웃 — 지문/질문 영역 리사이즈 |

## 아키텍처

```
사용자 텍스트 선택 (mouseup)
  ├── activeTool이 선택된 경우
  │   ├── 하이라이트/밑줄 DOM 적용 (applyHighlightToRange)
  │   └── Supabase 저장 (saveHighlight) — 수강권 필요
  ├── 단일 단어인 경우
  │   └── WordPopup 표시 (createPortal → document.body)
  │       ├── EN 모드: dictionaryApi.getWordDefinitions()
  │       └── KO 모드: wordTranslate.translateWord()
  └── 선택 취소
```

## 하이라이트 데이터 구조
```typescript
interface Highlight {
  id?: string;
  test_id: string;       // 예: 'tpo-1'
  passage_key: string;   // 예: 'reading-m1'
  start_offset: number;  // 텍스트 내 시작 위치
  end_offset: number;    // 텍스트 내 끝 위치
  type: 'h' | 'u';       // 'h'=highlight, 'u'=underline
  expires_at: string;    // 수강권 만료일
}
```

## Supabase 저장 로직
- `saveHighlight()`: 수강권 확인 → insert → expires_at = 수강권 만료일
- `loadHighlights()`: user_id + test_id + passage_key + expires_at > now()
- `deleteHighlight()`: id + user_id로 삭제
- `deleteAllHighlights()`: test_id + passage_key + user_id로 일괄 삭제

## WordPopup 특징
- `createPortal`을 사용해 `document.body`에 렌더링 (transform/overflow 제약 회피)
- z-index: 100
- 클릭 위치 기준으로 표시, 화면 경계 자동 조정
- AI 튜터 FAB 위젯 영역 회피 로직 포함

## 인용 시 주의사항
- 하이라이트는 수강권이 있어야만 Supabase에 저장됨
- 만료된 하이라이트는 자동으로 제외됨 (gt('expires_at', now()))
- WordPopup은 `document.body`에 포털로 렌더링해야 transform 영향 없음
- `parsePassageContent()`: CMS JSON 템플릿에서 본문 추출
- `restoreHighlights()`: 페이지 로드 시 저장된 하이라이트 DOM 복원
- `questions:`는 각 TPO 모듈에 포함된 개별 문제들을 참조

## 의존성
- `@supabase/supabase-js`
- `react`, `react-dom` (createPortal)
- `lucide-react` (아이콘: Highlighter, Underline, Eraser, Globe)
- Free Dictionary API: `https://api.dictionaryapi.dev/api/v2/entries/en/{word}`
- Claude API: `/api/claude/chat/completions` (한국어 번역)