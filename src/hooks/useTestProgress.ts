import { useState, useEffect, useCallback } from 'react';

export interface TestProgressData {
  // Common fields
  currentScreen?: string;
  currentQuestionIndex?: number;
  selectedAnswers?: Record<string, any>;
  writingContent?: Record<string, string>;
  recordings?: Record<string, any>;
  
  // Metadata
  testType: string; // 'reading', 'listening', 'writing', 'speaking', 'tpo'
  testId?: string;
  savedAt: number;
  
  // Allow any additional fields
  [key: string]: any;
}

interface UseTestProgressOptions {
  testType: string;
  testId?: string;
  enabled?: boolean; // Set to false to disable auto-save (e.g., in flashcard mode)
  ttlMs?: number; // Time-to-live in milliseconds (default: 7 days)
}

interface UseTestProgressReturn {
  savedProgress: TestProgressData | null;
  showRestoreModal: boolean;
  setShowRestoreModal: (show: boolean) => void;
  saveProgress: (data: Partial<TestProgressData>) => void;
  loadProgress: () => TestProgressData | null;
  clearProgress: () => void;
  restoreProgress: () => void;
  startFresh: () => void;
}

const DEFAULT_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Custom hook for managing test progress with auto-save and restoration
 * 
 * @example
 * ```tsx
 * const { saveProgress, showRestoreModal, restoreProgress, startFresh } = useTestProgress({
 *   testType: 'reading',
 *   testId: 'tpo1-reading'
 * });
 * 
 * // Save progress
 * useEffect(() => {
 *   saveProgress({ currentQuestionIndex, selectedAnswers });
 * }, [currentQuestionIndex, selectedAnswers]);
 * 
 * // Restore UI
 * {showRestoreModal && (
 *   <RestoreModal onRestore={restoreProgress} onFresh={startFresh} />
 * )}
 * ```
 */
export function useTestProgress(options: UseTestProgressOptions): UseTestProgressReturn {
  const {
    testType,
    testId = '',
    enabled = true,
    ttlMs = DEFAULT_TTL_MS
  } = options;

  const storageKey = `test_progress_${testType}${testId ? `_${testId}` : ''}`;
  
  const [savedProgress, setSavedProgress] = useState<TestProgressData | null>(null);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [progressLoaded, setProgressLoaded] = useState(false);
  const [restoredData, setRestoredData] = useState<TestProgressData | null>(null);

  /**
   * Save progress to localStorage
   */
  const saveProgress = useCallback((data: Partial<TestProgressData>) => {
    if (!enabled) return;

    try {
      const progressData: TestProgressData = {
        ...data,
        testType,
        testId,
        savedAt: Date.now()
      };
      
      localStorage.setItem(storageKey, JSON.stringify(progressData));
      console.log(`[useTestProgress] 💾 Progress auto-saved for ${testType}${testId ? ` (${testId})` : ''}`);
    } catch (err) {
      console.warn('[useTestProgress] Failed to save progress:', err);
    }
  }, [enabled, testType, testId, storageKey]);

  /**
   * Load progress from localStorage
   */
  const loadProgress = useCallback((): TestProgressData | null => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (!saved) return null;

      const data: TestProgressData = JSON.parse(saved);
      const isExpired = Date.now() - data.savedAt > ttlMs;

      if (isExpired) {
        localStorage.removeItem(storageKey);
        console.log(`[useTestProgress] ⏰ Saved progress expired (${Math.round(ttlMs / (24 * 60 * 60 * 1000))} days old)`);
        return null;
      }

      console.log(`[useTestProgress] ✅ Found saved progress for ${testType}:`, {
        currentScreen: data.currentScreen,
        questionIndex: data.currentQuestionIndex,
        savedAt: new Date(data.savedAt).toLocaleString()
      });

      return data;
    } catch (err) {
      console.warn('[useTestProgress] Failed to load progress:', err);
      return null;
    }
  }, [storageKey, ttlMs, testType]);

  /**
   * Clear progress from localStorage
   */
  const clearProgress = useCallback(() => {
    localStorage.removeItem(storageKey);
    console.log(`[useTestProgress] 🗑️ Progress cleared for ${testType}${testId ? ` (${testId})` : ''}`);
  }, [storageKey, testType, testId]);

  /**
   * Restore progress (to be called after user confirms)
   */
  const restoreProgress = useCallback(() => {
    if (!savedProgress) return;

    console.log(`[useTestProgress] 🔄 Restoring progress for ${testType}...`);
    setRestoredData(savedProgress);
    setShowRestoreModal(false);
    setSavedProgress(null);
  }, [savedProgress, testType]);

  /**
   * Start fresh (ignore saved progress)
   */
  const startFresh = useCallback(() => {
    console.log(`[useTestProgress] 🆕 Starting fresh test for ${testType}`);
    clearProgress();
    setShowRestoreModal(false);
    setSavedProgress(null);
    setRestoredData(null);
  }, [clearProgress, testType]);

  /**
   * Reset progressLoaded when storageKey changes (e.g. different TPO number)
   */
  useEffect(() => {
    setProgressLoaded(false);
    setSavedProgress(null);
    setShowRestoreModal(false);
  }, [storageKey]);

  /**
   * Check for saved progress on mount
   */
  useEffect(() => {
    if (!enabled || progressLoaded) return;

    const saved = loadProgress();
    if (saved) {
      console.log(`[useTestProgress] Found saved progress, showing restore modal for ${testType}`);
      setSavedProgress(saved);
      setShowRestoreModal(true);
    }
    setProgressLoaded(true);
  }, [enabled, progressLoaded, loadProgress, testType]);

  return {
    savedProgress: restoredData || savedProgress,
    showRestoreModal,
    setShowRestoreModal,
    saveProgress,
    loadProgress,
    clearProgress,
    restoreProgress,
    startFresh
  };
}
