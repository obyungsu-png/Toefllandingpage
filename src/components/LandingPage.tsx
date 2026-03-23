import { ChevronDown, GraduationCap, Users, Briefcase, Handshake, X } from 'lucide-react';
import { useState } from 'react';

interface LandingPageProps {
  onStartTest: () => void;
}

export function LandingPage({ onStartTest }: LandingPageProps) {
  const [showBanner, setShowBanner] = useState(true);

  return (
    <div className="min-h-screen bg-[#EEF0FF] overflow-x-hidden">
      <style>{`
        @keyframes fadeSlideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeSlideRight { from { opacity: 0; transform: translateX(50px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes slideDown { from { transform: translateY(-100px); } to { transform: translateY(0); } }
        @keyframes wave { 0%,100% { transform: rotate(0deg); } 25% { transform: rotate(15deg); } 75% { transform: rotate(-10deg); } }
        @keyframes floatY { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
      `}</style>
      {/* Top Banner */}
      {showBanner && (
        <div
          className="bg-[#EAFF5E] text-center py-3 px-5 relative z-50"
          style={{ animation: 'slideDown 0.5s ease-out' }}
        >
          <p className="font-semibold text-sm">
            Platform updates coming January 2026{' '}
            <span
              className="inline-block origin-[70%_70%]"
              style={{ animation: 'wave 1.5s infinite' }}
            >
              👋
            </span>{' '}
            <a href="#" className="underline">
              learn more
            </a>
          </p>
          <button
            onClick={() => setShowBanner(false)}
            className="absolute right-5 top-1/2 -translate-y-1/2 text-xl hover:opacity-70 transition-opacity"
          >
            <X size={20} />
          </button>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex justify-between items-center py-5 px-[5%] bg-transparent">
        <div className="font-black text-2xl tracking-wider">TOEFL TPO</div>
        <ul className="hidden md:flex gap-8 text-[13px] font-semibold uppercase">
          <li className="cursor-pointer relative group">
            <span className="flex items-center gap-1">
              For Learners <ChevronDown size={12} />
            </span>
            <span className="absolute bottom-[-5px] left-0 w-0 h-[2px] bg-[#2E336B] transition-all duration-300 group-hover:w-full"></span>
          </li>
          <li className="cursor-pointer relative group">
            <span className="flex items-center gap-1">
              Partnerships <ChevronDown size={12} />
            </span>
            <span className="absolute bottom-[-5px] left-0 w-0 h-[2px] bg-[#2E336B] transition-all duration-300 group-hover:w-full"></span>
          </li>
          <li className="cursor-pointer relative group">
            <span className="flex items-center gap-1">
              Support <ChevronDown size={12} />
            </span>
            <span className="absolute bottom-[-5px] left-0 w-0 h-[2px] bg-[#2E336B] transition-all duration-300 group-hover:w-full"></span>
          </li>
          <li className="cursor-pointer relative group">
            Blog
            <span className="absolute bottom-[-5px] left-0 w-0 h-[2px] bg-[#2E336B] transition-all duration-300 group-hover:w-full"></span>
          </li>
        </ul>
      </nav>

      {/* Hero Section */}
      <section className="flex flex-col lg:flex-row py-10 lg:py-20 px-[5%] items-center min-h-[80vh] gap-10">
        {/* Left: Text Content */}
        <div className="flex-1 text-center lg:text-left">
          <h1
            className="text-5xl lg:text-6xl font-extrabold leading-tight mb-6 text-black"
            style={{ animation: 'fadeSlideUp 0.8s ease-out 0.2s both' }}
          >
            Master English and unlock global opportunities
          </h1>
          
          <p
            className="text-base md:text-lg leading-relaxed text-[#555] mb-10 max-w-2xl mx-auto lg:mx-0"
            style={{ animation: 'fadeSlideUp 0.8s ease-out 0.4s both' }}
          >
            <span className="md:hidden">
              Your gateway to international success. Recognized in 160+ countries worldwide.
            </span>
            <span className="hidden md:inline">
              The TOEFL test is more than an exam — it&apos;s your gateway to international success. 
              From top university admissions to global career advancement and cross-cultural connections, 
              your TOEFL score validates your English proficiency on the world stage.
              <br />
              <br />
              Recognized in 160+ countries worldwide. Comprehensive practice platform for real exam preparation.
            </span>
          </p>
          
          <div
            className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
            style={{ animation: 'fadeSlideUp 0.8s ease-out 0.6s both' }}
          >
            <button 
              onClick={onStartTest}
              className="bg-[#2E336B] text-white px-8 py-4 rounded font-bold text-sm uppercase tracking-wide shadow-lg hover:bg-[#1e224a] hover:-translate-y-1 hover:shadow-xl transition-all duration-300"
            >
              Start Practice Test
            </button>
            <button className="bg-transparent text-[#2E336B] border border-[#2E336B] px-8 py-4 rounded font-bold text-sm uppercase tracking-wide hover:bg-[rgba(46,51,107,0.05)] hover:-translate-y-1 transition-all duration-300">
              Buy Study Materials
            </button>
          </div>
        </div>

        {/* Right: Image Grid */}
        <div className="flex-1 grid grid-cols-2 gap-4 w-full max-w-lg">
          {/* Image 1 */}
          <div
            className="rounded-lg overflow-hidden shadow-xl col-span-1 row-span-1 h-48 group"
            style={{ animation: 'fadeSlideRight 0.8s ease-out 0.4s both' }}
          >
            <img
              src="https://images.unsplash.com/photo-1631061184412-b18f5fb1dc70?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600"
              alt="TOEFL Study Illustration"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              style={{ animation: 'floatY 6s ease-in-out infinite' }}
            />
          </div>

          {/* Image 2 (Tall) */}
          <div
            className="rounded-lg overflow-hidden shadow-xl col-span-1 row-span-2 group"
            style={{ animation: 'fadeSlideRight 0.8s ease-out 0.6s both' }}
          >
            <img
              src="https://images.unsplash.com/photo-1649920442906-3c8ef428fb6e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600"
              alt="English Learning Illustration"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              style={{ animation: 'floatY 7s ease-in-out 1s infinite' }}
            />
          </div>

          {/* Image 3 */}
          <div
            className="rounded-lg overflow-hidden shadow-xl col-span-1 row-span-1 h-48 group"
            style={{ animation: 'fadeSlideRight 0.8s ease-out 0.8s both' }}
          >
            <img
              src="https://images.unsplash.com/photo-1585984968562-1443b72fb0dc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600"
              alt="Study Group Illustration"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              style={{ animation: 'floatY 5s ease-in-out 0.5s infinite' }}
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white py-16 px-[5%] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 border-t border-gray-200">
        {/* Feature 1 */}
        <div
          className="hover:-translate-y-2 transition-transform duration-300 cursor-pointer group"
          style={{ animation: 'fadeSlideUp 0.8s ease-out 1s both' }}
        >
          <div className="text-4xl text-[#2E336B] mb-4">
            <GraduationCap size={40} />
          </div>
          <h3 className="font-extrabold text-[#2E336B] mb-3 flex items-center gap-2 uppercase text-sm">
            For Test Takers{' '}
            <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
          </h3>
          <p className="text-xs md:text-sm text-[#555] leading-relaxed">
            <span className="md:hidden">TPO 1-75 practice tests</span>
            <span className="hidden md:inline">Practice with complete TPO 1-75 tests and build real exam confidence.</span>
          </p>
        </div>

        {/* Feature 2 */}
        <div
          className="hover:-translate-y-2 transition-transform duration-300 cursor-pointer group"
          style={{ animation: 'fadeSlideUp 0.8s ease-out 1.2s both' }}
        >
          <div className="text-4xl text-[#2E336B] mb-4">
            <Users size={40} />
          </div>
          <h3 className="font-extrabold text-[#2E336B] mb-3 flex items-center gap-2 uppercase text-sm">
            For Institutions{' '}
            <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
          </h3>
          <p className="text-xs md:text-sm text-[#555] leading-relaxed">
            <span className="md:hidden">TOEFL education solutions</span>
            <span className="hidden md:inline">Effective TOEFL education solutions to help students achieve their goals.</span>
          </p>
        </div>

        {/* Feature 3 */}
        <div
          className="hover:-translate-y-2 transition-transform duration-300 cursor-pointer group"
          style={{ animation: 'fadeSlideUp 0.8s ease-out 1.4s both' }}
        >
          <div className="text-4xl text-[#2E336B] mb-4">
            <Briefcase size={40} />
          </div>
          <h3 className="font-extrabold text-[#2E336B] mb-3 flex items-center gap-2 uppercase text-sm">
            For Teachers{' '}
            <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
          </h3>
          <p className="text-xs md:text-sm text-[#555] leading-relaxed">
            <span className="md:hidden">Teaching resources & tools</span>
            <span className="hidden md:inline">Comprehensive teaching resources and analytical tools for effective instruction.</span>
          </p>
        </div>

        {/* Feature 4 */}
        <div
          className="hover:-translate-y-2 transition-transform duration-300 cursor-pointer group"
          style={{ animation: 'fadeSlideUp 0.8s ease-out 1.6s both' }}
        >
          <div className="text-4xl text-[#2E336B] mb-4">
            <Handshake size={40} />
          </div>
          <h3 className="font-extrabold text-[#2E336B] mb-3 flex items-center gap-2 uppercase text-sm">
            For Advisors{' '}
            <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
          </h3>
          <p className="text-xs md:text-sm text-[#555] leading-relaxed">
            <span className="md:hidden">Study abroad support tools</span>
            <span className="hidden md:inline">All-in-one TOEFL learning support tools for study abroad preparation.</span>
          </p>
        </div>
      </section>
    </div>
  );
}