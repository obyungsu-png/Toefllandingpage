import React, { useState, useEffect } from 'react';
import { ListeningM2Q1 } from './ListeningM2Q1';
import { ListeningM2Q2 } from './ListeningM2Q2';
import { ListeningM2Q3 } from './ListeningM2Q3';
import { ListeningM2Q4 } from './ListeningM2Q4';
import { ListeningM2Q5 } from './ListeningM2Q5';
import { ListeningM2Q6 } from './ListeningM2Q6';
import { ListeningM2Q7 } from './ListeningM2Q7';
import { ListeningM2Q8 } from './ListeningM2Q8';
import { ListeningM2Q9 } from './ListeningM2Q9';
import { ListeningM2Q10 } from './ListeningM2Q10';
import { ListeningM2Q11 } from './ListeningM2Q11';
import { ListeningM2Q12 } from './ListeningM2Q12';
import { ListeningM2Q13 } from './ListeningM2Q13';
import { ListeningM2Q14 } from './ListeningM2Q14';
import { ListeningM2Q15 } from './ListeningM2Q15';
import { ListeningM2Q16 } from './ListeningM2Q16';
import { ListeningM2Announcement } from './ListeningM2Announcement';
import { ListeningM2Lecture } from './ListeningM2Lecture';
import { ListeningM2End } from './ListeningM2End';
import { ListeningM2Conversation } from './ListeningM2Conversation';
import { useTestProgress } from '../hooks/useTestProgress';
import { TestProgressRestoreModal } from './TestProgressRestoreModal';

// ============================================================================
// Listening Module 2 - All Screens Wrapper
// Manages internal navigation via a single screen state instead of 20 booleans.
// Pattern identical to ListeningM1Wrapper.
// ============================================================================

export type M2Screen =
  | 'q1' | 'q2' | 'q3' | 'q4' | 'q5' | 'q6' | 'q7' | 'q8'
  | 'conversation'
  | 'q9' | 'q10'
  | 'announcement'
  | 'q11' | 'q12'
  | 'lecture'
  | 'q13' | 'q14' | 'q15' | 'q16'
  | 'end';

const M2_SCREEN_ORDER: M2Screen[] = [
  'q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8',
  'conversation',
  'q9', 'q10',
  'announcement',
  'q11', 'q12',
  'lecture',
  'q13', 'q14', 'q15', 'q16',
  'end',
];

interface ListeningM2WrapperProps {
  initialScreen: M2Screen;
  onHome: () => void;
  onComplete: () => void;
  onVolumeClick: () => void;
  /** Called when user clicks Back on Q1 (go back to M1) */
  onBackToM1?: () => void;
  onScreenChange?: (screen: M2Screen) => void;
  getCmsListeningQuestion?: (qNumber: number) => { imageUrl?: string; questionText?: string; options?: string[]; correctAnswer?: string; audioUrl?: string } | null;
}

export function ListeningM2Wrapper({
  initialScreen,
  onHome,
  onComplete,
  onVolumeClick,
  onBackToM1,
  onScreenChange,
  getCmsListeningQuestion,
}: ListeningM2WrapperProps) {
  const [screen, setScreen] = useState<M2Screen>(initialScreen);
  
  // Review mode = started from a mid-flow screen (not 'q1')
  const isReviewMode = initialScreen !== 'q1';

  // Auto-save progress
  const {
    savedProgress,
    showRestoreModal,
    saveProgress,
    clearProgress,
    restoreProgress,
    startFresh
  } = useTestProgress({
    testType: 'listening_m2',
    enabled: !isReviewMode
  });

  // Restore progress on mount
  useEffect(() => {
    if (savedProgress && savedProgress.currentScreen) {
      setScreen(savedProgress.currentScreen as M2Screen);
    }
  }, []);

  // Auto-save when screen changes
  useEffect(() => {
    if (screen !== 'end') {
      const screenIndex = M2_SCREEN_ORDER.indexOf(screen);
      saveProgress({
        currentScreen: screen,
        currentQuestionIndex: screenIndex,
        totalQuestions: M2_SCREEN_ORDER.length
      });
    } else {
      // Clear progress when test is complete
      clearProgress();
    }
  }, [screen]);

  useEffect(() => {
    onScreenChange?.(screen);
  }, [onScreenChange, screen]);

  const goNext = () => {
    const idx = M2_SCREEN_ORDER.indexOf(screen);
    if (idx < M2_SCREEN_ORDER.length - 1) {
      setScreen(M2_SCREEN_ORDER[idx + 1]);
    } else {
      onComplete();
    }
  };

  const goBack = () => {
    const idx = M2_SCREEN_ORDER.indexOf(screen);
    if (idx > 0) {
      setScreen(M2_SCREEN_ORDER[idx - 1]);
    } else if (onBackToM1) {
      onBackToM1();
    }
  };

  const handleRestore = () => {
    restoreProgress();
    if (savedProgress && savedProgress.currentScreen) {
      setScreen(savedProgress.currentScreen as M2Screen);
    }
  };

  const getQImageUrl = (qNumber: number) => getCmsListeningQuestion?.(qNumber)?.imageUrl || undefined;
  const getQAudioUrl = (qNumber: number) => getCmsListeningQuestion?.(qNumber)?.audioUrl || undefined;
  const commonProps = { onBack: goBack, onNext: goNext, onHome, onVolumeClick };
  // Per-question props with CMS imageUrl and audioUrl
  const qProps = (n: number) => ({ ...commonProps, imageUrl: getQImageUrl(n), audioUrl: getQAudioUrl(n) });

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

      {screen === 'q1' && <ListeningM2Q1 {...qProps(1)} />}
      {screen === 'q2' && <ListeningM2Q2 {...qProps(2)} />}
      {screen === 'q3' && <ListeningM2Q3 {...qProps(3)} />}
      {screen === 'q4' && <ListeningM2Q4 {...qProps(4)} />}
      {screen === 'q5' && <ListeningM2Q5 {...qProps(5)} />}
      {screen === 'q6' && <ListeningM2Q6 {...qProps(6)} />}
      {screen === 'q7' && <ListeningM2Q7 {...qProps(7)} />}
      {screen === 'q8' && <ListeningM2Q8 {...qProps(8)} />}
      {screen === 'conversation' && <ListeningM2Conversation {...commonProps} />}
      {screen === 'q9' && <ListeningM2Q9 {...qProps(9)} />}
      {screen === 'q10' && <ListeningM2Q10 {...qProps(10)} />}
      {screen === 'announcement' && <ListeningM2Announcement {...commonProps} />}
      {screen === 'q11' && <ListeningM2Q11 {...qProps(11)} />}
      {screen === 'q12' && <ListeningM2Q12 {...qProps(12)} />}
      {screen === 'lecture' && <ListeningM2Lecture {...commonProps} />}
      {screen === 'q13' && <ListeningM2Q13 {...qProps(13)} />}
      {screen === 'q14' && <ListeningM2Q14 {...qProps(14)} />}
      {screen === 'q15' && <ListeningM2Q15 {...qProps(15)} />}
      {screen === 'q16' && <ListeningM2Q16 {...qProps(16)} />}
      {screen === 'end' && (
        <ListeningM2End
          onBack={goBack}
          onNext={onComplete}
          onHome={onHome}
          onVolumeClick={onVolumeClick}
        />
      )}
    </>
  );
}