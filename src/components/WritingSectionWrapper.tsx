import React, { useState, useEffect } from 'react';
import { WritingIntro } from './WritingIntro';
import { WritingBuildSentenceIntro } from './WritingBuildSentenceIntro';
import { WritingBuildSentenceBase } from './WritingBuildSentenceBase';
import { WritingEmailIntro } from './WritingEmailIntro';
import { WritingEmailQ1 } from './WritingEmailQ1';
import { WritingAcademicDiscussionIntro } from './WritingAcademicDiscussionIntro';
import { WritingAcademicDiscussionQ2 } from './WritingAcademicDiscussionQ2';
import { WritingEnd } from './WritingEnd';
import { useTestProgress } from '../hooks/useTestProgress';
import { TestProgressRestoreModal } from './TestProgressRestoreModal';
import { hideMobileBrowserChrome, isMobileViewport } from '../utils/fullscreen';

// ============================================================================
// Writing Section - All Screens Wrapper
// Manages internal navigation via a single screen state instead of 17 booleans.
// ============================================================================

// Dynamic screen key. A question screen is encoded as `<type>-q<questionNumber>`
// (e.g. 'bs-q3', 'email-q11', 'academic-q12') so the review panel in App.tsx can
// recover the actual question number, while the number of questions per type is
// free to vary (no hard-coded 10/1/1).
export type WritingScreen = string;

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
// CSV 형식 (TPO 2 기준 — 모든 라이팅 CSV가 이 형식을 따름):
//   passageText = "To: Mr. Evans\nSubject: Printer Malfunction Issues"
//   questionText = "Write an email to the IT manager, Mr. Evans. In your email, do the following:\n• Describe...\n• Explain...\n• Suggest...\nWrite as much as you can and in complete sentences."
//   context      = "You are a student who works in the Office of Readmissions..."
//
// 파싱 규칙:
// - "To: ..." / "Subject: ..." 라인을 passageText 또는 questionText에서 추출 → emailTo / emailSubject
// - context 필드("You are a student...")를 emailScenario로 사용 (passageText가 아님)
// - questionText에서 "•" bullets를 분리 → emailBullets
// - questionText에서 bullets/To/Subject를 제외한 본문 → emailInstruction
// - 직접 CMS 필드(emailScenario 등)가 있으면 최우선
export const buildEmailWritingQuestion = (emailQ: any) => {
  if (!emailQ) return null;
  const fields = parseWritingPassageFields(emailQ.passageText);
  const hasJson = Object.keys(fields).length > 0;

  const questionText = emailQ.questionText || '';
  const rawPassage = hasJson
    ? (fields.body || fields.본문 || fields.내용 || fields.emailbody || '')
    : (emailQ.passageText || '');

  // ── To / Subject 라인 추출 헬퍼 ──
  // "To: Mr. Evans" / "Subject: Printer Malfunction Issues" 형태의 라인을
  // 찾아 값을 추출하고, 원본 텍스트에서 해당 라인을 제거한 cleaned 텍스트 반환.
  const extractToAndSubject = (text: string): { to: string; subject: string; cleaned: string } => {
    if (!text) return { to: '', subject: '', cleaned: '' };
    let to = '';
    let subject = '';
    const keptLines: string[] = [];
    for (const rawLine of text.split('\n')) {
      const toMatch = rawLine.match(/^\s*To\s*[:：]\s*(.+)$/i);
      const subjectMatch = rawLine.match(/^\s*Subject\s*[:：]\s*(.+)$/i);
      if (toMatch) { to = toMatch[1].trim(); continue; }
      if (subjectMatch) { subject = subjectMatch[1].trim(); continue; }
      keptLines.push(rawLine);
    }
    return { to, subject, cleaned: keptLines.join('\n').trim() };
  };

  // passageText에서 To/Subject 추출 (csv_3.30 / csv_4.1 형식)
  const fromPassage = extractToAndSubject(rawPassage);
  // questionText에서도 To/Subject 추출 (csv_4.28 형식 — 끝에 붙어있는 경우)
  const fromQuestion = extractToAndSubject(questionText);

  // ── emailTo / emailSubject ──
  // 직접 CMS 필드 > passageText에서 추출 > questionText에서 추출 > JSON fields
  const emailTo =
    emailQ.emailTo || fromPassage.to || fromQuestion.to ||
    fields.to || fields.받는사람 || fields.recipient || fields.받는이 || '';
  const emailSubject =
    emailQ.emailSubject || fromPassage.subject || fromQuestion.subject ||
    fields.subject || fields.제목 || fields.주제 || fields.메일제목 || '';

  // ── emailScenario ──
  // 직접 CMS 필드 > context 필드("You are a student...") > passageText에서 To/Subject 제거한 나머지
  const cleanedPassage = fromPassage.cleaned;
  const emailScenario =
    emailQ.emailScenario || emailQ.context || cleanedPassage || '';

  // ── emailInstruction + emailBullets ──
  // questionText에서 To/Subject 라인을 제거한 뒤, "•" bullets와 instruction 분리
  const cleanedQuestion = fromQuestion.cleaned;
  let emailInstruction = emailQ.emailInstruction || '';
  let bullets: string[] = [];
  const instructionLines: string[] = [];

  for (const rawLine of cleanedQuestion.split('\n')) {
    const line = rawLine.trim();
    if (!line) continue;
    // "• Describe..." / "- Describe..." / "1. Describe..." 형식
    const bulletMatch = line.match(/^(?:[•\-*]|\d+[.)])\s+(.+)$/);
    if (bulletMatch) {
      bullets.push(bulletMatch[1].trim());
    } else {
      instructionLines.push(line);
    }
  }
  // "Write as much as you can and in complete sentences."는 WritingEmailQ1에서
  // 하드코딩으로 표시되므로 instruction에서 제외 (중복 방지)
  const filteredInstructions = instructionLines.filter(
    line => !/^write as much as you can/i.test(line)
  );
  if (!emailInstruction && filteredInstructions.length > 0) {
    emailInstruction = filteredInstructions.join('\n');
  }

  // 레거시: JSON body에서 "|"로 구분된 요구사항 (do the following: ... | ... | ...)
  if (bullets.length === 0 && cleanedPassage.includes('|')) {
    const parts = cleanedPassage.split('|').map(p => p.trim()).filter(Boolean);
    if (parts.length > 1) {
      const firstPart = parts[0];
      bullets = parts.slice(1);
      const markerMatch = firstPart.match(/do the following\s*[:：]\s*/i);
      if (markerMatch && markerMatch.index !== undefined) {
        const after = firstPart.slice(markerMatch.index + markerMatch[0].length).trim();
        if (after) bullets = [after, ...bullets];
      }
    }
  }

  // 직접 CMS 필드가 있으면 최우선 (Add Question 폼에서 저장된 값)
  if (emailQ.emailBullets && emailQ.emailBullets.length > 0) bullets = emailQ.emailBullets;

  return {
    emailTo,
    emailSubject,
    emailScenario,
    emailInstruction,
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

  // promptTitle = questionText (지시문), 없으면 context 필드 fallback.
  // promptInstructions = 토론 주제
  const promptTitle = adQ.questionText || adQ.context || '';
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

  const numOf = (q: any): number => {
    const n = typeof q?.questionNumber === 'number'
      ? q.questionNumber
      : parseInt(String(q?.questionNumber ?? '').replace(/\D/g, ''), 10);
    return Number.isNaN(n) ? Number.MAX_SAFE_INTEGER : n;
  };
  const byNum = (a: any, b: any) => numOf(a) - numOf(b);

  // Questions found by TYPE and sorted by questionNumber — not raw CMS position.
  const buildSentenceQuestions = writingQuestions
    .filter((q: any) => (q.questionType || '').toLowerCase().includes('build a sentence'))
    .sort(byNum);
  const emailQuestions = writingQuestions
    .filter((q: any) => {
      const t = (q.questionType || '').toLowerCase();
      return t.includes('write an email') || t.includes('email');
    })
    .sort(byNum);
  const discussionQuestions = writingQuestions
    .filter((q: any) => {
      const t = (q.questionType || '').toLowerCase();
      return t.includes('academic discussion') || t.includes('discussion');
    })
    .sort(byNum);

  // Dynamic screen list — sections only appear when they have questions, and
  // each question gets its own screen keyed by its actual questionNumber.
  const screens: WritingScreen[] = ['intro'];
  if (buildSentenceQuestions.length > 0) {
    screens.push('build-sentence-intro');
    buildSentenceQuestions.forEach((q: any) => screens.push(`bs-q${numOf(q)}`));
  }
  if (emailQuestions.length > 0) {
    screens.push('email-intro');
    emailQuestions.forEach((q: any) => screens.push(`email-q${numOf(q)}`));
  }
  if (discussionQuestions.length > 0) {
    screens.push('academic-intro');
    discussionQuestions.forEach((q: any) => screens.push(`academic-q${numOf(q)}`));
  }
  screens.push('end');

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

  // Restore progress on mount (only if the saved screen still exists)
  useEffect(() => {
    if (savedProgress && savedProgress.currentScreen && screens.includes(savedProgress.currentScreen)) {
      setScreen(savedProgress.currentScreen as WritingScreen);
    }
  }, []);

  // 모바일 URL바·하단 툴바 숨김 — Writing 섹션 진입 및 화면 전환 시마다 재적용.
  useEffect(() => {
    if (isMobileViewport()) hideMobileBrowserChrome();
  }, [screen]);

  // 새 세션 시작 시 이전 Writing 응답 초기화 (EndWritingScreen AI 채점 데이터)
  useEffect(() => {
    sessionStorage.removeItem('writingResponses');
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

  const resolveBs = (key: string) => buildSentenceQuestions.find((q: any) => numOf(q) === Number(key.replace(/\D/g, '')));
  const resolveEmail = (key: string) => emailQuestions.find((q: any) => numOf(q) === Number(key.replace(/\D/g, '')));
  const resolveDisc = (key: string) => discussionQuestions.find((q: any) => numOf(q) === Number(key.replace(/\D/g, '')));

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
      {/^bs-q\d+$/.test(screen) && (() => {
        const cmsQ = resolveBs(screen);
        return (
          <WritingBuildSentenceBase
            onBack={goBack}
            onNext={goNext}
            onHome={onHome}
            questionNumber={cmsQ ? numOf(cmsQ) : 1}
            slotCount={(cmsQ?.words || []).length || 6}
            avatar1ImageUrl={cmsQ?.avatar1ImageUrl}
            avatar2ImageUrl={cmsQ?.avatar2ImageUrl}
            questionText={cmsQ?.questionText}
            words={cmsQ?.words}
            sentenceEnding={cmsQ?.sentenceEnding}
            context={cmsQ?.context}
            correctAnswer={typeof (cmsQ as any)?.correctAnswer === 'string' ? (cmsQ as any).correctAnswer : undefined}
          />
        );
      })()}
      {screen === 'email-intro' && <WritingEmailIntro onNext={goNext} onHome={onHome} />}
      {/^email-q\d+$/.test(screen) && (() => {
        const emailQ = resolveEmail(screen);
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
      {/^academic-q\d+$/.test(screen) && (() => {
        const adQ = resolveDisc(screen) || null;
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