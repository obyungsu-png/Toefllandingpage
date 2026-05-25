import { useState } from 'react';
import { Button } from './ui/button';
import { BookOpen, Save, Eye } from 'lucide-react';
import type { TPOQuestion } from './ContentManagement';

interface AcademicReadingBuilderProps {
  onSave?: (question: TPOQuestion) => void;
  testType?: string;
  testNumber?: number;
}

export function AcademicReadingBuilder({ onSave, testType = 'TPO', testNumber = 1 }: AcademicReadingBuilderProps) {
  const [questionNumber, setQuestionNumber] = useState('16');
  const [questionType, setQuestionType]     = useState('Main Idea');
  const [module, setModule]                 = useState<'Module 1' | 'Module 2'>('Module 1');
  const [difficulty, setDifficulty]         = useState<'쉬움' | '보통' | '어려움'>('보통');

  const [passageTitle, setPassageTitle] = useState('');
  const [passageText,  setPassageText]  = useState('');
  const [questionText, setQuestionText] = useState('');
  const [options, setOptions]           = useState(['', '', '', '']);
  const [correctAnswer, setCorrectAnswer] = useState('');

  const [previewMode, setPreviewMode] = useState(false);

  const canPreview = passageTitle && passageText && questionText && options.filter(o=>o.trim()).length >= 2 && correctAnswer;
  const canSave    = canPreview && !!onSave;

  const handleSave = () => {
    if (!canSave) { alert('모든 필드를 채워주세요.'); return; }
    const question: TPOQuestion = {
      id: `q-academic-${Date.now()}`,
      questionNumber,
      questionText: questionText,
      questionType: `Academic Reading (${module})`,
      passageText: JSON.stringify({ title: passageTitle, passage: passageText, questions: [{ questionText, options: options.filter(o=>o.trim()), correctAnswer }] }),
      options: options.filter(o => o.trim()),
      correctAnswer,
      difficulty,
      passageTitle,
    };
    onSave!(question);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#2d7a7c] to-[#1e6b73] p-4 md:p-5">
        <h2 className="text-lg md:text-xl text-white font-bold flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          Academic Reading - Question Builder
        </h2>
        <p className="text-white/80 text-sm mt-1">지문과 질문을 입력하여 TPO 16-20번 문제를 만드세요</p>
      </div>

      <div className="p-4 md:p-6 space-y-5">
        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-200 pb-3">
          <button onClick={() => setPreviewMode(false)}
            className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-all ${!previewMode ? 'bg-[#2d7a7c] text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
            Edit
          </button>
          <button onClick={() => setPreviewMode(true)}
            className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-all flex items-center gap-1 ${previewMode ? 'bg-[#2d7a7c] text-white' : 'text-gray-600 hover:bg-gray-100'}`}
            disabled={!canPreview}>
            <Eye className="w-4 h-4" /> Preview
          </button>
        </div>

        {!previewMode && (
          <div className="space-y-5">
            {/* ── 문제 정보 ── */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border-2 border-blue-200">
              <p className="text-sm font-bold text-gray-800 mb-3">📄 문제 정보</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {/* Question Number */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">번호 <span className="text-red-500">*</span></label>
                  <input type="text" value={questionNumber} onChange={e => setQuestionNumber(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#2d7a7c]"
                    placeholder="16" />
                </div>
                {/* Question Type */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">유형 <span className="text-red-500">*</span></label>
                  <select value={questionType} onChange={e => setQuestionType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#2d7a7c]">
                    <option>Main Idea</option>
                    <option>Detail</option>
                    <option>Inference</option>
                    <option>Vocabulary</option>
                    <option>Purpose</option>
                  </select>
                </div>
                {/* Module */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Module <span className="text-red-500">*</span></label>
                  <select value={module} onChange={e => setModule(e.target.value as 'Module 1' | 'Module 2')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#2d7a7c]">
                    <option>Module 1</option>
                    <option>Module 2</option>
                  </select>
                </div>
                {/* Difficulty */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">난이도 <span className="text-red-500">*</span></label>
                  <div className="flex gap-1">
                    {(['쉬움','보통','어려움'] as const).map(lv => (
                      <button key={lv} type="button" onClick={() => setDifficulty(lv)}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-medium border-2 transition-all ${
                          difficulty === lv
                            ? lv === '쉬움' ? 'bg-green-100 border-green-500 text-green-700'
                              : lv === '보통' ? 'bg-blue-100 border-blue-500 text-blue-700'
                              : 'bg-red-100 border-red-500 text-red-700'
                            : 'bg-white border-gray-200 text-gray-500 hover:border-gray-400'
                        }`}>
                        {lv === '쉬움' ? '🟢' : lv === '보통' ? '🔵' : '🔴'} {lv}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* ── Step 1: 지문 제목 ── */}
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-2">
                Step 1: 지문 제목 <span className="text-red-500">*</span>
              </label>
              <input type="text" value={passageTitle} onChange={e => setPassageTitle(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2d7a7c] text-base font-semibold"
                placeholder="예: The Mirror Test" />
            </div>

            {/* ── Step 2: 지문 ── */}
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-2">
                Step 2: 지문 입력 <span className="text-red-500">*</span>
              </label>
              <textarea value={passageText} onChange={e => setPassageText(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2d7a7c] font-['Georgia',_serif] text-base leading-relaxed"
                rows={10} placeholder="긴 academic reading 지문을 입력하세요..." />
            </div>

            {/* ── Step 3: 질문 ── */}
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-2">
                Step 3: 질문 <span className="text-red-500">*</span>
              </label>
              <textarea value={questionText} onChange={e => setQuestionText(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2d7a7c] text-sm"
                rows={2} placeholder="예: Which of the following best states a main idea of the passage?" />
            </div>

            {/* ── Step 4: 선택지 + 정답 ── */}
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-2">
                Step 4: 선택지 &amp; 정답 <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2 mb-3">
                {options.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input type="radio" name="correctAnswer"
                      checked={correctAnswer === opt && opt.trim() !== ''}
                      onChange={() => setCorrectAnswer(opt)}
                      className="accent-[#1e6b73]" />
                    <input type="text" value={opt}
                      onChange={e => { const n=[...options]; n[i]=e.target.value; setOptions(n); }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#2d7a7c]"
                      placeholder={`선택지 ${i+1}`} />
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500">정답 옵션의 라디오 버튼을 선택하세요</p>
            </div>

            {/* ── Save ── */}
            {onSave && (
              <div className="flex justify-end pt-3 border-t border-gray-200">
                <Button onClick={handleSave}
                  disabled={!canSave}
                  className="bg-gradient-to-r from-[#2d7a7c] to-[#1e6b73] text-white disabled:opacity-50">
                  <Save className="w-4 h-4 mr-2" />
                  {testType} {testNumber}에 저장
                </Button>
              </div>
            )}
          </div>
        )}

        {/* ── PREVIEW ── */}
        {previewMode && canPreview && (
          <div className="rounded-lg overflow-hidden border border-gray-300">
            <div className="bg-[#1e6b73] h-10 flex items-center px-4">
              <span className="text-white font-bold text-sm">*toefl ibt</span>
            </div>
            <div className="bg-white p-6 md:p-10">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h2 className="text-xl font-bold text-center text-black mb-4">{passageTitle}</h2>
                  <p className="text-base leading-relaxed text-[#333] font-['Georgia',_serif] whitespace-pre-wrap">{passageText}</p>
                </div>
                <div className="border-l-2 border-gray-200 pl-8 space-y-4">
                  <p className="font-bold text-base text-gray-900">{questionText}</p>
                  <div className="space-y-3">
                    {options.filter(o=>o.trim()).map((opt, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 mt-0.5 flex-shrink-0 ${opt===correctAnswer ? 'border-[#1e6b73] bg-[#1e6b73]' : 'border-gray-400'}`} />
                        <span className={`text-sm ${opt===correctAnswer ? 'font-semibold text-[#1e6b73]' : 'text-gray-800'}`}>{opt}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">✅ 정답: {correctAnswer}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
