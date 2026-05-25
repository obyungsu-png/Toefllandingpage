import { useState } from 'react';
import { Button } from './ui/button';
import { ArrowLeft, Plus, Eye, Edit, Trash2, FileText, BookOpen, Book, Filter, AlertCircle, Headphones, Mic, PenTool } from 'lucide-react';
import type { TPOQuestion, TPOSection } from './ContentManagement';

interface TPODetailViewProps {
  testType: string;
  testNumber: number;
  sections: TPOSection[];
  onBack: () => void;
  onAddQuestion: (section: 'Reading' | 'Listening' | 'Speaking' | 'Writing') => void;
  onEditQuestion: (question: TPOQuestion) => void;
  onDeleteQuestion: (questionId: string) => void;
  onPreviewQuestion: (question: TPOQuestion) => void;
}

export function TPODetailView({
  testType,
  testNumber,
  sections,
  onBack,
  onAddQuestion,
  onEditQuestion,
  onDeleteQuestion,
  onPreviewQuestion,
}: TPODetailViewProps) {
  const [selectedSection, setSelectedSection] = useState<'Reading' | 'Listening' | 'Speaking' | 'Writing'>('Reading');
  const [filterModule, setFilterModule] = useState<'all' | 'Module 1' | 'Module 2'>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Get current section questions
  const currentSection = sections.find(s => s.sectionType === selectedSection);
  const questions = currentSection?.questions || [];

  // Get unique question types
  const questionTypes = ['all', ...new Set(questions.map(q => {
    // Extract base type
    if (q.questionType?.includes('Complete Words')) return 'Complete Words';
    if (q.questionType?.includes('Daily Life')) return 'Daily Life';
    if (q.questionType?.includes('Academic Reading')) return 'Academic Reading';
    return q.questionType || 'Unknown';
  }))];

  // Filter questions
  const filteredQuestions = questions.filter(q => {
    if (filterModule !== 'all' && !q.questionType?.includes(filterModule)) return false;
    if (filterType !== 'all') {
      if (filterType === 'Complete Words' && !q.questionType?.includes('Complete Words')) return false;
      if (filterType === 'Daily Life' && !q.questionType?.includes('Daily Life')) return false;
      if (filterType === 'Academic Reading' && !q.questionType?.includes('Academic Reading')) return false;
      if (filterType !== 'Complete Words' && filterType !== 'Daily Life' && filterType !== 'Academic Reading' && q.questionType !== filterType) return false;
    }
    return true;
  });

  // Get question icon and color
  const getQuestionStyle = (questionType: string) => {
    if (questionType.includes('Complete Words')) {
      return { icon: <FileText className="w-4 h-4" />, color: 'bg-purple-100 text-purple-700 border-purple-300' };
    }
    if (questionType.includes('Daily Life')) {
      return { icon: <Book className="w-4 h-4" />, color: 'bg-blue-100 text-blue-700 border-blue-300' };
    }
    if (questionType.includes('Academic Reading')) {
      return { icon: <BookOpen className="w-4 h-4" />, color: 'bg-orange-100 text-orange-700 border-orange-300' };
    }
    return { icon: <FileText className="w-4 h-4" />, color: 'bg-gray-100 text-gray-700 border-gray-300' };
  };

  // Get question summary
  const getQuestionSummary = (q: TPOQuestion) => {
    if (q.questionType?.includes('Complete Words')) {
      return `${q.blanks?.length || 0} blanks`;
    }
    if (q.questionType?.includes('Daily Life')) {
      try {
        const data = JSON.parse(q.passageText || '{}');
        return `${data.questions?.length || 0} questions`;
      } catch {
        return 'Template-based';
      }
    }
    if (q.questionType?.includes('Academic Reading')) {
      try {
        const data = JSON.parse(q.passageText || '{}');
        return `${data.questions?.length || 0} questions | ${data.title || 'No title'}`;
      } catch {
        return 'Passage-based';
      }
    }
    if (q.options) {
      return `${q.options.length} options`;
    }
    return 'Question';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#2d7a7c] to-[#1e6b73] rounded-xl p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">
                {testType} {testNumber}
              </h1>
              <p className="text-white/80 text-sm">
                총 {questions.length}개 문제
              </p>
            </div>
          </div>
          <Button
            onClick={() => onAddQuestion(selectedSection)}
            className="bg-white text-[#2d7a7c] hover:bg-gray-100"
          >
            <Plus className="w-4 h-4 mr-2" />
            문제 추가
          </Button>
        </div>

        {/* Section Tabs */}
        <div className="flex gap-2 mb-4">
          {(['Reading', 'Listening', 'Speaking', 'Writing'] as const).map(section => {
            const sectionData = sections.find(s => s.sectionType === section);
            const count = sectionData?.questions.length || 0;
            const icon = section === 'Reading' ? <BookOpen className="w-4 h-4" /> :
                        section === 'Listening' ? <Headphones className="w-4 h-4" /> :
                        section === 'Speaking' ? <Mic className="w-4 h-4" /> :
                        <PenTool className="w-4 h-4" />;
            
            return (
              <button
                key={section}
                onClick={() => setSelectedSection(section)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                  selectedSection === section
                    ? 'bg-white text-[#2d7a7c]'
                    : 'bg-white/10 text-white/80 hover:bg-white/20 hover:text-white'
                }`}
              >
                {icon}
                <span className="hidden sm:inline">{section}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                  selectedSection === section
                    ? 'bg-[#2d7a7c] text-white'
                    : 'bg-white/20 text-white/90'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-white/60" />
            <span className="text-white/60 text-sm font-medium">필터:</span>
          </div>

          {/* Module filter */}
          <div className="flex gap-1 bg-white/10 rounded-lg p-1">
            {(['all', 'Module 1', 'Module 2'] as const).map(module => (
              <button
                key={module}
                onClick={() => setFilterModule(module)}
                className={`px-3 py-1 rounded text-sm font-medium transition-all ${
                  filterModule === module
                    ? 'bg-white text-[#2d7a7c]'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                {module === 'all' ? 'All Modules' : module}
              </button>
            ))}
          </div>

          {/* Type filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-white/10 text-white border border-white/20 rounded-lg px-3 py-1 text-sm font-medium cursor-pointer hover:bg-white/20 transition-colors"
          >
            {questionTypes.map(type => (
              <option key={type} value={type} className="text-gray-900">
                {type === 'all' ? 'All Types' : type}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">문제를 삭제하시겠습니까?</h3>
                <p className="text-gray-600">이 작업은 되돌릴 수 없습니다.</p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => setDeleteConfirm(null)}
                variant="outline"
                className="flex-1"
              >
                취소
              </Button>
              <Button
                onClick={() => {
                  onDeleteQuestion(deleteConfirm);
                  setDeleteConfirm(null);
                }}
                className="flex-1 bg-red-500 text-white hover:bg-red-600"
              >
                삭제
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Questions List */}
      {filteredQuestions.length === 0 && (
        <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg font-medium mb-2">
            {questions.length === 0 ? '아직 문제가 없습니다' : '필터 조건에 맞는 문제가 없습니다'}
          </p>
          <p className="text-gray-500 text-sm mb-4">
            {questions.length === 0 ? '문제를 추가해보세요' : '다른 필터를 선택해보세요'}
          </p>
        </div>
      )}

      {/* Side-by-side Module 1 / Module 2 panels */}
      {filteredQuestions.length > 0 && (() => {
        const m1q = filteredQuestions.filter(q => !q.questionType?.includes('Module 2')).sort((a,b) => Number(a.questionNumber)-Number(b.questionNumber));
        const m2q = filteredQuestions.filter(q => q.questionType?.includes('Module 2')).sort((a,b) => Number(a.questionNumber)-Number(b.questionNumber));

        const renderCard = (question: TPOQuestion, isM2: boolean) => {
          const style = getQuestionStyle(question.questionType || '');
          const summary = getQuestionSummary(question);
          return (
            <div key={question.id} className={`flex items-center gap-2 px-2.5 py-1.5 border rounded-lg transition-all hover:shadow-sm group ${isM2 ? 'border-orange-100 hover:bg-orange-50/40' : 'border-gray-100 hover:bg-gray-50'}`}>
              <div className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${style.color} shrink-0`}>
                {style.icon}<span>Q{question.questionNumber}</span>
              </div>
              {question.difficulty && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded border shrink-0 ${question.difficulty==='쉬움'?'border-green-400 text-green-600 bg-green-50':question.difficulty==='어려움'?'border-red-400 text-red-600 bg-red-50':'border-yellow-400 text-yellow-600 bg-yellow-50'}`}>
                  {question.difficulty}
                </span>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-700 truncate">{question.questionText || (question.questionType||'').replace(' (Module 2)','')}</p>
                <p className="text-[10px] text-gray-400">{summary}</p>
              </div>
              <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => onPreviewQuestion(question)} className="p-1 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded" title="미리보기"><Eye className="w-3 h-3"/></button>
                <button onClick={() => onEditQuestion(question)} className="p-1 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded" title="편집"><Edit className="w-3 h-3"/></button>
                <button onClick={() => setDeleteConfirm(question.id)} className="p-1 bg-red-50 hover:bg-red-100 text-red-500 rounded" title="삭제"><Trash2 className="w-3 h-3"/></button>
              </div>
            </div>
          );
        };

        return (
          <div className="grid grid-cols-2 gap-4">
            {/* Module 1 */}
            <div className="rounded-xl border border-[#2d7a7c]/20 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#2d7a7c] to-[#1e6b73]">
                <span className="text-white font-bold text-sm">Module 1</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/25 text-white font-bold">{m1q.length}</span>
              </div>
              <div className="p-2 space-y-1 min-h-[60px]">
                {m1q.length === 0
                  ? <p className="text-center text-xs text-gray-400 py-4">문제 없음</p>
                  : m1q.map(q => renderCard(q, false))}
              </div>
            </div>
            {/* Module 2 */}
            <div className="rounded-xl border border-orange-200 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-orange-400">
                <span className="text-white font-bold text-sm">Module 2</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/25 text-white font-bold">{m2q.length}</span>
              </div>
              <div className="p-2 space-y-1 min-h-[60px]">
                {m2q.length === 0
                  ? <p className="text-center text-xs text-gray-400 py-4">문제 없음</p>
                  : m2q.map(q => renderCard(q, true))}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}