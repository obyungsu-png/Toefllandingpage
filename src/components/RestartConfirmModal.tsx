import { useState, useEffect } from 'react';
import { RotateCcw, Play, Trash2, Clock, BookOpen, CheckCircle2, FileText, X, AlertTriangle } from 'lucide-react';
import { Button } from './ui/button';
import { TestResult } from '../types/testResult';

interface SavedProgressInfo {
  key: string;
  testType: string;
  currentScreen?: string;
  currentQuestionIndex?: number;
  totalQuestions?: number;
  answersCount: number;
  savedAt: number;
}

interface RestartConfirmModalProps {
  result: TestResult;
  themeColor?: string;
  onContinue: (result: TestResult) => void;
  onStartFresh: (result: TestResult) => void;
  onClose: () => void;
}

/**
 * Maps a TestResult to prefix patterns that its saved-progress localStorage
 * keys should start with. Real keys are `test_progress_<type>[_<extra>]` —
 * e.g. `test_progress_reading_tpo_1`, `test_progress_listening_m1` — so we
 * match by prefix instead of exact key lookup, otherwise per-test keys with
 * a suffix are missed and "이어풀기" never appears.
 */
function getProgressKeyPrefixes(result: TestResult): { prefix: string; label: string }[] {
  const prefixes: { prefix: string; label: string }[] = [];
  const category = result.category?.toLowerCase();

  const readingPrefix = { prefix: 'test_progress_reading', label: 'Reading' };
  const m1Prefix = { prefix: 'test_progress_listening_m1', label: 'Listening M1' };
  const m2Prefix = { prefix: 'test_progress_listening_m2', label: 'Listening M2' };
  const writingPrefix = { prefix: 'test_progress_writing', label: 'Writing' };
  const speakingPrefix = { prefix: 'test_progress_speaking', label: 'Speaking' };

  if (result.type === 'TPO' || result.type === 'Test') {
    if (category === 'reading') {
      prefixes.push(readingPrefix);
    } else if (category === 'listening') {
      prefixes.push(m1Prefix, m2Prefix);
    } else if (category === 'writing') {
      prefixes.push(writingPrefix);
    } else if (category === 'speaking') {
      prefixes.push(speakingPrefix);
    } else {
      prefixes.push(readingPrefix, m1Prefix, m2Prefix, writingPrefix, speakingPrefix);
    }
  } else if (result.type === 'Training') {
    const name = result.testName.toLowerCase();
    if (name.includes('listening')) {
      prefixes.push(m1Prefix, m2Prefix);
    } else if (name.includes('reading')) {
      prefixes.push(readingPrefix);
    } else if (name.includes('writing')) {
      prefixes.push(writingPrefix);
    } else if (name.includes('speaking')) {
      prefixes.push(speakingPrefix);
    }
  }

  return prefixes;
}

/**
 * Enumerate localStorage keys that begin with any of the given prefixes.
 * Also filters out ones whose next character (if any) is not '_' — so
 * `test_progress_listening_m1` doesn't accidentally match a hypothetical
 * `test_progress_reading_something`. Exact-match keys always pass.
 */
function matchingLocalStorageKeys(prefixes: string[]): string[] {
  const matched: string[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k) continue;
      for (const p of prefixes) {
        if (k === p || k.startsWith(p + '_')) {
          matched.push(k);
          break;
        }
      }
    }
  } catch {
    // localStorage 접근 불가 환경 무시
  }
  return matched;
}

/**
 * Check localStorage for saved progress matching this test.
 * Scans every key that starts with each relevant prefix, so per-test
 * variants (e.g. `test_progress_reading_tpo_1`) are picked up too.
 */
function findSavedProgress(result: TestResult): SavedProgressInfo[] {
  const prefixEntries = getProgressKeyPrefixes(result);
  const prefixToLabel = new Map(prefixEntries.map((e) => [e.prefix, e.label]));
  const keys = matchingLocalStorageKeys(prefixEntries.map((e) => e.prefix));
  const found: SavedProgressInfo[] = [];

  for (const key of keys) {
    // Resolve label — longest matching prefix wins.
    let label = 'Progress';
    let bestLen = -1;
    for (const [p, l] of prefixToLabel.entries()) {
      if ((key === p || key.startsWith(p + '_')) && p.length > bestLen) {
        label = l;
        bestLen = p.length;
      }
    }

    try {
      const saved = localStorage.getItem(key);
      if (!saved) continue;
      const data = JSON.parse(saved);
      // Skip if expired (7 days)
      const isExpired = Date.now() - data.savedAt > 7 * 24 * 60 * 60 * 1000;
      if (isExpired) continue;

      const answersCount = data.selectedAnswers ? Object.keys(data.selectedAnswers).length : 0;
      const writingCount = data.writingContent
        ? Object.keys(data.writingContent).filter((k: string) => data.writingContent[k]?.trim()).length
        : 0;
      const recordingCount = data.recordings ? Object.keys(data.recordings).length : 0;

      // Ignore truly empty saves so a blank auto-save doesn't fake progress
      const hasProgress =
        (typeof data.currentQuestionIndex === 'number' && data.currentQuestionIndex > 0) ||
        !!data.currentScreen ||
        answersCount > 0 ||
        writingCount > 0 ||
        recordingCount > 0;
      if (!hasProgress) continue;

      found.push({
        key,
        testType: label,
        currentScreen: data.currentScreen,
        currentQuestionIndex: data.currentQuestionIndex,
        totalQuestions: data.totalQuestions,
        answersCount: answersCount + writingCount + recordingCount,
        savedAt: data.savedAt,
      });
    } catch {
      // ignore parse errors
    }
  }

  // Sort newest first
  found.sort((a, b) => b.savedAt - a.savedAt);
  return found;
}

