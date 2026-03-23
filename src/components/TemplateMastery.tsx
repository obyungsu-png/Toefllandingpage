import React, { useState, useEffect, useCallback, useRef } from 'react';
// motion removed - using CSS animations
import { 
  ArrowLeft, BookOpen, Brain, PenTool, Eye, EyeOff, RotateCcw, 
  CheckCircle, XCircle, ChevronRight, ChevronLeft, Star, Zap,
  FileText, Mic, Lightbulb, Trophy, Timer, Volume2, Shuffle
} from 'lucide-react';
import { Button } from './ui/button';

// ============== Template Data ==============
interface Template {
  id: string;
  title: string;
  titleKo: string;
  category: 'writing-integrated' | 'writing-discussion' | 'speaking-task1' | 'speaking-task2' | 'speaking-task3' | 'speaking-task4';
  body: string;        // full template with {{blank}} markers
  blanks: string[];    // answers for blanks
  tips: string;
  exampleFilled: string;
}

const TEMPLATES: Template[] = [
  // ===== Writing: Integrated =====
  {
    id: 'w-int-1',
    title: 'Integrated Writing - Contrast',
    titleKo: '통합 작문 - 반박 템플릿',
    category: 'writing-integrated',
    body: `The reading passage argues that {{blank1}}, while the lecture {{blank2}} this claim by providing three reasons.

First, the reading states that {{blank3}}. However, the professor counters this point by explaining that {{blank4}}.

Second, according to the passage, {{blank5}}. The lecturer {{blank6}} this argument by pointing out that {{blank7}}.

Finally, the reading claims that {{blank8}}. In contrast, the professor argues that {{blank9}}.

In conclusion, the lecture effectively {{blank10}} the claims made in the reading passage.`,
    blanks: [
      '[main claim of reading]',
      'challenges / refutes / contradicts',
      '[first point of reading]',
      '[professor\'s counter-argument]',
      '[second point of reading]',
      'undermines / weakens / disputes',
      '[professor\'s evidence]',
      '[third point of reading]',
      '[professor\'s final counter-point]',
      'casts doubt on / challenges'
    ],
    tips: '통합 작문에서는 Reading과 Lecture의 대비 구조가 핵심입니다. 각 문단에서 Reading 포인트 → Lecture 반박 순서를 지키세요.',
    exampleFilled: `The reading passage argues that deforestation is necessary for economic growth, while the lecture challenges this claim by providing three reasons.

First, the reading states that clearing forests creates farmland and jobs. However, the professor counters this point by explaining that sustainable forestry provides more long-term employment.

Second, according to the passage, wood products are essential for construction. The lecturer undermines this argument by pointing out that alternative materials like bamboo are more sustainable.

Finally, the reading claims that developed nations grew through deforestation. In contrast, the professor argues that modern technology allows growth without environmental destruction.

In conclusion, the lecture effectively casts doubt on the claims made in the reading passage.`
  },
  {
    id: 'w-int-2',
    title: 'Integrated Writing - Support',
    titleKo: '통합 작문 - 지지 템플릿',
    category: 'writing-integrated',
    body: `The reading passage suggests that {{blank1}}, and the lecture {{blank2}} this view with additional evidence.

To begin with, the reading mentions that {{blank3}}. The professor {{blank4}} this by providing the example of {{blank5}}.

Moreover, the passage points out that {{blank6}}. The lecturer {{blank7}} by explaining that {{blank8}}.

Lastly, the reading notes that {{blank9}}. The professor {{blank10}} this claim by demonstrating that {{blank11}}.

Overall, both the reading and the lecture {{blank12}} that {{blank13}}.`,
    blanks: [
      '[main idea]',
      'supports / reinforces / strengthens',
      '[first supporting point]',
      'elaborates on / strengthens',
      '[specific example]',
      '[second supporting point]',
      'adds further support',
      '[additional evidence]',
      '[third supporting point]',
      'confirms / validates',
      '[evidence or data]',
      'agree / concur',
      '[shared conclusion]'
    ],
    tips: '지지 구조에서는 Reading과 Lecture가 같은 방향으로 논증합니다. "추가 증거 제공" 표현을 다양하게 사용하세요.',
    exampleFilled: `The reading passage suggests that renewable energy is viable for large-scale use, and the lecture supports this view with additional evidence.

To begin with, the reading mentions that solar technology costs have decreased significantly. The professor elaborates on this by providing the example of Germany's successful solar infrastructure.

Moreover, the passage points out that wind energy capacity has doubled globally. The lecturer adds further support by explaining that offshore wind farms are now more efficient than ever.

Lastly, the reading notes that battery storage technology is improving rapidly. The professor confirms this claim by demonstrating that new lithium-ion batteries can store energy for up to 72 hours.

Overall, both the reading and the lecture agree that renewable energy is a practical and sustainable solution for the future.`
  },
  // ===== Writing: Academic Discussion =====
  {
    id: 'w-disc-1',
    title: 'Academic Discussion - Agree',
    titleKo: '학술 토론 - 동의 템플릿',
    category: 'writing-discussion',
    body: `I agree with {{blank1}}'s point that {{blank2}}. In my experience, {{blank3}}.

Furthermore, {{blank4}} because {{blank5}}. For instance, {{blank6}}.

While some might argue that {{blank7}}, I believe {{blank8}} is more convincing because {{blank9}}.`,
    blanks: [
      '[classmate\'s name]',
      '[their main argument]',
      '[personal experience or knowledge]',
      '[additional supporting reason]',
      '[explanation]',
      '[specific example]',
      '[opposing view]',
      '[your position]',
      '[final reasoning]'
    ],
    tips: '100단어 이내로 작성하세요. 상대방의 의견을 먼저 언급하고 자신의 경험이나 근거로 뒷받침하세요.',
    exampleFilled: `I agree with Sarah's point that remote learning offers significant flexibility. In my experience, online courses allowed me to balance work and studies effectively.

Furthermore, remote learning promotes self-discipline because students must manage their own schedules. For instance, I developed better time management skills through online coursework.

While some might argue that in-person interaction is irreplaceable, I believe the flexibility of remote learning is more convincing because it accommodates diverse learning styles and life circumstances.`
  },
  {
    id: 'w-disc-2',
    title: 'Academic Discussion - Disagree',
    titleKo: '학술 토론 - 반대 템플릿',
    category: 'writing-discussion',
    body: `While I understand {{blank1}}'s perspective, I respectfully disagree because {{blank2}}.

The main reason is that {{blank3}}. For example, {{blank4}}.

Additionally, {{blank5}}. This suggests that {{blank6}} rather than {{blank7}}.`,
    blanks: [
      '[classmate\'s name]',
      '[reason for disagreement]',
      '[your main argument]',
      '[supporting evidence]',
      '[second reason]',
      '[your conclusion]',
      '[their conclusion]'
    ],
    tips: '반대 의견을 표현할 때도 예의 바른 표현(respectfully, I understand but...)을 사용하세요.',
    exampleFilled: `While I understand John's perspective, I respectfully disagree because technology does not always improve education quality.

The main reason is that excessive screen time can reduce attention spans. For example, studies show students retain less information from digital reading compared to printed materials.

Additionally, not all students have equal access to technology. This suggests that traditional teaching methods remain essential rather than being completely replaced by digital tools.`
  },
  // ===== Speaking Task 1 =====
  {
    id: 's-t1-1',
    title: 'Speaking Task 1 - Preference',
    titleKo: '스피킹 Task 1 - 선호 템플릿',
    category: 'speaking-task1',
    body: `I {{blank1}} that {{blank2}} for two main reasons.

First of all, {{blank3}}. For example, {{blank4}}.

Secondly, {{blank5}}. In my own experience, {{blank6}}.

That's why I {{blank7}} {{blank8}}.`,
    blanks: [
      'believe / prefer / think',
      '[your choice]',
      '[first reason]',
      '[specific example]',
      '[second reason]',
      '[personal experience]',
      'strongly feel that',
      '[restate choice]'
    ],
    tips: '15초 준비, 45초 답변입니다. 두 가지 이유를 명확히 제시하고 각각 예시를 들어주세요.',
    exampleFilled: `I believe that studying in a library is better than studying at home for two main reasons.

First of all, libraries provide a quiet and distraction-free environment. For example, at home I often get distracted by my phone or family members.

Secondly, being surrounded by other students motivates me to study harder. In my own experience, I always accomplish more when I study at the campus library.

That's why I strongly feel that studying in a library is more effective.`
  },
  // ===== Speaking Task 2 =====
  {
    id: 's-t2-1',
    title: 'Speaking Task 2 - Campus',
    titleKo: '스피킹 Task 2 - 캠퍼스 템플릿',
    category: 'speaking-task2',
    body: `The university has announced that {{blank1}}. The {{blank2}} in the conversation {{blank3}} this change.

{{blank4}} reason is that {{blank5}}. {{blank6}} explains that {{blank7}}.

{{blank8}} reason is that {{blank9}}. {{blank10}} mentions that {{blank11}}.`,
    blanks: [
      '[announcement/policy]',
      'man / woman',
      'agrees with / disagrees with',
      'The first',
      '[first reason]',
      'He / She',
      '[explanation with detail]',
      'The second',
      '[second reason]',
      'He / She',
      '[explanation with detail]'
    ],
    tips: '30초 준비, 60초 답변. 공지사항 요약 → 화자의 의견 → 이유 1 → 이유 2 순서로 말하세요.',
    exampleFilled: `The university has announced that the library hours will be extended until midnight. The woman in the conversation agrees with this change.

The first reason is that students need more quiet study space during exam periods. She explains that the current closing time of 9 PM forces students to study in noisy dormitories.

The second reason is that it will benefit students who work during the day. She mentions that many students have part-time jobs and can only study late at night.`
  },
  // ===== Speaking Task 3 =====
  {
    id: 's-t3-1',
    title: 'Speaking Task 3 - Academic',
    titleKo: '스피킹 Task 3 - 학술 개념 템플릿',
    category: 'speaking-task3',
    body: `The reading introduces the concept of {{blank1}}, which is defined as {{blank2}}.

The professor illustrates this concept with the example of {{blank3}}. Specifically, {{blank4}}.

This example clearly demonstrates how {{blank5}} works because {{blank6}}.`,
    blanks: [
      '[academic concept]',
      '[definition from reading]',
      '[example from lecture]',
      '[detailed explanation]',
      '[concept name]',
      '[connection between example and concept]'
    ],
    tips: '30초 준비, 60초 답변. 읽기 지문의 개념 정의 → 강의 예시 → 연결 설명 순서입니다.',
    exampleFilled: `The reading introduces the concept of cognitive dissonance, which is defined as the mental discomfort experienced when holding two conflicting beliefs.

The professor illustrates this concept with the example of a study where participants were paid to lie about a boring task. Specifically, those paid only one dollar later rated the task as more enjoyable than those paid twenty dollars.

This example clearly demonstrates how cognitive dissonance works because the low-paid participants changed their beliefs to reduce the conflict between their actions and compensation.`
  },
  // ===== Speaking Task 4 =====
  {
    id: 's-t4-1',
    title: 'Speaking Task 4 - Lecture Summary',
    titleKo: '스피킹 Task 4 - 강의 요약 템플릿',
    category: 'speaking-task4',
    body: `The professor discusses {{blank1}} by describing two {{blank2}}.

The first {{blank3}} is {{blank4}}. The professor explains that {{blank5}}. For example, {{blank6}}.

The second {{blank3}} is {{blank7}}. According to the professor, {{blank8}}. As an illustration, {{blank9}}.`,
    blanks: [
      '[main topic]',
      'types / methods / strategies / examples',
      'type / method / strategy',
      '[first point]',
      '[explanation]',
      '[specific example]',
      '[second point]',
      '[explanation]',
      '[specific example]'
    ],
    tips: '20초 준비, 60초 답변. 강의의 두 가지 포인트를 각각 설명 + 예시로 요약하세요.',
    exampleFilled: `The professor discusses animal defense mechanisms by describing two strategies.

The first strategy is camouflage. The professor explains that some animals blend with their environment to avoid predators. For example, the Arctic hare changes its fur color to white in winter to match the snow.

The second strategy is mimicry. According to the professor, certain harmless animals imitate dangerous species to deter predators. As an illustration, the viceroy butterfly resembles the toxic monarch butterfly, which keeps birds from eating it.`
  }
];

