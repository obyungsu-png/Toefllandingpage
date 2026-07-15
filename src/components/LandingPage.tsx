import { ChevronDown, GraduationCap, Users, Briefcase, Handshake, X, Play, ArrowRight, Star } from 'lucide-react';
import { useState } from 'react';

interface LandingPageProps {
  onStartTest: () => void;
}

export function LandingPage({ onStartTest }: LandingPageProps) {
  const [showBanner, setShowBanner] = useState(true);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f8f9fb] via-white to-[#f0fafa] overflow-x-hidden">
      <style>{`
        @keyframes fadeSlideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeSlideRight { from { opacity: 0; transform: translateX(50px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes slideDown { from { transform: translateY(-100px); } to { transform: translateY(0); } }
        @keyframes wave { 0%,100% { transform: rotate(0deg); } 25% { transform: rotate(15deg); } 75% { transform: rotate(-10deg); } }
        @keyframes floatY { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        @keyframes glowPulse {
          0%, 100% { box-shadow: 0 0 30px rgba(30,107,115,0.2); }
          50% { box-shadow: 0 0 50px rgba(30,107,115,0.35); }
        }
        .feature-card { transition: all 0.3s ease; }
        .feature-card:hover { transform: translateY(-4px); }
      `}</style>

      {/* Top Banner */}
      {showBanner && (
        <div
          className="bg-gradient-to-r from-[#1e6b73] to-[#2d8a8c] text-center py-2.5 px-5 relative z-50"
          style={{ animation: 'slideDown 0.5s ease-out' }}
        >
          <p className="font-semibold text-sm text-white">
            New TOEFL practice experience is now live{' '}
            <span
              className="inline-block origin-[70%_70%]"
              style={{ animation: 'wave 1.5s infinite' }}
            >
              👋
            </span>{' '}
            <button onClick={onStartTest} className="underline text-white/80 hover:text-white transition-colors">
              start now
            </button>
          </p>
          <button
            onClick={() => setShowBanner(false)}
            className="absolute right-5 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* Glass morphism Navigation */}
      <nav className="sticky top-0 z-40 backdrop-blur-xl bg-white/70 border-b border-white/30 flex justify-between items-center py-4 px-[5%]">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#1e6b73] to-[#2d8a8c] flex items-center justify-center shadow-md shadow-[#1e6b73]/20">
            <span className="text-white font-black text-sm">T</span>
          </div>
          <span className="font-black text-xl tracking-tight text-gray-900">TOEFL TPO</span>
        </div>
        <ul className="hidden md:flex gap-7 text-[13px] font-semibold uppercase text-gray-600">
          <li className="cursor-pointer relative group hover:text-[#1e6b73] transition-colors">
            <span className="flex items-center gap-1">
              For Learners <ChevronDown size={12} />
            </span>
            <span className="absolute bottom-[-5px] left-0 w-0 h-[2px] bg-[#1e6b73] transition-all duration-300 group-hover:w-full"></span>
          </li>
          <li className="cursor-pointer relative group hover:text-[#1e6b73] transition-colors">
            <span className="flex items-center gap-1">
              Partnerships <ChevronDown size={12} />
            </span>
            <span className="absolute bottom-[-5px] left-0 w-0 h-[2px] bg-[#1e6b73] transition-all duration-300 group-hover:w-full"></span>
          </li>
          <li className="cursor-pointer relative group hover:text-[#1e6b73] transition-colors">
            <span className="flex items-center gap-1">
              Support <ChevronDown size={12} />
            </span>
            <span className="absolute bottom-[-5px] left-0 w-0 h-[2px] bg-[#1e6b73] transition-all duration-300 group-hover:w-full"></span>
          </li>
          <li className="cursor-pointer relative group hover:text-[#1e6b73] transition-colors">
            Blog
            <span className="absolute bottom-[-5px] left-0 w-0 h-[2px] bg-[#1e6b73] transition-all duration-300 group-hover:w-full"></span>
          </li>
        </ul>
        <button
          onClick={onStartTest}
          className="md:hidden flex items-center gap-1.5 bg-gradient-to-r from-[#1e6b73] to-[#2d8a8c] text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md active:scale-95 transition-all"
        >
          <Play className="w-3.5 h-3.5 fill-white" />
          Start
        </button>
      </nav>

      {/* Hero Section */}
      <section className="flex flex-col lg:flex-row py-8 lg:py-16 px-[5%] items-center min-h-[70vh] gap-8 lg:gap-12">
        {/* Left: Text Content */}
        <div className="flex-1 text-center lg:text-left">
          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 bg-white border border-gray-100 shadow-sm rounded-full px-3 py-1.5 mb-5" style={{ animation: 'fadeSlideUp 0.6s ease-out both' }}>
            <div className="flex -space-x-1.5">
              <span className="w-5 h-5 rounded-full bg-gradient-to-br from-[#1e6b73] to-[#2d8a8c] border-2 border-white" />
              <span className="w-5 h-5 rounded-full bg-gradient-to-br from-[#2563eb] to-[#3b82f6] border-2 border-white" />
              <span className="w-5 h-5 rounded-full bg-gradient-to-br from-[#e67e22] to-[#f97316] border-2 border-white" />
            </div>
            <span className="text-xs font-bold text-gray-500">2,400+ learners this week</span>
          </div>

          <h1
            className="text-4xl lg:text-6xl font-extrabold leading-tight mb-5 text-gray-900 tracking-tight"
            style={{ animation: 'fadeSlideUp 0.8s ease-out 0.2s both' }}
          >
            Master English and<br className="hidden lg:block" />
            <span className="bg-gradient-to-r from-[#1e6b73] to-[#2d8a8c] bg-clip-text text-transparent"> unlock global opportunities</span>
          </h1>

          <p
            className="text-base md:text-lg leading-relaxed text-gray-500 mb-8 max-w-2xl mx-auto lg:mx-0"
            style={{ animation: 'fadeSlideUp 0.8s ease-out 0.4s both' }}
          >
            <span className="md:hidden">
              Your gateway to international success. Recognized in 160+ countries worldwide.
            </span>
            <span className="hidden md:inline">
              The TOEFL test is more than an exam — it's your gateway to international success.
              From top university admissions to global career advancement and cross-cultural connections,
              your TOEFL score validates your English proficiency on the world stage.
            </span>
          </p>

          <div
            className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start"
            style={{ animation: 'fadeSlideUp 0.8s ease-out 0.6s both' }}
          >
            <button
              onClick={onStartTest}
              className="group relative flex items-center gap-2 bg-gradient-to-r from-[#1e6b73] to-[#2d8a8c] text-white px-7 py-3.5 rounded-2xl font-bold text-sm tracking-wide shadow-lg shadow-[#1e6b73]/20 hover:shadow-xl hover:shadow-[#1e6b73]/30 hover:-translate-y-0.5 transition-all duration-300 active:scale-95 overflow-hidden"
            >
              <span className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 rounded-2xl" />
              <span className="relative flex items-center gap-2">
                <Play className="w-4 h-4 fill-white" />
                Start Practice Test
              </span>
            </button>
            <button
              onClick={onStartTest}
              className="flex items-center gap-2 bg-white text-gray-700 border border-gray-200 px-7 py-3.5 rounded-2xl font-bold text-sm tracking-wide hover:bg-gray-50 hover:border-gray-300 hover:-translate-y-0.5 transition-all duration-300"
            >
              Browse Practice Sets
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right: Image Grid — SVG illustrations (no external file dependency) */}
        <div className="flex-1 grid grid-cols-2 gap-4 w-full max-w-lg">
          {/* Card 1 — Girl studying with book */}
          <div
            className="rounded-2xl overflow-hidden shadow-xl col-span-1 row-span-1 h-48 group bg-gradient-to-br from-teal-100 to-cyan-100 relative"
            style={{ animation: 'fadeSlideRight 0.8s ease-out 0.4s both' }}
          >
            <svg
              viewBox="0 0 200 200"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              style={{ animation: 'floatY 6s ease-in-out infinite' }}
              aria-label="High school student studying TOEFL"
            >
              {/* Background sparkles */}
              <circle cx="30" cy="35" r="2.5" fill="#fff" opacity="0.7" />
              <circle cx="170" cy="40" r="2" fill="#fff" opacity="0.6" />
              <circle cx="160" cy="150" r="1.8" fill="#fff" opacity="0.7" />
              <circle cx="25" cy="160" r="2.2" fill="#fff" opacity="0.6" />
              {/* Book/desk (behind girl) */}
              <rect x="45" y="145" width="110" height="10" rx="2" fill="#f59e0b" />
              <rect x="55" y="130" width="90" height="18" rx="2" fill="#fff" />
              <line x1="65" y1="137" x2="135" y2="137" stroke="#94a3b8" strokeWidth="1.5" />
              <line x1="65" y1="142" x2="120" y2="142" stroke="#94a3b8" strokeWidth="1.5" />
              {/* Girl body */}
              <ellipse cx="100" cy="115" rx="28" ry="22" fill="#14b8a6" />
              {/* Girl head */}
              <circle cx="100" cy="80" r="24" fill="#fde68a" />
              {/* Hair */}
              <path d="M 76 78 Q 76 55 100 55 Q 124 55 124 78 Q 124 68 118 65 Q 110 72 100 70 Q 90 68 82 65 Q 76 68 76 78 Z" fill="#78350f" />
              <path d="M 74 82 Q 70 100 76 108 L 82 96 Q 78 90 78 82 Z" fill="#78350f" />
              {/* Eyes (closed happy) */}
              <path d="M 88 82 Q 91 79 94 82" stroke="#1f2937" strokeWidth="2" fill="none" strokeLinecap="round" />
              <path d="M 106 82 Q 109 79 112 82" stroke="#1f2937" strokeWidth="2" fill="none" strokeLinecap="round" />
              {/* Smile */}
              <path d="M 94 92 Q 100 96 106 92" stroke="#1f2937" strokeWidth="2" fill="none" strokeLinecap="round" />
              {/* Cheek blush */}
              <circle cx="86" cy="88" r="3" fill="#fca5a5" opacity="0.7" />
              <circle cx="114" cy="88" r="3" fill="#fca5a5" opacity="0.7" />
            </svg>
          </div>

          {/* Card 2 (Tall) — Boy with laptop */}
          <div
            className="rounded-2xl overflow-hidden shadow-xl col-span-1 row-span-2 group bg-gradient-to-br from-blue-100 to-indigo-100 relative"
            style={{ animation: 'fadeSlideRight 0.8s ease-out 0.6s both' }}
          >
            <svg
              viewBox="0 0 200 400"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              style={{ animation: 'floatY 7s ease-in-out 1s infinite' }}
              aria-label="Student solving SAT questions on laptop"
              preserveAspectRatio="xMidYMid slice"
            >
              {/* Sparkles */}
              <circle cx="30" cy="50" r="2.5" fill="#fff" opacity="0.7" />
              <circle cx="170" cy="80" r="2" fill="#fff" opacity="0.6" />
              <circle cx="35" cy="330" r="2.2" fill="#fff" opacity="0.6" />
              <circle cx="165" cy="360" r="1.8" fill="#fff" opacity="0.7" />
              {/* Floating "A+" badge */}
              <circle cx="150" cy="120" r="18" fill="#fbbf24" />
              <text x="150" y="127" textAnchor="middle" fontSize="18" fontWeight="bold" fill="#fff">A+</text>
              {/* Boy head */}
              <circle cx="100" cy="140" r="28" fill="#fde68a" />
              {/* Hair */}
              <path d="M 72 135 Q 72 108 100 108 Q 128 108 128 135 Q 128 122 122 118 Q 112 128 100 125 Q 88 128 78 118 Q 72 122 72 135 Z" fill="#1f2937" />
              {/* Glasses */}
              <circle cx="90" cy="145" r="7" fill="none" stroke="#1f2937" strokeWidth="2" />
              <circle cx="110" cy="145" r="7" fill="none" stroke="#1f2937" strokeWidth="2" />
              <line x1="97" y1="145" x2="103" y2="145" stroke="#1f2937" strokeWidth="2" />
              {/* Eyes */}
              <circle cx="90" cy="145" r="2" fill="#1f2937" />
              <circle cx="110" cy="145" r="2" fill="#1f2937" />
              {/* Smile */}
              <path d="M 92 158 Q 100 163 108 158" stroke="#1f2937" strokeWidth="2" fill="none" strokeLinecap="round" />
              {/* Body/shirt */}
              <path d="M 60 200 Q 60 180 100 180 Q 140 180 140 200 L 148 260 L 52 260 Z" fill="#3b82f6" />
              {/* Arms toward laptop */}
              <ellipse cx="70" cy="240" rx="10" ry="18" fill="#3b82f6" transform="rotate(20 70 240)" />
              <ellipse cx="130" cy="240" rx="10" ry="18" fill="#3b82f6" transform="rotate(-20 130 240)" />
              {/* Laptop base */}
              <rect x="40" y="270" width="120" height="8" rx="2" fill="#374151" />
              {/* Laptop screen */}
              <rect x="52" y="220" width="96" height="52" rx="3" fill="#1f2937" />
              <rect x="56" y="224" width="88" height="44" rx="2" fill="#e0f2fe" />
              {/* Screen text lines */}
              <rect x="62" y="232" width="40" height="3" rx="1" fill="#3b82f6" />
              <rect x="62" y="240" width="60" height="3" rx="1" fill="#94a3b8" />
              <rect x="62" y="248" width="50" height="3" rx="1" fill="#94a3b8" />
              <rect x="62" y="256" width="55" height="3" rx="1" fill="#94a3b8" />
              {/* Desk shadow */}
              <ellipse cx="100" cy="285" rx="80" ry="6" fill="#000" opacity="0.1" />
            </svg>
          </div>

          {/* Card 3 — Two students collaborating */}
          <div
            className="rounded-2xl overflow-hidden shadow-xl col-span-1 row-span-1 h-48 group bg-gradient-to-br from-orange-100 to-amber-100 relative"
            style={{ animation: 'fadeSlideRight 0.8s ease-out 0.8s both' }}
          >
            <svg
              viewBox="0 0 200 200"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              style={{ animation: 'floatY 5s ease-in-out 0.5s infinite' }}
              aria-label="Two students practicing English conversation"
            >
              {/* Sparkles */}
              <circle cx="25" cy="30" r="2" fill="#fff" opacity="0.7" />
              <circle cx="175" cy="35" r="2.5" fill="#fff" opacity="0.6" />
              <circle cx="170" cy="165" r="1.8" fill="#fff" opacity="0.7" />
              {/* Speech bubbles */}
              <ellipse cx="60" cy="45" rx="18" ry="12" fill="#fff" opacity="0.95" />
              <text x="60" y="50" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#f97316">Hi!</text>
              <ellipse cx="140" cy="45" rx="22" ry="12" fill="#fff" opacity="0.95" />
              <text x="140" y="50" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#0891b2">Hello!</text>
              {/* Left student body */}
              <ellipse cx="60" cy="150" rx="24" ry="20" fill="#f97316" />
              {/* Left student head */}
              <circle cx="60" cy="115" r="22" fill="#fde68a" />
              {/* Left hair (ponytail) */}
              <path d="M 40 115 Q 40 92 60 92 Q 80 92 80 115 Q 80 103 74 100 Q 66 110 60 108 Q 54 106 46 100 Q 40 105 40 115 Z" fill="#7c2d12" />
              <ellipse cx="82" cy="122" rx="4" ry="8" fill="#7c2d12" />
              {/* Left eyes */}
              <path d="M 51 116 Q 54 113 57 116" stroke="#1f2937" strokeWidth="2" fill="none" strokeLinecap="round" />
              <path d="M 63 116 Q 66 113 69 116" stroke="#1f2937" strokeWidth="2" fill="none" strokeLinecap="round" />
              {/* Left smile */}
              <path d="M 55 125 Q 60 129 65 125" stroke="#1f2937" strokeWidth="2" fill="none" strokeLinecap="round" />
              {/* Right student body */}
              <ellipse cx="140" cy="150" rx="24" ry="20" fill="#06b6d4" />
              {/* Right student head */}
              <circle cx="140" cy="115" r="22" fill="#fde68a" />
              {/* Right hair (short) */}
              <path d="M 120 115 Q 120 92 140 92 Q 160 92 160 115 Q 160 105 154 100 Q 144 110 140 108 Q 136 108 126 100 Q 120 105 120 115 Z" fill="#422006" />
              {/* Right eyes */}
              <path d="M 131 116 Q 134 113 137 116" stroke="#1f2937" strokeWidth="2" fill="none" strokeLinecap="round" />
              <path d="M 143 116 Q 146 113 149 116" stroke="#1f2937" strokeWidth="2" fill="none" strokeLinecap="round" />
              {/* Right smile */}
              <path d="M 135 125 Q 140 129 145 125" stroke="#1f2937" strokeWidth="2" fill="none" strokeLinecap="round" />
              {/* Cheek blush */}
              <circle cx="47" cy="122" r="2.5" fill="#fca5a5" opacity="0.7" />
              <circle cx="73" cy="122" r="2.5" fill="#fca5a5" opacity="0.7" />
              <circle cx="127" cy="122" r="2.5" fill="#fca5a5" opacity="0.7" />
              <circle cx="153" cy="122" r="2.5" fill="#fca5a5" opacity="0.7" />
            </svg>
          </div>
        </div>
      </section>

      {/* Features Section — card style with glow */}
      <section className="bg-white py-14 px-[5%] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 border-t border-gray-100">
        {/* Feature 1 */}
        <div
          className="feature-card bg-gradient-to-b from-white to-[#f0fafa] rounded-2xl p-6 border border-gray-100 cursor-pointer"
          style={{ animation: 'fadeSlideUp 0.8s ease-out 1s both' }}
        >
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#1e6b73] to-[#2d8a8c] flex items-center justify-center shadow-md shadow-[#1e6b73]/20 mb-4">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <h3 className="font-extrabold text-gray-900 mb-2 flex items-center gap-2 text-sm uppercase tracking-wide">
            For Test Takers
          </h3>
          <p className="text-xs md:text-sm text-gray-500 leading-relaxed">
            <span className="md:hidden">TPO 1-75 practice tests</span>
            <span className="hidden md:inline">Practice with complete TPO 1-75 tests and build real exam confidence.</span>
          </p>
        </div>

        {/* Feature 2 */}
        <div
          className="feature-card bg-gradient-to-b from-white to-[#eff4ff] rounded-2xl p-6 border border-gray-100 cursor-pointer"
          style={{ animation: 'fadeSlideUp 0.8s ease-out 1.2s both' }}
        >
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#2563eb] to-[#3b82f6] flex items-center justify-center shadow-md shadow-[#2563eb]/20 mb-4">
            <Users className="w-6 h-6 text-white" />
          </div>
          <h3 className="font-extrabold text-gray-900 mb-2 flex items-center gap-2 text-sm uppercase tracking-wide">
            For Institutions
          </h3>
          <p className="text-xs md:text-sm text-gray-500 leading-relaxed">
            <span className="md:hidden">TOEFL education solutions</span>
            <span className="hidden md:inline">Effective TOEFL education solutions to help students achieve their goals.</span>
          </p>
        </div>

        {/* Feature 3 */}
        <div
          className="feature-card bg-gradient-to-b from-white to-[#fff6e7] rounded-2xl p-6 border border-gray-100 cursor-pointer"
          style={{ animation: 'fadeSlideUp 0.8s ease-out 1.4s both' }}
        >
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#e67e22] to-[#f97316] flex items-center justify-center shadow-md shadow-[#e67e22]/20 mb-4">
            <Briefcase className="w-6 h-6 text-white" />
          </div>
          <h3 className="font-extrabold text-gray-900 mb-2 flex items-center gap-2 text-sm uppercase tracking-wide">
            For Teachers
          </h3>
          <p className="text-xs md:text-sm text-gray-500 leading-relaxed">
            <span className="md:hidden">Teaching resources & tools</span>
            <span className="hidden md:inline">Comprehensive teaching resources and analytical tools for effective instruction.</span>
          </p>
        </div>

        {/* Feature 4 */}
        <div
          className="feature-card bg-gradient-to-b from-white to-[#f5f3ff] rounded-2xl p-6 border border-gray-100 cursor-pointer"
          style={{ animation: 'fadeSlideUp 0.8s ease-out 1.6s both' }}
        >
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#7c3aed] to-[#8b5cf6] flex items-center justify-center shadow-md shadow-[#7c3aed]/20 mb-4">
            <Handshake className="w-6 h-6 text-white" />
          </div>
          <h3 className="font-extrabold text-gray-900 mb-2 flex items-center gap-2 text-sm uppercase tracking-wide">
            For Advisors
          </h3>
          <p className="text-xs md:text-sm text-gray-500 leading-relaxed">
            <span className="md:hidden">Study abroad support tools</span>
            <span className="hidden md:inline">All-in-one TOEFL learning support tools for study abroad preparation.</span>
          </p>
        </div>
      </section>

      {/* Bottom CTA — glow effect */}
      <section className="px-[5%] py-14">
        <div
          className="max-w-2xl mx-auto relative bg-gradient-to-br from-[#1e6b73] via-[#2d7a7c] to-[#3d8a8c] rounded-3xl p-8 text-center text-white shadow-xl overflow-hidden"
          style={{ animation: 'glowPulse 3s ease-in-out infinite' }}
        >
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

          <div className="relative">
            <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold mb-3 border border-white/20">
              <Star className="w-3 h-3 fill-white" /> RECOMMENDED
            </div>
            <p className="text-xl lg:text-2xl font-extrabold mb-2">Ready for the real thing?</p>
            <p className="text-sm opacity-85 mb-5 max-w-xs mx-auto leading-relaxed">
              Full-length diagnostic test with all 4 sections. Get your band score estimate in one sitting.
            </p>
            <button
              onClick={onStartTest}
              className="inline-flex items-center gap-2 bg-white text-[#1e6b73] px-7 py-3.5 rounded-2xl font-extrabold text-sm hover:bg-gray-100 transition-all active:scale-95 shadow-lg shadow-black/10"
            >
              Start Full Test
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
