import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Upload, FileText, Music, Video, Image as ImageIcon, Trash2, Edit, Eye, Plus, Book, Headphones, Mic, PenTool, BookOpen, LayoutGrid, List } from 'lucide-react';
// motion removed - using CSS animations
import { FillBlanksEditor } from './FillBlanksEditor';
import { ReadDailyLifeTemplates, DailyLifeTemplate } from './ReadDailyLifeTemplates';
import { AcademicReadingBuilder } from './AcademicReadingBuilder';
import { TPOOverview } from './TPOOverview';
import { TPODetailView } from './TPODetailView';


export interface TPOQuestion {
  id: string;
  questionNumber: number | string; // Support "1-10" format for fill-in-blanks
  questionText: string;
  questionType: string;
  options?: string[];
  correctAnswer?: string | string[];
  explanation?: string;
  audioUrl?: string;
  videoUrl?: string;
  imageUrl?: string;
  passageText?: string;
  duration?: number; // for speaking/writing
  difficulty?: '쉬움' | '보통' | '어려움'; // Difficulty level for training filtering
  // For "Complete Words" (빈칸넣기) questions
  blanks?: Array<{
    answer: string;
    maxLength: number;
  }>;
  // For "Build Sentence" (문장 배열) questions
  avatar1ImageUrl?: string; // Question person avatar
  avatar2ImageUrl?: string; // Answer person avatar
  words?: string[]; // Words to arrange
  // For grouped Listening types (Short Conversation, Announcements, Academic Talk)
  passageAudioUrl?: string;
  passageImageUrl?: string;
  passageTitle?: string;
  questionGroupId?: string;
  translationNote?: string;
  vocabularyNote?: string;
}

export interface TPOSection {
  id: string;
  sectionType: 'Reading' | 'Listening' | 'Speaking' | 'Writing';
  questions: TPOQuestion[];
  instructions?: string;
  totalTime?: number;
}

export interface TPOTest {
  id: string;
  testNumber: number;
  testType: 'TPO' | 'Test' | 'Training';
  sections: TPOSection[];
  year?: number;
  month?: number;
  isOfficial?: boolean;
  dateMemo?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface ContentManagementProps {
  tests?: TPOTest[];
  tpoTests?: TPOTest[];
  onAddTest: (test: TPOTest) => void;
  onUpdateTest: (test: TPOTest) => void;
  onDeleteTest: (id: string) => void;
}

export function ContentManagement({ tests: testsProp, tpoTests, onAddTest, onUpdateTest, onDeleteTest }: ContentManagementProps) {
  const tests = testsProp || tpoTests || [];
  
  // View mode: 'overview' | 'detail' | 'edit'
  const [viewMode, setViewMode] = useState<'overview' | 'detail' | 'edit'>('overview');
  
  const [activeTestType, setActiveTestType] = useState<'TPO' | 'Test' | 'Training'>('TPO');
  const [selectedTestNumber, setSelectedTestNumber] = useState<number>(1);
  const [selectedSection, setSelectedSection] = useState<'Reading' | 'Listening' | 'Speaking' | 'Writing'>('Reading');
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [showBulkUploadForm, setShowBulkUploadForm] = useState(false);
  const [editingTest, setEditingTest] = useState<TPOTest | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<TPOQuestion | null>(null);
  const [previewQuestion, setPreviewQuestion] = useState<TPOQuestion | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | undefined>(undefined);
  const [selectedMonth, setSelectedMonth] = useState<number | undefined>(undefined);
  const [isOfficial, setIsOfficial] = useState(false);
  const [dateMemo, setDateMemo] = useState<string>('');
  const [showFillBlanksBuilder, setShowFillBlanksBuilder] = useState(false);
  const [showDailyLifeBuilder, setShowDailyLifeBuilder] = useState(false);
  const [showAcademicReadingBuilder, setShowAcademicReadingBuilder] = useState(false);
  const [savedDailyLifeTemplates, setSavedDailyLifeTemplates] = useState<DailyLifeTemplate[]>([]);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    type: 'question' | 'test';
    id: string;
    name: string;
    onConfirm: () => void;
  } | null>(null);

  // Sync year/month/official/dateMemo when test selection changes
  useEffect(() => {
    const test = tests?.find(t => t.testType === activeTestType && t.testNumber === selectedTestNumber);
    if (test) {
      setSelectedYear(test.year);
      setSelectedMonth(test.month);
      setIsOfficial(test.isOfficial || false);
      setDateMemo(test.dateMemo || '');
    } else {
      setSelectedYear(undefined);
      setSelectedMonth(undefined);
      setIsOfficial(false);
      setDateMemo('');
    }
  }, [activeTestType, selectedTestNumber, tests]);

  // Helper: Get all tests organized by type
  const getAllTestsOrganized = () => {
    const organized: { [key: string]: TPOSection[] } = {};
    
    tests.forEach(test => {
      const key = `${test.testType}${test.testNumber}`;
      organized[key] = test.sections;
    });
    
    return organized;
  };

  // Helper: Create new test
  const handleCreateTest = (testType: 'TPO' | 'Test' | 'Training', testNumber: number) => {
    const newTest: TPOTest = {
      id: `${testType.toLowerCase()}-${testNumber}`,
      testType: testType,
      testNumber: testNumber,
      sections: [
        { id: `${testType}-${testNumber}-reading`, sectionType: 'Reading', questions: [] },
        { id: `${testType}-${testNumber}-listening`, sectionType: 'Listening', questions: [] },
        { id: `${testType}-${testNumber}-writing`, sectionType: 'Writing', questions: [] },
        { id: `${testType}-${testNumber}-speaking`, sectionType: 'Speaking', questions: [] },
      ],
    };
    
    onAddTest(newTest);
  };

  // Helper: Delete test
  const handleDeleteTest = (testType: string, testNumber: number) => {
    const test = tests.find(t => t.testType === testType && t.testNumber === testNumber);
    if (test) {
      onDeleteTest(test.id);
    }
  };

  // Helper: Get current section questions
  const getCurrentSectionQuestions = (): TPOQuestion[] => {
    const test = tests.find(t => t.testType === activeTestType && t.testNumber === selectedTestNumber);
    if (!test) return [];
    
    const section = test.sections.find(s => s.sectionType === selectedSection);
    return section?.questions || [];
  };

