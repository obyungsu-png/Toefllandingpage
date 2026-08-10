import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { TPOQuestion, TPOSection, TPOTest } from '../components/ContentManagement';
import { buildEmailWritingQuestion, buildAcademicDiscussionProps } from '../components/WritingSectionWrapper';

type PdfMode = 'standard' | 'annotated';

const SECTION_ORDER: Array<TPOSection['sectionType']> = ['Reading', 'Listening', 'Speaking', 'Writing'];

interface PdfLine {
  text: string;
  link?: string;     // render as a short clickable hyperlink
  heading?: boolean; // Q-number heading line
  bold?: boolean;    // bold but not heading-size
  indent?: boolean;  // indent by 4mm
}

function stringifyAnswer(answer?: string | string[]) {
  if (!answer) return 'N/A';
  return Array.isArray(answer) ? answer.join(', ') : answer;
}

// ── Markup cleaners ─────────────────────────────────────────────────────────

// Fill-in-blank markers: "gu[ides:4]" 또는 "peo[ple]" → "guides" / "people"
function cleanFillBlanks(text: string) {
  return text.replace(/(\S*?)\[([^\]:]+)(?::(\d+))?\]/g, (_, prefix, answer) => `${prefix}${answer}`);
}

// Fill-in-blank markers: "gu[ides:4]" 또는 "peo[ple]" → "gu____" / "peo____" for student PDF handouts
function renderFillBlanks(text: string) {
  return text.replace(/(\S*?)\[([^\]:]+)(?::(\d+))?\]/g, (_, prefix, answer) => {
    const blank = '_'.repeat(Math.max(3, String(answer).length));
    return `${prefix}${blank}`;
  });
}

// 빈칸 마커 개수 카운트 — "peo[ple]", "gu[ides:4]" 두 형식 모두 지원
function countFillBlanks(text?: string) {
  if (!text) return 0;
  return [...text.matchAll(/\[[^\]:]+(?::(\d+))?\]/g)].length;
}

// Build a Sentence Word Bank 셔플 — PDF에서 정답 순서 노출 방지.
// 문자열 해시를 시드로 사용 → 같은 문제는 항상 같은 순서로 셔플됨 (재생성 시에도 일관).
function seededShuffleWords(words: string[]): string[] {
  const arr = [...words];
  let seed = 5381;
  const key = words.join('|');
  for (let i = 0; i < key.length; i++) {
    seed = ((seed << 5) + seed + key.charCodeAt(i)) >>> 0;
  }
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 0xffffffff;
  };
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ── Passage parsers ─────────────────────────────────────────────────────────

// Reading Module 2: {"title":"...","passage":"...","questions":[...]}
function parseReadingM2(passageText: string): { title: string; passage: string } | null {
  try {
    const p = JSON.parse(passageText);
    if (p && typeof p === 'object' && p.passage && !p.structure) {
      return { title: p.title || '', passage: p.passage };
    }
  } catch { /* not JSON */ }
  return null;
}

