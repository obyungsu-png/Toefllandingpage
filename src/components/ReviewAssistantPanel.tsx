import { useEffect, useMemo, useRef, useState } from 'react';
import { BookOpen, ClipboardList, FileText, Languages, MessageSquareText, Sparkles, Volume2, X, type LucideIcon } from 'lucide-react';

export type ReviewSection = 'Reading' | 'Listening' | 'Writing' | 'Speaking';
export type ReviewVariant = 'reading' | 'listening' | 'writing-basic' | 'writing-guided' | 'speaking-repeat' | 'speaking-interview';
export type ReviewDifficulty = '쉬움' | '보통' | '어려움';

export interface ReviewPatternTrainingRequest {
  title: string;
  questionType?: string;
  difficulty?: ReviewDifficulty;
}

interface ReviewAssistantPanelProps {
  section: ReviewSection;
  variant: ReviewVariant;
  contentKey: string;
  questionType?: string;
  currentDifficulty?: ReviewDifficulty;
  onStartTraining: (request: ReviewPatternTrainingRequest) => void;
  // CMS question data for Translation, Analysis, Key Words
  translationNote?: string;
  analysisNote?: string;
  vocabularyNote?: string;
}

interface DictationExercise {
  prompt: string;
  fullSentence: string;
  blanks: string[];
  segments: string[];
}

const TAB_CONFIG: Record<ReviewVariant, string[]> = {
  reading: ['Translation', 'Analysis', 'Key Words', 'Practice'],
  listening: ['Dictation', 'Key Words', 'Analysis', 'Practice'],
  'writing-basic': ['Practice'],
  'writing-guided': ['Analysis', 'Expressions', 'Template', 'Practice'],
  'speaking-repeat': ['Dictation', 'Key Words', 'Practice'],
  'speaking-interview': ['Analysis', 'Expressions', 'Template', 'Practice'],
};

const PANEL_THEME: Record<ReviewSection, { accent: string; soft: string; border: string }> = {
  Reading: { accent: '#1d6f73', soft: '#edf7f6', border: '#b9dedd' },
  Listening: { accent: '#2563eb', soft: '#eef4ff', border: '#c7d8ff' },
  Writing: { accent: '#d97706', soft: '#fff6e7', border: '#f5d7aa' },
  Speaking: { accent: '#7c3aed', soft: '#f4efff', border: '#d9c9ff' },
};

