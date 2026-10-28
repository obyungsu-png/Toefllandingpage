import { useState, useEffect, useCallback } from 'react';
import { X, Lock, User, RefreshCw } from 'lucide-react';
import { SERVER_BASE_URL, getServerHeaders } from '../utils/apiConfig';
import { supabase } from '../utils/supabase/client';
import { usernameToEmail, isValidUsername } from '../utils/authMapping';

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

interface LoginFormProps {
  onClose: () => void;
  onLoginSuccess?: (username: string) => void;
}

type Mode = 'login' | 'signup';

// ── 4자리 보안코드(사람/봇 구분용 캡차) 생성 ──
// 헷갈리는 글자(0/O, 1/I/l)는 제외한 영문 대문자 + 숫자.
const CAPTCHA_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function generateCaptcha(): string {
  let out = '';
  for (let i = 0; i < 4; i++) {
    out += CAPTCHA_CHARS[Math.floor(Math.random() * CAPTCHA_CHARS.length)];
  }
  return out;
}

export function LoginForm({ onClose, onLoginSuccess }: LoginFormProps) {
  const [mode, setMode] = useState<Mode>('login');

  // Form fields — username + password
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');

  // 보안코드(캡차)
  const [captcha, setCaptcha] = useState(generateCaptcha);
  const [captchaInput, setCaptchaInput] = useState('');

  const [submitting, setSubmitting] = useState(false);

  const refreshCaptcha = useCallback(() => {
    setCaptcha(generateCaptcha());
    setCaptchaInput('');
  }, []);

  // 모드 전환 시 캡차/에러 상태 초기화
  useEffect(() => {
    if (mode === 'signup') refreshCaptcha();
    setPasswordConfirm('');
    setCaptchaInput('');
  }, [mode, refreshCaptcha]);

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/#/auth/callback` },
    });
    if (error) alert('Google 로그인 실패: ' + error.message);
  };

  // ── 아이디 + 비밀번호 로그인 ──
  const doLogin = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: usernameToEmail(username),
      password,
    });

    if (error) {
      const msg = /invalid login credentials/i.test(error.message)
        ? '아이디 또는 비밀번호가 올바르지 않아요. 계정이 없다면 회원가입을 해주세요.'
        : '로그인에 실패했어요: ' + error.message;
      alert(msg);
      return;
    }

    if (onLoginSuccess) onLoginSuccess(username.trim().toLowerCase());
    if (data.session) onClose();
  };

  // ── 아이디 + 비밀번호 + 보안코드 회원가입 ──
  const doSignup = async () => {
    const res = await fetch(`${SERVER_BASE_URL}/users/register`, {
      method: 'POST',
      headers: { ...getServerHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: username.trim().toLowerCase(),
        password,
        email: usernameToEmail(username),
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data.success) {
      alert(data.error || '회원가입에 실패했어요. 다시 시도해 주세요.');
      return;
    }

    const { data: signInData, error } = await supabase.auth.signInWithPassword({
      email: usernameToEmail(username),
      password,
    });

    if (error) {
      alert('가입은 완료됐지만 자동 로그인에 실패했어요. 로그인 탭에서 다시 시도해 주세요.');
      setMode('login');
      return;
    }

    if (onLoginSuccess) onLoginSuccess(username.trim().toLowerCase());
    if (signInData.session) onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    const uname = username.trim();
    if (!isValidUsername(uname)) {
      alert('아이디는 영문/숫자 3~20자로 입력해주세요.');
      return;
    }
    if (password.length < 6) {
      alert('비밀번호는 6자 이상으로 입력해주세요.');
      return;
    }

    if (mode === 'signup') {
      if (password !== passwordConfirm) {
        alert('비밀번호가 일치하지 않아요.');
        return;
      }
      if (captchaInput.trim().toUpperCase() !== captcha) {
        alert('보안코드가 올바르지 않아요.');
        refreshCaptcha();
        return;
      }
    }

    setSubmitting(true);
    try {
      if (mode === 'login') {
        await doLogin();
      } else {
        await doSignup();
      }
    } catch (err) {
      console.error('Auth error:', err);
      alert('서버 연결에 실패했습니다. 다시 시도해 주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  const isSignup = mode === 'signup';

  return (
    <div className="w-[92vw] max-w-[400px] bg-white rounded-2xl shadow-2xl p-6 sm:p-8 relative">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-1.5 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
      >
        <X size={18} />
      </button>

      <h2 className="text-center text-xl font-bold text-[#1e6b73] mb-6">
        {isSignup ? '회원가입' : '로그인'}
      </h2>

      {/* ── Google 소셜 로그인 ── */}
      <button
        type="button"
        onClick={handleGoogleLogin}
        className="w-full flex items-center justify-center gap-2.5 py-3 rounded-lg bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold transition-all shadow-sm active:scale-[0.98]"
      >
        <GoogleIcon className="w-5 h-5" />
        Google로 계속하기
      </button>

      {/* Divider */}
      <div className="relative my-5">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
        <div className="relative flex justify-center"><span className="px-3 bg-white text-xs text-gray-400">또는</span></div>
      </div>

      {/* ── 아이디 + 비밀번호 폼 ── */}
      <form onSubmit={handleSubmit}>
        {/* 아이디 */}
        <div className="relative mb-3">
          <input
            type="text"
            placeholder="사용자 아이디"
            required
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-800 transition-all focus:outline-none focus:ring-2 focus:ring-[#1e6b73]/30 focus:border-[#1e6b73] focus:bg-white"
          />
          <User size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        </div>

        {/* 비밀번호 */}
        <div className="relative mb-3">
          <input
            type="password"
            placeholder="비밀번호"
            required
            autoComplete={isSignup ? 'new-password' : 'current-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-800 transition-all focus:outline-none focus:ring-2 focus:ring-[#1e6b73]/30 focus:border-[#1e6b73] focus:bg-white"
          />
          <Lock size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        </div>

        {/* 회원가입 전용: 비밀번호 확인 + 보안코드 */}
        {isSignup && (
          <>
            <div className="relative mb-3">
              <input
                type="password"
                placeholder="비밀번호 확인"
                required
                autoComplete="new-password"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-800 transition-all focus:outline-none focus:ring-2 focus:ring-[#1e6b73]/30 focus:border-[#1e6b73] focus:bg-white"
              />
              <Lock size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>

            {/* 보안코드 */}
            <div className="flex gap-2 mb-3">
              <div
                className="shrink-0 flex items-center gap-1.5 px-3 rounded-lg bg-gray-100 border border-gray-200 select-none"
                aria-label="보안코드"
              >
                <span
                  className="font-mono text-lg font-bold tracking-[0.35em] text-[#1e6b73]"
                  style={{ fontStyle: 'italic', letterSpacing: '0.3em' }}
                >
                  {captcha}
                </span>
                <button
                  type="button"
                  onClick={refreshCaptcha}
                  className="p-1 text-gray-400 hover:text-[#1e6b73] transition-colors"
                  title="새 보안코드"
                >
                  <RefreshCw size={15} />
                </button>
              </div>
              <input
                type="text"
                placeholder="보안코드 입력"
                required
                maxLength={4}
                value={captchaInput}
                onChange={(e) => setCaptchaInput(e.target.value)}
                className="flex-1 min-w-0 px-3 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-800 uppercase tracking-widest transition-all focus:outline-none focus:ring-2 focus:ring-[#1e6b73]/30 focus:border-[#1e6b73] focus:bg-white"
              />
            </div>
          </>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 bg-[#1e6b73] text-white rounded-lg font-bold text-base cursor-pointer transition-colors hover:bg-[#164f56] shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? '처리중...' : isSignup ? '회원가입' : '로그인'}
        </button>

        {/* 모드 전환 */}
        <p className="text-center text-sm text-gray-500 mt-4">
          {isSignup ? '이미 계정이 있으신가요? ' : '계정이 없으신가요? '}
          <button
            type="button"
            onClick={() => setMode(isSignup ? 'login' : 'signup')}
            className="text-[#1e6b73] font-semibold hover:underline"
          >
            {isSignup ? '로그인' : '회원가입'}
          </button>
        </p>
      </form>
    </div>
  );
}
