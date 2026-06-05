import { useAudioRecorder } from './useAudioRecorder';

interface SpeakingRecorderPanelProps {
  /** Auto-start recording when this becomes true (e.g. after prep time) */
  autoStart?: boolean;
  /** Called when user finishes (stops) a recording */
  onRecorded?: (blob: Blob, url: string) => void;
  compact?: boolean;
}

/**
 * In-session microphone recorder with playback.
 * Recordings are temporary (in-memory blob URLs) and are not uploaded.
 */
export function SpeakingRecorderPanel({ onRecorded, compact }: SpeakingRecorderPanelProps) {
  const rec = useAudioRecorder();

  const handleStop = () => {
    rec.stopRecording();
  };

  return (
    <div className={`flex flex-col items-center gap-3 ${compact ? '' : 'mt-4'}`}>
      {/* Status indicator */}
      <div className="flex items-center gap-2">
        {rec.isRecording ? (
          <span className="flex items-center gap-2 text-red-600 font-semibold text-sm">
            <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
            녹음 중...
          </span>
        ) : rec.status === 'stopped' ? (
          <span className="text-emerald-600 font-semibold text-sm">녹음 완료</span>
        ) : rec.status === 'requesting' ? (
          <span className="text-gray-500 text-sm">마이크 준비 중...</span>
        ) : rec.status === 'denied' || rec.status === 'unsupported' ? (
          <span className="text-red-500 text-sm">{rec.error}</span>
        ) : (
          <span className="text-gray-400 text-sm">녹음 대기</span>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        {!rec.isRecording ? (
          <button
            type="button"
            onClick={() => rec.startRecording()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-red-500 text-white font-semibold text-sm hover:bg-red-600 transition-colors shadow"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 14a3 3 0 003-3V5a3 3 0 00-6 0v6a3 3 0 003 3z" />
              <path d="M19 11a7 7 0 01-14 0H3a9 9 0 008 8.94V23h2v-3.06A9 9 0 0021 11h-2z" />
            </svg>
            {rec.status === 'stopped' ? '다시 녹음' : '녹음 시작'}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleStop}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gray-800 text-white font-semibold text-sm hover:bg-black transition-colors shadow"
          >
            <span className="w-3 h-3 bg-white rounded-sm" />
            녹음 정지
          </button>
        )}
      </div>

      {/* Playback */}
      {rec.audioUrl && !rec.isRecording && (
        <audio
          controls
          src={rec.audioUrl}
          className="mt-2 w-full max-w-xs"
          onLoadedMetadata={() => {
            if (rec.audioBlob && rec.audioUrl && onRecorded) onRecorded(rec.audioBlob, rec.audioUrl);
          }}
        />
      )}

      <p className="text-xs text-gray-400 mt-1">
        ※ 녹음은 현재 세션에만 임시 저장되며 페이지를 나가면 사라집니다.
      </p>
    </div>
  );
}
