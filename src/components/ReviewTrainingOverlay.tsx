import { useState } from 'react';
import { Headphones } from 'lucide-react';
import { ReviewSection } from './ReviewAssistantPanel';
import type { TPOQuestion, TPOTest } from './ContentManagement';
import { ResizableReadingLayout } from './ResizableReadingLayout';
import { RadioOption } from './RadioOption';
import { MobileQuestionNav } from './MobileQuestionNav';

interface ReviewTrainingOverlayProps {
  section: ReviewSection;
  title: string;
  questionType?: string;
  difficulty?: TPOQuestion['difficulty'];
  trainingTests?: TPOTest[];
  onClose: () => void;
}

function normalizeType(type?: string) {
  return (type || '').toLowerCase().replace(/\([^)]*\)/g, '').replace(/\s+/g, ' ').trim();
}

function normalizeAnswer(value: string) {
  return value.trim().toLowerCase().replace(/[.,!?]/g, '').replace(/\s+/g, ' ');
}

function getCorrectOptionIndex(question: TPOQuestion): number {
  if (!question.options || question.options.length === 0) return -1;
  if (typeof question.correctAnswer === 'string') {
    const numericIndex = Number(question.correctAnswer);
    if (!Number.isNaN(numericIndex) && question.options[numericIndex] !== undefined) return numericIndex;
    return question.options.findIndex((o) => normalizeAnswer(o) === normalizeAnswer(question.correctAnswer || ''));
  }
  if (Array.isArray(question.correctAnswer) && question.correctAnswer.length > 0) {
    return question.options.findIndex((o) => normalizeAnswer(o) === normalizeAnswer(question.correctAnswer?.[0] || ''));
  }
  return -1;
}

