import { useState, useRef, useCallback, useEffect } from 'react';

export type RecorderStatus = 'idle' | 'requesting' | 'recording' | 'stopped' | 'denied' | 'unsupported';

export interface UseAudioRecorderResult {
  status: RecorderStatus;
  audioUrl: string | null;
  audioBlob: Blob | null;
  isRecording: boolean;
  error: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  resetRecording: () => void;
}

/**
 * Codec priority order (lowest file size that works):
 *  1. audio/webm;codecs=opus  — ~48kbps, best compression, Chrome/Firefox/Edge
 *  2. audio/webm               — opus by default on most browsers
 *  3. audio/mp4                — Safari fallback (AAC codec)
 *  4. ''                       — browser default
 */
function pickMimeType(): string {
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
  ];
  for (const t of candidates) {
    if (MediaRecorder.isTypeSupported(t)) return t;
  }
  return '';
}

export function useAudioRecorder(): UseAudioRecorderResult {
  const [status, setStatus]     = useState<RecorderStatus>('idle');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [error, setError]       = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef        = useRef<Blob[]>([]);
  const streamRef        = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop());
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startRecording = useCallback(async () => {
    setError(null);

    if (
      typeof navigator === 'undefined' ||
      !navigator.mediaDevices?.getUserMedia ||
      typeof MediaRecorder === 'undefined'
    ) {
      setStatus('unsupported');
      setError('이 브라우저는 녹음을 지원하지 않습니다.');
      return;
    }

    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
      setAudioBlob(null);
    }

    try {
      setStatus('requesting');

      // Request mic with voice-optimized constraints
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,       // mono — halves the data
          sampleRate: 16000,     // 16kHz sufficient for speech
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;

      const mimeType = pickMimeType();

      // audioBitsPerSecond ~48kbps (opus is very efficient at this rate)
      const recorderOptions: MediaRecorderOptions = {
        ...(mimeType ? { mimeType } : {}),
        audioBitsPerSecond: 48_000,
      };

      const recorder = new MediaRecorder(stream, recorderOptions);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blobType = mimeType || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type: blobType });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        setStatus('stopped');
        streamRef.current?.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      };

      recorder.start(250); // collect chunks every 250ms
      setStatus('recording');
    } catch (err: any) {
      console.error('Recording error:', err);
      if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
        setStatus('denied');
        setError('마이크 권한이 거부되었습니다. 브라우저 설정에서 마이크 접근을 허용해주세요.');
      } else {
        setStatus('idle');
        setError('녹음을 시작할 수 없습니다.');
      }
    }
  }, [audioUrl]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state !== 'inactive') {
      mediaRecorderRef.current?.stop();
    }
  }, []);

  const resetRecording = useCallback(() => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setAudioBlob(null);
    setStatus('idle');
    setError(null);
    chunksRef.current = [];
  }, [audioUrl]);

  return { status, audioUrl, audioBlob, isRecording: status === 'recording', error, startRecording, stopRecording, resetRecording };
}
