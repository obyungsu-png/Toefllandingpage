import { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Upload, FileText, Music, Video, Image as ImageIcon, Trash2, Edit, Eye, Plus, Book, Headphones, Mic, PenTool, BookOpen, LayoutGrid, List, X } from 'lucide-react';
import { supabase as supabaseClient } from '../utils/supabase/client';
import { getQuestionRangeLabel, getTotalQuestionCount, parseQuestionRange, isCompleteWordsType } from '../utils/readingQuestionUtils';

// 기본 아바타 목록 (public/avatars/ 에서 서빙)
const DEFAULT_AVATARS = [
  { url: '/avatars/avatar-male-asian.png', label: '남성 1' },
  { url: '/avatars/avatar-female-red.png', label: '여성 1' },
  { url: '/avatars/avatar-male-beard.png', label: '남성 2' },
  { url: '/avatars/avatar-female-curly.png', label: '여성 2' },
  { url: '/avatars/avatar-male-blonde.png', label: '남성 3' },
  { url: '/avatars/avatar-female-redhair.png', label: '여성 3' },
  { url: '/avatars/avatar-female-brown.png', label: '여성 4' },
];




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
  introImageUrl?: string; // Speaking intro screen image (Q1 Listen&Repeat intro, Q8 Interview intro)
  introAudioUrl?: string;  // Speaking intro screen audio (replaces TTS on intro screens)
  passageText?: string;
  duration?: number; // for speaking/writing
  // Speaking phase timing (seconds). Defaults when not set: audioPlayDuration=5, responseDelay=3, stopDuration=2.5
  audioPlayDuration?: number; // how long Playing audio/video screen stays before response time
  responseDelay?: number;     // buffer (s) between audio end and recording timer start
  stopDuration?: number;      // how long Stop Speaking overlay shows before advancing
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
  sentenceEnding?: '.' | '?'; // Period or question mark at end of Build a Sentence
  // For Writing "Academic Discussion" (Q11+, 두번째 라이팅 문제 — 교수님 + 학생 두 명)
  professorImageUrl?: string;
  professorName?: string;
  professorMessage?: string;
  student1ImageUrl?: string;
  student1Name?: string;
  student1Message?: string;
  student2ImageUrl?: string;
  student2Name?: string;
  student2Message?: string;
  // For grouped Listening types (Short Conversation, Announcements, Academic Talk)
  passageAudioUrl?: string;
  passageImageUrl?: string;
  passageTitle?: string;
  interstitialTitle?: string; // 인트로 화면 상단 한줄 텍스트 (conversation/announcement/lecture)
  // Write an Email (Writing Q1) fields
  emailScenario?: string;      // 상단 상황 설명 문단
  emailInstruction?: string;   // "Write an email to..." 한 줄
  emailBullets?: string[];     // 세 가지 지시 사항 (bullet list)
  emailSubject?: string;       // Subject 줄
  emailTo?: string;            // To 줄
  questionGroupId?: string;
  translationNote?: string;
  scriptText?: string; // Listening dictation/transcript script (shown in Review Script tab)
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

// ─── UPSERT helpers — questionNumber 기준으로 기존 문제를 찾아 교체, 없으면 추가 ───
// 같은 번호의 문제가 이미 존재하면 덮어쓰고, 없으면 배열 끝에 추가합니다.
// (빈칸넣기 "1-10" 범위 형식도 문자열 비교로 동일하게 처리)
export function upsertQuestion(questions: TPOQuestion[], newQuestion: TPOQuestion): TPOQuestion[] {
  const newKey = String(newQuestion.questionNumber);
  const idx = questions.findIndex(q => String(q.questionNumber) === newKey);
  if (idx === -1) return [...questions, newQuestion];
  return questions.map((q, i) => (i === idx ? { ...q, ...newQuestion } : q));
}

