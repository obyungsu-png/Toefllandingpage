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
}
