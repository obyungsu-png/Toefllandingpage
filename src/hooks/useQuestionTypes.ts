/**
 * useQuestionTypes Hook
 * 
 * Question Types 관련 상태와 핸들러를 관리하는 커스텀 훅
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

interface UseQuestionTypesReturn {
  questionTypesConfig: any;
  setQuestionTypesConfig: React.Dispatch<React.SetStateAction<any>>;
  questionTypesResults: any[];
  setQuestionTypesResults: React.Dispatch<React.SetStateAction<any[]>>;
  skipQuestionTypesConfigSaveRef: React.MutableRefObject<boolean>;
  saveQuestionTypesResultToSupabase: (result: any) => Promise<void>;
  handleAddQuestionTypesResult: (result: any) => void;
}

export function useQuestionTypes(
  isLoadingData: boolean,
  dataLoadedSuccessfully: boolean,
  handleAddTestResult: (result: Partial<TestResult>) => void
): UseQuestionTypesReturn {
  // Question Types Config State
  const [questionTypesConfig, setQuestionTypesConfig] = useState<any>(null);
  const [questionTypesResults, setQuestionTypesResults] = useState<any[]>([]);
  
  // 초기 로드 시 저장 스킵용 ref
  const skipQuestionTypesConfigSaveRef = useRef(false);

  // Save Question Types Config to Supabase (debounced 1s)
  useEffect(() => {
    if (isLoadingData || !dataLoadedSuccessfully || !questionTypesConfig || consumeInitialSyncSkip(skipQuestionTypesConfigSaveRef)) return;
    
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `${SERVER_BASE_URL}/question-types-config`,
          {
            method: 'POST',
            headers: {
              ...getServerHeaders(),
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(questionTypesConfig)
          }
        );
        if (!res.ok) console.error(`❌ Error saving Question Types Config: ${res.status}`);
        else console.log('💾 Saved Question Types Config to Supabase');
      } catch (error) {
        console.error('❌ Error saving Question Types Config:', error);
      }
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [questionTypesConfig, isLoadingData, dataLoadedSuccessfully]);

  // Save Question Types Result to Supabase (single append)
  const saveQuestionTypesResultToSupabase = async (result: any) => {
    try {
      const res = await fetch(
        `${SERVER_BASE_URL}/question-types-results`,
        {
          method: 'POST',
          headers: {
            ...getServerHeaders(),
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(result)
        }
      );
      if (!res.ok) console.error(`❌ Error saving Question Types Result: ${res.status}`);
      else console.log('💾 Saved Question Types Result to Supabase');
    } catch (error) {
      console.error('❌ Error saving Question Types Result:', error);
    }
  };

  // Question Types Result Handler - saves to both local state and Supabase
  const handleAddQuestionTypesResult = (result: any) => {
    const newResult = {
      id: Date.now().toString(),
      ...result,
      savedAt: new Date().toISOString(),
      source: 'questionTypes'
    };
    setQuestionTypesResults(prev => [newResult, ...prev]);
    saveQuestionTypesResultToSupabase(newResult);
    // Also save to test results for unified history
    handleAddTestResult(result);
  };

  return {
    questionTypesConfig,
    setQuestionTypesConfig,
    questionTypesResults,
    setQuestionTypesResults,
    skipQuestionTypesConfigSaveRef,
    saveQuestionTypesResultToSupabase,
    handleAddQuestionTypesResult,
  };
}