// "Read in Daily Life" templates: {structure, fields, color}
function formatTemplatePassage(passageText: string): string[] | null {
  let parsed: { structure?: string; fields?: Record<string, string> } | null = null;
  try { parsed = JSON.parse(passageText); } catch { return null; }
  if (!parsed || typeof parsed !== 'object' || !parsed.structure || !parsed.fields) return null;

  const f = parsed.fields;
  const out: string[] = [];
  const labelled = (label: string, key: string) => { if (f[key]) out.push(`${label}: ${f[key]}`); };
  const raw      = (key: string)               => { if (f[key]) out.push(f[key]); };
  const blank    = ()                          => { if (out.length) out.push(''); };

  switch (parsed.structure) {
    case 'email':
      labelled('To', 'to'); labelled('From', 'from');
      labelled('Date', 'date'); labelled('Subject', 'subject');
      blank(); raw('body');
      break;
    case 'notice':
      raw('title'); raw('subtitle'); blank(); raw('body');
      break;
    case 'social_media':
      raw('platform'); raw('username'); blank(); raw('content');
      break;
    case 'advertisement':
      raw('headline'); raw('business'); raw('offer');
      raw('details'); raw('location'); raw('contact');
      break;
    case 'article': {
      raw('source'); raw('headline');
      const meta = [f.date, f.author].filter(Boolean).join('  |  ');
      if (meta) out.push(meta);
      blank(); raw('body');
      break;
    }
    case 'form': {
      raw('title'); raw('company');
      if (f.tableHeaders) out.push(f.tableHeaders.split(',').map(s => s.trim()).join('  |  '));
      if (f.tableRows) {
        f.tableRows.split('\n').filter(r => r.trim())
          .forEach(r => out.push(r.split(',').map(s => s.trim()).join('  |  ')));
      }
      raw('footer');
      break;
    }
    default:
      Object.entries(f).forEach(([k, v]) => { if (v) out.push(`${k}: ${v}`); });
  }
  return out;
}

// ── Line builders per section ────────────────────────────────────────────────

function readingLines(question: TPOQuestion, mode: PdfMode, skipPassage: boolean = false): PdfLine[] {
  const lines: PdfLine[] = [];
  const blankCount = Math.max(countFillBlanks(question.questionText), countFillBlanks(question.passageText));
  const isCompleteWords = /complete\s*words|fill\s*in\s*the\s*blank|cloze/i.test(question.questionType || '');
  const isFillBlankSet = isCompleteWords || blankCount >= 10;
  const blankSetLabel = `Q${question.questionNumber}-Q${Number(question.questionNumber) + 9}`;
  lines.push({ text: isFillBlankSet ? `${blankSetLabel}  [${question.questionType}]` : `Q${question.questionNumber}  [${question.questionType}]`, heading: true });

  if (!skipPassage && question.passageText) {
    const m2 = parseReadingM2(question.passageText);
    if (m2) {
      if (m2.title) lines.push({ text: m2.title, bold: true });
      lines.push({ text: m2.passage });
    } else {
      const tpl = formatTemplatePassage(question.passageText);
      if (tpl) {
        lines.push({ text: 'Passage:' });
        tpl.forEach(t => lines.push({ text: t }));
      } else {
        lines.push({ text: isFillBlankSet ? renderFillBlanks(question.passageText) : cleanFillBlanks(question.passageText) });
      }
    }
  }

  if (question.passageTitle) lines.push({ text: question.passageTitle, bold: true });
  if (question.questionText) {
    const questionText = isFillBlankSet ? renderFillBlanks(question.questionText) : cleanFillBlanks(question.questionText);
    lines.push({ text: isFillBlankSet ? questionText : `Q: ${questionText}` });
  }

  if (question.words?.length) lines.push({ text: `Words: ${question.words.join(' / ')}` });
  if (question.options?.length) {
    question.options.forEach((opt, i) =>
      lines.push({ text: `${String.fromCharCode(65 + i)}. ${opt.replace(/^[A-D]\.\s*/, '')}`, indent: true }));
  }

  if (mode === 'annotated') {
    lines.push({ text: `Answer: ${stringifyAnswer(question.correctAnswer)}` });
    if (question.explanation) lines.push({ text: `Notes: ${question.explanation}` });
    if (question.translationNote) lines.push({ text: `Translation: ${question.translationNote}` });
    if (question.vocabularyNote) lines.push({ text: `Vocabulary: ${question.vocabularyNote}` });
  }
  return lines;
}

