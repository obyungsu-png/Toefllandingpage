import { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Upload, FileText, Music, Video, Image as ImageIcon, Trash2, Edit, Eye, Plus, Book, Headphones, Mic, PenTool, BookOpen, LayoutGrid, List } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '../utils/supabase/info';

const supabaseClient = createClient(`https://${projectId}.supabase.co`, publicAnonKey);

// Upload file to Supabase Storage, return public URL
async function uploadToStorage(file: File, bucket: string): Promise<string> {
  const ext = file.name.split('.').pop() || 'bin';
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabaseClient.storage.from(bucket).upload(path, file, { upsert: true });
  if (error) throw error;
  const { data } = supabaseClient.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}
// motion removed - using CSS animations
import { FillBlanksEditor } from './FillBlanksEditor';
import { AcademicReadingBuilder } from './AcademicReadingBuilder';
import { ReadDailyLifeTemplates, DailyLifeTemplate } from './ReadDailyLifeTemplates';
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
  analysisNote?: string;
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
  const editFormRef = useRef<HTMLDivElement>(null);

  // 편집 폼이 열리면 자동으로 스크롤
  // Auto-create Supabase Storage buckets on mount
  useEffect(() => {
    const ensureBuckets = async () => {
      try {
        for (const bucket of [
          { id: 'listening-audio', mime: ['audio/mpeg','audio/mp3','audio/wav','audio/ogg','audio/x-m4a'] },
          { id: 'listening-images', mime: ['image/png','image/jpeg','image/jpg','image/webp','image/gif'] },
        ]) {
          const { error } = await supabaseClient.storage.createBucket(bucket.id, {
            public: true,
            fileSizeLimit: bucket.id === 'listening-audio' ? 52428800 : 10485760,
            allowedMimeTypes: bucket.mime,
          });
          if (error && !error.message.includes('already exists')) {
            console.warn(`Bucket ${bucket.id}:`, error.message);
          }
        }
      } catch (e) {
        // Ignore - bucket likely already exists
      }
    };
    ensureBuckets();
  }, []);

  useEffect(() => {
    if (editingQuestion && editFormRef.current) {
      setTimeout(() => {
        editFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
    }
  }, [editingQuestion]);
  const [previewQuestion, setPreviewQuestion] = useState<TPOQuestion | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | undefined>(undefined);
  const [selectedMonth, setSelectedMonth] = useState<number | undefined>(undefined);
  const [isOfficial, setIsOfficial] = useState(false);
  const [dateMemo, setDateMemo] = useState<string>('');
  const [showFillBlanksBuilder, setShowFillBlanksBuilder] = useState(false);
  const [showDailyLifeBuilder, setShowDailyLifeBuilder] = useState(false);
  const [showAcademicReadingBuilder, setShowAcademicReadingBuilder] = useState(false);
  const [selectedModule, setSelectedModule] = useState<'Module 1' | 'Module 2'>('Module 1');
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
            // Auto-switch to the section that contains this question
            const test = getExistingTest();
            if (test) {
              const owningSection = test.sections.find(s =>
                s.questions.some(q => q.id === question.id)
              );
              if (owningSection) {
                setSelectedSection(owningSection.sectionType);
              }
            }
            setEditingQuestion(question);
            setViewMode('edit');
            setShowUploadForm(false);
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
              onClick={() => { setShowAcademicReadingBuilder(!showAcademicReadingBuilder); setShowFillBlanksBuilder(false); setShowDailyLifeBuilder(false); }}
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
          <div ref={editFormRef}>
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
          </div>
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

            const m1 = section.questions.filter(q => !(q.questionType||'').includes('Module 2'));
            const m2 = section.questions.filter(q => (q.questionType||'').includes('Module 2'));

            return (
              <div className="grid grid-cols-2 gap-3">
                {/* ── Module 1 panel ── */}
                <div className="rounded-xl border border-[#2d7a7c]/20 overflow-hidden">
                  {/* Header */}
                  <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-[#2d7a7c] to-[#1e6b73]">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-bold text-sm">Module 1</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/20 text-white font-bold">{m1.length}</span>
                    </div>
                  </div>
                  {/* Questions */}
                  <div className="p-2 space-y-0.5 min-h-[80px]">
                    {m1.length === 0 ? (
                      <p className="text-center text-xs text-gray-400 py-4">문제 없음</p>
                    ) : m1.map((q) => (
                      <div key={q.id} className={`flex items-center gap-1.5 px-2 py-1 border rounded-md hover:bg-gray-50 transition-colors ${editingQuestion?.id === q.id ? 'border-[#2d7a7c] bg-[#f0fafa] ring-1 ring-[#2d7a7c]/30' : 'border-gray-100'}`}>
                        <span className="shrink-0 px-1.5 py-0.5 text-white rounded text-[10px] font-bold bg-[#2d7a7c]">Q{q.questionNumber}</span>
                        {q.difficulty && <span className={`shrink-0 text-[10px] px-1 py-0.5 rounded border ${q.difficulty==='쉬움'?'border-green-400 text-green-600':q.difficulty==='어려움'?'border-red-400 text-red-600':'border-yellow-400 text-yellow-600'}`}>{q.difficulty}</span>}
                        <p className="text-[11px] text-gray-600 truncate flex-1">{q.questionText || (q.questionType||'')}</p>
                        <div className="flex gap-0.5 shrink-0">
                          <button className="p-0.5 rounded hover:bg-gray-200 text-gray-500" onClick={()=>setPreviewQuestion(q)}><Eye className="w-3 h-3"/></button>
                          <button className="p-0.5 rounded hover:bg-gray-200 text-gray-500" onClick={()=>{setSelectedSection(selectedSection);setEditingQuestion(q);setShowUploadForm(false);}}><Edit className="w-3 h-3"/></button>
                          <button className="p-0.5 rounded hover:bg-red-100 text-red-400" onClick={()=>{setDeleteConfirmation({type:'question',id:q.id,name:`Q${q.questionNumber}`,onConfirm:()=>{const ut={...test};const si=ut.sections.findIndex(s=>s.sectionType===selectedSection);if(si!==-1){ut.sections[si].questions=ut.sections[si].questions.filter(x=>x.id!==q.id);ut.updatedAt=new Date();onUpdateTest(ut);}setDeleteConfirmation(null);}})}}><Trash2 className="w-3 h-3"/></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── Module 2 panel ── */}
                <div className="rounded-xl border border-orange-200 overflow-hidden">
                  {/* Header */}
                  <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-orange-500 to-orange-400">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-bold text-sm">Module 2</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/20 text-white font-bold">{m2.length}</span>
                    </div>
                  </div>
                  {/* Questions */}
                  <div className="p-2 space-y-0.5 min-h-[80px]">
                    {m2.length === 0 ? (
                      <p className="text-center text-xs text-gray-400 py-4">문제 없음</p>
                    ) : m2.map((q) => (
                      <div key={q.id} className={`flex items-center gap-1.5 px-2 py-1 border rounded-md hover:bg-orange-50/60 transition-colors ${editingQuestion?.id === q.id ? 'border-orange-400 bg-orange-50 ring-1 ring-orange-300' : 'border-orange-100'}`}>
                        <span className="shrink-0 px-1.5 py-0.5 text-white rounded text-[10px] font-bold bg-orange-500">Q{q.questionNumber}</span>
                        {q.difficulty && <span className={`shrink-0 text-[10px] px-1 py-0.5 rounded border ${q.difficulty==='쉬움'?'border-green-400 text-green-600':q.difficulty==='어려움'?'border-red-400 text-red-600':'border-yellow-400 text-yellow-600'}`}>{q.difficulty}</span>}
                        <p className="text-[11px] text-gray-600 truncate flex-1">{q.questionText || (q.questionType||'').replace(' (Module 2)','')}</p>
                        <div className="flex gap-0.5 shrink-0">
                          <button className="p-0.5 rounded hover:bg-gray-200 text-gray-500" onClick={()=>setPreviewQuestion(q)}><Eye className="w-3 h-3"/></button>
                          <button className="p-0.5 rounded hover:bg-gray-200 text-gray-500" onClick={()=>{setSelectedSection(selectedSection);setEditingQuestion(q);setShowUploadForm(false);}}><Edit className="w-3 h-3"/></button>
                          <button className="p-0.5 rounded hover:bg-red-100 text-red-400" onClick={()=>{setDeleteConfirmation({type:'question',id:q.id,name:`Q${q.questionNumber}`,onConfirm:()=>{const ut={...test};const si=ut.sections.findIndex(s=>s.sectionType===selectedSection);if(si!==-1){ut.sections[si].questions=ut.sections[si].questions.filter(x=>x.id!==q.id);ut.updatedAt=new Date();onUpdateTest(ut);}setDeleteConfirmation(null);}})}}><Trash2 className="w-3 h-3"/></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
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
    module: 'Module 1' as 'Module 1' | 'Module 2',
    options: ['', '', '', ''],
    correctAnswer: '',
    explanation: '',
    translationNote: '',
    analysisNote: '',
    vocabularyNote: '',
    passageText: '',
    passageTitle: '',
    colorTheme: '' as string,
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const question: TPOQuestion = {
      id: `q-${Date.now()}`,
      questionNumber: formData.questionNumber,
      questionText: formData.questionText,
      questionType: formData.module === 'Module 2' ? `${formData.questionType} (Module 2)` : formData.questionType,
      options: formData.options.filter(o => o.trim() !== ''),
      correctAnswer: formData.correctAnswer,
      explanation: formData.explanation,
      passageText: (() => {
        const raw = formData.passageText || '';
        const colorId = (formData as any).colorTheme;
        if (!colorId || !raw) return raw || undefined;
        try {
          const obj = JSON.parse(raw);
          obj.color = colorId;
          return JSON.stringify(obj);
        } catch {
          return raw || undefined;
        }
      })(),
      passageTitle: (formData as any).passageTitle || undefined,
      duration: formData.duration || undefined,
      difficulty: formData.difficulty,
      blanks: formData.blanks
    };

    // Handle audio: upload to Supabase Storage if file selected
    if (formData.audioUrl.trim()) {
      question.audioUrl = formData.audioUrl.trim();
    } else if (formData.audioFile) {
      try {
        question.audioUrl = await uploadToStorage(formData.audioFile, 'listening-audio');
      } catch {
        question.audioUrl = URL.createObjectURL(formData.audioFile);
      }
    }

    // Handle image: upload to Supabase Storage if file selected
    if (formData.imageUrl.trim()) {
      question.imageUrl = formData.imageUrl.trim();
    } else if (formData.imageFile) {
      try {
        question.imageUrl = await uploadToStorage(formData.imageFile, 'listening-images');
      } catch {
        question.imageUrl = URL.createObjectURL(formData.imageFile);
      }
    }

    if (formData.videoUrl.trim()) {
      question.videoUrl = formData.videoUrl.trim();
    } else if (formData.videoFile) {
      question.videoUrl = URL.createObjectURL(formData.videoFile);
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

        {/* Module Selector */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-700">Module:</span>
          <div className="flex gap-2">
            {(['Module 1', 'Module 2'] as const).map((mod) => (
              <button
                key={mod}
                type="button"
                onClick={() => setFormData({ ...formData, module: mod })}
                className={`px-5 py-2 rounded-lg text-sm font-semibold border-2 transition-all ${
                  formData.module === mod
                    ? 'bg-[#1e6b73] border-[#1e6b73] text-white shadow-md'
                    : 'bg-white border-gray-300 text-gray-600 hover:border-[#1e6b73] hover:text-[#1e6b73]'
                }`}
              >
                {mod}
              </button>
            ))}
          </div>
          {formData.module === 'Module 2' && (
            <span className="text-xs text-orange-600 bg-orange-50 border border-orange-200 rounded px-2 py-1">
              Module 2로 저장됩니다
            </span>
          )}
        </div>

        {/* Passage Title (for Reading - Academic Passage) */}
        {section === 'Reading' && (
          formData.questionType === 'Read an Academic Passage' ||
          (formData.questionType || '').toLowerCase().includes('academic')
        ) && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Passage Title
              <span className="ml-2 text-xs text-gray-400 font-normal">(지문 제목)</span>
            </label>
            <input
              type="text"
              value={(formData as any).passageTitle || ''}
              onChange={(e) => setFormData({ ...formData, passageTitle: e.target.value } as any)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2d7a7c] focus:border-transparent font-semibold"
              placeholder="예: The Mirror Test"
            />
          </div>
        )}

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
              <div className="mt-3 space-y-2">
                {/* Blank count chips */}
                <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs font-medium text-blue-800 mb-1.5">
                    감지된 빈칸: {formData.blanks.length}개
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {formData.blanks.map((blank, idx) => (
                      <span key={idx} className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                        #{idx + 1}: "{blank.answer}" (최대 {blank.maxLength}자)
                      </span>
                    ))}
                  </div>
                </div>
                {/* Visual passage preview with actual blanks */}
                <div className="p-4 bg-white border-2 border-[#2d7a7c] rounded-lg">
                  <p className="text-xs font-semibold text-[#2d7a7c] mb-2">📝 실전 미리보기</p>
                  <p className="text-sm font-['Inter',_sans-serif] leading-loose">
                    {(() => {
                      const raw = formData.passageText;
                      const parts: React.ReactNode[] = [];
                      let key = 0;
                      const regex = /([^[]+)|\[([^:\]]+):(\d+)\]/g;
                      let match;
                      let blankIdx = 0;
                      while ((match = regex.exec(raw)) !== null) {
                        if (match[1]) {
                          parts.push(<span key={key++}>{match[1]}</span>);
                        } else if (match[2] !== undefined) {
                          const len = parseInt(match[3]);
                          parts.push(
                            <span key={key++} className="inline-block border-b-2 border-gray-500 bg-gray-100 text-transparent select-none rounded px-1 mx-0.5 text-xs align-bottom" style={{minWidth: `${len * 10 + 8}px`, height: '20px'}}>
                              {'_'.repeat(len)}
                            </span>
                          );
                          blankIdx++;
                        }
                      }
                      return parts;
                    })()}
                  </p>
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

        {/* Image Gallery for Listening questions */}
        {section === 'Listening' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Question Image
              <span className="ml-2 text-xs text-gray-400 font-normal">(선택지 왼쪽에 표시되는 이미지)</span>
            </label>

            {/* Current selection */}
            {formData.imageUrl && (
              <div className="mb-3 flex items-center gap-3 p-2 bg-green-50 border border-green-200 rounded-lg">
                <img src={formData.imageUrl} alt="selected" className="w-16 h-16 object-cover rounded" />
                <div className="flex-1 text-xs text-green-700 truncate">{formData.imageUrl.split('/').pop()}</div>
                <button type="button" onClick={() => setFormData({ ...formData, imageUrl: '' })}
                  className="text-red-400 hover:text-red-600 text-xs px-2 py-1 border border-red-200 rounded">
                  제거
                </button>
              </div>
            )}

            {/* Direct URL input */}
            <input
              type="text"
              value={formData.imageUrl}
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#2d7a7c] mb-2"
              placeholder="이미지 URL을 직접 입력하거나 아래에서 선택..."
            />

            {/* File upload */}
            <div className="flex items-center gap-2 mb-3">
              <label className="cursor-pointer px-3 py-2 bg-[#2d7a7c] text-white text-xs font-semibold rounded-lg hover:bg-[#1e6b73] transition-colors">
                📁 파일 업로드
                <input type="file" accept="image/*" className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setFormData({ ...formData, imageFile: file, imageUrl: URL.createObjectURL(file) });
                    }
                  }}
                />
              </label>
              <span className="text-xs text-gray-400">또는 URL 직접 입력</span>
            </div>

            {/* Sample image gallery by category */}
            <div className="space-y-3">
              {[
                {
                  category: '🎙 Listen and Response (1인)',
                  images: [
                    { url: '/listening-images/woman-navy-cardigan.png', label: '여성 네이비' },
                    { url: '/listening-images/man-green-polo.png', label: '남성 그린' },
                    { url: '/listening-images/woman-green-polo.png', label: '여성 그린' },
                    { url: '/listening-images/man-burgundy-turtleneck.png', label: '남성 버건디' },
                    { url: '/listening-images/woman-navy-cardigan-2.png', label: '여성 네이비2' },
                    { url: '/listening-images/man-pink-shirt.png', label: '남성 핑크' },
                  ]
                },
                {
                  category: '💬 Short Conversation (2인)',
                  images: [
                    { url: '/listening-images/two-people-conversation-1.png', label: '대화1' },
                    { url: '/listening-images/two-people-conversation-2.png', label: '대화2' },
                  ]
                },
                {
                  category: '📢 Announcement',
                  images: [
                    { url: '/listening-images/man-pink-shirt-2.png', label: '남성 핑크2' },
                    { url: '/listening-images/woman-purple-scarf.png', label: '여성 보라' },
                    { url: '/listening-images/woman-navy-cardigan.png', label: '여성 네이비' },
                    { url: '/listening-images/man-green-polo.png', label: '남성 그린' },
                    { url: '/listening-images/woman-green-polo.png', label: '여성 그린' },
                    { url: '/listening-images/man-burgundy-turtleneck.png', label: '남성 버건디' },
                    { url: '/listening-images/woman-navy-cardigan-2.png', label: '여성 네이비2' },
                    { url: '/listening-images/man-pink-shirt.png', label: '남성 핑크' },
                  ]
                },
              ].map(({ category, images }) => (
                <div key={category}>
                  <p className="text-[10px] font-semibold text-gray-500 mb-1.5">{category}</p>
                  <div className="flex gap-2 flex-wrap p-2 bg-gray-50 border border-gray-200 rounded-lg">
                    {images.map((img) => (
                      <button key={img.url} type="button"
                        onClick={() => setFormData({ ...formData, imageUrl: img.url })}
                        className={`flex flex-col items-center gap-1 rounded-lg border-2 transition-all hover:border-[#2d7a7c] overflow-hidden ${
                          formData.imageUrl === img.url ? 'border-[#2d7a7c] bg-[#f0fafa]' : 'border-transparent'
                        }`}
                        title={img.label}
                      >
                        <img
                          src={img.url}
                          alt={img.label}
                          className="object-contain bg-white rounded"
                          style={{ width: '72px', height: '100px', objectPosition: 'center top' }}
                        />
                        <span className="text-[9px] text-gray-500 pb-0.5">{img.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

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

        {/* Question Text + Answer Options - 한번에 입력 */}
        {(section === 'Reading' || section === 'Listening') && formData.questionType !== 'Complete Words' ? (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                문제 + 선택지 한번에 입력
              </label>
              <p className="text-xs text-blue-600 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 mb-2">
                💡 <strong>첫 줄:</strong> 문제 &nbsp;|&nbsp; <strong>나머지 줄:</strong> 선택지 (한 줄에 하나씩)<br/>
                예시: <span className="font-mono">What is the main idea?<br/>　Animals have self-awareness.<br/>　Fish are intelligent.<br/>　Apes are unique.<br/>　Children develop slowly.</span>
              </p>
              <textarea
                value={[formData.questionText, ...formData.options.filter(o => o.trim())].join('\n')}
                onChange={(e) => {
                  const lines = e.target.value.split('\n');
                  const qText = lines[0] || '';
                  const opts = lines.slice(1);
                  while (opts.length < 4) opts.push('');
                  setFormData({ ...formData, questionText: qText, options: opts });
                }}
                className="w-full px-4 py-3 border-2 border-[#2d7a7c] rounded-lg focus:ring-2 focus:ring-[#2d7a7c] focus:border-transparent font-mono text-sm leading-relaxed"
                rows={6}
                placeholder={"문제를 첫 줄에 입력하세요\n선택지 1\n선택지 2\n선택지 3\n선택지 4"}
                required
              />
              <p className="text-xs text-gray-400 mt-1">첫 줄 = 문제 텍스트 &nbsp;·&nbsp; 2번째 줄부터 = 선택지</p>
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
                <option value="">정답을 선택하세요...</option>
                {formData.options.filter(o => o.trim() !== '').map((option, index) => (
                  <option key={index} value={option}>{option}</option>
                ))}
              </select>
            </div>
          </>
        ) : (
          /* Non-MC: just Question Text */
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

        {/* AI Review Fields: Translation, Analysis, Key Words */}
        <div className="border-t border-gray-200 pt-4 space-y-3">
          <p className="text-xs font-bold text-[#2d7a7c] uppercase tracking-wide flex items-center gap-1">
            ✨ AI Review Panel Fields
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Translation <span className="text-xs text-gray-400 font-normal">(Korean translation of the passage/question)</span>
            </label>
            <textarea
              value={(formData as any).translationNote || ''}
              onChange={(e) => setFormData({ ...formData, translationNote: e.target.value } as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2d7a7c] text-sm"
              rows={3}
              placeholder="지문/문제의 한국어 번역을 입력하세요..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Analysis <span className="text-xs text-gray-400 font-normal">(question strategy & answer explanation)</span>
            </label>
            <textarea
              value={(formData as any).analysisNote || ''}
              onChange={(e) => setFormData({ ...formData, analysisNote: e.target.value } as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2d7a7c] text-sm"
              rows={3}
              placeholder="문제 풀이 전략, 정답 근거를 입력하세요..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Key Words <span className="text-xs text-gray-400 font-normal">(one word per line: word = meaning)</span>
            </label>
            <textarea
              value={(formData as any).vocabularyNote || ''}
              onChange={(e) => setFormData({ ...formData, vocabularyNote: e.target.value } as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2d7a7c] text-sm font-mono"
              rows={4}
              placeholder={"cohesion = 결속, 통합\nintegration = 통합\nself-awareness = 자기 인식"}
            />
          </div>
        </div>

        {/* Color Theme (Read in Daily Life only) */}
        {section === 'Reading' && (
          (formData.questionType || '').toLowerCase().includes('daily life') ||
          (formData.questionType || '').toLowerCase().includes('notice') ||
          (formData.questionType || '').toLowerCase().includes('email') ||
          (formData.questionType || '').toLowerCase().includes('social')
        ) && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              색상 테마 (Color Theme)
              <span className="ml-2 text-xs text-gray-400 font-normal">지문 UI 색상</span>
            </label>
            <div className="flex gap-2 flex-wrap">
              {([
                ['teal',   '#1e6b73', '기본'],
                ['gray',   '#6b7280', '회색'],
                ['blue',   '#2563eb', '파란색'],
                ['black',  '#111827', '검은색'],
                ['purple', '#7c3aed', '자주색'],
                ['orange', '#ea580c', '주황색'],
              ] as const).map(([id, hex, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setFormData({ ...formData, colorTheme: id } as any)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-all border-2"
                  style={{
                    backgroundColor: hex,
                    borderColor: (formData as any).colorTheme === id ? 'white' : 'transparent',
                    outline: (formData as any).colorTheme === id ? `2px solid ${hex}` : 'none',
                    transform: (formData as any).colorTheme === id ? 'scale(1.1)' : 'scale(1)',
                    boxShadow: (formData as any).colorTheme === id ? '0 0 0 3px ' + hex + '50' : 'none',
                  }}
                >
                  {(formData as any).colorTheme === id && '✓ '}{label}
                </button>
              ))}
            </div>
          </div>
        )}

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
    questionType: question.questionType.replace(' (Module 2)', ''),
    module: (question.questionType || '').includes('Module 2') ? 'Module 2' as const : 'Module 1' as const,
    options: question.options || ['', '', '', ''],
    correctAnswer: question.correctAnswer || '',
    explanation: question.explanation || '',
    passageText: question.passageText || '',
    passageTitle: question.passageTitle || '',
    translationNote: question.translationNote || '',
    analysisNote: (question as any).analysisNote || '',
    vocabularyNote: question.vocabularyNote || '',
    colorTheme: (() => {
      try { return JSON.parse(question.passageText || '').color || 'teal'; } catch { return 'teal'; }
    })() as string,
    audioFile: null as File | null,
    videoFile: null as File | null,
    imageFile: null as File | null,
    imageUrl: question.imageUrl || '',
    audioUrl: question.audioUrl || '',
    duration: question.duration || 0,
    difficulty: question.difficulty || '보통' as '쉬움' | '보통' | '어려움',
    blanks: question.blanks || [] as Array<{ answer: string; maxLength: number }>
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const updatedQuestion: TPOQuestion = {
      id: question.id,
      questionNumber: formData.questionNumber,
      questionText: formData.questionText,
      questionType: (formData as any).module === 'Module 2' ? `${formData.questionType} (Module 2)` : formData.questionType,
      options: formData.options.filter(o => o.trim() !== ''),
      correctAnswer: formData.correctAnswer,
      explanation: formData.explanation,
      passageText: (() => {
        const raw = formData.passageText || '';
        const colorId = (formData as any).colorTheme;
        if (!colorId || !raw) return raw || undefined;
        try {
          const obj = JSON.parse(raw);
          obj.color = colorId;
          return JSON.stringify(obj);
        } catch {
          return raw || undefined;
        }
      })(),
      passageTitle: (formData as any).passageTitle || undefined,
      duration: formData.duration || undefined,
      difficulty: formData.difficulty,
      blanks: formData.blanks
    };

    // Handle file uploads to Supabase or use URL from gallery
    if ((formData as any).audioUrl?.trim()) {
      updatedQuestion.audioUrl = (formData as any).audioUrl.trim();
    }
    if (formData.audioFile) {
      try { updatedQuestion.audioUrl = await uploadToStorage(formData.audioFile, 'listening-audio'); }
      catch { updatedQuestion.audioUrl = URL.createObjectURL(formData.audioFile); }
    }
    if ((formData as any).imageUrl?.trim()) {
      updatedQuestion.imageUrl = (formData as any).imageUrl.trim();
    }
    if (formData.imageFile) {
      try { updatedQuestion.imageUrl = await uploadToStorage(formData.imageFile, 'listening-images'); }
      catch { updatedQuestion.imageUrl = URL.createObjectURL(formData.imageFile); }
    }
    if (formData.videoFile) {
      updatedQuestion.videoUrl = URL.createObjectURL(formData.videoFile);
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

        {/* Module Selector */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-700">Module:</span>
          <div className="flex gap-2">
            {(['Module 1', 'Module 2'] as const).map((mod) => (
              <button
                key={mod}
                type="button"
                onClick={() => setFormData({ ...formData, module: mod } as any)}
                className={`px-5 py-2 rounded-lg text-sm font-semibold border-2 transition-all ${
                  (formData as any).module === mod
                    ? 'bg-[#1e6b73] border-[#1e6b73] text-white shadow-md'
                    : 'bg-white border-gray-300 text-gray-600 hover:border-[#1e6b73] hover:text-[#1e6b73]'
                }`}
              >
                {mod}
              </button>
            ))}
          </div>
          {(formData as any).module === 'Module 2' && (
            <span className="text-xs text-orange-600 bg-orange-50 border border-orange-200 rounded px-2 py-1">
              Module 2로 저장됩니다
            </span>
          )}
        </div>

        {/* Passage Title (for Reading - Academic Passage) */}
        {section === 'Reading' && (
          formData.questionType === 'Read an Academic Passage' ||
          (formData.questionType || '').toLowerCase().includes('academic')
        ) && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Passage Title
              <span className="ml-2 text-xs text-gray-400 font-normal">(지문 제목)</span>
            </label>
            <input
              type="text"
              value={(formData as any).passageTitle || ''}
              onChange={(e) => setFormData({ ...formData, passageTitle: e.target.value } as any)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2d7a7c] focus:border-transparent font-semibold"
              placeholder="예: The Mirror Test"
            />
          </div>
        )}

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
              <div className="mt-3 space-y-2">
                {/* Blank count chips */}
                <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs font-medium text-blue-800 mb-1.5">
                    감지된 빈칸: {formData.blanks.length}개
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {formData.blanks.map((blank, idx) => (
                      <span key={idx} className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                        #{idx + 1}: "{blank.answer}" (최대 {blank.maxLength}자)
                      </span>
                    ))}
                  </div>
                </div>
                {/* Visual passage preview with actual blanks */}
                <div className="p-4 bg-white border-2 border-[#2d7a7c] rounded-lg">
                  <p className="text-xs font-semibold text-[#2d7a7c] mb-2">📝 실전 미리보기</p>
                  <p className="text-sm font-['Inter',_sans-serif] leading-loose">
                    {(() => {
                      const raw = formData.passageText;
                      const parts: React.ReactNode[] = [];
                      let key = 0;
                      const regex = /([^[]+)|\[([^:\]]+):(\d+)\]/g;
                      let match;
                      let blankIdx = 0;
                      while ((match = regex.exec(raw)) !== null) {
                        if (match[1]) {
                          parts.push(<span key={key++}>{match[1]}</span>);
                        } else if (match[2] !== undefined) {
                          const len = parseInt(match[3]);
                          parts.push(
                            <span key={key++} className="inline-block border-b-2 border-gray-500 bg-gray-100 text-transparent select-none rounded px-1 mx-0.5 text-xs align-bottom" style={{minWidth: `${len * 10 + 8}px`, height: '20px'}}>
                              {'_'.repeat(len)}
                            </span>
                          );
                          blankIdx++;
                        }
                      }
                      return parts;
                    })()}
                  </p>
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

        {/* Image Gallery for Listening questions (Edit form) */}
        {section === 'Listening' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Question Image
              <span className="ml-2 text-xs text-gray-400 font-normal">(선택지 왼쪽에 표시되는 이미지)</span>
            </label>
            {(formData as any).imageUrl && (
              <div className="mb-3 flex items-center gap-3 p-2 bg-green-50 border border-green-200 rounded-lg">
                <img src={(formData as any).imageUrl} alt="selected" className="w-16 h-16 object-cover rounded" />
                <div className="flex-1 text-xs text-green-700 truncate">{((formData as any).imageUrl || '').split('/').pop()}</div>
                <button type="button" onClick={() => setFormData({ ...formData, imageUrl: '' } as any)}
                  className="text-red-400 hover:text-red-600 text-xs px-2 py-1 border border-red-200 rounded">제거</button>
              </div>
            )}
            <input type="text" value={(formData as any).imageUrl || ''} onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value } as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#2d7a7c] mb-2" placeholder="이미지 URL을 직접 입력하거나 아래에서 선택..." />
            <div className="flex items-center gap-2 mb-3">
              <label className="cursor-pointer px-3 py-2 bg-[#2d7a7c] text-white text-xs font-semibold rounded-lg hover:bg-[#1e6b73] transition-colors">
                📁 파일 업로드
                <input type="file" accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) { setFormData({ ...formData, imageFile: file, imageUrl: URL.createObjectURL(file) } as any); } }} />
              </label>
              <span className="text-xs text-gray-400">또는 URL 직접 입력</span>
            </div>
            <div className="space-y-3">
              {[
                { category: '🎙 Listen and Response (1인)', images: [
                  { url: '/listening-images/woman-navy-cardigan.png', label: '여성 네이비' },
                  { url: '/listening-images/man-green-polo.png', label: '남성 그린' },
                  { url: '/listening-images/woman-green-polo.png', label: '여성 그린' },
                  { url: '/listening-images/man-burgundy-turtleneck.png', label: '남성 버건디' },
                  { url: '/listening-images/woman-navy-cardigan-2.png', label: '여성 네이비2' },
                  { url: '/listening-images/man-pink-shirt.png', label: '남성 핑크' },
                ]},
                { category: '💬 Short Conversation (2인)', images: [
                  { url: '/listening-images/two-people-conversation-1.png', label: '대화1' },
                  { url: '/listening-images/two-people-conversation-2.png', label: '대화2' },
                ]},
                { category: '📢 Announcement', images: [
                  { url: '/listening-images/man-pink-shirt-2.png', label: '남성 핑크2' },
                  { url: '/listening-images/woman-purple-scarf.png', label: '여성 보라' },
                  { url: '/listening-images/woman-navy-cardigan.png', label: '여성 네이비' },
                  { url: '/listening-images/man-green-polo.png', label: '남성 그린' },
                  { url: '/listening-images/woman-green-polo.png', label: '여성 그린' },
                  { url: '/listening-images/man-burgundy-turtleneck.png', label: '남성 버건디' },
                  { url: '/listening-images/woman-navy-cardigan-2.png', label: '여성 네이비2' },
                  { url: '/listening-images/man-pink-shirt.png', label: '남성 핑크' },
                ]},
              ].map(({ category, images }) => (
                <div key={category}>
                  <p className="text-[10px] font-semibold text-gray-500 mb-1.5">{category}</p>
                  <div className="flex gap-2 flex-wrap p-2 bg-gray-50 border border-gray-200 rounded-lg">
                    {images.map((img) => (
                      <button key={img.url} type="button" onClick={() => setFormData({ ...formData, imageUrl: img.url } as any)}
                        className={`flex flex-col items-center gap-1 rounded-lg border-2 transition-all hover:border-[#2d7a7c] overflow-hidden ${(formData as any).imageUrl === img.url ? 'border-[#2d7a7c] bg-[#f0fafa]' : 'border-transparent'}`} title={img.label}>
                        <img src={img.url} alt={img.label} className="object-contain bg-white rounded" style={{ width: '72px', height: '100px', objectPosition: 'center top' }} />
                        <span className="text-[9px] text-gray-500 pb-0.5">{img.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

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

        {/* Question Text + Answer Options - 한번에 입력 */}
        {(section === 'Reading' || section === 'Listening') && formData.questionType !== 'Complete Words' ? (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                문제 + 선택지 한번에 입력
              </label>
              <p className="text-xs text-blue-600 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 mb-2">
                💡 <strong>첫 줄:</strong> 문제 &nbsp;|&nbsp; <strong>나머지 줄:</strong> 선택지 (한 줄에 하나씩)<br/>
                예시: <span className="font-mono">What is the main idea?<br/>　Animals have self-awareness.<br/>　Fish are intelligent.<br/>　Apes are unique.<br/>　Children develop slowly.</span>
              </p>
              <textarea
                value={[formData.questionText, ...formData.options.filter(o => o.trim())].join('\n')}
                onChange={(e) => {
                  const lines = e.target.value.split('\n');
                  const qText = lines[0] || '';
                  const opts = lines.slice(1);
                  while (opts.length < 4) opts.push('');
                  setFormData({ ...formData, questionText: qText, options: opts });
                }}
                className="w-full px-4 py-3 border-2 border-[#2d7a7c] rounded-lg focus:ring-2 focus:ring-[#2d7a7c] focus:border-transparent font-mono text-sm leading-relaxed"
                rows={6}
                placeholder={"문제를 첫 줄에 입력하세요\n선택지 1\n선택지 2\n선택지 3\n선택지 4"}
                required
              />
              <p className="text-xs text-gray-400 mt-1">첫 줄 = 문제 텍스트 &nbsp;·&nbsp; 2번째 줄부터 = 선택지</p>
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
                <option value="">정답을 선택하세요...</option>
                {formData.options.filter(o => o.trim() !== '').map((option, index) => (
                  <option key={index} value={option}>{option}</option>
                ))}
              </select>
            </div>
          </>
        ) : (
          /* Non-MC: just Question Text */
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

        {/* AI Review Fields: Translation, Analysis, Key Words */}
        <div className="border-t border-gray-200 pt-4 space-y-3">
          <p className="text-xs font-bold text-[#2d7a7c] uppercase tracking-wide flex items-center gap-1">
            ✨ AI Review Panel Fields
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Translation <span className="text-xs text-gray-400 font-normal">(Korean translation of the passage/question)</span>
            </label>
            <textarea
              value={(formData as any).translationNote || ''}
              onChange={(e) => setFormData({ ...formData, translationNote: e.target.value } as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2d7a7c] text-sm"
              rows={3}
              placeholder="지문/문제의 한국어 번역을 입력하세요..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Analysis <span className="text-xs text-gray-400 font-normal">(question strategy & answer explanation)</span>
            </label>
            <textarea
              value={(formData as any).analysisNote || ''}
              onChange={(e) => setFormData({ ...formData, analysisNote: e.target.value } as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2d7a7c] text-sm"
              rows={3}
              placeholder="문제 풀이 전략, 정답 근거를 입력하세요..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Key Words <span className="text-xs text-gray-400 font-normal">(one word per line: word = meaning)</span>
            </label>
            <textarea
              value={(formData as any).vocabularyNote || ''}
              onChange={(e) => setFormData({ ...formData, vocabularyNote: e.target.value } as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2d7a7c] text-sm font-mono"
              rows={4}
              placeholder={"cohesion = 결속, 통합\nintegration = 통합\nself-awareness = 자기 인식"}
            />
          </div>
        </div>

        {/* Color Theme (Read in Daily Life only) */}
        {section === 'Reading' && (
          (formData.questionType || '').toLowerCase().includes('daily life') ||
          (formData.questionType || '').toLowerCase().includes('notice') ||
          (formData.questionType || '').toLowerCase().includes('email') ||
          (formData.questionType || '').toLowerCase().includes('social')
        ) && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              색상 테마 (Color Theme)
              <span className="ml-2 text-xs text-gray-400 font-normal">지문 UI 색상</span>
            </label>
            <div className="flex gap-2 flex-wrap">
              {([
                ['teal',   '#1e6b73', '기본'],
                ['gray',   '#6b7280', '회색'],
                ['blue',   '#2563eb', '파란색'],
                ['black',  '#111827', '검은색'],
                ['purple', '#7c3aed', '자주색'],
                ['orange', '#ea580c', '주황색'],
              ] as const).map(([id, hex, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setFormData({ ...formData, colorTheme: id } as any)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-all border-2"
                  style={{
                    backgroundColor: hex,
                    borderColor: (formData as any).colorTheme === id ? 'white' : 'transparent',
                    outline: (formData as any).colorTheme === id ? `2px solid ${hex}` : 'none',
                    transform: (formData as any).colorTheme === id ? 'scale(1.1)' : 'scale(1)',
                    boxShadow: (formData as any).colorTheme === id ? '0 0 0 3px ' + hex + '50' : 'none',
                  }}
                >
                  {(formData as any).colorTheme === id && '✓ '}{label}
                </button>
              ))}
            </div>
          </div>
        )}

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

  const handleSubmit = async (e: React.FormEvent) => {
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