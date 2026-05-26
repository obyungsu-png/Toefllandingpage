import React, { useState, useEffect } from 'react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { useTestProgress } from '../hooks/useTestProgress';
import { TestProgressRestoreModal } from './TestProgressRestoreModal';
import { RadioOption } from './RadioOption';
import { MobileFooter } from './MobileFooter';

// ============================================================================
// Listening Module 1 - All Screens Wrapper
// Manages internal navigation: Intro → M1Intro → Q1-Q8 → Conv → Q9-Q10 →
//   Conv2 → Q11-Q12 → Announcement → Q13-Q14 → Podcast → Q15-Q18 →
//   EndM1 → Module2Intro
// ============================================================================

export type M1Screen =
  | 'intro' | 'm1-intro'
  | 'q1' | 'q2' | 'q3' | 'q4' | 'q5' | 'q6' | 'q7' | 'q8'
  | 'conversation' | 'q9' | 'q10'
  | 'conversation2' | 'q11' | 'q12'
  | 'announcement' | 'q13' | 'q14'
  | 'podcast' | 'q15' | 'q16' | 'q17' | 'q18'
  | 'end-m1' | 'module2-intro';

const SCREEN_ORDER: M1Screen[] = [
  'intro', 'm1-intro',
  'q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8',
  'conversation', 'q9', 'q10',
  'conversation2', 'q11', 'q12',
  'announcement', 'q13', 'q14',
  'podcast', 'q15', 'q16', 'q17', 'q18',
  'end-m1', 'module2-intro',
];

interface ListeningM1WrapperProps {
  initialScreen: M1Screen;
  onHome: () => void;
  onComplete: () => void; // Called when Module2Intro → Next is clicked
  onScreenChange?: (screen: M1Screen) => void;
  getCmsListeningQuestion?: (qNumber: number) => {
    imageUrl?: string; questionText?: string; options?: string[]; correctAnswer?: string; audioUrl?: string;
  } | null;
}

