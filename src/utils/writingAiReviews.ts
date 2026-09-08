/**
 * writingAiReviews.ts
 * ----------------------------------------------------------------------------
 * TPO Writing Review — AI 첨삭 결과를 회원 유료 기간 동안 Supabase에 보관.
 *
 * localStorage(디바이스 로컬)와 병행하여 서버에도 저장하기 때문에,
 *  - 브라우저 캐시를 지우거나
 *  - 다른 기기·다른 브라우저에서 로그인해도
 * 유효한 수강 기간(users_profile.expire_date) 안이라면 이전 첨삭이 그대로 복원된다.
 *
 * 저장 조건: 로그인 + 유효한 수강권(expire_date >= 오늘)
 * 만료 조건: users_profile.expire_date를 기준으로 expires_at에 저장 →
 *            서버측 delete_expired_writing_ai_reviews() 로 자동 정리
 */
import { supabase } from './supabase/client';
import { getUserProfile } from './licenseUtils';

export type WritingType = 'email' | 'discussion';

export interface WritingAiReviewPayload {
  analysis: any;
  semanticHighlights: any[];
  upgradeSuggestions: any[];
  /** 학생 답안 원문 전체 (히스토리에서 재열람·재분석용, 선택적). */
  answerText?: string;
  /** 문제 컨텍스트(문항 지시문/시나리오 등) — 히스토리에서 어떤 문제였는지 표시용, 선택적 */
  questionContext?: {
    writingType?: 'email' | 'discussion';
    emailScenario?: string;
    emailInstruction?: string;
    emailTo?: string;
    questionText?: string;
    passageText?: string;
    testName?: string;
  };
}

/** 현재 로그인 사용자 ID (없으면 null) */
async function getCurrentAuthUserId(): Promise<string | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user?.id ?? null;
  } catch {
    return null;
  }
}

/** users_profile.expire_date → 저장에 사용할 expires_at ISO 문자열 (없으면 null) */
async function getExpiresAtIso(userId: string): Promise<string | null> {
  try {
    const profile = await getUserProfile(userId);
    if (!profile?.expire_date) return null;
    // expire_date는 YYYY-MM-DD — 하루 종일 유효하도록 23:59:59Z로 설정
    const d = new Date(`${profile.expire_date}T23:59:59Z`);
    if (isNaN(d.getTime())) return null;
    if (d.getTime() < Date.now()) return null; // 이미 만료 → 저장 안 함
    return d.toISOString();
  } catch {
    return null;
  }
}

/**
 * 첨삭 결과를 Supabase에 upsert (best-effort — 실패해도 localStorage는 유지)
 * 로그인 안 됨/수강권 없음/네트워크 실패는 조용히 무시.
 */
export async function saveWritingAiReviewCloud(params: {
  writingType: WritingType;
  answerHash: string;
  answerPreview: string;
  payload: WritingAiReviewPayload;
}): Promise<{ ok: boolean; reason?: string }> {
  const userId = await getCurrentAuthUserId();
  if (!userId) return { ok: false, reason: 'not-authenticated' };

  const expiresAt = await getExpiresAtIso(userId);
  if (!expiresAt) return { ok: false, reason: 'no-active-subscription' };

  try {
    const { error } = await supabase
      .from('writing_ai_reviews')
      .upsert(
        {
          user_id: userId,
          writing_type: params.writingType,
          answer_hash: params.answerHash,
          answer_preview: params.answerPreview.slice(0, 240),
          payload: params.payload as any,
          expires_at: expiresAt,
        },
        { onConflict: 'user_id,writing_type,answer_hash' },
      );
    if (error) {
      console.warn('[writingAiReviews] upsert error:', error);
      return { ok: false, reason: error.message };
    }
    return { ok: true };
  } catch (err: any) {
    console.warn('[writingAiReviews] upsert exception:', err);
    return { ok: false, reason: err?.message || 'unknown' };
  }
}

/**
 * 특정 답안의 첨삭을 Supabase에서 로드 (만료 안 된 것만)
 * localStorage에 캐시가 없을 때 hydrate 용도로 호출.
 */
export async function loadWritingAiReviewCloud(params: {
  writingType: WritingType;
  answerHash: string;
}): Promise<WritingAiReviewPayload | null> {
  const userId = await getCurrentAuthUserId();
  if (!userId) return null;

  try {
    const { data, error } = await supabase
      .from('writing_ai_reviews')
      .select('payload, expires_at')
      .eq('user_id', userId)
      .eq('writing_type', params.writingType)
      .eq('answer_hash', params.answerHash)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();
    if (error) {
      console.warn('[writingAiReviews] load error:', error);
      return null;
    }
    if (!data?.payload) return null;
    return data.payload as WritingAiReviewPayload;
  } catch (err) {
    console.warn('[writingAiReviews] load exception:', err);
    return null;
  }
}

/**
 * 로그인 사용자의 최근 첨삭 목록 (History 화면 등에서 사용)
 * 만료 안 된 것만, 최근 업데이트 순.
 */
export async function listRecentWritingAiReviewsCloud(params: {
  writingType?: WritingType;
  limit?: number;
}): Promise<Array<{
  writingType: WritingType;
  answerHash: string;
  answerPreview: string;
  updatedAt: string;
  payload: WritingAiReviewPayload;
}>> {
  const userId = await getCurrentAuthUserId();
  if (!userId) return [];

  try {
    let q = supabase
      .from('writing_ai_reviews')
      .select('writing_type, answer_hash, answer_preview, updated_at, payload')
      .eq('user_id', userId)
      .gt('expires_at', new Date().toISOString())
      .order('updated_at', { ascending: false })
      .limit(params.limit ?? 50);
    if (params.writingType) {
      q = q.eq('writing_type', params.writingType);
    }
    const { data, error } = await q;
    if (error) {
      console.warn('[writingAiReviews] list error:', error);
      return [];
    }
    return (data || []).map((r: any) => ({
      writingType: r.writing_type as WritingType,
      answerHash: r.answer_hash as string,
      answerPreview: (r.answer_preview as string) || '',
      updatedAt: r.updated_at as string,
      payload: r.payload as WritingAiReviewPayload,
    }));
  } catch (err) {
    console.warn('[writingAiReviews] list exception:', err);
    return [];
  }
}
