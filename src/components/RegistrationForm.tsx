import { useState, useEffect } from 'react';
import { X, User, Lock, Shield, Mail } from 'lucide-react';
import { SERVER_BASE_URL, getServerHeaders } from '../utils/apiConfig';

interface RegistrationFormProps {
  onClose: () => void;
  onRegisterSuccess?: () => void;
  onShowLogin?: () => void;
}

export function RegistrationForm({ onClose, onRegisterSuccess, onShowLogin }: RegistrationFormProps) {
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

    try {
      const res = await fetch(`${SERVER_BASE_URL}/auth/send-email-code`, {
        method: 'POST',
        headers: { ...getServerHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.code) {
          setSentCode(data.code);
        }
        setCountdown(60);
        setIsButtonDisabled(true);
        alert(`인증 코드가 ${email} 로 전송되었어요.\n메일함을 확인해주세요. (스팸함도 함께 확인)`);
      } else {
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        setSentCode(code);
        setCountdown(60);
        setIsButtonDisabled(true);
        alert(`[개발 모드] 인증 코드: ${code}`);
      }
    } catch (err) {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setSentCode(code);
      setCountdown(60);
      setIsButtonDisabled(true);
      alert(`[개발 모드] 인증 코드: ${code}`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (verificationCode !== sentCode) {
      alert('인증 코드가 올바르지 않아요. 다시 확인해주세요.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert('유효한 이메일 주소를 입력해주세요.');
      return;
    }

    if (!agreedToTerms) {
      alert('개인정보 처리방침에 동의해주세요.');
      return;
    }

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

        const responseText = await response.text();

        let data;
        try {
          data = JSON.parse(responseText);
        } catch (parseError) {
          console.error('Failed to parse response:', responseText);
          alert('Server returned invalid response. Please try again or contact support.');
          return;
        }

        if (!response.ok) {
          const msg = data.error === 'Email already registered'
            ? '이미 등록된 이메일이에요. 로그인해주세요.'
            : data.error === 'Username already taken'
            ? '이미 사용 중인 사용자명이에요.'
            : data.error || '회원가입에 실패했어요.';
          alert(msg);
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
    <div className="w-[92vw] max-w-[400px] bg-white rounded-2xl shadow-2xl p-6 sm:p-8 relative">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-1.5 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
      >
        <X size={18} />
      </button>

      <h2 className="text-center text-xl font-bold text-[#1e6b73] mb-6">
        회원가입
      </h2>

      <form onSubmit={handleSubmit}>
        {/* Email Address */}
        <div className="relative mb-3">
          <input
            type="email"
            placeholder="이메일 주소"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-800 transition-all focus:outline-none focus:ring-2 focus:ring-[#1e6b73]/30 focus:border-[#1e6b73] focus:bg-white"
          />
          <Mail size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        </div>

        {/* Verification Code */}
        <div className="relative mb-3">
          <input
            type="text"
            placeholder="6자리 인증코드"
            required
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
            maxLength={6}
            className="w-full pl-10 pr-[92px] py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-800 transition-all focus:outline-none focus:ring-2 focus:ring-[#1e6b73]/30 focus:border-[#1e6b73] focus:bg-white"
          />
          <Shield size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <button
            type="button"
            onClick={handleSendCode}
            disabled={isButtonDisabled}
            className="absolute right-1.5 top-1.5 bottom-1.5 bg-[#1e6b73] text-white font-semibold px-3 rounded-md cursor-pointer transition-colors text-xs hover:bg-[#164f56] disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {countdown > 0 ? `${countdown}s` : '코드 받기'}
          </button>
        </div>

        {/* Username */}
        <div className="relative mb-3">
          <input
            type="text"
            placeholder="사용자명 (최소 3자)"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            minLength={3}
            className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-800 transition-all focus:outline-none focus:ring-2 focus:ring-[#1e6b73]/30 focus:border-[#1e6b73] focus:bg-white"
          />
          <User size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        </div>

        {/* Password */}
        <div className="relative mb-4">
          <input
            type="password"
            placeholder="비밀번호 (최소 6자)"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-800 transition-all focus:outline-none focus:ring-2 focus:ring-[#1e6b73]/30 focus:border-[#1e6b73] focus:bg-white"
          />
          <Lock size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        </div>

        {/* Terms Checkbox */}
        <div className="flex items-center mb-4 text-xs sm:text-sm text-gray-600">
          <input
            type="checkbox"
            id="terms"
            checked={agreedToTerms}
            onChange={(e) => setAgreedToTerms(e.target.checked)}
            className="mr-2.5 cursor-pointer accent-[#1e6b73] w-4 h-4"
          />
          <label htmlFor="terms" className="cursor-pointer">
            <span className="font-semibold text-[#1e6b73]">개인정보 처리방침</span>에 동의합니다.
          </label>
        </div>

        <button
          type="submit"
          disabled={!agreedToTerms}
          className={`w-full py-3 rounded-lg font-bold text-base transition-colors shadow-sm ${
            agreedToTerms
              ? 'bg-[#1e6b73] text-white cursor-pointer hover:bg-[#164f56]'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          Sign Up
        </button>

        <div className="text-center mt-5 text-gray-500 text-xs sm:text-sm">
          이미 계정이 있으신가요?{' '}
          <button
            type="button"
            onClick={() => { if (onShowLogin) onShowLogin(); }}
            className="text-[#1e6b73] font-bold hover:underline"
          >
            로그인
          </button>
        </div>
      </form>
    </div>
  );
}
