import { useState, useRef, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';

/**
 * UniversalAudioPlayer — 리스닝/스피킹 Review 공용 오디오 플레이어
 *
 * 지연 없이 즉시 재생되도록 아래 항목을 반영:
 * 1. <audio src={audioUrl} preload="auto"> — 첫 렌더부터 버퍼링 시작
 * 2. togglePlay는 낙관적 UI 업데이트 — 버튼 상태가 즉시 반영
 * 3. audioUrl 변경 시 자동 pause + 상태 초기화
 * 4. pause 위치는 유지 (다시 눌러도 이어서 재생)
 */
interface UniversalAudioPlayerProps {
  audioUrl: string;
  qNum?: number;
  label?: string;
  color?: string;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onEnded?: () => void;
}

export function UniversalAudioPlayer({
  audioUrl,
  qNum: _qNum = 0,
  label,
  color = '#0d3b4a',
  onTimeUpdate,
  onEnded,
}: UniversalAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  // audioUrl이 바뀌면 상태만 초기화 (src는 JSX에서 이미 반영됨)
  useEffect(() => {
    setIsPlaying(false);
    setProgress(0);
    const el = audioRef.current;
    if (!el) return;
    try { el.pause(); el.currentTime = 0; } catch { /* ignore */ }
  }, [audioUrl]);

  useEffect(() => {
    return () => {
      try { audioRef.current?.pause(); } catch { /* ignore */ }
      audioRef.current = null;
    };
  }, []);

  const togglePlay = () => {
    const el = audioRef.current;
    if (!el || !audioUrl) return;

    if (el.paused) {
      // 낙관적 업데이트 — 버튼이 즉시 Pause 상태로 변경
      setIsPlaying(true);
      const p = el.play();
      if (p && typeof p.catch === 'function') {
        p.catch((err) => {
          console.warn('[AudioPlayer] play failed:', err?.message || err);
          setIsPlaying(false);
        });
      }
    } else {
      el.pause();
      setIsPlaying(false);
    }
  };

  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLAudioElement>) => {
    const el = e.currentTarget;
    const dur = el.duration && isFinite(el.duration) ? el.duration : 0;
    if (dur) setProgress((el.currentTime / dur) * 100);
    if (onTimeUpdate) onTimeUpdate(el.currentTime, dur);
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setProgress(0);
    if (onEnded) onEnded();
  };

  return (
    <div className="max-w-xl mx-auto">
      <audio
        ref={audioRef}
        src={audioUrl || undefined}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        onPause={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
        preload="auto"
        className="hidden"
      />

      <button
        onClick={togglePlay}
        className="w-full flex items-center gap-3 px-5 py-3 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
      >
        {isPlaying ? (
          <Pause className="w-4 h-4 flex-shrink-0" style={{ color, fill: color }} />
        ) : (
          <Play className="w-4 h-4 flex-shrink-0" style={{ color, fill: color }} />
        )}
        <span className="font-bold" style={{ color }}>
          {isPlaying ? (label ? `${label} 중지` : 'Pause Audio') : (label || 'Play Audio')}
        </span>
        {progress > 0 && (
          <div className="flex-1 h-1 bg-gray-300 rounded-full overflow-hidden ml-2">
            <div
              className="h-full rounded-full transition-all duration-150"
              style={{ width: `${progress}%`, backgroundColor: color }}
            />
          </div>
        )}
      </button>
    </div>
  );
}