// Question data for each Q screen
const questionData: Record<string, { questionNum: number; questionText?: string; options: string[]; imageAsset?: string }> = {
  q1: {
    questionNum: 1,
    questionText: 'Choose the best response.',
    options: [
      'As a matter of fact, I was returning a book.',
      "Yes, you can find it in the reference section.",
      "I don't think I'll have enough time to do that.",
      "Actually, I think I can get there a little earlier.",
    ],
    imageAsset: 'figma:asset/2af79ab9f0e1f8f68f6f9b22e0e0bd4b5e0f8e3a.png',
  },
  q2: {
    questionNum: 2,
    questionText: 'Choose the best response.',
    options: [
      'I nearly missed the bus.',
      'Every 30 minutes.',
      'I can help you find it.',
      "I'll take the subway instead.",
    ],
  },
  q3: {
    questionNum: 3,
    questionText: 'Choose the best response.',
    options: [
      "Yes, you're allowed to do that.",
      'Use the convenient chat feature.',
      "No, I don't mind.",
      'They provide good service.',
    ],
  },
  q4: {
    questionNum: 4,
    questionText: 'Choose the best response.',
    options: [
      "Oh, that's too early.",
      'How about tomorrow night then?',
      'She arrived this afternoon.',
      "No, that's not necessary.",
    ],
  },
  q5: {
    questionNum: 5,
    questionText: 'Choose the best response.',
    options: [
      "No, it's my package.",
      "It's just around the corner!",
      "I think he's come home already.",
      "Let's check the schedule online.",
    ],
  },
  q6: {
    questionNum: 6,
    questionText: 'Choose the best response.',
    options: [
      'I can help you with that.',
      "You don't need any more information.",
      "You have a lot of questions, don't you?",
      "You haven't given me your number yet.",
    ],
  },
  q7: {
    questionNum: 7,
    questionText: 'Choose the best response.',
    options: [
      'Yes, there is a major power outage.',
      "Yes, it's under renovation.",
      "Yes, it's closed all day on Sunday.",
      "Yes, they're having a huge sale.",
    ],
  },
  q8: {
    questionNum: 8,
    questionText: 'Choose the best response.',
    options: [
      'I overslept.',
      'No, not very well.',
      'Have you asked your professor?',
      'I forgot to look.',
    ],
  },
  q9: {
    questionNum: 9,
    questionText: 'What does the woman want to do this evening?',
    options: ['See a play', 'Change her clothes', 'Go shopping', 'Eat dinner'],
  },
  q10: {
    questionNum: 10,
    questionText: 'What is the problem?',
    options: [
      'He forgot what the woman wanted him to buy.',
      'He forgot about the timing of their plans.',
      'He forgot what they were going to eat for dinner.',
      'He forgot to buy salmon and salad at the supermarket.',
    ],
  },
  q11: {
    questionNum: 11,
    questionText: 'What is the problem?',
    options: [
      'An air-conditioner is leaking.',
      'A room is too hot.',
      'An elevator needs maintenance.',
      'A window will not open.',
    ],
  },
  q12: {
    questionNum: 12,
    questionText: 'What does the man say he will do?',
    options: [
      'Finish an assignment early',
      'Wait for a service agent',
      'Open a door',
      'Take a break early',
    ],
  },
  q13: {
    questionNum: 13,
    questionText: 'What is the announcement mainly about?',
    options: [
      'A guest lecture',
      'A different location for a class',
      'Requirements for a class',
      'A new university science course',
    ],
  },
  q14: {
    questionNum: 14,
    questionText: 'Why does the instructor mention the guest speaker\'s work?',
    options: [
      'To encourage students to read her work',
      'To indicate why she was invited to the university',
      'To compare her to other invited experts',
      'To explain why students should arrive early',
    ],
  },
  q15: {
    questionNum: 15,
    questionText: 'What is the topic of the talk?',
    options: [
      'How psychologists study attention',
      'How to keep the mind focused',
      'Two types of fascination',
      'The benefits of hard fascination',
    ],
  },
  q16: {
    questionNum: 16,
    questionText: 'Why does the speaker mention movies?',
    options: [
      'To compare different types of movies',
      'To introduce a concept in psychology',
      'To explain how movies affect emotions',
      'To encourage listeners to watch more movies',
    ],
  },
  q17: {
    questionNum: 17,
    questionText: 'What is the speaker\'s experience when walking in a park?',
    options: [
      'It is similar to her experience watching a good movie.',
      'Her mind has space for thoughts unrelated to nature.',
      'She needs to put in special effort to stay focused on flowers and trees.',
      'She gets mental fatigue from her mind engaging in hard fascination.',
    ],
  },
  q18: {
    questionNum: 18,
    questionText: 'What does the speaker say about Default Mode Network?',
    options: [
      'It is involved in soft fascination.',
      'It leads to irritability and stress.',
      'It is easily tired from overuse.',
      'Its effect is unknown to psychologists.',
    ],
  },
};

// Interstitial screen data
const interstitialData: Record<string, { title: string; imageAsset: string }> = {
  conversation: {
    title: 'Listen to a conversation.',
    imageAsset: 'figma:asset/8ab5a0faa349e01b474fec2471b80ae5d15ee9c2.png',
  },
  conversation2: {
    title: 'Listen to a conversation.',
    imageAsset: 'figma:asset/8a3602403236fbaf317e334c954d119fb2258219.png',
  },
  announcement: {
    title: 'Listen to an announcement in a classroom.',
    imageAsset: 'figma:asset/a1c69f0392872fa2e403399482f99b4b6e513854.png',
  },
  podcast: {
    title: 'Listen to a talk on a podcast about psychology.',
    imageAsset: 'figma:asset/66701e530788c1c664d05a246d0567f5889c51d3.png',
  },
};

