import React
import { Pause, Play } from 'lucide-react';, { useState, useEffect, useRef } from 'react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { MobileFooter } from './MobileFooter';
import { RadioOption } from './RadioOption';

interface ListeningM2Q3Props {
  onBack: () => void;
  onNext: () => void;
  onHome: () => void;
  onVolumeClick: () => void;
  imageUrl?: string;
  audioUrl?: string;
}

export function ListeningM2Q3({ onBack, onNext, onHome, onVolumeClick, imageUrl, audioUrl }: ListeningM2Q3Props) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  // Audio: auto-play 1s after mount, replay via button
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioPlayedRef = useRef(false);
  const [isPlaying, setIsPlaying] = React.useState(false);

  useEffect(() => {
    audioPlayedRef.current = false;
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    setIsPlaying(false);
  }, [audioUrl]);

  useEffect(() => {
    if (audioUrl && !audioPlayedRef.current) {
      audioPlayedRef.current = true;
      const timer = setTimeout(() => {
        const audio = new Audio(audioUrl);
        audioRef.current = audio;
        audio.play().then(() => setIsPlaying(true)).catch(() => {});
        audio.onended = () => setIsPlaying(false);
      }, 1000);
      return () => { clearTimeout(timer); if (audioRef.current) { audioRef.current.pause(); } };
    }
  }, [audioUrl]);

  const handlePlayAudio = () => {
    if (!audioUrl) return;
    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
      return;
    }
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      audio.play().then(() => setIsPlaying(true)).catch(() => {});
      audio.onended = () => setIsPlaying(false);
    }
  };


  const answerOptions = [
    "Every Wednesday.",
    "In aisle 4.",
    "The cinema is not open today.",
    "Let's go together."
  ];

  return (
    <div className="fixed inset-0 bg-gray-50 z-50 flex flex-col">
      {/* Top Header */}
      <div className="bg-[#1e6b73] h-16 flex items-center justify-between px-8 shadow-lg">
        <div className="flex items-center">
          <div 
            className="text-white text-2xl font-['Inter',_sans-serif] font-bold tracking-wide cursor-pointer hover:opacity-80 transition-opacity"
            onClick={onHome}
          >
            *toefl ibt
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Volume Button */}
          <button 
            className="flex items-center gap-3 bg-[#0A6068] border border-white rounded-lg px-5 py-2 hover:bg-[#084d52] transition-colors"
            onClick={onVolumeClick}
          >
            <span className="text-white font-['Inter',_sans-serif] font-semibold text-base">Volume</span>
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="white">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
            </svg>
          </button>
          
          {/* Back Button */}
          <button 
            className="flex items-center gap-2 bg-[#0A6068] border border-white rounded-lg px-5 py-2 hover:bg-[#084d52] transition-colors"
            onClick={onBack}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="white">
              <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
            </svg>
            <span className="text-white font-['Inter',_sans-serif] font-semibold text-base">Back</span>
          </button>
          
          {/* Next Button */}
          <button 
            className="flex items-center gap-2 bg-white border-2 border-[#0A6068] rounded-lg px-5 py-2 hover:bg-gray-100 transition-colors"
            onClick={onNext}
          >
            <span className="text-[#0A6068] font-['Inter',_sans-serif] font-semibold text-base">Next</span>
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#0A6068">
              <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Tab with Question number */}
      <div className="bg-white border-b border-gray-300">
        <div className="px-8 py-3">
          <div className="flex gap-8">
            <div className="text-gray-700 font-['Inter',_sans-serif] font-bold border-b-2 border-[#1e6b73] pb-2">
              Listening
            </div>
            <div className="text-gray-500 text-sm font-['Inter',_sans-serif] font-medium self-end pb-2">
              Question 3 of 16
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 p-4 md:p-8 overflow-auto bg-white border border-black pb-20 md:pb-8">
        <div className="w-full">
          {/* Mobile: Image -> Question -> Options */}
          <div className="md:hidden flex flex-col items-center">
            <ImageWithFallback 
              src={imageUrl || "figma:asset/8dff692d23dd45f1754de714cf1d6d15abccd0a8.png"}
              alt="Man in pink shirt"
              className="w-40 h-auto object-contain mb-6"
            />
            
            {/* Play Audio Button */}
            {audioUrl && (
              <button
                onClick={handlePlayAudio}
                disabled={isPlaying}
                className={`flex items-center gap-3 px-8 py-3 rounded-full font-semibold text-base mb-6 transition-all shadow-sm ${isPlaying ? 'bg-[#0d9488] text-white cursor-not-allowed' : 'bg-[#f0f0f0] text-[#1e293b] hover:bg-[#e2e8f0]'}`}
              >
                <span style={{fontSize:'0px',width:0,height:0,borderStyle:'solid',borderWidth:'7px 0 7px 12px',borderColor:`transparent transparent transparent ${isPlaying?'white':'#1e293b'}`,display:'inline-block'}} />
                <span>{isPlaying ? 'Playing...' : 'Play Audio'}</span>
              </button>
            )}

            <h2 className="text-lg font-['Inter',_sans-serif] font-bold text-gray-800 mb-6 text-center px-4">
              Choose the best response.
            </h2>
            
            <div className="w-full max-w-2xl px-8">
              <div className="space-y-5">
                {answerOptions.map((option, index) => (
                  <RadioOption
                    key={index}
                    id={`m2-q3-option-${index}`}
                    name="m2-q3"
                    value={option}
                    checked={selectedAnswer === option}
                    onChange={() => setSelectedAnswer(option)}
                    label={option}
                    labelClassName="text-xl font-['Inter',_sans-serif] text-gray-900"
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Desktop: Original layout */}
          <div className="hidden md:block">
            {/* Play Audio Button - Desktop */}
            {audioUrl && (
              <div className="flex justify-center mb-8">
                <button
                  onClick={handlePlayAudio}
                  disabled={isPlaying}
                  className={`flex items-center gap-3 px-10 py-3 rounded-full font-semibold text-base transition-all shadow-sm ${isPlaying ? 'bg-[#0d9488] text-white cursor-not-allowed' : 'bg-[#f0f0f0] text-[#1e293b] hover:bg-[#e2e8f0]'}`}
                >
                  <span style={{fontSize:'0px',width:0,height:0,borderStyle:'solid',borderWidth:'7px 0 7px 12px',borderColor:`transparent transparent transparent ${isPlaying?'white':'#1e293b'}`,display:'inline-block'}} />
                  <span>{isPlaying ? 'Playing...' : 'Play Audio'}</span>
                </button>
              </div>
            )}
                        <h2 className="text-3xl font-['Inter',_sans-serif] font-bold text-gray-800 mb-8 text-center">Choose the best response.</h2>
            <div className="relative" style={{minHeight: '420px'}}>
              <div style={{position: 'absolute', left: '18%', top: 0, width: '280px'}}>
                <ImageWithFallback 
                  src={imageUrl || "figma:asset/8dff692d23dd45f1754de714cf1d6d15abccd0a8.png"}
                  alt="Man in pink shirt"
                  className="w-full object-contain object-top" style={{maxHeight:'480px'}}
                />
              </div>
              <div style={{position: 'absolute', left: '51%', top: '8px', width: '42%'}}>
                <div className="space-y-7">
                  {answerOptions.map((option, index) => (
                    <RadioOption
                      key={index}
                      id={`m2-q3-option-${index}`}
                      name="m2-q3"
                      value={option}
                      checked={selectedAnswer === option}
                      onChange={() => setSelectedAnswer(option)}
                      label={option}
                    labelClassName="text-xl font-['Inter',_sans-serif] text-gray-900"
                  />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <MobileFooter onBack={onBack} onHome={onHome} onNext={onNext} />
    </div>
  );
}