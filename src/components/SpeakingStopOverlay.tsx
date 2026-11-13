interface SpeakingStopOverlayProps {
  isOpen: boolean;
}

export function SpeakingStopOverlay({ isOpen }: SpeakingStopOverlayProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center bg-black/38 px-4 pt-20 sm:pt-24">
      {/* 모바일에선 폭·패딩 축소. 데스크탑은 기존 크기 유지. */}
      <div className="w-full max-w-[280px] sm:max-w-[420px] rounded-2xl sm:rounded-[24px] bg-white px-5 py-4 sm:px-9 sm:py-8 shadow-[0_10px_28px_rgba(0,0,0,0.22)]">
        <h2 className="text-base sm:text-2xl font-bold tracking-[-0.01em] text-[#26292e]">Stop Speaking</h2>
        <div className="mt-2 sm:mt-3 h-px bg-[#e2e6e9]" />
        <div className="mt-3 sm:mt-5 space-y-1.5 sm:space-y-3 text-[13px] sm:text-[16px] leading-5 sm:leading-7 text-[#33383d]">
          <p>Response time has ended.</p>
          <p>Please wait. We are currently saving your response.</p>
        </div>
      </div>
    </div>
  );
}
