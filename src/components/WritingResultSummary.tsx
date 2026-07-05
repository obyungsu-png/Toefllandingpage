import { useState, useEffect } from 'react';
import { MobileFooter } from './MobileFooter';

interface WritingResultSummaryProps {
  onFinish: () => void;
  onHome: () => void;
  writingQuestions?: any[];
}

export function WritingResultSummary({ onFinish, onHome, writingQuestions = [] }: WritingResultSummaryProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [activeTab, setActiveTab] = useState<'bs' | 'email' | 'discussion'>('bs');

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Read answers from window globals
  const bsAnswers = (typeof window !== 'undefined' && (window as any).__writingBsAnswers) || {};
  const emailAnswer = (typeof window !== 'undefined' && (window as any).__writingEmailAnswer) || '';
  const discussionAnswer = (typeof window !== 'undefined' && (window as any).__writingDiscussionAnswer) || '';

  // Find Build a Sentence questions from CMS
  const bsQuestions = writingQuestions.filter((q: any) => {
    const t = (q?.questionType || '').toLowerCase();
    return t.includes('build a sentence') || t.includes('sentence');
  });

  // Count correct BS answers
  let bsCorrect = 0;
  bsQuestions.forEach((q: any, i: number) => {
    const qNum = i + 1;
    const userAns = bsAnswers[qNum] || '';
    const correctAns = q.correctAnswer || '';
    if (userAns && correctAns && userAns.toLowerCase().trim() === correctAns.toLowerCase().trim()) {
      bsCorrect++;
    }
  });
  const bsTotal = bsQuestions.length;
  const bsScore = bsTotal > 0 ? Math.round((bsCorrect / bsTotal) * 100) : 0;

  // Calculate overall score
  const overallScore = bsTotal > 0 ? bsScore : 0;

  const renderBuildSentenceResults = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-800">Build a Sentence</h3>
        <span className="text-sm font-semibold text-teal-600 bg-teal-50 px-3 py-1 rounded-full">
          {bsCorrect}/{bsTotal} Correct
        </span>
      </div>
      {bsQuestions.map((q: any, i: number) => {
        const qNum = i + 1;
        const userAns = bsAnswers[qNum] || '';
        const correctAns = q.correctAnswer || '';
        const isCorrect = userAns && correctAns && userAns.toLowerCase().trim() === correctAns.toLowerCase().trim();

        return (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold text-teal-600">Q{qNum}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {isCorrect ? 'Correct' : 'Incorrect'}
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-3">{q?.questionText || `Build a Sentence Q${qNum}`}</p>
            <div className="space-y-2">
              <div className="text-sm">
                <span className="text-gray-500">Your answer: </span>
                <span className={isCorrect ? 'text-green-700 font-medium' : 'text-red-700 font-medium'}>
                  {userAns || '(no answer)'}
                </span>
              </div>
              {!isCorrect && correctAns && (
                <div className="text-sm">
                  <span className="text-gray-500">Correct answer: </span>
                  <span className="text-green-700 font-medium">{correctAns}</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
      {bsQuestions.length === 0 && (
        <p className="text-gray-500 text-sm text-center py-8">No Build a Sentence results available.</p>
      )}
    </div>
  );

  const renderEmailResult = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-gray-800">Write an Email</h3>
      {emailAnswer ? (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500 mb-2">Your response:</p>
          <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
            {emailAnswer}
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Free-response: not auto-graded. Review your writing for grammar and completeness.
          </div>
        </div>
      ) : (
        <p className="text-gray-500 text-sm text-center py-8">No email response saved.</p>
      )}
    </div>
  );

  const renderDiscussionResult = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-gray-800">Academic Discussion</h3>
      {discussionAnswer ? (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500 mb-2">Your response:</p>
          <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
            {discussionAnswer}
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Free-response: not auto-graded. Check your argument quality and word count (100+ words recommended).
          </div>
        </div>
      ) : (
        <p className="text-gray-500 text-sm text-center py-8">No discussion response saved.</p>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gray-50">
      {/* Header */}
      <div className="flex items-center gap-2 bg-white border-b border-gray-200 px-3 py-2.5 shadow-sm">
        <button onClick={onHome} className="p-1.5 text-gray-400 hover:text-teal-600 rounded-lg hover:bg-teal-50 flex-shrink-0 transition-colors" aria-label="Home">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 leading-tight">Writing Results</p>
          <p className="text-xs text-gray-500 leading-tight">Review your answers</p>
        </div>
        {!isMobile && (
          <button
            onClick={onFinish}
            className="px-4 py-2 rounded-xl text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 transition-colors shadow-sm"
          >
            Finish
          </button>
        )}
      </div>

      {/* Score Summary Card */}
      <div className="px-4 py-4">
        <div className="mx-auto max-w-lg bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Writing Score</h2>
              <p className="text-xs text-gray-500 mt-0.5">Build a Sentence accuracy</p>
            </div>
            <div className="flex items-center gap-2">
              <div className={`text-3xl font-bold ${overallScore >= 70 ? 'text-teal-600' : overallScore >= 40 ? 'text-amber-600' : 'text-red-600'}`}>
                {overallScore}%
              </div>
            </div>
          </div>
          {/* Progress bar */}
          <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${overallScore >= 70 ? 'bg-teal-500' : overallScore >= 40 ? 'bg-amber-500' : 'bg-red-500'}`}
              style={{ width: `${overallScore}%` }}
            />
          </div>
        </div>
      </div>

      {/* Mobile Tab Navigation */}
      {isMobile && (
        <div className="bg-white border-b border-gray-200 flex">
          {['bs', 'email', 'discussion'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`flex-1 px-3 py-2.5 text-xs font-semibold transition-all ${
                activeTab === tab
                  ? 'text-teal-600 border-b-2 border-teal-600'
                  : 'text-gray-500'
              }`}
            >
              {tab === 'bs' ? 'Build Sentence' : tab === 'email' ? 'Email' : 'Discussion'}
            </button>
          ))}
        </div>
      )}

      {/* Main content */}
      <div className={`flex-1 overflow-auto px-4 py-4 ${isMobile ? 'pb-20' : ''}`}>
        <div className="mx-auto max-w-lg">
          {/* Desktop: show all */}
          {!isMobile ? (
            <div className="space-y-8">
              {renderBuildSentenceResults()}
              <div className="border-t border-gray-200 pt-6">
                {renderEmailResult()}
              </div>
              <div className="border-t border-gray-200 pt-6">
                {renderDiscussionResult()}
              </div>
            </div>
          ) : (
            /* Mobile: tab-based */
            <>
              {activeTab === 'bs' && renderBuildSentenceResults()}
              {activeTab === 'email' && renderEmailResult()}
              {activeTab === 'discussion' && renderDiscussionResult()}
            </>
          )}
        </div>
      </div>

      {/* Bottom note (desktop only) */}
      {!isMobile && (
        <div className="px-4 py-3 border-t border-gray-200 bg-white">
          <p className="text-xs text-gray-400 text-center">
            Results are also saved to your History for later review.
          </p>
        </div>
      )}

      {/* Mobile Footer with Finish */}
      {isMobile && (
        <MobileFooter
          onNext={onFinish}
          onHome={onHome}
          showBack={false}
          nextLabel="Finish"
        />
      )}
    </div>
  );
}
