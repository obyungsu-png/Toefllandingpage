import { useState } from 'react';
import { Button } from './ui/button';
import { Upload, FileText, Music, Video, Image as ImageIcon, Trash2, Edit, Eye, Plus, Book, Headphones, Mic, PenTool } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface TPOQuestion {
  id: string;
  questionNumber: number;
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
  testType: 'TPO' | 'Test';
  sections: TPOSection[];
  createdAt: Date;
  updatedAt: Date;
}

interface ContentManagementProps {
  tests: TPOTest[];
  onAddTest: (test: TPOTest) => void;
  onUpdateTest: (test: TPOTest) => void;
  onDeleteTest: (id: string) => void;
}

export function ContentManagement({ tests, onAddTest, onUpdateTest, onDeleteTest }: ContentManagementProps) {
  const [activeTestType, setActiveTestType] = useState<'TPO' | 'Test'>('TPO');
  const [selectedTestNumber, setSelectedTestNumber] = useState<number>(1);
  const [selectedSection, setSelectedSection] = useState<'Reading' | 'Listening' | 'Speaking' | 'Writing'>('Reading');
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [showBulkUploadForm, setShowBulkUploadForm] = useState(false);
  const [editingTest, setEditingTest] = useState<TPOTest | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<TPOQuestion | null>(null);
  const [previewQuestion, setPreviewQuestion] = useState<TPOQuestion | null>(null);

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
      {/* Header */}
      <div className="bg-gradient-to-r from-[#2d7a7c] to-[#1e6b73] rounded-lg p-4 md:p-6 text-white">
        <h2 className="text-xl md:text-2xl mb-1 md:mb-2">Content Management System</h2>
        <p className="text-white/90 text-sm md:text-base">Upload and manage TPO and Test content</p>
      </div>

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
            <select
              value={selectedTestNumber}
              onChange={(e) => setSelectedTestNumber(parseInt(e.target.value))}
              className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2d7a7c] focus:border-transparent text-sm md:text-base"
            >
              {Array.from({ length: activeTestType === 'TPO' ? 75 : 20 }, (_, i) => i + 1).map(num => (
                <option key={num} value={num}>
                  {activeTestType} {num}
                </option>
              ))}
            </select>
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
      <div className="flex gap-3">
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
      </div>

      {/* Upload Form */}
      <AnimatePresence>
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

              const updatedTest = { ...test };
              updatedTest.sections[sectionIndex].questions[questionIndex] = updatedQuestion;
              updatedTest.updatedAt = new Date();

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
      </AnimatePresence>

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
                  <motion.div
                    key={question.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
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
                          const updatedTest = { ...test };
                          const sectionIndex = updatedTest.sections.findIndex(s => s.sectionType === selectedSection);
                          if (sectionIndex !== -1) {
                            updatedTest.sections[sectionIndex].questions = 
                              updatedTest.sections[sectionIndex].questions.filter(q => q.id !== question.id);
                            updatedTest.updatedAt = new Date();
                            onUpdateTest(updatedTest);
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            );
          })()}
        </div>
      )}

      {/* All Tests Overview */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <h3 className="font-medium text-gray-800 mb-4">All Uploaded Tests</h3>
        
        {!tests || tests.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Book className="w-12 h-12 mx-auto mb-2 text-gray-400" />
            <p>No tests uploaded yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tests
              .filter(t => t.testType === activeTestType)
              .sort((a, b) => a.testNumber - b.testNumber)
              .map(test => {
                const stats = getTestStats(test);
                const totalQuestions = Object.values(stats).reduce((a, b) => a + b, 0);
                
                return (
                  <motion.div
                    key={test.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-medium text-gray-800">
                          {test.testType} {test.testNumber}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {totalQuestions} total questions
                        </p>
                      </div>
                      <Button
                        size="sm"
                        className="bg-red-500 text-white hover:bg-red-600"
                        onClick={() => onDeleteTest(test.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-1 text-blue-600">
                        <Book className="w-4 h-4" />
                        <span>R: {stats.Reading}</span>
                      </div>
                      <div className="flex items-center gap-1 text-green-600">
                        <Headphones className="w-4 h-4" />
                        <span>L: {stats.Listening}</span>
                      </div>
                      <div className="flex items-center gap-1 text-orange-600">
                        <Mic className="w-4 h-4" />
                        <span>S: {stats.Speaking}</span>
                      </div>
                      <div className="flex items-center gap-1 text-purple-600">
                        <PenTool className="w-4 h-4" />
                        <span>W: {stats.Writing}</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
          </div>
        )}
      </div>
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
    audioFile: null as File | null,
    videoFile: null as File | null,
    imageFile: null as File | null,
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
      duration: formData.duration || undefined,
      difficulty: formData.difficulty,
      blanks: formData.blanks
    };

    // Handle file uploads (in a real app, you'd upload to a server)
    if (formData.audioFile) {
      question.audioUrl = URL.createObjectURL(formData.audioFile);
    }
    if (formData.videoFile) {
      question.videoUrl = URL.createObjectURL(formData.videoFile);
    }
    if (formData.imageFile) {
      question.imageUrl = URL.createObjectURL(formData.imageFile);
    }

    onSubmit(question);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white rounded-lg shadow-lg border border-gray-200 p-6"
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
    </motion.div>
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
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white rounded-lg shadow-lg border border-gray-200 p-6"
    >
      <h3 className="text-xl font-medium text-gray-800 mb-4">
        Edit {section} Question - {testType} {testNumber}
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
    </motion.div>
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
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white rounded-lg shadow-lg border border-gray-200 p-6"
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
    </motion.div>
  );
}