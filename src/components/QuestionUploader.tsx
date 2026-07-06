import { useState } from 'react';
import { Button } from './ui/button';
import { Upload } from 'lucide-react';

export interface TPOQuestion {
  id: string;
  questionNumber: number | string;
  questionText: string;
  questionType: string;
  options?: string[];
  correctAnswer?: string | string[];
  explanation?: string;
  audioUrl?: string;
  videoUrl?: string;
  imageUrl?: string;
  passageText?: string;
  duration?: number;
  difficulty?: '쉬움' | '보통' | '어려움';
  blanks?: Array<{
    answer: string;
    maxLength: number;
  }>;
  avatar1ImageUrl?: string;
  avatar2ImageUrl?: string;
  words?: string[];
  passageAudioUrl?: string;
  passageImageUrl?: string;
  passageTitle?: string;
  questionGroupId?: string;
  translationNote?: string;
  vocabularyNote?: string;
}

const GROUPED_LISTENING_TYPES = ['Short Conversation', 'Announcements', 'Academic Talk', 'Campus Conversation', 'Academic Lecture'];

function isGroupedListeningType(type: string): boolean {
  return GROUPED_LISTENING_TYPES.includes(type);
}

function getDefaultPassageTitle(type: string): string {
  switch (type) {
    case 'Short Conversation': return 'Listen to a conversation.';
    case 'Campus Conversation': return 'Listen to a conversation.';
    case 'Announcements': return 'Listen to an announcement.';
    case 'Academic Talk': return 'Listen to a talk.';
    case 'Academic Lecture': return 'Listen to a lecture.';
    default: return '';
  }
}

interface QuestionUploadFormProps {
  testType: 'TPO' | 'Test' | 'Training';
  testNumber: number;
  section: 'Reading' | 'Listening' | 'Speaking' | 'Writing';
  questionTypes: string[];
  onSubmit: (question: TPOQuestion) => void;
  onCancel: () => void;
}

