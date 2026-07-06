import { useState, useEffect } from 'react';
import { X, User, Lock, Shield, Mail } from 'lucide-react';
import { SERVER_BASE_URL, getServerHeaders } from '../utils/apiConfig';

interface LoginFormProps {
  onClose: () => void;
  onLoginSuccess?: (username: string) => void; // Pass username on success
  onShowRegister?: () => void;
}

export function LoginForm({ onClose, onLoginSuccess, onShowRegister }: LoginFormProps) {
  const [captcha, setCaptcha] = useState('');
  const [loginMethod, setLoginMethod] = useState<'username' | 'email'>('username');
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStatus, setForgotStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  // Form fields
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');

  const generateCaptcha = () => {
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    let newCaptcha = '';
    for (let i = 0; i < 4; i++) {
      newCaptcha += chars[Math.floor(Math.random() * chars.length)];
    }
    setCaptcha(newCaptcha);
  };

  useEffect(() => {
    generateCaptcha();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (captchaInput.toLowerCase() !== captcha.toLowerCase()) {
      alert('보안 코드가 올바르지 않아요. 다시 확인해주세요.');
      generateCaptcha();
      setCaptchaInput('');
      return;
    }

    const doLogin = async () => {
      try {
        const response = await fetch(`${SERVER_BASE_URL}/users/login`, {
          method: 'POST',
          headers: {
            ...getServerHeaders(),
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            username: loginMethod === 'username' ? username : undefined,
            email: loginMethod === 'email' ? email : undefined,
            password,
            loginMethod
          })
        });

        const responseText = await response.text();

        let data;
        try {
          data = JSON.parse(responseText);
        } catch (parseError) {
          console.error('Failed to parse response:', responseText);
          alert('Server returned invalid response. Please try again or contact support.');
          generateCaptcha();
          setCaptchaInput('');
          return;
        }

        if (!response.ok) {
          alert(data.error || 'Login failed');
          generateCaptcha();
          setCaptchaInput('');
          return;
        }

        if (onLoginSuccess) {
          onLoginSuccess(data.user.username);
        }
      } catch (error) {
        console.error('Login error:', error);
        alert('Failed to connect to server. Please try again.');
        generateCaptcha();
        setCaptchaInput('');
      }
    };

    doLogin();
  };

  const handleForgotPassword = async () => {
    if (!forgotEmail.trim() || !forgotEmail.includes('@')) {
      setForgotStatus('error');
      return;
    }
    setForgotStatus('sending');
    try {
      const response = await fetch(`${SERVER_BASE_URL}/users/forgot-password`, {
        method: 'POST',
        headers: {
          ...getServerHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: forgotEmail.trim() })
      });
      setForgotStatus('sent');
    } catch (error) {
      console.error('Forgot password error:', error);
      setForgotStatus('sent');
    }
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
        로그인
      </h2>

      {/* Login Method Toggle */}
      <div className="flex gap-1.5 mb-5 bg-gray-100 rounded-lg p-1">
        <button
          type="button"
          onClick={() => setLoginMethod('username')}
          className={`flex-1 py-2 rounded-md font-semibold text-xs sm:text-sm transition-all ${
            loginMethod === 'username'
              ? 'bg-[#1e6b73] text-white shadow-sm'
              : 'bg-transparent text-gray-500 hover:bg-white'
          }`}
        >
          사용자명 로그인
        </button>
        <button
          type="button"
          onClick={() => setLoginMethod('email')}
          className={`flex-1 py-2 rounded-md font-semibold text-xs sm:text-sm transition-all ${
            loginMethod === 'email'
              ? 'bg-[#1e6b73] text-white shadow-sm'
              : 'bg-transparent text-gray-500 hover:bg-white'
          }`}
        >
          이메일 로그인
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {loginMethod === 'username' ? (
          <div className="relative mb-3">
            <input
              type="text"
              placeholder="사용자명"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-800 transition-all focus:outline-none focus:ring-2 focus:ring-[#1e6b73]/30 focus:border-[#1e6b73] focus:bg-white"
            />
            <User size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
        ) : (
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
        )}

        <div className="relative mb-3">
          <input
            type="password"
            placeholder="비밀번호"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-800 transition-all focus:outline-none focus:ring-2 focus:ring-[#1e6b73]/30 focus:border-[#1e6b73] focus:bg-white"
          />
          <Lock size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        </div>

        {/* Captcha */}
        <div className="relative mb-4 flex rounded-lg border border-gray-200 bg-gray-50 overflow-hidden">
          <Shield size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 z-10" />
          <input
            type="text"
            placeholder="보안 코드"
            required
            value={captchaInput}
            onChange={(e) => setCaptchaInput(e.target.value)}
            className="flex-1 pl-10 pr-3 py-2.5 bg-transparent text-gray-800 transition-all focus:outline-none"
          />
          <div
            onClick={generateCaptcha}
            className="w-[90px] flex items-center justify-center font-mono font-bold text-base tracking-[3px] text-gray-600 bg-gray-100 cursor-pointer border-l border-gray-200 select-none hover:bg-gray-200 transition-colors"
            title="Click to refresh"
          >
            {captcha}
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-3 bg-[#1e6b73] text-white rounded-lg font-bold text-base cursor-pointer transition-colors hover:bg-[#164f56] shadow-sm"
        >
          Login
        </button>

        <div className="flex justify-between text-xs sm:text-sm px-1 mt-5">
          <button type="button"
            onClick={() => { if (onShowRegister) onShowRegister(); }}
            className="text-[#1e6b73] bg-transparent border-none cursor-pointer font-bold transition-colors hover:underline">
            회원가입
          </button>
          <button type="button"
            onClick={() => { setShowForgot(true); setForgotStatus('idle'); }}
            className="text-gray-500 bg-transparent border-none cursor-pointer font-medium transition-colors hover:text-gray-700 hover:underline">
            비밀번호 찾기
          </button>
        </div>
      </form>

      {/* Forgot Password Modal */}
      {showForgot && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4"
          onClick={() => setShowForgot(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">비밀번호 찾기</h3>
              <button onClick={() => setShowForgot(false)} className="p-1.5 hover:bg-gray-100 rounded-full text-gray-400">
                <X size={20} />
              </button>
            </div>

            {forgotStatus === 'sent' ? (
              <div className="text-center py-6">
                <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                  <Mail size={28} className="text-emerald-600" />
                </div>
                <p className="text-gray-700 font-medium mb-1">이메일을 확인해주세요</p>
                <p className="text-sm text-gray-500">
                  입력하신 주소로 비밀번호 재설정 링크를 보냈어요.<br />받은 편지함과 스팸함을 확인해주세요.
                </p>
                <button onClick={() => setShowForgot(false)}
                  className="mt-6 w-full py-2.5 rounded-lg bg-[#1e6b73] text-white font-bold hover:bg-[#164f56] transition-colors">
                  확인
                </button>
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-500 mb-4">
                  가입하신 이메일 주소를 입력하시면 비밀번호 재설정 링크를 보내드려요.
                </p>
                <div className="relative mb-3">
                  <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => { setForgotEmail(e.target.value); setForgotStatus('idle'); }}
                    placeholder="example@email.com"
                    className={`w-full pl-10 pr-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-[#1e6b73]/30 focus:border-transparent ${
                      forgotStatus === 'error' ? 'border-red-400' : 'border-gray-300'
                    }`}
                  />
                </div>
                {forgotStatus === 'error' && (
                  <p className="text-xs text-red-500 mb-3">올바른 이메일 주소를 입력해주세요.</p>
                )}
                <button
                  onClick={handleForgotPassword}
                  disabled={forgotStatus === 'sending'}
                  className="w-full py-2.5 rounded-lg bg-[#1e6b73] text-white font-bold hover:bg-[#164f56] transition-colors disabled:opacity-50"
                >
                  {forgotStatus === 'sending' ? '전송 중...' : '재설정 링크 보내기'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
