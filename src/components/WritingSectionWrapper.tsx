import React, { useState, useEffect } from 'react';
import { WritingIntro } from './WritingIntro';
import { WritingBuildSentenceIntro } from './WritingBuildSentenceIntro';
import { WritingBuildSentenceQ1 } from './WritingBuildSentenceQ1';
import { WritingBuildSentenceQ2 } from './WritingBuildSentenceQ2';
import { WritingBuildSentenceQ3 } from './WritingBuildSentenceQ3';
import { WritingBuildSentenceQ4 } from './WritingBuildSentenceQ4';
import { WritingBuildSentenceQ5 } from './WritingBuildSentenceQ5';
import { WritingBuildSentenceQ6 } from './WritingBuildSentenceQ6';
import { WritingBuildSentenceQ7 } from './WritingBuildSentenceQ7';
import { WritingBuildSentenceQ8 } from './WritingBuildSentenceQ8';
import { WritingBuildSentenceQ9 } from './WritingBuildSentenceQ9';
import { WritingBuildSentenceQ10 } from './WritingBuildSentenceQ10';
import { WritingEmailIntro } from './WritingEmailIntro';
import { WritingEmailQ1 } from './WritingEmailQ1';
import { WritingAcademicDiscussionIntro } from './WritingAcademicDiscussionIntro';
import { WritingAcademicDiscussionQ2 } from './WritingAcademicDiscussionQ2';
import { WritingEnd } from './WritingEnd';
import { useTestProgress } from '../hooks/useTestProgress';
import { TestProgressRestoreModal } from './TestProgressRestoreModal';

// ============================================================================
// Writing Section - All Screens Wrapper
// Manages internal navigation via a single screen state instead of 17 booleans.
// ============================================================================

export type WritingScreen =
  | 'intro'
  | 'build-sentence-intro'
  | 'bs-q1' | 'bs-q2' | 'bs-q3' | 'bs-q4' | 'bs-q5'
  | 'bs-q6' | 'bs-q7' | 'bs-q8' | 'bs-q9' | 'bs-q10'
  | 'email-intro' | 'email-q1'
  | 'academic-intro' | 'academic-q2'
  | 'end';

const WRITING_SCREEN_ORDER: WritingScreen[] = [
  'intro',
  'build-sentence-intro',
  'bs-q1', 'bs-q2', 'bs-q3', 'bs-q4', 'bs-q5',
  'bs-q6', 'bs-q7', 'bs-q8', 'bs-q9', 'bs-q10',
  'email-intro', 'email-q1',
  'academic-intro', 'academic-q2',
  'end',
];

interface WritingSectionWrapperProps {
  initialScreen: WritingScreen;
  onHome: () => void;
  onComplete: () => void;
  onScreenChange?: (screen: WritingScreen) => void;
  // CMS-driven writing questions (passed from TPO/Test/Training)
  writingQuestions?: any[];
}