const TAB_META: Record<string, { icon: LucideIcon; title: string; description: string }> = {
  Dictation: {
    icon: Volume2,
    title: 'Dictation Training',
    description: 'Listen to the audio and fill in the blanks to review key expressions.',
  },
  Translation: {
    icon: Languages,
    title: 'Translation',
    description: 'Quickly grasp key sentences and logical flow with organized translations.',
  },
  Analysis: {
    icon: FileText,
    title: 'Question Analysis',
    description: 'Review answer criteria and approach strategies clearly and concisely.',
  },
  'Key Words': {
    icon: Sparkles,
    title: 'Key Words',
    description: 'Essential vocabulary from the current question, ready to use.',
  },
  Expressions: {
    icon: MessageSquareText,
    title: 'Useful Expressions',
    description: 'Sentence patterns you can apply directly in answers or essays.',
  },
  Template: {
    icon: BookOpen,
    title: 'Answer Template',
    description: 'Practical formats to structure your answer within time limits.',
  },
  Practice: {
    icon: ClipboardList,
    title: 'Question Practice',
    description: 'Practice real exam questions of the same type.',
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

export function ReviewAssistantPanel({ section, variant, contentKey, questionType, currentDifficulty, onStartTraining, translationNote, analysisNote, vocabularyNote }: ReviewAssistantPanelProps) {
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

  const renderWords = () => {
    if (vocabularyNote) {
      const lines = vocabularyNote.split('\n').filter(l => l.trim());
      return (
        <div className="space-y-2">
          {lines.map((line, i) => {
            const [word, ...rest] = line.split('=');
            const meaning = rest.join('=').trim();
            return (
              <div key={i} className="flex items-start gap-2 py-1.5 border-b border-gray-100 last:border-0">
                <span className="font-bold text-sm text-[#0f172a] min-w-[100px]">{word.trim()}</span>
                {meaning && <span className="text-sm text-gray-600">{meaning}</span>}
              </div>
            );
          })}
        </div>
      );
    }
    // fallback
    return (
    <div className="space-y-3">
      {wordList.map((item) => (
        <div key={item.word} className="rounded-2xl border border-[#e5e7eb] bg-white px-4 py-3">
          <p className="text-sm font-bold text-[#111827]">{item.word}</p>
          <p className="mt-1 text-xs text-[#64748b]">{item.meaning}</p>
        </div>
      ))}
    </div>
  );
  };

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


  const renderActiveTab = () => {
    if (!activeTab) return null;

    if (activeTab === 'Dictation') {
      if (translationNote) {
        return (
          <div className="space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Listening Script</p>
            <div className="text-sm text-[#334155] leading-relaxed whitespace-pre-wrap bg-gray-50 rounded-lg p-4 border border-gray-200">
              {translationNote}
            </div>
          </div>
        );
      }
      return renderDictation();
    }
    if (activeTab === 'Key Words') return renderWords();
        if (activeTab === 'Translation') {
      if (translationNote) {
        return (
          <div className="text-sm text-[#334155] leading-relaxed whitespace-pre-wrap">
            {translationNote}
          </div>
        );
      }
      return renderBullets(
        'Translation',
        [
          '핵심 문장은 먼저 직역하고, 뒤에서 자연스럽게 재구성합니다.',
          '배경 설명보다 결론과 근거의 연결을 먼저 잡으면 빠르게 이해됩니다.',
          '문단마다 중심 문장을 한 줄로 요약하는 습관이 중요합니다.',
        ],
        <Languages className="h-4 w-4" />,
      );
    }
        if (activeTab === 'Analysis') {
      if (analysisNote) {
        return (
          <div className="text-sm text-[#334155] leading-relaxed whitespace-pre-wrap">
            {analysisNote}
          </div>
        );
      }
      return renderBullets('Analysis', getAnalysisLines(variant), <FileText className="h-4 w-4" />);
    }
    if (activeTab === 'Expressions') {
      return renderBullets('유용한 표현', getExpressionLines(section), <MessageSquareText className="h-4 w-4" />);
    }
    if (activeTab === 'Template') {
      return renderBullets('템플릿', getTemplateLines(section), <BookOpen className="h-4 w-4" />);
    }
    if (activeTab === 'Practice') return null;
    return null;
  };

  const panelWidthClass = 'max-w-[34rem] sm:max-w-[42rem]';

  return (
    <div className="fixed right-4 bottom-6 z-[85] flex flex-col items-end gap-2">
      {/* ── Right vertical icon sidebar (horizontal row) ── */}
      <div className="flex flex-row gap-3 shrink-0">
        {tabs.map((tab) => {
          const meta = getTabMeta(tab);
          const Icon = meta.icon;
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              type="button"
              title={meta.title}
              onClick={() => {
                if (tab === 'Practice') {
                  onStartTraining({
                    title: `${questionType || getTrainingTitle(section, variant)} Practice`,
                    questionType,
                    difficulty: currentDifficulty,
                  });
                } else {
                  setActiveTab((current) => current === tab ? null : tab);
                }
              }}
              className="flex flex-col items-center gap-1 transition-all duration-200"
            >
              <span
                className={`flex h-12 w-12 items-center justify-center rounded-2xl transition-all duration-200 ${isActive ? '-translate-x-0.5 shadow-md' : 'hover:-translate-x-0.5'}`}
                style={{
                  background: isActive
                    ? `linear-gradient(135deg, ${theme.accent} 0%, ${theme.accent}cc 100%)`
                    : 'linear-gradient(180deg, #f1f5f9 0%, #e8edf2 100%)',
                  boxShadow: isActive ? `0 6px 18px ${theme.accent}33` : '0 2px 8px rgba(15,23,42,0.08)',
                }}
              >
                <Icon className="h-5 w-5" style={{ color: isActive ? 'white' : theme.accent }} />
              </span>
              <span className="text-[10px] font-semibold leading-tight text-center max-w-[52px]"
                style={{ color: isActive ? theme.accent : '#94a3b8' }}>
                {tab}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Content panel: wide, above icons, below question/answers ── */}
      {activeTab && activeTabMeta && (
        <div
          className="relative overflow-hidden rounded-2xl border bg-white/97 p-5 shadow-2xl backdrop-blur-sm"
          style={{
            borderColor: theme.border,
            width: 'min(680px, calc(100vw - 2rem))',
            maxHeight: '50vh',
            overflowY: 'auto',
          }}
        >
          <div className="absolute right-[-30px] top-[-40px] h-28 w-28 rounded-full opacity-10 blur-2xl" style={{ backgroundColor: theme.accent }} />
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-white" style={{ background: `linear-gradient(135deg, ${theme.accent} 0%, ${theme.accent}dd 100%)` }}>
                  <activeTabMeta.icon className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-bold text-[#0f172a]">{activeTabMeta.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab(null)}
                className="flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-500 hover:bg-gray-50 shadow-sm"
              >
                <X className="h-3 w-3" />
                Close
              </button>
            </div>
            <div className="max-h-[400px] overflow-y-auto pr-1">
              {renderActiveTab()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
