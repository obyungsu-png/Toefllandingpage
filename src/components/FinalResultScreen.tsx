import React from 'react';
import type { SectionScores } from './EndSpeakingScreen';

interface FinalResultScreenProps {
  setShowFinalResult: React.Dispatch<React.SetStateAction<boolean>>;
  testBankType: string;
  handleTabChange: (tab: string) => void;
  setActiveTab: React.Dispatch<React.SetStateAction<string>>;
  sectionScores: SectionScores;
}

const FinalResultScreen: React.FC<FinalResultScreenProps> = ({
  setShowFinalResult,
  testBankType,
  handleTabChange,
  setActiveTab,
  sectionScores
}) => {
  const convertToBandScore = (rawScore30: number): number => {
    if (rawScore30 >= 29) return 6.0;
    if (rawScore30 >= 25) return 5.5;
    if (rawScore30 >= 22) return 5.0;
    if (rawScore30 >= 19) return 4.5;
    if (rawScore30 >= 16) return 4.0;
    if (rawScore30 >= 13) return 3.5;
    if (rawScore30 >= 10) return 3.0;
    if (rawScore30 >= 7) return 2.5;
    if (rawScore30 >= 4) return 2.0;
    if (rawScore30 >= 2) return 1.5;
    return 1.0;
  };

  const readingRaw = sectionScores.reading 
    ? Math.max(0, Math.min(30, Math.round((sectionScores.reading.correct / sectionScores.reading.total) * 28 + 1)))
    : 0;
  
  const listeningRaw = sectionScores.listening
    ? Math.max(0, Math.min(30, Math.round((sectionScores.listening.correct / sectionScores.listening.total) * 28 + 1)))
    : 0;
  
  const writingRaw = sectionScores.writing?.score || 0;
  const speakingRaw = sectionScores.speaking?.score || 0;

  const readingBand = convertToBandScore(readingRaw);
  const listeningBand = convertToBandScore(listeningRaw);
  const writingBand = convertToBandScore(writingRaw);
  const speakingBand = convertToBandScore(speakingRaw);

  const totalBand = Math.round((readingBand + listeningBand + writingBand + speakingBand) / 4 * 2) / 2;
  const overallLevel = getCEFRLevel(totalBand);
  const legacyTotal = readingRaw + listeningRaw + writingRaw + speakingRaw;

  function getCEFRLevel(band: number) {
    if (band >= 5.5) return { cefr: 'C2', label: 'Expert / Mastery', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' };
    if (band >= 4.5) return { cefr: 'C1', label: 'Advanced', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' };
    if (band >= 3.5) return { cefr: 'B2', label: 'Upper-Intermediate', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' };
    if (band >= 2.5) return { cefr: 'B1', label: 'Intermediate', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' };
    if (band >= 1.5) return { cefr: 'A2', label: 'Elementary', color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' };
    return { cefr: 'A1', label: 'Beginner', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' };
  }

  const sections = [
    {
      name: 'Reading', band: readingBand, raw: readingRaw,
      rawTotal: sectionScores.reading ? sectionScores.reading.total : '-',
      icon: (<><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></>),
      color: '#1e6b73', bgClass: 'bg-[#f0fafa]', barColor: 'bg-[#1e6b73]', barBg: 'bg-[#d1e8e8]',
    },
    {
      name: 'Listening', band: listeningBand, raw: listeningRaw,
      rawTotal: sectionScores.listening ? sectionScores.listening.total : '-',
      icon: (<><path d="M3 18v-6a9 9 0 0118 0v6"/><path d="M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3zM3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3z"/></>),
      color: '#2563eb', bgClass: 'bg-blue-50', barColor: 'bg-blue-500', barBg: 'bg-blue-100',
    },
    {
      name: 'Writing', band: writingBand, raw: writingRaw, rawTotal: 30,
      icon: (<><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/></>),
      color: '#7c3aed', bgClass: 'bg-violet-50', barColor: 'bg-violet-500', barBg: 'bg-violet-100',
    },
    {
      name: 'Speaking', band: speakingBand, raw: speakingRaw, rawTotal: 30,
      icon: (<path d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/>),
      color: '#e67e22', bgClass: 'bg-amber-50', barColor: 'bg-amber-500', barBg: 'bg-amber-100',
    }
  ];

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-[#f0fafa] via-white to-white z-50 flex flex-col">
      {/* Header */}
      <div className="bg-white h-16 flex items-center justify-between px-8 shadow-sm border-b border-gray-100">
        <div className="flex items-center">
          <div 
            className="text-gray-700 text-2xl font-['Inter',_sans-serif] font-bold tracking-wide cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => {
              setShowFinalResult(false);
              if (testBankType === 'tpo') handleTabChange('TPO');
              else handleTabChange('Test');
            }}
          >
            *toefl ibt
          </div>
        </div>
        <button
          className="px-4 py-2 text-gray-400 hover:text-gray-600 font-medium rounded-lg hover:bg-gray-50 transition-colors text-sm"
          onClick={() => {
            setShowFinalResult(false);
            setActiveTab('History');
          }}
        >
          Close
        </button>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto py-8 px-4">
        <div className="max-w-lg mx-auto w-full">

          {/* Title */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-[#1e6b73]/10 to-[#2d7a7c]/10 text-[#1e6b73] px-5 py-2 rounded-full text-xs font-bold mb-4 border border-[#d1e8e8]/50">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 13l4 4L19 7"/></svg>
              2026 New TOEFL · Band 1–6 Scale
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-1">Test Complete!</h1>
            <p className="text-gray-400">Your full TOEFL score report</p>
          </div>

          {/* Big Score Ring */}
          <div className="relative w-40 h-40 mx-auto mb-8">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 140 140">
              <circle cx="70" cy="70" r="60" fill="none" stroke="#e5e7eb" strokeWidth="10"/>
              <circle 
                cx="70" cy="70" r="60" fill="none" 
                stroke={totalBand >= 4.5 ? '#10b981' : totalBand >= 3 ? '#e67e22' : '#ef4444'} 
                strokeWidth="10" strokeLinecap="round"
                strokeDasharray={`${Math.min((totalBand / 6) * 377, 377)} 377`}
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-5xl font-extrabold text-gray-800">{totalBand}</span>
              <span className="text-sm text-gray-400 font-medium">/ 6.0</span>
            </div>
          </div>

          {/* CEFR Badge */}
          <div className="flex justify-center flex-wrap gap-3 mb-8">
            <span className={`px-5 py-2 rounded-full text-sm font-bold ${overallLevel.bg} ${overallLevel.color} border ${overallLevel.border}`}>
              CEFR {overallLevel.cefr} · {overallLevel.label}
            </span>
            <span className="px-4 py-2 rounded-full text-xs bg-gray-100 text-gray-400 border border-gray-200 font-medium">
              Legacy ~{legacyTotal}/120
            </span>
          </div>

          {/* Section Scores */}
          <div className="space-y-3 mb-8">
            {sections.map(section => (
              <div key={section.name} className={`${section.bgClass} rounded-2xl p-4 transition-all hover:shadow-md border border-transparent hover:border-gray-100`}>
                <div className="flex items-center gap-4">
                  <div 
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm"
                    style={{ backgroundColor: section.color }}
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      {section.icon}
                    </svg>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-semibold text-gray-700 text-sm">{section.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-400">{section.raw}/{section.rawTotal !== '-' ? section.rawTotal : ''}</span>
                        <span className="font-extrabold text-lg" style={{ color: section.color }}>{section.band}</span>
                        <span className="text-[10px] text-gray-400">/6</span>
                      </div>
                    </div>
                    <div className={`w-full h-1.5 ${section.barBg} rounded-full overflow-hidden`}>
                      <div 
                        className={`h-full rounded-full ${section.barColor} transition-all duration-700`}
                        style={{ width: `${(section.band / 6) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary Table */}
          <div className="bg-white rounded-2xl p-5 shadow-md border border-gray-100 mb-8">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Band Score Summary</h3>
            <table className="w-full">
              <thead>
                <tr className="text-left text-[10px] text-gray-400 uppercase tracking-wider">
                  <th className="pb-2 font-semibold">Section</th>
                  <th className="pb-2 font-semibold text-right">Band</th>
                  <th className="pb-2 font-semibold text-right">CEFR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                <tr>
                  <td className="py-2.5 text-sm text-gray-700 font-medium">Reading</td>
                  <td className="py-2.5 text-right text-sm font-bold text-[#1e6b73]">{readingBand}</td>
                  <td className="py-2.5 text-right text-xs text-gray-400">{getCEFRLevel(readingBand).cefr}</td>
                </tr>
                <tr>
                  <td className="py-2.5 text-sm text-gray-700 font-medium">Listening</td>
                  <td className="py-2.5 text-right text-sm font-bold text-blue-600">{listeningBand}</td>
                  <td className="py-2.5 text-right text-xs text-gray-400">{getCEFRLevel(listeningBand).cefr}</td>
                </tr>
                <tr>
                  <td className="py-2.5 text-sm text-gray-700 font-medium">Writing</td>
                  <td className="py-2.5 text-right text-sm font-bold text-violet-600">{writingBand}</td>
                  <td className="py-2.5 text-right text-xs text-gray-400">{getCEFRLevel(writingBand).cefr}</td>
                </tr>
                <tr>
                  <td className="py-2.5 text-sm text-gray-700 font-medium">Speaking</td>
                  <td className="py-2.5 text-right text-sm font-bold text-amber-600">{speakingBand}</td>
                  <td className="py-2.5 text-right text-xs text-gray-400">{getCEFRLevel(speakingBand).cefr}</td>
                </tr>
                <tr>
                  <td colSpan={3} className="pt-3">
                    <div className="bg-gradient-to-r from-[#f0fafa] to-[#e8f4f8] rounded-xl px-5 py-3.5 flex items-center justify-between border border-[#d1e8e8]/50">
                      <span className="text-sm font-bold text-[#1e6b73]">OVERALL</span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-400">{overallLevel.cefr} · {overallLevel.label}</span>
                        <span className="text-2xl font-extrabold text-[#1e6b73]">{totalBand}<span className="text-xs text-gray-400 font-normal"> /6.0</span></span>
                      </div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
            <p className="mt-4 pt-3 border-t border-gray-100 text-[10px] text-gray-400 text-center">
              * Legacy estimate (0–120): ~{legacyTotal} · Transition period: 2026–2028
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 pb-8">
            <button
              className="w-full py-4 bg-gradient-to-r from-[#1e6b73] to-[#2d7a7c] text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all active:scale-[0.98]"
              onClick={() => {
                setShowFinalResult(false);
                setActiveTab('History');
              }}
            >
              View Detailed Results in History
            </button>
            <button
              className="w-full py-3 bg-white border-2 border-gray-200 text-gray-500 rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-300 transition-colors"
              onClick={() => {
                setShowFinalResult(false);
                if (testBankType === 'tpo') handleTabChange('TPO'); else handleTabChange('Test');
              }}
            >
              Back to Test List
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinalResultScreen;