function listeningLines(question: TPOQuestion, mode: PdfMode, skipPassage: boolean = false): PdfLine[] {
  const lines: PdfLine[] = [];
  lines.push({ text: `Q${question.questionNumber}  [${question.questionType}]`, heading: true });

  if (question.passageTitle) lines.push({ text: question.passageTitle, bold: true });
  if (question.questionText) lines.push({ text: `Q: ${cleanFillBlanks(question.questionText)}` });

  if (!skipPassage && question.passageText) {
    const tpl = formatTemplatePassage(question.passageText);
    if (tpl) {
      lines.push({ text: 'Passage:' });
      tpl.forEach(t => lines.push({ text: t }));
    } else {
      lines.push({ text: cleanFillBlanks(question.passageText) });
    }
  }

  if (question.words?.length) lines.push({ text: `Words: ${question.words.join(' / ')}` });
  if (question.options?.length) {
    question.options.forEach((opt, i) =>
      lines.push({ text: `${String.fromCharCode(65 + i)}. ${opt.replace(/^[A-D]\.\s*/, '')}`, indent: true }));
  }
  if (question.audioUrl) lines.push({ text: 'Audio (click to listen)', link: question.audioUrl });
  if (question.videoUrl) lines.push({ text: 'Video (click to watch)', link: question.videoUrl });

  if (mode === 'annotated') {
    lines.push({ text: `Answer: ${stringifyAnswer(question.correctAnswer)}` });
    if (question.explanation) lines.push({ text: `Notes: ${question.explanation}` });
    if (question.translationNote) lines.push({ text: `Translation: ${question.translationNote}` });
    if (question.vocabularyNote) lines.push({ text: `Vocabulary: ${question.vocabularyNote}` });
  }
  return lines;
}

function speakingLines(question: TPOQuestion, mode: PdfMode, _skipPassage: boolean = false): PdfLine[] {
  const lines: PdfLine[] = [];
  lines.push({ text: `Q${question.questionNumber}  [${question.questionType}]`, heading: true });

  if (question.questionText) lines.push({ text: question.questionText });

  if (question.passageText) {
    const tpl = formatTemplatePassage(question.passageText);
    if (tpl) {
      lines.push({ text: 'Passage:', bold: true });
      tpl.forEach(t => lines.push({ text: t }));
    } else {
      lines.push({ text: 'Passage:', bold: true });
      lines.push({ text: cleanFillBlanks(question.passageText) });
    }
  }

  if (question.passageTitle) lines.push({ text: question.passageTitle, bold: true });

  if (question.words?.length) lines.push({ text: `Words: ${question.words.join(' / ')}` });

  if (question.options?.length) {
    question.options.forEach((opt, i) =>
      lines.push({ text: `${String.fromCharCode(65 + i)}. ${opt.replace(/^[A-D]\.\s*/, '')}`, indent: true }));
  }

  if (question.audioUrl) lines.push({ text: 'Audio (click to listen)', link: question.audioUrl });
  if (question.videoUrl) lines.push({ text: 'Video (click to watch)', link: question.videoUrl });
  if (question.imageUrl && /^https?:\/\//i.test(question.imageUrl)) {
    lines.push({ text: 'Image (click to view)', link: question.imageUrl });
  }

  if (mode === 'annotated') {
    if (question.correctAnswer) lines.push({ text: `Sample Answer: ${stringifyAnswer(question.correctAnswer)}` });
    if (question.explanation) lines.push({ text: `Notes: ${question.explanation}` });
    if (question.translationNote) lines.push({ text: `Translation: ${question.translationNote}` });
    if (question.vocabularyNote) lines.push({ text: `Vocabulary: ${question.vocabularyNote}` });
  }
  return lines;
}

