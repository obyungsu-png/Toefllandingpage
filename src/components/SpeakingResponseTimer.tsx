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
    <div className="w-[290px] overflow-hidden rounded-[28px] border border-[#8fd2cf] bg-white shadow-[0_8px_24px_rgba(20,139,143,0.14)]">
      <div className="bg-[#148b8f] px-6 py-3 text-center text-[14px] font-bold tracking-[0.04em] text-white sm:text-[18px]">
        RESPONSE TIME
      </div>

      <div className="flex items-center justify-center gap-3 px-5 py-5 sm:gap-4 sm:px-6 sm:py-6">
        <div className="relative flex h-14 w-14 items-center justify-center sm:h-16 sm:w-16">
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

          <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-[0_2px_8px_rgba(20,139,143,0.18)] sm:h-11 sm:w-11">
            <svg className="h-5 w-5 text-[#148b8f] sm:h-6 sm:w-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
              <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
            </svg>
          </div>
        </div>

        <span className="text-[28px] font-bold leading-none text-[#10213a] sm:text-[34px]">
          {formatTime(timeRemaining)}
        </span>
      </div>
    </div>
  );
}