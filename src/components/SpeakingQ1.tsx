import { useEffect } from 'react';
import zooMapImage from 'figma:asset/68cfb904670a085b88221992ab3b674e458ae5d2.png';
import { VolumeControl, useVolumeControl } from './VolumeControl';

interface SpeakingQ1Props {
  onNext?: () => void;
  onHome?: () => void;
}

export function SpeakingQ1({ onNext, onHome }: SpeakingQ1Props) {
  const { isOpen, buttonRef, toggleVolume, closeVolume } = useVolumeControl();

  useEffect(() => {
    // Text to read with British female voice
    const textToRead = "You are learning to welcome visitors to the zoo. Listen to your manager and repeat what she says. Repeat only once.";

    // Use Web Speech API to read the text
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(textToRead);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      utterance.lang = 'en-GB'; // British English

      // Function to find and set the best British female voice
      const setVoice = () => {
        const voices = window.speechSynthesis.getVoices();
        
        // Priority list of British female voices
        const preferredVoices = [
          'Google UK English Female',
          'Microsoft Susan - English (United Kingdom)',
          'Kate',
          'Serena',
          'Stephanie'
        ];
        
        // Try to find a preferred voice
        let selectedVoice = voices.find(voice => 
          preferredVoices.some(preferred => voice.name.includes(preferred))
        );
        
        // If no preferred voice found, try any British female voice
        if (!selectedVoice) {
          selectedVoice = voices.find(voice => 
            voice.lang.includes('en-GB') && 
            (voice.name.toLowerCase().includes('female') || voice.name.toLowerCase().includes('woman'))
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
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        setVoice();
      }

      // Also set voice when voices are loaded (for some browsers)
      window.speechSynthesis.onvoiceschanged = setVoice;

      // When speech ends, automatically move to next screen
      utterance.onend = () => {
        if (onNext) {
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
      // Fallback: auto advance after 5 seconds if speech synthesis is not available
      if (onNext) {
        const timer = setTimeout(() => {
          onNext();
        }, 5000);
        
        return () => clearTimeout(timer);
      }
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
            ref={buttonRef}
            onClick={toggleVolume}
            className="flex items-center gap-3 bg-[#0A6068] border border-white rounded-lg px-5 py-2 hover:bg-[#084d52] transition-colors"
          >
            <span className="text-white font-['Inter',_sans-serif] font-semibold text-base">Volume</span>
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="white">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="bg-white border-b border-gray-300">
        <div className="px-8 py-3">
          <div className="flex gap-8">
            <div className="text-gray-700 font-['Inter',_sans-serif] font-bold border-b-2 border-[#1e6b73] pb-2">
              Speaking
            </div>
            <div className="text-gray-500 text-sm font-['Inter',_sans-serif] font-medium self-end pb-2">
              Question 1 of 11
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto bg-white p-12">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            You are learning to welcome visitors to the zoo. Listen to your manager and repeat what she says. Repeat only once.
          </h1>
          
          {/* Zoo Map Image */}
          <div className="flex justify-center my-8">
            <img 
              src={zooMapImage} 
              alt="Zoo Map" 
              className="border-2 border-gray-400 w-96 h-96 object-cover"
            />
          </div>
        </div>
      </div>

      {/* Volume Control Dropdown */}
      <VolumeControl isOpen={isOpen} onClose={closeVolume} buttonRef={buttonRef} />
    </div>
  );
}