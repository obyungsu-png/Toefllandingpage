import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Volume2, X, CheckCircle } from 'lucide-react';
import { Button } from './ui/button';
import { LMSContent } from './LMSSection';
import { PronunciationAnalyzer } from './PronunciationAnalyzer';

interface ListenAndResponseProps {
  level: number;
  day: string;
  onBack: () => void;
  lmsContents?: LMSContent[];
}

// TOEFL style listening questions for DAY 1 (fallback if no LMS content)
const sampleQuestions = [
  {
    id: 1,
    audio: "오디오를 듣고 받아쓰세요.",
    correctAnswer: "The library is located on the second floor.",
    audioUrl: ""
  },
  {
    id: 2,
    audio: "오디오를 듣고 받아쓰세요.",
    correctAnswer: "Students must register for classes by Friday.",
    audioUrl: ""
  },
  {
    id: 3,
    audio: "오디오를 듣고 받아쓰세요.",
    correctAnswer: "The professor postponed the exam until next week.",
    audioUrl: ""
  },
  {
    id: 4,
    audio: "오디오를 듣고 받아쓰세요.",
    correctAnswer: "She's conducting research on climate change.",
    audioUrl: ""
  },
  {
    id: 5,
    audio: "오디오를 듣고 받아쓰세요.",
    correctAnswer: "The assignment is due on Monday morning.",
    audioUrl: ""
  },
  {
    id: 6,
    audio: "오디오를 듣고 받아쓰세요.",
    correctAnswer: "He graduated from university last semester.",
    audioUrl: ""
  },
  {
    id: 7,
    audio: "오디오를 듣고 받아쓰세요.",
    correctAnswer: "The lecture covers ancient history topics.",
    audioUrl: ""
  },
  {
    id: 8,
    audio: "오디오를 듣고 받아쓰세요.",
    correctAnswer: "They're organizing a campus tour tomorrow.",
    audioUrl: ""
  },
  {
    id: 9,
    audio: "오디오를 듣고 받아쓰세요.",
    correctAnswer: "The bookstore opens at eight in the morning.",
    audioUrl: ""
  },
  {
    id: 10,
    audio: "오디오를 듣고 받아쓰세요.",
    correctAnswer: "She's majoring in computer science.",
    audioUrl: ""
  }
];