export function WritingSectionWrapper({
  initialScreen,
  onHome,
  onComplete,
  onScreenChange,
  writingQuestions = [],
}: WritingSectionWrapperProps) {
  const [screen, setScreen] = useState<WritingScreen>(initialScreen);
  
  // Auto-save progress
  const {
    savedProgress,
    showRestoreModal,
    saveProgress,
    clearProgress,
    restoreProgress,
    startFresh
  } = useTestProgress({
    testType: 'writing',
    enabled: true
  });

  // Restore progress on mount
  useEffect(() => {
    if (savedProgress && savedProgress.currentScreen) {
      setScreen(savedProgress.currentScreen as WritingScreen);
    }
  }, []);

  // Auto-save when screen changes
  useEffect(() => {
    if (screen !== 'end') {
      const screenIndex = WRITING_SCREEN_ORDER.indexOf(screen);
      saveProgress({
        currentScreen: screen,
        currentQuestionIndex: screenIndex,
        totalQuestions: WRITING_SCREEN_ORDER.length
      });
    } else {
      clearProgress();
    }
  }, [screen]);

  useEffect(() => {
    onScreenChange?.(screen);
  }, [onScreenChange, screen]);

  const goNext = () => {
    const idx = WRITING_SCREEN_ORDER.indexOf(screen);
    if (idx < WRITING_SCREEN_ORDER.length - 1) {
      setScreen(WRITING_SCREEN_ORDER[idx + 1]);
    } else {
      onComplete();
    }
  };

  const goBack = () => {
    const idx = WRITING_SCREEN_ORDER.indexOf(screen);
    if (idx > 0) {
      setScreen(WRITING_SCREEN_ORDER[idx - 1]);
    }
  };

  const handleRestore = () => {
    restoreProgress();
    if (savedProgress && savedProgress.currentScreen) {
      setScreen(savedProgress.currentScreen as WritingScreen);
    }
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

      {screen === 'intro' && <WritingIntro onNext={goNext} onHome={onHome} />}
      {screen === 'build-sentence-intro' && <WritingBuildSentenceIntro onBack={goBack} onNext={goNext} onHome={onHome} />}
      {screen === 'bs-q1' && (() => {
        const cmsQ = writingQuestions[0];
        return (
          <WritingBuildSentenceQ1
            onBack={goBack}
            onNext={goNext}
            onHome={onHome}
            avatar1ImageUrl={cmsQ?.avatar1ImageUrl}
            avatar2ImageUrl={cmsQ?.avatar2ImageUrl}
            questionText={cmsQ?.questionText}
            words={cmsQ?.words}
          />
        );
      })()}
      {screen === 'bs-q2' && (() => {
        const cmsQ = writingQuestions[1];
        return (
          <WritingBuildSentenceQ2
            onBack={goBack}
            onNext={goNext}
            onHome={onHome}
            avatar1ImageUrl={cmsQ?.avatar1ImageUrl}
            avatar2ImageUrl={cmsQ?.avatar2ImageUrl}
            questionText={cmsQ?.questionText}
            words={cmsQ?.words}
          />
        );
      })()}
      {screen === 'bs-q3' && (() => {
        const cmsQ = writingQuestions[2];
        return (
          <WritingBuildSentenceQ3
            onBack={goBack}
            onNext={goNext}
            onHome={onHome}
            avatar1ImageUrl={cmsQ?.avatar1ImageUrl}
            avatar2ImageUrl={cmsQ?.avatar2ImageUrl}
            questionText={cmsQ?.questionText}
            words={cmsQ?.words}
          />
        );
      })()}
      {screen === 'bs-q4' && (() => {
        const cmsQ = writingQuestions[3];
        return (
          <WritingBuildSentenceQ4
            onBack={goBack}
            onNext={goNext}
            onHome={onHome}
            avatar1ImageUrl={cmsQ?.avatar1ImageUrl}
            avatar2ImageUrl={cmsQ?.avatar2ImageUrl}
            questionText={cmsQ?.questionText}
            words={cmsQ?.words}
          />
        );
      })()}
      {screen === 'bs-q5' && (() => {
        const cmsQ = writingQuestions[4];
        return (
          <WritingBuildSentenceQ5
            onBack={goBack}
            onNext={goNext}
            onHome={onHome}
            avatar1ImageUrl={cmsQ?.avatar1ImageUrl}
            avatar2ImageUrl={cmsQ?.avatar2ImageUrl}
            questionText={cmsQ?.questionText}
            words={cmsQ?.words}
          />
        );
      })()}
      {screen === 'bs-q6' && (() => {
        const cmsQ = writingQuestions[5];
        return (
          <WritingBuildSentenceQ6
            onBack={goBack}
            onNext={goNext}
            onHome={onHome}
            avatar1ImageUrl={cmsQ?.avatar1ImageUrl}
            avatar2ImageUrl={cmsQ?.avatar2ImageUrl}
            questionText={cmsQ?.questionText}
            words={cmsQ?.words}
          />
        );
      })()}
      {screen === 'bs-q7' && (() => {
        const cmsQ = writingQuestions[6];
        return (
          <WritingBuildSentenceQ7
            onBack={goBack}
            onNext={goNext}
            onHome={onHome}
            avatar1ImageUrl={cmsQ?.avatar1ImageUrl}
            avatar2ImageUrl={cmsQ?.avatar2ImageUrl}
            questionText={cmsQ?.questionText}
            words={cmsQ?.words}
          />
        );
      })()}
      {screen === 'bs-q8' && (() => {
        const cmsQ = writingQuestions[7];
        return (
          <WritingBuildSentenceQ8
            onBack={goBack}
            onNext={goNext}
            onHome={onHome}
            avatar1ImageUrl={cmsQ?.avatar1ImageUrl}
            avatar2ImageUrl={cmsQ?.avatar2ImageUrl}
            questionText={cmsQ?.questionText}
            words={cmsQ?.words}
          />
        );
      })()}
      {screen === 'bs-q9' && (() => {
        const cmsQ = writingQuestions[8];
        return (
          <WritingBuildSentenceQ9
            onBack={goBack}
            onNext={goNext}
            onHome={onHome}
            avatar1ImageUrl={cmsQ?.avatar1ImageUrl}
            avatar2ImageUrl={cmsQ?.avatar2ImageUrl}
            questionText={cmsQ?.questionText}
            words={cmsQ?.words}
          />
        );
      })()}
      {screen === 'bs-q10' && (() => {
        const cmsQ = writingQuestions[9];
        return (
          <WritingBuildSentenceQ10
            onBack={goBack}
            onNext={goNext}
            onHome={onHome}
            avatar1ImageUrl={cmsQ?.avatar1ImageUrl}
            avatar2ImageUrl={cmsQ?.avatar2ImageUrl}
            questionText={cmsQ?.questionText}
            words={cmsQ?.words}
          />
        );
      })()}
      {screen === 'email-intro' && <WritingEmailIntro onNext={goNext} onHome={onHome} />}
      {screen === 'email-q1' && <WritingEmailQ1 onBack={goBack} onNext={goNext} onHome={onHome} />}
      {screen === 'academic-intro' && <WritingAcademicDiscussionIntro onBegin={goNext} onHome={onHome} />}
      {screen === 'academic-q2' && (() => {
        // Find the Academic Discussion question from CMS (by type or by position — typically Q12, after 10 Build Sentence + 1 Email)
        const adQ = writingQuestions.find((q: any) =>
          (q.questionType || '').toLowerCase().includes('academic discussion') ||
          (q.questionType || '').toLowerCase().includes('discussion')
        ) || writingQuestions[11] || writingQuestions[writingQuestions.length - 1];
        return (
          <WritingAcademicDiscussionQ2
            onBack={goBack}
            onNext={goNext}
            onHome={onHome}
            professorImageUrl={adQ?.professorImageUrl}
            professorName={adQ?.professorName}
            professorMessage={adQ?.professorMessage}
            student1ImageUrl={adQ?.student1ImageUrl}
            student1Message={adQ?.student1Message}
            student2ImageUrl={adQ?.student2ImageUrl}
            student2Message={adQ?.student2Message}
          />
        );
      })()}
      {screen === 'end' && <WritingEnd onNext={onComplete} onHome={onHome} />}
    </>
  );
}