import React, { useState, useEffect } from 'react';
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
}

export function SpeakingSectionWrapper({
  initialScreen,
  onHome,
  onComplete,
  questions = [],
  testData = null,
}: SpeakingSectionWrapperProps) {
  const [screen, setScreen] = useState<SpeakingScreen>(initialScreen);
  const { isOpen: isVolumeOpen, buttonRef: volumeButtonRef, toggleVolume, closeVolume } = useVolumeControl();
  
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

  // Map questions to image URLs (Q1=0, Q2=1, Q3=2, etc.)
  const getImageUrl = (questionIndex: number) => {
    return questions[questionIndex]?.imageUrl;
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
        <SpeakingListenRepeatIntro onNext={goNext} onLogoClick={onHome} {...volumeProps} />
      )}
      {screen === 'q1' && <SpeakingQ1 onNext={goNext} onHome={onHome} imageUrl={getImageUrl(0)} />}
      {screen === 'q1-record' && <SpeakingQ1Record onNext={goNext} onHome={onHome} imageUrl={getImageUrl(0)} />}
      {screen === 'q2-prep' && <SpeakingQ2Prep onNext={goNext} onHome={onHome} {...volumeProps} imageUrl={getImageUrl(1)} />}
      {screen === 'q2-record' && <SpeakingQ2Record onNext={goNext} onHome={onHome} imageUrl={getImageUrl(1)} />}
      {screen === 'q3-prep' && <SpeakingQ3Prep onNext={goNext} onHome={onHome} {...volumeProps} imageUrl={getImageUrl(2)} />}
      {screen === 'q3-record' && <SpeakingQ3Record onNext={goNext} onHome={onHome} imageUrl={getImageUrl(2)} />}
      {screen === 'q4-prep' && <SpeakingQ4Prep onNext={goNext} onHome={onHome} {...volumeProps} imageUrl={getImageUrl(3)} />}
      {screen === 'q4-record' && <SpeakingQ4Record onNext={goNext} onHome={onHome} imageUrl={getImageUrl(3)} />}
      {screen === 'q5-prep' && <SpeakingQ5Prep onNext={goNext} onHome={onHome} {...volumeProps} imageUrl={getImageUrl(4)} />}
      {screen === 'q5-record' && <SpeakingQ5Record onNext={goNext} onHome={onHome} {...volumeProps} imageUrl={getImageUrl(4)} />}
      {screen === 'q6-prep' && <SpeakingQ6Prep onNext={goNext} onHome={onHome} {...volumeProps} imageUrl={getImageUrl(5)} />}
      {screen === 'q6-record' && <SpeakingQ6Record onNext={goNext} onHome={onHome} {...volumeProps} imageUrl={getImageUrl(5)} />}
      {screen === 'q7-prep' && <SpeakingQ7Prep onNext={goNext} onHome={onHome} {...volumeProps} imageUrl={getImageUrl(6)} />}
      {screen === 'q7-record' && <SpeakingQ7Record onNext={goNext} onHome={onHome} {...volumeProps} imageUrl={getImageUrl(6)} />}
      {screen === 'take-interview-intro' && <SpeakingTakeInterviewIntro onNext={goNext} onHome={onHome} />}
      {screen === 'interview-intro' && <SpeakingInterviewIntro onNext={goNext} onHome={onHome} imageUrl={getImageUrl(7)} />}
      {screen === 'q8-prep' && <SpeakingQ8Prep onNext={goNext} onHome={onHome} {...volumeProps} imageUrl={getImageUrl(7)} />}
      {screen === 'q8-record' && <SpeakingQ8Record onNext={goNext} onHome={onHome} {...volumeProps} imageUrl={getImageUrl(7)} />}
      {screen === 'q9-prep' && <SpeakingQ9Prep onNext={goNext} onHome={onHome} {...volumeProps} imageUrl={getImageUrl(8)} />}
      {screen === 'q9-record' && <SpeakingQ9Record onNext={goNext} onHome={onHome} {...volumeProps} imageUrl={getImageUrl(8)} />}
      {screen === 'q10-prep' && <SpeakingQ10Prep onNext={goNext} onHome={onHome} {...volumeProps} imageUrl={getImageUrl(9)} />}
      {screen === 'q10-record' && <SpeakingQ10Record onNext={goNext} onHome={onHome} {...volumeProps} imageUrl={getImageUrl(9)} />}
      {screen === 'q11-prep' && <SpeakingQ11Prep onNext={goNext} onHome={onHome} {...volumeProps} imageUrl={getImageUrl(10)} />}
      {screen === 'q11-record' && <SpeakingQ11Record onNext={goNext} onHome={onHome} {...volumeProps} imageUrl={getImageUrl(10)} />}
      {screen === 'end-session' && <SpeakingEndSession onHome={onHome} onFinish={onComplete} testData={testData} />}
      
      <VolumeControl isOpen={isVolumeOpen} onClose={closeVolume} buttonRef={volumeButtonRef} />
    </>
  );
}