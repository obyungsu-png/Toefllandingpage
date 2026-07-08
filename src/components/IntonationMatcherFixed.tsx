import { useState, useEffect, useRef } from 'react';
import { Play, Mic, Square, Volume2, TrendingUp, Download, AlertCircle, TestTube } from 'lucide-react';
import { Button } from './ui/button';
import { createCachedAudioSync } from '../utils/mediaCache';

interface IntonationMatcherProps {
  nativeText: string;
  nativeAudioUrl?: string;
  onMatchScoreChange?: (score: number) => void;
}

export function IntonationMatcher({ 
  nativeText,
  nativeAudioUrl,
  onMatchScoreChange
}: IntonationMatcherProps) {
  // Canvas refs
  const nativeCanvasRef = useRef<HTMLCanvasElement>(null);
  const userCanvasRef = useRef<HTMLCanvasElement>(null);
  
  // Audio context
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  
  // MediaRecorder for saving audio
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  
  // State
  const [nativePitchData, setNativePitchData] = useState<number[]>([]);
  const [userPitchData, setUserPitchData] = useState<number[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlayingNative, setIsPlayingNative] = useState(false);
  const [matchScore, setMatchScore] = useState<number | null>(null);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [displayedNativePitch, setDisplayedNativePitch] = useState<number[]>([]);
  const [demoMode, setDemoMode] = useState(false);

  const BUFSIZE = 2048;
  const MIN_FREQ = 80;
  const MAX_FREQ = 400;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRecording();
    };
  }, []);

  // Animate native pitch display
  useEffect(() => {
    if (nativePitchData.length === 0) {
      setDisplayedNativePitch([]);
      return;
    }

    let currentIndex = 0;
    setDisplayedNativePitch([]);
    
    const animateInterval = setInterval(() => {
      currentIndex += 1;
      if (currentIndex <= nativePitchData.length) {
        setDisplayedNativePitch(nativePitchData.slice(0, currentIndex));
      } else {
        clearInterval(animateInterval);
      }
    }, 20);

    return () => clearInterval(animateInterval);
  }, [nativePitchData]);

  // Redraw canvases
  useEffect(() => {
    if (displayedNativePitch.length > 0) {
      drawCurveExaggerated(nativeCanvasRef.current, displayedNativePitch, '#ec4899');
    }
  }, [displayedNativePitch]);

  useEffect(() => {
    if (userPitchData.length > 0) {
      drawCurveExaggerated(userCanvasRef.current, userPitchData, '#f43f5e');
    }
  }, [userPitchData]);

  // Autocorrelation algorithm
  const autoCorrelate = (buf: Float32Array, sampleRate: number): number => {
    let SIZE = buf.length;
    let rms = 0;
    
    for (let i = 0; i < SIZE; i++) {
      rms += buf[i] * buf[i];
    }
    rms = Math.sqrt(rms / SIZE);
    
    if (rms < 0.01) return -1;
    
    let r1 = 0, r2 = SIZE - 1, thres = 0.2;
    for (let i = 0; i < SIZE / 2; i++) {
      if (Math.abs(buf[i]) < thres) { r1 = i; break; }
    }
    for (let i = 1; i < SIZE / 2; i++) {
      if (Math.abs(buf[SIZE - i]) < thres) { r2 = SIZE - i; break; }
    }
    
    buf = buf.slice(r1, r2);
    SIZE = buf.length;
    
    const c = new Float32Array(SIZE).fill(0);
    for (let i = 0; i < SIZE; i++) {
      for (let j = 0; j < SIZE - i; j++) {
        c[i] = c[i] + buf[j] * buf[j + i];
      }
    }
    
    let d = 0;
    while (c[d] > c[d + 1]) d++;
    
    let maxval = -1, maxpos = -1;
    for (let i = d; i < SIZE; i++) {
      if (c[i] > maxval) {
        maxval = c[i];
        maxpos = i;
      }
    }
    
    const T0 = maxpos;
    return sampleRate / T0;
  };

  // Generate native guide
  const generateNativeGuide = () => {
    const guide: number[] = [];
    
    for (let i = 0; i < 100; i++) {
      let pitch = 150 + Math.sin(i / 10) * 30;
      
      if (i > 50 && i < 70) {
        pitch += 50;
      } else if (i > 70) {
        pitch -= (i - 70) * 0.8;
      }
      
      guide.push(pitch);
    }
    
    setNativePitchData(guide);
  };

  // Play native audio
  const playNative = () => {
    setIsPlayingNative(true);
    setNativePitchData([]);
    
    if (nativeAudioUrl) {
      try {
        await extractPitchFromAudio(nativeAudioUrl);
        const audio = createCachedAudioSync(nativeAudioUrl);
        audio.play();
        audio.onended = () => setIsPlayingNative(false);
      } catch (error) {
        console.error('Error extracting pitch:', error);
        generateNativeGuide();
        setIsPlayingNative(false);
      }
    } else {
      const msg = new SpeechSynthesisUtterance(nativeText);
      msg.lang = 'en-US';
      msg.rate = 0.9;
      msg.pitch = 1.0;
      msg.onend = () => setIsPlayingNative(false);
      window.speechSynthesis.speak(msg);
      generateNativeGuide();
    }
  };

  // Extract pitch from audio
  const extractPitchFromAudio = async (audioUrl: string) => {
    return new Promise<void>((resolve, reject) => {
      const audioContext = new AudioContext();
      
      fetch(audioUrl)
        .then(response => response.arrayBuffer())
        .then(arrayBuffer => audioContext.decodeAudioData(arrayBuffer))
        .then(audioBuffer => {
          const analyser = audioContext.createAnalyser();
          analyser.fftSize = BUFSIZE;
          
          const pitchData: number[] = [];
          const data = new Float32Array(BUFSIZE);
          const sampleRate = audioContext.sampleRate;
          const duration = audioBuffer.duration;
          const chunkSize = 0.05;
          const numChunks = Math.floor(duration / chunkSize);
          
          for (let i = 0; i < numChunks; i++) {
            const startSample = Math.floor(i * chunkSize * sampleRate);
            const endSample = Math.min(startSample + BUFSIZE, audioBuffer.length);
            const channelData = audioBuffer.getChannelData(0);
            
            for (let j = 0; j < BUFSIZE && startSample + j < endSample; j++) {
              data[j] = channelData[startSample + j];
            }
            
            const pitch = autoCorrelate(data, sampleRate);
            if (pitch > MIN_FREQ && pitch < MAX_FREQ) {
              pitchData.push(pitch);
            } else if (pitchData.length > 0) {
              pitchData.push(pitchData[pitchData.length - 1]);
            }
          }
          
          if (pitchData.length > 0) {
            setNativePitchData(pitchData);
          } else {
            generateNativeGuide();
          }
          
          audioContext.close();
          resolve();
        })
        .catch(error => {
          audioContext.close();
          reject(error);
        });
    });
  };

  // DEMO MODE - Simulate recording without microphone
  const startDemoRecording = () => {
    setDemoMode(true);
    setIsRecording(true);
    setUserPitchData([]);
    setMatchScore(null);
    setError(null);
    
    // Simulate user pitch data (slightly different from native)
    let currentIndex = 0;
    const demoInterval = setInterval(() => {
      if (currentIndex >= 100) {
        clearInterval(demoInterval);
        setIsRecording(false);
        setDemoMode(false);
        
        // Calculate score
        setTimeout(() => {
          calculateScore();
        }, 500);
        return;
      }
      
      // Generate pitch data similar to native but with variation
      let pitch = 145 + Math.sin(currentIndex / 10) * 28;
      
      if (currentIndex > 50 && currentIndex < 70) {
        pitch += 45;
      } else if (currentIndex > 70) {
        pitch -= (currentIndex - 70) * 0.75;
      }
      
      // Add random variation
      pitch += (Math.random() - 0.5) * 10;
      
      setUserPitchData(prev => [...prev, pitch]);
      currentIndex++;
    }, 50);
  };

  // Start real recording
  const startRecording = async () => {
    try {
      setError(null);
      
      // Check if microphone is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError('이 브라우저는 마이크를 지원하지 않습니다. 데모 모드를 사용해보세요.');
        return;
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      mediaStreamRef.current = stream;
      
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = BUFSIZE;
      analyserRef.current = analyser;
      
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      
      setIsRecording(true);
      setUserPitchData([]);
      setMatchScore(null);
      
      processUserAudio();
      
      // MediaRecorder
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setRecordedAudioUrl(audioUrl);
      };
      
      mediaRecorder.start();
    } catch (error: any) {
      console.error('Error starting recording:', error);
      
      if (error.name === 'NotAllowedError') {
        setError('마이크 권한이 필요합니다. 대신 데모 모드를 사용해보세요!');
      } else if (error.name === 'NotFoundError') {
        setError('마이크를 찾을 수 없습니다. 데모 모드를 사용해보세요!');
      } else if (error.name === 'NotReadableError') {
        setError('마이크가 다른 앱에서 사용 중입니다. 데모 모드를 사용해보세요!');
      } else {
        setError(`오류가 발생했습니다. 데모 모드를 사용해보세요!`);
      }
    }
  };

  // Stop recording
  const stopRecording = () => {
    setIsRecording(false);
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    analyserRef.current = null;
    
    if (userPitchData.length > 10) {
      calculateScore();
    }
    
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
  };

  // Process audio
  const processUserAudio = () => {
    if (!analyserRef.current || !audioContextRef.current) return;
    
    const analyser = analyserRef.current;
    const data = new Float32Array(BUFSIZE);
    
    const analyze = () => {
      if (!analyserRef.current || !audioContextRef.current) return;
      
      analyser.getFloatTimeDomainData(data);
      const pitch = autoCorrelate(data, audioContextRef.current.sampleRate);
      
      if (pitch > MIN_FREQ && pitch < MAX_FREQ) {
        setUserPitchData(prev => [...prev, pitch]);
      } else if (userPitchData.length > 0) {
        setUserPitchData(prev => [...prev, prev[prev.length - 1]]);
      }
      
      animationFrameRef.current = requestAnimationFrame(analyze);
    };
    
    analyze();
  };

  // Draw curve
  const drawCurveExaggerated = (
    canvas: HTMLCanvasElement | null,
    data: number[],
    color: string
  ) => {
    if (!canvas || data.length < 2) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const width = canvas.width;
    const height = canvas.height;
    
    ctx.clearRect(0, 0, width, height);
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    
    const step = width / (data.length - 1);
    
    for (let i = 0; i < data.length; i++) {
      const x = i * step;
      const y = height - ((data[i] - MIN_FREQ) / (MAX_FREQ - MIN_FREQ) * height);
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, color + '66');
    gradient.addColorStop(1, 'transparent');
    
    ctx.lineTo((data.length - 1) * step, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.stroke();
  };

  // Calculate score
  const calculateScore = () => {
    if (userPitchData.length < 10 || nativePitchData.length === 0) return;
    
    const normalizedUser: number[] = [];
    const ratio = userPitchData.length / nativePitchData.length;
    
    for (let i = 0; i < nativePitchData.length; i++) {
      normalizedUser.push(userPitchData[Math.floor(i * ratio)] || userPitchData[userPitchData.length - 1]);
    }
    
    let totalDiff = 0;
    for (let i = 0; i < nativePitchData.length; i++) {
      const diff = Math.abs(nativePitchData[i] - normalizedUser[i]) / nativePitchData[i];
      totalDiff += diff;
    }
    
    const avgDiff = totalDiff / nativePitchData.length;
    const finalScore = Math.max(0, Math.round((1 - avgDiff) * 100));
    
    setMatchScore(finalScore);
    if (onMatchScoreChange) {
      onMatchScoreChange(finalScore);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const downloadRecording = () => {
    if (!recordedAudioUrl) return;
    
    const now = new Date();
    const filename = `shadowing_${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}-${String(now.getSeconds()).padStart(2, '0')}.webm`;
    
    const a = document.createElement('a');
    a.href = recordedAudioUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#e91e63] via-[#c2185b] to-[#ad1457] rounded-2xl p-8 mb-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">Intonation Matcher</h1>
        </div>
        <p className="text-white/90 text-lg">원어민 발음과 내 억양을 실시간으로 비교하고 개선하세요</p>
      </div>

      {/* Sentence Box */}
      <div className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-2xl p-6 mb-6 border-l-4 border-pink-500 shadow-lg">
        <div className="flex items-start gap-4">
          <Volume2 className="w-8 h-8 text-pink-600 flex-shrink-0 mt-1" />
          <div>
            <div className="text-sm text-pink-600 font-semibold mb-2">Practice Sentence</div>
            <p className="text-2xl font-bold text-gray-800">{nativeText}</p>
          </div>
        </div>
      </div>

      {/* Visualization */}
      <div className="bg-gradient-to-br from-[#1e1e2e] to-[#2a2a3e] rounded-2xl p-6 mb-6 shadow-2xl">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-3 h-3 rounded-full bg-pink-500 shadow-lg shadow-pink-500/50"></div>
            <span className="text-white font-semibold">Native Speaker Intonation</span>
          </div>
          <div className="bg-black/30 rounded-xl p-4 backdrop-blur-sm border border-white/10">
            <canvas ref={nativeCanvasRef} width={800} height={120} className="w-full h-auto" />
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-3 h-3 rounded-full bg-rose-500 shadow-lg shadow-rose-500/50 animate-pulse"></div>
            <span className="text-white font-semibold">Your Intonation</span>
          </div>
          <div className="bg-black/30 rounded-xl p-4 backdrop-blur-sm border border-white/10 min-h-[152px] flex items-center justify-center">
            {userPitchData.length > 0 ? (
              <canvas ref={userCanvasRef} width={800} height={120} className="w-full h-auto" />
            ) : (
              <p className="text-gray-400 text-sm">녹음을 시작하면 여기에 음성 패턴이 표시됩니다</p>
            )}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Button
          onClick={playNative}
          disabled={isPlayingNative}
          className="py-6 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white font-bold text-lg rounded-xl shadow-lg shadow-pink-500/30 transition-all duration-300 disabled:opacity-50"
        >
          <Play className="w-5 h-5 mr-2" />
          {isPlayingNative ? 'Playing...' : 'Play Native'}
        </Button>

        <Button
          onClick={toggleRecording}
          className={`py-6 font-bold text-lg rounded-xl shadow-lg transition-all duration-300 ${
            isRecording
              ? 'bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 shadow-rose-500/30 animate-pulse'
              : 'bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 shadow-rose-500/30'
          }`}
        >
          {isRecording ? (
            <>
              <Square className="w-5 h-5 mr-2" />
              Stop Recording
            </>
          ) : (
            <>
              <Mic className="w-5 h-5 mr-2" />
              Start Recording
            </>
          )}
        </Button>

        <Button
          onClick={startDemoRecording}
          disabled={isRecording}
          className="py-6 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-bold text-lg rounded-xl shadow-lg shadow-purple-500/30 transition-all duration-300 disabled:opacity-50"
        >
          <TestTube className="w-5 h-5 mr-2" />
          Demo Mode
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-400 rounded-2xl p-6 mb-6 shadow-lg">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h4 className="text-lg font-bold text-yellow-800 mb-2">마이크 사용 불가</h4>
              <p className="text-yellow-700 mb-4">{error}</p>
              <div className="bg-white/60 rounded-lg p-4 border border-yellow-200 mb-4">
                <p className="text-sm font-semibold text-yellow-900 mb-2">💡 해결 방법:</p>
                <ul className="text-sm text-yellow-800 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-600 font-bold">1.</span>
                    <span><strong>"Demo Mode"</strong> 버튼을 클릭하여 마이크 없이 테스트하세요</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-600 font-bold">2.</span>
                    <span>또는 브라우저 주소창 왼쪽 🔒를 클릭하여 마이크 권한을 허용하세요</span>
                  </li>
                </ul>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={startDemoRecording}
                  className="px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white font-bold rounded-lg transition-colors duration-200 shadow-lg"
                >
                  🧪 Demo Mode로 시작하기
                </button>
                <button
                  onClick={() => setError(null)}
                  className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-lg transition-colors duration-200"
                >
                  확인
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Score Panel */}
      {matchScore !== null && (
        <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 rounded-2xl p-8 shadow-xl border-2 border-emerald-200 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 rounded-full mb-4 shadow-md">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              <span className="text-sm font-semibold text-emerald-700">Your Intonation Match Score</span>
            </div>
            
            <div className={`text-7xl font-black mb-4 bg-gradient-to-r ${
              matchScore >= 75 
                ? 'from-emerald-600 to-teal-600' 
                : matchScore >= 50 
                ? 'from-blue-600 to-cyan-600' 
                : 'from-orange-600 to-red-600'
            } bg-clip-text text-transparent`}>
              {matchScore}%
            </div>
            
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="h-2 bg-gray-200 rounded-full w-64">
                <div 
                  className={`h-2 rounded-full transition-all duration-1000 ${
                    matchScore >= 75 
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500' 
                      : matchScore >= 50 
                      ? 'bg-gradient-to-r from-blue-500 to-cyan-500' 
                      : 'bg-gradient-to-r from-orange-500 to-red-500'
                  }`}
                  style={{ width: `${matchScore}%` }}
                />
              </div>
            </div>
            
            <p className="text-lg font-semibold text-gray-700 mb-6">
              {matchScore >= 75 && '🎉 Excellent! Your intonation closely matches native speakers!'}
              {matchScore >= 50 && matchScore < 75 && '👍 Good job! Keep practicing to improve further!'}
              {matchScore < 50 && '💪 Keep going! Practice makes perfect!'}
            </p>

            {recordedAudioUrl && (
              <Button
                onClick={downloadRecording}
                className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-bold px-8 py-4 rounded-xl shadow-lg shadow-purple-500/30 transition-all duration-300 transform hover:scale-105"
              >
                <Download className="w-5 h-5 mr-2" />
                녹음 파일 다운로드
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-6 mt-6 border-2 border-blue-200 shadow-lg">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-[#e91e63] rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold">💡</span>
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-gray-800 mb-3">사용 방법</h4>
            <div className="grid md:grid-cols-2 gap-3 text-sm text-gray-600">
              <div className="flex items-start gap-2">
                <span className="text-pink-500 font-bold">1.</span>
                <span><strong>"Play Native"</strong>를 클릭하여 원어민 발음을 들어보세요</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-pink-500 font-bold">2.</span>
                <span><strong>"Demo Mode"</strong>로 마이크 없이 테스트할 수 있습니다</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-pink-500 font-bold">3.</span>
                <span><strong>"Start Recording"</strong>을 클릭하고 문장을 따라 말하세요</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-pink-500 font-bold">4.</span>
                <span>녹음을 멈추면 자동으로 점수가 계산됩니다</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
