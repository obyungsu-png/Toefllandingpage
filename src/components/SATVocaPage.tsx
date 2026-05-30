import { useState, useMemo, useEffect } from 'react';
// motion replaced with CSS animations
import { BookOpen, Download, FileText, Play, ChevronRight, Check, ArrowLeft, X, ArrowRightLeft, Loader2, Languages } from 'lucide-react';
import { Button } from './ui/button';
import { SATWord } from './vocaWordSets';
import { SATVocaTest } from './SATVocaTest';
import { SERVER_BASE_URL, getServerHeaders } from '../utils/apiConfig';
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
  const serverUrl = SERVER_BASE_URL;

  // Cache configuration
  const CACHE_VERSION = 'v1';
  const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

  // Cache helper functions
  const getCacheKey = (type: string) => `vocab_cache_${CACHE_VERSION}_${type}`;
  
  const loadFromCache = (type: string) => {
    try {
      const cached = localStorage.getItem(getCacheKey(type));
      if (!cached) return null;
      
      const data = JSON.parse(cached);
      const isExpired = Date.now() - data.timestamp > CACHE_TTL_MS;
      
      if (isExpired) {
        localStorage.removeItem(getCacheKey(type));
        return null;
      }
      
      console.log(`[SATVocaPage] ✅ Loaded from cache: ${type} (${data.words?.length || 0} words, ${data.days?.length || 0} days)`);
      return data;
    } catch (err) {
      console.warn('[SATVocaPage] Cache load failed:', err);
      return null;
    }
  };
  
  const saveToCache = (type: string, words: SATWord[], days: VocabularyDay[]) => {
    try {
      const data = {
        words,
        days,
        timestamp: Date.now()
      };
      localStorage.setItem(getCacheKey(type), JSON.stringify(data));
      console.log(`[SATVocaPage] 💾 Saved to cache: ${type}`);
    } catch (err) {
      console.warn('[SATVocaPage] Cache save failed:', err);
    }
  };

  // Retry helper for transient network errors (cold start, etc.)
  const fetchWithRetry = async (url: string, options: RequestInit, retries = 5, delayMs = 2000): Promise<Response> => {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);
        const response = await fetch(url, { ...options, signal: controller.signal });
        clearTimeout(timeoutId);
        return response;
      } catch (err: any) {
        if (err.name === 'AbortError') {
          console.warn(`[SATVocaPage] Fetch attempt ${attempt}/${retries} timed out, retrying in ${delayMs * attempt}ms...`);
        } else {
          console.warn(`[SATVocaPage] Fetch attempt ${attempt}/${retries} failed (${err.message}), retrying in ${delayMs * attempt}ms...`);
        }
        if (attempt === retries) throw err;
        await new Promise(r => setTimeout(r, delayMs * attempt));
      }
    }
    throw new Error('fetchWithRetry: unreachable');
  };
  
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
  const [showUnifiedDownloadModal, setShowUnifiedDownloadModal] = useState(false);
  const [downloadDirection, setDownloadDirection] = useState<'eng_to_kor' | 'kor_to_eng' | 'eng_only'>('eng_to_kor');
  const [downloadFormat, setDownloadFormat] = useState<'pdf' | 'word'>('pdf');
  const [isGenerating, setIsGenerating] = useState(false);
  const [questionFormat, setQuestionFormat] = useState<'eng_to_kor' | 'kor_to_eng' | 'definition_to_eng'>('eng_to_kor');
  const [subjectiveFormat, setSubjectiveFormat] = useState<'kor_to_eng' | 'definition_to_eng'>('kor_to_eng');

  // Health check on mount
  useEffect(() => {
    const checkServerHealth = async () => {
      try {
        console.log('[Health Check] Checking server at:', `${serverUrl}/health`);
        const response = await fetch(`${serverUrl}/health`, {
          method: 'GET',
          headers: getServerHeaders()
        });
        const data = await response.json();
        console.log('[Health Check] Server response:', data);
      } catch (error) {
        console.error('[Health Check] Server not responding:', error);
      }
    };
    
    checkServerHealth();
  }, []);

  // Fetch days and words from Supabase when activeTab changes (with caching)
  useEffect(() => {
    const fetchData = async () => {
      // Step 1: Try to load from cache first for instant display
      const cachedData = loadFromCache(activeTab);
      if (cachedData) {
        console.log(`[SATVocaPage] 🚀 Using cached data for instant display: ${activeTab}`);
        setWordsFromDB(cachedData.words || []);
        setDaysFromDB(cachedData.days || []);
        setLoadingWords(false);
        setLoadingDays(false);
      } else {
        setLoadingWords(true);
        setLoadingDays(true);
      }

      // Step 2: Fetch fresh data from server in background
      try {
        console.log(`[SATVocaPage] 🔄 Fetching fresh data from server: ${activeTab}`);
        
        const headers = {
          ...getServerHeaders(),
          'Content-Type': 'application/json'
        };

        const [wordsResponse, daysResponse] = await Promise.all([
          fetchWithRetry(`${serverUrl}/vocabulary/${activeTab}`, { method: 'GET', headers }),
          fetchWithRetry(`${serverUrl}/vocabulary-days/${activeTab}`, { method: 'GET', headers })
        ]);

        if (!wordsResponse.ok) {
          const errorText = await wordsResponse.text();
          console.error(`[SATVocaPage] Failed to fetch words. Status: ${wordsResponse.status}, Response: ${errorText}`);
          throw new Error(`Failed to fetch words: ${wordsResponse.status} ${errorText}`);
        }

        if (!daysResponse.ok) {
          const errorText = await daysResponse.text();
          console.error(`[SATVocaPage] Failed to fetch days. Status: ${daysResponse.status}, Response: ${errorText}`);
          throw new Error(`Failed to fetch days: ${daysResponse.status} ${errorText}`);
        }

        const wordsData = await wordsResponse.json();
        const daysData = await daysResponse.json();
        
        const freshWords = wordsData.words || [];
        const freshDays = daysData.days || [];
        
        console.log(`[SATVocaPage] ✅ Fetched fresh data: ${freshWords.length} words, ${freshDays.length} days for ${activeTab}`);
        
        // Step 3: Update UI with fresh data
        setWordsFromDB(freshWords);
        setDaysFromDB(freshDays);
        
        // Step 4: Save to cache for next time
        saveToCache(activeTab, freshWords, freshDays);
      } catch (error) {
        console.error('[SATVocaPage] Error fetching data:', error);
        console.error('[SATVocaPage] Error details:', error instanceof Error ? error.message : String(error));
        
        // If cache exists, keep using it; otherwise fallback to defaults
        if (!cachedData) {
          setWordsFromDB([]);
          setDaysFromDB(Array.from({ length: 50 }, (_, i) => ({
            id: i + 1,
            name: `DAY ${i + 1}`
          })));
        }
      } finally {
        setLoadingWords(false);
        setLoadingDays(false);
      }
    };

    fetchData();
  }, [activeTab]);

  // Calculate available words based on selected days
  const availableWords = useMemo(() => {
    const words: SATWord[] = [];
    
    if (activeTab === 'custom' || activeTab === 'etymology' || activeTab === 'toefl-easy') {
      // For dayNumber-based tabs, filter by dayNumber field
      selectedDays.forEach(dayId => {
        const dayWords = wordsFromDB.filter((word: any) => word.dayNumber === dayId);
        words.push(...dayWords);
      });
    } else {
      // For index-based tabs (toefl-hard), use index-based slicing
      const wordsPerDay = 60;
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
    
    if (activeTab === 'custom' || activeTab === 'etymology' || activeTab === 'toefl-easy') {
      // For dayNumber-based tabs, count by dayNumber field
      daysFromDB.forEach(day => {
        const dayWords = wordsFromDB.filter((word: any) => word.dayNumber === day.id);
        wordCountMap[day.id] = dayWords.length;
      });
    } else {
      // For index-based tabs (toefl-hard), use index-based counting
      const wordsPerDay = 60;
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

  // Download PDF - show modal (legacy, kept for backward compatibility)
  const handleDownloadPDF = () => {
    setShowPdfDownloadModal(true);
  };

  // Download Word - show modal (legacy, kept for backward compatibility)
  const handleDownloadWord = () => {
    setShowWordDownloadModal(true);
  };

  // Helper: build Word document sections for a given render mode
  const buildWordSections = (
    renderMode: 'test' | 'answer',
    dateStr: string,
    totalWords: number,
    direction: 'eng_to_kor' | 'kor_to_eng' | 'eng_only' = 'eng_to_kor'
  ) => {
    const ROWS_PER_COL = 30;
    const WORDS_PER_PAGE = ROWS_PER_COL * 2;
    const totalPages = Math.ceil(totalWords / WORDS_PER_PAGE);
    const WORD_TABLE_FONT_SIZE = 22;

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
    const cellMargin = { top: 85, bottom: 85, left: 60, right: 60 };

    const isTest = renderMode === 'test';
    const instructionColor = isTest ? '0D9488' : 'EA580C';
    const sections: any[] = [];

    for (let pageIdx = 0; pageIdx < totalPages; pageIdx++) {
      const pageStart = pageIdx * WORDS_PER_PAGE;
      const pageWords = selectedWords.slice(pageStart, pageStart + WORDS_PER_PAGE);
      const leftWords = pageWords.slice(0, ROWS_PER_COL);
      const rightWords = pageWords.slice(ROWS_PER_COL);
      const maxRows = ROWS_PER_COL;

      const rangeStart = pageStart + 1;
      const rangeEnd = Math.min(pageStart + WORDS_PER_PAGE, totalWords);
      const pageLabel = totalPages > 1 ? ` [${pageIdx + 1}/${totalPages} 페이지]` : '';

      const headerParagraphs: Paragraph[] = [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 80 },
          children: [new TextRun({ text: dateStr, size: 18, color: '666666' })]
        }),
      ];

      const nameScoreTable = new Table({
        width: { size: 3000, type: WidthType.DXA },
        rows: [
          new TableRow({ children: [
            new TableCell({ width: { size: 3000, type: WidthType.DXA }, margins: { top: 30, bottom: 30, left: 60, right: 60 },
              children: [new Paragraph({ children: [new TextRun({ text: '이름', size: 18 })] })],
              borders: { top: { style: BorderStyle.SINGLE, size: 1, color: '999999' }, bottom: { style: BorderStyle.SINGLE, size: 1, color: '999999' }, left: { style: BorderStyle.SINGLE, size: 1, color: '999999' }, right: { style: BorderStyle.SINGLE, size: 1, color: '999999' } }
            })
          ] }),
          new TableRow({ children: [
            new TableCell({ width: { size: 3000, type: WidthType.DXA }, margins: { top: 30, bottom: 30, left: 60, right: 60 },
              children: [new Paragraph({ children: [ new TextRun({ text: '맞은 개수       ', size: 18 }), new TextRun({ text: `/ ${totalWords}`, size: 18 }) ] })],
              borders: { top: { style: BorderStyle.SINGLE, size: 1, color: '999999' }, bottom: { style: BorderStyle.SINGLE, size: 1, color: '999999' }, left: { style: BorderStyle.SINGLE, size: 1, color: '999999' }, right: { style: BorderStyle.SINGLE, size: 1, color: '999999' } }
            })
          ] })
        ]
      });

      const directionInstructions: Record<string, string> = {
        eng_to_kor: '왼쪽 영어 단어에 어울리는 한글 뜻을 작성해보세요.',
        kor_to_eng: '왼쪽 한글 뜻에 해당하는 영어 단어를 작성해보세요.',
        eng_only: '왼쪽 영어 단어의 영어 정의(Definition)를 작성해보세요.',
      };
      const instructionText = isTest
        ? `(${rangeStart}~${rangeEnd}) ※ ${directionInstructions[direction]}${pageLabel}`
        : `(${rangeStart}~${rangeEnd}) ※ 답안지 — 정답 확인용${pageLabel}`;

      const instructionParagraph = new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 120, after: 120 },
        children: [new TextRun({ text: instructionText, size: 16, color: instructionColor, bold: true })]
      });

      const tableRows: TableRow[] = [];
      for (let i = 0; i < maxRows; i++) {
        const leftWord = leftWords[i] || null;
        const rightWord = rightWords[i] || null;
        const leftNum = leftWord ? String(pageStart + i + 1) : '';
        const rightNum = rightWord ? String(pageStart + ROWS_PER_COL + i + 1) : '';

        // Determine column content based on direction
        const getCol1 = (w: SATWord | null) => {
          if (!w) return '';
          if (direction === 'kor_to_eng') return w.korean;
          return w.english; // eng_to_kor, eng_only
        };
        const getCol2Test = (w: SATWord | null) => '';
        const getCol2Answer = (w: SATWord | null) => {
          if (!w) return '';
          if (direction === 'eng_to_kor') return w.korean;
          if (direction === 'kor_to_eng') return w.english;
          return w.definition || w.korean; // eng_only
        };

        const cells: TableCell[] = [
          new TableCell({ width: { size: numColW, type: WidthType.DXA }, margins: cellMargin, verticalAlign: 'center' as any, children: [new Paragraph({ children: [new TextRun({ text: leftNum, size: WORD_TABLE_FONT_SIZE, color: '888888', bold: true })] })], borders: cellBorders }),
          new TableCell({ width: { size: engColW, type: WidthType.DXA }, margins: cellMargin, verticalAlign: 'center' as any, children: [new Paragraph({ children: [new TextRun({ text: getCol1(leftWord), size: WORD_TABLE_FONT_SIZE, bold: true })] })], borders: cellBorders }),
          new TableCell({ width: { size: korColW, type: WidthType.DXA }, margins: cellMargin, verticalAlign: 'center' as any, children: [new Paragraph({ children: isTest ? [new TextRun({ text: getCol2Test(leftWord), size: WORD_TABLE_FONT_SIZE, bold: true })] : [new TextRun({ text: getCol2Answer(leftWord), size: WORD_TABLE_FONT_SIZE, color: 'EA580C', bold: true })] })], borders: cellBorders }),
          new TableCell({ width: { size: numColW, type: WidthType.DXA }, margins: cellMargin, verticalAlign: 'center' as any, children: [new Paragraph({ children: [new TextRun({ text: rightNum, size: WORD_TABLE_FONT_SIZE, color: '888888', bold: true })] })], borders: cellBorders }),
          new TableCell({ width: { size: engColW, type: WidthType.DXA }, margins: cellMargin, verticalAlign: 'center' as any, children: [new Paragraph({ children: [new TextRun({ text: getCol1(rightWord), size: WORD_TABLE_FONT_SIZE, bold: true })] })], borders: cellBorders }),
          new TableCell({ width: { size: korColW, type: WidthType.DXA }, margins: cellMargin, verticalAlign: 'center' as any, children: [new Paragraph({ children: isTest ? [new TextRun({ text: getCol2Test(rightWord), size: WORD_TABLE_FONT_SIZE, bold: true })] : [new TextRun({ text: getCol2Answer(rightWord), size: WORD_TABLE_FONT_SIZE, color: 'EA580C', bold: true })] })], borders: cellBorders }),
        ];
        tableRows.push(new TableRow({ children: cells }));
      }

      const vocabTable = new Table({ width: { size: totalTableW, type: WidthType.DXA }, rows: tableRows });

      const sectionChildren: any[] = [];
      if (isTest && pageIdx === 0) {
        sectionChildren.push(...headerParagraphs, nameScoreTable, instructionParagraph, vocabTable);
      } else {
        sectionChildren.push(...headerParagraphs, instructionParagraph, vocabTable);
      }

      sections.push({
        properties: { page: { margin: { top: 720, bottom: 720, left: 720, right: 720 } } },
        children: sectionChildren
      });
    }

    return sections;
  };

  // Generate Word document (paginated: 60 words per page, 'both' = test sections + answer sections)
  const generateWordDocument = async (mode: 'test' | 'answer' | 'both', direction: 'eng_to_kor' | 'kor_to_eng' | 'eng_only' = 'eng_to_kor') => {
    const today = new Date();
    const dateStr = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, '0')}.${String(today.getDate()).padStart(2, '0')}`;
    const totalWords = selectedWords.length;

    let sections: any[];
    if (mode === 'both') {
      const testSections = buildWordSections('test', dateStr, totalWords, direction);
      const answerSections = buildWordSections('answer', dateStr, totalWords, direction);
      sections = [...testSections, ...answerSections];
    } else {
      sections = buildWordSections(mode, dateStr, totalWords, direction);
    }

    const dirLabel = direction === 'eng_to_kor' ? '영한' : direction === 'kor_to_eng' ? '한영' : '영영';
    const doc = new Document({ sections });
    const blob = await Packer.toBlob(doc);
    const fileName = mode === 'test' ? '시험지' : mode === 'answer' ? '답안지' : '시험지_답안지';
    saveAs(blob, `TOEFL_어휘_${dirLabel}_${fileName}_${dateStr}.docx`);
    setShowWordDownloadModal(false);
    setShowUnifiedDownloadModal(false);
  };

  // Helper: render one set of paginated PDF pages for a given render mode
  const renderPdfPages = async (
    pdfDoc: any,
    renderMode: 'test' | 'answer',
    dateStr: string,
    totalWords: number,
    isFirstSection: boolean,
    direction: 'eng_to_kor' | 'kor_to_eng' | 'eng_only' = 'eng_to_kor'
  ) => {
    const PDF_ROWS_PER_COL = 30;
    const WORDS_PER_PAGE = PDF_ROWS_PER_COL * 2;
    const totalPages = Math.ceil(totalWords / WORDS_PER_PAGE);

    const cfgMap = {
      test: {
        headerColor: '#0D9488', headerBg: '#F0FDFA',
        badgeText: 'TEST', badgeBg: '#0D9488',
        showNameBox: true, showScoreBox: true,
        answerBg: '#FAFAFA', korColor: '#000', borderColor: '#ddd',
      },
      answer: {
        headerColor: '#EA580C', headerBg: '#FFF7ED',
        badgeText: 'ANSWER KEY', badgeBg: '#EA580C',
        showNameBox: false, showScoreBox: false,
        answerBg: '#FFF7ED', korColor: '#EA580C', borderColor: '#FDBA74',
      },
    };
    const cfg = cfgMap[renderMode];

    for (let pageIdx = 0; pageIdx < totalPages; pageIdx++) {
      if (!(isFirstSection && pageIdx === 0)) pdfDoc.addPage();

      const pageStart = pageIdx * WORDS_PER_PAGE;
      const pageWords = selectedWords.slice(pageStart, pageStart + WORDS_PER_PAGE);
      const leftWords = pageWords.slice(0, PDF_ROWS_PER_COL);
      const rightWords = pageWords.slice(PDF_ROWS_PER_COL);
      const maxRows = PDF_ROWS_PER_COL;

      const rangeStart = pageStart + 1;
      const rangeEnd = Math.min(pageStart + WORDS_PER_PAGE, totalWords);
      const pageLabel = totalPages > 1 ? ` [${pageIdx + 1}/${totalPages}]` : '';
      const pdfDirInstructions: Record<string, string> = {
        eng_to_kor: '왼쪽 영어 단어에 어울리는 한글 뜻을 작성해보세요.',
        kor_to_eng: '왼쪽 한글 뜻에 해당하는 영어 단어를 작성해보세요.',
        eng_only: '왼쪽 영어 단어의 영어 정의(Definition)를 작성해보세요.',
      };
      const instructionText = renderMode === 'answer'
        ? `(${rangeStart}~${rangeEnd}) ※ 답안지 — 정답 확인용${pageLabel}`
        : `(${rangeStart}~${rangeEnd}) ※ ${pdfDirInstructions[direction]}${pageLabel}`;

      // Direction-aware column helpers
      const pdfCol1 = (w: SATWord | null) => {
        if (!w) return '';
        if (direction === 'kor_to_eng') return w.korean;
        return w.english;
      };
      const pdfCol2 = (w: SATWord | null, isTest: boolean) => {
        if (!w) return '';
        if (isTest) return '';
        if (direction === 'eng_to_kor') return w.korean;
        if (direction === 'kor_to_eng') return w.english;
        return w.definition || w.korean;
      };
      const isTestMode = renderMode === 'test';

      let tableRows = '';
      for (let i = 0; i < maxRows; i++) {
        const lw = leftWords[i] || null;
        const rw = rightWords[i] || null;
        const leftNum = lw ? pageStart + i + 1 : '';
        const rightNum = rw ? pageStart + PDF_ROWS_PER_COL + i + 1 : '';
        const leftCol1 = pdfCol1(lw);
        const leftCol2 = pdfCol2(lw, isTestMode);
        const rightCol1 = pdfCol1(rw);
        const rightCol2 = pdfCol2(rw, isTestMode);
        const korBg = isTestMode ? '#FAFAFA' : cfg.answerBg;
        const rowBorder = `border-bottom:1px solid ${cfg.borderColor}`;

        tableRows += `<tr>
          <td style="width:5%;text-align:center;padding:9px 4px;${rowBorder};font-size:13px;color:#888">${leftNum}</td>
          <td style="width:22%;padding:9px 10px;${rowBorder};font-size:13px;font-weight:bold">${leftCol1}</td>
          <td style="width:23%;padding:9px 10px;${rowBorder};font-size:13px;color:${cfg.korColor};background:${korBg}">${leftCol2}</td>
          <td style="width:5%;text-align:center;padding:9px 4px;${rowBorder};font-size:13px;color:#888">${rightNum}</td>
          <td style="width:22%;padding:9px 10px;${rowBorder};font-size:13px;font-weight:bold">${rightCol1}</td>
          <td style="width:23%;padding:9px 10px;${rowBorder};font-size:13px;color:${cfg.korColor};background:${korBg}">${rightCol2}</td>
        </tr>`;
      }

      const nameScoreHtml = (cfg.showNameBox && pageIdx === 0) ? `
        <table style="border:1px solid #999;border-collapse:collapse;margin-bottom:10px">
          <tr><td style="border:1px solid #999;padding:5px 12px;font-size:12px;width:200px">이름</td></tr>
          ${cfg.showScoreBox ? `<tr><td style="border:1px solid #999;padding:5px 12px;font-size:12px">맞은 개수&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;/ ${totalWords}</td></tr>` : ''}
        </table>
      ` : '';

      const htmlContent = `
        <div style="width:760px;padding:20px 17px;font-family:'Malgun Gothic','맑은 고딕','Apple SD Gothic Neo','Noto Sans KR',sans-serif;background:#fff">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
            <div style="text-align:left;color:#666;font-size:11px">${dateStr}</div>
            <div style="display:inline-block;padding:3px 12px;border-radius:4px;background:${cfg.badgeBg};color:#fff;font-size:10px;font-weight:bold;letter-spacing:1px">${cfg.badgeText}</div>
          </div>
          ${nameScoreHtml}
          <div style="text-align:center;padding:6px 0;margin-bottom:8px;background:${cfg.headerBg};border-radius:4px;border-left:4px solid ${cfg.headerColor}">
            <span style="color:${cfg.headerColor};font-size:12px;font-weight:bold">
              ${instructionText}
            </span>
          </div>
          <table style="width:100%;border-collapse:collapse;border-top:2px solid ${cfg.headerColor}">
            <tbody>${tableRows}</tbody>
          </table>
        </div>
      `;

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
          scale: 2, useCORS: true, backgroundColor: '#ffffff',
          windowWidth: 800, windowHeight: targetEl.scrollHeight + 100,
        });
        const imgData = canvas.toDataURL('image/png');
        const marginX = 5, marginY = 5;
        const maxW = 210 - marginX * 2, maxH = 297 - marginY * 2;
        const aspectRatio = canvas.width / canvas.height;
        let imgWidth = maxW, imgHeight = imgWidth / aspectRatio;
        if (imgHeight > maxH) { imgHeight = maxH; imgWidth = imgHeight * aspectRatio; }
        const offsetX = (210 - imgWidth) / 2;
        pdfDoc.addImage(imgData, 'PNG', offsetX, marginY, imgWidth, imgHeight);
      } finally {
        document.body.removeChild(iframe);
      }
    }
  };

  // Generate PDF document (paginated: 60 words per page, 'both' = test pages + answer pages)
  const generatePdfDocument = async (mode: 'test' | 'answer' | 'both', direction: 'eng_to_kor' | 'kor_to_eng' | 'eng_only' = 'eng_to_kor') => {
    const today = new Date();
    const dateStr = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, '0')}.${String(today.getDate()).padStart(2, '0')}`;
    const totalWords = selectedWords.length;
    const pdfDoc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    if (mode === 'both') {
      await renderPdfPages(pdfDoc, 'test', dateStr, totalWords, true, direction);
      await renderPdfPages(pdfDoc, 'answer', dateStr, totalWords, false, direction);
    } else {
      await renderPdfPages(pdfDoc, mode, dateStr, totalWords, true, direction);
    }

    const dirLabel = direction === 'eng_to_kor' ? '영한' : direction === 'kor_to_eng' ? '한영' : '영영';
    const fileName = mode === 'test' ? '시험지' : mode === 'answer' ? '답안지' : '시험지_답안지';
    pdfDoc.save(`TOEFL_어휘_${dirLabel}_${fileName}_${dateStr}.pdf`);
    setShowPdfDownloadModal(false);
    setShowUnifiedDownloadModal(false);
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
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeScaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
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
          <div className="flex border-b-2 border-gray-200">
            {([
              { key: 'toefl-easy' as const, label: 'TOEFL 어휘 학습 vol.1', short: '어휘 vol.1' },
              { key: 'toefl-hard' as const, label: 'TOEFL 어휘 학습 vol.2', short: '어휘 vol.2' },
              { key: 'etymology' as const, label: '기출단어', short: '기출' },
              { key: 'custom' as const, label: '참고서 영단어', short: '참고서' },
            ]).map(tab => (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key);
                  setStep(1);
                  setSelectedDays([]);
                  setSelectedWords([]);
                }}
                className={`flex-1 sm:flex-none px-2 sm:px-6 py-3 font-bold transition-all whitespace-nowrap text-xs sm:text-base text-center ${
                  activeTab === tab.key
                    ? 'border-b-4 -mb-0.5'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                style={{
                  borderColor: activeTab === tab.key ? themeColor : 'transparent',
                  color: activeTab === tab.key ? themeColor : undefined
                }}
              >
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.short}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Description */}
        <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-blue-50 rounded-lg border border-blue-200">
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
        <div className="flex items-center justify-center mb-6 sm:mb-12">
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
          <div
            className="bg-white rounded-2xl shadow-lg p-4 md:p-8"
            style={{ animation: 'fadeSlideUp 0.3s ease-out' }}
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
                    {daysFromDB.map((day, dayListIndex) => (
                      <button
                        key={day.id}
                        onClick={() => toggleDay(day.id)}
                        className="w-full px-6 py-4 text-left border-b transition-all flex items-center gap-4 hover:bg-teal-50 hover:border-teal-200 hover:shadow-sm group"
                        style={{
                          backgroundColor: selectedDays.includes(day.id) ? '#f0fdf4' : 'white',
                          borderColor: selectedDays.includes(day.id) ? '#10B981' : '#e5e7eb'
                        }}
                      >
                        <span className="text-gray-400 text-lg w-6 group-hover:text-teal-600 transition-colors">{dayListIndex + 1}</span>
                        <span className="font-bold text-lg group-hover:text-teal-700 transition-colors">{day.name}</span>
                        <span className="text-gray-400 group-hover:text-teal-500 transition-colors">
                          {activeTab === 'toefl-hard'
                            ? '(60개)'
                            : `(${getWordCountForDay[day.id] || 0}개)`}
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
                <div className="rounded-xl p-4 sm:p-6 mb-4 sm:mb-6 text-center border-2 shadow-lg" style={{ backgroundColor: '#3B4A8C', borderColor: '#2d3a6e' }}>
                  <p className="text-sm font-bold mb-2 text-blue-100">출제 가능 문제수</p>
                  <p className="text-4xl sm:text-5xl font-bold mb-1 text-white">
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
                <div className="space-y-4 sm:space-y-6">
                  <h3 className="font-bold text-gray-800">출제 문제수</h3>

                  {/* 영어 → 한글 쓰기 Section */}
                  <div className="space-y-2 sm:space-y-3">
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
                  <div className="space-y-2 sm:space-y-3">
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
                  <div className="space-y-2 sm:space-y-3">
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
                className="px-12 sm:px-24 py-3 sm:py-4 rounded-full text-white text-base sm:text-lg font-bold transition-all hover:opacity-90 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed shadow-lg w-full sm:w-auto"
                style={{ backgroundColor: '#3B4A8C' }}
              >
                어휘 시험 출제하기
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Word Review */}
        {step === 2 && (
          <div
            style={{ animation: 'fadeSlideUp 0.3s ease-out' }}
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
          </div>
        )}

        {/* Step 3: Save and Download */}
        {step === 3 && (
          <div
            className="space-y-8"
            style={{ animation: 'fadeSlideUp 0.3s ease-out' }}
          >
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold mb-6" style={{ color: themeColor }}>
                3단계: 저장 및 다운로드
              </h2>

              <div className="grid grid-cols-3 gap-3 md:gap-4">
                {/* Start Test */}
                <button
                  onClick={handleStartTest}
                  className="p-4 md:p-6 rounded-xl border-2 hover:shadow-lg transition-all group"
                  style={{ borderColor: themeColor }}
                >
                  <Play className="w-8 md:w-10 h-8 md:h-10 mx-auto mb-2 md:mb-3" style={{ color: themeColor }} />
                  <h3 className="text-xs md:text-lg font-bold" style={{ color: themeColor }}>
                    테스트 시작
                  </h3>
                </button>

                {/* Download (Unified) */}
                <button
                  onClick={() => setShowUnifiedDownloadModal(true)}
                  className="p-4 md:p-6 rounded-xl border-2 hover:shadow-lg transition-all"
                  style={{ borderColor: themeColor }}
                >
                  <Download className="w-8 md:w-10 h-8 md:h-10 mx-auto mb-2 md:mb-3" style={{ color: themeColor }} />
                  <h3 className="text-xs md:text-lg font-bold" style={{ color: themeColor }}>
                    시험지 다운로드
                  </h3>
                </button>

                {/* Flashcard Mode */}
                <button
                  onClick={() => {
                    setTestTypeSelection('flashcard');
                    setShowTest(true);
                  }}
                  className="p-4 md:p-6 rounded-xl border-2 hover:shadow-lg transition-all"
                  style={{ borderColor: themeColor }}
                >
                  <BookOpen className="w-8 md:w-10 h-8 md:h-10 mx-auto mb-2 md:mb-3" style={{ color: themeColor }} />
                  <h3 className="text-xs md:text-lg font-bold" style={{ color: themeColor }}>
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
          </div>
        )}
      </div>

      {/* Unified Download Modal */}
      {showUnifiedDownloadModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => !isGenerating && setShowUnifiedDownloadModal(false)}>
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden"
            style={{ animation: 'fadeScaleIn 0.2s ease-out' }}
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 pt-5 pb-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${themeColor}15` }}>
                    <Download className="w-5 h-5" style={{ color: themeColor }} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">시험지 다운로드</h2>
                    <p className="text-xs text-gray-500">{selectedWords.length}개 단어 선택됨</p>
                  </div>
                </div>
                <button
                  onClick={() => !isGenerating && setShowUnifiedDownloadModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
                  disabled={isGenerating}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="px-6 py-5 space-y-5">
              {/* Step 1: Language Direction */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Languages className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-semibold text-gray-700">시험 방향</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { key: 'eng_to_kor' as const, label: 'English', sublabel: '한글', desc: '영어 보고 한글 쓰기', icon: 'E\u2192\uD55C' },
                    { key: 'kor_to_eng' as const, label: '한글', sublabel: 'English', desc: '한글 보고 영어 쓰기', icon: '\uD55C\u2192E' },
                    { key: 'eng_only' as const, label: 'Word', sublabel: 'Definition', desc: '영어 정의 쓰기', icon: 'E\u2192Def' },
                  ]).map((dir) => {
                    const isSelected = downloadDirection === dir.key;
                    return (
                      <button
                        key={dir.key}
                        onClick={() => setDownloadDirection(dir.key)}
                        className={`relative flex flex-col items-center gap-1 px-3 py-3 rounded-xl border-2 transition-all duration-200 ${
                          isSelected
                            ? 'shadow-md scale-[1.02]'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                        style={isSelected ? {
                          borderColor: themeColor,
                          backgroundColor: `${themeColor}08`,
                        } : undefined}
                      >
                        {isSelected && (
                          <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: themeColor }}>
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                        <span className={`text-base font-bold ${isSelected ? '' : 'text-gray-600'}`} style={isSelected ? { color: themeColor } : undefined}>
                          {dir.icon}
                        </span>
                        <span className={`text-[11px] leading-tight text-center ${isSelected ? 'text-gray-700' : 'text-gray-500'}`}>
                          {dir.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>
                {/* Preview hint */}
                <div className="mt-2.5 px-3 py-2 rounded-lg bg-gray-50 border border-gray-100">
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-gray-400 shrink-0">미리보기:</span>
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="font-semibold text-gray-700 truncate">
                        {downloadDirection === 'kor_to_eng' ? '포기하다' : 'abandon'}
                      </span>
                      <ArrowRightLeft className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                      <span className="text-gray-400 italic truncate">
                        {downloadDirection === 'eng_to_kor'
                          ? '( 한글 뜻 작성 )'
                          : downloadDirection === 'kor_to_eng'
                          ? '( 영어 단어 작성 )'
                          : '( 영어 정의 작성 )'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 2: File Format */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-semibold text-gray-700">파일 형식</span>
                </div>
                <div className="flex gap-2">
                  {([
                    { key: 'pdf' as const, label: 'PDF', desc: '바로 인쇄 가능' },
                    { key: 'word' as const, label: 'Word', desc: '편집 가능 (.docx)' },
                  ]).map((fmt) => {
                    const isSelected = downloadFormat === fmt.key;
                    return (
                      <button
                        key={fmt.key}
                        onClick={() => setDownloadFormat(fmt.key)}
                        className={`flex-1 flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all duration-200 ${
                          isSelected
                            ? 'shadow-sm'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                        style={isSelected ? {
                          borderColor: themeColor,
                          backgroundColor: `${themeColor}08`,
                        } : undefined}
                      >
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                          isSelected ? '' : 'border-gray-300'
                        }`} style={isSelected ? { borderColor: themeColor, backgroundColor: themeColor } : undefined}>
                          {isSelected && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <div className="text-left">
                          <span className={`text-sm font-semibold ${isSelected ? '' : 'text-gray-700'}`} style={isSelected ? { color: themeColor } : undefined}>
                            {fmt.label}
                          </span>
                          <span className="text-[11px] text-gray-400 ml-1.5">{fmt.desc}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 3: Download Type */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Download className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-semibold text-gray-700">다운로드 종류</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { key: 'test' as const, label: '시험지', desc: '빈칸 시험용', hoverBorder: 'hover:border-teal-400', hoverBg: 'hover:bg-teal-50', color: '#0D9488', iconColor: 'group-hover:text-teal-500', labelColor: 'group-hover:text-teal-700', descColor: 'group-hover:text-teal-400' },
                    { key: 'answer' as const, label: '답안지', desc: '정답 표시', hoverBorder: 'hover:border-orange-400', hoverBg: 'hover:bg-orange-50', color: '#EA580C', iconColor: 'group-hover:text-orange-500', labelColor: 'group-hover:text-orange-700', descColor: 'group-hover:text-orange-400' },
                    { key: 'both' as const, label: '전체', desc: '시험지+답안지', hoverBorder: 'hover:border-blue-400', hoverBg: 'hover:bg-blue-50', color: '#3B82F6', iconColor: 'group-hover:text-blue-500', labelColor: 'group-hover:text-blue-700', descColor: 'group-hover:text-blue-400' },
                  ]).map((type) => (
                    <button
                      key={type.key}
                      disabled={isGenerating}
                      onClick={async () => {
                        setIsGenerating(true);
                        try {
                          if (downloadFormat === 'pdf') {
                            await generatePdfDocument(type.key, downloadDirection);
                          } else {
                            await generateWordDocument(type.key, downloadDirection);
                          }
                        } catch (err) {
                          console.error('Download generation failed:', err);
                        } finally {
                          setIsGenerating(false);
                        }
                      }}
                      className={`group flex flex-col items-center justify-center gap-1.5 px-3 py-4 bg-white rounded-xl border-2 border-gray-200 cursor-pointer ${type.hoverBorder} ${type.hoverBg} hover:shadow-lg hover:scale-[1.03] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none`}
                    >
                      {isGenerating ? (
                        <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
                      ) : (
                        <FileText className={`w-6 h-6 text-gray-400 ${type.iconColor} transition-colors`} />
                      )}
                      <span className={`text-sm font-semibold text-gray-700 ${type.labelColor} transition-colors`}>{type.label}</span>
                      <span className={`flex items-center gap-1 text-xs text-gray-400 ${type.descColor} transition-colors`}>
                        <Download className="w-3 h-3" /> {downloadFormat === 'pdf' ? 'PDF' : 'Word'}
                      </span>
                      <span className={`text-[10px] text-gray-400 ${type.descColor} mt-0.5 transition-colors`}>{type.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-100">
              <p className="text-[11px] text-gray-400 text-center">
                시험 방향과 파일 형식을 선택한 후 다운로드 버튼을 클릭하세요
              </p>
            </div>
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