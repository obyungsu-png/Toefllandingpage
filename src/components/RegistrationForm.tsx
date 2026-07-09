import { useState, useEffect } from 'react';
import { X, User, Lock, KeyRound } from 'lucide-react';
import { SERVER_BASE_URL, getServerHeaders } from '../utils/apiConfig';

interface RegistrationFormProps {
  onClose: () => void;
  onRegisterSuccess?: () => void;
  onShowLogin?: () => void;
}

export function RegistrationForm({ onClose, onRegisterSuccess, onShowLogin }: RegistrationFormProps) {
  const [securityCode, setSecurityCode] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (securityCode.length !== 4) {
      alert('4자리 보안코드를 입력해주세요.');
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
            securityCode,
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
          const msg = data.error === 'Username already taken'
            ? '이미 사용 중인 사용자명이에요.'
            : data.error === 'Invalid invite code'
            ? '유효하지 않은 보안코드입니다.'
            : data.error || '회원가입에 실패했어요.';
          alert(msg);
          return;
        }

        alert(`회원가입이 완료되었어요!\n\n사용자명: ${username}\n\n이제 로그인할 수 있어요.`);

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
        <div className="relative mb-3">
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

        {/* Security Code / Captcha */}
        <div className="relative mb-4">
          <input
            type="text"
            placeholder="보안코드 (4자리)"
            required
            value={securityCode}
            onChange={(e) => setSecurityCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
            maxLength={4}
            className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-800 transition-all focus:outline-none focus:ring-2 focus:ring-[#1e6b73]/30 focus:border-[#1e6b73] focus:bg-white text-center tracking-[0.8em] font-mono font-bold text-lg"
          />
          <KeyRound size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
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
