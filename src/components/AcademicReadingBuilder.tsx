import { useState } from 'react';
import { Button } from './ui/button';
import { BookOpen, Plus, Trash2, Save, Eye, FileText, X } from 'lucide-react';
import type { TPOQuestion } from './ContentManagement';

interface AcademicQuestion {
  id: string;
  questionText: string;
  options: string[];
  correctAnswer: string;
}

interface AcademicReadingBuilderProps {
  onSave?: (question: TPOQuestion) => void;
  testType?: string;
  testNumber?: number;
}

export function AcademicReadingBuilder({ onSave, testType = 'TPO', testNumber = 1 }: AcademicReadingBuilderProps) {
  // Passage content
  const [passageTitle, setPassageTitle] = useState('');
  const [passageText, setPassageText] = useState('');
  
  // Questions list
  const [questions, setQuestions] = useState<AcademicQuestion[]>([]);
  
  // Current question being edited
  const [editingQuestion, setEditingQuestion] = useState<AcademicQuestion | null>(null);
  const [questionText, setQuestionText] = useState('');
  const [options, setOptions] = useState(['', '', '', '']);
  const [correctAnswer, setCorrectAnswer] = useState('');
  
  // Question metadata
  const [questionNumber, setQuestionNumber] = useState('16');
  const [questionType, setQuestionType] = useState('Main Idea');
  const [module, setModule] = useState<'Module 1' | 'Module 2'>('Module 1');
  
  // Preview mode
  const [previewMode, setPreviewMode] = useState(false);
  const [showQuestionForm, setShowQuestionForm] = useState(false);

  // Add or update question
  const handleSaveQuestion = () => {
    if (!questionText.trim() || options.filter(o => o.trim()).length < 2 || !correctAnswer) {
      alert('질문, 최소 2개의 선택지, 정답을 입력해주세요.');
      return;
    }

    const newQuestion: AcademicQuestion = {
      id: editingQuestion?.id || `q-${Date.now()}`,
      questionText: questionText,
      options: options.filter(o => o.trim()),
      correctAnswer: correctAnswer
    };

    if (editingQuestion) {
      setQuestions(questions.map(q => q.id === editingQuestion.id ? newQuestion : q));
    } else {
      setQuestions([...questions, newQuestion]);
    }

    // Reset form
    setEditingQuestion(null);
    setQuestionText('');
    setOptions(['', '', '', '']);
    setCorrectAnswer('');
    setShowQuestionForm(false);
  };

  // Edit question
  const handleEditQuestion = (question: AcademicQuestion) => {
    setEditingQuestion(question);
    setQuestionText(question.questionText);
    setOptions([...question.options, '', '', '', ''].slice(0, 4));
    setCorrectAnswer(question.correctAnswer);
    setShowQuestionForm(true);
  };

  // Delete question
  const handleDeleteQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  // Save as TPOQuestion
  const handleSave = () => {
    if (!onSave || !passageTitle.trim() || !passageText.trim() || questions.length === 0) {
      alert('제목, 지문, 그리고 최소 1개의 질문을 입력해주세요.');
      return;
    }

    const question: TPOQuestion = {
      id: `q-academic-${Date.now()}`,
      questionNumber: questionNumber,
      questionText: passageTitle, // Use title as main question text
      questionType: `Academic Reading (${module})`,
      passageText: JSON.stringify({
        title: passageTitle,
        passage: passageText,
        questions: questions
      }),
      difficulty: questions.length > 4 ? '어려움' : questions.length > 2 ? '보통' : '쉬움'
    };

    onSave(question);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#2d7a7c] to-[#1e6b73] p-4 md:p-5">
        <h2 className="text-lg md:text-xl text-white font-bold flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          Academic Reading - Question Builder
        </h2>
        <p className="text-white/80 text-sm mt-1">
          긴 지문과 여러 질문을 생성하여 TPO 16-20번 문제로 사용하세요
        </p>
      </div>

      <div className="p-4 md:p-6 space-y-5">
        {/* Mode Tabs */}
        <div className="flex gap-2 border-b border-gray-200 pb-3">
          <button
            onClick={() => setPreviewMode(false)}
            className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-all ${
              !previewMode 
                ? 'bg-[#2d7a7c] text-white' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Edit
          </button>
          <button
            onClick={() => setPreviewMode(true)}
            className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-all ${
              previewMode 
                ? 'bg-[#2d7a7c] text-white' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            disabled={!passageTitle || !passageText || questions.length === 0}
          >
            <Eye className="w-4 h-4 inline mr-1" />
            Preview
          </button>
        </div>

        {/* Question Metadata Fields - ALWAYS VISIBLE */}
        {!previewMode && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border-2 border-blue-200 shadow-sm">
            <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              문제 정보 (Academic Reading 16-20번)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Question Number <span className="text-red-500">*</span>
                  <span className="text-xs text-gray-500 ml-1">(예: 16-20)</span>
                </label>
                <input
                  type="text"
                  value={questionNumber}
                  onChange={(e) => setQuestionNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#2d7a7c] focus:border-transparent"
                  placeholder="16-20"
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
                  <option value="Main Idea">Main Idea</option>
                  <option value="Detail">Detail</option>
                  <option value="Inference">Inference</option>
                  <option value="Vocabulary">Vocabulary</option>
                  <option value="Purpose">Purpose</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Module <span className="text-red-500">*</span>
                </label>
                <select
                  value={module}
                  onChange={(e) => setModule(e.target.value as 'Module 1' | 'Module 2')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#2d7a7c] focus:border-transparent"
                >
                  <option value="Module 1">Module 1</option>
                  <option value="Module 2">Module 2</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* EDIT MODE */}
        {!previewMode && (
          <div className="space-y-4">
            {/* Step 1: Passage Title */}
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-2">
                Step 1: 지문 제목 입력 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={passageTitle}
                onChange={(e) => setPassageTitle(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2d7a7c] focus:border-transparent text-lg font-semibold"
                placeholder="예: The Mirror Test"
              />
            </div>

            {/* Step 2: Passage Text */}
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-2">
                Step 2: 지문 입력 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={passageText}
                onChange={(e) => setPassageText(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2d7a7c] focus:border-transparent font-['Georgia',_serif] text-base leading-relaxed"
                rows={12}
                placeholder="긴 academic reading 지문을 입력하세요..."
              />
            </div>

            {/* Step 3: Questions */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-bold text-gray-800">
                  Step 3: 질문 추가 (현재 {questions.length}개)
                </label>
                {!showQuestionForm && (
                  <Button
                    onClick={() => setShowQuestionForm(true)}
                    size="sm"
                    className="bg-[#e67e22] text-white hover:bg-[#d35400]"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    질문 추가
                  </Button>
                )}
              </div>

              {/* Question List */}
              {questions.length > 0 && (
                <div className="space-y-2 mb-4">
                  {questions.map((q, idx) => (
                    <div key={q.id} className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-800 mb-1">
                            질문 {idx + 1}: {q.questionText}
                          </p>
                          <p className="text-xs text-gray-600">
                            선택지: {q.options.length}개 | 정답: {q.correctAnswer}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleEditQuestion(q)}
                            className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                          >
                            수정
                          </button>
                          <button
                            onClick={() => handleDeleteQuestion(q.id)}
                            className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Question Form */}
              {showQuestionForm && (
                <div className="bg-white rounded-lg p-4 border-2 border-[#2d7a7c] space-y-3 animate-[fadeSlideUp_0.2s_ease-out]">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-bold text-gray-800">
                      {editingQuestion ? '질문 수정' : '새 질문 추가'}
                    </h4>
                    <button
                      onClick={() => {
                        setShowQuestionForm(false);
                        setEditingQuestion(null);
                        setQuestionText('');
                        setOptions(['', '', '', '']);
                        setCorrectAnswer('');
                      }}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      질문 <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={questionText}
                      onChange={(e) => setQuestionText(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#2d7a7c]"
                      rows={2}
                      placeholder="예: Which of the following best states a main idea of the passage?"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      선택지 (최소 2개) <span className="text-red-500">*</span>
                    </label>
                    <div className="space-y-2">
                      {options.map((opt, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <span className="text-xs font-medium text-gray-600 w-6">{String.fromCharCode(65 + idx)}.</span>
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => {
                              const newOptions = [...options];
                              newOptions[idx] = e.target.value;
                              setOptions(newOptions);
                            }}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#2d7a7c]"
                            placeholder={`선택지 ${idx + 1}`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      정답 <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={correctAnswer}
                      onChange={(e) => setCorrectAnswer(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#2d7a7c]"
                    >
                      <option value="">정답 선택</option>
                      {options.filter(o => o.trim()).map((opt, idx) => (
                        <option key={idx} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex gap-2 justify-end pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setShowQuestionForm(false);
                        setEditingQuestion(null);
                        setQuestionText('');
                        setOptions(['', '', '', '']);
                        setCorrectAnswer('');
                      }}
                    >
                      취소
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSaveQuestion}
                      className="bg-[#2d7a7c] text-white"
                    >
                      <Save className="w-3 h-3 mr-1" />
                      {editingQuestion ? '수정 완료' : '질문 추가'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* PREVIEW MODE */}
        {previewMode && (
          <div className="space-y-4">
            <div className="bg-gray-100 rounded-lg p-2">
              <div className="bg-[#1e6b73] h-10 flex items-center px-4 rounded-t">
                <span className="text-white font-bold text-sm">*toefl ibt</span>
              </div>
              <div className="bg-white p-6 md:p-10 rounded-b">
                <div className="grid md:grid-cols-2 gap-8">
                  {/* Left: Passage */}
                  <div className="space-y-4">
                    <h2 className="text-2xl font-bold text-center text-black mb-4">
                      {passageTitle}
                    </h2>
                    <div className="text-base leading-relaxed text-[#333] font-['Georgia',_serif] whitespace-pre-wrap">
                      {passageText}
                    </div>
                  </div>

                  {/* Right: Questions */}
                  <div className="space-y-6 border-l-2 border-gray-200 pl-8">
                    {questions.map((q, idx) => (
                      <div key={q.id} className="space-y-3">
                        <p className="font-bold text-base text-gray-900">
                          {idx + 1}. {q.questionText}
                        </p>
                        <div className="space-y-2">
                          {q.options.map((opt, optIdx) => (
                            <div key={optIdx} className="flex items-start gap-3">
                              <div className="w-5 h-5 rounded-full border-2 border-gray-400 mt-0.5 flex-shrink-0" />
                              <span className="text-sm text-gray-800">{opt}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {!previewMode && passageTitle && passageText && questions.length > 0 && onSave && (
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
