import { useState } from 'react';
import { Button } from './ui/button';
import { Plus, Trash2, Eye, ChevronRight, BookOpen, Headphones, PenTool, Mic, AlertCircle } from 'lucide-react';
import type { TPOSection } from './ContentManagement';

interface TPOSet {
  type: 'TPO' | 'Test' | 'Training';
  number: number;
  sections: {
    reading: number;
    listening: number;
    writing: number;
    speaking: number;
  };
}

interface TPOOverviewProps {
  allTests: { [key: string]: TPOSection[] };
  onSelectTest: (testType: string, testNumber: number) => void;
  onCreateTest: (testType: 'TPO' | 'Test' | 'Training', testNumber: number) => void;
  onDeleteTest: (testType: string, testNumber: number) => void;
}

export function TPOOverview({ allTests, onSelectTest, onCreateTest, onDeleteTest }: TPOOverviewProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newTestType, setNewTestType] = useState<'TPO' | 'Test' | 'Training'>('TPO');
  const [newTestNumber, setNewTestNumber] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: string; number: number } | null>(null);

  // Parse existing tests
  const parseTests = (): TPOSet[] => {
    const sets: TPOSet[] = [];
    
    Object.keys(allTests).forEach(key => {
      const match = key.match(/^(TPO|Test|Training)(\d+)$/);
      if (match) {
        const type = match[1] as 'TPO' | 'Test' | 'Training';
        const number = parseInt(match[2]);
        
        const sections = allTests[key];
        const counts = {
          reading: sections.find(s => s.sectionType === 'Reading')?.questions.length || 0,
          listening: sections.find(s => s.sectionType === 'Listening')?.questions.length || 0,
          writing: sections.find(s => s.sectionType === 'Writing')?.questions.length || 0,
          speaking: sections.find(s => s.sectionType === 'Speaking')?.questions.length || 0,
        };
        
        sets.push({ type, number, sections: counts });
      }
    });
    
    return sets.sort((a, b) => {
      if (a.type !== b.type) return a.type.localeCompare(b.type);
      return a.number - b.number;
    });
  };

  const tests = parseTests();

  // Calculate completion percentage
  const getCompletion = (sections: TPOSet['sections']) => {
    const total = 20 + 28 + 2 + 6; // Expected totals
    const current = sections.reading + sections.listening + sections.writing + sections.speaking;
    return Math.round((current / total) * 100);
  };

  // Handle create test
  const handleCreateTest = () => {
    const num = parseInt(newTestNumber);
    if (!num || num < 1 || num > 999) {
      alert('1-999 사이의 숫자를 입력해주세요.');
      return;
    }
    
    const key = `${newTestType}${num}`;
    if (allTests[key]) {
      alert('이미 존재하는 테스트입니다.');
      return;
    }
    
    onCreateTest(newTestType, num);
    setShowCreateDialog(false);
    setNewTestNumber('');
  };

  // Group by type
  const groupedTests: { [key: string]: TPOSet[] } = {};
  tests.forEach(test => {
    if (!groupedTests[test.type]) groupedTests[test.type] = [];
    groupedTests[test.type].push(test);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#2d7a7c] to-[#1e6b73] rounded-xl p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">📚 Content Management Overview</h1>
            <p className="text-white/80 text-sm">모든 TPO/Test/Training 세트를 한눈에 관리하세요</p>
          </div>
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="bg-white text-[#2d7a7c] hover:bg-gray-100"
          >
            <Plus className="w-4 h-4 mr-2" />
            새 테스트 세트 만들기
          </Button>
        </div>
      </div>

      {/* Create Dialog */}
      {showCreateDialog && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowCreateDialog(false)}>
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-4 text-gray-800">새 테스트 세트 만들기</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">테스트 타입</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['TPO', 'Test', 'Training'] as const).map(type => (
                    <button
                      key={type}
                      onClick={() => setNewTestType(type)}
                      className={`px-4 py-2 rounded-lg border-2 font-medium transition-all ${
                        newTestType === type
                          ? 'bg-[#2d7a7c] text-white border-[#2d7a7c]'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-[#2d7a7c]'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">번호</label>
                <input
                  type="number"
                  min="1"
                  max="999"
                  value={newTestNumber}
                  onChange={(e) => setNewTestNumber(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2d7a7c] focus:border-transparent"
                  placeholder="예: 21"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  <strong>{newTestType} {newTestNumber || '___'}</strong> 세트가 생성됩니다.
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                onClick={() => setShowCreateDialog(false)}
                variant="outline"
                className="flex-1"
              >
                취소
              </Button>
              <Button
                onClick={handleCreateTest}
                className="flex-1 bg-[#2d7a7c] text-white hover:bg-[#1e6b73]"
              >
                생성
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">정말 삭제하시겠습니까?</h3>
                <p className="text-gray-600">
                  <strong>{deleteConfirm.type} {deleteConfirm.number}</strong>의 모든 문제가 영구적으로 삭제됩니다.
                </p>
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
                  onDeleteTest(deleteConfirm.type, deleteConfirm.number);
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

      {/* Test Sets Grid */}
      {Object.keys(groupedTests).length === 0 && (
        <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
          <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg font-medium mb-2">아직 테스트 세트가 없습니다</p>
          <p className="text-gray-500 text-sm mb-4">위의 버튼을 눌러 새 테스트 세트를 만들어보세요</p>
        </div>
      )}

      {Object.entries(groupedTests).map(([type, testList]) => (
        <div key={type}>
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            {type === 'TPO' && '📘'}
            {type === 'Test' && '📝'}
            {type === 'Training' && '🎯'}
            {type} Sets ({testList.length})
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {testList.map(test => {
              const completion = getCompletion(test.sections);
              const totalQuestions = test.sections.reading + test.sections.listening + test.sections.writing + test.sections.speaking;

              return (
                <div
                  key={`${test.type}${test.number}`}
                  className="bg-white border-2 border-gray-200 rounded-xl p-5 hover:shadow-lg transition-all cursor-pointer group relative"
                  onClick={() => onSelectTest(test.type, test.number)}
                >
                  {/* Delete button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteConfirm({ type: test.type, number: test.number });
                    }}
                    className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-red-50 hover:bg-red-100 p-1.5 rounded"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>

                  {/* Header */}
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold text-gray-800">
                      {test.type} {test.number}
                    </h3>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-[#2d7a7c] group-hover:translate-x-1 transition-all" />
                  </div>

                  {/* Progress bar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-gray-600">진행률</span>
                      <span className="text-xs font-bold text-[#2d7a7c]">{completion}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-[#2d7a7c] to-[#1e6b73] h-2 rounded-full transition-all"
                        style={{ width: `${completion}%` }}
                      />
                    </div>
                  </div>

                  {/* Section counts */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-blue-600" />
                        <span className="text-gray-700">Reading</span>
                      </div>
                      <span className={`font-bold ${test.sections.reading >= 20 ? 'text-green-600' : 'text-gray-600'}`}>
                        {test.sections.reading}/20
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Headphones className="w-4 h-4 text-purple-600" />
                        <span className="text-gray-700">Listening</span>
                      </div>
                      <span className={`font-bold ${test.sections.listening >= 28 ? 'text-green-600' : 'text-gray-600'}`}>
                        {test.sections.listening}/28
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <PenTool className="w-4 h-4 text-orange-600" />
                        <span className="text-gray-700">Writing</span>
                      </div>
                      <span className={`font-bold ${test.sections.writing >= 2 ? 'text-green-600' : 'text-gray-600'}`}>
                        {test.sections.writing}/2
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Mic className="w-4 h-4 text-red-600" />
                        <span className="text-gray-700">Speaking</span>
                      </div>
                      <span className={`font-bold ${test.sections.speaking >= 6 ? 'text-green-600' : 'text-gray-600'}`}>
                        {test.sections.speaking}/6
                      </span>
                    </div>
                  </div>

                  {/* Total */}
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="flex items-center justify-between text-sm font-bold">
                      <span className="text-gray-700">Total Questions</span>
                      <span className="text-[#2d7a7c]">{totalQuestions}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
