import jsPDF from 'jspdf';
import type { TPOQuestion, TPOSection, TPOTest } from '../components/ContentManagement';

type PdfMode = 'standard' | 'annotated';

const SECTION_ORDER: Array<TPOSection['sectionType']> = ['Reading', 'Listening', 'Speaking', 'Writing'];

function stringifyAnswer(answer?: string | string[]) {
  if (!answer) return 'N/A';
  return Array.isArray(answer) ? answer.join(', ') : answer;
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

function questionLines(question: TPOQuestion, mode: PdfMode) {
  const lines: string[] = [];
  lines.push(`Q${question.questionNumber}  [${question.questionType}]`);

  if (question.passageTitle) lines.push(`Passage Title: ${question.passageTitle}`);
  if (question.questionText) lines.push(`Question: ${question.questionText}`);
  if (question.passageText) lines.push(`Passage: ${question.passageText}`);
  if (question.words?.length) lines.push(`Words: ${question.words.join(' / ')}`);
  if (question.options?.length) {
    question.options.forEach((option, index) => lines.push(`${String.fromCharCode(65 + index)}. ${option}`));
  }
  if (question.audioUrl) lines.push(`Audio: ${question.audioUrl}`);
  if (question.videoUrl) lines.push(`Video: ${question.videoUrl}`);
  if (question.imageUrl) lines.push(`Image: ${question.imageUrl}`);

  if (mode === 'annotated') {
    lines.push(`Correct Answer: ${stringifyAnswer(question.correctAnswer)}`);
    if (question.explanation) lines.push(`Notes: ${question.explanation}`);
    if (question.translationNote) lines.push(`Translation: ${question.translationNote}`);
    if (question.vocabularyNote) lines.push(`Vocabulary: ${question.vocabularyNote}`);
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
      pdf.setFont('helvetica', line.startsWith('Q') ? 'bold' : 'normal');
      pdf.setFontSize(line.startsWith('Q') ? 11 : 10);
      y = addWrappedText(pdf, line, 14, y, 182, 5);
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