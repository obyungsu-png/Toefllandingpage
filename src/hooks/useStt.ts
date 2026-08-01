/**
 * useStt.ts — Speech-to-Text 클라이언트 훅
 * -----------------------------------------------------------------------------
 * 2026 개편 TOEFL Speaking 채점 파이프라인 1단계.
 *
 * 전략 (무료/기존 API 우선):
 *   1) Whisper 프록시(/api/stt/transcriptions) 우선 시도 — apiclaude.cc OpenAI 호환
 *   2) 실패 시 브라우저 내장 Web Speech API (SpeechRecognition) 폴백
 *
 * 응답 형식 정규화:
 *   { text, duration?, words?(timestamp 배열), source: 'whisper' | 'webspeech' }
 */
import { useState, useCallback, useRef } from 'react';

export interface SttWord {
  word: string;
  start: number; // 초
  end: number;   // 초
}

export interface SttResult {
  /** 인식된 전체 텍스트 */
  text: string;
  /** 오디오 길이(초) — Whisper verbose_json 에서 제공 */
  duration?: number;
  /** 단어별 타임스탬프 — WPM/무음 구간 계산용 */
  words?: SttWord[];
  /** 사용된 STT 소스 */
  source: 'whisper' | 'webspeech';
  /** 경고 메시지(폴백 발생 등) */
  warning?: string;
}

export interface SttState {
  /** STT 진행 중 여부 */
  isLoading: boolean;
  /** 마지막 결과 */
  result: SttResult | null;
  /** 에러 메시지 */
  error: string | null;
}

// Electron 환경 판별 (WritingReviewAiTutor 와 동일)
const isElectron =
  typeof window !== 'undefined' && (window as any).electronAPI?.isElectron === true;

// 프로덕션 Vercel 앱 절대 URL (Electron 용)
const STT_PROXY_ENDPOINT = isElectron
  ? (import.meta.env.VITE_CLAUDE_PROXY_URL as string | undefined)?.replace(
      '/api/claude/chat/completions',
      '/api/stt/transcriptions',
    ) || 'https://toefl-allmyexam.vercel.app/api/stt/transcriptions'
  : '/api/stt/transcriptions';

/**
 * 1차: Whisper 프록시로 오디오 Blob 전송
 * multipart/form-data — file 필드에 Blob, verbose_json 으로 words/duration 요청.
 */
async function transcribeWithWhisper(blob: Blob): Promise<SttResult> {
  const formData = new FormData();

  // 파일 확장자 결정 — webm/mp4
  const ext = blob.type.includes('mp4') ? 'm4a'
    : blob.type.includes('webm') ? 'webm'
    : blob.type.includes('wav') ? 'wav'
    : 'webm';
  const filename = `recording.${ext}`;
  formData.append('file', blob, filename);
  formData.append('model', 'whisper-1');
  formData.append('language', 'en');
  formData.append('response_format', 'verbose_json');

  const response = await fetch(STT_PROXY_ENDPOINT, {
    method: 'POST',
    body: formData,
    // Content-Type 을 직접 설정하지 않음 — FormData 가 boundary 자동 생성
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`Whisper STT 오류 (${response.status}): ${errText.slice(0, 150)}`);
  }

  const data = await response.json();

  // words 배열이 있으면 타임스탬프 추출 (WPM 계산용)
  const words: SttWord[] | undefined = Array.isArray(data.words)
    ? data.words.map((w: any) => ({
        word: String(w.word || w.text || ''),
        start: Number(w.start ?? 0),
        end: Number(w.end ?? 0),
      })).filter((w: SttWord) => w.word)
    : undefined;

  return {
    text: String(data.text || '').trim(),
    duration: typeof data.duration === 'number' ? data.duration : undefined,
    words,
    source: 'whisper',
  };
}

