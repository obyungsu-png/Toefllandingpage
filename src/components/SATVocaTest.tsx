import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, Check, ChevronRight, BookOpen, BarChart3, RotateCcw, Eye, EyeOff } from 'lucide-react';
import { Button } from './ui/button';
import { WordFlashcard } from './WordFlashcard';
import { SATWord, shuffleArray } from './vocaWordSets';

interface SATVocaTestProps {
  testInfo: {
    type: 'sat_vocabulary';
    testType: 'multiple' | 'subjective' | 'mixed' | 'flashcard';
    questionFormat?: 'eng_to_kor' | 'kor_to_eng' | 'definition_to_eng';
    subjectiveFormat?: 'kor_to_eng' | 'definition_to_eng';
    words: SATWord[];
    totalQuestions: number;
    themeColor?: string;
    selectedDays?: number[];
    wordsFromDB?: SATWord[];
  };
  onExit: () => void;
  onSaveResult?: (result: any) => void;
}

interface Question {
  id: number;
  word: SATWord;
  type: 'multiple' | 'subjective';
  questionFormat: 'eng_to_kor' | 'kor_to_eng' | 'definition_to_eng';
  options?: string[]; // For multiple choice
  correctAnswer: string;
}

export function SATVocaTest({ testInfo, onExit, onSaveResult }: SATVocaTestProps) {
  const themeColor = testInfo.themeColor || '#3D5AA1';
  const [showFlashcard, setShowFlashcard] = useState(testInfo.testType === 'flashcard');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<{ [key: number]: string }>({});
  const [showResults, setShowResults] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [subjectiveInput, setSubjectiveInput] = useState('');
  const [answerFeedback, setAnswerFeedback] = useState<null | 'correct' | 'incorrect'>(null);
  const [showHint, setShowHint] = useState<{ [key: number]: boolean }>({});
  
  // Store original questions and answers for retry
  const [originalQuestions, setOriginalQuestions] = useState<Question[]>([]);
  const [originalAnswers, setOriginalAnswers] = useState<{ [key: number]: string }>({});
  const [isRetryMode, setIsRetryMode] = useState(false);
  
  // Result view state
  const [showOnlyWrong, setShowOnlyWrong] = useState(false);
  const [detailedView, setDetailedView] = useState(false);
  
  // Restart test from beginning
  const restartTest = () => {
    setQuestions(originalQuestions);
    setUserAnswers({});
    setCurrentQuestionIndex(0);
    setShowResults(false);
    setShowOnlyWrong(false);
    setDetailedView(false);
    setIsRetryMode(false);
  };
  
  // Retry wrong answers
  const retryWrongAnswers = () => {
    const wrongQuestions = originalQuestions.filter((question, index) => {
      const userAnswer = originalAnswers[index];
      return !userAnswer || userAnswer.toLowerCase() !== question.correctAnswer.toLowerCase();
    });
    
    if (wrongQuestions.length === 0) {
      alert('모든 문제를 맞췄습니다! 축하합니다!');
      return;
    }
    
    // Reset state and use only wrong questions
    setQuestions(wrongQuestions);
    setUserAnswers({});
    setCurrentQuestionIndex(0);
    setShowResults(false);
    setShowOnlyWrong(false);
    setDetailedView(false);
    setIsRetryMode(true);
  };

  // Auto-hide feedback after 1.5 seconds
  useEffect(() => {
    if (answerFeedback) {
      const timer = setTimeout(() => {
        setAnswerFeedback(null);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [answerFeedback]);

  // Play sound effect
  const playSound = (isCorrect: boolean) => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    if (isCorrect) {
      // Success sound: ascending notes
      oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
      oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1); // E5
      oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2); // G5
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.4);
    } else {
      // Error sound: descending dissonant notes
      oscillator.frequency.setValueAtTime(300, audioContext.currentTime); // Lower frequency
      oscillator.frequency.setValueAtTime(250, audioContext.currentTime + 0.1);
      oscillator.frequency.setValueAtTime(200, audioContext.currentTime + 0.2);
      oscillator.type = 'sawtooth';
      gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    }
  };

  // Generate questions on mount
  useEffect(() => {
    if (testInfo.testType === 'flashcard') return;

    const generatedQuestions: Question[] = [];
    
    if (testInfo.testType === 'mixed' && testInfo.selectedDays && testInfo.wordsFromDB) {
      // Mixed type: DAY-based question generation
      // DAY 3개 이상: 앞의 2개는 객관식, 마지막 1개는 주관식
      // DAY 2개: 첫 번째는 객관식, 두 번째는 주관식
      // DAY 1개: 주관식만
      
      const numDays = testInfo.selectedDays.length;
      
      testInfo.selectedDays.forEach((dayId, dayIndex) => {
        // Get words for this DAY (use appropriate words per day based on content)
        // For simplicity, use a large number for unlimited tabs
        const wordsPerDay = 10000; // Will be sliced by actual content
        const startIndex = (dayId - 1) * wordsPerDay;
        const endIndex = startIndex + wordsPerDay;
        const dayWords = testInfo.wordsFromDB!.slice(startIndex, endIndex);
        
        // Determine test type for this DAY
        let dayTestType: 'multiple' | 'subjective';
        
        if (numDays === 1) {
          // 1 DAY: 주관식만
          dayTestType = 'subjective';
        } else if (numDays === 2) {
          // 2 DAYs: 첫 번째 객관식, 두 번째 주관식
          dayTestType = dayIndex === 0 ? 'multiple' : 'subjective';
        } else {
          // 3개 이상: 마지막 DAY만 주관식, 나머지는 객관식
          dayTestType = dayIndex === numDays - 1 ? 'subjective' : 'multiple';
        }
        
        // Generate questions for this DAY
        dayWords.forEach((word) => {
          const question: Question = {
            id: generatedQuestions.length,
            word,
            type: dayTestType,
            questionFormat: 'kor_to_eng',
            correctAnswer: word.english
          };
          
          if (dayTestType === 'multiple') {
            question.options = generateOptions(word, 'kor_to_eng', testInfo.wordsFromDB!);
          }
          
          generatedQuestions.push(question);
        });
      });
      
      setQuestions(generatedQuestions);
      setOriginalQuestions(generatedQuestions);
    } else if (testInfo.testType === 'mixed') {
      // Mixed type: 50% multiple choice + 50% subjective
      const halfCount = Math.floor(testInfo.words.length / 2);
      
      // First half: Multiple choice (객관식)
      for (let i = 0; i < halfCount; i++) {
        const word = testInfo.words[i];
        const multipleChoiceQuestion: Question = {
          id: generatedQuestions.length,
          word,
          type: 'multiple',
          questionFormat: 'kor_to_eng',
          options: generateOptions(word, 'kor_to_eng', testInfo.words),
          correctAnswer: word.english
        };
        generatedQuestions.push(multipleChoiceQuestion);
      }
      
      // Second half: Subjective (주관식)
      for (let i = halfCount; i < testInfo.words.length; i++) {
        const word = testInfo.words[i];
        const subjectiveQuestion: Question = {
          id: generatedQuestions.length,
          word,
          type: 'subjective',
          questionFormat: 'kor_to_eng',
          correctAnswer: word.english
        };
        generatedQuestions.push(subjectiveQuestion);
      }
      
      setQuestions(shuffleArray(generatedQuestions));
      setOriginalQuestions(shuffleArray(generatedQuestions));
    } else {
      // Non-mixed types: 1 question per word
      testInfo.words.forEach((word, index) => {
        let type: 'multiple' | 'subjective' = testInfo.testType as 'multiple' | 'subjective';
        
        let randomFormat: 'eng_to_kor' | 'kor_to_eng' | 'definition_to_eng';
        
        if (type === 'subjective') {
          // Subjective: only Korean to English or Definition to English
          const subjectiveFormats: Array<'kor_to_eng' | 'definition_to_eng'> = [
            'kor_to_eng',
            'definition_to_eng'
          ];
          randomFormat = testInfo.subjectiveFormat as any || subjectiveFormats[Math.floor(Math.random() * subjectiveFormats.length)];
        } else {
          // Multiple choice: can use any format
          const questionFormats: Array<'eng_to_kor' | 'kor_to_eng' | 'definition_to_eng'> = [
            'eng_to_kor',
            'kor_to_eng',
            'definition_to_eng'
          ];
          randomFormat = testInfo.questionFormat || questionFormats[Math.floor(Math.random() * questionFormats.length)];
        }

        let correctAnswer = '';
        let options: string[] = [];

        if (randomFormat === 'eng_to_kor') {
          correctAnswer = word.korean;
        } else if (randomFormat === 'kor_to_eng') {
          correctAnswer = word.english;
        } else {
          correctAnswer = word.english;
        }

        // Generate options for multiple choice
        if (type === 'multiple') {
          options = generateOptions(word, randomFormat, testInfo.words);
        }

        generatedQuestions.push({
          id: generatedQuestions.length,
          word,
          type,
          questionFormat: randomFormat,
          options,
          correctAnswer
        });
      });
      
      setQuestions(generatedQuestions);
      setOriginalQuestions(generatedQuestions);
    }
  }, [testInfo]);

  // Generate options for multiple choice questions
  const generateOptions = (
    correctWord: SATWord,
    format: 'eng_to_kor' | 'kor_to_eng' | 'definition_to_eng',
    allWords: SATWord[]
  ): string[] => {
    const options: string[] = [];
    
    if (format === 'eng_to_kor') {
      options.push(correctWord.korean);
      const otherWords = allWords.filter(w => w.english !== correctWord.english);
      const shuffled = shuffleArray(otherWords);
      for (let i = 0; i < 3 && i < shuffled.length; i++) {
        options.push(shuffled[i].korean);
      }
    } else {
      options.push(correctWord.english);
      const otherWords = allWords.filter(w => w.english !== correctWord.english);
      const shuffled = shuffleArray(otherWords);
      for (let i = 0; i < 3 && i < shuffled.length; i++) {
        options.push(shuffled[i].english);
      }
    }

    return shuffleArray(options);
  };

  const handleMultipleChoiceAnswer = (answer: string) => {
    // Prevent changing answer once selected
    if (userAnswers[currentQuestionIndex]) {
      return;
    }
    
    setUserAnswers({
      ...userAnswers,
      [currentQuestionIndex]: answer
    });
    const isCorrect = answer.toLowerCase() === questions[currentQuestionIndex].correctAnswer.toLowerCase();
    setAnswerFeedback(isCorrect ? 'correct' : 'incorrect');
    playSound(isCorrect);
  };

  const handleSubjectiveSubmit = () => {
    // Prevent changing answer once submitted
    if (userAnswers[currentQuestionIndex]) {
      return;
    }
    
    if (subjectiveInput.trim()) {
      setUserAnswers({
        ...userAnswers,
        [currentQuestionIndex]: subjectiveInput.trim()
      });
      setSubjectiveInput('');
      const isCorrect = subjectiveInput.trim().toLowerCase() === questions[currentQuestionIndex].correctAnswer.toLowerCase();
      setAnswerFeedback(isCorrect ? 'correct' : 'incorrect');
      playSound(isCorrect);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSubjectiveInput('');
      setAnswerFeedback(null);
    } else {
      // Store original answers before showing results
      if (!isRetryMode) {
        setOriginalAnswers(userAnswers);
        // Save result to server via callback
        if (onSaveResult) {
          let correct = 0;
          const wrongAnswersList: { question: string; userAnswer: string; correctAnswer: string }[] = [];
          questions.forEach((question, index) => {
            const ua = userAnswers[index];
            if (ua && ua.toLowerCase() === question.correctAnswer.toLowerCase()) {
              correct++;
            } else {
              wrongAnswersList.push({
                question: question.word.english,
                userAnswer: ua || '답변 없음',
                correctAnswer: question.correctAnswer
              });
            }
          });
          onSaveResult({
            testName: 'TOEFL 어휘 테스트',
            section: 'Vocabulary',
            date: new Date().toISOString().split('T')[0],
            score: Math.round((correct / questions.length) * 100),
            totalQuestions: questions.length,
            correctAnswers: correct,
            wrongAnswers: wrongAnswersList,
            duration: 0,
            type: 'vocabulary'
          });
        }
      }
      setShowResults(true);
    }
  };

  const calculateResults = () => {
    // Always calculate based on original questions and answers
    const questionsToUse = isRetryMode ? originalQuestions : questions;
    const answersToUse = isRetryMode ? originalAnswers : userAnswers;
    
    let correct = 0;
    questionsToUse.forEach((question, index) => {
      const userAnswer = answersToUse[index];
      if (userAnswer && userAnswer.toLowerCase() === question.correctAnswer.toLowerCase()) {
        correct++;
      }
    });
    return {
      correct,
      total: questionsToUse.length,
      percentage: Math.round((correct / questionsToUse.length) * 100)
    };
  };

  if (showFlashcard) {
    return (
      <WordFlashcard
        words={testInfo.words}
        onFinish={onExit}
        autoPlay={true}
        themeColor={themeColor}
      />
    );
  }

  if (showResults) {
    const results = calculateResults();
    const wrongQuestions = questions.filter((question, index) => {
      const userAnswer = userAnswers[index];
      return !userAnswer || userAnswer.toLowerCase() !== question.correctAnswer.toLowerCase();
    });
    
    const displayQuestions = showOnlyWrong 
      ? questions.filter((question, index) => {
          const userAnswer = userAnswers[index];
          return !userAnswer || userAnswer.toLowerCase() !== question.correctAnswer.toLowerCase();
        })
      : questions;
    
    return (
      <div className="fixed inset-0 z-50 bg-white overflow-y-auto">
        <div className="max-w-4xl mx-auto p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold" style={{ color: themeColor }}>
              시험 결과
            </h1>
            <button onClick={onExit} className="text-gray-500 hover:text-gray-700">
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Compact Results Summary */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 mb-6">
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-sm text-gray-600 mb-1">정답 수</p>
                <p className="text-3xl font-bold" style={{ color: '#4CAF50' }}>
                  {results.correct}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">오답 수</p>
                <p className="text-3xl font-bold text-red-500">
                  {results.total - results.correct}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">
                  <span className="hidden md:inline">전체 문제</span>
                  <span className="md:hidden">문제수</span>
                </p>
                <p className="text-3xl font-bold" style={{ color: themeColor }}>
                  {results.total}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">정답률</p>
                <p className="text-3xl font-bold" style={{ color: themeColor }}>
                  {results.percentage}%
                </p>
              </div>
            </div>
          </div>

          {/* Score Analysis */}
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5" style={{ color: themeColor }} />
              <h3 className="font-bold text-lg">점수 분석</h3>
            </div>
            
            <div className="space-y-3">
              {/* Progress Bar */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">전체 성과</span>
                  <span className="font-medium" style={{ color: themeColor }}>{results.percentage}%</span>
                </div>
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-1000"
                    style={{ 
                      width: `${results.percentage}%`, 
                      backgroundColor: results.percentage >= 80 ? '#4CAF50' : results.percentage >= 60 ? '#FFA726' : '#f44336'
                    }}
                  />
                </div>
              </div>
              
              {/* Performance Message */}
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm">
                  {results.percentage >= 90 && (
                    <span className="text-green-600 font-medium">🎉 훌륭합니다! 거의 완벽한 점수입니다!</span>
                  )}
                  {results.percentage >= 70 && results.percentage < 90 && (
                    <span className="text-blue-600 font-medium">👍 잘했습니다! 조금만 더 노력하면 완벽해질 거예요!</span>
                  )}
                  {results.percentage >= 50 && results.percentage < 70 && (
                    <span className="text-orange-600 font-medium">💪 좋은 시작입니다! 틀린 문제를 다시 풀어보세요!</span>
                  )}
                  {results.percentage < 50 && (
                    <span className="text-red-600 font-medium">📚 복습이 필요합니다. 틀린 문제를 집중적으로 학습하세요!</span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex gap-3 mb-6">
            <Button
              onClick={() => setShowOnlyWrong(!showOnlyWrong)}
              variant={showOnlyWrong ? "default" : "outline"}
              className="flex items-center gap-2"
              style={showOnlyWrong ? { backgroundColor: themeColor, color: 'white' } : {}}
            >
              {showOnlyWrong ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              {showOnlyWrong ? `틀린 문제만 보기 (${wrongQuestions.length})` : `전체 보기 (${questions.length})`}
            </Button>
            <Button
              onClick={() => setDetailedView(!detailedView)}
              variant="outline"
            >
              {detailedView ? '간단히 보기' : '상세히 보기'}
            </Button>
            {wrongQuestions.length > 0 && (
              <Button
                onClick={retryWrongAnswers}
                variant="outline"
                className="flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Replay ({wrongQuestions.length})
              </Button>
            )}
          </div>

          {/* Detailed Results */}
          {detailedView && (
            <div className="space-y-3">
              <h2 className="font-bold text-lg mb-4">상세 결과</h2>
              {displayQuestions.map((question, index) => {
                const originalIndex = questions.findIndex(q => q.id === question.id);
                const userAnswer = userAnswers[originalIndex] || '답변 없음';
                const isCorrect = userAnswer.toLowerCase() === question.correctAnswer.toLowerCase();
                
                return (
                  <motion.div
                    key={question.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border rounded-lg p-4"
                    style={{
                      borderColor: isCorrect ? '#4CAF50' : '#f44336',
                      backgroundColor: isCorrect ? '#f1f8f4' : '#fef1f0'
                    }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-medium">문제 {originalIndex + 1}</h3>
                      {isCorrect ? (
                        <span className="text-green-600 flex items-center gap-1 text-sm">
                          <Check className="w-4 h-4" /> 정답
                        </span>
                      ) : (
                        <span className="text-red-600 flex items-center gap-1 text-sm">
                          <X className="w-4 h-4" /> 오답
                        </span>
                      )}
                    </div>
                    
                    <div className="space-y-1 text-sm">
                      <p className="text-gray-700">
                        <span className="font-medium">문제:</span>{' '}
                        {question.questionFormat === 'eng_to_kor' && `\"${question.word.english}\"의 한글 뜻은?`}
                        {question.questionFormat === 'kor_to_eng' && `\"${question.word.korean}\"의 영어 단어는?`}
                        {question.questionFormat === 'definition_to_eng' && `\"${question.word.definition}\"에 당하는 영어 단어는?`}
                      </p>
                      <p className="text-gray-700">
                        <span className="font-medium">내 답변:</span> <span className={isCorrect ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>{userAnswer}</span>
                      </p>
                      {!isCorrect && (
                        <p className="text-gray-700">
                          <span className="font-medium">정답:</span> <span className="text-green-600 font-medium">{question.correctAnswer}</span>
                        </p>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {!detailedView && (
            <div className="bg-gray-50 rounded-lg p-6 text-center">
              <p className="text-gray-600">상세한 결과를 보려면 \"상세히 보기\" 버튼을 클릭하세요</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-8 flex gap-4 justify-center">
            <Button 
              onClick={restartTest} 
              variant="outline" 
              size="lg"
              className="flex items-center gap-2"
            >
              <RotateCcw className="w-5 h-5" />
              Restart
            </Button>
            {wrongQuestions.length > 0 && (
              <Button 
                onClick={retryWrongAnswers} 
                size="lg"
                className="flex items-center gap-2 text-white"
                style={{ backgroundColor: '#f44336' }}
              >
                <RotateCcw className="w-5 h-5" />
                틀린 문제 다시 풀기 ({wrongQuestions.length})
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="fixed inset-0 z-50 bg-white flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="w-12 h-12 mx-auto mb-4" style={{ color: themeColor }} />
          <p className="text-gray-600">문제를 생성하는 중...</p>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="fixed inset-0 z-50 bg-white overflow-y-auto pb-24 md:pb-0">
      {/* Answer Feedback Overlay */}
      {answerFeedback && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none"
        >
          <div
            className="rounded-full w-48 h-48 flex items-center justify-center shadow-2xl"
            style={{
              backgroundColor: answerFeedback === 'correct' ? '#4CAF50' : '#f44336'
            }}
          >
            {answerFeedback === 'correct' ? (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
              >
                <Check className="w-32 h-32 text-white" strokeWidth={4} />
              </motion.div>
            ) : (
              <motion.div
                initial={{ rotate: 0, scale: 0 }}
                animate={{ rotate: 90, scale: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
              >
                <X className="w-32 h-32 text-white" strokeWidth={4} />
              </motion.div>
            )}
          </div>
        </motion.div>
      )}

      <div className="max-w-3xl mx-auto p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold" style={{ color: themeColor }}>
            TOEFL 어휘 테스트
          </h1>
          <button onClick={onExit} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">
              문제 {currentQuestionIndex + 1} / {questions.length}
            </span>
            <span className="text-sm font-medium" style={{ color: themeColor }}>
              {Math.round(progress)}%
            </span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: themeColor }}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Question */}
        <div className="bg-gray-50 rounded-xl p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6" style={{ color: themeColor }}>
            {currentQuestion.questionFormat === 'eng_to_kor' && (
              <>다음 영어 단어의 한글 뜻을 고르세요:</>
            )}
            {currentQuestion.questionFormat === 'kor_to_eng' && (
              <>다음 한글 뜻에 해당하는 영어 단어를 고르세요:</>
            )}
            {currentQuestion.questionFormat === 'definition_to_eng' && (
              <>다음 영영 정의에 해당하는 영어 단어를 고르세요:</>
            )}
          </h2>

          <div className="bg-white rounded-lg p-6 mb-6 border-2" style={{ borderColor: themeColor }}>
            <p className="text-3xl font-bold text-center" style={{ color: themeColor }}>
              {currentQuestion.questionFormat === 'eng_to_kor' && currentQuestion.word.english}
              {currentQuestion.questionFormat === 'kor_to_eng' && currentQuestion.word.korean}
              {currentQuestion.questionFormat === 'definition_to_eng' && currentQuestion.word.definition}
            </p>
          </div>

          {/* Answer Options */}
          {currentQuestion.type === 'multiple' ? (
            <div className="space-y-3">
              {currentQuestion.options?.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleMultipleChoiceAnswer(option)}
                  className="w-full p-4 rounded-lg border-2 text-left transition-all hover:shadow-md"
                  style={{
                    borderColor: userAnswers[currentQuestionIndex] === option ? themeColor : '#e5e7eb',
                    backgroundColor: userAnswers[currentQuestionIndex] === option ? `${themeColor}10` : 'white'
                  }}
                >
                  <span className="font-medium">{index + 1}. {option}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Hint Display */}
              {showHint[currentQuestionIndex] && (() => {
                const format = currentQuestion.questionFormat;
                const answer = currentQuestion.correctAnswer;
                let hintText = '';
                
                if (format === 'eng_to_kor') {
                  // 영어 → 한글: 1글자 힌트
                  hintText = answer.slice(0, 1) + Array(Math.max(0, answer.length - 1)).fill('_').join('');
                } else if (format === 'kor_to_eng' || format === 'definition_to_eng') {
                  // 한글 → 영어 or 영영풀이 → 영어: 3글자 힌트
                  hintText = answer.slice(0, 3) + Array(Math.max(0, answer.length - 3)).fill('_').join('');
                }
                
                return (
                  <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-3 mb-2">
                    <p className="text-xs text-gray-600 mb-1">힌트:</p>
                    <p className="text-xl font-bold text-center" style={{ color: themeColor }}>
                      {hintText}
                    </p>
                  </div>
                );
              })()}
              
              <input
                type="text"
                value={subjectiveInput}
                onChange={(e) => setSubjectiveInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSubjectiveSubmit();
                  }
                }}
                placeholder="답을 입력하세요"
                className="w-full p-4 border-2 rounded-lg focus:outline-none"
                style={{
                  borderColor: userAnswers[currentQuestionIndex] ? themeColor : '#e5e7eb'
                }}
              />
              
              <div className="flex gap-3">
                <Button
                  onClick={() => setShowHint({ ...showHint, [currentQuestionIndex]: true })}
                  variant="outline"
                  className="flex items-center gap-2"
                  disabled={showHint[currentQuestionIndex] || !!userAnswers[currentQuestionIndex]}
                >
                  <Eye className="w-4 h-4" />
                  힌트
                </Button>
                <Button
                  onClick={handleSubjectiveSubmit}
                  className="flex-1 text-white"
                  style={{ backgroundColor: themeColor }}
                  disabled={!subjectiveInput.trim()}
                >
                  답변 제출
                </Button>
              </div>
              
              {userAnswers[currentQuestionIndex] && (
                <p className="text-sm text-gray-600 text-center">
                  제출된 답변: <span className="font-medium">{userAnswers[currentQuestionIndex]}</span>
                </p>
              )}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <Button
            onClick={() => {
              if (currentQuestionIndex > 0) {
                setCurrentQuestionIndex(currentQuestionIndex - 1);
              }
            }}
            disabled={currentQuestionIndex === 0}
            variant="outline"
          >
            이전
          </Button>

          <Button
            onClick={handleNext}
            disabled={!userAnswers[currentQuestionIndex]}
            className="flex items-center gap-2 text-white"
            style={{ backgroundColor: themeColor }}
          >
            {currentQuestionIndex === questions.length - 1 ? '결과 보기' : '다음'}
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}