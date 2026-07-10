import { useState } from 'react';
import { BookOpen, Headphones, PencilLine, Mic, Play, ArrowRight } from 'lucide-react';

interface LandingPageProps {
  onStartTest: () => void;
}

type SubjectTab = '전체' | 'Reading' | 'Listening' | 'Writing' | 'Speaking';

const SUBJECT_META: Record<string, { icon: typeof BookOpen; color: string; bg: string; border: string }> = {
  Reading:   { icon: BookOpen,    color: '#1e6b73', bg: '#f0fafa', border: '#d1e8e8' },
  Listening: { icon: Headphones,  color: '#2563eb', bg: '#eff4ff', border: '#c7d8ff' },
  Writing:   { icon: PencilLine,   color: '#7c3aed', bg: '#f4efff', border: '#d9c9ff' },
  Speaking:  { icon: Mic,          color: '#e67e22', bg: '#fff6e7', border: '#f5d7aa' },
};

const MOCK_CARDS = [
  {
    id: 1,
    subject: 'Reading' as const,
    title: 'TPO 1 · Reading',
    desc: 'Academic Passage: Geological Formations',
    score: '27 / 30',
    date: '2026.03.10',
    progress: 90,
  },
  {
    id: 2,
    subject: 'Listening' as const,
    title: 'TPO 1 · Listening',
    desc: 'Conversation: Office Hours & Lecture',
    score: '22 / 28',
    date: '2026.03.10',
    progress: 78,
  },
  {
    id: 3,
    subject: 'Writing' as const,
    title: 'TPO 2 · Writing',
    desc: 'Email + Academic Discussion',
    score: '24 / 30',
    date: '2026.03.08',
    progress: 80,
  },
  {
    id: 4,
    subject: 'Speaking' as const,
    title: 'TPO 3 · Speaking',
    desc: 'Independent & Integrated Tasks',
    score: '18 / 30',
    date: '2026.03.05',
    progress: 60,
  },
];

export function LandingPage({ onStartTest }: LandingPageProps) {
  const [activeTab, setActiveTab] = useState<SubjectTab>('전체');

  const filtered = activeTab === '전체'
    ? MOCK_CARDS
    : MOCK_CARDS.filter((c) => c.subject === activeTab);

  const tabs: SubjectTab[] = ['전체', 'Reading', 'Listening', 'Writing', 'Speaking'];

  return (
    <div className="min-h-screen bg-[#f8f9fb] overflow-x-hidden">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#1e6b73] to-[#2d8a8c] flex items-center justify-center">
              <span className="text-white font-bold text-sm">T</span>
            </div>
            <span className="font-bold text-lg text-gray-800 tracking-tight">TOEFL TPO</span>
          </div>
          <button
            onClick={onStartTest}
            className="flex items-center gap-1.5 bg-[#1e6b73] text-white px-4 py-2 rounded-full text-sm font-bold hover:bg-[#174f52] transition-colors shadow-sm"
          >
            <Play className="w-3.5 h-3.5" />
            Start
          </button>
        </div>
      </header>

      {/* Greeting */}
      <section className="max-w-2xl mx-auto px-4 pt-6 pb-2">
        <h1 className="text-2xl font-extrabold text-gray-900 leading-tight">
          Ready to master<br />your TOEFL?
        </h1>
        <p className="text-sm text-gray-500 mt-1.5">
          Pick a section and start practicing with real TPO questions.
        </p>
      </section>

      {/* Subject Tabs */}
      <section className="max-w-2xl mx-auto px-4 py-4">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {tabs.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`shrink-0 px-4 py-2 rounded-full text-sm font-bold transition-all border ${
                  isActive
                    ? 'bg-[#1e6b73] text-white border-[#1e6b73] shadow-sm'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>
      </section>

      {/* Cards */}
      <section className="max-w-2xl mx-auto px-4 pb-8 space-y-4">
        {filtered.map((card) => {
          const meta = SUBJECT_META[card.subject];
          const Icon = meta.icon;
          return (
            <div
              key={card.id}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 transition-all hover:shadow-md"
            >
              {/* Top row: badge + date */}
              <div className="flex items-center justify-between mb-3">
                <span
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold"
                  style={{ backgroundColor: meta.bg, color: meta.color, border: `1px solid ${meta.border}` }}
                >
                  <Icon className="w-3 h-3" />
                  {card.subject.toUpperCase()}
                </span>
                <span className="text-[11px] text-gray-400">{card.date}</span>
              </div>

              {/* Title + desc */}
              <h3 className="text-base font-bold text-gray-900 mb-1">{card.title}</h3>
              <p className="text-sm text-gray-500 mb-4">{card.desc}</p>

              {/* Score bar */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${card.progress}%`, backgroundColor: meta.color }}
                  />
                </div>
                <span className="text-sm font-bold" style={{ color: meta.color }}>
                  {card.score}
                </span>
              </div>

              {/* Buttons */}
              <div className="flex gap-2.5">
                <button
                  onClick={onStartTest}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold text-white transition-all active:scale-95"
                  style={{ backgroundColor: meta.color }}
                >
                  <Play className="w-3.5 h-3.5" />
                  Start
                </button>
                <button className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100 transition-all active:scale-95">
                  Review
                </button>
              </div>
            </div>
          );
        })}
      </section>

      {/* Bottom CTA */}
      <section className="max-w-2xl mx-auto px-4 pb-12">
        <div className="bg-gradient-to-r from-[#1e6b73] to-[#2d8a8c] rounded-2xl p-6 text-center text-white shadow-lg">
          <p className="text-lg font-bold mb-1">New to TOEFL?</p>
          <p className="text-sm opacity-90 mb-4">Take a full-length diagnostic test to see where you stand.</p>
          <button
            onClick={onStartTest}
            className="inline-flex items-center gap-2 bg-white text-[#1e6b73] px-6 py-3 rounded-full font-bold text-sm hover:bg-gray-100 transition-colors active:scale-95"
          >
            Full Test
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>
    </div>
  );
}
