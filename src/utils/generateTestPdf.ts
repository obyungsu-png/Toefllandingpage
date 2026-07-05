import jsPDF from 'jspdf';
import type { TPOQuestion, TPOSection, TPOTest } from '../components/ContentManagement';

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

// Fill-in-blank markers: "gu[ides:4]" → "guides"
function cleanFillBlanks(text: string) {
  return text.replace(/(\S*?)\[([^\]]+):(\d+)\]/g, (_, prefix, answer) => `${prefix}${answer}`);
}

// Fill-in-blank markers: "gu[ides:4]" → "gu____" for student PDF handouts
function renderFillBlanks(text: string) {
  return text.replace(/(\S*?)\[([^\]]+):(\d+)\]/g, (_, prefix, answer) => {
    const blank = '_'.repeat(Math.max(3, String(answer).length));
    return `${prefix}${blank}`;
  });
}

function countFillBlanks(text?: string) {
  if (!text) return 0;
  return [...text.matchAll(/\[[^\]]+:(\d+)\]/g)]
    .reduce((max, match) => Math.max(max, Number(match[1]) || 0), 0);
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

function readingLines(question: TPOQuestion, mode: PdfMode): PdfLine[] {
  const lines: PdfLine[] = [];
  const blankCount = countFillBlanks(question.questionText) || countFillBlanks(question.passageText);
  const isCompleteWords = /complete words/i.test(question.questionType || '');
  const isFillBlankSet = question.questionNumber === 1 && (blankCount >= 10 || isCompleteWords);
  lines.push({ text: isFillBlankSet ? `Q1-Q10  [${question.questionType}]` : `Q${question.questionNumber}  [${question.questionType}]`, heading: true });

  // Module 2: passage stored as JSON {title, passage, questions:[]}
  if (question.passageText) {
    const m2 = parseReadingM2(question.passageText);
    if (m2) {
      if (m2.title) lines.push({ text: m2.title, bold: true });
      lines.push({ text: m2.passage });
      // The individual question text comes from the embedded questions array (already in question.questionText)
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
      lines.push({ text: `${String.fromCharCode(65 + i)}. ${opt}`, indent: true }));
  }

  if (mode === 'annotated') {
    lines.push({ text: `Answer: ${stringifyAnswer(question.correctAnswer)}` });
    if (question.explanation) lines.push({ text: `Notes: ${question.explanation}` });
    if (question.translationNote) lines.push({ text: `Translation: ${question.translationNote}` });
    if (question.vocabularyNote) lines.push({ text: `Vocabulary: ${question.vocabularyNote}` });
  }
  return lines;
}