// Question image assets (some questions show a person image on the left)
const questionImageAssets: Record<string, string> = {
  q1: 'figma:asset/2af79ab9f0e1f8f68f6f9b22e0e0bd4b5e0f8e3a.png',
  q2: 'figma:asset/761cc24661c0a5be83b157554a227b1138189dbd.png',
  q3: 'figma:asset/761cc24661c0a5be83b157554a227b1138189dbd.png',
  q4: 'figma:asset/761cc24661c0a5be83b157554a227b1138189dbd.png',
  q5: 'figma:asset/761cc24661c0a5be83b157554a227b1138189dbd.png',
  q6: 'figma:asset/761cc24661c0a5be83b157554a227b1138189dbd.png',
  q7: 'figma:asset/761cc24661c0a5be83b157554a227b1138189dbd.png',
  q8: 'figma:asset/761cc24661c0a5be83b157554a227b1138189dbd.png',
  q9: 'figma:asset/8ab5a0faa349e01b474fec2471b80ae5d15ee9c2.png',
  q10: 'figma:asset/8ab5a0faa349e01b474fec2471b80ae5d15ee9c2.png',
  q11: 'figma:asset/8a3602403236fbaf317e334c954d119fb2258219.png',
  q12: 'figma:asset/8a3602403236fbaf317e334c954d119fb2258219.png',
  q13: 'figma:asset/a1c69f0392872fa2e403399482f99b4b6e513854.png',
  q14: 'figma:asset/a1c69f0392872fa2e403399482f99b4b6e513854.png',
  q15: 'figma:asset/4e77653c981388d7af50fd23fa950dabf10c0022.png',
  q16: 'figma:asset/4e77653c981388d7af50fd23fa950dabf10c0022.png',
  q17: 'figma:asset/1ea056cdd00efe83fc60681cea24b852bd1755a6.png',
  q18: 'figma:asset/1ea056cdd00efe83fc60681cea24b852bd1755a6.png',
};