function writingLines(question: TPOQuestion, mode: PdfMode, _skipPassage: boolean = false): PdfLine[] {
  const q = question as TPOQuestion & Record<string, string | string[] | undefined>;
  const lines: PdfLine[] = [];
  lines.push({ text: `Q${question.questionNumber}  [${question.questionType}]`, heading: true });

  // ── Write an Email ──────────────────────────────────────────────────────
  // 실제 화면(WritingEmailQ1)과 동일한 순서로 표시:
  //   scenario 문단 → instruction(bold) → bullets → "Write as much as..." → To/Subject.
  // Email 데이터는 CMS 필드 외에 passageText/context/questionText에 흩어져 있을 수 있으므로
  // WritingSectionWrapper의 파서를 그대로 사용해 화면과 정확히 같은 문구를 얻는다.
  if (question.questionType === 'Write an Email') {
    const email = buildEmailWritingQuestion(question) ?? {
      emailScenario: '', emailInstruction: '', emailBullets: [],
      emailTo: '', emailSubject: '',
    };
    if (email.emailScenario)    lines.push({ text: email.emailScenario });
    if (email.emailInstruction) lines.push({ text: email.emailInstruction, bold: true });
    if (email.emailBullets && email.emailBullets.length) {
      email.emailBullets.filter(b => b && b.trim()).forEach(b => lines.push({ text: `• ${b}`, indent: true }));
    }
    // 화면에 하드코딩된 안내 문구 — PDF에도 동일하게 노출
    lines.push({ text: 'Write as much as you can and in complete sentences.' });
    if (email.emailTo)      lines.push({ text: `To: ${email.emailTo}`, bold: true });
    if (email.emailSubject) lines.push({ text: `Subject: ${email.emailSubject}`, bold: true });
    const hasAny = !!(email.emailScenario || email.emailInstruction
      || (email.emailBullets && email.emailBullets.some(b => b && b.trim()))
      || email.emailTo || email.emailSubject || question.questionText);
    if (!hasAny) lines.push({ text: '(No prompt provided for this question.)' });

  // ── Academic Discussion ─────────────────────────────────────────────────
  // 실제 화면(WritingAcademicDiscussionQ2)과 동일한 순서로 표시:
  //   Instructions 헤더 + promptTitle → 하드코딩된 2개 bullet → 100 words 안내
  //   → (있으면) promptInstructions 큰 제목 → 교수 이름 + 메시지 → 학생1 → 학생2.
  } else if (question.questionType === 'Academic Discussion') {
    const ad = buildAcademicDiscussionProps(question);
    // 명시적 필드가 있으면 우선 사용 (파서보다 우선)
    const professorName    = (q.professorName as string)    || ad.professorName;
    const professorMessage = (q.professorMessage as string) || ad.professorMessage;
    const student1Name     = (q.student1Name as string)     || ad.student1Name;
    const student1Message  = (q.student1Message as string)  || ad.student1Message;
    const student2Name     = (q.student2Name as string)     || ad.student2Name;
    const student2Message  = (q.student2Message as string)  || ad.student2Message;
    const promptTitle       = ad.promptTitle       || question.questionText || '';
    const promptInstructions = ad.promptInstructions || '';

    if (promptTitle) lines.push({ text: `Instructions: ${promptTitle}`, bold: true });
    lines.push({ text: '• express and support your personal opinion', indent: true });
    lines.push({ text: '• make a contribution to the discussion', indent: true });
    lines.push({ text: 'An effective response will contain at least 100 words.' });
    if (promptInstructions) lines.push({ text: promptInstructions, bold: true });
    if (professorName)    lines.push({ text: `Professor: ${professorName}`, bold: true });
    if (professorMessage) lines.push({ text: professorMessage, indent: true });
    if (student1Name)     lines.push({ text: `${student1Name}:`, bold: true });
    if (student1Message)  lines.push({ text: student1Message, indent: true });
    if (student2Name)     lines.push({ text: `${student2Name}:`, bold: true });
    if (student2Message)  lines.push({ text: student2Message, indent: true });

  // ── Build a Sentence / other ────────────────────────────────────────────
  } else {
    if (q.context) lines.push({ text: `Context: ${q.context}` });
    if (question.questionText) lines.push({ text: question.questionText });
    if (question.passageText) {
      const tpl = formatTemplatePassage(question.passageText);
      if (tpl) tpl.forEach(t => lines.push({ text: t }));
      else lines.push({ text: cleanFillBlanks(question.passageText) });
    }
    if (question.words?.length) {
      const isBuildSentence = (question.questionType || '').toLowerCase().includes('build a sentence');
      const displayWords = mode === 'standard' && isBuildSentence
        ? seededShuffleWords(question.words)
        : question.words;
      lines.push({ text: `Word Bank: ${displayWords.join(' / ')}` });
      if (isBuildSentence && q.sentenceEnding) {
        lines.push({ text: `Ending: ${q.sentenceEnding}` });
      }
    }
    if (question.options?.length) {
      question.options.forEach((opt, i) =>
        lines.push({ text: `${String.fromCharCode(65 + i)}. ${opt.replace(/^[A-D]\.\s*/, '')}`, indent: true }));
    }
  }

  if (mode === 'annotated') {
    if ((question as any).modelAnswer && String((question as any).modelAnswer).trim()) {
      lines.push({ text: 'Model Answer:', bold: true });
      String((question as any).modelAnswer)
        .split(/\r?\n/)
        .forEach(para => {
          const t = para.trim();
          if (t) lines.push({ text: t, indent: true });
        });
    }
    if (question.correctAnswer) lines.push({ text: `Sample Answer: ${stringifyAnswer(question.correctAnswer)}` });
    if (question.explanation)   lines.push({ text: `Notes: ${question.explanation}` });
    if (question.translationNote) lines.push({ text: `Translation: ${question.translationNote}` });
    if (question.vocabularyNote)  lines.push({ text: `Vocabulary: ${question.vocabularyNote}` });
  }
  return lines;
}

