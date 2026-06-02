import { useState } from 'react';

interface WelcomeLandingPageProps {
  onStartPractice: () => void;
}

export function WelcomeLandingPage({ onStartPractice }: WelcomeLandingPageProps) {
  const [faqOpen, setFaqOpen] = useState<number | null>(0);

  const faqs = [
    {
      q: 'What is TOEFL ALLMYEXAM?',
      a: 'TOEFL ALLMYEXAM is a platform that offers TOEFL practice tests to help you prepare for the official TOEFL exam. We provide TPO-based tests with instant feedback and score analysis.',
    },
    {
      q: 'Are the test results instant?',
      a: 'Yes! Reading and Listening scores are calculated immediately after you submit. Writing and Speaking sections provide detailed feedback as well.',
    },
    {
      q: 'How do the practice tests compare to the real TOEFL?',
      a: 'Our tests closely mirror the real TOEFL iBT format, including all four sections: Reading, Listening, Speaking, and Writing — with timing and question types that match the actual exam.',
    },
    {
      q: 'Is it free to use?',
      a: 'Yes! You can access all TPO practice tests completely free. Start practicing today without any subscription.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#f5f0e8] font-sans overflow-x-hidden">

      {/* ── NAVBAR ── */}
      <div className="px-4 pt-5 pb-3 flex justify-center">
        <div className="w-full max-w-5xl bg-white/80 backdrop-blur-md rounded-2xl shadow-sm px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#4f8ef7] to-[#2563eb] flex items-center justify-center">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>
            <span className="font-bold text-gray-800 text-base">TOEFL ALLMYEXAM</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onStartPractice}
              className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-4 py-1.5 rounded-full transition-colors"
            >
              Start Free
            </button>
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* ── HERO ── */}
      <section className="relative px-4 pt-12 pb-16 text-center overflow-hidden">
        {/* Floating icon cards */}
        <div className="absolute left-[4%] top-[12%] w-14 h-14 md:w-20 md:h-20 bg-[#2bbb8f] rounded-2xl flex items-center justify-center shadow-lg rotate-[-12deg]" style={{animation:'float1 4s ease-in-out infinite'}}>
          <svg className="w-7 h-7 md:w-10 md:h-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
        </div>
        <div className="absolute right-[4%] top-[8%] w-14 h-14 md:w-20 md:h-20 bg-[#3b82f6] rounded-2xl flex items-center justify-center shadow-lg rotate-[10deg]" style={{animation:'float2 4.5s ease-in-out infinite'}}>
          <svg className="w-7 h-7 md:w-10 md:h-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>
        </div>
        <div className="absolute left-[6%] bottom-[15%] w-14 h-14 md:w-20 md:h-20 bg-[#a78bfa] rounded-2xl flex items-center justify-center shadow-lg rotate-[-8deg]" style={{animation:'float3 5s ease-in-out infinite'}}>
          <svg className="w-7 h-7 md:w-10 md:h-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 18v-6a9 9 0 0118 0v6"/><path d="M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3zM3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3z"/></svg>
        </div>
        <div className="absolute right-[5%] bottom-[18%] w-14 h-14 md:w-20 md:h-20 bg-[#f87171] rounded-2xl flex items-center justify-center shadow-lg rotate-[12deg]" style={{animation:'float1 3.8s ease-in-out 0.5s infinite'}}>
          <svg className="w-7 h-7 md:w-10 md:h-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8"/></svg>
        </div>

        {/* Badge */}
        <div className="inline-flex items-center gap-1.5 bg-white border border-gray-200 rounded-full px-4 py-1.5 text-sm text-gray-700 shadow-sm mb-6">
          <span className="text-orange-400">★</span>
          <span>Less Studying, Better Results</span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-gray-900 leading-tight mb-4">
          Score <span className="text-[#2bbb8f]">100+</span> on the TOEFL<br className="hidden md:block"/> in 30 days
        </h1>

        {/* Subtext */}
        <p className="text-gray-500 text-base md:text-lg max-w-xl mx-auto mb-8">
          Access free TOEFL practice tests, receive instant feedback, and boost your score with our expert resources.
        </p>

        {/* CTA Buttons */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <button
            onClick={onStartPractice}
            className="bg-gray-900 hover:bg-gray-700 text-white font-semibold text-base px-7 py-3.5 rounded-full shadow-md transition-all hover:scale-105"
          >
            Start Practicing Free
          </button>
          <button
            onClick={onStartPractice}
            className="text-gray-700 font-semibold text-base px-5 py-3.5 hover:text-gray-900 transition-colors"
          >
            Sign In
          </button>
        </div>

        {/* Social proof */}
        <div className="flex items-center justify-center gap-3">
          <div className="flex -space-x-2">
            {['https://randomuser.me/api/portraits/women/44.jpg','https://randomuser.me/api/portraits/men/32.jpg','https://randomuser.me/api/portraits/women/68.jpg'].map((src, i) => (
              <img key={i} src={src} alt="user" className="w-8 h-8 rounded-full border-2 border-white object-cover"/>
            ))}
          </div>
          <span className="text-sm text-gray-500">Loved by <strong className="text-gray-800">97.2k students</strong></span>
        </div>

        {/* Stats */}
        <div className="mt-16 flex items-center justify-center gap-0 divide-x divide-gray-300">
          {[['97k+','Active Users'],['200+','Universities'],['50+','Practice Tests']].map(([num, label]) => (
            <div key={label} className="px-10 md:px-16 text-center">
              <div className="text-2xl md:text-3xl font-bold text-gray-900">{num}</div>
              <div className="text-sm text-gray-500 mt-1">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── APP MOCKUP ── */}
      <section className="px-4 pb-12">
        <div className="max-w-3xl mx-auto rounded-2xl overflow-hidden shadow-2xl border border-gray-200">
          {/* Dark top bar */}
          <div className="bg-[#1a1f2e] px-5 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500"/>
                <div className="w-3 h-3 rounded-full bg-yellow-400"/>
                <div className="w-3 h-3 rounded-full bg-green-500"/>
              </div>
              <div className="flex gap-2 ml-3">
                <span className="text-white/70 text-xs px-3 py-1 rounded-md bg-white/10 cursor-pointer hover:bg-white/20">Practice Mode</span>
                <span className="text-white text-xs px-3 py-1 rounded-md bg-white/20 font-semibold">Writing Task</span>
              </div>
            </div>
            <span className="text-white/50 text-xs">toefl.allmyexam.com</span>
          </div>
          {/* Mock content */}
          <div className="bg-white p-6 grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-gray-700">Writing Prompt</span>
                <span className="text-xs text-green-500 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block"/>Active</span>
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded-full w-full"/>
                <div className="h-3 bg-gray-200 rounded-full w-4/5"/>
                <div className="h-3 bg-gray-200 rounded-full w-3/5"/>
              </div>
              <div className="mt-6 border border-gray-200 rounded-xl p-3 flex items-center justify-between">
                <span className="text-xs text-yellow-500 flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-yellow-400 inline-block"/>Time Remaining</span>
                <span className="text-sm font-bold text-[#2bbb8f]">20:00</span>
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-gray-700">Your Response</span>
                <span className="text-xs text-gray-400">Word Count: 0</span>
              </div>
              <p className="text-xs font-mono text-gray-600 leading-relaxed">👋 Hey there! See if you're TOEFL-ready with our free practice test</p>
              <button className="mt-4 w-full bg-[#2bbb8f] hover:bg-[#22a67d] text-white text-sm font-semibold py-2 rounded-lg transition-colors">
                Submit Answer
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── TRUSTED BY UNIVERSITIES ── */}
      <section className="px-4 py-10 text-center">
        <p className="text-sm font-semibold text-gray-500 mb-6 tracking-wide uppercase">Trusted by students from top universities</p>
        <div className="flex flex-wrap items-center justify-center gap-6 md:gap-12 opacity-60">
          {['MIT','Harvard','ETH Zürich','NUS','Oxford','Stanford'].map(name => (
            <span key={name} className="text-lg md:text-xl font-bold text-gray-500">{name}</span>
          ))}
        </div>
      </section>

      {/* ── DARK WAVE SECTION ── */}
      <section className="relative mt-8">
        <svg viewBox="0 0 1440 80" className="w-full" preserveAspectRatio="none">
          <path d="M0,40 C360,80 1080,0 1440,40 L1440,80 L0,80 Z" fill="#e8c5d0"/>
        </svg>
        <svg viewBox="0 0 1440 80" className="w-full -mt-2" preserveAspectRatio="none">
          <path d="M0,60 C480,20 960,80 1440,30 L1440,80 L0,80 Z" fill="#6b5b8f"/>
        </svg>
        <div className="bg-[#111827] text-white py-16 px-4">
          <div className="max-w-2xl mx-auto text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-extrabold mb-4">
              Get familiar with the<br/>Test Format
            </h2>
            <p className="text-gray-400 text-base">Comprehensive TOEFL test preparation materials covering all sections</p>
          </div>
          <div className="max-w-2xl mx-auto space-y-3">
            {[
              { icon: '✏️', color: '#f59e0b', label: 'Writing Practice', desc: 'Practice essay writing and structure' },
              { icon: '🎤', color: '#a78bfa', label: 'Speaking Practice', desc: 'Improve pronunciation and fluency' },
              { icon: '🎧', color: '#a78bfa', label: 'Listening Practice', desc: 'Enhance comprehension skills' },
              { icon: '📖', color: '#2bbb8f', label: 'Reading Practice', desc: 'Build vocabulary and speed' },
            ].map(({ icon, color, label, desc }) => (
              <div key={label} className="flex items-center gap-4 bg-[#1f2937] hover:bg-[#263040] rounded-2xl px-5 py-4 cursor-pointer transition-colors">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                  style={{ backgroundColor: color + '22', border: `1px solid ${color}44` }}>
                  {icon}
                </div>
                <div>
                  <span className="font-bold text-white text-base">{label}</span>
                  <span className="text-gray-400 text-sm ml-3">{desc}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Updated 2026 */}
          <div className="mt-16 text-center">
            <div className="inline-block border border-[#2bbb8f]/40 text-[#2bbb8f] text-sm px-4 py-1.5 rounded-full mb-4">Updated for 2026</div>
            <h3 className="text-2xl md:text-4xl font-extrabold text-white mb-3">
              Aligned with the <span className="text-[#2bbb8f]">New 2026 TOEFL Format</span>
            </h3>
            <p className="text-gray-400 max-w-xl mx-auto text-sm">
              Our practice tests are fully updated to reflect the latest 2026 TOEFL iBT format, so you can prepare with confidence knowing every question matches what you will see on test day.
            </p>
          </div>
        </div>
      </section>

      {/* ── FEATURES CARDS ── */}
      <section className="bg-[#fdf8f2] px-4 py-16">
        <div className="max-w-4xl mx-auto text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-3">
            Everything You Need for Your <span className="text-[#2bbb8f]">TOEFL Practice Test</span>
          </h2>
          <p className="text-gray-500 text-base">Comprehensive TOEFL test preparation tools and features designed to maximize your score</p>
        </div>
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            { icon: '🤖', color: '#a78bfa', title: 'AI-Powered TOEFL Feedback', desc: 'Get instant, detailed feedback on your TOEFL practice test responses' },
            { icon: '📋', color: '#2bbb8f', title: 'Real TOEFL Test Environment', desc: 'Mock TOEFL tests that mirror the conditions of the actual exam' },
            { icon: '📊', color: '#f59e0b', title: 'TOEFL Progress Tracking', desc: 'Monitor your TOEFL test improvement with detailed analytics' },
          ].map(({ icon, color, title, desc }) => (
            <div key={title} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4"
                style={{ backgroundColor: color + '1a' }}>
                {icon}
              </div>
              <h3 className="font-bold text-base mb-2" style={{ color }}>{title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        {/* Empowering CTA */}
        <div className="max-w-2xl mx-auto text-center mt-16">
          <h3 className="text-2xl md:text-4xl font-extrabold text-gray-900 mb-3">
            Empowering <span className="text-[#2bbb8f]">Global</span> TOEFL Test Takers
          </h3>
          <p className="text-gray-500 text-sm mb-6">Our TOEFL practice test platform connects students worldwide, helping them achieve their dreams of international education through comprehensive test preparation.</p>
          <button
            onClick={onStartPractice}
            className="bg-gray-900 hover:bg-gray-700 text-white font-semibold text-base px-8 py-3.5 rounded-full shadow-md transition-all hover:scale-105"
          >
            Start Practicing Free →
          </button>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="bg-[#f5f0e8] px-4 py-16">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-12">
          <div className="md:w-1/3 flex-shrink-0">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 leading-tight">
              Frequently Asked<br/>Questions
            </h2>
            <svg viewBox="0 0 200 40" className="mt-4 w-40 text-purple-400" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M10,30 Q60,5 100,25 Q140,45 190,15"/>
              <path d="M30,38 Q80,15 120,32 Q160,48 195,25"/>
            </svg>
          </div>
          <div className="flex-1 space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                <button
                  onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left text-gray-900 font-medium text-sm md:text-base hover:bg-gray-50 transition-colors"
                >
                  {faq.q}
                  <span className="ml-4 text-gray-400 text-xl flex-shrink-0">{faqOpen === i ? '∧' : '∨'}</span>
                </button>
                {faqOpen === i && (
                  <div className="px-5 pb-4 text-gray-500 text-sm leading-relaxed border-t border-gray-100">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-[#111827] text-white px-6 py-12">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between gap-10">
          <div className="md:w-1/4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#4f8ef7] to-[#2563eb] flex items-center justify-center">
                <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
              </div>
            </div>
            <p className="text-gray-400 text-xs">© toefl.allmyexam.com · All rights reserved.</p>
          </div>
          <div className="flex flex-wrap gap-10 text-sm">
            {[
              { title: 'Product', links: ['Features', 'Pricing & Plans'] },
              { title: 'Company', links: ['Contact', 'About Us', 'Blog'] },
              { title: 'Resources', links: ['Terms of service', 'Privacy Policy'] },
            ].map(({ title, links }) => (
              <div key={title}>
                <div className="font-bold text-white mb-3">{title}</div>
                <ul className="space-y-2">
                  {links.map(link => (
                    <li key={link}><a href="#" className="text-gray-400 hover:text-white transition-colors">{link}</a></li>
                  ))}
                </ul>
              </div>
            ))}
            <div>
              <div className="font-bold text-white mb-3">Social</div>
              <div className="w-8 h-8 rounded-lg bg-[#ff4500] flex items-center justify-center cursor-pointer hover:opacity-90 transition-opacity">
                <span className="text-white text-xs font-bold">r/</span>
              </div>
            </div>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes float1 { 0%,100%{transform:translateY(0) rotate(-12deg)} 50%{transform:translateY(-12px) rotate(-12deg)} }
        @keyframes float2 { 0%,100%{transform:translateY(0) rotate(10deg)} 50%{transform:translateY(-10px) rotate(10deg)} }
        @keyframes float3 { 0%,100%{transform:translateY(0) rotate(-8deg)} 50%{transform:translateY(-14px) rotate(-8deg)} }
      `}</style>
    </div>
  );
}
