/**
 * ── 서버 사이드 회원가입/로그인 엔드포인트 (Supabase Edge Function) ──
 * 
 * 원본 파일: supabase/functions/make-server-e46cd33a/index.ts
 * 
 * 이 파일은 Deno + Hono 프레임워크 기반으로 Supabase Edge Function에서 실행됩니다.
 * 다른 프로젝트에 인용 시 아래 로직을 참고하세요.
 */

// ============================================================
// 1. 인프라 설정
// ============================================================
import { Hono } from "npm:hono";
import * as kv from "./kv_store.ts"; // Deno KV 스토어
import { createClient } from "npm:@supabase/supabase-js@2";

const app = new Hono();
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

// ============================================================
// 2. 사용자 등록 (POST /users/register)
// ============================================================
// 아이디+비밀번호 방식과 이메일+인증번호 방식 모두 지원
app.post('/users/register', async (c) => {
  try {
    const { email, username, password, verifyCode } = await c.req.json();

    // 이메일이 없으면 username으로부터 합성 이메일 생성
    let emailLower: string;
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return c.json({ error: 'Invalid email format' }, 400);
      }
      emailLower = email.toLowerCase();
    } else if (username) {
      emailLower = `${username.trim().toLowerCase()}@members.allmyexam.com`;
    } else {
      return c.json({ error: 'Email or username is required' }, 400);
    }

    // ── 이메일 인증번호 등록 ──
    if (verifyCode) {
      const stored = await kv.get(`email_code:${emailLower}`);
      if (!stored || Date.now() > stored.expiresAt)
        return c.json({ error: '인증번호가 만료되었거나 유효하지 않습니다.' }, 400);
      if (String(stored.code) !== String(verifyCode).trim())
        return c.json({ error: '인증번호가 올바르지 않아요.' }, 401);
      await kv.del(`email_code:${emailLower}`);

      let user = await kv.get(`user:email:${emailLower}`);
      if (!user) {
        const derivedUsername = emailLower.split('@')[0];
        user = {
          id: `user_${Date.now()}`,
          email: emailLower,
          username: derivedUsername,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await kv.set(`user:email:${emailLower}`, user);
        await kv.set(`user:id:${user.id}`, user);
      }
      return c.json({ success: true, user: { id: user.id, email: user.email, username: user.username } });
    }

    // ── 아이디/비밀번호 등록 (Legacy) ──
    if (!username || !password) {
      return c.json({ error: 'All fields are required' }, 400);
    }

    // 중복 확인
    const existingUser = await kv.get(`user:email:${emailLower}`);
    if (existingUser) return c.json({ error: 'Email already registered' }, 400);
    const existingUsername = await kv.get(`user:username:${username}`);
    if (existingUsername) return c.json({ error: 'Username already taken' }, 400);

    const user = {
      id: `user_${Date.now()}`,
      email: emailLower,
      username,
      password, // 실제 운영에서는 bcrypt 등으로 해시 필요
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // KV 저장
    await kv.set(`user:email:${emailLower}`, user);
    await kv.set(`user:username:${username}`, user);
    await kv.set(`user:id:${user.id}`, user);

    // ⭐ Supabase Auth 유저 생성 (가입 후 자동 로그인 지원)
    try {
      const { error: createErr } = await supabase.auth.admin.createUser({
        email: emailLower,
        password,
        email_confirm: true, // 이메일 인증 스킵
      });
      if (createErr && /already|registered|exists/i.test(createErr.message)) {
        // 이미 존재하면 password만 업데이트
        const { data: linkData } = await supabase.auth.admin.generateLink({
          type: 'magiclink', email: emailLower,
        });
        const existingId = linkData?.user?.id;
        if (existingId) {
          await supabase.auth.admin.updateUserById(existingId, {
            password, email_confirm: true,
          });
        }
      }
    } catch (err) {
      console.error('Supabase Auth user creation failed:', err);
    }

    return c.json({ success: true, user: { id: user.id, email: user.email, username: user.username } });
  } catch (error) {
    return c.json({ error: 'Registration failed' }, 500);
  }
});

// ============================================================
// 3. 사용자 로그인 (POST /users/login)
// ============================================================
app.post('/users/login', async (c) => {
  try {
    const body = await c.req.json();
    const { username, email, password, verifyCode, loginMethod } = body;

    // ── 이메일 인증번호 로그인 ──
    if (loginMethod === 'email' && email && verifyCode) {
      const emailLower = String(email).toLowerCase();
      const stored = await kv.get(`email_code:${emailLower}`);
      if (!stored || Date.now() > stored.expiresAt)
        return c.json({ error: '인증번호가 만료되었거나 유효하지 않습니다.' }, 400);
      if (String(stored.code) !== String(verifyCode).trim())
        return c.json({ error: '인증번호가 올바르지 않아요.' }, 401);
      await kv.del(`email_code:${emailLower}`);

      let user = await kv.get(`user:email:${emailLower}`);
      if (!user) {
        const derivedUsername = emailLower.split('@')[0];
        user = {
          id: `user_${Date.now()}`,
          email: emailLower,
          username: derivedUsername,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await kv.set(`user:email:${emailLower}`, user);
        await kv.set(`user:id:${user.id}`, user);
      }
      return c.json({ success: true, user: { id: user.id, email: user.email, username: user.username } });
    }

    // ── 아이디/비밀번호 로그인 (Legacy) ──
    if (!password || (!username && !email)) {
      return c.json({ error: 'Invalid credentials' }, 400);
    }

    let user;
    if (loginMethod === 'email' && email) {
      user = await kv.get(`user:email:${String(email).toLowerCase()}`);
    } else if (username) {
      user = await kv.get(`user:username:${username}`);
    }

    if (!user) return c.json({ error: 'User not found' }, 404);
    if (user.password !== password) return c.json({ error: 'Incorrect password' }, 401);

    return c.json({ success: true, user: { id: user.id, username: user.username } });
  } catch (error) {
    return c.json({ error: 'Login failed' }, 500);
  }
});