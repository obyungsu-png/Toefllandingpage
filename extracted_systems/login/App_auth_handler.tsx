/**
 * ── App.tsx 내 로그인 상태 관리 + Supabase Auth 리스너 ──
 * 
 * 원본 파일: src/App.tsx
 * 
 * 이 코드는 React 컴포넌트 내에서 로그인 상태를 관리하고
 * Supabase Auth의 onAuthStateChange를 구독하는 부분입니다.
 */

import { useEffect } from 'react';
import { supabase } from '../utils/supabase/client';

// App.tsx 내부에서 사용하는 state
const [isLoggedIn, setIsLoggedIn] = useState(false);
const [loggedInUserName, setLoggedInUserName] = useState('');
const [showLoginForm, setShowLoginForm] = useState(false);

// ── Supabase Auth State Listener (OAuth 로그인 감지) ──
useEffect(() => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' && session?.user) {
      const email = session.user.email || '';
      const name = session.user.user_metadata?.full_name || email.split('@')[0];
      setIsLoggedIn(true);
      setLoggedInUserName(name);
      setShowLoginForm(false);
      try {
        localStorage.setItem('amx_isLoggedIn', 'true');
        localStorage.setItem('amx_userName', name);
      } catch {}
      invalidateAccessCache(); // 로그인 주체 변경 시 접근 캐시 초기화
      prewarmAccess();         // 새 세션 기준으로 미리 검사
    }
    if (event === 'SIGNED_OUT') {
      setIsLoggedIn(false);
      setLoggedInUserName('');
      try {
        localStorage.removeItem('amx_isLoggedIn');
        localStorage.removeItem('amx_userName');
      } catch {}
      invalidateAccessCache();
    }
  });
  return () => subscription.unsubscribe();
}, []);

// 로그인 상태면 접근 검사 미리 예열
useEffect(() => {
  if (isLoggedIn) prewarmAccess();
}, [isLoggedIn]);

// ── LoginForm 모달 렌더링 (App.tsx JSX) ──
// showLoginForm이 true일 때:
<div className="fixed inset-0 z-[70] flex items-center justify-center p-4 overflow-y-auto"
     style={{ backgroundColor: 'rgba(10, 15, 20, 0.72)' }}>
  <div className="my-8">
    <LoginForm
      key={loginFormKey}
      onClose={() => setShowLoginForm(false)}
      onLoginSuccess={(username) => {
        setIsLoggedIn(true);
        setLoggedInUserName(username);
        setShowLoginForm(false);
        try {
          localStorage.setItem('amx_isLoggedIn', 'true');
          localStorage.setItem('amx_userName', username);
        } catch {}
      }}
    />
  </div>
</div>