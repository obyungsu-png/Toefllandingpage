import React, { useState } from 'react';
import { Button } from './ui/button';
import { Advertisement } from './AdManagement';
import { AdModal } from './AdModal';

type TestSetRange = '1-4' | '5-8' | '9-12' | '13-16' | '17-20';

interface TPOTest {
  id: string;
  testNumber: number;
  testType: 'TPO' | 'Test';
  reading?: {
    passages: any[];
    questions: any[];
  };
  listening?: any;
  speaking?: any;
  writing?: any;
}

interface TPOPageProps {
  isMobile: boolean;
  activeTestSetRange: TestSetRange;
  setActiveTestSetRange: (range: TestSetRange) => void;
  tpoTests: TPOTest[];
  isContentLocked: (index: number, freeCount: number) => boolean;
  setActiveTab: (tab: string) => void;
  setCurrentTest: (test: { tpoNumber: number; section: string }) => void;
  setTestBankType: (type: string) => void;
  setShowListeningIntro: (show: boolean) => void;
  setShowReadingIntro: (show: boolean) => void;
  setShowWritingIntro: (show: boolean) => void;
  setShowSpeakingIntro: (show: boolean) => void;
  setShowToeflTest: (show: boolean) => void;
  TPOCard: any;
  TestCard: any;
  advertisements?: Advertisement[];
}

