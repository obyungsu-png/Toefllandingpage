import { useEffect, useMemo, useRef, useState } from 'react';
import { BookOpen, ClipboardList, FileText, Languages, MessageSquareText, Sparkles, Volume2, X, type LucideIcon } from 'lucide-react';

export type ReviewSection = 'Reading' | 'Listening' | 'Writing' | 'Speaking';
export type ReviewVariant = 'reading' | 'listening' | 'writing-basic' | 'writing-guided' | 'speaking-repeat' | 'speaking-interview';

interface ReviewAssistantPanelProps {
  section: ReviewSection;
  variant: ReviewVariant;
  contentKey: string;
  onStartTraining: (title: string) => void;
}

interface DictationExercise {
  prompt: string;
  fullSentence: string;
  blanks: string[];
  segments: string[];
}

const TAB_CONFIG: Record<ReviewVariant, string[]> = {
  reading: ['해석', '분석', '단어', '유형문제'],
  listening: ['받아쓰기', '단어', '유형문제'],
  'writing-basic': ['유형문제'],
  'writing-guided': ['분석', '표현', '템플릿', '유형문제'],
  'speaking-repeat': ['받아쓰기', '단어', '유형문제'],
  'speaking-interview': ['분석', '표현', '템플릿', '유형문제'],
};

const PANEL_THEME: Record<ReviewSection, { accent: string; soft: string; border: string }> = {
  Reading: { accent: '#1d6f73', soft: '#edf7f6', border: '#b9dedd' },
  Listening: { accent: '#2563eb', soft: '#eef4ff', border: '#c7d8ff' },
  Writing: { accent: '#d97706', soft: '#fff6e7', border: '#f5d7aa' },
  Speaking: { accent: '#7c3aed', soft: '#f4efff', border: '#d9c9ff' },
};

const TAB_META: Record<string, { icon: LucideIcon; title: string; description: string }> = {
  '받아쓰기': {
    icon: Volume2,
    title: '받아쓰기 트레이닝',
    description: '오디오를 듣고 빈칸을 채우며 핵심 표현을 정확하게 복기합니다.',
  },
  해석: {
    icon: Languages,
    title: '지문 해석',
    description: '핵심 문장과 논리 흐름을 빠르게 잡을 수 있도록 정리했습니다.',
  },
  분석: {
    icon: FileText,
    title: '문제 분석',
    description: '정답 판단 기준과 접근 순서를 짧고 명확하게 확인할 수 있습니다.',
  },
  단어: {
    icon: Sparkles,
    title: '핵심 단어',
    description: '현재 문항에서 바로 써먹을 수 있는 어휘만 추려서 보여줍니다.',
  },
  표현: {
    icon: MessageSquareText,
    title: '유용한 표현',
    description: '답변이나 에세이에 바로 적용할 수 있는 문장 패턴을 모았습니다.',
  },
  템플릿: {
    icon: BookOpen,
    title: '답변 템플릿',
    description: '시간 안에 구조를 잡을 수 있도록 실전형 포맷을 제공합니다.',
  },
  템프릿: {
    icon: BookOpen,
    title: '답변 템플릿',
    description: '시간 안에 구조를 잡을 수 있도록 실전형 포맷을 제공합니다.',
  },
  유형문제: {
    icon: ClipboardList,
    title: '유형문제 훈련',
    description: '비슷한 난이도의 추가 문제로 바로 연결해 감각을 이어갑니다.',
  },
};

function buildDictationExercise(variant: ReviewVariant): DictationExercise {
  if (variant === 'speaking-repeat') {
    return {
      prompt: '음성 아이콘을 누르고, 들리는 문장을 빈칸에 입력하세요.',
      fullSentence: 'Please welcome the visitors and guide them to the main hall.',
      blanks: ['welcome', 'guide', 'main hall'],
      segments: ['Please ', ' the visitors and ', ' them to the ', '.'],
    };
  }

  return {
    prompt: '음성 아이콘을 누르고, 들리는 내용을 받아쓰세요.',
    fullSentence: 'The orientation session starts at nine and students should bring their ID cards.',
    blanks: ['nine', 'students', 'ID cards'],
    segments: ['The orientation session starts at ', ' and ', ' should bring their ', '.'],
  };
}

