import React, { useState, useEffect, useRef } from 'react';
import { MobileFooter } from './MobileFooter';
import { RadioOption } from './RadioOption';

interface ListeningM2Q10Props {
  onBack: () => void;
  onNext: () => void;
  onHome: () => void;
  onVolumeClick: () => void;
  imageUrl?: string;
  audioUrl?: string;
}

export function ListeningM2Q10({ onBack, onNext, onHome, onVolumeClick, imageUrl, audioUrl }: ListeningM2Q10Props) {
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
    if (!audioUrl || isPlaying) return;
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; }
    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    audio.play().then(() => setIsPlaying(true)).catch(() => {});
    audio.onended = () => setIsPlaying(false);
  };


  const answerOptions = [
    "The device is cheaper.",
    "The device is easier to use on the go.",
    "The device has a larger screen.",
    "The device has better battery life."
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
              Question 10 of 16
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 p-4 md:p-8 overflow-auto bg-white border border-black pb-20 md:pb-8">
        <div className="max-w-5xl mx-auto">
          {/* Mobile: Image -> Question -> Options */}
          <div className="md:hidden flex flex-col items-center">
            <div className="w-48 h-48 bg-gray-200 rounded-lg overflow-hidden flex items-center justify-center mb-6">
              <svg className="w-20 h-20 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <polyline points="21 15 16 10 5 21"></polyline>
              </svg>
            </div>
            
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
              What reason does the woman give for her suggestion?
            </h2>
            
            <div className="w-full max-w-2xl px-8">
              <div className="space-y-5">
                {answerOptions.map((option, index) => (
                  <RadioOption
                    key={index}
                    id={`m2-q10-option-${index}`}
                    name="m2-q10"
                    value={option}
                    checked={selectedAnswer === option}
                    onChange={() => setSelectedAnswer(option)}
                    label={option}
                    labelClassName="text-lg"
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
<div className="flex flex-row gap-6 items-center justify-center pl-4 mt-4">
              <div className="flex-shrink-0">
                <div className="w-[600px] h-[600px] bg-gray-200 rounded-lg overflow-hidden flex items-center justify-center">
                  <svg className="w-24 h-24 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                    <polyline points="21 15 16 10 5 21"></polyline>
                  </svg>
                </div>
              </div>
              <div className="flex-1 max-w-xl mt-8">
                <h2 className="text-lg font-['Inter',_sans-serif] font-bold text-gray-800 mb-6">What reason does the woman give for her suggestion?</h2>
                <div className="space-y-6">
                  {answerOptions.map((option, index) => (
                    <RadioOption
                      key={index}
                      id={`m2-q10-option-${index}`}
                      name="m2-q10"
                      value={option}
                      checked={selectedAnswer === option}
                      onChange={() => setSelectedAnswer(option)}
                      label={option}
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