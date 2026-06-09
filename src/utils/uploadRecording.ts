/**
 * uploadRecording — Supabase recordings 버킷에 녹음 파일 저장
 * path: recordings/{userId or 'anon'}/{testType}-{testNumber}/q{N}-{timestamp}.webm
 * Returns the public URL or null on failure.
 */
import { supabase } from './supabase/client';

export async function uploadRecording(
  blob: Blob,
  questionNumber: number | string,
  testType = 'tpo',
  testNumber: number | string = 0,
): Promise<string | null> {
  try {
    const ext  = blob.type.includes('mp4') ? 'mp4' : 'webm';
    const ts   = Date.now();
    const path = `recordings/${testType}-${testNumber}/q${questionNumber}-${ts}.${ext}`;

    console.log(`[uploadRecording] 📤 업로드 시작 — Q${questionNumber}, 크기: ${(blob.size/1024).toFixed(1)}KB, 타입: ${blob.type}`);

    const { error } = await supabase.storage
      .from('recordings')
      .upload(path, blob, { upsert: false, contentType: blob.type });

    if (error) {
      console.error(`[uploadRecording] ❌ 실패: ${error.message}`);
      return null;
    }

    const { data } = supabase.storage.from('recordings').getPublicUrl(path);
    const url = data?.publicUrl ?? null;
    if (url) {
      // Save to sessionStorage so End Session screen can show playback
      try {
        const stored = JSON.parse(sessionStorage.getItem('speakingRecordings') || '{}');
        stored[String(questionNumber)] = url;
        sessionStorage.setItem('speakingRecordings', JSON.stringify(stored));
      } catch {}
    }
    console.log(`[uploadRecording] ✅ 성공: ${url}`);
    return url;
  } catch (e) {
    console.error('[uploadRecording] ❌ 예외:', e);
    return null;
  }
}