function getWords(section: ReviewSection, variant: ReviewVariant) {
  if (section === 'Reading') {
    return [
      { word: 'attribute', meaning: '원인을 ~의 탓으로 돌리다' },
      { word: 'notion', meaning: '개념, 생각' },
      { word: 'subsequent', meaning: '그 다음의' },
      { word: 'crucial', meaning: '매우 중요한' },
    ];
  }

  if (variant === 'speaking-repeat') {
    return [
      { word: 'escort', meaning: '안내하다, 동행하다' },
      { word: 'entrance', meaning: '입구' },
      { word: 'schedule', meaning: '일정' },
      { word: 'proceed', meaning: '진행하다, 나아가다' },
    ];
  }

  return [
    { word: 'clarify', meaning: '명확히 하다' },
    { word: 'concern', meaning: '우려, 걱정' },
    { word: 'proposal', meaning: '제안' },
    { word: 'convincing', meaning: '설득력 있는' },
  ];
}

function getAnalysisLines(variant: ReviewVariant) {
  if (variant === 'writing-guided') {
    return [
      '문제가 요구하는 입장과 근거 수를 먼저 확인합니다.',
      '도입 1문장, 근거 2개, 마무리 1문장 구조로 빠르게 잡습니다.',
      '읽기/듣기 또는 제시문과 직접 연결되는 핵심만 남기고 군더더기를 줄입니다.',
    ];
  }

  return [
    '질문 의도와 화자의 목적을 먼저 파악합니다.',
    '답변은 결론을 먼저 말하고 이유나 예시를 뒤에 붙이는 구조가 안정적입니다.',
    '제한 시간 안에서는 새로운 아이디어보다 명확한 구조가 더 중요합니다.',
  ];
}

function getExpressionLines(section: ReviewSection) {
  if (section === 'Writing') {
    return [
      'One reason I would emphasize is that ...',
      'The lecture directly challenges the reading by pointing out that ...',
      'This example clearly illustrates why the proposal is effective.',
    ];
  }

  return [
    'From my point of view, the main issue is that ...',
    'What the speaker really means is that ...',
    'Overall, the best response is to focus on ...',
  ];
}

function getTemplateLines(section: ReviewSection) {
  if (section === 'Writing') {
    return [
      'Introduction: State the main claim or summarize the relationship between the sources.',
      'Body 1: Explain the first key point with one direct detail.',
      'Body 2: Add the second supporting point and show contrast or consequence.',
      'Conclusion: Restate the main takeaway in one concise sentence.',
    ];
  }

  return [
    'Answer: My answer is ...',
    'Reason: The main reason is ...',
    'Detail: For example, ...',
    'Closing: So that is why ...',
  ];
}

function getTrainingTitle(section: ReviewSection, variant: ReviewVariant) {
  if (section === 'Reading') return 'Reading 유형문제 Training';
  if (section === 'Listening') return 'Listening 유형문제 Training';
  if (variant === 'writing-guided') return 'Writing 1/2, 2/2 유형문제 Training';
  if (variant === 'writing-basic') return 'Writing 유형문제 Training';
  if (variant === 'speaking-interview') return 'Take an Interview 유형문제 Training';
  return 'Listen and Speak 유형문제 Training';
}

function getTabMeta(tab: string) {
  return TAB_META[tab] ?? {
    icon: Sparkles,
    title: tab,
    description: `${tab} 내용을 확인할 수 있습니다.`,
  };
}

