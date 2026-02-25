import { useState, useMemo, useEffect } from 'react';
import { motion } from 'motion/react';
import { BookOpen, Download, FileText, Play, ChevronRight, Check, ArrowLeft, X } from 'lucide-react';
import { Button } from './ui/button';
import { SATWord } from './vocaWordSets';
import { SATVocaTest } from './SATVocaTest';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun, WidthType, AlignmentType, BorderStyle, HeadingLevel, PageBreak } from 'docx';
import fileSaver from 'file-saver';
const saveAs = fileSaver.saveAs || fileSaver;
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface VocabularyDay {
  id: number;
  name: string;
}

interface SATVocaPageProps {
  testType?: 'SAT' | 'ACT';
  onBack?: () => void;
  onSaveResult?: (result: any) => void;
}

export function SATVocaPage({ testType = 'SAT', onBack, onSaveResult }: SATVocaPageProps) {
  const themeColor = testType === 'ACT' ? '#10B981' : '#3D5AA1';
  const serverUrl = `https://${projectId}.supabase.co/functions/v1/make-server-e46cd33a`;
  
  const [activeTab, setActiveTab] = useState<'toefl-easy' | 'toefl-hard' | 'custom' | 'etymology'>('toefl-easy');
  const [step, setStep] = useState(1);
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [selectedWords, setSelectedWords] = useState<SATWord[]>([]);
  
  // Words and days from Supabase
  const [wordsFromDB, setWordsFromDB] = useState<SATWord[]>([]);
  const [daysFromDB, setDaysFromDB] = useState<VocabularyDay[]>([]);
  const [loadingWords, setLoadingWords] = useState(false);
  const [loadingDays, setLoadingDays] = useState(false);
  
  // Question counts for different types
  const [engToKorTableCount, setEngToKorTableCount] = useState(0);
  const [engToKorSynonymCount, setEngToKorSynonymCount] = useState(0);
  const [korToEngTableCount, setKorToEngTableCount] = useState(0);
  const [korToEngSynonymCount, setKorToEngSynonymCount] = useState(0);
  const [toeflDefinitionCount, setToeflDefinitionCount] = useState(0);
  
  const [showTest, setShowTest] = useState(false);
  const [testTypeSelection, setTestTypeSelection] = useState<'multiple' | 'subjective' | 'mixed' | 'flashcard'>('multiple');
  const [showTestTypeModal, setShowTestTypeModal] = useState(false);
  const [showWordDownloadModal, setShowWordDownloadModal] = useState(false);
  const [showPdfDownloadModal, setShowPdfDownloadModal] = useState(false);
  const [questionFormat, setQuestionFormat] = useState<'eng_to_kor' | 'kor_to_eng' | 'definition_to_eng'>('eng_to_kor');
  const [subjectiveFormat, setSubjectiveFormat] = useState<'kor_to_eng' | 'definition_to_eng'>('kor_to_eng');

  // Health check on mount
  useEffect(() => {
    const checkServerHealth = async () => {
      try {
        console.log('[Health Check] Checking server at:', `${serverUrl}/health`);
        const response = await fetch(`${serverUrl}/health`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          }
        });
        const data = await response.json();
        console.log('[Health Check] Server response:', data);
      } catch (error) {
        console.error('[Health Check] Server not responding:', error);
      }
    };
    
    checkServerHealth();
  }, []);

  // Fetch days from Supabase when activeTab changes
  useEffect(() => {
    const fetchDays = async () => {
      setLoadingDays(true);
      try {
        console.log(`[Fetch Days] Fetching from: ${serverUrl}/vocabulary-days/${activeTab}`);
        const response = await fetch(`${serverUrl}/vocabulary-days/${activeTab}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json'
          }
        });

        console.log(`[Fetch Days] Response status: ${response.status}`);

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`[Fetch Days] Error response:`, errorText);
          throw new Error(`Failed to fetch days: ${response.status} ${errorText}`);
        }

        const data = await response.json();
        console.log(`[Fetch Days] Success! Days count: ${data.days?.length || 0}`);
        setDaysFromDB(data.days || []);
      } catch (error) {
        console.error('Error fetching days:', error);
        console.error('Error details:', error instanceof Error ? error.message : String(error));
        // Fallback to default 50 days
        setDaysFromDB(Array.from({ length: 50 }, (_, i) => ({
          id: i + 1,
          name: `DAY ${i + 1}`
        })));
      } finally {
        setLoadingDays(false);
      }
    };

    fetchDays();
  }, [activeTab]);

  // Fetch words from Supabase when activeTab changes
  useEffect(() => {
    const fetchWords = async () => {
      setLoadingWords(true);
      try {
        console.log(`[Fetch Words] Fetching from: ${serverUrl}/vocabulary/${activeTab}`);
        
        // Add timeout to prevent hanging
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        const response = await fetch(`${serverUrl}/vocabulary/${activeTab}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json'
          },
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        console.log(`[Fetch Words] Response status: ${response.status}`);

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`[Fetch Words] Error response:`, errorText);
          throw new Error(`Failed to fetch words: ${response.status} ${errorText}`);
        }

        const data = await response.json();
        console.log(`[Fetch Words] Success! Words count: ${data.words?.length || 0}`);
        setWordsFromDB(data.words || []);
      } catch (error) {
        if (error.name === 'AbortError') {
          console.error('Error fetching words: Request timeout');
          console.error('Error details: The request took too long and was aborted');
        } else {
          console.error('Error fetching words:', error);
          console.error('Error details:', error instanceof Error ? error.message : String(error));
        }
        // Set empty array on error instead of keeping old data
        setWordsFromDB([]);
      } finally {
        setLoadingWords(false);
      }
    };

    fetchWords();
  }, [activeTab]);

  // Calculate available words based on selected days
  const availableWords = useMemo(() => {
    const words: SATWord[] = [];
    
    if (activeTab === 'custom' || activeTab === 'etymology') {
      // For custom and etymology, filter by dayNumber field
      selectedDays.forEach(dayId => {
        const dayWords = wordsFromDB.filter((word: any) => word.dayNumber === dayId);
        words.push(...dayWords);
      });
    } else {
      // For TOEFL tabs, use index-based slicing
      const wordsPerDay = activeTab === 'toefl-hard' ? 60 : 40;
      selectedDays.forEach(dayId => {
        const startIndex = (dayId - 1) * wordsPerDay;
        const endIndex = startIndex + wordsPerDay;
        const dayWords = wordsFromDB.slice(startIndex, endIndex);
        words.push(...dayWords);
      });
    }
    
    return words;
  }, [selectedDays, wordsFromDB, activeTab]);
  
  // Calculate word count for each day
  const getWordCountForDay = useMemo(() => {
    const wordCountMap: { [dayId: number]: number } = {};
    
    if (activeTab === 'custom' || activeTab === 'etymology') {
      // For custom and etymology, count by dayNumber field
      daysFromDB.forEach(day => {
        const dayWords = wordsFromDB.filter((word: any) => word.dayNumber === day.id);
        wordCountMap[day.id] = dayWords.length;
      });
    } else {
      // For TOEFL tabs, use index-based counting
      const wordsPerDay = activeTab === 'toefl-hard' ? 60 : 40;
      daysFromDB.forEach(day => {
        const startIndex = (day.id - 1) * wordsPerDay;
        const endIndex = startIndex + wordsPerDay;
        const dayWords = wordsFromDB.slice(startIndex, endIndex);
        wordCountMap[day.id] = dayWords.length;
      });
    }
    
    return wordCountMap;
  }, [wordsFromDB, daysFromDB, activeTab]);

  // Calculate max counts for headwords and synonyms
  const maxCounts = useMemo(() => {
    // All words are headwords (표제어)
    const totalHeadwords = availableWords.length;
    
    // Count total number of individual synonyms (not words with synonyms, but actual synonym count)
    let totalSynonyms = 0;
    availableWords.forEach(word => {
      if (word.synonyms && word.synonyms.trim().length > 0) {
        // Split by comma and count
        const synonymList = word.synonyms.split(',').map(s => s.trim()).filter(s => s.length > 0);
        totalSynonyms += synonymList.length;
      }
    });
    
    return {
      headwords: totalHeadwords,
      synonyms: totalSynonyms
    };
  }, [availableWords]);

  // Calculate total questions
  const totalQuestions = useMemo(() => {
    return engToKorTableCount + engToKorSynonymCount + 
           korToEngTableCount + korToEngSynonymCount + toeflDefinitionCount;
  }, [engToKorTableCount, engToKorSynonymCount, korToEngTableCount, korToEngSynonymCount, toeflDefinitionCount]);

  // Calculate maximum total questions available
  const maxTotalQuestions = maxCounts.headwords + maxCounts.synonyms;

  // Calculate headword and synonym question counts separately
  const headwordQuestions = useMemo(() => {
    return engToKorTableCount + korToEngTableCount + toeflDefinitionCount;
  }, [engToKorTableCount, korToEngTableCount, toeflDefinitionCount]);

  const synonymQuestions = useMemo(() => {
    return engToKorSynonymCount + korToEngSynonymCount;
  }, [engToKorSynonymCount, korToEngSynonymCount]);

  // Toggle day selection
  const toggleDay = (dayId: number) => {
    setSelectedDays(prev => {
      const newDays = prev.includes(dayId) 
        ? prev.filter(d => d !== dayId)
        : [...prev, dayId].sort((a, b) => a - b);
      
      // Reset all counts when selection changes
      if (newDays.length === 0) {
        setEngToKorTableCount(0);
        setKorToEngTableCount(0);
        setEngToKorSynonymCount(0);
        setKorToEngSynonymCount(0);
        setToeflDefinitionCount(0);
      }
      
      return newDays;
    });
  };

  // Proceed to Step 2
  const proceedToStep2 = () => {
    if (selectedDays.length === 0) {
      alert('최소 1개 이상의 DAY를 선택해주세요.');
      return;
    }
    if (totalQuestions === 0) {
      alert('최소 1개 이상의 문제를 출제해주세요.');
      return;
    }
    
    // Check if headword questions exceed available headwords
    if (headwordQuestions > maxCounts.headwords) {
      alert(`표제어 문제는 최대 ${maxCounts.headwords}개까지만 출제할 수 있습니다.`);
      return;
    }
    
    // Check if synonym questions exceed available synonyms
    if (synonymQuestions > maxCounts.synonyms) {
      alert(`동의어 문제는 최대 ${maxCounts.synonyms}개까지만 출제할 수 있습니다.`);
      return;
    }

    // Build question pool
    const headwordPool: SATWord[] = [];
    const synonymPool: SATWord[] = [];
    
    // Shuffle available words
    const shuffledWords = [...availableWords].sort(() => Math.random() - 0.5);
    
    // Extract headwords up to headwordQuestions
    for (let i = 0; i < shuffledWords.length && headwordPool.length < headwordQuestions; i++) {
      headwordPool.push(shuffledWords[i]);
    }
    
    // Extract synonyms up to synonymQuestions
    for (let i = 0; i < shuffledWords.length && synonymPool.length < synonymQuestions; i++) {
      const word = shuffledWords[i];
      if (word.synonyms && word.synonyms.trim().length > 0) {
        const synonymList = word.synonyms.split(',').map(s => s.trim()).filter(s => s.length > 0);
        for (const synonym of synonymList) {
          if (synonymPool.length >= synonymQuestions) break;
          // Create a synonym question object
          synonymPool.push({
            english: synonym,
            korean: word.korean,
            definition: word.definition,
            synonyms: word.synonyms,
            isSynonym: true,
            parentWord: word.english
          });
        }
      }
    }
    
    // Combine and shuffle all questions
    const allQuestions = [...headwordPool, ...synonymPool].sort(() => Math.random() - 0.5);
    setSelectedWords(allQuestions);
    setStep(2);
  };

  // Proceed to Step 3
  const proceedToStep3 = () => {
    setStep(3);
  };

  // Start test
  const handleStartTest = () => {
    setShowTestTypeModal(true);
  };

  const confirmTestType = () => {
    setShowTestTypeModal(false);
    setShowTest(true);
  };

  // Download PDF - show modal
  const handleDownloadPDF = () => {
    setShowPdfDownloadModal(true);
  };

  // Download Word - show modal
  const handleDownloadWord = () => {
    setShowWordDownloadModal(true);
  };

  // Generate Word document
  const generateWordDocument = async (mode: 'test' | 'answer' | 'both') => {
    const today = new Date();
    const dateStr = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, '0')}.${String(today.getDate()).padStart(2, '0')}`;
    const totalWords = selectedWords.length;
    
    // Fill left column first (30 words), then right column with remainder
    const ROWS_PER_COL = 30;
    const leftWords = selectedWords.slice(0, ROWS_PER_COL);
    const rightWords = selectedWords.slice(ROWS_PER_COL);
    const maxRows = ROWS_PER_COL;

    // Create header section
    const headerParagraphs: Paragraph[] = [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 80 },
        children: [
          new TextRun({ text: dateStr, size: 18, color: '666666' })
        ]
      }),
    ];

    // Create name/score box as a table
    const nameScoreTable = new Table({
      width: { size: 3000, type: WidthType.DXA },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 3000, type: WidthType.DXA },
              margins: { top: 30, bottom: 30, left: 60, right: 60 },
              children: [new Paragraph({ children: [new TextRun({ text: '이름', size: 18 })] })],
              borders: {
                top: { style: BorderStyle.SINGLE, size: 1, color: '999999' },
                bottom: { style: BorderStyle.SINGLE, size: 1, color: '999999' },
                left: { style: BorderStyle.SINGLE, size: 1, color: '999999' },
                right: { style: BorderStyle.SINGLE, size: 1, color: '999999' },
              }
            })
          ]
        }),
        new TableRow({
          children: [
            new TableCell({
              width: { size: 3000, type: WidthType.DXA },
              margins: { top: 30, bottom: 30, left: 60, right: 60 },
              children: [new Paragraph({ children: [
                new TextRun({ text: '맞은 개수       ', size: 18 }),
                new TextRun({ text: `/ ${totalWords}`, size: 18 })
              ] })],
              borders: {
                top: { style: BorderStyle.SINGLE, size: 1, color: '999999' },
                bottom: { style: BorderStyle.SINGLE, size: 1, color: '999999' },
                left: { style: BorderStyle.SINGLE, size: 1, color: '999999' },
                right: { style: BorderStyle.SINGLE, size: 1, color: '999999' },
              }
            })
          ]
        })
      ]
    });

    // Instruction
    const instructionParagraph = new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 120, after: 120 },
      children: [
        new TextRun({ 
          text: `(1~${totalWords}) ※ 왼쪽 영어 단어에 어울리는 한글 뜻을 작성해보세요.`, 
          size: 16, 
          color: '3D5AA1',
          bold: true
        })
      ]
    });

    // Build the main vocabulary table - full A4 page width
    const tableRows: TableRow[] = [];

    // A4 usable width with 0.5" margins ≈ 9400 DXA
    const numColW = 500;
    const engColW = 2100;
    const korColW = 2100;
    const totalTableW = 2 * (numColW + engColW + korColW);

    const cellBorders = {
      top: { style: BorderStyle.SINGLE, size: 1, color: 'DDDDDD' },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: 'DDDDDD' },
      left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    };
    // ~13000 DXA available for table / 30 rows ≈ 433 DXA per row
    const cellMargin = { top: 85, bottom: 85, left: 60, right: 60 };

    for (let i = 0; i < maxRows; i++) {
      const leftWord = leftWords[i] || null;
      const rightWord = rightWords[i] || null;
      const leftNum = leftWord ? String(i + 1) : '';
      const rightNum = rightWord ? String(ROWS_PER_COL + i + 1) : '';

      const cells: TableCell[] = [
        new TableCell({
          width: { size: numColW, type: WidthType.DXA },
          margins: cellMargin,
          verticalAlign: 'center' as any,
          children: [new Paragraph({ children: [new TextRun({ text: leftNum, size: 18, color: '888888' })] })],
          borders: cellBorders,
        }),
        new TableCell({
          width: { size: engColW, type: WidthType.DXA },
          margins: cellMargin,
          verticalAlign: 'center' as any,
          children: [new Paragraph({ children: [new TextRun({ text: leftWord ? leftWord.english : '', size: 18, bold: true })] })],
          borders: cellBorders,
        }),
        new TableCell({
          width: { size: korColW, type: WidthType.DXA },
          margins: cellMargin,
          verticalAlign: 'center' as any,
          children: [new Paragraph({ children: mode === 'answer' || mode === 'both'
            ? [new TextRun({ text: leftWord ? leftWord.korean : '', size: 18, color: mode === 'both' ? 'FF0000' : '000000' })]
            : [new TextRun({ text: '', size: 18 })]
          })],
          borders: cellBorders,
        }),
        new TableCell({
          width: { size: numColW, type: WidthType.DXA },
          margins: cellMargin,
          verticalAlign: 'center' as any,
          children: [new Paragraph({ children: [new TextRun({ text: rightNum, size: 18, color: '888888' })] })],
          borders: cellBorders,
        }),
        new TableCell({
          width: { size: engColW, type: WidthType.DXA },
          margins: cellMargin,
          verticalAlign: 'center' as any,
          children: [new Paragraph({ children: [new TextRun({ text: rightWord ? rightWord.english : '', size: 18, bold: true })] })],
          borders: cellBorders,
        }),
        new TableCell({
          width: { size: korColW, type: WidthType.DXA },
          margins: cellMargin,
          verticalAlign: 'center' as any,
          children: [new Paragraph({ children: mode === 'answer' || mode === 'both'
            ? [new TextRun({ text: rightWord ? rightWord.korean : '', size: 18, color: mode === 'both' ? 'FF0000' : '000000' })]
            : [new TextRun({ text: '', size: 18 })]
          })],
          borders: cellBorders,
        }),
      ];

      tableRows.push(new TableRow({ children: cells }));
    }

    const vocabTable = new Table({
      width: { size: totalTableW, type: WidthType.DXA },
      rows: tableRows,
    });

    const doc = new Document({
      sections: [{
        properties: {
          page: {
            margin: { top: 720, bottom: 720, left: 720, right: 720 },
          }
        },
        children: [
          ...headerParagraphs,
          nameScoreTable,
          instructionParagraph,
          vocabTable
        ]
      }]
    });

    const blob = await Packer.toBlob(doc);
    const fileName = mode === 'test' ? '시험지' : mode === 'answer' ? '답안지' : '시험지_답안지';
    saveAs(blob, `TOEFL_어휘_${fileName}_${dateStr}.docx`);
    setShowWordDownloadModal(false);
  };

  // Generate PDF document using html2canvas for Korean support
  const generatePdfDocument = async (mode: 'test' | 'answer' | 'both') => {
    const today = new Date();
    const dateStr = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, '0')}.${String(today.getDate()).padStart(2, '0')}`;
    const totalWords = selectedWords.length;

    // Fill left column first (30 words), then right column with remainder
    const PDF_ROWS_PER_COL = 30;
    const leftWords = selectedWords.slice(0, PDF_ROWS_PER_COL);
    const rightWords = selectedWords.slice(PDF_ROWS_PER_COL);
    const maxRows = PDF_ROWS_PER_COL;

    const answerColor = mode === 'both' ? '#FF0000' : '#000000';
    const modeLabel = mode === 'test' ? '시험지' : mode === 'answer' ? '답안지' : '시험지·답안지 (답안 빨간색)';
    const instructionText = mode === 'test'
      ? `(1~${totalWords}) ※ 왼쪽 영어 단어에 어울리는 한글 뜻을 작성해보세요.`
      : mode === 'answer'
      ? `(1~${totalWords}) ※ 답안지`
      : `(1~${totalWords}) ※ 시험지 + 답안지 (답안은 빨간색)`;

    // Build HTML table - full A4 width, 30 rows to fill the page
    // A4 at 96dpi ≈ 794x1123px. Container 760px with 17px padding each side.
    // Row height: (1123 - header ~90px) / 30 ≈ 34px → padding 9px top/bottom + 13px font
    let tableRows = '';
    for (let i = 0; i < maxRows; i++) {
      const lw = leftWords[i] || null;
      const rw = rightWords[i] || null;
      const leftNum = lw ? i + 1 : '';
      const rightNum = rw ? PDF_ROWS_PER_COL + i + 1 : '';
      const leftEng = lw ? lw.english : '';
      const leftKor = lw ? (mode === 'test' ? '' : lw.korean) : '';
      const rightEng = rw ? rw.english : '';
      const rightKor = rw ? (mode === 'test' ? '' : rw.korean) : '';
      tableRows += `<tr>
        <td style="width:5%;text-align:center;padding:9px 4px;border-bottom:1px solid #ddd;font-size:13px;color:#888">${leftNum}</td>
        <td style="width:22%;padding:9px 10px;border-bottom:1px solid #ddd;font-size:13px;font-weight:bold">${leftEng}</td>
        <td style="width:23%;padding:9px 10px;border-bottom:1px solid #ddd;font-size:13px;color:${answerColor}">${leftKor}</td>
        <td style="width:5%;text-align:center;padding:9px 4px;border-bottom:1px solid #ddd;font-size:13px;color:#888">${rightNum}</td>
        <td style="width:22%;padding:9px 10px;border-bottom:1px solid #ddd;font-size:13px;font-weight:bold">${rightEng}</td>
        <td style="width:23%;padding:9px 10px;border-bottom:1px solid #ddd;font-size:13px;color:${answerColor}">${rightKor}</td>
      </tr>`;
    }

    const htmlContent = `
      <div style="width:760px;padding:20px 17px;font-family:'Malgun Gothic','맑은 고딕','Apple SD Gothic Neo','Noto Sans KR',sans-serif;background:#fff">
        <div style="text-align:center;color:#666;font-size:11px;margin-bottom:8px">${dateStr}</div>
        <table style="border:1px solid #999;border-collapse:collapse;margin-bottom:10px">
          <tr><td style="border:1px solid #999;padding:5px 12px;font-size:12px;width:200px">이름</td></tr>
          <tr><td style="border:1px solid #999;padding:5px 12px;font-size:12px">맞은 개수&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;/ ${totalWords}</td></tr>
        </table>
        <div style="text-align:center;color:#3D5AA1;font-size:12px;font-weight:bold;margin-bottom:8px">
          ${instructionText}
        </div>
        <table style="width:100%;border-collapse:collapse;border-top:1px solid #ddd">
          <tbody>${tableRows}</tbody>
        </table>
      </div>
    `;

    // Use iframe to isolate from page styles (avoids oklch color parse errors)
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;left:-9999px;top:0;width:800px;height:1200px;border:none;visibility:hidden;';
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentDocument || iframe.contentWindow!.document;
    iframeDoc.open();
    iframeDoc.write(`<!DOCTYPE html><html><head><style>*{margin:0;padding:0;box-sizing:border-box;}</style></head><body>${htmlContent}</body></html>`);
    iframeDoc.close();

    try {
      const targetEl = iframeDoc.body.firstElementChild as HTMLElement;
      const canvas = await html2canvas(targetEl, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        windowWidth: 800,
        windowHeight: targetEl.scrollHeight + 100,
      });

      const imgData = canvas.toDataURL('image/png');
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      
      // Force fit on single A4 page: 210x297mm, 5mm margins all around
      const marginX = 5;
      const marginY = 5;
      const maxW = 210 - marginX * 2;
      const maxH = 297 - marginY * 2;
      const aspectRatio = canvas.width / canvas.height;
      let imgWidth = maxW;
      let imgHeight = imgWidth / aspectRatio;
      if (imgHeight > maxH) {
        imgHeight = maxH;
        imgWidth = imgHeight * aspectRatio;
      }
      const offsetX = (210 - imgWidth) / 2;
      const offsetY = marginY;
      doc.addImage(imgData, 'PNG', offsetX, offsetY, imgWidth, imgHeight);

      const fileName = mode === 'test' ? '시험지' : mode === 'answer' ? '답안지' : '시험지_답안지';
      doc.save(`TOEFL_어휘_${fileName}_${dateStr}.pdf`);
    } finally {
      document.body.removeChild(iframe);
    }
    setShowPdfDownloadModal(false);
  };

  if (showTest) {
    return (
      <SATVocaTest
        testInfo={{
          type: 'sat_vocabulary',
          testType: testTypeSelection,
          questionFormat: testTypeSelection === 'multiple' ? questionFormat : undefined,
          subjectiveFormat: testTypeSelection === 'subjective' ? subjectiveFormat : undefined,
          words: selectedWords,
          totalQuestions: selectedWords.length,
          themeColor,
          selectedDays: testTypeSelection === 'mixed' ? selectedDays : undefined,
          wordsFromDB: testTypeSelection === 'mixed' ? wordsFromDB : undefined
        }}
        onExit={() => setShowTest(false)}
        onSaveResult={onSaveResult}
      />
    );
  }

  return (
    <div className="min-h-screen bg-white p-8 pb-24 md:pb-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            {onBack && (
              <button
                onClick={onBack}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 hover:bg-gray-50 transition-all"
                style={{ borderColor: themeColor, color: themeColor }}
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="font-bold">돌아가기</span>
              </button>
            )}
          </div>
          <h1 className="text-2xl md:text-4xl font-bold mb-2" style={{ color: themeColor }}>
            어휘 학습
          </h1>
          <p className="text-sm md:text-base text-gray-600 mb-6">
            체계적인 어휘 학습 시스템
          </p>
          
          {/* Tabs */}
          <div className="flex gap-2 border-b-2 border-gray-200">
            <button
              onClick={() => {
                setActiveTab('toefl-easy');
                setStep(1);
                setSelectedDays([]);
                setSelectedWords([]);
              }}
              className={`px-6 py-3 font-bold transition-all ${
                activeTab === 'toefl-easy'
                  ? 'border-b-4 -mb-0.5'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              style={{
                borderColor: activeTab === 'toefl-easy' ? themeColor : 'transparent',
                color: activeTab === 'toefl-easy' ? themeColor : undefined
              }}
            >
              <span className="hidden sm:inline">TOEFL 어휘 학습 vol.1</span>
              <span className="sm:hidden">어휘 vol.1</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('toefl-hard');
                setStep(1);
                setSelectedDays([]);
                setSelectedWords([]);
              }}
              className={`px-6 py-3 font-bold transition-all ${
                activeTab === 'toefl-hard'
                  ? 'border-b-4 -mb-0.5'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              style={{
                borderColor: activeTab === 'toefl-hard' ? themeColor : 'transparent',
                color: activeTab === 'toefl-hard' ? themeColor : undefined
              }}
            >
              <span className="hidden sm:inline">TOEFL 어휘 학습 vol.2</span>
              <span className="sm:hidden">어휘 vol.2</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('etymology');
                setStep(1);
                setSelectedDays([]);
                setSelectedWords([]);
              }}
              className={`px-6 py-3 font-bold transition-all ${
                activeTab === 'etymology'
                  ? 'border-b-4 -mb-0.5'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              style={{
                borderColor: activeTab === 'etymology' ? themeColor : 'transparent',
                color: activeTab === 'etymology' ? themeColor : undefined
              }}
            >
              <span className="hidden sm:inline">기출단어</span>
              <span className="sm:hidden">기출</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('custom');
                setStep(1);
                setSelectedDays([]);
                setSelectedWords([]);
              }}
              className={`px-6 py-3 font-bold transition-all ${
                activeTab === 'custom'
                  ? 'border-b-4 -mb-0.5'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              style={{
                borderColor: activeTab === 'custom' ? themeColor : 'transparent',
                color: activeTab === 'custom' ? themeColor : undefined
              }}
            >
              <span className="hidden sm:inline">참고서 영단어</span>
              <span className="sm:hidden">참고서</span>
            </button>
          </div>
        </div>

        {/* Tab Description */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800">
            {activeTab === 'toefl-easy' 
              ? '50일, 1,500개 TOEFL 필수 어휘를 마스터하세요. (vol.1)' 
              : activeTab === 'toefl-hard'
              ? '50일, 1,500개 TOEFL 고급 어휘를 마스터하요. (vol.2)'
              : activeTab === 'custom'
              ? 'CMS에서 추가한 참고서 영단어로 학습하세요.'
              : 'CMS에서 추가한 기출 단어로 학습하세요.'}
          </p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center mb-12">
          {[1, 2, 3].map((stepNum) => (
            <div key={stepNum} className="flex items-center">
              <div className={`flex items-center justify-center w-12 h-12 rounded-full font-bold transition-all ${
                step >= stepNum 
                  ? 'text-white' 
                  : 'bg-gray-200 text-gray-400'
              }`}
              style={step >= stepNum ? { backgroundColor: themeColor } : {}}
              >
                {step > stepNum ? <Check className="w-6 h-6" /> : stepNum}
              </div>
              {stepNum < 3 && (
                <div className={`w-24 h-1 mx-2 ${
                  step > stepNum ? 'bg-opacity-100' : 'bg-gray-200'
                }`}
                style={step > stepNum ? { backgroundColor: themeColor } : {}}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: DAY Selection and Question Count - ALL TABS */}
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-lg p-4 md:p-8"
          >
            <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6" style={{ color: themeColor }}>
              1단계: DAY 선택
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Panel - DAY Selection */}
              <div>
                {/* Range input - Hidden on mobile */}
                <div className="mb-4 hidden md:block">
                  <label className="text-sm text-gray-600 mb-2 block">
                    출제범위 (예시 : 1-2)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="예시) 1-2"
                      className="flex-1 px-4 py-2 border-2 rounded-lg focus:outline-none"
                      style={{ borderColor: '#e5e7eb' }}
                    />
                    <button
                      className="px-6 py-2 rounded-lg text-white font-bold"
                      style={{ backgroundColor: '#10B981' }}
                    >
                      선택
                    </button>
                    <button
                      className="px-6 py-2 rounded-lg border-2 font-bold"
                      style={{ borderColor: '#e5e7eb', color: '#6b7280' }}
                      onClick={() => setSelectedDays([])}
                    >
                      전체선택
                    </button>
                  </div>
                </div>

                {/* Mobile: Horizontal scroll DAY selection */}
                <div className="md:hidden mb-4">
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide" style={{ 
                    WebkitOverflowScrolling: 'touch',
                    scrollBehavior: 'smooth'
                  }}>
                    {daysFromDB.map(day => (
                      <button
                        key={day.id}
                        onClick={() => toggleDay(day.id)}
                        className="px-4 py-2 rounded-lg font-bold whitespace-nowrap flex-shrink-0 transition-all shadow-sm touch-manipulation"
                        style={{
                          backgroundColor: selectedDays.includes(day.id) ? '#10B981' : 'white',
                          color: selectedDays.includes(day.id) ? 'white' : '#374151',
                          border: `2px solid ${selectedDays.includes(day.id) ? '#10B981' : '#e5e7eb'}`
                        }}
                      >
                        {day.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Desktop: Scrollable DAY List */}
                <div className="border-2 rounded-lg overflow-hidden hidden md:block" style={{ borderColor: '#e5e7eb' }}>
                  <div className="max-h-[600px] overflow-y-auto">
                    {daysFromDB.map(day => (
                      <button
                        key={day.id}
                        onClick={() => toggleDay(day.id)}
                        className="w-full px-6 py-4 text-left border-b transition-all flex items-center gap-4 hover:bg-teal-50 hover:border-teal-200 hover:shadow-sm group"
                        style={{
                          backgroundColor: selectedDays.includes(day.id) ? '#f0fdf4' : 'white',
                          borderColor: selectedDays.includes(day.id) ? '#10B981' : '#e5e7eb'
                        }}
                      >
                        <span className="text-gray-400 text-lg w-6 group-hover:text-teal-600 transition-colors">{day.id}</span>
                        <span className="font-bold text-lg group-hover:text-teal-700 transition-colors">{day.name}</span>
                        <span className="text-gray-400 group-hover:text-teal-500 transition-colors">
                          {(activeTab === 'custom' || activeTab === 'etymology') 
                            ? `(${getWordCountForDay[day.id] || 0}개)` 
                            : activeTab === 'toefl-hard'
                            ? '(60개)'
                            : '(40개)'}
                        </span>
                        <div className="ml-auto flex items-center gap-2">
                          <div 
                            className={`w-6 h-6 rounded-full border-2 transition-all ${
                              selectedDays.includes(day.id) 
                                ? 'bg-green-500 border-green-500' 
                                : 'bg-white border-gray-300'
                            }`}
                          >
                            {selectedDays.includes(day.id) && (
                              <Check className="w-4 h-4 text-white m-auto mt-0.5" />
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Panel - Question Count Settings */}
              <div>
                {/* Total Count Display */}
                <div className="rounded-xl p-6 mb-6 text-center border-2 shadow-lg" style={{ backgroundColor: '#3B4A8C', borderColor: '#2d3a6e' }}>
                  <p className="text-sm font-bold mb-2 text-blue-100">출제 가능 문제수</p>
                  <p className="text-5xl font-bold mb-1 text-white">
                    {maxCounts.headwords + maxCounts.synonyms}
                  </p>
                  <p className="text-lg font-bold text-blue-100">
                    문제
                  </p>
                  <div className="mt-3 pt-3 border-t border-blue-300">
                    <p className="text-sm font-bold text-white">
                      표제어 <span className="text-lg">{maxCounts.headwords}</span> / 동의어 <span className="text-lg">{maxCounts.synonyms}</span>
                    </p>
                  </div>
                </div>

                {/* Question Types */}
                <div className="space-y-6">
                  <h3 className="font-bold text-gray-800">출제 문제수</h3>

                  {/* 영어 → 한글 쓰기 Section */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-800">영어 →</span>
                      <span className="px-4 py-1 rounded-lg text-white font-bold" style={{ backgroundColor: '#10B981' }}>
                        한글 쓰기
                      </span>
                    </div>

                    {/* 표제 */}
                    <div className="flex items-center justify-between pl-4">
                      <span className="text-gray-600">↳ 표제어</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setEngToKorTableCount(Math.max(0, engToKorTableCount - 1))}
                          className="w-10 h-10 rounded border flex items-center justify-center hover:bg-gray-50 text-xl"
                          style={{ borderColor: '#d1d5db' }}
                        >
                          −
                        </button>
                        <input
                          type="text"
                          value={engToKorTableCount || ''}
                          placeholder="0"
                          onChange={(e) => {
                            const newValue = parseInt(e.target.value) || 0;
                            // Check against headword limit
                            const currentHeadwordUsage = korToEngTableCount + toeflDefinitionCount;
                            const maxHeadwordAllowed = maxCounts.headwords - currentHeadwordUsage;
                            setEngToKorTableCount(Math.min(newValue, Math.max(0, maxHeadwordAllowed)));
                          }}
                          onFocus={(e) => e.target.select()}
                          className="w-20 px-3 py-2 border rounded text-center focus:outline-none"
                          style={{ borderColor: '#d1d5db' }}
                        />
                        <button
                          onClick={() => {
                            if (headwordQuestions + 1 > maxCounts.headwords) {
                              alert(`표제어 문제수는 최대 ${maxCounts.headwords}개까지만 선택할 수 있습니다.`);
                            } else {
                              setEngToKorTableCount(engToKorTableCount + 1);
                            }
                          }}
                          className="w-10 h-10 rounded border flex items-center justify-center hover:bg-gray-50 text-xl"
                          style={{ borderColor: '#d1d5db' }}
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* 동의어 */}
                    <div className="flex items-center justify-between pl-4">
                      <span className="text-gray-600">↳ 동의어</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setEngToKorSynonymCount(Math.max(0, engToKorSynonymCount - 1))}
                          className="w-10 h-10 rounded border flex items-center justify-center hover:bg-gray-50 text-xl"
                          style={{ borderColor: '#d1d5db' }}
                        >
                          −
                        </button>
                        <input
                          type="text"
                          value={engToKorSynonymCount || ''}
                          placeholder="0"
                          onChange={(e) => {
                            const newValue = parseInt(e.target.value) || 0;
                            // Check against synonym limit
                            const currentSynonymUsage = korToEngSynonymCount;
                            const maxSynonymAllowed = maxCounts.synonyms - currentSynonymUsage;
                            setEngToKorSynonymCount(Math.min(newValue, Math.max(0, maxSynonymAllowed)));
                          }}
                          onFocus={(e) => e.target.select()}
                          className="w-20 px-3 py-2 border rounded text-center focus:outline-none"
                          style={{ borderColor: '#d1d5db' }}
                        />
                        <button
                          onClick={() => {
                            if (synonymQuestions + 1 > maxCounts.synonyms) {
                              alert(`동의어 문제수는 최대 ${maxCounts.synonyms}개까지만 선택할 수 있습니다.`);
                            } else {
                              setEngToKorSynonymCount(engToKorSynonymCount + 1);
                            }
                          }}
                          className="w-10 h-10 rounded border flex items-center justify-center hover:bg-gray-50 text-xl"
                          style={{ borderColor: '#d1d5db' }}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 한글 뜻 → 영어 쓰기 Section */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-800">한글 뜻 →</span>
                      <span className="px-4 py-1 rounded-lg text-white font-bold" style={{ backgroundColor: '#3B82F6' }}>
                        영어 쓰기
                      </span>
                    </div>

                    {/* 표제어 */}
                    <div className="flex items-center justify-between pl-4">
                      <span className="text-gray-600">↳ 표제어</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setKorToEngTableCount(Math.max(0, korToEngTableCount - 1))}
                          className="w-10 h-10 rounded border flex items-center justify-center hover:bg-gray-50 text-xl"
                          style={{ borderColor: '#d1d5db' }}
                        >
                          −
                        </button>
                        <input
                          type="text"
                          value={korToEngTableCount || ''}
                          placeholder="0"
                          onChange={(e) => {
                            const newValue = parseInt(e.target.value) || 0;
                            // Check against headword limit
                            const currentHeadwordUsage = engToKorTableCount + toeflDefinitionCount;
                            const maxHeadwordAllowed = maxCounts.headwords - currentHeadwordUsage;
                            setKorToEngTableCount(Math.min(newValue, Math.max(0, maxHeadwordAllowed)));
                          }}
                          onFocus={(e) => e.target.select()}
                          className="w-20 px-3 py-2 border rounded text-center focus:outline-none"
                          style={{ borderColor: '#d1d5db' }}
                        />
                        <button
                          onClick={() => {
                            if (headwordQuestions + 1 > maxCounts.headwords) {
                              alert(`표제어 문제수는 최대 ${maxCounts.headwords}개까지만 선택할 수 있습니다.`);
                            } else {
                              setKorToEngTableCount(korToEngTableCount + 1);
                            }
                          }}
                          className="w-10 h-10 rounded border flex items-center justify-center hover:bg-gray-50 text-xl"
                          style={{ borderColor: '#d1d5db' }}
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* 동의어 */}
                    <div className="flex items-center justify-between pl-4">
                      <span className="text-gray-600">↳ 동의어</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setKorToEngSynonymCount(Math.max(0, korToEngSynonymCount - 1))}
                          className="w-10 h-10 rounded border flex items-center justify-center hover:bg-gray-50 text-xl"
                          style={{ borderColor: '#d1d5db' }}
                        >
                          −
                        </button>
                        <input
                          type="text"
                          value={korToEngSynonymCount || ''}
                          placeholder="0"
                          onChange={(e) => {
                            const newValue = parseInt(e.target.value) || 0;
                            // Check against synonym limit
                            const currentSynonymUsage = engToKorSynonymCount;
                            const maxSynonymAllowed = maxCounts.synonyms - currentSynonymUsage;
                            setKorToEngSynonymCount(Math.min(newValue, Math.max(0, maxSynonymAllowed)));
                          }}
                          onFocus={(e) => e.target.select()}
                          className="w-20 px-3 py-2 border rounded text-center focus:outline-none"
                          style={{ borderColor: '#d1d5db' }}
                        />
                        <button
                          onClick={() => {
                            if (synonymQuestions + 1 > maxCounts.synonyms) {
                              alert(`동의어 문제수는 최대 ${maxCounts.synonyms}개까지만 선택할 수 있습니다.`);
                            } else {
                              setKorToEngSynonymCount(korToEngSynonymCount + 1);
                            }
                          }}
                          className="w-10 h-10 rounded border flex items-center justify-center hover:bg-gray-50 text-xl"
                          style={{ borderColor: '#d1d5db' }}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* TOEFL 정의 Section */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-800">영영풀이 →</span>
                      <span className="px-4 py-1 rounded-lg text-white font-bold" style={{ backgroundColor: '#A855F7' }}>
                        영어 쓰기
                      </span>
                    </div>

                    {/* 문제수 Label */}
                    <div className="pl-4">
                      <span className="text-gray-800 font-bold">문제수</span>
                    </div>

                    {/* 표제어 Counter */}
                    <div className="flex items-center justify-between pl-8 gap-2">
                      <div className="flex-1 hidden md:block">
                        <p className="text-sm text-gray-400 mb-1">
                          예: "to leave hurriedly and secretly" → abscond
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setToeflDefinitionCount(Math.max(0, toeflDefinitionCount - 1))}
                          className="w-10 h-10 rounded border flex items-center justify-center hover:bg-gray-50 text-xl"
                          style={{ borderColor: '#d1d5db' }}
                        >
                          −
                        </button>
                        <input
                          type="text"
                          value={toeflDefinitionCount || ''}
                          placeholder="0"
                          onChange={(e) => {
                            const newValue = parseInt(e.target.value) || 0;
                            // Check against headword limit
                            const currentHeadwordUsage = engToKorTableCount + korToEngTableCount;
                            const maxHeadwordAllowed = maxCounts.headwords - currentHeadwordUsage;
                            setToeflDefinitionCount(Math.min(newValue, Math.max(0, maxHeadwordAllowed)));
                          }}
                          onFocus={(e) => e.target.select()}
                          className="w-20 px-3 py-2 border rounded text-center focus:outline-none"
                          style={{ borderColor: '#d1d5db' }}
                        />
                        <button
                          onClick={() => {
                            if (headwordQuestions + 1 > maxCounts.headwords) {
                              alert(`표제어 제수는 최대 ${maxCounts.headwords}개까지만 선택할 수 있습니다.`);
                            } else {
                              setToeflDefinitionCount(toeflDefinitionCount + 1);
                            }
                          }}
                          className="w-10 h-10 rounded border flex items-center justify-center hover:bg-gray-50 text-xl"
                          style={{ borderColor: '#d1d5db' }}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Total Summary at Bottom */}
                  <div className="text-right">
                    <p className="text-2xl font-bold" style={{ color: '#10B981' }}>
                      총 {totalQuestions} 문제
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Next Button */}
            <div className="flex justify-center mt-8">
              <button
                onClick={proceedToStep2}
                disabled={selectedDays.length === 0 || totalQuestions === 0}
                className="px-24 py-4 rounded-full text-white text-lg font-bold transition-all hover:opacity-90 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                style={{ backgroundColor: '#3B4A8C' }}
              >
                어휘 시험 출제하기
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 2: Word Review */}
        {step === 2 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <div className="bg-white rounded-2xl shadow-lg p-4 md:p-8">
              <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6" style={{ color: themeColor }}>
                2단계: 단어 확인
              </h2>
              <p className="text-sm md:text-base text-gray-600 mb-4 md:mb-6">
                {selectedWords.length}개 단어 선택됨
              </p>

              {/* Word List - Card Format */}
              <div className="max-h-[500px] overflow-y-auto space-y-3">
                {selectedWords.map((word, index) => (
                  <div 
                    key={index} 
                    className="border rounded-lg p-4 hover:shadow-md transition-all bg-white hover:bg-gray-50"
                  >
                    <div className="flex items-start gap-3">
                      {/* Number Badge */}
                      <div 
                        className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                        style={{ backgroundColor: themeColor }}
                      >
                        {index + 1}
                      </div>
                      
                      {/* Word Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 mb-2">
                          <h3 className="font-bold text-lg" style={{ color: themeColor }}>
                            {word.english}
                          </h3>
                          <span className="text-gray-700">
                            {word.korean}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          {word.definition}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between">
              <button
                onClick={() => setStep(1)}
                className="px-8 py-3 rounded-full border-2 font-bold transition-all hover:opacity-80"
                style={{ borderColor: themeColor, color: themeColor }}
              >
                이전 단계
              </button>
              <button
                onClick={proceedToStep3}
                className="flex items-center gap-2 text-white font-bold px-8 py-3 rounded-full transition-all hover:opacity-90"
                style={{ backgroundColor: themeColor }}
              >
                다음 단계
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Save and Download */}
        {step === 3 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold mb-6" style={{ color: themeColor }}>
                3단계: 저장 및 다운로드
              </h2>

              <div className="grid grid-cols-2 gap-3 md:gap-6">
                {/* Start Test */}
                <button
                  onClick={handleStartTest}
                  className="p-4 md:p-8 rounded-xl border-2 hover:shadow-lg transition-all group"
                  style={{ borderColor: themeColor }}
                >
                  <Play className="w-8 md:w-12 h-8 md:h-12 mx-auto mb-2 md:mb-4" style={{ color: themeColor }} />
                  <h3 className="text-sm md:text-xl font-bold" style={{ color: themeColor }}>
                    테스트 시작
                  </h3>
                </button>

                {/* Download PDF */}
                <button
                  onClick={handleDownloadPDF}
                  className="p-4 md:p-8 rounded-xl border-2 hover:shadow-lg transition-all"
                  style={{ borderColor: themeColor }}
                >
                  <FileText className="w-8 md:w-12 h-8 md:h-12 mx-auto mb-2 md:mb-4" style={{ color: themeColor }} />
                  <h3 className="text-sm md:text-xl font-bold" style={{ color: themeColor }}>
                    PDF 다운로드
                  </h3>
                </button>

                {/* Download Word */}
                <button
                  onClick={handleDownloadWord}
                  className="p-4 md:p-8 rounded-xl border-2 hover:shadow-lg transition-all"
                  style={{ borderColor: themeColor }}
                >
                  <Download className="w-8 md:w-12 h-8 md:h-12 mx-auto mb-2 md:mb-4" style={{ color: themeColor }} />
                  <h3 className="text-sm md:text-xl font-bold" style={{ color: themeColor }}>
                    Word 다운로드
                  </h3>
                </button>

                {/* Flashcard Mode */}
                <button
                  onClick={() => {
                    setTestTypeSelection('flashcard');
                    setShowTest(true);
                  }}
                  className="p-4 md:p-8 rounded-xl border-2 hover:shadow-lg transition-all"
                  style={{ borderColor: themeColor }}
                >
                  <BookOpen className="w-8 md:w-12 h-8 md:h-12 mx-auto mb-2 md:mb-4" style={{ color: themeColor }} />
                  <h3 className="text-sm md:text-xl font-bold" style={{ color: themeColor }}>
                    플래시카드
                  </h3>
                </button>
              </div>
            </div>

            {/* Back Button */}
            <div className="flex justify-start">
              <button
                onClick={() => setStep(2)}
                className="px-8 py-3 rounded-full border-2 font-bold transition-all hover:opacity-80"
                style={{ borderColor: themeColor, color: themeColor }}
              >
                이전 단계
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Word Download Modal */}
      {showWordDownloadModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full px-8 py-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold" style={{ color: themeColor }}>
                Word 다운로드
              </h2>
              <button 
                onClick={() => setShowWordDownloadModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="bg-gray-100 rounded-xl p-3">
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => generateWordDocument('test')}
                  className="flex flex-col items-center justify-center gap-1 px-3 py-2.5 bg-white rounded-lg border border-gray-300 hover:bg-gray-50 hover:shadow-md transition-all"
                >
                  <span className="text-sm font-semibold text-gray-700">시험지</span>
                  <span className="flex items-center gap-1 text-xs text-gray-500">다운로드 <Download className="w-3.5 h-3.5" /></span>
                </button>
                <button
                  onClick={() => generateWordDocument('answer')}
                  className="flex flex-col items-center justify-center gap-1 px-3 py-2.5 bg-white rounded-lg border border-gray-300 hover:bg-gray-50 hover:shadow-md transition-all"
                >
                  <span className="text-sm font-semibold text-gray-700">답안지</span>
                  <span className="flex items-center gap-1 text-xs text-gray-500">다운로드 <Download className="w-3.5 h-3.5" /></span>
                </button>
                <button
                  onClick={() => generateWordDocument('both')}
                  className="flex flex-col items-center justify-center gap-1 px-3 py-2.5 bg-white rounded-lg border border-gray-300 hover:bg-gray-50 hover:shadow-md transition-all"
                >
                  <span className="text-sm font-semibold text-gray-700">시험지·답안지 전체</span>
                  <span className="flex items-center gap-1 text-xs text-gray-500">다운로드 <Download className="w-3.5 h-3.5" /></span>
                </button>
              </div>
            </div>
            <p className="mt-3 text-xs text-gray-500 text-center">
              선택한 {selectedWords.length}개 단어가 포함된 Word 파일이 생성됩니다.
            </p>
          </div>
        </div>
      )}

      {/* PDF Download Modal */}
      {showPdfDownloadModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full px-8 py-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold" style={{ color: themeColor }}>
                PDF 다운로드
              </h2>
              <button 
                onClick={() => setShowPdfDownloadModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="bg-gray-100 rounded-xl p-3">
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => generatePdfDocument('test')}
                  className="flex flex-col items-center justify-center gap-1 px-3 py-2.5 bg-white rounded-lg border border-gray-300 hover:bg-gray-50 hover:shadow-md transition-all"
                >
                  <span className="text-sm font-semibold text-gray-700">시험지</span>
                  <span className="flex items-center gap-1 text-xs text-gray-500">다운로드 <Download className="w-3.5 h-3.5" /></span>
                </button>
                <button
                  onClick={() => generatePdfDocument('answer')}
                  className="flex flex-col items-center justify-center gap-1 px-3 py-2.5 bg-white rounded-lg border border-gray-300 hover:bg-gray-50 hover:shadow-md transition-all"
                >
                  <span className="text-sm font-semibold text-gray-700">답안지</span>
                  <span className="flex items-center gap-1 text-xs text-gray-500">다운로드 <Download className="w-3.5 h-3.5" /></span>
                </button>
                <button
                  onClick={() => generatePdfDocument('both')}
                  className="flex flex-col items-center justify-center gap-1 px-3 py-2.5 bg-white rounded-lg border border-gray-300 hover:bg-gray-50 hover:shadow-md transition-all"
                >
                  <span className="text-sm font-semibold text-gray-700">시험지·답안지 전체</span>
                  <span className="flex items-center gap-1 text-xs text-gray-500">다운로드 <Download className="w-3.5 h-3.5" /></span>
                </button>
              </div>
            </div>
            <p className="mt-3 text-xs text-gray-500 text-center">
              선택한 {selectedWords.length}개 단어가 포함된 PDF 파일이 생성됩니다.
            </p>
          </div>
        </div>
      )}

      {showTestTypeModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
            <h2 className="text-2xl font-bold mb-6" style={{ color: themeColor }}>
              시험 유형 선택
            </h2>
            
            <div className="space-y-3 mb-6">
              <button
                onClick={() => setTestTypeSelection('multiple')}
                className="w-full p-4 rounded-lg border-2 text-left transition-all"
                style={{
                  borderColor: testTypeSelection === 'multiple' ? themeColor : '#e5e7eb',
                  backgroundColor: testTypeSelection === 'multiple' ? `${themeColor}10` : 'white'
                }}
              >
                <h3 className="font-bold mb-1">객관식</h3>
                <p className="text-sm text-gray-600">4지선다 형식</p>
                
                {/* Question Format Selection for Multiple Choice */}
                {testTypeSelection === 'multiple' && (
                  <div className="mt-3 space-y-2" onClick={(e) => e.stopPropagation()}>
                    <p className="text-xs font-bold text-gray-700 mb-2">문제 형식:</p>
                    <div className="space-y-1">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="questionFormat"
                          checked={questionFormat === 'eng_to_kor'}
                          onChange={() => setQuestionFormat('eng_to_kor')}
                          className="w-4 h-4"
                          style={{ accentColor: themeColor }}
                        />
                        <span className="text-sm">영어 → 한글</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="questionFormat"
                          checked={questionFormat === 'kor_to_eng'}
                          onChange={() => setQuestionFormat('kor_to_eng')}
                          className="w-4 h-4"
                          style={{ accentColor: themeColor }}
                        />
                        <span className="text-sm">한글 → 영어</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="questionFormat"
                          checked={questionFormat === 'definition_to_eng'}
                          onChange={() => setQuestionFormat('definition_to_eng')}
                          className="w-4 h-4"
                          style={{ accentColor: themeColor }}
                        />
                        <span className="text-sm">영영풀이 → 영어</span>
                      </label>
                    </div>
                  </div>
                )}
              </button>

              <button
                onClick={() => setTestTypeSelection('subjective')}
                className="w-full p-4 rounded-lg border-2 text-left transition-all"
                style={{
                  borderColor: testTypeSelection === 'subjective' ? themeColor : '#e5e7eb',
                  backgroundColor: testTypeSelection === 'subjective' ? `${themeColor}10` : 'white'
                }}
              >
                <h3 className="font-bold mb-1">주관식</h3>
                <p className="text-sm text-gray-600">직접 답을 입력</p>
                
                {/* Question Format Selection for Subjective */}
                {testTypeSelection === 'subjective' && (
                  <div className="mt-3 space-y-2" onClick={(e) => e.stopPropagation()}>
                    <p className="text-xs font-bold text-gray-700 mb-2">문제 형식:</p>
                    <div className="space-y-1">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="subjectiveFormat"
                          checked={subjectiveFormat === 'kor_to_eng'}
                          onChange={() => setSubjectiveFormat('kor_to_eng')}
                          className="w-4 h-4"
                          style={{ accentColor: themeColor }}
                        />
                        <span className="text-sm">한글 → 영어</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="subjectiveFormat"
                          checked={subjectiveFormat === 'definition_to_eng'}
                          onChange={() => setSubjectiveFormat('definition_to_eng')}
                          className="w-4 h-4"
                          style={{ accentColor: themeColor }}
                        />
                        <span className="text-sm">영영풀이 → 영어</span>
                      </label>
                    </div>
                  </div>
                )}
              </button>

              <button
                onClick={() => setTestTypeSelection('mixed')}
                className="w-full p-4 rounded-lg border-2 text-left transition-all"
                style={{
                  borderColor: testTypeSelection === 'mixed' ? themeColor : '#e5e7eb',
                  backgroundColor: testTypeSelection === 'mixed' ? `${themeColor}10` : 'white'
                }}
              >
                <h3 className="font-bold mb-1">혼합형</h3>
                <p className="text-sm text-gray-600">객관식과 주관식 혼합</p>
              </button>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => setShowTestTypeModal(false)}
                variant="outline"
                className="flex-1"
              >
                취소
              </Button>
              <Button
                onClick={confirmTestType}
                className="flex-1 text-white"
                style={{ backgroundColor: themeColor }}
              >
                시작하기
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}