// ───────────────────────────────────────────────────────────────────────────
//  Fallback 연습 문제 — CMS 데이터가 없을 때 사용 (나중에 CMS로 대체 예정)
// ───────────────────────────────────────────────────────────────────────────
const FALLBACK_QUESTIONS: Record<ReviewSection, TPOQuestion[]> = {
  Reading: [
    {
      id: 'fb-reading-1',
      questionNumber: 1,
      questionType: 'Read an Academic Passage',
      questionText: 'According to the passage, why did the ancient Romans build aqueducts?',
      passageTitle: 'Roman Aqueducts',
      passageText:
        'The ancient Romans were remarkable engineers who built aqueducts to transport water from distant sources into their cities. These structures, often spanning miles of difficult terrain, were essential for supplying fresh water to public baths, fountains, and households. The aqueducts relied on gravity to move water, requiring precise calculations of slope and elevation. Without these engineering marvels, Roman cities could not have grown as large or as prosperous as they did, since local water sources were often insufficient for the needs of a growing population.',
      options: [
        'To create decorative landmarks for their cities',
        'To supply fresh water to cities where local sources were insufficient',
        'To demonstrate their military strength to neighboring territories',
        'To irrigate farmland outside the city boundaries',
      ],
      correctAnswer: '1',
      explanation:
        'The passage states that aqueducts were "essential for supplying fresh water" and that "local water sources were often insufficient for the needs of a growing population." This directly supports option B.',
      difficulty: '보통',
      translationNote: '로마인들은 먼 곳에서 물을 끌어오기 위해 수도교를 건설했다. 이 구조물은 공중 목욕탕, 분수, 가정에 신선한 물을 공급하는 데 필수적이었다.',
      vocabularyNote: 'aqueduct=수도교; terrain=지형; elevation=고도; insufficient=충분하지 않은; prosperous=번성하는',
    },
    {
      id: 'fb-reading-2',
      questionNumber: 2,
      questionType: 'Read an Academic Passage',
      questionText: 'What can be inferred about the relationship between aqueducts and Roman city growth?',
      passageTitle: 'Roman Aqueducts',
      passageText:
        'The ancient Romans were remarkable engineers who built aqueducts to transport water from distant sources into their cities. These structures, often spanning miles of difficult terrain, were essential for supplying fresh water to public baths, fountains, and households. The aqueducts relied on gravity to move water, requiring precise calculations of slope and elevation. Without these engineering marvels, Roman cities could not have grown as large or as prosperous as they did, since local water sources were often insufficient for the needs of a growing population.',
      options: [
        'Aqueducts were built only after cities had already grown large',
        'The availability of water from aqueducts enabled cities to grow larger',
        'City growth was unrelated to water supply infrastructure',
        'Aqueducts were primarily built to replace old water systems',
      ],
      correctAnswer: '1',
      explanation:
        'The passage says "Without these engineering marvels, Roman cities could not have grown as large or as prosperous as they did." This implies that aqueducts enabled the growth, supporting option B.',
      difficulty: '어려움',
    },
    {
      id: 'fb-reading-3',
      questionNumber: 3,
      questionType: 'Read an Academic Passage',
      questionText: 'The word "precise" in the passage is closest in meaning to:',
      passageTitle: 'Roman Aqueducts',
      passageText:
        'The ancient Romans were remarkable engineers who built aqueducts to transport water from distant sources into their cities. These structures, often spanning miles of difficult terrain, were essential for supplying fresh water to public baths, fountains, and households. The aqueducts relied on gravity to move water, requiring precise calculations of slope and elevation. Without these engineering marvels, Roman cities could not have grown as large or as prosperous as they did, since local water sources were often insufficient for the needs of a growing population.',
      options: [
        'Approximate',
        'Exact',
        'Complex',
        'Repeated',
      ],
      correctAnswer: '1',
      explanation:
        '"Precise" means exact or accurate. The context — calculating slope and elevation for gravity-based water flow — requires exact measurements, not approximate ones.',
      difficulty: '쉬움',
    },
  ],
  Listening: [
    {
      id: 'fb-listening-1',
      questionNumber: 1,
      questionType: 'Short Conversation',
      questionText: 'Why does the student go to the library?',
      passageTitle: 'Library Conversation',
      passageText:
        'Man: Hi, can you help me find a book on European history?\nWoman: Sure! Are you looking for a specific author or just a general overview?\nMan: I need something for my research paper — it should cover the Renaissance period.\nWoman: Let me check the catalog. We have a few options in the second-floor section.\nMan: Great, thanks! I also need to check if my reserved books are available.\nWoman: I can look that up for you too. Just give me your student ID.',
      options: [
        'To return a borrowed book',
        'To find research materials and check on reserved books',
        'To attend a study group meeting',
        'To ask about library membership',
      ],
      correctAnswer: '1',
      explanation:
        'The man asks for a book on European history for his research paper AND wants to check if his reserved books are available. Both reasons are mentioned.',
      difficulty: '보통',
      translationNote: '학생이 도서관에서 유럽 역history 관련 책을 찾고 예약한 책 확인을 요청하는 대화',
      vocabularyNote: 'catalog=도서 목록; Renaissance=르네상스; reserved=예약된; overview=개관',
    },
    {
      id: 'fb-listening-2',
      questionNumber: 2,
      questionType: 'Short Conversation',
      questionText: 'What does the woman suggest the student do?',
      passageTitle: 'Library Conversation',
      passageText:
        'Man: Hi, can you help me find a book on European history?\nWoman: Sure! Are you looking for a specific author or just a general overview?\nMan: I need something for my research paper — it should cover the Renaissance period.\nWoman: Let me check the catalog. We have a few options in the second-floor section.\nMan: Great, thanks! I also need to check if my reserved books are available.\nWoman: I can look that up for you too. Just give me your student ID.',
      options: [
        'Visit the second-floor section to find the books',
        'Ask his professor for recommendations',
        'Use the online catalog from home',
        'Wait until the books are returned',
      ],
      correctAnswer: '0',
      explanation:
        'The woman says "We have a few options in the second-floor section," suggesting the student go there to find the books.',
      difficulty: '쉬움',
    },
    {
      id: 'fb-listening-3',
      questionNumber: 3,
      questionType: 'Academic Lecture',
      questionText: 'What is the main purpose of the lecture?',
      passageTitle: 'Ecology Lecture: Coral Reefs',
      passageText:
        'Professor: Today we\'re going to examine one of the most diverse ecosystems on Earth — coral reefs. Coral reefs are often called the "rainforests of the sea" because they support an incredible variety of marine life. However, these delicate ecosystems face serious threats from climate change, pollution, and overfishing. Rising ocean temperatures cause coral bleaching, a process where corals lose their color and eventually die if conditions don\'t improve. Understanding how these ecosystems function and what threatens them is crucial for developing effective conservation strategies.',
      options: [
        'To describe the economic value of coral reef tourism',
        'To explain the biodiversity and threats facing coral reef ecosystems',
        'To compare coral reefs with rainforests on land',
        'To argue that overfishing is the primary threat to marine life',
      ],
      correctAnswer: '1',
      explanation:
        'The professor introduces coral reefs as diverse ecosystems ("rainforests of the sea") and then discusses the threats they face. The main purpose is to explain both their biodiversity and the threats.',
      difficulty: '보통',
    },
  ],
  Writing: [
    {
      id: 'fb-writing-1',
      questionNumber: 1,
      questionType: 'Write an Email',
      questionText: 'Write an email responding to a parent who is concerned about the school\'s new lunch menu. Include the following points:\n• Explain why the menu was changed\n• Describe the new healthier options available\n• Invite the parent to provide feedback',
      passageTitle: 'Writing: Email Response',
      passageText:
        'Dear School Administration,\n\nI\'ve noticed that the school recently changed its lunch menu, and my daughter says the new options don\'t appeal to her. She used to enjoy pizza and burgers, but now only healthy salads and grain bowls are offered. I\'m worried she might not be eating enough during the school day. Can you explain why this change was made?\n\nSincerely,\nA Concerned Parent',
      options: [],
      correctAnswer: '',
      explanation:
        '이 문제는 이메일 작문 유형입니다. 제시된 3개 조건을 모두 포함하여 정중하고 명확한 이메일을 작성하세요.',
      difficulty: '보통',
      translationNote: '학교 급식 메뉴 변경에 대해 불안을 표하는 부모의 이메일에 답장을 작성하세요.',
      vocabularyNote: 'menu=급식 메뉴; healthy options=건강한 선택지; feedback=피드백/의견; appeal to=~에게 매력적이다',
    },
    {
      id: 'fb-writing-2',
      questionNumber: 2,
      questionType: 'Write an Email',
      questionText: 'Write an email to a coworker explaining why you cannot attend a team meeting. Include the following:\n• State the reason you cannot attend\n• Suggest an alternative time or method to discuss the topic\n• Apologize for the inconvenience',
      passageTitle: 'Writing: Email Response',
      passageText:
        'Hi Team,\n\nJust a reminder that our weekly project meeting is scheduled for Thursday at 2 PM. We\'ll be discussing the upcoming product launch timeline. Please make sure to review the latest design documents before the meeting.\n\nBest,\nProject Manager',
      options: [],
      correctAnswer: '',
      explanation:
        '이메일 작문: 부득이하게 회에 참석할 수 없는 이유, 대안 제시, 사과를 포함하세요.',
      difficulty: '쉬움',
    },
    {
      id: 'fb-writing-3',
      questionNumber: 3,
      questionType: 'Academic Discussion',
      questionText: 'Your professor is discussing the impact of technology on education. Write a response contributing to the discussion.',
      passageTitle: 'Writing: Academic Discussion',
      passageText:
        'Professor Kim: Technology has transformed how we learn. Some argue it improves access to information, while others believe it creates distractions.\n\nStudent A (Jordan): I think online resources make learning more flexible. You can study anytime, anywhere.\n\nStudent B (Lisa): But constant notifications and social media can hurt focus. Students may spend more time scrolling than studying.\n\nWhat is your opinion? Share your perspective and support it with reasons or examples.',
      options: [],
      correctAnswer: '',
      explanation:
        '학술 논의 작문: 교수와 두 학생의 주장을 참고하여 자신의 관점을 서술하고, 이유나 예시로 근거를 제시하세요.',
      difficulty: '어려움',
    },
  ],
  Speaking: [
    {
      id: 'fb-speaking-1',
      questionNumber: 1,
      questionType: 'Listen and Speak',
      questionText: 'Please welcome the new students and explain what they should do on their first day.',
      passageTitle: 'Speaking: Listen and Speak',
      passageText:
        'Imagine you are a student ambassador at your university. A group of new international students has just arrived. Please welcome them and briefly explain what they should do on their first day — for example, where to go for orientation, how to get their student ID, and where to find important campus facilities.',
      options: [],
      correctAnswer: '',
      explanation:
        '스피킹 유형: 새 학생들을 환영하고 첫 날 해야 할 일(orientation, 학생증, campus 시설)을 설명하세요. 45초 내에 답변을 완성하세요.',
      difficulty: '쉬움',
      duration: 45,
    },
    {
      id: 'fb-speaking-2',
      questionNumber: 2,
      questionType: 'Listen and Speak',
      questionText: 'Describe a challenge you faced and explain how you overcame it.',
      passageTitle: 'Speaking: Listen and Speak',
      passageText:
        'We all face challenges in life. Think of a specific challenge you experienced — academic, personal, or professional — and describe what happened and how you dealt with it. What did you learn from the experience?',
      options: [],
      correctAnswer: '',
      explanation:
        '스피킹: 경험한 도전과 해결 과정을 설명하세요. 구조: 상황 설명 → 해결 방법 → 배운 점.',
      difficulty: '보통',
      duration: 45,
    },
    {
      id: 'fb-speaking-3',
      questionNumber: 3,
      questionType: 'Take an Interview',
      questionText: 'Some people prefer to work independently, while others prefer teamwork. Which do you prefer and why?',
      passageTitle: 'Speaking: Interview',
      passageText:
        'In many workplaces and classrooms, people must choose between working alone or collaborating with others. Some value the focus and independence of solo work, while others find that teamwork produces better results through shared ideas.\n\nWhich approach do you prefer? Give reasons and examples to support your choice.',
      options: [],
      correctAnswer: '',
      explanation:
        '인터뷰 스피킹: 독립 작업 vs 팀워크 중 하나를 선택하고 이유와 예시를 제시하세요.',
      difficulty: '보통',
      duration: 45,
    },
  ],
};

