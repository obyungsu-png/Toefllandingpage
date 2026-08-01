/**
 * SpeakingReviewAiTutor.tsx
 * -----------------------------------------------------------------------------
 * 2026 개편 TOEFL Speaking AI 자동 채점 시스템
 *   • Listen & Repeat (Q1~Q7): Whisper STT → WER → 정확도 Band
 *   • Take an Interview (Q8~Q11): STT + 음향메타 → LLM rater (Delivery/Fluency/Topic)
 *
 * EndSpeakingScreen 에서 호출 — 전체 문항 100% 완료 시에만 채점 허용.
 * 결과: 종합 Band(0~6) + 차원별 피드백 → History 전송 (onAiScore).
 */
import { useState, useCallback } from 'react';
import { Sparkles, X, Loader2, Mic, CheckCircle2, AlertCircle } from 'lucide-react';
import { useStt } from '../hooks/useStt';
import {
  gradeSpeakingSession,
  type SpeakingRaterResult,
  type SpeakingQuestionScore,
} from '../utils/speakingRater';
import type { TPOQuestion } from './ContentManagement';

interface SpeakingReviewAiTutorProps {
  questions: TPOQuestion[];
  recordings: Record<string, string>;
  /** 채점 완료 시 부모로 점수 전달 (History 저장용) */
  onScore?: (result: SpeakingRaterResult) => void;
  onClose?: () => void;
}

