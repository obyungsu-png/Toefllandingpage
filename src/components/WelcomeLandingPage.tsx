import { X } from 'lucide-react';
// motion removed - using CSS animations

const floatStyle = `
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-12px); }
  }
`;

interface WelcomeLandingPageProps {
  onStartPractice: () => void;
}

export function WelcomeLandingPage({ onStartPractice }: WelcomeLandingPageProps) {
  return (
    <div className="min-h-screen bg-[#e8e4f3] flex flex-col">
      <style>{floatStyle}</style>
      {/* Top Banner */}
      <div className="bg-[#e8ed3d] px-6 py-3 flex items-center justify-between">
        <div className="flex-1 text-center">
          <span className="text-black text-sm md:text-base">
            <span className="hidden md:inline">Platform updates coming January 2026 ✨{' '}</span>
            <span className="md:hidden">Updates Jan 2026 ✨{' '}</span>
            <a href="#" className="underline font-semibold">learn more</a>
          </span>
        </div>
        <button className="text-black hover:text-gray-700 transition-colors">
          <X size={20} />
        </button>
      </div>

      {/* Navigation Header */}
      <header className="bg-[#e8e4f3] px-4 md:px-12 py-4 md:py-6">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <div className="text-xl md:text-3xl font-bold tracking-tight">TOEFL TPO</div>
          
          <nav className="hidden md:flex items-center gap-8">
            <div className="relative group cursor-pointer">
              <span className="text-sm font-semibold">FOR LEARNERS</span>
              <span className="ml-1">▼</span>
            </div>
            <div className="relative group cursor-pointer">
              <span className="text-sm font-semibold">PARTNERSHIPS</span>
              <span className="ml-1">▼</span>
            </div>
            <div className="relative group cursor-pointer">
              <span className="text-sm font-semibold">SUPPORT</span>
              <span className="ml-1">▼</span>
            </div>
            <a href="#" className="text-sm font-semibold">BLOG</a>
          </nav>
          
          {/* Mobile Menu Icon */}
          <button className="md:hidden text-sm font-semibold">Menu ☰</button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 md:px-12 py-8 md:py-16">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row items-center justify-between gap-8 md:gap-16">
          {/* Left Content */}
          <div className="flex-1 max-w-[600px] text-center md:text-left">
            <h1 className="text-3xl md:text-6xl font-bold leading-tight mb-4 md:mb-8">
              <span className="hidden md:block">Master English<br />and unlock global<br />opportunities</span>
              <span className="md:hidden">Master English<br />Go Global</span>
            </h1>
            
            <p className="text-sm md:text-lg text-gray-700 mb-4 md:mb-6 leading-relaxed">
              <span className="hidden md:inline">
                The <span className="font-semibold">TOEFL</span> test is more than an exam — it's your gateway to 
                international success. From top university admissions to global 
                career advancement and cross-cultural connections, your TOEFL 
                score validates your English proficiency on the world stage.
              </span>
              <span className="md:hidden">
                <span className="font-semibold">TOEFL</span> is your gateway to global success. 
                University admissions, career growth, and worldwide recognition.
              </span>
            </p>
            
            <p className="text-xs md:text-base text-gray-600 mb-6 md:mb-10 leading-relaxed">
              <span className="hidden md:inline">
                Recognized in 160+ countries worldwide. Comprehensive practice 
                platform for real exam preparation.
              </span>
              <span className="md:hidden">
                Recognized in 160+ countries. Real exam prep.
              </span>
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col md:flex-row items-center gap-3 md:gap-4">
              <button
                onClick={onStartPractice}
                className="w-full md:w-auto bg-[#3d4a7d] text-white px-6 md:px-8 py-3 md:py-4 rounded font-semibold text-xs md:text-sm tracking-wide hover:bg-[#2d3a6d] transition-all transform hover:scale-105 shadow-lg"
              >
                TOEFL Prep
              </button>
              <button className="w-full md:w-auto bg-transparent border-2 border-[#3d4a7d] text-[#3d4a7d] px-6 md:px-8 py-3 md:py-4 rounded font-semibold text-xs md:text-sm tracking-wide hover:bg-[#3d4a7d] hover:text-white transition-all transform hover:scale-105">
                IELTS Prep
              </button>
            </div>
          </div>

          {/* Right Images */}
          <div className="md:hidden flex justify-center mb-8">
            {/* Mobile Single Image */}
            <div
              className="rounded-lg overflow-hidden shadow-lg w-full max-w-[400px] h-[250px]"
              style={{ animation: 'float 3s ease-in-out infinite' }}
            >
              <img
                loading="lazy"
                src="/landing/toefl-speaking-study-1.png"
                alt="Boy studying TOEFL with headphones"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          <div className="hidden md:grid flex-none w-[500px] grid-cols-2 gap-4">
            {/* Top Left Image */}
            <div
              className="rounded-lg overflow-hidden shadow-lg h-[180px]"
              style={{ animation: 'float 3s ease-in-out infinite' }}
            >
              <img
                src="/landing/toefl-speaking-study-3.png"
                alt="Boy and girl studying together"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Top Right Image - spans 2 rows */}
            <div
              className="rounded-lg overflow-hidden shadow-lg row-span-2 h-[380px]"
              style={{ animation: 'float 4s ease-in-out 0.5s infinite' }}
            >
              <img
                src="/landing/toefl-speaking-study-2.png"
                alt="Boy reading English textbook"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Bottom Left Image */}
            <div
              className="rounded-lg overflow-hidden shadow-lg h-[180px]"
              style={{ animation: 'float 3.5s ease-in-out 1s infinite' }}
            >
              <img
                src="/landing/toefl-speaking-study-1.png"
                alt="Boy and girl practicing English conversation"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </main>

      {/* Footer spacer */}
      <div className="h-16"></div>
    </div>
  );
}