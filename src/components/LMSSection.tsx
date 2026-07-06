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
    audioFileName: '' // Original file name for audio
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
        uploadedAt: new Date()
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
        audioFileName: ''
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

        {/* Upload Tab Content */}
        {activeTab === 'Training' && (
          <>
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-2xl font-medium text-gray-800 mb-2">LMS - Learning Resource Management</h1>
              <p className="text-gray-600">Upload and manage learning resources. Uploaded resources are automatically linked to each section.</p>
            </div>

            {/* Skills Navigation */}
            <div className="mb-6">
              <div className="flex gap-3 flex-wrap">
                {skills.map((skill) => (
                  <button
                    key={skill}
                    className={`px-6 py-3 rounded-lg font-bold text-sm transition-all duration-300 transform hover:scale-105 shadow-md ${
                      activeSkill === skill
                        ? 'bg-gradient-to-r from-[#e67e22] to-[#f39c12] text-white hover:from-[#d35400] hover:to-[#e67e22]'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400 shadow-sm'
                    }`}
                    onClick={() => setActiveSkill(skill)}
                  >
                    {skill}
                  </button>
                ))}
              </div>
            </div>

            {/* Upload Button */}
            <div className="mb-6">
              <Button
                onClick={() => setShowUploadForm(!showUploadForm)}
                className="bg-gradient-to-r from-[#2d7a7c] to-[#1e6b73] text-white hover:from-[#1e6b73] hover:to-[#005f61] shadow-lg"
              >
                <Upload className="w-5 h-5 mr-2" />
                Upload New Content
              </Button>
            </div>

            {/* Upload Form */}
            {showUploadForm && (
              <div
                className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 mb-6 animate-[fadeSlideUp_0.3s_ease-out]"
              >
                <h3 className="text-xl font-medium text-gray-800 mb-4">Upload New Content - {activeSkill}</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2d7a7c] focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Question Type</label>
                      <select
                        value={formData.questionType}
                        onChange={(e) => setFormData({ ...formData, questionType: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2d7a7c] focus:border-transparent"
                        required
                      >
                        <option value="">Select...</option>
                        {questionTypesBySkill[activeSkill].map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Level</label>
                      <select
                        value={formData.level}
                        onChange={(e) => setFormData({ ...formData, level: parseInt(e.target.value) })}
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
                        value={formData.day}
                        onChange={(e) => setFormData({ ...formData, day: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2d7a7c] focus:border-transparent"
                      >
                        {Array.from({ length: 20 }, (_, i) => (i + 1).toString().padStart(2, '0')).map(day => (
                          <option key={day} value={day}>DAY {day}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">File Type</label>
                    <div className="flex gap-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="fileType"
                          value="text"
                          checked={formData.fileType === 'text'}
                          onChange={(e) => setFormData({ ...formData, fileType: e.target.value as any })}
                          className="mr-2"
                        />
                        Text
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="fileType"
                          value="audio"
                          checked={formData.fileType === 'audio'}
                          onChange={(e) => setFormData({ ...formData, fileType: e.target.value as any })}
                          className="mr-2"
                        />
                        Audio (MP3)
                      </label>
                      {(activeSkill === 'Listening' || activeSkill === 'Speaking') && (
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="fileType"
                            value="text-audio"
                            checked={formData.fileType === 'text-audio'}
                            onChange={(e) => setFormData({ ...formData, fileType: e.target.value as any })}
                            className="mr-2"
                          />
                          Text + Audio
                        </label>
                      )}
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="fileType"
                          value="pdf"
                          checked={formData.fileType === 'pdf'}
                          onChange={(e) => setFormData({ ...formData, fileType: e.target.value as any })}
                          className="mr-2"
                        />
                        PDF
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="fileType"
                          value="image"
                          checked={formData.fileType === 'image'}
                          onChange={(e) => setFormData({ ...formData, fileType: e.target.value as any })}
                          className="mr-2"
                        />
                        Image
                      </label>
                    </div>
                  </div>

                  {formData.fileType === 'text' ? (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
                      <textarea
                        value={formData.content}
                        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2d7a7c] focus:border-transparent"
                        rows={6}
                        required
                      />
                    </div>
                  ) : formData.fileType === 'text-audio' ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Text Content (Script)</label>
                        <textarea
                          value={formData.content}
                          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2d7a7c] focus:border-transparent"
                          rows={6}
                          placeholder="Enter the audio script or text..."
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Audio File (MP3)</label>
                        <input
                          type="file"
                          accept="audio/*"
                          onChange={handleFileUpload}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2d7a7c] focus:border-transparent"
                          required
                        />
                        <p className="text-xs text-gray-500 mt-1">Upload an MP3 audio file for this content</p>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">File Upload</label>
                      <input
                        type="file"
                        accept={
                          formData.fileType === 'audio' ? 'audio/*' :
                          formData.fileType === 'pdf' ? 'application/pdf' :
                          'image/*'
                        }
                        onChange={handleFileUpload}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2d7a7c] focus:border-transparent"
                        required
                      />
                    </div>
                  )}

                  <div className="flex gap-3 justify-end">
                    <Button
                      type="button"
                      onClick={() => setShowUploadForm(false)}
                      className="bg-gray-300 text-gray-700 hover:bg-gray-400"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="bg-gradient-to-r from-[#2d7a7c] to-[#1e6b73] text-white hover:from-[#1e6b73] hover:to-[#005f61]"
                      disabled={isUploading}
                    >
                      {isUploading ? '⏳ 업로드 중...' : 'Upload'}
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {/* Content List */}
            <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-medium text-gray-800">
                    {activeSkill} Learning Resources ({filteredContents.length})
                  </h3>
                  <select
                    value={groupBy}
                    onChange={(e) => setGroupBy(e.target.value as 'type' | 'level')}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2d7a7c] focus:border-transparent text-sm"
                  >
                    <option value="type">Group by Type</option>
                    <option value="level">Group by Level</option>
                  </select>
                </div>
                
                {filteredContents.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <p>No uploaded resources yet.</p>
                  </div>
                ) : (
                  (() => {
                    // Group contents
                    const groupedContents: Record<string, LMSContent[]> = {};
                    
                    if (groupBy === 'type') {
                      // Group by question type
                      filteredContents.forEach(content => {
                        const type = content.questionType;
                        if (!groupedContents[type]) {
                          groupedContents[type] = [];
                        }
                        groupedContents[type].push(content);
                      });
                    } else {
                      // Group by level
                      filteredContents.forEach(content => {
                        const level = `Level ${content.level}`;
                        if (!groupedContents[level]) {
                          groupedContents[level] = [];
                        }
                        groupedContents[level].push(content);
                      });
                    }
                    
                    return (
                      <div className="space-y-4">
                        {Object.entries(groupedContents).map(([groupName, contents]) => {
                          const isCollapsed = collapsedGroups.has(groupName);
                          
                          return (
                            <div key={groupName} className="border border-gray-200 rounded-lg overflow-hidden">
                              {/* Group Header - Collapsible */}
                              <button
                                onClick={() => {
                                  const newCollapsed = new Set(collapsedGroups);
                                  if (newCollapsed.has(groupName)) {
                                    newCollapsed.delete(groupName);
                                  } else {
                                    newCollapsed.add(groupName);
                                  }
                                  setCollapsedGroups(newCollapsed);
                                }}
                                className="w-full px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 transition-colors flex items-center justify-between text-left"
                              >
                                <div className="flex items-center gap-3">
                                  {isCollapsed ? (
                                    <ChevronRight className="w-5 h-5 text-gray-500" />
                                  ) : (
                                    <ChevronDown className="w-5 h-5 text-gray-500" />
                                  )}
                                  <span className="font-semibold text-gray-800">
                                    {groupName}
                                  </span>
                                  <span className="px-2 py-1 bg-[#2d7a7c] text-white text-xs rounded-full">
                                    {contents.length}
                                  </span>
                                </div>
                                <span className="text-sm text-gray-500">
                                  {isCollapsed ? 'Click to expand' : 'Click to collapse'}
                                </span>
                              </button>

                              {/* Group Contents */}
                              <>
                                {!isCollapsed && (
                                  <div
                                    className="overflow-hidden animate-[fadeIn_0.2s_ease-out]"
                                  >
                                    <div className="p-3 space-y-2 bg-white">
                                      {contents.map((content) => (
                                        <div
                                          key={content.id}
                                          className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                                        >
                                          <div className="flex items-center gap-3 flex-1">
                                            <div className="w-10 h-10 rounded-lg bg-[#2d7a7c]/10 flex items-center justify-center text-[#2d7a7c]">
                                              {getFileIcon(content.fileType)}
                                            </div>
                                            <div className="flex-1">
                                              <h4 className="font-medium text-gray-800 text-sm">{content.title}</h4>
                                              <div className="flex gap-3 mt-1">
                                                {groupBy === 'level' && (
                                                  <span className="text-xs text-gray-600">{content.questionType}</span>
                                                )}
                                                {groupBy === 'type' && (
                                                  <span className="text-xs text-gray-600">Level {content.level}</span>
                                                )}
                                                <span className="text-xs text-gray-600">DAY {content.day}</span>
                                              </div>
                                            </div>
                                          </div>
                                          <div className="flex gap-2 ml-4">
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              onClick={() => setEditingContent(content)}
                                            >
                                              <Edit className="w-4 h-4" />
                                            </Button>
                                            <Button
                                              size="sm"
                                              className="bg-red-500 text-white hover:bg-red-600"
                                              onClick={() => {
                                                if (confirm('Are you sure you want to delete this content?')) {
                                                  onDeleteContent(content.id);
                                                }
                                              }}
                                            >
                                              <Trash2 className="w-4 h-4" />
                                            </Button>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()
                )}
              </div>
            </div>
          </>
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
                      const updatedContent: LMSContent = {
                        ...editingContent,
                        title: formData.get('title') as string,
                        questionType: formData.get('questionType') as string,
                        level: parseInt(formData.get('level') as string),
                        day: formData.get('day') as string,
                        content: formData.get('content') as string || editingContent.content,
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