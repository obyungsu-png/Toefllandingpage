interface SpeakingStopOverlayProps {
  isOpen: boolean;
}

export function SpeakingStopOverlay({ isOpen }: SpeakingStopOverlayProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/45 px-4">
      <div className="w-full max-w-[590px] rounded-[32px] border-2 border-[#2d84d6] bg-white px-10 py-12 shadow-[0_18px_40px_rgba(0,0,0,0.18)]">
        <h2 className="text-[22px] font-semibold text-[#404040]">Stop Speaking</h2>
        <div className="mt-4 h-px bg-[#e5e5e5]" />
        <div className="mt-10 space-y-5 text-[18px] leading-9 text-[#5c5c5c]">
          <p>Response time has ended.</p>
          <p>Please wait. We are currently saving your response.</p>
        </div>
      </div>
    </div>
  );
}