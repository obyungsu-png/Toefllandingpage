import { useState } from 'react';
import { BookOpen, Headphones, Pencil, Lightbulb } from 'lucide-react';

// ── WeChat SVG icon ──
function WeChatIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.295.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 0 1 .598.082l1.584.926a.272.272 0 0 0 .14.047c.134 0 .24-.111.24-.247 0-.06-.023-.12-.038-.177l-.327-1.233a.582.582 0 0 1-.023-.156.49.49 0 0 1 .201-.398C23.024 18.48 24 16.82 24 14.98c0-3.21-2.931-5.837-7.062-6.122zM14.033 13.33c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.97-.982zm4.844 0c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.97-.982z"/>
    </svg>
  );
}

// ── Google SVG icon ──
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

interface LoginPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginClick: () => void;
  onRegisterClick?: () => void;
}

export function LoginPopup({ isOpen, onClose, onLoginClick, onRegisterClick }: LoginPopupProps) {
  const [showExpanded, setShowExpanded] = useState(false);

  if (!isOpen) return null;

  const handleWeChatLogin = async () => {
    const { supabase } = await import('../utils/supabase/client');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'wechat',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) alert('微信登录失败: ' + error.message);
  };

  const handleGoogleLogin = async () => {
    const { supabase } = await import('../utils/supabase/client');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) alert('Google 登录失败: ' + error.message);
  };

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
        style={{
          backgroundColor: 'rgba(10, 15, 20, 0.82)',
          backdropFilter: 'blur(3px)',
          WebkitBackdropFilter: 'blur(3px)',
          animation: 'fadeIn 0.3s ease-out',
        }}
      >
        {/* Floating Circle Modal Container */}
        <div
          className="relative"
          style={{
            width: showExpanded ? '420px' : undefined,
            maxWidth: showExpanded ? '95vw' : undefined,
            transition: 'width 0.3s ease',
            animation: showExpanded ? undefined : 'floatBounce 3s ease-in-out infinite, gentleSwing 4s ease-in-out infinite'
          }}
        >
          {/* Pulse rings in background */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#0d7377]/20 to-[#14919b]/20"
               style={{ animation: 'pulseRing 2s ease-in-out infinite', transform: 'scale(1.15)', display: showExpanded ? 'none' : 'block' }} />
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#14919b]/15 to-[#0d7377]/15"
               style={{ animation: 'pulseRing 2s ease-in-out 0.5s infinite', transform: 'scale(1.25)', display: showExpanded ? 'none' : 'block' }} />

          {/* Left Bunny Ear - only when not expanded */}
          {!showExpanded && (
            <div
              className="absolute -top-16 left-8 md:left-12"
              style={{
                animation: 'earWiggle 2s ease-in-out infinite',
                transformOrigin: 'bottom center'
              }}
            >
              <div className="relative">
                <div className="w-16 h-32 md:w-20 md:h-40 bg-gradient-to-br from-[#0d7377] to-[#14919b] rounded-full rotate-[-20deg] shadow-lg" />
                <div className="absolute top-3 left-3 w-10 h-20 md:w-12 md:h-26 bg-pink-200/80 rounded-full" />
              </div>
            </div>
          )}

          {/* Right Bunny Ear - only when not expanded */}
          {!showExpanded && (
            <div
              className="absolute -top-16 right-8 md:right-12"
              style={{
                animation: 'earWiggle 2s ease-in-out 0.3s infinite',
                transformOrigin: 'bottom center'
              }}
            >
              <div className="relative">
                <div className="w-16 h-32 md:w-20 md:h-40 bg-gradient-to-br from-[#14919b] to-[#0d7377] rounded-full rotate-[20deg] shadow-lg" />
                <div className="absolute top-3 right-3 w-10 h-20 md:w-12 md:h-26 bg-pink-200/80 rounded-full" />
              </div>
            </div>
          )}

          {/* Main Circle / Expanded Card */}
          <div className={`bg-gradient-to-br from-[#0d7377] via-[#14919b] to-[#0d7377] shadow-2xl relative overflow-hidden ${
            showExpanded ? 'rounded-2xl p-6 sm:p-8' : 'w-[300px] h-[300px] md:w-[400px] md:h-[400px] rounded-full'
          }`}>
            {/* Decorative circles inside (only circle mode) */}
            {!showExpanded && (
              <>
                <div className="absolute -top-10 -right-10 w-32 h-32 md:w-40 md:h-40 rounded-full bg-white/10" />
                <div className="absolute -bottom-8 -left-8 w-24 h-24 md:w-32 md:h-32 rounded-full bg-white/5" />
                <div className="absolute top-16 right-20 w-4 h-4 rounded-full bg-white/30" />
                <div className="absolute top-24 right-12 w-3 h-3 rounded-full bg-white/20" />
                <div className="absolute bottom-20 left-16 w-3 h-3 rounded-full bg-white/20" />
              </>
            )}

            {/* Content */}
            <div className={`flex flex-col items-center ${showExpanded ? 'w-full' : 'justify-center h-full px-8 md:px-12'}`}>
              {/* Floating Icons - only when not expanded */}
              {!showExpanded && (
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
              )}

              {/* Title */}
              <h2 className={`font-bold text-white text-center leading-tight tracking-tight mb-2 ${
                showExpanded ? 'text-xl mb-4' : 'text-2xl md:text-3xl mb-3'
              }`}>
                {showExpanded ? 'Start Your TOEFL Journey' : <>Start Your<br />TOEFL Journey</>}
              </h2>

              {/* Subtitle */}
              <p className={`text-white/80 font-medium mb-5 ${
                showExpanded ? 'text-sm' : 'text-sm md:text-base mb-6'
              }`}>
                Sign up or Log in to start
              </p>

              {/* Social Login Buttons */}
              <div className="w-full space-y-2.5 mb-3">
                <button
                  onClick={handleWeChatLogin}
                  className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl bg-[#07C160] hover:bg-[#06ad56] text-white font-semibold transition-all shadow-md hover:shadow-lg active:scale-[0.98]"
                >
                  <WeChatIcon className="w-5 h-5" /> 微信으로 계속하기
                </button>
                <button
                  onClick={handleGoogleLogin}
                  className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl bg-white border border-white/30 hover:bg-white/90 text-gray-700 font-semibold transition-all shadow-md hover:shadow-lg active:scale-[0.98]"
                >
                  <GoogleIcon className="w-5 h-5" /> Google로 계속하기
                </button>
              </div>

              {/* Divider */}
              <div className="relative w-full my-3">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/20" /></div>
                <div className="relative flex justify-center"><span className="px-3 text-xs text-white/50">또는 이메일로 가입</span></div>
              </div>

              {/* Email Register Button */}
              <button
                onClick={() => { if (onRegisterClick) onRegisterClick(); }}
                className="w-full py-3 rounded-xl border-2 border-dashed border-white/40 hover:border-white/70 text-white/80 hover:text-white font-medium transition-all text-sm active:scale-[0.98]"
              >
                이메일 주소로 가입하기
              </button>

              {/* Bottom text */}
              <p className="text-white/50 text-xs text-center mt-4">
                Practice smarter, score higher 🐰
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
