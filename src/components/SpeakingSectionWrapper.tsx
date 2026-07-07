import React, { useState, useEffect, useMemo } from 'react';
import { SpeakingIntro } from './SpeakingIntro';
import { SpeakingListenRepeatIntro } from './SpeakingListenRepeatIntro';
import { SpeakingQ1 } from './SpeakingQ1';
import { SpeakingQ1Record } from './SpeakingQ1Record';
import { SpeakingQ2Prep } from './SpeakingQ2Prep';
import { SpeakingQ2Record } from './SpeakingQ2Record';
import { SpeakingQ3Prep } from './SpeakingQ3Prep';
import { SpeakingQ3Record } from './SpeakingQ3Record';
import { SpeakingQ4Prep } from './SpeakingQ4Prep';
import { SpeakingQ4Record } from './SpeakingQ4Record';
import { SpeakingQ5Prep } from './SpeakingQ5Prep';
import { SpeakingQ5Record } from './SpeakingQ5Record';
import { SpeakingQ6Prep } from './SpeakingQ6Prep';
import { SpeakingQ6Record } from './SpeakingQ6Record';
import { SpeakingQ7Prep } from './SpeakingQ7Prep';
import { SpeakingQ7Record } from './SpeakingQ7Record';
import { SpeakingTakeInterviewIntro } from './SpeakingTakeInterviewIntro';
import { SpeakingInterviewIntro } from './SpeakingInterviewIntro';
import { SpeakingQ8Prep } from './SpeakingQ8Prep';
import { SpeakingQ8Record } from './SpeakingQ8Record';
import { SpeakingQ9Prep } from './SpeakingQ9Prep';
import { SpeakingQ9Record } from './SpeakingQ9Record';
import { SpeakingQ10Prep } from './SpeakingQ10Prep';
import { SpeakingQ10Record } from './SpeakingQ10Record';
import { SpeakingQ11Prep } from './SpeakingQ11Prep';
import { SpeakingQ11Record } from './SpeakingQ11Record';
import { SpeakingEndSession } from './SpeakingEndSession';
import { VolumeControl, useVolumeControl } from './VolumeControl';
import { useTestProgress } from '../hooks/useTestProgress';
import { TestProgressRestoreModal } from './TestProgressRestoreModal';
import { TPOQuestion, TPOTest } from './ContentManagement';

// ============================================================================
// Speaking Section - All Screens Wrapper
// Manages internal navigation via a single screen state instead of 26 booleans.
// Also owns its own VolumeControl so App doesn't need to wire it.
// ============================================================================

export type SpeakingScreen =
  | 'intro' | 'listen-repeat-intro'
  | 'q1' | 'q1-record'
  | 'q2-prep' | 'q2-record'
  | 'q3-prep' | 'q3-record'
  | 'q4-prep' | 'q4-record'
  | 'q5-prep' | 'q5-record'
  | 'q6-prep' | 'q6-record'
  | 'q7-prep' | 'q7-record'
  | 'take-interview-intro' | 'interview-intro'
  | 'q8-prep' | 'q8-record'
  | 'q9-prep' | 'q9-record'
  | 'q10-prep' | 'q10-record'
  | 'q11-prep' | 'q11-record'
  | 'end-session';

const SPEAKING_SCREEN_ORDER: SpeakingScreen[] = [
  'intro', 'listen-repeat-intro',
  'q1', 'q1-record',
  'q2-prep', 'q2-record',
  'q3-prep', 'q3-record',
  'q4-prep', 'q4-record',
  'q5-prep', 'q5-record',
  'q6-prep', 'q6-record',
  'q7-prep', 'q7-record',
  'take-interview-intro', 'interview-intro',
  'q8-prep', 'q8-record',
  'q9-prep', 'q9-record',
  'q10-prep', 'q10-record',
  'q11-prep', 'q11-record',
  'end-session',
];

interface SpeakingSectionWrapperProps {
  initialScreen: SpeakingScreen;
  onHome: () => void;
  onComplete: () => void;
  questions?: TPOQuestion[]; // Optional questions from CMS
  testData?: TPOTest | null;
  onScreenChange?: (screen: SpeakingScreen) => void;
  isReviewMode?: boolean;
}

