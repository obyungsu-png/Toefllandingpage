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
}

export function ListeningM2Wrapper({
  initialScreen,
  onHome,
  onComplete,
  onVolumeClick,
  onBackToM1,
}: ListeningM2WrapperProps) {
  const [screen, setScreen] = useState<M2Screen>(initialScreen);
  
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
    enabled: true
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

  const commonProps = { onBack: goBack, onNext: goNext, onHome, onVolumeClick };

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

      {screen === 'q1' && <ListeningM2Q1 {...commonProps} />}
      {screen === 'q2' && <ListeningM2Q2 {...commonProps} />}
      {screen === 'q3' && <ListeningM2Q3 {...commonProps} />}
      {screen === 'q4' && <ListeningM2Q4 {...commonProps} />}
      {screen === 'q5' && <ListeningM2Q5 {...commonProps} />}
      {screen === 'q6' && <ListeningM2Q6 {...commonProps} />}
      {screen === 'q7' && <ListeningM2Q7 {...commonProps} />}
      {screen === 'q8' && <ListeningM2Q8 {...commonProps} />}
      {screen === 'conversation' && <ListeningM2Conversation {...commonProps} />}
      {screen === 'q9' && <ListeningM2Q9 {...commonProps} />}
      {screen === 'q10' && <ListeningM2Q10 {...commonProps} />}
      {screen === 'announcement' && <ListeningM2Announcement {...commonProps} />}
      {screen === 'q11' && <ListeningM2Q11 {...commonProps} />}
      {screen === 'q12' && <ListeningM2Q12 {...commonProps} />}
      {screen === 'lecture' && <ListeningM2Lecture {...commonProps} />}
      {screen === 'q13' && <ListeningM2Q13 {...commonProps} />}
      {screen === 'q14' && <ListeningM2Q14 {...commonProps} />}
      {screen === 'q15' && <ListeningM2Q15 {...commonProps} />}
      {screen === 'q16' && <ListeningM2Q16 {...commonProps} />}
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