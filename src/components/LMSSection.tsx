import { lazy, Suspense, useState } from 'react';
import { Button } from './ui/button';
import { Upload, FileText, Music, Image as ImageIcon, FileCheck, Trash2, Settings, BookOpen, Book, Users, ChevronDown, ChevronRight, Edit, Megaphone } from 'lucide-react';
// motion removed - using CSS animations
import { SubscriptionManagement } from './SubscriptionManagement';
import type { TPOTest } from './ContentManagement';
import { VocabularyManagement, VocabularyDay } from './VocabularyManagement';
import { StudentManagement, Student, VocabularyScore } from './StudentManagement';
import { AdManagement } from './AdManagement';
import { SATWord } from './vocaWordSets';
import { SERVER_BASE_URL, getServerHeaders } from '../utils/apiConfig';

const ContentManagement = lazy(() =>
  import('./ContentManagement').then(module => ({ default: module.ContentManagement }))
);
const QuestionTypeCMS = lazy(() =>
  import('./QuestionTypeCMS').then(module => ({ default: module.QuestionTypeCMS }))
);

export interface LMSContent {
  id: string;
  title: string;
  skill: 'Reading' | 'Listening' | 'Speaking' | 'Writing';
  questionType: string;
  level: number;
  day: string;
  fileType: 'text' | 'audio' | 'pdf' | 'image' | 'text-audio';
  fileUrl?: string;
  content?: string;
  uploadedAt: Date;
  /** 객관식 문제 선택지 (2~4개). 있으면 이 콘텐츠는 객관식 문제로 취급됨 */
  options?: string[];
  /** 정답 — options 중 하나와 정확히 일치하는 문자열 */
  correctAnswer?: string;
  /** 정답 해설 (선택) */
  explanation?: string;
  // ── TPO CMS 스타일 확장 필드 (선택) ──
  /** 문제 번호 */
  questionNumber?: number | string;
  /** 난이도 */
  difficulty?: '쉬움' | '보통' | '어려움';
  /** 지문 제목 (Reading) */
  passageTitle?: string;
  /** 지문 본문 (Reading / Writing) */
  passageText?: string;
  /** 오디오 스크립트 (Listening / Speaking) */
  scriptText?: string;
  /** Dictation 빈칸 키워드 (Listening) */
  dictationBlanks?: string;
  /** Organization 요약 (Listening) */
  organization?: string;
  /** Organization 빈칸 키워드 (Listening) */
  organizationBlanks?: string;
  /** 문제 텍스트 (질문 본문) */
  questionText?: string;
  /** 오디오 URL (Listening / Speaking) */
  audioUrl?: string;
  /** 이미지 URL */
  imageUrl?: string;
  /** Complete Words 빈칸 */
  blanks?: Array<{ answer: string; maxLength: number }>;
  /** Build a Sentence 단어 배열 */
  words?: string[];
  /** Build a Sentence 끝부호 */
  sentenceEnding?: '.' | '?';
  /** Build a Sentence / Writing 상황 설명 */
  context?: string;
}

interface LMSSectionProps {
  contents: LMSContent[];
  onAddContent: (content: LMSContent) => void;
  onUpdateContent?: (content: LMSContent) => void;
  onDeleteContent: (id: string) => void;
  tpoTests: TPOTest[];
  onAddTest: (test: TPOTest) => void;
  onUpdateTest: (test: TPOTest) => void;
  onDeleteTest: (id: string) => void;
  vocabularyWords: SATWord[];
  vocabularyDays: VocabularyDay[];
  onAddWord: (word: SATWord, day: number) => void;
  onUpdateWord: (oldWord: SATWord, newWord: SATWord, day: number) => void;
  onDeleteWord: (word: SATWord, day: number) => void;
  onAddDay: (dayName: string) => void;
  onUpdateDay: (dayId: number, newName: string) => void;
  onDeleteDay: (dayId: number) => void;
  students: Student[];
  onAddStudent: (student: Student) => void;
  onUpdateStudent: (student: Student) => void;
  onDeleteStudent: (id: string) => void;
  vocabularyScores: VocabularyScore[];
  onAddVocabularyScore: (score: VocabularyScore) => void;
  onUpdateVocabularyScore: (score: VocabularyScore) => void;
  onDeleteVocabularyScore: (id: string) => void;
  shareConfig?: any;
  onShareConfigChange?: (config: any) => void;
}

