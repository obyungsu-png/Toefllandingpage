interface SpeakingResponseTimerProps {
  timeRemaining: number;
  totalDuration: number;
  isRecording: boolean;
}

export function SpeakingResponseTimer({
  timeRemaining,
  totalDuration,
  isRecording,
}: SpeakingResponseTimerProps) {
  const radius = 19;
  const circumference = 2 * Math.PI * radius;
  const elapsed = Math.max(0, totalDuration - timeRemaining);
  const progress = totalDuration > 0 ? Math.min(elapsed / totalDuration, 1) : 0;
  const strokeDashoffset = circumference * (1 - progress);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `00:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full max-w-[22rem] overflow-hidden rounded-[1.5rem] border border-[#8fd2cf] bg-white shadow-[0_10px_22px_rgba(20,139,143,0.12)] sm:max-w-[37rem] sm:rounded-[2rem] sm:shadow-[0_14px_28px_rgba(20,139,143,0.12)]">
      <div className="bg-[#148b8f] px-6 py-2 text-center text-[16px] font-bold tracking-[0.08em] text-white sm:px-8 sm:py-5 sm:text-[30px]">
        RESPONSE TIME
      </div>

      <div className="flex items-center justify-center gap-2 px-3 py-4 sm:gap-8 sm:px-10 sm:py-8">
        <div className="relative flex h-12 w-12 shrink-0 items-center justify-center sm:h-[74px] sm:w-[74px]">
          <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 48 48" aria-hidden="true">
            <circle cx="24" cy="24" r={radius} fill="none" stroke="#d9eceb" strokeWidth="4" />
            <circle
              cx="24"
              cy="24"
              r={radius}
              fill="none"
              stroke="#148b8f"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={isRecording ? strokeDashoffset : circumference}
            />
          </svg>

          <div
            className={`relative flex h-9 w-9 items-center justify-center rounded-full shadow-[0_1px_4px_rgba(20,139,143,0.18)] sm:h-14 sm:w-14 ${isRecording ? 'bg-[#efa7a7]' : 'bg-white'}`}
            style={isRecording ? { animation: 'recBlink 1.6s ease-in-out infinite' } : undefined}
          >
            <svg className={`relative h-5 w-5 sm:h-8 sm:w-8 ${isRecording ? 'text-white' : 'text-[#148b8f]'}`} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
              <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
            </svg>
          </div>
        </div>

        <span className="text-[30px] font-bold leading-none tracking-[0.01em] text-[#10213a] sm:text-[58px]">
          {formatTime(timeRemaining)}
        </span>
        <span
          className={`flex w-14 shrink-0 items-center gap-1.5 text-[18px] font-semibold text-[#d09a9a] sm:w-[4.5rem] sm:gap-2 sm:text-[30px] ${isRecording ? '' : 'invisible'}`}
          style={isRecording ? { animation: 'recBlink 1.6s ease-in-out infinite' } : undefined}
          aria-hidden={!isRecording}
        >
          <span className="h-3.5 w-3.5 rounded-full bg-[#e5aaa8] sm:h-[18px] sm:w-[18px]" />
          REC
        </span>
      </div>

      <style>{`
        @keyframes recBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}