function getQuestionsFromCMS(
  section: ReviewSection,
  questionType: string | undefined,
  difficulty: TPOQuestion['difficulty'] | undefined,
  trainingTests: TPOTest[] | undefined,
): TPOQuestion[] {
  // CMS 데이터가 있으면 먼저 사용
  if (questionType && trainingTests && trainingTests.length > 0) {
    const normalizedSelected = normalizeType(questionType);

    const allMatching = trainingTests
      .flatMap((test) => test.sections)
      .filter((sec) => sec.sectionType === section)
      .flatMap((sec) => sec.questions)
      .filter((q) => {
        const nq = normalizeType(q.questionType);
        return nq === normalizedSelected || nq.includes(normalizedSelected) || normalizedSelected.includes(nq);
      });

    const exactDifficulty = difficulty ? allMatching.filter((q) => q.difficulty === difficulty) : allMatching;
    const fallback = difficulty ? allMatching.filter((q) => q.difficulty !== difficulty) : [];
    const pool = [...exactDifficulty, ...fallback];

    // Shuffle
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    if (pool.length > 0) return pool.slice(0, 3);
  }

  // CMS 데이터가 없거나 매칭 결과가 없으면 fallback 사용
  const fallbackPool = FALLBACK_QUESTIONS[section] || [];

  // questionType이 있으면 type 매칭 (loose)
  if (questionType && fallbackPool.length > 0) {
    const normalizedSelected = normalizeType(questionType);
    const typeMatched = fallbackPool.filter((q) => {
      const nq = normalizeType(q.questionType);
      return nq === normalizedSelected || nq.includes(normalizedSelected) || normalizedSelected.includes(nq);
    });
    if (typeMatched.length > 0) {
      // difficulty 우선순위
      const exactDiff = difficulty ? typeMatched.filter((q) => q.difficulty === difficulty) : typeMatched;
      const fallbackDiff = difficulty ? typeMatched.filter((q) => q.difficulty !== difficulty) : [];
      const pool = [...exactDiff, ...fallbackDiff];
      for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
      }
      return pool.slice(0, 3);
    }
  }

  // questionType 매칭도 없으면 section 전체 fallback에서 shuffle 후 3개
  const shuffled = [...fallbackPool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, 3);
}

