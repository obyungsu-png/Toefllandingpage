interface SpeakingStopOverlayProps {
  isOpen: boolean;
}

export function SpeakingStopOverlay({ isOpen }: SpeakingStopOverlayProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center bg-black/38 px-4 pt-24 sm:pt-20">
      <div className="w-full max-w-[420px] rounded-[24px] bg-white px-9 py-8 shadow-[0_10px_28px_rgba(0,0,0,0.22)]">
        <h2 className="text-xl font-semibold tracking-[-0.01em] text-[#3f454b]">Stop Speaking</h2>
        <div className="mt-3 h-px bg-[#edf0f2]" />
        <div className="mt-5 space-y-3 text-[16px] leading-7 text-[#666e75]">
          <p>Response time has ended.</p>
          <p>Saving response.</p>
        </div>
      </div>
    </div>
  );
}