export function TPOPage({
  isMobile,
  activeTestSetRange,
  setActiveTestSetRange,
  tpoTests,
  isContentLocked,
  setActiveTab,
  setCurrentTest,
  setTestBankType,
  setShowListeningIntro,
  setShowReadingIntro,
  setShowWritingIntro,
  setShowSpeakingIntro,
  setShowToeflTest,
  TPOCard,
  TestCard,
  advertisements
}: TPOPageProps) {
  
  const getTestNumbers = (): number[] => {
    const rangeMap: { [key in TestSetRange]: number[] } = {
      '1-4': [1, 2, 3, 4],
      '5-8': [5, 6, 7, 8],
      '9-12': [9, 10, 11, 12],
      '13-16': [13, 14, 15, 16],
      '17-20': [17, 18, 19, 20]
    };
    return rangeMap[activeTestSetRange] || [1, 2, 3, 4];
  };

  // Get active advertisements for TPO page
  const activeAds = advertisements?.filter(ad => 
    ad.isActive && ad.locations?.includes('TPO')
  ) || [];
  const displayAd = activeAds.length > 0 ? activeAds[0] : null;

  // Debug logging
  console.log('🔍 TPOPage - All advertisements:', advertisements);
  console.log('🔍 TPOPage - Active ads for TPO:', activeAds);
  console.log('🔍 TPOPage - Display ad:', displayAd);

  // State to manage ad modal visibility
  const [isAdModalOpen, setIsAdModalOpen] = useState(false);

  return (
    <div className="bg-white relative shrink-0 w-full shadow-sm pb-24 md:pb-0">
      {/* Ad Modal */}
      {displayAd && (
        <AdModal 
          ad={displayAd} 
          isOpen={isAdModalOpen} 
          onClose={() => setIsAdModalOpen(false)} 
        />
      )}

      {/* Advertisement Banner */}
      {displayAd && (
        <div className="border-b border-gray-200">
          <div className="w-full md:max-w-7xl md:mx-auto px-4 md:px-8 py-3 md:py-4">
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-3 md:p-4 flex flex-col md:flex-row items-center gap-3 md:gap-4">
              {/* Left Image - Hidden on mobile */}
              {displayAd.imageUrl && (
                <div className="hidden md:block shrink-0 w-24 h-24 rounded-lg overflow-hidden">
                  <img 
                    src={displayAd.imageUrl}
                    alt={displayAd.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              
              {/* Right Content */}
              <div className="flex-1 flex flex-col md:flex-row items-center justify-between gap-3 w-full">
                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-[#2d5a5d] mb-1 text-sm md:text-base font-bold">{displayAd.title}</h3>
                  <p className="text-gray-600 text-xs md:text-sm">
                    {displayAd.content}
                  </p>
                </div>
                {displayAd.buttonText && (
                  <Button
                    onClick={() => setIsAdModalOpen(true)}
                    className="bg-[#f39c12] text-white hover:bg-[#e67e22] transition-colors shadow-md hover:shadow-lg px-4 md:px-5 py-2 md:py-4 shrink-0 rounded-full text-xs md:text-sm w-full md:w-auto"
                  >
                    {displayAd.buttonText}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Test Sets Section */}
      <div className="border-b border-gray-200">
        <div className="w-full md:max-w-7xl md:mx-auto px-4 md:px-8 py-3 md:py-4">
          <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-8">
            <span className="text-sm md:text-lg font-bold text-[#2d5a5d]">Test Sets:</span>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {[
                { range: '1-4' as TestSetRange, start: 1, end: 4 },
                { range: '5-8' as TestSetRange, start: 5, end: 8 },
                { range: '9-12' as TestSetRange, start: 9, end: 12 },
                { range: '13-16' as TestSetRange, start: 13, end: 16 },
                { range: '17-20' as TestSetRange, start: 17, end: 20 }
              ].map((group, index) => (
                <button 
                  key={group.range}
                  className={`px-3 md:px-4 py-2 rounded-lg font-bold text-xs md:text-sm transition-all duration-300 transform hover:scale-105 shadow-sm min-w-[55px] md:min-w-[60px] flex-shrink-0 ${
                    activeTestSetRange === group.range 
                      ? 'bg-gradient-to-r from-[#d35400] to-[#e67e22] text-white shadow-md' 
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                  }`}
                  onClick={() => setActiveTestSetRange(group.range)}
                >
                  {group.range}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* TPO Cards Grid */}
      <div className="!w-full py-4 md:py-8">
        <div className="!w-full md:max-w-7xl md:mx-auto px-3 md:px-8">
          <div className="flex flex-col items-center md:items-stretch md:grid md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 !w-full">
            {getTestNumbers().map((number, index) => {
              const tpoData = tpoTests.find(t => t.testType === 'TPO' && t.testNumber === number);
              
              const handleStartTest = (section: string) => {
                setCurrentTest({ tpoNumber: number, section });
                setTestBankType('tpo');
                
                if (section === 'Listening') {
                  setShowListeningIntro(true);
                } else if (section === 'Reading') {
                  setShowReadingIntro(true);
                } else if (section === 'Writing') {
                  setShowWritingIntro(true);
                } else if (section === 'Speaking') {
                  setShowSpeakingIntro(true);
                } else {
                  setShowToeflTest(true);
                }
              };
              
              return (
                <div key={number} className="w-full max-w-full">
                  {isMobile ? (
                    <TestCard 
                      number={number}
                      isLocked={isContentLocked(index, 3)}
                      onUnlockClick={() => setActiveTab('Pricing')}
                      testData={tpoData}
                      customTitle={`TPO ${number}`}
                      onStartTest={handleStartTest}
                    />
                  ) : (
                    <TPOCard 
                      number={number}
                      isLocked={isContentLocked(index, 3)}
                      onUnlockClick={() => setActiveTab('Pricing')}
                      testData={tpoData}
                      onStartTest={handleStartTest}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Pagination */}
      <div className="pb-12">
        <div className="w-full md:max-w-7xl md:mx-auto px-4 md:px-8">
          <div className="flex items-center justify-center gap-2">
            <button 
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={activeTestSetRange === '1-4'}
              onClick={() => {
                const ranges: TestSetRange[] = ['1-4', '5-8', '9-12', '13-16', '17-20'];
                const currentIndex = ranges.indexOf(activeTestSetRange);
                if (currentIndex > 0) {
                  setActiveTestSetRange(ranges[currentIndex - 1]);
                }
              }}
            >
              &lt; Previous
            </button>
            
            {[
              { range: '1-4' as TestSetRange, page: 1 },
              { range: '5-8' as TestSetRange, page: 2 },
              { range: '9-12' as TestSetRange, page: 3 },
              { range: '13-16' as TestSetRange, page: 4 },
              { range: '17-20' as TestSetRange, page: 5 }
            ].map((item) => (
              <button
                key={item.range}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-all duration-300 min-w-[40px] ${
                  activeTestSetRange === item.range
                    ? 'bg-gradient-to-r from-[#d35400] to-[#e67e22] text-white shadow-md'
                    : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 hover:text-gray-900'
                }`}
                onClick={() => setActiveTestSetRange(item.range)}
              >
                {item.page}
              </button>
            ))}

            <button 
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={activeTestSetRange === '17-20'}
              onClick={() => {
                const ranges: TestSetRange[] = ['1-4', '5-8', '9-12', '13-16', '17-20'];
                const currentIndex = ranges.indexOf(activeTestSetRange);
                if (currentIndex < ranges.length - 1) {
                  setActiveTestSetRange(ranges[currentIndex + 1]);
                }
              }}
            >
              Next &gt;
            </button>
          </div>

          {/* Page info */}
          <div className="text-center mt-4">
            <p className="text-sm text-gray-600 font-['Inter',_sans-serif]">
              Page {(() => {
                switch (activeTestSetRange) {
                  case '1-4': return 1;
                  case '5-8': return 2;
                  case '9-12': return 3;
                  case '13-16': return 4;
                  case '17-20': return 5;
                  default: return 1;
                }
              })()} of 5 • Showing TPO {activeTestSetRange} • Total: 75 TPO Tests Available
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}