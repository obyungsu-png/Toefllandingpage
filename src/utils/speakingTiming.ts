/** Stop Speaking 오버레이 후 다음 화면까지의 지연(ms). 기본 3초, CMS 비정상 값은 0.5~10초로 보정. */
export function resolveStopDelayMs(stopDuration: unknown): number {
  const sec = Number(stopDuration);
  if (!Number.isFinite(sec) || sec <= 0) return 3000;
  return Math.min(10_000, Math.max(500, sec * 1000));
}
