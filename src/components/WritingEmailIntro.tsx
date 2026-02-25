interface WritingEmailIntroProps {
  onNext: () => void;
  onHome: () => void;
  onVolumeClick?: () => void;
}

export function WritingEmailIntro({ onNext, onHome, onVolumeClick }: WritingEmailIntroProps) {
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
          {/* Help Button */}
          <button 
            className="flex items-center gap-2 bg-transparent border border-white rounded-lg px-5 py-2 hover:bg-white/10 transition-colors"
          >
            <span className="text-white font-['Inter',_sans-serif] font-semibold text-base">Help</span>
            <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center">
              <span className="text-[#1e6b73] font-bold text-sm">?</span>
            </div>
          </button>
          
          {/* Volume Button */}
          {onVolumeClick && (
            <button 
              className="flex items-center gap-3 bg-[#0A6068] border border-white rounded-md px-5 py-1.5 hover:bg-[#084d52] transition-colors"
              onClick={onVolumeClick}
            >
              <span className="text-white font-['Inter',_sans-serif] font-semibold text-base">Volume</span>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="white">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
              </svg>
            </button>
          )}
          
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

      {/* Tab with Section name */}
      <div className="bg-white border-b border-gray-300">
        <div className="px-8 py-3">
          <div className="text-gray-700 font-['Inter',_sans-serif] font-bold">
            Writing
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 p-8 overflow-auto bg-white border border-black">
        <div className="max-w-3xl mx-auto pt-12">
          <h2 className="text-3xl font-['Inter',_sans-serif] text-gray-700 mb-16">
            Write an Email
          </h2>
          
          <div className="border-b border-gray-300 mb-8"></div>
          
          <div className="space-y-6">
            <p className="text-lg font-['Inter',_sans-serif] text-gray-600">
              You will read some information and use the information to write an email.
            </p>
            
            <p className="text-lg font-['Inter',_sans-serif] text-gray-600">
              You will have 7 minutes to write the email.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}