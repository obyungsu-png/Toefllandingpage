import { useState, useRef, useEffect } from 'react';
// motion removed - using CSS animations
import { ChevronLeft, Play, Pause, Star, StarOff, Check, X, Volume2, ChevronDown, ChevronUp, Mic } from 'lucide-react';
import { TestResult } from './HistorySection';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { loadRecordings } from '../utils/uploadRecording';
import { ToeflAiWidget } from './ToeflAiWidget';

type SectionTab = 'Reading' | 'Listening' | 'Writing' | 'Speaking';

interface QuestionReviewFullProps {
  result: TestResult;
  tpoTests?: any[];
  onBack: () => void;
  themeColor?: string;
  initialSection?: 'Reading' | 'Listening' | 'Writing' | 'Speaking';
  initialIndex?: number;
}

interface ReviewQuestion {
  id: string;
  number: number;
  text: string;
  options: string[];
  userAnswer: string;
  correctAnswer: string;
  explanation?: string;
  isCorrect: boolean;
  hasAudio?: boolean;
  audioText?: string;
  scriptText?: string;
  passageText?: string;
  imageUrl?: string;
  audioUrl?: string;
}

// Writing conversation data
interface WritingConversation {
  speaker: 'A' | 'B';
  avatar: string;
  text: string;
  blanks?: { word: string; isCorrect: boolean; userWord?: string }[];
}

interface WritingBuildSentenceReviewQuestion {
  id: string;
  number: number;
  prompt: string;
  words: string[];
  slotCount: number;
  correctAnswer?: string;
  sentenceEnding?: '.' | '?';
  avatar1ImageUrl?: string;
  avatar2ImageUrl?: string;
}

interface FillBlankReviewConfig {
  id: string;
  passageText?: string;
  blanks: { answer: string; maxLength: number }[];
  fallbackSegments?: string[];
}

// Speaking question data
interface SpeakingQuestion {
  id: string;
  number: number;
  taskGroup: 'Listen and Speak' | 'Take an Interview';
  prompt: string;
  modelLabel: string;
  currentVoice: string;
  voiceAvatar: string;
  modelAudioDuration: number;
  userAudioDuration: number;
  showTextDefault: boolean;
  materialImage?: string;
  materialAudioDuration?: number;
  audioUrl?: string;
  transcript?: string;
}

const sampleWritingConversations: WritingConversation[][] = [
  [
    { speaker: 'A', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face', text: 'Your presentation yesterday was impressive.' },
    { speaker: 'B', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=face', text: 'Thanks.', blanks: [
      { word: 'Do', isCorrect: true },
      { word: 'you want', isCorrect: true },
      { word: 'to send', isCorrect: false, userWord: 'to give' },
      { word: 'you', isCorrect: true },
      { word: 'a copy', isCorrect: true },
      { word: 'of it', isCorrect: false, userWord: 'for it' },
      { word: 'me', isCorrect: true },
    ] },
  ],
  [
    { speaker: 'A', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=face', text: 'I heard the library will be closed next week.' },
    { speaker: 'B', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&crop=face', text: 'Yes,', blanks: [
      { word: 'they are', isCorrect: true },
      { word: 'renovating', isCorrect: true },
      { word: 'the', isCorrect: true },
      { word: 'reading', isCorrect: false, userWord: 'study' },
      { word: 'room', isCorrect: true },
      { word: 'on the', isCorrect: true },
      { word: 'second floor', isCorrect: true },
    ] },
  ],
  [
    { speaker: 'A', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face', text: 'Did you finish the research paper?' },
    { speaker: 'B', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=face', text: 'Almost.', blanks: [
      { word: 'I still', isCorrect: true },
      { word: 'need to', isCorrect: true },
      { word: 'review', isCorrect: false, userWord: 'check' },
      { word: 'the', isCorrect: true },
      { word: 'references', isCorrect: true },
      { word: 'and add', isCorrect: true },
      { word: 'a conclusion', isCorrect: false, userWord: 'an ending' },
    ] },
  ],
];

const defaultWritingBuildSentenceQuestions: WritingBuildSentenceReviewQuestion[] = [
  { id: 'bs-q1', number: 1, prompt: 'What was the highlight of your trip?', words: ['were', 'the', 'was', 'old city', 'showed us around', 'who', 'tour guides'], slotCount: 6 },
  { id: 'bs-q2', number: 2, prompt: 'Are you considering a change?', words: ['a different department', 'if', 'moving to', 'know', 'do', 'you'], slotCount: 5 },
  { id: 'bs-q3', number: 3, prompt: 'How do you usually spend your weekends?', words: ['usually', 'I', 'friends', 'time with', 'spend', 'my'], slotCount: 5 },
  { id: 'bs-q4', number: 4, prompt: 'What are your plans for the summer?', words: ['to', 'planning', "I'm", 'Europe', 'travel'], slotCount: 5 },
  { id: 'bs-q5', number: 5, prompt: 'Did you enjoy the conference?', words: ['was', 'it', 'very', 'yes', 'informative'], slotCount: 4 },
  { id: 'bs-q6', number: 6, prompt: 'Have you finished your project?', words: ['almost', 'I', 'am', 'done', 'yes'], slotCount: 4 },
  { id: 'bs-q7', number: 7, prompt: 'Do you like your new job?', words: ['really', 'I', 'yes', 'it', 'enjoy'], slotCount: 4 },
  { id: 'bs-q8', number: 8, prompt: 'Are you ready for the presentation?', words: ['nervous', 'a bit', 'I', 'but', 'am', 'prepared'], slotCount: 5 },
  { id: 'bs-q9', number: 9, prompt: 'How was the training session?', words: ['helpful', 'very', 'it', 'was', 'and', 'practical'], slotCount: 5 },
  { id: 'bs-q10', number: 10, prompt: 'What did you think of the movie?', words: ['thought', 'I', 'was', 'it', 'excellent'], slotCount: 4 },
];

const defaultReadingCompleteWordsConfigs: FillBlankReviewConfig[] = [
  {
    id: 'reading-module-1-complete-words',
    blanks: [
      { answer: 'ght', maxLength: 3 },
      { answer: 'at', maxLength: 2 },
      { answer: 'ple', maxLength: 3 },
      { answer: 'ly', maxLength: 2 },
      { answer: 'sic', maxLength: 3 },
      { answer: 'ever', maxLength: 4 },
      { answer: 's', maxLength: 1 },
      { answer: 'om', maxLength: 2 },
      { answer: 'ord', maxLength: 3 },
      { answer: 'nces', maxLength: 4 },
    ],
    fallbackSegments: [
      'We know from drawings that have been preserved in caves for over 10,000 years that early humans performed dances as a group activity. We mi',
      ' think th',
      ' prehistoric peo',
      ' concentrated on',
      ' on ba',
      ' survival. How',
      ', it i',
      ' clear fr',
      ' the rec',
      ' that dan',
      ' was important to them.',
    ],
  },
  {
    id: 'reading-module-2-complete-words',
    blanks: [
      { answer: 's', maxLength: 1 },
      { answer: 'to', maxLength: 2 },
      { answer: 'ions', maxLength: 4 },
      { answer: 'th', maxLength: 2 },
      { answer: 'les', maxLength: 3 },
      { answer: 'ts', maxLength: 2 },
      { answer: 'rt', maxLength: 2 },
      { answer: 'lved', maxLength: 4 },
      { answer: 'itive', maxLength: 5 },
      { answer: 'ch', maxLength: 2 },
    ],
    fallbackSegments: [
      'The human brain is a complex organ responsible for controlling all bodily functions and enabling thought, emotion, and memory. It i',
      ' divided in',
      ' several reg',
      ', each wi',
      ' specific ro',
      '. The cerebrum, i',
      ' largest pa',
      ', is invo',
      ' in higher cogn',
      ' functions su',
      ' as reasoning, planning, and language. The cerebellum coordinates movement and balance, while the brainstem controls vital bodily functions like breathing and heart rate. Together, they enable the brain to perform its various tasks.',
    ],
  },
];

const defaultSpeakingQuestions: SpeakingQuestion[] = Array.from({ length: 11 }, (_, index) => {
  const isInterview = index >= 7;
  const number = index + 1;
  return {
    id: `spk-${number}`,
    number,
    taskGroup: isInterview ? 'Take an Interview' : 'Listen and Speak',
    prompt: isInterview
      ? `Interview task ${number - 7}: respond naturally to the interviewer and support your answer with clear details.`
      : `Listen and Speak task ${number}: listen carefully, then repeat or respond using the provided campus or lecture material.`,
    modelLabel: 'Model Answer',
    currentVoice: index % 2 === 0 ? 'Donald Trump' : 'Morgan Freeman',
    voiceAvatar: index % 2 === 0
      ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face'
      : 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&crop=face',
    modelAudioDuration: isInterview ? 18 : 12,
    userAudioDuration: isInterview ? 15 : 8,
    showTextDefault: !isInterview,
    materialImage: !isInterview ? 'https://images.unsplash.com/photo-1633431303895-8236f0a04b46?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400' : undefined,
    materialAudioDuration: !isInterview ? 4 : undefined,
    transcript: isInterview
      ? 'Please describe a meaningful experience and explain why it was important to you.'
      : 'Students are discussing a campus change. Summarize the main point and explain the speaker\'s opinion.',
  };
});

