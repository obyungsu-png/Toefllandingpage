/**
 * useTestHandlers Hook
 * 
 * TPO/Test/Training CRUD 핸들러를 관리하는 커스텀 훅
 * App.tsx에서 추출됨
 */

import { SERVER_BASE_URL, getServerHeaders } from '../utils/apiConfig';
import type { TPOTest } from '../components/ContentManagement';

interface UseTestHandlersParams {
  tpoTests: TPOTest[];
  testTests: TPOTest[];
  trainingTests: TPOTest[];
  setTpoTests: React.Dispatch<React.SetStateAction<TPOTest[]>>;
  setTestTests: React.Dispatch<React.SetStateAction<TPOTest[]>>;
  setTrainingTests: React.Dispatch<React.SetStateAction<TPOTest[]>>;
}

interface UseTestHandlersReturn {
  getTestEndpoint: (testType: TPOTest['testType']) => string;
  upsertLocalTestState: (test: TPOTest) => void;
  removeLocalTestState: (test: TPOTest) => void;
  handleAddTest: (test: TPOTest) => Promise<void>;
  handleUpdateTest: (updatedTest: TPOTest) => Promise<void>;
  handleDeleteTest: (id: string) => Promise<void>;
}

export function useTestHandlers({
  tpoTests,
  testTests,
  trainingTests,
  setTpoTests,
  setTestTests,
  setTrainingTests,
}: UseTestHandlersParams): UseTestHandlersReturn {

  const getTestEndpoint = (testType: TPOTest['testType']) => {
    if (testType === 'TPO') return 'tpo-tests';
    if (testType === 'Training') return 'training-tests';
    return 'test-tests';
  };

  const upsertLocalTestState = (test: TPOTest) => {
    if (test.testType === 'TPO') {
      setTpoTests(prev => {
        const hasExisting = prev.some(existing => existing.id === test.id);
        return hasExisting ? prev.map(existing => existing.id === test.id ? test : existing) : [...prev, test];
      });
      return;
    }

    if (test.testType === 'Training') {
      setTrainingTests(prev => {
        const hasExisting = prev.some(existing => existing.id === test.id);
        return hasExisting ? prev.map(existing => existing.id === test.id ? test : existing) : [...prev, test];
      });
      return;
    }

    setTestTests(prev => {
      const hasExisting = prev.some(existing => existing.id === test.id);
      return hasExisting ? prev.map(existing => existing.id === test.id ? test : existing) : [...prev, test];
    });
  };

  const removeLocalTestState = (test: TPOTest) => {
    if (test.testType === 'TPO') {
      setTpoTests(prev => prev.filter(existing => existing.id !== test.id));
      return;
    }

    if (test.testType === 'Training') {
      setTrainingTests(prev => prev.filter(existing => existing.id !== test.id));
      return;
    }

    setTestTests(prev => prev.filter(existing => existing.id !== test.id));
  };

  // TPO Test Handlers
  const handleAddTest = async (test: TPOTest) => {
    try {
      const endpoint = getTestEndpoint(test.testType);
      const response = await fetch(
        `${SERVER_BASE_URL}/${endpoint}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getServerHeaders()
          },
          body: JSON.stringify(test)
        }
      );
      
      if (!response.ok) {
        throw new Error(`Failed to save test: ${response.status}`);
      }
      
      // Update local state after successful server save
      upsertLocalTestState(test);
      
      console.log(`✅ Saved ${test.testType} ${test.testNumber} to server`);
    } catch (error) {
      console.error('❌ Error saving test:', error);
      alert('테스트 저장 중 오류가 발생했습니다.');
    }
  };

  const handleUpdateTest = async (updatedTest: TPOTest) => {
    try {
      const endpoint = getTestEndpoint(updatedTest.testType);
      const response = await fetch(
        `${SERVER_BASE_URL}/${endpoint}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getServerHeaders()
          },
          body: JSON.stringify(updatedTest)
        }
      );
      
      if (!response.ok) {
        throw new Error(`Failed to update test: ${response.status}`);
      }
      
      // Update local state after successful server save
      upsertLocalTestState(updatedTest);
      
      console.log(`✅ Updated ${updatedTest.testType} ${updatedTest.testNumber} on server`);
    } catch (error) {
      console.error('❌ Error updating test:', error);
      alert('테스트 업데이트 중 오류가 발생했습니다.');
    }
  };

  const handleDeleteTest = async (id: string) => {
    try {
      // Find the test to determine its type and number
      const testToDelete = [...tpoTests, ...testTests, ...trainingTests].find(t => t.id === id);
      if (!testToDelete) {
        console.warn('Test not found for deletion');
        return;
      }
      
      const endpoint = getTestEndpoint(testToDelete.testType);
      const response = await fetch(
        `${SERVER_BASE_URL}/${endpoint}/${testToDelete.testNumber}`,
        {
          method: 'DELETE',
          headers: {
            ...getServerHeaders()
          }
        }
      );
      
      if (!response.ok) {
        throw new Error(`Failed to delete test: ${response.status}`);
      }
      
      // Update local state after successful server deletion
      removeLocalTestState(testToDelete);
      
      console.log(`✅ Deleted ${testToDelete.testType} ${testToDelete.testNumber} from server`);
    } catch (error) {
      console.error('❌ Error deleting test:', error);
      alert('테스트 삭제 중 오류가 발생했습니다.');
    }
  };

  return {
    getTestEndpoint,
    upsertLocalTestState,
    removeLocalTestState,
    handleAddTest,
    handleUpdateTest,
    handleDeleteTest,
  };
}
