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

// ─── Writing passageText JSON template parsing ───
// CSV import converts "유형: email\n필드:\nto: ...\nsubject: ...\nbody: ..."
// into a JSON template string stored in passageText. These helpers parse
// that JSON back into the structured fields the email/academic discussion
// screens need to render the scenario, professor/student messages, etc.
// (Module-level exports — TrainingInterface의 훈련 플로우에서도 재사용)

export const parseWritingPassageFields = (passageText?: string): Record<string, string> => {
  if (!passageText) return {};
  try {
    const parsed = JSON.parse(passageText);
    if (parsed && typeof parsed === 'object' && parsed.fields) {
      return parsed.fields as Record<string, string>;
    }
  } catch {
    // not a JSON template — fall through
  }
  return {};
};

// Extract professor name from body text like "교수(Dr. Gupta): message"
const extractProfessorNameFromBody = (body: string): string => {
  if (!body) return '';
  const m = body.match(/^교수\(([^)]+)\)\s*[:：]/);
  if (m) return m[1].trim();
  const m2 = body.match(/^professor\s+([^:：()]+?)\s*[:：]/i);
  if (m2) return m2[1].trim();
  return '';
};

// Strip the "교수(Name):" / "professor Name:" prefix from body to get message
const stripProfessorPrefixFromBody = (body: string): string => {
  if (!body) return '';
  return body
    .replace(/^교수\([^)]+\)\s*[:：]\s*/, '')
    .replace(/^professor\s+[^:：()]+?\s*[:：]\s*/i, '')
    .trim();
};

// Build the email writingQuestion object expected by WritingEmailQ1 from the
// raw CMS question (passageText JSON + questionText).
//
// CSV body 형식:
//   "시나리오... Write an email... In your email, do the following: 요구사항1 | 요구사항2 | 요구사항3"
// - `|` 로 구분된 요구사항들을 bullets 로 분리
// - "do the following:" 이전 텍스트는 시나리오, 이후 첫 번째 요구사항은 bullets[0]
export const buildEmailWritingQuestion = (emailQ: any) => {
  if (!emailQ) return null;
  const fields = parseWritingPassageFields(emailQ.passageText);
  const hasJson = Object.keys(fields).length > 0;

  // 직접 CMS 필드 우선 (Add Question 폼에서 저장된 emailScenario 등), 없으면 passageText JSON fallback
  const questionText = emailQ.questionText || '';
  const rawBody = hasJson
    ? (fields.body || fields.본문 || fields.내용 || fields.emailbody || '')
    : (emailQ.passageText || '');

  // body 에서 `|` 로 구분된 요구사항(bullets) 분리
  let emailScenario = rawBody;
  let bullets: string[] = [];

  if (rawBody.includes('|')) {
    const parts = rawBody.split('|').map(p => p.trim()).filter(Boolean);
    if (parts.length > 1) {
      const firstPart = parts[0]; // 시나리오 + 지시문 + 첫 번째 요구사항
      bullets = parts.slice(1);   // 나머지 요구사항들

      // "do the following:" 마커로 시나리오와 첫 번째 요구사항 분리
      const markerMatch = firstPart.match(/do the following\s*[:：]\s*/i);
      if (markerMatch && markerMatch.index !== undefined) {
        const before = firstPart.slice(0, markerMatch.index + markerMatch[0].length).trim();
        const after = firstPart.slice(markerMatch.index + markerMatch[0].length).trim();
        if (after) bullets = [after, ...bullets];

        // 시나리오와 지시문 분리 ("Write an email" 시작점 기준)
        const instrStart = before.search(/write an email/i);
        emailScenario = instrStart > 0
          ? before.slice(0, instrStart).trim()
          : before;
      } else {
        emailScenario = firstPart;
      }
    }
  }

  // questionText 에서도 bullets 시도 (레거시: - / • / * / 1. 형식)
  if (bullets.length === 0) {
    for (const rawLine of questionText.split('\n')) {
      const line = rawLine.trim();
      if (!line) continue;
      const bulletMatch = line.match(/^(?:[-•*]|\d+[.)])\s+(.+)$/);
      if (bulletMatch) bullets.push(bulletMatch[1].trim());
    }
  }

  // 직접 CMS 필드가 있으면 우선 사용 (Add Question 폼에서 저장된 값)
  if (emailQ.emailScenario) emailScenario = emailQ.emailScenario;
  if (emailQ.emailBullets && emailQ.emailBullets.length > 0) bullets = emailQ.emailBullets;

  return {
    emailTo: emailQ.emailTo || fields.to || fields.받는사람 || fields.recipient || fields.받는이 || '',
    emailSubject: emailQ.emailSubject || fields.subject || fields.제목 || fields.주제 || fields.메일제목 || '',
    emailScenario,
    emailInstruction: emailQ.emailInstruction || questionText,
    emailBullets: bullets,
  };
};

