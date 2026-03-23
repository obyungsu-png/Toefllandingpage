import { useState, useRef, useEffect } from 'react';
import { Mic, Play, Square, RotateCcw } from 'lucide-react';
import { Button } from './ui/button';
import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface PronunciationAnalyzerProps {
  nativeText: string;
  nativeAudioUrl?: string;
  onMatchScoreChange?: (score: number) => void;
}

interface PitchPoint {
  time: number;
  pitch: number;
}

// Initialize Supabase client
const supabase = createClient(
  `https://${projectId}.supabase.co`,
  publicAnonKey
);

export function PronunciationAnalyzer({ 
  nativeText, 
  nativeAudioUrl,
  onMatchScoreChange 
}: PronunciationAnalyzerProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecorded, setHasRecorded] = useState(false);
  const [isPlayingNative, setIsPlayingNative] = useState(false);
  const [isPlayingUser, setIsPlayingUser] = useState(false);
  const [nativePitchData, setNativePitchData] = useState<PitchPoint[]>([]);
  const [userPitchData, setUserPitchData] = useState<PitchPoint[]>([]);
  const [matchScore, setMatchScore] = useState<number>(0);
  const [nativeAnimProgress, setNativeAnimProgress] = useState(0);
  const [userAnimProgress, setUserAnimProgress] = useState(0);
  const [stressedWords, setStressedWords] = useState<{word: string, index: number, stress: number}[]>([]);
  const [micPermission, setMicPermission] = useState<'unknown' | 'granted' | 'denied' | 'prompt'>('unknown');
  const [showPermissionGuide, setShowPermissionGuide] = useState(false);
  const [feedbackLevel, setFeedbackLevel] = useState<'great' | 'okay' | 'cheer' | null>(null);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const userAudioRef = useRef<HTMLAudioElement | null>(null);
  const nativeAudioRef = useRef<HTMLAudioElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Extract pitch data from audio using Web Audio API
  const extractPitchData = async (audioBlob: Blob): Promise<PitchPoint[]> => {
    const audioContext = new AudioContext();
    const arrayBuffer = await audioBlob.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    const audioData = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;
    const pitchData: PitchPoint[] = [];
    
    // Analyze pitch using autocorrelation
    const bufferSize = 2048;
    const hopSize = 512;
    
    for (let i = 0; i < audioData.length - bufferSize; i += hopSize) {
      const buffer = audioData.slice(i, i + bufferSize);
      const pitch = detectPitch(buffer, sampleRate);
      
      if (pitch > 0) {
        pitchData.push({
          time: i / sampleRate,
          pitch: pitch
        });
      }
    }
    
    return pitchData;
  };

  // Autocorrelation pitch detection algorithm
  const detectPitch = (buffer: Float32Array, sampleRate: number): number => {
    const SIZE = buffer.length;
    const MAX_SAMPLES = Math.floor(SIZE / 2);
    let bestOffset = -1;
    let bestCorrelation = 0;
    let rms = 0;
    
    // Calculate RMS (Root Mean Square) for volume detection
    for (let i = 0; i < SIZE; i++) {
      const val = buffer[i];
      rms += val * val;
    }
    rms = Math.sqrt(rms / SIZE);
    
    // Not enough signal
    if (rms < 0.01) return -1;
    
    // Autocorrelation
    let lastCorrelation = 1;
    for (let offset = 1; offset < MAX_SAMPLES; offset++) {
      let correlation = 0;
      
      for (let i = 0; i < MAX_SAMPLES; i++) {
        correlation += Math.abs(buffer[i] - buffer[i + offset]);
      }
      
      correlation = 1 - correlation / MAX_SAMPLES;
      
      if (correlation > 0.9 && correlation > lastCorrelation) {
        const foundGoodCorrelation = correlation > bestCorrelation;
        if (foundGoodCorrelation) {
          bestCorrelation = correlation;
          bestOffset = offset;
        }
      }
      
      lastCorrelation = correlation;
    }
    
    if (bestCorrelation > 0.01 && bestOffset !== -1) {
      const fundamentalFreq = sampleRate / bestOffset;
      return fundamentalFreq;
    }
    
    return -1;
  };

  // Extract pitch from native audio URL
  const extractNativePitch = async (audioUrl: string) => {
    try {
      const response = await fetch(audioUrl);
      const blob = await response.blob();
      const pitchData = await extractPitchData(blob);
      setNativePitchData(pitchData);
    } catch (error) {
      console.error('Failed to extract native pitch:', error);
      // Fallback: generate synthetic pitch data from TTS
      await generateTTSPitchData(nativeText);
    }
  };

  // Generate pitch data from TTS
  const generateTTSPitchData = async (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    
    // Create a synthetic pitch curve
    const duration = (text.length / 15) * 1000; // Rough estimate in ms
    const syntheticPitch: PitchPoint[] = [];
    
    // Generate a natural-looking pitch curve
    const baseFreq = 150; // Average female voice ~200Hz, male ~120Hz
    const numPoints = 50;
    
    for (let i = 0; i < numPoints; i++) {
      const t = (i / numPoints) * (duration / 1000);
      // Add natural variation with sine waves
      const variation = Math.sin(i * 0.5) * 30 + Math.sin(i * 0.2) * 15;
      syntheticPitch.push({
        time: t,
        pitch: baseFreq + variation
      });
    }
    
    setNativePitchData(syntheticPitch);
  };

  // Load native audio on mount
  useEffect(() => {
    if (nativeAudioUrl) {
      extractNativePitch(nativeAudioUrl);
    } else {
      generateTTSPitchData(nativeText);
    }
  }, [nativeAudioUrl, nativeText]);

  // Start recording user's voice
  const startRecording = async () => {
    try {
      console.log('🎙️ Requesting microphone access...');
      
      // Check if mediaDevices is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error('❌ MediaDevices API not available');
        const isHttps = window.location.protocol === 'https:';
        const errorMsg = !isHttps 
          ? '⚠️ 마이크는 HTTPS 연결에서만 사용할 수 있습니다.\n\n현재 HTTP 연결을 사용 중입니다. Figma Make에서 "Share" 버튼을 클릭하여 HTTPS URL을 얻으세요.'
          : '⚠️ 이 브라우저는 마이크 녹음을 지원하지 않습니다.\n\nChrome, Firefox, Safari 최신 버전을 사용해주세요.';
        alert(errorMsg);
        return;
      }

      // Check current permission state
      try {
        const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        console.log('🔐 Current microphone permission:', permissionStatus.state);
        
        if (permissionStatus.state === 'denied') {
          const currentUrl = window.location.origin;
          alert(
            '🚫 마이크 권한이 차단되어 있습니다.\n\n' +
            `현재 사이트: ${currentUrl}\n\n` +
            '해결 방법:\n' +
            '1. 주소창 왼쪽의 🔒 (자물쇠) 아이콘을 클릭하세요\n' +
            '2. "마이크" 항목을 찾으세요\n' +
            '3. "차단됨"을 "허용"으로 변경하세요\n' +
            '4. 페이지를 새로고침하세요 (F5)\n\n' +
            '또는:\n' +
            'Chrome 설정 > 개인정보 및 보안 > 사이트 설정 > 마이크\n' +
            `→ "허용" 목록에 ${currentUrl} 추가하세요`
          );
          return;
        }
      } catch (e) {
        // Permissions API not supported in some browsers (e.g., Safari)
        console.log('⚠️ Permissions API not supported, will request directly');
      }

      console.log('✅ MediaDevices API available, requesting permission...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('✅ Microphone permission granted!');
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const pitchData = await extractPitchData(audioBlob);
        setUserPitchData(pitchData);
        setHasRecorded(true);
        
        // Upload to Supabase Storage
        try {
          console.log('📤 Uploading audio to Supabase...');
          
          // Convert blob to base64
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = async () => {
            const base64data = reader.result as string;
            
            // Upload to server
            const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-e46cd33a/upload-file`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${publicAnonKey}`
              },
              body: JSON.stringify({
                fileData: base64data,
                fileName: `pronunciation-${Date.now()}.wav`,
                fileType: 'audio/wav'
              })
            });
            
            if (!response.ok) {
              throw new Error('Failed to upload audio');
            }
            
            const result = await response.json();
            console.log('✅ Audio uploaded successfully:', result.fileName);
            
            // Use signed URL for playback
            userAudioRef.current = new Audio(result.fileUrl);
          };
        } catch (error) {
          console.error('❌ Failed to upload audio to Supabase:', error);
          // Fallback: use local blob URL
          const audioUrl = URL.createObjectURL(audioBlob);
          userAudioRef.current = new Audio(audioUrl);
        }
        
        // Calculate match score
        const score = calculateMatchScore(nativePitchData, pitchData);
        setMatchScore(score);
        if (onMatchScoreChange) {
          onMatchScoreChange(score);
        }
        
        // Determine feedback level
        setFeedbackLevel(getFeedbackLevel(score));
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Failed to start recording:', error);
      alert('마이크 권한이 필요합니다. 브라우저 설정에서 마이크 접근을 허용해주세요.');
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Calculate similarity score between two pitch curves
  const calculateMatchScore = (native: PitchPoint[], user: PitchPoint[]): number => {
    if (native.length === 0 || user.length === 0) return 0;
    
    // Normalize pitch data to same time scale
    const maxTime = Math.max(
      native[native.length - 1]?.time || 1,
      user[user.length - 1]?.time || 1
    );
    
    // Sample both curves at regular intervals
    const numSamples = 100;
    let totalDiff = 0;
    let validSamples = 0;
    
    for (let i = 0; i < numSamples; i++) {
      const t = (i / numSamples) * maxTime;
      
      const nativePitch = interpolatePitch(native, t);
      const userPitch = interpolatePitch(user, t);
      
      if (nativePitch > 0 && userPitch > 0) {
        // Calculate relative difference (in percentage)
        const diff = Math.abs(nativePitch - userPitch) / nativePitch;
        totalDiff += diff;
        validSamples++;
      }
    }
    
    if (validSamples === 0) return 0;
    
    const avgDiff = totalDiff / validSamples;
    // Convert to similarity score (0-100)
    const similarity = Math.max(0, Math.min(100, (1 - avgDiff) * 100));
    
    return Math.round(similarity);
  };
  
  // Determine feedback level based on score
  const getFeedbackLevel = (score: number): 'great' | 'okay' | 'cheer' => {
    if (score >= 75) return 'great';
    if (score >= 50) return 'okay';
    return 'cheer';
  };

  // Interpolate pitch at a given time
  const interpolatePitch = (data: PitchPoint[], time: number): number => {
    if (data.length === 0) return 0;
    if (time <= data[0].time) return data[0].pitch;
    if (time >= data[data.length - 1].time) return data[data.length - 1].pitch;
    
    // Find surrounding points
    for (let i = 0; i < data.length - 1; i++) {
      if (time >= data[i].time && time <= data[i + 1].time) {
        // Linear interpolation
        const t = (time - data[i].time) / (data[i + 1].time - data[i].time);
        return data[i].pitch + t * (data[i + 1].pitch - data[i].pitch);
      }
    }
    
    return 0;
  };

  // Play native audio
  const playNativeAudio = async () => {
    if (isPlayingNative) {
      if (nativeAudioRef.current) {
        nativeAudioRef.current.pause();
        nativeAudioRef.current.currentTime = 0;
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      setIsPlayingNative(false);
      setNativeAnimProgress(0);
      return;
    }

    setNativeAnimProgress(0);
    setIsPlayingNative(true);

    if (nativeAudioUrl) {
      // Play actual audio
      if (nativeAudioRef.current) {
        nativeAudioRef.current.pause();
        nativeAudioRef.current.currentTime = 0;
      }
      
      nativeAudioRef.current = new Audio(nativeAudioUrl);
      
      nativeAudioRef.current.onended = () => {
        setIsPlayingNative(false);
        setNativeAnimProgress(100);
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };

      nativeAudioRef.current.onerror = () => {
        console.error('Failed to play native audio');
        setIsPlayingNative(false);
        setNativeAnimProgress(0);
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };

      try {
        await nativeAudioRef.current.play();
      } catch (error) {
        console.error('Play error:', error);
        setIsPlayingNative(false);
        setNativeAnimProgress(0);
        return;
      }
    } else {
      // Use TTS
      const utterance = new SpeechSynthesisUtterance(nativeText);
      utterance.lang = 'en-US';
      utterance.onend = () => {
        setIsPlayingNative(false);
        setNativeAnimProgress(100);
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
      window.speechSynthesis.speak(utterance);
    }

    // Animate progress
    const duration = nativePitchData.length > 0 
      ? nativePitchData[nativePitchData.length - 1].time * 1000 
      : 2000;
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(100, (elapsed / duration) * 100);
      setNativeAnimProgress(progress);
      
      if (progress < 100 && isPlayingNative) {
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    };
    
    animate();
  };

  // Play user audio
  const playUserAudio = async () => {
    if (!userAudioRef.current) return;
    
    if (isPlayingUser) {
      userAudioRef.current.pause();
      userAudioRef.current.currentTime = 0;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      setIsPlayingUser(false);
      setUserAnimProgress(0);
      return;
    }

    setUserAnimProgress(0);
    setIsPlayingUser(true);
    
    userAudioRef.current.onended = () => {
      setIsPlayingUser(false);
      setUserAnimProgress(100);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };

    userAudioRef.current.onerror = () => {
      console.error('Failed to play user audio');
      setIsPlayingUser(false);
      setUserAnimProgress(0);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };

    try {
      await userAudioRef.current.play();
    } catch (error) {
      console.error('Play error:', error);
      setIsPlayingUser(false);
      setUserAnimProgress(0);
      return;
    }

    // Animate progress
    const duration = userPitchData.length > 0 
      ? userPitchData[userPitchData.length - 1].time * 1000 
      : 2000;
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(100, (elapsed / duration) * 100);
      setUserAnimProgress(progress);
      
      if (progress < 100 && isPlayingUser) {
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    };
    
    animate();
  };

  // Reset recording
  const resetRecording = () => {
    setUserPitchData([]);
    setHasRecorded(false);
    setMatchScore(0);
    setUserAnimProgress(0);
    setStressedWords([]);
    if (userAudioRef.current) {
      userAudioRef.current.pause();
      userAudioRef.current = null;
    }
    if (onMatchScoreChange) {
      onMatchScoreChange(0);
    }
  };

  // Analyze stressed words from pitch data
  const analyzeStressedWords = (pitchData: PitchPoint[]) => {
    if (pitchData.length === 0) return;

    const words = nativeText.split(' ');
    const duration = pitchData[pitchData.length - 1].time;
    const timePerWord = duration / words.length;

    const wordStresses: {word: string, index: number, stress: number}[] = [];

    words.forEach((word, index) => {
      const startTime = index * timePerWord;
      const endTime = (index + 1) * timePerWord;

      // Get pitch points for this word
      const wordPitches = pitchData.filter(p => p.time >= startTime && p.time <= endTime);
      
      if (wordPitches.length > 0) {
        // Calculate average pitch and variation
        const avgPitch = wordPitches.reduce((sum, p) => sum + p.pitch, 0) / wordPitches.length;
        const maxPitch = Math.max(...wordPitches.map(p => p.pitch));
        const variation = maxPitch - avgPitch;

        // Stress score based on pitch height and variation
        const stress = avgPitch + variation;
        
        wordStresses.push({ word, index, stress });
      }
    });

    // Normalize stress values
    const maxStress = Math.max(...wordStresses.map(w => w.stress));
    const minStress = Math.min(...wordStresses.map(w => w.stress));
    const stressRange = maxStress - minStress;

    const normalizedStresses = wordStresses.map(w => ({
      ...w,
      stress: stressRange > 0 ? ((w.stress - minStress) / stressRange) * 100 : 50
    }));

    setStressedWords(normalizedStresses);
  };

  // Analyze when pitch data changes
  useEffect(() => {
    if (nativePitchData.length > 0) {
      analyzeStressedWords(nativePitchData);
    }
  }, [nativePitchData]);

  // Request microphone permission and start recording directly
  const handleRecordClick = () => {
    // Directly start recording - browser will show native permission dialog if needed
    startRecording()
  };

  // Draw pitch curves on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw background
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, width, height);

    // Draw grid
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = (i / 4) * height;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Find pitch range for scaling
    const allPitches = [...nativePitchData, ...userPitchData].map(p => p.pitch);
    const minPitch = Math.min(...allPitches, 80);
    const maxPitch = Math.max(...allPitches, 300);
    const pitchRange = maxPitch - minPitch;

    // Exaggerate pitch differences (3x amplification)
    const amplification = 3;

    // Draw native pitch curve (animated)
    if (nativePitchData.length > 0) {
      const visiblePoints = Math.floor((nativeAnimProgress / 100) * nativePitchData.length);
      
      ctx.strokeStyle = '#ec4899'; // Pink
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      ctx.beginPath();
      
      for (let i = 0; i < visiblePoints; i++) {
        const point = nativePitchData[i];
        const maxTime = Math.max(
          nativePitchData[nativePitchData.length - 1]?.time || 1,
          userPitchData[userPitchData.length - 1]?.time || 1
        );
        
        const x = (point.time / maxTime) * width;
        
        // Normalize and exaggerate pitch
        const normalizedPitch = (point.pitch - minPitch) / pitchRange;
        const midPoint = 0.5;
        const deviation = normalizedPitch - midPoint;
        const exaggeratedPitch = midPoint + (deviation * amplification);
        const clampedPitch = Math.max(0, Math.min(1, exaggeratedPitch));
        
        const y = height - (clampedPitch * height);
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      
      ctx.stroke();

      // Draw label
      ctx.fillStyle = '#ec4899';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText('Native Speaker', 10, 25);
    }

    // Draw user pitch curve (animated)
    if (userPitchData.length > 0) {
      const visiblePoints = Math.floor((userAnimProgress / 100) * userPitchData.length);
      
      ctx.strokeStyle = '#f43f5e'; // Rose
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      ctx.beginPath();
      
      for (let i = 0; i < visiblePoints; i++) {
        const point = userPitchData[i];
        const maxTime = Math.max(
          nativePitchData[nativePitchData.length - 1]?.time || 1,
          userPitchData[userPitchData.length - 1]?.time || 1
        );
        
        const x = (point.time / maxTime) * width;
        
        // Normalize and exaggerate pitch
        const normalizedPitch = (point.pitch - minPitch) / pitchRange;
        const midPoint = 0.5;
        const deviation = normalizedPitch - midPoint;
        const exaggeratedPitch = midPoint + (deviation * amplification);
        const clampedPitch = Math.max(0, Math.min(1, exaggeratedPitch));
        
        const y = height - (clampedPitch * height);
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      
      ctx.stroke();

      // Draw label
      ctx.fillStyle = '#f43f5e';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText('Your Voice', 10, 50);
    }
  }, [nativePitchData, userPitchData, nativeAnimProgress, userAnimProgress]);

  return (
    <div className="space-y-6">
      {/* Instructions */}
      <div className="bg-gradient-to-r from-slate-50 to-blue-50 border border-slate-200 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6">
        <h3 className="text-slate-700 font-bold text-sm sm:text-base md:text-lg mb-2 sm:mb-3 flex items-center gap-2">
          <span className="text-xl sm:text-2xl">🎙️</span>
          발음 분석 방법
        </h3>
        <ol className="text-slate-600 space-y-1 sm:space-y-2 text-xs sm:text-sm">
          <li className="flex gap-1.5 sm:gap-2">
            <span className="font-semibold text-slate-700">1.</span>
            <span>원어민 발음을 들어보세요</span>
          </li>
          <li className="flex gap-1.5 sm:gap-2">
            <span className="font-semibold text-slate-700">2.</span>
            <span>녹음 버튼을 눌러 똑같이 따라 말해보세요</span>
          </li>
          <li className="flex gap-1.5 sm:gap-2">
            <span className="font-semibold text-slate-700">3.</span>
            <span>내 발음을 다시 듣고 비교해보세요</span>
          </li>
        </ol>
      </div>

      {/* Text to pronounce */}
      <div className="bg-white border border-gray-200 rounded-lg sm:rounded-xl p-4 sm:p-6 md:p-8 shadow-sm">
        <p className="text-gray-900 text-base sm:text-lg md:text-xl lg:text-2xl text-center font-medium leading-relaxed">
          {nativeText}
        </p>
      </div>

      {/* Controls */}
      <div className="space-y-2 sm:space-y-3">
        {/* Main Action Buttons Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
          {/* Play Native - Modern Blue */}
          <Button
            onClick={playNativeAudio}
            disabled={isRecording}
            className="py-4 sm:py-5 md:py-6 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-lg sm:rounded-xl hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center gap-1 sm:gap-2 shadow-md hover:shadow-lg transition-all duration-200 text-xs sm:text-sm md:text-base"
          >
            <Play className="w-5 h-5 sm:w-6 sm:h-6" />
            <span>원어민 듣기</span>
          </Button>

          {/* Record/Stop - Pink/Rose */}
          <Button
            onClick={isRecording ? stopRecording : handleRecordClick}
            className={`py-4 sm:py-5 md:py-6 font-semibold rounded-lg sm:rounded-xl flex flex-col items-center gap-1 sm:gap-2 shadow-md hover:shadow-lg transition-all duration-200 text-xs sm:text-sm md:text-base ${
              isRecording 
                ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white hover:from-rose-600 hover:to-pink-700 animate-pulse' 
                : 'bg-gradient-to-r from-rose-400 to-pink-500 text-white hover:from-rose-500 hover:to-pink-600'
            }`}
          >
            {isRecording ? (
              <>
                <Square className="w-5 h-5 sm:w-6 sm:h-6" />
                <span>녹음 중지</span>
              </>
            ) : (
              <>
                <Mic className="w-5 h-5 sm:w-6 sm:h-6" />
                <span>내 발음 녹음</span>
              </>
            )}
          </Button>

          {/* Play My Recording - Slate Gray */}
          <Button
            onClick={playUserAudio}
            disabled={!hasRecorded || isRecording}
            className="py-4 sm:py-5 md:py-6 bg-gradient-to-r from-slate-600 to-gray-700 text-white font-semibold rounded-lg sm:rounded-xl hover:from-slate-700 hover:to-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center gap-1 sm:gap-2 shadow-md hover:shadow-lg transition-all duration-200 text-xs sm:text-sm md:text-base"
          >
            <Play className="w-5 h-5 sm:w-6 sm:h-6" />
            <span>내 발음 듣기</span>
          </Button>
        </div>

        {/* Navigation Buttons Row */}
        {hasRecorded && (
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <Button
              onClick={resetRecording}
              className="py-3 sm:py-4 bg-white border-2 border-slate-300 text-slate-700 font-semibold rounded-lg sm:rounded-xl hover:bg-slate-50 hover:border-slate-400 flex items-center justify-center gap-1.5 sm:gap-2 shadow-sm hover:shadow-md transition-all duration-200 text-xs sm:text-sm md:text-base"
            >
              <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
              다시하기
            </Button>
            <Button
              className="py-3 sm:py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold rounded-lg sm:rounded-xl hover:from-emerald-600 hover:to-teal-700 flex items-center justify-center gap-1.5 sm:gap-2 shadow-md hover:shadow-lg transition-all duration-200 text-xs sm:text-sm md:text-base"
            >
              다음 문제
            </Button>
          </div>
        )}
      </div>

      {/* Feedback Display */}
      {feedbackLevel && hasRecorded && (
        <div className={`p-3 sm:p-4 md:p-6 rounded-lg sm:rounded-xl text-center space-y-2 sm:space-y-3 md:space-y-4 shadow-md border-2 ${
          feedbackLevel === 'great' 
            ? 'bg-emerald-50 border-emerald-200'
            : feedbackLevel === 'okay'
            ? 'bg-blue-50 border-blue-200'
            : 'bg-orange-50 border-orange-200'
        }`}>
          {/* Emoji & Title */}
          <div className="space-y-1 sm:space-y-2">
            <div className="text-3xl sm:text-4xl md:text-5xl">
              {feedbackLevel === 'great' ? '🎉' : feedbackLevel === 'okay' ? '👍' : '💪'}
            </div>
            <h3 className={`text-lg sm:text-xl md:text-2xl font-bold ${
              feedbackLevel === 'great' 
                ? 'text-emerald-700'
                : feedbackLevel === 'okay'
                ? 'text-blue-700'
                : 'text-orange-700'
            }`}>
              {feedbackLevel === 'great' ? 'Great Job!' : feedbackLevel === 'okay' ? "That's Okay!" : 'Cheer Up!'}
            </h3>
            <p className="text-xs sm:text-sm md:text-base text-gray-600">
              {feedbackLevel === 'great' && '완벽해요! 원어민 발음과 매우 유사합니다'}
              {feedbackLevel === 'okay' && '좋아요! 조금만 더 연습하면 완벽합니다'}
              {feedbackLevel === 'cheer' && '괜찮아요! 계속 연습하면 점점 나아질 거예요'}
            </p>
          </div>

          {/* Score Badge */}
          <div className="flex items-center justify-center">
            <div className={`rounded-lg py-2 sm:py-3 px-4 sm:px-6 md:px-8 ${
              feedbackLevel === 'great'
                ? 'bg-emerald-100 border border-emerald-300'
                : feedbackLevel === 'okay'
                ? 'bg-blue-100 border border-blue-300'
                : 'bg-orange-100 border border-orange-300'
            }`}>
              <div className={`text-2xl sm:text-3xl md:text-4xl font-bold ${
                feedbackLevel === 'great'
                  ? 'text-emerald-600'
                  : feedbackLevel === 'okay'
                  ? 'text-blue-600'
                  : 'text-orange-600'
              }`}>
                {matchScore}
              </div>
              <div className="text-xs font-semibold text-gray-600 mt-1">점수</div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-1000 ease-out ${
                feedbackLevel === 'great'
                  ? 'bg-emerald-500'
                  : feedbackLevel === 'okay'
                  ? 'bg-blue-500'
                  : 'bg-orange-500'
              }`}
              style={{ width: `${matchScore}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}