function questionLines(question: TPOQuestion, section: TPOSection, mode: PdfMode, skipPassage: boolean = false): PdfLine[] {
  switch (section.sectionType) {
    case 'Reading':  return readingLines(question, mode, skipPassage);
    case 'Listening': return listeningLines(question, mode, skipPassage);
    case 'Speaking': return speakingLines(question, mode, skipPassage);
    case 'Writing':  return writingLines(question, mode, skipPassage);
    default:         return speakingLines(question, mode, skipPassage);
  }
}

// ── HTML rendering ──────────────────────────────────────────────────────────
// 브라우저 폰트(Malgun/Apple SD/Noto)로 렌더링해 한글/CJK 문자가 깨지지 않도록 함

function escapeHtml(s: string): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function lineToHtml(line: PdfLine): string {
  const indentStyle = line.indent ? 'margin-left:20px;' : '';
  const textHtml = escapeHtml(line.text).replace(/\n/g, '<br>');
  if (line.link) {
    return `<div class="pdf-line pdf-link" style="${indentStyle}"><a href="${escapeHtml(line.link)}" style="color:#2563eb;text-decoration:underline;">${textHtml}</a></div>`;
  }
  if (line.heading) {
    return `<div class="pdf-line pdf-heading" style="${indentStyle}">${textHtml}</div>`;
  }
  if (line.bold) {
    return `<div class="pdf-line pdf-bold" style="${indentStyle}">${textHtml}</div>`;
  }
  return `<div class="pdf-line" style="${indentStyle}">${textHtml}</div>`;
}

function sectionHtml(section: TPOSection, mode: PdfMode): string {
  const isModule2 = (q: TPOQuestion) => (q.questionType || '').toLowerCase().includes('module 2');
  const sortedQuestions = [...section.questions].sort((a, b) => {
    const am = isModule2(a) ? 1 : 0;
    const bm = isModule2(b) ? 1 : 0;
    return am - bm;
  });

  let html = `<div class="pdf-section"><h2 class="pdf-section-title">${escapeHtml(section.sectionType)}</h2>`;
  if (section.instructions) {
    html += `<div class="pdf-section-instructions">${escapeHtml(section.instructions).replace(/\n/g, '<br>')}</div>`;
  }

  let lastModule = -1;
  let lastPassageText: string | undefined = undefined;
  for (const question of sortedQuestions) {
    const mod = isModule2(question) ? 2 : 1;
    if (mod !== lastModule) {
      html += `<div class="pdf-module-header">Module ${mod}</div>`;
      lastModule = mod;
    }

    const currentPassageText = question.passageText;
    const skipPassage = !!(currentPassageText && lastPassageText === currentPassageText);
    const lines = questionLines(question, section, mode, skipPassage);
    if (currentPassageText) lastPassageText = currentPassageText;

    html += `<div class="pdf-question">${lines.map(lineToHtml).join('')}</div>`;
  }

  html += `</div>`;
  return html;
}

