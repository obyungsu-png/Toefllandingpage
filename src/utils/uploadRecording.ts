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

    const { error } = await supabase.storage
      .from('recordings')
      .upload(path, blob, { upsert: false, contentType: blob.type });

    if (error) {
      console.warn('[uploadRecording] upload error:', error.message);
      return null;
    }

    const { data } = supabase.storage.from('recordings').getPublicUrl(path);
    return data?.publicUrl ?? null;
  } catch (e) {
    console.warn('[uploadRecording] unexpected error:', e);
    return null;
  }
}