export function ReviewTrainingOverlay({
  section,
  title,
  questionType,
  difficulty,
  trainingTests,
  onClose,
}: ReviewTrainingOverlayProps) {
  // Compute questions once on mount
  const [questions] = useState(() =>
    getQuestionsFromCMS(section, questionType, difficulty, trainingTests),
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);

  const current = questions[currentIndex];
  const isLast = currentIndex >= questions.length - 1;

  const goNext = () => {
    if (isLast) {
      onClose();
      return;
    }
    setSelectedAnswer(null);
    setChecked(false);
    setCurrentIndex((prev) => prev + 1);
  };

  const goPrev = () => {
    if (currentIndex === 0) {
      onClose();
      return;
    }
    setSelectedAnswer(null);
    setChecked(false);
    setCurrentIndex((prev) => prev - 1);
  };

  // ── Empty state (also guards against undefined current below) ────────────
  if (!questions.length || !current) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex flex-col">
        {/* Header */}
        <div className="flex bg-[#1e6b73] h-12 sm:h-16 items-center justify-between px-2 sm:px-8 shadow-lg">
          <div
            className="text-white text-sm sm:text-2xl font-['Inter',_sans-serif] font-bold tracking-wide cursor-pointer hover:opacity-80 transition-opacity leading-tight"
            onClick={onClose}
          >
            *toefl ibt
          </div>
          <button
            className="flex items-center gap-1 sm:gap-2 bg-white border-2 border-[#0A6068] rounded-lg px-2 sm:px-5 py-1.5 sm:py-2 hover:bg-gray-100 transition-colors"
            onClick={onClose}
          >
            <span className="text-[#0A6068] font-['Inter',_sans-serif] font-semibold text-xs sm:text-base">닫기</span>
          </button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-6">
          <p className="text-lg font-bold text-gray-700">유형에 맞는 문제가 없습니다.</p>
          <p className="text-sm text-gray-500">이 유형의 TPO 문제가 아직 등록되지 않았습니다.</p>
          <button
            onClick={onClose}
            className="mt-4 rounded-lg bg-[#1e6b73] px-6 py-2.5 text-white font-semibold hover:opacity-90"
          >
            돌아가기
          </button>
        </div>
      </div>
    );
  }

  const correctOptionIndex = getCorrectOptionIndex(current);
  const selectedIndex = current.options ? current.options.indexOf(selectedAnswer ?? '') : -1;
  const isCorrect = checked && selectedIndex !== -1 && selectedIndex === correctOptionIndex;

  // ── Left panel — passage / image / audio ──────────────────────────────────
  const leftContent = (
    <div className="space-y-4">
      {current.passageTitle && (
        <h3 className="text-xl sm:text-2xl font-['Inter',_sans-serif] font-bold text-black">
          {current.passageTitle}
        </h3>
      )}

      {current.imageUrl && (
        <img
          src={current.imageUrl}
          alt={current.passageTitle || 'Question visual'}
          className="w-full h-auto object-contain"
        />
      )}

      {(current.audioUrl || current.passageAudioUrl) && (
        <div className="border border-gray-300 bg-gray-50 p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
            <Headphones className="h-4 w-4" />
            Audio
          </div>
          <audio controls className="w-full" src={current.audioUrl || current.passageAudioUrl} />
        </div>
      )}

      {current.passageText ? (
        <div className="whitespace-pre-wrap text-[15px] leading-7 text-gray-800 font-['Inter',_sans-serif]">
          {current.passageText}
        </div>
      ) : (
        !current.imageUrl && !(current.audioUrl || current.passageAudioUrl) && (
          <div className="border border-dashed border-gray-300 bg-gray-50 px-4 py-5 text-sm leading-6 text-gray-500">
            지문 영역입니다.
          </div>
        )
      )}

      {(current.translationNote || current.vocabularyNote) && (
        <div className="border border-gray-200 bg-gray-50 p-4 text-sm leading-6 text-gray-600 mt-4">
          {current.translationNote && <p>{current.translationNote}</p>}
          {current.vocabularyNote && (
            <p className={current.translationNote ? 'mt-2' : ''}>{current.vocabularyNote}</p>
          )}
        </div>
      )}
    </div>
  );

  // ── Right panel — question text + options ──────────────────────────────────
  const rightContent = (
    <div>
      <h3 className="text-lg sm:text-xl md:text-2xl font-['Inter',_sans-serif] font-bold text-black mb-4 md:mb-8 lg:mb-10">
        {current.questionText}
      </h3>

      {current.options && current.options.length > 0 && (
        <div className="space-y-4 md:space-y-4 lg:space-y-6">
          {current.options.map((option, index) => (
            <RadioOption
              key={`q${currentIndex}-opt-${index}`}
              id={`training-q${currentIndex}-opt-${index}`}
              name={`training-q${currentIndex}`}
              value={option}
              checked={selectedAnswer === option}
              onChange={() => !checked && setSelectedAnswer(option)}
              label={option}
            />
          ))}
        </div>
      )}

      {/* Feedback after check */}
      {checked && (
        <div
          className={`mt-6 border-l-4 pl-4 py-2 ${
            isCorrect ? 'border-green-500' : 'border-red-400'
          }`}
        >
          <p
            className={`font-semibold text-sm ${
              isCorrect ? 'text-green-700' : 'text-red-600'
            }`}
          >
            {isCorrect ? '정답입니다.' : '다시 확인해 보세요.'}
          </p>
          {current.explanation && (
            <p className="mt-1 text-sm text-gray-700">{current.explanation}</p>
          )}
          {!isCorrect && correctOptionIndex >= 0 && current.options && (
            <p className="mt-1 text-sm font-medium text-gray-700">
              정답: {current.options[correctOptionIndex]}
            </p>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div className="mt-8 flex justify-end gap-3">
        {!checked && selectedAnswer ? (
          <button
            type="button"
            onClick={() => setChecked(true)}
            className="rounded-lg bg-[#1e6b73] px-5 py-3 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
          >
            정답 확인
          </button>
        ) : checked ? (
          <button
            type="button"
            onClick={goNext}
            className="flex items-center gap-2 rounded-lg bg-[#1e6b73] px-5 py-3 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
          >
            {isLast ? '유형연습 종료' : '다음 문제'}
          </button>
        ) : null}
      </div>
    </div>
  );

  // ── Full-screen TPO layout ─────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 bg-white z-50 flex flex-col"
      role="dialog"
      aria-modal="true"
      aria-label={`${section} 유형연습`}
    >
      {/* Header — exact same structure as TPO question screens */}
      <div className="flex bg-[#1e6b73] h-12 sm:h-16 items-center justify-between px-2 sm:px-8 shadow-lg">
        <div
          className="text-white text-sm sm:text-2xl font-['Inter',_sans-serif] font-bold tracking-wide cursor-pointer hover:opacity-80 transition-opacity leading-tight"
          onClick={onClose}
        >
          *toefl ibt
        </div>
        <div className="flex items-center gap-1.5 sm:gap-3">
          <button
            className="hidden sm:flex items-center gap-2 bg-[#0A6068] border border-white rounded-lg px-5 py-2 hover:bg-[#084d52] transition-colors"
            onClick={goPrev}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="white">
              <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
            </svg>
            <span className="text-white font-['Inter',_sans-serif] font-semibold text-base">Back</span>
          </button>
          <button
            className="flex items-center gap-1 sm:gap-2 bg-white border-2 border-[#0A6068] rounded-lg px-2 sm:px-5 py-1.5 sm:py-2 hover:bg-gray-100 transition-colors"
            onClick={goNext}
          >
            <span className="text-[#0A6068] font-['Inter',_sans-serif] font-semibold text-xs sm:text-base">
              {isLast ? '종료' : 'Next'}
            </span>
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" viewBox="0 0 24 24" fill="#0A6068">
              <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Tab bar — exact same structure as TPO question screens */}
      <div className="bg-white border-b border-gray-300">
        <div className="px-3 sm:px-8 py-2 sm:py-3">
          <div className="flex gap-4 sm:gap-8">
            <div className="text-gray-700 font-['Inter',_sans-serif] text-sm sm:text-base font-bold border-b-2 border-[#1e6b73] pb-2">
              {section}
            </div>
            <div className="text-gray-500 text-xs sm:text-sm font-['Inter',_sans-serif] font-medium self-end pb-2">
              Question {currentIndex + 1} of {questions.length}
            </div>
          </div>
        </div>
      </div>

      {/* Main content — exact same structure as TPO question screens */}
      <div className="flex-1 overflow-auto bg-white border border-black pb-16 md:pb-0">
        <ResizableReadingLayout
          leftContent={leftContent}
          rightContent={rightContent}
          passageTitle={title}
          passageSummary={current.passageTitle || title}
          onBack={goPrev}
          onNext={goNext}
        />
      </div>

      {/* Mobile navigation — exact same as TPO question screens */}
      <MobileQuestionNav
        onBack={goPrev}
        onHome={onClose}
        onNext={goNext}
      />
    </div>
  );
}
