export interface TestResult {
  id: string;
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
}
