/**
 * useTraining Hook
 * 
 * Training 관련 상태와 핸들러를 관리하는 커스텀 훅
 * App.tsx에서 추출됨
 */

import { useState, useEffect, useRef } from 'react';
import { SERVER_BASE_URL, getServerHeaders } from '../utils/apiConfig';
import type { TestResult } from '../types/testResult';

// 초기 싱크 스킵 헬퍼
function consumeInitialSyncSkip(ref: React.MutableRefObject<boolean>): boolean {
  if (ref.current) {
    ref.current = false;
    return true;
  }
  return false;
}

interface UseTrainingReturn {
  trainingConfig: any;
  setTrainingConfig: React.Dispatch<React.SetStateAction<any>>;
  trainingResults: any[];
  setTrainingResults: React.Dispatch<React.SetStateAction<any[]>>;
  skipTrainingConfigSaveRef: React.MutableRefObject<boolean>;
  saveTrainingResultToSupabase: (result: any) => Promise<void>;
  handleAddTrainingResult: (result: any) => void;
}

export function useTraining(
  isLoadingData: boolean,
  dataLoadedSuccessfully: boolean,
  handleAddTestResult: (result: Partial<TestResult>) => void
): UseTrainingReturn {
  // Training Config State
  const [trainingConfig, setTrainingConfig] = useState<any>(null);
  const [trainingResults, setTrainingResults] = useState<any[]>([]);
  
  // 초기 로드 시 저장 스킵용 ref
  const skipTrainingConfigSaveRef = useRef(false);

  // Save Training Config to Supabase (debounced 1s)
  useEffect(() => {
    if (isLoadingData || !dataLoadedSuccessfully || !trainingConfig || consumeInitialSyncSkip(skipTrainingConfigSaveRef)) return;
    
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `${SERVER_BASE_URL}/training-config`,
          {
            method: 'POST',
            headers: {
              ...getServerHeaders(),
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(trainingConfig)
          }
        );
        if (!res.ok) console.error(`❌ Error saving Training Config: ${res.status}`);
        else console.log('💾 Saved Training Config to Supabase');
      } catch (error) {
        console.error('❌ Error saving Training Config:', error);
      }
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [trainingConfig, isLoadingData, dataLoadedSuccessfully]);

  // Save Training Result to Supabase (single append)
  const saveTrainingResultToSupabase = async (result: any) => {
    try {
      const res = await fetch(
        `${SERVER_BASE_URL}/training-results`,
        {
          method: 'POST',
          headers: {
            ...getServerHeaders(),
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(result)
        }
      );
      if (!res.ok) console.error(`❌ Error saving Training Result: ${res.status}`);
      else console.log('💾 Saved Training Result to Supabase');
    } catch (error) {
      console.error('❌ Error saving Training Result:', error);
    }
  };

  // Training Result Handler - saves to both local state and Supabase
  const handleAddTrainingResult = (result: any) => {
    const normalizedResult: Omit<TestResult, 'id'> = {
      type: 'Training',
      category: result.category || result.type || 'Training',
      testName: result.testName || result.title || 'Training',
      testNumber: result.testNumber,
      bankType: 'training',
      trainingType: result.trainingType,
      status: result.status || 'completed',
      date: result.date || result.completedAt || new Date().toISOString(),
      score: result.score ?? 0,
      totalQuestions: result.totalQuestions ?? (parseInt(result.questionCount, 10) || 0),
      correctAnswers: result.correctAnswers ?? 0,
      wrongAnswers: Array.isArray(result.wrongAnswers) ? result.wrongAnswers : [],
      timeSpent: result.timeSpent ?? 0,
    };
    const newResult = {
      id: Date.now().toString(),
      ...normalizedResult,
      savedAt: new Date().toISOString(),
      source: 'training'
    };
    setTrainingResults(prev => [newResult, ...prev]);
    saveTrainingResultToSupabase(newResult);
    // Also save to test results for unified history
    handleAddTestResult(normalizedResult);
  };

  return {
    trainingConfig,
    setTrainingConfig,
    trainingResults,
    setTrainingResults,
    skipTrainingConfigSaveRef,
    saveTrainingResultToSupabase,
    handleAddTrainingResult,
  };
}
