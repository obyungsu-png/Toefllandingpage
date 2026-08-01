/**
 * useStt.ts — Speech-to-Text 클라이언트 훅
 * -----------------------------------------------------------------------------
 * 2026 개편 TOEFL Speaking 채점 파이프라인 1단계.
 *
 * 폴백 체인 (사용자 제공 비교표 기반 우선순위):
 *   1) Deepgram Nova-3 (클라우드, 200~300ms, 단어 단위 타임스탬프) — 1순위
 *      → /api/stt/deepgram 프록시 (DEEPGRAM_API_KEY)
 *   2) 로컬 Whisper (오프라인, 무료, large-v3/base) — 2순위 폴백
 *      → http://localhost:8787/transcribe (scripts/local-whisper-server.cjs)
 *   3) Web Speech API (브라우저 내장) — 최후 폴백 (Blob 기반 한계)
 *
 * 응답 형식 정규화:
 *   { text, duration?, words?(timestamp 배열), source: 'deepgram' | 'local-whisper' | 'webspeech' }
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
  /** 오디오 길이(초) — Deepgram/Whisper 에서 제공 */
  duration?: number;
  /** 단어별 타임스탬프 — WPM/무음 구간 계산용 */
  words?: SttWord[];
  /** 사용된 STT 소스 */
  source: 'deepgram' | 'local-whisper' | 'webspeech';
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

// Deepgram 프록시 엔드포인트
const DEEPGRAM_PROXY_ENDPOINT = isElectron
  ? (import.meta.env.VITE_CLAUDE_PROXY_URL as string | undefined)?.replace(
      '/api/claude/chat/completions',
      '/api/stt/deepgram',
    ) || 'https://toefl-allmyexam.vercel.app/api/stt/deepgram'
  : '/api/stt/deepgram';

// 로컬 Whisper dev 서버 엔드포인트 (scripts/local-whisper-server.cjs)
const LOCAL_WHISPER_ENDPOINT =
  (import.meta.env.VITE_LOCAL_WHISPER_URL as string | undefined) ||
  'http://localhost:8787/transcribe';

/**
 * 오디오 Blob 의 MIME 타입에서 파일 확장자 결정
 */
function audioBlobToExt(blob: Blob): string {
  const t = blob.type.toLowerCase();
  if (t.includes('mp4') || t.includes('m4a')) return 'm4a';
  if (t.includes('webm')) return 'webm';
  if (t.includes('wav')) return 'wav';
  if (t.includes('mpeg') || t.includes('mp3')) return 'mp3';
  if (t.includes('ogg')) return 'ogg';
  return 'webm';
}

// ── 브라우저 WAV 인코딩 헬퍼 ──────────────────────────────────────────────
// 로컬 Whisper 서버(scripts/local-whisper-server.cjs)는 ffmpeg 없이 WAV만
// 디코딩 가능. MediaRecorder 의 webm/mp4 출력을 브라우저에서 WAV(16kHz mono
// 16-bit PCM — Whisper 표준 입력)로 변환하여 ffmpeg 의존성 제거.
function writeStringToDataView(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

function encodeWav(samples: Float32Array, sampleRate: number): ArrayBuffer {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  // RIFF 헤더
  writeStringToDataView(view, 0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  writeStringToDataView(view, 8, 'WAVE');
  // fmt 청크
  writeStringToDataView(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true); // 16-bit
  // data 청크
  writeStringToDataView(view, 36, 'data');
  view.setUint32(40, samples.length * 2, true);
  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset += 2;
  }
  return buffer;
}

/**
 * 오디오 Blob → WAV Blob 변환 (브라우저 Web Audio API)
 * decodeAudioData 로 디코딩 → OfflineAudioContext 로 16kHz mono 리샘플 → WAV 인코딩.
 * 로컬 Whisper 서버 전용 (Deepgram 은 webm/mp4 를 그대로 전송).
 */
async function audioBlobToWavBlob(blob: Blob): Promise<Blob> {
  const arrayBuffer = await blob.arrayBuffer();
  const AudioContextClass =
    (window as any).AudioContext || (window as any).webkitAudioContext;
  if (!AudioContextClass) {
    throw new Error('AudioContext 미지원 — WAV 변환 불가');
  }
  const audioContext = new AudioContextClass();
  try {
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer.slice(0));
    const targetSampleRate = 16000;
    const numChannels = 1;
    const offlineCtx = new OfflineAudioContext(
      numChannels,
      Math.ceil(audioBuffer.duration * targetSampleRate),
      targetSampleRate,
    );
    const source = offlineCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(offlineCtx.destination);
    source.start();
    const rendered = await offlineCtx.startRendering();
    const wavBuffer = encodeWav(rendered.getChannelData(0), targetSampleRate);
    return new Blob([wavBuffer], { type: 'audio/wav' });
  } finally {
    audioContext.close();
  }
}

/**
 * 1순위: Deepgram Nova-3 프록시로 오디오 전송
 * raw 오디오 바이너리 (multipart 아님) — Content-Type 으로 포맷 명시.
 * 단어 단위 타임스탬프 자동 제공 → WPM/무음 구간 정밀 측정.
 */
