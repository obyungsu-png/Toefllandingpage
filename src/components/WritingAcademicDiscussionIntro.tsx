interface WritingAcademicDiscussionIntroProps {
  onBegin: () => void;
  onHome: () => void;
}

export function WritingAcademicDiscussionIntro({ onBegin, onHome }: WritingAcademicDiscussionIntroProps) {
  return (
    <div className="fixed inset-0 bg-gray-50 z-50 flex flex-col">
      {/* Top Header */}
      <div className="bg-[#1e6b73] h-16 flex items-center justify-end px-8 shadow-lg">
        <button 
          className="flex items-center gap-2 bg-white border-2 border-white rounded-lg px-6 py-2 hover:bg-gray-100 transition-colors"
          onClick={onBegin}
        >
          <span className="text-[#0A6068] font-['Inter',_sans-serif] font-semibold text-base">Begin</span>
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#0A6068">
            <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/>
          </svg>
        </button>
      </div>

      {/* Tab */}
      <div className="bg-white border-b border-gray-300">
        <div className="px-8 py-3">
          <div className="text-gray-700 font-['Inter',_sans-serif] font-bold">
            Writing
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center p-8 overflow-auto bg-white">
        <div className="max-w-2xl w-full">
          <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center pb-4 border-b-2 border-gray-300">
            Write for an Academic Discussion
          </h2>
          
          <div className="space-y-6 text-gray-700">
            <p className="leading-relaxed">
              A professor has posted a question about a topic and students have responded with their thoughts and ideas. Make a contribution to the discussion.
            </p>
            
            <p className="leading-relaxed">
              You will have 10 minutes to write.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
