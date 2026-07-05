interface SpeakingStopOverlayProps {
  isOpen: boolean;
}

export function SpeakingStopOverlay({ isOpen }: SpeakingStopOverlayProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center bg-black/38 px-4 pt-16 sm:pt-20">
      <div className="w-full max-w-[300px] rounded-[16px] bg-white px-5 py-4 shadow-[0_10px_28px_rgba(0,0,0,0.22)] sm:max-w-[420px] sm:rounded-[24px] sm:px-9 sm:py-8">
        <h2 className="text-sm font-semibold tracking-[-0.01em] text-[#3f454b] animate-pulse sm:text-xl">Stop Speaking</h2>
        <div className="mt-2 h-px bg-[#edf0f2] sm:mt-3" />
        <div className="mt-3 space-y-2 text-xs leading-5 text-[#666e75] sm:mt-5 sm:space-y-3 sm:text-[16px] sm:leading-7">
          <p className="animate-pulse">Response time has ended.</p>
          <p className="animate-pulse">Please wait. We are currently saving response.</p>
        </div>
      </div>
    </div>
  );
}