  // Question type categorization
  const questionTypes = {
    Reading: [
      'Complete Words',
      'Read in Daily Life',
      'Read an Academic Passage',
      'Vocabulary in Context',
      'Inference Questions',
      'Detail Questions',
      'Purpose Questions',
      'Summary Questions',
      'Insert Text Questions'
    ],
    Listening: [
      'Listen and Response',
      'Short Conversation',
      'Announcements',
      'Academic Talk',
      'Campus Conversation',
      'Academic Lecture',
      'Detail Questions',
      'Purpose Questions',
      'Attitude Questions'
    ],
    Speaking: [
      'Listen and Repeat',
      'Take an Interview',
      'Independent Task',
      'Integrated Task - Reading/Listening',
      'Academic Discussion'
    ],
    Writing: [
      'Build a Sentence',
      'Write an Email',
      'Academic Discussion',
      'Integrated Writing Task',
      'Independent Essay'
    ]
  };

  const sectionIcons = {
    Reading: <Book className="w-5 h-5" />,
    Listening: <Headphones className="w-5 h-5" />,
    Speaking: <Mic className="w-5 h-5" />,
    Writing: <PenTool className="w-5 h-5" />
  };

  const getExistingTest = () => {
    return tests?.find(t => t.testType === activeTestType && t.testNumber === selectedTestNumber);
  };

