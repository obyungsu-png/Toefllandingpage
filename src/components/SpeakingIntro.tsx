import { useEffect, useRef, useState } from 'react';
import { Volume2, ChevronLeft, Mic, Headphones, ArrowRight } from 'lucide-react';
import { VolumeControl, useVolumeControl } from './VolumeControl';

interface SpeakingIntroProps {
  onNext: () => void;
  onLogoClick?: () => void;
  introAudioUrl?: string; // CMS-managed high-quality section intro audio (replaces TTS)
}

export function SpeakingIntro({ onNext, onLogoClick, introAudioUrl }: SpeakingIntroProps) {
  const { isOpen, buttonRef, toggleVolume, closeVolume } = useVolumeControl();
  const hasSpokenRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (hasSpokenRef.current) return;
    hasSpokenRef.current = true;

    // ── High-quality CMS audio first ──────────────────────────────────────────
    if (introAudioUrl) {
      const audio = new Audio(introAudioUrl);
      audioRef.current = audio;
      audio.onplay = () => setIsPlaying(true);
      audio.onended = () => { setIsPlaying(false); onNext(); };
      audio.onpause = () => setIsPlaying(false);
      audio.onerror = () => setIsPlaying(false);
      audio.play().catch(() => {});
      return () => { audio.pause(); audio.src = ''; };
    }

    // ── TTS fallback (British English only, skip if no good voice) ─────────────
    if ('speechSynthesis' in window) {
      const text = "In the speaking section, you will answer 11 questions to demonstrate how well you can speak English. There are two types of tasks: Listen and Repeat, where you listen and repeat what you heard, and Take an Interview, where you answer questions from the interviewer.";
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-GB';
      utterance.rate = 0.9;
      utterance.pitch = 1.1;

      const setVoice = () => {
        const voices = window.speechSynthesis.getVoices();
        // Prefer high-quality British female voices
        const preferred = [
          'Google UK English Female',
          'Microsoft Susan - English (United Kingdom)',
          'Kate', 'Serena', 'Stephanie', 'Tessa', 'Danielle'
        ];
        let v = voices.find(voice => preferred.some(p => voice.name.includes(p)));
        if (!v) {
          v = voices.find(voice =>
            (voice.lang === 'en-GB' || voice.lang === 'en-UK') &&
            (voice.name.toLowerCase().includes('female') || voice.name.toLowerCase().includes('woman'))
          );
        }
        if (!v) {
          v = voices.find(voice => voice.lang === 'en-GB' || voice.lang === 'en-UK');
        }
        if (v) {
          utterance.voice = v;
          window.speechSynthesis.speak(utterance);
        }
        // If no British voice is found, we stay silent to avoid low-quality audio
      };

      if (window.speechSynthesis.getVoices().length > 0) { setVoice(); }
      else { window.speechSynthesis.onvoiceschanged = setVoice; }
    }

    return () => {
      if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ''; }
      if (window.speechSynthesis.speaking) { window.speechSynthesis.cancel(); }
    };
  }, [introAudioUrl, onNext]);
  
  return (
    <div className="fixed inset-0 bg-gray-50 z-50 flex flex-col">
      {/* Compact Header */}
      <div className="flex items-center gap-2 bg-white border-b border-gray-200 px-3 py-2.5 shadow-sm">
        <button onClick={onLogoClick} className="p-1.5 text-gray-400 hover:text-teal-600 rounded-lg hover:bg-teal-50 flex-shrink-0 transition-colors">
          <ChevronLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 leading-tight">Speaking</p>
          <p className="text-xs text-gray-500 leading-tight">Section Introduction</p>
        </div>
        <button ref={buttonRef} onClick={toggleVolume} className="p-1.5 text-gray-400 hover:text-teal-600 rounded-lg hover:bg-teal-50 transition-colors">
          <Volume2 size={18} />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto px-3 py-4 sm:px-4 sm:py-6">
        {/* Section Title */}
        <div className="mb-4 sm:mb-6">
          <h1 className="text-lg sm:text-xl font-bold text-gray-900">Speaking Section</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Answer 11 questions to demonstrate your English speaking ability. There are two types of tasks.
          </p>
        </div>

        {/* Task Type Cards */}
        <div className="space-y-3 mb-6">
          {/* Listen and Repeat Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-4 flex items-center gap-3 sm:gap-4 min-h-[5rem] sm:min-h-[5.5rem]">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0">
              <Headphones className="w-4 h-4 sm:w-5 sm:h-5 text-teal-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5 sm:mb-1">
                <h3 className="text-sm sm:text-base font-semibold text-gray-900">Listen and Repeat</h3>
                <span className="bg-teal-100 text-teal-700 text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap">7 questions</span>
              </div>
              <p className="text-xs sm:text-sm text-gray-500">Listen carefully and repeat what you heard. Respond only once.</p>
            </div>
          </div>

          {/* Take an Interview Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-4 flex items-center gap-3 sm:gap-4 min-h-[5rem] sm:min-h-[5.5rem]">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0">
              <Mic className="w-4 h-4 sm:w-5 sm:h-5 text-teal-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5 sm:mb-1">
                <h3 className="text-sm sm:text-base font-semibold text-gray-900">Take an Interview</h3>
                <span className="bg-teal-100 text-teal-700 text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap">4 questions</span>
              </div>
              <p className="text-xs sm:text-sm text-gray-500">Answer questions from the interviewer naturally.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="bg-white border-t border-gray-200 px-4 py-3">
        <button
          onClick={onNext}
          className="w-full bg-teal-600 text-white font-semibold py-3.5 rounded-xl hover:bg-teal-700 transition-colors flex items-center justify-center gap-2 shadow-sm"
        >
          <span>Begin</span>
          <ArrowRight size={18} />
        </button>
      </div>

      {/* Volume Control Dropdown */}
      <VolumeControl isOpen={isOpen} onClose={closeVolume} buttonRef={buttonRef} />
    </div>
  );
}