import React, { useState, useEffect, useMemo } from 'react';
import { SpeakingIntro } from './SpeakingIntro';
import { SpeakingListenRepeatIntro } from './SpeakingListenRepeatIntro';
import { SpeakingQ1 } from './SpeakingQ1';
import { SpeakingQ1Record } from './SpeakingQ1Record';
import { SpeakingTakeInterviewIntro } from './SpeakingTakeInterviewIntro';
import { SpeakingQ8Prep } from './SpeakingQ8Prep';
import { SpeakingQ8Record } from './SpeakingQ8Record';
import { SpeakingEndSession } from './SpeakingEndSession';
import { VolumeControl, useVolumeControl } from './VolumeControl';
import { useTestProgress } from '../hooks/useTestProgress';
import { TestProgressRestoreModal } from './TestProgressRestoreModal';
import { TPOQuestion, TPOTest } from './ContentManagement';

// ============================================================================
// Speaking Section - All Screens Wrapper (dynamic question counts)
//
// Screen keys (dynamic, keyed by ACTUAL questionNumber):
//   intro
//   repeat-intro
//   repeat-q<num>            — Listen and Repeat: listen phase (plays sentence audio)
//   repeat-q<num>-record     — Listen and Repeat: record phase
//   interview-intro
//   interview-q<num>-prep    — Take an Interview: question audio/prep
//   interview-q<num>-record  — Take an Interview: record phase
//   end-session
//
// The number of "Listen and Repeat" and "Take an Interview" questions is no
// longer hard-coded (was 7 + 4). It is derived from the questions actually
// present, in the canonical type order (Repeat first, then Interview), so any
// question count renders correctly.
// ============================================================================