export function SpeakingReviewAiTutor({
  questions,
  recordings,
  onScore,
  onClose,
}: SpeakingReviewAiTutorProps) {
  const { transcribe } = useStt();
  const [isGrading, setIsGrading] = useState(false);
  const [progress, setProgress] = useState<{ q: number; msg: string } | null>(null);
  const [result, setResult] = useState<SpeakingRaterResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGrade = useCallback(async () => {
    setIsGrading(true);
    setError(null);
    setResult(null);
    setProgress({ q: 0, msg: '채점 준비 중...' });

    try {
      const r = await gradeSpeakingSession({
        questions,
        recordings,
        transcribe,
        onProgress: (q, phase, msg) => setProgress({ q, msg: `Q${q} — ${msg}` }),
        provider: 'claude',
      });
      setResult(r);
      onScore?.(r);
    } catch (err: any) {
      setError(err?.message || '채점 중 오류가 발생했습니다.');
    } finally {
      setIsGrading(false);
      setProgress(null);
    }
  }, [questions, recordings, transcribe, onScore]);

  return (
    <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-[#1e6b73] to-[#2d7a7c]">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-white" />
            <h2 className="text-white font-bold text-lg">Speaking AI 채점</h2>
          </div>
          {onClose && (
            <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {!result && !isGrading && !error && (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[#1e6b73]/10 to-[#2d7a7c]/10 flex items-center justify-center">
                <Mic className="w-8 h-8 text-[#2d7a7c]" />
              </div>
              <p className="text-gray-700 font-semibold mb-1">2026 Speaking 자동 채점</p>
              <p className="text-sm text-gray-500 mb-1">
                Listen &amp; Repeat (Q1~Q7) — Whisper STT + WER 정확도
              </p>
              <p className="text-sm text-gray-500 mb-6">
                Take an Interview (Q8~Q11) — STT + Delivery/Fluency/Topic 루브릭
              </p>
              <button
                onClick={handleGrade}
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-[#1e6b73] to-[#2d7a7c] hover:shadow-lg hover:scale-[1.02] active:scale-95 transition-all"
              >
                <Sparkles className="w-5 h-5" />
                AI 채점 시작
              </button>
            </div>
          )}

          {/* 진행 중 */}
          {isGrading && (
            <div className="text-center py-10">
              <Loader2 className="w-10 h-10 text-[#2d7a7c] animate-spin mx-auto mb-4" />
              <p className="text-gray-700 font-semibold mb-1">채점 진행 중...</p>
              {progress && (
                <p className="text-sm text-gray-500">{progress.msg}</p>
              )}
              <p className="text-xs text-gray-400 mt-3">
                각 문항별로 오디오 로드 → 음성 인식 → 채점 단계를 거칩니다.
              </p>
            </div>
          )}

          {/* 에러 */}
          {error && !isGrading && (
            <div className="py-6">
              <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-700 mb-1">채점 오류</p>
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              </div>
              <button
                onClick={handleGrade}
                className="mt-4 w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-[#1e6b73] to-[#2d7a7c] hover:shadow-lg transition-all"
              >
                다시 시도
              </button>
            </div>
          )}

          {/* 결과 */}
          {result && !isGrading && (
            <SpeakingResultView result={result} onRegrade={handleGrade} />
          )}
        </div>
      </div>
    </div>
  );
}

// ── 결과 표시 ──────────────────────────────────────────────────────────────
function SpeakingResultView({
  result,
  onRegrade,
}: {
  result: SpeakingRaterResult;
  onRegrade: () => void;
}) {
  const lr = result.perQuestion.filter(s => s.kind === 'listen-repeat');
  const iv = result.perQuestion.filter(s => s.kind === 'interview');

  return (
    <div className="space-y-5">
      {/* 종합 점수 */}
      <div className="bg-gradient-to-r from-[#f0fafa] to-[#e8f4f8] rounded-xl p-5 border border-[#d1e8e8]/50">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-[#1e6b73] uppercase tracking-wider">종합 Band</span>
          {result.unavailableCount > 0 && (
            <span className="text-[11px] text-amber-600 font-semibold">
              ⚠️ 채점 불가 {result.unavailableCount}문항
            </span>
          )}
        </div>
        <div className="flex items-end gap-2 mb-2">
          <span className={`text-4xl font-extrabold ${
            result.overallBand >= 4.5 ? 'text-emerald-600'
            : result.overallBand >= 3 ? 'text-amber-600'
            : 'text-red-500'
          }`}>
            {result.overallBand}
          </span>
          <span className="text-sm text-gray-400 mb-1">/ 6.0 (Raw {result.rawScore}/30)</span>
        </div>
        <div className="flex gap-4 text-xs">
          <span className="text-gray-600">Listen &amp; Repeat: <b>{result.listenRepeatBand}</b></span>
          <span className="text-gray-600">Interview: <b>{result.interviewBand}</b></span>
        </div>
      </div>

      {/* Listen & Repeat 상세 */}
      {lr.length > 0 && (
        <div>
          <p className="text-sm font-bold text-[#1e6b73] mb-2">🎧 Listen &amp; Repeat (WER)</p>
          <div className="space-y-2">
            {lr.map(s => (
              <ListenRepeatRow key={s.questionNumber} score={s as any} />
            ))}
          </div>
        </div>
      )}

      {/* Interview 상세 */}
      {iv.length > 0 && (
        <div>
          <p className="text-sm font-bold text-[#1e6b73] mb-2">🎤 Take an Interview</p>
          <div className="space-y-3">
            {iv.map(s => (
              <InterviewRow key={s.questionNumber} score={s as any} />
            ))}
          </div>
        </div>
      )}

      {/* 요약 피드백 */}
      {result.summaryFeedback && (
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">요약</p>
          <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
            {result.summaryFeedback}
          </p>
        </div>
      )}

      <button
        onClick={onRegrade}
        className="w-full py-3 rounded-xl font-semibold text-[#1e6b73] bg-white border-2 border-[#1e6b73]/30 hover:bg-[#f0fafa] transition-all"
      >
        다시 채점
      </button>
    </div>
  );
}

function ListenRepeatRow({ score }: {
  score: {
    questionNumber: number;
    reference: string;
    transcript: string;
    accuracy: number;
    band: number;
    unavailableReason?: string;
  };
}) {
  const pct = Math.round(score.accuracy * 100);
  return (
    <div className="flex items-start gap-3 bg-white border border-gray-200 rounded-lg p-3">
      <span className="text-xs font-bold text-[#1e6b73] w-8 shrink-0 pt-0.5">Q{score.questionNumber}</span>
      <div className="flex-1 min-w-0">
        {score.unavailableReason ? (
          <p className="text-xs text-amber-600">⚠️ {score.unavailableReason}</p>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-sm font-bold ${
                score.band >= 4.5 ? 'text-emerald-600'
                : score.band >= 3 ? 'text-amber-600'
                : 'text-red-500'
              }`}>Band {score.band}</span>
              <span className="text-xs text-gray-400">정확도 {pct}%</span>
            </div>
            <p className="text-[11px] text-gray-500 line-clamp-2">
              정답: "{score.reference.slice(0, 80)}{score.reference.length > 80 ? '...' : ''}"
            </p>
            <p className="text-[11px] text-gray-400 line-clamp-2 mt-0.5">
              인식: "{score.transcript.slice(0, 80)}{score.transcript.length > 80 ? '...' : ''}"
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function InterviewRow({ score }: {
  score: {
    questionNumber: number;
    prompt: string;
    transcript: string;
    wpm: number;
    totalPauseSec: number;
    band: number;
    dimensions: {
      delivery: { score: number; feedback: string };
      fluency: { score: number; feedback: string };
      topicDevelopment: { score: number; feedback: string };
    };
    feedback: string;
    unavailableReason?: string;
  };
}) {
  if (score.unavailableReason) {
    return (
      <div className="flex items-start gap-3 bg-white border border-amber-200 rounded-lg p-3">
        <span className="text-xs font-bold text-amber-600 w-8 shrink-0 pt-0.5">Q{score.questionNumber}</span>
        <p className="text-xs text-amber-600">⚠️ {score.unavailableReason}</p>
      </div>
    );
  }
  const dims = [
    { label: 'Delivery', d: score.dimensions.delivery },
    { label: 'Fluency', d: score.dimensions.fluency },
    { label: 'Topic', d: score.dimensions.topicDevelopment },
  ];
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-[#1e6b73]">Q{score.questionNumber}</span>
        <span className={`text-sm font-bold ${
          score.band >= 4.5 ? 'text-emerald-600'
          : score.band >= 3 ? 'text-amber-600'
          : 'text-red-500'
        }`}>Band {score.band}</span>
      </div>
      <div className="flex gap-3 text-[10px] text-gray-500 mb-2">
        <span>WPM {score.wpm}</span>
        <span>Pause {score.totalPauseSec}s</span>
      </div>
      <div className="space-y-1.5">
        {dims.map(({ label, d }) => (
          <div key={label} className="flex items-start gap-2">
            <span className="text-[11px] font-semibold text-gray-600 w-16 shrink-0">{label}</span>
            <span className={`text-[11px] font-bold w-6 shrink-0 ${
              d.score >= 4.5 ? 'text-emerald-600'
              : d.score >= 3 ? 'text-amber-600'
              : 'text-red-500'
            }`}>{d.score}</span>
            <span className="text-[11px] text-gray-500 flex-1">{d.feedback}</span>
          </div>
        ))}
      </div>
      {score.feedback && (
        <p className="text-[11px] text-gray-600 mt-2 pt-2 border-t border-gray-100 italic">
          {score.feedback}
        </p>
      )}
    </div>
  );
}
