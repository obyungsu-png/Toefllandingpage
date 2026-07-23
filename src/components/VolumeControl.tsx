import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface VolumeControlProps {
  isOpen: boolean;
  onClose: () => void;
  buttonRef: React.RefObject<HTMLButtonElement | null>;
}

export function VolumeControl({ isOpen, onClose, buttonRef }: VolumeControlProps) {
  const [volume, setVolume] = useState(75);
  const [position, setPosition] = useState({ top: 0, right: 0 });
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Set initial volume for all audio elements
    const audioElements = document.querySelectorAll('audio');
    audioElements.forEach(audio => {
      audio.volume = volume / 100;
    });
  }, [volume]);

  useEffect(() => {
    if (isOpen && buttonRef && buttonRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      // Calculate position so the right edge of the dropdown aligns with the right edge of the button
      // Fixed positioning uses viewport coordinates, so no need to add window.scrollY
      setPosition({
        top: buttonRect.bottom + 1,
        right: window.innerWidth - buttonRect.right - 6 // Shift 6px to the right
      });
    }
  }, [isOpen, buttonRef]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose, buttonRef]);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = Number(e.target.value);
    setVolume(newVolume);

    // Update all audio elements
    const audioElements = document.querySelectorAll('audio');
    audioElements.forEach(audio => {
      audio.volume = newVolume / 100;
    });

    // Store volume preference
    localStorage.setItem('toefl-volume', newVolume.toString());
  };

  // Load saved volume on mount
  useEffect(() => {
    const savedVolume = localStorage.getItem('toefl-volume');
    if (savedVolume) {
      const vol = Number(savedVolume);
      setVolume(vol);
      
      // Apply to all audio elements
      const audioElements = document.querySelectorAll('audio');
      audioElements.forEach(audio => {
        audio.volume = vol / 100;
      });
    }
  }, []);

  // Calculate the filled bars based on volume (0-100)
  const totalBars = 20;
  const filledBars = Math.round((volume / 100) * totalBars);

  if (!isOpen) return null;

  return (
    <div 
      ref={dropdownRef}
      className="fixed z-[60] bg-white rounded-[24px] shadow-2xl border border-[#1e6b73]"
      style={{
        top: `${position.top}px`,
        right: `${position.right}px`,
        width: '280px',
        padding: '12px 10px' // Reduced from 14px 12px
      }}
    >
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-1.5 right-1.5 text-gray-600 hover:text-gray-900 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Volume Bars */}
      <div className="flex items-end justify-center gap-1 mb-2 h-10"> {/* Reduced mb-3 to mb-2, h-12 to h-10 */}
        {Array.from({ length: totalBars }).map((_, index) => {
          const barHeight = 14 + (index * 1.4); // Reduced from 16 + (index * 1.6)
          const isFilled = index < filledBars;
          
          return (
            <div
              key={index}
              className={`w-2.5 rounded-full transition-all duration-200 ${
                isFilled ? 'bg-[#1e6b73]' : 'bg-[#C0C0C0]'
              }`}
              style={{ height: `${barHeight}px` }}
            />
          );
        })}
      </div>

      {/* Slider */}
      <div className="relative flex items-center">
        <input
          type="range"
          min="0"
          max="100"
          value={volume}
          onChange={handleVolumeChange}
          className="w-full slider-thumb"
        />
      </div>

      <style>{`
        .slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 6px;
          background: transparent;
          outline: none;
          padding: 0;
          margin: 0;
        }
        
        .slider-thumb::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 24px;
          height: 24px;
          background: #1e6b73;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          position: relative;
          margin-top: -9px;
        }
        
        .slider-thumb::-moz-range-thumb {
          width: 24px;
          height: 24px;
          background: #1e6b73;
          border-radius: 50%;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
        
        .slider-thumb::-webkit-slider-runnable-track {
          width: 100%;
          height: 6px;
          background: linear-gradient(to right, #1e6b73 0%, #1e6b73 ${volume}%, #d1d5db ${volume}%, #d1d5db 100%);
          border-radius: 3px;
        }
        
        .slider-thumb::-moz-range-track {
          width: 100%;
          height: 6px;
          background: #d1d5db;
          border-radius: 3px;
        }
        
        .slider-thumb::-moz-range-progress {
          height: 6px;
          background: #1e6b73;
          border-radius: 3px;
        }
      `}</style>
    </div>
  );
}

// Hook to provide volume control to components
export function useVolumeControl() {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const toggleVolume = () => {
    setIsOpen(prev => !prev);
  };

  const closeVolume = () => {
    setIsOpen(false);
  };

  return {
    isOpen,
    buttonRef,
    toggleVolume,
    closeVolume
  };
}