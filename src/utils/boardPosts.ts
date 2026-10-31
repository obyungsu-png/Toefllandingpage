/**
 * boardPosts.ts — 게시판(Board) 글/답변 CRUD 헬퍼
 * ------------------------------------------------------------
 * board_posts Supabase 테이블.
 * - listPosts(): 공개된 글 목록 (최신순)
 * - listAllPostsAdmin(): 감춤 포함 전체
 * - addPost(): 로그인 사용자 질문 등록
 * - updatePost(): 수정 (제목/본문/카테고리) — 작성자/관리자
 * - setAnswer(): 관리자 답변 저장 (answer_body / answer_link)
 * - deletePost(): 삭제 — 관리자
 */
import { supabase } from './supabase/client';

export interface BoardPost {
  id: string;
  author_user_id: string | null;
  author_name: string;
  category: string | null;
  title: string;
  body: string;
  answer_body: string | null;
  answer_link: string | null;
  answered_at: string | null;
  answered_by: string | null;
  is_visible: boolean;
  view_count: number;
  created_at: string;
  updated_at: string;
}

export async function listPosts(): Promise<BoardPost[]> {
  try {
    const { data, error } = await supabase
      .from('board_posts')
      .select('*')
      .eq('is_visible', true)
      .order('created_at', { ascending: false });
    if (error) { console.warn('[boardPosts] list error:', error); return []; }
    return (data || []) as BoardPost[];
  } catch (err) {
    console.warn('[boardPosts] list exception:', err);
    return [];
  }
}

export async function listAllPostsAdmin(): Promise<BoardPost[]> {
  try {
    const { data, error } = await supabase
      .from('board_posts')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) return [];
    return (data || []) as BoardPost[];
  } catch { return []; }
}

export async function addPost(input: {
  title: string;
  body: string;
  category?: string | null;
  authorName?: string;
}): Promise<{ ok: boolean; reason?: string; id?: string }> {
  try {
    const { data: userRes } = await supabase.auth.getUser();
    const user = userRes?.user || null;
    const payload = {
      author_user_id: user?.id ?? null,
      author_name:    input.authorName?.trim() || user?.email?.split('@')[0] || 'anonymous',
      title:          input.title.trim(),
      body:           input.body.trim(),
      category:       input.category || null,
      is_visible:     true,
    };
    const { data, error } = await supabase
      .from('board_posts')
      .insert(payload)
      .select('id')
      .single();
    if (error) return { ok: false, reason: error.message };
    return { ok: true, id: data?.id };
  } catch (err: any) {
    return { ok: false, reason: err?.message || 'unknown' };
  }
}

export async function updatePost(id: string, patch: Partial<Pick<BoardPost, 'title' | 'body' | 'category' | 'is_visible'>>): Promise<{ ok: boolean; reason?: string }> {
  try {
    const { error } = await supabase.from('board_posts').update(patch).eq('id', id);
    if (error) return { ok: false, reason: error.message };
    return { ok: true };
  } catch (err: any) {
    return { ok: false, reason: err?.message || 'unknown' };
  }
}

export async function setAnswer(id: string, answer: { answer_body: string; answer_link?: string | null }): Promise<{ ok: boolean; reason?: string }> {
  try {
    const { data: userRes } = await supabase.auth.getUser();
    const payload = {
      answer_body: answer.answer_body.trim(),
      answer_link: answer.answer_link?.trim() || null,
      answered_at: new Date().toISOString(),
      answered_by: userRes?.user?.id ?? null,
    };
    const { error } = await supabase.from('board_posts').update(payload).eq('id', id);
    if (error) return { ok: false, reason: error.message };
    return { ok: true };
  } catch (err: any) {
    return { ok: false, reason: err?.message || 'unknown' };
  }
}

export async function clearAnswer(id: string): Promise<{ ok: boolean; reason?: string }> {
  try {
    const { error } = await supabase
      .from('board_posts')
      .update({ answer_body: null, answer_link: null, answered_at: null, answered_by: null })
      .eq('id', id);
    if (error) return { ok: false, reason: error.message };
    return { ok: true };
  } catch (err: any) {
    return { ok: false, reason: err?.message || 'unknown' };
  }
}

export async function deletePost(id: string): Promise<{ ok: boolean; reason?: string }> {
  try {
    const { error } = await supabase.from('board_posts').delete().eq('id', id);
    if (error) return { ok: false, reason: error.message };
    return { ok: true };
  } catch (err: any) {
    return { ok: false, reason: err?.message || 'unknown' };
  }
}