/**
 * Clear all saved progress for a given test result — same prefix scan.
 */
function clearAllProgress(result: TestResult) {
  const prefixes = getProgressKeyPrefixes(result).map((e) => e.prefix);
  const keys = matchingLocalStorageKeys(prefixes);
  for (const key of keys) {
    localStorage.removeItem(key);
  }
}

export function RestartConfirmModal({
  result,
  themeColor = '#005f61',
  onContinue,
  onStartFresh,
  onClose,
}: RestartConfirmModalProps) {
  const [savedProgress, setSavedProgress] = useState<SavedProgressInfo[]>([]);

  useEffect(() => {
    const progress = findSavedProgress(result);
    setSavedProgress(progress);
  }, [result]);

  const hasSavedProgress = savedProgress.length > 0;

  const handleStartFresh = () => {
    clearAllProgress(result);
    onStartFresh(result);
  };

  const handleContinue = () => {
    onContinue(result);
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div
      className="fixed inset-0 z-[70] bg-black/50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
        style={{ animation: 'scaleIn 0.3s ease-out' }}
      >
        {/* Header */}
        <div className="p-6 pb-4">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-1.5 md:gap-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${themeColor}15` }}
              >
                <RotateCcw className="w-6 h-6" style={{ color: themeColor }} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">시험 다시 풀기</h2>
                <p className="text-sm text-gray-500 mt-0.5">{result.testName}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Description */}
          <div className="bg-gray-50 rounded-xl p-4 mb-2">
            <p className="text-sm text-gray-700 leading-relaxed">
              {hasSavedProgress 
                ? '저장된 풀이 진행 상태가 있습니다. 이어서 풀거나 처음부터 새로 시작할 수 있습니다.'
                : '이 시험을 처음부터 새로 시작합니다.'}
            </p>
          </div>

          {/* Saved progress info */}
          {hasSavedProgress && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-2 mt-3">
              <div className="flex items-start gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                <p className="text-sm text-amber-800 font-medium">
                  저장된 진행 상태
                </p>
              </div>
              <div className="space-y-2">
                {savedProgress.map((sp) => (
                  <div
                    key={sp.key}
                    className="bg-white rounded-lg p-3 border border-amber-100"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span
                        className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
                        style={{ backgroundColor: themeColor }}
                      >
                        {sp.testType}
                      </span>
                      <span className="text-[11px] text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTime(sp.savedAt)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-600">
                      {sp.currentQuestionIndex !== undefined && (
                        <span className="flex items-center gap-1">
                          <BookOpen className="w-3 h-3" style={{ color: themeColor }} />
                          {sp.currentQuestionIndex + 1}
                          {sp.totalQuestions ? ` / ${sp.totalQuestions}` : ''} 문제
                        </span>
                      )}
                      {sp.answersCount > 0 && (
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" style={{ color: themeColor }} />
                          답변 {sp.answersCount}개
                        </span>
                      )}
                      {sp.currentScreen && (
                        <span className="flex items-center gap-1">
                          <FileText className="w-3 h-3" style={{ color: themeColor }} />
                          {sp.currentScreen}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-6 pt-2 space-y-2.5">
          {hasSavedProgress && (
            <button
              onClick={handleContinue}
              className="w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all hover:shadow-md group"
              style={{ borderColor: themeColor, backgroundColor: `${themeColor}08` }}
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${themeColor}15` }}
              >
                <Play className="w-5 h-5" style={{ color: themeColor }} />
              </div>
              <div className="text-left flex-1">
                <p className="font-bold text-sm" style={{ color: themeColor }}>
                  이어서 풀기
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  저장된 위치부터 계속 진행합니다
                </p>
              </div>
              <span
                className="text-xs font-bold px-2.5 py-1 rounded-full text-white"
                style={{ backgroundColor: themeColor }}
              >
                추천
              </span>
            </button>
          )}

          <button
            onClick={handleStartFresh}
            className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-gray-200 bg-white transition-all hover:border-gray-300 hover:bg-gray-50 hover:shadow-md group"
          >
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gray-100 group-hover:bg-gray-200 shrink-0 transition-colors">
              <RotateCcw className="w-5 h-5 text-gray-600 group-hover:text-gray-700 transition-colors" />
            </div>
            <div className="text-left flex-1">
              <p className="font-bold text-sm text-gray-900">
                처음부터 다시 풀기
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {hasSavedProgress
                  ? '기존 진행 상태를 삭제하고 처음부터 시작합니다'
                  : '처음부터 새로 시험을 시작합니다'}
              </p>
            </div>
          </button>

          <button
            onClick={onClose}
            className="w-full py-2.5 text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors"
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
}