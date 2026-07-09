import { useState, useRef, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';

/**
 * UniversalAudioPlayer — 모든 리스닝/스피킹 Review에서 사용하는 공용 오디오 플레이어
 *
 * 특징:
 * 1. audioUrl이 바뀌면 자동으로 pause → src 갱신 → load() → 초기화
 * 2. Play/Pause 토글: 중간에 pause하면 그 위치에서 이어서 재생
 * 3. Progress 바 표시
 * 4. 컴포넌트가 unmount되면 자동 정리
 */
interface UniversalAudioPlayerProps {
  /** 재생할 오디오 URL */
  audioUrl: string;
  /** 문제 번호 (로그용, key 생성용) */
  qNum?: number;
  /** 버튼 라벨 커스터마이즈 (기본: 'Play Audio' / 'Pause Audio') */
  label?: string;
  /** 색상 테마 (기본: #0d3b4a) */
  color?: string;
}

export function UniversalAudioPlayer({
  audioUrl,
  qNum = 0,
  label,
  color = '#0d3b4a',
}: UniversalAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  // ── 핵심: audioUrl이 바뀌면 무조건 새 오디오 로드 ──
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;

    // 현재 재생 중이면 정지
    el.pause();
    el.currentTime = 0;

    if (audioUrl) {
      el.src = audioUrl;
      el.load(); // 브라우저에게 명시적으로 새 리소스 로드 요청
    }

    // 상태 초기화
    setIsPlaying(false);
    setProgress(0);
  }, [audioUrl]); // audioUrl이 변경될 때만 실행

  // ── cleanup: 컴포넌트 언마운트 시 오디오 정리 ──
  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, []);

  // ── Play / Pause 토글 ──
  const togglePlay = () => {
    const el = audioRef.current;
    if (!el || !audioUrl || !el.src || el.src === window.location.href) return;

    if (isPlaying) {
      // 일시정지 → 위치 유지 (currentTime 변경 없음)
      el.pause();
      setIsPlaying(false);
    } else {
      // 재생 → paused 위치에서 이어서 재생
      el.play().then(() => setIsPlaying(true)).catch((err) => {
        console.warn('[AudioPlayer] play failed:', err.message);
        setIsPlaying(false);
      });
    }
  };

  // ── 진행률 업데이트 ──
  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLAudioElement>) => {
    const el = e.currentTarget;
    if (el.duration && isFinite(el.duration)) {
      setProgress((el.currentTime / el.duration) * 100);
    }
  };

  // ── 재생 완료 ──
  const handleEnded = () => {
    setIsPlaying(false);
    setProgress(0);
  };

  return (
    <div className="max-w-xl mx-auto">
      {/* 숨겨진 <audio> 요소 */}
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        preload="auto"
        className="hidden"
      />

      {/* Play / Pause 버튼 + 프로그레스 바 */}
      <button
        onClick={togglePlay}
        className="w-full flex items-center gap-3 px-5 py-3 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
      >
        {isPlaying ? (
          <Pause className={`w-4 h-4 ${color} fill-${color} flex-shrink-0`} style={{ color }} />
        ) : (
          <Play className={`w-4 h-4 ${color} fill-${color} flex-shrink-0`} style={{ color }} />
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
