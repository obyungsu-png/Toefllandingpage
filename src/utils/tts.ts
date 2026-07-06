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

export interface SpeakOptions {
  text: string;
  rate?: number;       // default 1.0
  pitch?: number;      // default 1.0
  volume?: number;     // default 1.0
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
    // iOS has good built-in voices that work offline
    priorityNames = [
      'Microsoft Sonia Online (Natural) - English (United Kingdom)',
      'Microsoft Libby Online (Natural) - English (United Kingdom)',
      'Kate',                          // iOS/macOS British female
      'Serena',                        // iOS/macOS British female
      'Fiona',                         // macOS British female (compact)
      'Martha',                        // iOS British female
      'Google UK English Female',      // last resort on iOS (may not work)
      'Microsoft Susan - English (United Kingdom)',
      'Microsoft Hazel - English (United Kingdom)',
      'Stephanie',
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
 * Speak text with the best available British female voice.
 * Returns a cleanup function that cancels the speech.
 */
export function speakWithBritishFemaleVoice(options: SpeakOptions): () => void {
  const { text, rate = 1.0, pitch = 1.0, volume = 1.0, onstart, onend, onerror } = options;

  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    // No speech synthesis support — call onend after a short delay
    const t = setTimeout(() => onend?.(), 3000);
    return () => clearTimeout(t);
  }

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-GB';
  utterance.rate = rate;
  utterance.pitch = pitch;
  utterance.volume = volume;

  // Apply voice now if available, or wait for voices to load
  const applyVoice = () => {
    const voice = pickBestBritishFemaleVoice();
    if (voice) utterance.voice = voice;
  };

  if (window.speechSynthesis.getVoices().length > 0) {
    applyVoice();
  }
  // Re-apply when voices load (some browsers load asynchronously)
  window.speechSynthesis.onvoiceschanged = applyVoice;

  utterance.onstart = () => onstart?.();
  utterance.onend = () => {
    window.speechSynthesis.onvoiceschanged = null;
    onend?.();
  };
  utterance.onerror = () => {
    window.speechSynthesis.onvoiceschanged = null;
    onerror?.();
    onend?.(); // treat error as end so the flow continues
  };

  // Speak after a short delay (helps on mobile where immediate speak() can fail)
  const speakTimer = setTimeout(() => {
    window.speechSynthesis.cancel(); // clear any queued speech
    window.speechSynthesis.speak(utterance);
  }, 500);

  return () => {
    clearTimeout(speakTimer);
    window.speechSynthesis.onvoiceschanged = null;
    window.speechSynthesis.cancel();
  };
}
