import React, { useState, useRef } from 'react';
import { Upload, FileText, Trash2, Edit, Eye, X, Plus, Download, Music, Image as ImageIcon } from 'lucide-react';
import { Button } from './ui/button';
import type { LMSContent } from './LMSSection';
import { supabase as supabaseClient } from '../utils/supabase/client';

// ─────────────────────────────────────────────────────────────────
//  Storage 업로드 헬퍼 (ContentManagement.tsx와 동일 로직)
// ─────────────────────────────────────────────────────────────────
async function uploadToStorage(file: File, bucket: string, maxRetries = 2): Promise<string> {
  const ext = file.name.split('.').pop() || 'bin';
  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    try {
      const { error } = await supabaseClient.storage.from(bucket).upload(path, file, {
        upsert: true,
        cacheControl: '3600',
      });
      if (error) {
        const isClientError =
          (error as any).statusCode === 400 || (error as any).statusCode === 401 ||
          (error as any).statusCode === 403 || (error as any).statusCode === 404 ||
          /not found|policy|permission|denied|too large|unsupported/i.test(error.message);
        if (isClientError || attempt === maxRetries) {
          throw new Error(`Storage 업로드 실패 (${bucket}): ${error.message}`);
        }
        lastError = new Error(error.message);
      } else {
        const { data: urlData } = supabaseClient.storage.from(bucket).getPublicUrl(path);
        return urlData.publicUrl;
      }
    } catch (err: any) {
      const isNetworkError = err?.name === 'AbortError' || err?.name === 'TypeError'
        || /Failed to fetch|NetworkError|load failed/i.test(err?.message || '');
      if (!isNetworkError || attempt === maxRetries) {
        throw err instanceof Error ? err : new Error(String(err));
      }
      lastError = err instanceof Error ? err : new Error(String(err));
    }
    await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
  }
  throw lastError || new Error(`Storage 업로드 실패 (${bucket})`);
}

async function compressImage(file: File, maxSize = 1200, quality = 0.8): Promise<File> {
  if (!file.type.startsWith('image/')) return file;
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      if (img.width <= maxSize && img.height <= maxSize) { resolve(file); return; }
      const scale = Math.min(maxSize / img.width, maxSize / img.height);
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => resolve(blob ? new File([blob], file.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' }) : file),
        'image/jpeg', quality
      );
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
    img.src = url;
  });
}

// ─────────────────────────────────────────────────────────────────
//  영역별 문제 유형 (TPO CMS와 동일)
// ─────────────────────────────────────────────────────────────────
const QUESTION_TYPES_BY_SECTION: Record<string, string[]> = {
  Reading: ['Complete Words', 'Read in Daily Life', 'Read an Academic Passage'],
  Listening: ['Listen and Response', 'Short Conversation', 'Campus Conversation', 'Announcements', 'Academic Talk', 'Academic Lecture'],
  Speaking: ['Listen and Repeat', 'Take an Interview'],
  Writing: ['Build a Sentence', 'Write an Email', 'Academic Discussion'],
};

type SectionType = 'Reading' | 'Listening' | 'Speaking' | 'Writing';

interface QuestionTypeCMSProps {
  contents: LMSContent[];
  onAddContent: (content: LMSContent) => void;
  onUpdateContent?: (content: LMSContent) => void;
  onDeleteContent: (id: string) => void;
}

