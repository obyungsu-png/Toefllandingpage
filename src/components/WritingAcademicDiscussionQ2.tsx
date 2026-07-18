import { useState, useEffect, useRef, useCallback } from 'react';
import { Sparkles } from 'lucide-react';
import { MobileFooter } from './MobileFooter';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { WritingReviewAiTutor } from './WritingReviewAiTutor';
import { ToeflAiWidget } from './ToeflAiWidget';

interface WritingAcademicDiscussionQ2Props {
  onBack: () => void;
  onNext: () => void;
  onHome: () => void;
  onVolumeClick?: () => void;
  // CMS-driven content
  professorImageUrl?: string;
  professorName?: string;
  professorMessage?: string;
  student1ImageUrl?: string;
  student1Name?: string;
  student1Message?: string;
  student2ImageUrl?: string;
  student2Name?: string;
  student2Message?: string;
  promptTitle?: string;
  promptInstructions?: string;
  /** 실전문제 Review 모드 — AI 튜터 버튼 표시 */
  isReviewMode?: boolean;
}

export function WritingAcademicDiscussionQ2({
  onBack,
  onNext,
  onHome,
  onVolumeClick,
  professorImageUrl,
  professorName,
  professorMessage,
  student1ImageUrl,
  student1Name,
  student1Message,
  student2ImageUrl,
  student2Name,
  student2Message,
  promptTitle,
  promptInstructions,
  isReviewMode = false,
}: WritingAcademicDiscussionQ2Props) {
  const [response, setResponse] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [hideWordCount, setHideWordCount] = useState(false);
  const [hideTime, setHideTime] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(600);
  const [showTimeDialog, setShowTimeDialog] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [activeTab, setActiveTab] = useState<'passage' | 'response'>('passage');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // AI 채점 팝업 + AI 튜터 패널 고정 상태 (Review 모드)
  const [showAiTutor, setShowAiTutor] = useState(false);
  const [aiTutorPinned, setAiTutorPinned] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 0) { clearInterval(timer); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const words = response.trim().split(/\s+/).filter(word => word.length > 0);
    setWordCount(response.trim() === '' ? 0 : words.length);
  }, [response]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // textarea 높이를 내용에 맞게 자동 확장 (최소 280px)
  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.max(el.scrollHeight, 280)}px`;
  }, []);

  useEffect(() => { autoResize(); }, [response, autoResize]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleNextClick = () => setShowTimeDialog(true);

  // Cut / Paste / Undo / Redo 기능
  const handleCut = () => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    if (start === end) return;
    const cut = response.slice(start, end);
    navigator.clipboard?.writeText(cut).catch(() => {});
    const next = response.slice(0, start) + response.slice(end);
    setResponse(next);
    setTimeout(() => { el.selectionStart = el.selectionEnd = start; el.focus(); }, 0);
  };

  const handlePaste = async () => {
    const el = textareaRef.current;
    if (!el) return;
    try {
      const text = await navigator.clipboard.readText();
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const next = response.slice(0, start) + text + response.slice(end);
      setResponse(next);
      setTimeout(() => { el.selectionStart = el.selectionEnd = start + text.length; el.focus(); }, 0);
    } catch { el.focus(); }
  };

  return (
    <div className="fixed inset-0 bg-gray-50 z-50 flex flex-col">
      {/* Top Header */}
      <div className="bg-[#1e6b73] h-16 flex items-center justify-between px-8 shadow-lg flex-shrink-0">
        <div
          className="text-white text-2xl font-['Inter',_sans-serif] font-bold tracking-wide cursor-pointer hover:opacity-80 transition-opacity"
          onClick={onHome}
        >
          *toefl ibt
        </div>
        <div className="flex items-center gap-3">
          {onVolumeClick && (
            <button
              className="flex items-center gap-3 bg-[#0A6068] border border-white rounded-md px-5 py-1.5 hover:bg-[#084d52] transition-colors"
              onClick={onVolumeClick}
            >
              <span className="text-white font-['Inter',_sans-serif] font-semibold text-base">Volume</span>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="white">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
              </svg>
            </button>
          )}
          <button
            className="flex items-center gap-2 bg-[#0A6068] border border-white rounded-md px-5 py-1.5 hover:bg-[#084d52] transition-colors"
            onClick={onBack}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="white">
              <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
            </svg>
            <span className="text-white font-['Inter',_sans-serif] font-semibold text-base">Back</span>
          </button>
          <button
            className="flex items-center gap-2 bg-white border-2 border-[#0A6068] rounded-lg px-5 py-2 hover:bg-gray-100 transition-colors"
            onClick={handleNextClick}
          >
            <span className="text-[#0A6068] font-['Inter',_sans-serif] font-semibold text-base">Next</span>
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#0A6068">
              <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Question bar + Timer */}
      <div className="bg-white border-b border-gray-300 flex-shrink-0">
        <div className="px-8 py-3 flex items-center justify-between">
          <div className="text-gray-700 font-['Inter',_sans-serif] font-bold">
            Writing | Question 2 of 2
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-700 font-['Inter',_sans-serif]">
              {!hideTime && formatTime(timeRemaining)}
            </span>
            <button
              onClick={() => setHideTime(!hideTime)}
              className="flex items-center gap-2 text-[#1e6b73] hover:text-[#0A6068] transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
              </svg>
              <span className="font-['Inter',_sans-serif] font-semibold">{hideTime ? 'Show' : 'Hide'} Time</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden pb-16 md:pb-0">

        {/* Mobile tab nav */}
        {isMobile && (
          <div className="flex border-b border-gray-300 bg-white flex-shrink-0">
            <button
              onClick={() => setActiveTab('passage')}
              className={`flex-1 py-3 text-sm font-semibold transition-all ${activeTab === 'passage' ? 'text-[#1e6b73] border-b-2 border-[#1e6b73]' : 'text-gray-500'}`}
            >
              Passage
            </button>
            <button
              onClick={() => setActiveTab('response')}
              className={`flex-1 py-3 text-sm font-semibold transition-all ${activeTab === 'response' ? 'text-[#1e6b73] border-b-2 border-[#1e6b73]' : 'text-gray-500'}`}
            >
              Response
            </button>
          </div>
        )}

        {/* Left — Instructions + Professor (독립 스크롤) */}
        <div className={`md:w-5/12 overflow-y-auto bg-white border-b md:border-b-0 md:border-r border-gray-200 p-4 md:p-6 ${isMobile ? (activeTab === 'passage' ? 'block' : 'hidden') : 'block'}`}>
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 mb-5">
            <p className="text-[15px] md:text-[16px] text-gray-900 leading-7 font-medium">
              <span className="font-bold">Instructions: </span>
              {promptTitle || ''}
            </p>
            <ul className="mt-2 ml-4 space-y-1">
              <li className="flex items-start gap-2 text-[15px] md:text-[16px] text-gray-800 leading-6 font-medium">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-gray-700 flex-shrink-0"></span>
                express and support your personal opinion
              </li>
              <li className="flex items-start gap-2 text-[15px] md:text-[16px] text-gray-800 leading-6 font-medium">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-gray-700 flex-shrink-0"></span>
                make a contribution to the discussion
              </li>
            </ul>
            <p className="mt-2 text-[15px] md:text-[16px] text-gray-800 font-medium">
              An effective response will contain at least 100 words.
            </p>
          </div>
          {promptInstructions && (
            <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-3 font-['Inter',_sans-serif]">
              {promptInstructions}
            </h2>
          )}
          <div className="flex flex-col items-center mb-3">
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gray-200 overflow-hidden border-4 border-[#1e6b73] shadow">
              <ImageWithFallback src={professorImageUrl} alt={professorName} className="w-full h-full object-cover" />
            </div>
            <p className="font-bold text-[15px] md:text-[17px] text-gray-900 mt-2">{professorName}</p>
          </div>
          <p className="text-[15px] md:text-[17px] text-gray-900 leading-7 font-medium whitespace-pre-line">
            {professorMessage || ''}
          </p>
        </div>

        {/* Right — 학생 주장 + Your Response (하나의 스크롤 영역) */}
        <div className={`md:w-7/12 overflow-y-auto bg-white ${isMobile ? (activeTab === 'response' ? 'flex flex-col' : 'hidden') : 'flex flex-col'}`}>
          <div className="p-4 md:p-6 flex flex-col gap-6">

            {/* 학생 1 */}
            <div className="flex items-start gap-3">
              <div className="flex flex-col items-center flex-shrink-0 w-14">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full overflow-hidden border-2 border-gray-300">
                  <ImageWithFallback src={student1ImageUrl} alt="Student 1" className="w-full h-full object-cover" />
                </div>
                <p className="text-[11px] text-gray-600 font-semibold mt-1 text-center leading-tight">
                  {student1Name || ''}
                </p>
              </div>
              <div className="flex-1 bg-gray-50 rounded-xl p-3 border border-gray-200">
                <p className="text-[15px] md:text-[16px] text-gray-900 leading-7 font-medium whitespace-pre-line">
                  {student1Message || ''}
                </p>
              </div>
            </div>

            {/* 학생 2 */}
            <div className="flex items-start gap-3">
              <div className="flex flex-col items-center flex-shrink-0 w-14">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full overflow-hidden border-2 border-gray-300">
                  <ImageWithFallback src={student2ImageUrl} alt="Student 2" className="w-full h-full object-cover" />
                </div>
                <p className="text-[11px] text-gray-600 font-semibold mt-1 text-center leading-tight">
                  {student2Name || ''}
                </p>
              </div>
              <div className="flex-1 bg-gray-50 rounded-xl p-3 border border-gray-200">
                <p className="text-[15px] md:text-[16px] text-gray-900 leading-7 font-medium whitespace-pre-line">
                  {student2Message || ''}
                </p>
              </div>
            </div>

            {/* Your Response */}
            <div className="bg-white rounded-[24px] p-5 md:p-7 shadow-sm border border-[#ddd4c4]">
              <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-3 md:mb-4 font-['Georgia',_serif]">
                Your Response:
              </h3>

              {/* Toolbar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-4 border-b border-gray-300">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleCut}
                    className="px-3 py-1.5 md:px-4 md:py-2 bg-[#1e6b73] text-white text-sm rounded hover:bg-[#0A6068] transition-colors"
                  >
                    Cut
                  </button>
                  <button
                    onClick={handlePaste}
                    className="px-3 py-1.5 md:px-4 md:py-2 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300 transition-colors"
                  >
                    Paste
                  </button>
                  <button
                    onClick={() => document.execCommand('undo')}
                    className="px-3 py-1.5 md:px-4 md:py-2 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300 transition-colors"
                  >
                    Undo
                  </button>
                  <button
                    onClick={() => document.execCommand('redo')}
                    className="px-3 py-1.5 md:px-4 md:py-2 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300 transition-colors"
                  >
                    Redo
                  </button>
                </div>
                <button
                  onClick={() => setHideWordCount(!hideWordCount)}
                  className="flex items-center gap-2 text-[#1e6b73] hover:text-[#0A6068] transition-colors"
                >
                  <svg className="w-4 h-4 md:w-5 md:h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
                  </svg>
                  <span className="text-sm font-['Georgia',_serif] font-semibold">
                    {hideWordCount ? 'Show' : 'Hide'} Word Count
                  </span>
                  {!hideWordCount && (
                    <span className={`ml-1 text-sm font-semibold ${wordCount >= 100 ? 'text-green-600' : 'text-gray-700'}`}>
                      {wordCount}
                    </span>
                  )}
                </button>
              </div>

              {/* 자동 높이 확장 textarea */}
              <textarea
                ref={textareaRef}
                value={response}
                onChange={(e) => { setResponse(e.target.value); autoResize(); }}
                onFocus={(e) => {
                  // 글쓰기 시작 시 textarea가 화면 중앙에 보이도록 스크롤 → 글쓰기 편하게
                  setTimeout(() => {
                    e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }, 80);
                }}
                className={`w-full p-4 md:p-5 text-[15px] md:text-[17px] leading-8 font-['Georgia',_serif] border border-[#d6d0c2] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#1e6b73] resize-none overflow-hidden transition-[margin] duration-200 ${aiTutorPinned ? 'md:mr-[420px]' : ''}`}
                style={{ minHeight: '280px' }}
                placeholder="Write your response here..."
              />

              {/* 단어수 100개 달성 표시 */}
              {!hideWordCount && wordCount >= 100 && (
                <p className="mt-2 text-sm text-green-600 font-semibold">
                  ✅ 100 words reached!
                </p>
              )}

              {/* AI 튜터 버튼 — 실전문제 Review 모드에서만 표시 */}
              {isReviewMode && (
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => setShowAiTutor(true)}
                    disabled={!response.trim()}
                    className="flex items-center gap-2 bg-gradient-to-r from-[#1e6b73] to-[#2d8a8c] text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:shadow-lg hover:shadow-[#1e6b73]/30 hover:-translate-y-0.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                  >
                    <Sparkles className="w-4 h-4" />
                    AI 튜터로 첨삭받기
                    <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded">6점 만점</span>
                  </button>
                </div>
              )}
            </div>

            {/* 하단 여백 (모바일 footer 가려짐 방지) */}
            <div className="h-4" />
          </div>
        </div>
      </div>

      {/* Time Remaining Dialog */}
      {showTimeDialog && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4 shadow-2xl">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Time Remaining</h2>
            <div className="space-y-4 text-gray-700 mb-8">
              <p>You still have time to respond. As long as there is time remaining, you can keep writing or revise your response.</p>
              <p>Select <span className="font-bold">Back</span> to keep writing or revising.</p>
              <p>Select <span className="font-bold">Continue</span> to leave this question.</p>
              <p className="font-bold">Once you leave this question, you WILL NOT be able to return to it.</p>
            </div>
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => setShowTimeDialog(false)}
                className="px-8 py-3 bg-[#0A6068] text-white rounded-lg hover:bg-[#084d52] transition-colors font-semibold"
              >
                Back
              </button>
              <button
                onClick={() => { setShowTimeDialog(false); onNext(); }}
                className="px-8 py-3 bg-white border-2 border-[#0A6068] text-[#0A6068] rounded-lg hover:bg-gray-100 transition-colors font-semibold"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Writing AI 튜터 — Academic Discussion 첨삭 (Review 모드) */}
      {showAiTutor && isReviewMode && (
        <WritingReviewAiTutor
          writingType="discussion"
          userAnswer={response}
          questionData={{
            professorName,
            professorMessage,
            student1Name,
            student1Message,
            student2Name,
            student2Message,
            promptTitle,
            promptInstructions,
          }}
          onClose={() => setShowAiTutor(false)}
        />
      )}

      {/* AI 튜터 슬라이드인 패널 — Review 모드에서만 표시, pinnable로 글 작성과 동시 사용 */}
      {isReviewMode && (
        <ToeflAiWidget
          position="right"
          zIndex={60}
          pinnable
          onPinnedChange={setAiTutorPinned}
          contextLabel={`Writing · Academic Discussion`}
          questionData={{
            professorName,
            professorMessage,
            student1Name,
            student1Message,
            student2Name,
            student2Message,
            promptTitle,
            promptInstructions,
          }}
        />
      )}

      <MobileFooter onBack={onBack} onNext={handleNextClick} onHome={onHome} onVolumeClick={onVolumeClick} />
    </div>
  );
}