  const handleBuilderSave = (question: TPOQuestion) => {
    let test = getExistingTest();
    if (!test) {
      test = {
        id: `${activeTestType}-${selectedTestNumber}-${Date.now()}`,
        testNumber: selectedTestNumber,
        testType: activeTestType,
        sections: [],
        year: selectedYear,
        month: selectedMonth,
        isOfficial: isOfficial,
        dateMemo: dateMemo || undefined,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }
    let section = test.sections.find(s => s.sectionType === 'Reading');
    if (!section) {
      section = { id: `section-Reading-${Date.now()}`, sectionType: 'Reading', questions: [], instructions: '', totalTime: 0 };
      test.sections.push(section);
    }
    section.questions.push(question);
    test.updatedAt = new Date();
    if (getExistingTest()) {
      onUpdateTest(test);
    } else {
      onAddTest(test);
    }
    setShowFillBlanksBuilder(false);
    setShowDailyLifeBuilder(false);
  };

  const getTestStats = (test: TPOTest) => {
    const stats = {
      Reading: 0,
      Listening: 0,
      Speaking: 0,
      Writing: 0
    };
    test.sections.forEach(section => {
      stats[section.sectionType] = section.questions.length;
    });
    return stats;
  };

  const getDifficultyStats = (test: TPOTest) => {
    const stats = {
      '쉬움': 0,
      '보통': 0,
      '어려움': 0,
      'undefined': 0
    };
    
    test.sections.forEach(section => {
      section.questions.forEach(question => {
        if (question.difficulty) {
          stats[question.difficulty]++;
        } else {
          stats['undefined']++;
        }
      });
    });
    
    return stats;
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header with View Toggle */}
      <div className="bg-gradient-to-r from-[#2d7a7c] to-[#1e6b73] rounded-lg p-4 md:p-6 text-white">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-xl md:text-2xl mb-1">Content Management System</h2>
            <p className="text-white/90 text-sm md:text-base">Upload and manage TPO and Test content</p>
          </div>
          
          {/* View Mode Toggle */}
          <div className="flex gap-2 bg-white/10 rounded-lg p-1">
            <button
              onClick={() => setViewMode('overview')}
              className={`px-3 md:px-4 py-2 rounded text-sm font-medium transition-all flex items-center gap-2 ${
                viewMode === 'overview'
                  ? 'bg-white text-[#2d7a7c]'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden md:inline">Overview</span>
            </button>
            <button
              onClick={() => setViewMode('edit')}
              className={`px-3 md:px-4 py-2 rounded text-sm font-medium transition-all flex items-center gap-2 ${
                viewMode === 'edit'
                  ? 'bg-white text-[#2d7a7c]'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              <List className="w-4 h-4" />
              <span className="hidden md:inline">Classic</span>
            </button>
          </div>
        </div>
      </div>

      {/* Overview Mode */}
      {viewMode === 'overview' && (
        <TPOOverview
          allTests={getAllTestsOrganized()}
          onSelectTest={(testType, testNumber) => {
            setActiveTestType(testType as 'TPO' | 'Test' | 'Training');
            setSelectedTestNumber(testNumber);
            setViewMode('detail');
          }}
          onCreateTest={handleCreateTest}
          onDeleteTest={handleDeleteTest}
        />
      )}

      {/* Detail Mode */}
      {viewMode === 'detail' && (
        <TPODetailView
          testType={activeTestType}
          testNumber={selectedTestNumber}
          sections={tests.find(t => t.testType === activeTestType && t.testNumber === selectedTestNumber)?.sections || []}
          onBack={() => setViewMode('overview')}
          onAddQuestion={(section) => {
            setSelectedSection(section);
            setViewMode('edit');
            setShowUploadForm(true);
          }}
          onEditQuestion={(question) => {
            setEditingQuestion(question);
            setViewMode('edit');
            setShowUploadForm(true);
          }}
          onDeleteQuestion={(questionId) => {
            setDeleteConfirmation({
              type: 'question',
              id: questionId,
              name: `Question ${questionId}`,
              onConfirm: () => {
                const test = tests.find(t => t.testType === activeTestType && t.testNumber === selectedTestNumber);
                if (test) {
                  const updatedSections = test.sections.map(section => {
                    return {
                      ...section,
                      questions: section.questions.filter(q => q.id !== questionId)
                    };
                  });
                  
                  onUpdateTest({ ...test, sections: updatedSections });
                }
              }
            });
          }}
          onPreviewQuestion={(question) => {
            setPreviewQuestion(question);
          }}
        />
      )}

      {/* Classic Edit Mode - existing UI */}
      {viewMode === 'edit' && (
        <>
      {/* Original Header removed - now using global header above */}

      {/* Test Type Selection */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 md:p-6">
        <h3 className="font-medium text-gray-800 mb-3 md:mb-4 text-sm md:text-base">Select Test Type & Number</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
          {/* Test Type */}
          <div>
            <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">Test Type</label>
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTestType('TPO')}
                className={`flex-1 px-3 md:px-4 py-2 rounded-lg font-bold text-xs md:text-sm transition-all ${
                  activeTestType === 'TPO'
                    ? 'bg-gradient-to-r from-[#2d7a7c] to-[#1e6b73] text-white shadow-md'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                TPO
              </button>
              <button
                onClick={() => setActiveTestType('Test')}
                className={`flex-1 px-3 md:px-4 py-2 rounded-lg font-bold text-xs md:text-sm transition-all ${
                  activeTestType === 'Test'
                    ? 'bg-gradient-to-r from-[#2d7a7c] to-[#1e6b73] text-white shadow-md'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                Test
              </button>
            </div>
          </div>

          {/* Test Number */}
          <div>
            <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">Test Number</label>
            <input
              type="number"
              min="1"
              max={activeTestType === 'TPO' ? 200 : 100}
              value={selectedTestNumber}
              onChange={(e) => {
                const num = parseInt(e.target.value);
                if (!isNaN(num) && num > 0) {
                  setSelectedTestNumber(num);
                }
              }}
              placeholder={`Enter ${activeTestType} number`}
              className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2d7a7c] focus:border-transparent text-sm md:text-base"
            />
          </div>

          {/* Section */}
          <div>
            <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">Section</label>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value as any)}
              className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2d7a7c] focus:border-transparent text-sm md:text-base"
            >
              <option value="Reading">Reading</option>
              <option value="Listening">Listening</option>
              <option value="Speaking">Speaking</option>
              <option value="Writing">Writing</option>
            </select>
          </div>
        </div>

        {/* Year / Month / Official Tag */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h4 className="font-medium text-gray-700 mb-3 text-xs md:text-sm">Test Metadata (for filtering)</h4>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-4">
            {/* Year */}
            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">Year</label>
              <select
                value={selectedYear || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedYear(val ? parseInt(val) : undefined);
                  const test = getExistingTest();
                  if (test) {
                    const updatedTest = { ...test, year: val ? parseInt(val) : undefined, updatedAt: new Date() };
                    onUpdateTest(updatedTest);
                  }
                }}
                className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2d7a7c] focus:border-transparent text-sm md:text-base"
              >
                <option value="">Not Set</option>
                {[2024, 2025, 2026, 2027].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            {/* Month */}
            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">Month</label>
              <select
                value={selectedMonth || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedMonth(val ? parseInt(val) : undefined);
                  const test = getExistingTest();
                  if (test) {
                    const updatedTest = { ...test, month: val ? parseInt(val) : undefined, updatedAt: new Date() };
                    onUpdateTest(updatedTest);
                  }
                }}
                className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2d7a7c] focus:border-transparent text-sm md:text-base"
              >
                <option value="">Not Set</option>
                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                  <option key={m} value={m}>
                    {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][m - 1]} ({m})
                  </option>
                ))}
              </select>
            </div>

            {/* Official Tag */}
            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">Official Test</label>
              <button
                type="button"
                onClick={() => {
                  const newVal = !isOfficial;
                  setIsOfficial(newVal);
                  const test = getExistingTest();
                  if (test) {
                    const updatedTest = { ...test, isOfficial: newVal, updatedAt: new Date() };
                    onUpdateTest(updatedTest);
                  }
                }}
                className={`w-full px-3 md:px-4 py-2 rounded-lg font-bold text-xs md:text-sm transition-all ${
                  isOfficial
                    ? 'bg-gradient-to-r from-[#d35400] to-[#e67e22] text-white shadow-md'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {isOfficial ? 'Official' : 'Not Official'}
              </button>
            </div>

            {/* Date Memo */}
            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">날짜 메모</label>
              <input
                type="text"
                value={dateMemo}
                onChange={(e) => {
                  const val = e.target.value;
                  setDateMemo(val);
                  const test = getExistingTest();
                  if (test) {
                    const updatedTest = { ...test, dateMemo: val || undefined, updatedAt: new Date() };
                    onUpdateTest(updatedTest);
                  }
                }}
                placeholder="예: 3/15 시험, 다음주 토요일..."
                className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2d7a7c] focus:border-transparent text-sm md:text-base"
              />
            </div>
          </div>
        </div>

        {/* Test Status */}
        {getExistingTest() && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800 mb-2">
              <strong>{activeTestType} {selectedTestNumber}</strong> exists with the following content:
            </p>
            <div className="flex gap-4 text-sm">
              {Object.entries(getTestStats(getExistingTest()!)).map(([section, count]) => (
                <span key={section} className="text-blue-700">
                  {sectionIcons[section as keyof typeof sectionIcons]}
                  <span className="ml-1">{section}: {count} questions</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Upload Button */}
      <div className="flex gap-3 flex-wrap">
        <Button
          onClick={() => setShowUploadForm(!showUploadForm)}
          className="bg-gradient-to-r from-[#e67e22] to-[#f39c12] text-white hover:from-[#d35400] hover:to-[#e67e22] shadow-lg"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add {selectedSection} Question to {activeTestType} {selectedTestNumber}
        </Button>
        <Button
          onClick={() => setShowBulkUploadForm(!showBulkUploadForm)}
          className="bg-gradient-to-r from-[#2d7a7c] to-[#1e6b73] text-white hover:from-[#1e6b73] hover:to-[#005f61] shadow-lg"
        >
          <Upload className="w-5 h-5 mr-2" />
          Bulk Upload Questions (JSON)
        </Button>
        {selectedSection === 'Reading' && (
          <>
            <Button
              onClick={() => { 
                setShowAcademicReadingBuilder(!showAcademicReadingBuilder); 
                setShowFillBlanksBuilder(false); 
                setShowDailyLifeBuilder(false); 
              }}
              className={`shadow-lg ${showAcademicReadingBuilder ? 'bg-orange-600 text-white' : 'bg-orange-500 text-white hover:bg-orange-600'}`}
            >
              <BookOpen className="w-5 h-5 mr-2" />
              Academic Reading Builder
            </Button>
            <Button
              onClick={() => { setShowFillBlanksBuilder(!showFillBlanksBuilder); setShowDailyLifeBuilder(false); setShowAcademicReadingBuilder(false); }}
              className={`shadow-lg ${showFillBlanksBuilder ? 'bg-purple-600 text-white' : 'bg-purple-500 text-white hover:bg-purple-600'}`}
            >
              <FileText className="w-5 h-5 mr-2" />
              Fill Blanks Builder
            </Button>
            <Button
              onClick={() => { setShowDailyLifeBuilder(!showDailyLifeBuilder); setShowFillBlanksBuilder(false); setShowAcademicReadingBuilder(false); }}
              className={`shadow-lg ${showDailyLifeBuilder ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
            >
              <Book className="w-5 h-5 mr-2" />
              Daily Life Builder
            </Button>
          </>
        )}
      </div>

      {/* Fill Blanks Builder */}
      <>
        {showFillBlanksBuilder && selectedSection === 'Reading' && (
          <div style={{ animation: 'fadeInUp 0.3s ease-out' }}>
            <FillBlanksEditor
              onSave={handleBuilderSave}
              testType={activeTestType}
              testNumber={selectedTestNumber}
            />
          </div>
        )}
      </>

      {/* Daily Life Builder */}
      <>
        {showDailyLifeBuilder && selectedSection === 'Reading' && (
          <div style={{ animation: 'fadeInUp 0.3s ease-out' }}>
            <ReadDailyLifeTemplates
              onSave={handleBuilderSave}
              testType={activeTestType}
              testNumber={selectedTestNumber}
              savedTemplates={savedDailyLifeTemplates}
              onSaveTemplate={(t) => setSavedDailyLifeTemplates(prev => [...prev, t])}
              onDeleteTemplate={(id) => setSavedDailyLifeTemplates(prev => prev.filter(t => t.id !== id))}
            />
          </div>
        )}
      </>

      {/* Academic Reading Builder */}
      <>
        {showAcademicReadingBuilder && selectedSection === 'Reading' && (
          <div style={{ animation: 'fadeInUp 0.3s ease-out' }}>
            <AcademicReadingBuilder
              onSave={handleBuilderSave}
              testType={activeTestType}
              testNumber={selectedTestNumber}
            />
          </div>
        )}
      </>

      {/* Upload Form */}
      <>
        {showUploadForm && !editingQuestion && (
          <QuestionUploadForm
            testType={activeTestType}
            testNumber={selectedTestNumber}
            section={selectedSection}
            questionTypes={questionTypes[selectedSection]}
            onSubmit={(question) => {
              // Handle adding question to test
              let test = getExistingTest();
              
              if (!test) {
                // Create new test
                test = {
                  id: `${activeTestType}-${selectedTestNumber}-${Date.now()}`,
                  testNumber: selectedTestNumber,
                  testType: activeTestType,
                  sections: [],
                  year: selectedYear,
                  month: selectedMonth,
                  isOfficial: isOfficial,
                  dateMemo: dateMemo || undefined,
                  createdAt: new Date(),
                  updatedAt: new Date()
                };
              }

              // Find or create section
              let section = test.sections.find(s => s.sectionType === selectedSection);
              if (!section) {
                section = {
                  id: `section-${selectedSection}-${Date.now()}`,
                  sectionType: selectedSection,
                  questions: [],
                  instructions: '',
                  totalTime: 0
                };
                test.sections.push(section);
              }

              // Add question
              section.questions.push(question);
              test.updatedAt = new Date();

              if (getExistingTest()) {
                onUpdateTest(test);
              } else {
                onAddTest(test);
              }

              setShowUploadForm(false);
            }}
            onCancel={() => setShowUploadForm(false)}
          />
        )}
        {editingQuestion && (
          <QuestionEditForm
            testType={activeTestType}
            testNumber={selectedTestNumber}
            section={selectedSection}
            questionTypes={questionTypes[selectedSection]}
            question={editingQuestion}
            onSubmit={(updatedQuestion) => {
              const test = getExistingTest();
              if (!test) return;

              const sectionIndex = test.sections.findIndex(s => s.sectionType === selectedSection);
              if (sectionIndex === -1) return;

              const questionIndex = test.sections[sectionIndex].questions.findIndex(q => q.id === editingQuestion.id);
              if (questionIndex === -1) return;

              const originalNumber = editingQuestion.questionNumber;
              const newNumber = updatedQuestion.questionNumber;
              const numberChanged = String(originalNumber) !== String(newNumber);

              // 항상 sections를 완전히 새로 복사해서 원본 배열 mutation 방지
              const newSections = test.sections.map((section, si) => {
                if (si !== sectionIndex) return section;

                let newQuestions = [...section.questions];

                if (numberChanged) {
                  // 번호가 바뀐 경우:
                  // - 기존 문제(originalNumber)는 배열에 그대로 유지
                  // - 새 번호로 새 문제를 추가 (새 ID 부여)
                  const newQuestion = {
                    ...updatedQuestion,
                    id: `q-${Date.now()}-new`,
                  };
                  newQuestions = [...newQuestions, newQuestion];
                } else {
                  // 번호가 같은 경우: 해당 인덱스만 교체
                  newQuestions = newQuestions.map((q, qi) =>
                    qi === questionIndex ? updatedQuestion : q
                  );
                }

                // 번호 순으로 정렬
                newQuestions.sort((a, b) =>
                  Number(a.questionNumber) - Number(b.questionNumber)
                );

                return { ...section, questions: newQuestions };
              });

              const updatedTest = {
                ...test,
                sections: newSections,
                updatedAt: new Date(),
              };

              onUpdateTest(updatedTest);
              setEditingQuestion(null);
            }}
            onCancel={() => setEditingQuestion(null)}
          />
        )}
        {showBulkUploadForm && (
          <BulkUploadForm
            testType={activeTestType}
            testNumber={selectedTestNumber}
            section={selectedSection}
            onSubmit={(questions) => {
              // Handle adding multiple questions to test
              let test = getExistingTest();
              
              if (!test) {
                // Create new test
                test = {
                  id: `${activeTestType}-${selectedTestNumber}-${Date.now()}`,
                  testNumber: selectedTestNumber,
                  testType: activeTestType,
                  sections: [],
                  year: selectedYear,
                  month: selectedMonth,
                  isOfficial: isOfficial,
                  dateMemo: dateMemo || undefined,
                  createdAt: new Date(),
                  updatedAt: new Date()
                };
              }

              // Find or create section
              let section = test.sections.find(s => s.sectionType === selectedSection);
              if (!section) {
                section = {
                  id: `section-${selectedSection}-${Date.now()}`,
                  sectionType: selectedSection,
                  questions: [],
                  instructions: '',
                  totalTime: 0
                };
                test.sections.push(section);
              }

              // Add all questions
              section.questions.push(...questions);
              test.updatedAt = new Date();

              if (getExistingTest()) {
                onUpdateTest(test);
              } else {
                onAddTest(test);
              }

              setShowBulkUploadForm(false);
            }}
            onCancel={() => setShowBulkUploadForm(false)}
          />
        )}
      </>

      {/* Existing Questions List */}
      {getExistingTest() && (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <h3 className="font-medium text-gray-800 mb-4">
            {selectedSection} Questions for {activeTestType} {selectedTestNumber}
          </h3>
          
          {(() => {
            const test = getExistingTest()!;
            const section = test.sections.find(s => s.sectionType === selectedSection);
            
            if (!section || section.questions.length === 0) {
              return (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  <p>No {selectedSection} questions uploaded yet</p>
                </div>
              );
            }

            return (
              <div className="space-y-3">
                {section.questions.map((question, index) => (
                  <div
                    key={question.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="px-3 py-1 bg-[#2d7a7c] text-white rounded-full text-sm">
                          Q{question.questionNumber}
                        </span>
                        <span className="px-3 py-1 bg-gray-200 text-gray-700 rounded-lg text-sm">
                          {question.questionType}
                        </span>
                      </div>
                      <p className="text-gray-800 line-clamp-2">{question.questionText}</p>
                      <div className="flex gap-2 mt-2">
                        {question.audioUrl && (
                          <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                            <Music className="w-3 h-3 inline mr-1" />Audio
                          </span>
                        )}
                        {question.videoUrl && (
                          <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded">
                            <Video className="w-3 h-3 inline mr-1" />Video
                          </span>
                        )}
                        {question.passageText && (
                          <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">
                            <FileText className="w-3 h-3 inline mr-1" />Passage
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setPreviewQuestion(question)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          setEditingQuestion(question);
                          setShowUploadForm(false);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        className="bg-red-500 text-white hover:bg-red-600"
                        onClick={() => {
                          setDeleteConfirmation({
                            type: 'question',
                            id: question.id,
                            name: `Q${question.questionNumber}: ${question.questionText.substring(0, 50)}...`,
                            onConfirm: () => {
                              const updatedTest = { ...test };
                              const sectionIndex = updatedTest.sections.findIndex(s => s.sectionType === selectedSection);
                              if (sectionIndex !== -1) {
                                updatedTest.sections[sectionIndex].questions = 
                                  updatedTest.sections[sectionIndex].questions.filter(q => q.id !== question.id);
                                updatedTest.updatedAt = new Date();
                                onUpdateTest(updatedTest);
                              }
                              setDeleteConfirmation(null);
                            }
                          });
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirmation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              {deleteConfirmation.type === 'test' ? '테스트 삭제 확인' : '문제 삭제 확인'}
            </h3>
            <p className="text-gray-600 mb-6">
              {deleteConfirmation.type === 'test' 
                ? `정말로 "${deleteConfirmation.name}"을(를) 삭제하시겠습니까? 이 테스트의 모든 문제가 함께 삭제됩니다.`
                : `정말로 "${deleteConfirmation.name}"을(를) 삭제하시겠습니까?`
              }
              <br />
              <span className="text-red-600 font-medium mt-2 block">이 작업은 되돌릴 수 없습니다.</span>
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setDeleteConfirmation(null)}
              >
                취소
              </Button>
              <Button
                className="bg-red-500 text-white hover:bg-red-600"
                onClick={deleteConfirmation.onConfirm}
              >
                삭제
              </Button>
            </div>
          </div>
        </div>
      )}
      </>
      )}
    </div>
  );
}

// Question Upload Form Component
interface QuestionUploadFormProps {
  testType: 'TPO' | 'Test';
  testNumber: number;
  section: 'Reading' | 'Listening' | 'Speaking' | 'Writing';
  questionTypes: string[];
  onSubmit: (question: TPOQuestion) => void;
  onCancel: () => void;
}

function QuestionUploadForm({ testType, testNumber, section, questionTypes, onSubmit, onCancel }: QuestionUploadFormProps) {
  const [formData, setFormData] = useState({
    questionNumber: 1,
    questionText: '',
    questionType: questionTypes[0],
    options: ['', '', '', ''],
    correctAnswer: '',
    explanation: '',
    passageText: '',
    passageTitle: '',
    audioFile: null as File | null,
    audioUrl: '',
    videoFile: null as File | null,
    videoUrl: '',
    imageFile: null as File | null,
    imageUrl: '',
    duration: 0,
    difficulty: '보통' as '쉬움' | '보통' | '어려움',
    blanks: [] as Array<{ answer: string; maxLength: number }>
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const question: TPOQuestion = {
      id: `q-${Date.now()}`,
      questionNumber: formData.questionNumber,
      questionText: formData.questionText,
      questionType: formData.questionType,
      options: formData.options.filter(o => o.trim() !== ''),
      correctAnswer: formData.correctAnswer,
      explanation: formData.explanation,
      passageText: formData.passageText || undefined,
      passageTitle: (formData as any).passageTitle || undefined,
      duration: formData.duration || undefined,
      difficulty: formData.difficulty,
      blanks: formData.blanks
    };

    // Handle URL inputs or file uploads (URL takes priority)
    if (formData.audioUrl.trim()) {
      question.audioUrl = formData.audioUrl.trim();
    } else if (formData.audioFile) {
      question.audioUrl = URL.createObjectURL(formData.audioFile);
    }
    
    if (formData.videoUrl.trim()) {
      question.videoUrl = formData.videoUrl.trim();
    } else if (formData.videoFile) {
      question.videoUrl = URL.createObjectURL(formData.videoFile);
    }
    
    if (formData.imageUrl.trim()) {
      question.imageUrl = formData.imageUrl.trim();
    } else if (formData.imageFile) {
      question.imageUrl = URL.createObjectURL(formData.imageFile);
    }

    onSubmit(question);
  };

  return (
    <div
      className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 animate-[fadeSlideUp_0.3s_ease-out]"
    >
      <h3 className="text-xl font-medium text-gray-800 mb-4">
        Add {section} Question - {testType} {testNumber}
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Question Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Question Number
              {formData.questionType === 'Complete Words' && (
                <span className="ml-2 text-xs text-orange-600 font-normal">
                  (빈칸넣기 1-10번은 하나의 문제로 입력)
                </span>
              )}
            </label>
            {formData.questionType === 'Complete Words' ? (
              <input
                type="text"
                value="1-10"
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
              />
            ) : (
              <input
                type="number"
                min="1"
                value={formData.questionNumber}
                onChange={(e) => setFormData({ ...formData, questionNumber: parseInt(e.target.value) || 1 })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2d7a7c] focus:border-transparent"
                required
              />
            )}
          </div>

          {/* Question Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Question Type</label>
            <select
              value={formData.questionType}
              onChange={(e) => setFormData({ ...formData, questionType: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2d7a7c] focus:border-transparent"
            >
              {questionTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Passage Text (for Reading) */}
        {section === 'Reading' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Passage Text
              {formData.questionType === 'Complete Words' && (
                <span className="ml-2 text-xs text-blue-600 font-normal">
                  (빈칸넣기: 빈칸 위치에 [정답:최대길이] 형식으로 입력하세요. 예: mi[ght:3])
                </span>
              )}
            </label>
            {formData.questionType === 'Complete Words' && (
              <div className="mb-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <p className="text-sm font-medium text-orange-800 mb-1">
                  📝 빈칸넣기 문제 입력 방법
                </p>
                <p className="text-xs text-orange-700">
                  • 1-10번 문제는 하나의 지문에 10개 빈칸을 모두 포함하여 입력합니다<br/>
                  • 지문에서 빈칸으로 만들 부분을 [정답:최대길이] 형식으로 표시하세요<br/>
                  • 예: "We mi[ght:3] think th[at:2] early humans performed dances..."<br/>
                  • 반드시 10개의 빈칸을 입력해야 합니다
                </p>
              </div>
            )}
            <textarea
              value={formData.passageText}
              onChange={(e) => {
                setFormData({ ...formData, passageText: e.target.value });
                
                // Auto-parse blanks for Complete Words questions
                if (formData.questionType === 'Complete Words') {
                  const blankRegex = /\[([^:\]]+):(\d+)\]/g;
                  const blanks: Array<{ answer: string; maxLength: number }> = [];
                  let match;
                  
                  while ((match = blankRegex.exec(e.target.value)) !== null) {
                    blanks.push({
                      answer: match[1],
                      maxLength: parseInt(match[2])
                    });
                  }
                  
                  setFormData(prev => ({ ...prev, blanks }));
                }
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2d7a7c] focus:border-transparent font-mono text-sm"
              rows={8}
              placeholder={formData.questionType === 'Complete Words' 
                ? "예시: We mi[ght:3] think th[at:2] early humans performed dances..."
                : "Enter the reading passage here..."}
            />
            {formData.questionType === 'Complete Words' && formData.blanks.length > 0 && (
              <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-medium text-blue-800 mb-2">
                  감지된 빈칸: {formData.blanks.length}개
                </p>
                <div className="flex flex-wrap gap-2">
                  {formData.blanks.map((blank, idx) => (
                    <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                      #{idx + 1}: "{blank.answer}" (최대 {blank.maxLength}자)
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Audio Upload (for Listening/Speaking) */}
        {(section === 'Listening' || section === 'Speaking') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Audio File</label>
            <input
              type="file"
              accept="audio/*"
              onChange={(e) => setFormData({ ...formData, audioFile: e.target.files?.[0] || null })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2d7a7c] focus:border-transparent"
            />
          </div>
        )}

        {/* Video Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Video File (Optional)</label>
          <input
            type="file"
            accept="video/*"
            onChange={(e) => setFormData({ ...formData, videoFile: e.target.files?.[0] || null })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2d7a7c] focus:border-transparent"
          />
        </div>

        {/* Page Title (for Daily Life reading screens) */}
        {section === 'Reading' && (
          formData.questionType === 'Read in Daily Life' ||
          formData.questionType === 'Read in Daily Life (Module 1)' ||
          formData.questionType === 'Read in Daily Life (Module 2)'
        ) && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Page Title
              <span className="ml-2 text-xs text-gray-400 font-normal">
                (화면 상단 제목. 비워두면 템플릿에 따라 자동 설정됩니다)
              </span>
            </label>
            <input
              type="text"
              value={(formData as any).passageTitle || ''}
              onChange={(e) => setFormData({ ...formData, passageTitle: e.target.value } as any)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2d7a7c] focus:border-transparent"
              placeholder="예: Read an email. / Read a notice. / Read a social media post."
            />
          </div>
        )}

        {/* Question Text */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Question Text</label>
          <textarea
            value={formData.questionText}
            onChange={(e) => setFormData({ ...formData, questionText: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2d7a7c] focus:border-transparent"
            rows={3}
            required
            placeholder="Enter the question..."
          />
        </div>

        {/* Answer Options */}
        {(section === 'Reading' || section === 'Listening') && formData.questionType !== 'Complete Words' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Answer Options</label>
              <div className="space-y-2">
                {formData.options.map((option, index) => (
                  <input
                    key={index}
                    type="text"
                    value={option}
                    onChange={(e) => {
                      const newOptions = [...formData.options];
                      newOptions[index] = e.target.value;
                      setFormData({ ...formData, options: newOptions });
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2d7a7c] focus:border-transparent"
                    placeholder={`Option ${index + 1}`}
                  />
                ))}
              </div>
            </div>

            {/* Correct Answer */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Correct Answer</label>
              <select
                value={formData.correctAnswer}
                onChange={(e) => setFormData({ ...formData, correctAnswer: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2d7a7c] focus:border-transparent"
                required
              >
                <option value="">Select correct answer...</option>
                {formData.options.filter(o => o.trim() !== '').map((option, index) => (
                  <option key={index} value={option}>{option}</option>
                ))}
              </select>
            </div>
          </>
        )}

        {/* Duration (for Speaking/Writing) */}
        {(section === 'Speaking' || section === 'Writing') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Time Limit (seconds)</label>
            <input
              type="number"
              min="0"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2d7a7c] focus:border-transparent"
              placeholder="e.g., 45, 60, 300"
            />
          </div>
        )}

        {/* Explanation */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Explanation (Optional)</label>
          <textarea
            value={formData.explanation}
            onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2d7a7c] focus:border-transparent"
            rows={3}
            placeholder="Explain the correct answer..."
          />
        </div>

        {/* Difficulty Level */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty Level</label>
          <select
            value={formData.difficulty}
            onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as '쉬움' | '보통' | '어려움' })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2d7a7c] focus:border-transparent"
          >
            <option value="쉬움">쉬움</option>
            <option value="보통">보통</option>
            <option value="어려움">어려움</option>
          </select>
        </div>

        {/* Form Actions */}
        <div className="flex gap-3 justify-end pt-4 border-t">
          <Button
            type="button"
            onClick={onCancel}
            className="bg-gray-300 text-gray-700 hover:bg-gray-400"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="bg-gradient-to-r from-[#2d7a7c] to-[#1e6b73] text-white hover:from-[#1e6b73] hover:to-[#005f61]"
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload Question
          </Button>
        </div>
      </form>
    </div>
  );
}

// Question Edit Form Component
interface QuestionEditFormProps {
  testType: 'TPO' | 'Test';
  testNumber: number;
  section: 'Reading' | 'Listening' | 'Speaking' | 'Writing';
  questionTypes: string[];
  question: TPOQuestion;
  onSubmit: (question: TPOQuestion) => void;
  onCancel: () => void;
}

function QuestionEditForm({ testType, testNumber, section, questionTypes, question, onSubmit, onCancel }: QuestionEditFormProps) {
  const [formData, setFormData] = useState({
    questionNumber: question.questionNumber,
    questionText: question.questionText,
    questionType: question.questionType,
    options: question.options || ['', '', '', ''],
    correctAnswer: question.correctAnswer || '',
    explanation: question.explanation || '',
    passageText: question.passageText || '',
    passageTitle: question.passageTitle || '',
    audioFile: null as File | null,
    videoFile: null as File | null,
    imageFile: null as File | null,
    duration: question.duration || 0,
    difficulty: question.difficulty || '보통' as '쉬움' | '보통' | '어려움',
    blanks: question.blanks || [] as Array<{ answer: string; maxLength: number }>
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const updatedQuestion: TPOQuestion = {
      id: question.id,
      questionNumber: formData.questionNumber,
      questionText: formData.questionText,
      questionType: formData.questionType,
      options: formData.options.filter(o => o.trim() !== ''),
      correctAnswer: formData.correctAnswer,
      explanation: formData.explanation,
      passageText: formData.passageText || undefined,
      passageTitle: (formData as any).passageTitle || undefined,
      duration: formData.duration || undefined,
      difficulty: formData.difficulty,
      blanks: formData.blanks
    };

    // Handle file uploads (in a real app, you'd upload to a server)
    if (formData.audioFile) {
      updatedQuestion.audioUrl = URL.createObjectURL(formData.audioFile);
    }
    if (formData.videoFile) {
      updatedQuestion.videoUrl = URL.createObjectURL(formData.videoFile);
    }
    if (formData.imageFile) {
      updatedQuestion.imageUrl = URL.createObjectURL(formData.imageFile);
    }

    onSubmit(updatedQuestion);
  };

  return (
    <div
      className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 animate-[fadeSlideUp_0.3s_ease-out]"
    >
      <h3 className="text-xl font-medium text-gray-800 mb-4">
        Edit {section} Question - {testType} {testNumber}
      </h3>

      {/* Info banner: number change creates new question */}
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2">
        <span className="text-blue-500 text-lg leading-none mt-0.5">ℹ️</span>
        <p className="text-sm text-blue-700">
          <strong>문제 번호를 변경하면</strong> 기존 문제는 그대로 유지되고, 변경된 번호로 <strong>새 문제가 추가</strong>됩니다.
          같은 번호로 저장하면 기존 문제가 수정됩니다.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Question Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Question Number
              {formData.questionType === 'Complete Words' && (
                <span className="ml-2 text-xs text-orange-600 font-normal">
                  (빈칸넣기 1-10번은 하나의 문제로 입력)
                </span>
              )}
            </label>
            {formData.questionType === 'Complete Words' ? (
              <input
                type="text"
                value="1-10"
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
              />
            ) : (
              <input
                type="number"
                min="1"
                value={formData.questionNumber}
                onChange={(e) => setFormData({ ...formData, questionNumber: parseInt(e.target.value) || 1 })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2d7a7c] focus:border-transparent"
                required
              />
            )}
          </div>

          {/* Question Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Question Type</label>
            <select
              value={formData.questionType}
              onChange={(e) => setFormData({ ...formData, questionType: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2d7a7c] focus:border-transparent"
            >
              {questionTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Passage Text (for Reading) */}
        {section === 'Reading' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Passage Text
              {formData.questionType === 'Complete Words' && (
                <span className="ml-2 text-xs text-blue-600 font-normal">
                  (빈칸넣기: 빈칸 위치에 [정답:최대길이] 형식으로 입력하세요. 예: mi[ght:3])
                </span>
              )}
            </label>
            {formData.questionType === 'Complete Words' && (
              <div className="mb-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <p className="text-sm font-medium text-orange-800 mb-1">
                  📝 빈칸넣기 문제 입력 방법
                </p>
                <p className="text-xs text-orange-700">
                  • 1-10번 문제는 하나의 지문에 10개 빈칸을 모두 포함하여 입력합니다<br/>
                  • 지문에서 빈칸으로 만들 부분을 [정답:최대길이] 형식으로 표시하세요<br/>
                  • 예: "We mi[ght:3] think th[at:2] early humans performed dances..."<br/>
                  • 반드시 10개의 빈칸을 입력해야 합니다
                </p>
              </div>
            )}
            <textarea
              value={formData.passageText}
              onChange={(e) => {
                setFormData({ ...formData, passageText: e.target.value });
                
                // Auto-parse blanks for Complete Words questions
                if (formData.questionType === 'Complete Words') {
                  const blankRegex = /\[([^:\]]+):(\d+)\]/g;
                  const blanks: Array<{ answer: string; maxLength: number }> = [];
                  let match;
                  
                  while ((match = blankRegex.exec(e.target.value)) !== null) {
                    blanks.push({
                      answer: match[1],
                      maxLength: parseInt(match[2])
                    });
                  }
                  
                  setFormData(prev => ({ ...prev, blanks }));
                }
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2d7a7c] focus:border-transparent font-mono text-sm"
              rows={8}
              placeholder={formData.questionType === 'Complete Words' 
                ? "예시: We mi[ght:3] think th[at:2] early humans performed dances..."
                : "Enter the reading passage here..."}
            />
            {formData.questionType === 'Complete Words' && formData.blanks.length > 0 && (
              <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-medium text-blue-800 mb-2">
                  감지된 빈칸: {formData.blanks.length}개
                </p>
                <div className="flex flex-wrap gap-2">
                  {formData.blanks.map((blank, idx) => (
                    <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                      #{idx + 1}: "{blank.answer}" (최대 {blank.maxLength}자)
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Audio Upload (for Listening/Speaking) */}
        {(section === 'Listening' || section === 'Speaking') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Audio File</label>
            <input
              type="file"
              accept="audio/*"
              onChange={(e) => setFormData({ ...formData, audioFile: e.target.files?.[0] || null })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2d7a7c] focus:border-transparent"
            />
          </div>
        )}

        {/* Video Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Video File (Optional)</label>
          <input
            type="file"
            accept="video/*"
            onChange={(e) => setFormData({ ...formData, videoFile: e.target.files?.[0] || null })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2d7a7c] focus:border-transparent"
          />
        </div>

        {/* Page Title (for Daily Life reading screens) */}
        {section === 'Reading' && (
          formData.questionType === 'Read in Daily Life' ||
          formData.questionType === 'Read in Daily Life (Module 1)' ||
          formData.questionType === 'Read in Daily Life (Module 2)'
        ) && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Page Title
              <span className="ml-2 text-xs text-gray-400 font-normal">
                (화면 상단 제목. 비워두면 템플릿에 따라 자동 설정됩니다)
              </span>
            </label>
            <input
              type="text"
              value={(formData as any).passageTitle || ''}
              onChange={(e) => setFormData({ ...formData, passageTitle: e.target.value } as any)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2d7a7c] focus:border-transparent"
              placeholder="예: Read an email. / Read a notice. / Read a social media post."
            />
          </div>
        )}

        {/* Question Text */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Question Text</label>
          <textarea
            value={formData.questionText}
            onChange={(e) => setFormData({ ...formData, questionText: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2d7a7c] focus:border-transparent"
            rows={3}
            required
            placeholder="Enter the question..."
          />
        </div>

        {/* Answer Options */}
        {(section === 'Reading' || section === 'Listening') && formData.questionType !== 'Complete Words' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Answer Options</label>
              <div className="space-y-2">
                {formData.options.map((option, index) => (
                  <input
                    key={index}
                    type="text"
                    value={option}
                    onChange={(e) => {
                      const newOptions = [...formData.options];
                      newOptions[index] = e.target.value;
                      setFormData({ ...formData, options: newOptions });
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2d7a7c] focus:border-transparent"
                    placeholder={`Option ${index + 1}`}
                  />
                ))}
              </div>
            </div>

            {/* Correct Answer */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Correct Answer</label>
              <select
                value={formData.correctAnswer}
                onChange={(e) => setFormData({ ...formData, correctAnswer: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2d7a7c] focus:border-transparent"
                required
              >
                <option value="">Select correct answer...</option>
                {formData.options.filter(o => o.trim() !== '').map((option, index) => (
                  <option key={index} value={option}>{option}</option>
                ))}
              </select>
            </div>
          </>
        )}

        {/* Duration (for Speaking/Writing) */}
        {(section === 'Speaking' || section === 'Writing') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Time Limit (seconds)</label>
            <input
              type="number"
              min="0"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2d7a7c] focus:border-transparent"
              placeholder="e.g., 45, 60, 300"
            />
          </div>
        )}

        {/* Explanation */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Explanation (Optional)</label>
          <textarea
            value={formData.explanation}
            onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2d7a7c] focus:border-transparent"
            rows={3}
            placeholder="Explain the correct answer..."
          />
        </div>

        {/* Difficulty Level */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty Level</label>
          <select
            value={formData.difficulty}
            onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as '쉬움' | '보통' | '어려움' })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2d7a7c] focus:border-transparent"
          >
            <option value="쉬움">쉬움</option>
            <option value="보통">보통</option>
            <option value="어려움">어려움</option>
          </select>
        </div>

        {/* Form Actions */}
        <div className="flex gap-3 justify-end pt-4 border-t">
          <Button
            type="button"
            onClick={onCancel}
            className="bg-gray-300 text-gray-700 hover:bg-gray-400"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="bg-gradient-to-r from-[#2d7a7c] to-[#1e6b73] text-white hover:from-[#1e6b73] hover:to-[#005f61]"
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload Question
          </Button>
        </div>
      </form>
    </div>
  );
}

// Bulk Upload Form Component
interface BulkUploadFormProps {
  testType: 'TPO' | 'Test';
  testNumber: number;
  section: 'Reading' | 'Listening' | 'Speaking' | 'Writing';
  onSubmit: (questions: TPOQuestion[]) => void;
  onCancel: () => void;
}

function BulkUploadForm({ testType, testNumber, section, onSubmit, onCancel }: BulkUploadFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/json') {
      setFile(selectedFile);
      setError(null);
    } else {
      setFile(null);
      setError('Please upload a valid JSON file.');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      setError('No file selected.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const result = JSON.parse(event.target?.result as string);
        if (Array.isArray(result) && result.every(q => typeof q === 'object' && q !== null)) {
          const questions: TPOQuestion[] = result.map((q: any) => ({
            id: `q-${Date.now()}-${q.questionNumber}`,
            questionNumber: q.questionNumber,
            questionText: q.questionText,
            questionType: q.questionType,
            options: q.options || [],
            correctAnswer: q.correctAnswer || '',
            explanation: q.explanation || '',
            passageText: q.passageText || undefined,
            duration: q.duration || undefined,
            difficulty: q.difficulty || '보통',
            blanks: q.blanks || []
          }));
          onSubmit(questions);
        } else {
          setError('Invalid JSON format. Please ensure the file contains an array of question objects.');
        }
      } catch (err) {
        setError('Error parsing JSON file. Please check the file format.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div
      className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 animate-[fadeSlideUp_0.3s_ease-out]"
    >
      <h3 className="text-xl font-medium text-gray-800 mb-4">
        Bulk Upload {section} Questions - {testType} {testNumber}
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* File Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">JSON File</label>
          <input
            type="file"
            accept="application/json"
            onChange={handleFileChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2d7a7c] focus:border-transparent"
          />
          {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
        </div>

        {/* Form Actions */}
        <div className="flex gap-3 justify-end pt-4 border-t">
          <Button
            type="button"
            onClick={onCancel}
            className="bg-gray-300 text-gray-700 hover:bg-gray-400"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="bg-gradient-to-r from-[#2d7a7c] to-[#1e6b73] text-white hover:from-[#1e6b73] hover:to-[#005f61]"
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload Questions
          </Button>
        </div>
      </form>
    </div>
  );
}