export function upsertQuestions(questions: TPOQuestion[], newQuestions: TPOQuestion[]): TPOQuestion[] {
  let result = [...questions];
  for (const q of newQuestions) {
    result = upsertQuestion(result, q);
  }
  return result;
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
  const [showAudioSplitter, setShowAudioSplitter] = useState(false);
  const [showMediaMatcher, setShowMediaMatcher] = useState(false);
  const [editingTest, setEditingTest] = useState<TPOTest | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<TPOQuestion | null>(null);
  const editFormRef = useRef<HTMLDivElement>(null);

  // 편집 폼이 열리면 자동으로 스크롤
  // Note: Storage buckets (listening-audio, listening-images, listening-video)는
  // Supabase 대시보드에서 이미 PUBLIC으로 생성됨 - auto-create 로직 제거

  // Load uploaded gallery images from Supabase
  useEffect(() => {
    const loadImages = async () => {
      const { data, error } = await supabaseClient.from('listening_images').select('*');
      if (!error && data) {
        setUploadedImages(data);
      }
    };
    loadImages();
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

  // 업로드된 갤러리 이미지 목록
  interface UploadedImage {
    id: string;
    url: string;
    category: string;
    label: string;
  }
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);

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
      'Academic Discussion'
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

  // 갤러리 이미지 업로드: Storage + listening_images 테이블에 저장
  const handleUploadGalleryImage = async (category: string, file: File) => {
    try {
      const url = await uploadToStorage(file, 'listening-images');
      const label = file.name.replace(/\.[^/.]+$/, '');
      const { data, error } = await supabaseClient
        .from('listening_images')
        .insert([{ url, category, label }])
        .select()
        .single();
      if (error) throw error;
      if (data) {
        setUploadedImages(prev => [...prev, data as UploadedImage]);
      }
    } catch (err) {
      console.error('Failed to upload gallery image:', err);
      alert('업로드 실패: ' + (err as Error).message);
    }
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
    section.questions = upsertQuestion(section.questions, question);
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
      stats[section.sectionType] = getTotalQuestionCount(section.questions);
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
          tests={tests || []}
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
        <div className="mt-4 pt-4 border-t-2 border-[#2d7a7c]/20">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-5 bg-[#2d7a7c] rounded-full" />
            <h4 className="font-bold text-[#2d7a7c] text-xs md:text-sm">📅 연도 · 월 설정 <span className="text-gray-400 font-normal">(카드 배지 + 필터 연동)</span></h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-4 bg-[#f0fafa] border border-[#2d7a7c]/20 rounded-xl p-3 md:p-4">
            {/* Year */}
            <div>
              <label className="block text-xs md:text-sm font-bold text-[#2d7a7c] mb-2">🗓 Year</label>
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
                className="w-full px-3 md:px-4 py-2 border-2 border-[#2d7a7c]/30 rounded-lg focus:ring-2 focus:ring-[#2d7a7c] focus:border-transparent text-sm md:text-base font-medium bg-white"
              >
                <option value="">미설정</option>
                {[2023, 2024, 2025, 2026, 2027].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            {/* Month */}
            <div>
              <label className="block text-xs md:text-sm font-bold text-[#e67e22] mb-2">📆 Month</label>
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
                className="w-full px-3 md:px-4 py-2 border-2 border-[#e67e22]/30 rounded-lg focus:ring-2 focus:ring-[#e67e22] focus:border-transparent text-sm md:text-base font-medium bg-white"
              >
                <option value="">미설정</option>
                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                  <option key={m} value={m}>
                    {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][m - 1]} ({m}월)
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
          Bulk Upload Questions (Text)
        </Button>
        {(selectedSection === 'Listening' || selectedSection === 'Speaking') && (
          <Button
            onClick={() => setShowAudioSplitter(!showAudioSplitter)}
            className={`shadow-lg ${showAudioSplitter ? 'bg-purple-700 text-white' : 'bg-purple-500 text-white hover:bg-purple-600'}`}
          >
            <Music className="w-5 h-5 mr-2" />
            Audio Split Upload
          </Button>
        )}
        <Button
          onClick={() => setShowMediaMatcher(!showMediaMatcher)}
          className={`shadow-lg ${showMediaMatcher ? 'bg-indigo-700 text-white' : 'bg-indigo-500 text-white hover:bg-indigo-600'}`}
        >
          <Upload className="w-5 h-5 mr-2" />
          미디어 일괄 매칭
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

              // UPSERT: 같은 번호의 문제가 있으면 교체, 없으면 추가
              section.questions = upsertQuestion(section.questions, question);
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
            key={editingQuestion.id}
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

                // 번호 순으로 정렬 (범위 문자열 "1-10"도 parseInt로 시작 번호 추출)
                newQuestions.sort((a, b) => {
                  const na = typeof a.questionNumber === 'number' ? a.questionNumber : parseInt(String(a.questionNumber)) || 0;
                  const nb = typeof b.questionNumber === 'number' ? b.questionNumber : parseInt(String(b.questionNumber)) || 0;
                  return na - nb;
                });

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
            questionTypeOptions={questionTypes[selectedSection]}
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

              // UPSERT: 같은 번호의 문제는 교체, 새 번호는 추가 (중복 누적 방지)
              section.questions = upsertQuestions(section.questions, questions);
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

      {/* Audio Splitter Panel */}
      {showAudioSplitter && getExistingTest() && (selectedSection === 'Listening' || selectedSection === 'Speaking') && (() => {
        const t = getExistingTest()!;
        const s = t.sections.find(sec => sec.sectionType === selectedSection);
        if (!s) return null;
        return (
          <AudioSplitterPanel
            test={t}
            section={s}
            onUpdateTest={onUpdateTest}
            onClose={() => setShowAudioSplitter(false)}
          />
        );
      })()}

      {showMediaMatcher && getExistingTest() && (() => {
        const t = getExistingTest()!;
        const s = t.sections.find(sec => sec.sectionType === selectedSection);
        if (!s) return null;
        return (
          <MediaMatcherPanel
            test={t}
            section={s}
            onUpdateTest={onUpdateTest}
            onClose={() => setShowMediaMatcher(false)}
          />
        );
      })()}

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
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/20 text-white font-bold">{getTotalQuestionCount(m1)}</span>
                    </div>
                  </div>
                  {/* Questions */}
                  <div className="p-2 space-y-0.5 min-h-[80px]">
                    {m1.length === 0 ? (
                      <p className="text-center text-xs text-gray-400 py-4">문제 없음</p>
                    ) : m1.map((q) => (
                      <div key={q.id} className={`flex items-center gap-1.5 px-2 py-1 border rounded-md hover:bg-gray-50 transition-colors ${editingQuestion?.id === q.id ? 'border-[#2d7a7c] bg-[#f0fafa] ring-1 ring-[#2d7a7c]/30' : 'border-gray-100'}`}>
                        <span className="shrink-0 px-1.5 py-0.5 text-white rounded text-[10px] font-bold bg-[#2d7a7c]">{getQuestionRangeLabel(q)}</span>
                        {q.difficulty && <span className={`shrink-0 text-[10px] px-1 py-0.5 rounded border ${q.difficulty==='쉬움'?'border-green-400 text-green-600':q.difficulty==='어려움'?'border-red-400 text-red-600':'border-yellow-400 text-yellow-600'}`}>{q.difficulty}</span>}
                        <p className="text-[11px] text-gray-600 truncate flex-1">{q.questionText || (q.questionType||'')}</p>
                        <div className="flex gap-0.5 shrink-0">
                          <button className="p-0.5 rounded hover:bg-gray-200 text-gray-500" onClick={()=>setPreviewQuestion(q)}><Eye className="w-3 h-3"/></button>
                          <button className="p-0.5 rounded hover:bg-gray-200 text-gray-500" onClick={()=>{setSelectedSection(selectedSection);setEditingQuestion(q);setShowUploadForm(false);}}><Edit className="w-3 h-3"/></button>
                          <button className="p-0.5 rounded hover:bg-red-100 text-red-400" onClick={()=>{setDeleteConfirmation({type:'question',id:q.id,name:getQuestionRangeLabel(q),onConfirm:()=>{const ut={...test};const si=ut.sections.findIndex(s=>s.sectionType===selectedSection);if(si!==-1){ut.sections[si].questions=ut.sections[si].questions.filter(x=>x.id!==q.id);ut.updatedAt=new Date();onUpdateTest(ut);}setDeleteConfirmation(null);}})}}><Trash2 className="w-3 h-3"/></button>
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
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/20 text-white font-bold">{getTotalQuestionCount(m2)}</span>
                    </div>
                  </div>
                  {/* Questions */}
                  <div className="p-2 space-y-0.5 min-h-[80px]">
                    {m2.length === 0 ? (
                      <p className="text-center text-xs text-gray-400 py-4">문제 없음</p>
                    ) : m2.map((q) => (
                      <div key={q.id} className={`flex items-center gap-1.5 px-2 py-1 border rounded-md hover:bg-orange-50/60 transition-colors ${editingQuestion?.id === q.id ? 'border-orange-400 bg-orange-50 ring-1 ring-orange-300' : 'border-orange-100'}`}>
                        <span className="shrink-0 px-1.5 py-0.5 text-white rounded text-[10px] font-bold bg-orange-500">{getQuestionRangeLabel(q)}</span>
                        {q.difficulty && <span className={`shrink-0 text-[10px] px-1 py-0.5 rounded border ${q.difficulty==='쉬움'?'border-green-400 text-green-600':q.difficulty==='어려움'?'border-red-400 text-red-600':'border-yellow-400 text-yellow-600'}`}>{q.difficulty}</span>}
                        <p className="text-[11px] text-gray-600 truncate flex-1">{q.questionText || (q.questionType||'').replace(' (Module 2)','')}</p>
                        <div className="flex gap-0.5 shrink-0">
                          <button className="p-0.5 rounded hover:bg-gray-200 text-gray-500" onClick={()=>setPreviewQuestion(q)}><Eye className="w-3 h-3"/></button>
                          <button className="p-0.5 rounded hover:bg-gray-200 text-gray-500" onClick={()=>{setSelectedSection(selectedSection);setEditingQuestion(q);setShowUploadForm(false);}}><Edit className="w-3 h-3"/></button>
                          <button className="p-0.5 rounded hover:bg-red-100 text-red-400" onClick={()=>{setDeleteConfirmation({type:'question',id:q.id,name:getQuestionRangeLabel(q),onConfirm:()=>{const ut={...test};const si=ut.sections.findIndex(s=>s.sectionType===selectedSection);if(si!==-1){ut.sections[si].questions=ut.sections[si].questions.filter(x=>x.id!==q.id);ut.updatedAt=new Date();onUpdateTest(ut);}setDeleteConfirmation(null);}})}}><Trash2 className="w-3 h-3"/></button>
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
    questionNumber: 1 as number | string,
    questionText: '',
    questionType: questionTypes[0],
    module: 'Module 1' as 'Module 1' | 'Module 2',
    options: ['', '', '', ''],
    correctAnswer: '',
    explanation: '',
    translationNote: '',
    scriptText: '',
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
    introImageFile: null as File | null,
    introImageUrl: '',
    introAudioFile: null as File | null,
    introAudioUrl: '',
    duration: 0,
    audioPlayDuration: 0,
    responseDelay: 0,
    stopDuration: 0,
    difficulty: '보통' as '쉬움' | '보통' | '어려움',
    blanks: [] as Array<{ answer: string; maxLength: number }>,
    // Build Sentence (문장 배열) fields
    avatar1ImageFile: null as File | null,
    avatar1ImageUrl: '',
    avatar2ImageFile: null as File | null,
    avatar2ImageUrl: '',
    words: '' as string, // space-separated words
    sentenceEnding: '.' as '.' | '?', // Period or question mark at end of sentence
    // Academic Discussion (두번째 라이팅 문제) fields
    professorImageFile: null as File | null,
    professorImageUrl: '',
    professorName: '',
    professorMessage: '',
    student1ImageFile: null as File | null,
    student1ImageUrl: '',
    student1Message: '',
    student2ImageFile: null as File | null,
    student2ImageUrl: '',
    student2Message: '',
  });

  // 업로드된 갤러리 이미지 (listening_images 테이블에서 로드)
  interface UploadedImage {
    id: string;
    url: string;
    category: string;
    label: string;
  }
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  useEffect(() => {
    const loadImages = async () => {
      try {
        const { data, error } = await supabaseClient.from('listening_images').select('*');
        if (!error && data) {
          setUploadedImages(data as UploadedImage[]);
        }
      } catch {}
    };
    loadImages();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const question: TPOQuestion = {
      id: `q-${Date.now()}`,
      questionNumber: formData.questionNumber,
      questionText: (formData.questionType === 'Complete Words' && !formData.questionText.trim())
        ? 'Fill in the missing letters in the blank.'
        : formData.questionText,
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
      interstitialTitle: (formData as any).interstitialTitle || undefined,
      passageTitle: (formData as any).passageTitle || undefined,
      emailScenario: (formData as any).emailScenario || undefined,
      emailInstruction: (formData as any).emailInstruction || undefined,
      emailBullets: (formData as any).emailBullets?.filter((b: string) => b.trim()) || undefined,
      emailSubject: (formData as any).emailSubject || undefined,
      emailTo: (formData as any).emailTo || undefined,
      translationNote: (formData as any).translationNote || undefined,
      scriptText: (formData as any).scriptText || undefined,
      analysisNote: (formData as any).analysisNote || undefined,
      vocabularyNote: (formData as any).vocabularyNote || undefined,
      duration: formData.duration || undefined,
      audioPlayDuration: formData.audioPlayDuration || undefined,
      responseDelay: formData.responseDelay || undefined,
      stopDuration: formData.stopDuration || undefined,
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

    // Handle introImageUrl (Speaking intro screen)
    if ((formData as any).introImageUrl?.trim() && !(formData as any).introImageFile) {
      (question as any).introImageUrl = (formData as any).introImageUrl.trim();
    } else if ((formData as any).introImageFile) {
      try {
        (question as any).introImageUrl = await uploadToStorage((formData as any).introImageFile, 'listening-images');
      } catch {
        (question as any).introImageUrl = URL.createObjectURL((formData as any).introImageFile);
      }
    }
    // Handle introAudioUrl (Speaking intro screen audio)
    if ((formData as any).introAudioUrl?.trim() && !(formData as any).introAudioFile) {
      (question as any).introAudioUrl = (formData as any).introAudioUrl.trim();
    } else if ((formData as any).introAudioFile) {
      try {
        (question as any).introAudioUrl = await uploadToStorage((formData as any).introAudioFile, 'listening-audio');
      } catch {
        (question as any).introAudioUrl = URL.createObjectURL((formData as any).introAudioFile);
      }
    }

    if (formData.videoUrl.trim()) {
      question.videoUrl = formData.videoUrl.trim();
    } else if (formData.videoFile) {
      try {
        question.videoUrl = await uploadToStorage(formData.videoFile, 'listening-video');
      } catch {
        question.videoUrl = '';
        alert('동영상 업로드에 실패했습니다. 다시 시도해주세요.');
        return;
      }
    }

    // Build Sentence: avatars + words
    if (formData.avatar1ImageUrl.trim()) {
      question.avatar1ImageUrl = formData.avatar1ImageUrl.trim();
    } else if (formData.avatar1ImageFile) {
      try {
        question.avatar1ImageUrl = await uploadToStorage(formData.avatar1ImageFile, 'writing-avatars');
      } catch {
        question.avatar1ImageUrl = URL.createObjectURL(formData.avatar1ImageFile);
      }
    }
    if (formData.avatar2ImageUrl.trim()) {
      question.avatar2ImageUrl = formData.avatar2ImageUrl.trim();
    } else if (formData.avatar2ImageFile) {
      try {
        question.avatar2ImageUrl = await uploadToStorage(formData.avatar2ImageFile, 'writing-avatars');
      } catch {
        question.avatar2ImageUrl = URL.createObjectURL(formData.avatar2ImageFile);
      }
    }
    if (formData.words.trim()) {
      question.words = formData.words.split(/[,]+/).map(w => w.trim()).filter(Boolean);
    }
    question.sentenceEnding = formData.sentenceEnding || '.';

    // Academic Discussion: professor + 2 students avatars + messages
    if (formData.professorImageUrl.trim()) {
      question.professorImageUrl = formData.professorImageUrl.trim();
    } else if (formData.professorImageFile) {
      try {
        question.professorImageUrl = await uploadToStorage(formData.professorImageFile, 'writing-avatars');
      } catch {
        question.professorImageUrl = URL.createObjectURL(formData.professorImageFile);
      }
    }
    if (formData.student1ImageUrl.trim()) {
      question.student1ImageUrl = formData.student1ImageUrl.trim();
    } else if (formData.student1ImageFile) {
      try {
        question.student1ImageUrl = await uploadToStorage(formData.student1ImageFile, 'writing-avatars');
      } catch {
        question.student1ImageUrl = URL.createObjectURL(formData.student1ImageFile);
      }
    }
    if (formData.student2ImageUrl.trim()) {
      question.student2ImageUrl = formData.student2ImageUrl.trim();
    } else if (formData.student2ImageFile) {
      try {
        question.student2ImageUrl = await uploadToStorage(formData.student2ImageFile, 'writing-avatars');
      } catch {
        question.student2ImageUrl = URL.createObjectURL(formData.student2ImageFile);
      }
    }
    if (formData.professorName.trim()) question.professorName = formData.professorName.trim();
    if (formData.professorMessage.trim()) question.professorMessage = formData.professorMessage.trim();
    if (formData.student1Message.trim()) question.student1Message = formData.student1Message.trim();
    if ((formData as any).student1Name?.trim()) question.student1Name = (formData as any).student1Name.trim();
    if (formData.student2Message.trim()) question.student2Message = formData.student2Message.trim();
    if ((formData as any).student2Name?.trim()) question.student2Name = (formData as any).student2Name.trim();

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
                  (빈칸넣기: 여러 문제를 묶어 "1-10", "11-20" 형식으로 입력)
                </span>
              )}
            </label>
            {formData.questionType === 'Complete Words' ? (
              <input
                type="text"
                placeholder="예: 1-10, 11-20"
                value={formData.questionNumber}
                onChange={(e) => setFormData({ ...formData, questionNumber: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2d7a7c] focus:border-transparent"
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

          {/* Difficulty — Training 연동용 (필수) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              난이도 (Training 연동)
            </label>
            <select
              value={formData.difficulty}
              onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as '쉬움' | '보통' | '어려움' })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2d7a7c] focus:border-transparent bg-white"
            >
              <option value="쉬움">쉬움</option>
              <option value="보통">보통</option>
              <option value="어려움">어려움</option>
            </select>
          </div>
        </div>

        {/* Module Selector — Reading, Listening */}
        {(section === 'Reading' || section === 'Listening') && (
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
        )}

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


        {/* Interstitial Title (for Listening - conversation/announcement/academic) */}
        {section === 'Listening' && (
          ['Short Conversation', 'Announcements', 'Academic Talk'].some(t =>
            (formData.questionType || '').includes(t)
          )
        ) && (
          <div className="bg-[#f0fafa] border border-[#2d7a7c]/20 rounded-xl p-4">
            <label className="block text-sm font-bold text-[#2d7a7c] mb-2">
              🎧 인트로 화면 상단 텍스트
              <span className="ml-2 text-xs text-gray-400 font-normal">(비워두면 기본값 사용)</span>
            </label>
            <input
              type="text"
              value={(formData as any).interstitialTitle || ''}
              onChange={(e) => setFormData({ ...formData, interstitialTitle: e.target.value } as any)}
              className="w-full px-4 py-2 border border-[#2d7a7c]/30 rounded-lg focus:ring-2 focus:ring-[#2d7a7c] focus:border-transparent text-sm"
              placeholder="예: Listen to a conversation. / Listen to an announcement."
            />
            <p className="text-xs text-gray-400 mt-1">기본값: conversation → "Listen to a conversation." / announcement → "Listen to an announcement in a classroom."</p>
          </div>
        )}


        {/* Interstitial Title (for Listening - conversation/announcement/academic) */}
        {section === 'Listening' && (
          ['Short Conversation', 'Announcements', 'Academic Talk'].some(t =>
            (formData.questionType || '').includes(t)
          )
        ) && (
          <div className="bg-[#f0fafa] border border-[#2d7a7c]/20 rounded-xl p-4">
            <label className="block text-sm font-bold text-[#2d7a7c] mb-2">
              🎧 인트로 화면 상단 텍스트
              <span className="ml-2 text-xs text-gray-400 font-normal">(비워두면 기본값 사용)</span>
            </label>
            <input
              type="text"
              value={(formData as any).interstitialTitle || ''}
              onChange={(e) => setFormData({ ...formData, interstitialTitle: e.target.value } as any)}
              className="w-full px-4 py-2 border border-[#2d7a7c]/30 rounded-lg focus:ring-2 focus:ring-[#2d7a7c] focus:border-transparent text-sm"
              placeholder="예: Listen to a conversation. / Listen to an announcement."
            />
            <p className="text-xs text-gray-400 mt-1">기본값: conversation → "Listen to a conversation." / announcement → "Listen to an announcement in a classroom."</p>
          </div>
        )}

        {/* Passage Text (for Reading) */}
        {section === 'Reading' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Passage Text
              {formData.questionType === 'Complete Words' && (
                <span className="ml-2 text-xs text-blue-600 font-normal">
                  (빈칸넣기: 빈칸 위치에 [정답] 형식으로 입력하세요. 예: mi[ght])
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
                  • 지문에서 빈칸으로 만들 부분을 [정답] 형식으로 표시하세요<br/>
                  • 예: "We mi[ght] think th[at] early humans performed dances..."<br/>
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
                  const blankRegex = /\[([a-zA-Z][a-zA-Z\s]*?)(?::(\d+))?\]/g;
                  const blanks: Array<{ answer: string; maxLength: number }> = [];
                  let match;
                  
                  while ((match = blankRegex.exec(e.target.value)) !== null) {
                    blanks.push({
                      answer: match[1].trim(),
                      maxLength: match[2] ? parseInt(match[2]) : match[1].trim().length
                    });
                  }
                  
                  setFormData(prev => ({ ...prev, blanks }));
                }
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2d7a7c] focus:border-transparent font-mono text-sm"
              rows={8}
              placeholder={formData.questionType === 'Complete Words' 
                ? "예시: We mi[ght] think th[at] early humans performed dances..."
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

        {/* Speaking 설정 — image upload + guidance */}
        {section === 'Speaking' && (
          <div className="border-2 border-dashed border-rose-300 rounded-xl p-4 bg-rose-50/30 space-y-3">
            <p className="text-sm font-bold text-rose-700 flex items-center gap-1.5">
              🎤 Speaking 설정
              <span className="text-xs font-normal text-gray-500">
                {(formData.questionType || '').includes('Repeat')
                  ? '— 1-7번 Listen & Repeat: 들려주고 따라 읽으면 녹음됩니다'
                  : '— 8-11번 Interview: 사진/음성/동영상 제시 후 답변 녹음'}
              </span>
            </p>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">📷 문제 이미지 (선택)</label>
              {formData.imageUrl && (
                <div className="mb-2 flex items-center gap-3 p-2 bg-white border border-rose-200 rounded-lg">
                  <img src={formData.imageUrl} alt="selected" className="w-16 h-16 object-cover rounded" />
                  <div className="flex-1 text-xs text-gray-600 truncate">{formData.imageUrl.split('/').pop()}</div>
                  <button type="button" onClick={() => setFormData({ ...formData, imageUrl: '', imageFile: null })}
                    className="text-red-400 hover:text-red-600 text-xs px-2 py-1 border border-red-200 rounded">제거</button>
                </div>
              )}
              <input type="file" accept="image/*" className="text-sm w-full"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) setFormData({ ...formData, imageFile: f, imageUrl: URL.createObjectURL(f) }); }}
              />
            </div>
            {/* Intro image + audio — Q1 (Listen & Repeat) and Q8 (Take an Interview) */}
            {((formData.questionType || '').includes('Listen and Repeat') || (formData.questionType || '').includes('Take an Interview')) && (
              <div className="border border-rose-200 rounded-lg p-3 space-y-3 bg-white">
                <p className="text-xs font-bold text-rose-600">🎬 인트로 화면 전용 (문제 화면과 다른 이미지·음성)</p>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">🖼️ 인트로 이미지</label>
                  {(formData as any).introImageUrl && (
                    <div className="mb-2 flex items-center gap-3 p-2 bg-rose-50 border border-rose-200 rounded-lg">
                      <img src={(formData as any).introImageUrl} alt="intro" className="w-14 h-14 object-cover rounded" />
                      <div className="flex-1 text-xs text-gray-600 truncate">{((formData as any).introImageUrl || '').split('/').pop()}</div>
                      <button type="button" onClick={() => setFormData({ ...formData, introImageUrl: '', introImageFile: null } as any)}
                        className="text-red-400 hover:text-red-600 text-xs px-2 py-1 border border-red-200 rounded">제거</button>
                    </div>
                  )}
                  <input type="file" accept="image/*" className="text-sm w-full"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) setFormData({ ...formData, introImageFile: f, introImageUrl: URL.createObjectURL(f) } as any); }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">🔊 인트로 오디오 (TTS 대체)</label>
                  {(formData as any).introAudioUrl && (
                    <div className="mb-2 flex items-center gap-3 p-2 bg-rose-50 border border-rose-200 rounded-lg">
                      <audio controls src={(formData as any).introAudioUrl} className="h-8 flex-1" />
                      <button type="button" onClick={() => setFormData({ ...formData, introAudioUrl: '', introAudioFile: null } as any)}
                        className="text-red-400 hover:text-red-600 text-xs px-2 py-1 border border-red-200 rounded">제거</button>
                    </div>
                  )}
                  <input type="file" accept="audio/*" className="text-sm w-full"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) setFormData({ ...formData, introAudioFile: f, introAudioUrl: URL.createObjectURL(f) } as any); }}
                  />
                </div>
              </div>
            )}
            <div className="text-xs text-gray-500 bg-white rounded-lg p-2.5 border border-rose-100">
              💡 <strong>음성</strong>은 아래 <strong>Audio File</strong>, <strong>동영상</strong>은 <strong>Video File</strong>에 업로드하세요. 학생은 듣거나 본 뒤 마이크로 답변을 녹음합니다.
            </div>
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

        {/* Video Upload — Reading 제외 */}
        {section !== 'Reading' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Video File (Optional)</label>
            <input
              type="file"
              accept="video/*"
              onChange={(e) => setFormData({ ...formData, videoFile: e.target.files?.[0] || null })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2d7a7c] focus:border-transparent"
            />
          </div>
        )}

        {/* Image Upload for Reading questions */}
        {section === 'Reading' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Image File (Optional)
              <span className="ml-2 text-xs text-gray-400 font-normal">(지문 옆에 표시되는 이미지)</span>
            </label>
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
            <input
              type="text"
              value={formData.imageUrl}
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#2d7a7c] mb-2"
              placeholder="이미지 URL을 직접 입력하거나 아래에서 업로드..."
            />
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
              <span className="text-xs text-gray-400">이미지 파일을 업로드하세요</span>
            </div>
          </div>
        )}

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
              {(() => {
                const baseGallery = [
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
                ];
                return baseGallery.map(({ category, images }) => {
                  const mergedImages = [
                    ...images,
                    ...uploadedImages
                      .filter(img => img.category === category)
                      .map(img => ({ url: img.url, label: img.label }))
                  ];
                  return (
                    <div key={category}>
                      <p className="text-[10px] font-semibold text-gray-500 mb-1.5 flex items-center gap-2">
                        {category}
                        <label className="cursor-pointer px-2 py-1 bg-[#2d7a7c] text-white text-[9px] rounded hover:bg-[#1e6b73]">
                          + 추가
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleUploadGalleryImage(category, file);
                          }} />
                        </label>
                      </p>
                      <div className="flex gap-2 flex-wrap p-2 bg-gray-50 border border-gray-200 rounded-lg">
                        {mergedImages.map((img, idx) => (
                          <button key={`${img.url}-${idx}`} type="button"
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
                              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                            />
                            <span className="text-[9px] text-gray-500 pb-0.5">{img.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                });
              })()}
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

        {/* Speaking phase timing */}
        {section === 'Speaking' && (
          <div className="border-2 border-dashed border-[#2d7a7c]/30 rounded-xl p-4 bg-[#f0fafa]/40">
            <p className="text-sm font-bold text-[#2d7a7c] mb-3 flex items-center gap-1.5">
              ⏱️ Speaking 화면 전환 타이밍
              <span className="text-xs font-normal text-gray-500">— 0이면 기본값 사용</span>
            </p>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">오디오 재생 시간 (초)</label>
                <input
                  type="number" min="0" step="0.5"
                  value={formData.audioPlayDuration || ''}
                  onChange={(e) => setFormData({ ...formData, audioPlayDuration: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#2d7a7c] focus:border-transparent"
                  placeholder="기본 5초"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">녹음 시작 딜레이 (초)</label>
                <input
                  type="number" min="0" step="0.5"
                  value={formData.responseDelay || ''}
                  onChange={(e) => setFormData({ ...formData, responseDelay: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#2d7a7c] focus:border-transparent"
                  placeholder="기본 3초"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Stop 오버레이 시간 (초)</label>
                <input
                  type="number" min="0" step="0.5"
                  value={formData.stopDuration || ''}
                  onChange={(e) => setFormData({ ...formData, stopDuration: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#2d7a7c] focus:border-transparent"
                  placeholder="기본 2.5초"
                />
              </div>
            </div>
          </div>
        )}

        {/* Build Sentence (문장 배열) — Writing only */}
        {section === 'Writing' && (
          <div className="border-2 border-dashed border-[#2d7a7c]/30 rounded-xl p-4 bg-[#f0fafa]/40">
            <p className="text-sm font-bold text-[#2d7a7c] mb-3 flex items-center gap-1.5">
              ✏️ Build Sentence (문장 배열) 설정
              <span className="text-xs font-normal text-gray-500">— 두 사람의 대화로 구성되는 문장 배열 문제용</span>
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              {/* Avatar 1 — Question Person */}
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <label className="block text-xs font-semibold text-gray-600 mb-2">
                  👤 질문자 (Avatar 1) — 위쪽 원
                </label>
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#1e6b73] flex-shrink-0 bg-gray-100">
                    {formData.avatar1ImageUrl ? (
                      <img src={formData.avatar1ImageUrl} alt="avatar1 preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">없음</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    {/* 기본 아바타 갤러리 */}
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {DEFAULT_AVATARS.map((av) => (
                        <button
                          key={av.url}
                          type="button"
                          title={av.label}
                          onClick={() => setFormData({ ...formData, avatar1ImageFile: null, avatar1ImageUrl: av.url })}
                          className={`w-9 h-9 rounded-full overflow-hidden border-2 transition-all ${formData.avatar1ImageUrl === av.url ? 'border-[#1e6b73] ring-2 ring-[#1e6b73]/30' : 'border-gray-200 hover:border-[#1e6b73]'}`}
                        >
                          <img src={av.url} alt={av.label} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setFormData({ ...formData, avatar1ImageFile: file, avatar1ImageUrl: URL.createObjectURL(file) });
                        }
                      }}
                      className="text-xs w-full"
                    />
                    {formData.avatar1ImageUrl && (
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, avatar1ImageFile: null, avatar1ImageUrl: '' })}
                        className="text-xs text-red-500 mt-1 hover:underline"
                      >
                        제거
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Avatar 2 — Answer Person */}
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <label className="block text-xs font-semibold text-gray-600 mb-2">
                  👤 답변자 (Avatar 2) — 아래쪽 원
                </label>
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#1e6b73] flex-shrink-0 bg-gray-100">
                    {formData.avatar2ImageUrl ? (
                      <img src={formData.avatar2ImageUrl} alt="avatar2 preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">없음</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    {/* 기본 아바타 갤러리 */}
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {DEFAULT_AVATARS.map((av) => (
                        <button
                          key={av.url}
                          type="button"
                          title={av.label}
                          onClick={() => setFormData({ ...formData, avatar2ImageFile: null, avatar2ImageUrl: av.url })}
                          className={`w-9 h-9 rounded-full overflow-hidden border-2 transition-all ${formData.avatar2ImageUrl === av.url ? 'border-[#1e6b73] ring-2 ring-[#1e6b73]/30' : 'border-gray-200 hover:border-[#1e6b73]'}`}
                        >
                          <img src={av.url} alt={av.label} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setFormData({ ...formData, avatar2ImageFile: file, avatar2ImageUrl: URL.createObjectURL(file) });
                        }
                      }}
                      className="text-xs w-full"
                    />
                    {formData.avatar2ImageUrl && (
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, avatar2ImageFile: null, avatar2ImageUrl: '' })}
                        className="text-xs text-red-500 mt-1 hover:underline"
                      >
                        제거
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Words to arrange */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                🔤 단어 목록 (쉼표로 구분 — 학생이 배열할 단어)
              </label>
              <input
                type="text"
                value={formData.words}
                onChange={(e) => setFormData({ ...formData, words: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#2d7a7c]"
                placeholder="예: did, flight, you, yet"
              />
              <p className="text-xs text-gray-400 mt-1">
                💡 문장 중간에 미리 채워진 단어는 <code className="bg-gray-100 px-1 rounded">[단어]</code>로 감싸세요. 예: <code className="bg-gray-100 px-1 rounded">did, you, [book your], flight, yet</code>
              </p>
              {formData.words && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {formData.words.split(/[,]+/).map(w => w.trim()).filter(Boolean).map((w, i) => (
                    <span key={i} className="px-2 py-0.5 rounded-md bg-[#2d7a7c]/10 text-[#2d7a7c] text-xs font-medium">
                      {w}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Sentence Ending */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2">
                🔚 문장 끝 부호 (문제에 표시된 마침표/물음표 선택)
              </label>
              <div className="flex gap-3">
                {(['.', '?'] as const).map(ending => (
                  <button
                    key={ending}
                    type="button"
                    onClick={() => setFormData({ ...formData, sentenceEnding: ending })}
                    className={`flex-1 py-2.5 rounded-lg border-2 text-lg font-bold transition-all ${
                      formData.sentenceEnding === ending
                        ? 'border-[#2d7a7c] bg-[#2d7a7c] text-white'
                        : 'border-gray-300 bg-white text-gray-600 hover:border-[#2d7a7c]'
                    }`}
                  >
                    {ending === '.' ? '마침표 (.)' : '물음표 (?)'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Write an Email (첫번째 라이팅 문제) — Writing only */}
        {section === 'Writing' && formData.questionType === 'Write an Email' && (
          <div className="border-2 border-dashed border-blue-300 rounded-xl p-4 bg-blue-50/40">
            <p className="text-sm font-bold text-blue-700 mb-3 flex items-center gap-1.5">
              ✉️ Write an Email 설정
              <span className="text-xs font-normal text-gray-500">— 이메일 작성 문제 편집</span>
            </p>

            {/* Scenario */}
            <div className="mb-3">
              <label className="block text-xs font-semibold text-gray-600 mb-1">상황 설명 (첫 단락)</label>
              <textarea
                rows={3}
                value={(formData as any).emailScenario || ''}
                onChange={(e) => setFormData({ ...formData, emailScenario: e.target.value } as any)}
                placeholder="예: A new poetry magazine has asked its readers for submissions..."
                className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent resize-none"
              />
            </div>

            {/* Instruction */}
            <div className="mb-3">
              <label className="block text-xs font-semibold text-gray-600 mb-1">지시문 (Write an email to...)</label>
              <input
                type="text"
                value={(formData as any).emailInstruction || ''}
                onChange={(e) => setFormData({ ...formData, emailInstruction: e.target.value } as any)}
                placeholder="예: Write an email to the editor of the magazine. In your email, do the following."
                className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent"
              />
            </div>

            {/* Bullet points */}
            <div className="mb-3">
              <label className="block text-xs font-semibold text-gray-600 mb-1">지시 사항 (한 줄씩, 최대 4개)</label>
              {[0,1,2,3].map(i => (
                <input
                  key={i}
                  type="text"
                  value={((formData as any).emailBullets || [])[i] || ''}
                  onChange={(e) => {
                    const bullets = [...(((formData as any).emailBullets) || ['','','',''])];
                    bullets[i] = e.target.value;
                    setFormData({ ...formData, emailBullets: bullets } as any);
                  }}
                  placeholder={`지시 사항 ${i+1}`}
                  className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent mb-2"
                />
              ))}
            </div>

            {/* To / Subject */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">To (수신자 이메일)</label>
                <input
                  type="text"
                  value={(formData as any).emailTo || ''}
                  onChange={(e) => setFormData({ ...formData, emailTo: e.target.value } as any)}
                  placeholder="예: editor@magazine.com"
                  className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Subject (제목)</label>
                <input
                  type="text"
                  value={(formData as any).emailSubject || ''}
                  onChange={(e) => setFormData({ ...formData, emailSubject: e.target.value } as any)}
                  placeholder="예: Problem using submission form"
                  className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        )}

        {/* Academic Discussion (두번째 라이팅 문제) — Writing only */}
        {section === 'Writing' && (
          <div className="border-2 border-dashed border-purple-300 rounded-xl p-4 bg-purple-50/40">
            <p className="text-sm font-bold text-purple-700 mb-3 flex items-center gap-1.5">
              🎓 Academic Discussion 설정
              <span className="text-xs font-normal text-gray-500">— 교수님 1명 + 학생 2명의 토론 응답 문제용</span>
            </p>

            {/* Professor row */}
            <div className="bg-white rounded-lg p-3 border border-purple-200 mb-3">
              <p className="text-xs font-semibold text-purple-700 mb-2">🧑‍🏫 교수님 (가운데 원)</p>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 flex flex-col items-center gap-1">
                  <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-[#1e6b73] bg-gray-100">
                    {formData.professorImageUrl ? (
                      <img src={formData.professorImageUrl} alt="professor preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">없음</div>
                    )}
                  </div>
                  {/* 기본 아바타 갤러리 */}
                  <div className="flex flex-wrap gap-1 mt-1 mb-1">
                    {DEFAULT_AVATARS.map((av) => (
                      <button key={av.url} type="button" title={av.label}
                        onClick={() => setFormData({ ...formData, professorImageFile: null, professorImageUrl: av.url })}
                        className={`w-7 h-7 rounded-full overflow-hidden border-2 transition-all ${formData.professorImageUrl === av.url ? 'border-[#1e6b73]' : 'border-gray-200 hover:border-[#1e6b73]'}`}>
                        <img src={av.url} alt={av.label} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                                    <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setFormData({ ...formData, professorImageFile: file, professorImageUrl: URL.createObjectURL(file) });
                      }
                    }}
                    className="text-[10px] w-20"
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <input
                    type="text"
                    value={formData.professorName}
                    onChange={(e) => setFormData({ ...formData, professorName: e.target.value })}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-400"
                    placeholder="교수님 이름 (예: Dr. Achebe)"
                  />
                  <textarea
                    value={formData.professorMessage}
                    onChange={(e) => setFormData({ ...formData, professorMessage: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-400"
                    rows={3}
                    placeholder="교수님의 토론 주제·질문 (예: Volunteerism refers to the act of...)"
                  />
                </div>
              </div>
            </div>

            {/* Two students */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Student 1 */}
              <div className="bg-white rounded-lg p-3 border border-purple-200">
                <p className="text-xs font-semibold text-purple-700 mb-2">👩‍🎓 학생 1 (찬성·찬반 입장 응답 1)</p>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 flex flex-col items-center gap-1">
                    <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-[#c9b99b] bg-gray-100">
                      {formData.student1ImageUrl ? (
                        <img src={formData.student1ImageUrl} alt="student1" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">없음</div>
                      )}
                    </div>
                    {/* 기본 아바타 갤러리 */}
                    <div className="flex flex-wrap gap-1 mt-1 mb-1">
                      {DEFAULT_AVATARS.map((av) => (
                        <button key={av.url} type="button" title={av.label}
                          onClick={() => setFormData({ ...formData, student1ImageFile: null, student1ImageUrl: av.url })}
                          className={`w-6 h-6 rounded-full overflow-hidden border-2 transition-all ${formData.student1ImageUrl === av.url ? 'border-[#1e6b73]' : 'border-gray-200 hover:border-[#1e6b73]'}`}>
                          <img src={av.url} alt={av.label} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                                        <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setFormData({ ...formData, student1ImageFile: file, student1ImageUrl: URL.createObjectURL(file) });
                        }
                      }}
                      className="text-[10px] w-14"
                    />
                  </div>
                  <div className="flex-1 flex flex-col gap-1.5">
                    <input
                      type="text"
                      value={(formData as any).student1Name || ''}
                      onChange={(e) => setFormData({ ...formData, student1Name: e.target.value } as any)}
                      className="w-full px-2 py-1 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-purple-400"
                      placeholder="학생 1 이름 (예: Paul N)"
                    />
                    <textarea
                      value={formData.student1Message}
                      onChange={(e) => setFormData({ ...formData, student1Message: e.target.value })}
                      className="flex-1 px-2 py-1.5 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-purple-400"
                      rows={4}
                      placeholder="학생 1의 응답..."
                    />
                  </div>
                </div>
              </div>

              {/* Student 2 */}
              <div className="bg-white rounded-lg p-3 border border-purple-200">
                <p className="text-xs font-semibold text-purple-700 mb-2">🧑‍🎓 학생 2 (반대·반대 입장 응답 2)</p>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 flex flex-col items-center gap-1">
                    <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-[#c9b99b] bg-gray-100">
                      {formData.student2ImageUrl ? (
                        <img src={formData.student2ImageUrl} alt="student2" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">없음</div>
                      )}
                    </div>
                    {/* 기본 아바타 갤러리 */}
                    <div className="flex flex-wrap gap-1 mt-1 mb-1">
                      {DEFAULT_AVATARS.map((av) => (
                        <button key={av.url} type="button" title={av.label}
                          onClick={() => setFormData({ ...formData, student2ImageFile: null, student2ImageUrl: av.url })}
                          className={`w-6 h-6 rounded-full overflow-hidden border-2 transition-all ${formData.student2ImageUrl === av.url ? 'border-[#1e6b73]' : 'border-gray-200 hover:border-[#1e6b73]'}`}>
                          <img src={av.url} alt={av.label} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                                        <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setFormData({ ...formData, student2ImageFile: file, student2ImageUrl: URL.createObjectURL(file) });
                        }
                      }}
                      className="text-[10px] w-14"
                    />
                  </div>
                  <div className="flex-1 flex flex-col gap-1.5">
                    <input
                      type="text"
                      value={(formData as any).student2Name || ''}
                      onChange={(e) => setFormData({ ...formData, student2Name: e.target.value } as any)}
                      className="w-full px-2 py-1 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-purple-400"
                      placeholder="학생 2 이름 (예: Lena A)"
                    />
                    <textarea
                      value={formData.student2Message}
                      onChange={(e) => setFormData({ ...formData, student2Message: e.target.value })}
                      className="flex-1 px-2 py-1.5 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-purple-400"
                      rows={4}
                      placeholder="학생 2의 응답..."
                    />
                  </div>
                </div>
              </div>
            </div>
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

        {/* Listening Script — used by the Review Script tab. Other AI review
            fields (Translation/Analysis/Key Words) were removed as unused. */}
        {section === 'Listening' && (
          <div className="border-t border-gray-200 pt-4 space-y-3">
            <p className="text-xs font-bold text-[#2d7a7c] uppercase tracking-wide flex items-center gap-1">
              ✨ Script
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Script <span className="text-xs text-gray-400 font-normal">(리스닝 스크립트 — Review의 Script 탭에 표시)</span>
              </label>
              <textarea
                value={(formData as any).scriptText || ''}
                onChange={(e) => setFormData({ ...formData, scriptText: e.target.value } as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2d7a7c] text-sm"
                rows={3}
                placeholder="리스닝 오디오의 스크립트(대본)를 입력하세요..."
              />
            </div>
          </div>
        )}

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
    interstitialTitle: question.interstitialTitle || '',
    emailScenario: question.emailScenario || '',
    emailInstruction: question.emailInstruction || '',
    emailBullets: question.emailBullets || ['', '', '', ''],
    emailSubject: question.emailSubject || '',
    emailTo: question.emailTo || '',
    translationNote: question.translationNote || '',
    scriptText: (question as any).scriptText || '',
    analysisNote: (question as any).analysisNote || '',
    vocabularyNote: question.vocabularyNote || '',
    colorTheme: (() => {
      try { return JSON.parse(question.passageText || '').color || 'teal'; } catch { return 'teal'; }
    })() as string,
    audioFile: null as File | null,
    videoFile: null as File | null,
    imageFile: null as File | null,
    imageUrl: question.imageUrl || '',
    introImageFile: null as File | null,
    introImageUrl: (question as any).introImageUrl || '',
    introAudioFile: null as File | null,
    introAudioUrl: (question as any).introAudioUrl || '',
    audioUrl: question.audioUrl || '',
    duration: question.duration || 0,
    audioPlayDuration: (question as any).audioPlayDuration || 0,
    responseDelay: (question as any).responseDelay || 0,
    stopDuration: (question as any).stopDuration || 0,
    difficulty: question.difficulty || '보통' as '쉬움' | '보통' | '어려움',
    blanks: question.blanks || [] as Array<{ answer: string; maxLength: number }>,
    words: Array.isArray((question as any).words) ? (question as any).words.join(', ') : '',
    sentenceEnding: ((question as any).sentenceEnding || '.') as '.' | '?',
    professorName: (question as any).professorName || '',
    professorMessage: (question as any).professorMessage || '',
    professorImageUrl: (question as any).professorImageUrl || '',
    professorImageFile: null,
    student1Name: (question as any).student1Name || '',
    student1Message: (question as any).student1Message || '',
    student1ImageUrl: (question as any).student1ImageUrl || '',
    student1ImageFile: null,
    student2Name: (question as any).student2Name || '',
    student2Message: (question as any).student2Message || '',
    student2ImageUrl: (question as any).student2ImageUrl || '',
    student2ImageFile: null,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const updatedQuestion: TPOQuestion = {
      id: question.id,
      questionNumber: formData.questionNumber,
      questionText: (formData.questionType === 'Complete Words' && !formData.questionText.trim())
        ? 'Fill in the missing letters in the blank.'
        : formData.questionText,
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
      interstitialTitle: (formData as any).interstitialTitle || undefined,
      passageTitle: (formData as any).passageTitle || undefined,
      emailScenario: (formData as any).emailScenario || undefined,
      emailInstruction: (formData as any).emailInstruction || undefined,
      emailBullets: (formData as any).emailBullets?.filter((b: string) => b.trim()) || undefined,
      emailSubject: (formData as any).emailSubject || undefined,
      emailTo: (formData as any).emailTo || undefined,
      professorName: (formData as any).professorName || undefined,
      professorMessage: (formData as any).professorMessage || undefined,
      professorImageUrl: (formData as any).professorImageUrl || undefined,
      student1Name: (formData as any).student1Name || undefined,
      student1Message: (formData as any).student1Message || undefined,
      student1ImageUrl: (formData as any).student1ImageUrl || undefined,
      student2Name: (formData as any).student2Name || undefined,
      student2Message: (formData as any).student2Message || undefined,
      student2ImageUrl: (formData as any).student2ImageUrl || undefined,
      translationNote: (formData as any).translationNote || undefined,
      scriptText: (formData as any).scriptText || undefined,
      analysisNote: (formData as any).analysisNote || undefined,
      vocabularyNote: (formData as any).vocabularyNote || undefined,
      duration: formData.duration || undefined,
      audioPlayDuration: (formData as any).audioPlayDuration || undefined,
      responseDelay: (formData as any).responseDelay || undefined,
      stopDuration: (formData as any).stopDuration || undefined,
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
    if ((formData as any).introImageFile) {
      try { (updatedQuestion as any).introImageUrl = await uploadToStorage((formData as any).introImageFile, 'listening-images'); }
      catch { (updatedQuestion as any).introImageUrl = URL.createObjectURL((formData as any).introImageFile); }
    } else if ((formData as any).introImageUrl?.trim()) {
      (updatedQuestion as any).introImageUrl = (formData as any).introImageUrl.trim();
    }
    if ((formData as any).introAudioFile) {
      try { (updatedQuestion as any).introAudioUrl = await uploadToStorage((formData as any).introAudioFile, 'listening-audio'); }
      catch { (updatedQuestion as any).introAudioUrl = URL.createObjectURL((formData as any).introAudioFile); }
    } else if ((formData as any).introAudioUrl?.trim()) {
      (updatedQuestion as any).introAudioUrl = (formData as any).introAudioUrl.trim();
    }
    if (formData.videoFile) {
      try {
        updatedQuestion.videoUrl = await uploadToStorage(formData.videoFile, 'listening-video');
      } catch {
        alert('동영상 업로드에 실패했습니다. 다시 시도해주세요.');
        return;
      }
    }
    // Build Sentence words + sentenceEnding
    if ((formData as any).words?.trim()) {
      updatedQuestion.words = (formData as any).words.split(/[,]+/).map((w: string) => w.trim()).filter(Boolean);
    }
    updatedQuestion.sentenceEnding = (formData as any).sentenceEnding || '.';

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
                  (빈칸넣기: 여러 문제를 묶어 "1-10", "11-20" 형식으로 입력)
                </span>
              )}
            </label>
            {formData.questionType === 'Complete Words' ? (
              <input
                type="text"
                placeholder="예: 1-10, 11-20"
                value={formData.questionNumber}
                onChange={(e) => setFormData({ ...formData, questionNumber: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2d7a7c] focus:border-transparent"
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

          {/* Difficulty — Training 연동용 (필수) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              난이도 (Training 연동)
            </label>
            <select
              value={formData.difficulty}
              onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as '쉬움' | '보통' | '어려움' })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2d7a7c] focus:border-transparent bg-white"
            >
              <option value="쉬움">쉬움</option>
              <option value="보통">보통</option>
              <option value="어려움">어려움</option>
            </select>
          </div>
        </div>

        {/* Module Selector — Reading, Listening */}
        {(section === 'Reading' || section === 'Listening') && (
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
        )}

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
                  (빈칸넣기: 빈칸 위치에 [정답] 형식으로 입력하세요. 예: mi[ght])
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
                  • 지문에서 빈칸으로 만들 부분을 [정답] 형식으로 표시하세요<br/>
                  • 예: "We mi[ght] think th[at] early humans performed dances..."<br/>
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
                  const blankRegex = /\[([a-zA-Z][a-zA-Z\s]*?)(?::(\d+))?\]/g;
                  const blanks: Array<{ answer: string; maxLength: number }> = [];
                  let match;
                  
                  while ((match = blankRegex.exec(e.target.value)) !== null) {
                    blanks.push({
                      answer: match[1].trim(),
                      maxLength: match[2] ? parseInt(match[2]) : match[1].trim().length
                    });
                  }
                  
                  setFormData(prev => ({ ...prev, blanks }));
                }
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2d7a7c] focus:border-transparent font-mono text-sm"
              rows={8}
              placeholder={formData.questionType === 'Complete Words' 
                ? "예시: We mi[ght] think th[at] early humans performed dances..."
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

        {/* Speaking 설정 — edit form */}
        {section === 'Speaking' && (
          <div className="border-2 border-dashed border-rose-200 rounded-xl p-4 space-y-3 bg-rose-50/30">
            <p className="text-sm font-bold text-rose-700 flex items-center gap-1.5">
              🎤 Speaking 설정
              <span className="text-xs font-normal text-gray-500">— 1-7번 Listen &amp; Repeat: 들려주고 따라 읽으면 녹음됩니다</span>
            </p>
            {/* 문제 이미지 */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">📷 문제 이미지 (선택)</label>
              {(formData as any).imageUrl && (
                <div className="mb-2 flex items-center gap-3 p-2 bg-white border border-rose-200 rounded-lg">
                  <img src={(formData as any).imageUrl} alt="question" className="w-14 h-14 object-cover rounded" />
                  <div className="flex-1 text-xs text-gray-600 truncate">{((formData as any).imageUrl || '').split('/').pop()}</div>
                  <button type="button" onClick={() => setFormData({ ...formData, imageUrl: '', imageFile: null } as any)}
                    className="text-red-400 hover:text-red-600 text-xs px-2 py-1 border border-red-200 rounded">제거</button>
                </div>
              )}
              <input type="file" accept="image/*" className="text-sm w-full"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) setFormData({ ...formData, imageFile: f, imageUrl: URL.createObjectURL(f) } as any); }}
              />
            </div>
            {/* 인트로 전용 (Listen and Repeat / Take an Interview) */}
            {((formData.questionType || '').includes('Listen and Repeat') || (formData.questionType || '').includes('Take an Interview')) && (
              <div className="border border-rose-200 rounded-lg p-3 space-y-3 bg-white">
                <p className="text-xs font-bold text-rose-600">🎬 인트로 화면 전용 (문제 화면과 다른 이미지·음성)</p>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">🖼️ 인트로 이미지</label>
                  {(formData as any).introImageUrl && (
                    <div className="mb-2 flex items-center gap-3 p-2 bg-rose-50 border border-rose-200 rounded-lg">
                      <img src={(formData as any).introImageUrl} alt="intro" className="w-14 h-14 object-cover rounded" />
                      <div className="flex-1 text-xs text-gray-600 truncate">{((formData as any).introImageUrl || '').split('/').pop()}</div>
                      <button type="button" onClick={() => setFormData({ ...formData, introImageUrl: '', introImageFile: null } as any)}
                        className="text-red-400 hover:text-red-600 text-xs px-2 py-1 border border-red-200 rounded">제거</button>
                    </div>
                  )}
                  <input type="file" accept="image/*" className="text-sm w-full"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) setFormData({ ...formData, introImageFile: f, introImageUrl: URL.createObjectURL(f) } as any); }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">🔊 인트로 오디오 (TTS 대체)</label>
                  {(formData as any).introAudioUrl && (
                    <div className="mb-2 flex items-center gap-3 p-2 bg-rose-50 border border-rose-200 rounded-lg">
                      <audio controls src={(formData as any).introAudioUrl} className="h-8 flex-1" />
                      <button type="button" onClick={() => setFormData({ ...formData, introAudioUrl: '', introAudioFile: null } as any)}
                        className="text-red-400 hover:text-red-600 text-xs px-2 py-1 border border-red-200 rounded">제거</button>
                    </div>
                  )}
                  <input type="file" accept="audio/*" className="text-sm w-full"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) setFormData({ ...formData, introAudioFile: f, introAudioUrl: URL.createObjectURL(f) } as any); }}
                  />
                </div>
              </div>
            )}
            <div className="text-xs text-gray-500 bg-white rounded-lg p-2.5 border border-rose-100">
              💡 <strong>음성</strong>은 아래 <strong>Audio File</strong>, <strong>동영상</strong>은 <strong>Video File</strong>에 업로드하세요.
            </div>
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

        {/* Video Upload — Reading 제외 */}
        {section !== 'Reading' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Video File (Optional)</label>
            <input
              type="file"
              accept="video/*"
              onChange={(e) => setFormData({ ...formData, videoFile: e.target.files?.[0] || null })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2d7a7c] focus:border-transparent"
            />
          </div>
        )}

        {/* Image Upload for Reading questions (Edit form) */}
        {section === 'Reading' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Image File (Optional)
              <span className="ml-2 text-xs text-gray-400 font-normal">(지문 옆에 표시되는 이미지)</span>
            </label>
            {(formData as any).imageUrl && (
              <div className="mb-3 flex items-center gap-3 p-2 bg-green-50 border border-green-200 rounded-lg">
                <img src={(formData as any).imageUrl} alt="selected" className="w-16 h-16 object-cover rounded" />
                <div className="flex-1 text-xs text-green-700 truncate">{((formData as any).imageUrl || '').split('/').pop()}</div>
                <button type="button" onClick={() => setFormData({ ...formData, imageUrl: '' } as any)}
                  className="text-red-400 hover:text-red-600 text-xs px-2 py-1 border border-red-200 rounded">제거</button>
              </div>
            )}
            <input
              type="text"
              value={(formData as any).imageUrl || ''}
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value } as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#2d7a7c] mb-2"
              placeholder="이미지 URL을 직접 입력하거나 아래에서 업로드..."
            />
            <div className="flex items-center gap-2 mb-3">
              <label className="cursor-pointer px-3 py-2 bg-[#2d7a7c] text-white text-xs font-semibold rounded-lg hover:bg-[#1e6b73] transition-colors">
                📁 파일 업로드
                <input type="file" accept="image/*" className="hidden"
                  onChange={(e) => { const file = e.target.files?.[0]; if (file) { setFormData({ ...formData, imageFile: file, imageUrl: URL.createObjectURL(file) } as any); } }}
                />
              </label>
              <span className="text-xs text-gray-400">이미지 파일을 업로드하세요</span>
            </div>
          </div>
        )}

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

        {/* Build a Sentence fields — Writing only */}
        {section === 'Writing' && formData.questionType === 'Build a Sentence' && (
          <div className="border-2 border-dashed border-[#2d7a7c]/40 rounded-xl p-4 bg-[#f0fafa] space-y-4">
            <p className="text-sm font-bold text-[#2d7a7c]">✏️ Build Sentence (문장 배열) 설정
              <span className="text-xs font-normal text-gray-500 ml-1">— 두 사람의 대화로 구성되는 문장 배열 문제용</span>
            </p>

            {/* Avatar selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Avatar 1 */}
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <label className="block text-xs font-semibold text-gray-600 mb-2">👤 질문자 (Avatar 1) — 위쪽 원</label>
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#1e6b73] flex-shrink-0 bg-gray-100">
                    {formData.avatar1ImageUrl
                      ? <img src={formData.avatar1ImageUrl} alt="avatar1" className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">없음</div>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {DEFAULT_AVATARS.map((av) => (
                        <button key={av.url} type="button" title={av.label}
                          onClick={() => setFormData({ ...formData, avatar1ImageFile: null, avatar1ImageUrl: av.url })}
                          className={`w-9 h-9 rounded-full overflow-hidden border-2 transition-all ${formData.avatar1ImageUrl === av.url ? 'border-[#1e6b73] ring-2 ring-[#1e6b73]/30' : 'border-gray-200 hover:border-[#1e6b73]'}`}>
                          <img src={av.url} alt={av.label} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                    <input type="file" accept="image/*" className="text-xs w-full"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) setFormData({ ...formData, avatar1ImageFile: f, avatar1ImageUrl: URL.createObjectURL(f) }); }}
                    />
                    {formData.avatar1ImageUrl && (
                      <button type="button" onClick={() => setFormData({ ...formData, avatar1ImageFile: null, avatar1ImageUrl: '' })} className="text-xs text-red-500 mt-1 hover:underline">제거</button>
                    )}
                  </div>
                </div>
              </div>

              {/* Avatar 2 */}
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <label className="block text-xs font-semibold text-gray-600 mb-2">👤 답변자 (Avatar 2) — 아래쪽 원</label>
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#1e6b73] flex-shrink-0 bg-gray-100">
                    {formData.avatar2ImageUrl
                      ? <img src={formData.avatar2ImageUrl} alt="avatar2" className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">없음</div>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {DEFAULT_AVATARS.map((av) => (
                        <button key={av.url} type="button" title={av.label}
                          onClick={() => setFormData({ ...formData, avatar2ImageFile: null, avatar2ImageUrl: av.url })}
                          className={`w-9 h-9 rounded-full overflow-hidden border-2 transition-all ${formData.avatar2ImageUrl === av.url ? 'border-[#1e6b73] ring-2 ring-[#1e6b73]/30' : 'border-gray-200 hover:border-[#1e6b73]'}`}>
                          <img src={av.url} alt={av.label} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                    <input type="file" accept="image/*" className="text-xs w-full"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) setFormData({ ...formData, avatar2ImageFile: f, avatar2ImageUrl: URL.createObjectURL(f) }); }}
                    />
                    {formData.avatar2ImageUrl && (
                      <button type="button" onClick={() => setFormData({ ...formData, avatar2ImageFile: null, avatar2ImageUrl: '' })} className="text-xs text-red-500 mt-1 hover:underline">제거</button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Words */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">단어 목록 (쉼표로 구분)</label>
              <input type="text"
                value={(formData as any).words || ''}
                onChange={(e) => setFormData({ ...formData, words: e.target.value } as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#2d7a7c]"
                placeholder="예: did, you, [book your], flight, yet"
              />
              <p className="text-xs text-gray-400 mt-1">
                💡 미리 채워진 단어는 <code className="bg-gray-100 px-1 rounded">[단어]</code>로 감싸세요
              </p>
              {(formData as any).words && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {(formData as any).words.split(/[,]+/).map((w: string) => w.trim()).filter(Boolean).map((w: string, i: number) => (
                    <span key={i} className="px-2 py-0.5 rounded-md bg-[#2d7a7c]/10 text-[#2d7a7c] text-xs font-medium">{w}</span>
                  ))}
                </div>
              )}
            </div>

            {/* Sentence Ending */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2">문장 끝 부호</label>
              <div className="flex gap-3">
                {(['.', '?'] as const).map(ending => (
                  <button key={ending} type="button"
                    onClick={() => setFormData({ ...formData, sentenceEnding: ending } as any)}
                    className={`flex-1 py-2.5 rounded-lg border-2 text-base font-bold transition-all ${
                      (formData as any).sentenceEnding === ending
                        ? 'border-[#2d7a7c] bg-[#2d7a7c] text-white'
                        : 'border-gray-300 bg-white text-gray-600 hover:border-[#2d7a7c]'
                    }`}>
                    {ending === '.' ? '마침표 (.)' : '물음표 (?)'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Write an Email — Writing Edit only */}
        {section === 'Writing' && formData.questionType === 'Write an Email' && (
          <div className="border-2 border-dashed border-blue-300 rounded-xl p-4 bg-blue-50/40 space-y-3">
            <p className="text-sm font-bold text-blue-700 flex items-center gap-1.5">✉️ Write an Email 설정 — 이메일 작성 문제 편집</p>

            {/* Avatar */}
            <div className="bg-white rounded-lg p-3 border border-blue-200">
              <label className="block text-xs font-semibold text-gray-600 mb-2">👤 아바타 (선택)</label>
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-[#1e6b73] flex-shrink-0 bg-gray-100">
                  {formData.avatar1ImageUrl
                    ? <img src={formData.avatar1ImageUrl} alt="avatar" className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">없음</div>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {DEFAULT_AVATARS.map((av) => (
                      <button key={av.url} type="button" title={av.label}
                        onClick={() => setFormData({ ...formData, avatar1ImageFile: null, avatar1ImageUrl: av.url })}
                        className={`w-8 h-8 rounded-full overflow-hidden border-2 transition-all ${formData.avatar1ImageUrl === av.url ? 'border-[#1e6b73] ring-2 ring-[#1e6b73]/30' : 'border-gray-200 hover:border-[#1e6b73]'}`}>
                        <img src={av.url} alt={av.label} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                  <input type="file" accept="image/*" className="text-xs w-full"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) setFormData({ ...formData, avatar1ImageFile: f, avatar1ImageUrl: URL.createObjectURL(f) }); }}
                  />
                  {formData.avatar1ImageUrl && (
                    <button type="button" onClick={() => setFormData({ ...formData, avatar1ImageFile: null, avatar1ImageUrl: '' })} className="text-xs text-red-500 mt-1 hover:underline">제거</button>
                  )}
                </div>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">상황 설명 (첫 단락)</label>
              <textarea rows={3}
                value={(formData as any).emailScenario || ''}
                onChange={(e) => setFormData({ ...formData, emailScenario: e.target.value } as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-400"
                placeholder="예: A new poetry magazine has asked its readers for submissions..."
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">지시문 (Write an email to...)</label>
              <input type="text"
                value={(formData as any).emailInstruction || ''}
                onChange={(e) => setFormData({ ...formData, emailInstruction: e.target.value } as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-400"
                placeholder="예: Write an email to the editor of the magazine. In your email, do the following."
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">지시 사항 (한 줄씩, 최대 4개)</label>
              {[0, 1, 2, 3].map(i => (
                <input key={i} type="text"
                  value={((formData as any).emailBullets || [])[i] || ''}
                  onChange={(e) => {
                    const bullets = [...(((formData as any).emailBullets) || ['', '', '', ''])];
                    bullets[i] = e.target.value;
                    setFormData({ ...formData, emailBullets: bullets } as any);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-400 mb-1.5"
                  placeholder={`지시 사항 ${i + 1}`}
                />
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">To (수신자 이메일)</label>
                <input type="text"
                  value={(formData as any).emailTo || ''}
                  onChange={(e) => setFormData({ ...formData, emailTo: e.target.value } as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-400"
                  placeholder="예: editor@magazine.com"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Subject (제목)</label>
                <input type="text"
                  value={(formData as any).emailSubject || ''}
                  onChange={(e) => setFormData({ ...formData, emailSubject: e.target.value } as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-400"
                  placeholder="예: Problem using submission form"
                />
              </div>
            </div>
          </div>
        )}

        {/* Academic Discussion — Writing Edit only */}
        {section === 'Writing' && formData.questionType === 'Academic Discussion' && (
          <div className="border-2 border-dashed border-purple-300 rounded-xl p-4 bg-purple-50/30 space-y-3">
            <p className="text-sm font-bold text-purple-700 flex items-center gap-1.5">🎓 Academic Discussion 설정 — 교수님 1명 + 학생 2명의 토론 응답 문제용</p>

            {/* Professor */}
            <div className="bg-white rounded-lg p-3 border border-purple-200">
              <p className="text-xs font-semibold text-purple-700 mb-2">🧑‍🏫 교수님 (가운데 원)</p>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 flex flex-col items-center gap-1">
                  <div className="w-16 h-16 rounded-full overflow-hidden border-4 border-[#1e6b73] bg-gray-100">
                    {formData.professorImageUrl
                      ? <img src={formData.professorImageUrl} alt="professor" className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">없음</div>}
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {DEFAULT_AVATARS.map((av) => (
                      <button key={av.url} type="button" title={av.label}
                        onClick={() => setFormData({ ...formData, professorImageFile: null, professorImageUrl: av.url })}
                        className={`w-7 h-7 rounded-full overflow-hidden border-2 transition-all ${formData.professorImageUrl === av.url ? 'border-[#1e6b73]' : 'border-gray-200 hover:border-[#1e6b73]'}`}>
                        <img src={av.url} alt={av.label} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                  <input type="file" accept="image/*" className="text-[10px] w-16"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) setFormData({ ...formData, professorImageFile: f, professorImageUrl: URL.createObjectURL(f) }); }}
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <input type="text"
                    value={(formData as any).professorName || ''}
                    onChange={(e) => setFormData({ ...formData, professorName: e.target.value } as any)}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-400"
                    placeholder="교수님 이름 (예: Dr. Achebe)"
                  />
                  <textarea rows={3}
                    value={(formData as any).professorMessage || ''}
                    onChange={(e) => setFormData({ ...formData, professorMessage: e.target.value } as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-400"
                    placeholder="교수님의 토론 주제·질문 (예: Volunteerism refers to the act of...)"
                  />
                </div>
              </div>
            </div>

            {/* Students */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Student 1 */}
              <div className="bg-white rounded-lg p-3 border border-purple-200">
                <p className="text-xs font-semibold text-purple-700 mb-2">👩‍🎓 학생 1 (찬성·찬반 입장 응답 1)</p>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 flex flex-col items-center gap-1">
                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-[#c9b99b] bg-gray-100">
                      {formData.student1ImageUrl
                        ? <img src={formData.student1ImageUrl} alt="student1" className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-gray-400 text-[10px]">없음</div>}
                    </div>
                    <div className="flex flex-wrap gap-0.5 mt-1">
                      {DEFAULT_AVATARS.map((av) => (
                        <button key={av.url} type="button" title={av.label}
                          onClick={() => setFormData({ ...formData, student1ImageFile: null, student1ImageUrl: av.url })}
                          className={`w-6 h-6 rounded-full overflow-hidden border-2 transition-all ${formData.student1ImageUrl === av.url ? 'border-[#1e6b73]' : 'border-gray-200 hover:border-[#1e6b73]'}`}>
                          <img src={av.url} alt={av.label} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                    <input type="file" accept="image/*" className="text-[10px] w-12"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) setFormData({ ...formData, student1ImageFile: f, student1ImageUrl: URL.createObjectURL(f) }); }}
                    />
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <input type="text"
                      value={(formData as any).student1Name || ''}
                      onChange={(e) => setFormData({ ...formData, student1Name: e.target.value } as any)}
                      className="w-full px-2 py-1 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-purple-400"
                      placeholder="학생 1 이름 (예: Paul N)"
                    />
                    <textarea rows={3}
                      value={(formData as any).student1Message || ''}
                      onChange={(e) => setFormData({ ...formData, student1Message: e.target.value } as any)}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-purple-400"
                      placeholder="학생 1의 응답..."
                    />
                  </div>
                </div>
              </div>

              {/* Student 2 */}
              <div className="bg-white rounded-lg p-3 border border-purple-200">
                <p className="text-xs font-semibold text-purple-700 mb-2">🧑‍🎓 학생 2 (반대·반대 입장 응답 2)</p>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 flex flex-col items-center gap-1">
                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-[#c9b99b] bg-gray-100">
                      {formData.student2ImageUrl
                        ? <img src={formData.student2ImageUrl} alt="student2" className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-gray-400 text-[10px]">없음</div>}
                    </div>
                    <div className="flex flex-wrap gap-0.5 mt-1">
                      {DEFAULT_AVATARS.map((av) => (
                        <button key={av.url} type="button" title={av.label}
                          onClick={() => setFormData({ ...formData, student2ImageFile: null, student2ImageUrl: av.url })}
                          className={`w-6 h-6 rounded-full overflow-hidden border-2 transition-all ${formData.student2ImageUrl === av.url ? 'border-[#1e6b73]' : 'border-gray-200 hover:border-[#1e6b73]'}`}>
                          <img src={av.url} alt={av.label} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                    <input type="file" accept="image/*" className="text-[10px] w-12"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) setFormData({ ...formData, student2ImageFile: f, student2ImageUrl: URL.createObjectURL(f) }); }}
                    />
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <input type="text"
                      value={(formData as any).student2Name || ''}
                      onChange={(e) => setFormData({ ...formData, student2Name: e.target.value } as any)}
                      className="w-full px-2 py-1 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-purple-400"
                      placeholder="학생 2 이름 (예: Lena A)"
                    />
                    <textarea rows={3}
                      value={(formData as any).student2Message || ''}
                      onChange={(e) => setFormData({ ...formData, student2Message: e.target.value } as any)}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-purple-400"
                      placeholder="학생 2의 응답..."
                    />
                  </div>
                </div>
              </div>
            </div>
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

        {/* Listening Script — used by the Review Script tab. Other AI review
            fields (Translation/Analysis/Key Words) were removed as unused. */}
        {section === 'Listening' && (
          <div className="border-t border-gray-200 pt-4 space-y-3">
            <p className="text-xs font-bold text-[#2d7a7c] uppercase tracking-wide flex items-center gap-1">
              ✨ Script
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Script <span className="text-xs text-gray-400 font-normal">(리스닝 스크립트 — Review의 Script 탭에 표시)</span>
              </label>
              <textarea
                value={(formData as any).scriptText || ''}
                onChange={(e) => setFormData({ ...formData, scriptText: e.target.value } as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2d7a7c] text-sm"
                rows={3}
                placeholder="리스닝 오디오의 스크립트(대본)를 입력하세요..."
              />
            </div>
          </div>
        )}

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


// Bulk Upload Form Component (Text-based)
interface BulkUploadFormProps {
  testType: 'TPO' | 'Test';
  testNumber: number;
  section: 'Reading' | 'Listening' | 'Speaking' | 'Writing';
  questionTypeOptions?: string[];
  onSubmit: (questions: TPOQuestion[]) => void;
  onCancel: () => void;
}

function BulkUploadForm({ testType, testNumber, section, questionTypeOptions, onSubmit, onCancel }: BulkUploadFormProps) {
  const [mode, setMode] = useState<'text' | 'csv'>('text');
  const [rawText, setRawText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [parsed, setParsed] = useState<TPOQuestion[] | null>(null);

  // ─── Template per section ───
  const getTemplate = (): string => {
    switch (section) {
      case 'Reading':
        return `# Module 2 문제는 각 문제 블록에 "모듈: Module 2" 한 줄을 추가하세요.
# 이미지가 필요하면 "이미지: 파일명.png" 처럼 파일명만 적으세요.
# (실제 파일은 나중에 [미디어 일괄 매칭]에서 한 번에 올립니다)
# 문제 수는 유동적입니다 — Complete Words는 Q1-Q10, Q11-Q20 등 범위로 지정 가능.
# 두 번째 세트는 Q11-Q20처럼 이어지는 번호를 사용하세요.
# 화면제목: Read an Email / Read an Academic Passage 등 페이지 상단에 표시될 제목을 입력하세요.

Q1-Q10: Complete Words
난이도: 보통

지문:
When peo[ple] think of inven[tion], they often imagine tech[nology]. However, modern research has shown that edu[cation] plays a more important role than envi[ronment].

deve[lopment] shapes our cul[ture] and soc[iety]. Without mo[ney] or moti[vation], suc[cess] is hard to achieve.

# 빈칸 형식: 보이는글자[가릴글자]  예) peo[ple] → "peo____" 빈칸에 "ple" 입력
# 빈칸 칸수를 직접 정하려면 peo[ple:3] 처럼 :숫자 를 붙이세요 (생략하면 글자수 자동)

===

Q11-Q20: Complete Words
모듈: Module 2
난이도: 보통

지문:
The hu[man] brain is a com[plex] organ that cont[rols] every part of the bo[dy]. It is div[ided] into several reg[ions], each with a spec[ific] role in thou[ght], memory, and emo[tion].

Sci[entists] continue to stu[dy] how these areas work tog[ether] to shape beha[vior].

# Q11-Q20 (Module 2)도 Q1-Q10과 똑같은 빈칸 형식입니다. "모듈: Module 2" 한 줄만 추가하면 됩니다.

===

# ▼▼▼ 아래는 선택 예시입니다 (Read in Daily Life / Academic). 필요 없으면 지우세요. ▼▼▼

Q21: Read in Daily Life
유형: email
화면제목: Read an Email
난이도: 보통

필드:
to: edward56L@dmail.com
from: artforeveryone@dmail.com
date: September 2
subject: Your Membership Renewal
body:
Dear Edward,

Thank you for being a valued member of Art For Everyone. We noticed that your annual membership is set to expire on October 1st.

To continue enjoying unlimited access to our galleries, workshops, and special exhibitions, please renew your membership before the expiration date.

Best regards,
Membership Services Team

문제:
What is the main purpose of the email?

보기:
A. To announce a membership renewal
B. To ask for a donation
C. To complain about a service
D. To introduce a new artist

정답: A
해설: The email asks the recipient to renew a membership.

===

Q22: Read an Academic Passage
화면제목: Read an Academic Passage
난이도: 보통

지문:
The theory of plate tectonics revolutionized geology in the 1960s...

문제:
What is the main idea of the passage?

보기:
A. Option A
B. Option B
C. Option C
D. Option D

정답: B
해설: ...

===

Q23: Read an Academic Passage
화면제목: Read an Academic Passage
난이도: 보통

문제:
What evidence supports the theory?

보기:
A. ...
B. ...
C. ...
D. ...

정답: C
(이전 지문 자동 상속)`;
      case 'Listening':
        return `# Module 2 문제는 각 문제 블록에 "모듈: Module 2" 한 줄을 추가하세요.
# 오디오/이미지는 "오디오: 파일명.mp3" / "이미지: 파일명.png" 처럼 파일명만 적으세요.
# (실제 파일은 나중에 [미디어 일괄 매칭]에서 한 번에 올립니다)

Q1: Academic Lecture
난이도: 보통
모듈: Module 1
제목: The History of Photography
안내문: Listen to part of a lecture in an art history class.
오디오: q1_audio.mp3
이미지: q1_image.png

스크립트:
Professor: Good morning, everyone. Today we're going to explore the history of photography, from its earliest beginnings in the 19th century to the digital revolution of the 21st century. The camera obscura was the first device that led to photography. Artists used it to project images onto surfaces. Then came the daguerreotype in 1839, which was the first commercially successful photographic process.

But perhaps the most significant turning point came with the invention of flexible roll film by George Eastman in 1888. This made photography accessible to ordinary people for the first time. Before this, photography was limited to professionals with heavy equipment and dangerous chemicals.

Now, let's consider the impact of digital photography. When digital cameras first appeared in the 1990s, many traditional photographers dismissed them. But within just two decades, digital photography has almost entirely replaced film for everyday use.

문제:
What is the main topic?

보기:
A. Modern cameras
B. History of photography
C. Famous photographers
D. Art appreciation

정답: B
해설: The lecture traces the development of photography from camera obscura to digital.

===

Q2: Academic Lecture
난이도: 보통
(이전 스크립트와 제목 자동 상속)

문제:
What did George Eastman invent in 1888?

보기:
A. The daguerreotype
B. The camera obscura
C. Flexible roll film
D. The digital camera

정답: C
해설: Eastman invented flexible roll film, making photography accessible.

===

Q3: Academic Lecture
난이도: 보통

문제:
When did digital cameras first appear?

보기:
A. 1880s
B. 1930s
C. 1970s
D. 1990s

정답: D

===

Q9: Short Conversation
난이도: 보통
제목: Library Checkout
안내문: Listen to a conversation between a student and a librarian.

스크립트:
Student: Hi, I'm looking for a book for my history class. The professor said it's on reserve.
Librarian: Sure. What's the title?
Student: It's "The American Revolution: A New Perspective" by Dr. Johnson.
Librarian: Let me check. Yes, we have it on reserve. You can borrow it for two hours. I'll need your student ID.
Student: Here you go. Is it available right now?
Librarian: Yes, it is. Let me get it for you.

문제:
What does the student need to provide?

보기:
A. A recommendation letter
B. A student ID
C. The professor's name
D. A library card

정답: B

===

Q10: Short Conversation
난이도: 보통
(이전 스크립트와 제목 자동 상속)

문제:
How long can the student borrow the book?

보기:
A. One hour
B. Two hours
C. Overnight
D. One week

정답: B

===

Q11: Announcement
난이도: 보통
제목: Campus Shuttle Service Change
안내문: Listen to an announcement on campus.

스크립트:
Attention all students. Starting next Monday, the campus shuttle service will operate on a revised schedule. The morning shuttle will now depart from the main gate every 15 minutes instead of every 20 minutes between 7 AM and 10 AM. The evening service will be extended until 11 PM on weekdays. Also, please note that the weekend shuttle to downtown will now require advance reservation through the campus app. Thank you for your attention.

문제:
What change is being announced?

보기:
A. A new bus route
B. A shuttle schedule change
C. A parking fee increase
D. A campus closure

정답: B

===

Q12: Announcement
난이도: 보통
(이전 스크립트와 제목 자동 상속)

문제:
How can students reserve the weekend shuttle?

보기:
A. By phone
B. At the main gate
C. Through the campus app
D. By email

정답: C

===

Q13: Academic Talk
난이도: 보통
제목: Climate Change and Marine Life
안내문: Listen to part of a discussion on a science podcast.

스크립트:
Host: Today we're joined by Dr. Park from the Ocean Research Institute. Dr. Park, how is climate change affecting marine ecosystems?
Dr. Park: Well, the most visible impact is coral bleaching. When ocean temperatures rise by just one or two degrees, corals expel the algae living in their tissues, causing them to turn white. If the stress continues, the corals die.
Host: And this affects other marine life too, doesn't it?
Dr. Park: Absolutely. Coral reefs support about 25% of all marine species. When corals die, the entire food chain is disrupted. We're also seeing fish populations migrating toward cooler waters, which affects local fishing communities.

문제:
What happens when ocean temperatures rise by 1-2 degrees?

보기:
A. Fish populations increase
B. Corals expel their algae
C. New species appear
D. Water becomes clearer

정답: B

===

Q14: Academic Talk
난이도: 보통
(이전 스크립트와 제목 자동 상속)

문제:
What percentage of marine species do coral reefs support?

보기:
A. 10%
B. 25%
C. 50%
D. 75%

정답: B

===

Q15: Academic Lecture
난이도: 보통
제목: The Psychology of Memory
안내문: Listen to part of a lecture in a psychology class.

스크립트:
Professor: Let's talk about memory consolidation. When you first learn something new, the information is stored in your short-term memory, which has a very limited capacity. Through a process called consolidation, memories are gradually transferred to long-term storage.

Sleep plays a crucial role in this process. Research has shown that students who sleep after studying retain significantly more information than those who stay awake. During deep sleep, the brain replays the day's experiences, strengthening neural connections.

There's also something called the testing effect. Simply re-reading your notes is far less effective than actively testing yourself on the material. When you retrieve information from memory, you strengthen the pathway, making it easier to recall later.

문제:
What is the main topic of this lecture?

보기:
A. Sleep disorders
B. Memory consolidation
C. Study techniques
D. Brain anatomy

정답: B

===

Q16: Academic Lecture
난이도: 보통
(이전 스크립트와 제목 자동 상속)

문제:
What is the testing effect?

보기:
A. Reading notes repeatedly
B. Taking practice tests to strengthen memory
C. Getting more sleep before exams
D. Memorizing vocabulary lists

정답: B
해설: Actively retrieving information strengthens memory pathways.`;
      case 'Speaking':
        return `# 오디오/이미지는 "오디오: 파일명.mp3" / "이미지: 파일명.png" 처럼 파일명만 적으세요.
# (실제 파일은 나중에 [미디어 일괄 매칭]에서 한 번에 올립니다)

Q1: Listen and Repeat
난이도: 보통
시간: 8
제목: Campus Announcement
안내문: Listen and then repeat.
오디오: q1_audio.mp3

스크립트:
The library will be closed on Saturday for maintenance. Please return all books by Friday evening.

문제:
Listen and repeat the announcement.

정답: The library will be closed on Saturday for maintenance. Please return all books by Friday evening.
해설: 정확한 발음과 억양으로 반복

===

Q2: Listen and Repeat
난이도: 보통
시간: 8
제목: Class Schedule Change
안내문: Listen and then repeat.

스크립트:
Professor Smith's office hours have been moved to Wednesday afternoon from 2 to 4 PM.

문제:
Listen and repeat the announcement.

정답: Professor Smith's office hours have been moved to Wednesday afternoon from 2 to 4 PM.

===

Q3: Listen and Repeat
난이도: 보통
시간: 10
제목: Weather Advisory
안내문: Listen and then repeat.

스크립트:
Due to heavy snow expected tomorrow, all morning classes will be delayed by two hours. The cafeteria will open at 9 AM instead of 7 AM.

문제:
Listen and repeat the announcement.

정답: Due to heavy snow expected tomorrow, all morning classes will be delayed by two hours. The cafeteria will open at 9 AM instead of 7 AM.

===

Q6: Independent Task
난이도: 보통
시간: 45
제목: Studying Alone vs. In Groups
안내문: You will have 45 seconds to speak.

문제:
Some people prefer studying alone, while others prefer studying in groups. Which do you prefer and why? Include details and examples to support your choice.

정답: I prefer studying in groups because it allows me to learn from my peers. When I study alone, I sometimes get stuck on difficult concepts. In a group, we can discuss different perspectives and help each other understand complex topics. For example, last semester my study group helped me prepare for a biology exam by quizzing each other, and I scored much higher than when I studied alone.
해설: 45초 내에 명확한 입장 + 이유 + 예시 제시

===

Q7: Independent Task
난이도: 보통
시간: 45
제목: Online vs. In-Person Classes
안내문: You will have 45 seconds to speak.

문제:
Do you agree or disagree with the following statement? Online classes are as effective as in-person classes. Use specific reasons and examples to support your answer.

정답: I disagree that online classes are as effective as in-person classes. In-person classes provide immediate interaction with professors and classmates, which enhances learning. For instance, in my psychology class, group discussions and real-time feedback from the professor helped me understand concepts much better than watching recorded lectures online. The social aspect of classroom learning also keeps students motivated.
해설: 찬반 입장 명확히 + 구체적 예시

===

Q8: Take an Interview
난이도: 보통
시간: 45
제목: Hobbies and Free Time
안내문: Answer the interviewer's question naturally.

문제:
The interviewer asks: "What do you enjoy doing in your free time, and why?"

정답: In my free time, I enjoy playing basketball with my friends. It's a great way to stay healthy and relieve stress after a long week of studying. I also like that it's a social activity — we usually grab dinner together after the game, which gives us a chance to catch up. Basketball has taught me teamwork and discipline, which I think are valuable skills both in and out of the classroom.
해설: 자연스러운 대화톤 + 구체적 활동 + 이유

===

Q9: Take an Interview
난이도: 보통
시간: 45
제목: Future Career Goals
안내문: Answer the interviewer's question naturally.

문제:
The interviewer asks: "What career would you like to pursue after graduation, and what steps are you taking to achieve that goal?"

정답: I'd like to become an environmental scientist after graduation. I've always been passionate about protecting nature, and this career would let me work on real-world problems like climate change. To achieve this goal, I'm majoring in Environmental Science, volunteering at a local conservation group, and planning to attend a research internship next summer. I believe these experiences will give me the skills I need.
해설: 구체적 진로 + 현재 노력 + 미래 계획

===

Q10: Take an Interview
난이도: 어려움
시간: 45
제목: Technology in Education
안내문: Answer the interviewer's question naturally.

문제:
The interviewer asks: "Do you think technology has improved education? Give specific examples to support your opinion."

정답: Yes, I believe technology has significantly improved education. One major benefit is access to information — students can now find academic papers, tutorials, and online courses from anywhere in the world. For example, during the pandemic, online learning platforms allowed me to continue my studies without interruption. Technology also enables personalized learning; apps like Duolingo adapt to each student's pace. However, I think it's important to balance screen time with face-to-face interaction.
해설: 찬성 입장 + 구체적 예시 + 균형점 언급

===

Q11: Academic Discussion
난이도: 어려움
시간: 60
제목: Social Media Impact
안내문: Express your opinion on the discussion topic.

교수이름: Dr. Johnson
교수메시지:
Today we're discussing the impact of social media on education. Some argue that social media is a distraction that hurts academic performance, while others believe it can be a valuable learning tool. What's your opinion?

학생1이름: Sarah
학생1메시지:
I think social media has more negative effects. Students spend too much time scrolling through feeds instead of studying, and it reduces their attention span.

학생2이름: Mike
학생2메시지:
I see it differently. Social media can connect students with educational communities. I've joined study groups on Facebook where we share resources and help each other.

문제:
What is your opinion on the role of social media in education?

정답: I agree with Mike that social media can be a valuable educational tool when used responsibly. While Sarah's concern about distraction is valid, the key is self-discipline and time management. In my experience, educational communities on social media have helped me find study resources and connect with classmates for group projects. However, I also think schools should teach students how to use social media productively rather than trying to ban it entirely.
해설: 양쪽 의견 인정 + 자신의 입장 + 구체적 경험`;
      case 'Writing':
        return `Q1: Write an Email
난이도: 보통
시간: 10
받는이: professor@university.edu
제목: Question about missed class

상황:
You are a student who missed last week's class due to a family emergency. You need to catch up on the material and speak with your professor.

지시문:
Write an email to your professor. In your email, do the following.

요구사항:
- Explain why you missed class
- Ask about the homework or assignments
- Request a meeting during office hours

정답: Dear Professor Smith,

I hope this email finds you well. I am writing to apologize for missing last week's class. Unfortunately, I had a family emergency that required me to travel home unexpectedly, and I was unable to attend lectures.

I would like to catch up on the material I missed. Could you please let me know what homework or assignments were given during my absence? I want to make sure I submit everything on time.

Additionally, I would appreciate the opportunity to meet with you during your office hours to discuss the topics covered in class. Would Wednesday at 2 PM be a convenient time for you?

Thank you for your understanding, and I look forward to hearing from you soon.

Best regards,
[Your Name]
해설: 정중한 톤, 3가지 요구사항 모두 포함, 적절한 이메일 구조 (인사, 본문, 맺음말)

===

Q2: Academic Discussion
난이도: 어려움
시간: 10

교수이름: Dr. Achebe
교수메시지:
This week, we're discussing the role of technology in education. Some educators argue that smartphones and laptops in the classroom are distractions that hinder learning. Others believe these devices can enhance the educational experience when used properly. What is your opinion on the use of technology in the classroom?

학생1이름: Paul N
학생1메시지:
I think technology should be limited in the classroom. When students use laptops, they're often checking social media or browsing the internet instead of taking notes. I've noticed that students who write notes by hand tend to remember the material better. Technology can be too distracting.

학생2이름: Lena A
학생2메시지:
I disagree. Technology, when used intentionally, can be a powerful learning tool. For example, in my biology class, we use our phones to access interactive models of cells and molecules. These visual aids help us understand complex concepts that would be difficult to grasp from a textbook alone. The key is setting guidelines for appropriate use.

문제:
Write a response in which you express your opinion on the use of technology in the classroom. Support your opinion with reasons and examples from your own experience.

정답: I agree with Lena that technology, when used intentionally, can greatly enhance the learning experience in the classroom. While Paul raises a valid concern about distractions, I believe the solution lies in establishing clear guidelines rather than banning devices entirely.

In my own experience, technology has been invaluable in my studies. During my history class last semester, our professor encouraged us to use our laptops to access primary source documents in real time. This allowed us to analyze historical texts together as a class, which would not have been possible with printed materials alone. The interactive nature of the lesson kept everyone engaged and focused on the task.

Furthermore, educational apps and online platforms have made it easier for students to collaborate outside of class. Tools like Google Docs allow groups to work on projects together, and language learning apps provide personalized practice that adapts to each student's level.

However, I also acknowledge Paul's point about potential distractions. To address this, teachers could implement policies such as "laptops down" moments during important discussions or use classroom management software to monitor device usage. The goal should be to teach students responsible technology use, which is an essential skill in today's digital world.

In conclusion, technology in the classroom should be embraced with thoughtful guidelines rather than restricted. When used purposefully, it can transform passive learning into an interactive and engaging experience.
해설: 양쪽 학생 의견 인정 + 자신의 입장 + 구체적 경험 + 반론 대응 + 결론`;
      default: return '';
    }
  };

  // ─── Parser ───
  const parseText = (text: string): TPOQuestion[] => {
    const blocks = text.split(/\n?={3,}\n?/);
    const questions: TPOQuestion[] = [];
    let lastPassage = ''; // inherit passageText from previous Q for academic reading
    let lastScript = ''; // inherit scriptText from previous Q for listening grouped Qs

    const isCompleteWordsBulkType = (raw: string): boolean => {
      const normalized = raw.toLowerCase().replace(/[-_]/g, ' ').replace(/\s+/g, ' ').trim();
      return (
        normalized.includes('complete words') ||
        normalized.includes('complet words') ||
        normalized.includes('complete the words') ||
        normalized.includes('fill in the blank') ||
        normalized.includes('fill in the blanks') ||
        normalized.includes('fill in the missing letters') ||
        normalized.includes('cloze') ||
        normalized.includes('빈칸') ||
        normalized.includes('fillblanks')
      );
    };

    // Daily Life format helpers
    const normalizeDailyFormat = (raw?: string): string | undefined => {
      if (!raw) return undefined;
      const map: Record<string, string> = {
        notice: 'notice', 공지: 'notice', 공지문: 'notice', 공지사항: 'notice',
        email: 'email', 이메일: 'email', 메일: 'email',
        social_media: 'social_media', 'social media': 'social_media', 소셜미디어: 'social_media', 소셜: 'social_media', sns: 'social_media',
        advertisement: 'advertisement', advert: 'advertisement', 광고: 'advertisement', 광고문: 'advertisement',
        article: 'article', 'news article': 'article', 뉴스기사: 'article', 기사: 'article', 뉴스: 'article',
        form: 'form', order: 'form', 양식: 'form', 주문서: 'form', 주문: 'form', 'form/table': 'form',
        review: 'review', 리뷰: 'review', 영화리뷰: 'review', 후기: 'review',
        text_message: 'text_message', 'text message': 'text_message', 'text-message': 'text_message', 문자: 'text_message', 문자메시지: 'text_message', 문자대화: 'text_message', 메시지: 'text_message', 채팅: 'text_message',
      };
      return map[raw.trim().toLowerCase()] || undefined;
    };

    const DAILY_FORMAT_TITLES: Record<string, string> = {
      notice: 'Read a notice.',
      email: 'Read an email.',
      social_media: 'Read a social media post.',
      advertisement: 'Read an advertisement.',
      article: 'Read an article.',
      form: 'Read a form.',
      review: 'Read a review.',
      text_message: 'Read a text message conversation.',
    };

    const FIELD_KEY_ALIASES: Record<string, Record<string, string[]>> = {
      notice: {
        title: ['title', '제목', '공지제목', 'noticetitle', 'notice_title'],
        subtitle: ['subtitle', '부제목', '소제목', 'tagline'],
        body: ['body', '본문', '내용', 'text', '공지내용'],
      },
      email: {
        to: ['to', '받는사람', '받는이', 'recipient', '받는사람주소'],
        from: ['from', '보낸사람', '보낸이', 'sender', '보낸사람주소'],
        date: ['date', '날짜', '일자', '작성일'],
        subject: ['subject', '제목', '주제', '메일제목', 'email_subject'],
        body: ['body', '본문', '내용', 'emailbody', 'email_body'],
      },
      social_media: {
        platform: ['platform', '플랫폼', 'sns', '커뮤니티'],
        username: ['username', '사용자', '사용자명', '아이디', 'id'],
        timestamp: ['timestamp', '시간', '작성시간', '날짜', 'date'],
        content: ['content', '내용', '글내용', 'postcontent', 'post_content'],
        likes: ['likes', '좋아요', 'like'],
        comments: ['comments', '댓글', 'comment'],
        shares: ['shares', '공유', 'share'],
      },
      advertisement: {
        headline: ['headline', '헤드라인', '제목', '광고제목'],
        business: ['business', '회사', '상호', '업체명', 'businessname', 'business_name'],
        offer: ['offer', '제안', '할인', '프로모션', 'mainoffer', 'main_offer'],
        details: ['details', '상세', '세부사항', '내용', '광고내용'],
        location: ['location', '위치', '주소', '장소'],
        contact: ['contact', '연락처', '연락', 'contactinfo', 'contact_info'],
      },
      article: {
        source: ['source', '출처', '신문', '뉴스출처', 'newssource'],
        headline: ['headline', '헤드라인', '제목', '기사제목'],
        date: ['date', '날짜', '일자', '작성일'],
        author: ['author', '저자', '기자', '작성자', 'byline'],
        body: ['body', '본문', '내용', '기사내용', 'articlebody', 'article_body'],
      },
      form: {
        title: ['title', '제목', '양식제목', 'formtitle', 'form_title'],
        company: ['company', '회사', '업체명', 'companyname', 'company_name'],
        tableHeaders: ['tableheaders', '헤더', '표헤더', '컬럼', 'columns', 'table_headers'],
        tableRows: ['tablerows', '행', '표행', 'rows', 'table_rows'],
        footer: ['footer', '요약', '하단', 'footerinfo', 'footer_info'],
      },
      review: {
        title: ['title', '제목', '리뷰제목', 'reviewtitle', 'review_title'],
        body: ['body', '본문', '내용', 'reviewbody', 'review_body', '리뷰내용'],
      },
      text_message: {
        messages: ['messages', '메시지', '대화', '문자', 'chat', 'conversation', '대화내용'],
      },
    };

    const parseFieldBlock = (block: string): Record<string, string> => {
      const fields: Record<string, string> = {};
      if (!block.trim()) return fields;
      const lines = block.split('\n');
      let currentKey: string | null = null;
      let currentValue: string[] = [];
      const flush = () => {
        if (currentKey) {
          fields[currentKey] = currentValue.join('\n').trim();
        }
        currentKey = null;
        currentValue = [];
      };
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const match = line.match(/^([a-zA-Z0-9_\uac00-\ud7a3]+)\s*:\s*(.*)$/);
        if (match) {
          flush();
          currentKey = match[1].trim();
          currentValue.push(match[2].trim());
        } else if (currentKey) {
          currentValue.push(line);
        }
      }
      flush();
      return fields;
    };

    const mapFieldKeys = (format: string, fields: Record<string, string>): Record<string, string> => {
      const aliases = FIELD_KEY_ALIASES[format] || {};
      const normalized: Record<string, string> = {};
      const used = new Set<string>();
      for (const [key, value] of Object.entries(fields)) {
        const k = key.toLowerCase().replace(/[\s_]/g, '');
        let mapped = false;
        for (const [target, aliasList] of Object.entries(aliases)) {
          if (used.has(target)) continue;
          const normalizedAliases = aliasList.map(a => a.toLowerCase().replace(/[\s_]/g, ''));
          if (normalizedAliases.includes(k)) {
            normalized[target] = value;
            used.add(target);
            mapped = true;
            break;
          }
        }
        if (!mapped) normalized[key] = value;
      }
      return normalized;
    };

    const extractFieldsBlock = (text: string): string | undefined => {
      const startLabels = ['필드:', 'fields:', '내용:'];
      const stopLabels = ['문제:', '보기:', '정답:', '해설:', '==='];
      for (const label of startLabels) {
        const re = new RegExp(`^${label}\\s*\\n?\\s*([\\s\\S]*?)(?=\\n(?:${stopLabels.join('|')})|$)`, 'im');
        const m = text.match(re);
        if (m && m[1].trim()) return m[1].trim();
      }
      return undefined;
    };

    // Single source of truth for every reserved field label that should terminate
    // a preceding block-capture in after(). Keeping ALL labels here (not a partial
    // hardcoded subset) prevents the boundaries from drifting out of sync with the
    // labels we actually extract — e.g. 분석:/번역:/단어노트: no longer swallow each
    // other. Regex uses the 'i' flag, so case variants (Text:/text:) need only one
    // entry; 교수/학생 are intentional prefixes matching 교수이름/학생1메시지/etc.
    const FIELD_BOUNDARY_LABELS = [
      '지문:', '본문:', '내용:', 'text:', 'passage:',
      '스크립트:',
      '분석:', 'analysis:', '분석노트:',
      '단어:', 'vocabulary:', '어휘:', '단어노트:',
      '번역:', 'translation:', '해석:', '번역노트:',
      '문제:', '해설:', '보기:', '정답:', '빈칸:', '시간:',
      '오디오:', '음성:', 'audio:', '오디오파일:',
      '이미지:', '사진:', 'image:', '이미지파일:',
      '난이도:', '모듈:', 'module:',
      '받는이:', '제목:', '상황:', '지시문:', '요구사항:',
      '교수', '학생', '문장끝:', '안내문:',
      '유형:', 'format:', '형식:', 'Type:',
      '화면제목:', 'passageTitle:', '지문제목:', 'screenTitle:',
      '색상:', 'color:', '테마:',
      '필드:', 'fields:',
    ];
    const BOUNDARY_ALT = FIELD_BOUNDARY_LABELS.join('|');

    for (const block of blocks) {
      if (!block.trim()) continue;
      const t = block.trim();

      // Question number and type from first line: "Q1-Q10: Type" or "Q1-10: Type" or "Q1: Type"
      // Supports "Q1-Q10", "Q1-10", "Q11-Q20", "Q11-20" etc.
      const headerMatch = t.match(/^Q(\d+)(?:-Q?(\d+))?\s*:\s*(.+)$/m);
      if (!headerMatch) continue;
      // qNum: "1-10" if range, "1" if single
      const qNum = headerMatch[2] ? `${headerMatch[1]}-${headerMatch[2]}` : headerMatch[1];
      const qType = headerMatch[3].trim();
      const isCompleteWordsQuestion = isCompleteWordsBulkType(qType);

      // Helper: extract value after label
      const after = (labels: string[]): string | undefined => {
        for (const label of labels) {
          // NOTE: '$' must sit OUTSIDE the "\n(?:...)" group — otherwise it
          // requires a literal trailing newline to match, which fails when
          // this field is the very last thing in the block/text (very common
          // for 지문:/스크립트: since they're often the last field before
          // '===' or end of the whole paste).
          const re = new RegExp(`^${label}\\s*\\n?\\s*([\\s\\S]*?)(?=\\n(?:${labels.join('|')}|${BOUNDARY_ALT}|===)|$)`, 'im');
          const m = t.match(re);
          if (m && m[1].trim()) return m[1].trim();
        }
        return undefined;
      };

      // Single-line fields
      const single = (labels: string[]): string | undefined => {
        for (const label of labels) {
          const re = new RegExp(`^${label}\\s*(.+)$`, 'im');
          const m = t.match(re);
          if (m) return m[1].trim();
        }
        return undefined;
      };

      const difficulty = (single(['난이도:', '난이도']) || '보통') as '쉬움' | '보통' | '어려움';

      // Module 1/2 for Reading/Listening — appended as ' (Module 2)' suffix to questionType
      const rawModule = single(['모듈:', '모듈', 'module:', 'Module:']);
      const isModule2 = /(?:2|Module\s*2|모듈\s*2|two|second)/i.test(rawModule || '') &&
                        (section === 'Reading' || section === 'Listening');
      const applyModuleSuffix = (baseType: string): string => {
        if (!isModule2) return baseType;
        if ((baseType || '').includes('(Module 2)')) return baseType; // already tagged
        return `${baseType} (Module 2)`;
      };
      // Complete Words 전용: 개별 입력(FillBlanksEditor)과 일치하도록 Module 1/2 모두 명시
      const completeWordsTypeWithModule = (): string => {
        return `Complete Words (${isModule2 ? 'Module 2' : 'Module 1'})`;
      };

      const passageText = after(['지문:', '본문:', '내용:', 'text:', 'Text:', 'passage:', 'Passage:']) || undefined;
      const scriptText = after(['스크립트:']) || undefined;

      // Audio/image filenames — stored as pending markers, matched later via 미디어 일괄 매칭
      // Reading has NO audio — only image.
      const audioFileName = section === 'Reading' ? undefined : (single(['오디오:', '음성:', 'audio:', 'Audio:', '오디오파일:']) || undefined);
      const imageFileName = single(['이미지:', '사진:', 'image:', 'Image:', '이미지파일:']) || undefined;
      const analysisNote = after(['분석:', 'analysis:', '분석노트:']) || undefined;
      const vocabularyNote = after(['단어:', 'vocabulary:', '어휘:', '단어노트:']) || undefined;
      const translationNote = after(['번역:', 'translation:', '해석:', '번역노트:']) || undefined;
      const questionText = after(['문제:']) || '';
      const explanation = after(['해설:']) || undefined;
      const durationStr = single(['시간:']);
      const duration = durationStr ? parseInt(durationStr) : undefined;

      // Options
      const optionsBlock = after(['보기:']);
      let options: string[] | undefined;
      if (optionsBlock) {
        options = optionsBlock.split('\n').map(l => l.trim()).filter(l => /^[A-D][.)]\s/.test(l));
        if (options.length === 0) options = undefined;
      }

      // Answer
      const answer = single(['정답:']);

      // Complete Words blanks
      let blanks: { answer: string; maxLength: number }[] | undefined;
      const blanksBlock = after(['빈칸:']);
      if (blanksBlock) {
        blanks = [];
        const bLines = blanksBlock.split('\n').filter(l => l.trim());
        for (const line of bLines) {
          const am = line.match(/answer\s*:\s*(.+?)\s*,?\s*maxLength\s*:\s*(\d+)/i);
          if (am) blanks.push({ answer: am[1].trim(), maxLength: parseInt(am[2]) });
          else {
            // Simple: just the word
            const w = line.replace(/^\d+[.):]?\s*/, '').trim();
            if (w) blanks.push({ answer: w, maxLength: w.length + 2 });
          }
        }
        if (blanks.length === 0) blanks = undefined;
      }

      // Inline blank detection: peo[ple:6] or peo[ple] in passageText (no 빈칸: section needed)
      if (!blanks && passageText && isCompleteWordsQuestion) {
        const inlineRegex = /\[([a-zA-Z][a-zA-Z\s'-]*?)(?::(\d+))?\]/g;
        const inlineBlanks: { answer: string; maxLength: number }[] = [];
        let inlineMatch;
        while ((inlineMatch = inlineRegex.exec(passageText)) !== null) {
          const ans = inlineMatch[1].trim();
          const maxLen = inlineMatch[2] ? parseInt(inlineMatch[2]) : ans.length;
          inlineBlanks.push({ answer: ans, maxLength: maxLen });
        }
        if (inlineBlanks.length > 0) blanks = inlineBlanks;
      }

      // Passage inheritance for academic reading
      let effectivePassage = passageText;
      if (!effectivePassage && qType === 'Read an Academic Passage') {
        effectivePassage = lastPassage || undefined;
      }
      if (effectivePassage) lastPassage = effectivePassage;

      // Complete Words: normalize inline brackets (los[ses] / los[ses:3]) into the
      // [answer:maxLength] format the fill-blanks renderer needs to draw inputs.
      if (isCompleteWordsQuestion && effectivePassage && /\[[A-Za-z]/.test(effectivePassage)) {
        effectivePassage = effectivePassage.replace(
          /\[([A-Za-z][A-Za-z\s]*?)(?::(\d+))?\]/g,
          (_m, a, n) => {
            const ans = String(a).trim();
            const len = n ? parseInt(n) : ans.length;
            return `[${ans}:${len}]`;
          }
        );
      }

      // Script inheritance for Listening (grouped Qs share one script)
      let effectiveScript = scriptText;
      if (!effectiveScript && lastScript) {
        effectiveScript = lastScript || undefined;
      }
      if (effectiveScript) lastScript = effectiveScript;

      // Email fields
      const emailTo = single(['받는이:']);
      const emailSubject = single(['제목:']);
      const emailScenario = after(['상황:']) || undefined;
      const emailInstruction = after(['지시문:']) || undefined;
      const bulletsBlock = after(['요구사항:']);
      const emailBullets = bulletsBlock ? bulletsBlock.split('\n').map(l => l.replace(/^[-*•]\s*/, '').trim()).filter(Boolean) : undefined;

      // Academic Discussion
      const profName = single(['교수이름:']);
      const profMsg = after(['교수메시지:']) || undefined;
      const s1Name = single(['학생1이름:']);
      const s1Msg = after(['학생1메시지:']) || undefined;
      const s2Name = single(['학생2이름:']);
      const s2Msg = after(['학생2메시지:']) || undefined;

      // Build a Sentence
      const wordsStr = single(['단어:']);
      const words = wordsStr ? wordsStr.split(/[,，]\s*/).filter(Boolean) : undefined;
      const sentenceEnding = (single(['문장끝:']) || undefined) as '.' | '?' | undefined;

      // Listening/Speaking extra
      const interstitialTitle = single(['안내문:']) || undefined;

      // Daily Life format handling
      const formatRaw = single(['유형:', 'format:', '형식:', 'Type:', 'type:']);
      const dailyFormat = normalizeDailyFormat(formatRaw);

      const passageTitle = single(dailyFormat
        ? ['화면제목:', 'passageTitle:', '지문제목:', 'screenTitle:']
        : ['화면제목:', 'passageTitle:', '지문제목:', 'screenTitle:', '제목:']) || undefined;

      const fieldsBlock = extractFieldsBlock(t);
      const fields = dailyFormat && fieldsBlock ? mapFieldKeys(dailyFormat, parseFieldBlock(fieldsBlock)) : undefined;
      const colorTheme = single(['색상:', 'color:', '테마:']) || 'teal';

      let finalPassageText: string | undefined = effectivePassage;
      let finalPassageTitle: string | undefined = passageTitle;

      if (dailyFormat && fields && Object.keys(fields).length > 0) {
        finalPassageText = JSON.stringify({
          templateId: `bulk-${dailyFormat}`,
          structure: dailyFormat,
          color: colorTheme,
          fields,
        });
      }
      if (dailyFormat && !finalPassageTitle) {
        finalPassageTitle = DAILY_FORMAT_TITLES[dailyFormat];
      }

      // Complete Words is ONE grouped question (Q1-10 / Q11-20) holding the whole
      // passage + all blanks — matching the FillBlanksEditor/renderer format.
      // Do NOT explode into one question per blank (renderer expects a single passage).
      // questionType은 개별 입력(FillBlanksEditor)과 동일하게 "Complete Words (Module 1/2)" 형태로 저장.
      if (isCompleteWordsQuestion && blanks && blanks.length > 0) {
        questions.push({
          id: `q-${Date.now()}-${qNum}-${Math.random().toString(36).slice(2,7)}`,
          questionNumber: qNum, // keep "1-10" / "11-20" string form
          questionText: questionText || 'Fill in the missing letters in the blank.',
          questionType: completeWordsTypeWithModule(),
          passageText: finalPassageText || undefined,
          difficulty,
          blanks,
          correctAnswer: blanks.map(b => b.answer).join(', '),
        } as any);
      } else {
        questions.push({
          id: `q-${Date.now()}-${qNum}-${Math.random().toString(36).slice(2,7)}`,
          questionNumber: qNum.includes('-') ? qNum : (isNaN(parseInt(qNum)) ? qNum : parseInt(qNum)),
          questionText,
          questionType: applyModuleSuffix(qType),
          options: options || [],
          correctAnswer: answer || '',
          explanation,
          passageText: finalPassageText || undefined,
          scriptText: effectiveScript || undefined,
          analysisNote,
          vocabularyNote,
          translationNote,
          duration,
          difficulty,
          blanks: blanks || undefined,
          emailScenario, emailInstruction, emailBullets, emailSubject, emailTo,
          professorName: profName, professorMessage: profMsg,
          student1Name: s1Name, student1Message: s1Msg,
          student2Name: s2Name, student2Message: s2Msg,
          words, sentenceEnding,
          passageTitle: finalPassageTitle, interstitialTitle,
          // Pending media filenames (matched later via 미디어 일괄 매칭)
          pendingAudioFileName: audioFileName,
          pendingImageFileName: imageFileName,
        } as any);
      }
    }
    // questionNumber 기준 오름차순 정렬 — Q1-Q10이 맨 앞에 오도록
    questions.sort((a, b) => {
      const rangeA = parseQuestionRange(a.questionNumber);
      const rangeB = parseQuestionRange(b.questionNumber);
      const startA = rangeA?.start ?? 9999;
      const startB = rangeB?.start ?? 9999;
      return startA - startB;
    });
    return questions;
  };

  const handleParse = () => {
    if (!rawText.trim()) { setError('텍스트를 붙여넣어주세요.'); return; }
    setError(null);
    try {
      const qs = parseText(rawText);
      if (qs.length === 0) throw new Error('질문을 찾을 수 없습니다. Q1: 유형 형식으로 시작하는지 확인해주세요.');
      setParsed(qs);
    } catch (err: any) {
      setError(err?.message || '파싱 오류');
    }
  };

  const handleDownloadTemplate = () => {
    const blob = new Blob([getTemplate()], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${testType}${testNumber}-${section}-template.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ─── CSV mode: spreadsheet-friendly bulk upload ───
  const CSV_COLUMNS = [
    'questionNumber', 'questionType', 'difficulty', 'module',
    'passageTitle', 'passageText', 'scriptText',
    'questionText', 'optionA', 'optionB', 'optionC', 'optionD',
    'correctAnswer', 'explanation', 'audioFileName', 'imageFileName',
  ];

  // Properly escape a CSV cell (wrap in quotes if it contains comma/quote/newline)
  const csvEscape = (val: any): string => {
    const s = String(val ?? '');
    if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };

  const handleDownloadCsvTemplate = () => {
    const supportsModule = section === 'Reading' || section === 'Listening';
    // Header row + section-specific example rows
    const header = CSV_COLUMNS.join(',');

    // 기본 예시 (모든 섹션 공통)
    const baseExample = [
      '1',
      (questionTypeOptions?.[0] || 'Detail Questions'),
      '보통',
      supportsModule ? 'Module 1' : '',
      'Sample Passage Title',
      'Full passage text goes here. Line breaks are OK inside this cell.',
      section === 'Listening' || section === 'Speaking' ? 'Full listening script goes here.' : '',
      'What is the main idea of the passage?',
      'A. First option', 'B. Second option', 'C. Third option', 'D. Fourth option',
      'A. First option',
      'Explanation of why A is correct.',
      section === 'Listening' || section === 'Speaking' ? 'q1_audio.mp3' : '',
      'q1_image.png',
    ].map(csvEscape).join(',');

    // Reading: Complete Words 예시 (Q1-Q10 범위, 빈칸 형식)
    const readingCWExample = section === 'Reading' ? [
      '1-10',
      'Complete Words',
      '보통',
      'Module 1',
      '',
      'When peo[ple] think of inven[tion], they imagine tech[nology]. But edu[cation] shapes our cul[ture] and soc[iety] more than envi[ronment]. Without mo[ney] or moti[vation], suc[cess] and deve[lopment] are hard.',
      '',
      'Fill in the missing letters in the blank.',
      '', '', '', '',
      '', '', '', '',
    ].map(csvEscape).join(',') : null;

    // Reading: Daily Life 예시 (passageTitle = Read an Email)
    const readingDailyExample = section === 'Reading' ? [
      '11',
      'Read in Daily Life',
      '보통',
      'Module 1',
      'Read an Email',
      'Dear Edward, Thank you for being a valued member of Art For Everyone. We noticed that your annual membership is set to expire on October 1st. To continue enjoying unlimited access, please renew before the expiration date. Best regards, Membership Services Team',
      '',
      'What is the main purpose of the email?',
      'A. To announce a membership renewal', 'B. To ask for a donation', 'C. To complain about a service', 'D. To introduce a new artist',
      'A',
      'The email asks the recipient to renew a membership.',
      '',
      '',
    ].map(csvEscape).join(',') : null;

    // Reading: Academic Passage 예시 (passageTitle = Read an Academic Passage)
    const readingAcademicExample = section === 'Reading' ? [
      '16',
      'Read an Academic Passage',
      '보통',
      'Module 1',
      'Read an Academic Passage',
      'The theory of plate tectonics revolutionized geology in the 1960s. Before this theory, scientists could not explain many geological phenomena...',
      '',
      'What is the main idea of the passage?',
      'A. Option A', 'B. Option B', 'C. Option C', 'D. Option D',
      'B',
      'Explanation of why B is correct.',
      '',
      '',
    ].map(csvEscape).join(',') : null;

    // Listening: 스크립트 포함 예시
    const listeningExample = section === 'Listening' ? [
      '2',
      'Academic Lecture',
      '보통',
      'Module 1',
      'The History of Photography',
      '',
      'Professor: Today we will explore the history of photography. The camera obscura was the first device that led to photography. Then came the daguerreotype in 1839.',
      'What is the main topic of the lecture?',
      'A. Modern cameras', 'B. History of photography', 'C. Famous photographers', 'D. Art appreciation',
      'B',
      'The lecture traces the development of photography.',
      'q2_audio.mp3',
      'q2_image.png',
    ].map(csvEscape).join(',') : null;

    // Speaking: 스크립트 + 정답 예시
    const speakingExample = section === 'Speaking' ? [
      '1',
      'Listen and Repeat',
      '보통',
      '',
      'Campus Announcement',
      '',
      'The library will be closed on Saturday for maintenance. Please return all books by Friday evening.',
      'Listen and repeat the announcement.',
      '', '', '', '',
      'The library will be closed on Saturday for maintenance. Please return all books by Friday evening.',
      '정확한 발음과 억양으로 반복',
      'q1_audio.mp3',
      '',
    ].map(csvEscape).join(',') : null;

    // Writing: 이메일 작성 예시
    const writingExample = section === 'Writing' ? [
      '1',
      'Write an Email',
      '보통',
      '',
      'Question about missed class',
      '',
      '',
      'Write an email to your professor. Explain why you missed class and request a meeting.',
      '', '', '', '',
      'Dear Professor Smith, I am writing to apologize for missing last week\'s class...',
      '정중한 톤, 3가지 요구사항 모두 포함',
      '',
      '',
    ].map(csvEscape).join(',') : null;

    // BOM for UTF-8 so Excel opens Korean correctly
    const rows = [header, baseExample, readingCWExample, readingDailyExample, readingAcademicExample, listeningExample, speakingExample, writingExample].filter(Boolean);
    const csv = '\uFEFF' + rows.join('\n') + '\n';
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${testType}${testNumber}-${section}-template.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Parse a CSV string into rows of cells (handles quoted fields with commas/newlines)
  const parseCsv = (text: string): string[][] => {
    // Strip BOM
    text = text.replace(/^\uFEFF/, '');
    const rows: string[][] = [];
    let row: string[] = [];
    let cell = '';
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (inQuotes) {
        if (c === '"') {
          if (text[i + 1] === '"') { cell += '"'; i++; }
          else inQuotes = false;
        } else cell += c;
      } else {
        if (c === '"') inQuotes = true;
        else if (c === ',') { row.push(cell); cell = ''; }
        else if (c === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; }
        else if (c === '\r') { /* skip */ }
        else cell += c;
      }
    }
    // last cell/row
    if (cell.length > 0 || row.length > 0) { row.push(cell); rows.push(row); }
    return rows.filter(r => r.some(c => c.trim() !== ''));
  };

  const handleCsvFile = (file: File) => {
    setError(null);
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = reader.result as string;
        console.log('📋 CSV 원본 (처음 500자):', text.substring(0, 500));
        console.log('📋 CSV 전체 길이:', text.length, '줄바꿈 수:', (text.match(/\n/g) || []).length);
        const rows = parseCsv(text);
        console.log('📋 parseCsv 결과: 행 수 =', rows.length);
        console.log('📋 첫 3행:', rows.slice(0, 3));
        if (rows.length < 2) throw new Error('데이터 행이 없습니다. 헤더 아래에 문제를 입력했는지 확인하세요.');

        const header = rows[0].map(h => h.trim());
        console.log('📋 헤더:', header);
        const idx = (name: string) => header.findIndex(h => h.toLowerCase() === name.toLowerCase());

        const iNum = idx('questionNumber'), iType = idx('questionType'), iDiff = idx('difficulty'), iMod = idx('module');
        const iPTitle = idx('passageTitle'), iPText = idx('passageText'), iScript = idx('scriptText');
        const iQText = idx('questionText'), iA = idx('optionA'), iB = idx('optionB'), iC = idx('optionC'), iD = idx('optionD');
        const iAns = idx('correctAnswer'), iExp = idx('explanation');

        const supportsModule = section === 'Reading' || section === 'Listening';
        const questions: TPOQuestion[] = [];
        const errors: string[] = [];

        for (let r = 1; r < rows.length; r++) {
          const cells = rows[r];
          try {
            const get = (i: number) => (i >= 0 && i < cells.length ? cells[i].trim() : '');
            const qType = get(iType) || (questionTypeOptions?.[0] || '');
            if (!qType && !get(iQText)) continue; // skip empty rows

            // Module suffix — 개별 입력(FillBlanksEditor)과 일치하도록 Module 1/2 모두 명시
            const modVal = get(iMod);
            const isMod2 = supportsModule && /(?:2|Module\s*2|모듈\s*2|two|second)/i.test(modVal);
            const isCW = isCompleteWordsType(qType);
            let finalType = qType;
            if (isCW) {
              finalType = qType.includes('(Module') ? qType : `${qType} (${isMod2 ? 'Module 2' : 'Module 1'})`;
            } else if (isMod2 && !qType.includes('(Module 2)')) {
              finalType = `${qType} (Module 2)`;
            }

            const options = [get(iA), get(iB), get(iC), get(iD)].filter(o => o !== '');

            const rawNum = get(iNum);
            const questionNumber = rawNum || r;
            const passageText = get(iPText) || undefined;
            let blanks: Array<{ answer: string; maxLength: number }> | undefined;
            let finalPassageText = passageText;
            if (isCW && passageText) {
              const inlineRegex = /\[([a-zA-Z][a-zA-Z\s'-]*?)(?::(\d+))?\]/g;
              const parsedBlanks: Array<{ answer: string; maxLength: number }> = [];
              let m;
              while ((m = inlineRegex.exec(passageText)) !== null) {
                const ans = m[1].trim();
                const maxLen = m[2] ? parseInt(m[2]) : ans.length;
                parsedBlanks.push({ answer: ans, maxLength: maxLen });
              }
              if (parsedBlanks.length > 0) {
                blanks = parsedBlanks;
                finalPassageText = passageText.replace(
                  /\[([A-Za-z][A-Za-z\s'-]*?)(?::(\d+))?\]/g,
                  (_match, a, n) => {
                    const ans = String(a).trim();
                    const len = n ? parseInt(n) : ans.length;
                    return `[${ans}:${len}]`;
                  }
                );
              }
            }

            questions.push({
              id: `q-${Date.now()}-${rawNum || r}-${Math.random().toString(36).slice(2, 7)}`,
              questionNumber,
              questionText: get(iQText),
              questionType: finalType,
              options,
              correctAnswer: blanks ? blanks.map(b => b.answer).join(', ') : get(iAns),
              explanation: get(iExp) || undefined,
              passageTitle: get(iPTitle) || undefined,
              passageText: finalPassageText,
              scriptText: get(iScript) || undefined,
              difficulty: (get(iDiff) || '보통') as '쉬움' | '보통' | '어려움',
              ...(blanks ? { blanks } : {}),
            } as TPOQuestion);
          } catch (rowErr: any) {
            errors.push(`행 ${r + 1}: ${rowErr?.message || '파싱 오류'}`);
          }
        }

        if (errors.length > 0) {
          setError(`${errors.length}개 행에서 오류 발생:\n${errors.slice(0, 5).join('\n')}${errors.length > 5 ? `\n... 외 ${errors.length - 5}개` : ''}`);
        }

        console.log('📋 파싱된 문제 수:', questions.length, '/ 입력 행 수:', rows.length - 1);
        console.log('📋 파싱된 문제 (첫 3개):', questions.slice(0, 3));
        console.log('📋 오류:', errors);

        if (questions.length === 0) throw new Error('문제를 찾을 수 없습니다. CSV 형식을 확인하세요.');
        // questionNumber 기준 오름차순 정렬 — Q1-Q10이 맨 앞에 오도록 (TXT 모드와 동일)
        questions.sort((a, b) => {
          const rangeA = parseQuestionRange(a.questionNumber);
          const rangeB = parseQuestionRange(b.questionNumber);
          const startA = rangeA?.start ?? 9999;
          const startB = rangeB?.start ?? 9999;
          return startA - startB;
        });
        setParsed(questions);
      } catch (err: any) {
        setError(err?.message || 'CSV 파싱 오류. 형식을 확인해주세요.');
      }
    };
    reader.onerror = () => setError('파일을 읽을 수 없습니다.');
    reader.readAsText(file, 'utf-8');
  };

  // Flag a question whose correctAnswer doesn't exactly match any option.
  // Only meaningful for multiple-choice questions (has options, no blanks).
  const answerMismatch = (q: TPOQuestion): boolean => {
    if (!q.options || q.options.length === 0) return false; // not multiple-choice
    if (q.blanks && q.blanks.length > 0) return false;       // fill-in-blanks
    if (!q.correctAnswer) return false;
    const answers = Array.isArray(q.correctAnswer) ? q.correctAnswer : [q.correctAnswer];
    const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ');
    const opts = q.options.map(norm);
    return answers.some(a => {
      const na = norm(String(a));
      if (!na) return false;
      // Accept exact option match, or a bare letter (A/B/C/D) that indexes an option.
      if (opts.includes(na)) return false;
      const letter = na.replace(/[.).]/g, '').trim();
      if (/^[a-d]$/.test(letter) && q.options!.length > (letter.charCodeAt(0) - 97)) return false;
      return true;
    });
  };

  // Complete Words 미리보기 — passageText의 빈칸을 ___로 변환해서 보여줌
  const previewCompleteWordsPassage = (passageText: string): string => {
    if (!passageText) return '';
    // peo[ple:3] 또는 peo[ple] 형태를 peo___ 로 변환
    return passageText.replace(/\[[^\]]+\]/g, '___');
  };

  if (parsed) {
    return (
      <div className="bg-white rounded-lg shadow-lg border border-green-200 p-6 animate-[fadeSlideUp_0.3s_ease-out]">
        <h3 className="text-xl font-medium text-gray-800 mb-4">
          {getTotalQuestionCount(parsed)}개 문제 파싱 완료 — {testType} {testNumber} {section}
        </h3>
        <div className="max-h-[32rem] overflow-y-auto space-y-2 mb-4">
          {parsed.map((q, i) => {
            const isCW = isCompleteWordsType(q.questionType);
            const previewPassage = isCW && q.passageText ? previewCompleteWordsPassage(q.passageText) : '';
            return (
            <div key={i} className="bg-gray-50 border rounded-lg p-3 text-sm">
              <span className="font-bold text-[#2d7a7c]">{getQuestionRangeLabel(q)}</span>
              <span className="mx-2 text-gray-400">|</span>
              <span>{q.questionType}</span>
              {q.difficulty && <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-700">{q.difficulty}</span>}
              {isCW ? (
                <>
                  {previewPassage && (
                    <p className="text-gray-600 mt-1 text-xs leading-relaxed bg-white border border-gray-200 rounded p-2 max-h-24 overflow-y-auto">
                      {previewPassage.slice(0, 200)}{previewPassage.length > 200 ? '...' : ''}
                    </p>
                  )}
                  {q.blanks && q.blanks.length > 0 && (
                    <p className="text-xs text-purple-600 mt-1">빈칸 {q.blanks.length}개 — 정답: {q.blanks.map((b: any) => b.answer).join(', ')}</p>
                  )}
                </>
              ) : (
                <>
                  <p className="text-gray-500 mt-1 truncate">{q.questionText || q.passageText?.slice(0, 80)}</p>
                  {q.options && q.options.length > 0 && (
                    <p className="text-xs text-gray-400 mt-0.5">보기: {q.options.join(' | ')}</p>
                  )}
                  {q.correctAnswer && <p className="text-xs text-green-600 mt-0.5">정답: {Array.isArray(q.correctAnswer) ? q.correctAnswer.join(', ') : q.correctAnswer}</p>}
                  {answerMismatch(q) && (
                    <p className="text-xs text-red-500 mt-0.5">⚠️ 정답이 보기 중 어느 것과도 정확히 일치하지 않습니다 — 저장 전 확인하세요.</p>
                  )}
                </>
              )}
            </div>
            );
          })}
        </div>
        <div className="flex gap-3 justify-between pt-4 border-t">
          <Button onClick={() => { setParsed(null); setRawText(''); }} variant="outline" className="text-gray-600">
            다시 입력
          </Button>
          <div className="flex gap-2">
            <Button onClick={onCancel} className="bg-gray-300 text-gray-700 hover:bg-gray-400">Cancel</Button>
            <Button onClick={() => onSubmit(parsed)} className="bg-gradient-to-r from-green-500 to-emerald-500 text-white">
              <Upload className="w-4 h-4 mr-2" /> {getTotalQuestionCount(parsed)}개 문제 저장
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 animate-[fadeSlideUp_0.3s_ease-out]">
      <h3 className="text-xl font-medium text-gray-800 mb-4">
        Bulk Upload {section} Questions — {testType} {testNumber}
      </h3>

      {/* Mode tabs */}
      <div className="flex gap-2 mb-5 bg-gray-100 rounded-lg p-1 w-fit">
        <button
          type="button"
          onClick={() => { setMode('text'); setError(null); }}
          className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors ${
            mode === 'text' ? 'bg-white shadow-sm text-[#1e6b73]' : 'text-gray-500'
          }`}
        >
          📝 텍스트 템플릿
        </button>
        <button
          type="button"
          onClick={() => { setMode('csv'); setError(null); }}
          className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors ${
            mode === 'csv' ? 'bg-white shadow-sm text-[#1e6b73]' : 'text-gray-500'
          }`}
        >
          📊 CSV/엑셀
        </button>
      </div>

      {mode === 'csv' ? (
        <>
          <p className="text-sm text-gray-500 mb-4">
            <button onClick={handleDownloadCsvTemplate} className="text-[#1e6b73] underline font-semibold">
              ⬇ CSV 템플릿 다운로드
            </button>
            {' '}후 엑셀에서 표로 편집하세요. 각 행이 문제 하나입니다.
            오디오·이미지는 <strong>파일명만</strong> 적으면 됩니다 (파일은 이후 따로 업로드).
          </p>
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 mb-4 text-xs text-amber-800 space-y-1">
            <p className="font-semibold">📌 엑셀 사용 팁</p>
            <p>• 편집 후 저장할 때 <strong>"CSV UTF-8 (쉼표로 분리)"</strong> 형식을 선택하세요 (한글 안 깨짐).</p>
            <p>• 지문(passageText)처럼 긴 글은 셀 안에 줄바꿈이 있어도 괜찮습니다.</p>
            <p>• correctAnswer는 보기(optionA~D)와 <strong>똑같이</strong> 입력하세요.</p>
            {(section === 'Reading' || section === 'Listening') && (
              <p>• module 열에 <strong>Module 2</strong>라고 적으면 Module 2 문제로 저장됩니다 (비우면 Module 1).</p>
            )}
          </div>
          <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[#2d7a7c] hover:bg-gray-50 transition-colors mb-3">
            <Upload className="w-8 h-8 text-gray-400 mb-2" />
            <span className="text-sm text-gray-500">채운 CSV 파일을 클릭해서 선택하거나 여기로 드래그</span>
            <input
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleCsvFile(f); }}
            />
          </label>
          {error && <p className="text-sm text-red-500 mb-2">{error}</p>}
          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button onClick={onCancel} className="bg-gray-300 text-gray-700 hover:bg-gray-400">Cancel</Button>
          </div>
        </>
      ) : (
        <>
          <p className="text-sm text-gray-500 mb-4">
            메모장에 작성한 텍스트를 붙여넣으세요. 문제는 <code>===</code> 구분선으로 나눕니다.
            <button onClick={handleDownloadTemplate} className="ml-2 text-[#1e6b73] underline font-semibold">
              ⬇ 템플릿 다운로드
            </button>
          </p>
          <textarea
            value={rawText}
            onChange={e => setRawText(e.target.value)}
            placeholder={getTemplate()}
            rows={16}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg font-mono text-sm mb-3 focus:ring-2 focus:ring-[#2d7a7c]"
          />
          {error && <p className="text-sm text-red-500 mb-2">{error}</p>}
          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button onClick={onCancel} className="bg-gray-300 text-gray-700 hover:bg-gray-400">Cancel</Button>
            <Button onClick={handleParse} className="bg-gradient-to-r from-[#2d7a7c] to-[#1e6b73] text-white hover:from-[#1e6b73] hover:to-[#005f61]">
              <Upload className="w-4 h-4 mr-2" /> 텍스트 파싱
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Media Matcher Panel — batch match audio/image files to questions by filename ───
function MediaMatcherPanel({
  test,
  section,
  onUpdateTest,
  onClose,
}: {
  test: TPOTest;
  section: TPOSection;
  onUpdateTest: (t: TPOTest) => void;
  onClose: () => void;
}) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadedCount, setUploadedCount] = useState(0);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sortedQs = [...section.questions].sort((a, b) => {
    const na = typeof a.questionNumber === 'number' ? a.questionNumber : parseInt(String(a.questionNumber)) || 0;
    const nb = typeof b.questionNumber === 'number' ? b.questionNumber : parseInt(String(b.questionNumber)) || 0;
    return na - nb;
  });

  const isAudio = (name: string) => /\.(mp3|wav|m4a|ogg|aac)$/i.test(name);
  const isImage = (name: string) => /\.(png|jpe?g|gif|webp|svg)$/i.test(name);

  // Extract question number from filename: "q1_audio.mp3", "1.mp3", "audio1.png", "q12.jpg" ...
  const extractQNum = (filename: string): number | null => {
    const base = filename.replace(/\.[^.]+$/, ''); // strip extension
    // Prefer explicit q-prefix: q1, q12, Q3
    const qMatch = base.match(/q\s*_?\s*(\d+)/i);
    if (qMatch) return parseInt(qMatch[1]);
    // Fallback: first number in the name
    const numMatch = base.match(/(\d+)/);
    if (numMatch) return parseInt(numMatch[1]);
    return null;
  };

  // Determine if filename hints image vs audio slot
  type Match = { file: File; qNum: number; kind: 'audio' | 'image'; matched: boolean };
  const computeMatches = (): Match[] => {
    return files.map(file => {
      const kind: 'audio' | 'image' = isImage(file.name) ? 'image' : 'audio';

      // 1) Try exact match against pending filenames declared in bulk-upload text
      const pendingMatch = sortedQs.find(q => {
        const pending = kind === 'audio' ? (q as any).pendingAudioFileName : (q as any).pendingImageFileName;
        return pending && pending.trim().toLowerCase() === file.name.trim().toLowerCase();
      });
      if (pendingMatch) {
        const n = typeof pendingMatch.questionNumber === 'number' ? pendingMatch.questionNumber : parseInt(String(pendingMatch.questionNumber));
        return { file, qNum: n, kind, matched: true };
      }

      // 2) Fallback: extract question number from filename (q1_audio.mp3, 1.mp3, ...)
      const qNum = extractQNum(file.name);
      const matched = qNum !== null && sortedQs.some(q => {
        const n = typeof q.questionNumber === 'number' ? q.questionNumber : parseInt(String(q.questionNumber));
        return n === qNum;
      });
      return { file, qNum: qNum ?? -1, kind, matched };
    });
  };

  const matches = computeMatches();
  const matchedCount = matches.filter(m => m.matched).length;
  const unmatched = matches.filter(m => !m.matched);

  const handleFilesSelected = (fileList: FileList | null) => {
    if (!fileList) return;
    const arr = Array.from(fileList).filter(f => isAudio(f.name) || isImage(f.name));
    setFiles(prev => [...prev, ...arr]);
    setError(null);
    setDone(false);
  };

  const handleUpload = async () => {
    const toUpload = matches.filter(m => m.matched);
    if (toUpload.length === 0) { setError('매칭된 파일이 없습니다. 파일명을 확인하세요 (예: q1_audio.mp3).'); return; }

    setUploading(true);
    setError(null);
    setUploadedCount(0);

    // Work on a deep-ish copy of the test
    const updatedTest: TPOTest = {
      ...test,
      sections: test.sections.map(s => s.sectionType === section.sectionType
        ? { ...s, questions: s.questions.map(q => ({ ...q })) }
        : s),
    };
    const targetSection = updatedTest.sections.find(s => s.sectionType === section.sectionType)!;

    let count = 0;
    try {
      for (const m of toUpload) {
        const q = targetSection.questions.find(qq => {
          const n = typeof qq.questionNumber === 'number' ? qq.questionNumber : parseInt(String(qq.questionNumber));
          return n === m.qNum;
        });
        if (!q) continue;

        if (m.kind === 'audio') {
          const url = await uploadToStorage(m.file, 'listening-audio');
          q.audioUrl = url;
        } else {
          const url = await uploadToStorage(m.file, 'listening-images');
          q.imageUrl = url;
        }
        count++;
        setUploadedCount(count);
      }

      onUpdateTest(updatedTest);
      setDone(true);
    } catch (err: any) {
      setError(err?.message || '업로드 중 오류가 발생했습니다. Supabase 버킷(listening-audio, listening-images)이 있는지 확인하세요.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg border border-indigo-200 p-6 animate-[fadeSlideUp_0.3s_ease-out] mb-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-medium text-gray-800">
          미디어 일괄 매칭 — {test.testType} {test.testNumber} {section.sectionType}
        </h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
      </div>

      <div className="rounded-lg bg-indigo-50 border border-indigo-200 p-3 mb-4 text-xs text-indigo-800 space-y-1">
        <p className="font-semibold">📌 파일명 규칙</p>
        <p>• 오디오: <code>q1_audio.mp3</code>, <code>1.mp3</code>, <code>q1.wav</code> 등 — 파일명에 문제 번호가 들어가면 자동 인식</p>
        <p>• 이미지: <code>q1_image.png</code>, <code>1.jpg</code>, <code>q1.png</code> 등</p>
        <p>• 파일명의 숫자로 문제를 찾아 audioUrl / imageUrl에 자동 연결합니다.</p>
      </div>

      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-indigo-400 hover:bg-gray-50 transition-colors mb-4">
        <Upload className="w-7 h-7 text-gray-400 mb-2" />
        <span className="text-sm text-gray-500">오디오·이미지 파일들을 선택하거나 여기로 드래그 (여러 개 가능)</span>
        <input
          type="file"
          multiple
          accept="audio/*,image/*"
          className="hidden"
          onChange={(e) => handleFilesSelected(e.target.files)}
        />
      </label>

      {files.length > 0 && (
        <>
          <div className="flex items-center gap-3 mb-2 text-sm">
            <span className="font-semibold text-gray-700">{files.length}개 파일</span>
            <span className="text-green-600">✅ 매칭 {matchedCount}</span>
            {unmatched.length > 0 && <span className="text-amber-600">⚠️ 미매칭 {unmatched.length}</span>}
            <button onClick={() => { setFiles([]); setDone(false); }} className="ml-auto text-xs text-gray-400 underline">전체 지우기</button>
          </div>
          <div className="max-h-64 overflow-y-auto border rounded-lg divide-y mb-4">
            {matches.map((m, i) => (
              <div key={i} className={`flex items-center gap-2 px-3 py-2 text-sm ${m.matched ? '' : 'bg-amber-50'}`}>
                <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 shrink-0">
                  {m.kind === 'audio' ? '🎵' : '🖼️'}
                </span>
                <span className="flex-1 truncate text-gray-700">{m.file.name}</span>
                {m.matched
                  ? <span className="text-green-600 text-xs shrink-0">→ Q{m.qNum} {m.kind === 'audio' ? 'audio' : 'image'}</span>
                  : <span className="text-amber-600 text-xs shrink-0">매칭 실패 (번호 확인)</span>}
              </div>
            ))}
          </div>
        </>
      )}

      {error && <p className="text-sm text-red-500 mb-2">{error}</p>}
      {done && <p className="text-sm text-green-600 mb-2 font-semibold">✅ {uploadedCount}개 파일 업로드 및 연결 완료!</p>}

      <div className="flex gap-3 justify-end pt-4 border-t">
        <Button onClick={onClose} className="bg-gray-300 text-gray-700 hover:bg-gray-400">닫기</Button>
        <Button
          onClick={handleUpload}
          disabled={uploading || matchedCount === 0}
          className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white hover:from-indigo-600 hover:to-indigo-700 disabled:opacity-50"
        >
          {uploading ? `업로드 중... (${uploadedCount}/${matchedCount})` : `${matchedCount}개 파일 업로드 & 연결`}
        </Button>
      </div>
    </div>
  );
}

// ─── Audio Splitter Panel (Listening / Speaking batch audio upload) ───
function AudioSplitterPanel({
  test,
  section,
  onUpdateTest,
  onClose,
}: {
  test: TPOTest;
  section: TPOSection;
  onUpdateTest: (t: TPOTest) => void;
  onClose: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [buffer, setBuffer] = useState<AudioBuffer | null>(null);
  const [splitMinutes, setSplitMinutes] = useState('');
  const [processing, setProcessing] = useState(false);
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const sortedQs = [...section.questions].sort((a, b) => {
    const na = typeof a.questionNumber === 'number' ? a.questionNumber : parseInt(String(a.questionNumber)) || 0;
    const nb = typeof b.questionNumber === 'number' ? b.questionNumber : parseInt(String(b.questionNumber)) || 0;
    return na - nb;
  });

  const parseSplitTimes = (): number[] => {
    if (!splitMinutes.trim()) return [];
    return splitMinutes.split(/[,\s]+/).map(s => parseFloat(s.trim())).filter(n => !isNaN(n) && n > 0).sort((a, b) => a - b);
  };

  // Auto-detect silence gaps using RMS analysis
  const detectSilenceGaps = (buf: AudioBuffer): number[] => {
    const data = buf.getChannelData(0);
    const sr = buf.sampleRate;
    const totalDur = buf.duration;
    const windowSec = 0.3; // 300ms windows
    const windowSize = Math.round(sr * windowSec);
    const minSilenceSec = 1.0; // minimum silence between questions
    const silenceThresholdRatio = 0.03; // 3% of peak amplitude = silence

    // Calculate max peak for threshold
    let maxPeak = 0;
    for (let i = 0; i < data.length; i++) { const v = Math.abs(data[i]); if (v > maxPeak) maxPeak = v; }
    const silenceThreshold = maxPeak * silenceThresholdRatio;

    // Calculate RMS for each window
    const rms: number[] = [];
    for (let start = 0; start < data.length; start += windowSize) {
      let sum = 0;
      const end = Math.min(start + windowSize, data.length);
      for (let j = start; j < end; j++) sum += data[j] * data[j];
      rms.push(Math.sqrt(sum / (end - start)));
    }

    // Find silence regions (consecutive windows below threshold)
    const silences: { start: number; end: number; gap: number }[] = [];
    let inSilence = false; let silenceStart = 0;
    for (let i = 0; i < rms.length; i++) {
      if (rms[i] < silenceThreshold) {
        if (!inSilence) { inSilence = true; silenceStart = i; }
      } else {
        if (inSilence) {
          const secStart = (silenceStart * windowSize) / sr;
          const secEnd = (i * windowSize) / sr;
          if (secEnd - secStart >= minSilenceSec) {
            silences.push({ start: secStart, end: secEnd, gap: secEnd - secStart });
          }
          inSilence = false;
        }
      }
    }
    if (inSilence) {
      const secStart = (silenceStart * windowSize) / sr;
      const secEnd = totalDur;
      if (secEnd - secStart >= minSilenceSec) {
        silences.push({ start: secStart, end: secEnd, gap: secEnd - secStart });
      }
    }

    // Sort by gap size (largest first), take midpoint as split point
    silences.sort((a, b) => b.gap - a.gap);
    const expected = sortedQs.length - 1;
    return silences.slice(0, expected).map(s => (s.start + s.end) / 2).sort((a, b) => a - b);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setError(null);
    try {
      const ctx = new AudioContext();
      const arr = await f.arrayBuffer();
      const buf = await ctx.decodeAudioData(arr);
      setBuffer(buf);
      // Auto-detect silence gaps
      const auto = detectSilenceGaps(buf);
      if (auto.length > 0) {
        setSplitMinutes(auto.map(n => n.toFixed(1)).join(', '));
      }
      drawWaveform(buf);
    } catch {
      setError('오디오 파일 디코딩에 실패했습니다.');
    }
  };

  const drawWaveform = (buf: AudioBuffer) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const cw = canvas.width = canvas.offsetWidth || 600;
    canvas.height = 120;
    const ctx = canvas.getContext('2d')!;
    const data = buf.getChannelData(0);
    const step = Math.max(1, Math.floor(data.length / cw));
    const durations = parseSplitTimes();

    if (durations.length > 0) {
      const segs = [0, ...durations.map(d => Math.round(d * buf.sampleRate)), data.length];
      for (let s = 0; s < segs.length - 1; s++) {
        const x1 = (segs[s] / data.length) * cw;
        const x2 = (segs[s + 1] / data.length) * cw;
        ctx.fillStyle = s % 2 === 0 ? '#d1fae5' : '#e0f2fe';
        ctx.fillRect(x1, 0, x2 - x1, 120);
      }
      durations.forEach(d => {
        const x = (Math.round(d * buf.sampleRate) / data.length) * cw;
        ctx.strokeStyle = '#dc2626';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 120); ctx.stroke();
      });
    }

    ctx.fillStyle = splitMinutes ? '#1e6b73' : '#94a3b8';
    for (let i = 0; i < cw; i++) {
      let peak = 0;
      for (let j = 0; j < step; j++) {
        const v = Math.abs(data[i * step + j] || 0);
        if (v > peak) peak = v;
      }
      const h = peak * 100;
      ctx.fillRect(i, 60 - h / 2, 1, Math.max(1, h));
    }
  };

  const handlePreview = () => { if (buffer) drawWaveform(buffer); };

  const handleSplitUpload = async () => {
    if (!buffer || !file) return;
    let durations = parseSplitTimes();
    if (durations.length === 0 && buffer) { durations = detectSilenceGaps(buffer); }
    if (durations.length === 0) { setError('분할 시점을 찾을 수 없습니다. 자동 감지 버튼을 눌러보거나 직접 입력해주세요.'); return; }
    const sr = buffer.sampleRate;
    const fullDur = buffer.duration;
    const segs = [0, ...durations.map(d => Math.min(d, fullDur)), fullDur];
    const count = Math.min(segs.length - 1, sortedQs.length);
    setProcessing(true);
    const updatedTest = { ...test };
    const sec = updatedTest.sections.find(s => s.sectionType === section.sectionType);
    if (!sec) { setProcessing(false); return; }

    for (let i = 0; i < count; i++) {
      setUploadingIdx(i);
      const start = segs[i], end = segs[i + 1], segLen = Math.max(1, Math.round((end - start) * sr));
      const offline = new OfflineAudioContext(1, segLen, sr);
      const src = offline.createBufferSource();
      const segBuf = offline.createBuffer(1, segLen, sr);
      const raw = buffer.getChannelData(0).slice(Math.round(start * sr), Math.round(start * sr) + segLen);
      segBuf.copyToChannel(new Float32Array(raw), 0);
      src.buffer = segBuf; src.connect(offline.destination);
      const rendered = await offline.startRendering();

      const wav = audioBufferToWavBlob(rendered);
      const f = new File([wav], `split-q${sortedQs[i]?.questionNumber || i + 1}.wav`, { type: 'audio/wav' });
      try {
        const url = await uploadToStorage(f, 'listening-audio');
        const qi = sec.questions.findIndex(q => q.id === sortedQs[i].id);
        if (qi !== -1) sec.questions[qi] = { ...sec.questions[qi], audioUrl: url };
      } catch (err: any) { console.error(`Q${sortedQs[i]?.questionNumber} upload failed:`, err); }
    }
    updatedTest.updatedAt = new Date();
    onUpdateTest(updatedTest);
    setProcessing(false); setUploadingIdx(null);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg border border-purple-200 p-6 mb-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <Music className="w-5 h-5 text-purple-600" />
          Audio Split Upload — {section.sectionType}
        </h3>
        <Button onClick={onClose} variant="outline" className="text-gray-600">닫기</Button>
      </div>
      <p className="text-sm text-gray-500 mb-4">
        긴 음성 파일 하나를 업로드하면 <strong>무음 구간을 자동 감지</strong>하여 문제별로 나눕니다. 수동 조정도 가능합니다.
      </p>

      {!file && (
        <input type="file" accept="audio/*" onChange={handleFileChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-3" />
      )}
      {file && (
        <>
          <p className="text-xs text-gray-500 mb-2">파일: <strong>{file.name}</strong> ({(buffer?.duration ?? 0).toFixed(1)}초)</p>
          <canvas ref={canvasRef} className="w-full rounded border mb-3" />

          <div className="mb-3">
            <div className="flex items-center gap-2 mb-1">
              <label className="text-xs font-semibold text-gray-600">분할 시점 (초)</label>
              <button type="button" onClick={() => {
                if (buffer) {
                  const auto = detectSilenceGaps(buffer);
                  setSplitMinutes(auto.map(n => n.toFixed(1)).join(', '));
                  drawWaveform(buffer);
                  if (auto.length === 0) setError('무음 구간을 찾을 수 없습니다. 수동으로 입력해주세요.');
                  else setError(null);
                }
              }} className="text-[10px] px-2 py-0.5 rounded bg-purple-100 text-purple-700 hover:bg-purple-200 font-semibold">
                🔍 자동 감지
              </button>
            </div>
            <input value={splitMinutes} onChange={(e) => { setSplitMinutes(e.target.value); setError(null); }}
              placeholder="자동 감지됨 — 수동 입력: 45, 90, 135" onBlur={handlePreview}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            <p className="text-[10px] text-gray-400 mt-1">
              총 {buffer?.duration.toFixed(0) ?? 0}초 · 현재 {getTotalQuestionCount(sortedQs)}개 문제
              {parseSplitTimes().length > 0 ? ` → ${Math.min(parseSplitTimes().length + 1, sortedQs.length)}개 분할 예정` : ' · 파일 선택 시 자동 감지됨'}
            </p>
          </div>
          {error && <p className="text-sm text-red-500 mb-2">{error}</p>}
          <div className="flex gap-2 justify-between">
            <Button onClick={() => { setFile(null); setBuffer(null); setSplitMinutes(''); }} variant="outline" className="text-gray-600">
              파일 다시 선택
            </Button>
            <Button onClick={handleSplitUpload} disabled={processing || parseSplitTimes().length === 0}
              className="bg-gradient-to-r from-purple-500 to-purple-700 text-white hover:from-purple-600 hover:to-purple-800 disabled:opacity-50">
              {processing ? `업로드 중 (${(uploadingIdx ?? 0) + 1}/${Math.min(parseSplitTimes().length + 1, sortedQs.length)})...` : '분할 & 업로드'}
            </Button>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-500 mb-2">분할 예측:</p>
            <div className="max-h-48 overflow-y-auto space-y-1">
              {sortedQs.map((q, i) => {
                const pts = parseSplitTimes();
                const segs = pts.length > 0 ? [0, ...pts, buffer?.duration ?? 0] : [];
                return (
                  <div key={q.id} className="flex items-center gap-2 text-xs text-gray-600 py-1 px-2 rounded bg-gray-50">
                    <span className="font-bold text-purple-700 shrink-0">{getQuestionRangeLabel(q)}</span>
                    <span className="truncate">{q.questionType}</span>
                    {segs[i] != null && segs[i + 1] != null
                      ? <span className="text-gray-400 ml-auto shrink-0">{segs[i].toFixed(1)}s → {segs[i + 1].toFixed(1)}s</span>
                      : <span className="text-gray-300 ml-auto shrink-0">-</span>}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function audioBufferToWavBlob(buffer: AudioBuffer): Blob {
  const nc = buffer.numberOfChannels, sr = buffer.sampleRate;
  const data = buffer.getChannelData(0);
  const byteRate = sr * nc * 2, blockAlign = nc * 2;
  const dataSize = data.length * blockAlign;
  const buf = new ArrayBuffer(44 + dataSize);
  const v = new DataView(buf);
  function ws(off: number, s: string) { for (let i = 0; i < s.length; i++) v.setUint8(off + i, s.charCodeAt(i)); }
  ws(0, 'RIFF'); v.setUint32(4, 36 + dataSize, true); ws(8, 'WAVE');
  ws(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, nc, true);
  v.setUint32(24, sr, true); v.setUint32(28, byteRate, true); v.setUint16(32, blockAlign, true); v.setUint16(34, 16, true);
  ws(36, 'data'); v.setUint32(40, dataSize, true);
  for (let i = 0, off = 44; i < data.length; i++, off += 2) {
    const s = Math.max(-1, Math.min(1, data[i]));
    v.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }
  return new Blob([buf], { type: 'audio/wav' });
}