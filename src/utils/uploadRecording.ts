/**
 * uploadRecording — Supabase recordings 버킷에 녹음 파일 저장 + DB 기록
 * - Storage: recordings/{testType}-{testNumber}/q{N}-{timestamp}.webm
 * - DB: speaking_recordings 테이블 (30일 보관 후 자동 만료)
 */
import { supabase } from './supabase/client';

/** Browser-unique session ID (persists in localStorage) */
function getSessionId(): string {
  const key = 'speaking_session_id';
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

export async function uploadRecording(
  blob: Blob,
  questionNumber: number | string,
): Promise<string | null> {
  // Read test context saved by SpeakingSectionWrapper
  const testType   = sessionStorage.getItem('current_test_type')   || 'tpo';
  const testNumber = sessionStorage.getItem('current_test_number') || '0';
  const sessionId  = getSessionId();

  // 미리 blob URL 생성 — 업로드 실패해도 같은 세션 내 리뷰에서 재생 가능
  const blobUrl = URL.createObjectURL(blob);

  try {
    const ext  = blob.type.includes('mp4') ? 'mp4' : 'webm';
    const ts   = Date.now();
    const path = `${testType}-${testNumber}/q${questionNumber}-${ts}.${ext}`;

    console.log(`[uploadRecording] 📤 Q${questionNumber} 업로드 시작 — ${(blob.size/1024).toFixed(1)}KB`);

    // 1. Upload file to Storage
    const { error: storageErr } = await supabase.storage
      .from('recordings')
      .upload(path, blob, { upsert: false, contentType: blob.type });

    if (storageErr) {
      if (storageErr.message?.includes('Bucket not found')) {
        console.error(`[uploadRecording] ❌ 버킷 없음: Supabase Dashboard → Storage에서 'recordings' 버킷을 Public으로 생성하세요.`);
      } else {
        console.error(`[uploadRecording] ❌ Storage 실패: ${storageErr.message}`);
      }
      // 폴백: blob URL이라도 sessionStorage에 저장 (같은 탭 세션 내 리뷰에서 재생 가능)
      cacheToSession(questionNumber, blobUrl);
      return blobUrl;
    }

    const { data } = supabase.storage.from('recordings').getPublicUrl(path);
    const url = data?.publicUrl ?? null;
    if (!url) {
      cacheToSession(questionNumber, blobUrl);
      return blobUrl;
    }

    // 2. Save URL + metadata to DB (30-day retention)
    const { error: dbErr } = await supabase
      .from('speaking_recordings')
      .upsert({
        session_id:      sessionId,
        test_type:       testType,
        test_number:     parseInt(testNumber, 10),
        question_number: Number(questionNumber),
        recording_url:   url,
        expires_at:      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      }, {
        onConflict: 'session_id,test_type,test_number,question_number',
        ignoreDuplicates: false,
      });

    if (dbErr) {
      console.warn(`[uploadRecording] ⚠️ DB 저장 실패 (Storage는 성공): ${dbErr.message}`);
    }

    // 3. Also cache in sessionStorage for immediate review
    cacheToSession(questionNumber, url);

    console.log(`[uploadRecording] ✅ Q${questionNumber} 완료: ${url}`);
    return url;

  } catch (e) {
    console.error('[uploadRecording] ❌ 예외:', e);
    cacheToSession(questionNumber, blobUrl);
    return blobUrl;
  }
}

/** Helper: save recording URL to sessionStorage */
function cacheToSession(questionNumber: number | string, url: string) {
  try {
    const stored = JSON.parse(sessionStorage.getItem('speakingRecordings') || '{}');
    stored[String(questionNumber)] = url;
    sessionStorage.setItem('speakingRecordings', JSON.stringify(stored));
  } catch {}
}

/** Load recordings for a test from DB (falls back to sessionStorage) */
export async function loadRecordings(
  testType: string,
  testNumber: number,
): Promise<Record<string, string>> {
  const sessionId = getSessionId();

  // sessionStorage에서 현재 세션의 녹음을 먼저 가져옴 (가장 최신/완전)
  let sessionRecs: Record<string, string> = {};
  try {
    sessionRecs = JSON.parse(sessionStorage.getItem('speakingRecordings') || '{}');
  } catch {}

  // DB에서도 가져옴 (이전 세션의 30일 보존 녹음)
  let dbRecs: Record<string, string> = {};
  try {
    const { data, error } = await supabase
      .from('speaking_recordings')
      .select('question_number, recording_url')
      .eq('session_id', sessionId)
      .eq('test_type', testType)
      .eq('test_number', testNumber)
      .gt('expires_at', new Date().toISOString())
      .order('question_number');

    if (!error && data && data.length > 0) {
      data.forEach(r => { dbRecs[String(r.question_number)] = r.recording_url; });
      console.log(`[loadRecordings] ✅ DB에서 ${data.length}개 로드`);
    }
  } catch {}

  // 병합: sessionStorage 우선, 없으면 DB 사용
  const merged: Record<string, string> = { ...dbRecs, ...sessionRecs };
  return merged;
}