function listeningLines(question: TPOQuestion, mode: PdfMode): PdfLine[] {
  const lines: PdfLine[] = [];
  lines.push({ text: `Q${question.questionNumber}  [${question.questionType}]`, heading: true });

  if (question.passageTitle) lines.push({ text: question.passageTitle, bold: true });
  if (question.questionText) lines.push({ text: `Q: ${cleanFillBlanks(question.questionText)}` });

  if (question.passageText) {
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
      lines.push({ text: `${String.fromCharCode(65 + i)}. ${opt}`, indent: true }));
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

function speakingLines(question: TPOQuestion, mode: PdfMode): PdfLine[] {
  const lines: PdfLine[] = [];
  lines.push({ text: `Q${question.questionNumber}  [${question.questionType}]`, heading: true });

  // Question / instruction text
  if (question.questionText) lines.push({ text: question.questionText });

  // Passage (reading passage for integrated tasks)
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

  // Passage title (e.g. academic reading)
  if (question.passageTitle) lines.push({ text: question.passageTitle, bold: true });

  // Words (listen-and-repeat word list)
  if (question.words?.length) lines.push({ text: `Words: ${question.words.join(' / ')}` });

  // Answer options (independent task choices etc.)
  if (question.options?.length) {
    question.options.forEach((opt, i) =>
      lines.push({ text: `${String.fromCharCode(65 + i)}. ${opt}`, indent: true }));
  }

  // Audio / video — short clickable link
  if (question.audioUrl) lines.push({ text: 'Audio (click to listen)', link: question.audioUrl });
  if (question.videoUrl) lines.push({ text: 'Video (click to watch)', link: question.videoUrl });
  // Image — only real http URLs (internal asset paths are meaningless on paper)
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

function writingLines(question: TPOQuestion, mode: PdfMode): PdfLine[] {
  const q = question as TPOQuestion & Record<string, string | string[] | undefined>;
  const lines: PdfLine[] = [];
  lines.push({ text: `Q${question.questionNumber}  [${question.questionType}]`, heading: true });

  // ── Write an Email ──────────────────────────────────────────────────────
  if (question.questionType === 'Write an Email') {
    if (q.emailScenario)     lines.push({ text: q.emailScenario as string });
    if (q.emailInstruction)  lines.push({ text: q.emailInstruction as string, bold: true });
    if (Array.isArray(q.emailBullets) && (q.emailBullets as string[]).length) {
      (q.emailBullets as string[]).forEach(b => lines.push({ text: `• ${b}`, indent: true }));
    }
    if (q.emailTo)      lines.push({ text: `To: ${q.emailTo}` });
    if (q.emailSubject) lines.push({ text: `Subject: ${q.emailSubject}` });

  // ── Academic Discussion ─────────────────────────────────────────────────
  } else if (question.questionType === 'Academic Discussion') {
    if (question.questionText) lines.push({ text: question.questionText });
    if (q.professorName)    lines.push({ text: `Professor: ${q.professorName}`, bold: true });
    if (q.professorMessage) lines.push({ text: q.professorMessage as string, indent: true });
    if (q.student1Name)     lines.push({ text: `${q.student1Name}:`, bold: true });
    if (q.student1Message)  lines.push({ text: q.student1Message as string, indent: true });
    if (q.student2Name)     lines.push({ text: `${q.student2Name}:`, bold: true });
    if (q.student2Message)  lines.push({ text: q.student2Message as string, indent: true });

  // ── Build a Sentence / other ────────────────────────────────────────────
  } else {
    if (question.questionText) lines.push({ text: question.questionText });
    if (question.passageText) {
      const tpl = formatTemplatePassage(question.passageText);
      if (tpl) tpl.forEach(t => lines.push({ text: t }));
      else lines.push({ text: cleanFillBlanks(question.passageText) });
    }
    if (question.words?.length) lines.push({ text: `Words: ${question.words.join(' / ')}` });
    if (question.options?.length) {
      question.options.forEach((opt, i) =>
        lines.push({ text: `${String.fromCharCode(65 + i)}. ${opt}`, indent: true }));
    }
  }

  if (mode === 'annotated') {
    if (question.correctAnswer) lines.push({ text: `Sample Answer: ${stringifyAnswer(question.correctAnswer)}` });
    if (question.explanation)   lines.push({ text: `Notes: ${question.explanation}` });
    if (question.translationNote) lines.push({ text: `Translation: ${question.translationNote}` });
    if (question.vocabularyNote)  lines.push({ text: `Vocabulary: ${question.vocabularyNote}` });
  }
  return lines;
}

function questionLines(question: TPOQuestion, section: TPOSection, mode: PdfMode): PdfLine[] {
  switch (section.sectionType) {
    case 'Reading':  return readingLines(question, mode);
    case 'Listening': return listeningLines(question, mode);
    case 'Speaking': return speakingLines(question, mode);
    case 'Writing':  return writingLines(question, mode);
    default:         return speakingLines(question, mode); // fallback
  }
}

// ── PDF rendering helpers ────────────────────────────────────────────────────

function addWrappedText(pdf: jsPDF, text: string, x: number, y: number, maxWidth: number, lineHeight = 5.5) {
  if (!text?.trim()) return y;
  const lines = pdf.splitTextToSize(text, maxWidth);
  pdf.text(lines, x, y);
  return y + lines.length * lineHeight;
}

function ensureSpace(pdf: jsPDF, y: number, required: number) {
  if (y + required <= 285) return y;
  pdf.addPage();
  return 18;
}

function renderSection(pdf: jsPDF, section: TPOSection, mode: PdfMode, startY: number) {
  let y = ensureSpace(pdf, startY, 16);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(17);
  pdf.text(section.sectionType, 14, y);
  y += 9;

  if (section.instructions) {
    pdf.setFont('helvetica', 'italic');
    pdf.setFontSize(11);
    y = addWrappedText(pdf, section.instructions, 14, y, 182, 6);
    y += 3;
  }

  // Sort questions: Module 1 first, then Module 2
  const isModule2 = (q: TPOQuestion) => (q.questionType || '').toLowerCase().includes('module 2');
  const sortedQuestions = [...section.questions].sort((a, b) => {
    const am = isModule2(a) ? 1 : 0;
    const bm = isModule2(b) ? 1 : 0;
    return am - bm;
  });

  let lastModule = -1;
  for (const question of sortedQuestions) {
    // Print module header when it changes
    const mod = isModule2(question) ? 2 : 1;
    if (mod !== lastModule) {
      y = ensureSpace(pdf, y, 12);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(13);
      pdf.setTextColor(20, 139, 143);
      pdf.text(`Module ${mod}`, 14, y);
      pdf.setTextColor(0, 0, 0);
      y += 8;
      lastModule = mod;
    }

    const lines = questionLines(question, section, mode);
    for (const line of lines) {
      y = ensureSpace(pdf, y, 11);
      const x = line.indent ? 18 : 14;
      const maxW = line.indent ? 178 : 182;

      if (line.link) {
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(12);
        pdf.setTextColor(37, 99, 235);
        pdf.textWithLink(line.text, x, y, { url: line.link });
        pdf.setTextColor(0, 0, 0);
        y += 6.5;
      } else if (line.heading) {
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(13);
        y = addWrappedText(pdf, line.text, x, y, maxW, 7);
      } else if (line.bold) {
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(12);
        y = addWrappedText(pdf, line.text, x, y, maxW, 6.5);
      } else {
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(12);
        y = addWrappedText(pdf, line.text, x, y, maxW, 6.5);
      }
    }
    y += 5; // gap between questions
  }

  return y + 4;
}

// ── Public entry point ───────────────────────────────────────────────────────

export function generateTestPdf(testData: TPOTest, mode: PdfMode) {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const today = new Date();
  const dateText = `${today.getFullYear()}.${String(today.getMonth()+1).padStart(2,'0')}.${String(today.getDate()).padStart(2,'0')}`;

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(18);
  pdf.text(`${testData.testType} ${testData.testNumber}`, 14, 20);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.text(`Generated: ${dateText}`, 14, 28);
  if (testData.year || testData.month) pdf.text(`Exam Date: ${testData.year || '-'} / ${testData.month || '-'}`, 14, 34);
  if (testData.dateMemo) pdf.text(`Memo: ${testData.dateMemo}`, 14, 40);

  let y = 50;
  const orderedSections = [...testData.sections].sort(
    (a, b) => SECTION_ORDER.indexOf(a.sectionType) - SECTION_ORDER.indexOf(b.sectionType)
  );

  for (const section of orderedSections) {
    y = renderSection(pdf, section, mode, y);
  }

  const suffix = mode === 'annotated' ? 'annotated' : 'standard';
  pdf.save(`${testData.testType}-${testData.testNumber}-${suffix}-${dateText}.pdf`);
}
