import { useEffect, useRef, useState } from 'react';
import zooMapImage from 'figma:asset/68cfb904670a085b88221992ab3b674e458ae5d2.png';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { VolumeControl, useVolumeControl } from './VolumeControl';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface SpeakingQ1Props {
  onNext?: () => void;
  onHome?: () => void;
  imageUrl?: string;
  introAudioUrl?: string; // CMS-managed intro audio (replaces TTS)
  questionText?: string;  // CMS-managed heading text
  isReviewMode?: boolean;
}

export function SpeakingQ1({ onNext, onHome, imageUrl, introAudioUrl, questionText, isReviewMode = false }: SpeakingQ1Props) {

  const { isOpen, buttonRef, toggleVolume, closeVolume } = useVolumeControl();
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
        if (!isReviewMode) setTimeout(() => onNext?.(), 500);
      };
      audio.onerror = () => {
        // fallback to TTS if audio fails
        setIsAudioPlaying(false);
        if (!isReviewMode) onNext?.();
      };

      const t = setTimeout(() => audio.play().catch(() => { if (!isReviewMode) onNext?.(); }), 500);
      return () => {
        clearTimeout(t);
        audio.pause();
        audio.src = '';
      };
    }

    // ── TTS fallback (no CMS audio) ──────────────────────────────────────────
    const textToRead = questionText ||
      "You are learning to welcome visitors to the zoo. Listen to your manager and repeat what she says. Repeat only once.";
    let fallbackTimer: number | undefined;
    let ttsEnded = false;

    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(textToRead);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      utterance.lang = 'en-GB';

      const setVoice = () => {
        const voices = window.speechSynthesis.getVoices();
        const preferred = ['Google UK English Female','Microsoft Susan - English (United Kingdom)','Kate','Serena','Stephanie'];
        let v = voices.find(voice => preferred.some(p => voice.name.includes(p)));
        if (!v) v = voices.find(voice => voice.lang.includes('en-GB') && (voice.name.toLowerCase().includes('female') || voice.name.toLowerCase().includes('woman')));
        if (!v) v = voices.find(voice => voice.lang.includes('en-GB'));
        if (v) utterance.voice = v;
      };

      if (window.speechSynthesis.getVoices().length > 0) setVoice();
      window.speechSynthesis.onvoiceschanged = setVoice;

      utterance.onstart = () => setIsAudioPlaying(true);
      utterance.onend = () => {
        setIsAudioPlaying(false);
        ttsEnded = true;
        if (!isReviewMode) setTimeout(() => onNext?.(), 500);
      };

      // Ensure speech synthesis is not paused
      window.speechSynthesis.cancel();
      setTimeout(() => {
        window.speechSynthesis.cancel();
        setTimeout(() => window.speechSynthesis.speak(utterance), 100);
      }, 800);

      fallbackTimer = window.setTimeout(() => {
        if (!ttsEnded) { window.speechSynthesis.cancel(); if (!isReviewMode) onNext?.(); }
      }, 20000);

      return () => {
        window.speechSynthesis.cancel();
        if (fallbackTimer) clearTimeout(fallbackTimer);
      };
    } else {
      setIsAudioPlaying(false);
      if (!isReviewMode) {
        fallbackTimer = window.setTimeout(() => onNext?.(), 5000);
      }
      return () => { if (fallbackTimer) clearTimeout(fallbackTimer); };
    }
  }, [introAudioUrl, onNext, questionText]);

  
  return (
    <div className="fixed inset-0 bg-gray-50 z-50 flex flex-col">
      {/* Compact Header */}
      <div className="flex items-center gap-2 bg-white border-b border-gray-200 px-3 py-2.5 shadow-sm">
        <button onClick={onHome} className="p-1.5 text-gray-400 hover:text-teal-600 rounded-lg hover:bg-teal-50 flex-shrink-0 transition-colors">
          <ChevronLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 leading-tight">Speaking</p>
          <p className="text-xs text-gray-500 leading-tight">Question 1 of 11</p>
        </div>
        <button ref={buttonRef} onClick={toggleVolume} className="p-1.5 text-gray-400 hover:text-teal-600 rounded-lg hover:bg-teal-50 transition-colors">
          <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 5L6 9H2v6h4l5 4V5zM19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07"/>
          </svg>
        </button>
        {isReviewMode && onNext && (
          <button onClick={onNext} className="flex items-center gap-1 px-3 py-1.5 bg-teal-600 text-white text-sm font-semibold rounded-lg hover:bg-teal-700 transition-colors flex-shrink-0">
            Next
            <ChevronRight size={16} />
          </button>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto px-3 py-2 sm:px-4 sm:py-4 space-y-2 sm:space-y-4">
        {/* Question Card - compact on mobile */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-2.5 sm:p-4">
          <p className="text-[10px] sm:text-xs text-teal-600 font-semibold mb-1 uppercase tracking-wider">Question</p>
          <p className="text-xs sm:text-sm text-gray-800 leading-snug line-clamp-2 text-center">
            {questionText || 'You are learning to welcome visitors to the zoo. Listen to your manager and repeat what she says. Repeat only once.'}
          </p>
        </div>

        {/* Image Card - square, constrained on mobile */}
        <div className="speaking-picture-card mx-auto" style={{ maxWidth: 'min(100%, 20rem)' }}>
          <ImageWithFallback
            src={imageUrl || zooMapImage}
            alt="Zoo Map"
            className="speaking-picture-media"
          />
        </div>

        {/* Audio playing indicator */}
        {isAudioPlaying && (
          <div className="flex items-center justify-center gap-3 text-teal-600">
            <svg className="h-7 w-7 animate-pulse" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
            </svg>
            <span className="text-lg font-semibold">Playing audio...</span>
          </div>
        )}
      </div>

      <VolumeControl isOpen={isOpen} onClose={closeVolume} buttonRef={buttonRef} />
    </div>
  );
}