// Test Result Recording Utility
// 
// 이 파일은 TPO, Test, Training, Vocabulary 컴포넌트에서
// 테스트 결과를 자동으로 기록하는 방법을 보여줍니다.

import { TestResult } from '../components/HistorySection';

/**
 * 테스트 결과를 기록하는 예시 함수
 * 
 * @param onAddTestResult - App.tsx에서 전달받은 결과 추가 함수
 * @param testData - 테스트 데이터
 */

// ============================================
// 1. TPO Reading 섹션에서 결과 기록하기
// ============================================
export function recordTPOResult(
  onAddTestResult: (result: Omit<TestResult, 'id'>) => void,
  tpoNumber: number,
  section: 'Reading' | 'Listening' | 'Writing' | 'Speaking',
  userAnswers: { [key: string]: string },
  correctAnswers: { [key: string]: string },
  questions: { id: string; text: string; explanation?: string }[],
  startTime: number
) {
  const totalQuestions = Object.keys(correctAnswers).length;
  let correctCount = 0;
  const wrongAnswers: TestResult['wrongAnswers'] = [];

  // 정답 체크
  Object.keys(correctAnswers).forEach((questionId) => {
    const userAnswer = userAnswers[questionId];
    const correctAnswer = correctAnswers[questionId];
    const question = questions.find(q => q.id === questionId);

    if (userAnswer === correctAnswer) {
      correctCount++;
    } else {
      wrongAnswers.push({
        questionId,
        questionText: question?.text || 'Question text not available',
        userAnswer: userAnswer || '(답변 없음)',
        correctAnswer,
        explanation: question?.explanation
      });
    }
  });

  const score = Math.round((correctCount / totalQuestions) * 100);
  const timeSpent = Math.floor((Date.now() - startTime) / 1000);

  // 결과 기록
  onAddTestResult({
    type: 'TPO',
    category: section,
    testName: `TPO ${tpoNumber} - ${section}`,
    date: new Date().toISOString(),
    score,
    totalQuestions,
    correctAnswers: correctCount,
    wrongAnswers,
    timeSpent
  });
}

// ============================================
// 2. Training 섹션에서 결과 기록하기
// ============================================
export function recordTrainingResult(
  onAddTestResult: (result: Omit<TestResult, 'id'>) => void,
  trainingName: string,
  category: string,
  userAnswers: string[],
  correctAnswers: string[],
  questions: string[],
  startTime: number
) {
  const totalQuestions = correctAnswers.length;
  let correctCount = 0;
  const wrongAnswers: TestResult['wrongAnswers'] = [];

  // 정답 체크
  correctAnswers.forEach((correct, index) => {
    const userAnswer = userAnswers[index];
    
    if (userAnswer === correct) {
      correctCount++;
    } else {
      wrongAnswers.push({
        questionId: `q${index + 1}`,
        questionText: questions[index] || `Question ${index + 1}`,
        userAnswer: userAnswer || '(답변 없음)',
        correctAnswer: correct
      });
    }
  });

  const score = Math.round((correctCount / totalQuestions) * 100);
  const timeSpent = Math.floor((Date.now() - startTime) / 1000);

  // 결과 기록
  onAddTestResult({
    type: 'Training',
    category,
    testName: trainingName,
    date: new Date().toISOString(),
    score,
    totalQuestions,
    correctAnswers: correctCount,
    wrongAnswers,
    timeSpent
  });
}

