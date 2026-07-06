interface SpeakingResponseTimerProps {
  timeRemaining: number;
  totalDuration: number;
  isRecording: boolean;
  /** When provided, the mic circle becomes a clickable Record/Re-record button (review mode) */
  onRecordClick?: () => void;
  /** Label shown as a tiny caption under the mic when onRecordClick is provided */
  recordLabel?: string;
}

export function SpeakingResponseTimer({
  timeRemaining,
  totalDuration,
  isRecording,
  onRecordClick,
  recordLabel,
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

  const showAsButton = !!onRecordClick && !isRecording;

  return (
    <div className="w-fit overflow-hidden rounded-xl border border-[#8fd2cf] bg-white shadow-[0_2px_6px_rgba(20,139,143,0.1)] sm:rounded-2xl">
      <div className="bg-[#148b8f] px-5 py-1.5 text-center text-[10px] font-bold tracking-[0.06em] text-white sm:px-8 sm:py-2 sm:text-[11px]">
        RESPONSE TIME
      </div>

      <div className="flex items-center justify-center gap-2 px-4 py-2 sm:gap-3 sm:px-6 sm:py-3">
        <div className="relative flex h-9 w-9 items-center justify-center sm:h-10 sm:w-10">
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

          {showAsButton ? (
            <button
              onClick={onRecordClick}
              title={recordLabel || 'Record'}
              className="relative flex h-7 w-7 items-center justify-center rounded-full bg-[#f6d9d9] hover:bg-[#f0c7c7] transition-colors shadow-[0_1px_4px_rgba(20,139,143,0.18)]"
            >
              <svg className="relative h-4 w-4 text-[#c15c5c]" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
              </svg>
            </button>
          ) : (
            <div
              className={`relative flex h-7 w-7 items-center justify-center rounded-full shadow-[0_1px_4px_rgba(20,139,143,0.18)] ${isRecording ? 'bg-[#e08a8a]' : 'bg-white'}`}
              style={isRecording ? { animation: 'recBlink 1.6s ease-in-out infinite' } : undefined}
            >
              <svg className={`relative h-4 w-4 ${isRecording ? 'text-white' : 'text-[#148b8f]'}`} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
              </svg>
            </div>
          )}
        </div>

        <span className="text-[18px] font-bold leading-none tracking-[0.01em] text-[#10213a] sm:text-[22px]">
          {formatTime(timeRemaining)}
        </span>
        {isRecording && (
          <span className="flex items-center gap-1.5 text-[#c47a7a] font-semibold text-sm" style={{ animation: 'recBlink 1.6s ease-in-out infinite' }}>
            <span className="h-2 w-2 rounded-full bg-[#d98a8a]" />
            REC
          </span>
        )}
        {showAsButton && (
          <span className="text-[#c15c5c] font-semibold text-sm">
            {recordLabel || 'Record'}
          </span>
        )}
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