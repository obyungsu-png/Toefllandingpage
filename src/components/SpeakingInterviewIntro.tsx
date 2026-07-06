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
          'Microsoft Sonia Online (Natural) - English (United Kingdom)',
          'Microsoft Libby Online (Natural) - English (United Kingdom)',
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
        window.speechSynthesis.onvoiceschanged = null;
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
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* Header */}
      <div className="bg-[#1e6b73] h-14 flex items-center justify-between px-8 shadow-lg">
        <div
          className="text-white text-2xl font-['Inter',_sans-serif] font-bold tracking-wide cursor-pointer hover:opacity-80 transition-opacity"
          onClick={onHome}
        >
          *toefl ibt
        </div>
        <div className="flex items-center gap-3">
          <button
            className="flex items-center gap-3 bg-[#0A6068] border-2 border-[#0A6068] rounded-lg px-5 py-2 hover:bg-[#084d52] transition-colors"
            onClick={() => setShowVolumeControl(true)}
          >
            <span className="text-white font-['Inter',_sans-serif] font-semibold text-base">Volume</span>
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="white">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
            </svg>
          </button>
          <button
            onClick={onNext}
            className="flex items-center gap-2 bg-white border-2 border-[#0A6068] rounded-lg px-5 py-2 hover:bg-gray-100 transition-colors"
          >
            <span className="text-[#0A6068] font-['Inter',_sans-serif] font-semibold text-base">Next</span>
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#0A6068">
              <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Tab */}
      <div className="bg-white border-b border-gray-300">
        <div className="px-8 py-3">
          <div className="flex gap-8">
            <div className="text-gray-700 font-['Inter',_sans-serif] font-bold border-b-2 border-[#1e6b73] pb-2">
              Speaking
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-start bg-white p-12 pt-16">
        <div className="max-w-4xl w-full">
          <p className="text-gray-900 text-2xl mb-12 leading-relaxed text-center">
            {displayText}
          </p>

          <div className="flex justify-center">
            <div className="border-2 border-gray-300 w-96 h-96 flex items-center justify-center bg-gray-50 overflow-hidden">
              {imageUrl ? (
                <img src={imageUrl} alt="Interviewer" className="w-full h-full object-cover"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display='none'; }} />
              ) : (
                <svg className="w-24 h-24 text-gray-300" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
                </svg>
              )}
            </div>
          </div>

          {isAudioPlaying && (
            <div className="flex items-center justify-center gap-3 text-[#148b8f] mt-8">
              <svg className="h-7 w-7 animate-pulse" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
              </svg>
              <span className="text-lg font-semibold">Playing audio...</span>
            </div>
          )}
        </div>
      </div>

      {showVolumeControl && (
        <VolumeControl onClose={() => setShowVolumeControl(false)} />
      )}
    </div>
  );
}
