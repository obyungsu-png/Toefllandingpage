import React, { useState, useEffect, useCallback, useRef } from 'react';
// motion removed - using CSS animations
import { 
  ArrowLeft, BookOpen, Brain, PenTool, Eye, EyeOff, RotateCcw, 
  CheckCircle, XCircle, ChevronRight, ChevronLeft, Star, Zap,
  FileText, Mic, Lightbulb, Trophy, Timer, Volume2, Shuffle,
  Mail, MessageSquare, Headphones, Pencil, Repeat
} from 'lucide-react';
import { Button } from './ui/button';

// ============== Template Data (2026 NEW TOEFL) ==============
interface Template {
  id: string;
  title: string;
  titleKo: string;
  category: 'writing-email' | 'writing-discussion' | 'writing-sentence' | 'speaking-interview' | 'speaking-repeat' | 'reading-daily' | 'listening-response';
  body: string;        // full template with {{blank}} markers
  blanks: string[];    // answers for blanks
  tips: string;
  exampleFilled: string;
}

const TEMPLATES: Template[] = [
  // ===== Writing: Write an Email (NEW 2026) =====
  {
    id: 'w-email-1',
    title: 'Email Writing - Information Request',
    titleKo: '이메일 작성 - 정보 요청 템플릿 (7분)',
    category: 'writing-email',
    body: `Dear {{blank1}},

I'm writing to {{blank2}}.

Regarding {{blank3}}, {{blank4}}.

As for {{blank5}}, {{blank6}}.

Finally, {{blank7}}. {{blank8}}.

Best regards,
[Your Name]`,
    blanks: [
      '[Recipient name/title]',
      '[state the purpose of your email]',
      '[Point 1 from prompt]',
      '[your specific answer with detail]',
      '[Point 2 from prompt]',
      '[your response with context]',
      '[Point 3 from prompt]',
      '[your answer + polite closing line]'
    ],
    tips: '2026 신토플 이메일 작성은 7분입니다. 공식/반공식 톤(Tone)을 유지하고 3가지 필수 요소를 모두 다루세요. 인사말→목적→Point 1→2→3→마무리 순서로 작성합니다.',
    exampleFilled: `Dear Professor Smith,

I'm writing to inquire about the research assistant position you mentioned in class.

Regarding the required qualifications, I have completed advanced statistics and research methods courses with A grades. I also worked as a volunteer research assistant last semester.

As for my availability, I can work 15 hours per week, preferably on Monday, Wednesday, and Friday afternoons after 2 PM.

Finally, I have attached my resume and transcript for your review. I would appreciate the opportunity to discuss this position further at your convenience.

Best regards,
Kim Min-jun`
  },
  {
    id: 'w-email-2',
    title: 'Email Writing - Invitation Response',
    titleKo: '이메일 작성 - 초대 응답 템플릿 (7분)',
    category: 'writing-email',
    body: `Dear {{blank1}},

Thank you so much for {{blank2}}. I was really pleased to receive your invitation.

Regarding {{blank3}}, {{blank4}}.

About {{blank5}}, {{blank6}}.

As for {{blank7}}, {{blank8}}.

I'm looking forward to {{blank9}}.

Best wishes,
[Your Name]`,
    blanks: [
      '[name]',
      '[inviting me to / offering / suggesting]',
      '[Point 1: acceptance or decline]',
      '[your decision with reason]',
      '[Point 2: specific detail]',
      '[your preference or condition]',
      '[Point 3: additional request/question]',
      '[your comment or suggestion]',
      '[the event/meeting/activity]'
    ],
    tips: '초대 수락/거절 시 정중한 표현을 사용하세요. "Thank you for inviting me"로 시작하고, 거절해도 미래 가능성을 언급하면 좋습니다.',
    exampleFilled: `Dear Sarah,

Thank you so much for inviting me to join the study group for the final exam. I was really pleased to receive your invitation.

Regarding the meeting schedule, I would be happy to join the Tuesday and Thursday sessions at 3 PM in the library.

About my contribution, I can help prepare practice questions for the Reading section since I've been focusing on that area recently.

As for the study materials, could we use the official ETS TestReady practice tests? I find them most similar to the actual exam format.

I'm looking forward to working together and acing this exam!

Best wishes,
Ji-young`
  },
  // ===== Writing: Academic Discussion (UPDATED 2026) =====
  {
    id: 'w-disc-1',
    title: 'Academic Discussion - Agree Position',
    titleKo: '학술 토론 - 동의 입장 템플릿 (10분)',
    category: 'writing-discussion',
    body: `I {{blank1}} with the idea that {{blank2}}.

{{blank3}} makes a valid point about {{blank4}}, and I {{blank5}} build on that perspective.

The main reason is {{blank6}}. For example, {{blank7}}.

{{blank8}}. This suggests that {{blank9}} is a crucial factor that we should consider.`,
    blanks: [
      'strongly agree / agree / essentially agree',
      '[restate the professor\'s topic/question]',
      '[Student A/B name]',
      '[their argument - paraphrased]',
      'would like to / believe we should',
      '[your key argument supporting the same direction]',
      '[specific, concrete example with details who/when/where]',
      '[Extension: deeper analysis or second angle]',
      '[the topic/concept]'
    ],
    tips: '2026 신토플 Academic Discussion은 10분, 최소 100단어입니다. 첫 문장에 입장을 명확히 밝히고, 상대방 의견을 paraphrasing한 후 자신의 근거+구체적 예시로 전개하세요.',
    exampleFilled: `I strongly agree with the idea that universities should require students to take courses outside their major field.

Sarah makes a valid point about interdisciplinary skills being valuable in the workplace, and I would like to build on that perspective.

The main reason is that exposure to different fields fosters creativity and innovation. For example, Steve Jobs explicitly credited his calligraphy class—not any computer science course—for inspiring the beautiful typography in Apple products. When I took a psychology course as a computer science student last semester, it completely changed how I approach user interface design, because I now understand cognitive load and user behavior patterns.

This suggests that diverse academic exposure is a crucial factor that we should consider.`
  },
  {
    id: 'w-disc-2',
    title: 'Academic Discussion - New Perspective',
    titleKo: '학술 토론 - 새로운 관점 제시 템플릿 (10분)',
    category: 'writing-discussion',
    body: `While both {{blank1}} and {{blank2}} offer interesting perspectives, I believe {{blank3}} is equally important.

{{blank4}} correctly notes that {{blank5}}. However, {{blank6}} raises an important concern about {{blank7}}.

My view is that {{blank8}}. The primary reason is {{blank9}}.

To illustrate, {{blank10}}. Therefore, {{blank11}}.`,
    blanks: [
      '[Student A]',
      '[Student B]',
      '[your new angle/factor]',
      '[First student]',
      '[their argument summarized]',
      '[Second student]',
      '[their counterpoint summarized]',
      '[state your unique position clearly]',
      '[main supporting reason]',
      '[specific concrete example: personal experience, observation, or hypothetical scenario]',
      '[concluding thought connecting back to broader implication]'
    ],
    tips: '두 학생 모두 언급하되, 그들과 **다른 제3의 관점**을 제시하는 것이 고득점 비결입니다. "Both X and Y are valid, but Z matters too" 구조를 활용하세요.',
    exampleFilled: `While both Michael and Chen offer interesting perspectives, I believe the environmental impact of remote work is equally important.

Michael correctly notes that working from home reduces carbon emissions from commuting. However, Chen raises an important concern about increased home energy consumption.

My view is that companies should provide green energy subsidies for remote employees. The primary reason is that individual households often rely on fossil fuel-based electricity, which can offset the commuting benefits.

To illustrate, my cousin works remotely for a tech company in California, and her home electricity bill—and carbon footprint—actually increased by 30% because her apartment complex uses traditional grid power. If her company subsidized solar panel installation or renewable energy credits, this problem could be solved.

Therefore, a holistic environmental policy must consider both transportation AND household energy.`
  },
  // ===== Writing: Build a Sentence (NEW 2026) =====
  {
    id: 'w-sent-1',
    title: 'Build a Sentence - SVO Basic',
    titleKo: '문장 구성 - 기본 SVO 어순 템플릿',
    category: 'writing-sentence',
    body: `[Subject] + [Verb] + [Object]

Full sentence pattern:
"The {{blank1}} {{blank2}} the {{blank3}} {{blank4}}."

Extended with adverbial:
"The {{blank1}} {{blank2}} the {{blank3}} {{blank4}} {{blank5}} {{blank6}}."`,
    blanks: [
      '[adjective/noun modifier: young / ambitious / diligent]',
      '[past tense verb: completed / analyzed / discovered]',
      '[noun: data / hypothesis / experiment]',
      '[prepositional phrase: in 2024 / at the laboratory / for the project]',
      '[adverb: carefully / thoroughly / systematically]',
      '[purpose/reason phrase: to verify the results / before the deadline]'
    ],
    tips: 'Build a Sentence은 어휘와 문법 능력을 평가합니다. 항상 S(주어)+V(동사)+O(목적어) 기본 어순을 지키고, 수 일치(subject-verb agreement)와 시제 일관성을 확인하세요.',
    exampleFilled: `"The ambitious researcher analyzed the experimental data carefully to verify the results before the conference deadline."

Key grammar points:
- Subject: "The ambitious researcher" (singular → verb must be singular)
- Verb: "analyzed" (past tense)
- Object: "the experimental data"
- Adverb: "carefully" (modifies HOW she analyzed)
- Purpose: "to verify the results" (infinitive of purpose)`
  },
  {
    id: 'w-sent-2',
    title: 'Build a Sentence - Complex Structure',
    titleKo: '문장 구성 - 복합문/관계사 템플릿',
    category: 'writing-sentence',
    body: `[Main Clause], [Relative Clause].

Pattern:
"{{blank1}}, which {{blank2}}, {{blank3}} {{blank4}} {{blank5}}."

With subordinate conjunction:
"Although {{blank1}}, the {{blank2}} {{blank3}} because {{blank4}}."`,
    blanks: [
      '[Independent clause subject + verb: The study showed / The results indicated]',
      '[relative verb + detail: was conducted recently / surprised many researchers]',
      '[main verb: suggests / demonstrates / proves]',
      '[noun phrase: a strong correlation / significant improvement]',
      '[conclusion/implication: in academic performance / between variables]',
      '[Concession clause: some critics argued against this method]',
      '[subject: the evidence / the majority / subsequent research]',
      '[verb: supports / confirms / validates]',
      '[reason clause: the data was comprehensive / of its practical applications]'
    ],
    tips: '복합문에서는 콤마(,) 위치가 중요합니다. 관계사절(which/who/that)은 선행사 바로 뒤에 오고, 접속사(although/because/while)는 종속절을 시작합니다.',
    exampleFilled: `"The longitudinal study, which followed over 500 students for three years, demonstrates a strong correlation between sleep quality and academic performance."

"Although some critics questioned the methodology initially, the majority of subsequent research validates these findings because the sample size was sufficiently large and diverse."`
  },
  // ===== Speaking: Take an Interview (NEW 2026) =====
  {
    id: 's-int-1',
    title: 'Interview Speaking - Basic Framework',
    titleKo: '인터뷰 스피킹 - 기본 45초 프레임워크',
    category: 'speaking-interview',
    body: `{{blank1}}, {{blank2}}. I feel strongly about this because {{blank3}}.

The main reason is {{blank4}}. For example, {{blank5}}.

{{blank6}}. That's why I {{blank7}}.`,
    blanks: [
      'Opening: In my opinion / Personally / From my perspective / Honestly',
      '[clear position statement: I prefer A over B / I believe that... / I strongly support...]',
      '[brief reason teaser: it has impacted my life directly / of a recent experience]',
      '[explanation of your MAIN argument - go deep not wide]',
      '[SPECIFIC STORY: Who? When? Where? What happened? How did you feel?] - THIS IS THE KEY!',
      'Extension: Additionally / What\'s more / Another thing is + [second brief point or reflection]',
      '[restate position differently: think this way / hold this view / chose this option]'
    ],
    tips: '**45초, 준비시간 없음!** 두 가지 얇은 이유보다 **하나의 깊고 구체적인 스토리**가 핵심입니다. 예시에서 반드시 WHO/WHEN/WHERE를 포함하세요. 템플릿을 암기해서 당황하지 마세요!',
    exampleFilled: `In my opinion, learning a foreign language through immersion is far more effective than traditional classroom study. I feel strongly about this because I experienced both approaches firsthand.

The main reason is that immersion forces your brain to adapt and think in the target language naturally. For example, when I studied abroad in Canada for just three months last year without taking any formal classes, my English speaking ability improved dramatically—more than it had in two years of Korean high school English classes. I remember being terrified at first when my homestay family asked me about my day, but within weeks I was dreaming in English and even making jokes with local friends at the coffee shop where I worked part-time.

What's more, the confidence I gained from real conversations transferred to my writing and reading skills too. That's why I truly believe immersion is the superior method.`
  },
  {
    id: 's-int-2',
    title: 'Interview Speaking - Choice Type',
    titleKo: '인터뷰 스피킹 - 선택형 질문 템플릿',
    category: 'speaking-interview',
    body: `I would definitely choose {{blank1}} rather than {{blank2}}.

Admittedly, {{blank3}} has its merits, especially {{blank4}}. However, {{blank5}} outweighs this for me because {{blank6}}.

Let me share a personal example. {{blank7}}. This experience taught me that {{blank8}}.

So, all things considered, {{blank9}}.`,
    blanks: [
      '[Option A: your choice]',
      '[Option B: the other option]',
      '[Option B - acknowledge its good point briefly]',
      '[what makes it decent: it\'s convenient / popular / traditional]',
      '[Option A\'s key advantage - your MAIN selling point]',
      '[why this advantage matters more to YOU specifically]',
      '[Tell a SHORT story: When did you choose A? What happened? Why were you happy with that choice?]',
      '[the lesson or realization from that story]',
      '[final answer restated: my choice is definitely A / I stand by my decision]'
    ],
    tips: 'A vs B 선택형에서는 상대편의 장점을 **간단히 인정**한 후("Admittedly, B is..."), 본인의 선택이 왜 더 우월한지 **근거로 설득**하세요. 경험-based 답변이 최고입니다!',
    exampleFilled: `I would definitely choose working in a team rather than working alone.

Admittedly, working alone has its merits, especially when you need deep focus and complete control over the process. However, teamwork outweighs this for me because diverse perspectives consistently produce more creative solutions than any individual could generate alone.

Let me share a personal example. Last semester, our group of four students from completely different majors—engineering, psychology, art, and business—had to design a sustainable campus product together. At first, we argued constantly because our approaches were so different. But then the psychology major pointed out user behavior patterns none of us had considered, the art student made our prototype visually compelling, and I handled the business logistics. We actually won the campus innovation competition! This experience taught me that the friction of teamwork is worth it when genuine collaboration happens.

So, all things considered, I choose teamwork every time.`
  },
  // ===== Speaking: Listen and Repeat (NEW 2026) =====
  {
    id: 's-repeat-1',
    title: 'Listen & Repeat - Practice Guide',
    titleKo: '듣고 따라하기 - 발음 연습 가이드',
    category: 'speaking-repeat',
    body: `🎧 LISTEN & REPEAT STRATEGY

Step 1: First listen → Understand meaning
Step 2: Shadow along (speak WITH the audio)
Step 3: Repeat independently (match intonation)

Key focus areas:
- {{blank1}}
- {{blank2}}
- {{blank3}}

Common mistakes to avoid:
- {{blank4}}
- {{blank5}}

Pro tip: {{blank6}}`,
    blanks: [
      'Word stress: emphasize the correct syllable (e.g., DE-velop not de-VELOP)',
      'Sentence stress: content words louder/function words quieter',
      'Intonation patterns: rise for lists/questions, fall for statements',
      'Speaking too fast — clarity beats speed always!',
      'Swallowing word endings (especially -ed, -s endings)',
      'Record yourself and compare with original — painful but THE most effective method'
    ],
    tips: 'Listen and Repeat는 총 7문제입니다. 악센트(Accent)보다는 명료성(Clarity)가 핵심 평가 기준입니다. Shadowing(그림자 따라하기) 연습으로 귀와 입을 동기화하세요.',
    exampleFilled: `Practice sentence:
"The university library will be closed for renovation from August 1st through August 15th."

Breakdown:
- Stress: UNiversity LIbrary REnovation AUgust
- Intonation: rise slightly after "closed," fall at "August 15th"
- Pauses: after "library" (0.3s), after "closed" (0.2s), after "renovation" (0.2s)

Shadow until you can match the rhythm naturally without looking at text.`
  },
  // ===== Reading: Read in Daily Life (NEW 2026) =====
  {
    id: 'r-daily-1',
    title: 'Daily Reading - Notice/Announcement',
    titleKo: '일상 독해 - 공지사항/안내 템플릿',
    category: 'reading-daily',
    body: `NOTICE STRUCTURE ANALYSIS

Header: {{blank1}}

Key Information Extraction:
- WHO: {{blank2}}
- WHAT: {{blank3}}
- WHEN: {{blank4}}
- WHERE: {{blank5}}
- WHY/ACTION REQUIRED: {{blank6}}

Common vocabulary in notices:
- {{blank7}}
- {{blank8}}
- {{blank9}}`,
    blanks: [
      '[Title type: IMPORTANT NOTICE / ANNOUNCEMENT / REMINDER]',
      '[Who issued this: The administration / Library services / Housing office]',
      '[What is happening: schedule change / new policy / closure / event]',
      '[Date/time: from [date] to [date] / effective immediately / every Friday]',
      '[Location: Main building / Room 304 / Online portal]',
      '[What readers must do: register by / bring ID / submit form / be aware]',
      '[e.g., mandatory / due date / registration required / temporary / rescheduled]',
      '[e.g., availability / prior notice / inconvenience / appreciated / contact]',
      '[e.g., further information / assistance / update / modification / procedure]'
    ],
    tips: 'Read in Daily Life는 공지사항, 이메일, 표지판 등 실용 텍스트입니다. **핵심 정보(5W1H)**를 빠르게 스캔하는 연습이 필요합니다. 불필요한 세부정보는 skip하세요.',
    exampleNotice: `=== SAMPLE NOTICE ===

IMPORTANT NOTICE: Library Hours Adjustment

WHO: University Library Services
WHAT: Extended hours during final exam period
WHEN: December 10-20, 2026; 7:00 AM - 2:00 AM daily
WHERE: Main Library & North Branch Library  
ACTION: Bring student ID; quiet study rooms require online booking

Key vocab: extended hours, peak period, reservation system, strictly enforced, noise level`
  },
  {
    id: 'r-daily-2',
    title: 'Daily Reading - Email Format',
    titleKo: '일상 독해 - 이메일 형식 분석 템플릿',
    category: 'reading-daily',
    body: `EMAIL QUICK-SCAN METHOD

From: {{blank1}}
Subject Line: {{blank2}} → Indicates {{blank3}}

Opening: {{blank4}} (sets the tone: formal/casual/urgent)

Main Purpose (usually 1st paragraph):
{{blank5}}

Details (body paragraphs):
- Point 1: {{blank6}}
- Point 2: {{blank7}}

Call to Action / Closing:
{{blank8}}

Sign-off: {{blank9}} (indicates relationship level)`,
    blanks: [
      '[Sender role: Professor / Admin / Classmate / Employer]',
      '[Subject keywords: URGENT / Reminder / Invitation / Update]',
      '[email purpose/priority level]',
      '[Greeting type: Dear Dr. X / Hi everyone / Hey guys]',
      '[One-sentence summary of WHY this email was sent]',
      '[First key info: date change / requirement / opportunity]',
      '[Second key info: instruction / deadline / location change]',
      '[What recipient must do: reply by / attend / submit / confirm]',
      '[Sincerely / Best regards / Thanks / Cheers — shows formality]'
    ],
    tips: '이메일 독해에서는 **Subject line과 첫 문단**으로 목적을 파악하는 것이 가장 중요합니다. Detail은 나중에 찾아도 됩니다. 30초 내에 "이 메일의 목적이 뭐지?"를 맞추는 연습을 하세요.',
    exampleEmail: `From: Dr. Thompson (Chemistry Dept.)
Subject: URGENT: Lab Schedule Change - Section B

Opening: "Dear Students," → Formal, authoritative

Main Purpose: Thursday's lab session is relocated due to maintenance.

Details:
- Point 1: New location: Science Building Room 305 (not the usual lab)
- Point 2: Same time (2-5 PM), but bring your own safety goggles

Call to Action: "Please confirm receipt of this email by Wednesday midnight."

Sign-off: "Best regards, Dr. Thompson" → Professional but approachable`
  },
  // ===== Listening: Choose a Response (NEW 2026) =====
  {
    id: 'l-resp-1',
    title: 'Listening Response - Functional',
    titleKo: '청취 응답선택 - 기능적 대화 템플릿',
    category: 'listening-response',
    body: `CHOOSE-A-RESPONSE STRATEGY

Speaker says something → What would you respond?

Scenario Type: {{blank1}}

Speaker's intent (identify FIRST):
- Literal meaning: "{{blank2}}"
- Underlying purpose: "{{blank3}}"

Best response matches {{blank4}}:

Correct response pattern:
"{{blank5}}" ✓

Why this works: {{blank6}}`,
    blanks: [
      '[Invitation / Offer / Request / Complaint / Suggestion / Apology]',
      '[What the words literally mean: "Do you want to study together?"]',
      '[What they REALLY want: asking for help / being friendly / seeking company]',
      '[the FUNCTION: accept / decline politely / show enthusiasm / express gratitude / ask for clarification]',
      '"That sounds great! What time works for you?" (accepting invitation)',
      '[It directly addresses the speaker\'s intent, not just the literal words. It moves the conversation forward appropriately.]'
    ],
    tips: 'Choose a Response에서는 **맥락(Context)과 화자의 의도(Intent)**를 파악하는 것이 핵심입니다. 문자 그대로의 의미(Literal)가 아니라 **실제 목적(Purpose)**에 부합하는 응답을 선택하세요.',
    exampleScenario: `Speaker A: "I've been having trouble understanding the lecture material for Economics 101."
Speaker B: ?

Options:
A) "The lectures are indeed quite challenging this semester." ❌ (just agrees, doesn't RESPOND to need)
B) "Would you like to study together this weekend? I can explain the concepts." ✅ (offers HELP — addresses underlying need)
C) "Have you tried reading the textbook before class?" ⚠️ (somewhat helpful but sounds preachy)

Answer: B — Speaker A is indirectly asking for help/study support.`
  }
];