// Shared header component
function ScreenHeader({
  onHome,
  onBack,
  onNext,
  showBack = true,
  showNext = true,
}: {
  onHome: () => void;
  onBack?: () => void;
  onNext?: () => void;
  showBack?: boolean;
  showNext?: boolean;
}) {
  return (
    <div className="bg-[#1e6b73] h-16 flex items-center justify-between px-8 shadow-lg">
      <div className="flex items-center">
        <div
          className="text-white text-2xl font-['Inter',_sans-serif] font-bold tracking-wide cursor-pointer hover:opacity-80 transition-opacity"
          onClick={onHome}
        >
          *toefl ibt
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button className="flex items-center gap-3 bg-[#0A6068] border border-white rounded-lg px-5 py-2 hover:bg-[#084d52] transition-colors">
          <span className="text-white font-['Inter',_sans-serif] font-semibold text-base">Volume</span>
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="white">
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
          </svg>
        </button>
        {showBack && (
          <button
            className="flex items-center gap-2 bg-[#0A6068] border border-white rounded-lg px-5 py-2 hover:bg-[#084d52] transition-colors"
            onClick={onBack}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="white">
              <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
            </svg>
            <span className="text-white font-['Inter',_sans-serif] font-semibold text-base">Back</span>
          </button>
        )}
        {showNext && (
          <button
            className="flex items-center gap-2 bg-white border-2 border-[#0A6068] rounded-lg px-5 py-2 hover:bg-gray-100 transition-colors"
            onClick={onNext}
          >
            <span className="text-[#0A6068] font-['Inter',_sans-serif] font-semibold text-base">Next</span>
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#0A6068">
              <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

function SectionTab({ label, questionInfo }: { label: string; questionInfo?: string }) {
  return (
    <div className="bg-white border-b border-gray-300">
      <div className="px-8 py-3">
        <div className="flex gap-8">
          <div className="text-gray-700 font-['Inter',_sans-serif] font-bold border-b-2 border-[#1e6b73] pb-2">
            {label}
          </div>
          {questionInfo && (
            <div className="text-gray-500 text-sm font-['Inter',_sans-serif] font-medium self-end pb-2">
              {questionInfo}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Generic question screen
function QuestionScreen({
  data,
  imageAsset,
  onHome,
  onBack,
  onNext,
  cmsData,
}: {
  data: { questionNum: number; questionText?: string; options: string[] };
  imageAsset?: string;
  onHome: () => void;
  onBack: () => void;
  onNext: () => void;
  cmsData?: { imageUrl?: string; questionText?: string; options?: string[]; audioUrl?: string } | null;
}) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  // CMS overrides
  const displayImage = cmsData?.imageUrl || imageAsset;
  const displayOptions = (cmsData?.options && cmsData.options.length > 0) ? cmsData.options : data.options;
  const displayQuestion = cmsData?.questionText || data.questionText || 'Choose the best response.';

  return (
    <div className="fixed inset-0 bg-gray-50 z-50 flex flex-col">
      <ScreenHeader onHome={onHome} onBack={onBack} onNext={onNext} />
      <SectionTab label="Listening" questionInfo={`Question ${data.questionNum} of 18`} />
      <div className="flex-1 p-4 md:p-8 overflow-auto bg-white border border-black pb-20 md:pb-8">
        <div className="max-w-5xl mx-auto">
          {/* Mobile: Image -> Question -> Options layout */}
          <div className="md:hidden flex flex-col items-center">
            {/* Image */}
            {displayImage && (
              <div className="w-48 h-48 bg-white rounded-lg overflow-hidden border border-gray-300 mb-6">
                <ImageWithFallback src={displayImage} alt="Listening" className="w-full h-full object-contain" />
              </div>
            )}
            
            {/* Question */}
            <h2 className="text-lg font-['Inter',_sans-serif] font-bold text-gray-800 mb-6 text-center px-4">
              {displayQuestion}
            </h2>
            
            {/* Options */}
            <div className="w-full max-w-2xl px-8">
              <div className="space-y-5">
                {displayOptions.map((option, index) => (
                  <RadioOption
                    key={index}
                    id={`lm1-q${data.questionNum}-opt-${index}`}
                    name={`lm1-q${data.questionNum}`}
                    value={option}
                    checked={selectedAnswer === option}
                    onChange={() => setSelectedAnswer(option)}
                    label={option}
                    labelClassName="text-lg"
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Desktop: Original side-by-side layout */}
          <div className="hidden md:block">
            <h2 className="text-3xl font-['Inter',_sans-serif] font-bold text-gray-800 mb-10 text-center">
              {displayQuestion}
            </h2>
            <div className="flex flex-row gap-20 items-start" style={{paddingLeft: '8%', paddingRight: '4%'}}>
              {displayImage && (
                <div className="flex-shrink-0">
                  <img src={displayImage} alt="Listening" className="w-72 object-contain" style={{maxHeight: '420px', objectPosition: 'top'}} />
                </div>
              )}
              <div className="flex-1 pt-4">
                <div className="space-y-7">
                  {displayOptions.map((option, index) => (
                    <RadioOption
                      key={index}
                      id={`lm1-q${data.questionNum}-opt-${index}`}
                      name={`lm1-q${data.questionNum}`}
                      value={option}
                      checked={selectedAnswer === option}
                      onChange={() => setSelectedAnswer(option)}
                      label={option}
                      labelClassName="text-lg"
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <MobileFooter onHome={onHome} onBack={onBack} onNext={onNext} />
    </div>
  );
}

// Interstitial screen (conversation, announcement, podcast)
function InterstitialScreen({
  title,
  imageAsset,
  onHome,
  onBack,
  onNext,
}: {
  title: string;
  imageAsset: string;
  onHome: () => void;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-gray-50 z-50 flex flex-col">
      <ScreenHeader onHome={onHome} onBack={onBack} onNext={onNext} />
      <SectionTab label="Listening" />
      <div className="flex-1 flex flex-col p-8 overflow-auto bg-white border border-black">
        <h1 className="text-3xl font-bold font-['Inter',_sans-serif] text-gray-800 mb-8 text-center mt-4">
          {title}
        </h1>
        <div className="flex-1 flex justify-center items-center">
          <div className="w-96 h-96 flex items-center justify-center">
            <ImageWithFallback src={imageAsset} alt={title} className="w-full h-full object-contain" />
          </div>
        </div>
      </div>
      <MobileFooter onHome={onHome} onBack={onBack} onNext={onNext} />
    </div>
  );
}

// Text-based intro/info screens
function useSpeechEffect(text: string) {
  useEffect(() => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      const setVoice = () => {
        const voices = window.speechSynthesis.getVoices();
        const britishVoice = voices.find((v) => v.lang === 'en-GB' || v.lang === 'en-UK');
        utterance.voice = britishVoice || voices[0];
        utterance.lang = 'en-GB';
        utterance.rate = 0.9;
        window.speechSynthesis.speak(utterance);
      };
      if (window.speechSynthesis.getVoices().length > 0) setVoice();
      else window.speechSynthesis.onvoiceschanged = setVoice;
    }
    return () => {
      if (window.speechSynthesis.speaking) window.speechSynthesis.cancel();
    };
  }, []);
}

function IntroScreen({
  onHome,
  onNext,
}: {
  onHome: () => void;
  onNext: () => void;
}) {
  useSpeechEffect(
    'In the listening section, you will answer 35 to 45 questions to demonstrate how well you understand spoken English. There are three types of tasks: Listen and Choose a Response, Conversations, and Lectures. You will not be able to return to previous questions.'
  );

  return (
    <div className="fixed inset-0 bg-gray-50 z-50 flex flex-col">
      <ScreenHeader onHome={onHome} showBack={false} onNext={onNext} />
      <SectionTab label="Listening" />
      <div className="flex-1 flex items-center justify-center p-12 overflow-auto bg-white">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl font-['Inter',_sans-serif] font-bold text-black mb-8">Listening</h1>
          <div className="space-y-6 text-gray-700 font-['Inter',_sans-serif] leading-relaxed">
            <p className="text-lg">
              In the listening section, you will answer questions to demonstrate how well you understand spoken English.
            </p>
            <p className="text-lg">There are three types of tasks:</p>
            <div className="text-left max-w-md mx-auto space-y-3 text-lg">
              <p>1. <strong>Listen and Choose a Response</strong></p>
              <p>2. <strong>Conversations</strong></p>
              <p>3. <strong>Lectures</strong></p>
            </div>
            <p className="text-lg">You will not be able to return to previous questions.</p>
          </div>
        </div>
      </div>
      <MobileFooter onHome={onHome} onBack={onNext} onNext={onNext} />
    </div>
  );
}

function Module1IntroScreen({
  onHome,
  onBack,
  onNext,
}: {
  onHome: () => void;
  onBack: () => void;
  onNext: () => void;
}) {
  useSpeechEffect(
    'Module 1. You can use Next to move to the next question. The first task is Listen and Choose a Response. In this task, you will listen to a sentence or question. You will then read four sentences and choose the option that is the best response.'
  );

  return (
    <div className="fixed inset-0 bg-gray-50 z-50 flex flex-col">
      <ScreenHeader onHome={onHome} onBack={onBack} onNext={onNext} />
      <SectionTab label="Listening" />
      <div className="flex-1 flex items-center justify-center p-12 overflow-auto bg-white">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl font-['Inter',_sans-serif] font-bold text-black mb-8">Module 1</h1>
          <div className="space-y-6 text-gray-700 font-['Inter',_sans-serif] leading-relaxed">
            <p className="text-lg">
              You can use <strong>Next</strong> to move to the next question.
            </p>
            <p className="text-lg">
              The first task is <strong>Listen and Choose a Response</strong>. In this task, you will listen to a
              sentence or question. You will then read four sentences and choose the option that is the best response.
            </p>
          </div>
        </div>
      </div>
      <MobileFooter onHome={onHome} onBack={onBack} onNext={onNext} />
    </div>
  );
}

function EndModule1Screen({
  onHome,
  onBack,
  onNext,
}: {
  onHome: () => void;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-gray-50 z-50 flex flex-col">
      <ScreenHeader onHome={onHome} onBack={onBack} onNext={onNext} />
      <SectionTab label="Listening" />
      <div className="flex-1 flex items-center justify-center p-4 md:p-12 overflow-auto bg-white pb-20 md:pb-12">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-['Inter',_sans-serif] font-bold text-black mb-6 md:mb-8">End of Module 1</h1>
          <div className="space-y-4 md:space-y-6 text-gray-700 font-['Inter',_sans-serif] leading-relaxed">
            <p className="text-base md:text-lg">This is the end of Module 1 of the Listening section.</p>
            <p className="text-base md:text-lg">You will now begin Module 2.</p>
          </div>
        </div>
      </div>
      <MobileFooter onHome={onHome} onBack={onBack} onNext={onNext} />
    </div>
  );
}

function Module2IntroScreen({
  onHome,
  onBack,
  onNext,
}: {
  onHome: () => void;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-gray-50 z-50 flex flex-col">
      <ScreenHeader onHome={onHome} onBack={onBack} onNext={onNext} />
      <SectionTab label="Listening" />
      <div className="flex-1 flex items-center justify-center p-4 md:p-12 overflow-auto bg-white pb-20 md:pb-12">
        <div className="max-w-3xl mx-auto text-center px-2">
          <h1 className="text-3xl md:text-4xl font-['Inter',_sans-serif] font-bold text-black mb-6 md:mb-8">Module 2</h1>
          <div className="space-y-4 md:space-y-6 text-gray-700 font-['Inter',_sans-serif] leading-relaxed">
            <p className="text-base md:text-lg">
              In an actual test, the clock will show you how much time you have to complete each question.
            </p>
            <p className="text-base md:text-lg">
              You can use <strong>Next</strong> to move to the next question.
            </p>
            <p className="text-base md:text-lg">
              The first task is <strong>Listen and Choose a Response</strong>. In this task, you will listen to a
              sentence or question. You will then read four sentences and choose the option that is the best response.
            </p>
          </div>
        </div>
      </div>
      <MobileFooter onHome={onHome} onBack={onBack} onNext={onNext} />
    </div>
  );
}

// ============================================================================
// Main Wrapper Component
// ============================================================================

export function ListeningM1Wrapper({ initialScreen, onHome, onComplete, onScreenChange, getCmsListeningQuestion }: ListeningM1WrapperProps) {
  const [currentScreen, setCurrentScreen] = useState<M1Screen>(initialScreen);
  
  // Auto-save progress
  const {
    savedProgress,
    showRestoreModal,
    saveProgress,
    clearProgress,
    restoreProgress,
    startFresh
  } = useTestProgress({
    testType: 'listening_m1',
    enabled: true
  });

  // Restore progress on mount
  useEffect(() => {
    if (savedProgress && savedProgress.currentScreen) {
      setCurrentScreen(savedProgress.currentScreen as M1Screen);
    }
  }, []);

  // Auto-save when screen changes
  useEffect(() => {
    if (currentScreen !== 'module2-intro') {
      const screenIndex = SCREEN_ORDER.indexOf(currentScreen);
      saveProgress({
        currentScreen,
        currentQuestionIndex: screenIndex,
        totalQuestions: SCREEN_ORDER.length
      });
    } else {
      clearProgress();
    }
  }, [currentScreen]);

  useEffect(() => {
    onScreenChange?.(currentScreen);
  }, [currentScreen, onScreenChange]);

  const currentIndex = SCREEN_ORDER.indexOf(currentScreen);

  const goNext = () => {
    if (currentScreen === 'module2-intro') {
      onComplete();
      return;
    }
    if (currentIndex < SCREEN_ORDER.length - 1) {
      setCurrentScreen(SCREEN_ORDER[currentIndex + 1]);
    }
  };

  const goBack = () => {
    if (currentIndex > 0) {
      setCurrentScreen(SCREEN_ORDER[currentIndex - 1]);
    }
  };

  const handleRestore = () => {
    restoreProgress();
    if (savedProgress && savedProgress.currentScreen) {
      setCurrentScreen(savedProgress.currentScreen as M1Screen);
    }
  };

  // Render the appropriate screen
  return (
    <>
      {showRestoreModal && savedProgress && (
        <TestProgressRestoreModal
          savedProgress={savedProgress}
          themeColor="#0f766e"
          onRestore={handleRestore}
          onStartFresh={startFresh}
        />
      )}

      {currentScreen === 'intro' && <IntroScreen onHome={onHome} onNext={goNext} />}
      {currentScreen === 'm1-intro' && <Module1IntroScreen onHome={onHome} onBack={goBack} onNext={goNext} />}
      {currentScreen === 'end-m1' && <EndModule1Screen onHome={onHome} onBack={goBack} onNext={goNext} />}
      {currentScreen === 'module2-intro' && <Module2IntroScreen onHome={onHome} onBack={goBack} onNext={goNext} />}

      {/* Interstitial screens */}
      {interstitialData[currentScreen] && (() => {
        const data = interstitialData[currentScreen];
        return (
          <InterstitialScreen
            title={data.title}
            imageAsset={data.imageAsset}
            onHome={onHome}
            onBack={goBack}
            onNext={goNext}
          />
        );
      })()}

      {/* Question screens */}
      {questionData[currentScreen] && (() => {
        const data = questionData[currentScreen];
        const imgAsset = questionImageAssets[currentScreen];
        const cmsQ = getCmsListeningQuestion?.(data.questionNum) || null;
        return (
          <QuestionScreen
            data={data}
            imageAsset={imgAsset}
            cmsData={cmsQ}
            onHome={onHome}
            onBack={goBack}
            onNext={goNext}
          />
        );
      })()}
    </>
  );
}

export type { M1Screen };