export function QuestionUploadForm({ testType, testNumber, section, questionTypes, onSubmit, onCancel }: QuestionUploadFormProps) {
  const [formData, setFormData] = useState({
    questionNumber: 1,
    questionText: '',
    questionType: questionTypes[0],
    options: ['', '', '', ''],
    correctAnswer: '',
    explanation: '',
    translationNote: '',
    vocabularyNote: '',
    passageText: '',
    audioFile: null as File | null,
    audioUrl: '',
    videoFile: null as File | null,
    videoUrl: '',
    imageFile: null as File | null,
    imageUrl: '',
    duration: 0,
    difficulty: '보통' as '쉬움' | '보통' | '어려움',
    blanks: [] as Array<{ answer: string; maxLength: number }>,
    avatar1ImageUrl: '',
    avatar2ImageUrl: '',
    passageAudioUrl: '',
    passageAudioFile: null as File | null,
    passageImageUrl: '',
    passageImageFile: null as File | null,
    passageTitle: '',
    subQuestions: [{ questionText: '', options: ['', '', '', ''], correctAnswer: '', explanation: '', imageUrl: '' }] as Array<{ questionText: string; options: string[]; correctAnswer: string; explanation: string; imageUrl: string }>
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Grouped Listening type - submit multiple questions
    if (section === 'Listening' && isGroupedListeningType(formData.questionType)) {
      const groupId = `group-${Date.now()}`;
      let passageAudio = '';
      let passageImage = '';

      if (formData.passageAudioUrl.trim()) {
        passageAudio = formData.passageAudioUrl.trim();
      } else if (formData.passageAudioFile) {
        passageAudio = URL.createObjectURL(formData.passageAudioFile);
      }

      if (formData.passageImageUrl.trim()) {
        passageImage = formData.passageImageUrl.trim();
      } else if (formData.passageImageFile) {
        passageImage = URL.createObjectURL(formData.passageImageFile);
      }

      formData.subQuestions.forEach((sq, index) => {
        const question: TPOQuestion = {
          id: `q-${Date.now()}-${index}`,
          questionNumber: formData.questionNumber + index,
          questionText: sq.questionText,
          questionType: formData.questionType,
          options: sq.options.filter(o => o.trim() !== ''),
          correctAnswer: sq.correctAnswer,
          explanation: sq.explanation || undefined,
          imageUrl: sq.imageUrl || undefined,
          questionGroupId: groupId,
          passageAudioUrl: passageAudio || undefined,
          passageImageUrl: passageImage || undefined,
          passageTitle: formData.passageTitle || undefined,
          difficulty: formData.difficulty,
        };
        onSubmit(question);
      });
      return;
    }

    const question: TPOQuestion = {
      id: `q-${Date.now()}`,
      questionNumber: formData.questionNumber,
      questionText: formData.questionText,
      questionType: formData.questionType,
      options: formData.options.filter(o => o.trim() !== ''),
      correctAnswer: formData.correctAnswer,
      explanation: formData.explanation,
      translationNote: formData.translationNote || undefined,
      vocabularyNote: formData.vocabularyNote || undefined,
      passageText: formData.passageText || undefined,
      duration: formData.duration || undefined,
      difficulty: formData.difficulty,
      blanks: formData.blanks,
      avatar1ImageUrl: formData.avatar1ImageUrl || undefined,
      avatar2ImageUrl: formData.avatar2ImageUrl || undefined
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

  const isGrouped = section === 'Listening' && isGroupedListeningType(formData.questionType);

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
              {isGrouped ? 'Starting Question Number' : 'Question Number'}
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
              onChange={(e) => {
                const newType = e.target.value;
                setFormData({
                  ...formData,
                  questionType: newType,
                  ...(isGroupedListeningType(newType) ? { passageTitle: getDefaultPassageTitle(newType) } : {})
                });
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2d7a7c] focus:border-transparent"
            >
              {questionTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Listening Grouped Type: Passage Info + Sub-Questions */}
        {isGrouped && (
          <>
            {/* Passage Information */}
            <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="text-sm font-semibold text-blue-800">🎧 Passage Information</h4>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Passage Title</label>
                <input
                  type="text"
                  value={formData.passageTitle}
                  onChange={(e) => setFormData({ ...formData, passageTitle: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2d7a7c] focus:border-transparent"
                  placeholder="Listen to a conversation."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Passage Audio</label>
                <input
                  type="text"
                  value={formData.passageAudioUrl}
                  onChange={(e) => setFormData({ ...formData, passageAudioUrl: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2d7a7c] focus:border-transparent"
                  placeholder="Audio URL"
                />
                <input
                  type="file"
                  accept="audio/*"
                  onChange={(e) => setFormData({ ...formData, passageAudioFile: e.target.files?.[0] || null })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg mt-1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Passage Image</label>
                <input
                  type="text"
                  value={formData.passageImageUrl}
                  onChange={(e) => setFormData({ ...formData, passageImageUrl: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2d7a7c] focus:border-transparent"
                  placeholder="Image URL"
                />
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFormData({ ...formData, passageImageFile: e.target.files?.[0] || null })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg mt-1"
                />
                {formData.passageImageUrl && (
                  <img src={formData.passageImageUrl} alt="Preview" className="mt-2 w-32 h-auto rounded" />
                )}
              </div>
            </div>

            {/* Sub-Questions */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-gray-800">📝 Questions ({formData.subQuestions.length})</h4>
                <button
                  type="button"
                  onClick={() => setFormData({
                    ...formData,
                    subQuestions: [...formData.subQuestions, { questionText: '', options: ['', '', '', ''], correctAnswer: '', explanation: '', imageUrl: '' }]
                  })}
                  className="text-sm px-3 py-1 bg-[#2d7a7c] text-white rounded-lg hover:bg-[#1e6b73]"
                >
                  + Add Question
                </button>
              </div>

              {formData.subQuestions.map((sq, sqIdx) => (
                <div key={sqIdx} className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Question {formData.questionNumber + sqIdx}</span>
                    {formData.subQuestions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, subQuestions: formData.subQuestions.filter((_, i) => i !== sqIdx) })}
                        className="text-xs text-red-500 hover:text-red-700"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <textarea
                    value={sq.questionText}
                    onChange={(e) => {
                      const newSQ = [...formData.subQuestions];
                      newSQ[sqIdx] = { ...newSQ[sqIdx], questionText: e.target.value };
                      setFormData({ ...formData, subQuestions: newSQ });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    rows={2}
                    placeholder="Question text..."
                  />

                  <input
                    type="text"
                    value={sq.imageUrl}
                    onChange={(e) => {
                      const newSQ = [...formData.subQuestions];
                      newSQ[sqIdx] = { ...newSQ[sqIdx], imageUrl: e.target.value };
                      setFormData({ ...formData, subQuestions: newSQ });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    placeholder="Question Image URL (optional)"
                  />

                  <div className="grid grid-cols-2 gap-2">
                    {sq.options.map((opt, optIdx) => (
                      <input
                        key={optIdx}
                        type="text"
                        value={opt}
                        onChange={(e) => {
                          const newSQ = [...formData.subQuestions];
                          const newOpts = [...newSQ[sqIdx].options];
                          newOpts[optIdx] = e.target.value;
                          newSQ[sqIdx] = { ...newSQ[sqIdx], options: newOpts };
                          setFormData({ ...formData, subQuestions: newSQ });
                        }}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        placeholder={`Option ${optIdx + 1}`}
                      />
                    ))}
                  </div>

                  <select
                    value={sq.correctAnswer}
                    onChange={(e) => {
                      const newSQ = [...formData.subQuestions];
                      newSQ[sqIdx] = { ...newSQ[sqIdx], correctAnswer: e.target.value };
                      setFormData({ ...formData, subQuestions: newSQ });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="">Select correct answer...</option>
                    {sq.options.filter(o => o.trim() !== '').map((opt, i) => (
                      <option key={i} value={opt}>{opt}</option>
                    ))}
                  </select>

                  <textarea
                    value={sq.explanation}
                    onChange={(e) => {
                      const newSQ = [...formData.subQuestions];
                      newSQ[sqIdx] = { ...newSQ[sqIdx], explanation: e.target.value };
                      setFormData({ ...formData, subQuestions: newSQ });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    rows={2}
                    placeholder="Explanation (optional)"
                  />
                </div>
              ))}
            </div>
          </>
        )}

        {/* Passage Text (for Reading) */}
        {section === 'Reading' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Passage Text
              {formData.questionType === 'Complete Words' && (
                <span className="ml-2 text-xs text-blue-600 font-normal">
                  (빈칸넣기: 빈칸 위치�?[정답:최대길이] 형식으로 입력하세�? �? mi[ght:3])
                </span>
              )}
            </label>
            {formData.questionType === 'Complete Words' && (
              <div className="mb-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <p className="text-sm font-medium text-orange-800 mb-1">
                  📝 빈칸넣기 문제 입력 방법
                </p>
                <p className="text-xs text-orange-700">
                  빈칸 문제는 하나의 지문에 10개의 빈칸을 모두 포함하여 입력합니다.<br/>
                  지문에서 빈칸으로 만들 부분을 [정답:최대길이] 형식으로 표시하세요.<br/>
                  예: "We mi[ght:3] think th[at:2] early humans performed dances..."<br/>
                  반드시 10개의 빈칸을 입력해야 합니다.
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
                  감지�?빈칸: {formData.blanks.length}�?
                </p>
                <div className="flex flex-wrap gap-2">
                  {formData.blanks.map((blank, idx) => (
                    <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                      #{idx + 1}: "{blank.answer}" (최대 {blank.maxLength}�?
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Audio Upload (for Listening/Speaking) */}
        {!isGrouped && (section === 'Listening' || section === 'Speaking') && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Audio File</label>
            <input
              type="text"
              value={formData.audioUrl}
              onChange={(e) => setFormData({ ...formData, audioUrl: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2d7a7c] focus:border-transparent"
              placeholder="파일 선택 또는 파일 URL"
            />
            <input
              type="file"
              accept="audio/*"
              onChange={(e) => setFormData({ ...formData, audioFile: e.target.files?.[0] || null })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2d7a7c] focus:border-transparent"
            />
          </div>
        )}

        {/* Video Upload */}
        {!isGrouped && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Video File (Optional)</label>
          <input
            type="text"
            value={formData.videoUrl}
            onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2d7a7c] focus:border-transparent"
            placeholder="파일 선택 또는 파일 URL 입력"
          />
          <input
            type="file"
            accept="video/*"
            onChange={(e) => setFormData({ ...formData, videoFile: e.target.files?.[0] || null })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2d7a7c] focus:border-transparent"
          />
        </div>
        )}

        {/* Image Upload (for Speaking) */}
        {(section === 'Speaking' || section === 'Listening') && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Image File (Optional)</label>
            <input
              type="text"
              value={formData.imageUrl}
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2d7a7c] focus:border-transparent"
              placeholder="파일 선택 또는 파일 URL 입력"
            />
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFormData({ ...formData, imageFile: e.target.files?.[0] || null })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2d7a7c] focus:border-transparent"
            />
          </div>
        )}

        {/* Question Text */}
        {!isGrouped && (
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

        {/* Answer Options */}
        {!isGrouped && (section === 'Reading' || section === 'Listening') && formData.questionType !== 'Complete Words' && (
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

        {/* Avatar Image URLs (for Writing Build Sentence questions) */}
        {section === 'Writing' && (
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h4 className="text-sm font-semibold text-gray-700">Avatar Images (Build a Sentence)</h4>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Question Person Avatar (Image URL)</label>
              <input
                type="url"
                value={formData.avatar1ImageUrl}
                onChange={(e) => setFormData({ ...formData, avatar1ImageUrl: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2d7a7c] focus:border-transparent"
                placeholder="https://example.com/avatar1.jpg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Answer Person Avatar (Image URL)</label>
              <input
                type="url"
                value={formData.avatar2ImageUrl}
                onChange={(e) => setFormData({ ...formData, avatar2ImageUrl: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2d7a7c] focus:border-transparent"
                placeholder="https://example.com/avatar2.jpg"
              />
            </div>
            {(formData.avatar1ImageUrl || formData.avatar2ImageUrl) && (
              <div className="flex gap-4 mt-2">
                {formData.avatar1ImageUrl && (
                  <div className="text-center">
                    <img src={formData.avatar1ImageUrl} alt="Avatar 1" className="w-16 h-16 rounded-full object-cover border-2 border-[#1e6b73] mx-auto" />
                    <span className="text-xs text-gray-500 mt-1">Question</span>
                  </div>
                )}
                {formData.avatar2ImageUrl && (
                  <div className="text-center">
                    <img src={formData.avatar2ImageUrl} alt="Avatar 2" className="w-16 h-16 rounded-full object-cover border-2 border-[#1e6b73] mx-auto" />
                    <span className="text-xs text-gray-500 mt-1">Answer</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Explanation */}
        {!isGrouped && (
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
        )}

        {!isGrouped && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Translation / Interpretation</label>
            <textarea
              value={formData.translationNote}
              onChange={(e) => setFormData({ ...formData, translationNote: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2d7a7c] focus:border-transparent"
              rows={4}
              placeholder="Korean translation or interpretation for annotated PDF..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Vocabulary Notes</label>
            <textarea
              value={formData.vocabularyNote}
              onChange={(e) => setFormData({ ...formData, vocabularyNote: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2d7a7c] focus:border-transparent"
              rows={4}
              placeholder="Important words, meanings, and notes for annotated PDF..."
            />
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

interface QuestionEditFormProps {
  testType: 'TPO' | 'Test' | 'Training';
  testNumber: number;
  section: 'Reading' | 'Listening' | 'Speaking' | 'Writing';
  questionTypes: string[];
  question: TPOQuestion;
  onSubmit: (question: TPOQuestion) => void;
  onCancel: () => void;
}

export function QuestionEditForm({ testType, testNumber, section, questionTypes, question, onSubmit, onCancel }: QuestionEditFormProps) {
  const [formData, setFormData] = useState({
    questionNumber: question.questionNumber,
    questionText: question.questionText,
    questionType: question.questionType,
    options: question.options || ['', '', '', ''],
    correctAnswer: question.correctAnswer || '',
    explanation: question.explanation || '',
    translationNote: question.translationNote || '',
    vocabularyNote: question.vocabularyNote || '',
    passageText: question.passageText || '',
    audioFile: null as File | null,
    audioUrl: question.audioUrl || '',
    videoFile: null as File | null,
    videoUrl: question.videoUrl || '',
    imageFile: null as File | null,
    imageUrl: question.imageUrl || '',
    duration: question.duration || 0,
    difficulty: question.difficulty || '보통' as '쉬움' | '보통' | '어려움',
    blanks: question.blanks || [] as Array<{ answer: string; maxLength: number }>,
    avatar1ImageUrl: question.avatar1ImageUrl || '',
    avatar2ImageUrl: question.avatar2ImageUrl || '',
    passageAudioUrl: question.passageAudioUrl || '',
    passageAudioFile: null as File | null,
    passageImageUrl: question.passageImageUrl || '',
    passageImageFile: null as File | null,
    passageTitle: question.passageTitle || '',
    questionGroupId: question.questionGroupId || ''
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
      translationNote: formData.translationNote || undefined,
      vocabularyNote: formData.vocabularyNote || undefined,
      passageText: formData.passageText || undefined,
      duration: formData.duration || undefined,
      difficulty: formData.difficulty,
      blanks: formData.blanks,
      avatar1ImageUrl: formData.avatar1ImageUrl || undefined,
      avatar2ImageUrl: formData.avatar2ImageUrl || undefined,
      passageAudioUrl: formData.passageAudioUrl || undefined,
      passageImageUrl: formData.passageImageUrl || undefined,
      passageTitle: formData.passageTitle || undefined,
      questionGroupId: formData.questionGroupId || undefined
    };

    // Handle URL inputs or file uploads (URL takes priority)
    if (formData.audioUrl.trim()) {
      updatedQuestion.audioUrl = formData.audioUrl.trim();
    } else if (formData.audioFile) {
      updatedQuestion.audioUrl = URL.createObjectURL(formData.audioFile);
    } else if (question.audioUrl) {
      updatedQuestion.audioUrl = question.audioUrl;
    }

    if (formData.videoUrl.trim()) {
      updatedQuestion.videoUrl = formData.videoUrl.trim();
    } else if (formData.videoFile) {
      updatedQuestion.videoUrl = URL.createObjectURL(formData.videoFile);
    } else if (question.videoUrl) {
      updatedQuestion.videoUrl = question.videoUrl;
    }

    if (formData.imageUrl.trim()) {
      updatedQuestion.imageUrl = formData.imageUrl.trim();
    } else if (formData.imageFile) {
      updatedQuestion.imageUrl = URL.createObjectURL(formData.imageFile);
    } else if (question.imageUrl) {
      updatedQuestion.imageUrl = question.imageUrl;
    }

    // Handle passage audio/image for grouped listening types
    if (formData.passageAudioUrl.trim()) {
      updatedQuestion.passageAudioUrl = formData.passageAudioUrl.trim();
    } else if (formData.passageAudioFile) {
      updatedQuestion.passageAudioUrl = URL.createObjectURL(formData.passageAudioFile);
    }
    if (formData.passageImageUrl.trim()) {
      updatedQuestion.passageImageUrl = formData.passageImageUrl.trim();
    } else if (formData.passageImageFile) {
      updatedQuestion.passageImageUrl = URL.createObjectURL(formData.passageImageFile);
    }

    onSubmit(updatedQuestion);
  };

  const isGrouped = section === 'Listening' && isGroupedListeningType(formData.questionType);

  return (
    <div
      className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 animate-[fadeSlideUp_0.3s_ease-out]"
    >
      <h3 className="text-xl font-medium text-gray-800 mb-4">
        Edit {section} Question - {testType} {testNumber}
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Same fields as Upload Form but with existing values */}
        {/* Listening Passage Info (for grouped types in Edit) */}
        {isGrouped && (
          <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="text-sm font-semibold text-blue-800">Passage Information</h4>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Passage Title</label>
              <input
                type="text"
                value={formData.passageTitle}
                onChange={(e) => setFormData({ ...formData, passageTitle: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2d7a7c] focus:border-transparent"
                placeholder="Listen to a conversation."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Passage Audio URL</label>
              <input
                type="text"
                value={formData.passageAudioUrl}
                onChange={(e) => setFormData({ ...formData, passageAudioUrl: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2d7a7c] focus:border-transparent"
                placeholder="Audio URL"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Passage Image URL</label>
              <input
                type="text"
                value={formData.passageImageUrl}
                onChange={(e) => setFormData({ ...formData, passageImageUrl: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2d7a7c] focus:border-transparent"
                placeholder="Image URL"
              />
              {formData.passageImageUrl && (
                <img src={formData.passageImageUrl} alt="Preview" className="mt-2 w-32 h-auto rounded" />
              )}
            </div>
            {formData.questionGroupId && (
              <div className="text-xs text-gray-500">Group ID: {formData.questionGroupId}</div>
            )}
          </div>
        )}        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Question Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Question Number
              {formData.questionType === 'Complete Words' && (
                <span className="ml-2 text-xs text-orange-600 font-normal">
                  (빈칸넣기 1-10번은 하나�?문제�?입력)
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
                  (빈칸넣기: 빈칸 위치�?[정답:최대길이] 형식으로 입력하세�? �? mi[ght:3])
                </span>
              )}
            </label>
            {formData.questionType === 'Complete Words' && (
              <div className="mb-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <p className="text-sm font-medium text-orange-800 mb-1">
                  📝 빈칸넣기 문제 입력 방법
                </p>
                <p className="text-xs text-orange-700">
                  빈칸 문제는 하나의 지문에 10개의 빈칸을 모두 포함하여 입력합니다.<br/>
                  지문에서 빈칸으로 만들 부분을 [정답:최대길이] 형식으로 표시하세요.<br/>
                  예: "We mi[ght:3] think th[at:2] early humans performed dances..."<br/>
                  반드시 10개의 빈칸을 입력해야 합니다.
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
                  감지�?빈칸: {formData.blanks.length}�?
                </p>
                <div className="flex flex-wrap gap-2">
                  {formData.blanks.map((blank, idx) => (
                    <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                      #{idx + 1}: "{blank.answer}" (최대 {blank.maxLength}�?
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Audio Upload (for Listening/Speaking) */}
        {!isGrouped && (section === 'Listening' || section === 'Speaking') && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Audio File</label>
            <input
              type="text"
              value={formData.audioUrl}
              onChange={(e) => setFormData({ ...formData, audioUrl: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2d7a7c] focus:border-transparent"
              placeholder="파일 선택 또는 파일 URL"
            />
            <input
              type="file"
              accept="audio/*"
              onChange={(e) => setFormData({ ...formData, audioFile: e.target.files?.[0] || null })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2d7a7c] focus:border-transparent"
            />
          </div>
        )}

        {/* Video Upload */}
        {!isGrouped && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Video File (Optional)</label>
          <input
            type="text"
            value={formData.videoUrl}
            onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2d7a7c] focus:border-transparent"
            placeholder="파일 선택 또는 파일 URL 입력"
          />
          <input
            type="file"
            accept="video/*"
            onChange={(e) => setFormData({ ...formData, videoFile: e.target.files?.[0] || null })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2d7a7c] focus:border-transparent"
          />
        </div>
        )}

        {/* Image Upload (for Speaking) */}
        {(section === 'Speaking' || section === 'Listening') && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Image File (Optional)</label>
            <input
              type="text"
              value={formData.imageUrl}
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2d7a7c] focus:border-transparent"
              placeholder="파일 선택 또는 파일 URL 입력"
            />
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFormData({ ...formData, imageFile: e.target.files?.[0] || null })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2d7a7c] focus:border-transparent"
            />
          </div>
        )}

        {/* Question Text */}
        {!isGrouped && (
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

        {/* Answer Options */}
        {!isGrouped && (section === 'Reading' || section === 'Listening') && formData.questionType !== 'Complete Words' && (
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

        {/* Avatar Image URLs (for Writing Build Sentence questions) */}
        {section === 'Writing' && (
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h4 className="text-sm font-semibold text-gray-700">Avatar Images (Build a Sentence)</h4>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Question Person Avatar (Image URL)</label>
              <input
                type="url"
                value={formData.avatar1ImageUrl}
                onChange={(e) => setFormData({ ...formData, avatar1ImageUrl: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2d7a7c] focus:border-transparent"
                placeholder="https://example.com/avatar1.jpg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Answer Person Avatar (Image URL)</label>
              <input
                type="url"
                value={formData.avatar2ImageUrl}
                onChange={(e) => setFormData({ ...formData, avatar2ImageUrl: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2d7a7c] focus:border-transparent"
                placeholder="https://example.com/avatar2.jpg"
              />
            </div>
            {(formData.avatar1ImageUrl || formData.avatar2ImageUrl) && (
              <div className="flex gap-4 mt-2">
                {formData.avatar1ImageUrl && (
                  <div className="text-center">
                    <img src={formData.avatar1ImageUrl} alt="Avatar 1" className="w-16 h-16 rounded-full object-cover border-2 border-[#1e6b73] mx-auto" />
                    <span className="text-xs text-gray-500 mt-1">Question</span>
                  </div>
                )}
                {formData.avatar2ImageUrl && (
                  <div className="text-center">
                    <img src={formData.avatar2ImageUrl} alt="Avatar 2" className="w-16 h-16 rounded-full object-cover border-2 border-[#1e6b73] mx-auto" />
                    <span className="text-xs text-gray-500 mt-1">Answer</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Explanation */}
        {!isGrouped && (
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
        )}

        {!isGrouped && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Translation / Interpretation</label>
            <textarea
              value={formData.translationNote}
              onChange={(e) => setFormData({ ...formData, translationNote: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2d7a7c] focus:border-transparent"
              rows={4}
              placeholder="Korean translation or interpretation for annotated PDF..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Vocabulary Notes</label>
            <textarea
              value={formData.vocabularyNote}
              onChange={(e) => setFormData({ ...formData, vocabularyNote: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2d7a7c] focus:border-transparent"
              rows={4}
              placeholder="Important words, meanings, and notes for annotated PDF..."
            />
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
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}
