import { useState, useEffect } from 'react';
import { X, User, Lock, Shield, Mail } from 'lucide-react';
import { SERVER_BASE_URL, getServerHeaders } from '../utils/apiConfig';
import { supabase } from '../utils/supabase';

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

  // ── Social Login Handlers ──
  const handleWeChatLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'wechat',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) alert('微信登录失败: ' + error.message);
  };

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) alert('Google 登录失败: ' + error.message);
  };

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
        {/* ── Social Login Buttons ── */}
        <div className="space-y-2.5 mb-5">
          <button
            type="button"
            onClick={handleWeChatLogin}
            className="w-full flex items-center justify-center gap-2.5 py-2.5 rounded-lg bg-[#07C160] hover:bg-[#06ad56] text-white font-semibold transition-colors shadow-sm"
          >
            <WeChatIcon className="w-5 h-5" />
            微信登录
          </button>
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-2.5 py-2.5 rounded-lg bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold transition-colors shadow-sm"
          >
            <GoogleIcon className="w-5 h-5" />
            Google 로그인
          </button>
        </div>

        {/* Divider */}
        <div className="relative mb-5">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
          <div className="relative flex justify-center"><span className="px-3 bg-white text-xs text-gray-400">또는</span></div>
        </div>

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