// ============== Types ==============
type CategoryTab = 'writing' | 'speaking' | 'reading' | 'listening';
type SubCategory = 'writing-email' | 'writing-discussion' | 'writing-sentence' | 'speaking-interview' | 'speaking-repeat' | 'reading-daily' | 'listening-response';
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
        { key: 'writing-email', label: 'Email', labelKo: '이메일 작성 (7분)' },
        { key: 'writing-discussion', label: 'Discussion', labelKo: '학술 토론 (10분)' },
        { key: 'writing-sentence', label: 'Sentence', labelKo: '문장 구성' },
      ]
    : categoryTab === 'speaking'
    ? [
        { key: 'speaking-interview', label: 'Interview', labelKo: '인터뷰 (45초×4)' },
        { key: 'speaking-repeat', label: 'Repeat', labelKo: '듣고 따라하기' },
      ]
    : categoryTab === 'reading'
    ? [
        { key: 'reading-daily', label: 'Daily Life', labelKo: '일상 독해' },
      ]
    : [ // listening
        { key: 'listening-response', label: 'Response', labelKo: '응답 선택' },
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
                2026 신토플 템플릿 뽀개기
              </h1>
              <p className="text-[11px] md:text-xs text-gray-500">New TOEFL 2026 Template Mastery (Band Score 1-6)</p>
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

        {/* 고득점자 노하우 (TST Prep / 고우해커스 / Arno 스타일) */}
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 mb-5 border border-amber-100 animate-[fadeSlideUp_0.3s_ease-out]">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="w-4 h-4 text-amber-600" />
            <h3 className="text-xs font-bold text-amber-800">2026 신토플 고득점자 노하우 (Band 5.0+)</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div className="bg-white/70 rounded-lg p-2.5 flex items-start gap-2">
              <span className="text-xs font-bold text-green-600 shrink-0 mt-0.5">✓</span>
              <p className="text-[11px] text-gray-700 leading-relaxed"><strong>Writing:</strong> Email은 3요소(목적/Point1/Point2)를 빠짐없이. Discussion은 paraphrase 후 자신의 예시로 전개</p>
            </div>
            <div className="bg-white/70 rounded-lg p-2.5 flex items-start gap-2">
              <span className="text-xs font-bold text-green-600 shrink-0 mt-0.5">✓</span>
              <p className="text-[11px] text-gray-700 leading-relaxed"><strong>Speaking:</strong> 45초 인터뷰 = 깊은 스토리 1개 &gt; 얇은 이유 2개. WHO/WHEN/WHERE 포함 필수</p>
            </div>
            <div className="bg-white/70 rounded-lg p-2.5 flex items-start gap-2">
              <span className="text-xs font-bold text-blue-600 shrink-0 mt-0.5">✓</span>
              <p className="text-[11px] text-gray-700 leading-relaxed"><strong>Reading:</strong> Daily Life는 5W1H 스캔 연습. Complete Words는 문맥 추론으로 빈칸 채우기</p>
            </div>
            <div className="bg-white/70 rounded-lg p-2.5 flex items-start gap-2">
              <span className="text-xs font-bold text-purple-600 shrink-0 mt-0.5">✓</span>
              <p className="text-[11px] text-gray-700 leading-relaxed"><strong>Listening:</strong> Choose Response는 literal meaning 아닌 underlying intent 파악이 핵심</p>
            </div>
          </div>
          <p className="mt-2 pt-2 border-t border-amber-200 text-[10px] text-amber-600 text-center font-medium">
            출처: ETS TestReady, Arno, TST Prep, PrepEx, 고우해커스 비법노트
          </p>
        </div>

        {/* Category Tabs: Writing / Speaking / Reading / Listening */}
        <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1 scrollbar-hide">
          {(['writing', 'speaking', 'reading', 'listening'] as CategoryTab[]).map(tab => (
            <button
              key={tab}
              onClick={() => {
                setCategoryTab(tab);
                if (tab === 'writing') setSubCategory('writing-email');
                else if (tab === 'speaking') setSubCategory('speaking-interview');
                else if (tab === 'reading') setSubCategory('reading-daily');
                else setSubCategory('listening-response');
              }}
              className={`px-4 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap transition-all ${
                categoryTab === tab
                  ? 'bg-gradient-to-r from-[#e67e22] to-[#f39c12] text-white shadow-md'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {tab === 'writing' && <span className="flex items-center justify-center gap-1.5"><FileText className="w-4 h-4" /> Writing</span>}
              {tab === 'speaking' && <span className="flex items-center justify-center gap-1.5"><Mic className="w-4 h-4" /> Speaking</span>}
              {tab === 'reading' && <span className="flex items-center justify-center gap-1.5"><BookOpen className="w-4 h-4" /> Reading</span>}
              {tab === 'listening' && <span className="flex items-center justify-center gap-1.5"><Headphones className="w-4 h-4" /> Listening</span>}
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
