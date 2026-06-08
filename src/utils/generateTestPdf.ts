import jsPDF from 'jspdf';
import type { TPOQuestion, TPOSection, TPOTest } from '../components/ContentManagement';

type PdfMode = 'standard' | 'annotated';

const SECTION_ORDER: Array<TPOSection['sectionType']> = ['Reading', 'Listening', 'Speaking', 'Writing'];

interface PdfLine {
  text: string;
  link?: string;     // when set, render as a short clickable hyperlink
  heading?: boolean; // the "Q1 [...]" line
}

function stringifyAnswer(answer?: string | string[]) {
  if (!answer) return 'N/A';
  return Array.isArray(answer) ? answer.join(', ') : answer;
}

// Fill-in-the-blank passages are stored with "word[answer:length]" markers
// (e.g. "gu[ides:4]"). On paper we want the natural full word ("guides").
// Same logic as FillBlanksEditor's getPlainFromMarked.
function cleanFillBlanks(text: string) {
  return text.replace(/(\S*?)\[([^\]]+):(\d+)\]/g, (_, prefix, answer) => `${prefix}${answer}`);
}

// "Read in Daily Life" passages are stored as a JSON template
// ({ structure, fields, color }). Render them as clean labelled text
// instead of dumping the raw JSON. Returns null for plain-text passages.
function formatTemplatePassage(passageText: string): string[] | null {
  let parsed: { structure?: string; fields?: Record<string, string> } | null = null;
  try {
    parsed = JSON.parse(passageText);
  } catch {
    return null; // plain text
  }
  if (!parsed || typeof parsed !== 'object' || !parsed.structure || !parsed.fields) return null;

  const f = parsed.fields;
  const out: string[] = [];
  const labelled = (label: string, key: string) => { if (f[key]) out.push(`${label}: ${f[key]}`); };
  const raw = (key: string) => { if (f[key]) out.push(f[key]); };
  const blank = () => { if (out.length) out.push(''); };

  switch (parsed.structure) {
    case 'email':
      labelled('To', 'to');
      labelled('From', 'from');
      labelled('Date', 'date');
      labelled('Subject', 'subject');
      blank();
      raw('body');
      break;
    case 'notice':
      raw('title');
      raw('subtitle');
      blank();
      raw('body');
      break;
    case 'social_media':
      raw('platform');
      raw('username');
      blank();
      raw('content');
      break;
    case 'advertisement':
      raw('headline');
      raw('business');
      raw('offer');
      raw('details');
      raw('location');
      raw('contact');
      break;
    case 'article': {
      raw('source');
      raw('headline');
      const meta = [f.date, f.author].filter(Boolean).join('  |  ');
      if (meta) out.push(meta);
      blank();
      raw('body');
      break;
    }
    case 'form': {
      raw('title');
      raw('company');
      if (f.tableHeaders) out.push(f.tableHeaders.split(',').map(s => s.trim()).join('  |  '));
      if (f.tableRows) {
        f.tableRows.split('\n').filter(r => r.trim()).forEach(r =>
          out.push(r.split(',').map(s => s.trim()).join('  |  ')));
      }
      raw('footer');
      break;
    }
    default:
      Object.entries(f).forEach(([k, v]) => { if (v) out.push(`${k}: ${v}`); });
  }

  return out;
}

function addWrappedText(pdf: jsPDF, text: string, x: number, y: number, maxWidth: number, lineHeight = 6) {
  const lines = pdf.splitTextToSize(text, maxWidth);
  pdf.text(lines, x, y);
  return y + lines.length * lineHeight;
}

function ensureSpace(pdf: jsPDF, y: number, requiredHeight: number) {
  if (y + requiredHeight <= 285) {
    return y;
  }
  pdf.addPage();
  return 18;
}

function questionLines(question: TPOQuestion, mode: PdfMode): PdfLine[] {
  const lines: PdfLine[] = [];
  lines.push({ text: `Q${question.questionNumber}  [${question.questionType}]`, heading: true });

  if (question.passageTitle) lines.push({ text: `Passage Title: ${question.passageTitle}` });
  if (question.questionText) lines.push({ text: `Question: ${cleanFillBlanks(question.questionText)}` });

  if (question.passageText) {
    const template = formatTemplatePassage(question.passageText);
    if (template) {
      lines.push({ text: 'Passage:' });
      template.forEach(t => lines.push({ text: t }));
    } else {
      lines.push({ text: `Passage: ${cleanFillBlanks(question.passageText)}` });
    }
  }

  if (question.words?.length) lines.push({ text: `Words: ${question.words.join(' / ')}` });
  if (question.options?.length) {
    question.options.forEach((option, index) =>
      lines.push({ text: `${String.fromCharCode(65 + index)}. ${option}` }));
  }

  // Audio/video/image: show a short clickable link instead of dumping the
  // full URL. Internal relative asset paths (e.g. /listening-images/..) are
  // omitted since they can't render on paper.
  if (question.audioUrl) lines.push({ text: 'Audio (click to listen)', link: question.audioUrl });
  if (question.videoUrl) lines.push({ text: 'Video (click to watch)', link: question.videoUrl });
  if (question.imageUrl && /^https?:\/\//i.test(question.imageUrl)) {
    lines.push({ text: 'Image (click to view)', link: question.imageUrl });
  }

  if (mode === 'annotated') {
    lines.push({ text: `Correct Answer: ${stringifyAnswer(question.correctAnswer)}` });
    if (question.explanation) lines.push({ text: `Notes: ${question.explanation}` });
    if (question.translationNote) lines.push({ text: `Translation: ${question.translationNote}` });
    if (question.vocabularyNote) lines.push({ text: `Vocabulary: ${question.vocabularyNote}` });
  }

  return lines;
}

function renderSection(pdf: jsPDF, section: TPOSection, mode: PdfMode, startY: number) {
  let y = ensureSpace(pdf, startY, 16);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(16);
  pdf.text(section.sectionType, 14, y);
  y += 8;

  if (section.instructions) {
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    y = addWrappedText(pdf, `Instructions: ${section.instructions}`, 14, y, 182, 5);
    y += 2;
  }

  for (const question of section.questions) {
    const lines = questionLines(question, mode);
    for (const line of lines) {
      y = ensureSpace(pdf, y, 10);
      if (line.link) {
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(10);
        pdf.setTextColor(37, 99, 235); // blue, so it reads as a link
        pdf.textWithLink(line.text, 14, y, { url: line.link });
        pdf.setTextColor(0, 0, 0);
        y += 5;
      } else {
        pdf.setFont('helvetica', line.heading ? 'bold' : 'normal');
        pdf.setFontSize(line.heading ? 11 : 10);
        y = addWrappedText(pdf, line.text, 14, y, 182, 5);
      }
    }
    y += 4;
  }

  return y + 4;
}

export function generateTestPdf(testData: TPOTest, mode: PdfMode) {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const today = new Date();
  const dateText = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, '0')}.${String(today.getDate()).padStart(2, '0')}`;

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(18);
  pdf.text(`${testData.testType} ${testData.testNumber}`, 14, 20);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.text(`Generated: ${dateText}`, 14, 28);
  if (testData.year || testData.month) {
    pdf.text(`Exam Date: ${testData.year || '-'} / ${testData.month || '-'}`, 14, 34);
  }
  if (testData.dateMemo) {
    pdf.text(`Memo: ${testData.dateMemo}`, 14, 40);
  }

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