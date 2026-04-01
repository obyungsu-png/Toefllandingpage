import { useEffect, useRef } from 'react';
import { Volume2 } from 'lucide-react';
import { VolumeControl, useVolumeControl } from './VolumeControl';

interface SpeakingIntroProps {
  onNext: () => void;
  onLogoClick?: () => void;
}

export function SpeakingIntro({ onNext, onLogoClick }: SpeakingIntroProps) {
  const { isOpen, buttonRef, toggleVolume, closeVolume } = useVolumeControl();
  const hasSpokenRef = useRef(false);

  useEffect(() => {
    // Speak the instructions using British female voice
    if (!hasSpokenRef.current && 'speechSynthesis' in window) {
      hasSpokenRef.current = true;
      
      const text = "In the speaking section, you will answer 11 questions to demonstrate how well you can speak English. There are two types of tasks: Listen and Repeat, where you listen and repeat what you heard, and Take an Interview, where you answer questions from the interviewer.";
      
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Get available voices and find a British female voice
      const setVoice = () => {
        const voices = window.speechSynthesis.getVoices();
        
        // Try to find British English female voice
        const britishFemaleVoice = voices.find(voice => 
          (voice.lang === 'en-GB' || voice.lang === 'en-UK') && 
          (voice.name.toLowerCase().includes('female') || voice.name.toLowerCase().includes('woman'))
        );
        
        // Fallback to any British voice
        const britishVoice = voices.find(voice => 
          voice.lang === 'en-GB' || voice.lang === 'en-UK'
        );
        
        // Fallback to any female voice
        const femaleVoice = voices.find(voice => 
          voice.name.toLowerCase().includes('female') || 
          voice.name.toLowerCase().includes('woman') ||
          voice.name.toLowerCase().includes('samantha') ||
          voice.name.toLowerCase().includes('victoria')
        );
        
        utterance.voice = britishFemaleVoice || britishVoice || femaleVoice || voices[0];
        utterance.lang = 'en-GB';
        utterance.rate = 0.9; // Slightly slower for clarity
        utterance.pitch = 1.1; // Slightly higher for female voice
        
        window.speechSynthesis.speak(utterance);
      };
      
      // Load voices (some browsers load them asynchronously)
      if (window.speechSynthesis.getVoices().length > 0) {
        setVoice();
      } else {
        window.speechSynthesis.onvoiceschanged = setVoice;
      }
    }
    
    // Cleanup
    return () => {
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);
  
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
            ref={buttonRef}
            onClick={toggleVolume}
            className={`flex items-center gap-3 rounded-lg px-5 py-2 transition-colors ${
              isOpen 
                ? 'bg-white border border-[#0A6068] hover:bg-gray-50' 
                : 'bg-[#0A6068] border border-white hover:bg-[#084d52]'
            }`}
          >
            <span className={`font-['Inter',_sans-serif] font-semibold text-base ${
              isOpen ? 'text-[#0A6068]' : 'text-white'
            }`}>Volume</span>
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill={isOpen ? '#0A6068' : 'white'}>
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
            </svg>
          </button>
          
          {/* Begin Button */}
          <button 
            className="flex items-center gap-2 bg-white border-2 border-[#0A6068] rounded-lg px-5 py-2 hover:bg-gray-100 transition-colors"
            onClick={onNext}
          >
            <span className="text-[#0A6068] font-['Inter',_sans-serif] font-semibold text-base">Begin</span>
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
          <h1 className="text-4xl font-['Inter',_sans-serif] text-gray-800 mb-8 pb-4 border-b-2 border-gray-300">Speaking Section</h1>
          
          <div className="mb-8">
            <p className="text-gray-700 font-['Inter',_sans-serif] leading-relaxed mb-6">
              In the speaking section, you will answer 11 questions to demonstrate how well you can speak English. There are two types of tasks.
            </p>
            
            {/* Table */}
            <div className="border-2 border-gray-400">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#B3A497]">
                    <th className="border-2 border-gray-400 px-4 py-3 text-left font-['Inter',_sans-serif] font-bold text-gray-800">Type of Task</th>
                    <th className="border-2 border-gray-400 px-4 py-3 text-center font-['Inter',_sans-serif] font-bold text-gray-800">Questions</th>
                    <th className="border-2 border-gray-400 px-4 py-3 text-left font-['Inter',_sans-serif] font-bold text-gray-800">Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-white">
                    <td className="border-2 border-gray-400 px-4 py-3 font-['Inter',_sans-serif] text-gray-700">Listen and Repeat</td>
                    <td className="border-2 border-gray-400 px-4 py-3 text-center font-['Inter',_sans-serif] font-bold text-gray-700">7</td>
                    <td className="border-2 border-gray-400 px-4 py-3 font-['Inter',_sans-serif] text-gray-700">Listen and repeat what you heard</td>
                  </tr>
                  <tr className="bg-white">
                    <td className="border-2 border-gray-400 px-4 py-3 font-['Inter',_sans-serif] text-gray-700">Take an Interview</td>
                    <td className="border-2 border-gray-400 px-4 py-3 text-center font-['Inter',_sans-serif] font-bold text-gray-700">4</td>
                    <td className="border-2 border-gray-400 px-4 py-3 font-['Inter',_sans-serif] text-gray-700">Answer questions from the interviewer</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Volume Control Dropdown */}
      <VolumeControl isOpen={isOpen} onClose={closeVolume} buttonRef={buttonRef} />
    </div>
  );
}