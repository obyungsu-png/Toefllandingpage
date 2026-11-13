/**
 * Shared Text-to-Speech utility for Speaking section.
 *
 * In China (no VPN), Google voices are unavailable because they require
 * access to Google servers. This utility selects the best available
 * British female voice from whatever the browser offers, with a robust
 * fallback chain that works well on mobile (iOS/Android) and desktop.
 *
 * Priority order (adjusted per platform):
 *   1. Microsoft Natural voices (high-quality, offline on Windows)
 *   2. Google UK English Female (only if Google is reachable)
 *   3. iOS/macOS British female voices (Kate, Serena, Fiona)
 *   4. Android system en-GB voices
 *   5. Any en-GB female voice
 *   6. Any en-GB voice
 */

import { getGlobalAudioVolume } from './mediaCache';

export interface SpeakOptions {
  text: string;
  rate?: number;       // default 1.0
  pitch?: number;      // default 1.0
  volume?: number;     // default 1.0
  /** TTS 재생 시작 전 대기 시간(ms) — 기본 500ms. 0으로 줄이면 즉시 재생 */
  delay?: number;
  onstart?: () => void;
  onend?: () => void;
  onerror?: () => void;
}

/** Detect if running on a mobile device */
function isMobile(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Android|iPhone|iPad|iPod|Mobile|Windows Phone/i.test(navigator.userAgent);
}

/** Detect iOS Safari */
function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

/** Detect macOS (desktop Safari/Chrome) */
function isMac(): boolean {
  if (typeof navigator === 'undefined') return false;
  // MacIntel platform check + userAgent check for macOS
  return (navigator.platform === 'MacIntel' && navigator.maxTouchPoints === 0) ||
    /Mac|Macintosh|MacOS/i.test(navigator.userAgent);
}

/**
 * Pick the best available British female voice.
 * Returns null if speechSynthesis is not supported or no voices loaded.
 */
export function pickBestBritishFemaleVoice(): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;

  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  const mobile = isMobile();
  const ios = isIOS();

  // ── Build priority list based on platform ──────────────────────────
  // On mobile in China: Google voices won't work (no internet to Google),
  // so we prioritize Microsoft Natural / system voices first.
  let priorityNames: string[];

  if (ios) {
    // iOS has good built-in voices that work offline — 최신 Enhanced 음성 우선
    priorityNames = [
      // ── Apple 최신 고품질 음성 (iOS 17+ Enhanced) ──
      'Serena (Enhanced)',             // iOS 17+ 최신 고품질 영국 여성 음성
      'Kate (Enhanced)',               // iOS 17+ 최신 고품질 영국 여성 음성
      'Karen (Enhanced)',              // iOS 호주 여성 음성
      'Samantha (Enhanced)',           // iOS en-US 고품질 여성 음성
      // ── Microsoft Natural (Edge on iOS) ──
      'Microsoft Sonia Online (Natural) - English (United Kingdom)',
      'Microsoft Libby Online (Natural) - English (United Kingdom)',
      // ── Apple 기본 음성 ──
      'Kate',                          // iOS/macOS British female
      'Serena',                        // iOS/macOS British female
      'Fiona',                         // macOS British female (compact)
      'Martha',                        // iOS British female
      // ── Google (last resort, may not work on iOS) ──
      'Google UK English Female',
      'Microsoft Susan - English (United Kingdom)',
      'Microsoft Hazel - English (United Kingdom)',
      'Stephanie',
    ];
  } else if (isMac()) {
    // macOS: Apple 최신 고품질 음성 우선 (iOS 17+/macOS Sonoma+의 Enhanced/Premium 음성),
    // Safari/macOS에서는 Google 음성을 사용할 수 없어 소리가 나지 않음
    priorityNames = [
      // ── Apple 최신 고품질 음성 (Enhanced / Premium) ──
      'Samantha (Enhanced)',           // macOS 최신 고품질 en-US 여성 음성
      'Ava (Premium)',                 // macOS Sonoma+ 최고품질 en-US 여성 음성
      'Serena (Enhanced)',             // macOS 최신 고품질 영국 여성 음성
      'Kate (Enhanced)',               // macOS 최신 고품질 영국 여성 음성
      'Karen (Enhanced)',              // macOS 최신 호주 여성 음성
      'Tessa (Enhanced)',              // macOS 남아공 여성 음성
      'Moira (Enhanced)',              // macOS 아일랜드 여성 음성
      // ── Apple 기본 음성 (fallback) ──
      'Samantha',                      // macOS 기본 고품질 여성 음성
      'Kate',                          // macOS 영국 여성 음성
      'Serena',                        // macOS 영국 여성 음성
      'Fiona',                         // macOS 영국 여성 음성 (compact)
      // ── Microsoft Natural (Edge on macOS) ──
      'Microsoft Sonia Online (Natural) - English (United Kingdom)',
      'Microsoft Libby Online (Natural) - English (United Kingdom)',
      // ── Google (Chrome on macOS에서만 작동) ──
      'Google UK English Female',
      'Google US English',
      // ── Microsoft 기본 음성 ──
      'Microsoft Susan - English (United Kingdom)',
      'Microsoft Hazel - English (United Kingdom)',
      'Martha', 'Stephanie',
    ];
  } else if (mobile) {
    // Android: Microsoft Natural voices may be available via Edge;
    // otherwise fall back to system voices
    priorityNames = [
      'Microsoft Sonia Online (Natural) - English (United Kingdom)',
      'Microsoft Libby Online (Natural) - English (United Kingdom)',
      'Google UK English Female',
      'Microsoft Susan - English (United Kingdom)',
      'Microsoft Hazel - English (United Kingdom)',
      'Kate', 'Serena', 'Stephanie',
    ];
  } else {
    // Desktop: Google voice is best quality if available
    priorityNames = [
      'Google UK English Female',
      'Microsoft Sonia Online (Natural) - English (United Kingdom)',
      'Microsoft Libby Online (Natural) - English (United Kingdom)',
      'Microsoft Susan - English (United Kingdom)',
      'Microsoft Hazel - English (United Kingdom)',
      'Kate', 'Serena', 'Stephanie',
    ];
  }

  // 1) Try exact/preferred name match
  for (const name of priorityNames) {
    const v = voices.find(voice => voice.name.includes(name));
    if (v) return v;
  }

  // 2) Try any en-GB female voice
  const gbFemale = voices.find(voice =>
    voice.lang.includes('en-GB') &&
    (voice.name.toLowerCase().includes('female') ||
     voice.name.toLowerCase().includes('woman') ||
     voice.name.toLowerCase().includes('sonia') ||
     voice.name.toLowerCase().includes('libby') ||
     voice.name.toLowerCase().includes('kate') ||
     voice.name.toLowerCase().includes('serena') ||
     voice.name.toLowerCase().includes('fiona'))
  );
  if (gbFemale) return gbFemale;

  // 3) Try any en-GB voice
  const gbVoice = voices.find(voice => voice.lang.includes('en-GB'));
  if (gbVoice) return gbVoice;

  // 4) Last resort: any English female voice
  const anyFemale = voices.find(voice =>
    voice.lang.includes('en') &&
    (voice.name.toLowerCase().includes('female') ||
     voice.name.toLowerCase().includes('woman'))
  );
  if (anyFemale) return anyFemale;

  // 5) Absolute last resort: first available voice
  return voices[0] || null;
}

