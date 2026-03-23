import { BookOpen, Clock, CheckCircle2, FileText } from 'lucide-react';
import { Button } from './ui/button';
import { TestProgressData } from '../hooks/useTestProgress';

interface TestProgressRestoreModalProps {
  savedProgress: TestProgressData;
  themeColor?: string;
  onRestore: () => void;
  onStartFresh: () => void;
}

export function TestProgressRestoreModal({
  savedProgress,
  themeColor = '#0f766e',
  onRestore,
  onStartFresh
}: TestProgressRestoreModalProps) {
  const getProgressDetails = () => {
    const details: { label: string; value: string; icon?: any }[] = [];

    // Current screen/question
    if (savedProgress.currentScreen) {
      details.push({
        label: '현재 화면',
        value: savedProgress.currentScreen,
        icon: FileText
      });
    }
    
    if (savedProgress.currentQuestionIndex !== undefined) {
      const total = savedProgress.totalQuestions || '?';
      details.push({
        label: '진행률',
        value: `${savedProgress.currentQuestionIndex + 1} / ${total} 문제`,
        icon: BookOpen
      });
    }

    // Answers completed
    const answersCount = savedProgress.selectedAnswers 
      ? Object.keys(savedProgress.selectedAnswers).length 
      : 0;
    if (answersCount > 0) {
      details.push({
        label: '답변 완료',
        value: `${answersCount}개`,
        icon: CheckCircle2
      });
    }

    // Writing content
    const writingCount = savedProgress.writingContent
      ? Object.keys(savedProgress.writingContent).filter(
          key => savedProgress.writingContent![key]?.trim()
        ).length
      : 0;
    if (writingCount > 0) {
      details.push({
        label: '작성 완료',
        value: `${writingCount}개`,
        icon: FileText
      });
    }

    // Recordings
    const recordingsCount = savedProgress.recordings
      ? Object.keys(savedProgress.recordings).length
      : 0;
    if (recordingsCount > 0) {
      details.push({
        label: '녹음 완료',
        value: `${recordingsCount}개`,
        icon: CheckCircle2
      });
    }

    // Saved time
    details.push({
      label: '저장 시간',
      value: new Date(savedProgress.savedAt).toLocaleString('ko-KR', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      icon: Clock
    });

    return details;
  };

  const details = getProgressDetails();

  const getTestTypeName = (type: string) => {
    const names: Record<string, string> = {
      'reading': 'Reading 시험',
      'listening': 'Listening 시험',
      'writing': 'Writing 시험',
      'speaking': 'Speaking 시험',
      'tpo': 'TPO 시험',
      'vocabulary': '어휘 시험'
    };
    return names[type] || '시험';
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
        style={{ animation: 'scaleIn 0.3s ease-out' }}
      >
        <div className="text-center mb-6">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: `${themeColor}20` }}
          >
            <BookOpen className="w-8 h-8" style={{ color: themeColor }} />
          </div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: themeColor }}>
            이전에 푸시던 {getTestTypeName(savedProgress.testType)}이 있습니다
          </h2>
          <p className="text-gray-600 text-sm">
            이어서 풀기를 선택하면 저장된 위치부터 계속할 수 있습니다.
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-3">
          {details.map((detail, index) => {
            const Icon = detail.icon;
            return (
              <div key={index} className="flex justify-between items-center text-sm">
                <span className="text-gray-600 flex items-center gap-2">
                  {Icon && <Icon className="w-4 h-4" style={{ color: themeColor }} />}
                  {detail.label}
                </span>
                <span className="font-medium" style={{ color: themeColor }}>
                  {detail.value}
                </span>
              </div>
            );
          })}
        </div>

        <div className="flex gap-3">
          <Button
            onClick={onRestore}
            variant="outline"
            className="flex-1 bg-white hover:bg-gray-50"
          >
            이어서 풀기
          </Button>
          <Button
            onClick={onStartFresh}
            className="flex-1 text-white bg-[#f39c12] hover:bg-[#e67e22]"
          >
            새로 시작
          </Button>
        </div>
      </div>
    </div>
  );
}