// ── Web Speech API 폴백 (브라우저 내장 SpeechRecognition) ──
// Whisper 가 지원되지 않거나 네트워크 실패 시 즉시 대체.
function transcribeWithWebSpeech(blob: Blob): Promise<SttResult> {
  return new Promise((resolve, reject) => {
    // Web Speech API 는 실시간 인식만 지원 — Blob 재생이 아닌,
    // 마이크 입력을 바로 인식하는 방식. 여기서는 Blob 기반 즉시 폴백이 어려우므로
    // SpeechRecognition 으로 재녹음 유도 대신, 한계 안내와 함께 빈 결과 반환.
    // 실제 사용처에서는 useStt 훅이 녹음 중에 Web Speech 를 동시 실행하는 방식 권장.
    const SpeechRecognitionClass =
      (typeof window !== 'undefined' &&
        ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)) ||
      null;

    if (!SpeechRecognitionClass) {
      reject(new Error('Web Speech API 를 지원하지 않는 브라우저입니다.'));
      return;
    }

    // Blob 재생 → 마이크 라우팅은 불가하므로, 폴백 시 안내만 반환.
    // (학생은 Whisper 프록시 설정을 확인해야 함)
    resolve({
      text: '',
      source: 'webspeech',
      warning:
        'Whisper 프록시 실패. Web Speech API 는 Blob 기반 폴백을 지원하지 않아 빈 결과를 반환합니다. CLAUDE_API_KEY 또는 네트워크를 확인하세요.',
    });
  });
}

/**
 * STT 훅 — 오디오 Blob 을 텍스트로 변환.
 * @returns { transcribe, isLoading, result, error, reset }
 */
export function useStt() {
  const [state, setState] = useState<SttState>({
    isLoading: false,
    result: null,
    error: null,
  });
  const abortRef = useRef(false);

  const transcribe = useCallback(async (blob: Blob): Promise<SttResult | null> => {
    if (!blob || blob.size === 0) {
      setState({ isLoading: false, result: null, error: '빈 오디오입니다.' });
      return null;
    }
    abortRef.current = false;
    setState({ isLoading: true, result: null, error: null });

    // 1차: Whisper 프록시
    try {
      const whisperResult = await transcribeWithWhisper(blob);
      if (abortRef.current) return null;
      // 텍스트가 비어도 경고로 기록 — WER 은 0점 처리
      const warning = whisperResult.text ? undefined
        : 'Whisper 가 음성을 인식하지 못했습니다. (무음/잡음일 수 있음)';
      const finalResult: SttResult = { ...whisperResult, warning };
      setState({ isLoading: false, result: finalResult, error: null });
      return finalResult;
    } catch (whisperErr: any) {
      console.warn('[useStt] Whisper 실패, Web Speech 폴백 시도:', whisperErr?.message);
      // 2차: Web Speech API 폴백
      try {
        const fallback = await transcribeWithWebSpeech(blob);
        if (abortRef.current) return null;
        setState({ isLoading: false, result: fallback, error: null });
        return fallback;
      } catch (fbErr: any) {
        const msg = `STT 실패: Whisper(${whisperErr?.message || '오류'}) / WebSpeech(${fbErr?.message || '오류'})`;
        setState({ isLoading: false, result: null, error: msg });
        return null;
      }
    }
  }, []);

  const reset = useCallback(() => {
    abortRef.current = true;
    setState({ isLoading: false, result: null, error: null });
  }, []);

  return {
    transcribe,
    isLoading: state.isLoading,
    result: state.result,
    error: state.error,
    reset,
  };
}

/**
 * 오디오 URL → Blob 변환 (fetch + blob)
 * Supabase Storage / blob URL 모두 대응.
 */
export async function fetchAudioBlob(url: string): Promise<Blob | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.blob();
  } catch {
    return null;
  }
}

/**
 * 단어 배열로부터 WPM(분당 말하기 단어 수) 계산
 */
export function calculateWpm(words: SttWord[], durationSec?: number): number {
  if (!words || words.length === 0) return 0;
  const dur = durationSec ?? (words[words.length - 1]?.end ?? 0);
  if (dur <= 0) return 0;
  return Math.round((words.length / dur) * 60);
}

/**
 * 단어 배열로부터 무음 구간(pause) 총합(초) 계산
 * — 인접 단어 사이 0.3초 이상 간격을 pause 로 간주.
 */
export function calculateTotalPause(words: SttWord[]): number {
  if (!words || words.length < 2) return 0;
  let total = 0;
  for (let i = 1; i < words.length; i++) {
    const gap = (words[i].start ?? 0) - (words[i - 1].end ?? 0);
    if (gap > 0.3) total += gap;
  }
  return Math.round(total * 100) / 100;
}
