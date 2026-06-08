/**
 * playBeep — 짧은 삐 소리 (Web Audio API, 외부 파일 불필요)
 * freq: Hz (default 880 = A5, TOEFL 시험과 유사한 고음)
 * duration: ms (default 200)
 */
export function playBeep(freq = 880, duration = 300, volume = 0.85): Promise<void> {
  return new Promise((resolve) => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(volume, ctx.currentTime);
      // Fade out quickly to avoid click noise
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration / 1000);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duration / 1000);

      osc.onended = () => {
        ctx.close();
        resolve();
      };
    } catch {
      resolve(); // silently skip if AudioContext not available
    }
  });
}
