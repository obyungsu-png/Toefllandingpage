/**
 * ── App.tsx 내 AI 튜터 통합 코드 ──
 * 
 * 원본 파일: src/App.tsx
 * 
 * AI 튜터 위젯은 ReviewAssistantPanel(오답노트 패널)과 연동되어
 * 현재 보고 있는 문제의 컨텍스트를 AI 튜터에게 전달합니다.
 */

import { ToeflAiWidget } from './components/ToeflAiWidget';

// App.tsx 상태
const [isAiTutorOpen, setIsAiTutorOpen] = useState(false);

// ── AI 튜터 위젯 렌더링 (ReviewAssistantPanel이 열려 있을 때) ──
{activeReviewPanel && !reviewTrainingRequest && (
  <ToeflAiWidget
    position="right"
    zIndex={86}
    showFab={false}                           // FAB 버튼 숨김 (패널 내 아이콘으로 열림)
    open={isAiTutorOpen}                      // 외부에서 열림 상태 제어
    onOpenChange={setIsAiTutorOpen}
    contextLabel={`${activeReviewPanel.section}${activeReviewPanel.questionType ? ' · ' + activeReviewPanel.questionType : ''}`}
    questionData={activeReviewPanel.questionData}  // 현재 문제 데이터 전달
    suggestedQuestions={(() => {
      const qType = (activeReviewPanel.questionType || '').toLowerCase();
      // 이메일 작성 문제 → 이메일 특화 추천 질문
      if (qType.includes('email') || qType.includes('write an email')) {
        return [
          '📌 문제 핵심 요구사항 & 추천 구조',
          '👥 상황별 맞춤 어휘 & 이메일 표현',
          '✍️ 이메일 도입부(첫 문장) 추천',
          '💡 본문 전개용 브레인스토밍 아이디어',
        ];
      }
      // 학술 토론 문제 → 토론 특화 추천 질문
      if (qType.includes('discussion') || qType.includes('academic')) {
        return [
          '📌 토론 주제 및 학생 의견 핵심 요약',
          '👥 타인 의견 인용 및 연계 표현 추천',
          '✍️ 토론형 라이팅 도입부(첫 문장) 예시',
          '💡 독창적 의견 전개를 위한 브레인스토밍',
        ];
      }
      return undefined; // 기본 추천 질문 사용
    })()}
  />
)}