// ============== Types ==============
type CategoryTab = 'writing' | 'speaking';
type SubCategory = 'writing-integrated' | 'writing-discussion' | 'speaking-task1' | 'speaking-task2' | 'speaking-task3' | 'speaking-task4';
type PracticeMode = 'read' | 'blank' | 'type';

interface ProgressData {
  [templateId: string]: {
    memorized: boolean;
    practiceCount: number;
    lastPracticed?: string;
    bestScore?: number;
  };
}

// ============== Main Component ==============
export function TemplateMastery({ onBack }: { onBack: () => void }) {
  const [categoryTab, setCategoryTab] = useState<CategoryTab>('writing');
  const [subCategory, setSubCategory] = useState<SubCategory>('writing-integrated');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [practiceMode, setPracticeMode] = useState<PracticeMode>('read');
  const [progress, setProgress] = useState<ProgressData>(() => {
    try {
      const saved = localStorage.getItem('template-mastery-progress');
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });

  // Save progress
  useEffect(() => {
    localStorage.setItem('template-mastery-progress', JSON.stringify(progress));
  }, [progress]);

  // Sub-categories
  const subCategories: { key: SubCategory; label: string; labelKo: string }[] = categoryTab === 'writing'
    ? [
        { key: 'writing-integrated', label: 'Integrated', labelKo: '통합 작문' },
        { key: 'writing-discussion', label: 'Discussion', labelKo: '학술 토론' },
      ]
    : [
        { key: 'speaking-task1', label: 'Task 1', labelKo: '독립형' },
        { key: 'speaking-task2', label: 'Task 2', labelKo: '캠퍼스' },
        { key: 'speaking-task3', label: 'Task 3', labelKo: '학술 개념' },
        { key: 'speaking-task4', label: 'Task 4', labelKo: '강의 요약' },
      ];

  const filteredTemplates = TEMPLATES.filter(t => t.category === subCategory);

  // Mark as memorized
  const toggleMemorized = (templateId: string) => {
    setProgress(prev => ({
      ...prev,
      [templateId]: {
        ...(prev[templateId] || { memorized: false, practiceCount: 0 }),
        memorized: !(prev[templateId]?.memorized)
      }
    }));
  };

  // Increment practice count
  const incrementPractice = (templateId: string, score?: number) => {
    setProgress(prev => {
      const existing = prev[templateId] || { memorized: false, practiceCount: 0 };
      return {
        ...prev,
        [templateId]: {
          ...existing,
          practiceCount: existing.practiceCount + 1,
          lastPracticed: new Date().toISOString(),
          bestScore: score !== undefined ? Math.max(existing.bestScore || 0, score) : existing.bestScore
        }
      };
    });
  };

  // Stats
  const totalTemplates = TEMPLATES.length;
  const memorizedCount = Object.values(progress).filter(p => p.memorized).length;
  const totalPractice = Object.values(progress).reduce((sum, p) => sum + p.practiceCount, 0);

  // If a template is selected, show practice view
  if (selectedTemplate) {
    return (
      <TemplatePracticeView
        template={selectedTemplate}
        mode={practiceMode}
        setMode={setPracticeMode}
        onBack={() => setSelectedTemplate(null)}
        progress={progress[selectedTemplate.id]}
        onToggleMemorized={() => toggleMemorized(selectedTemplate.id)}
        onIncrementPractice={(score) => incrementPractice(selectedTemplate.id, score)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-8">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 md:py-4">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className="flex-1">
              <h1 className="text-lg md:text-xl font-bold text-gray-900 flex items-center gap-2">
                <Zap className="w-5 h-5 text-[#e67e22]" />
                토플 템플릿 뽀개기
              </h1>
              <p className="text-[11px] md:text-xs text-gray-500">TOEFL Template Mastery</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-4 md:py-6">
        {/* Progress Stats */}
        <div 
          className="grid grid-cols-3 gap-3 mb-5 animate-[fadeSlideUp_0.3s_ease-out]"
        >
          <div className="bg-white rounded-xl p-3 md:p-4 shadow-sm border border-gray-100 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Trophy className="w-4 h-4 text-amber-500" />
              <span className="text-[10px] text-gray-500">암기 완료</span>
            </div>
            <p className="text-xl md:text-2xl font-extrabold text-amber-600">{memorizedCount}<span className="text-sm text-gray-400">/{totalTemplates}</span></p>
          </div>
          <div className="bg-white rounded-xl p-3 md:p-4 shadow-sm border border-gray-100 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <PenTool className="w-4 h-4 text-teal-600" />
              <span className="text-[10px] text-gray-500">총 연습</span>
            </div>
            <p className="text-xl md:text-2xl font-extrabold text-teal-700">{totalPractice}<span className="text-sm text-gray-400">회</span></p>
          </div>
          <div className="bg-white rounded-xl p-3 md:p-4 shadow-sm border border-gray-100 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Star className="w-4 h-4 text-blue-500" />
              <span className="text-[10px] text-gray-500">진행률</span>
            </div>
            <p className="text-xl md:text-2xl font-extrabold text-blue-600">{totalTemplates > 0 ? Math.round((memorizedCount / totalTemplates) * 100) : 0}<span className="text-sm text-gray-400">%</span></p>
          </div>
        </div>

        {/* Category Tabs: Writing / Speaking */}
        <div className="flex gap-2 mb-4">
          {(['writing', 'speaking'] as CategoryTab[]).map(tab => (
            <button
              key={tab}
              onClick={() => {
                setCategoryTab(tab);
                setSubCategory(tab === 'writing' ? 'writing-integrated' : 'speaking-task1');
              }}
              className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${
                categoryTab === tab
                  ? 'bg-gradient-to-r from-[#e67e22] to-[#f39c12] text-white shadow-md'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {tab === 'writing' ? (
                <span className="flex items-center justify-center gap-1.5">
                  <FileText className="w-4 h-4" /> Writing
                </span>
              ) : (
                <span className="flex items-center justify-center gap-1.5">
                  <Mic className="w-4 h-4" /> Speaking
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Sub-category Tabs */}
        <div className="flex gap-1.5 mb-5 overflow-x-auto pb-1 scrollbar-hide">
          {subCategories.map(sc => (
            <button
              key={sc.key}
              onClick={() => setSubCategory(sc.key)}
              className={`px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-bold whitespace-nowrap transition-all ${
                subCategory === sc.key
                  ? 'bg-[#005f61] text-white shadow-sm'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              <span className="md:hidden">{sc.label}</span>
              <span className="hidden md:inline">{sc.label} - {sc.labelKo}</span>
            </button>
          ))}
        </div>

        {/* Template Cards */}
        <div className="space-y-3">
          {filteredTemplates.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center border border-gray-100">
              <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">이 카테고리에 등록된 템플릿이 없습니다.</p>
            </div>
          ) : (
            filteredTemplates.map((template, index) => {
              const tp = progress[template.id];
              const isMemorized = tp?.memorized || false;
              const practiceCount = tp?.practiceCount || 0;

              return (
                <div
                  key={template.id}
                  className={`bg-white rounded-xl border transition-all hover:shadow-md cursor-pointer animate-[fadeSlideUp_0.3s_ease-out] ${
                    isMemorized ? 'border-green-200 bg-green-50/30' : 'border-gray-100'
                  }`}
                  style={{ animationDelay: `${index * 0.05}s`, animationFillMode: 'both' }}
                  onClick={() => {
                    setSelectedTemplate(template);
                    setPracticeMode('read');
                  }}
                >
                  <div className="p-4 md:p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {isMemorized && <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />}
                          <h3 className="font-bold text-sm md:text-base text-gray-900 truncate">{template.title}</h3>
                        </div>
                        <p className="text-xs text-gray-500 mb-2">{template.titleKo}</p>
                        <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                          {template.body.replace(/\{\{blank\d+\}\}/g, '______').substring(0, 120)}...
                        </p>
                      </div>
                      <div className="shrink-0 flex flex-col items-end gap-2">
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                        {practiceCount > 0 && (
                          <span className="text-[10px] bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full font-bold">
                            {practiceCount}회 연습
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Quick Action Buttons */}
                    <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedTemplate(template); setPracticeMode('read'); }}
                        className="flex-1 py-1.5 text-[10px] md:text-xs font-bold rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors flex items-center justify-center gap-1"
                      >
                        <Eye className="w-3 h-3" /> 읽기
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedTemplate(template); setPracticeMode('blank'); }}
                        className="flex-1 py-1.5 text-[10px] md:text-xs font-bold rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors flex items-center justify-center gap-1"
                      >
                        <Brain className="w-3 h-3" /> 빈칸 채우기
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedTemplate(template); setPracticeMode('type'); }}
                        className="flex-1 py-1.5 text-[10px] md:text-xs font-bold rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-colors flex items-center justify-center gap-1"
                      >
                        <PenTool className="w-3 h-3" /> 타이핑
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

// ============== Practice View ==============
function TemplatePracticeView({
  template,
  mode,
  setMode,
  onBack,
  progress: progressData,
  onToggleMemorized,
  onIncrementPractice
}: {
  template: Template;
  mode: PracticeMode;
  setMode: (m: PracticeMode) => void;
  onBack: () => void;
  progress?: { memorized: boolean; practiceCount: number; bestScore?: number };
  onToggleMemorized: () => void;
  onIncrementPractice: (score?: number) => void;
}) {
  const isMemorized = progressData?.memorized || false;

  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-8">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3 mb-2">
            <button onClick={onBack} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className="flex-1 min-w-0">
              <h2 className="text-sm md:text-base font-bold text-gray-900 truncate">{template.title}</h2>
              <p className="text-[10px] text-gray-500">{template.titleKo}</p>
            </div>
            <button
              onClick={onToggleMemorized}
              className={`p-2 rounded-lg transition-all ${isMemorized ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400 hover:text-amber-500'}`}
              title={isMemorized ? '암기 완료 취소' : '암기 완료로 표시'}
            >
              <Star className={`w-5 h-5 ${isMemorized ? 'fill-green-500' : ''}`} />
            </button>
          </div>

          {/* Mode Tabs */}
          <div className="flex gap-1">
            {([
              { key: 'read' as PracticeMode, icon: Eye, label: '읽기 & 암기' },
              { key: 'blank' as PracticeMode, icon: Brain, label: '빈칸 채우기' },
              { key: 'type' as PracticeMode, icon: PenTool, label: '타이핑 연습' },
            ]).map(m => (
              <button
                key={m.key}
                onClick={() => setMode(m.key)}
                className={`flex-1 py-2 text-[10px] md:text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${
                  mode === m.key
                    ? 'bg-[#005f61] text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <m.icon className="w-3 h-3 md:w-3.5 md:h-3.5" />
                {m.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-4 md:py-6">
        <>
          {mode === 'read' && (
            <ReadMode key="read" template={template} />
          )}
          {mode === 'blank' && (
            <BlankMode key="blank" template={template} onComplete={onIncrementPractice} />
          )}
          {mode === 'type' && (
            <TypeMode key="type" template={template} onComplete={onIncrementPractice} />
          )}
        </>
      </div>
    </div>
  );
}

// ============== Read Mode ==============
function ReadMode({ template }: { template: Template }) {
  const [showExample, setShowExample] = useState(false);
  const [highlightBlanks, setHighlightBlanks] = useState(true);

  const renderBody = () => {
    if (highlightBlanks) {
      const parts = template.body.split(/(\{\{blank\d+\}\})/);
      let blankIndex = 0;
      return parts.map((part, i) => {
        if (part.match(/\{\{blank\d+\}\}/)) {
          const answer = template.blanks[blankIndex] || '...';
          blankIndex++;
          return (
            <span key={i} className="bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold text-xs md:text-sm mx-0.5">
              {answer}
            </span>
          );
        }
        return <span key={i}>{part}</span>;
      });
    }
    return template.body.replace(/\{\{blank\d+\}\}/g, (_, idx) => {
      return '______';
    });
  };

  return (
    <div className="space-y-4 animate-[fadeIn_0.3s_ease-out]">
      {/* Template Body */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-teal-600" /> 템플릿 본문
          </h3>
          <button
            onClick={() => setHighlightBlanks(!highlightBlanks)}
            className="text-[10px] px-2 py-1 rounded-full bg-amber-50 text-amber-700 font-bold hover:bg-amber-100 transition-colors"
          >
            {highlightBlanks ? '빈칸 숨기기' : '빈칸 보이기'}
          </button>
        </div>
        <div className="text-sm md:text-base text-gray-700 leading-relaxed whitespace-pre-line">
          {renderBody()}
        </div>
      </div>

      {/* Tips */}
      <div className="bg-amber-50 rounded-xl border border-amber-100 p-4">
        <div className="flex items-start gap-2">
          <Lightbulb className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-bold text-amber-800 mb-1">작성 팁</p>
            <p className="text-xs text-amber-700 leading-relaxed">{template.tips}</p>
          </div>
        </div>
      </div>

      {/* Example Toggle */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <button
          onClick={() => setShowExample(!showExample)}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <span className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-blue-600" /> 예시 답안 보기
          </span>
          <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${showExample ? 'rotate-90' : ''}`} />
        </button>
        <>
          {showExample && (
            <div
              className="overflow-hidden animate-[fadeSlideUp_0.2s_ease-out]"
            >
              <div className="px-4 pb-4 border-t border-gray-100 pt-3">
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{template.exampleFilled}</p>
              </div>
            </div>
          )}
        </>
      </div>
    </div>
  );
}

// ============== Blank Mode ==============
function BlankMode({ template, onComplete }: { template: Template; onComplete: (score?: number) => void }) {
  const [answers, setAnswers] = useState<string[]>(new Array(template.blanks.length).fill(''));
  const [submitted, setSubmitted] = useState(false);
  const [showHints, setShowHints] = useState<boolean[]>(new Array(template.blanks.length).fill(false));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleSubmit = () => {
    setSubmitted(true);
    // Score: count how many are non-empty (basic scoring)
    const filled = answers.filter(a => a.trim().length > 0).length;
    const score = Math.round((filled / template.blanks.length) * 100);
    onComplete(score);
  };

  const handleReset = () => {
    setAnswers(new Array(template.blanks.length).fill(''));
    setSubmitted(false);
    setShowHints(new Array(template.blanks.length).fill(false));
  };

  const toggleHint = (index: number) => {
    setShowHints(prev => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
    });
  };

  const parts = template.body.split(/(\{\{blank\d+\}\})/);
  let blankIndex = 0;

  return (
    <div className="space-y-4 animate-[fadeIn_0.3s_ease-out]">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
            <Brain className="w-4 h-4 text-amber-600" /> 빈칸 채우기 연습
          </h3>
          <div className="flex gap-2">
            {submitted && (
              <button onClick={handleReset} className="text-[10px] px-2 py-1 rounded-full bg-gray-100 text-gray-600 font-bold hover:bg-gray-200 flex items-center gap-1">
                <RotateCcw className="w-3 h-3" /> 다시
              </button>
            )}
          </div>
        </div>

        <div className="text-sm md:text-base text-gray-700 leading-loose whitespace-pre-line">
          {parts.map((part, i) => {
            if (part.match(/\{\{blank\d+\}\}/)) {
              const currentIndex = blankIndex;
              blankIndex++;
              const correctAnswer = template.blanks[currentIndex];
              const userAnswer = answers[currentIndex] || '';
              const isCorrectish = submitted && userAnswer.trim().length > 0;

              return (
                <span key={i} className="inline-block mx-1 my-0.5">
                  {submitted ? (
                    <span className="inline-flex flex-col items-center">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                        isCorrectish ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-700'
                      }`}>
                        {userAnswer || '(미입력)'}
                      </span>
                      <span className="text-[10px] text-gray-500 mt-0.5">{correctAnswer}</span>
                    </span>
                  ) : (
                    <span className="inline-flex flex-col items-center">
                      <input
                        ref={el => { inputRefs.current[currentIndex] = el; }}
                        type="text"
                        value={answers[currentIndex]}
                        onChange={(e) => {
                          const newAnswers = [...answers];
                          newAnswers[currentIndex] = e.target.value;
                          setAnswers(newAnswers);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Tab' || e.key === 'Enter') {
                            e.preventDefault();
                            const nextRef = inputRefs.current[currentIndex + 1];
                            if (nextRef) nextRef.focus();
                          }
                        }}
                        placeholder={`(${currentIndex + 1})`}
                        className="w-28 md:w-40 px-2 py-1 border-b-2 border-amber-300 bg-amber-50/50 text-xs md:text-sm text-center focus:outline-none focus:border-amber-500 rounded-t"
                      />
                      {showHints[currentIndex] && (
                        <span className="text-[9px] text-amber-600 mt-0.5 italic">{correctAnswer}</span>
                      )}
                      <button
                        onClick={() => toggleHint(currentIndex)}
                        className="text-[9px] text-gray-400 hover:text-amber-600 mt-0.5"
                      >
                        {showHints[currentIndex] ? '힌트 숨기기' : '💡 힌트'}
                      </button>
                    </span>
                  )}
                </span>
              );
            }
            return <span key={i}>{part}</span>;
          })}
        </div>

        {!submitted && (
          <div className="mt-6 flex justify-center">
            <Button
              onClick={handleSubmit}
              className="px-8 py-2.5 bg-gradient-to-r from-[#e67e22] to-[#f39c12] text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all"
            >
              <CheckCircle className="w-4 h-4 mr-2" /> 제출하기
            </Button>
          </div>
        )}

        {submitted && (
          <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-100 animate-[fadeSlideUp_0.3s_ease-out]">
            <p className="text-sm font-bold text-blue-800 mb-1">연습 완료!</p>
            <p className="text-xs text-blue-600">
              {answers.filter(a => a.trim()).length}/{template.blanks.length}개 빈칸을 작성했습니다. 
              정답과 비교해보고 부족한 부분을 다시 연습하세요.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ============== Type Mode ==============
function TypeMode({ template, onComplete }: { template: Template; onComplete: (score?: number) => void }) {
  const [userText, setUserText] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerActive, setTimerActive] = useState(true);

  useEffect(() => {
    if (!timerActive || submitted) return;
    const interval = setInterval(() => setTimerSeconds(s => s + 1), 1000);
    return () => clearInterval(interval);
  }, [timerActive, submitted]);

  const fullText = template.body.replace(/\{\{blank\d+\}\}/g, '______');

  const handleSubmit = () => {
    setSubmitted(true);
    setTimerActive(false);
    // Basic similarity score based on word count
    const templateWords = fullText.split(/\s+/).length;
    const userWords = userText.trim().split(/\s+/).filter(w => w).length;
    const score = Math.min(100, Math.round((userWords / templateWords) * 100));
    onComplete(score);
  };

  const handleReset = () => {
    setUserText('');
    setSubmitted(false);
    setTimerSeconds(0);
    setTimerActive(true);
    setShowOriginal(false);
  };

  const formatTimer = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4 animate-[fadeIn_0.3s_ease-out]">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
            <PenTool className="w-4 h-4 text-green-600" /> 타이핑으로 외우기
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-600 flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-full">
              <Timer className="w-3 h-3" /> {formatTimer(timerSeconds)}
            </span>
            {submitted && (
              <button onClick={handleReset} className="text-[10px] px-2 py-1 rounded-full bg-gray-100 text-gray-600 font-bold hover:bg-gray-200 flex items-center gap-1">
                <RotateCcw className="w-3 h-3" /> 다시
              </button>
            )}
          </div>
        </div>

        <p className="text-xs text-gray-500 mb-3">
          템플릿을 보지 않고 기억나는 대로 타이핑하세요. 빈칸 부분은 "______"으로 표시해도 됩니다.
        </p>

        <textarea
          value={userText}
          onChange={(e) => setUserText(e.target.value)}
          disabled={submitted}
          placeholder="여기에 템플릿을 기억하며 타이핑하세요..."
          className="w-full h-48 md:h-64 px-4 py-3 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-teal-200 focus:border-teal-400 transition-all text-sm text-gray-700 placeholder-gray-400 disabled:bg-gray-50"
        />

        <div className="flex items-center justify-between mt-2">
          <p className="text-[10px] text-gray-400">
            단어 수: {userText.trim().split(/\s+/).filter(w => w).length}
          </p>
          {!submitted && (
            <Button
              onClick={handleSubmit}
              disabled={!userText.trim()}
              className="px-6 py-2 bg-gradient-to-r from-[#005f61] to-[#00838f] text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50"
            >
              <CheckCircle className="w-4 h-4 mr-1.5" /> 완료
            </Button>
          )}
        </div>
      </div>

      {/* Compare Section */}
      {submitted && (
        <div className="animate-[fadeSlideUp_0.3s_ease-out]">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <button
              onClick={() => setShowOriginal(!showOriginal)}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <span className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-blue-600" /> 원본 템플릿과 비교하기
              </span>
              <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${showOriginal ? 'rotate-90' : ''}`} />
            </button>
            <>
              {showOriginal && (
                <div
                  className="overflow-hidden animate-[fadeSlideUp_0.2s_ease-out]"
                >
                  <div className="px-4 pb-4 border-t border-gray-100 pt-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-bold text-blue-700 mb-2">원본 템플릿</p>
                        <div className="text-xs text-gray-600 leading-relaxed whitespace-pre-line bg-blue-50 rounded-lg p-3">
                          {fullText}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-green-700 mb-2">내가 작성한 텍스트</p>
                        <div className="text-xs text-gray-600 leading-relaxed whitespace-pre-line bg-green-50 rounded-lg p-3">
                          {userText || '(작성한 내용 없음)'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          </div>

          <div className="mt-3 p-4 bg-teal-50 rounded-xl border border-teal-100">
            <p className="text-xs text-teal-700 leading-relaxed">
              <strong>💡 학습 팁:</strong> 완벽하지 않아도 괜찮습니다! 핵심 구조와 전환 표현을 기억하는 것이 중요합니다. 
              반복 연습하면 자연스럽게 체화됩니다.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
