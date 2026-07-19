# 로그인 시스템 (Login System)

## 개요
아이디+비밀번호, 이메일 OTP, Google OAuth, WeChat 등 다양한 인증 방식을 지원하는 통합 로그인 시스템입니다.

## 핵심 아키텍처
- **프론트엔드**: React + Supabase Auth SDK
- **백엔드**: Deno + Hono (Supabase Edge Function)
- **저장소**: Deno KV (레거시 유저) + Supabase Auth (세션)
- **아이디→이메일 매핑**: `username@members.allmyexam.com` 합성 이메일

## 파일 구조

| 파일 | 설명 |
|------|------|
| `LoginForm.tsx` | 로그인/회원가입 UI 컴포넌트 (아이디+비밀번호, 이메일 OTP, 소셜 로그인) |
| `authMapping.ts` | `usernameToEmail()` 함수 — 아이디를 Supabase 호환 이메일로 변환 |
| `supabase_client.ts` | Supabase 싱글톤 클라이언트 (persistSession, autoRefreshToken) |
| `apiConfig.ts` | 서버 API 엔드포인트 설정 (SERVER_BASE_URL, getServerHeaders) |
| `server_register_login.ts` | 서버 사이드 회원가입/로그인 엔드포인트 (추출본) |
| `App_auth_handler.tsx` | App.tsx의 로그인 상태 관리 + Supabase Auth 리스너 (추출본) |

## 인증 흐름

### 1. 아이디+비밀번호 로그인
```
사용자 입력 → LoginForm.doLogin()
  → supabase.auth.signInWithPassword({ email: usernameToEmail(username), password })
  → Supabase Auth 검증 → 세션 발급
  → onAuthStateChange → App.tsx 상태 업데이트
```

### 2. 아이디+비밀번호 회원가입
```
사용자 입력 → LoginForm.doSignup()
  → POST /users/register (서버 등록)
  → 서버: KV 저장 + supabase.auth.admin.createUser({ email, password, email_confirm: true })
  → 클라이언트: supabase.auth.signInWithPassword() 자동 로그인
```

### 3. 이메일 OTP 로그인
```
사용자 이메일 입력 → supabase.auth.signInWithOtp({ email })
  → 이메일로 6자리 코드 발송
  → supabase.auth.verifyOtp({ token }) → 세션 발급
```

### 4. Google OAuth
```
사용자 클릭 → supabase.auth.signInWithOAuth({ provider: 'google' })
  → Google 로그인 → 리다이렉트 콜백
  → onAuthStateChange → 세션 감지
```

## 인용 시 주의사항
- Supabase 프로젝트 URL과 anon key는 `src/utils/supabase/info.tsx`에 정의
- 서버 사이드에서는 `SUPABASE_SERVICE_ROLE_KEY` (admin 권한) 환경변수 필요
- `email_confirm: true` 설정으로 이메일 인증 스킵
- 아이디 유효성 검사: 영문/숫자 3~20자 (`USERNAME_REGEX`)
- 비밀번호는 최소 6자

## 의존성
- `@supabase/supabase-js`
- `react`, `lucide-react` (아이콘)
- 서버: `npm:hono`, `npm:@supabase/supabase-js@2`, Deno KV