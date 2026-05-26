import { useState } from 'react';
import { Button } from './ui/button';
import { Plus, Trash2, ChevronRight, BookOpen, Headphones, PenTool, Mic, AlertCircle, Pencil } from 'lucide-react';
import type { TPOSection, TPOTest } from './ContentManagement';

const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

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
  tests: TPOTest[];
  onSelectTest: (testType: string, testNumber: number) => void;
  onCreateTest: (testType: 'TPO' | 'Test' | 'Training', testNumber: number) => void;
  onDeleteTest: (testType: string, testNumber: number) => void;
}

export function TPOOverview({ allTests, tests, onSelectTest, onCreateTest, onDeleteTest }: TPOOverviewProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newTestType, setNewTestType] = useState<'TPO' | 'Test' | 'Training'>('TPO');
  const [newTestNumber, setNewTestNumber] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: string; number: number } | null>(null);

  const parseTests = (): TPOSet[] => {
    const sets: TPOSet[] = [];
    Object.keys(allTests).forEach(key => {
      const match = key.match(/^(TPO|Test|Training)(\d+)$/);
      if (match) {
        const type = match[1] as 'TPO' | 'Test' | 'Training';
        const number = parseInt(match[2]);
        const sections = allTests[key];
        sets.push({
          type, number,
          sections: {
            reading:   sections.find(s => s.sectionType === 'Reading')?.questions.length   || 0,
            listening: sections.find(s => s.sectionType === 'Listening')?.questions.length || 0,
            writing:   sections.find(s => s.sectionType === 'Writing')?.questions.length   || 0,
            speaking:  sections.find(s => s.sectionType === 'Speaking')?.questions.length  || 0,
          },
        });
      }
    });
    return sets.sort((a, b) => a.type !== b.type ? a.type.localeCompare(b.type) : a.number - b.number);
  };

  const parsedTests = parseTests();

  const getCompletion = (s: TPOSet['sections']) => {
    const total = 20 + 28 + 2 + 6;
    return Math.min(100, Math.round(((s.reading + s.listening + s.writing + s.speaking) / total) * 100));
  };

  const handleCreateTest = () => {
    const num = parseInt(newTestNumber);
    if (!num || num < 1 || num > 999) { alert('1-999 사이의 숫자를 입력해주세요.'); return; }
    if (allTests[`${newTestType}${num}`]) { alert('이미 존재하는 테스트입니다.'); return; }
    onCreateTest(newTestType, num);
    setShowCreateDialog(false);
    setNewTestNumber('');
  };

  const groupedTests: { [key: string]: TPOSet[] } = {};
  parsedTests.forEach(t => {
    if (!groupedTests[t.type]) groupedTests[t.type] = [];
    groupedTests[t.type].push(t);
  });

  // Lookup year/month for a test
  const getMeta = (type: string, number: number) =>
    tests.find(t => t.testType === type && t.testNumber === number);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#2d7a7c] to-[#1e6b73] rounded-xl p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">📚 Content Management</h1>
            <p className="text-white/70 text-sm">TPO / Test / Training 세트 관리</p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)} className="bg-white text-[#2d7a7c] hover:bg-gray-100 font-bold">
            <Plus className="w-4 h-4 mr-2" />새 테스트 만들기
          </Button>
        </div>
      </div>

      {/* ── Edit 안내 배너 ── */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 flex items-start gap-3">
        <Pencil className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <div className="text-sm text-amber-800 leading-relaxed">
          <strong>연도(Year) · 월(Month) 수정 방법</strong><br />
          카드를 클릭 → 우측 패널 상단 <strong>Classic 편집 탭</strong> 선택 →
          {' '}<span className="bg-amber-100 px-1.5 py-0.5 rounded font-mono text-xs">Test Metadata (for filtering)</span> 섹션에서
          {' '}<strong>Year</strong>와 <strong>Month</strong> 드롭다운을 변경 후 <strong>Save</strong>하세요.
        </div>
      </div>

      {/* Create Dialog */}
      {showCreateDialog && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowCreateDialog(false)}>
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-4 text-gray-800">새 테스트 세트 만들기</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">테스트 타입</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['TPO', 'Test', 'Training'] as const).map(type => (
                    <button key={type} onClick={() => setNewTestType(type)}
                      className={`px-4 py-2 rounded-lg border-2 font-medium transition-all ${newTestType === type ? 'bg-[#2d7a7c] text-white border-[#2d7a7c]' : 'bg-white text-gray-700 border-gray-300 hover:border-[#2d7a7c]'}`}>
                      {type}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">번호</label>
                <input type="number" min="1" max="999" value={newTestNumber}
                  onChange={e => setNewTestNumber(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2d7a7c] focus:border-transparent"
                  placeholder="예: 21" />
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800"><strong>{newTestType} {newTestNumber || '___'}</strong> 세트가 생성됩니다.</p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button onClick={() => setShowCreateDialog(false)} variant="outline" className="flex-1">취소</Button>
              <Button onClick={handleCreateTest} className="flex-1 bg-[#2d7a7c] text-white hover:bg-[#1e6b73]">생성</Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-start gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">정말 삭제하시겠습니까?</h3>
                <p className="text-gray-600"><strong>{deleteConfirm.type} {deleteConfirm.number}</strong>의 모든 문제가 영구적으로 삭제됩니다.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button onClick={() => setDeleteConfirm(null)} variant="outline" className="flex-1">취소</Button>
              <Button onClick={() => { onDeleteTest(deleteConfirm.type, deleteConfirm.number); setDeleteConfirm(null); }}
                className="flex-1 bg-red-500 text-white hover:bg-red-600">삭제</Button>
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {Object.keys(groupedTests).length === 0 && (
        <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
          <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg font-medium mb-2">아직 테스트 세트가 없습니다</p>
          <p className="text-gray-500 text-sm">위의 버튼을 눌러 새 테스트 세트를 만들어보세요</p>
        </div>
      )}

      {/* Test Sets by type */}
      {Object.entries(groupedTests).map(([type, testList]) => (
        <div key={type}>
          <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
            {type === 'TPO' && '📘'}
            {type === 'Test' && '📝'}
            {type === 'Training' && '🎯'}
            {type} <span className="text-gray-400 font-normal text-sm">({testList.length}개)</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {testList.map(test => {
              const meta = getMeta(test.type, test.number);
              const completion = getCompletion(test.sections);
              const total = test.sections.reading + test.sections.listening + test.sections.writing + test.sections.speaking;
              const hasDate = meta?.year || meta?.month;

              return (
                <div
                  key={`${test.type}${test.number}`}
                  className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden hover:shadow-lg hover:border-[#2d7a7c]/40 transition-all cursor-pointer group relative"
                  onClick={() => onSelectTest(test.type, test.number)}
                >
                  {/* Delete button */}
                  <button
                    onClick={e => { e.stopPropagation(); setDeleteConfirm({ type: test.type, number: test.number }); }}
                    className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity bg-red-50 hover:bg-red-100 p-1.5 rounded z-10"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-500" />
                  </button>

                  {/* ── Teal header bar (mirrors TPOCard style) ── */}
                  <div className="bg-gradient-to-r from-[#2d7a7c] to-[#3d8a8c] px-4 py-3 flex items-center justify-between">
                    <span className="text-white font-bold text-base tracking-wide">
                      {test.type} {test.number}
                    </span>

                    {/* Year / Month badges */}
                    {hasDate ? (
                      <div className="flex items-center gap-1">
                        {meta?.year && (
                          <span className="text-[11px] px-2 py-0.5 bg-white/25 text-white rounded-full font-bold border border-white/30">
                            {meta.year}
                          </span>
                        )}
                        {meta?.month && (
                          <span className="text-[11px] px-2 py-0.5 bg-[#e67e22] text-white rounded-full font-bold shadow-sm">
                            {MONTH_SHORT[meta.month - 1]}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-[10px] text-white/40 italic">날짜 미설정</span>
                    )}
                  </div>

                  {/* Body */}
                  <div className="p-4">
                    {/* Progress */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-500">완성도</span>
                        <span className="text-xs font-bold text-[#2d7a7c]">{completion}%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full transition-all ${completion >= 100 ? 'bg-green-500' : 'bg-gradient-to-r from-[#2d7a7c] to-[#3d8a8c]'}`}
                          style={{ width: `${completion}%` }}
                        />
                      </div>
                    </div>

                    {/* Section counts — compact 2×2 grid */}
                    <div className="grid grid-cols-2 gap-1.5 mb-3">
                      {[
                        { icon: <BookOpen className="w-3 h-3 text-blue-500" />,   label: 'Read',   count: test.sections.reading,   max: 20  },
                        { icon: <Headphones className="w-3 h-3 text-purple-500" />, label: 'Listen', count: test.sections.listening, max: 28  },
                        { icon: <PenTool className="w-3 h-3 text-orange-500" />,  label: 'Write',  count: test.sections.writing,   max: 2   },
                        { icon: <Mic className="w-3 h-3 text-red-500" />,         label: 'Speak',  count: test.sections.speaking,  max: 6   },
                      ].map(({ icon, label, count, max }) => (
                        <div key={label} className="flex items-center justify-between bg-gray-50 rounded-lg px-2 py-1.5">
                          <div className="flex items-center gap-1.5">
                            {icon}
                            <span className="text-[11px] text-gray-600">{label}</span>
                          </div>
                          <span className={`text-[11px] font-bold ${count >= max ? 'text-green-600' : 'text-gray-500'}`}>
                            {count}/{max}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                      <span className="text-xs text-gray-500">총 {total}문항</span>
                      <div className="flex items-center gap-1 text-[#2d7a7c] text-xs font-semibold group-hover:gap-2 transition-all">
                        편집
                        <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </div>
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
