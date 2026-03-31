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
    avatar2ImageUrl: ''
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

        {/* Image Upload (for Speaking) */}
        {section === 'Speaking' && (
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
    avatar2ImageUrl: question.avatar2ImageUrl || ''
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
      blanks: formData.blanks,
      avatar1ImageUrl: formData.avatar1ImageUrl || undefined,
      avatar2ImageUrl: formData.avatar2ImageUrl || undefined
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

    onSubmit(updatedQuestion);
  };

  return (
    <div
      className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 animate-[fadeSlideUp_0.3s_ease-out]"
    >
      <h3 className="text-xl font-medium text-gray-800 mb-4">
        Edit {section} Question - {testType} {testNumber}
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Same fields as Upload Form but with existing values */}
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

        {/* Image Upload (for Speaking) */}
        {section === 'Speaking' && (
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
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}
