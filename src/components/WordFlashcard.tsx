import { useState, useEffect } from 'react';
// motion removed - using CSS animations
import { ChevronLeft, ChevronRight, X, Volume2 } from 'lucide-react';
import { Button } from './ui/button';

interface WordFlashcardProps {
  words: Array<{
    english: string;
    korean: string;
    definition: string;
    synonyms: string;
  }>;
  onFinish: () => void;
  autoPlay?: boolean;
  themeColor?: string;
}

export function WordFlashcard({ 
  words, 
  onFinish, 
  autoPlay = false,
  themeColor = '#3D5AA1' 
}: WordFlashcardProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const currentWord = words[currentIndex];
  const progress = ((currentIndex + 1) / words.length) * 100;

  // Auto-play audio when card is shown
  useEffect(() => {
    // Auto-play the word when showing the front of the card
    if (!isFlipped) {
      const timer = setTimeout(() => {
        speakWord(currentWord.english);
      }, 300); // Small delay for card flip animation
      
      return () => clearTimeout(timer);
    }
  }, [currentIndex, isFlipped]);

  // Text-to-Speech function - Female voice only
  const speakWord = (text: string) => {
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-GB'; // British English
      utterance.rate = 0.85;
      utterance.pitch = 1.0;

      // Get available voices
      const voices = window.speechSynthesis.getVoices();
      
      // Try to find British English female voice
      let selectedVoice = voices.find(voice => {
        const isEnGB = voice.lang === 'en-GB' || voice.lang.startsWith('en-GB');
        return isEnGB && 
               (voice.name.includes('Female') || 
                voice.name.includes('Kate') ||
                voice.name.includes('Serena') ||
                voice.name.includes('Emma') ||
                voice.name.includes('British'));
      });

      // Fallback to any British English voice
      if (!selectedVoice) {
        selectedVoice = voices.find(voice => voice.lang === 'en-GB' || voice.lang.startsWith('en-GB'));
      }

      // Final fallback to any English voice
      if (!selectedVoice) {
        selectedVoice = voices.find(voice => voice.lang.startsWith('en'));
      }

      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }

      window.speechSynthesis.speak(utterance);
    }
  };

  // Load voices when available
  useEffect(() => {
    if ('speechSynthesis' in window) {
      const loadVoices = () => {
        window.speechSynthesis.getVoices();
      };
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  const handleNext = () => {
    if (currentIndex < words.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    } else {
      onFinish();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsFlipped(false);
    }
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  return (
    <div className="fixed inset-0 z-50 bg-white flex items-center justify-center p-4 pb-28 md:pb-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full p-4 md:p-8 relative flex flex-col" style={{ height: '85vh', maxHeight: '800px' }}>
        {/* Left Arrow Navigation - Floating Transparent Style */}
        {currentIndex > 0 && (
          <button
            onClick={handlePrev}
            className={`absolute left-0 md:left-4 top-[55%] md:top-1/2 -translate-y-1/2 z-10 rounded-full p-3 md:p-3 transition-all hover:scale-110 backdrop-blur-sm shadow-lg ${
              isFlipped 
                ? 'bg-[#3D5AA1]/30 hover:bg-[#3D5AA1]/40' 
                : 'bg-white/30 hover:bg-white/40'
            }`}
          >
            <ChevronLeft className={`w-6 h-6 md:w-6 md:h-6 drop-shadow-md ${
              isFlipped ? 'text-[#3D5AA1]' : 'text-white'
            }`} />
          </button>
        )}

        {/* Right Arrow Navigation - Floating Transparent Style */}
        <button
          onClick={handleNext}
          className={`absolute right-0 md:right-4 top-[55%] md:top-1/2 -translate-y-1/2 z-10 rounded-full p-3 md:p-3 transition-all hover:scale-110 backdrop-blur-sm shadow-lg ${
            isFlipped 
              ? 'bg-[#3D5AA1]/30 hover:bg-[#3D5AA1]/40' 
              : 'bg-white/30 hover:bg-white/40'
          }`}
        >
          {currentIndex === words.length - 1 ? (
            <X className={`w-6 h-6 md:w-6 md:h-6 drop-shadow-md ${
              isFlipped ? 'text-[#3D5AA1]' : 'text-white'
            }`} />
          ) : (
            <ChevronRight className={`w-6 h-6 md:w-6 md:h-6 drop-shadow-md ${
              isFlipped ? 'text-[#3D5AA1]' : 'text-white'
            }`} />
          )}
        </button>

        {/* Header */}
        <div className="flex items-center justify-between mb-4 md:mb-6 flex-shrink-0">
          <h2 className="text-xl md:text-3xl font-bold" style={{ color: themeColor }}>
            단어 카드
          </h2>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => speakWord(currentWord.english)}
              variant="outline"
              size="sm"
              className="flex items-center gap-2 text-xs md:text-sm"
            >
              <Volume2 className="w-3 h-3 md:w-4 md:h-4" />
              <span className="hidden md:inline">음성 재생</span>
              <span className="md:hidden">재생</span>
            </Button>
            <button
              onClick={onFinish}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5 md:w-6 md:h-6" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4 md:mb-8 flex-shrink-0">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm md:text-base font-medium text-gray-700">
              {currentIndex + 1} / {words.length}
            </span>
            <span className="text-sm md:text-base font-bold" style={{ color: themeColor }}>
              {Math.round(progress)}%
            </span>
          </div>
          <div className="h-2 md:h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{ backgroundColor: themeColor, width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Flashcard - Fixed Height to prevent shake */}
        <div className="flex-1 mb-4 md:mb-8 flex items-center" style={{ perspective: '1500px', minHeight: '400px' }}>
          <div
            className="relative w-full h-full cursor-pointer"
            onClick={handleFlip}
            style={{ 
              transformStyle: 'preserve-3d',
              transformOrigin: 'center center',
              willChange: 'transform',
              height: '500px',
              transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
              transition: 'transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
            }}
          >
            {/* Front Side - English Word */}
            <div
              className="absolute inset-0 rounded-xl shadow-lg flex flex-col items-center justify-center p-6 md:p-8"
              style={{
                backgroundColor: themeColor,
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                transform: 'rotateY(0deg) translateZ(1px)',
                transformOrigin: 'center center',
                height: '500px'
              }}
            >
              <p className="text-sm md:text-base text-white/80 mb-3 md:mb-4 font-medium">영어 단어</p>
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 md:mb-6 break-words text-center px-2">
                {currentWord.english}
              </h1>
              <p className="text-white/70 text-sm md:text-base font-medium">클릭하여 뒤집기</p>
            </div>

            {/* Back Side - Korean + Definition + Synonyms */}
            <div
              className="absolute inset-0 rounded-xl shadow-lg flex flex-col items-center justify-start p-6 md:p-10 bg-white overflow-y-auto"
              style={{
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                transform: 'rotateY(180deg) translateZ(1px)',
                transformOrigin: 'center center',
                height: '500px'
              }}
            >
              <p className="text-sm md:text-base font-semibold mb-3 md:mb-4" style={{ color: themeColor }}>한글 뜻</p>
              <h2 className="text-3xl md:text-5xl font-bold mb-4 md:mb-8 break-words text-center px-2" style={{ color: themeColor }}>
                {currentWord.korean}
              </h2>
              
              <div className="w-full max-w-2xl space-y-3 md:space-y-6">
                <div className="bg-gray-50 rounded-lg p-3 md:p-4">
                  <p className="text-xs md:text-sm font-bold text-gray-700 mb-2">영영 정의</p>
                  <p className="text-sm md:text-base text-gray-800 leading-relaxed font-medium break-words">
                    {currentWord.definition}
                  </p>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-3 md:p-4">
                  <p className="text-xs md:text-sm font-bold text-gray-700 mb-2">동의어</p>
                  <p className="text-sm md:text-base text-gray-800 font-medium break-words">
                    {currentWord.synonyms}
                  </p>
                </div>
              </div>
              
              <p className="text-gray-400 text-xs md:text-sm mt-4 md:mt-6 font-medium">클릭하여 뒤집기</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-center flex-shrink-0">
          <div className="flex gap-2">
            {words.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setCurrentIndex(index);
                  setIsFlipped(false);
                }}
                className="w-2 h-2 md:w-3 md:h-3 rounded-full transition-all"
                style={{
                  backgroundColor: index === currentIndex ? themeColor : '#e5e7eb',
                  transform: index === currentIndex ? 'scale(1.5)' : 'scale(1)'
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}