async function transcribeWithDeepgram(blob: Blob): Promise<SttResult> {
  const ext = audioBlobToExt(blob);
  // Deepgram 이 이해하는 audio Content-Type
  const contentType =
    ext === 'm4a' ? 'audio/mp4'
    : ext === 'webm' ? 'audio/webm'
    : ext === 'wav' ? 'audio/wav'
    : ext === 'mp3' ? 'audio/mpeg'
    : ext === 'ogg' ? 'audio/ogg'
    : 'audio/webm';

  const arrayBuffer = await blob.arrayBuffer();

  const response = await fetch(DEEPGRAM_PROXY_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': contentType,
      'X-Audio-Filename': `recording.${ext}`,
    },
    body: arrayBuffer,
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    let detail = errText;
    try { detail = JSON.parse(errText)?.error || errText; } catch {}
    throw new Error(`Deepgram STT 오류 (${response.status}): ${String(detail).slice(0, 150)}`);
  }

  const data = await response.json();

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
    source: 'deepgram',
  };
}

/**
 * 2순위: 로컬 Whisper dev 서버 (Transformers.js / whisper.cpp)
 * 오프라인 + 무료. DEEPGRAM_API_KEY 미설정 또는 네트워크 실패 시 폴백.
 * 로컬 dev 서버(scripts/local-whisper-server.cjs)가 실행 중일 때만 동작.
 *
 * webm/mp4(MediaRecorder 출력)은 브라우저에서 WAV(16kHz mono)로 변환 후 전송
 * — 로컬 서버가 ffmpeg 없이 WAV만 디코딩 가능하므로 ffmpeg 의존성 제거.
 */
async function transcribeWithLocalWhisper(blob: Blob): Promise<SttResult> {
  const ext = audioBlobToExt(blob);
  // webm/mp4 → WAV 변환 (WAV 는 그대로 전송)
  let sendBlob = blob;
  let sendContentType = 'audio/wav';
  let sendFilename = 'recording.wav';
  if (ext !== 'wav') {
    sendBlob = await audioBlobToWavBlob(blob);
  }

  const arrayBuffer = await sendBlob.arrayBuffer();

  const response = await fetch(LOCAL_WHISPER_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': sendContentType,
      'X-Audio-Filename': sendFilename,
    },
    body: arrayBuffer,
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`로컬 Whisper 오류 (${response.status}): ${errText.slice(0, 150)}`);
  }

  const data = await response.json();

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
    source: 'local-whisper',
  };
}

// ── Web Speech API 폴백 (브라우저 내장 SpeechRecognition) ──
// Blob 기반 후처리 변환은 지원하지 않아 빈 결과 + 안내 반환.
// 실사용 시에는 Deepgram 또는 로컬 Whisper 사용 권장.
function transcribeWithWebSpeech(blob: Blob): Promise<SttResult> {
  return new Promise((resolve, reject) => {
    const SpeechRecognitionClass =
      (typeof window !== 'undefined' &&
        ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)) ||
      null;

    if (!SpeechRecognitionClass) {
      reject(new Error('Web Speech API 를 지원하지 않는 브라우저입니다.'));
      return;
    }

    // Blob 재생 → 마이크 라우팅은 불가하므로 폴백 시 안내만 반환.
    resolve({
      text: '',
      source: 'webspeech',
      warning:
        'Deepgram/로컬 Whisper 모두 사용 불가. Web Speech API 는 Blob 기반 폴백을 지원하지 않아 빈 결과를 반환합니다. DEEPGRAM_API_KEY 등록 또는 로컬 Whisper 서버 실행이 필요합니다.',
    });
  });
}

/**
 * STT 훅 — 오디오 Blob 을 텍스트로 변환.
 * 폴백 순서: Deepgram(1순위) → 로컬 Whisper(2순위) → Web Speech(최후)
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

    const warnings: string[] = [];

    // 1순위: Deepgram Nova-3
    try {
      const deepgramResult = await transcribeWithDeepgram(blob);
      if (abortRef.current) return null;
      const warning = deepgramResult.text ? undefined
        : 'Deepgram 이 음성을 인식하지 못했습니다. (무음/잡음일 수 있음)';
      const finalResult: SttResult = { ...deepgramResult, warning };
      setState({ isLoading: false, result: finalResult, error: null });
      return finalResult;
    } catch (deepgramErr: any) {
      console.warn('[useStt] Deepgram 실패, 로컬 Whisper 폴백 시도:', deepgramErr?.message);
      warnings.push(`Deepgram 실패: ${deepgramErr?.message || '오류'}`);
    }

    // 2순위: 로컬 Whisper dev 서버
    try {
      const localResult = await transcribeWithLocalWhisper(blob);
      if (abortRef.current) return null;
      const warning = localResult.text ? undefined
        : '로컬 Whisper 가 음성을 인식하지 못했습니다. (무음/잡음일 수 있음)';
      const finalResult: SttResult = {
        ...localResult,
        warning: warning || (warnings.length ? `폴백 발생 — ${warnings.join(' | ')}` : undefined),
      };
      setState({ isLoading: false, result: finalResult, error: null });
      return finalResult;
    } catch (localErr: any) {
      console.warn('[useStt] 로컬 Whisper 실패, Web Speech 폴백 시도:', localErr?.message);
      warnings.push(`로컬 Whisper 실패: ${localErr?.message || '오류'}`);
    }

    // 3순위: Web Speech API (최후 — 빈 결과)
    try {
      const fallback = await transcribeWithWebSpeech(blob);
      if (abortRef.current) return null;
      const finalResult: SttResult = {
        ...fallback,
        warning: fallback.warning || `모든 STT 폴백 실패 — ${warnings.join(' | ')}`,
      };
      setState({ isLoading: false, result: finalResult, error: null });
      return finalResult;
    } catch (fbErr: any) {
      const msg = `STT 실패: Deepgram/로컬Whisper/WebSpeech 모두 실패. ${warnings.join(' | ')} / WebSpeech(${fbErr?.message || '오류'})`;
      setState({ isLoading: false, result: null, error: msg });
      return null;
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
