import { supabase } from './supabase/client';

export interface Highlight {
  id?: string;
  test_id: string;
  passage_key: string;
  start_offset: number;
  end_offset: number;
  type: 'h' | 'u'; // 'h'=highlight, 'u'=underline
  expires_at: string;
}

/**
 * 수강권 만료일 가져오기
 */
function getSubscriptionExpiryDate(): Date | null {
  try {
    const subscriptions = JSON.parse(localStorage.getItem('toefl_subscriptions') || '[]');
    const currentUser = JSON.parse(localStorage.getItem('toefl_current_user') || '{}');
    if (!currentUser.email) return null;
    const userSubscription = subscriptions.find((sub: any) =>
      sub.email === currentUser.email && sub.status === 'Active'
    );
    if (!userSubscription) return null;
    return new Date(userSubscription.expiryDate);
  } catch {
    return null;
  }
}

/**
 * 현재 사용자 ID 가져오기
 */
function getCurrentUserId(): string | null {
  try {
    const currentUser = JSON.parse(localStorage.getItem('toefl_current_user') || '{}');
    return currentUser.id || null;
  } catch {
    return null;
  }
}

/**
 * 하이라이트를 Supabase에 저장
 */
export async function saveHighlight(highlight: Omit<Highlight, 'id' | 'expires_at'>): Promise<string | null> {
  const userId = getCurrentUserId();
  if (!userId) return null;

  const expiryDate = getSubscriptionExpiryDate();
  if (!expiryDate) return null; // 수강권 없으면 저장 안 함

  try {
    const { data, error } = await supabase
      .from('reading_highlights')
      .insert({
        user_id: userId,
        test_id: highlight.test_id,
        passage_key: highlight.passage_key,
        start_offset: highlight.start_offset,
        end_offset: highlight.end_offset,
        type: highlight.type,
        expires_at: expiryDate.toISOString(),
      })
      .select('id')
      .single();

    if (error) {
      console.warn('[readingHighlights] Save error:', error);
      return null;
    }
    return data?.id || null;
  } catch (err) {
    console.warn('[readingHighlights] Save error:', err);
    return null;
  }
}

/**
 * 특정 지문의 하이라이트 로드 (만료된 것 제외)
 */
export async function loadHighlights(testId: string, passageKey: string): Promise<Highlight[]> {
  const userId = getCurrentUserId();
  if (!userId) return [];

  try {
    const { data, error } = await supabase
      .from('reading_highlights')
      .select('id, test_id, passage_key, start_offset, end_offset, type, expires_at')
      .eq('user_id', userId)
      .eq('test_id', testId)
      .eq('passage_key', passageKey)
      .gt('expires_at', new Date().toISOString()); // 만료되지 않은 것만

    if (error) {
      console.warn('[readingHighlights] Load error:', error);
      return [];
    }
    return (data || []) as Highlight[];
  } catch (err) {
    console.warn('[readingHighlights] Load error:', err);
    return [];
  }
}

/**
 * 하이라이트 삭제
 */
export async function deleteHighlight(id: string): Promise<boolean> {
  const userId = getCurrentUserId();
  if (!userId) return false;

  try {
    const { error } = await supabase
      .from('reading_highlights')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    return !error;
  } catch (err) {
    console.warn('[readingHighlights] Delete error:', err);
    return false;
  }
}

/**
 * 특정 지문의 모든 하이라이트 삭제
 */
export async function deleteAllHighlights(testId: string, passageKey: string): Promise<boolean> {
  const userId = getCurrentUserId();
  if (!userId) return false;

  try {
    const { error } = await supabase
      .from('reading_highlights')
      .delete()
      .eq('user_id', userId)
      .eq('test_id', testId)
      .eq('passage_key', passageKey);

    return !error;
  } catch (err) {
    console.warn('[readingHighlights] Delete all error:', err);
    return false;
  }
}