export function ReviewAssistantPanel({ section, variant, contentKey, onStartTraining }: ReviewAssistantPanelProps) {
  const tabs = TAB_CONFIG[variant];
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [dictationInputs, setDictationInputs] = useState<string[]>([]);
  const [dictationChecked, setDictationChecked] = useState(false);
  const dictationInputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const theme = PANEL_THEME[section];

  const dictationExercise = useMemo(() => buildDictationExercise(variant), [variant]);
  const wordList = useMemo(() => getWords(section, variant), [section, variant]);
  const activeTabMeta = activeTab ? getTabMeta(activeTab) : null;

  useEffect(() => {
    setActiveTab(null);
    setDictationInputs(Array(dictationExercise.blanks.length).fill(''));
    setDictationChecked(false);
  }, [contentKey, dictationExercise.blanks.length, tabs]);

  const playDictation = () => {
    if (!('speechSynthesis' in window)) {
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(dictationExercise.fullSentence);
    utterance.rate = 0.85;
    utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
  };

  const normalizeDictationValue = (value: string) => value.trim().toLowerCase().replace(/\s+/g, ' ');

  const isDictationCorrect = (index: number) => normalizeDictationValue(dictationInputs[index] || '') === normalizeDictationValue(dictationExercise.blanks[index] || '');

  const renderDictation = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 rounded-2xl border px-4 py-3" style={{ backgroundColor: theme.soft, borderColor: theme.border }}>
        <div>
          <p className="text-sm font-semibold text-[#1f2937]">받아쓰기</p>
          <p className="mt-1 text-xs leading-5 text-[#5b6470]">{dictationExercise.prompt}</p>
        </div>
        <button
          type="button"
          onClick={playDictation}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white shadow-sm"
          style={{ backgroundColor: theme.accent }}
        >
          <Volume2 className="h-5 w-5" />
        </button>
      </div>

      <div className="rounded-2xl border border-[#e5e7eb] bg-white px-4 py-4">
        <div className="flex flex-wrap items-end gap-x-2 gap-y-3 text-[15px] leading-7 text-[#1f2937]">
          {dictationExercise.segments.map((segment, index) => (
            <div key={`${segment}-${index}`} className="contents">
              <span>{segment}</span>
              {index < dictationExercise.blanks.length && (
                <span className="inline-flex flex-col items-start gap-1 align-bottom">
                  <span className="inline-flex items-center gap-2">
                    <input
                      ref={(element) => {
                        dictationInputRefs.current[index] = element;
                      }}
                      value={dictationInputs[index] || ''}
                      onChange={(event) => {
                        const nextValue = event.target.value;
                        const next = [...dictationInputs];
                        next[index] = nextValue;
                        setDictationInputs(next);
                        setDictationChecked(false);

                        if (
                          index < dictationExercise.blanks.length - 1 &&
                          normalizeDictationValue(nextValue).length >= normalizeDictationValue(dictationExercise.blanks[index]).length
                        ) {
                          dictationInputRefs.current[index + 1]?.focus();
                          dictationInputRefs.current[index + 1]?.select();
                        }
                      }}
                      className={`border-b-2 bg-transparent px-1 py-0.5 text-center outline-none ${
                        dictationChecked
                          ? isDictationCorrect(index)
                            ? 'border-green-500 text-green-700'
                            : 'border-red-500 text-red-600'
                          : 'border-[#94a3b8] text-[#1f2937]'
                      }`}
                      style={{ width: `${Math.max(dictationExercise.blanks[index].length * 11, 72)}px` }}
                    />
                    {dictationChecked && (
                      <span className={`text-xs font-semibold ${isDictationCorrect(index) ? 'text-green-600' : 'text-red-500'}`}>
                        {isDictationCorrect(index) ? '맞음' : `정답: ${dictationExercise.blanks[index]}`}
                      </span>
                    )}
                  </span>
                </span>
              )}
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setDictationChecked(true)}
            className="rounded-full px-4 py-2 text-sm font-semibold text-white"
            style={{ backgroundColor: theme.accent }}
          >
            정답 확인
          </button>
          {dictationChecked && <p className="text-xs text-[#64748b]">틀린 칸은 빨간색, 맞은 칸은 초록색으로 표시됩니다.</p>}
        </div>
      </div>
    </div>
  );

  const renderWords = () => (
    <div className="space-y-3">
      {wordList.map((item) => (
        <div key={item.word} className="rounded-2xl border border-[#e5e7eb] bg-white px-4 py-3">
          <p className="text-sm font-bold text-[#111827]">{item.word}</p>
          <p className="mt-1 text-xs text-[#64748b]">{item.meaning}</p>
        </div>
      ))}
    </div>
  );

  const renderBullets = (title: string, lines: string[], icon: JSX.Element) => (
    <div className="rounded-2xl border border-[#e5e7eb] bg-white px-4 py-4">
      <div className="flex items-center gap-2 text-sm font-bold text-[#111827]">
        {icon}
        <span>{title}</span>
      </div>
      <div className="mt-3 space-y-2">
        {lines.map((line) => (
          <div key={line} className="rounded-xl bg-[#f8fafc] px-3 py-2 text-xs leading-5 text-[#475569]">
            {line}
          </div>
        ))}
      </div>
    </div>
  );

  const renderTypeTraining = () => (
    <div className="rounded-2xl border border-[#e5e7eb] bg-white px-4 py-4">
      <div className="flex items-center gap-2 text-sm font-bold text-[#111827]">
        <ClipboardList className="h-4 w-4" />
        <span>유형문제</span>
      </div>
      <p className="mt-3 text-xs leading-5 text-[#64748b]">
        현재 문제와 비슷한 유형과 난이도의 3문제를 먼저 풀고, 완료하면 자동으로 원래 문제 화면으로 돌아옵니다.
      </p>
      <button
        type="button"
        onClick={() => onStartTraining(getTrainingTitle(section, variant))}
        className="mt-4 rounded-full px-4 py-2 text-sm font-semibold text-white"
        style={{ backgroundColor: theme.accent }}
      >
        3문제 시작하기
      </button>
    </div>
  );

  const renderActiveTab = () => {
    if (!activeTab) return null;

    if (activeTab === '받아쓰기') return renderDictation();
    if (activeTab === '단어') return renderWords();
    if (activeTab === '해석') {
      return renderBullets(
        '지문 해석',
        [
          '핵심 문장은 먼저 직역하고, 뒤에서 자연스럽게 재구성합니다.',
          '배경 설명보다 결론과 근거의 연결을 먼저 잡으면 빠르게 이해됩니다.',
          '문단마다 중심 문장을 한 줄로 요약하는 습관이 중요합니다.',
        ],
        <Languages className="h-4 w-4" />,
      );
    }
    if (activeTab === '분석') {
      return renderBullets('문제 분석', getAnalysisLines(variant), <FileText className="h-4 w-4" />);
    }
    if (activeTab === '표현') {
      return renderBullets('유용한 표현', getExpressionLines(section), <MessageSquareText className="h-4 w-4" />);
    }
    if (activeTab === '템플릿' || activeTab === '템프릿') {
      return renderBullets('템플릿', getTemplateLines(section), <BookOpen className="h-4 w-4" />);
    }
    return renderTypeTraining();
  };

  return (
    <div className="fixed bottom-20 right-3 z-[90] w-[calc(100vw-1.5rem)] max-w-[30rem] sm:bottom-8 sm:right-8 sm:w-[calc(100vw-4rem)] sm:max-w-[34rem]">
      <div className="space-y-3">
        <div
          className="rounded-[30px] border border-white/70 bg-white/75 p-2 shadow-[0_20px_50px_rgba(15,23,42,0.14)] backdrop-blur-xl"
          style={{
            borderColor: theme.border,
            background: `linear-gradient(180deg, ${theme.soft}cc 0%, rgba(255,255,255,0.94) 100%)`,
          }}
        >
          <div className="flex gap-1 overflow-x-auto pb-1">
          {tabs.map((tab) => (
            (() => {
              const meta = getTabMeta(tab);
              const Icon = meta.icon;

              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab((current) => current === tab ? null : tab)}
                  className={`group relative inline-flex min-w-[60px] items-center gap-1 overflow-hidden rounded-[16px] border px-2 py-2 text-xs font-semibold transition-all duration-300 sm:min-w-[80px] sm:px-3 sm:py-2.5 sm:text-sm ${
                    activeTab === tab
                      ? 'text-white -translate-y-0.5'
                      : 'text-[#475569] hover:-translate-y-0.5 hover:text-[#0f172a]'
                  }`}
                  style={{
                    borderColor: activeTab === tab ? `${theme.accent}55` : theme.border,
                    background: activeTab === tab
                      ? `linear-gradient(135deg, ${theme.accent} 0%, ${theme.accent}dd 100%)`
                      : 'linear-gradient(180deg, rgba(255,255,255,0.94) 0%, rgba(248,250,252,0.92) 100%)',
                    boxShadow: activeTab === tab
                      ? `0 12px 24px ${theme.accent}22`
                      : '0 4px 12px rgba(15,23,42,0.06)',
                  }}
                >
                  <span className={`absolute inset-0 opacity-0 transition-opacity duration-300 ${activeTab === tab ? 'opacity-100' : 'group-hover:opacity-100'}`} style={{ background: activeTab === tab ? 'transparent' : `linear-gradient(135deg, ${theme.soft} 0%, rgba(255,255,255,0) 100%)` }} />
                  <span className="relative z-10 flex h-6 w-6 items-center justify-center rounded-full bg-white/18 backdrop-blur-sm sm:h-8 sm:w-8">
                    <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </span>
                  <span className="relative z-10 whitespace-nowrap">{tab === '템프릿' ? '템플릿' : tab}</span>
                </button>
              );
            })()
          ))}
          </div>
        </div>

        {activeTab && activeTabMeta && (
          <div className="relative pt-3">
            <button
              type="button"
              onClick={() => setActiveTab(null)}
              className="absolute right-3 top-0 z-20 inline-flex items-center gap-1 rounded-full border border-white/80 bg-white/95 px-3 py-1.5 text-xs font-semibold text-[#334155] shadow-[0_10px_24px_rgba(15,23,42,0.12)] backdrop-blur"
            >
              <X className="h-3.5 w-3.5" />
              닫기
            </button>

            <div
              className="relative overflow-hidden rounded-[30px] border bg-white/95 p-4 shadow-[0_22px_50px_rgba(15,23,42,0.16)] backdrop-blur-xl sm:p-5"
              style={{ borderColor: theme.border }}
            >
              <div className="absolute right-[-40px] top-[-56px] h-36 w-36 rounded-full opacity-20 blur-3xl" style={{ backgroundColor: theme.accent }} />

              <div className="relative">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white shadow-[0_10px_24px_rgba(15,23,42,0.12)]" style={{ background: `linear-gradient(135deg, ${theme.accent} 0%, ${theme.accent}dd 100%)` }}>
                    <activeTabMeta.icon className="h-5 w-5" />
                  </div>

                  <div className="min-w-0 flex-1 pt-0.5">
                    <div className="inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ borderColor: theme.border, backgroundColor: theme.soft, color: theme.accent }}>
                      {section}
                    </div>
                    <h3 className="mt-3 text-[1.1rem] font-bold leading-7 text-[#0f172a]">{activeTabMeta.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-[#64748b]">{activeTabMeta.description}</p>
                  </div>
                </div>

                <div className="mt-5 max-h-[500px] overflow-y-auto pr-1">
                  {renderActiveTab()}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
