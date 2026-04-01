import { useState, useRef, useEffect } from 'react';
// motion removed - using CSS animations
import { ChevronLeft, Play, Pause, Star, StarOff, Check, X, Volume2, ChevronDown, ChevronUp, Mic } from 'lucide-react';
import { TestResult } from './HistorySection';
import { ImageWithFallback } from './figma/ImageWithFallback';

type SectionTab = 'Reading' | 'Listening' | 'Writing' | 'Speaking';

interface QuestionReviewFullProps {
  result: TestResult;
  tpoTests?: any[];
  onBack: () => void;
  themeColor?: string;
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

// Speaking question data
interface SpeakingQuestion {
  id: string;
  number: number;
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

const sampleSpeakingQuestions: SpeakingQuestion[] = [
  { id: 'spk-1', number: 1, modelLabel: 'Model Answer', currentVoice: 'Donald Trump', voiceAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face', modelAudioDuration: 11, userAudioDuration: 8, showTextDefault: true, materialImage: 'https://images.unsplash.com/photo-1633431303895-8236f0a04b46?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400', materialAudioDuration: 3, transcript: 'The university plans to renovate the student center to add more study spaces and a new cafeteria. Construction is expected to begin next semester.' },
  { id: 'spk-2', number: 2, modelLabel: 'Model Answer', currentVoice: 'Morgan Freeman', voiceAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&crop=face', modelAudioDuration: 15, userAudioDuration: 12, showTextDefault: false, materialImage: 'https://images.unsplash.com/photo-1633431303895-8236f0a04b46?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400', materialAudioDuration: 5, transcript: 'In ecology, keystone species play a critical role in maintaining the structure of an ecological community.' },
  { id: 'spk-3', number: 3, modelLabel: 'Model Answer', currentVoice: 'Donald Trump', voiceAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face', modelAudioDuration: 9, userAudioDuration: 7, showTextDefault: true, transcript: 'Some people prefer to study alone, while others prefer to study in groups. Discuss the advantages of each approach.' },
];

export function QuestionReviewFull({
  result,
  tpoTests = [],
  onBack,
  themeColor = '#005f61'
}: QuestionReviewFullProps) {
  const [activeSection, setActiveSection] = useState<SectionTab>((result.category as SectionTab) || 'Reading');
  const [activeModule, setActiveModule] = useState(1);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [bookmarkedQuestions, setBookmarkedQuestions] = useState<Set<string>>(new Set());
  const [isPlaying, setIsPlaying] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const progressInterval = useRef<number | null>(null);

  // Speaking-specific state
  const [speakingModelPlaying, setSpeakingModelPlaying] = useState(false);
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
  const currentSection = currentTPOTest?.sections?.find((s: any) => s.sectionType === activeSection);
  const passageText = currentSection?.passages?.[0]?.content || null;

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
    const totalCorrect = result.correctAnswers;
    const wrongQs = result.wrongAnswers;
    
    // Try to get real questions from CMS data
    const realQuestions = currentSection?.questions || [];
    
    for (let i = 0; i < totalCorrect; i++) {
      const realQ = realQuestions[i];
      const sample = activeSection === 'Listening' && listeningCorrectSamples[i % listeningCorrectSamples.length];
      
      if (realQ) {
        // Use real CMS question data
        qs.push({
          id: realQ.id || `correct-${i}`,
          number: i + 1,
          text: realQ.questionText || realQ.text || `Question ${i + 1}`,
          options: realQ.options || ['Option A', 'Option B', 'Option C', 'Option D'],
          userAnswer: realQ.correctAnswer || 'A',
          correctAnswer: realQ.correctAnswer || 'A',
          isCorrect: true,
          hasAudio: activeSection === 'Listening',
          audioText: realQ.audioText || (activeSection === 'Listening' ? 'Audio transcript for this question.' : undefined),
          passageText: passageText,
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
    
    wrongQs.forEach((wrong, idx) => {
      qs.push({
        id: wrong.questionId,
        number: totalCorrect + idx + 1,
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
    });
    
    return qs;
  })();

  // Writing questions count (1 per task: email vs academic discussion)
  const writingQuestionCount = activeSection === 'Writing' ? 1 : 0;
  const writingConversations = sampleWritingConversations;
  
  // Speaking questions
  const speakingQs = activeSection === 'Speaking' ? sampleSpeakingQuestions : [];
  const speakingQuestionCount = speakingQs.length;

  // Determine total questions based on section
  const totalQuestions = activeSection === 'Writing' 
    ? writingQuestionCount 
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

  // Writing question pill data
  const writingPills = Array.from({ length: writingQuestionCount }, (_, i) => ({
    id: `writing-${i}`,
    number: i + 1,
    isCorrect: i < result.correctAnswers,
  }));

  // Speaking question pill data
  const speakingPills = speakingQs.map((q, i) => ({
    id: q.id,
    number: q.number,
    isCorrect: true, // Speaking doesn't have right/wrong in the same way
  }));

  const currentSpeakingQ = speakingQs[currentQuestionIndex] || speakingQs[0];
  const currentWritingConv = writingConversations[currentQuestionIndex % writingConversations.length];

  // Module tab label helper
  const getModuleTabLabel = (mod: number) => {
    if (activeSection === 'Writing') return mod === 1 ? 'Writing an Email' : 'Academic Discussion';
    if (activeSection === 'Speaking') return `Task ${mod}`;
    return `Module ${mod}`;
  };

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
            {[1, 2].map(mod => (
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
            {activeSection === 'Writing' && (
              // Writing has 1 essay question per task — no pill navigation needed
              <span className="text-xs text-gray-400">1 question</span>
            )}
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
            {activeSection !== 'Speaking' && (
              <span>
                Results: <strong className="text-gray-900">{correctCount}/{totalQuestions}</strong>
              </span>
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
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 flex flex-col md:flex-row gap-6">
            {/* Left Panel: Passage (for Reading) - Equal width 50% */}
            {activeSection === 'Reading' && (
              <div className="w-full md:w-1/2 order-1 md:order-none">
                <div className="bg-gray-50 rounded-xl border border-gray-200 p-6 h-full overflow-y-auto">
                  <h4 className="text-base font-bold text-gray-800 mb-4">Passage</h4>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {currentQuestion?.passageText || 
                      'The passage text related to this question would appear here. In a complete implementation, the full reading passage would be displayed, allowing students to reference the text while reviewing their answers.'}
                  </p>
                </div>
              </div>
            )}

            {/* Left Panel: Audio Player (for Listening) - Equal width 50% */}
            {activeSection === 'Listening' && (
              <div className="w-full md:w-1/2 order-1 md:order-none">
                <div className="bg-gray-50 rounded-xl border border-gray-200 p-6 h-full overflow-y-auto">
                  {/* Listening Image (if available from CMS) */}
                  {currentQuestion?.imageUrl && (
                    <div className="rounded-lg overflow-hidden mb-4 border border-gray-200">
                      <img
                        src={currentQuestion.imageUrl}
                        alt="Listening question context"
                        className="w-full h-48 object-cover"
                      />
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

                  <div className="flex gap-2 mb-4">
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
                      onClick={() => setShowTranscript(!showTranscript)}
                      className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                        showTranscript
                          ? 'text-white border-transparent'
                          : 'text-gray-600 border-gray-300 hover:bg-gray-100'
                      }`}
                      style={{ backgroundColor: showTranscript ? themeColor : undefined }}
                    >
                      {showTranscript ? 'Hide Transcript' : 'Show Transcript'}
                    </button>
                  </div>

                  {/* replace AnimatePresence with fragment: */}
                  <>
                    {(showTranscript || showTranslation) && (
                      <div
                        className="overflow-hidden animate-[fadeSlideUp_0.2s_ease-out]"
                      >
                        <p className="text-sm italic" style={{ color: themeColor }}>
                          {currentQuestion?.audioText || currentQuestion?.text}
                        </p>
                      </div>
                    )}
                  </>
                </div>
              </div>
            )}

            {/* Right: Question Content - Equal width 50% */}
            <div className="w-full md:w-1/2 shrink-0 order-2 md:order-none">
              <>
                <div
                  key={currentQuestion?.id}
                  className="animate-[fadeIn_0.2s_ease-out]"
                >
                  <p className="text-sm text-gray-500 mb-4">
                    Question {currentQuestionIndex + 1} of {totalQuestions}
                  </p>

                  <p className="text-base md:text-lg text-gray-900 mb-6 leading-relaxed">
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
                          <span className={`text-sm font-bold mt-0.5 ${
                            isCorrectAnswer
                              ? 'text-emerald-600'
                              : isUserAnswer && !currentQuestion.isCorrect
                              ? 'text-red-600'
                              : 'text-gray-500'
                          }`}>
                            {optionLetter}.
                          </span>
                          <span className={`text-sm flex-1 ${
                            isCorrectAnswer
                              ? 'text-emerald-700 font-medium'
                              : isUserAnswer && !currentQuestion.isCorrect
                              ? 'text-red-700'
                              : 'text-gray-700'
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
                    <div className="flex flex-col gap-2 text-sm">
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
        )}

        {/* ===== WRITING CONTENT ===== */}
        {activeSection === 'Writing' && (
          <div className="flex-1 flex flex-col md:flex-row overflow-auto">
            {/* ---- Writing 1: Writing an Email ---- */}
            {activeModule === 1 && (
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

            {/* ---- Writing 2: Academic Discussion ---- */}
            {activeModule === 2 && (
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
                  <div className="bg-blue-50 rounded-xl border border-blue-200 p-5 mb-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-blue-200 flex items-center justify-center">
                        <Mic className="w-5 h-5 text-blue-600" />
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-500 text-white">
                        My Recording
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setSpeakingUserPlaying(!speakingUserPlaying)}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white shrink-0 bg-blue-500"
                      >
                        {speakingUserPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
                      </button>
                      <span className="text-xs text-gray-500 w-8">0:00</span>
                      <div className="flex-1 h-1.5 bg-blue-200 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all bg-blue-500"
                          style={{ width: `${userProgress}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 w-8">0:{String(currentSpeakingQ.userAudioDuration).padStart(2, '0')}</span>
                    </div>
                  </div>
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