export function ListenAndResponse({ level, day, onBack, lmsContents = [] }: ListenAndResponseProps) {
  // Convert LMS contents to question format
  const lmsQuestions = lmsContents.map((content, index) => ({
    id: index + 1,
    audio: content.title || "오디오를 듣고 받아쓰세요.",
    correctAnswer: content.content || "",
    audioUrl: content.fileUrl || "" // This is the base64 audio from LMS
  }));

  // Use LMS content if available, otherwise use sample questions
  const questions = lmsQuestions.length > 0 ? lmsQuestions : sampleQuestions;

  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [userAnswer, setUserAnswer] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [showShadowing, setShowShadowing] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const totalQuestions = questions.length;
  const currentQ = questions[currentQuestion - 1];
  const accuracy = currentQuestion > 0 ? Math.round((correctCount / currentQuestion) * 100) : 0;

  // Sound effects
  const playCorrectSound = () => {
    const audio = new Audio();
    // Ding-dong sound (positive feedback)
    const audioContext = new AudioContext();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    gainNode.gain.value = 0.3;
    
    oscillator.start(audioContext.currentTime);
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.1);
    oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.2);
    
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    oscillator.stop(audioContext.currentTime + 0.3);
  };

  const playIncorrectSound = () => {
    // Buzzer sound (negative feedback)
    const audioContext = new AudioContext();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.type = 'sawtooth';
    oscillator.frequency.value = 200;
    gainNode.gain.value = 0.3;
    
    oscillator.start(audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    oscillator.stop(audioContext.currentTime + 0.5);
  };

  // Clean up speech synthesis and audio on unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Play uploaded MP3 audio or use TTS
  const playAudio = () => {
    if (currentQ.audioUrl) {
      // Play uploaded MP3 audio
      if (audioRef.current) {
        audioRef.current.pause();
      }
      
      const audio = new Audio(currentQ.audioUrl);
      audio.playbackRate = playbackSpeed;
      audioRef.current = audio;
      
      setIsPlaying(true);
      setProgress(0);
      
      // Update progress
      const updateProgress = () => {
        if (audio.duration) {
          const currentProgress = (audio.currentTime / audio.duration) * 100;
          setProgress(currentProgress);
        }
      };
      
      audio.addEventListener('timeupdate', updateProgress);
      
      audio.onended = () => {
        setIsPlaying(false);
        setProgress(100);
        audio.removeEventListener('timeupdate', updateProgress);
      };
      
      audio.onerror = () => {
        setIsPlaying(false);
        setProgress(0);
        console.error('Audio playback error');
        alert('오디오 파일을 재생할 수 없습니다. 파일이 올바르게 업로드되었는지 확인해주세요.');
      };
      
      audio.play().catch(err => {
        console.error('Failed to play audio:', err);
        setIsPlaying(false);
        alert('오디오 재생에 실패했습니다.');
      });
    } else {
      alert('업로드된 오디오 파일이 없습니다.');
    }
  };

  const stopAudio = () => {
    window.speechSynthesis.cancel();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setProgress(0);
  };

  const handleCheckAnswer = () => {
    const userAnswerTrimmed = userAnswer.trim().toLowerCase().replace(/[.,!?]/g, '');
    const correctAnswerTrimmed = currentQ.correctAnswer.toLowerCase().replace(/[.,!?]/g, '');
    const isCorrect = userAnswerTrimmed === correctAnswerTrimmed;
    if (isCorrect) {
      setCorrectCount(correctCount + 1);
      playCorrectSound();
    } else {
      playIncorrectSound();
    }
    setShowResult(true);
  };

  const handleNext = () => {
    // Show final result screen (with speaker) first
    if (!showShadowing) {
      setShowShadowing(true);
      setShowResult(false);
      stopAudio();
      return;
    }

    // After shadowing, move to next question or complete
    if (showShadowing) {
      if (currentQuestion < totalQuestions) {
        setCurrentQuestion(currentQuestion + 1);
        setUserAnswer('');
        setShowResult(false);
        setShowShadowing(false);
        setProgress(0);
        stopAudio();
      } else {
        // Test completed
        const finalAccuracy = Math.round((correctCount / totalQuestions) * 100);
        alert(`테스트 완료!\n총 ${totalQuestions}문제 중 ${correctCount}개 정답\n정답률: ${finalAccuracy}%`);
        onBack();
      }
    }
  };

  const handleRetry = () => {
    setUserAnswer('');
    setShowResult(false);
    setProgress(0);
    stopAudio();
  };

  const cycleSpeed = () => {
    const speeds = [1.0, 0.8, 0.6];
    const currentIndex = speeds.indexOf(playbackSpeed);
    const nextIndex = (currentIndex + 1) % speeds.length;
    const newSpeed = speeds[nextIndex];
    setPlaybackSpeed(newSpeed);
    
    // Update audio playback speed if audio is playing
    if (audioRef.current) {
      audioRef.current.playbackRate = newSpeed;
    }
  };

  const isCorrectAnswer = userAnswer.trim().toLowerCase().replace(/[.,!?]/g, '') === 
                          currentQ.correctAnswer.toLowerCase().replace(/[.,!?]/g, '');

  const handleBackFromShadowing = () => {
    setShowShadowing(false);
    setShowResult(true);
    stopAudio();
  };

  // State for match score from PronunciationAnalyzer
  const [pronunciationScore, setPronunciationScore] = useState<number>(0);

  // Get evaluation message based on score
  const getEvaluationMessage = (score: number) => {
    if (score >= 75) {
      return {
        emoji: '🎉',
        title: 'Great Job!',
        subtitle: '완벽해요! 원어민 발음과 매우 유사합니다',
        color: 'from-emerald-500 to-teal-500',
        bgColor: 'from-emerald-50 to-teal-50',
        borderColor: 'border-emerald-400'
      };
    } else if (score >= 50) {
      return {
        emoji: '👍',
        title: "That's Okay!",
        subtitle: '좋아요! 조금만 더 연습하면 완벽합니다',
        color: 'from-blue-500 to-cyan-500',
        bgColor: 'from-blue-50 to-cyan-50',
        borderColor: 'border-blue-400'
      };
    } else {
      return {
        emoji: '💪',
        title: 'Cheer Up!',
        subtitle: '괜찮아요! 계속 연습하면 점점 나아질 거예요',
        color: 'from-orange-500 to-pink-500',
        bgColor: 'from-orange-50 to-pink-50',
        borderColor: 'border-orange-400'
      };
    }
  };

  const evaluation = getEvaluationMessage(pronunciationScore);

  // Shadowing Screen
  if (showShadowing) {
    return (
      <div className="min-h-screen bg-white">
        {/* Main Content */}
        <div className="max-w-4xl mx-auto px-4 md:px-8 py-8">
          {/* Back Button */}
          <button
            onClick={onBack}
            className="text-gray-600 hover:text-gray-800 mb-6 text-sm flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            돌아가기
          </button>

          {/* Breadcrumb */}
          <div className="text-gray-500 mb-6 text-sm md:text-base">
            Part 1 &gt; {day}
          </div>

          {/* Progress Bar */}
          <div className="bg-white border-2 border-gray-200 rounded-xl p-4 md:p-6 mb-6">
            <div className="text-center text-sm md:text-base">
              <span className="font-bold">문항 : {currentQuestion}/{totalQuestions}</span>
              <span className="mx-2">|</span>
              <span>맞은 개수 : {correctCount}</span>
              <span className="mx-2">|</span>
              <span>정답률 : {accuracy}%</span>
            </div>
          </div>

          {/* Pronunciation Analyzer - Pitch Comparison */}
          <div className="mb-6">
            <PronunciationAnalyzer
              nativeText={currentQ.correctAnswer}
              nativeAudioUrl={currentQ.audioUrl}
              onMatchScoreChange={setPronunciationScore}
            />
          </div>

          {/* Pronunciation Evaluation - above buttons */}
          {pronunciationScore > 0 && (
            <div className={`bg-gradient-to-r ${evaluation.bgColor} border-2 ${evaluation.borderColor} rounded-2xl p-6 mb-6 shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-500`} >
              <div className="text-center">
                <div className="text-5xl mb-3">{evaluation.emoji}</div>
                <h3 className={`text-3xl font-black mb-2 bg-gradient-to-r ${evaluation.color} bg-clip-text text-transparent`} >
                  {evaluation.title}
                </h3>
                <p className="text-gray-700 text-lg font-medium">
                  {evaluation.subtitle}
                </p>
                <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-white/70 rounded-full">
                  <span className="text-2xl font-bold bg-gradient-to-r ${evaluation.color} bg-clip-text text-transparent">
                    {pronunciationScore}%
                  </span>
                  <span className="text-sm text-gray-600">일치도</span>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-4">
            <Button
              onClick={handleBackFromShadowing}
              className="py-6 bg-white border-2 border-[#e91e63] text-[#e91e63] text-lg md:text-xl font-bold rounded-xl hover:bg-pink-50 transition-all"
            >
              이전
            </Button>
            <Button
              onClick={handleNext}
              className="py-6 bg-gradient-to-r from-[#e91e63] to-[#c2185b] text-white text-lg md:text-xl font-bold rounded-xl hover:opacity-90 transition-all"
            >
              {currentQuestion < totalQuestions ? '다음 문제' : '완료'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 md:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={onBack}
          className="text-gray-600 hover:text-gray-800 mb-6 text-sm flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          돌아가기
        </button>

        {/* Breadcrumb */}
        <div className="text-gray-500 mb-6 text-sm md:text-base">
          Part 1 &gt; {day}
        </div>

        {/* Progress Bar */}
        <div className="bg-white border-2 border-gray-200 rounded-xl p-4 md:p-6 mb-6">
          <div className="text-center text-sm md:text-base">
            <span className="font-bold">문항 : {currentQuestion}/{totalQuestions}</span>
            <span className="mx-2">|</span>
            <span>맞은 개수 : {correctCount}</span>
            <span className="mx-2">|</span>
            <span>정답률 : {accuracy}%</span>
          </div>
        </div>

        {!showResult ? (
          <>
            {/* Question Area */}
            <div className="bg-gray-50 rounded-xl p-6 md:p-8 mb-6">
              <p className="text-gray-700 text-lg md:text-xl mb-6">
                {currentQ.audio}
              </p>

              {/* Audio Player Section */}
              <div className="bg-white rounded-xl p-6 mb-6 shadow-sm">
                {/* Play Button and Speed Control */}
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={() => isPlaying ? stopAudio() : playAudio()}
                    className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-r from-[#e91e63] to-[#c2185b] rounded-2xl flex items-center justify-center hover:opacity-90 transition-all shadow-lg"
                  >
                    {isPlaying ? (
                      <svg 
                        className="w-8 h-8 md:w-10 md:h-10 text-white" 
                        fill="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                      </svg>
                    ) : (
                      <svg 
                        className="w-8 h-8 md:w-10 md:h-10 text-white ml-1" 
                        fill="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    )}
                  </button>

                  <button
                    onClick={cycleSpeed}
                    className="px-3 md:px-4 py-2 md:py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-all text-sm md:text-base font-semibold"
                  >
                    x {playbackSpeed.toFixed(1)}
                  </button>
                </div>

                {/* Progress Bar */}
                <div className="relative">
                  <div className="h-2 bg-gray-300 rounded-full">
                    <div 
                      className="h-2 bg-gray-600 rounded-full transition-all duration-200"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-2 text-xs md:text-sm text-gray-500">
                    <span>00:00</span>
                    <span>00:{Math.ceil((currentQ.correctAnswer.length / 15) / playbackSpeed).toString().padStart(2, '0')}</span>
                  </div>
                </div>

                {/* Additional Info */}
                <div className="mt-4 flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                  </svg>
                  <span className="text-gray-600 text-sm md:text-base">업로드된 오디오 파일</span>
                </div>
              </div>

              {/* Answer Input */}
              <textarea
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder="answer"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#e91e63] text-base md:text-lg resize-none"
                rows={3}
              />
            </div>

            {/* Check Answer Button */}
            <Button
              onClick={handleCheckAnswer}
              disabled={!userAnswer.trim()}
              className="w-full py-6 bg-gradient-to-r from-[#e91e63] to-[#c2185b] text-white text-lg md:text-xl font-bold rounded-xl hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              정답 확인하기
            </Button>
          </>
        ) : (
          <>
            {/* Result Section */}
            <div className="bg-gray-50 rounded-xl p-6 md:p-8 mb-6">
              <p className="text-gray-700 text-lg md:text-xl mb-6">
                {currentQ.audio}
              </p>

              {/* Audio Player Section */}
              <div className="bg-white rounded-xl p-6 mb-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={() => isPlaying ? stopAudio() : playAudio()}
                    className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-r from-[#e91e63] to-[#c2185b] rounded-2xl flex items-center justify-center hover:opacity-90 transition-all shadow-lg"
                  >
                    {isPlaying ? (
                      <svg 
                        className="w-8 h-8 md:w-10 md:h-10 text-white" 
                        fill="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                      </svg>
                    ) : (
                      <svg 
                        className="w-8 h-8 md:w-10 md:h-10 text-white ml-1" 
                        fill="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    )}
                  </button>

                  <button
                    onClick={cycleSpeed}
                    className="px-3 md:px-4 py-2 md:py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-all text-sm md:text-base font-semibold"
                  >
                    x {playbackSpeed.toFixed(1)}
                  </button>
                </div>

                <div className="relative">
                  <div className="h-2 bg-gray-300 rounded-full">
                    <div 
                      className="h-2 bg-gray-600 rounded-full transition-all duration-200"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-2 text-xs md:text-sm text-gray-500">
                    <span>00:00</span>
                    <span>00:{Math.ceil((currentQ.correctAnswer.length / 15) / playbackSpeed).toString().padStart(2, '0')}</span>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                  </svg>
                  <span className="text-gray-600 text-sm md:text-base">업로드된 오디오 파일</span>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="h-1 bg-gray-300 rounded-full mb-6"></div>

            {/* Correct Answer */}
            <div className="mb-6">
              <h3 className="text-[#e91e63] font-bold text-lg md:text-xl mb-3">정답</h3>
              <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                <p className="text-gray-800 text-base md:text-lg">
                  {currentQ.correctAnswer}
                </p>
              </div>
            </div>

            {/* Divider */}
            <div className="h-1 bg-gray-300 rounded-full mb-6"></div>

            {/* User Answer */}
            <div className="mb-6">
              <h3 className="text-[#e91e63] font-bold text-lg md:text-xl mb-3">내가 쓴 답</h3>
              <div className={`border-2 rounded-lg p-4 flex items-start gap-3 ${
                isCorrectAnswer 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                {isCorrectAnswer ? (
                  <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                ) : (
                  <X className="w-6 h-6 text-red-500 flex-shrink-0 mt-1" />
                )}
                <p className="text-gray-800 text-base md:text-lg flex-1">
                  {userAnswer || '(답변 없음)'}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-4">
              <Button
                onClick={handleRetry}
                className="py-6 bg-white border-2 border-[#e91e63] text-[#e91e63] text-lg md:text-xl font-bold rounded-xl hover:bg-pink-50 transition-all"
              >
                받아쓰기 다시하기
              </Button>
              <Button
                onClick={handleNext}
                className="py-6 bg-gradient-to-r from-[#e91e63] to-[#c2185b] text-white text-lg md:text-xl font-bold rounded-xl hover:opacity-90 transition-all"
              >
                쉐도잉
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}