function buildHtml(testData: TPOTest, mode: PdfMode, sectionType: TPOSection['sectionType'] | undefined, examLabel: string, dateText: string): string {
  const titleSection = sectionType ? `${escapeHtml(sectionType)} — ` : '';
  const memoLine = testData.dateMemo ? `<div class="pdf-memo">Memo: ${escapeHtml(testData.dateMemo)}</div>` : '';

  const orderedSections = [...testData.sections]
    .filter(s => SECTION_ORDER.includes(s.sectionType))
    .sort((a, b) => SECTION_ORDER.indexOf(a.sectionType) - SECTION_ORDER.indexOf(b.sectionType))
    .filter(s => !sectionType || s.sectionType === sectionType);

  const body = orderedSections.map(s => sectionHtml(s, mode)).join('');

  // iframe 안에 통째로 들어가는 독립 문서 — Tailwind v4의 oklch() 색이 상속되지 않아
  // html2canvas 1.4.1이 색 파싱에서 던지지 않는다.
  return `<!doctype html><html><head><meta charset="utf-8"><style>
      html, body { margin: 0; padding: 0; background: #ffffff; color: #000000; }
      body {
        font-family: 'Malgun Gothic', 'Apple SD Gothic Neo', 'Noto Sans KR', 'Nanum Gothic', 'Helvetica', 'Arial', sans-serif;
        width: 800px;
        padding: 40px 34px 32px 34px;
        box-sizing: border-box;
        line-height: 1.5;
        font-size: 14px;
      }
      .pdf-title { font-size: 22px; font-weight: 700; margin: 0 0 6px 0; }
      .pdf-meta { font-size: 12px; color: #333333; margin-bottom: 4px; }
      .pdf-memo { font-size: 12px; color: #333333; margin-bottom: 12px; }
      .pdf-section { margin-top: 18px; }
      .pdf-section-title { font-size: 20px; font-weight: 700; margin: 0 0 8px 0; }
      .pdf-section-instructions { font-style: italic; font-size: 13px; margin-bottom: 10px; color: #222222; }
      .pdf-module-header { font-size: 15px; font-weight: 700; color: #148b8f; margin: 14px 0 6px 0; }
      .pdf-question { margin-bottom: 14px; page-break-inside: avoid; }
      .pdf-line { margin: 0 0 4px 0; font-size: 14px; word-wrap: break-word; white-space: pre-wrap; }
      .pdf-heading { font-size: 15px; font-weight: 700; margin: 6px 0 4px 0; }
      .pdf-bold { font-weight: 700; }
      .pdf-link a { color: #2563eb; text-decoration: underline; }
    </style></head><body>
    <div class="pdf-title">${titleSection}${escapeHtml(testData.testType)} ${escapeHtml(examLabel)}</div>
    <div class="pdf-meta">Generated: ${escapeHtml(dateText)}</div>
    ${memoLine}
    ${body}
  </body></html>`;
}

// ── Public entry point ───────────────────────────────────────────────────────

/**
 * 테스트 PDF 생성 — HTML→canvas→PDF 파이프라인.
 * 브라우저 폰트로 렌더링되어 한글/CJK 문자가 깨지지 않음.
 * @param testData  전체 TPOTest 데이터
 * @param mode      'standard' (문제만) | 'annotated' (정답/해설 포함)
 * @param sectionType  지정하면 해당 영역만 PDF에 포함 (예: 'Listening'). 생략 시 전체 영역.
 */
