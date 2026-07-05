interface SpeakingStopOverlayProps {
  isOpen: boolean;
}

export function SpeakingStopOverlay({ isOpen }: SpeakingStopOverlayProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center bg-black/38 px-4 pt-24 sm:pt-20">
      <div className="w-full max-w-[380px] rounded-[24px] bg-white px-8 py-7 shadow-[0_10px_28px_rgba(0,0,0,0.22)]">
        <h2 className="text-lg font-semibold tracking-[-0.01em] text-[#3f454b]">Stop Speaking</h2>
        <div className="mt-3 h-px bg-[#edf0f2]" />
        <div className="mt-4 space-y-1.5 text-[15px] leading-6 text-[#666e75]">
          <p>Response time has ended.</p>
          <p>Saving your response...</p>
        </div>
      </div>
    </div>
  );
}
