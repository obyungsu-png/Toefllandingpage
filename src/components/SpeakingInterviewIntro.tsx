import { useEffect, useState } from 'react';
import researcherImage from 'figma:asset/f0cb6fbcd7264092b068d09a76465a605c5d621f.png';
import { VolumeControl } from './VolumeControl';

interface SpeakingInterviewIntroProps {
  onNext: () => void;
  onHome?: () => void;
  onVolumeClick?: () => void;
}

export function SpeakingInterviewIntro({ onNext, onHome }: SpeakingInterviewIntroProps) {
  const [showVolumeControl, setShowVolumeControl] = useState(false);

  useEffect(() => {
    // Text to read
    const textToRead = `You have volunteered for a research study about outdoor activities. You will have a short online interview with a researcher. The researcher will ask you some questions.`;

    // Use Web Speech API to read the text
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(textToRead);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      utterance.lang = 'en-US';

      // When speech ends, automatically move to next screen
      utterance.onend = () => {
        setTimeout(() => {
          onNext();
        }, 500);
      };

      // Start speaking after a short delay
      setTimeout(() => {
        window.speechSynthesis.speak(utterance);
      }, 500);

      // Cleanup function
      return () => {
        window.speechSynthesis.cancel();
      };
    } else {
      // Fallback: auto-advance after reading time if speech synthesis is not available
      const timer = setTimeout(() => {
        onNext();
      }, 6000);

      return () => clearTimeout(timer);
    }
  }, [onNext]);

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* Header */}
      <div className="bg-[#1e6b73] h-14 flex items-center justify-between px-8 shadow-lg">
        <div className="flex items-center">
          <div 
            className="text-white text-2xl font-['Inter',_sans-serif] font-bold tracking-wide cursor-pointer hover:opacity-80 transition-opacity"
            onClick={onHome}
          >
            *toefl ibt
          </div>
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
            You have volunteered for a research study about outdoor activities. You will have a short online interview with a researcher. The researcher will ask you some questions.
          </p>
          
          {/* Researcher Image */}
          <div className="flex justify-center">
            <img 
              src={researcherImage} 
              alt="Researcher" 
              className="border-2 border-gray-300 max-w-md"
            />
          </div>
        </div>
      </div>

      {/* Volume Control Modal */}
      {showVolumeControl && (
        <VolumeControl onClose={() => setShowVolumeControl(false)} />
      )}
    </div>
  );
}