import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { ReviewSection } from './ReviewAssistantPanel';

interface ReviewTrainingOverlayProps {
  section: ReviewSection;
  title: string;
  onClose: () => void;
}

interface TrainingQuestion {
  prompt: string;
  options: string[];
  answerIndex: number;
  explanation: string;
}

const SECTION_THEME: Record<ReviewSection, { bg: string; card: string; accent: string }> = {
  Reading: { bg: 'from-[#eff9f8] to-[#dff2f1]', card: '#1d6f73', accent: '#164e52' },
  Listening: { bg: 'from-[#eef4ff] to-[#dce7ff]', card: '#2563eb', accent: '#1d4ed8' },
  Writing: { bg: 'from-[#fff7ed] to-[#ffe7c2]', card: '#d97706', accent: '#b45309' },
  Speaking: { bg: 'from-[#f5f0ff] to-[#e6dbff]', card: '#7c3aed', accent: '#6d28d9' },
};

function getQuestions(section: ReviewSection): TrainingQuestion[] {
  if (section === 'Reading') {
    return [
      {
        prompt: '문단의 중심 아이디어를 가장 잘 요약한 선택지는 무엇인가요?',
        options: ['세부 사례 나열', '주장의 핵심 요약', '반대 입장 강조', '연표 정리'],
        answerIndex: 1,
        explanation: 'Reading 유형문제에서는 문단 전체를 묶는 핵심 주장이나 관점을 먼저 찾는 것이 중요합니다.',
      },
      {
        prompt: '사실 정보 문제가 나왔을 때 가장 먼저 확인해야 하는 것은 무엇인가요?',
        options: ['문단 위치', '지문의 제목', '보기 길이', '시간 제한'],
        answerIndex: 0,
        explanation: '사실 정보 문제는 보통 특정 문단의 근거 문장을 빠르게 찾는 것이 우선입니다.',
      },
      {
        prompt: '추론 문제에서 가장 안정적인 접근은 무엇인가요?',
        options: ['배경지식 활용', '지문에 없는 내용 확장', '근거 문장 기반 최소 추론', '보기 중 가장 긴 문장 선택'],
        answerIndex: 2,
        explanation: '추론은 지문 근거를 벗어나지 않는 범위에서 가장 보수적으로 판단해야 합니다.',
      },
    ];
  }

  if (section === 'Listening') {
    return [
      {
        prompt: '듣기 유형문제에서 화자의 의도를 파악할 때 가장 먼저 볼 것은 무엇인가요?',
        options: ['세부 숫자', '강세와 말투', '배경 이미지', '메모 길이'],
        answerIndex: 1,
        explanation: '의도 문제는 단어 자체보다 억양, 강조, 전후 문맥이 더 중요합니다.',
      },
      {
        prompt: '세부 정보 문제가 들렸을 때 가장 효과적인 전략은 무엇인가요?',
        options: ['전체 내용 다시 해석', '관련 키워드 기억', '모든 보기 번역', '무조건 첫 보기 선택'],
        answerIndex: 1,
        explanation: '키워드와 관련된 장면을 먼저 떠올리면 보기 판단이 빨라집니다.',
      },
      {
        prompt: '강의 구조 문제를 풀 때 핵심 기준은 무엇인가요?',
        options: ['교수의 감정', '예시 개수', '전개 순서', '음성 길이'],
        answerIndex: 2,
        explanation: '도입, 분류, 예시, 결론의 순서를 잡으면 구조 문제 해결이 쉬워집니다.',
      },
    ];
  }

  if (section === 'Writing') {
    return [
      {
        prompt: '통합형/가이드형 글쓰기에서 가장 먼저 정리해야 하는 것은 무엇인가요?',
        options: ['화려한 표현', '핵심 입장과 근거', '문장 길이', '개인 경험'],
        answerIndex: 1,
        explanation: '글을 쓰기 전에 입장과 근거 구조를 정하면 시간 관리가 쉬워집니다.',
      },
      {
        prompt: '유형문제에서 좋은 본문 문장은 어떤 특징을 가져야 하나요?',
        options: ['새 정보가 많다', '질문과 직접 연결된다', '길이가 길다', '감정적이다'],
        answerIndex: 1,
        explanation: '질문 요구와 직접 연결되는 문장이 점수에 더 효과적입니다.',
      },
      {
        prompt: '템플릿을 사용할 때 가장 중요한 원칙은 무엇인가요?',
        options: ['문장을 그대로 외운다', '내용 없이 길게 쓴다', '구조만 활용하고 내용은 문제에 맞춘다', '같은 예시를 반복한다'],
        answerIndex: 2,
        explanation: '템플릿은 틀만 빌리고, 실제 내용은 현재 문제에 맞게 바꿔야 합니다.',
      },
    ];
  }

  return [
    {
      prompt: '스피킹 답변에서 가장 먼저 들려야 하는 것은 무엇인가요?',
      options: ['긴 배경 설명', '명확한 결론', '어려운 단어', '추가 예시'],
      answerIndex: 1,
      explanation: '스피킹은 제한 시간이 짧아서 결론을 먼저 말하는 구조가 안정적입니다.',
    },
    {
      prompt: 'Listen and Speak 유형에서 가장 중요한 포인트는 무엇인가요?',
      options: ['모든 단어 완벽 반복', '핵심 의미 전달', '최대한 빠른 속도', '무조건 긴 답변'],
      answerIndex: 1,
      explanation: '반복형 문제는 핵심 의미와 자연스러운 전달이 우선입니다.',
    },
    {
      prompt: 'Interview형 문제에서 표현 점수를 높이는 가장 현실적인 방법은 무엇인가요?',
      options: ['문법보다 구조 우선', '준비 없이 길게 말하기', '같은 표현 반복', '짧게 한 문장만 말하기'],
      answerIndex: 0,
      explanation: '구조가 분명하면 표현과 내용 전달 모두 안정적으로 좋아집니다.',
    },
  ];
}