export function LMSSection({ 
  contents, 
  onAddContent, 
  onUpdateContent,
  onDeleteContent, 
  tpoTests, 
  onAddTest, 
  onUpdateTest, 
  onDeleteTest,
  vocabularyWords,
  vocabularyDays,
  onAddWord,
  onUpdateWord,
  onDeleteWord,
  onAddDay,
  onUpdateDay,
  onDeleteDay,
  students,
  onAddStudent,
  onUpdateStudent,
  onDeleteStudent,
  vocabularyScores,
  onAddVocabularyScore,
  onUpdateVocabularyScore,
  onDeleteVocabularyScore
}: LMSSectionProps) {
  const [activeTab, setActiveTab] = useState<'TPO/Test' | 'Training' | 'Vocabulary' | 'Subscription' | 'Students' | 'Advertisements'>('TPO/Test');
  const [activeSkill, setActiveSkill] = useState<'Reading' | 'Listening' | 'Speaking' | 'Writing'>('Reading');
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [groupBy, setGroupBy] = useState<'type' | 'level'>('type');
  const [editingContent, setEditingContent] = useState<LMSContent | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    questionType: '',
    level: 1,
    day: '01',
    fileType: 'text' as 'text' | 'audio' | 'pdf' | 'image' | 'text-audio',
    content: '',
    audioFile: '', // For text-audio combination
    audioFileName: '', // Original file name for audio
    isMultipleChoice: false,
    options: ['', '', '', ''],
    correctAnswer: '',
    explanation: '',
  });

  const skills: ('Reading' | 'Listening' | 'Speaking' | 'Writing')[] = ['Reading', 'Listening', 'Speaking', 'Writing'];

  // Question types by skill
  const questionTypesBySkill = {
    Reading: ['Complete Words', 'Read in Daily Life', 'Read an Academic Passage'],
    Listening: ['Listen and Response', 'Short Conversation', 'Announcements', 'Academic Talk'],
    Speaking: ['Listen and Repeat', 'Take an Interview'],
    Writing: ['Build a Sentence', 'Write an Email', 'Academic Discussion', 'Essay Structure', 'Paraphrasing']
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      
      // For text-audio type, store audio in separate field
      if (formData.fileType === 'text-audio') {
        setFormData({ ...formData, audioFile: content, audioFileName: file.name });
      } else {
        setFormData({ ...formData, content });
      }
    };

    // Auto-detect file type for non text-audio uploads
    if (formData.fileType !== 'text-audio') {
      if (file.type.startsWith('audio/')) {
        setFormData({ ...formData, fileType: 'audio' });
      } else if (file.type === 'application/pdf') {
        setFormData({ ...formData, fileType: 'pdf' });
      } else if (file.type.startsWith('image/')) {
        setFormData({ ...formData, fileType: 'image' });
      }
    }

    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    
    try {
      let fileUrl = formData.content;
      
      // If there's an audio file, upload it to Supabase Storage first
      if (formData.audioFile && (formData.fileType === 'text-audio' || formData.fileType === 'audio')) {
        const response = await fetch(
          `${SERVER_BASE_URL}/upload-file`,
          {
            method: 'POST',
            headers: {
              ...getServerHeaders(),
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              fileData: formData.audioFile,
              fileName: formData.audioFileName || 'audio.mp3',
              fileType: 'audio/mpeg'
            })
          }
        );
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.details || 'Failed to upload file');
        }
        
        const data = await response.json();
        fileUrl = data.fileUrl;
        console.log('✅ Audio file uploaded to Supabase Storage:', fileUrl);
      }
      
      const cleanedOptions = formData.isMultipleChoice
        ? formData.options.map(o => o.trim()).filter(o => o.length > 0)
        : [];

      const newContent: LMSContent = {
        id: Date.now().toString(),
        title: formData.title,
        skill: activeSkill,
        questionType: formData.questionType,
        level: formData.level,
        day: formData.day,
        fileType: formData.fileType,
        content: formData.fileType === 'text-audio' ? formData.content : fileUrl,
        fileUrl: formData.fileType === 'text-audio' ? fileUrl : undefined,
        uploadedAt: new Date(),
        ...(formData.isMultipleChoice && cleanedOptions.length >= 2 && formData.correctAnswer
          ? { options: cleanedOptions, correctAnswer: formData.correctAnswer, explanation: formData.explanation || undefined }
          : {}),
      };

      onAddContent(newContent);
      setFormData({
        title: '',
        questionType: '',
        level: 1,
        day: '01',
        fileType: 'text',
        content: '',
        audioFile: '',
        audioFileName: '',
        isMultipleChoice: false,
        options: ['', '', '', ''],
        correctAnswer: '',
        explanation: '',
      });
      setShowUploadForm(false);
    } catch (error) {
      console.error('❌ Error uploading content:', error);
      alert(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsUploading(false);
    }
  };

  const filteredContents = contents.filter(c => c.skill === activeSkill);

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'audio': return <Music className="w-5 h-5" />;
      case 'pdf': return <FileText className="w-5 h-5" />;
      case 'image': return <ImageIcon className="w-5 h-5" />;
      default: return <FileCheck className="w-5 h-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="relative">
            {/* Scrollable Tab Container with visible scrollbar */}
            <div className="flex gap-3 overflow-x-auto pb-2 scroll-smooth" style={{ scrollbarWidth: 'thin', scrollbarColor: '#2d7a7c #e5e7eb' }}>
              <button
                onClick={() => setActiveTab('TPO/Test')}
                className={`flex items-center gap-2 px-4 md:px-6 py-3 rounded-lg font-bold transition-all text-sm md:text-base whitespace-nowrap ${
                  activeTab === 'TPO/Test'
                    ? 'bg-[#2d5a5d] text-white shadow-lg'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                <BookOpen className="w-4 h-4 md:w-5 md:h-5" />
                <span className="hidden sm:inline">TPO/Test</span>
                <span className="sm:hidden">TPO</span>
              </button>
              <button
                onClick={() => setActiveTab('Training')}
                className={`flex items-center gap-2 px-4 md:px-6 py-3 rounded-lg font-bold transition-all text-sm md:text-base whitespace-nowrap ${
                  activeTab === 'Training'
                    ? 'bg-[#2d5a5d] text-white shadow-lg'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                <Upload className="w-4 h-4 md:w-5 md:h-5" />
                <span className="hidden sm:inline">Upload Content</span>
                <span className="sm:hidden">Upload</span>
              </button>
              <button
                onClick={() => setActiveTab('Vocabulary')}
                className={`flex items-center gap-2 px-4 md:px-6 py-3 rounded-lg font-bold transition-all text-sm md:text-base whitespace-nowrap ${
                  activeTab === 'Vocabulary'
                    ? 'bg-[#2d5a5d] text-white shadow-lg'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                <Book className="w-4 h-4 md:w-5 md:h-5" />
                <span className="hidden sm:inline">Vocabulary Management</span>
                <span className="sm:hidden">Vocabulary</span>
              </button>
              <button
                onClick={() => setActiveTab('Subscription')}
                className={`flex items-center gap-2 px-4 md:px-6 py-3 rounded-lg font-bold transition-all text-sm md:text-base whitespace-nowrap ${
                  activeTab === 'Subscription'
                    ? 'bg-[#2d5a5d] text-white shadow-lg'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                <Settings className="w-4 h-4 md:w-5 md:h-5" />
                <span className="hidden sm:inline">Subscription Management</span>
                <span className="sm:hidden">구독</span>
              </button>
              <button
                onClick={() => setActiveTab('Students')}
                className={`flex items-center gap-2 px-4 md:px-6 py-3 rounded-lg font-bold transition-all text-sm md:text-base whitespace-nowrap ${
                  activeTab === 'Students'
                    ? 'bg-[#2d5a5d] text-white shadow-lg'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                <Users className="w-4 h-4 md:w-5 md:h-5" />
                <span className="hidden sm:inline">Student Management</span>
                <span className="sm:hidden">학생</span>
              </button>
              <button
                onClick={() => setActiveTab('Advertisements')}
                className={`flex items-center gap-2 px-4 md:px-6 py-3 rounded-lg font-bold transition-all text-sm md:text-base whitespace-nowrap ${
                  activeTab === 'Advertisements'
                    ? 'bg-[#2d5a5d] text-white shadow-lg'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                <Megaphone className="w-4 h-4 md:w-5 md:h-5" />
                <span className="hidden sm:inline">Ad Management</span>
                <span className="sm:hidden">광고</span>
              </button>
            </div>
            {/* Scroll hint indicator */}
            <div className="absolute right-0 top-0 bottom-2 w-12 bg-gradient-to-l from-gray-50 to-transparent pointer-events-none"></div>
          </div>
        </div>

        {/* TPO/Test Tab Content */}
        {activeTab === 'TPO/Test' && (
          <Suspense fallback={<div className="p-6 text-center text-gray-500">Loading content management...</div>}>
            <ContentManagement
              tpoTests={tpoTests}
              onAddTest={onAddTest}
              onUpdateTest={onUpdateTest}
              onDeleteTest={onDeleteTest}
            />
          </Suspense>
        )}

        {/* Upload Tab Content — QuestionTypeCMS (TPO CMS와 동일한 틀) */}
        {activeTab === 'Training' && (
          <Suspense fallback={<div className="py-12 text-center text-gray-400">Loading...</div>}>
            <QuestionTypeCMS
              contents={contents}
              onAddContent={onAddContent}
              onUpdateContent={onUpdateContent}
              onDeleteContent={onDeleteContent}
            />
          </Suspense>
        )}


        {/* Vocabulary Tab Content */}
        {activeTab === 'Vocabulary' && (
          <VocabularyManagement
            words={vocabularyWords}
            days={vocabularyDays}
            onAddWord={onAddWord}
            onUpdateWord={onUpdateWord}
            onDeleteWord={onDeleteWord}
            onAddDay={onAddDay}
            onUpdateDay={onUpdateDay}
            onDeleteDay={onDeleteDay}
          />
        )}

        {/* Subscription Tab Content */}
        {activeTab === 'Subscription' && (
          <SubscriptionManagement />
        )}

        {/* Students Tab Content */}
        {activeTab === 'Students' && (
          <StudentManagement
            students={students}
            scores={vocabularyScores}
            onAddStudent={onAddStudent}
            onUpdateStudent={onUpdateStudent}
            onDeleteStudent={onDeleteStudent}
            onAddScore={onAddVocabularyScore}
            onDeleteStudentData={(studentId) => {
              // Delete all scores for this student
              vocabularyScores
                .filter(score => score.studentId === studentId)
                .forEach(score => onDeleteVocabularyScore(score.id));
              // Delete the student
              onDeleteStudent(studentId);
            }}
          />
        )}

        {/* Advertisements Tab Content */}
        {activeTab === 'Advertisements' && (
          <AdManagement />
        )}
      </div>

      {/* Edit Content Modal */}
      <>
        {editingContent && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div
              className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-[scaleIn_0.2s_ease-out]"
            >
              <div className="p-6">
                <h3 className="text-xl font-medium text-gray-800 mb-4">Edit Content</h3>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (onUpdateContent && editingContent) {
                      const formData = new FormData(e.currentTarget);
                      const allOptions = [0, 1, 2, 3].map(i => (formData.get(`option${i}`) as string || '').trim());
                      const correctIdx = formData.get('correctAnswerRadio') as string;
                      const isMC = formData.get('isMultipleChoice') === 'on';
                      const correctAnswerText = isMC && correctIdx !== null && correctIdx !== '' ? allOptions[parseInt(correctIdx)] : '';
                      const cleanedOptions = allOptions.filter(Boolean);
                      const updatedContent: LMSContent = {
                        ...editingContent,
                        title: formData.get('title') as string,
                        questionType: formData.get('questionType') as string,
                        level: parseInt(formData.get('level') as string),
                        day: formData.get('day') as string,
                        content: formData.get('content') as string || editingContent.content,
                        options: isMC && cleanedOptions.length >= 2 ? cleanedOptions : undefined,
                        correctAnswer: isMC && correctAnswerText ? correctAnswerText : undefined,
                        explanation: isMC ? ((formData.get('explanation') as string) || undefined) : undefined,
                      };
                      onUpdateContent(updatedContent);
                      setEditingContent(null);
                    }
                  }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                      <input
                        type="text"
                        name="title"
                        defaultValue={editingContent.title}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2d7a7c] focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Question Type</label>
                      <select
                        name="questionType"
                        defaultValue={editingContent.questionType}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2d7a7c] focus:border-transparent"
                        required
                      >
                        {questionTypesBySkill[editingContent.skill].map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Level</label>
                      <select
                        name="level"
                        defaultValue={editingContent.level}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2d7a7c] focus:border-transparent"
                      >
                        {[1, 2, 3, 4, 5, 6].map(level => (
                          <option key={level} value={level}>Level {level}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">DAY</label>
                      <select
                        name="day"
                        defaultValue={editingContent.day}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2d7a7c] focus:border-transparent"
                      >
                        {Array.from({ length: 20 }, (_, i) => (i + 1).toString().padStart(2, '0')).map(day => (
                          <option key={day} value={day}>DAY {day}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {editingContent.fileType === 'text' && editingContent.content && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
                      <textarea
                        name="content"
                        defaultValue={editingContent.content}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2d7a7c] focus:border-transparent"
                        rows={6}
                      />
                    </div>
                  )}

                  {editingContent.fileType === 'text-audio' && editingContent.content && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Text Content (Script)</label>
                      <textarea
                        name="content"
                        defaultValue={editingContent.content}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2d7a7c] focus:border-transparent"
                        rows={6}
                      />
                    </div>
                  )}

                  {/* 객관식 문제 수정 */}
                  <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <label className="flex items-center gap-2 mb-3">
                      <input
                        type="checkbox"
                        name="isMultipleChoice"
                        defaultChecked={!!editingContent.options?.length}
                        className="w-4 h-4"
                      />
                      <span className="text-sm font-medium text-gray-700">객관식 문제로 만들기 (선택지 + 정답 + 해설)</span>
                    </label>
                    <div className="space-y-2">
                      {[0, 1, 2, 3].map((idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="correctAnswerRadio"
                            value={idx}
                            defaultChecked={editingContent.options?.[idx] !== undefined && editingContent.options[idx] === editingContent.correctAnswer}
                            className="shrink-0"
                          />
                          <input
                            type="text"
                            name={`option${idx}`}
                            defaultValue={editingContent.options?.[idx] || ''}
                            placeholder={`선택지 ${idx + 1}`}
                            className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#2d7a7c] focus:border-transparent"
                          />
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-1 mb-2">왼쪽 라디오 버튼으로 정답을 선택해주세요.</p>
                    <textarea
                      name="explanation"
                      defaultValue={editingContent.explanation || ''}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#2d7a7c] focus:border-transparent"
                      rows={2}
                      placeholder="정답 해설을 입력하세요 (선택 사항)"
                    />
                  </div>

                  <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
                    <Button
                      type="button"
                      onClick={() => setEditingContent(null)}
                      className="bg-gray-300 text-gray-700 hover:bg-gray-400"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="bg-gradient-to-r from-[#2d7a7c] to-[#1e6b73] text-white hover:from-[#1e6b73] hover:to-[#005f61]"
                    >
                      Save Changes
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </>
    </div>
  );
}
