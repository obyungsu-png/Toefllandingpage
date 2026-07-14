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

        {/* Right: Image Grid */}
        <div className="flex-1 grid grid-cols-2 gap-4 w-full max-w-lg">
          {/* Image 1 */}
          <div
            className="rounded-2xl overflow-hidden shadow-xl col-span-1 row-span-1 h-48 group bg-gradient-to-br from-teal-100 to-cyan-100"
            style={{ animation: 'fadeSlideRight 0.8s ease-out 0.4s both' }}
          >
            <img
              loading="lazy"
              src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&q=80&auto=format&fit=crop"
              alt="High school student studying TOEFL"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              style={{ animation: 'floatY 6s ease-in-out infinite' }}
              onError={(e) => { e.currentTarget.style.opacity = '0'; }}
            />
          </div>

          {/* Image 2 (Tall) */}
          <div
            className="rounded-2xl overflow-hidden shadow-xl col-span-1 row-span-2 group bg-gradient-to-br from-blue-100 to-indigo-100"
            style={{ animation: 'fadeSlideRight 0.8s ease-out 0.6s both' }}
          >
            <img
              loading="lazy"
              src="https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600&q=80&auto=format&fit=crop"
              alt="Middle school student solving SAT questions"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              style={{ animation: 'floatY 7s ease-in-out 1s infinite' }}
              onError={(e) => { e.currentTarget.style.opacity = '0'; }}
            />
          </div>

          {/* Image 3 */}
          <div
            className="rounded-2xl overflow-hidden shadow-xl col-span-1 row-span-1 h-48 group bg-gradient-to-br from-orange-100 to-amber-100"
            style={{ animation: 'fadeSlideRight 0.8s ease-out 0.8s both' }}
          >
            <img
              loading="lazy"
              src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=600&q=80&auto=format&fit=crop"
              alt="Group of students practicing English conversation"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              style={{ animation: 'floatY 5s ease-in-out 0.5s infinite' }}
              onError={(e) => { e.currentTarget.style.opacity = '0'; }}
            />
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
