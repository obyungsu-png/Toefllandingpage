/**
 * High-quality Cloud TTS utility.
 *
 * Uses Google Translate TTS (free, high-quality MP3) as the primary engine.
 * Falls back to Web Speech API (speechSynthesis) if the cloud request fails.
 *
 * In Electron, the main process session interceptor bypasses CORS for
 * translate.google.com requests.
 */

const GOOGLE_TTS_BASE = 'https://translate.google.com/translate_tts';
const MAX_CHUNK_LEN = 190; // Google TTS limit is ~200 chars

// ── Global speech state — allows synchronous stop even mid-async ──
let globalCurrentAudio: HTMLAudioElement | null = null;
let globalCancelled = false;

/**
 * Stop ALL ongoing TTS playback immediately (synchronous).
 * Call this before starting a new speech or when navigating away.
 */
export function stopAllSpeech(): void {
  globalCancelled = true;
  if (globalCurrentAudio) {
    try { globalCurrentAudio.pause(); } catch {}
    globalCurrentAudio = null;
  }
  if ('speechSynthesis' in window) {
    try { window.speechSynthesis.cancel(); } catch {}
  }
}

/**
 * Split text into chunks of <= MAX_CHUNK_LEN, breaking at sentence boundaries
 * when possible.
 */
function splitTextIntoChunks(text: string): string[] {
  if (text.length <= MAX_CHUNK_LEN) return [text];

  const chunks: string[] = [];
  const sentences = text.match(/[^.!?]+[.!?]+|\S[^.!?]*$/g) || [text];

  let current = '';
  for (const sentence of sentences) {
    const trimmed = sentence.trim();
    if (!trimmed) continue;

    if ((current + ' ' + trimmed).length <= MAX_CHUNK_LEN) {
      current = current ? current + ' ' + trimmed : trimmed;
    } else {
      if (current) chunks.push(current);
      if (trimmed.length > MAX_CHUNK_LEN) {
        const words = trimmed.split(' ');
        let wordChunk = '';
        for (const word of words) {
          if ((wordChunk + ' ' + word).length <= MAX_CHUNK_LEN) {
            wordChunk = wordChunk ? wordChunk + ' ' + word : word;
          } else {
            if (wordChunk) chunks.push(wordChunk);
            wordChunk = word;
          }
        }
        current = wordChunk;
      } else {
        current = trimmed;
      }
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

/**
 * Fetch a single TTS audio chunk from Google Translate.
 */
async function fetchGoogleTtsChunk(text: string, lang = 'en-GB'): Promise<Blob | null> {
  try {
    const url = `${GOOGLE_TTS_BASE}?ie=UTF-8&q=${encodeURIComponent(text)}&tl=${lang}&client=tw-ob`;
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.blob();
  } catch {
    return null;
  }
}

/**
 * Fall back to Web Speech API (speechSynthesis) with best available voice.
 */
function speakWithSpeechSynthesis(text: string): void {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  const setVoice = () => {
    const voices = window.speechSynthesis.getVoices();
    const preferred = [
      'Google UK English Female',
      'Microsoft Sonia Online (Natural) - English (United Kingdom)',
      'Microsoft Libby Online (Natural) - English (United Kingdom)',
      'Microsoft Susan - English (United Kingdom)',
      'Kate', 'Serena', 'Stephanie',
    ];
    let chosen = voices.find((v) => preferred.some((p) => v.name.includes(p)));
    if (!chosen) {
      chosen = voices.find((v) => v.lang.includes('en-GB') && (v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('woman')));
    }
    if (!chosen) {
      chosen = voices.find((v) => v.lang === 'en-GB' || v.lang === 'en-UK');
    }
    utterance.voice = chosen || voices[0];
    utterance.lang = 'en-GB';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  if (window.speechSynthesis.getVoices().length > 0) setVoice();
  else window.speechSynthesis.onvoiceschanged = setVoice;
}

/**
 * High-quality TTS: tries Google Translate TTS first, falls back to
 * speechSynthesis on failure.
 *
 * Stops any previously playing speech before starting.
 *
 * @returns a cleanup function that stops playback.
 */
export async function speakHighQuality(text: string): Promise<() => void> {
  if (!text || !text.trim()) return () => {};

  // Stop any ongoing speech first
  stopAllSpeech();

  // Reset cancellation flag for this new speech session
  globalCancelled = false;
  const mySessionCancelled = () => globalCancelled;

  const chunks = splitTextIntoChunks(text);

  // Try Google TTS
  for (const chunk of chunks) {
    if (mySessionCancelled()) return stopAllSpeech;
    const blob = await fetchGoogleTtsChunk(chunk);
    if (mySessionCancelled()) return stopAllSpeech;

    if (blob && blob.size > 0) {
      await new Promise<void>((resolve) => {
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        globalCurrentAudio = audio;
        audio.onended = () => {
          URL.revokeObjectURL(url);
          globalCurrentAudio = null;
          resolve();
        };
        audio.onerror = () => {
          URL.revokeObjectURL(url);
          globalCurrentAudio = null;
          resolve();
        };
        audio.play().catch(() => {
          URL.revokeObjectURL(url);
          globalCurrentAudio = null;
          resolve();
        });
      });
    } else {
      // Cloud TTS failed — fall back to speechSynthesis for the entire text
      if (!mySessionCancelled()) speakWithSpeechSynthesis(text);
      return stopAllSpeech;
    }
  }

  return stopAllSpeech;
}