export function ReviewTrainingOverlay({ section, title, onClose }: ReviewTrainingOverlayProps) {
  const theme = SECTION_THEME[section];
  const questions = useMemo(() => getQuestions(section), [section]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    setCurrentIndex(0);
    setSelectedIndex(null);
    setChecked(false);
  }, [section, title]);

  const current = questions[currentIndex];
  const isLast = currentIndex === questions.length - 1;

  return (
    <div className={`fixed inset-0 z-[95] flex flex-col bg-gradient-to-br ${theme.bg}`}>
      <div className="flex items-center justify-between border-b border-white/60 px-6 py-4 backdrop-blur-sm sm:px-8">
        <div>
          <p className="text-sm font-semibold text-[#475569]">Training Mode</p>
          <h2 className="mt-1 text-xl font-bold text-[#0f172a]">{title}</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#0f172a] shadow-sm"
        >
          원래 문제로 돌아가기
        </button>
      </div>

      <div className="flex flex-1 items-center justify-center px-4 py-8 sm:px-8">
        <div className="w-full max-w-3xl rounded-[32px] bg-white p-6 shadow-[0_24px_60px_rgba(15,23,42,0.16)] sm:p-8">
          <div className="flex items-center justify-between">
            <div className="rounded-full px-4 py-1 text-xs font-bold text-white" style={{ backgroundColor: theme.card }}>
              {section} Training {currentIndex + 1}/3
            </div>
            {checked && selectedIndex === current.answerIndex && (
              <div className="flex items-center gap-2 text-sm font-semibold text-green-600">
                <CheckCircle2 className="h-4 w-4" />
                정답입니다
              </div>
            )}
          </div>

          <h3 className="mt-6 text-xl font-bold leading-8 text-[#0f172a]">{current.prompt}</h3>

          <div className="mt-6 space-y-3">
            {current.options.map((option, index) => {
              const isCorrect = checked && index === current.answerIndex;
              const isWrong = checked && selectedIndex === index && index !== current.answerIndex;

              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => !checked && setSelectedIndex(index)}
                  className={`w-full rounded-2xl border px-4 py-4 text-left text-sm font-medium transition-colors ${
                    isCorrect
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : isWrong
                        ? 'border-red-400 bg-red-50 text-red-700'
                        : selectedIndex === index
                          ? 'border-slate-400 bg-slate-50 text-slate-800'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {option}
                </button>
              );
            })}
          </div>

          {checked && (
            <div className="mt-6 rounded-2xl bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-600">
              {current.explanation}
            </div>
          )}

          <div className="mt-8 flex justify-end gap-3">
            {!checked ? (
              <button
                type="button"
                disabled={selectedIndex === null}
                onClick={() => setChecked(true)}
                className="rounded-full px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
                style={{ backgroundColor: selectedIndex === null ? '#cbd5e1' : theme.card }}
              >
                정답 확인
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  if (isLast) {
                    onClose();
                    return;
                  }
                  setCurrentIndex((prev) => prev + 1);
                  setSelectedIndex(null);
                  setChecked(false);
                }}
                className="rounded-full px-5 py-2.5 text-sm font-semibold text-white"
                style={{ backgroundColor: theme.card }}
              >
                {isLast ? '원래 문제로 돌아가기' : '다음 문제'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}