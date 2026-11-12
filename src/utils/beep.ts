/**
 * playBeep — 짧은 삐 소리 (Web Audio API, 외부 파일 불필요)
 * freq: Hz (default 880 = A5, TOEFL 시험과 유사한 고음)
 * duration: ms (default 200)
 *
 * 중복 방지: 짧은 시간(락 윈도우) 안에 여러 번 호출되면 첫 호출만 소리를 내고
 * 나머지는 조용히 무시한다. Prep→Record 전환 타이밍이 꼬여 beep가 두 번
 * 울리던 문제를 근본적으로 막는다. (beep는 의도적으로 연속 두 번 울릴 일이 없음)
 */
let lastBeepAt = 0;

export function playBeep(freq = 880, duration = 300, volume = 1.0): Promise<void> {
  const now = Date.now();
  // 직전 beep로부터 (duration + 여유 150ms) 이내의 중복 호출은 무시
  if (now - lastBeepAt < duration + 150) {
    return Promise.resolve();
  }
  lastBeepAt = now;

  return new Promise((resolve) => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      // 자동재생 정책으로 suspended 상태일 수 있음 — resume 없으면 osc가 울리지 않고
      // osc.onended도 발생하지 않아 await playBeep()가 영구 대기 → 녹음이 시작되지 않는
      // 버그(TPO 스피킹 RESPONSE TIME에서 멈춤)의 원인. 즉시 resume 시도.
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
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
        try { ctx.close(); } catch { /* ignore */ }
        resolve();
      };
      // 안전장치 — 어떤 이유로든 osc.onended가 발생하지 않아도( suspended 유지,
      // 이벤트 누락 등 ) 삐 소리 길이 이후에는 반드시 resolve해서 녹음 흐름이
      // 멈추지 않도록 한다.
      setTimeout(() => resolve(), duration + 400);
    } catch {
      resolve(); // silently skip if AudioContext not available
    }
  });
}