export type SpeakingScreen = string;

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

  const numOf = (q: any): number => {
    const n = typeof q?.questionNumber === 'number'
      ? q.questionNumber
      : Number(String(q?.questionNumber ?? '').replace(/\D/g, ''));
    return Number.isNaN(n) ? Number.MAX_SAFE_INTEGER : n;
  };
  const byNum = (a: any, b: any) => numOf(a) - numOf(b);

  // Group questions by type (canonical order: Repeat → Interview).
  const repeatQuestions = useMemo(() => {
    return questions
      .filter((q) => {
        const t = (q.questionType || '').toLowerCase();
        return (
          t.includes('listen and repeat') ||
          t.includes('listen and speak') ||
          t.includes('repeat') ||
          t.includes('read aloud') ||
          t.includes('shadowing')
        );
      })
      .sort(byNum);
  }, [questions]);

  const interviewQuestions = useMemo(() => {
    return questions
      .filter((q) => {
        const t = (q.questionType || '').toLowerCase();
        return t.includes('take an interview') || t.includes('interview') || t.includes('integrated');
      })
      .sort(byNum);
  }, [questions]);

  // Dynamic screen list — each question gets its own key (actual questionNumber).
  // 리슨 전용 화면(repeat-qN)은 사용하지 않음 — 녹음 화면에서 오디오를 재생하고
  // 삐 소리 후 녹음 시작 (Start/Review 공통). RESPONSE TIME 카드는 처음부터 표시됨.
  const screens = useMemo(() => {
    const s: SpeakingScreen[] = ['intro'];
    if (repeatQuestions.length > 0) {
      s.push('repeat-intro');
      repeatQuestions.forEach((q) => {
        const n = numOf(q);
        s.push(`repeat-q${n}-record`);
      });
    }
    if (interviewQuestions.length > 0) {
      s.push('interview-intro');
      interviewQuestions.forEach((q) => {
        const n = numOf(q);
        s.push(`interview-q${n}-prep`);
        s.push(`interview-q${n}-record`);
      });
    }
    s.push('end-session');
    return s;
  }, [repeatQuestions, interviewQuestions]);

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

  // Restore progress on mount (only if the saved screen still exists)
  useEffect(() => {
    if (savedProgress && savedProgress.currentScreen && screens.includes(savedProgress.currentScreen)) {
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
    const screenIndex = screens.indexOf(screen);
    if (screenIndex >= 0 && screenIndex < screens.length - 1) {
      saveProgress({
        currentScreen: screen,
        currentQuestionIndex: screenIndex,
        totalQuestions: screens.length
      });
    } else {
      clearProgress();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen]);

  useEffect(() => {
    onScreenChange?.(screen);
  }, [onScreenChange, screen]);

  const goNext = () => {
    const idx = screens.indexOf(screen);
    if (idx >= 0 && idx < screens.length - 1) {
      setScreen(screens[idx + 1]);
    } else {
      onComplete();
    }
  };

  const goBack = () => {
    const idx = screens.indexOf(screen);
    if (idx > 0) {
      setScreen(screens[idx - 1]);
    }
  };

  // Hardware/browser Back button (dispatched from App.tsx) reuses this same goBack
  useEffect(() => {
    const handler = () => goBack();
    window.addEventListener('toefl:hardware-back', handler);
    return () => window.removeEventListener('toefl:hardware-back', handler);
  }, [screen]);

  // Hardware/browser Forward button (dispatched from App.tsx) reuses this same goNext
  useEffect(() => {
    const handler = () => goNext();
    window.addEventListener('toefl:hardware-forward', handler);
    return () => window.removeEventListener('toefl:hardware-forward', handler);
  }, [screen]);

  const handleRestore = () => {
    restoreProgress();
    if (savedProgress && savedProgress.currentScreen && screens.includes(savedProgress.currentScreen)) {
      setScreen(savedProgress.currentScreen as SpeakingScreen);
    }
  };

  const volumeProps = {
    onVolumeClick: toggleVolume,
    isVolumeOpen,
    volumeButtonRef,
  };

  // Resolve a screen key to its question object.
  const repeatQByKey = (key: string) => repeatQuestions.find((q) => numOf(q) === Number(key.replace(/\D/g, '')));
  const interviewQByKey = (key: string) => interviewQuestions.find((q) => numOf(q) === Number(key.replace(/\D/g, '')));

  const renderScreen = (): React.ReactNode => {
    if (screen === 'intro') {
      return <SpeakingIntro onNext={goNext} onLogoClick={onHome} />;
    }
    if (screen === 'repeat-intro') {
      // 첫 Listen and Repeat 문항의 introText/introImageUrl 을 인트로 화면에 전달 —
      // CMS(질문 편집 → 그룹 인트로 텍스트)에서 수정 가능.
      // 인트로 이미지 미등록 시 Q1 이미지로 fallback 표시.
      const firstRepeat = repeatQuestions[0];
      return (
        <SpeakingListenRepeatIntro
          onNext={goNext}
          onLogoClick={onHome}
          isReviewMode={isReviewMode}
          introText={(firstRepeat as any)?.introText || undefined}
          introImageUrl={(firstRepeat as any)?.introImageUrl || firstRepeat?.imageUrl || undefined}
          introVideoUrl={(firstRepeat as any)?.introVideoUrl || undefined}
          {...volumeProps}
        />
      );
    }
    if (screen === 'interview-intro') {
      // 첫 Take an Interview 문항의 introText/introImageUrl/introVideoUrl 을 인트로 화면에 전달 —
      // CMS(질문 편집 → 그룹 인트로)에서 수정 가능.
      const firstInterview = interviewQuestions[0];
      return (
        <SpeakingTakeInterviewIntro
          onNext={goNext}
          onHome={onHome}
          isReviewMode={isReviewMode}
          introText={(firstInterview as any)?.introText || undefined}
          introImageUrl={(firstInterview as any)?.introImageUrl || firstInterview?.imageUrl || undefined}
          introVideoUrl={(firstInterview as any)?.introVideoUrl || undefined}
        />
      );
    }
    if (screen === 'end-session') {
      return <SpeakingEndSession onHome={onHome} onFinish={onComplete} testData={testData} />;
    }

    // Listen and Repeat: listen + record phases
    const repMatch = screen.match(/^repeat-q(\d+)(-record)?$/);
    if (repMatch) {
      const q = repeatQByKey(screen);
      const isRecord = !!repMatch[2];
      const sentence = (q as any)?.scriptText || q?.questionText || '';
      if (isRecord) {
        return (
          <SpeakingQ1Record
            key={screen}
            onNext={goNext}
            onHome={onHome}
            isReviewMode={isReviewMode}
            imageUrl={q?.imageUrl || (q as any)?.introImageUrl}
            audioUrl={(q as any)?.audioUrl}
            questionText={sentence}
            responseDelay={(q as any)?.responseDelay}
            stopDuration={(q as any)?.stopDuration}
            duration={(q as any)?.duration}
            questionNumber={q ? numOf(q) : undefined}
            totalQuestions={questions.length || undefined}
          />
        );
      }
      return (
        <SpeakingQ1
          onNext={goNext}
          onHome={onHome}
          isReviewMode={isReviewMode}
          imageUrl={q?.imageUrl || (q as any)?.introImageUrl}
          introAudioUrl={(q as any)?.audioUrl || (q as any)?.introAudioUrl}
          introText={(q as any)?.introText || sentence}
          questionText={sentence}
          questionNumber={q ? numOf(q) : undefined}
          totalQuestions={questions.length || undefined}
        />
      );
    }

    // Take an Interview: prep + record phases
    const intMatch = screen.match(/^interview-q(\d+)-(prep|record)$/);
    if (intMatch) {
      const q = interviewQByKey(screen);
      const isRecord = intMatch[2] === 'record';
      if (isRecord) {
        return (
          <SpeakingQ8Record
            onNext={goNext}
            onHome={onHome}
            isReviewMode={isReviewMode}
            {...volumeProps}
            imageUrl={q?.imageUrl}
            videoUrl={(q as any)?.videoUrl}
            questionText={q?.questionText}
            responseDelay={(q as any)?.responseDelay}
            stopDuration={(q as any)?.stopDuration}
            duration={(q as any)?.duration}
            questionNumber={q ? numOf(q) : undefined}
            totalQuestions={questions.length || undefined}
          />
        );
      }
      return (
        <SpeakingQ8Prep
          onNext={goNext}
          onHome={onHome}
          isReviewMode={isReviewMode}
          {...volumeProps}
          imageUrl={q?.imageUrl}
          audioUrl={(q as any)?.audioUrl}
          videoUrl={(q as any)?.videoUrl}
          questionText={q?.questionText}
          audioPlayDuration={(q as any)?.audioPlayDuration}
          questionNumber={q ? numOf(q) : undefined}
          totalQuestions={questions.length || undefined}
        />
      );
    }

    return null;
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

      {renderScreen()}

      <VolumeControl isOpen={isVolumeOpen} onClose={closeVolume} buttonRef={volumeButtonRef} />
    </>
  );
}
