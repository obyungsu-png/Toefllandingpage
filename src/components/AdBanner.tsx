import { Button } from "./ui/button";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { useState } from "react";
import { AdDetailPopup } from "./AdDetailPopup";
import type { Advertisement } from "./AdManagement";

interface AdBannerProps {
  image?: string;
  title?: string;
  description?: string;
  size?: 'small' | 'medium' | 'large';
  onButtonClick?: () => void;
  // New: Support Advertisement object
  advertisement?: Advertisement;
}

export function AdBanner({ 
  image, 
  title, 
  description, 
  size = 'medium', 
  onButtonClick,
  advertisement 
}: AdBannerProps) {
  const [showPopup, setShowPopup] = useState(false);

  // Use advertisement data if provided, otherwise use individual props
  const displayImage = advertisement?.imageUrl || image || '';
  const displayTitle = advertisement?.title || title || '';
  const displayDescription = advertisement?.description || description || '';
  const ctaText = advertisement?.ctaText || 'Learn More';

  const heights = {
    small: 'h-32',
    medium: 'h-48',
    large: 'h-64'
  };

  const handleButtonClick = () => {
    if (advertisement) {
      setShowPopup(true);
    } else if (onButtonClick) {
      onButtonClick();
    }
  };

  return (
    <>
      <div className={`relative ${heights[size]} rounded-xl overflow-hidden shadow-lg group`}>
        {/* Background Image */}
        <div className="absolute inset-0">
          <ImageWithFallback
            src={displayImage}
            alt={displayTitle}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#005f61]/85 via-[#1e6b73]/75 to-transparent" />
        </div>

        {/* Content */}
        <div className="relative h-full flex items-center px-8">
          <div className="max-w-2xl">
            <h3 className="text-white mb-2 text-2xl font-bold">{displayTitle}</h3>
            <p className="text-white/95 text-sm mb-4 max-w-xl">{displayDescription}</p>
            {(onButtonClick || advertisement) && (
              <Button
                onClick={handleButtonClick}
                className="bg-[#f39c12] text-white hover:bg-[#e67e22] transition-all shadow-md hover:shadow-lg transform hover:scale-105"
              >
                {ctaText} →
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Popup */}
      {advertisement && (
        <AdDetailPopup
          ad={advertisement}
          isOpen={showPopup}
          onClose={() => setShowPopup(false)}
        />
      )}
    </>
  );
}