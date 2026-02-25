interface WritingIntroProps {
  onBack?: () => void;
  onNext: () => void;
  onHome: () => void;
  onVolumeClick?: () => void;
}

export function WritingIntro({ onBack, onNext, onHome, onVolumeClick }: WritingIntroProps) {
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
          
          {/* Back Button */}
          {onBack && (
            <button 
              className="flex items-center gap-2 bg-[#0A6068] border border-white rounded-md px-5 py-1.5 hover:bg-[#084d52] transition-colors"
              onClick={onBack}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="white">
                <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
              </svg>
              <span className="text-white font-['Inter',_sans-serif] font-semibold text-base">Back</span>
            </button>
          )}
          
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
          <div className="text-gray-700 font-['Inter',_sans-serif] font-bold border-b-2 border-[#1e6b73] pb-2 inline-block">
            Writing
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto bg-white flex items-center justify-center">
        <div className="max-w-4xl px-8">
          <h2 className="text-3xl font-['Inter',_sans-serif] text-gray-800 mb-8">Writing</h2>
          <div className="w-24 h-1 bg-gray-300 mb-8"></div>
          
          <div className="space-y-6 text-gray-700 font-['Inter',_sans-serif] leading-relaxed">
            <p>
              In the writing section, you will answer 12 questions to demonstrate how well you can write in English. There are three types of tasks.
            </p>

            <div className="my-8">
              <table className="w-full border border-black">
                <thead>
                  <tr className="bg-[#f39c12] text-white">
                    <th className="border border-black px-6 py-3 text-left font-['Inter',_sans-serif]">Type of Task</th>
                    <th className="border border-black px-6 py-3 text-left font-['Inter',_sans-serif]">Description</th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  <tr>
                    <td className="border border-black px-6 py-3 font-['Inter',_sans-serif]">Build a Sentence</td>
                    <td className="border border-black px-6 py-3 font-['Inter',_sans-serif]">Create a grammatical sentence.</td>
                  </tr>
                  <tr>
                    <td className="border border-black px-6 py-3 font-['Inter',_sans-serif]">Write an Email</td>
                    <td className="border border-black px-6 py-3 font-['Inter',_sans-serif]">Write an email using information provided.</td>
                  </tr>
                  <tr>
                    <td className="border border-black px-6 py-3 font-['Inter',_sans-serif]">Write for an Academic Discussion</td>
                    <td className="border border-black px-6 py-3 font-['Inter',_sans-serif]">Participate in an online discussion.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}