import { Volume2, ChevronLeft } from 'lucide-react';
import { useEffect } from 'react';
import { VolumeControl } from './VolumeControl';
import { MobileQuestionNav } from './MobileQuestionNav';

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
    <div className="fixed inset-0 bg-gray-50 z-50 flex flex-col">
      {/* Compact Header */}
      <div className="flex items-center gap-2 bg-white border-b border-gray-200 px-3 py-2.5 shadow-sm">
        <button onClick={onLogoClick} className="p-1.5 text-gray-400 hover:text-teal-600 rounded-lg hover:bg-teal-50 flex-shrink-0 transition-colors">
          <ChevronLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 leading-tight">Speaking</p>
          <p className="text-xs text-gray-500 leading-tight">Listen and Repeat</p>
        </div>
        {onVolumeClick && (
          <button ref={volumeButtonRef} onClick={onVolumeClick} className="p-1.5 text-gray-400 hover:text-teal-600 rounded-lg hover:bg-teal-50 transition-colors">
            <Volume2 size={18} />
          </button>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto px-4 py-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h1 className="text-lg font-bold text-gray-900 mb-3">Listen and Repeat</h1>
          <p className="text-sm text-gray-600 leading-relaxed mb-3">
            You will listen as someone speaks to you. Listen carefully and then repeat what you have heard. The clock will indicate how much time you have to speak.
          </p>
          <p className="text-sm text-gray-600 leading-relaxed">
            No time for preparation will be provided.
          </p>
        </div>
      </div>

      {/* Volume Control Modal */}
      {isVolumeOpen && onVolumeClick && (
        <VolumeControl isOpen={isVolumeOpen} onClose={onVolumeClick} buttonRef={volumeButtonRef} />
      )}

      {/* Review mode navigation */}
      {isReviewMode && onLogoClick && (
        <MobileQuestionNav onNext={onNext} onHome={onLogoClick} hideBack />
      )}
    </div>
  );
}