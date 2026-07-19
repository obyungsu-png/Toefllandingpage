// 사용자 아이디 ↔ Supabase Auth 이메일 매핑
// Supabase Auth는 이메일/전화번호를 식별자로 요구하므로,
// 순수 "아이디"를 안정적인 합성 이메일로 변환해 사용한다.
// 이렇게 하면 세션 UUID(session.user.id)가 유지되어 수강권/권한 시스템을 건드릴 필요가 없다.

// 서버(supabase/functions/.../index.ts)에도 동일한 상수/규칙이 존재해야 한다.
export const MEMBER_EMAIL_DOMAIN = 'members.allmyexam.com';

// 허용 아이디: 영문/숫자/밑줄 3~20자
export const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;

export function usernameToEmail(username: string): string {
  return `${String(username).trim().toLowerCase()}@${MEMBER_EMAIL_DOMAIN}`;
}

export function isValidUsername(username: string): boolean {
  return USERNAME_REGEX.test(String(username).trim());
}