export async function generateTestPdf(
  testData: TPOTest,
  mode: PdfMode,
  sectionType?: TPOSection['sectionType']
) {
  const today = new Date();
  const dateText = `${today.getFullYear()}.${String(today.getMonth()+1).padStart(2,'0')}.${String(today.getDate()).padStart(2,'0')}`;

  const hasDisplayNum = !!testData.displayNumber;
  const hasExamDate = !hasDisplayNum && !!(testData.year && testData.month);
  const examLabel = hasDisplayNum
    ? `${testData.displayNumber}`
    : hasExamDate
    ? `${testData.year}년 ${testData.month}월`
    : `No. ${testData.testNumber}`;
  const fileLabel = hasDisplayNum
    ? `${testData.displayNumber}`
    : hasExamDate
    ? `${testData.year}-${String(testData.month).padStart(2, '0')}`
    : `${testData.testNumber}`;

  const html = buildHtml(testData, mode, sectionType, examLabel, dateText);

  // 부모 문서(Tailwind v4의 oklch() 색)로부터 완전히 격리된 iframe에 렌더.
  // → html2canvas 1.4.1이 색 파싱에서 던지지 않고, 브라우저 시스템 폰트로 한글이 정상 출력됨.
  const iframe = document.createElement('iframe');
  iframe.setAttribute('data-pdf-iframe', '1');
  iframe.style.cssText = 'position:fixed;left:-10000px;top:0;width:800px;height:600px;border:0;pointer-events:none;z-index:-1;';
  document.body.appendChild(iframe);

  try {
    const idoc = iframe.contentDocument;
    if (!idoc) throw new Error('iframe document 접근 실패');
    idoc.open();
    idoc.write(html);
    idoc.close();

    // 폰트 및 레이아웃 확정 대기
    if ((idoc as any).fonts?.ready) {
      try { await (idoc as any).fonts.ready; } catch { /* ignore */ }
    }
    await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));

    const target = idoc.body;
    const renderWidth = Math.max(target.scrollWidth, 800);
    const renderHeight = Math.max(target.scrollHeight, 1);
    // iframe 높이를 실제 콘텐츠 높이에 맞춰 — html2canvas가 windowHeight 기준으로 클리핑하는 것 방지
    iframe.style.height = renderHeight + 'px';

    const canvas = await html2canvas(target, {
      scale: 2,
      backgroundColor: '#ffffff',
      useCORS: true,
      logging: false,
      width: renderWidth,
      height: renderHeight,
      windowWidth: renderWidth,
      windowHeight: renderHeight,
    });

    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidthMm = 210;
    const pageHeightMm = 297;
    const imgWidthMm = pageWidthMm;
    const imgHeightMm = (canvas.height * imgWidthMm) / canvas.width;

    const imgData = canvas.toDataURL('image/jpeg', 0.92);

    if (imgHeightMm <= pageHeightMm) {
      pdf.addImage(imgData, 'JPEG', 0, 0, imgWidthMm, imgHeightMm);
    } else {
      // 한 캔버스를 여러 페이지에 걸쳐 얹기 — offset을 음수로 이동
      let position = 0;
      while (position < imgHeightMm) {
        pdf.addImage(imgData, 'JPEG', 0, -position, imgWidthMm, imgHeightMm);
        position += pageHeightMm;
        if (position < imgHeightMm) pdf.addPage();
      }
    }

    const suffix = mode === 'annotated' ? 'annotated' : 'standard';
    const sectionTag = sectionType ? `-${sectionType.toLowerCase()}` : '';
    pdf.save(`${testData.testType}-${fileLabel}${sectionTag}-${suffix}-${dateText}.pdf`);
  } catch (err) {
    console.error('[generateTestPdf] 실패:', err);
    const msg = err instanceof Error ? err.message : String(err);
    alert(`PDF 생성에 실패했습니다.\n${msg}`);
    throw err;
  } finally {
    if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
  }
}
