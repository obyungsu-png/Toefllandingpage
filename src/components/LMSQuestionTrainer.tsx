import { useState } from 'react';
import { ArrowLeft, Volume2, FileText as FileTextIcon, CheckCircle, XCircle } from 'lucide-react';
import { Button } from './ui/button';
import { RadioOption } from './RadioOption';
import { LMSContent } from './LMSSection';
import { createCachedAudioSync } from '../utils/mediaCache';

interface LMSQuestionTrainerProps {
  contents: LMSContent[];
  questionType: string;
  level: number;
  day: string;
  onBack: () => void;
}

/**
 * Question Types(LMS 업로드 기반) 훈련용 범용 문제 플레이어.
 * - 선택지(options)가 있으면 객관식으로 채점, 없으면 콘텐츠 학습(완료) 모드로 동작
 * - fileType에 따라 오디오 재생 / 이미지 / PDF 링크 / 텍스트(지문) 렌더링
 */
export function LMSQuestionTrainer({ contents, questionType, level, day, onBack }: LMSQuestionTrainerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const total = contents.length;
  const current = contents[currentIndex];
  const isLast = currentIndex === total - 1;
  const isMultipleChoice = !!current?.options?.length;

  if (!current) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-gray-700 mb-4">문제를 불러올 수 없습니다.</p>
          <Button onClick={onBack} className="bg-[#357a7e] hover:bg-[#2d6669] text-white">돌아가기</Button>
        </div>
      </div>
    );
  }

  const playAudio = () => {
    if (!current.fileUrl && current.fileType !== 'audio') return;
    const url = current.fileUrl || current.content || '';
    if (!url) return;
    try {
      const audio = createCachedAudioSync(url);
      setIsPlaying(true);
      audio.onended = () => setIsPlaying(false);
      audio.onerror = () => setIsPlaying(false);
      audio.play().catch(() => setIsPlaying(false));
    } catch {
      setIsPlaying(false);
    }
  };

  const handleCheckAnswer = () => {
    if (!selectedAnswer) return;
    if (selectedAnswer === current.correctAnswer) {
      setCorrectCount((c) => c + 1);
    }
    setAnsweredCount((c) => c + 1);
    setShowResult(true);
  };

  const handleMarkComplete = () => {
    setAnsweredCount((c) => c + 1);
    goNext();
  };

  const goNext = () => {
    if (isLast) {
      const total2 = total;
      alert(`학습 완료!\n총 ${total2}문제${isMultipleChoice || contents.some(c => c.options?.length) ? ` 중 ${correctCount}개 정답` : ''}`);
      onBack();
      return;
    }
    setCurrentIndex((i) => i + 1);
    setSelectedAnswer(null);
    setShowResult(false);
  };

  const isCorrect = selectedAnswer === current.correctAnswer;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
        <button onClick={onBack} className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-2 text-sm">
          <ArrowLeft className="w-4 h-4" />
          돌아가기
        </button>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-gray-800 font-bold text-base sm:text-lg">{questionType} · Level {level} · DAY {day}</h2>
          <div className="text-sm text-gray-600">
            문항 {currentIndex + 1}/{total} {answeredCount > 0 && <>· 정답 {correctCount}개</>}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6 mb-6">
          <h3 className="font-bold text-gray-800 mb-3">{current.title}</h3>

          {/* 콘텐츠 렌더링 (오디오/이미지/PDF/텍스트) */}
          {(current.fileType === 'audio' || current.fileType === 'text-audio') && (
            <button
              onClick={playAudio}
              disabled={isPlaying}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#357a7e] text-white text-sm font-medium mb-4 hover:bg-[#2d6669] transition-colors disabled:opacity-60"
            >
              <Volume2 className="w-4 h-4" />
              {isPlaying ? '재생 중...' : '오디오 듣기'}
            </button>
          )}
          {current.fileType === 'image' && current.content && (
            <img src={current.content} alt="" className="w-full rounded-lg border border-gray-200 mb-4" />
          )}
          {current.fileType === 'pdf' && current.content && (
            <a
              href={current.content}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm font-medium mb-4 hover:bg-gray-200 transition-colors"
            >
              <FileTextIcon className="w-4 h-4" />
              PDF 열기
            </a>
          )}
          {current.fileType === 'text' && current.content && (
            <p className="text-gray-800 leading-relaxed whitespace-pre-wrap mb-4">{current.content}</p>
          )}
          {current.fileType === 'text-audio' && current.content && (
            <p className="text-gray-500 text-sm italic leading-relaxed whitespace-pre-wrap mb-4">스크립트는 정답 확인 후 공개됩니다.</p>
          )}

          {/* 객관식 */}
          {isMultipleChoice ? (
            <div className="space-y-3 mt-4">
              {current.options!.map((opt, idx) => (
                <RadioOption
                  key={idx}
                  id={`lms-q${current.id}-opt-${idx}`}
                  name={`lms-q${current.id}`}
                  value={opt}
                  checked={selectedAnswer === opt}
                  onChange={() => !showResult && setSelectedAnswer(opt)}
                  label={opt}
                  size="sm"
                />
              ))}

              {showResult && (
                <div className={`mt-4 p-4 rounded-lg border-2 ${isCorrect ? 'bg-emerald-50 border-emerald-300' : 'bg-red-50 border-red-300'}`}>
                  <div className="flex items-center gap-2 font-bold mb-1">
                    {isCorrect ? (
                      <><CheckCircle className="w-5 h-5 text-emerald-600" /> <span className="text-emerald-700">정답입니다!</span></>
                    ) : (
                      <><XCircle className="w-5 h-5 text-red-600" /> <span className="text-red-700">오답입니다. 정답: {current.correctAnswer}</span></>
                    )}
                  </div>
                  {current.explanation && (
                    <p className="text-sm text-gray-700 mt-1">{current.explanation}</p>
                  )}
                  {current.fileType === 'text-audio' && current.content && (
                    <p className="text-sm text-gray-600 mt-2 italic whitespace-pre-wrap">스크립트: {current.content}</p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-gray-400 mt-2">이 문제는 학습 후 "완료" 버튼을 눌러 다음으로 넘어가세요.</p>
          )}
        </div>

        <div className="flex justify-end gap-3">
          {isMultipleChoice ? (
            showResult ? (
              <Button onClick={goNext} className="bg-[#357a7e] hover:bg-[#2d6669] text-white px-6">
                {isLast ? '완료' : '다음 문제'}
              </Button>
            ) : (
              <Button onClick={handleCheckAnswer} disabled={!selectedAnswer} className="bg-[#357a7e] hover:bg-[#2d6669] text-white px-6 disabled:opacity-50">
                정답 확인
              </Button>
            )
          ) : (
            <Button onClick={handleMarkComplete} className="bg-[#357a7e] hover:bg-[#2d6669] text-white px-6">
              {isLast ? '완료' : '다음'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
