import { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import { MobileFooter } from './MobileFooter';
import { WritingReviewAiTutor } from './WritingReviewAiTutor';
import { ToeflAiWidget } from './ToeflAiWidget';

interface WritingEmailQ1Props {
  onBack: () => void;
  onNext: () => void;
  onHome: () => void;
  onVolumeClick?: () => void;
  writingQuestion?: {
    emailScenario?: string;
    emailInstruction?: string;
    emailBullets?: string[];
    emailSubject?: string;
    emailTo?: string;
  } | null;
  /** 실전문제 Review 모드 — AI 튜터 버튼 표시 */
  isReviewMode?: boolean;
}

export function WritingEmailQ1({ onBack, onNext, onHome, onVolumeClick, writingQuestion, isReviewMode = false }: WritingEmailQ1Props) {
  const [emailBody, setEmailBody] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [hideWordCount, setHideWordCount] = useState(false);
  const [hideTime, setHideTime] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(420); // 7 minutes in seconds
  const [showTimeDialog, setShowTimeDialog] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showAiTutor, setShowAiTutor] = useState(false);
  const [showPassage, setShowPassage] = useState(false);
  // AI 튜터 패널 고정(pinned) 상태 — review 모드에서 글 작성과 동시에 AI 튜터 사용
  const [aiTutorPinned, setAiTutorPinned] = useState(false);


  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 0) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const words = emailBody.trim().split(/\s+/).filter(word => word.length > 0);
    setWordCount(words.length);
  }, [emailBody]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleNextClick = () => {
    setShowTimeDialog(true);
  };

  return (
    <div className="fixed inset-0 bg-gray-50 z-50 flex flex-col">
      {/* Top Header */}
      <div className="bg-[#1e6b73] h-16 flex items-center justify-between px-8 shadow-lg">
        <div className="flex items-center">
          <div 
            className="text-white text-2xl font-['Inter',_sans-serif] font-bold tracking-wide cursor-pointer hover:opacity-80 transition-opacity"
            onClick={onHome}
          >
            *toefl ibt
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {onVolumeClick && (
            <button 
              className="flex items-center gap-3 bg-[#0A6068] border border-white rounded-md px-5 py-1.5 hover:bg-[#084d52] transition-colors"
              onClick={onVolumeClick}
            >
              <span className="text-white font-['Inter',_sans-serif] font-semibold text-base">Volume</span>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="white">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
              </svg>
            </button>
          )}
          
          <button 
            className="flex items-center gap-2 bg-[#0A6068] border border-white rounded-md px-5 py-1.5 hover:bg-[#084d52] transition-colors"
            onClick={onBack}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="white">
              <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
            </svg>
            <span className="text-white font-['Inter',_sans-serif] font-semibold text-base">Back</span>
          </button>
          
          <button 
            className="flex items-center gap-2 bg-white border-2 border-[#0A6068] rounded-lg px-5 py-2 hover:bg-gray-100 transition-colors"
            onClick={handleNextClick}
          >
            <span className="text-[#0A6068] font-['Inter',_sans-serif] font-semibold text-base">Next</span>
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#0A6068">
              <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Tab with Question number and Timer */}
      <div className="bg-white border-b border-gray-300">
        <div className="px-8 py-3 flex items-center justify-between">
          <div className="text-gray-700 font-['Inter',_sans-serif] font-bold">
            Writing | Question 1 of 2
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
                <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
              </svg>
              <span className="font-['Inter',_sans-serif] font-semibold">{hideTime ? 'Show' : 'Hide'} Time</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Tabs for Passage/Response */}
      {isMobile && (
        <div className="bg-white border-b border-gray-300 flex">
          <button
            onClick={() => setShowPassage(true)}
            className={`flex-1 px-4 py-3 font-semibold text-sm ${
              showPassage
                ? 'text-[#1e6b73] border-b-2 border-[#1e6b73]'
                : 'text-gray-500'
            }`}
          >
            Passage
          </button>
          <button
            onClick={() => setShowPassage(false)}
            className={`flex-1 px-4 py-3 font-semibold text-sm ${
              !showPassage
                ? 'text-[#1e6b73] border-b-2 border-[#1e6b73]'
                : 'text-gray-500'
            }`}
          >
            Response
          </button>
        </div>
      )}

      {/* Main content - Split view */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden pb-16 md:pb-0">
        {/* Left side - Instructions */}
        <div className={`md:w-1/3 p-4 md:p-8 overflow-auto bg-gray-50 border-b md:border-b-0 md:border-r border-gray-300 ${
          isMobile ? (showPassage ? 'block' : 'hidden') : 'block'
        }`}>
          <div className="max-w-2xl">
            <p className="text-sm md:text-base text-gray-800 mb-4 md:mb-6 leading-relaxed whitespace-pre-line">
              {writingQuestion?.emailScenario || ''}
            </p>

            <p className="text-sm md:text-base text-gray-800 font-bold mb-3 md:mb-4">
              {writingQuestion?.emailInstruction || ''}
            </p>

            <ul className="space-y-2 md:space-y-3 mb-4 md:mb-6">
              {(writingQuestion?.emailBullets?.filter(b => b.trim()) || []).map((bullet, i) => (
                <li key={i} className="flex items-start gap-2 md:gap-3">
                  <span className="w-2 h-2 rounded-full bg-black mt-2 flex-shrink-0"></span>
                  <span className="text-sm md:text-base text-gray-800">{bullet}</span>
                </li>
              ))}
            </ul>
            
            <p className="text-sm md:text-base text-gray-800">
              Write as much as you can and in complete sentences.
            </p>
          </div>
        </div>

        {/* Right side - Email composition */}
        <div className={`md:w-2/3 p-4 md:p-8 overflow-auto bg-white ${
          isMobile ? (!showPassage ? 'block' : 'hidden') : 'block'
        }`}>
          <div className="mb-6">
            <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-4 md:mb-6">Your Response:</h3>
            
            <div className="mb-4">
              <div className="text-sm md:text-base text-gray-700 mb-2">
                <span className="font-bold">To:</span> {writingQuestion?.emailTo || ''}
              </div>
              <div className="text-sm md:text-base text-gray-700 mb-4 md:mb-6">
                <span className="font-bold">Subject:</span> {writingQuestion?.emailSubject || ''}
              </div>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-4 border-b border-gray-300">
              <div className="flex flex-wrap items-center gap-2">
                <button className="px-3 py-1.5 md:px-4 md:py-2 bg-[#1e6b73] text-white text-sm rounded hover:bg-[#0A6068] transition-colors">
                  Cut
                </button>
                <button className="px-3 py-1.5 md:px-4 md:py-2 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300 transition-colors">
                  Paste
                </button>
                <button className="px-3 py-1.5 md:px-4 md:py-2 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300 transition-colors">
                  Undo
                </button>
                <button className="px-3 py-1.5 md:px-4 md:py-2 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300 transition-colors">
                  Redo
                </button>
              </div>
              
              <button
                onClick={() => setHideWordCount(!hideWordCount)}
                className="flex items-center gap-2 text-[#1e6b73] hover:text-[#0A6068] transition-colors"
              >
                <svg className="w-4 h-4 md:w-5 md:h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                </svg>
                <span className="text-sm font-['Inter',_sans-serif] font-semibold">{hideWordCount ? 'Show' : 'Hide'} Word Count</span>
                {!hideWordCount && <span className="ml-2 text-gray-700 text-sm">{wordCount}</span>}
              </button>
            </div>

            {/* Text area */}
            <textarea
              value={emailBody}
              onChange={(e) => setEmailBody(e.target.value)}
              onFocus={(e) => {
                // 글쓰기 시작 시 textarea가 화면 중앙에 보이도록 스크롤 → 글쓰기 편하게
                setTimeout(() => {
                  e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 80);
              }}
              className={`w-full h-64 md:h-96 p-3 md:p-4 text-sm md:text-base border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#1e6b73] resize-none transition-[margin] duration-200 ${aiTutorPinned ? 'md:mr-[420px]' : ''}`}
              style={{ marginRight: aiTutorPinned ? undefined : undefined }}
              placeholder="Start typing your email here..."
            />

            {/* AI 튜터 버튼 — 실전문제 Review 모드에서만 표시 */}
            {isReviewMode && (
              <div className="mt-3 flex justify-end">
                <button
                  onClick={() => setShowAiTutor(true)}
                  disabled={!emailBody.trim()}
                  className="flex items-center gap-2 bg-gradient-to-r from-[#1e6b73] to-[#2d8a8c] text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:shadow-lg hover:shadow-[#1e6b73]/30 hover:-translate-y-0.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                >
                  <Sparkles className="w-4 h-4" />
                  AI 튜터로 첨삭받기
                  <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded">6점 만점</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Writing AI 튜터 — Email 첨삭 (실전문제 Review 모드) */}
      {showAiTutor && (
        <WritingReviewAiTutor
          writingType="email"
          userAnswer={emailBody}
          questionData={writingQuestion}
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
          contextLabel={`Writing · Write an Email`}
          questionData={writingQuestion}
        />
      )}

      {/* Time Remaining Dialog */}
      {showTimeDialog && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4 shadow-2xl">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Time Remaining</h2>
            
            <div className="space-y-4 text-gray-700 mb-8">
              <p>
                You still have time to respond. As long as there is time remaining, you can keep writing or revise your response.
              </p>
              <p>
                Select <span className="font-bold">Back</span> to keep writing or revising.
              </p>
              <p>
                Select <span className="font-bold">Continue</span> to leave this question.
              </p>
              <p className="font-bold">
                Once you leave this question, you WILL NOT be able to return to it.
              </p>
            </div>

            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => setShowTimeDialog(false)}
                className="px-8 py-3 bg-[#0A6068] text-white rounded-lg hover:bg-[#084d52] transition-colors font-semibold"
              >
                Back
              </button>
              <button
                onClick={() => {
                  setShowTimeDialog(false);
                  onNext();
                }}
                className="px-8 py-3 bg-white border-2 border-[#0A6068] text-[#0A6068] rounded-lg hover:bg-gray-100 transition-colors font-semibold"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Footer */}
      <MobileFooter
        onBack={onBack}
        onNext={handleNextClick}
        onHome={onHome}
        onVolumeClick={onVolumeClick}
      />
    </div>
  );
}