// ─────────────────────────────────────────────────────────────────
//  메인 컴포넌트 — TPO CMS(ContentManagement)와 동일한 틀
// ─────────────────────────────────────────────────────────────────
export function QuestionTypeCMS({ contents, onAddContent, onUpdateContent, onDeleteContent }: QuestionTypeCMSProps) {
  const [selectedSection, setSelectedSection] = useState<SectionType>('Reading');
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [showBulkUploadForm, setShowBulkUploadForm] = useState(false);
  const [editingContent, setEditingContent] = useState<LMSContent | null>(null);
  const [previewContent, setPreviewContent] = useState<LMSContent | null>(null);
  const editFormRef = useRef<HTMLDivElement>(null);

  const sectionContents = contents.filter(c => c.skill === selectedSection);
  const questionTypes = QUESTION_TYPES_BY_SECTION[selectedSection];

  const handleEdit = (c: LMSContent) => {
    setEditingContent(c);
    setShowUploadForm(false);
    setTimeout(() => editFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

  const handleDelete = (c: LMSContent) => {
    if (window.confirm(`"${c.title || c.questionText || c.questionType}" 삭제할까요?`)) {
      onDeleteContent(c.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── 섹션 탭 — TPO CMS의 섹션 선택과 동일 ── */}
      <div className="flex gap-2 flex-wrap">
        {(['Reading', 'Listening', 'Writing', 'Speaking'] as SectionType[]).map(section => (
          <button
            key={section}
            onClick={() => { setSelectedSection(section); setShowUploadForm(false); setShowBulkUploadForm(false); setEditingContent(null); }}
            className={`px-6 py-2.5 rounded-lg font-bold text-sm transition-all shadow-sm ${
              selectedSection === section
                ? 'bg-gradient-to-r from-[#2d7a7c] to-[#1e6b73] text-white'
                : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            {section}
            <span className="ml-2 text-xs opacity-75">({contents.filter(c => c.skill === section).length})</span>
          </button>
        ))}
      </div>

      {/* ── 업로드 버튼들 — TPO CMS와 동일 (개별 / 대량) ── */}
      <div className="flex gap-3 flex-wrap">
        <Button
          onClick={() => { setShowUploadForm(!showUploadForm); setShowBulkUploadForm(false); setEditingContent(null); }}
          className="bg-gradient-to-r from-[#2d7a7c] to-[#1e6b73] text-white hover:from-[#1e6b73] hover:to-[#005f61] shadow-lg"
        >
          <Plus className="w-4 h-4 mr-2" />
          개별 문제 추가
        </Button>
        <Button
          onClick={() => { setShowBulkUploadForm(!showBulkUploadForm); setShowUploadForm(false); setEditingContent(null); }}
          className="bg-gradient-to-r from-[#e67e22] to-[#f39c12] text-white hover:from-[#d35400] hover:to-[#e67e22] shadow-lg"
        >
          <Upload className="w-4 h-4 mr-2" />
          대량 업로드 (CSV)
        </Button>
      </div>

      {/* ── 개별 추가 폼 ── */}
      {showUploadForm && (
        <QuestionTypeUploadForm
          section={selectedSection}
          questionTypes={questionTypes}
          onSubmit={(c) => { onAddContent(c); setShowUploadForm(false); }}
          onCancel={() => setShowUploadForm(false)}
        />
      )}

      {/* ── 대량 업로드 폼 ── */}
      {showBulkUploadForm && (
        <QuestionTypeBulkUploadForm
          section={selectedSection}
          questionTypes={questionTypes}
          onSubmit={(list) => { list.forEach(onAddContent); setShowBulkUploadForm(false); }}
          onCancel={() => setShowBulkUploadForm(false)}
        />
      )}

      {/* ── 편집 폼 ── */}
      {editingContent && (
        <div ref={editFormRef}>
          <QuestionTypeEditForm
            content={editingContent}
            questionTypes={QUESTION_TYPES_BY_SECTION[editingContent.skill]}
            onSubmit={(updated) => { onUpdateContent?.(updated); setEditingContent(null); }}
            onCancel={() => setEditingContent(null)}
          />
        </div>
      )}

      {/* ── 문제 목록 — TPO CMS의 Existing Questions와 동일 ── */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <h3 className="font-medium text-gray-800 mb-4">
          {selectedSection} Questions ({sectionContents.length})
        </h3>
        {sectionContents.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-2 text-gray-400" />
            <p>No {selectedSection} questions uploaded yet</p>
          </div>
        ) : (
          <div className="space-y-1">
            {sectionContents.map(c => (
              <div
                key={c.id}
                className={`flex items-center gap-1.5 px-2 py-1.5 border rounded-md hover:bg-gray-50 transition-colors ${
                  editingContent?.id === c.id ? 'border-[#2d7a7c] bg-[#f0fafa] ring-1 ring-[#2d7a7c]/30' : 'border-gray-100'
                }`}
              >
                <span className="shrink-0 px-1.5 py-0.5 text-white rounded text-[10px] font-bold bg-[#2d7a7c]">
                  {c.questionNumber ? `Q${c.questionNumber}` : c.day ? `D${c.day}` : '—'}
                </span>
                <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 border border-gray-200">{c.questionType}</span>
                {c.difficulty && (
                  <span className={`shrink-0 text-[10px] px-1 py-0.5 rounded border ${
                    c.difficulty === '쉬움' ? 'border-green-400 text-green-600'
                    : c.difficulty === '어려움' ? 'border-red-400 text-red-600'
                    : 'border-yellow-400 text-yellow-600'
                  }`}>{c.difficulty}</span>
                )}
                <span className="shrink-0 text-[10px] px-1 py-0.5 rounded border border-blue-300 text-blue-500">Lv{c.level}</span>
                {c.audioUrl && <Music className="w-3 h-3 text-teal-600 shrink-0" />}
                {c.imageUrl && <ImageIcon className="w-3 h-3 text-teal-600 shrink-0" />}
                <p className="text-[11px] text-gray-600 truncate flex-1">
                  {c.questionText || c.title || c.passageText?.slice(0, 60) || c.scriptText?.slice(0, 60) || c.questionType}
                </p>
                <div className="flex gap-0.5 shrink-0">
                  <button className="p-0.5 rounded hover:bg-gray-200 text-gray-500" onClick={() => setPreviewContent(c)}><Eye className="w-3 h-3" /></button>
                  <button className="p-0.5 rounded hover:bg-gray-200 text-gray-500" onClick={() => handleEdit(c)}><Edit className="w-3 h-3" /></button>
                  <button className="p-0.5 rounded hover:bg-red-100 text-red-400" onClick={() => handleDelete(c)}><Trash2 className="w-3 h-3" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── 미리보기 모달 ── */}
      {previewContent && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50" onClick={() => setPreviewContent(null)}>
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">{previewContent.questionType}</h3>
              <button onClick={() => setPreviewContent(null)} className="p-1 rounded hover:bg-gray-100"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3 text-sm">
              {previewContent.passageTitle && <div><span className="font-bold text-gray-500">지문 제목:</span> {previewContent.passageTitle}</div>}
              {previewContent.passageText && <div className="bg-gray-50 rounded-lg p-3 whitespace-pre-wrap">{previewContent.passageText}</div>}
              {previewContent.scriptText && <div className="bg-blue-50 rounded-lg p-3 whitespace-pre-wrap"><span className="font-bold text-blue-600 block mb-1">스크립트</span>{previewContent.scriptText}</div>}
              {previewContent.questionText && <div><span className="font-bold text-gray-500">문제:</span> {previewContent.questionText}</div>}
              {previewContent.options && previewContent.options.length > 0 && (
                <div className="space-y-1">
                  {previewContent.options.map((opt, i) => (
                    <div key={i} className={`px-3 py-1.5 rounded border ${opt === previewContent.correctAnswer ? 'border-green-400 bg-green-50 font-bold' : 'border-gray-200'}`}>
                      {String.fromCharCode(65 + i)}. {opt}
                    </div>
                  ))}
                </div>
              )}
              {previewContent.correctAnswer && <div><span className="font-bold text-green-600">정답:</span> {previewContent.correctAnswer}</div>}
              {previewContent.explanation && <div className="bg-yellow-50 rounded-lg p-3"><span className="font-bold text-yellow-700 block mb-1">해설</span>{previewContent.explanation}</div>}
              {previewContent.audioUrl && <audio controls src={previewContent.audioUrl} className="w-full h-10" />}
              {previewContent.imageUrl && <img src={previewContent.imageUrl} alt="" className="max-w-full rounded-lg border" />}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
//  개별 문제 추가 폼 — TPO CMS의 QuestionUploadForm과 동일한 틀
// ─────────────────────────────────────────────────────────────────
interface UploadFormProps {
  section: SectionType;
  questionTypes: string[];
  onSubmit: (content: LMSContent) => void;
  onCancel: () => void;
}

function QuestionTypeUploadForm({ section, questionTypes, onSubmit, onCancel }: UploadFormProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    questionNumber: '' as string | number,
    questionType: questionTypes[0],
    difficulty: '보통' as '쉬움' | '보통' | '어려움',
    level: 1,
    day: '01',
    questionText: '',
    options: ['', '', '', ''],
    correctAnswer: '',
    explanation: '',
    passageTitle: '',
    passageText: '',
    scriptText: '',
    dictationBlanks: '',
    organization: '',
    organizationBlanks: '',
    context: '',
    audioFile: null as File | null,
    audioUrl: '',
    imageFile: null as File | null,
    imageUrl: '',
  });

  const isListeningLike = section === 'Listening' || section === 'Speaking';
  const isReading = section === 'Reading';
  const isWriting = section === 'Writing';
  const isCompleteWords = formData.questionType === 'Complete Words';
  const isBuildSentence = formData.questionType === 'Build a Sentence';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    try {
      let audioUrl = formData.audioUrl;
      let imageUrl = formData.imageUrl;
      if (formData.audioFile) audioUrl = await uploadToStorage(formData.audioFile, 'listening-audio');
      if (formData.imageFile) imageUrl = await uploadToStorage(await compressImage(formData.imageFile), 'listening-images');

      // Complete Words: passageText의 [answer] 인라인 빈칸 파싱
      let blanks: Array<{ answer: string; maxLength: number }> | undefined;
      let finalPassageText = formData.passageText || undefined;
      if (isCompleteWords && formData.passageText) {
        const inlineRegex = /\[([a-zA-Z][a-zA-Z\s'-]*?)(?::(\d+))?\]/g;
        const parsed: Array<{ answer: string; maxLength: number }> = [];
        let m;
        while ((m = inlineRegex.exec(formData.passageText)) !== null) {
          const ans = m[1].trim();
          parsed.push({ answer: ans, maxLength: m[2] ? parseInt(m[2]) : ans.length });
        }
        if (parsed.length > 0) blanks = parsed;
      }

      // Build a Sentence: correctAnswer에서 words/sentenceEnding 파생
      let words: string[] | undefined;
      let sentenceEnding: '.' | '?' | undefined;
      if (isBuildSentence && formData.correctAnswer.trim()) {
        const ans = formData.correctAnswer.trim();
        sentenceEnding = ans.endsWith('?') ? '?' : '.';
        words = ans.replace(/[.?]$/, '').trim().split(/\s+/).filter(Boolean);
      }

      const options = formData.options.filter(o => o.trim() !== '');
      const content: LMSContent = {
        id: `qt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        title: formData.questionText || formData.passageTitle || `${formData.questionType} Q${formData.questionNumber || ''}`,
        skill: section,
        questionType: formData.questionType,
        level: formData.level,
        day: formData.day,
        fileType: audioUrl ? (formData.scriptText || formData.passageText ? 'text-audio' : 'audio') : 'text',
        fileUrl: audioUrl || undefined,
        content: formData.scriptText || formData.passageText || formData.questionText || undefined,
        uploadedAt: new Date(),
        options: options.length > 0 ? options : undefined,
        correctAnswer: formData.correctAnswer || (blanks ? blanks.map(b => b.answer).join(', ') : undefined),
        explanation: formData.explanation || undefined,
        questionNumber: formData.questionNumber || undefined,
        difficulty: formData.difficulty,
        passageTitle: formData.passageTitle || undefined,
        passageText: finalPassageText,
        scriptText: formData.scriptText || undefined,
        dictationBlanks: formData.dictationBlanks || undefined,
        organization: formData.organization || undefined,
        organizationBlanks: formData.organizationBlanks || undefined,
        questionText: formData.questionText || undefined,
        audioUrl: audioUrl || undefined,
        imageUrl: imageUrl || undefined,
        blanks,
        words,
        sentenceEnding,
        context: formData.context || undefined,
      };
      onSubmit(content);
    } catch (err: any) {
      alert(`업로드 실패: ${err?.message || '알 수 없는 오류'}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 animate-[fadeSlideUp_0.3s_ease-out]">
      <h3 className="text-xl font-medium text-gray-800 mb-4">개별 문제 추가 — {section}</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">문제 번호</label>
            <input type="text" value={formData.questionNumber} onChange={e => setFormData({ ...formData, questionNumber: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#2d7a7c]" placeholder="1" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">문제 유형</label>
            <select value={formData.questionType} onChange={e => setFormData({ ...formData, questionType: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#2d7a7c]">
              {questionTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">난이도</label>
            <select value={formData.difficulty} onChange={e => setFormData({ ...formData, difficulty: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#2d7a7c]">
              <option value="쉬움">쉬움</option><option value="보통">보통</option><option value="어려움">어려움</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Level / DAY</label>
            <div className="flex gap-2">
              <select value={formData.level} onChange={e => setFormData({ ...formData, level: parseInt(e.target.value) })}
                className="flex-1 px-2 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#2d7a7c]">
                {[1, 2, 3, 4, 5, 6].map(l => <option key={l} value={l}>Lv{l}</option>)}
              </select>
              <select value={formData.day} onChange={e => setFormData({ ...formData, day: e.target.value })}
                className="flex-1 px-2 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#2d7a7c]">
                {Array.from({ length: 20 }, (_, i) => (i + 1).toString().padStart(2, '0')).map(d => <option key={d} value={d}>D{d}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Reading: 지문 */}
        {isReading && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">지문 제목 (passageTitle)</label>
              <input type="text" value={formData.passageTitle} onChange={e => setFormData({ ...formData, passageTitle: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#2d7a7c]" placeholder="Read an Email" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                지문 본문 (passageText) {isCompleteWords && <span className="text-xs text-teal-600">— 빈칸은 peo[ple] 형식으로 표기</span>}
              </label>
              <textarea value={formData.passageText} onChange={e => setFormData({ ...formData, passageText: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#2d7a7c]" rows={6}
                placeholder={isCompleteWords ? 'When peo[ple] think of inven[tion], they imagine tech[nology]...' : '지문 전체를 입력하세요'} />
            </div>
          </>
        )}

        {/* Listening/Speaking: 스크립트 + 오디오 */}
        {isListeningLike && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">오디오 스크립트 (scriptText)</label>
              <textarea value={formData.scriptText} onChange={e => setFormData({ ...formData, scriptText: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#2d7a7c]" rows={5}
                placeholder="Man: ... Woman: ..." />
            </div>
            {section === 'Listening' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dictation 빈칸 키워드</label>
                  <input type="text" value={formData.dictationBlanks} onChange={e => setFormData({ ...formData, dictationBlanks: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#2d7a7c]" placeholder="library, science building" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Organization 요약</label>
                  <input type="text" value={formData.organization} onChange={e => setFormData({ ...formData, organization: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#2d7a7c]" placeholder="목적: ... → 세부정보: ..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Organization 빈칸 키워드</label>
                  <input type="text" value={formData.organizationBlanks} onChange={e => setFormData({ ...formData, organizationBlanks: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#2d7a7c]" placeholder="purpose, location" />
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">오디오 파일 (MP3)</label>
                <input type="file" accept="audio/*" onChange={e => setFormData({ ...formData, audioFile: e.target.files?.[0] || null })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                {formData.audioUrl && !formData.audioFile && <p className="text-xs text-gray-500 mt-1 truncate">기존: {formData.audioUrl}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">이미지 파일 (선택)</label>
                <input type="file" accept="image/*" onChange={e => setFormData({ ...formData, imageFile: e.target.files?.[0] || null })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
            </div>
          </>
        )}

        {/* Writing: 상황/지문 */}
        {isWriting && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">상황 설명 (context)</label>
              <textarea value={formData.context} onChange={e => setFormData({ ...formData, context: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#2d7a7c]" rows={2}
                placeholder={isBuildSentence ? '상황 설명 (선택)' : '이메일 상황 / 토론 주제 설명'} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">지문/본문 (passageText)</label>
              <textarea value={formData.passageText} onChange={e => setFormData({ ...formData, passageText: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#2d7a7c]" rows={5}
                placeholder={formData.questionType === 'Write an Email' ? '받은 이메일 본문' : formData.questionType === 'Academic Discussion' ? 'Professor: ...\nStudent1: ...\nStudent2: ...' : '본문'} />
            </div>
          </>
        )}

        {/* 문제 텍스트 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">문제 텍스트 (questionText)</label>
          <textarea value={formData.questionText} onChange={e => setFormData({ ...formData, questionText: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#2d7a7c]" rows={2}
            placeholder={isBuildSentence ? 'Arrange the words to make a sentence.' : isCompleteWords ? 'Fill in the missing letters in the blank.' : 'What is the main idea...?'} />
        </div>

        {/* 선택지 — Build a Sentence/Complete Words/서술형 제외 */}
        {!isBuildSentence && !isCompleteWords && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">선택지 (정답은 아래 correctAnswer에 동일하게 입력)</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {formData.options.map((opt, idx) => (
                <input key={idx} type="text" value={opt}
                  onChange={e => { const next = [...formData.options]; next[idx] = e.target.value; setFormData({ ...formData, options: next }); }}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#2d7a7c]"
                  placeholder={`선택지 ${String.fromCharCode(65 + idx)}`} />
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              정답 (correctAnswer) {isBuildSentence && <span className="text-xs text-teal-600">— 전체 문장 입력 시 words 자동 파생</span>}
            </label>
            <input type="text" value={formData.correctAnswer} onChange={e => setFormData({ ...formData, correctAnswer: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#2d7a7c]"
              placeholder={isBuildSentence ? 'I would like to apply for the position.' : '선택지와 정확히 동일하게 입력'} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">해설 (explanation)</label>
            <input type="text" value={formData.explanation} onChange={e => setFormData({ ...formData, explanation: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#2d7a7c]" placeholder="정답 해설 (선택)" />
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <Button type="button" onClick={onCancel} className="bg-gray-300 text-gray-700 hover:bg-gray-400">Cancel</Button>
          <Button type="submit" disabled={isUploading}
            className="bg-gradient-to-r from-[#2d7a7c] to-[#1e6b73] text-white hover:from-[#1e6b73] hover:to-[#005f61]">
            {isUploading ? '⏳ 업로드 중...' : 'Upload'}
          </Button>
        </div>
      </form>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
//  편집 폼 — 추가 폼과 동일 필드, 기존 값으로 초기화
// ─────────────────────────────────────────────────────────────────
function QuestionTypeEditForm({ content, questionTypes, onSubmit, onCancel }: {
  content: LMSContent;
  questionTypes: string[];
  onSubmit: (content: LMSContent) => void;
  onCancel: () => void;
}) {
  const [isUploading, setIsUploading] = useState(false);
  const opts = [...(content.options || []), '', '', '', ''].slice(0, 4);
  const [formData, setFormData] = useState({
    questionNumber: content.questionNumber ?? '',
    questionType: content.questionType,
    difficulty: content.difficulty ?? '보통',
    level: content.level,
    day: content.day,
    questionText: content.questionText ?? '',
    options: opts,
    correctAnswer: content.correctAnswer ?? '',
    explanation: content.explanation ?? '',
    passageTitle: content.passageTitle ?? '',
    passageText: content.passageText ?? '',
    scriptText: content.scriptText ?? '',
    dictationBlanks: content.dictationBlanks ?? '',
    organization: content.organization ?? '',
    organizationBlanks: content.organizationBlanks ?? '',
    context: content.context ?? '',
    audioFile: null as File | null,
    audioUrl: content.audioUrl ?? '',
    imageFile: null as File | null,
    imageUrl: content.imageUrl ?? '',
    title: content.title,
  });

  const section = content.skill as SectionType;
  const isListeningLike = section === 'Listening' || section === 'Speaking';
  const isReading = section === 'Reading';
  const isWriting = section === 'Writing';
  const isCompleteWords = formData.questionType === 'Complete Words';
  const isBuildSentence = formData.questionType === 'Build a Sentence';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    try {
      let audioUrl = formData.audioUrl;
      let imageUrl = formData.imageUrl;
      if (formData.audioFile) audioUrl = await uploadToStorage(formData.audioFile, 'listening-audio');
      if (formData.imageFile) imageUrl = await uploadToStorage(await compressImage(formData.imageFile), 'listening-images');

      let blanks: Array<{ answer: string; maxLength: number }> | undefined = content.blanks;
      if (isCompleteWords && formData.passageText) {
        const inlineRegex = /\[([a-zA-Z][a-zA-Z\s'-]*?)(?::(\d+))?\]/g;
        const parsed: Array<{ answer: string; maxLength: number }> = [];
        let m;
        while ((m = inlineRegex.exec(formData.passageText)) !== null) {
          const ans = m[1].trim();
          parsed.push({ answer: ans, maxLength: m[2] ? parseInt(m[2]) : ans.length });
        }
        if (parsed.length > 0) blanks = parsed;
      }

      let words: string[] | undefined = content.words;
      let sentenceEnding: '.' | '?' | undefined = content.sentenceEnding;
      if (isBuildSentence && formData.correctAnswer.trim()) {
        const ans = formData.correctAnswer.trim();
        sentenceEnding = ans.endsWith('?') ? '?' : '.';
        words = ans.replace(/[.?]$/, '').trim().split(/\s+/).filter(Boolean);
      }

      const options = formData.options.filter(o => o.trim() !== '');
      onSubmit({
        ...content,
        title: formData.title || formData.questionText || formData.passageTitle || content.title,
        questionType: formData.questionType,
        level: formData.level,
        day: formData.day,
        fileType: audioUrl ? (formData.scriptText || formData.passageText ? 'text-audio' : 'audio') : content.fileType,
        fileUrl: audioUrl || content.fileUrl,
        content: formData.scriptText || formData.passageText || formData.questionText || content.content,
        options: options.length > 0 ? options : undefined,
        correctAnswer: formData.correctAnswer || (blanks ? blanks.map(b => b.answer).join(', ') : undefined),
        explanation: formData.explanation || undefined,
        questionNumber: formData.questionNumber || undefined,
        difficulty: formData.difficulty as any,
        passageTitle: formData.passageTitle || undefined,
        passageText: formData.passageText || undefined,
        scriptText: formData.scriptText || undefined,
        dictationBlanks: formData.dictationBlanks || undefined,
        organization: formData.organization || undefined,
        organizationBlanks: formData.organizationBlanks || undefined,
        questionText: formData.questionText || undefined,
        audioUrl: audioUrl || undefined,
        imageUrl: imageUrl || undefined,
        blanks,
        words,
        sentenceEnding,
        context: formData.context || undefined,
      });
    } catch (err: any) {
      alert(`업로드 실패: ${err?.message || '알 수 없는 오류'}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-[#f0fafa] rounded-lg shadow-lg border-2 border-[#2d7a7c] p-6 animate-[fadeSlideUp_0.3s_ease-out]">
      <h3 className="text-xl font-medium text-gray-800 mb-4">문제 편집 — {section} {content.questionNumber ? `Q${content.questionNumber}` : ''}</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">문제 번호</label>
            <input type="text" value={formData.questionNumber} onChange={e => setFormData({ ...formData, questionNumber: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#2d7a7c]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">문제 유형</label>
            <select value={formData.questionType} onChange={e => setFormData({ ...formData, questionType: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#2d7a7c]">
              {questionTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">난이도</label>
            <select value={formData.difficulty} onChange={e => setFormData({ ...formData, difficulty: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#2d7a7c]">
              <option value="쉬움">쉬움</option><option value="보통">보통</option><option value="어려움">어려움</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Level / DAY</label>
            <div className="flex gap-2">
              <select value={formData.level} onChange={e => setFormData({ ...formData, level: parseInt(e.target.value) })}
                className="flex-1 px-2 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#2d7a7c]">
                {[1, 2, 3, 4, 5, 6].map(l => <option key={l} value={l}>Lv{l}</option>)}
              </select>
              <select value={formData.day} onChange={e => setFormData({ ...formData, day: e.target.value })}
                className="flex-1 px-2 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#2d7a7c]">
                {Array.from({ length: 20 }, (_, i) => (i + 1).toString().padStart(2, '0')).map(d => <option key={d} value={d}>D{d}</option>)}
              </select>
            </div>
          </div>
        </div>

        {isReading && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">지문 제목 (passageTitle)</label>
              <input type="text" value={formData.passageTitle} onChange={e => setFormData({ ...formData, passageTitle: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#2d7a7c]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                지문 본문 (passageText) {isCompleteWords && <span className="text-xs text-teal-600">— 빈칸은 peo[ple] 형식으로 표기</span>}
              </label>
              <textarea value={formData.passageText} onChange={e => setFormData({ ...formData, passageText: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#2d7a7c]" rows={6} />
            </div>
          </>
        )}

        {isListeningLike && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">오디오 스크립트 (scriptText)</label>
              <textarea value={formData.scriptText} onChange={e => setFormData({ ...formData, scriptText: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#2d7a7c]" rows={5} />
            </div>
            {section === 'Listening' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dictation 빈칸 키워드</label>
                  <input type="text" value={formData.dictationBlanks} onChange={e => setFormData({ ...formData, dictationBlanks: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#2d7a7c]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Organization 요약</label>
                  <input type="text" value={formData.organization} onChange={e => setFormData({ ...formData, organization: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#2d7a7c]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Organization 빈칸 키워드</label>
                  <input type="text" value={formData.organizationBlanks} onChange={e => setFormData({ ...formData, organizationBlanks: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#2d7a7c]" />
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">오디오 파일 교체 (MP3)</label>
                <input type="file" accept="audio/*" onChange={e => setFormData({ ...formData, audioFile: e.target.files?.[0] || null })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                {formData.audioUrl && !formData.audioFile && (
                  <div className="flex items-center gap-2 mt-1">
                    <audio controls src={formData.audioUrl} className="h-8 flex-1" />
                    <button type="button" onClick={() => setFormData({ ...formData, audioUrl: '' })}
                      className="text-xs text-red-500 hover:text-red-700 shrink-0">제거</button>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">이미지 파일 교체 (선택)</label>
                <input type="file" accept="image/*" onChange={e => setFormData({ ...formData, imageFile: e.target.files?.[0] || null })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                {formData.imageUrl && !formData.imageFile && (
                  <div className="flex items-center gap-2 mt-1">
                    <img src={formData.imageUrl} alt="" className="h-10 rounded border" />
                    <button type="button" onClick={() => setFormData({ ...formData, imageUrl: '' })}
                      className="text-xs text-red-500 hover:text-red-700 shrink-0">제거</button>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {isWriting && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">상황 설명 (context)</label>
              <textarea value={formData.context} onChange={e => setFormData({ ...formData, context: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#2d7a7c]" rows={2} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">지문/본문 (passageText)</label>
              <textarea value={formData.passageText} onChange={e => setFormData({ ...formData, passageText: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#2d7a7c]" rows={5} />
            </div>
          </>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">문제 텍스트 (questionText)</label>
          <textarea value={formData.questionText} onChange={e => setFormData({ ...formData, questionText: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#2d7a7c]" rows={2} />
        </div>

        {!isBuildSentence && !isCompleteWords && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">선택지</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {formData.options.map((opt, idx) => (
                <input key={idx} type="text" value={opt}
                  onChange={e => { const next = [...formData.options]; next[idx] = e.target.value; setFormData({ ...formData, options: next }); }}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#2d7a7c]"
                  placeholder={`선택지 ${String.fromCharCode(65 + idx)}`} />
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">정답 (correctAnswer)</label>
            <input type="text" value={formData.correctAnswer} onChange={e => setFormData({ ...formData, correctAnswer: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#2d7a7c]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">해설 (explanation)</label>
            <input type="text" value={formData.explanation} onChange={e => setFormData({ ...formData, explanation: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#2d7a7c]" />
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <Button type="button" onClick={onCancel} className="bg-gray-300 text-gray-700 hover:bg-gray-400">Cancel</Button>
          <Button type="submit" disabled={isUploading}
            className="bg-gradient-to-r from-[#2d7a7c] to-[#1e6b73] text-white hover:from-[#1e6b73] hover:to-[#005f61]">
            {isUploading ? '⏳ 저장 중...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
//  대량 업로드 (CSV) — TPO CMS의 CSV 모드와 동일한 컬럼 + level/day
// ─────────────────────────────────────────────────────────────────
interface BulkUploadProps {
  section: SectionType;
  questionTypes: string[];
  onSubmit: (contents: LMSContent[]) => void;
  onCancel: () => void;
}

function QuestionTypeBulkUploadForm({ section, questionTypes, onSubmit, onCancel }: BulkUploadProps) {
  const [parsed, setParsed] = useState<LMSContent[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // TPO CMS CSV 컬럼 + level/day
  const CSV_COLUMNS = [
    'questionNumber', 'questionType', 'difficulty', 'level', 'day',
    'passageTitle', 'passageText', 'scriptText',
    'dictationBlanks', 'organization', 'organizationBlanks',
    'questionText', 'optionA', 'optionB', 'optionC', 'optionD',
    'correctAnswer', 'explanation', 'context',
  ];

  const csvEscape = (val: any): string => {
    const s = String(val ?? '');
    if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };

  const handleDownloadTemplate = () => {
    const header = CSV_COLUMNS.join(',');
    let example: string;
    if (section === 'Listening') {
      example = [
        '1', 'Listen and Response', '보통', '1', '01', '', '',
        'Man: Excuse me, could you tell me where the library is?\nWoman: Sure, it\'s across the quad, next to the science building.',
        'library, science building', '목적: 위치 안내 → 세부정보: 걸어나 설명', 'purpose, location',
        'Choose the best response.', 'It\'s across the quad, next to the science building.', 'I don\'t know.', 'The library is closed.', 'Ask someone else.',
        'A', '여자가 도서관 위치를 설명함.', '',
      ].map(csvEscape).join(',');
    } else if (section === 'Reading') {
      example = [
        '1-10', 'Complete Words', '보통', '1', '01', '',
        'When peo[ple] think of inven[tion], they imagine tech[nology]. But edu[cation] shapes our cul[ture].',
        '', '', '', '', 'Fill in the missing letters in the blank.', '', '', '', '', '', '', '',
      ].map(csvEscape).join(',');
    } else if (section === 'Writing') {
      example = [
        '1', 'Build a Sentence', '보통', '1', '01', '', '', '', '', '', '',
        'Arrange the words to make a sentence.', '', '', '', '',
        'I would like to apply for the position.', '정답 문장에서 words가 자동 파생됩니다.', '상황 설명 (선택)',
      ].map(csvEscape).join(',');
    } else {
      example = [
        '1', questionTypes[0] || 'Listen and Repeat', '보통', '1', '01', '', '',
        'The campus library will extend its hours during finals week.',
        '', '', '', 'Listen and repeat what you hear.', '', '', '', '', '', '', '',
      ].map(csvEscape).join(',');
    }
    const blob = new Blob(['\uFEFF' + header + '\n' + example], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `question-types-${section.toLowerCase()}-template.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // TPO CMS와 동일한 CSV 파서
  const parseCsv = (text: string): string[][] => {
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
    if (cell.length > 0 || row.length > 0) { row.push(cell); rows.push(row); }
    return rows.filter(r => r.some(c => c.trim() !== ''));
  };

  const handleCsvFile = (file: File) => {
    setError(null);
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = reader.result as string;
        const rows = parseCsv(text);
        if (rows.length < 2) throw new Error('데이터 행이 없습니다. 헤더 아래에 문제를 입력했는지 확인하세요.');

        const header = rows[0].map(h => h.trim());
        const idx = (name: string) => header.findIndex(h => h.toLowerCase() === name.toLowerCase());

        const iNum = idx('questionNumber'), iType = idx('questionType'), iDiff = idx('difficulty');
        const iLevel = idx('level'), iDay = idx('day');
        const iPTitle = idx('passageTitle'), iPText = idx('passageText'), iScript = idx('scriptText');
        const iDictBlanks = idx('dictationBlanks'), iOrg = idx('organization'), iOrgBlanks = idx('organizationBlanks');
        const iQText = idx('questionText'), iA = idx('optionA'), iB = idx('optionB'), iC = idx('optionC'), iD = idx('optionD');
        const iAns = idx('correctAnswer'), iExp = idx('explanation'), iCtx = idx('context');

        const contents: LMSContent[] = [];
        const errors: string[] = [];

        for (let r = 1; r < rows.length; r++) {
          const cells = rows[r];
          try {
            const get = (i: number) => (i >= 0 && i < cells.length ? cells[i].trim() : '');
            const qType = get(iType) || questionTypes[0] || '';
            if (!qType && !get(iQText)) continue;

            const options = [get(iA), get(iB), get(iC), get(iD)].filter(o => o !== '');
            const rawNum = get(iNum);
            const passageText = get(iPText) || undefined;

            // Complete Words: 인라인 빈칸 파싱
            const isCW = /complete\s*words/i.test(qType);
            let blanks: Array<{ answer: string; maxLength: number }> | undefined;
            if (isCW && passageText) {
              const inlineRegex = /\[([a-zA-Z][a-zA-Z\s'-]*?)(?::(\d+))?\]/g;
              const parsedBlanks: Array<{ answer: string; maxLength: number }> = [];
              let m;
              while ((m = inlineRegex.exec(passageText)) !== null) {
                const ans = m[1].trim();
                parsedBlanks.push({ answer: ans, maxLength: m[2] ? parseInt(m[2]) : ans.length });
              }
              if (parsedBlanks.length > 0) blanks = parsedBlanks;
            }

            // Build a Sentence: correctAnswer에서 words/sentenceEnding 파생
            const isBS = /build\s*a\s*sentence/i.test(qType);
            let words: string[] | undefined;
            let sentenceEnding: '.' | '?' | undefined;
            if (isBS && get(iAns)) {
              const ans = get(iAns);
              sentenceEnding = ans.endsWith('?') ? '?' : '.';
              words = ans.replace(/[.?]$/, '').trim().split(/\s+/).filter(Boolean);
            }

            const scriptText = get(iScript) || undefined;
            const levelVal = parseInt(get(iLevel)) || 1;
            const dayVal = get(iDay) || '01';

            contents.push({
              id: `qt-${Date.now()}-${rawNum || r}-${Math.random().toString(36).slice(2, 7)}`,
              title: get(iQText) || get(iPTitle) || `${qType} Q${rawNum || r}`,
              skill: section,
              questionType: qType,
              level: levelVal,
              day: dayVal,
              fileType: scriptText ? 'text-audio' : 'text',
              content: scriptText || passageText || get(iQText) || undefined,
              uploadedAt: new Date(),
              options: options.length > 0 ? options : undefined,
              correctAnswer: blanks ? blanks.map(b => b.answer).join(', ') : (get(iAns) || undefined),
              explanation: get(iExp) || undefined,
              questionNumber: rawNum || r,
              difficulty: (get(iDiff) || '보통') as any,
              passageTitle: get(iPTitle) || undefined,
              passageText,
              scriptText,
              dictationBlanks: get(iDictBlanks) || undefined,
              organization: get(iOrg) || undefined,
              organizationBlanks: get(iOrgBlanks) || undefined,
              questionText: get(iQText) || undefined,
              blanks,
              words,
              sentenceEnding,
              context: get(iCtx) || undefined,
            });
          } catch (rowErr: any) {
            errors.push(`행 ${r + 1}: ${rowErr?.message || '파싱 오류'}`);
          }
        }

        if (errors.length > 0) {
          setError(`${errors.length}개 행에서 오류 발생:\n${errors.slice(0, 5).join('\n')}`);
        }
        if (contents.length === 0) throw new Error('문제를 찾을 수 없습니다. CSV 형식을 확인하세요.');
        setParsed(contents);
      } catch (err: any) {
        setError(err?.message || 'CSV 파싱 오류. 형식을 확인해주세요.');
      }
    };
    reader.readAsText(file, 'UTF-8');
  };

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 animate-[fadeSlideUp_0.3s_ease-out]">
      <h3 className="text-xl font-medium text-gray-800 mb-4">대량 업로드 (CSV) — {section}</h3>

      {!parsed ? (
        <div className="space-y-4">
          {/* 템플릿 다운로드 — TPO CMS와 동일 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-blue-800 text-sm">📊 CSV/엑셀</h4>
              <button type="button" onClick={handleDownloadTemplate}
                className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold">
                ⬇ CSV 템플릿 다운로드
              </button>
            </div>
            <p className="text-xs text-blue-700">• 템플릿을 다운로드해 엑셀에서 문제를 채우세요.</p>
            <p className="text-xs text-blue-700">• 편집 후 저장할 때 <strong>"CSV UTF-8 (쉼표로 분리)"</strong> 형식을 선택하세요 (한글 안 깨짐).</p>
            <p className="text-xs text-blue-700">• 오디오/이미지는 CSV 업로드 후 개별 편집에서 추가하세요.</p>
          </div>

          {/* 파일 선택 / 드래그 영역 */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging ? 'border-[#2d7a7c] bg-[#f0fafa]' : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={e => {
              e.preventDefault(); setIsDragging(false);
              const file = e.dataTransfer.files?.[0];
              if (file) handleCsvFile(file);
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-10 h-10 mx-auto mb-2 text-gray-400" />
            <span className="text-sm text-gray-500">채운 CSV 파일을 클릭해서 선택하거나 여기로 드래그</span>
            <input ref={fileInputRef} type="file" accept=".csv,text/csv" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleCsvFile(f); }} />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 whitespace-pre-wrap">{error}</div>
          )}

          <div className="flex justify-end">
            <Button type="button" onClick={onCancel} className="bg-gray-300 text-gray-700 hover:bg-gray-400">Cancel</Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* 파싱 결과 미리보기 */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="font-bold text-green-800 text-sm">✅ {parsed.length}개 문제 파싱 완료</p>
          </div>
          <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
            {parsed.map((c, i) => (
              <div key={c.id} className="flex items-center gap-2 px-3 py-2 border-b border-gray-100 text-xs">
                <span className="shrink-0 px-1.5 py-0.5 text-white rounded font-bold bg-[#2d7a7c]">{c.questionNumber ? `Q${c.questionNumber}` : `#${i + 1}`}</span>
                <span className="shrink-0 px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 border border-gray-200">{c.questionType}</span>
                <span className="shrink-0 px-1 py-0.5 rounded border border-blue-300 text-blue-500">Lv{c.level}</span>
                <p className="text-gray-600 truncate flex-1">{c.questionText || c.passageText?.slice(0, 50) || c.scriptText?.slice(0, 50)}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-3 justify-end">
            <Button type="button" onClick={() => setParsed(null)} className="bg-gray-300 text-gray-700 hover:bg-gray-400">다시 선택</Button>
            <Button type="button" onClick={() => onSubmit(parsed)}
              className="bg-gradient-to-r from-[#2d7a7c] to-[#1e6b73] text-white hover:from-[#1e6b73] hover:to-[#005f61]">
              {parsed.length}개 문제 업로드
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
