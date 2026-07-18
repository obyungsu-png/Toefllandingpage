import React, { useState, useEffect } from 'react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { useTestProgress } from '../hooks/useTestProgress';
import { TestProgressRestoreModal } from './TestProgressRestoreModal';
import { RadioOption } from './RadioOption';
import { MobileFooter } from './MobileFooter';
import { speakHighQuality, stopAllSpeech } from '../utils/cloudTts';
import { createCachedAudio, stopAllAudio } from '../utils/mediaCache';

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
    imageAsset: 'listening-images/man-burgundy-turtleneck.png',
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
    imageAsset: 'listening-images/two-people-conversation-1.png',
  },
  conversation2: {
    title: 'Listen to a conversation.',
    imageAsset: 'listening-images/two-people-conversation-2.png',
  },
  announcement: {
    title: 'Listen to an announcement in a classroom.',
    imageAsset: 'listening-images/man-pink-shirt.png',
  },
  podcast: {
    title: 'Listen to a talk on a podcast about psychology.',
    imageAsset: 'listening-images/woman-purple-scarf.png',
  },
};

// Question image assets (some questions show a person image on the left)
const questionImageAssets: Record<string, string> = {
  q1: 'listening-images/man-burgundy-turtleneck.png',
  q2: 'listening-images/woman-navy-cardigan.png',
  q3: 'listening-images/woman-navy-cardigan.png',
  q4: 'listening-images/woman-navy-cardigan.png',
  q5: 'listening-images/woman-navy-cardigan.png',
  q6: 'listening-images/woman-navy-cardigan.png',
  q7: 'listening-images/woman-navy-cardigan.png',
  q8: 'listening-images/woman-navy-cardigan.png',
  q9: 'listening-images/two-people-conversation-1.png',
  q10: 'listening-images/two-people-conversation-1.png',
  q11: 'listening-images/two-people-conversation-2.png',
  q12: 'listening-images/two-people-conversation-2.png',
  q13: 'listening-images/man-pink-shirt.png',
  q14: 'listening-images/man-pink-shirt.png',
  q15: 'listening-images/man-pink-shirt-2.png',
  q16: 'listening-images/man-pink-shirt-2.png',
  q17: 'listening-images/woman-green-polo.png',
  q18: 'listening-images/woman-green-polo.png',
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
  hideAudio,
}: {
  data: { questionNum: number; questionText?: string; options: string[] };
  imageAsset?: string;
  onHome: () => void;
  onBack: () => void;
  onNext: () => void;
  cmsData?: { imageUrl?: string; questionText?: string; options?: string[]; audioUrl?: string } | null;
  hideAudio?: boolean;
}) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showMustAnswer, setShowMustAnswer] = useState(false);

  // 답 선택 시 window.__moduleAnswers에 저장 (리뷰 화면용)
  const recordListeningAnswer = (option: string) => {
    setSelectedAnswer(option);
    if (typeof window !== 'undefined') {
      (window as any).__moduleAnswers = {
        ...((window as any).__moduleAnswers || {}),
        [data.questionNum]: option,
      };
    }
  };

  // Reset answer when question changes
  React.useEffect(() => {
    setSelectedAnswer(null);
    setShowMustAnswer(false);
  }, [data.questionNum]);
  // CMS overrides
  const displayImage = cmsData?.imageUrl || imageAsset;
  const displayOptions = (cmsData?.options && cmsData.options.length > 0) ? cmsData.options : data.options;
  const displayQuestion = cmsData?.questionText || data.questionText || 'Choose the best response.';
  const displayAudio = cmsData?.audioUrl || null;

  // Audio playback - auto-play after 1s, only once per question, disabled for conversation group
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const audioPlayedRef = React.useRef(false);
  const prevQuestionRef = React.useRef(data.questionNum);
  const [isPlaying, setIsPlaying] = useState(false);

  // Reset audio flag when question changes
  React.useEffect(() => {
    if (prevQuestionRef.current !== data.questionNum) {
      audioPlayedRef.current = false;
      prevQuestionRef.current = data.questionNum;
      if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    }
  }, [data.questionNum]);

  React.useEffect(() => {
    // hideAudio=true인 문제(Q9-Q12)는 자동재생 안 함 — 인트로에서 이미 들음
    if (hideAudio) return;
    if (displayAudio && !audioPlayedRef.current) {
      audioPlayedRef.current = true;
      const timer = setTimeout(async () => {
        const audio = await createCachedAudio(displayAudio);
        audioRef.current = audio;
        audio.play().then(() => setIsPlaying(true)).catch(() => {});
        audio.onended = () => setIsPlaying(false);
      }, 1000);
      return () => { clearTimeout(timer); if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; } };
    }
  }, [displayAudio, data.questionNum, hideAudio]);

  const handlePlayAudio = async () => {
    if (!displayAudio || isPlaying) return;
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; }
    const audio = await createCachedAudio(displayAudio);
    audioRef.current = audio;
    audio.play().then(() => setIsPlaying(true)).catch(() => {});
    audio.onended = () => setIsPlaying(false);
  };

  // Must answer check before next
  const handleNext = () => {
    if (!selectedAnswer) {
      setShowMustAnswer(true);
      return;
    }
    onNext();
  };

  return (
    <div className="fixed inset-0 bg-gray-50 z-50 flex flex-col">
      <ScreenHeader onHome={onHome} onBack={onBack} onNext={handleNext} />
      <SectionTab label="Listening" questionInfo={`Question ${data.questionNum} of 18`} />
      <div className="flex-1 p-4 md:p-8 overflow-auto bg-white border border-black pb-20 md:pb-8">
        <div className="w-full">
          {/* Mobile: Image -> Question -> Options layout */}
          <div className="md:hidden flex flex-col items-center">
            {/* Image */}
            {displayImage && (
              <div className="w-48 h-48 bg-white rounded-lg overflow-hidden border border-gray-300 mb-6">
                <ImageWithFallback src={displayImage} alt="Listening" className="w-full h-full object-contain" />
              </div>
            )}
            
            {/* Play Audio Button - Mobile */}
            {displayAudio && !hideAudio && (
              <button
                onClick={handlePlayAudio}
                disabled={isPlaying}
                className={`flex items-center gap-3 px-8 py-3 rounded-full font-semibold text-base mb-6 transition-all shadow-sm ${
                  isPlaying
                    ? 'bg-[#0d9488] text-white cursor-not-allowed'
                    : 'bg-[#f0f0f0] text-[#1e293b] hover:bg-[#e2e8f0]'
                }`}
              >
                <span style={{fontSize: '0px', width: 0, height: 0, borderStyle: 'solid', borderWidth: '7px 0 7px 12px', borderColor: `transparent transparent transparent ${isPlaying ? 'white' : '#1e293b'}`, display: 'inline-block'}} />
                <span>{isPlaying ? 'Playing...' : 'Play Audio'}</span>
              </button>
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
                    onChange={() => recordListeningAnswer(option)}
                    label={option}
                    labelClassName="text-lg"
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Desktop: Original side-by-side layout */}
          <div className="hidden md:block">
            {/* Play Audio Button - Desktop */}
            {displayAudio && !hideAudio && (
              <div className="flex justify-center mb-8">
                <button
                  onClick={handlePlayAudio}
                  disabled={isPlaying}
                  className={`flex items-center gap-3 px-10 py-3 rounded-full font-semibold text-base transition-all shadow-sm ${
                    isPlaying
                      ? 'bg-[#0d9488] text-white cursor-not-allowed'
                      : 'bg-[#f0f0f0] text-[#1e293b] hover:bg-[#e2e8f0]'
                  }`}
                >
                  <span style={{fontSize: '0px', width: 0, height: 0, borderStyle: 'solid', borderWidth: '7px 0 7px 12px', borderColor: `transparent transparent transparent ${isPlaying ? 'white' : '#1e293b'}`, display: 'inline-block'}} />
                  <span>{isPlaying ? 'Playing...' : 'Play Audio'}</span>
                </button>
              </div>
            )}
            <h2 className="text-3xl font-['Inter',_sans-serif] font-bold text-gray-800 mb-10 text-center">
              {displayQuestion}
            </h2>

            <div className="relative" style={{minHeight: '420px'}}>
              {displayImage && (
                <div style={{position: 'absolute', left: [9,10,11,12].includes(data.questionNum) ? '12%' : '18%', top: 0, width: [9,10,11,12].includes(data.questionNum) ? '460px' : '280px'}}>
                  <img src={displayImage} alt="Listening" className="w-full object-contain object-top" style={{maxHeight: [9,10,11,12].includes(data.questionNum) ? '560px' : '480px'}} />
                </div>
              )}
              <div style={{position: 'absolute', left: displayImage ? ([9,10,11,12].includes(data.questionNum) ? '56%' : '51%') : '10%', top: '8px', width: displayImage ? ([9,10,11,12].includes(data.questionNum) ? '38%' : '42%') : '80%'}}>
                <div className="space-y-7">
                  {displayOptions.map((option, index) => (
                    <RadioOption
                      key={index}
                      id={`lm1-q${data.questionNum}-opt-${index}`}
                      name={`lm1-q${data.questionNum}`}
                      value={option}
                      checked={selectedAnswer === option}
                      onChange={() => recordListeningAnswer(option)}
                      label={option}
                      labelClassName="text-xl font-['Inter',_sans-serif] text-gray-900"
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Must Answer Modal */}
      {showMustAnswer && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4" style={{ animation: 'mustAnswerFadeIn 0.2s ease' }}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-7 sm:p-8" style={{ animation: 'mustAnswerPopIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Must Answer</h3>
              <p className="text-[15px] text-gray-500 leading-relaxed mb-6">
                You must enter an answer before you can leave this question.
              </p>
              <button
                onClick={() => setShowMustAnswer(false)}
                className="w-full py-3 bg-[#1e6b73] text-white font-semibold rounded-xl hover:bg-[#164f54] active:scale-[0.98] transition-all text-base shadow-sm"
              >
                Return to Question
              </button>
            </div>
          </div>
          <style>{`
            @keyframes mustAnswerFadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes mustAnswerPopIn { from { opacity: 0; transform: scale(0.92) translateY(8px); } to { opacity: 1; transform: scale(1) translateY(0); } }
          `}</style>
        </div>
      )}
      <MobileFooter onHome={onHome} onBack={onBack} onNext={handleNext} />
    </div>
  );
}

// Interstitial screen (conversation, announcement, podcast)
function InterstitialScreen({
  title,
  imageAsset,
  cmsImageUrl,
  cmsAudioUrl,
  cmsTitle,
  isLarge,
  onHome,
  onBack,
  onNext,
}: {
  title: string;
  imageAsset: string;
  cmsImageUrl?: string;
  cmsAudioUrl?: string;
  cmsTitle?: string;
  isLarge?: boolean;
  onHome: () => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const playedRef = React.useRef(false);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [audioEnded, setAudioEnded] = React.useState(false);

  React.useEffect(() => {
    playedRef.current = false;
    setIsPlaying(false);
    setAudioEnded(false);
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
  }, [cmsAudioUrl]);

  React.useEffect(() => {
    if (!cmsAudioUrl || playedRef.current) return;
    playedRef.current = true;
    const timer = setTimeout(async () => {
      const audio = await createCachedAudio(cmsAudioUrl);
      audioRef.current = audio;
      audio.play().then(() => setIsPlaying(true)).catch(() => {});
      audio.onended = () => { setIsPlaying(false); setAudioEnded(true); };
    }, 1000);
    return () => { clearTimeout(timer); audioRef.current?.pause(); };
  }, [cmsAudioUrl]);

  const canGoNext = !cmsAudioUrl || audioEnded;

  const handleReplay = async () => {
    if (!cmsAudioUrl || isPlaying) return;
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; }
    const audio = await createCachedAudio(cmsAudioUrl);
    audioRef.current = audio;
    audio.play().then(() => setIsPlaying(true)).catch(() => {});
    audio.onended = () => { setIsPlaying(false); setAudioEnded(true); };
  };

  const displayImage = cmsImageUrl || imageAsset;
  const displayTitle = cmsTitle || title;

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      <ScreenHeader onHome={onHome} onBack={onBack} onNext={canGoNext ? onNext : () => {}} />
      <SectionTab label="Listening" />
      <div className="flex-1 flex flex-col p-8 overflow-auto bg-white border border-black">
        <h1 className="text-3xl font-bold font-['Inter',_sans-serif] text-gray-800 mb-8 text-center mt-4">
          {displayTitle}
        </h1>
        <div className="flex-1 flex flex-col justify-center items-center gap-6">
          {/* 오디오 — 이미지 위에 표시 */}
          {cmsAudioUrl && (
            <div className="flex justify-center">
              <button
                onClick={handleReplay}
                disabled={isPlaying}
                className={`flex items-center gap-3 px-8 py-3 rounded-full font-semibold text-base transition-all shadow-sm ${
                  isPlaying
                    ? 'bg-[#0d9488] text-white cursor-not-allowed'
                    : 'bg-[#f0f0f0] text-[#1e293b] hover:bg-[#e2e8f0]'
                }`}
              >
                <span style={{fontSize:'0px',width:0,height:0,borderStyle:'solid',borderWidth:'7px 0 7px 12px',
                  borderColor:`transparent transparent transparent ${isPlaying ? 'white' : '#1e293b'}`,display:'inline-block'}} />
                <span>{isPlaying ? 'Playing...' : 'Play Audio'}</span>
              </button>
            </div>
          )}

          {/* 이미지 */}
          <div className={`w-full ${isLarge ? 'max-w-2xl md:max-w-3xl' : 'max-w-xl md:max-w-2xl'} aspect-[4/3] flex items-center justify-center`}>
            <ImageWithFallback src={displayImage} alt={title} className="w-full h-full object-contain" />
          </div>
        </div>
      </div>
      <MobileFooter onHome={onHome} onBack={onBack} onNext={canGoNext ? onNext : () => {}} />
    </div>
  );
}

// Text-based intro/info screens — uses high-quality cloud TTS with speechSynthesis fallback
// stopAllSpeech is called synchronously on cleanup so speech stops immediately on "Next"
function useSpeechEffect(text: string) {
  useEffect(() => {
    if (!text || !text.trim()) return;

    let cancelled = false;

    // Stop any previous speech before starting new one
    stopAllSpeech();

    // Start new speech (async — stopAllSpeech handles synchronous cancel)
    speakHighQuality(text);

    return () => {
      cancelled = true;
      // Synchronous stop — works even if speakHighQuality hasn't resolved yet
      stopAllSpeech();
    };
  }, [text]);
}

function IntroScreen({
  onHome,
  onNext,
}: {
  onHome: () => void;
  onNext: () => void;
}) {
  useSpeechEffect(
    'Listening. In the listening section, you will answer questions to demonstrate how well you understand spoken English. There are three types of tasks: Listen and Choose a Response, Conversations, and Lectures. You will not be able to return to previous questions.'
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
  skipSpeech = false,
}: {
  onHome: () => void;
  onBack: () => void;
  onNext: () => void;
  skipSpeech?: boolean;
}) {
  useSpeechEffect(
    skipSpeech ? '' : 'Module 1. You can use Next to move to the next question. The first task is Listen and Choose a Response. In this task, you will listen to a sentence or question. You will then read four sentences and choose the option that is the best response.'
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
  useSpeechEffect('This is the end of Module 1 of the Listening section. You will now begin Module 2.');

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
  useSpeechEffect(
    'Module 2. In an actual test, the clock will show you how much time you have to complete each question. You can use Next to move to the next question. The first task is Listen and Choose a Response. In this task, you will listen to a sentence or question. You will then read four sentences and choose the option that is the best response.'
  );

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
  const [isRestored, setIsRestored] = useState(
    // initialScreen이 intro가 아니면 이어풀기 또는 리뷰 모드 → 소개 음성 Skip
    initialScreen !== 'intro' && initialScreen !== 'm1-intro'
  );
  
  // Review mode = started from a mid-flow screen (not 'intro')
  // Don't save/restore progress in review mode to avoid spurious restore modals
  const isReviewMode = initialScreen !== 'intro';

  // Auto-save progress
  
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
    enabled: !isReviewMode
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
    stopAllAudio(); // 이전 화면 오디오 정지
    if (currentScreen === 'module2-intro') {
      onComplete();
      return;
    }
    if (currentIndex < SCREEN_ORDER.length - 1) {
      setCurrentScreen(SCREEN_ORDER[currentIndex + 1]);
    }
  };

  const goBack = () => {
    stopAllAudio(); // 이전 화면 오디오 정지
    if (currentIndex > 0) {
      setCurrentScreen(SCREEN_ORDER[currentIndex - 1]);
    }
  };

  // Hardware/browser Back button (dispatched from App.tsx) reuses this same goBack
  useEffect(() => {
    const handler = () => goBack();
    window.addEventListener('toefl:hardware-back', handler);
    return () => window.removeEventListener('toefl:hardware-back', handler);
  }, [currentScreen]);

  // Hardware/browser Forward button (dispatched from App.tsx) reuses this same goNext
  useEffect(() => {
    const handler = () => goNext();
    window.addEventListener('toefl:hardware-forward', handler);
    return () => window.removeEventListener('toefl:hardware-forward', handler);
  }, [currentScreen]);

  const handleRestore = () => {
    restoreProgress();
    setIsRestored(true);
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
      {currentScreen === 'm1-intro' && <Module1IntroScreen onHome={onHome} onBack={goBack} onNext={goNext} skipSpeech={isRestored} />}
      {currentScreen === 'end-m1' && <EndModule1Screen onHome={onHome} onBack={goBack} onNext={goNext} />}
      {currentScreen === 'module2-intro' && <Module2IntroScreen onHome={onHome} onBack={goBack} onNext={goNext} />}

      {/* Interstitial screens */}
      {interstitialData[currentScreen] && (() => {
        const data = interstitialData[currentScreen];
        // 각 인트로 화면 → 다음 첫 문제의 CMS 데이터 사용
        const nextQNum: Record<string, number> = {
          conversation: 9,
          conversation2: 11,
          announcement: 13,
          podcast: 15,
        };
        const qNum = nextQNum[currentScreen];
        const cmsQ = qNum ? getCmsListeningQuestion?.(qNum) || null : null;
        return (
          <InterstitialScreen
            title={data.title}
            imageAsset={data.imageAsset}
            cmsImageUrl={cmsQ?.imageUrl}
            cmsAudioUrl={cmsQ?.audioUrl}
            cmsTitle={(cmsQ as any)?.interstitialTitle || undefined}
            isLarge={currentScreen === 'conversation' || currentScreen === 'conversation2'}
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
            hideAudio={[9, 10, 11, 12, 13, 14, 15, 16, 17, 18].includes(data.questionNum)}
          />
        );
      })()}
    </>
  );
}

export type { M1Screen };