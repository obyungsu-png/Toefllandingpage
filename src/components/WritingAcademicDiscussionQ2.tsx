import { useState, useEffect } from 'react';
import { MobileFooter } from './MobileFooter';
import { ImageWithFallback } from './figma/ImageWithFallback';

const fixedDiscussionPhoto = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop&crop=face';

interface WritingAcademicDiscussionQ2Props {
  onBack: () => void;
  onNext: () => void;
  onHome: () => void;
  onVolumeClick?: () => void;
  // CMS-driven content
  professorImageUrl?: string;
  professorName?: string;
  professorMessage?: string;
  student1ImageUrl?: string;
  student1Message?: string;
  student2ImageUrl?: string;
  student2Message?: string;
  promptTitle?: string;
  promptInstructions?: string;
}

export function WritingAcademicDiscussionQ2({
  onBack,
  onNext,
  onHome,
  onVolumeClick,
  professorImageUrl,
  professorName = 'Dr. Achebe',
  professorMessage,
  student1ImageUrl,
  student1Message,
  student2ImageUrl,
  student2Message,
  promptTitle,
  promptInstructions,
}: WritingAcademicDiscussionQ2Props) {
  const [response, setResponse] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [hideWordCount, setHideWordCount] = useState(false);
  const [hideTime, setHideTime] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(600); // 10 minutes in seconds
  const [showTimeDialog, setShowTimeDialog] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [activeTab, setActiveTab] = useState<'passage' | 'response'>('passage');

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 0) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const words = response.trim().split(/\s+/).filter(word => word.length > 0);
    setWordCount(words.length);
  }, [response]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleNextClick = () => {
    setShowTimeDialog(true);
  };

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
          
          <button 
            className="flex items-center gap-2 bg-[#0A6068] border border-white rounded-md px-5 py-1.5 hover:bg-[#084d52] transition-colors"
            onClick={onBack}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="white">
              <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
            </svg>
            <span className="text-white font-['Inter',_sans-serif] font-semibold text-base">Back</span>
          </button>
          
          <button 
            className="flex items-center gap-2 bg-white border-2 border-[#0A6068] rounded-lg px-5 py-2 hover:bg-gray-100 transition-colors"
            onClick={handleNextClick}
          >
            <span className="text-[#0A6068] font-['Inter',_sans-serif] font-semibold text-base">Next</span>
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#0A6068">
              <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Tab with Question number and Timer */}
      <div className="bg-white border-b border-gray-300">
        <div className="px-8 py-3 flex items-center justify-between">
          <div className="text-gray-700 font-['Inter',_sans-serif] font-bold">
            Writing | Question 2 of 2
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-700 font-['Inter',_sans-serif]">
              {!hideTime && formatTime(timeRemaining)}
            </span>
            <button
              onClick={() => setHideTime(!hideTime)}
              className="flex items-center gap-2 text-[#1e6b73] hover:text-[#0A6068] transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
              </svg>
              <span className="font-['Inter',_sans-serif] font-semibold">{hideTime ? 'Show' : 'Hide'} Time</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main content - Split view */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden pb-16 md:pb-0">
        {/* Mobile Tab Navigation */}
        {isMobile && (
          <div className="flex border-b border-gray-300 bg-white">
            <button
              onClick={() => setActiveTab('passage')}
              className={`flex-1 py-3 text-sm font-semibold transition-all ${
                activeTab === 'passage'
                  ? 'text-[#1e6b73] border-b-2 border-[#1e6b73]'
                  : 'text-gray-500'
              }`}
            >
              Passage
            </button>
            <button
              onClick={() => setActiveTab('response')}
              className={`flex-1 py-3 text-sm font-semibold transition-all ${
                activeTab === 'response'
                  ? 'text-[#1e6b73] border-b-2 border-[#1e6b73]'
                  : 'text-gray-500'
              }`}
            >
              Response
            </button>
          </div>
        )}

        {/* Left side - Instructions and Professor's context */}
        <div className={`md:w-1/3 p-4 md:p-8 overflow-auto bg-white border-b md:border-b-0 md:border-r border-gray-300 ${
          isMobile ? (activeTab === 'passage' ? 'block' : 'hidden') : 'block'
        }`}>
          <div className="space-y-4 md:space-y-6">
            <p className="text-[15px] md:text-[17px] text-gray-800 leading-8 font-['Georgia',_serif]">
              Your professor is teaching a class on social studies. Write a post responding to the professor's question.
            </p>

            <div>
              <p className="text-[15px] md:text-[17px] text-gray-900 mb-2 md:mb-3 font-semibold font-['Georgia',_serif]">
                In your response, you should do the following.
              </p>
              <ul className="space-y-1 md:space-y-2 ml-4 md:ml-6">
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 rounded-full bg-black mt-2 flex-shrink-0"></span>
                  <span className="text-[15px] md:text-[17px] text-gray-800 leading-8 font-['Georgia',_serif]">Express and support your opinion.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 rounded-full bg-black mt-2 flex-shrink-0"></span>
                  <span className="text-[15px] md:text-[17px] text-gray-800 leading-8 font-['Georgia',_serif]">Make a contribution to the discussion in your own words.</span>
                </li>
              </ul>
            </div>

            <p className="text-[15px] md:text-[17px] text-gray-800 leading-8 font-['Georgia',_serif]">
              An effective response will contain at least 100 words.
            </p>

            {/* Professor's detailed discussion */}
            <div className="mt-6 md:mt-8 pt-4 md:pt-6 border-t border-gray-300">
              <div className="flex flex-col items-center mb-4 md:mb-6">
                <div className="w-20 h-20 md:w-32 md:h-32 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden mb-2 md:mb-3 border-4 border-[#1e6b73] shadow-sm">
                  <ImageWithFallback src={professorImageUrl || fixedDiscussionPhoto} alt={professorName} className="w-full h-full object-cover" />
                </div>
                <p className="font-bold text-base md:text-lg text-gray-900 font-['Georgia',_serif]">{professorName}</p>
              </div>
              <p className="text-[15px] md:text-[17px] text-gray-800 leading-8 font-['Georgia',_serif]">
                {professorMessage || `Volunteerism refers to the act of offering your time and service without financial compensation to benefit a community, organization, or cause. While many people volunteer mainly to help others, some institutions have mandatory volunteer programs. High schools are one example, where students may be required to complete a certain number of volunteer hours to graduate. What do you think? Should high school students be required to do volunteer work? Why or why not?`}
              </p>
            </div>
          </div>
        </div>

        {/* Right side - Students' responses and writing area */}
        <div className={`md:w-2/3 p-4 md:p-8 overflow-auto bg-[#f8f7f3] ${
          isMobile ? (activeTab === 'response' ? 'block' : 'hidden') : 'block'
        }`}>
          <div className="space-y-4 md:space-y-6 mb-6 md:mb-8">
            {/* Student 1 */}
            <div className="flex items-start gap-3 md:gap-4 rounded-2xl bg-white/80 p-4 shadow-sm border border-[#e7e3d7]">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden border-2 border-[#c9b99b]">
                <ImageWithFallback src={student1ImageUrl || fixedDiscussionPhoto} alt="Student 1" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1">
                <p className="text-[15px] md:text-[17px] text-gray-800 leading-8 font-['Georgia',_serif]">
                  {student1Message || `Yes, I think high schools should require volunteer hours because it helps students build a sense of civic responsibility. Many teenagers don't naturally think about helping others, and this requirement can introduce them to the idea that their time and effort can make a real difference in the lives of others.`}
                </p>
              </div>
            </div>

            {/* Student 2 */}
            <div className="flex items-start gap-3 md:gap-4 rounded-2xl bg-white/80 p-4 shadow-sm border border-[#e7e3d7]">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden border-2 border-[#c9b99b]">
                <ImageWithFallback src={student2ImageUrl || fixedDiscussionPhoto} alt="Student 2" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1">
                <p className="text-[15px] md:text-[17px] text-gray-800 leading-8 font-['Georgia',_serif]">
                  {student2Message || `I don't think volunteer hours should be required because many students already have limited free time. Some have part-time jobs or take care of younger siblings after school. Adding a mandatory volunteer requirement could create extra stress and make it harder for those students to balance their existing responsibilities.`}
                </p>
              </div>
            </div>
          </div>

          {/* Your Response section */}
          <div className="bg-white rounded-[24px] p-5 md:p-7 shadow-sm border border-[#ddd4c4]">
            <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-3 md:mb-4 font-['Georgia',_serif]">Your Response:</h3>

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-4 border-b border-gray-300">
              <div className="flex flex-wrap items-center gap-2">
                <button className="px-3 py-1.5 md:px-4 md:py-2 bg-[#1e6b73] text-white text-sm rounded hover:bg-[#0A6068] transition-colors">
                  Cut
                </button>
                <button className="px-3 py-1.5 md:px-4 md:py-2 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300 transition-colors">
                  Paste
                </button>
                <button className="px-3 py-1.5 md:px-4 md:py-2 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300 transition-colors">
                  Undo
                </button>
                <button className="px-3 py-1.5 md:px-4 md:py-2 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300 transition-colors">
                  Redo
                </button>
              </div>
              
              <button
                onClick={() => setHideWordCount(!hideWordCount)}
                className="flex items-center gap-2 text-[#1e6b73] hover:text-[#0A6068] transition-colors"
              >
                <svg className="w-4 h-4 md:w-5 md:h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                </svg>
                <span className="text-sm font-['Georgia',_serif] font-semibold">{hideWordCount ? 'Show' : 'Hide'} Word Count</span>
                {!hideWordCount && <span className="ml-2 text-gray-700 text-sm">{wordCount}</span>}
              </button>
            </div>

            {/* Text area */}
            <textarea
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              className="w-full h-64 md:h-[30rem] p-4 md:p-5 text-[15px] md:text-[17px] leading-8 font-['Georgia',_serif] border border-[#d6d0c2] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#1e6b73] resize-none"
              placeholder="Write your response here..."
            />
          </div>
        </div>
      </div>

      {/* Time Remaining Dialog */}
      {showTimeDialog && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4 shadow-2xl">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Time Remaining</h2>
            
            <div className="space-y-4 text-gray-700 mb-8">
              <p>
                You still have time to respond. As long as there is time remaining, you can keep writing or revise your response.
              </p>
              <p>
                Select <span className="font-bold">Back</span> to keep writing or revising.
              </p>
              <p>
                Select <span className="font-bold">Continue</span> to leave this question.
              </p>
              <p className="font-bold">
                Once you leave this question, you WILL NOT be able to return to it.
              </p>
            </div>

            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => setShowTimeDialog(false)}
                className="px-8 py-3 bg-[#0A6068] text-white rounded-lg hover:bg-[#084d52] transition-colors font-semibold"
              >
                Back
              </button>
              <button
                onClick={() => {
                  setShowTimeDialog(false);
                  onNext();
                }}
                className="px-8 py-3 bg-white border-2 border-[#0A6068] text-[#0A6068] rounded-lg hover:bg-gray-100 transition-colors font-semibold"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Footer */}
      <MobileFooter
        onBack={onBack}
        onNext={handleNextClick}
        onHome={onHome}
        onVolumeClick={onVolumeClick}
      />
    </div>
  );
}