// Extract academic discussion props (professor/student info) from the raw
// CMS question's passageText JSON fields.
//
// CSV body 형식:
//   "교수(Dr. Gupta): 교수 메시지  Claire: 학생1 메시지  Paul: 학생2 메시지"
// - 화자 마커("이름:" 또는 "교수(이름):")로 메시지를 분리
// - 첫 번째 화자 = 교수, 두 번째 = 학생1, 세 번째 = 학생2
export const buildAcademicDiscussionProps = (adQ: any) => {
  const empty = {
    professorName: '', professorMessage: '',
    student1Name: '', student1Message: '',
    student2Name: '', student2Message: '',
    promptTitle: '', promptInstructions: '',
  };
  if (!adQ) return empty;

  const fields = parseWritingPassageFields(adQ.passageText);
  const hasJson = Object.keys(fields).length > 0;
  const body = hasJson
    ? (fields.body || fields.본문 || fields.내용 || '')
    : (adQ.passageText || '');

  // 화자 분리: "교수(Name):", "Professor Name:", "Claire:", "Paul:" 등
  // 정규식으로 모든 화자 마커의 위치를 찾고, 각 구간을 메시지로 추출
  const speakers: Array<{ name: string; message: string }> = [];
  const speakerRegex =
    /(?:^|\s+)(교수\([^)]+\)|Professor\s+[A-Z][a-zA-Z]+|[A-Z][a-zA-Z]+)\s*[:：]\s*/g;
  const matches: Array<{ name: string; start: number; markerEnd: number }> = [];
  let m;
  while ((m = speakerRegex.exec(body)) !== null) {
    // 마커 시작 위치 (앞쪽 공백 제외)
    const leadingWs = m[0].length - m[0].replace(/^\s+/, '').length;
    matches.push({
      name: m[1],
      start: m.index + leadingWs,
      markerEnd: m.index + m[0].length,
    });
  }

  if (matches.length > 0) {
    for (let i = 0; i < matches.length; i++) {
      const msgStart = matches[i].markerEnd;
      const msgEnd = i + 1 < matches.length ? matches[i + 1].start : body.length;
      const message = body.slice(msgStart, msgEnd).trim();
      const rawName = matches[i].name;
      // "교수(Name)" → "Name" 추출
      const profMatch = rawName.match(/^교수\(([^)]+)\)$/);
      const name = profMatch ? profMatch[1] : rawName;
      if (message) speakers.push({ name, message });
    }
  }

  // 명시적 필드 우선, 없으면 body 파싱 결과 사용
  let professorName =
    fields.professorName || fields.교수이름 || fields.professor ||
    fields.교수 || adQ.professorName || '';
  let professorMessage =
    fields.professorMessage || fields.교수메시지 || fields.교수메세지 ||
    adQ.professorMessage || '';

  let student1Name =
    fields.student1Name || fields.학생1이름 || fields.student1 ||
    adQ.student1Name || '';
  let student1Message =
    fields.student1Message || fields.학생1메시지 || fields.학생1메세지 ||
    adQ.student1Message || '';
  let student2Name =
    fields.student2Name || fields.학생2이름 || fields.student2 ||
    adQ.student2Name || '';
  let student2Message =
    fields.student2Message || fields.학생2메시지 || fields.학생2메세지 ||
    adQ.student2Message || '';

  // body 파싱 결과로 빈 값 채우기
  if (speakers.length >= 1) {
    if (!professorName) professorName = speakers[0].name;
    if (!professorMessage) professorMessage = speakers[0].message;
  }
  if (speakers.length >= 2) {
    if (!student1Name) student1Name = speakers[1].name;
    if (!student1Message) student1Message = speakers[1].message;
  }
  if (speakers.length >= 3) {
    if (!student2Name) student2Name = speakers[2].name;
    if (!student2Message) student2Message = speakers[2].message;
  }

  // body에 화자 마커가 없는 경우 (레거시 fallback)
  if (speakers.length === 0 && body) {
    if (!professorName) professorName = extractProfessorNameFromBody(body);
    if (!professorMessage) {
      professorMessage = hasJson
        ? stripProfessorPrefixFromBody(body)
        : body;
    }
  }

  // promptTitle = questionText (지시문), promptInstructions = 토론 주제
  const promptTitle = adQ.questionText || '';
  const promptInstructions = fields.subject || fields.title || fields.제목 ||
    fields.주제 || adQ.passageTitle || '';

  return {
    professorName,
    professorMessage,
    student1Name,
    student1Message,
    student2Name,
    student2Message,
    promptTitle,
    promptInstructions,
  };
};

