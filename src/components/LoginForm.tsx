import { useState, useEffect } from 'react';
import { X, User, Lock, Shield, Mail, Cloud, Laptop } from 'lucide-react';
import { SERVER_BASE_URL, getServerHeaders } from '../utils/apiConfig';

interface LoginFormProps {
  onClose: () => void;
  onLoginSuccess?: (username: string) => void; // Pass username on success
  onShowRegister?: () => void;
}

export function LoginForm({ onClose, onLoginSuccess, onShowRegister }: LoginFormProps) {
  const [captcha, setCaptcha] = useState('');
  const [captchaRotation, setCaptchaRotation] = useState(0);
  const [captchaColor, setCaptchaColor] = useState('#555');
  const [loginMethod, setLoginMethod] = useState<'username' | 'email'>('username');
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStatus, setForgotStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  
  // Form fields
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');

  const generateCaptcha = () => {
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    let newCaptcha = '';
    for (let i = 0; i < 4; i++) {
      newCaptcha += chars[Math.floor(Math.random() * chars.length)];
    }
    
    const rotation = Math.floor(Math.random() * 20) - 10;
    const color = '#' + Math.floor(Math.random() * 16777215).toString(16);
    
    setCaptcha(newCaptcha);
    setCaptchaRotation(rotation);
    setCaptchaColor(color);
  };

  useEffect(() => {
    generateCaptcha();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate captcha
    if (captchaInput.toLowerCase() !== captcha.toLowerCase()) {
      alert('보안 코드가 올바르지 않아요. 다시 확인해주세요.');
      generateCaptcha();
      setCaptchaInput('');
      return;
    }

    // Call server API for login
    const doLogin = async () => {
      try {
        const response = await fetch(`${SERVER_BASE_URL}/users/login`, {
          method: 'POST',
          headers: {
            ...getServerHeaders(),
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            username: loginMethod === 'username' ? username : undefined,
            email: loginMethod === 'email' ? email : undefined,
            password,
            loginMethod
          })
        });

        // Read response as text first to check format
        const responseText = await response.text();
        console.log('Login response:', responseText);

        let data;
        try {
          data = JSON.parse(responseText);
        } catch (parseError) {
          console.error('Failed to parse response:', responseText);
          alert('Server returned invalid response. Please try again or contact support.');
          generateCaptcha();
          setCaptchaInput('');
          return;
        }

        if (!response.ok) {
          alert(data.error || 'Login failed');
          generateCaptcha();
          setCaptchaInput('');
          return;
        }

        // Login successful
        alert(`Login Successful!\n\nWelcome back, ${data.user.username}!`);
        
        if (onLoginSuccess) {
          onLoginSuccess(data.user.username);
        }
      } catch (error) {
        console.error('Login error:', error);
        alert('Failed to connect to server. Please try again.');
        generateCaptcha();
        setCaptchaInput('');
      }
    };

    doLogin();
  };

  const handleForgotPassword = async () => {
    if (!forgotEmail.trim() || !forgotEmail.includes('@')) {
      setForgotStatus('error');
      return;
    }
    setForgotStatus('sending');
    try {
      const response = await fetch(`${SERVER_BASE_URL}/users/forgot-password`, {
        method: 'POST',
        headers: {
          ...getServerHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: forgotEmail.trim() })
      });
      if (response.ok) {
        setForgotStatus('sent');
      } else {
        // Even on server error, show generic success message for security
        setForgotStatus('sent');
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      // Show success message regardless (don't reveal whether email exists)
      setForgotStatus('sent');
    }
  };

  return (
    <div className="relative w-full min-h-[calc(100vh-80px)] flex items-center justify-center bg-gradient-to-br from-[#4FC3F7] to-[#29B6F6] animate-fadeIn py-4 md:py-10">
      {/* Background clouds */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <Cloud className="absolute top-[5%] left-[10%] text-[3rem] md:text-[4rem] text-white/40 animate-floatCloud" style={{ animationDuration: '25s' }} />
        <Cloud className="absolute top-[15%] right-[15%] text-[4rem] md:text-[6rem] text-white/40 animate-floatCloudReverse" style={{ animationDuration: '30s' }} />
        <Cloud className="absolute bottom-[10%] left-[20%] text-[2rem] md:text-[3rem] text-white/40 animate-floatCloud" style={{ animationDuration: '20s' }} />
      </div>

      {/* Container */}
      <div className="relative z-10 w-[95%] md:w-[90%] max-w-[1200px] flex flex-col md:flex-row items-center justify-between gap-6 md:gap-10 p-3 md:p-5">
        {/* Left: Hero Section - Hidden on mobile */}
        <div className="hidden md:flex flex-1 text-white text-center p-5 animate-fadeInUp flex-col">
          <h1 className="text-5xl font-bold mb-3 drop-shadow-md">
            Practice Makes Perfect.
          </h1>
          <p className="text-2xl mb-10 animate-fadeInUp" style={{ animationDelay: '0.3s' }}>
            Knowledge Advances by Steps Not by Leaps.
          </p>
          
          <div className="w-[300px] h-[200px] bg-white/20 border-4 border-white rounded-xl mx-auto flex items-center justify-center backdrop-blur-sm animate-float">
            <Laptop className="w-20 h-20 text-white" />
          </div>
        </div>

        {/* Right: Login Form */}
        <div className="flex-none w-full md:w-[450px] bg-white/25 p-5 md:p-10 rounded-2xl backdrop-blur-xl shadow-2xl border border-white/20 animate-slideInRight" style={{ opacity: 0 }}>
          <h2 className="text-center text-2xl md:text-3xl text-[#333] mb-6 md:mb-8 font-bold tracking-wide">
            로그인
          </h2>
          
          {/* Login Method Toggle */}
          <div className="flex gap-2 mb-6 bg-white/50 rounded-lg p-1">
            <button
              type="button"
              onClick={() => setLoginMethod('username')}
              className={`flex-1 py-2 rounded-md font-semibold text-sm transition-all ${
                loginMethod === 'username' 
                  ? 'bg-[#29B6F6] text-white shadow-md' 
                  : 'bg-transparent text-[#666] hover:bg-white/50'
              }`}
            >
              사용자명 로그인
            </button>
            <button
              type="button"
              onClick={() => setLoginMethod('email')}
              className={`flex-1 py-2 rounded-md font-semibold text-sm transition-all ${
                loginMethod === 'email' 
                  ? 'bg-[#29B6F6] text-white shadow-md' 
                  : 'bg-transparent text-[#666] hover:bg-white/50'
              }`}
            >
              이메일 로그인
            </button>
          </div>
          
          <form onSubmit={handleSubmit}>
            {/* Username or Phone Number */}
            {loginMethod === 'username' ? (
              <div className="relative mb-5">
                <input
                  type="text"
                  placeholder="사용자명"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-md bg-white text-[#333] transition-all focus:outline-none focus:ring-4 focus:ring-[#29B6F6]/30 shadow-sm"
                />
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[#aaa] transition-colors" />
              </div>
            ) : (
              <div className="relative mb-5">
                <input
                  type="email"
                  placeholder="이메일 주소"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-md bg-white text-[#333] transition-all focus:outline-none focus:ring-4 focus:ring-[#29B6F6]/30 shadow-sm"
                />
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#aaa]" />
              </div>
            )}

            {/* Password */}
            <div className="relative mb-5">
              <input
                type="password"
                placeholder="비밀번호"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-md bg-white text-[#333] transition-all focus:outline-none focus:ring-4 focus:ring-[#29B6F6]/30 shadow-sm"
              />
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#aaa] transition-colors" />
            </div>

            {/* Captcha */}
            <div className="relative mb-5 flex bg-white rounded-md shadow-sm overflow-hidden">
              <Shield className="absolute left-4 top-1/2 -translate-y-1/2 text-[#aaa] z-10" />
              <input
                type="text"
                placeholder="자동입력 방지 코드"
                required
                value={captchaInput}
                onChange={(e) => setCaptchaInput(e.target.value)}
                className="flex-1 pl-12 pr-4 py-4 rounded-l-md bg-white text-[#333] transition-all focus:outline-none focus:ring-4 focus:ring-[#29B6F6]/30"
              />
              <div
                onClick={generateCaptcha}
                className="w-[120px] bg-[#f0f0f0] flex items-center justify-center font-mono font-bold text-2xl tracking-[4px] text-[#555] cursor-pointer border-l border-[#ddd] select-none hover:bg-[#e0e0e0] transition-colors"
                style={{
                  transform: `rotate(${captchaRotation}deg)`,
                  color: captchaColor,
                  backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,0,0,0.03) 10px, rgba(0,0,0,0.03) 20px)'
                }}
                title="Click to refresh"
              >
                {captcha}
              </div>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              className="w-full py-4 bg-[#29B6F6] text-white rounded-md text-lg font-bold cursor-pointer transition-all hover:bg-[#039BE5] hover:-translate-y-0.5 shadow-lg mt-3"
            >
              Login
            </button>

            {/* Bottom Links */}
            <div className="flex justify-between text-sm px-3 mt-6">
              <button type="button"
                onClick={() => { if (onShowRegister) onShowRegister(); }}
                className="text-[#0288D1] bg-transparent border-none cursor-pointer no-underline font-bold transition-colors hover:text-[#01579b] hover:underline">
                회원가입
              </button>
              <button type="button"
                onClick={() => { setShowForgot(true); setForgotStatus('idle'); }}
                className="text-[#0288D1] bg-transparent border-none cursor-pointer no-underline font-bold transition-colors hover:text-[#01579b] hover:underline">
                비밀번호 찾기
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgot && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
          onClick={() => setShowForgot(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">비밀번호 찾기</h3>
              <button onClick={() => setShowForgot(false)} className="p-1.5 hover:bg-gray-100 rounded-full text-gray-400">
                <X size={20} />
              </button>
            </div>

            {forgotStatus === 'sent' ? (
              <div className="text-center py-6">
                <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                  <Mail size={28} className="text-emerald-600" />
                </div>
                <p className="text-gray-700 font-medium mb-1">이메일을 확인해주세요</p>
                <p className="text-sm text-gray-500">
                  입력하신 주소로 비밀번호 재설정 링크를 보냈어요.<br />받은 편지함과 스팸함을 확인해주세요.
                </p>
                <button onClick={() => setShowForgot(false)}
                  className="mt-6 w-full py-2.5 rounded-lg bg-[#0288D1] text-white font-bold hover:bg-[#01579b] transition-colors">
                  확인
                </button>
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-500 mb-4">
                  가입하신 이메일 주소를 입력하시면 비밀번호 재설정 링크를 보내드려요.
                </p>
                <div className="relative mb-3">
                  <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => { setForgotEmail(e.target.value); setForgotStatus('idle'); }}
                    placeholder="example@email.com"
                    className={`w-full pl-10 pr-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-[#0288D1] focus:border-transparent ${
                      forgotStatus === 'error' ? 'border-red-400' : 'border-gray-300'
                    }`}
                  />
                </div>
                {forgotStatus === 'error' && (
                  <p className="text-xs text-red-500 mb-3">올바른 이메일 주소를 입력해주세요.</p>
                )}
                <button
                  onClick={handleForgotPassword}
                  disabled={forgotStatus === 'sending'}
                  className="w-full py-2.5 rounded-lg bg-[#0288D1] text-white font-bold hover:bg-[#01579b] transition-colors disabled:opacity-50"
                >
                  {forgotStatus === 'sending' ? '전송 중...' : '재설정 링크 보내기'}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes floatCloud {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(20px); }
        }
        @keyframes floatCloudReverse {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(-20px); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-15px); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(50px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        .animate-floatCloud { animation: floatCloud 20s linear infinite; }
        .animate-floatCloudReverse { animation: floatCloud 20s linear infinite reverse; }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-fadeInUp { animation: fadeInUp 0.8s ease forwards; }
        .animate-slideInRight { animation: slideInRight 0.8s ease 0.5s forwards; }
        .animate-fadeIn { animation: fadeIn 0.3s ease; }
      `}</style>
    </div>
  );
}