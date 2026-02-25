import { useState, useEffect } from 'react';
import { X, User, Lock, Shield, Smartphone, Cloud, MessageCircle, Laptop, Phone } from 'lucide-react';

interface LoginFormProps {
  onClose: () => void;
  onLoginSuccess?: (username: string) => void; // Pass username on success
}

export function LoginForm({ onClose, onLoginSuccess }: LoginFormProps) {
  const [captcha, setCaptcha] = useState('');
  const [captchaRotation, setCaptchaRotation] = useState(0);
  const [captchaColor, setCaptchaColor] = useState('#555');
  const [loginMethod, setLoginMethod] = useState<'username' | 'phone'>('username');
  
  // Form fields
  const [username, setUsername] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
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
      alert('Invalid verification code! Please check the captcha.');
      generateCaptcha();
      setCaptchaInput('');
      return;
    }

    // Get registered users from localStorage
    const existingUsers = JSON.parse(localStorage.getItem('toefl_users') || '[]');
    
    if (existingUsers.length === 0) {
      alert('No registered users found. Please register first!');
      return;
    }

    // Find user based on login method
    let user;
    if (loginMethod === 'username') {
      user = existingUsers.find((u: any) => u.username === username && u.password === password);
      if (!user) {
        alert('Invalid username or password!');
        generateCaptcha();
        setCaptchaInput('');
        return;
      }
    } else {
      user = existingUsers.find((u: any) => u.phoneNumber === phoneNumber && u.password === password);
      if (!user) {
        alert('Invalid phone number or password!');
        generateCaptcha();
        setCaptchaInput('');
        return;
      }
    }

    // Login successful
    alert(`Login Successful!\n\nWelcome back, ${user.username}!`);
    
    // Save current logged-in user
    localStorage.setItem('toefl_current_user', JSON.stringify(user));
    
    if (onLoginSuccess) {
      onLoginSuccess(user.username);
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
            User Login
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
              Username Login
            </button>
            <button
              type="button"
              onClick={() => setLoginMethod('phone')}
              className={`flex-1 py-2 rounded-md font-semibold text-sm transition-all ${
                loginMethod === 'phone' 
                  ? 'bg-[#29B6F6] text-white shadow-md' 
                  : 'bg-transparent text-[#666] hover:bg-white/50'
              }`}
            >
              Phone Login
            </button>
          </div>
          
          <form onSubmit={handleSubmit}>
            {/* Username or Phone Number */}
            {loginMethod === 'username' ? (
              <div className="relative mb-5">
                <input
                  type="text"
                  placeholder="Username"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-md bg-white text-[#333] transition-all focus:outline-none focus:ring-4 focus:ring-[#29B6F6]/30 shadow-sm"
                />
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[#aaa] transition-colors" />
              </div>
            ) : (
              <div className="relative mb-5">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 text-[#666] border-r border-gray-300 pr-3">
                  <Phone className="w-5 h-5" />
                  <span className="text-sm font-semibold">+86</span>
                </div>
                <input
                  type="tel"
                  placeholder="Phone Number"
                  required
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  maxLength={11}
                  className="w-full pl-[100px] pr-4 py-4 rounded-md bg-white text-[#333] transition-all focus:outline-none focus:ring-4 focus:ring-[#29B6F6]/30 shadow-sm"
                />
              </div>
            )}

            {/* Password */}
            <div className="relative mb-5">
              <input
                type="password"
                placeholder="Password"
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
                placeholder="Verification Code"
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

            {/* Divider */}
            <div className="flex items-center text-center my-6 text-[#666] text-sm font-semibold">
              <div className="flex-1 border-b-2 border-black/10 mr-4"></div>
              <span>Other Login Methods</span>
              <div className="flex-1 border-b-2 border-black/10 ml-4"></div>
            </div>

            {/* Social Login */}
            <div className="flex justify-center gap-8 mb-8">
              <div className="w-14 h-14 rounded-full bg-[#29B6F6] text-white flex items-center justify-center cursor-pointer transition-all hover:scale-110 hover:rotate-[10deg] shadow-lg"
                title="Login with Mobile">
                <Smartphone size={28} />
              </div>
              <div className="w-14 h-14 rounded-full bg-[#07c160] text-white flex items-center justify-center cursor-pointer transition-all hover:scale-110 hover:rotate-[10deg] shadow-lg"
                title="Login with WeChat">
                <MessageCircle size={28} />
              </div>
            </div>

            {/* Bottom Links */}
            <div className="flex justify-between text-sm px-3">
              <a href="#" className="text-[#0288D1] no-underline font-bold transition-colors hover:text-[#01579b] hover:underline">
                Register Now
              </a>
              <a href="#" className="text-[#0288D1] no-underline font-bold transition-colors hover:text-[#01579b] hover:underline">
                Forgot Password?
              </a>
            </div>
          </form>
        </div>
      </div>

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