/**
 * Google Translate TTS 로 영국 여성 음성을 시도 — 모바일 브라우저의 기본
 * speechSynthesis 보다 훨씬 좋은 품질. 네트워크 재생이라 실패할 수 있으니
 * Promise 가 resolve 되어도 blob 이 없으면 false 리턴.
 */
async function tryGoogleTranslateTts(text: string, volume: number): Promise<HTMLAudioElement | null> {
  try {
    // Google Translate 는 최대 ~200자 제한이므로 긴 텍스트는 문장 단위 분할해
    // 순차 재생하는 쪽이 정석이지만, 인트로 안내 문구 길이면 보통 한 번에 통과.
    const chunk = text.length > 190 ? text.slice(0, 190) : text;
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(chunk)}&tl=en-GB&client=tw-ob`;
    const res = await fetch(url, { headers: { 'User-Agent': 'OBS' } });
    if (!res.ok) return null;
    const blob = await res.blob();
    if (!blob || blob.size < 500) return null; // 너무 작은 응답은 실패
    const audio = new Audio(URL.createObjectURL(blob));
    audio.volume = volume;
    return audio;
  } catch {
    return null;
  }
}

/**
 * Speak text with the best available British female voice.
 * 모바일에서는 Google Translate TTS 를 먼저 시도해서 품질 확보, 실패 시
 * 브라우저 내장 speechSynthesis 로 폴백.
 * Returns a cleanup function that cancels the speech.
 */
export function speakWithBritishFemaleVoice(options: SpeakOptions): () => void {
  const { text, rate = 1.0, pitch = 1.0, volume = 1.0, delay, onstart, onend, onerror } = options;

  if (typeof window === 'undefined') {
    const t = setTimeout(() => onend?.(), 3000);
    return () => clearTimeout(t);
  }

  const resolvedVolume = Math.min(volume, getGlobalAudioVolume());
  let currentAudio: HTMLAudioElement | null = null;
  let speakTimer: ReturnType<typeof setTimeout> | null = null;
  let cancelled = false;

  const fallbackToSpeechSynthesis = () => {
    if (cancelled) return;
    if (!('speechSynthesis' in window)) {
      // No support at all — simulate completion so flow doesn't block
      setTimeout(() => { if (!cancelled) onend?.(); }, 2000);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-GB';
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = resolvedVolume;

    const applyVoice = () => {
      const voice = pickBestBritishFemaleVoice();
      if (voice) utterance.voice = voice;
    };
    if (window.speechSynthesis.getVoices().length > 0) applyVoice();
    window.speechSynthesis.onvoiceschanged = applyVoice;

    utterance.onstart = () => onstart?.();
    utterance.onend = () => {
      window.speechSynthesis.onvoiceschanged = null;
      onend?.();
    };
    utterance.onerror = () => {
      window.speechSynthesis.onvoiceschanged = null;
      onerror?.();
      onend?.();
    };
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  // 모바일에서는 Google Translate TTS 를 먼저 시도해서 음질 확보
  const mobile = isMobile();

  speakTimer = setTimeout(async () => {
    if (cancelled) return;
    if (mobile) {
      const audio = await tryGoogleTranslateTts(text, resolvedVolume);
      if (cancelled) { try { audio?.pause(); } catch {} return; }
      if (audio) {
        currentAudio = audio;
        audio.onplay = () => onstart?.();
        audio.onended = () => { onend?.(); };
        audio.onerror = () => {
          // 네트워크/CORS 등으로 Google TTS 실패 → 브라우저 TTS 로 폴백
          fallbackToSpeechSynthesis();
        };
        audio.play().catch(() => fallbackToSpeechSynthesis());
        return;
      }
      // Google TTS 실패 → 브라우저 TTS 폴백
    }
    fallbackToSpeechSynthesis();
  }, delay ?? 500);

  return () => {
    cancelled = true;
    if (speakTimer) clearTimeout(speakTimer);
    if (currentAudio) { try { currentAudio.pause(); currentAudio.src = ''; } catch {} }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = null;
      window.speechSynthesis.cancel();
    }
  };
}
