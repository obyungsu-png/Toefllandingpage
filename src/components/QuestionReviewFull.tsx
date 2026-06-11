import { useState, useRef, useEffect } from 'react';
// motion removed - using CSS animations
import { ChevronLeft, Play, Pause, Star, StarOff, Check, X, Volume2, ChevronDown, ChevronUp, Mic } from 'lucide-react';
import { TestResult } from './HistorySection';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { loadRecordings } from '../utils/uploadRecording';

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
  passageText?: string;
  imageUrl?: string;
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
  
  const currentTPOTest = tpoTests.find((test: any) => test.testNumber === tpoNumber);

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
    const totalQ = result.totalQuestions; // Use actual total, not just correct count
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
    // So realQuestions[0] = Q11, realQuestions[1] = Q12, etc.
    // We need to offset: for i=10 (Q11), use realQuestions[0]; for i=0..9, no CMS question (FillBlanks handled separately)
    const readingM1Offset = (activeSection === 'Reading' && activeModule === 1) ? 10 : 0;

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
          audioText: realQ.audioText || (activeSection === 'Listening' ? 'Audio transcript for this question.' : undefined),
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
          currentVoice: isInterview ? 'Morgan Freeman' : 'Donald Trump',
          voiceAvatar: isInterview
            ? 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&crop=face'
            : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face',
          modelAudioDuration: Number(question.duration) || (isInterview ? 18 : 12),
          userAudioDuration: isInterview ? 15 : 8,
          showTextDefault: !isInterview,
          materialImage: question.passageImageUrl || question.imageUrl,
          materialAudioDuration: question.passageAudioUrl ? 5 : undefined,
          transcript: question.passageText || question.translationNote || question.questionText || question.text,
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
        <div className="flex justify-center mb-3">
          <div className="inline-flex bg-gray-100 rounded-full p-1">
            {sectionTabs.map(tab => (
              <button
                key={tab}
                className={`px-4 md:px-6 py-2 rounded-full text-xs md:text-sm font-bold transition-all cursor-pointer ${
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
        <div className="flex items-center justify-between">
          <div className="flex gap-4">
            {(activeSection === 'Writing' ? [1, 2, 3] : [1, 2]).map(mod => (
              <button
                key={mod}
                onClick={() => { setActiveModule(mod); setCurrentQuestionIndex(0); }}
                className={`text-sm font-medium pb-1 border-b-2 transition-all ${
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
        <div className="flex items-center justify-between mt-3">
          {/* Question Pills */}
          <div className="flex flex-wrap gap-1.5">
            {activeSection === 'Writing' && writingPills.map((q, idx) => {
              const isCurrent = idx === currentQuestionIndex;
              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentQuestionIndex(idx)}
                  className={`w-7 h-7 md:w-8 md:h-8 rounded-full text-xs font-bold flex items-center justify-center transition-all ${
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
                  className={`w-7 h-7 md:w-8 md:h-8 rounded-full text-xs font-bold flex items-center justify-center transition-all ${
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
                  className={`w-7 h-7 md:w-8 md:h-8 rounded-full text-xs font-bold flex items-center justify-center transition-all ${
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
          <div className="hidden md:flex items-center gap-4 text-sm text-gray-600 shrink-0 ml-4">
            {activeSection !== 'Speaking' && activeSection !== 'Writing' && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg">
                <span className="text-gray-500 text-xs">Score</span>
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
                    className="px-5 py-2.5 rounded-lg text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    ← Previous
                  </button>
                  <button
                    onClick={() => setCurrentQuestionIndex(Math.min(totalQuestions - 1, currentQuestionIndex + 1))}
                    disabled={currentQuestionIndex === totalQuestions - 1}
                    className="px-5 py-2.5 rounded-lg text-sm font-medium text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
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
              const transcript = realQ?.audioText || realQ?.transcript || currentQuestion?.audioText || currentQuestion?.text;
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
                    <div className="flex items-center gap-3 mb-3">
                      <button
                        onClick={() => setIsPlaying(!isPlaying)}
                        className="w-9 h-9 rounded-full flex items-center justify-center text-white shrink-0"
                        style={{ backgroundColor: themeColor }}
                      >
                        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                      </button>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                          <span>0:{String(Math.floor(audioProgress / 20)).padStart(2, '0')}</span>
                          <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{ width: `${audioProgress}%`, backgroundColor: themeColor }}
                            />
                          </div>
                          <span>0:05</span>
                        </div>
                      </div>
                      <button
                        onClick={() => setPlaybackRate(playbackRate === 1 ? 1.5 : playbackRate === 1.5 ? 2 : 1)}
                        className="text-xs font-medium border border-gray-300 rounded-full px-2 py-0.5 text-gray-600 hover:bg-gray-100 transition-colors"
                      >
                        {playbackRate}x
                      </button>
                    </div>

                    {/* Feature Tabs: Dictation / Key Words / Analysis / Practice */}
                    <div className="grid grid-cols-4 gap-2 mb-3">
                      {[
                        { key: 'transcript', label: 'Dictation', icon: '🔊' },
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
                            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">📝 Transcript</p>
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
                  <p className="text-[13px] font-medium text-gray-500 mb-4">
                    Question {currentQuestionIndex + 1} of {totalQuestions}
                  </p>

                  <p className="text-lg md:text-xl font-semibold text-gray-900 mb-6 leading-relaxed">
                    {currentQuestion?.text}
                  </p>

                  <div className="space-y-3 mb-8">
                    {currentQuestion?.options.map((option, idx) => {
                      const optionLetter = String.fromCharCode(65 + idx);
                      const isUserAnswer = option === currentQuestion.userAnswer || optionLetter === currentQuestion.userAnswer;
                      const isCorrectAnswer = option === currentQuestion.correctAnswer || optionLetter === currentQuestion.correctAnswer;
                      
                      return (
                        <div
                          key={idx}
                          className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${
                            isCorrectAnswer
                              ? 'bg-emerald-50 border-emerald-200'
                              : isUserAnswer && !currentQuestion.isCorrect
                              ? 'bg-red-50 border-red-200'
                              : 'bg-white border-gray-200'
                          }`}
                        >
                          <span className={`text-[15px] font-bold mt-0.5 ${
                            isCorrectAnswer
                              ? 'text-emerald-600'
                              : isUserAnswer && !currentQuestion.isCorrect
                              ? 'text-red-600'
                              : 'text-gray-500'
                          }`}>
                            {optionLetter}.
                          </span>
                          <span className={`text-[15px] flex-1 ${
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
                    <div className="flex flex-col gap-2 text-[15px]">
                      <span className="text-gray-600">
                        My Answer: <strong className={currentQuestion?.isCorrect ? 'text-emerald-600' : 'text-red-600'}>
                          {currentQuestion?.userAnswer}
                        </strong>
                      </span>
                      <span className="text-gray-600">
                        Correct Answer: <strong className="text-emerald-600">
                          {currentQuestion?.correctAnswer}
                        </strong>
                      </span>
                    </div>
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
              <div className="flex justify-between mt-8 pb-6">
                <button
                  onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                  disabled={currentQuestionIndex === 0}
                  className="px-5 py-2.5 rounded-lg text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  ← Previous
                </button>
                <button
                  onClick={() => setCurrentQuestionIndex(Math.min(totalQuestions - 1, currentQuestionIndex + 1))}
                  disabled={currentQuestionIndex === totalQuestions - 1}
                  className="px-5 py-2.5 rounded-lg text-sm font-medium text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
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
          <div className="flex-1 flex flex-col md:flex-row overflow-auto">
            {/* ---- Writing 1: Build a Sentence (Q1-Q10) ---- */}
            {activeModule === 1 && currentWritingBuildSentence && (
              <>
                <div className="md:w-3/5 p-4 md:p-8 overflow-auto bg-white border-b md:border-b-0 md:border-r border-gray-300">
                  <h2 className="text-2xl font-bold text-black mb-8 text-center">Make an appropriate sentence.</h2>

                  <div className="space-y-8 mt-6 px-2 md:px-8">
                    {/* Avatar 1 + prompt */}
                    <div className="flex items-center gap-4 md:gap-6">
                      <div className="w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden border-4 border-[#1e6b73] flex-shrink-0 bg-gray-200 flex items-center justify-center">
                        {currentWritingBuildSentence.avatar1ImageUrl
                          ? <img src={currentWritingBuildSentence.avatar1ImageUrl} alt="Q" className="w-full h-full object-cover" />
                          : <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
                        }
                      </div>
                      <div className="text-lg text-gray-800">{currentWritingBuildSentence.prompt}</div>
                    </div>

                    {/* Avatar 2 + word chips */}
                    <div className="flex items-start gap-4 md:gap-6">
                      <div className="w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden border-4 border-[#1e6b73] flex-shrink-0 bg-gray-200 flex items-center justify-center mt-1">
                        {currentWritingBuildSentence.avatar2ImageUrl
                          ? <img src={currentWritingBuildSentence.avatar2ImageUrl} alt="A" className="w-full h-full object-cover" />
                          : <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
                        }
                      </div>
                      <div className="flex-1">
                        {/* Word bank */}
                        <div className="flex flex-wrap gap-2 mb-6">
                          {currentWritingBuildSentence.words.map((word, idx) => {
                            const isPrefilled = word.startsWith('[') && word.endsWith(']');
                            const display = word.replace(/^\[|\]$/g, '');
                            return isPrefilled
                              ? <span key={idx} className="text-[15px] font-medium text-gray-700">{display}</span>
                              : <span key={idx} className="px-3 py-1 border border-gray-300 rounded text-[15px] text-gray-700 bg-gray-50">{display}</span>;
                          })}
                        </div>

                        {/* Correct Answer */}
                        {currentWritingBuildSentence.correctAnswer && (
                          <div className="mb-3">
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">정답</p>
                            <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2.5 text-[15px] font-medium text-emerald-800">
                              {currentWritingBuildSentence.correctAnswer}{currentWritingBuildSentence.sentenceEnding || '.'}
                            </div>
                          </div>
                        )}

                        {/* User's answer from wrongAnswers */}
                        {(() => {
                          const qNum = currentQuestionIndex + 1;
                          const wrongEntry = result.wrongAnswers.find(
                            w => w.questionId === `writing-bs-${qNum}` || w.questionId === String(qNum)
                          );
                          const userAns = wrongEntry?.userAnswer;
                          const isWrong = !!wrongEntry;
                          if (!userAns && !currentWritingBuildSentence.correctAnswer) return null;
                          return (
                            <div>
                              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">내 답</p>
                              <div className={`rounded-lg px-4 py-2.5 text-[15px] border ${
                                isWrong
                                  ? 'bg-red-50 border-red-200 text-red-800'
                                  : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                              }`}>
                                {userAns || '(미제출)'}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="md:w-2/5 p-4 md:p-8 overflow-auto bg-gray-50">
                  <h3 className="text-xl font-bold text-gray-800 mb-4">Review Note</h3>
                  <div className="bg-white border border-gray-200 rounded-lg p-4 text-sm text-gray-600 leading-relaxed">
                    순서 맞추기 유형(1-10번)은 실제 Writing Build a Sentence 형식을 그대로 반영했습니다. 각 문항의 질문과 단어 묶음을 확인하면서 문장 구조를 복기해보세요.
                  </div>

                  {/* Nav buttons */}
                  <div className="flex justify-between mt-8">
                    <button
                      onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                      disabled={currentQuestionIndex === 0}
                      className="px-5 py-2.5 rounded-lg text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition-all"
                    >← Previous</button>
                    <button
                      onClick={() => setCurrentQuestionIndex(Math.min(totalQuestions - 1, currentQuestionIndex + 1))}
                      disabled={currentQuestionIndex === totalQuestions - 1}
                      className="px-5 py-2.5 rounded-lg text-sm font-medium text-white disabled:opacity-40 transition-all"
                      style={{ backgroundColor: themeColor }}
                    >Next →</button>
                  </div>
                </div>
              </>
            )}

            {/* ---- Writing 2: Writing an Email ---- */}
            {activeModule === 2 && (
              <>
                {/* Left: Prompt */}
                <div className="md:w-1/3 p-4 md:p-8 overflow-auto bg-white border-b md:border-b-0 md:border-r border-gray-300">
                  <p className="text-base text-gray-800 leading-relaxed mb-4">
                    A new poetry magazine has asked its readers for submissions, and you want to submit two of your poems. However, you had a problem using the online submission form, and you are not certain that your submissions were received.
                  </p>
                  <p className="text-base text-gray-800 font-bold mb-3">
                    Write an email to the editor of the magazine. In your email, do the following.
                  </p>
                  <ul className="space-y-2 mb-4">
                    <li className="flex items-start gap-2">
                      <span className="w-2 h-2 rounded-full bg-black mt-2 flex-shrink-0" />
                      <span className="text-base text-gray-800">Tell the editor what you like about the new magazine.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-2 h-2 rounded-full bg-black mt-2 flex-shrink-0" />
                      <span className="text-base text-gray-800">Describe the problem you experienced.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-2 h-2 rounded-full bg-black mt-2 flex-shrink-0" />
                      <span className="text-base text-gray-800">Ask about the status of your submissions.</span>
                    </li>
                  </ul>
                  <p className="text-base text-gray-800">Write as much as you can and in complete sentences.</p>
                </div>
                {/* Right: Email response area */}
                <div className="md:w-2/3 p-4 md:p-8 overflow-auto bg-gray-50">
                  <h3 className="text-xl font-bold text-gray-800 mb-4">Your Response:</h3>
                  <div className="mb-3 text-sm text-gray-700">
                    <span className="font-bold">To:</span> editor@sunshinepoetymagazine.com
                  </div>
                  <div className="mb-5 text-sm text-gray-700">
                    <span className="font-bold">Subject:</span> Problem using submission form
                  </div>
                  <div className="bg-white border border-gray-300 rounded-lg p-4 min-h-48 text-sm text-gray-500 italic">
                    {result.wrongAnswers[0]?.userAnswer || '(No written response stored)'}
                  </div>
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
                <div className="md:w-1/3 p-4 md:p-8 overflow-auto bg-white border-b md:border-b-0 md:border-r border-gray-300">
                  <p className="text-base text-gray-800 leading-relaxed mb-4 font-serif">
                    Your professor is teaching a class on social studies. Write a post responding to the professor's question.
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
                      <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-[#1e6b73] mb-2">
                        <ImageWithFallback
                          src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop&crop=face"
                          alt="Professor"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <p className="font-bold text-lg text-gray-900 font-serif">Dr. Achebe</p>
                    </div>
                    <p className="text-base text-gray-800 leading-relaxed font-serif">
                      Volunteerism refers to the act of offering your time and service without financial compensation to benefit a community, organization, or cause. While many people volunteer mainly to help others, some institutions have mandatory volunteer programs. High schools are one example, where students may be required to complete a certain number of volunteer hours to graduate. What do you think? Should high school students be required to do volunteer work? Why or why not?
                    </p>
                  </div>
                </div>
                {/* Right: Student responses + user response */}
                <div className="md:w-2/3 p-4 md:p-8 overflow-auto bg-[#f8f7f3]">
                  <div className="space-y-4 mb-6">
                    <div className="flex items-start gap-3 rounded-2xl bg-white/80 p-4 shadow-sm border border-[#e7e3d7]">
                      <div className="w-12 h-12 rounded-full flex-shrink-0 overflow-hidden border-2 border-[#c9b99b]">
                        <ImageWithFallback
                          src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop&crop=face"
                          alt="Student 1"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <p className="text-base text-gray-800 leading-relaxed font-serif">
                        Yes, I think high schools should require volunteer hours because it helps students build a sense of civic responsibility. Many teenagers don't naturally think about helping others, and this requirement can introduce them to the idea that their time and effort can make a real difference in the lives of others.
                      </p>
                    </div>
                    <div className="flex items-start gap-3 rounded-2xl bg-white/80 p-4 shadow-sm border border-[#e7e3d7]">
                      <div className="w-12 h-12 rounded-full flex-shrink-0 overflow-hidden border-2 border-[#c9b99b]">
                        <ImageWithFallback
                          src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face"
                          alt="Student 2"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <p className="text-base text-gray-800 leading-relaxed font-serif">
                        I don't think volunteer hours should be required because many students already have limited free time. Some have part-time jobs or take care of younger siblings after school. Adding a mandatory volunteer requirement could create extra stress and make it harder for those students to balance their existing responsibilities.
                      </p>
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#ddd4c4]">
                    <h3 className="text-xl font-bold text-gray-800 mb-3 font-serif">Your Response:</h3>
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 min-h-40 text-sm text-gray-500 italic font-serif">
                      {result.wrongAnswers[1]?.userAnswer || '(No written response stored)'}
                    </div>
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
          <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 flex flex-col md:flex-row gap-6">
            {/* Left: Speaking Question */}
            <div className="flex-1 min-w-0">
              <>
                <div
                  key={currentSpeakingQ.id}
                  className="animate-[fadeIn_0.2s_ease-out]"
                >
                  {/* Question header with bookmark */}
                  <div className="flex items-center justify-between mb-6">
                    <p className="text-sm text-gray-500">
                      Question {currentQuestionIndex + 1} of {speakingQuestionCount}
                    </p>
                    <span className="px-3 py-1 rounded-full text-xs font-bold text-white" style={{ backgroundColor: themeColor }}>
                      {currentSpeakingQ.taskGroup}
                    </span>
                  </div>

                  <div className="mb-4 rounded-xl border border-gray-200 bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500 mb-2">Prompt</p>
                    <p className="text-sm text-gray-700 leading-relaxed">{currentSpeakingQ.prompt}</p>
                  </div>

                  <div className="flex items-center justify-end mb-6">
                    <button
                      onClick={() => toggleBookmark(currentSpeakingQ.id)}
                      className="flex items-center gap-1 text-sm text-gray-500 hover:text-yellow-500 transition-colors"
                    >
                      {bookmarkedQuestions.has(currentSpeakingQ.id) ? (
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      ) : (
                        <StarOff className="w-4 h-4" />
                      )}
                      <span>{bookmarkedQuestions.has(currentSpeakingQ.id) ? 'Bookmarked' : 'Bookmark'}</span>
                    </button>
                  </div>

                  {/* Model Answer Card */}
                  <div className="bg-gray-50 rounded-xl border border-gray-200 p-5 mb-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <ImageWithFallback
                          src={currentSpeakingQ.voiceAvatar}
                          alt="Model"
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <span className="px-3 py-1 rounded-full text-xs font-bold text-white" style={{ backgroundColor: themeColor }}>
                          {currentSpeakingQ.modelLabel}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span>Voice:</span>
                        <ImageWithFallback
                          src={currentSpeakingQ.voiceAvatar}
                          alt={currentSpeakingQ.currentVoice}
                          className="w-6 h-6 rounded-full object-cover"
                        />
                        <span className="font-medium text-gray-700">{currentSpeakingQ.currentVoice}</span>
                        <span className="px-2 py-0.5 rounded text-xs font-medium text-white" style={{ backgroundColor: themeColor }}>
                          Switch
                        </span>
                      </div>
                    </div>

                    {/* Show/Hide text toggle */}
                    <button
                      onClick={() => setShowModelText(!showModelText)}
                      className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-3 transition-colors"
                    >
                      {showModelText ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      <span>{showModelText ? 'Hide Text' : 'Show Text'}</span>
                    </button>

                    {showModelText && currentSpeakingQ.transcript && (
                      <p
                        className="text-sm text-gray-700 leading-relaxed mb-3 animate-[fadeIn_0.2s_ease-out]"
                      >
                        {currentSpeakingQ.transcript}
                      </p>
                    )}

                    {/* Model Audio Player */}
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setSpeakingModelPlaying(!speakingModelPlaying)}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white shrink-0"
                        style={{ backgroundColor: themeColor }}
                      >
                        {speakingModelPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
                      </button>
                      <span className="text-xs text-gray-500 w-8">0:00</span>
                      <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${modelProgress}%`, backgroundColor: themeColor }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 w-8">0:{String(currentSpeakingQ.modelAudioDuration).padStart(2, '0')}</span>
                    </div>
                  </div>

                  {/* My Recording Card */}
                  {(() => {
                    const qNum = activeModule === 1
                      ? currentQuestionIndex + 1
                      : currentQuestionIndex + 8;
                    const recUrl = speakingRecordings[String(qNum)];
                    return (
                      <div className="bg-blue-50 rounded-xl border border-blue-200 p-5 mb-6">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-full bg-blue-200 flex items-center justify-center">
                            <Mic className="w-5 h-5 text-blue-600" />
                          </div>
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-500 text-white">
                            My Recording — Q{qNum}
                          </span>
                        </div>
                        {recUrl ? (
                          <audio controls src={recUrl} className="w-full h-10" />
                        ) : (
                          <p className="text-xs text-gray-400 italic">
                            녹음이 없습니다. (스피킹 세션 완료 후 표시됩니다)
                          </p>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </>

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-4 pb-6">
                <button
                  onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                  disabled={currentQuestionIndex === 0}
                  className="px-5 py-2.5 rounded-lg text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  ← Previous
                </button>
                <button
                  onClick={() => setCurrentQuestionIndex(Math.min(speakingQuestionCount - 1, currentQuestionIndex + 1))}
                  disabled={currentQuestionIndex === speakingQuestionCount - 1}
                  className="px-5 py-2.5 rounded-lg text-sm font-medium text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  style={{ backgroundColor: themeColor }}
                >
                  Next →
                </button>
              </div>
            </div>

            {/* Right Panel: Reference Material */}
            <div className="w-full md:w-80 shrink-0">
              <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
                <h4 className="text-sm font-bold text-gray-800 mb-3">Reference Material:</h4>
                <div className="mb-4 rounded-lg border border-dashed border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-600">
                  TPO Speaking structure verified: Listen and Speak 7 questions, Take an Interview 4 questions.
                </div>
                
                {currentSpeakingQ.materialImage && (
                  <div className="rounded-lg overflow-hidden mb-4 border border-gray-200">
                    <ImageWithFallback
                      src={currentSpeakingQ.materialImage}
                      alt="Reference material"
                      className="w-full h-40 object-cover"
                    />
                  </div>
                )}

                {/* Material Audio Player */}
                {currentSpeakingQ.materialAudioDuration && (
                  <div className="flex items-center gap-2 mb-4">
                    <button
                      onClick={() => setSpeakingMaterialPlaying(!speakingMaterialPlaying)}
                      className="w-7 h-7 rounded-full flex items-center justify-center text-white shrink-0"
                      style={{ backgroundColor: themeColor }}
                    >
                      {speakingMaterialPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 ml-0.5" />}
                    </button>
                    <span className="text-xs text-gray-500">0:00</span>
                    <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${materialProgress}%`, backgroundColor: themeColor }}
                      />
                    </div>
                    <span className="text-xs text-gray-500">0:{String(currentSpeakingQ.materialAudioDuration).padStart(2, '0')}</span>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowTranslation(!showTranslation)}
                    className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                      showTranslation
                        ? 'text-white border-transparent'
                        : 'text-gray-600 border-gray-300 hover:bg-gray-100'
                    }`}
                    style={{ backgroundColor: showTranslation ? themeColor : undefined }}
                  >
                    Show Translation
                  </button>
                  <button
                    onClick={() => setShowFullText(!showFullText)}
                    className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium border transition-all flex items-center justify-center gap-1 ${
                      showFullText
                        ? 'text-white border-transparent'
                        : 'text-gray-600 border-gray-300 hover:bg-gray-100'
                    }`}
                    style={{ backgroundColor: showFullText ? themeColor : undefined }}
                  >
                    {showFullText ? 'Hide Text' : 'View Full Text'}
                    {showFullText ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                </div>

                {/* Full text content */}
                <>
                  {showFullText && currentSpeakingQ.transcript && (
                    <div
                      className="overflow-hidden mt-3 animate-[fadeSlideUp_0.2s_ease-out]"
                    >
                      <p className="text-sm text-gray-700 leading-relaxed p-3 bg-white rounded-lg border border-gray-200">
                        {currentSpeakingQ.transcript}
                      </p>
                    </div>
                  )}
                </>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 px-4 py-2 text-center text-xs text-gray-400 shrink-0">
        © {new Date().getFullYear()} TOEFL TPO Practice Platform. All Rights Reserved.
      </div>
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