export function SpeakingSectionWrapper({
  initialScreen,
  onHome,
  onComplete,
  questions = [],
  testData = null,
  onScreenChange,
  isReviewMode = false,
}: SpeakingSectionWrapperProps) {
  const [screen, setScreen] = useState<SpeakingScreen>(initialScreen);
  const { isOpen: isVolumeOpen, buttonRef: volumeButtonRef, toggleVolume, closeVolume } = useVolumeControl();

  const sortedQuestions = useMemo(() => {
    return [...questions].sort((a, b) => {
      const aNum = typeof a.questionNumber === 'number' ? a.questionNumber : Number(String(a.questionNumber).replace(/\D/g, ''));
      const bNum = typeof b.questionNumber === 'number' ? b.questionNumber : Number(String(b.questionNumber).replace(/\D/g, ''));
      const safeANum = Number.isNaN(aNum) ? Number.MAX_SAFE_INTEGER : aNum;
      const safeBNum = Number.isNaN(bNum) ? Number.MAX_SAFE_INTEGER : bNum;
      return safeANum - safeBNum;
    });
  }, [questions]);
  
  // Auto-save progress
  const {
    savedProgress,
    showRestoreModal,
    saveProgress,
    clearProgress,
    restoreProgress,
    startFresh
  } = useTestProgress({
    testType: 'speaking',
    enabled: true
  });

  // Restore progress on mount
  useEffect(() => {
    if (savedProgress && savedProgress.currentScreen) {
      setScreen(savedProgress.currentScreen as SpeakingScreen);
    }
  }, []);

  // Save test context so uploadRecording can tag files correctly
  useEffect(() => {
    if (testData) {
      sessionStorage.setItem('current_test_type', String(testData.testType || 'tpo').toLowerCase());
      sessionStorage.setItem('current_test_number', String(testData.testNumber || '0'));
    }
  }, [testData]);

  // Clear previous session's recordings only ONCE when speaking section first mounts
  useEffect(() => {
    sessionStorage.removeItem('speakingRecordings');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-save when screen changes
  useEffect(() => {
    const screenIndex = SPEAKING_SCREEN_ORDER.indexOf(screen);
    if (screenIndex < SPEAKING_SCREEN_ORDER.length - 1) {
      saveProgress({
        currentScreen: screen,
        currentQuestionIndex: screenIndex,
        totalQuestions: SPEAKING_SCREEN_ORDER.length
      });
    } else {
      clearProgress();
    }
  }, [screen]);

  useEffect(() => {
    onScreenChange?.(screen);
  }, [onScreenChange, screen]);

  const goNext = () => {
    const idx = SPEAKING_SCREEN_ORDER.indexOf(screen);
    if (idx < SPEAKING_SCREEN_ORDER.length - 1) {
      setScreen(SPEAKING_SCREEN_ORDER[idx + 1]);
    } else {
      onComplete();
    }
  };

  const goBack = () => {
    const idx = SPEAKING_SCREEN_ORDER.indexOf(screen);
    if (idx > 0) {
      setScreen(SPEAKING_SCREEN_ORDER[idx - 1]);
    }
  };

  // Hardware/browser Back button (dispatched from App.tsx) reuses this same goBack
  useEffect(() => {
    const handler = () => goBack();
    window.addEventListener('toefl:hardware-back', handler);
    return () => window.removeEventListener('toefl:hardware-back', handler);
  }, [screen]);

  const handleRestore = () => {
    restoreProgress();
    if (savedProgress && savedProgress.currentScreen) {
      setScreen(savedProgress.currentScreen as SpeakingScreen);
    }
  };

  const volumeProps = {
    onVolumeClick: toggleVolume,
    isVolumeOpen,
    volumeButtonRef,
  };

  const getQuestionIndexFromScreen = (currentScreen: SpeakingScreen): number | null => {
    const match = currentScreen.match(/^q(\d+)/);
    if (!match) return null;

    const questionNumber = Number(match[1]);
    if (Number.isNaN(questionNumber) || questionNumber < 1) return null;

    return questionNumber - 1;
  };

  const currentQuestion = (() => {
    const idx = getQuestionIndexFromScreen(screen);
    if (idx === null) return null;
    return sortedQuestions[idx] || null;
  })();

  // Map questions to image URLs (Q1=0, Q2=1, Q3=2, etc.)
  const getImageUrl = (questionIndex: number) => {
    return sortedQuestions[questionIndex]?.imageUrl;
  };
  const getAudioUrl = (questionIndex: number) => {
    return sortedQuestions[questionIndex]?.audioUrl;
  };
  const getVideoUrl = (questionIndex: number) => {
    return (sortedQuestions[questionIndex] as any)?.videoUrl;
  };
  const getQuestionText = (questionIndex: number) => {
    return sortedQuestions[questionIndex]?.questionText;
  };
  const getIntroImageUrl = (questionIndex: number) => {
    const q = sortedQuestions[questionIndex] as any;
    return q?.introImageUrl || q?.imageUrl;
  };
  const getIntroAudioUrl = (questionIndex: number) => {
    return (sortedQuestions[questionIndex] as any)?.introAudioUrl;
  };
  const getTiming = (questionIndex: number) => ({
    audioPlayDuration: (sortedQuestions[questionIndex] as any)?.audioPlayDuration,
    responseDelay:     (sortedQuestions[questionIndex] as any)?.responseDelay,
    stopDuration:      (sortedQuestions[questionIndex] as any)?.stopDuration,
  });
  const getDuration = (questionIndex: number) => {
    return sortedQuestions[questionIndex]?.duration;
  };

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

      {screen === 'intro' && <SpeakingIntro onNext={goNext} onLogoClick={onHome} />}
      {screen === 'listen-repeat-intro' && (
        <SpeakingListenRepeatIntro onNext={goNext} onLogoClick={onHome} isReviewMode={isReviewMode} {...volumeProps} />
      )}
      {screen === 'q1' && <SpeakingQ1 onNext={goNext} onHome={onHome} isReviewMode={isReviewMode} imageUrl={getIntroImageUrl(0)} introAudioUrl={getIntroAudioUrl(0)} questionText={getQuestionText(0)} />}
      {screen === 'q1-record' && <SpeakingQ1Record onNext={goNext} onHome={onHome} isReviewMode={isReviewMode} imageUrl={getImageUrl(0)} audioUrl={getAudioUrl(0)} questionText={getQuestionText(0)} responseDelay={getTiming(0).responseDelay} stopDuration={getTiming(0).stopDuration} duration={getDuration(0)} />}
      {screen === 'q2-prep' && <SpeakingQ2Prep onNext={goNext} onHome={onHome} isReviewMode={isReviewMode} {...volumeProps} imageUrl={getImageUrl(1)} audioUrl={getAudioUrl(1)} questionText={getQuestionText(1)} audioPlayDuration={getTiming(1).audioPlayDuration} />}
      {screen === 'q2-record' && <SpeakingQ2Record onNext={goNext} onHome={onHome} isReviewMode={isReviewMode} imageUrl={getImageUrl(1)} questionText={getQuestionText(1)} responseDelay={getTiming(1).responseDelay} stopDuration={getTiming(1).stopDuration} duration={getDuration(1)} />}
      {screen === 'q3-prep' && <SpeakingQ3Prep onNext={goNext} onHome={onHome} isReviewMode={isReviewMode} {...volumeProps} imageUrl={getImageUrl(2)} audioUrl={getAudioUrl(2)} questionText={getQuestionText(2)} audioPlayDuration={getTiming(2).audioPlayDuration} />}
      {screen === 'q3-record' && <SpeakingQ3Record onNext={goNext} onHome={onHome} isReviewMode={isReviewMode} imageUrl={getImageUrl(2)} questionText={getQuestionText(2)} responseDelay={getTiming(2).responseDelay} stopDuration={getTiming(2).stopDuration} duration={getDuration(2)} />}
      {screen === 'q4-prep' && <SpeakingQ4Prep onNext={goNext} onHome={onHome} isReviewMode={isReviewMode} {...volumeProps} imageUrl={getImageUrl(3)} audioUrl={getAudioUrl(3)} questionText={getQuestionText(3)} audioPlayDuration={getTiming(3).audioPlayDuration} />}
      {screen === 'q4-record' && <SpeakingQ4Record onNext={goNext} onHome={onHome} isReviewMode={isReviewMode} imageUrl={getImageUrl(3)} questionText={getQuestionText(3)} responseDelay={getTiming(3).responseDelay} stopDuration={getTiming(3).stopDuration} duration={getDuration(3)} />}
      {screen === 'q5-prep' && <SpeakingQ5Prep onNext={goNext} onHome={onHome} isReviewMode={isReviewMode} {...volumeProps} imageUrl={getImageUrl(4)} audioUrl={getAudioUrl(4)} questionText={getQuestionText(4)} audioPlayDuration={getTiming(4).audioPlayDuration} />}
      {screen === 'q5-record' && <SpeakingQ5Record onNext={goNext} onHome={onHome} isReviewMode={isReviewMode} {...volumeProps} imageUrl={getImageUrl(4)} questionText={getQuestionText(4)} responseDelay={getTiming(4).responseDelay} stopDuration={getTiming(4).stopDuration} duration={getDuration(4)} />}
      {screen === 'q6-prep' && <SpeakingQ6Prep onNext={goNext} onHome={onHome} isReviewMode={isReviewMode} {...volumeProps} imageUrl={getImageUrl(5)} audioUrl={getAudioUrl(5)} questionText={getQuestionText(5)} audioPlayDuration={getTiming(5).audioPlayDuration} />}
      {screen === 'q6-record' && <SpeakingQ6Record onNext={goNext} onHome={onHome} isReviewMode={isReviewMode} {...volumeProps} imageUrl={getImageUrl(5)} questionText={getQuestionText(5)} responseDelay={getTiming(5).responseDelay} stopDuration={getTiming(5).stopDuration} duration={getDuration(5)} />}
      {screen === 'q7-prep' && <SpeakingQ7Prep onNext={goNext} onHome={onHome} isReviewMode={isReviewMode} {...volumeProps} imageUrl={getImageUrl(6)} audioUrl={getAudioUrl(6)} questionText={getQuestionText(6)} audioPlayDuration={getTiming(6).audioPlayDuration} />}
      {screen === 'q7-record' && <SpeakingQ7Record onNext={goNext} onHome={onHome} isReviewMode={isReviewMode} {...volumeProps} imageUrl={getImageUrl(6)} questionText={getQuestionText(6)} responseDelay={getTiming(6).responseDelay} stopDuration={getTiming(6).stopDuration} duration={getDuration(6)} />}
      {screen === 'take-interview-intro' && <SpeakingTakeInterviewIntro onNext={goNext} onHome={onHome} isReviewMode={isReviewMode} />}
      {screen === 'interview-intro' && <SpeakingInterviewIntro onNext={goNext} onHome={onHome} isReviewMode={isReviewMode} imageUrl={getIntroImageUrl(7)} introAudioUrl={getIntroAudioUrl(7)} questionText={getQuestionText(7)} />}
      {screen === 'q8-prep' && <SpeakingQ8Prep onNext={goNext} onHome={onHome} isReviewMode={isReviewMode} {...volumeProps} imageUrl={getImageUrl(7)} audioUrl={getAudioUrl(7)} videoUrl={getVideoUrl(7)} questionText={getQuestionText(7)} audioPlayDuration={getTiming(7).audioPlayDuration} />}
      {screen === 'q8-record' && <SpeakingQ8Record onNext={goNext} onHome={onHome} isReviewMode={isReviewMode} {...volumeProps} imageUrl={getImageUrl(7)} questionText={getQuestionText(7)} responseDelay={getTiming(7).responseDelay} stopDuration={getTiming(7).stopDuration} duration={getDuration(7)} />}
      {screen === 'q9-prep' && <SpeakingQ9Prep onNext={goNext} onHome={onHome} isReviewMode={isReviewMode} {...volumeProps} imageUrl={getImageUrl(8) || getImageUrl(7)} audioUrl={getAudioUrl(8)} videoUrl={getVideoUrl(8)} questionText={getQuestionText(8)} audioPlayDuration={getTiming(8).audioPlayDuration} />}
      {screen === 'q9-record' && <SpeakingQ9Record onNext={goNext} onHome={onHome} isReviewMode={isReviewMode} {...volumeProps} imageUrl={getImageUrl(8)} questionText={getQuestionText(8)} responseDelay={getTiming(8).responseDelay} stopDuration={getTiming(8).stopDuration} duration={getDuration(8)} />}
      {screen === 'q10-prep' && <SpeakingQ10Prep onNext={goNext} onHome={onHome} isReviewMode={isReviewMode} {...volumeProps} imageUrl={getImageUrl(9)} audioUrl={getAudioUrl(9)} videoUrl={getVideoUrl(9)} questionText={getQuestionText(9)} audioPlayDuration={getTiming(9).audioPlayDuration} />}
      {screen === 'q10-record' && <SpeakingQ10Record onNext={goNext} onHome={onHome} isReviewMode={isReviewMode} {...volumeProps} imageUrl={getImageUrl(9)} questionText={getQuestionText(9)} responseDelay={getTiming(9).responseDelay} stopDuration={getTiming(9).stopDuration} duration={getDuration(9)} />}
      {screen === 'q11-prep' && <SpeakingQ11Prep onNext={goNext} onHome={onHome} isReviewMode={isReviewMode} {...volumeProps} imageUrl={getImageUrl(10)} audioUrl={getAudioUrl(10)} videoUrl={getVideoUrl(10)} questionText={getQuestionText(10)} audioPlayDuration={getTiming(10).audioPlayDuration} />}
      {screen === 'q11-record' && <SpeakingQ11Record onNext={goNext} onHome={onHome} isReviewMode={isReviewMode} {...volumeProps} imageUrl={getImageUrl(10)} questionText={getQuestionText(10)} responseDelay={getTiming(10).responseDelay} stopDuration={getTiming(10).stopDuration} duration={getDuration(10)} />}
      {screen === 'end-session' && <SpeakingEndSession onHome={onHome} onFinish={onComplete} testData={testData} />}

      
      <VolumeControl isOpen={isVolumeOpen} onClose={closeVolume} buttonRef={volumeButtonRef} />
    </>
  );
}
