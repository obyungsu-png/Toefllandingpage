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
 * Maps a TestResult to possible localStorage progress keys
 */
function getProgressKeys(result: TestResult): { key: string; label: string }[] {
  const keys: { key: string; label: string }[] = [];
  const category = result.category?.toLowerCase();

  if (result.type === 'TPO') {
    if (category === 'reading') {
      keys.push({ key: 'test_progress_reading', label: 'Reading' });
    } else if (category === 'listening') {
      keys.push({ key: 'test_progress_listening_m1', label: 'Listening M1' });
      keys.push({ key: 'test_progress_listening_m2', label: 'Listening M2' });
    } else if (category === 'writing') {
      keys.push({ key: 'test_progress_writing', label: 'Writing' });
    } else if (category === 'speaking') {
      keys.push({ key: 'test_progress_speaking', label: 'Speaking' });
    } else {
      // Full TPO - check all sections
      keys.push({ key: 'test_progress_reading', label: 'Reading' });
      keys.push({ key: 'test_progress_listening_m1', label: 'Listening M1' });
      keys.push({ key: 'test_progress_listening_m2', label: 'Listening M2' });
      keys.push({ key: 'test_progress_writing', label: 'Writing' });
      keys.push({ key: 'test_progress_speaking', label: 'Speaking' });
    }
  } else if (result.type === 'Test') {
    keys.push({ key: 'test_progress_reading', label: 'Reading' });
    keys.push({ key: 'test_progress_listening_m1', label: 'Listening M1' });
    keys.push({ key: 'test_progress_listening_m2', label: 'Listening M2' });
    keys.push({ key: 'test_progress_writing', label: 'Writing' });
    keys.push({ key: 'test_progress_speaking', label: 'Speaking' });
  } else if (result.type === 'Training') {
    const name = result.testName.toLowerCase();
    if (name.includes('listening')) {
      keys.push({ key: 'test_progress_listening_m1', label: 'Listening M1' });
      keys.push({ key: 'test_progress_listening_m2', label: 'Listening M2' });
    } else if (name.includes('reading')) {
      keys.push({ key: 'test_progress_reading', label: 'Reading' });
    } else if (name.includes('writing')) {
      keys.push({ key: 'test_progress_writing', label: 'Writing' });
    } else if (name.includes('speaking')) {
      keys.push({ key: 'test_progress_speaking', label: 'Speaking' });
    }
  }

  return keys;
}

/**
 * Check localStorage for saved progress matching this test
 */
function findSavedProgress(result: TestResult): SavedProgressInfo[] {
  const keys = getProgressKeys(result);
  const found: SavedProgressInfo[] = [];

  for (const { key, label } of keys) {
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const data = JSON.parse(saved);
        // Check if not expired (7 days)
        const isExpired = Date.now() - data.savedAt > 7 * 24 * 60 * 60 * 1000;
        if (!isExpired) {
          const answersCount = data.selectedAnswers
            ? Object.keys(data.selectedAnswers).length
            : 0;
          found.push({
            key,
            testType: label,
            currentScreen: data.currentScreen,
            currentQuestionIndex: data.currentQuestionIndex,
            totalQuestions: data.totalQuestions,
            answersCount,
            savedAt: data.savedAt,
          });
        }
      }
    } catch (e) {
      // ignore parse errors
    }
  }

  return found;
}

/**
 * Clear all saved progress for a given test result
 */
function clearAllProgress(result: TestResult) {
  const keys = getProgressKeys(result);
  for (const { key } of keys) {
    localStorage.removeItem(key);
    console.log(`[RestartConfirmModal] 🗑️ Cleared progress: ${key}`);
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
            <div className="flex items-center gap-3">
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