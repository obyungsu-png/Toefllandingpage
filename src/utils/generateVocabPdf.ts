import jsPDF from 'jspdf';
import type { ExtractedVocab, VocabLevel } from './extractVocab';

type VocabPdfMode = 'question' | 'answer' | 'multiple-choice' | 'multiple-choice-answer';

interface PdfOptions {
  testData?: { testType: string; testNumber: string | number };
  level?: VocabLevel | 'ALL';       // 수준 필터 (수능/토플/토익/ALL)
  title?: string;
}

// ── helpers ──────────────────────────────────────────────────────────────────
function ensureSpace(pdf: jsPDF, y: number, required: number): number {
  if (y + required <= 285) return y;
  pdf.addPage();
  return 18;
}

function addWrappedText(pdf: jsPDF, text: string, x: number, y: number, maxWidth: number, lineHeight = 5.5): number {
  if (!text?.trim()) return y;
  const lines = pdf.splitTextToSize(text, maxWidth) as string[];
  for (const line of lines) {
    y = ensureSpace(pdf, y, lineHeight);
    pdf.text(line, x, y);
    y += lineHeight;
  }
  return y;
}

function shuffle<T>(arr: T[], seed: number): T[] {
  const a = [...arr];
  let s = seed;
  const rand = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function filterByLevel(vocab: ExtractedVocab[], level: VocabPdfOptions['level']): ExtractedVocab[] {
  if (!level || level === 'ALL') return vocab;
  return vocab.filter(v => v.level === level);
}

// ──────────────────────────────────────────────────────────────────────────────
// Mode 1: 주관식 문제 (영단어 → 빈칸에 한국어 뜻 쓰기)
// ──────────────────────────────────────────────────────────────────────────────
function renderQuestionPdf(pdf: jsPDF, vocab: ExtractedVocab[], opts: PdfOptions) {
  const today = new Date();
  const dateText = `${today.getFullYear()}.${String(today.getMonth()+1).padStart(2,'0')}.${String(today.getDate()).padStart(2,'0')}`;
  const titlePrefix = opts.testData ? `${opts.testData.testType} ${opts.testData.testNumber}` : 'Vocabulary';
  const levelTag = opts.level && opts.level !== 'ALL' ? ` [${opts.level}]` : '';

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(18);
  pdf.text(`${titlePrefix} — Vocabulary Test${levelTag}`, 14, 20);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.text(`Generated: ${dateText}`, 14, 28);
  pdf.text(`Total Words: ${vocab.length}`, 14, 34);
  pdf.setFontSize(11);
  pdf.text('Instructions: Write the Korean meaning of each English word.', 14, 42);

  let y = 54;
  pdf.setFontSize(12);
  vocab.forEach((v, idx) => {
    y = ensureSpace(pdf, y, 14);
    const num = idx + 1;
    pdf.setFont('helvetica', 'bold');
    pdf.text(`${num}.`, 14, y);
    pdf.setFont('helvetica', 'normal');
    pdf.text(v.word, 22, y);
    // 빈칸 (한국어 뜻 입력)
    pdf.setDrawColor(180);
    pdf.line(70, y + 1, 180, y + 1);
    // 출처 표시 (선택)
    if (v.sourceSections.length > 0) {
      pdf.setFontSize(8);
      pdf.setTextColor(150);
      pdf.text(`(${v.sourceSections.join('/')})`, 182, y);
      pdf.setTextColor(0);
      pdf.setFontSize(12);
    }
    y += 12;
  });

  const fileName = `${titlePrefix}-vocab${levelTag.replace(/[\[\]\s]/g, '') || '-all'}-question-${dateText}.pdf`;
  pdf.save(fileName);
}

// ──────────────────────────────────────────────────────────────────────────────
// Mode 2: 정답 (영단어 + 한국어 뜻 + 영영 정의)
// ──────────────────────────────────────────────────────────────────────────────
function renderAnswerPdf(pdf: jsPDF, vocab: ExtractedVocab[], opts: PdfOptions) {
  const today = new Date();
  const dateText = `${today.getFullYear()}.${String(today.getMonth()+1).padStart(2,'0')}.${String(today.getDate()).padStart(2,'0')}`;
  const titlePrefix = opts.testData ? `${opts.testData.testType} ${opts.testData.testNumber}` : 'Vocabulary';
  const levelTag = opts.level && opts.level !== 'ALL' ? ` [${opts.level}]` : '';

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(18);
  pdf.text(`${titlePrefix} — Vocabulary Answers${levelTag}`, 14, 20);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.text(`Generated: ${dateText}`, 14, 28);
  pdf.text(`Total Words: ${vocab.length}`, 14, 34);

  let y = 46;
  pdf.setFontSize(11);
  vocab.forEach((v, idx) => {
    y = ensureSpace(pdf, y, 18);
    const num = idx + 1;
    pdf.setFont('helvetica', 'bold');
    pdf.text(`${num}. ${v.word}`, 14, y);
    y += 6;

    pdf.setFont('helvetica', 'normal');
    if (v.korean) {
      y = addWrappedText(pdf, `Korean: ${v.korean}`, 22, y, 170, 5.5);
    } else {
      y = addWrappedText(pdf, `Korean: (미등록 — CMS에서 뜻을 입력하세요)`, 22, y, 170, 5.5);
    }
    if (v.definition) {
      y = addWrappedText(pdf, `Definition: ${v.definition}`, 22, y, 170, 5.5);
    }
    if (v.synonyms) {
      y = addWrappedText(pdf, `Synonyms: ${v.synonyms}`, 22, y, 170, 5.5);
    }
    // 출처 및 수준
    y = addWrappedText(pdf, `[${v.level}] · 출처: ${v.sourceSections.join(', ') || '-'} · 빈도: ${v.frequency}`, 22, y, 170, 5);
    y += 4;
  });

  const fileName = `${titlePrefix}-vocab${levelTag.replace(/[\[\]\s]/g, '') || '-all'}-answer-${dateText}.pdf`;
  pdf.save(fileName);
}

// ──────────────────────────────────────────────────────────────────────────────
// Mode 3: 객관식 문제 (영단어 → 4개 보기 중 정답 선택)
// ──────────────────────────────────────────────────────────────────────────────
function renderMultipleChoicePdf(pdf: jsPDF, vocab: ExtractedVocab[], opts: PdfOptions, withAnswer: boolean) {
  const today = new Date();
  const dateText = `${today.getFullYear()}.${String(today.getMonth()+1).padStart(2,'0')}.${String(today.getDate()).padStart(2,'0')}`;
  const titlePrefix = opts.testData ? `${opts.testData.testType} ${opts.testData.testNumber}` : 'Vocabulary';
  const levelTag = opts.level && opts.level !== 'ALL' ? ` [${opts.level}]` : '';
  const modeLabel = withAnswer ? 'MCQ Answers' : 'MCQ Test';

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(18);
  pdf.text(`${titlePrefix} — Vocabulary ${modeLabel}${levelTag}`, 14, 20);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.text(`Generated: ${dateText}`, 14, 28);
  pdf.text(`Total Questions: ${vocab.length}`, 14, 34);
  if (!withAnswer) {
    pdf.setFontSize(11);
    pdf.text('Instructions: Choose the correct Korean meaning for each English word.', 14, 42);
  }

  // 객관식 보기 생성용 풀 — 한국어 뜻이 있는 단어만 사용 (뜻 없으면 주관식으로 폴백)
  const withMeaning = vocab.filter(v => v.korean && v.korean.trim());
  const withoutMeaning = vocab.filter(v => !v.korean || !v.korean.trim());
  const meaningPool = withMeaning.map(v => v.korean!.trim());

  let y = 54;
  pdf.setFontSize(12);

  // 한국어 뜻이 있는 단어 → 객관식
  withMeaning.forEach((v, idx) => {
    y = ensureSpace(pdf, y, 40);
    const num = idx + 1;
    const correct = v.korean!.trim();
    // 오답 보기 3개 (중복 없이)
    const distractors = shuffle(
      meaningPool.filter(m => m !== correct),
      num * 17 + 3
    ).slice(0, 3);
    const options = shuffle([correct, ...distractors], num * 13 + 7);
    const correctIdx = options.indexOf(correct);
    const correctLetter = String.fromCharCode(65 + correctIdx);

    pdf.setFont('helvetica', 'bold');
    pdf.text(`${num}.`, 14, y);
    pdf.setFont('helvetica', 'normal');
    pdf.text(v.word, 22, y);
    if (withAnswer) {
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(20, 139, 143);
      pdf.text(`→ ${correctLetter}`, 80, y);
      pdf.setTextColor(0);
      pdf.setFont('helvetica', 'normal');
    }
    y += 7;

    options.forEach((opt, i) => {
      const letter = String.fromCharCode(65 + i);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`${letter}. ${opt}`, 26, y);
      y += 6;
    });
    y += 4;
  });

  // 한국어 뜻이 없는 단어 → 주관식 폴백
  if (withoutMeaning.length > 0) {
    y = ensureSpace(pdf, y, 14);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(13);
    pdf.setTextColor(20, 139, 143);
    pdf.text('— 뜻 미등록 단어 (주관식) —', 14, y);
    pdf.setTextColor(0);
    y += 10;
    pdf.setFontSize(12);
    withoutMeaning.forEach((v, idx) => {
      const num = withMeaning.length + idx + 1;
      y = ensureSpace(pdf, y, 12);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${num}.`, 14, y);
      pdf.setFont('helvetica', 'normal');
      pdf.text(v.word, 22, y);
      pdf.setDrawColor(180);
      pdf.line(70, y + 1, 180, y + 1);
      y += 10;
    });
  }

  const fileName = `${titlePrefix}-vocab${levelTag.replace(/[\[\]\s]/g, '') || '-all'}-${withAnswer ? 'mcq-answer' : 'mcq-question'}-${dateText}.pdf`;
  pdf.save(fileName);
}

// ─── Public entry point ───────────────────────────────────────────────────────
export function generateVocabPdf(
  vocab: ExtractedVocab[],
  mode: VocabPdfMode,
  options: PdfOptions = {}
) {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const filtered = filterByLevel(vocab, options.level);

  if (filtered.length === 0) {
    alert('해당 수준의 단어가 없습니다.');
    return;
  }

  switch (mode) {
    case 'question':
      renderQuestionPdf(pdf, filtered, options);
      break;
    case 'answer':
      renderAnswerPdf(pdf, filtered, options);
      break;
    case 'multiple-choice':
      renderMultipleChoicePdf(pdf, filtered, options, false);
      break;
    case 'multiple-choice-answer':
      renderMultipleChoicePdf(pdf, filtered, options, true);
      break;
  }
}

export type { VocabPdfMode };