function includesQuestionType(value: string | undefined, candidates: string[]) {
  const normalized = String(value || '').toLowerCase();
  return candidates.some(candidate => normalized.includes(candidate.toLowerCase()));
}

export function QuestionReviewFull({
  result,
  tpoTests = [],
  onBack,
  themeColor = '#005f61',
  initialSection,
  initialIndex = 0
}: QuestionReviewFullProps) {
  const [activeSection, setActiveSection] = useState<SectionTab>(initialSection || (result.category as SectionTab) || 'Reading');
  const [activeModule, setActiveModule] = useState(1);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(initialIndex);
  const [bookmarkedQuestions, setBookmarkedQuestions] = useState<Set<string>>(new Set());
  const [isPlaying, setIsPlaying] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  // Listening detail tabs (Dictation / Key Words / Analysis / Translation)
  const [listeningTab, setListeningTab] = useState<'transcript' | 'keywords' | 'analysis' | 'translation' | null>(null);
  const [audioProgress, setAudioProgress] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const progressInterval = useRef<number | null>(null);

  // Speaking-specific state
  const [speakingModelPlaying, setSpeakingModelPlaying] = useState(false);
  // Real recordings — load from DB (30-day retention) with sessionStorage fallback
  const [speakingRecordings, setSpeakingRecordings] = useState<Record<string, string>>({});
  const [speakingUserPlaying, setSpeakingUserPlaying] = useState(false);
  const [speakingMaterialPlaying, setSpeakingMaterialPlaying] = useState(false);
  const [modelProgress, setModelProgress] = useState(0);
  const [userProgress, setUserProgress] = useState(0);
  const [materialProgress, setMaterialProgress] = useState(0);
  const [showModelText, setShowModelText] = useState(true);
  const [showFullText, setShowFullText] = useState(false);
  const modelInterval = useRef<number | null>(null);
  const userInterval = useRef<number | null>(null);
  const materialInterval = useRef<number | null>(null);

  // Extract TPO number from test name and find test data
  const tpoNumber = (() => {
    const match = result.testName.match(/TPO\s+(\d+)/i);
    return match ? parseInt(match[1]) : null;
  })();
  
  // Find the matching test: by testNumber, or by exact testName match (covers Test/Training)
  const currentTPOTest = tpoTests.find((test: any) =>
    test.testNumber === tpoNumber ||
    test.testName === result.testName ||
    `${test.testType} ${test.testNumber}` === result.testName
  ) || tpoTests.find((test: any) => test.testNumber === tpoNumber);

  if (typeof window !== 'undefined') {
    console.log('[Review] testName:', result.testName, '→ matched test:', currentTPOTest?.testName || currentTPOTest?.testNumber || 'NONE', '| tests available:', tpoTests.length);
  }

  // Load speaking recordings once currentTPOTest is available
  useEffect(() => {
    if (activeSection !== 'Speaking') return;
    const testType   = currentTPOTest?.testType   ?? sessionStorage.getItem('current_test_type')   ?? 'tpo';
    const testNumber = currentTPOTest?.testNumber  ?? Number(sessionStorage.getItem('current_test_number') ?? 0);
    loadRecordings(String(testType), Number(testNumber))
      .then(setSpeakingRecordings)
      .catch(() => {
        try { setSpeakingRecordings(JSON.parse(sessionStorage.getItem('speakingRecordings') || '{}')); }
        catch {}
      });
  }, [activeSection, currentTPOTest]);
  const currentSection = currentTPOTest?.sections?.find((s: any) => s.sectionType === activeSection);
  const passageText = currentSection?.passages?.[0]?.content || null;
  const readingCompleteWordsQuestions = (currentSection?.questions || []).filter((question: any) =>
    includesQuestionType(question?.questionType, ['Complete Words', 'Fill in the Blanks', 'Cloze Test'])
  );
  const readingCompleteWordsQuestion = activeSection === 'Reading'
    ? readingCompleteWordsQuestions[activeModule - 1] || readingCompleteWordsQuestions[0]
    : null;
  const readingCompleteWordsConfig: FillBlankReviewConfig | null = activeSection === 'Reading'
    ? readingCompleteWordsQuestion
      ? {
          id: readingCompleteWordsQuestion.id || `reading-complete-words-${activeModule}`,
          passageText: readingCompleteWordsQuestion.passageText,
          blanks: Array.isArray(readingCompleteWordsQuestion.blanks) ? readingCompleteWordsQuestion.blanks : defaultReadingCompleteWordsConfigs[activeModule - 1]?.blanks || [],
        }
      : defaultReadingCompleteWordsConfigs[activeModule - 1] || defaultReadingCompleteWordsConfigs[0]
    : null;

  // Sample listening questions for correct answers (placeholder text)
  const listeningCorrectSamples = [
    { text: 'Woman: Is the gym open right now?', options: ['I think so.', 'He is tired.', 'Yesterday evening.', 'Last time.'], answer: 'I think so.', audioText: 'Is the gym open right now?' },
    { text: 'What is the main topic of the conversation?', options: ['Campus parking regulations', 'Registering for a new course', 'Applying for financial aid', 'Library operating hours'], answer: 'Registering for a new course', audioText: 'The students discuss the process of registering for a new course.' },
    { text: 'Why does the professor mention photosynthesis?', options: ['To introduce a new concept', 'To review previous material', 'To contrast it with chemosynthesis', 'To explain cellular respiration'], answer: 'To contrast it with chemosynthesis', audioText: 'The professor compares photosynthesis and chemosynthesis.' },
    { text: 'What does the woman suggest the man do?', options: ['Visit the writing center', 'Talk to the professor', 'Drop the course', 'Study with a group'], answer: 'Visit the writing center', audioText: 'Why don\'t you go to the writing center? They can help you with your essay.' },
    { text: 'What can be inferred about the new campus policy?', options: ['It will take effect next semester', 'Students are against it', 'It was proposed by faculty', 'It reduces parking fees'], answer: 'It will take effect next semester', audioText: 'The new policy is scheduled to begin in the fall semester.' },
    { text: 'According to the lecture, what caused the extinction?', options: ['Climate change', 'A volcanic eruption', 'An asteroid impact', 'Loss of habitat'], answer: 'An asteroid impact', audioText: 'The evidence strongly suggests an asteroid impact was the primary cause.' },
    { text: 'What does the man imply when he says "I\'ll believe it when I see it"?', options: ['He is skeptical', 'He is excited', 'He agrees completely', 'He is confused'], answer: 'He is skeptical', audioText: 'I\'ll believe it when I see it.' },
  ];

  // Build questions from result data (for Reading/Listening)
  const questions: ReviewQuestion[] = (() => {
    if (activeSection === 'Writing' || activeSection === 'Speaking') return [];
    const qs: ReviewQuestion[] = [];
    const wrongQs = result.wrongAnswers;
    const wrongIds = new Set(wrongQs.map(w => w.questionId));
    
    // Try to get real questions from CMS data — filtered by active module
    const isModule2Q = (q: any) => (q?.questionType || '').toLowerCase().includes('module 2');
    const isFillBlanksQ = (q: any) => {
      const t = (q?.questionType || '').toLowerCase();
      return t.includes('complete words') || t.includes('fill in the blank') || t.includes('cloze');
    };
    const allRealQuestions = currentSection?.questions || [];
    const realQuestions = activeSection === 'Reading' || activeSection === 'Listening'
      ? (activeModule === 2
          ? allRealQuestions.filter(isModule2Q)
          // Module 1 Reading: exclude FillBlanks (Q1-10) — they are shown separately in Complete Words review
          : allRealQuestions.filter((q: any) => !isModule2Q(q) && (activeSection !== 'Reading' || !isFillBlanksQ(q))))
      : allRealQuestions;
    
    // For Reading Module 1, realQuestions are Q11-Q20 (FillBlanks excluded above)
    const readingM1Offset = (activeSection === 'Reading' && activeModule === 1) ? 10 : 0;

    // Total = max(result total, CMS question count for this module) so all CMS questions show
    const cmsCount = realQuestions.length + readingM1Offset;
    const totalQ = Math.max(result.totalQuestions || 0, cmsCount);

    for (let i = 0; i < totalQ; i++) {
      const realQ = realQuestions[i - readingM1Offset];
      const qNum = i + 1;
      const wrong = wrongQs.find(w => w.questionId === String(qNum) || parseInt(w.questionId) === qNum);
      const isWrong = !!wrong;
      const sample = activeSection === 'Listening' && listeningCorrectSamples[i % listeningCorrectSamples.length];
      
      if (realQ) {
        // Use real CMS question data
        qs.push({
          id: realQ.id || `q-${i}`,
          number: qNum,
          text: realQ.questionText || realQ.text || `Question ${qNum}`,
          options: realQ.options || (wrong ? generateOptions(wrong.correctAnswer, wrong.userAnswer) : ['Option A', 'Option B', 'Option C', 'Option D']),
          userAnswer: isWrong ? (wrong?.userAnswer || '') : (realQ.correctAnswer || 'A'),
          correctAnswer: isWrong ? (wrong?.correctAnswer || realQ.correctAnswer || 'A') : (realQ.correctAnswer || 'A'),
          explanation: wrong?.explanation,
          isCorrect: !isWrong,
          hasAudio: activeSection === 'Listening',
          audioText: realQ.scriptText || realQ.audioText || undefined,
          scriptText: realQ.scriptText,
          audioUrl: realQ.audioUrl,
          passageText: realQ.passageText || passageText,
          imageUrl: realQ.imageUrl,
        });
      } else {
        // Fallback to sample data
        qs.push({
          id: `correct-${i}`,
          number: i + 1,
          text: sample ? sample.text : `Question ${i + 1}`,
          options: sample ? sample.options : ['Option A', 'Option B', 'Option C', 'Option D'],
          userAnswer: sample ? sample.answer : 'A',
          correctAnswer: sample ? sample.answer : 'A',
          isCorrect: true,
          hasAudio: activeSection === 'Listening',
          audioText: sample ? sample.audioText : (activeSection === 'Listening' ? 'Audio transcript for this question.' : undefined),
          passageText: passageText,
        });
      }
    }
    
    // Add remaining wrong answers that weren't covered by the loop
    // Skip blank-N IDs (they belong to Complete Words / FillBlanks Q1-10, shown separately)
    wrongQs.forEach((wrong) => {
      // Skip FillBlanks entries (blank-1, blank-2, ...) — shown in Complete Words review
      if (/^blank-/i.test(wrong.questionId)) return;
      const alreadyAdded = qs.find(q => q.id === wrong.questionId || String(q.number) === wrong.questionId);
      if (!alreadyAdded) {
        const num = parseInt(wrong.questionId);
        // Only add if within the expected totalQ range (prevent extra pills beyond 20)
        if (!num || num < 1 || num > totalQ) return;
        qs.push({
          id: wrong.questionId,
          number: num,
          text: wrong.questionText,
          options: generateOptions(wrong.correctAnswer, wrong.userAnswer),
          userAnswer: wrong.userAnswer,
          correctAnswer: wrong.correctAnswer,
          explanation: wrong.explanation,
          isCorrect: false,
          hasAudio: activeSection === 'Listening',
          audioText: activeSection === 'Listening' ? 'Audio transcript for this question.' : undefined,
          passageText: passageText,
        });
      }
    });
    
    // Sort by question number and cap at totalQ to ensure exactly 20 pills
    qs.sort((a, b) => a.number - b.number);
    return qs.slice(0, totalQ);
  })();

  const writingConversations = sampleWritingConversations;

  const speakingQuestionsFromCms: SpeakingQuestion[] = activeSection === 'Speaking'
    ? (currentSection?.questions || []).slice(0, 11).map((question: any, index: number) => {
        const isInterview = index >= 7;
        return {
          id: question.id || `spk-${index + 1}`,
          number: index + 1,
          taskGroup: isInterview ? 'Take an Interview' : 'Listen and Speak',
          prompt: question.questionText || question.text || (isInterview ? `Interview task ${index - 6}` : `Listen and Speak task ${index + 1}`),
          modelLabel: 'Model Answer',
          currentVoice: isInterview ? 'Interviewer' : 'Speaker',
          voiceAvatar: question.introImageUrl || question.imageUrl || '',
          modelAudioDuration: Number(question.duration) || (isInterview ? 45 : 8),
          userAudioDuration: Number(question.duration) || (isInterview ? 45 : 8),
          showTextDefault: !isInterview,
          materialImage: question.imageUrl || question.introImageUrl,
          materialAudioDuration: question.audioUrl ? 5 : undefined,
          audioUrl: question.audioUrl,
          transcript: question.passageText || question.scriptText || question.questionText || question.text,
        };
      })
    : [];

  const allSpeakingQuestions = activeSection === 'Speaking'
    ? (speakingQuestionsFromCms.length > 0 ? speakingQuestionsFromCms : defaultSpeakingQuestions)
    : [];
  const speakingQs = activeSection === 'Speaking'
    ? (activeModule === 1 ? allSpeakingQuestions.slice(0, 7) : allSpeakingQuestions.slice(7, 11))
    : [];
  const speakingQuestionCount = speakingQs.length;
  const showReadingCompleteWordsReview = activeSection === 'Reading' && currentQuestionIndex < 10 && !!readingCompleteWordsConfig;

  // Determine total questions based on section/module
  const totalQuestions = activeSection === 'Writing'
    ? activeModule === 1
      ? 10
      : 1
    : activeSection === 'Speaking'
    ? speakingQuestionCount
    : questions.length;

  const currentQuestion = questions[currentQuestionIndex] || questions[0];
  const correctCount = activeSection === 'Writing' || activeSection === 'Speaking' 
    ? result.correctAnswers 
    : questions.filter(q => q.isCorrect).length;

  // Calculate time display
  const timeMinutes = result.timeSpent ? Math.floor(result.timeSpent / 60) : 0;
  const timeSeconds = result.timeSpent ? result.timeSpent % 60 : 0;
  const timeDisplay = `${timeMinutes}'${String(timeSeconds).padStart(2, '0')}"`;

  // Audio simulation for Listening
  useEffect(() => {
    if (isPlaying) {
      progressInterval.current = window.setInterval(() => {
        setAudioProgress(prev => {
          if (prev >= 100) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 2;
        });
      }, 100);
    } else {
      if (progressInterval.current) clearInterval(progressInterval.current);
    }
    return () => {
      if (progressInterval.current) clearInterval(progressInterval.current);
    };
  }, [isPlaying]);

  // Speaking audio simulations
  useEffect(() => {
    if (speakingModelPlaying) {
      modelInterval.current = window.setInterval(() => {
        setModelProgress(prev => {
          if (prev >= 100) { setSpeakingModelPlaying(false); return 0; }
          return prev + 2;
        });
      }, 100);
    } else {
      if (modelInterval.current) clearInterval(modelInterval.current);
    }
    return () => { if (modelInterval.current) clearInterval(modelInterval.current); };
  }, [speakingModelPlaying]);

  useEffect(() => {
    if (speakingUserPlaying) {
      userInterval.current = window.setInterval(() => {
        setUserProgress(prev => {
          if (prev >= 100) { setSpeakingUserPlaying(false); return 0; }
          return prev + 2;
        });
      }, 100);
    } else {
      if (userInterval.current) clearInterval(userInterval.current);
    }
    return () => { if (userInterval.current) clearInterval(userInterval.current); };
  }, [speakingUserPlaying]);

  useEffect(() => {
    if (speakingMaterialPlaying) {
      materialInterval.current = window.setInterval(() => {
        setMaterialProgress(prev => {
          if (prev >= 100) { setSpeakingMaterialPlaying(false); return 0; }
          return prev + 2;
        });
      }, 100);
    } else {
      if (materialInterval.current) clearInterval(materialInterval.current);
    }
    return () => { if (materialInterval.current) clearInterval(materialInterval.current); };
  }, [speakingMaterialPlaying]);

  const toggleBookmark = (qId: string) => {
    setBookmarkedQuestions(prev => {
      const next = new Set(prev);
      if (next.has(qId)) next.delete(qId);
      else next.add(qId);
      return next;
    });
  };

  // Reset audio states on question change
  useEffect(() => {
    setSpeakingModelPlaying(false);
    setSpeakingUserPlaying(false);
    setSpeakingMaterialPlaying(false);
    setModelProgress(0);
    setUserProgress(0);
    setMaterialProgress(0);
    setShowModelText(true);
    setShowFullText(false);
    setIsPlaying(false);
    setAudioProgress(0);
  }, [currentQuestionIndex]);

  const sectionTabs: SectionTab[] = ['Reading', 'Listening', 'Writing', 'Speaking'];

  const writingSectionQuestions = currentSection?.questions || [];
  const writingBuildSentenceFromCms = writingSectionQuestions
    .filter((question: any) => {
      const type = String(question?.questionType || '').toLowerCase();
      return type.includes('build a sentence') || type.includes('sentence');
    })
    .slice(0, 10)
    .map((question: any, index: number) => {
      const cmsWords = Array.isArray(question?.words)
        ? question.words
        : Array.isArray(question?.options)
        ? question.options
        : [];

      return {
        id: `bs-q${index + 1}`,
        number: index + 1,
        prompt: question?.questionText || question?.text || defaultWritingBuildSentenceQuestions[index]?.prompt || `Build a Sentence ${index + 1}`,
        words: cmsWords.length > 0 ? cmsWords : (defaultWritingBuildSentenceQuestions[index]?.words || []),
        slotCount: Number(question?.slotCount) || (defaultWritingBuildSentenceQuestions[index]?.slotCount || 5),
        correctAnswer: question?.correctAnswer as string || undefined,
        sentenceEnding: (question?.sentenceEnding as '.' | '?') || '.',
        avatar1ImageUrl: question?.avatar1ImageUrl || undefined,
        avatar2ImageUrl: question?.avatar2ImageUrl || undefined,
      } as WritingBuildSentenceReviewQuestion;
    });

  const writingBuildSentenceQuestions = defaultWritingBuildSentenceQuestions.map((fallback, index) => {
    const cmsQuestion = writingBuildSentenceFromCms[index];
    return cmsQuestion
      ? {
          ...fallback,
          ...cmsQuestion,
          words: cmsQuestion.words.length > 0 ? cmsQuestion.words : fallback.words,
        }
      : fallback;
  });

  const writingModuleQuestionCount = activeSection === 'Writing'
    ? activeModule === 1
      ? writingBuildSentenceQuestions.length
      : 1
    : 0;

  // Writing question pill data
  const writingPills = Array.from({ length: writingModuleQuestionCount }, (_, i) => ({
    id: `writing-${activeModule}-${i + 1}`,
    number: i + 1,
  }));

  // Speaking question pill data
  const speakingPills = speakingQs.map((q, i) => ({
    id: q.id,
    number: q.number,
    isCorrect: true, // Speaking doesn't have right/wrong in the same way
  }));

  const currentSpeakingQ = speakingQs[currentQuestionIndex] || speakingQs[0];
  const currentWritingConv = writingConversations[currentQuestionIndex % writingConversations.length];
  const currentWritingBuildSentence = writingBuildSentenceQuestions[currentQuestionIndex] || writingBuildSentenceQuestions[0];

  // CMS Writing questions (Email / Academic Discussion) for dynamic review
  const writingCmsQuestions = (activeSection === 'Writing' ? (currentSection?.questions || []) : []) as any[];
  const cmsEmailQ = writingCmsQuestions.find(q => q.questionType === 'Write an Email');
  const cmsAcademicQ = writingCmsQuestions.find(q => q.questionType === 'Academic Discussion');

  const renderCompleteWordsPassage = () => {
    if (!readingCompleteWordsConfig) return null;

    const inputWidth = (blank: { answer: string; maxLength: number }) => `${Math.max(blank.maxLength || 3, (blank.answer || '').length) * 14 + 8}px`;

    const rawPassage = readingCompleteWordsConfig.passageText || '';
    
    // Normalize: convert [answer:maxLen] → [N] and build blanks array if needed
    let normalizedPassage = rawPassage;
    let extractedBlanks: { answer: string; maxLength: number }[] = readingCompleteWordsConfig.blanks || [];
    
    if (/\[[^\]]+:\d+\]/.test(rawPassage)) {
      // CMS format: word[answer:maxLen] → extract and replace with [N]
      const newBlanks: { answer: string; maxLength: number }[] = [];
      let idx = 0;
      normalizedPassage = rawPassage.replace(/\[([^\]]+):(\d+)\]/g, (_: string, answer: string, maxLen: string) => {
        newBlanks.push({ answer: answer.trim(), maxLength: parseInt(maxLen) });
        return `[${idx++}]`;
      });
      if (newBlanks.length > 0) extractedBlanks = newBlanks;
    }

    if (normalizedPassage) {
      const parts: React.ReactNode[] = [];
      const regex = /\[(\d+)\]/g;
      let lastIndex = 0;
      let match: RegExpExecArray | null;
      let key = 0;

      while ((match = regex.exec(normalizedPassage)) !== null) {
        const blankIndex = Number(match[1]);
        const blank = extractedBlanks[blankIndex];
        const beforeText = normalizedPassage.slice(lastIndex, match.index);

        if (beforeText) parts.push(<span key={`text-${key++}`}>{beforeText}</span>);
        if (blank) {
          // Find if user got this blank wrong
          const blankNum = blankIndex + 1;
          const wrongEntry = result.wrongAnswers.find(w =>
            w.questionId === String(blankNum) || w.questionId === `blank-${blankNum}` ||
            (w.questionId === '1-10' && w.userAnswer?.split(',')[blankIndex])
          );
          const userAnswerForBlank = wrongEntry?.userAnswer?.split(',')?.[blankIndex]?.trim() || null;
          const isBlankCorrect = !wrongEntry || (wrongEntry && userAnswerForBlank === blank.answer);
          parts.push(
            <span key={`blank-${blankIndex}`} className="inline-flex flex-col items-center mx-0.5 align-bottom">
              <span
                className={`inline-block border-b-2 px-1 text-sm font-bold min-w-[28px] text-center rounded-sm ${
                  isBlankCorrect
                    ? 'border-green-500 text-green-700 bg-green-50'
                    : 'border-red-500 text-red-700 bg-red-50'
                }`}
                style={{ minWidth: inputWidth(blank) }}
              >
                {blank.answer}
              </span>
              {!isBlankCorrect && userAnswerForBlank && (
                <span className="text-[9px] text-gray-400 line-through">{userAnswerForBlank}</span>
              )}
            </span>
          );
        }

        lastIndex = match.index + match[0].length;
      }

      if (lastIndex < readingCompleteWordsConfig.passageText.length) {
        parts.push(<span key={`text-${key++}`}>{readingCompleteWordsConfig.passageText.slice(lastIndex)}</span>);
      }

      return parts;
    }

    if (readingCompleteWordsConfig.fallbackSegments) {
      return readingCompleteWordsConfig.blanks.flatMap((blank, index) => {
        const nodes: React.ReactNode[] = [];
        const prefix = readingCompleteWordsConfig.fallbackSegments?.[index];
        const suffix = index === readingCompleteWordsConfig.blanks.length - 1
          ? readingCompleteWordsConfig.fallbackSegments?.[index + 1]
          : null;

        if (prefix) nodes.push(<span key={`segment-${index}`}>{prefix}</span>);
        nodes.push(
          <input
            key={`fallback-blank-${index}`}
            type="text"
            readOnly
            disabled
            value={blank.answer}
            className="gap-input filled"
            style={{ width: inputWidth(blank) }}
          />
        );
        if (suffix) nodes.push(<span key={`segment-tail-${index}`}>{suffix}</span>);

        return nodes;
      });
    }

    return null;
  };

  // Module tab label helper
  const getModuleTabLabel = (mod: number) => {
    if (activeSection === 'Writing') {
      if (mod === 1) return 'Build a Sentence';
      if (mod === 2) return 'Writing an Email';
      return 'Academic Discussion';
    }
    if (activeSection === 'Speaking') return mod === 1 ? 'Listen and Speak' : 'Take an Interview';
    return `Module ${mod}`;
  };

  useEffect(() => {
    if (activeSection !== 'Writing') return;

    const maxIndex = activeModule === 1 ? Math.max(0, writingBuildSentenceQuestions.length - 1) : 0;
    if (currentQuestionIndex > maxIndex) {
      setCurrentQuestionIndex(0);
    }
  }, [activeModule, activeSection, currentQuestionIndex, writingBuildSentenceQuestions.length]);

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="border-b border-gray-200 px-4 md:px-6 py-3 shrink-0">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-gray-600 hover:text-gray-900 transition-colors mb-3"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Back</span>
        </button>

        {/* Section Tabs */}
        <div className="flex justify-center mb-2 md:mb-3">
          <div className="inline-flex bg-gray-100 rounded-full p-0.5 md:p-1">
            {sectionTabs.map(tab => (
              <button
                key={tab}
                className={`px-4 md:px-10 py-2 md:py-3 rounded-full text-sm md:text-lg font-bold transition-all cursor-pointer ${
                  activeSection === tab
                    ? 'text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
                style={{
                  backgroundColor: activeSection === tab ? themeColor : undefined
                }}
                onClick={() => { setActiveSection(tab); setCurrentQuestionIndex(0); }}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Module/Task Tabs */}
        <div className="flex items-center justify-center">
          <div className="flex gap-3 md:gap-4">
            {(activeSection === 'Writing' ? [1, 2, 3] : [1, 2]).map(mod => (
              <button
                key={mod}
                onClick={() => { setActiveModule(mod); setCurrentQuestionIndex(0); }}
                className={`text-xs md:text-xl font-medium pb-1.5 md:pb-2 border-b-2 transition-all ${
                  activeModule === mod
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}
              >
                {getModuleTabLabel(mod)}
              </button>
            ))}
          </div>
        </div>

        {/* Question Navigation + Stats */}
        <div className="relative flex items-center justify-center mt-3">
          {/* Question Pills */}
          <div className="flex flex-wrap gap-1.5 justify-center">
            {activeSection === 'Writing' && writingPills.map((q, idx) => {
              const isCurrent = idx === currentQuestionIndex;
              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentQuestionIndex(idx)}
                  className={`w-7 h-7 md:w-10 md:h-10 rounded-full text-[11px] md:text-base font-bold flex items-center justify-center transition-all ${
                    isCurrent
                      ? 'text-white shadow-lg scale-110'
                      : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
                  }`}
                  style={{
                    backgroundColor: isCurrent ? themeColor : undefined,
                    borderColor: isCurrent ? themeColor : undefined
                  }}
                >
                  Q{q.number}
                </button>
              );
            })}
            {activeSection === 'Speaking' && speakingPills.map((q, idx) => {
              const isCurrent = idx === currentQuestionIndex;
              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentQuestionIndex(idx)}
                  className={`w-7 h-7 md:w-10 md:h-10 rounded-full text-[11px] md:text-base font-bold flex items-center justify-center transition-all ${
                    isCurrent
                      ? 'text-white shadow-lg scale-110'
                      : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
                  }`}
                  style={{
                    backgroundColor: isCurrent ? themeColor : undefined,
                    borderColor: isCurrent ? themeColor : undefined
                  }}
                >
                  Q{q.number}
                </button>
              );
            })}
            {(activeSection === 'Reading' || activeSection === 'Listening') && questions.map((q, idx) => {
              const isCurrent = idx === currentQuestionIndex;
              const isCorrect = q.isCorrect;
              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentQuestionIndex(idx)}
                  className={`w-7 h-7 md:w-10 md:h-10 rounded-full text-[11px] md:text-base font-bold flex items-center justify-center transition-all ${
                    isCurrent
                      ? 'text-white shadow-lg scale-110'
                      : isCorrect
                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100'
                      : 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100'
                  }`}
                  style={{
                    backgroundColor: isCurrent ? themeColor : undefined,
                    borderColor: isCurrent ? themeColor : undefined
                  }}
                >
                  Q{q.number}
                </button>
              );
            })}
          </div>

          {/* Stats */}
          <div className="hidden md:flex items-center gap-4 text-sm text-gray-600 shrink-0 absolute right-0">
            {activeSection !== 'Speaking' && activeSection !== 'Writing' && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg">
                <span className="text-gray-500 text-base">Score</span>
                <strong className="text-gray-900 text-base">{correctCount}<span className="text-gray-400 font-normal">/{totalQuestions}</span></strong>
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                  correctCount/totalQuestions >= 0.8 ? 'bg-green-100 text-green-700' :
                  correctCount/totalQuestions >= 0.6 ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>{Math.round(correctCount/totalQuestions*100)}%</span>
              </div>
            )}
            <span>
              Time: <strong className="text-gray-900">{timeDisplay}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        {/* ===== READING / LISTENING CONTENT ===== */}
        {(activeSection === 'Reading' || activeSection === 'Listening') && (
          showReadingCompleteWordsReview ? (
            <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 flex flex-col md:flex-row gap-6">
              <div className="flex-1 min-w-0">
                <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <p className="text-sm text-gray-500">Questions 1-10</p>
                      <h3 className="text-2xl font-bold text-gray-900 mt-1">Complete Words</h3>
                    </div>
                    <button
                      onClick={() => toggleBookmark(readingCompleteWordsConfig?.id || '')}
                      className="flex items-center gap-1 text-sm text-gray-500 hover:text-yellow-500 transition-colors"
                    >
                      {bookmarkedQuestions.has(readingCompleteWordsConfig?.id || '') ? (
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      ) : (
                        <StarOff className="w-4 h-4" />
                      )}
                      <span>{bookmarkedQuestions.has(readingCompleteWordsConfig?.id || '') ? 'Bookmarked' : 'Bookmark'}</span>
                    </button>
                  </div>

                  <p className="mb-8 text-xl md:text-[1.75rem] text-black font-bold text-center">
                    Fill in the missing letters in the paragraph.
                  </p>

                  <div
                    className="text-lg md:text-[1.25rem] leading-[1.8] text-black"
                    style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}
                  >
                    {renderCompleteWordsPassage()}
                  </div>
                </div>

                <div className="flex justify-between mt-8 pb-6">
                  <button
                    onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                    disabled={currentQuestionIndex === 0}
                    className="px-7 py-3.5 rounded-lg text-lg font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    ← Previous
                  </button>
                  <button
                    onClick={() => setCurrentQuestionIndex(Math.min(totalQuestions - 1, currentQuestionIndex + 1))}
                    disabled={currentQuestionIndex === totalQuestions - 1}
                    className="px-7 py-3.5 rounded-lg text-lg font-medium text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    style={{ backgroundColor: themeColor }}
                  >
                    Next →
                  </button>
                </div>
              </div>

              <div className="w-full md:w-80 shrink-0">
                <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 sticky top-4">
                  <h4 className="text-sm font-bold text-gray-800 mb-3">Review Note</h4>
                  <p className="text-sm text-gray-600 leading-relaxed mb-4">
                    Reading Module {activeModule}의 1-10번은 TPO 기준 Complete Words 유형입니다. Review에서도 객관식이 아니라 빈칸 본문 형태로 표시되도록 맞췄습니다.
                  </p>
                  <div className="space-y-2">
                    {(() => {
                      // Parse blanks from CMS format if needed
                      const rawP = readingCompleteWordsConfig?.passageText || '';
                      let displayBlanks = readingCompleteWordsConfig?.blanks || [];
                      if (/\[[^\]]+:\d+\]/.test(rawP)) {
                        const parsed: {answer:string;maxLength:number}[] = [];
                        rawP.replace(/\[([^\]]+):(\d+)\]/g, (_:string, ans:string, ml:string) => {
                          parsed.push({answer:ans.trim(), maxLength:parseInt(ml)});
                          return '';
                        });
                        if (parsed.length > 0) displayBlanks = parsed;
                      }
                      return displayBlanks.map((blank, index) => {
                        const wrongEntry = result.wrongAnswers.find(w =>
                          w.questionId === `blank-${index+1}`
                        );
                        const isCorrect = !wrongEntry;
                        const userAns = wrongEntry?.userAnswer || null;
                        return (
                          <div key={`answer-key-${index}`} className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm ${
                            isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                          }`}>
                            <span className="text-gray-500">Blank {index + 1}</span>
                            <div className="flex items-center gap-2">
                              {!isCorrect && userAns && (
                                <span className="text-xs text-red-400 line-through">{userAns}</span>
                              )}
                              <span className={`font-semibold ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                                {blank.answer}
                              </span>
                              {isCorrect
                                ? <Check className="w-3.5 h-3.5 text-green-500" />
                                : <X className="w-3.5 h-3.5 text-red-500" />
                              }
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              </div>
            </div>
          ) : (
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 flex flex-col md:flex-row gap-6">
            {/* Left Panel: Passage (for Reading) - Equal width 50% */}
            {activeSection === 'Reading' && (
              <div className="w-full md:w-1/2 order-1 md:order-none">
                <div className="bg-gray-50 rounded-xl border border-gray-200 p-5 h-full overflow-y-auto" style={{ maxHeight: '70vh' }}>
                  {(() => {
                    // Use passageText from the already-correctly-mapped currentQuestion
                    // (currentQuestion is built with correct CMS offset for Q11-20)
                    const rawPassage = currentQuestion?.passageText || null;
                    
                    // Also try to get passageTitle from the mapped CMS question
                    const readingM1Offset = activeModule === 1 ? 10 : 0;
                    const isFBQ = (q: any) => {
                      const t = (q?.questionType || '').toLowerCase();
                      return t.includes('complete words') || t.includes('fill in the blank') || t.includes('cloze');
                    };
                    const filteredCmsQuestions = (currentSection?.questions || []).filter((q: any) => !isFBQ(q));
                    const mappedCmsQ = filteredCmsQuestions[currentQuestionIndex - readingM1Offset];
                    const passageTitle = mappedCmsQ?.passageTitle || null;
                    const emailMeta = mappedCmsQ?.emailMeta || null; // e.g. {to, from, date, subject}
                    
                    // Parse JSON template if needed
                    let passageContent: string | null = null;
                    if (rawPassage) {
                      try {
                        const parsed = JSON.parse(rawPassage);
                        if (parsed.fields?.body) passageContent = parsed.fields.body;
                        else if (parsed.passage) passageContent = parsed.passage;
                        else passageContent = rawPassage;
                      } catch { passageContent = rawPassage; }
                    }
                    
                    return passageContent ? (
                      <>
                        {passageTitle && (
                          <h4 className="text-base font-bold text-gray-900 mb-3">{passageTitle}</h4>
                        )}
                        <p className="text-[15px] font-medium text-gray-800 leading-relaxed whitespace-pre-wrap">{passageContent}</p>
                      </>
                    ) : (
                      <p className="text-sm text-gray-400 italic">지문을 불러올 수 없습니다.</p>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* Left Panel: Audio Player (for Listening) - Equal width 50% */}
            {activeSection === 'Listening' && (() => {
              const realQ = (currentSection?.questions || [])[currentQuestionIndex];
              const imageUrl = currentQuestion?.imageUrl || realQ?.imageUrl;
              const transcript = realQ?.scriptText || realQ?.audioText || realQ?.transcript || currentQuestion?.audioText;
              const translation = realQ?.translation || realQ?.koreanTranslation;
              const keyWords: string[] = realQ?.keyWords || realQ?.vocabulary || [];
              const analysis = realQ?.analysis || realQ?.explanation || currentQuestion?.explanation;
              return (
                <div className="w-full md:w-1/2 order-1 md:order-none">
                  <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 md:p-5 h-full overflow-y-auto">
                    {/* Listening Image (CMS) — full face visible */}
                    {imageUrl ? (
                      <div className="rounded-lg overflow-hidden mb-4 border border-gray-200 bg-white flex items-center justify-center" style={{ maxHeight: '320px' }}>
                        <img
                          src={imageUrl}
                          alt="Listening question context"
                          className="w-full h-auto object-contain"
                          style={{ maxHeight: '320px' }}
                        />
                      </div>
                    ) : (
                      <div className="rounded-lg mb-4 border-2 border-dashed border-gray-200 bg-white flex items-center justify-center text-gray-300 text-xs" style={{ height: '180px' }}>
                        No image
                      </div>
                    )}

                    {/* Audio Player */}
                    {(() => { if (typeof window !== 'undefined') console.log('[Review] Listening Q', currentQuestion?.number, 'audioUrl:', currentQuestion?.audioUrl || 'NONE'); return null; })()}
                    {currentQuestion?.audioUrl ? (
                      <audio controls src={currentQuestion.audioUrl} className="w-full h-10 mb-3" />
                    ) : (
                      <div className="mb-3 text-xs text-gray-400 italic px-1">
                        CMS에 등록된 오디오가 없습니다.
                      </div>
                    )}

                    {/* Feature Tabs: Dictation / Key Words / Analysis / Practice */}
                    <div className="grid grid-cols-4 gap-2 mb-3">
                      {[
                        { key: 'transcript', label: 'Script', icon: '🔊' },
                        { key: 'keywords', label: 'Key Words', icon: '✨' },
                        { key: 'analysis', label: 'Analysis', icon: '📄' },
                        { key: 'translation', label: 'Translation', icon: '🌐' },
                      ].map(tab => {
                        const isActive = listeningTab === tab.key;
                        return (
                          <button
                            key={tab.key}
                            onClick={() => setListeningTab(isActive ? null : tab.key as any)}
                            className={`flex flex-col items-center gap-1 py-2 rounded-lg border transition-all ${
                              isActive
                                ? 'text-white border-transparent shadow-sm'
                                : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:text-gray-700'
                            }`}
                            style={isActive ? { backgroundColor: themeColor } : {}}
                          >
                            <span className="text-base leading-none">{tab.icon}</span>
                            <span className="text-[10px] font-semibold">{tab.label}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Tab content */}
                    {listeningTab && (
                      <div className="bg-white rounded-lg border border-gray-200 p-4 animate-[fadeSlideUp_0.2s_ease-out]">
                        {listeningTab === 'transcript' && (
                          <>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">📝 Script</p>
                            <p className="text-sm italic leading-relaxed" style={{ color: themeColor }}>
                              {transcript || 'CMS에 등록된 스크립트가 없습니다.'}
                            </p>
                          </>
                        )}
                        {listeningTab === 'keywords' && (
                          <>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">✨ Key Words</p>
                            {keyWords.length > 0 ? (
                              <div className="flex flex-wrap gap-1.5">
                                {keyWords.map((w, i) => (
                                  <span key={i} className="px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-medium border border-blue-100">
                                    {w}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-gray-400 italic">CMS에 등록된 핵심 단어가 없습니다.</p>
                            )}
                          </>
                        )}
                        {listeningTab === 'analysis' && (
                          <>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">📄 Analysis</p>
                            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                              {analysis || 'CMS에 등록된 해설이 없습니다.'}
                            </p>
                          </>
                        )}
                        {listeningTab === 'translation' && (
                          <>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">🌐 Translation</p>
                            <p className="text-sm text-gray-700 leading-relaxed">
                              {translation || 'CMS에 등록된 번역이 없습니다.'}
                            </p>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Right: Question Content - Equal width 50% */}
            <div className="w-full md:w-1/2 shrink-0 order-2 md:order-none">
              <>
                <div
                  key={currentQuestion?.id}
                  className="animate-[fadeIn_0.2s_ease-out]"
                >
                  <p className="text-xs md:text-lg font-medium text-gray-500 mb-3 md:mb-4">
                    Question {currentQuestionIndex + 1} of {totalQuestions}
                  </p>

                  <p className="text-lg md:text-3xl font-semibold text-gray-900 mb-4 md:mb-6 leading-relaxed">
                    {currentQuestion?.text}
                  </p>

                  <div className="space-y-2 md:space-y-3 mb-6 md:mb-8">
                    {currentQuestion?.options.map((option, idx) => {
                      const optionLetter = String.fromCharCode(65 + idx);
                      const isUserAnswer = option === currentQuestion.userAnswer || optionLetter === currentQuestion.userAnswer;
                      const isCorrectAnswer = option === currentQuestion.correctAnswer || optionLetter === currentQuestion.correctAnswer;

                      return (
                        <div
                          key={idx}
                          className={`flex items-start gap-2 md:gap-3 p-3 md:p-5 rounded-lg border transition-all ${
                            isCorrectAnswer
                              ? 'bg-emerald-50 border-emerald-200'
                              : isUserAnswer && !currentQuestion.isCorrect
                              ? 'bg-red-50 border-red-200'
                              : 'bg-white border-gray-200'
                          }`}
                        >
                          <span className={`text-sm md:text-xl font-bold mt-0.5 ${
                            isCorrectAnswer
                              ? 'text-emerald-600'
                              : isUserAnswer && !currentQuestion.isCorrect
                              ? 'text-red-600'
                              : 'text-gray-500'
                          }`}>
                            {optionLetter}.
                          </span>
                          <span className={`text-sm md:text-xl flex-1 ${
                            isCorrectAnswer
                              ? 'text-emerald-700 font-semibold'
                              : isUserAnswer && !currentQuestion.isCorrect
                              ? 'text-red-700 font-medium'
                              : 'text-gray-700 font-medium'
                          }`}>
                            {option}
                          </span>
                          {isCorrectAnswer && (
                            <Check className="w-5 h-5 text-emerald-500 shrink-0" />
                          )}
                          {isUserAnswer && !currentQuestion.isCorrect && !isCorrectAnswer && (
                            <X className="w-5 h-5 text-red-500 shrink-0" />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {currentQuestion?.explanation && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                      <p className="text-sm font-bold text-blue-800 mb-1">Explanation</p>
                      <p className="text-sm text-blue-700">{currentQuestion.explanation}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                    {(() => {
                      // Convert full-text answer to letter (A/B/C/D) using option index
                      const toLetter = (ans: string | undefined) => {
                        if (!ans) return '-';
                        const opts = currentQuestion?.options || [];
                        const idx = opts.findIndex(o => o === ans);
                        if (idx >= 0) return String.fromCharCode(65 + idx);
                        // Already a letter?
                        if (/^[A-D]$/i.test(ans.trim())) return ans.trim().toUpperCase();
                        return ans;
                      };
                      return (
                        <div className="flex flex-col gap-1.5 md:gap-2 text-sm md:text-xl">
                          <span className="text-gray-600">
                            My Answer: <strong className={currentQuestion?.isCorrect ? 'text-emerald-600' : 'text-red-600'}>
                              {toLetter(currentQuestion?.userAnswer)}
                            </strong>
                          </span>
                          <span className="text-gray-600">
                            Correct Answer: <strong className="text-emerald-600">
                              {toLetter(currentQuestion?.correctAnswer)}
                            </strong>
                          </span>
                        </div>
                      );
                    })()}
                    <button
                      onClick={() => toggleBookmark(currentQuestion?.id || '')}
                      className="flex items-center gap-1 text-sm text-gray-500 hover:text-yellow-500 transition-colors"
                    >
                      {bookmarkedQuestions.has(currentQuestion?.id || '') ? (
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      ) : (
                        <StarOff className="w-4 h-4" />
                      )}
                      <span>{bookmarkedQuestions.has(currentQuestion?.id || '') ? 'Bookmarked' : 'Bookmark'}</span>
                    </button>
                  </div>
                </div>
              </>

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-6 md:mt-8 pb-6">
                <button
                  onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                  disabled={currentQuestionIndex === 0}
                  className="px-4 md:px-7 py-2.5 md:py-3.5 rounded-lg text-sm md:text-lg font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  ← Previous
                </button>
                <button
                  onClick={() => setCurrentQuestionIndex(Math.min(totalQuestions - 1, currentQuestionIndex + 1))}
                  disabled={currentQuestionIndex === totalQuestions - 1}
                  className="px-4 md:px-7 py-2.5 md:py-3.5 rounded-lg text-sm md:text-lg font-medium text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  style={{ backgroundColor: themeColor }}
                >
                  Next →
                </button>
              </div>
            </div>
          </div>
          )
        )}

        {/* ===== WRITING CONTENT ===== */}
        {activeSection === 'Writing' && (
          <div className="max-w-7xl mx-auto w-full px-4 md:px-6 py-6 flex flex-col md:flex-row gap-6 overflow-auto">
            {/* ---- Writing 1: Build a Sentence (Q1-Q10) ---- */}
            {activeModule === 1 && currentWritingBuildSentence && (
              <div className="w-full max-w-5xl mx-auto p-6 md:p-12">
                <div className="bg-white">
                  <h2 className="text-3xl md:text-4xl font-bold text-black mb-10 text-center">Make an appropriate sentence.</h2>

                  <div className="space-y-10 mt-8 px-2 md:px-8">
                    {/* Avatar 1 + prompt */}
                    <div className="flex items-center gap-5 md:gap-8">
                      <div className="w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden border-4 border-[#1e6b73] flex-shrink-0 bg-gray-200 flex items-center justify-center">
                        {currentWritingBuildSentence.avatar1ImageUrl
                          ? <img src={currentWritingBuildSentence.avatar1ImageUrl} alt="Q" className="w-full h-full object-cover" />
                          : <svg className="w-10 h-10 text-gray-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
                        }
                      </div>
                      <div className="text-2xl text-gray-800">{currentWritingBuildSentence.prompt}</div>
                    </div>

                    {/* Avatar 2 + word chips */}
                    <div className="flex items-center gap-5 md:gap-8">
                      <div className="w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden border-4 border-[#1e6b73] flex-shrink-0 bg-gray-200 flex items-center justify-center">
                        {currentWritingBuildSentence.avatar2ImageUrl
                          ? <img src={currentWritingBuildSentence.avatar2ImageUrl} alt="A" className="w-full h-full object-cover" />
                          : <svg className="w-10 h-10 text-gray-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
                        }
                      </div>
                      <div className="flex-1">
                        {/* Word bank */}
                        <div className="flex flex-wrap gap-2.5">
                          {currentWritingBuildSentence.words.map((word, idx) => {
                            const isPrefilled = word.startsWith('[') && word.endsWith(']');
                            const display = word.replace(/^\[|\]$/g, '');
                            return isPrefilled
                              ? <span key={idx} className="text-2xl font-medium text-gray-700">{display}</span>
                              : <span key={idx} className="px-4 py-2 border border-gray-300 rounded-lg text-2xl text-gray-700 bg-gray-50">{display}</span>;
                          })}
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Correct Answer + My Answer (below conversation) */}
                  {(() => {
                    // Reconstruct correct answer from words array if correctAnswer is missing
                    const reconstructFromWords = () => {
                      const parts = currentWritingBuildSentence.words.map(w =>
                        w.startsWith('[') && w.endsWith(']') ? w.slice(1, -1) : w
                      );
                      return parts.join(' ');
                    };
                    const correctText = currentWritingBuildSentence.correctAnswer || reconstructFromWords();
                    const ending = currentWritingBuildSentence.sentenceEnding || '.';
                    const fullCorrect = `${correctText}${ending}`;
                    return (
                      <div className="mt-10 space-y-5 px-2 md:px-8">
                        {correctText && (
                          <div>
                            <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">정답</p>
                            <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-5 py-4 text-xl font-medium text-emerald-800">
                              {fullCorrect}
                            </div>
                          </div>
                        )}

                        {/* User's answer + grading */}
                        {(() => {
                          const qNum = currentQuestionIndex + 1;
                          const wrongEntry = result.wrongAnswers.find(
                            w => w.questionId === `writing-bs-${qNum}` || w.questionId === String(qNum)
                          );
                          const userAns = wrongEntry?.userAnswer;
                          const isWrong = !!wrongEntry;
                          return (
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider">내 답</p>
                                <span className={`text-sm font-bold px-3 py-1 rounded-full ${isWrong ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-700'}`}>
                                  {isWrong ? '✕ 오답' : '✓ 정답'}
                                </span>
                              </div>
                              <div className={`rounded-xl px-5 py-4 text-xl border ${
                                isWrong
                                  ? 'bg-red-50 border-red-200 text-red-800'
                                  : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                              }`}>
                                {userAns || (isWrong ? '(미제출)' : fullCorrect)}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    );
                  })()}
                </div>

                {/* Nav buttons */}
                <div className="flex justify-between mt-10">
                  <button
                    onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                    disabled={currentQuestionIndex === 0}
                    className="px-7 py-3.5 rounded-lg text-lg font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition-all"
                  >← Previous</button>
                  <button
                    onClick={() => setCurrentQuestionIndex(Math.min(totalQuestions - 1, currentQuestionIndex + 1))}
                    disabled={currentQuestionIndex === totalQuestions - 1}
                    className="px-7 py-3.5 rounded-lg text-lg font-medium text-white disabled:opacity-40 transition-all"
                    style={{ backgroundColor: themeColor }}
                  >Next →</button>
                </div>
              </div>
            )}

            {/* ---- Writing 2: Writing an Email ---- */}
            {activeModule === 2 && (
              <>
                {/* Left: Prompt */}
                <div className="md:w-2/5 p-4 md:p-8 overflow-auto bg-white border-b md:border-b-0 md:border-r border-gray-300">
                  <p className="text-lg text-gray-800 leading-relaxed mb-4">
                    {cmsEmailQ?.emailScenario || 'A new poetry magazine has asked its readers for submissions, and you want to submit two of your poems. However, you had a problem using the online submission form, and you are not certain that your submissions were received.'}
                  </p>
                  <p className="text-lg text-gray-800 font-bold mb-3">
                    {cmsEmailQ?.emailInstruction || 'Write an email to the editor of the magazine. In your email, do the following.'}
                  </p>
                  <ul className="space-y-2 mb-4">
                    {(Array.isArray(cmsEmailQ?.emailBullets) && cmsEmailQ.emailBullets.length
                      ? cmsEmailQ.emailBullets
                      : ['Tell the editor what you like about the new magazine.', 'Describe the problem you experienced.', 'Ask about the status of your submissions.']
                    ).map((bullet: string, i: number) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="w-2 h-2 rounded-full bg-black mt-2.5 flex-shrink-0" />
                        <span className="text-lg text-gray-800">{bullet}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="text-lg text-gray-800">Write as much as you can and in complete sentences.</p>
                </div>
                {/* Right: Email response area */}
                <div className="md:w-3/5 p-4 md:p-8 overflow-auto bg-gray-50">
                  <h3 className="text-2xl font-bold text-gray-800 mb-4">Your Response:</h3>
                  <div className="mb-3 text-lg text-gray-700">
                    <span className="font-bold">To:</span> {cmsEmailQ?.emailTo || 'editor@sunshinepoetymagazine.com'}
                  </div>
                  <div className="mb-5 text-lg text-gray-700">
                    <span className="font-bold">Subject:</span> {cmsEmailQ?.emailSubject || 'Problem using submission form'}
                  </div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">내가 쓴 답안</p>
                  <div className={`bg-white border rounded-lg p-5 min-h-48 text-base whitespace-pre-wrap ${result.wrongAnswers[0]?.userAnswer ? 'text-gray-800 border-gray-300' : 'text-gray-400 italic border-gray-200'}`}>
                    {result.wrongAnswers[0]?.userAnswer || '작성한 답안이 저장되지 않았습니다.'}
                  </div>
                  <p className="text-xs text-gray-400 mt-2">※ 이메일/토론 작문은 자유 서술형이라 자동 채점되지 않습니다.</p>
                  <div className="flex justify-end mt-4">
                    <button
                      onClick={() => toggleBookmark('writing-email')}
                      className="flex items-center gap-1 text-sm text-gray-500 hover:text-yellow-500 transition-colors"
                    >
                      {bookmarkedQuestions.has('writing-email') ? (
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      ) : (
                        <StarOff className="w-4 h-4" />
                      )}
                      <span>{bookmarkedQuestions.has('writing-email') ? 'Bookmarked' : 'Bookmark'}</span>
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* ---- Writing 3: Academic Discussion ---- */}
            {activeModule === 3 && (
              <>
                {/* Left: Professor prompt */}
                <div className="md:w-2/5 p-4 md:p-8 overflow-auto bg-white border-b md:border-b-0 md:border-r border-gray-300">
                  <p className="text-lg text-gray-800 leading-relaxed mb-4 font-serif">
                    {cmsAcademicQ?.questionText || "Your professor is teaching a class. Write a post responding to the professor's question."}
                  </p>
                  <div className="mb-4">
                    <p className="text-base font-semibold text-gray-900 mb-2 font-serif">In your response, you should do the following.</p>
                    <ul className="space-y-1 ml-4">
                      <li className="flex items-start gap-2">
                        <span className="w-2 h-2 rounded-full bg-black mt-2 flex-shrink-0" />
                        <span className="text-base text-gray-800 font-serif">Express and support your opinion.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-2 h-2 rounded-full bg-black mt-2 flex-shrink-0" />
                        <span className="text-base text-gray-800 font-serif">Make a contribution to the discussion in your own words.</span>
                      </li>
                    </ul>
                  </div>
                  <p className="text-base text-gray-800 mb-6 font-serif">An effective response will contain at least 100 words.</p>
                  <div className="border-t border-gray-300 pt-6">
                    <div className="flex flex-col items-center mb-4">
                      <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-[#1e6b73] mb-2 bg-gray-100 flex items-center justify-center">
                        {cmsAcademicQ?.professorImageUrl ? (
                          <img src={cmsAcademicQ.professorImageUrl} alt="Professor" className="w-full h-full object-cover" />
                        ) : (
                          <svg className="w-10 h-10 text-gray-300" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/></svg>
                        )}
                      </div>
                      <p className="font-bold text-lg text-gray-900 font-serif">{cmsAcademicQ?.professorName || 'Professor'}</p>
                    </div>
                    <p className="text-base text-gray-800 leading-relaxed font-serif">
                      {cmsAcademicQ?.professorMessage || cmsAcademicQ?.questionText || '(No professor message in CMS)'}
                    </p>
                  </div>
                </div>
                {/* Right: Student responses + user response */}
                <div className="md:w-3/5 p-4 md:p-8 overflow-auto bg-[#f8f7f3]">
                  <div className="space-y-4 mb-6">
                    <div className="flex items-start gap-3 rounded-2xl bg-white/80 p-4 shadow-sm border border-[#e7e3d7]">
                      <div className="w-12 h-12 rounded-full flex-shrink-0 overflow-hidden border-2 border-[#c9b99b] bg-gray-100 flex items-center justify-center">
                        {cmsAcademicQ?.student1ImageUrl ? (
                          <img src={cmsAcademicQ.student1ImageUrl} alt="Student 1" className="w-full h-full object-cover" />
                        ) : (
                          <svg className="w-7 h-7 text-gray-300" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/></svg>
                        )}
                      </div>
                      <div className="flex-1">
                        {cmsAcademicQ?.student1Name && <p className="font-bold text-base text-gray-700 font-serif mb-1">{cmsAcademicQ.student1Name}</p>}
                        <p className="text-lg text-gray-800 leading-relaxed font-serif">
                          {cmsAcademicQ?.student1Message || '(No student 1 message in CMS)'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 rounded-2xl bg-white/80 p-4 shadow-sm border border-[#e7e3d7]">
                      <div className="w-12 h-12 rounded-full flex-shrink-0 overflow-hidden border-2 border-[#c9b99b] bg-gray-100 flex items-center justify-center">
                        {cmsAcademicQ?.student2ImageUrl ? (
                          <img src={cmsAcademicQ.student2ImageUrl} alt="Student 2" className="w-full h-full object-cover" />
                        ) : (
                          <svg className="w-7 h-7 text-gray-300" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/></svg>
                        )}
                      </div>
                      <div className="flex-1">
                        {cmsAcademicQ?.student2Name && <p className="font-bold text-base text-gray-700 font-serif mb-1">{cmsAcademicQ.student2Name}</p>}
                        <p className="text-lg text-gray-800 leading-relaxed font-serif">
                          {cmsAcademicQ?.student2Message || '(No student 2 message in CMS)'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#ddd4c4]">
                    <h3 className="text-2xl font-bold text-gray-800 mb-3 font-serif">Your Response:</h3>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">내가 쓴 답안</p>
                    <div className={`border rounded-xl p-5 min-h-40 text-base whitespace-pre-wrap font-serif ${result.wrongAnswers[1]?.userAnswer ? 'bg-gray-50 text-gray-800 border-gray-200' : 'bg-gray-50 text-gray-400 italic border-gray-200'}`}>
                      {result.wrongAnswers[1]?.userAnswer || '작성한 답안이 저장되지 않았습니다.'}
                    </div>
                    <p className="text-xs text-gray-400 mt-2">※ 토론 작문은 자유 서술형이라 자동 채점되지 않습니다.</p>
                    <div className="flex justify-end mt-4">
                      <button
                        onClick={() => toggleBookmark('writing-discussion')}
                        className="flex items-center gap-1 text-sm text-gray-500 hover:text-yellow-500 transition-colors"
                      >
                        {bookmarkedQuestions.has('writing-discussion') ? (
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        ) : (
                          <StarOff className="w-4 h-4" />
                        )}
                        <span>{bookmarkedQuestions.has('writing-discussion') ? 'Bookmarked' : 'Bookmark'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ===== SPEAKING CONTENT ===== */}
        {activeSection === 'Speaking' && currentSpeakingQ && (
          <div className="max-w-4xl mx-auto px-4 md:px-6 py-6">
            <div key={currentSpeakingQ.id} className="animate-[fadeIn_0.2s_ease-out]">
              {/* Question header */}
              <div className="flex items-center justify-between mb-6">
                <p className="text-base text-gray-500">
                  Question {currentQuestionIndex + 1} of {speakingQuestionCount}
                </p>
                <span className="px-4 py-1.5 rounded-full text-sm font-bold text-white" style={{ backgroundColor: themeColor }}>
                  {currentSpeakingQ.taskGroup}
                </span>
              </div>

              {/* Prompt */}
              <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500 mb-3">Prompt</p>
                <p className="text-xl text-gray-900 leading-relaxed font-medium">{currentSpeakingQ.prompt}</p>
              </div>

              {/* Reference image + question audio (실제 시험 화면 구조) */}
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 mb-6">
                <div className="flex justify-center mb-5">
                  <div className="w-72 h-72 rounded-xl border-2 border-gray-300 bg-white overflow-hidden flex items-center justify-center">
                    {currentSpeakingQ.materialImage ? (
                      <ImageWithFallback
                        src={currentSpeakingQ.materialImage}
                        alt="Speaking material"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <svg className="w-24 h-24 text-gray-300" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
                      </svg>
                    )}
                  </div>
                </div>

                {/* Question audio player */}
                {currentSpeakingQ.audioUrl ? (
                  <audio controls src={currentSpeakingQ.audioUrl} className="w-full h-11 max-w-xl mx-auto block" />
                ) : (
                  <p className="text-center text-sm text-gray-400 italic">CMS에 등록된 오디오가 없습니다.</p>
                )}

                {/* Script toggle */}
                <div className="text-center mt-4">
                  <button
                    onClick={() => setShowModelText(!showModelText)}
                    className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    {showModelText ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    <span>{showModelText ? 'Hide Script' : 'View Script'}</span>
                  </button>
                  {showModelText && currentSpeakingQ.transcript && (
                    <p className="text-base text-gray-700 leading-relaxed mt-3 p-4 bg-white rounded-lg border border-gray-200 animate-[fadeIn_0.2s_ease-out]">
                      {currentSpeakingQ.transcript}
                    </p>
                  )}
                </div>
              </div>

              {/* My Recording */}
              {(() => {
                const qNum = activeModule === 1 ? currentQuestionIndex + 1 : currentQuestionIndex + 8;
                const recUrl = speakingRecordings[String(qNum)];
                return (
                  <div className="bg-blue-50 rounded-xl border border-blue-200 p-6 mb-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-11 h-11 rounded-full bg-blue-200 flex items-center justify-center">
                        <Mic className="w-5 h-5 text-blue-600" />
                      </div>
                      <span className="px-4 py-1.5 rounded-full text-sm font-bold bg-blue-500 text-white">
                        My Recording — Q{qNum}
                      </span>
                    </div>
                    {recUrl ? (
                      <audio controls src={recUrl} className="w-full h-11" />
                    ) : (
                      <p className="text-sm text-gray-400 italic">
                        녹음이 없습니다. (스피킹 세션 완료 후 표시됩니다)
                      </p>
                    )}
                  </div>
                );
              })()}

              {/* Bookmark + Nav */}
              <div className="flex items-center justify-end mb-4">
                <button
                  onClick={() => toggleBookmark(currentSpeakingQ.id)}
                  className="flex items-center gap-1 text-base text-gray-500 hover:text-yellow-500 transition-colors"
                >
                  {bookmarkedQuestions.has(currentSpeakingQ.id) ? (
                    <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                  ) : (
                    <StarOff className="w-5 h-5" />
                  )}
                  <span>{bookmarkedQuestions.has(currentSpeakingQ.id) ? 'Bookmarked' : 'Bookmark'}</span>
                </button>
              </div>

              <div className="flex justify-between pb-6">
                <button
                  onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                  disabled={currentQuestionIndex === 0}
                  className="px-7 py-3.5 rounded-lg text-lg font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  ← Previous
                </button>
                <button
                  onClick={() => setCurrentQuestionIndex(Math.min(speakingQuestionCount - 1, currentQuestionIndex + 1))}
                  disabled={currentQuestionIndex === speakingQuestionCount - 1}
                  className="px-7 py-3.5 rounded-lg text-lg font-medium text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  style={{ backgroundColor: themeColor }}
                >
                  Next →
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 px-4 py-2 text-center text-xs text-gray-400 shrink-0">
        © {new Date().getFullYear()} TOEFL TPO Practice Platform. All Rights Reserved.
      </div>

      {/* AI 튜터 위젯 — History 리뷰 결과 화면. 우측 하단 FAB + 슬라이드인 팝업 */}
      <ToeflAiWidget
        position="right"
        zIndex={60}
        contextLabel={`Review · ${activeSection} (Q${currentQuestionIndex + 1})`}
      />
    </div>
  );
}

// Helper function to generate options from correct and user answers
function generateOptions(correctAnswer: string, userAnswer: string): string[] {
  const options = [correctAnswer];
  if (userAnswer !== correctAnswer) {
    options.push(userAnswer);
  }
  const fillers = [
    'None of the above',
    'All of the above',
    'Cannot be determined',
    'Not mentioned in the passage'
  ];
  let i = 0;
  while (options.length < 4 && i < fillers.length) {
    if (!options.includes(fillers[i])) {
      options.push(fillers[i]);
    }
    i++;
  }
  return options.sort(() => Math.random() - 0.5);
}