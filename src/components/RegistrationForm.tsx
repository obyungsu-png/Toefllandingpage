import { useState, useEffect } from 'react';
import { X, User, Lock, Shield, Mail, Cloud, Laptop } from 'lucide-react';
import { SERVER_BASE_URL, getServerHeaders } from '../utils/apiConfig';

interface RegistrationFormProps {
  onClose: () => void;
  onRegisterSuccess?: () => void;
}

export function RegistrationForm({ onClose, onRegisterSuccess }: RegistrationFormProps) {
  const [countdown, setCountdown] = useState(0);
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [sentCode, setSentCode] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setIsButtonDisabled(false);
    }
  }, [countdown]);

  const handleSendCode = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      alert('유효한 이메일 주소를 입력해주세요.');
      return;
    }

    // Generate a random 6-digit verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    try {
      const res = await fetch(`${SERVER_BASE_URL}/auth/send-email-code`, {
        method: 'POST',
        headers: { ...getServerHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });

      if (res.ok) {
        setSentCode(code);
        setCountdown(60);
        setIsButtonDisabled(true);
        alert(`인증 코드가 ${email} 로 전송되었어요.\n메일함을 확인해주세요. (스팸함도 함께 확인)`);
      } else {
        // Backend not configured yet — dev fallback
        setSentCode(code);
        setCountdown(60);
        setIsButtonDisabled(true);
        alert(`[개발 모드] 메일 발송 백엔드가 아직 설정되지 않았어요.\n인증 코드: ${code}\n\n(실서비스에서는 ${email} 로 자동 전송됩니다)`);
      }
    } catch (err) {
      // Network error — dev fallback
      setSentCode(code);
      setCountdown(60);
      setIsButtonDisabled(true);
      alert(`[개발 모드] 인증 코드: ${code}\n\n(백엔드 연결 시 ${email} 로 자동 발송)`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate verification code
    if (verificationCode !== sentCode) {
      alert('인증 코드가 올바르지 않아요. 다시 확인해주세요.');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert('유효한 이메일 주소를 입력해주세요.');
      return;
    }

    if (!agreedToTerms) {
      alert('개인정보 처리방침에 동의해주세요.');
      return;
    }

    // Call server API for registration
    const doRegister = async () => {
      try {
        const response = await fetch(`${SERVER_BASE_URL}/users/register`, {
          method: 'POST',
          headers: {
            ...getServerHeaders(),
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email,
            username,
            password
          })
        });

        // Read response as text first to check format
        const responseText = await response.text();
        console.log('Registration response:', responseText);

        let data;
        try {
          data = JSON.parse(responseText);
        } catch (parseError) {
          console.error('Failed to parse response:', responseText);
          alert('Server returned invalid response. Please try again or contact support.');
          return;
        }

        if (!response.ok) {
          alert(data.error || 'Registration failed');
          return;
        }

        alert(`회원가입이 완료되었어요!\n\n이메일: ${email}\n사용자명: ${username}\n\n이제 로그인할 수 있어요.`);
        
        if (onRegisterSuccess) {
          onRegisterSuccess();
        }
        onClose();
      } catch (error) {
        console.error('Registration error:', error);
        alert('Failed to connect to server. Please try again.');
      }
    };

    doRegister();
  };

  return (
    <div className="relative w-full min-h-[calc(100vh-80px)] flex items-center justify-center bg-gradient-to-br from-[#4FC3F7] to-[#29B6F6] animate-fadeIn py-4 md:py-10">
      {/* Background clouds */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <Cloud className="absolute top-[5%] left-[10%] text-[3rem] md:text-[4rem] text-white/40 animate-floatCloud" style={{ animationDuration: '25s' }} />
        <Cloud className="absolute top-[15%] right-[15%] text-[4rem] md:text-[6rem] text-white/40 animate-floatCloudReverse" style={{ animationDuration: '30s' }} />
        <Cloud className="absolute bottom-[10%] left-[20%] text-[2rem] md:text-[3rem] text-white/40 animate-floatCloud" style={{ animationDuration: '20s' }} />
      </div>

      {/* Container */}
      <div className="relative z-10 w-[95%] md:w-[90%] max-w-[1200px] flex flex-col md:flex-row items-center justify-between gap-6 md:gap-10 p-3 md:p-5">
        {/* Left: Hero Section - Hidden on mobile */}
        <div className="hidden md:flex flex-1 text-white text-center p-5 animate-fadeInUp flex-col">
          <h1 className="text-5xl font-bold mb-3 drop-shadow-md">
            Join Our Community
          </h1>
          <p className="text-2xl mb-10 animate-fadeInUp" style={{ animationDelay: '0.3s' }}>
            Start Your TOEFL Journey Today
          </p>
          
          <div className="w-[300px] h-[200px] bg-white/20 border-4 border-white rounded-xl mx-auto flex items-center justify-center backdrop-blur-sm animate-float">
            <Laptop className="w-20 h-20 text-white" />
          </div>
        </div>

        {/* Right: Registration Form */}
        <div className="flex-none w-full md:w-[450px] bg-white/25 p-5 md:p-10 rounded-2xl backdrop-blur-xl shadow-2xl border border-white/20 animate-slideInRight" style={{ opacity: 0 }}>
          <h2 className="text-center text-2xl md:text-3xl text-[#333] mb-6 md:mb-8 font-bold tracking-wide">
            회원가입
          </h2>
          
          <form onSubmit={handleSubmit}>
            {/* Email Address */}
            <div className="relative mb-5">
              <input
                type="email"
                placeholder="이메일 주소 (예: student@example.com)"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-md bg-white text-[#333] transition-all focus:outline-none focus:ring-4 focus:ring-[#29B6F6]/30 shadow-sm"
              />
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#aaa]" />
            </div>

            {/* Verification Code */}
            <div className="relative mb-5">
              <input
                type="text"
                placeholder="이메일로 받은 6자리 코드"
                required
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                maxLength={6}
                className="w-full pl-12 pr-[120px] py-4 rounded-md bg-white text-[#333] transition-all focus:outline-none focus:ring-4 focus:ring-[#29B6F6]/30 shadow-sm"
              />
              <Shield className="absolute left-4 top-1/2 -translate-y-1/2 text-[#aaa] transition-colors" />
              <button
                type="button"
                onClick={handleSendCode}
                disabled={isButtonDisabled}
                className="absolute right-1 top-1 bottom-1 bg-[#29B6F6] text-white font-semibold px-4 rounded cursor-pointer transition-all text-sm hover:bg-[#039BE5] disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {countdown > 0 ? `${countdown}s` : 'Get Code'}
              </button>
            </div>

            {/* Username */}
            <div className="relative mb-5">
              <input
                type="text"
                placeholder="사용자명 (최소 3자)"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                minLength={3}
                className="w-full pl-12 pr-4 py-4 rounded-md bg-white text-[#333] transition-all focus:outline-none focus:ring-4 focus:ring-[#29B6F6]/30 shadow-sm"
              />
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[#aaa] transition-colors" />
            </div>

            {/* Password */}
            <div className="relative mb-5">
              <input
                type="password"
                placeholder="비밀번호 (최소 6자)"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                className="w-full pl-12 pr-4 py-4 rounded-md bg-white text-[#333] transition-all focus:outline-none focus:ring-4 focus:ring-[#29B6F6]/30 shadow-sm"
              />
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#aaa] transition-colors" />
            </div>

            {/* Terms Checkbox */}
            <div className="flex items-center mb-5 text-sm text-[#333]">
              <input
                type="checkbox"
                id="terms"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mr-3 cursor-pointer accent-[#29B6F6] w-4 h-4"
              />
              <label htmlFor="terms" className="cursor-pointer">
                I have read and agree to the{' '}
                <a href="#" className="text-[#333] font-semibold no-underline relative inline-block after:content-[''] after:absolute after:w-full after:h-[1px] after:bottom-[-2px] after:left-0 after:bg-[#333] after:scale-x-0 after:transition-transform after:duration-300 hover:after:scale-x-100">
                  Privacy Policy
                </a>
              </label>
            </div>

            {/* Sign Up Button — disabled until agree is checked */}
            <button
              type="submit"
              disabled={!agreedToTerms}
              className={`w-full py-4 rounded-md text-lg font-bold transition-all shadow-lg ${
                agreedToTerms
                  ? 'bg-[#29B6F6] text-white cursor-pointer hover:bg-[#039BE5] hover:-translate-y-0.5 active:translate-y-0'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
              title={agreedToTerms ? '' : 'Privacy Policy에 동의해야 가입할 수 있어요'}
            >
              {agreedToTerms ? 'Sign Up' : '✓ 약관 동의 후 가입 가능'}
            </button>

            {/* Login Link */}
            <div className="text-center mt-5 text-[#333] text-sm">
              Already have an account?{' '}
              <a href="#" className="text-[#29B6F6] no-underline font-bold ml-1 hover:underline">
                Log In
              </a>
            </div>
          </form>
        </div>
      </div>

      <style>{`
        @keyframes floatCloud {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(20px); }
        }
        @keyframes floatCloudReverse {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(-20px); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-15px); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(50px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        .animate-floatCloud { animation: floatCloud 20s linear infinite; }
        .animate-floatCloudReverse { animation: floatCloud 20s linear infinite reverse; }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-fadeInUp { animation: fadeInUp 0.8s ease forwards; }
        .animate-slideInRight { animation: slideInRight 0.8s ease 0.5s forwards; }
        .animate-fadeIn { animation: fadeIn 0.3s ease; }
      `}</style>
    </div>
  );
}