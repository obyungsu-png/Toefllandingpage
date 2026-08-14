export interface TestResult {
  id: string;
  // Per-student ownership (so each student sees only their own history)
  ownerId?: string;
  ownerName?: string;
  type: 'TPO' | 'Test' | 'Training' | 'Vocabulary' | 'Question Types';
  category?: string;
  testName: string;
  testNumber?: number;
  bankType?: 'tpo' | 'test' | 'training';
  trainingType?: string;
  status?: 'started' | 'in-progress' | 'completed';
  date: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: {
    questionId: string;
    questionText: string;
    userAnswer: string;
    correctAnswer: string;
    explanation?: string;
  }[];
  timeSpent?: number;
  vocabularyDay?: number;
  vocabularyVolume?: number;
  /** 실제로 응답한 문제 번호 목록 (미답변 정확 표시용) */
  answeredQuestions?: number[];
  /** 응답한 문제 수 (History 50문항 필터용) */
  answeredCount?: number;
  /** AI 채점 Raw 점수 (Speaking/Writing, 0-30) */
  aiScore?: number;
  /** AI 채점 밴드 점수 (Speaking/Writing, 0-6) */
  aiBandScore?: number;
  /** AI 채점 피드백 요약 (Speaking/Writing) */
  aiFeedback?: string;
  /** Reading/Listening 모듈 구분 (Module 1 / Module 2 별 개별 저장) */
  module?: 1 | 2;
}
