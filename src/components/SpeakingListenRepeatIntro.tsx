import { Volume2 } from 'lucide-react';
import { useEffect } from 'react';
import { VolumeControl } from './VolumeControl';

interface SpeakingListenRepeatIntroProps {
  onNext: () => void;
  onVolumeClick?: () => void;
  isVolumeOpen?: boolean;
  volumeButtonRef?: React.RefObject<HTMLButtonElement>;
  onLogoClick?: () => void;
  isReviewMode?: boolean;
}

export function SpeakingListenRepeatIntro({ onNext, onVolumeClick, isVolumeOpen, volumeButtonRef, onLogoClick, isReviewMode = false }: SpeakingListenRepeatIntroProps) {
  useEffect(() => {
    // Text to read
    const textToRead = `Listen and Repeat. You will listen as someone speaks to you. Listen carefully and then repeat what you have heard. The clock will indicate how much time you have to speak. No time for preparation will be provided.`;

    // Use Web Speech API to read the text
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(textToRead);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      utterance.lang = 'en-GB'; // British English

      // Try to select a British male voice
      const voices = window.speechSynthesis.getVoices();
      
      // Function to find and set the best British male voice
      const setVoice = () => {
        const voices = window.speechSynthesis.getVoices();
        
        // Priority list of British male voices
        const preferredVoices = [
          'Google UK English Male',
          'Microsoft George - English (United Kingdom)',
          'Daniel',
          'Arthur'
        ];
        
        // Try to find a preferred voice
        let selectedVoice = voices.find(voice => 
          preferredVoices.some(preferred => voice.name.includes(preferred))
        );
        
        // If no preferred voice found, try any British male voice
        if (!selectedVoice) {
          selectedVoice = voices.find(voice => 
            voice.lang.includes('en-GB') && 
            (voice.name.toLowerCase().includes('male') || voice.name.toLowerCase().includes('man'))
          );
        }
        
        // If still no voice found, use any British voice
        if (!selectedVoice) {
          selectedVoice = voices.find(voice => voice.lang.includes('en-GB'));
        }
        
        if (selectedVoice) {
          utterance.voice = selectedVoice;
        }
      };

      // Set voice immediately if available
      if (voices.length > 0) {
        setVoice();
      }

      // Also set voice when voices are loaded (for some browsers)
      window.speechSynthesis.onvoiceschanged = setVoice;

      // When speech ends, automatically move to next screen (only in start mode)
      utterance.onend = () => {
        if (!isReviewMode) {
          setTimeout(() => {
            onNext();
          }, 500);
        }
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
      const estimatedReadingTime = (textToRead.split(' ').length / 150) * 60 * 1000; // ~150 words per minute
      const timer = setTimeout(() => {
        if (!isReviewMode) onNext();
      }, estimatedReadingTime);

      return () => clearTimeout(timer);
    }
  }, [onNext]);

  return (
    <div className="fixed inset-0 bg-[#F5F5F5] z-50 flex flex-col">
      {/* Header */}
      <div className="bg-[#1e6b73] h-14 flex items-center justify-between px-8 shadow-lg">
        <div className="flex items-center">
          <div 
            className="text-white text-2xl font-['Inter',_sans-serif] font-bold tracking-wide cursor-pointer hover:opacity-80 transition-opacity"
            onClick={onLogoClick}
          >
            *toefl ibt
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Volume Button */}
          <button 
            onClick={onVolumeClick}
            className={`flex items-center gap-3 rounded-lg px-5 py-2 transition-colors ${
              isVolumeOpen 
                ? 'bg-white border border-[#0A6068] hover:bg-gray-50' 
                : 'bg-[#0A6068] border border-white hover:bg-[#084d52]'
            }`}
            ref={volumeButtonRef}
          >
            <span className={`font-['Inter',_sans-serif] font-semibold text-base ${
              isVolumeOpen ? 'text-[#0A6068]' : 'text-white'
            }`}>Volume</span>
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill={isVolumeOpen ? '#0A6068' : 'white'}>
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
            </svg>
          </button>
          
          {/* Next Button */}
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
      <div className="flex-1 overflow-auto bg-[#F5F5F5] p-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-['Inter',_sans-serif] text-gray-800 mb-8 pb-4 border-b-2 border-gray-300">Listen and Repeat</h1>
          
          <div className="mb-8">
            <p className="text-gray-700 font-['Inter',_sans-serif] leading-relaxed mb-6">
              You will listen as someone speaks to you. Listen carefully and then repeat what you have heard. The clock will indicate how much time you have to speak.
            </p>
            
            <p className="text-gray-700 font-['Inter',_sans-serif] leading-relaxed">
              No time for preparation will be provided.
            </p>
          </div>
        </div>
      </div>

      {/* Volume Control Modal */}
      {isVolumeOpen && onVolumeClick && (
        <VolumeControl isOpen={isVolumeOpen} onClose={onVolumeClick} buttonRef={volumeButtonRef} />
      )}
    </div>
  );
}