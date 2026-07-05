import { useEffect, useRef, useState } from 'react';
import { VolumeControl } from './VolumeControl';

interface SpeakingInterviewIntroProps {
  onNext: () => void;
  onHome?: () => void;
  onVolumeClick?: () => void;
  imageUrl?: string;      // CMS intro image (overrides hardcoded researcher)
  introAudioUrl?: string; // CMS intro audio (replaces TTS)
  questionText?: string;  // CMS heading text
  isReviewMode?: boolean;
}

export function SpeakingInterviewIntro({
  onNext,
  onHome,
  imageUrl,
  introAudioUrl,
  questionText,
  isReviewMode = false,
}: SpeakingInterviewIntroProps) {

  const [showVolumeControl, setShowVolumeControl] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // ── Real audio from CMS ──────────────────────────────────────────────────
    if (introAudioUrl) {
      const audio = new Audio(introAudioUrl);
      audioRef.current = audio;

      audio.onplay  = () => setIsAudioPlaying(true);
      audio.onended = () => {
        setIsAudioPlaying(false);
        if (!isReviewMode) setTimeout(() => onNext(), 500);
      };
      audio.onerror = () => { setIsAudioPlaying(false); if (!isReviewMode) onNext(); };

      const t = setTimeout(() => audio.play().catch(() => { if (!isReviewMode) onNext(); }), 500);
      return () => {
        clearTimeout(t);
        audio.pause();
        audio.src = '';
      };
    }

    // ── TTS fallback ─────────────────────────────────────────────────────────
    const textToRead = questionText ||
      `You have volunteered for a research study at your university about exercise programs. You will have a short online interview with a researcher. The researcher will ask you some questions.`;

    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(textToRead);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      utterance.lang = 'en-GB'; // British English

      // Prefer British female voice
      const applyFemaleVoice = () => {
        const voices = window.speechSynthesis.getVoices();
        const preferred = [
          'Google UK English Female',
          'Microsoft Susan - English (United Kingdom)',
          'Kate', 'Serena', 'Stephanie',
        ];
        let v = voices.find(voice => preferred.some(p => voice.name.includes(p)));
        if (!v) v = voices.find(voice =>
          voice.lang.includes('en-GB') &&
          (voice.name.toLowerCase().includes('female') || voice.name.toLowerCase().includes('woman'))
        );
        if (!v) v = voices.find(voice => voice.lang.includes('en-GB'));
        if (v) utterance.voice = v;
      };
      if (window.speechSynthesis.getVoices().length > 0) applyFemaleVoice();
      window.speechSynthesis.onvoiceschanged = applyFemaleVoice;

      utterance.onstart = () => setIsAudioPlaying(true);
      utterance.onend   = () => {
        setIsAudioPlaying(false);
        if (!isReviewMode) setTimeout(() => onNext(), 500);
      };

      const t = setTimeout(() => window.speechSynthesis.speak(utterance), 500);
      const fallback = window.setTimeout(() => {
        window.speechSynthesis.cancel();
        if (!isReviewMode) onNext();
      }, 30000);

      return () => {
        clearTimeout(t);
        clearTimeout(fallback);
        window.speechSynthesis.cancel();
      };
    } else {
      const t = setTimeout(() => { if (!isReviewMode) onNext(); }, 6000);
      return () => clearTimeout(t);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- play once on mount

  const displayText = questionText ||
    'You have volunteered for a research study at your university about exercise programs. You will have a short online interview with a researcher. The researcher will ask you some questions.';

  
  return (
    <div className="fixed inset-0 bg-gray-50 z-50 flex flex-col">
      {/* Compact Header */}
      <div className="flex items-center gap-2 bg-white border-b border-gray-200 px-3 py-2.5 shadow-sm">
        <button onClick={onHome} className="p-1.5 text-gray-400 hover:text-teal-600 rounded-lg hover:bg-teal-50 flex-shrink-0 transition-colors">
          <ChevronLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 leading-tight">Speaking</p>
          <p className="text-xs text-gray-500 leading-tight">Interview Introduction</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto px-4 py-4 space-y-4">
        {/* Description Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-sm text-gray-700 leading-relaxed text-center">{displayText}</p>
        </div>

        {/* Image Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {imageUrl ? (
            <img src={imageUrl} alt="Interviewer" className="w-full aspect-square object-cover" />
          ) : (
            <div className="w-full aspect-square flex items-center justify-center bg-gray-100">
              <svg className="w-16 h-16 text-gray-300" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
              </svg>
            </div>
          )}
        </div>

        {/* Audio playing indicator */}
        {isAudioPlaying && (
          <div className="flex items-center justify-center gap-3 text-teal-600">
            <svg className="w-7 h-7 animate-pulse" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
            </svg>
            <span className="text-lg font-semibold">Playing audio...</span>
          </div>
        )}
      </div>

      {/* Volume Control Modal */}
      {showVolumeControl && (
        <VolumeControl onClose={() => setShowVolumeControl(false)} />
      )}
    </div>
  );
}