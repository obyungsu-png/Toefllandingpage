import { BookOpen, Headphones, Pencil, Lightbulb, ArrowRight, X } from 'lucide-react';

interface LoginPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginClick: () => void;
  onRegisterClick?: () => void;
}

export function LoginPopup({ isOpen, onClose, onLoginClick, onRegisterClick }: LoginPopupProps) {
  if (!isOpen) return null;

  return (
    <>
      <style>{`
        @keyframes fadeIn { 
          from { opacity: 0; } 
          to { opacity: 1; } 
        }
        @keyframes floatBounce { 
          0%, 100% { transform: translateY(0px); } 
          50% { transform: translateY(-20px); } 
        }
        @keyframes gentleSwing { 
          0%, 100% { transform: rotate(-3deg); } 
          50% { transform: rotate(3deg); } 
        }
        @keyframes earWiggle { 
          0%, 100% { transform: rotate(-5deg); } 
          50% { transform: rotate(5deg); } 
        }
        @keyframes pulseRing {
          0% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.1); opacity: 0.3; }
          100% { transform: scale(1); opacity: 0.5; }
        }
        @keyframes iconFloat {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          25% { transform: translateY(-8px) rotate(5deg); }
          75% { transform: translateY(-4px) rotate(-5deg); }
        }
      `}</style>
      <div
        className="fixed inset-0 z-[60] flex items-center justify-center p-4"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)', animation: 'fadeIn 0.3s ease-out' }}
        onClick={onClose}
      >
        {/* Floating Circle Modal Container */}
        <div
          className="relative"
          style={{ 
            animation: 'floatBounce 3s ease-in-out infinite, gentleSwing 4s ease-in-out infinite'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Pulse rings in background */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#0d7377]/20 to-[#14919b]/20" 
               style={{ animation: 'pulseRing 2s ease-in-out infinite', transform: 'scale(1.15)' }} />
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#14919b]/15 to-[#0d7377]/15" 
               style={{ animation: 'pulseRing 2s ease-in-out 0.5s infinite', transform: 'scale(1.25)' }} />
          
          {/* Left Bunny Ear */}
          <div 
            className="absolute -top-16 left-8 md:left-12"
            style={{ 
              animation: 'earWiggle 2s ease-in-out infinite',
              transformOrigin: 'bottom center'
            }}
          >
            <div className="relative">
              {/* Outer ear */}
              <div className="w-16 h-32 md:w-20 md:h-40 bg-gradient-to-br from-[#0d7377] to-[#14919b] rounded-full rotate-[-20deg] shadow-lg" />
              {/* Inner ear */}
              <div className="absolute top-3 left-3 w-10 h-20 md:w-12 md:h-26 bg-pink-200/80 rounded-full" />
            </div>
          </div>

          {/* Right Bunny Ear */}
          <div 
            className="absolute -top-16 right-8 md:right-12"
            style={{ 
              animation: 'earWiggle 2s ease-in-out 0.3s infinite',
              transformOrigin: 'bottom center'
            }}
          >
            <div className="relative">
              {/* Outer ear */}
              <div className="w-16 h-32 md:w-20 md:h-40 bg-gradient-to-br from-[#14919b] to-[#0d7377] rounded-full rotate-[20deg] shadow-lg" />
              {/* Inner ear */}
              <div className="absolute top-3 right-3 w-10 h-20 md:w-12 md:h-26 bg-pink-200/80 rounded-full" />
            </div>
          </div>

          {/* Main Circle */}
          <div className="w-[340px] h-[340px] md:w-[450px] md:h-[450px] rounded-full bg-gradient-to-br from-[#0d7377] via-[#14919b] to-[#0d7377] shadow-2xl relative overflow-hidden">
            {/* Decorative circles inside */}
            <div className="absolute -top-10 -right-10 w-32 h-32 md:w-40 md:h-40 rounded-full bg-white/10" />
            <div className="absolute -bottom-8 -left-8 w-24 h-24 md:w-32 md:h-32 rounded-full bg-white/5" />
            <div className="absolute top-16 right-20 w-4 h-4 rounded-full bg-white/30" />
            <div className="absolute top-24 right-12 w-3 h-3 rounded-full bg-white/20" />
            <div className="absolute bottom-20 left-16 w-3 h-3 rounded-full bg-white/20" />

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm hover:bg-white/30 transition-colors z-10"
            >
              <X className="w-5 h-5 text-white" />
            </button>

            {/* Content */}
            <div className="flex flex-col items-center justify-center h-full px-8 md:px-12">
              {/* Floating Icons */}
              <div className="flex gap-3 mb-6">
                {[BookOpen, Headphones, Pencil, Lightbulb].map((Icon, i) => (
                  <div
                    key={i}
                    className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-white/15 flex items-center justify-center backdrop-blur-sm"
                    style={{ 
                      animation: `iconFloat 3s ease-in-out ${i * 0.3}s infinite`
                    }}
                  >
                    <Icon className="w-6 h-6 md:w-7 md:h-7 text-white/90" strokeWidth={1.8} />
                  </div>
                ))}
              </div>

              {/* Title */}
              <h2 className="text-2xl md:text-3xl font-bold text-white text-center leading-tight tracking-tight mb-3">
                Start Your<br />TOEFL Journey
              </h2>
              
              {/* Subtitle */}
              <p className="text-white/80 text-sm md:text-base text-center font-medium mb-8">
                Log in to access all practice tests
              </p>

              {/* Login Button */}
              <button
                onClick={onLoginClick}
                className="w-full max-w-[240px] py-4 rounded-full bg-white text-[#0d7377] font-bold text-lg flex items-center justify-center gap-2 shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all"
              >
                Log In
                <ArrowRight className="w-5 h-5" />
              </button>

              {/* Register link */}
              {onRegisterClick && (
                <p className="text-white/80 text-sm text-center mt-5">
                  계정이 없으신가요?{' '}
                  <button
                    onClick={onRegisterClick}
                    className="font-bold text-white underline underline-offset-2 hover:text-white/90"
                  >
                    회원가입
                  </button>
                </p>
              )}

              {/* Bottom text */}
              <p className="text-white/60 text-xs md:text-sm text-center mt-5">
                Practice smarter, score higher 🐰
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}