interface WritingSectionWrapperProps {
  initialScreen: WritingScreen;
  onHome: () => void;
  onComplete: () => void;
  onScreenChange?: (screen: WritingScreen) => void;
  // CMS-driven writing questions (passed from TPO/Test/Training)
  writingQuestions?: any[];
  /** 실전문제 Review 모드 — WritingEmailQ1/Q2에 AI 튜터 버튼 표시 */
  isReviewMode?: boolean;
}

export function WritingSectionWrapper({
  initialScreen,
  onHome,
  onComplete,
  onScreenChange,
  writingQuestions = [],
  isReviewMode = false,
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

  // Build a Sentence questions, found by TYPE and sorted by questionNumber —
  // not by raw position in the CMS array. This keeps bs-q1..bs-q10 correct
  // even if Email/Discussion questions were saved in between, or in a
  // different order, in the CMS.
  const buildSentenceQuestions = writingQuestions
    .filter((q: any) => (q.questionType || '').toLowerCase().includes('build a sentence'))
    .sort((a: any, b: any) => {
      const na = typeof a.questionNumber === 'number' ? a.questionNumber : parseInt(String(a.questionNumber)) || 0;
      const nb = typeof b.questionNumber === 'number' ? b.questionNumber : parseInt(String(b.questionNumber)) || 0;
      return na - nb;
    });

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
        const cmsQ = buildSentenceQuestions[0];
        return (
          <WritingBuildSentenceQ1
            onBack={goBack}
            onNext={goNext}
            onHome={onHome}
            avatar1ImageUrl={cmsQ?.avatar1ImageUrl}
            avatar2ImageUrl={cmsQ?.avatar2ImageUrl}
            questionText={cmsQ?.questionText}
            words={cmsQ?.words}
            sentenceEnding={cmsQ?.sentenceEnding}
            context={cmsQ?.context}
          />
        );
      })()}
      {screen === 'bs-q2' && (() => {
        const cmsQ = buildSentenceQuestions[1];
        return (
          <WritingBuildSentenceQ2
            onBack={goBack}
            onNext={goNext}
            onHome={onHome}
            avatar1ImageUrl={cmsQ?.avatar1ImageUrl}
            avatar2ImageUrl={cmsQ?.avatar2ImageUrl}
            questionText={cmsQ?.questionText}
            words={cmsQ?.words}
            sentenceEnding={cmsQ?.sentenceEnding}
            context={cmsQ?.context}
          />
        );
      })()}
      {screen === 'bs-q3' && (() => {
        const cmsQ = buildSentenceQuestions[2];
        return (
          <WritingBuildSentenceQ3
            onBack={goBack}
            onNext={goNext}
            onHome={onHome}
            avatar1ImageUrl={cmsQ?.avatar1ImageUrl}
            avatar2ImageUrl={cmsQ?.avatar2ImageUrl}
            questionText={cmsQ?.questionText}
            words={cmsQ?.words}
            sentenceEnding={cmsQ?.sentenceEnding}
            context={cmsQ?.context}
          />
        );
      })()}
      {screen === 'bs-q4' && (() => {
        const cmsQ = buildSentenceQuestions[3];
        return (
          <WritingBuildSentenceQ4
            onBack={goBack}
            onNext={goNext}
            onHome={onHome}
            avatar1ImageUrl={cmsQ?.avatar1ImageUrl}
            avatar2ImageUrl={cmsQ?.avatar2ImageUrl}
            questionText={cmsQ?.questionText}
            words={cmsQ?.words}
            sentenceEnding={cmsQ?.sentenceEnding}
            context={cmsQ?.context}
          />
        );
      })()}
      {screen === 'bs-q5' && (() => {
        const cmsQ = buildSentenceQuestions[4];
        return (
          <WritingBuildSentenceQ5
            onBack={goBack}
            onNext={goNext}
            onHome={onHome}
            avatar1ImageUrl={cmsQ?.avatar1ImageUrl}
            avatar2ImageUrl={cmsQ?.avatar2ImageUrl}
            questionText={cmsQ?.questionText}
            words={cmsQ?.words}
            sentenceEnding={cmsQ?.sentenceEnding}
            context={cmsQ?.context}
          />
        );
      })()}
      {screen === 'bs-q6' && (() => {
        const cmsQ = buildSentenceQuestions[5];
        return (
          <WritingBuildSentenceQ6
            onBack={goBack}
            onNext={goNext}
            onHome={onHome}
            avatar1ImageUrl={cmsQ?.avatar1ImageUrl}
            avatar2ImageUrl={cmsQ?.avatar2ImageUrl}
            questionText={cmsQ?.questionText}
            words={cmsQ?.words}
            sentenceEnding={cmsQ?.sentenceEnding}
            context={cmsQ?.context}
          />
        );
      })()}
      {screen === 'bs-q7' && (() => {
        const cmsQ = buildSentenceQuestions[6];
        return (
          <WritingBuildSentenceQ7
            onBack={goBack}
            onNext={goNext}
            onHome={onHome}
            avatar1ImageUrl={cmsQ?.avatar1ImageUrl}
            avatar2ImageUrl={cmsQ?.avatar2ImageUrl}
            questionText={cmsQ?.questionText}
            words={cmsQ?.words}
            sentenceEnding={cmsQ?.sentenceEnding}
            context={cmsQ?.context}
          />
        );
      })()}
      {screen === 'bs-q8' && (() => {
        const cmsQ = buildSentenceQuestions[7];
        return (
          <WritingBuildSentenceQ8
            onBack={goBack}
            onNext={goNext}
            onHome={onHome}
            avatar1ImageUrl={cmsQ?.avatar1ImageUrl}
            avatar2ImageUrl={cmsQ?.avatar2ImageUrl}
            questionText={cmsQ?.questionText}
            words={cmsQ?.words}
            sentenceEnding={cmsQ?.sentenceEnding}
            context={cmsQ?.context}
          />
        );
      })()}
      {screen === 'bs-q9' && (() => {
        const cmsQ = buildSentenceQuestions[8];
        return (
          <WritingBuildSentenceQ9
            onBack={goBack}
            onNext={goNext}
            onHome={onHome}
            avatar1ImageUrl={cmsQ?.avatar1ImageUrl}
            avatar2ImageUrl={cmsQ?.avatar2ImageUrl}
            questionText={cmsQ?.questionText}
            words={cmsQ?.words}
            sentenceEnding={cmsQ?.sentenceEnding}
            context={cmsQ?.context}
          />
        );
      })()}
      {screen === 'bs-q10' && (() => {
        const cmsQ = buildSentenceQuestions[9];
        return (
          <WritingBuildSentenceQ10
            onBack={goBack}
            onNext={goNext}
            onHome={onHome}
            avatar1ImageUrl={cmsQ?.avatar1ImageUrl}
            avatar2ImageUrl={cmsQ?.avatar2ImageUrl}
            questionText={cmsQ?.questionText}
            words={cmsQ?.words}
            sentenceEnding={cmsQ?.sentenceEnding}
            context={cmsQ?.context}
          />
        );
      })()}
      {screen === 'email-intro' && <WritingEmailIntro onNext={goNext} onHome={onHome} />}
      {screen === 'email-q1' && (() => {
        const emailQ = writingQuestions.find((q: any) =>
          (q.questionType || '').toLowerCase().includes('write an email') ||
          (q.questionType || '').toLowerCase().includes('email')
        );
        // Parse passageText JSON template (created by CSV import) into the
        // structured fields WritingEmailQ1 expects (emailTo, emailSubject,
        // emailScenario, emailInstruction).
        const emailWritingQuestion = buildEmailWritingQuestion(emailQ);
        return (
          <WritingEmailQ1
            onBack={goBack}
            onNext={goNext}
            onHome={onHome}
            writingQuestion={emailWritingQuestion}
            isReviewMode={isReviewMode}
          />
        );
      })()}
      {screen === 'academic-intro' && <WritingAcademicDiscussionIntro onBegin={goNext} onHome={onHome} />}
      {screen === 'academic-q2' && (() => {
        // Find the Academic Discussion question from CMS (by type or by position — typically Q12, after 10 Build Sentence + 1 Email)
        const adQ = writingQuestions.find((q: any) =>
          (q.questionType || '').toLowerCase().includes('academic discussion') ||
          (q.questionType || '').toLowerCase().includes('discussion')
        ) || null;
        // Parse passageText JSON template (created by CSV import) into the
        // professor/student message fields WritingAcademicDiscussionQ2 expects.
        const adProps = buildAcademicDiscussionProps(adQ);
        return (
          <WritingAcademicDiscussionQ2
            onBack={goBack}
            onNext={goNext}
            onHome={onHome}
            professorImageUrl={adQ?.avatar1ImageUrl}
            professorName={adProps.professorName}
            professorMessage={adProps.professorMessage}
            student1ImageUrl={adQ?.avatar2ImageUrl}
            student1Name={adProps.student1Name}
            student1Message={adProps.student1Message}
            student2ImageUrl={adQ?.avatar2ImageUrl}
            student2Name={adProps.student2Name}
            student2Message={adProps.student2Message}
            promptTitle={adProps.promptTitle}
            promptInstructions={adProps.promptInstructions}
            isReviewMode={isReviewMode}
          />
        );
      })()}
      {screen === 'end' && <WritingEnd onNext={onComplete} onHome={onHome} />}
    </>
  );
}