// ============================================
// 3. Vocabulary 섹션에서 결과 기록하기
// ============================================
export function recordVocabularyResult(
  onAddTestResult: (result: Omit<TestResult, 'id'>) => void,
  dayNumber: number,
  userAnswers: { [english: string]: string },
  words: Array<{ english: string; korean: string }>,
  startTime: number
) {
  const totalQuestions = words.length;
  let correctCount = 0;
  const wrongAnswers: TestResult['wrongAnswers'] = [];

  // 정답 체크
  words.forEach((word) => {
    const userAnswer = userAnswers[word.english];
    const correctAnswer = word.korean;

    if (userAnswer === correctAnswer) {
      correctCount++;
    } else {
      wrongAnswers.push({
        questionId: word.english,
        questionText: word.english,
        userAnswer: userAnswer || '(답변 없음)',
        correctAnswer
      });
    }
  });

  const score = Math.round((correctCount / totalQuestions) * 100);
  const timeSpent = Math.floor((Date.now() - startTime) / 1000);

  // 결과 기록
  onAddTestResult({
    type: 'Vocabulary',
    category: 'Vocabulary',
    testName: `DAY ${dayNumber} 단어 테스트`,
    date: new Date().toISOString(),
    score,
    totalQuestions,
    correctAnswers: correctCount,
    wrongAnswers,
    timeSpent
  });
}

// ============================================
// 4. Real Test 섹션에서 결과 기록하기
// ============================================
export function recordRealTestResult(
  onAddTestResult: (result: Omit<TestResult, 'id'>) => void,
  testNumber: number,
  section: string,
  userAnswers: { [key: string]: string },
  correctAnswers: { [key: string]: string },
  questions: { id: string; text: string; explanation?: string }[],
  startTime: number
) {
  const totalQuestions = Object.keys(correctAnswers).length;
  let correctCount = 0;
  const wrongAnswers: TestResult['wrongAnswers'] = [];

  // 정답 체크
  Object.keys(correctAnswers).forEach((questionId) => {
    const userAnswer = userAnswers[questionId];
    const correctAnswer = correctAnswers[questionId];
    const question = questions.find(q => q.id === questionId);

    if (userAnswer === correctAnswer) {
      correctCount++;
    } else {
      wrongAnswers.push({
        questionId,
        questionText: question?.text || 'Question text not available',
        userAnswer: userAnswer || '(답변 없음)',
        correctAnswer,
        explanation: question?.explanation
      });
    }
  });

  const score = Math.round((correctCount / totalQuestions) * 100);
  const timeSpent = Math.floor((Date.now() - startTime) / 1000);

  // 결과 기록
  onAddTestResult({
    type: 'Test',
    category: section,
    testName: `Real Test ${testNumber} - ${section}`,
    date: new Date().toISOString(),
    score,
    totalQuestions,
    correctAnswers: correctCount,
    wrongAnswers,
    timeSpent
  });
}

// ============================================
// 사용 예시
// ============================================

/*
// 1. App.tsx에서 각 컴포넌트에 onAddTestResult prop 전달

<TPOReadingComponent 
  onAddTestResult={handleAddTestResult}
  ... other props
/>

// 2. 컴포넌트 내에서 테스트 완료 시 결과 기록

const handleTestComplete = () => {
  recordTPOResult(
    onAddTestResult,
    75, // TPO number
    'Reading',
    userAnswers, // { q1: 'A', q2: 'B', ... }
    correctAnswers, // { q1: 'A', q2: 'C', ... }
    questions, // [{ id: 'q1', text: '...', explanation: '...' }, ...]
    testStartTime
  );
};

// 3. Training 컴포넌트 예시

const handleTrainingComplete = () => {
  recordTrainingResult(
    onAddTestResult,
    'Fill in the Blanks',
    'Reading',
    ['therefore', 'however', ...], // userAnswers
    ['therefore', 'moreover', ...], // correctAnswers
    ['Choose the correct word...', ...], // questions
    testStartTime
  );
};

// 4. Vocabulary 컴포넌트 예시

const handleVocabTestComplete = () => {
  recordVocabularyResult(
    onAddTestResult,
    1, // DAY 1
    { 'accomplish': '성취하다', 'accurate': '정학한', ... }, // userAnswers
    vocabularyWords, // [{ english: 'accomplish', korean: '성취하다' }, ...]
    testStartTime
  );
};
*/
