import { useEffect, useRef, useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { VolumeControl } from './VolumeControl';
import { MobileQuestionNav } from './MobileQuestionNav';

interface SpeakingTakeInterviewIntroProps {
  onNext: () => void;
  onHome?: () => void;
  onVolumeClick?: () => void;
  isReviewMode?: boolean;
}

export function SpeakingTakeInterviewIntro({ onNext, onHome, isReviewMode = false }: SpeakingTakeInterviewIntroProps) {

  const [showVolumeControl, setShowVolumeControl] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);

  useEffect(() => {
    const textToRead = `Take an Interview. An interviewer will ask you questions. Answer the questions and be sure to say as much as you can in the time allowed. No time for preparation will be provided.`;
    let fallbackTimer: ReturnType<typeof setTimeout> | undefined;
    let ttsEnded = false;

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
      utterance.onend = () => {
        setIsAudioPlaying(false);
        ttsEnded = true;
        if (!isReviewMode) setTimeout(() => onNext(), 500);
      };

      setTimeout(() => window.speechSynthesis.speak(utterance), 500);

      fallbackTimer = window.setTimeout(() => {
        if (!ttsEnded) { window.speechSynthesis.cancel(); if (!isReviewMode) onNext() }
      }, 30000);

      return () => {
        window.speechSynthesis.cancel();
        if (fallbackTimer) clearTimeout(fallbackTimer);
      };
    } else {
      const t = setTimeout(() => { if (!isReviewMode) onNext(); }, 6000);
      return () => clearTimeout(t);
    }
  }, [onNext]);

  
  return (
    <div className="fixed inset-0 bg-gray-50 z-50 flex flex-col">
      {/* Compact Header */}
      <div className="flex items-center gap-2 bg-white border-b border-gray-200 px-3 py-2.5 shadow-sm">
        <button onClick={onHome} className="p-1.5 text-gray-400 hover:text-teal-600 rounded-lg hover:bg-teal-50 flex-shrink-0 transition-colors">
          <ChevronLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 leading-tight">Speaking</p>
          <p className="text-xs text-gray-500 leading-tight">Take an Interview</p>
        </div>
        <button onClick={() => setShowVolumeControl(true)} className="p-1.5 text-gray-400 hover:text-teal-600 rounded-lg hover:bg-teal-50 transition-colors">
          <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 5L6 9H2v6h4l5 4V5zM19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07"/>
          </svg>
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto px-4 py-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h1 className="text-lg font-bold text-gray-900 mb-3">Take an Interview</h1>
          <p className="text-sm text-gray-600 leading-relaxed mb-3">
            An interviewer will ask you questions. Answer the questions and be sure to say as much as you can in the time allowed.
          </p>
          <p className="text-sm text-gray-600 leading-relaxed">
            No time for preparation will be provided.
          </p>
        </div>
      </div>

      {/* Volume Control Modal */}
      {showVolumeControl && (
        <VolumeControl onClose={() => setShowVolumeControl(false)} />
      )}

      {/* Review mode navigation */}
      {isReviewMode && onHome && (
        <MobileQuestionNav onNext={onNext} onHome={onHome} hideBack />
      )}
    </div>
  );
}