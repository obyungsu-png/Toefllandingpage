import { useEffect, useRef, useState } from 'react';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface IntroMediaProps {
  /** 영상 URL — mp4 등 직접 재생 가능한 링크 또는 YouTube 링크 */
  videoUrl?: string;
  /** 이미지 URL — 영상이 없을 때 표시 */
  imageUrl?: string;
  /** 영상 재생 끝나면 호출 — 자동 다음 화면 전환용 */
  onVideoEnded?: () => void;
  /** 영상 재생 실패 시 호출 — 폴백 처리용 */
  onVideoError?: () => void;
  className?: string;
}

/**
 * YouTube URL 을 embed URL 로 변환. 아닌 경우 null.
 */
function toYouTubeEmbed(url: string): string | null {
  // youtube.com/watch?v=xxx, youtu.be/xxx, youtube.com/embed/xxx
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) {
      // autoplay + 재생 종료 감지를 위해 enablejsapi
      return `https://www.youtube.com/embed/${m[1]}?autoplay=1&rel=0&modestbranding=1&enablejsapi=1`;
    }
  }
  return null;
}

/**
 * 그룹 인트로 미디어 표시 — 영상 > 이미지 순 우선. CMS 에 영상이 올라오면
 * 영상 재생, 없으면 이미지 표시. 영상 재생이 끝나면 onVideoEnded 콜백 발동.
 */
export function IntroMedia({ videoUrl, imageUrl, onVideoEnded, onVideoError, className }: IntroMediaProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [videoFailed, setVideoFailed] = useState(false);

  useEffect(() => {
    setVideoFailed(false);
  }, [videoUrl]);

  if (videoUrl && !videoFailed) {
    const youtubeEmbed = toYouTubeEmbed(videoUrl);
    if (youtubeEmbed) {
      // YouTube 는 iframe 으로 재생. onended 감지는 postMessage API 필요하지만,
      // 단순화를 위해 iframe 만 띄우고 사용자가 Next 버튼을 누르도록 한다.
      return (
        <div className={className ?? 'w-full aspect-video max-w-3xl mx-auto rounded-lg overflow-hidden bg-black'}>
          <iframe
            src={youtubeEmbed}
            title="Intro video"
            className="w-full h-full"
            allow="autoplay; encrypted-media"
            allowFullScreen
          />
        </div>
      );
    }
    // 직접 재생 가능한 영상 (mp4 등) — <video> 태그로 재생
    return (
      <video
        ref={videoRef}
        src={videoUrl}
        className={className ?? 'w-full max-w-3xl mx-auto rounded-lg bg-black aspect-video object-contain'}
        autoPlay
        playsInline
        controls
        onEnded={() => onVideoEnded?.()}
        onError={() => {
          setVideoFailed(true);
          onVideoError?.();
        }}
      />
    );
  }

  if (imageUrl) {
    return (
      <div className={className ?? 'w-full max-w-3xl mx-auto rounded-lg overflow-hidden bg-gray-50 border border-gray-200'}>
        <ImageWithFallback
          src={imageUrl}
          alt="Intro"
          className="w-full h-auto object-contain"
        />
      </div>
    );
  }

  return null;
}
