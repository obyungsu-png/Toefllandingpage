import { useState, useRef, useCallback } from 'react';
import { Button } from './ui/button';
import { Eye, Save, RotateCcw, CheckCircle, XCircle, Type, Eraser, Lightbulb, Copy, FileText } from 'lucide-react';
// motion removed - using CSS animations
import type { TPOQuestion } from './ContentManagement';

interface BlankDef {
  id: number;
  fullWord: string;    // The complete word
  prefix: string;      // Visible part before blank
  answer: string;      // Hidden letters (the answer)
  maxLength: number;   // Max input length
  startIndex: number;  // Position in the original text
  endIndex: number;    // End position in the original text
}

interface FillBlanksEditorProps {
  onSave?: (question: TPOQuestion) => void;
  initialPassage?: string;
  initialBlanks?: BlankDef[];
  testType?: string;
  testNumber?: number;
}

export function FillBlanksEditor({ onSave, initialPassage, initialBlanks, testType = 'TPO', testNumber = 1 }: FillBlanksEditorProps) {
  const [rawText, setRawText] = useState(initialPassage || '');
  const [blanks, setBlanks] = useState<BlankDef[]>(initialBlanks || []);
  const [previewMode, setPreviewMode] = useState(false);
  const [testMode, setTestMode] = useState(false);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [markedText, setMarkedText] = useState(''); // Text with [answer:maxLen] markers
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [selectionInfo, setSelectionInfo] = useState<{ word: string; prefix: string; answer: string; start: number; end: number } | null>(null);
  const [blankMode, setBlankMode] = useState<'auto' | 'manual'>('auto');
  const [autoBlankCount, setAutoBlankCount] = useState(10);
  const [autoBlankDifficulty, setAutoBlankDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  
  // Question metadata fields
  const [questionNumber, setQuestionNumber] = useState('1-10');
  const [questionType, setQuestionType] = useState('Complete Words');
  const [questionText, setQuestionText] = useState('Fill in the missing letters in the paragraph.');
  const [module, setModule] = useState<'Module 1' | 'Module 2'>('Module 1');

  // Parse marked text to extract blanks
  const parseMarkedText = useCallback((text: string) => {
    const regex = /(\S*?)\[([^\]]+):(\d+)\](\S*)/g;
    const newBlanks: BlankDef[] = [];
    let match;
    let id = 0;

    while ((match = regex.exec(text)) !== null) {
      const prefix = match[1]; // text before the blank in same word
      const answer = match[2];
      const maxLength = parseInt(match[3]);
      
      newBlanks.push({
        id: id++,
        fullWord: prefix + answer,
        prefix,
        answer,
        maxLength,
        startIndex: match.index,
        endIndex: match.index + match[0].length
      });
    }
    
    setBlanks(newBlanks);
    return newBlanks;
  }, []);

  // Auto-generate blanks from plain text
  const autoGenerateBlanks = () => {
    if (!rawText.trim()) return;

    const words = rawText.split(/\s+/).filter(w => w.length > 2);
    const eligibleWords: Array<{ word: string; index: number }> = [];

    // Find word positions in original text
    let searchPos = 0;
    for (const word of words) {
      const cleanWord = word.replace(/[.,;:!?'"()]/g, '');
      if (cleanWord.length < 3) continue;
      
      const idx = rawText.indexOf(word, searchPos);
      if (idx !== -1) {
        eligibleWords.push({ word: cleanWord, index: idx });
        searchPos = idx + word.length;
      }
    }

    // Filter by difficulty
    let filtered = eligibleWords;
    if (autoBlankDifficulty === 'easy') {
      filtered = eligibleWords.filter(w => w.word.length >= 4 && w.word.length <= 7);
    } else if (autoBlankDifficulty === 'medium') {
      filtered = eligibleWords.filter(w => w.word.length >= 3);
    } else {
      filtered = eligibleWords.filter(w => w.word.length >= 3);
    }

    // Randomly select words, ensuring they're spaced apart
    const selected: typeof filtered = [];
    const shuffled = [...filtered].sort(() => Math.random() - 0.5);
    
    for (const word of shuffled) {
      if (selected.length >= autoBlankCount) break;
      
      // Ensure minimum spacing between blanks
      const tooClose = selected.some(s => Math.abs(s.index - word.index) < 30);
      if (!tooClose) {
        selected.push(word);
      }
    }

    // Sort by position
    selected.sort((a, b) => a.index - b.index);

    // Generate marked text
    let result = rawText;
    let offset = 0;
    const newBlanks: BlankDef[] = [];

    selected.forEach((item, idx) => {
      const word = item.word;
      let hiddenStart: number;
      let prefix: string;
      let answer: string;

      if (autoBlankDifficulty === 'easy') {
        // Easy: hide last 2-3 letters
        hiddenStart = Math.max(1, word.length - 3);
        prefix = word.slice(0, hiddenStart);
        answer = word.slice(hiddenStart);
      } else if (autoBlankDifficulty === 'medium') {
        // Medium: hide 40-60% of letters from the end
        hiddenStart = Math.max(1, Math.floor(word.length * 0.4));
        prefix = word.slice(0, hiddenStart);
        answer = word.slice(hiddenStart);
      } else {
        // Hard: hide most letters, keep only 1-2
        hiddenStart = Math.min(2, Math.floor(word.length * 0.2));
        prefix = word.slice(0, hiddenStart);
        answer = word.slice(hiddenStart);
      }

      const marker = `${prefix}[${answer}:${answer.length}]`;
      
      // Find the word in the current result text
      const wordPos = result.indexOf(word, item.index + offset);
      if (wordPos !== -1) {
        result = result.slice(0, wordPos) + marker + result.slice(wordPos + word.length);
        offset += marker.length - word.length;
      }

      newBlanks.push({
        id: idx,
        fullWord: word,
        prefix,
        answer,
        maxLength: answer.length,
        startIndex: item.index,
        endIndex: item.index + word.length
      });
    });

    setMarkedText(result);
    setBlanks(newBlanks);
  };

  // Handle manual text selection for creating blanks
  const handleTextSelection = () => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    
    if (start === end) return;

    const selectedText = markedText.slice(start, end);
    if (!selectedText.trim()) return;

    // Determine prefix and answer
    // Default: first 1-2 chars are prefix, rest is answer
    const prefixLen = Math.min(2, Math.floor(selectedText.length * 0.3));
    const prefix = selectedText.slice(0, prefixLen);
    const answer = selectedText.slice(prefixLen);

    setSelectionInfo({
      word: selectedText,
      prefix,
      answer,
      start,
      end
    });
  };

  // Apply the manual blank selection
  const applyManualBlank = () => {
    if (!selectionInfo) return;

    const { word, prefix, answer, start, end } = selectionInfo;
    const marker = `${prefix}[${answer}:${answer.length}]`;
    
    const newMarkedText = markedText.slice(0, start) + marker + markedText.slice(end);
    setMarkedText(newMarkedText);
    parseMarkedText(newMarkedText);
    setSelectionInfo(null);
  };

  // Update manual blank with custom prefix/answer split
  const updateBlankSplit = (prefixLen: number) => {
    if (!selectionInfo) return;
    const prefix = selectionInfo.word.slice(0, prefixLen);
    const answer = selectionInfo.word.slice(prefixLen);
    setSelectionInfo({ ...selectionInfo, prefix, answer });
  };

  // Get display text (replacing markers with visual blanks)
  const getDisplayParts = () => {
    const text = markedText || rawText;
    const parts: Array<{ type: 'text' | 'blank'; content: string; blankId?: number; prefix?: string; maxLength?: number }> = [];
    
    const regex = /(\S*?)\[([^\]]+):(\d+)\](\S*)/g;
    let lastIndex = 0;
    let match;
    let blankId = 0;

    while ((match = regex.exec(text)) !== null) {
      // Add text before this match
      if (match.index > lastIndex) {
        parts.push({ type: 'text', content: text.slice(lastIndex, match.index) });
      }

      const prefix = match[1];
      const answer = match[2];
      const maxLength = parseInt(match[3]);

      parts.push({
        type: 'blank',
        content: answer,
        blankId: blankId++,
        prefix,
        maxLength
      });

      // Add trailing text after the bracket if any non-word chars
      if (match[4]) {
        parts.push({ type: 'text', content: match[4] });
      }

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push({ type: 'text', content: text.slice(lastIndex) });
    }

    return parts;
  };

  // Check answers
  const checkAnswers = () => {
    setShowResults(true);
  };

  const getScore = () => {
    let correct = 0;
    blanks.forEach((blank) => {
      const userAnswer = (userAnswers[blank.id] || '').toLowerCase().trim();
      if (userAnswer === blank.answer.toLowerCase()) {
        correct++;
      }
    });
    return { correct, total: blanks.length };
  };

  // Reset test
  const resetTest = () => {
    setUserAnswers({});
    setShowResults(false);
  };

  // Save as TPOQuestion
  const handleSave = () => {
    if (!onSave || blanks.length === 0) return;

    // Build the passage text with [answer:maxLength] format
    const question: TPOQuestion = {
      id: `q-fillblanks-${Date.now()}`,
      questionNumber: questionNumber, // Keep as string to support "1-10" format
      questionText: questionText,
      questionType: `${questionType} (${module})`, // Include module in questionType
      passageText: markedText || rawText,
      blanks: blanks.map(b => ({
        answer: b.answer,
        maxLength: b.maxLength
      })),
      difficulty: autoBlankDifficulty === 'easy' ? '쉬움' : autoBlankDifficulty === 'hard' ? '어려움' : '보통'
    };

    onSave(question);
  };

  // Copy marked text to clipboard
  const copyMarkedText = () => {
    navigator.clipboard.writeText(markedText);
  };

  // Get plain text from marked text (for display)
  const getPlainFromMarked = (text: string) => {
    return text.replace(/(\S*?)\[([^\]]+):(\d+)\]/g, (_, prefix, answer) => prefix + answer);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#2d7a7c] to-[#1e6b73] p-4 md:p-5">
        <h2 className="text-lg md:text-xl text-white font-bold flex items-center gap-2">
          <Type className="w-5 h-5" />
          Fill in the Blanks - Question Builder
        </h2>
        <p className="text-white/80 text-sm mt-1">
          글을 입력하고 빈칸을 생성하면 바로 실전 문제로 사용할 수 있습니다
        </p>
      </div>

      <div className="p-4 md:p-6 space-y-5">
        {/* Mode Tabs */}
        <div className="flex gap-2 border-b border-gray-200 pb-3">
          <button
            onClick={() => { setPreviewMode(false); setTestMode(false); }}
            className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-all ${
              !previewMode && !testMode 
                ? 'bg-[#2d7a7c] text-white' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Edit
          </button>
          <button
            onClick={() => { setPreviewMode(true); setTestMode(false); }}
            className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-all ${
              previewMode && !testMode 
                ? 'bg-[#2d7a7c] text-white' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            disabled={blanks.length === 0}
          >
            <Eye className="w-4 h-4 inline mr-1" />
            Preview
          </button>
          <button
            onClick={() => { setPreviewMode(false); setTestMode(true); resetTest(); }}
            className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-all ${
              testMode 
                ? 'bg-[#e67e22] text-white' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            disabled={blanks.length === 0}
          >
            <CheckCircle className="w-4 h-4 inline mr-1" />
            Test & Score
          </button>
        </div>

        {/* Question Metadata Fields - ALWAYS VISIBLE */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border-2 border-blue-200 shadow-sm">
          <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            문제 정보 (빌리밍 1-10번 하나의 문제로 입력)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Question Number <span className="text-red-500">*</span>
                <span className="text-xs text-gray-500 ml-1">(예: 1-10)</span>
              </label>
              <input
                type="text"
                value={questionNumber}
                onChange={(e) => setQuestionNumber(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#2d7a7c] focus:border-transparent"
                placeholder="1-10"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Question Type <span className="text-red-500">*</span>
              </label>
              <select
                value={questionType}
                onChange={(e) => setQuestionType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#2d7a7c] focus:border-transparent"
              >
                <option value="Complete Words">Complete Words</option>
                <option value="Fill in the Blanks">Fill in the Blanks</option>
                <option value="Cloze Test">Cloze Test</option>
              </select>
            </div>
          </div>
          <div className="mt-3">
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Question Text <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#2d7a7c] focus:border-transparent"
              placeholder="Fill in the missing letters in the paragraph."
            />
          </div>
          <div className="mt-3">
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Module <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              {(['Module 1', 'Module 2'] as const).map((mod) => (
                <button
                  key={mod}
                  type="button"
                  onClick={() => setModule(mod)}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold border-2 transition-all ${
                    module === mod
                      ? mod === 'Module 1'
                        ? 'bg-[#2d7a7c] border-[#2d7a7c] text-white shadow-sm'
                        : 'bg-orange-500 border-orange-500 text-white shadow-sm'
                      : 'bg-white border-gray-200 text-gray-500 hover:border-gray-400'
                  }`}
                >
                  {mod}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* EDIT MODE */}
        {!previewMode && !testMode && (
          <div className="space-y-4">
            {/* Step 1: Input Text */}
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-2">
                Step 1: 원문 입력
              </label>
              <textarea
                value={rawText}
                onChange={(e) => {
                  setRawText(e.target.value);
                  if (!markedText) setMarkedText(e.target.value);
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2d7a7c] focus:border-transparent font-['Georgia',_serif] text-base leading-relaxed"
                rows={8}
                placeholder="영어 지문을 여기에 붙여넣기 하세요..."
              />
            </div>

            {/* Step 2: Generate Blanks */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <label className="block text-sm font-bold text-gray-800 mb-3">
                Step 2: 빈칸 생성 방법 선택
              </label>

              <div className="flex gap-3 mb-4">
                <button
                  onClick={() => setBlankMode('auto')}
                  className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    blankMode === 'auto'
                      ? 'bg-[#2d7a7c] text-white shadow-md'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <Lightbulb className="w-4 h-4 inline mr-1" />
                  자동 생성
                </button>
                <button
                  onClick={() => setBlankMode('manual')}
                  className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    blankMode === 'manual'
                      ? 'bg-[#2d7a7c] text-white shadow-md'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <Type className="w-4 h-4 inline mr-1" />
                  수동 마킹
                </button>
              </div>

              {blankMode === 'auto' ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">빈칸 개수</label>
                      <select
                        value={autoBlankCount}
                        onChange={(e) => setAutoBlankCount(parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#2d7a7c]"
                      >
                        {[5, 8, 10, 12, 15].map(n => (
                          <option key={n} value={n}>{n}개</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">난이도</label>
                      <select
                        value={autoBlankDifficulty}
                        onChange={(e) => setAutoBlankDifficulty(e.target.value as any)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#2d7a7c]"
                      >
                        <option value="easy">쉬움 (끝 2-3자)</option>
                        <option value="medium">보통 (40-60%)</option>
                        <option value="hard">어려움 (대부분)</option>
                      </select>
                    </div>
                  </div>
                  <Button
                    onClick={autoGenerateBlanks}
                    className="w-full bg-gradient-to-r from-[#e67e22] to-[#f39c12] text-white hover:from-[#d35400] hover:to-[#e67e22]"
                    disabled={!rawText.trim()}
                  >
                    <Lightbulb className="w-4 h-4 mr-2" />
                    자동으로 빈칸 생성
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-gray-600">
                    아래 텍스트에서 빈칸으로 만들 단어를 선택(드래그)한 후 "빈칸 만들기" 버튼을 클릭하세요.
                    또는 직접 <code className="bg-gray-200 px-1 rounded">mi[ght:3]</code> 형식으로 입력하세요.
                  </p>
                  <textarea
                    ref={textareaRef}
                    value={markedText}
                    onChange={(e) => {
                      setMarkedText(e.target.value);
                      parseMarkedText(e.target.value);
                    }}
                    onMouseUp={handleTextSelection}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2d7a7c] focus:border-transparent font-mono text-sm leading-relaxed"
                    rows={8}
                    placeholder="원문이 여기에 표시됩니다. 빈칸으로 만들 부분을 선택하세요."
                  />

                  <>
                    {selectionInfo && (
                      <div
                        className="bg-blue-50 border border-blue-200 rounded-lg p-3 animate-[fadeSlideUp_0.2s_ease-out]"
                      >
                        <p className="text-sm font-medium text-blue-800 mb-2">
                          선택한 단어: <strong>"{selectionInfo.word}"</strong>
                        </p>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs text-blue-700">보이는 부분:</span>
                          <div className="flex gap-1">
                            {selectionInfo.word.split('').map((char, i) => (
                              <button
                                key={i}
                                onClick={() => updateBlankSplit(i + 1)}
                                className={`w-6 h-6 text-xs font-mono rounded ${
                                  i < selectionInfo.prefix.length
                                    ? 'bg-green-200 text-green-800 border border-green-400'
                                    : 'bg-red-200 text-red-800 border border-red-400'
                                }`}
                              >
                                {char}
                              </button>
                            ))}
                          </div>
                        </div>
                        <p className="text-xs text-blue-600 mb-2">
                          미리보기: {selectionInfo.prefix}<span className="bg-yellow-200 px-1">{'_'.repeat(selectionInfo.answer.length)}</span>
                          {' '}(정답: {selectionInfo.answer})
                        </p>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={applyManualBlank} className="bg-[#2d7a7c] text-white text-xs">
                            빈칸 만들기
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setSelectionInfo(null)} className="text-xs">
                            취소
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                </div>
              )}
            </div>

            {/* Detected Blanks Summary */}
            {blanks.length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-bold text-green-800">
                    감지된 빈칸: {blanks.length}개
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={copyMarkedText} className="text-xs">
                      <Copy className="w-3 h-3 mr-1" />
                      마킹 복사
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => { setBlanks([]); setMarkedText(rawText); }}
                      className="text-xs text-red-600 border-red-300 hover:bg-red-50"
                    >
                      <Eraser className="w-3 h-3 mr-1" />
                      초기화
                    </Button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {blanks.map((blank) => (
                    <span key={blank.id} className="inline-flex items-center px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-xs font-mono">
                      #{blank.id + 1}: {blank.prefix}<span className="text-red-600 font-bold">{blank.answer}</span>
                      <span className="ml-1 text-green-500">({blank.maxLength}자)</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* PREVIEW MODE */}
        {previewMode && !testMode && (
          <div className="space-y-4">
            <div className="bg-gray-100 rounded-lg p-2">
              <div className="bg-[#1e6b73] h-10 flex items-center px-4 rounded-t">
                <span className="text-white font-bold text-sm">*toefl ibt</span>
              </div>
              <div className="bg-white p-6 md:p-10 rounded-b">
                <h2 className="text-xl md:text-2xl font-bold text-center text-black mb-6 font-['Segoe_UI',_Tahoma,_Geneva,_Verdana,_sans-serif]">
                  Fill in the missing letters in the paragraph.
                </h2>
                <div className="max-w-[800px] mx-auto text-base md:text-lg leading-relaxed text-[#333] font-['Segoe_UI',_Tahoma,_Geneva,_Verdana,_sans-serif]">
                  {getDisplayParts().map((part, idx) => {
                    if (part.type === 'text') {
                      return <span key={idx}>{part.content}</span>;
                    }
                    return (
                      <span key={idx} className="inline-flex items-baseline">
                        <span>{part.prefix}</span>
                        <span className="inline-block border-b-2 border-dashed border-[#1e6b73] mx-0.5 text-center text-transparent bg-[#f0f9f9]"
                          style={{ width: `${(part.maxLength || 3) * 16}px` }}
                        >
                          {'_'.repeat(part.maxLength || 3)}
                        </span>
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TEST & SCORE MODE */}
        {testMode && (
          <div className="space-y-4">
            <div className="bg-gray-100 rounded-lg p-2">
              <div className="bg-[#1e6b73] h-10 flex items-center justify-between px-4 rounded-t">
                <span className="text-white font-bold text-sm">*toefl ibt - Test Mode</span>
                {showResults && (
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold px-3 py-1 rounded-full ${
                      getScore().correct === getScore().total
                        ? 'bg-green-400 text-green-900'
                        : getScore().correct >= getScore().total * 0.7
                        ? 'bg-yellow-300 text-yellow-900'
                        : 'bg-red-400 text-red-900'
                    }`}>
                      {getScore().correct}/{getScore().total}
                    </span>
                  </div>
                )}
              </div>
              <div className="bg-white p-6 md:p-10 rounded-b">
                <h2 className="text-xl md:text-2xl font-bold text-center text-black mb-6 font-['Segoe_UI',_Tahoma,_Geneva,_Verdana,_sans-serif]">
                  Fill in the missing letters in the paragraph.
                </h2>
                <div className="max-w-[800px] mx-auto text-base md:text-lg leading-relaxed text-[#333] font-['Segoe_UI',_Tahoma,_Geneva,_Verdana,_sans-serif]">
                  {getDisplayParts().map((part, idx) => {
                    if (part.type === 'text') {
                      return <span key={idx}>{part.content}</span>;
                    }
                    
                    const blankId = part.blankId!;
                    const userAnswer = userAnswers[blankId] || '';
                    const isCorrect = userAnswer.toLowerCase().trim() === part.content.toLowerCase();
                    const isFilled = userAnswer.length >= (part.maxLength || 1);

                    return (
                      <span key={idx} className="inline-flex items-baseline">
                        <span>{part.prefix}</span>
                        <span className="relative inline-flex items-baseline mx-0.5">
                          <input
                            type="text"
                            value={userAnswer}
                            onChange={(e) => {
                              const val = e.target.value;
                              setUserAnswers(prev => ({ ...prev, [blankId]: val }));
                              // Auto-focus next input
                              if (val.length === part.maxLength) {
                                const nextInput = document.querySelector(`[data-blank-id="${blankId + 1}"]`) as HTMLInputElement;
                                if (nextInput) nextInput.focus();
                              }
                            }}
                            maxLength={part.maxLength}
                            data-blank-id={blankId}
                            className={`inline-block border-b-2 text-center outline-none bg-transparent font-['Segoe_UI',_Tahoma,_Geneva,_Verdana,_sans-serif] ${
                              showResults
                                ? isCorrect
                                  ? 'border-green-500 text-green-700 bg-green-50'
                                  : 'border-red-500 text-red-700 bg-red-50'
                                : isFilled
                                ? 'border-[#1e6b73] text-[#333]'
                                : 'border-dashed border-gray-400 text-gray-800'
                            }`}
                            style={{ width: `${(part.maxLength || 3) * 16}px`, fontSize: 'inherit' }}
                            disabled={showResults}
                          />
                          {showResults && !isCorrect && (
                            <span className="absolute -bottom-5 left-0 text-xs text-green-600 font-mono whitespace-nowrap">
                              {part.content}
                            </span>
                          )}
                        </span>
                        {showResults && (
                          <span className="inline-flex ml-0.5">
                            {isCorrect ? (
                              <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                            ) : (
                              <XCircle className="w-3.5 h-3.5 text-red-500" />
                            )}
                          </span>
                        )}
                      </span>
                    );
                  })}
                </div>

                {/* Score Results */}
                <>
                  {showResults && (
                    <div
                      className="mt-8 p-4 rounded-lg border-2 text-center animate-[fadeSlideUp_0.3s_ease-out]"
                      style={{
                        borderColor: getScore().correct === getScore().total ? '#22c55e' : getScore().correct >= getScore().total * 0.7 ? '#eab308' : '#ef4444',
                        backgroundColor: getScore().correct === getScore().total ? '#f0fdf4' : getScore().correct >= getScore().total * 0.7 ? '#fefce8' : '#fef2f2'
                      }}
                    >
                      <p className="text-2xl font-bold mb-1">
                        {getScore().correct} / {getScore().total}
                      </p>
                      <p className="text-sm text-gray-600">
                        {getScore().correct === getScore().total
                          ? 'Perfect! All correct!'
                          : `${Math.round((getScore().correct / getScore().total) * 100)}% correct`}
                      </p>
                    </div>
                  )}
                </>
              </div>
            </div>

            {/* Test Actions */}
            <div className="flex gap-3 justify-center">
              {!showResults ? (
                <Button
                  onClick={checkAnswers}
                  className="bg-gradient-to-r from-[#e67e22] to-[#f39c12] text-white hover:from-[#d35400] hover:to-[#e67e22] px-8"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  채점하기
                </Button>
              ) : (
                <Button
                  onClick={resetTest}
                  className="bg-gradient-to-r from-[#2d7a7c] to-[#1e6b73] text-white px-8"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  다시 풀기
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {!testMode && blanks.length > 0 && onSave && (
          <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
            <Button
              onClick={handleSave}
              className="bg-gradient-to-r from-[#2d7a7c] to-[#1e6b73] text-white hover:from-[#1e6b73] hover:to-[#005f61]"
            >
              <Save className="w-4 h-4 mr-2" />
              {testType} {testNumber}에 저장
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}