interface SpeakingStopOverlayProps {
  isOpen: boolean;
}

export function SpeakingStopOverlay({ isOpen }: SpeakingStopOverlayProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center bg-black/38 px-4 pt-24 sm:pt-20">
      <div className="w-full max-w-[500px] rounded-[30px] bg-white px-14 py-12 shadow-[0_10px_28px_rgba(0,0,0,0.22)] sm:px-16 sm:py-14">
        <h2 className="text-[23px] font-semibold tracking-[-0.01em] text-[#3f454b]">Stop Speaking</h2>
        <div className="mt-5 h-px bg-[#edf0f2]" />
        <div className="mt-12 space-y-5 text-[18px] leading-9 text-[#666e75]">
          <p>Response time has ended.</p>
          <p>Please wait. We are currently saving your response.</p>
        </div>
      </div>
    </div>
  );
}