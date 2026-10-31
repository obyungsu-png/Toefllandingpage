/**
 * questionVideos.ts — 문제별 영상 강의 CRUD + 클릭 로깅
 * ---------------------------------------------------------------
 * question_videos Supabase 테이블.
 * - getVideoByKey(key)        : 그 문제에 영상이 있으면 반환 (학생 리뷰 화면용)
 * - getVideosByKeys(keys)     : 여러 문제 한꺼번에 (문제 리스트 🎥 뱃지용)
 * - listVideos()              : 공개된 전체 목록 (관리자/학생용 — visible 만)
 * - listAllVideosAdmin()      : 감춤 포함 전체 (관리자용)
 * - upsertVideo(input)        : 같은 question_key 가 있으면 update, 없으면 insert
 * - deleteVideo(id)           : 삭제
 * - logVideoClick(key, prov)  : 재생 클릭 집계 (비로그인도 가능)
 */
import { supabase } from './supabase/client';
import { buildQuestionKey, type QuestionRef } from './questionKey';

export interface QuestionVideo {
  id:            string;
  question_key:  string;
  title:         string | null;
  youtube_url:   string | null;
  bilibili_url:  string | null;
  start_sec:     number;
  note:          string | null;
  is_visible:    boolean;
  created_at:    string;
  updated_at:    string;
  created_by:    string | null;
}

export interface VideoUpsertInput {
  /** 둘 중 하나 — 완성된 key 또는 분해된 ref */
  key?:  string;
  ref?:  QuestionRef;
  title?:        string | null;
  youtube_url?:  string | null;
  bilibili_url?: string | null;
  start_sec?:    number;
  note?:         string | null;
  is_visible?:   boolean;
}

function resolveKey(input: VideoUpsertInput): string | null {
  if (input.key) return input.key;
  if (input.ref) return buildQuestionKey(input.ref);
  return null;
}

export async function getVideoByKey(questionKey: string): Promise<QuestionVideo | null> {
  try {
    const { data, error } = await supabase
      .from('question_videos')
      .select('*')
      .eq('question_key', questionKey)
      .eq('is_visible', true)
      .maybeSingle();
    if (error) {
      console.warn('[questionVideos] getByKey error:', error);
      return null;
    }
    return (data || null) as QuestionVideo | null;
  } catch (err) {
    console.warn('[questionVideos] getByKey exception:', err);
    return null;
  }
}

export async function getVideosByKeys(questionKeys: string[]): Promise<QuestionVideo[]> {
  if (!questionKeys || questionKeys.length === 0) return [];
  try {
    const { data, error } = await supabase
      .from('question_videos')
      .select('*')
      .in('question_key', questionKeys)
      .eq('is_visible', true);
    if (error) return [];
    return (data || []) as QuestionVideo[];
  } catch { return []; }
}

export async function listVideos(): Promise<QuestionVideo[]> {
  try {
    const { data, error } = await supabase
      .from('question_videos')
      .select('*')
      .eq('is_visible', true)
      .order('updated_at', { ascending: false });
    if (error) return [];
    return (data || []) as QuestionVideo[];
  } catch { return []; }
}

export async function listAllVideosAdmin(): Promise<QuestionVideo[]> {
  try {
    const { data, error } = await supabase
      .from('question_videos')
      .select('*')
      .order('updated_at', { ascending: false });
    if (error) return [];
    return (data || []) as QuestionVideo[];
  } catch { return []; }
}

/**
 * 같은 question_key 가 있으면 update, 없으면 insert.
 * youtube_url / bilibili_url 중 최소 하나는 필수.
 */
export async function upsertVideo(input: VideoUpsertInput): Promise<{ ok: boolean; reason?: string; id?: string }> {
  const question_key = resolveKey(input);
  if (!question_key) return { ok: false, reason: 'question_key / ref 둘 중 하나는 필요합니다.' };

  const youtube  = input.youtube_url?.trim()  || null;
  const bilibili = input.bilibili_url?.trim() || null;
  if (!youtube && !bilibili) {
    return { ok: false, reason: 'YouTube URL 또는 Bilibili URL 중 하나는 반드시 입력해야 합니다.' };
  }

  try {
    const { data: userRes } = await supabase.auth.getUser();
    const payload = {
      question_key,
      title:        input.title?.trim() || null,
      youtube_url:  youtube,
      bilibili_url: bilibili,
      start_sec:    Number.isFinite(input.start_sec) ? Math.max(0, Math.floor(input.start_sec as number)) : 0,
      note:         input.note?.trim() || null,
      is_visible:   input.is_visible ?? true,
      created_by:   userRes?.user?.id ?? null,
    };
    // onConflict:question_key — unique 제약과 함께 upsert 처리
    const { data, error } = await supabase
      .from('question_videos')
      .upsert(payload, { onConflict: 'question_key' })
      .select('id')
      .single();
    if (error) return { ok: false, reason: error.message };
    return { ok: true, id: data?.id };
  } catch (err: any) {
    return { ok: false, reason: err?.message || 'unknown' };
  }
}

export async function deleteVideo(id: string): Promise<{ ok: boolean; reason?: string }> {
  try {
    const { error } = await supabase.from('question_videos').delete().eq('id', id);
    if (error) return { ok: false, reason: error.message };
    return { ok: true };
  } catch (err: any) {
    return { ok: false, reason: err?.message || 'unknown' };
  }
}

/**
 * 재생 버튼 클릭 집계. 실패해도 사용자 흐름엔 영향 주지 않도록 조용히 처리.
 */
export async function logVideoClick(questionKey: string, provider: 'youtube' | 'bilibili'): Promise<void> {
  try {
    const { data: userRes } = await supabase.auth.getUser();
    await supabase.from('question_video_clicks').insert({
      question_key: questionKey,
      user_id:      userRes?.user?.id ?? null,
      provider,
    });
  } catch {
    // 분석 로그 실패는 조용히 무시
  }
}
