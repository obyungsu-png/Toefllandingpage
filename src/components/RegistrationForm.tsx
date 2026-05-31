import { useState, useEffect } from 'react';
import { X, User, Lock, Shield, Smartphone, Cloud, Laptop, Phone } from 'lucide-react';
import { SERVER_BASE_URL, getServerHeaders } from '../utils/apiConfig';

interface RegistrationFormProps {
  onClose: () => void;
  onRegisterSuccess?: () => void;
}

export function RegistrationForm({ onClose, onRegisterSuccess }: RegistrationFormProps) {
  const [countdown, setCountdown] = useState(0);
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [sentCode, setSentCode] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setIsButtonDisabled(false);
    }
  }, [countdown]);

  const handleSendCode = () => {
    if (!phoneNumber) {
      alert('Please enter your phone number first!');
      return;
    }
    
    // Generate a random 6-digit verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setSentCode(code);
    setCountdown(60);
    setIsButtonDisabled(true);
    alert(`Verification code sent to ${phoneNumber}: ${code}\n\n(In production, this would be sent via SMS)`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate verification code
    if (verificationCode !== sentCode) {
      alert('Invalid verification code! Please check and try again.');
      return;
    }

    // Validate phone number format (China: starts with 1, 11 digits)
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(phoneNumber)) {
      alert('Please enter a valid Chinese phone number (11 digits starting with 1)');
      return;
    }

    // Call server API for registration
    const doRegister = async () => {
      try {
        const response = await fetch(`${SERVER_BASE_URL}/users/register`, {
          method: 'POST',
          headers: {
            ...getServerHeaders(),
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            phoneNumber,
            username,
            password
          })
        });

        // Read response as text first to check format
        const responseText = await response.text();
        console.log('Registration response:', responseText);

        let data;
        try {
          data = JSON.parse(responseText);
        } catch (parseError) {
          console.error('Failed to parse response:', responseText);
          alert('Server returned invalid response. Please try again or contact support.');
          return;
        }

        if (!response.ok) {
          alert(data.error || 'Registration failed');
          return;
        }

        alert(`Registration Successful!\n\nPhone: ${phoneNumber}\nUsername: ${username}\n\nYou can now log in with your credentials.`);
        
        if (onRegisterSuccess) {
          onRegisterSuccess();
        }
        onClose();
      } catch (error) {
        console.error('Registration error:', error);
        alert('Failed to connect to server. Please try again.');
      }
    };

    doRegister();
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
            Join Our Community
          </h1>
          <p className="text-2xl mb-10 animate-fadeInUp" style={{ animationDelay: '0.3s' }}>
            Start Your TOEFL Journey Today
          </p>
          
          <div className="w-[300px] h-[200px] bg-white/20 border-4 border-white rounded-xl mx-auto flex items-center justify-center backdrop-blur-sm animate-float">
            <Laptop className="w-20 h-20 text-white" />
          </div>
        </div>

        {/* Right: Registration Form */}
        <div className="flex-none w-full md:w-[450px] bg-white/25 p-5 md:p-10 rounded-2xl backdrop-blur-xl shadow-2xl border border-white/20 animate-slideInRight" style={{ opacity: 0 }}>
          <h2 className="text-center text-2xl md:text-3xl text-[#333] mb-6 md:mb-8 font-bold tracking-wide">
            User Registration
          </h2>
          
          <form onSubmit={handleSubmit}>
            {/* Phone Number with Country Code */}
            <div className="relative mb-5">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 text-[#666] border-r border-gray-300 pr-3">
                <Phone className="w-5 h-5" />
                <span className="text-sm font-semibold">+86</span>
              </div>
              <input
                type="tel"
                placeholder="Phone Number (11 digits)"
                required
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                maxLength={11}
                pattern="1[3-9]\d{9}"
                className="w-full pl-[100px] pr-4 py-4 rounded-md bg-white text-[#333] transition-all focus:outline-none focus:ring-4 focus:ring-[#29B6F6]/30 shadow-sm"
              />
            </div>

            {/* Verification Code */}
            <div className="relative mb-5">
              <input
                type="text"
                placeholder="Verification Code"
                required
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                maxLength={6}
                className="w-full pl-12 pr-[120px] py-4 rounded-md bg-white text-[#333] transition-all focus:outline-none focus:ring-4 focus:ring-[#29B6F6]/30 shadow-sm"
              />
              <Shield className="absolute left-4 top-1/2 -translate-y-1/2 text-[#aaa] transition-colors" />
              <button
                type="button"
                onClick={handleSendCode}
                disabled={isButtonDisabled}
                className="absolute right-1 top-1 bottom-1 bg-[#29B6F6] text-white font-semibold px-4 rounded cursor-pointer transition-all text-sm hover:bg-[#039BE5] disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {countdown > 0 ? `${countdown}s` : 'Get Code'}
              </button>
            </div>

            {/* Username */}
            <div className="relative mb-5">
              <input
                type="text"
                placeholder="Username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                minLength={3}
                className="w-full pl-12 pr-4 py-4 rounded-md bg-white text-[#333] transition-all focus:outline-none focus:ring-4 focus:ring-[#29B6F6]/30 shadow-sm"
              />
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[#aaa] transition-colors" />
            </div>

            {/* Password */}
            <div className="relative mb-5">
              <input
                type="password"
                placeholder="Password (min 6 characters)"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                className="w-full pl-12 pr-4 py-4 rounded-md bg-white text-[#333] transition-all focus:outline-none focus:ring-4 focus:ring-[#29B6F6]/30 shadow-sm"
              />
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#aaa] transition-colors" />
            </div>

            {/* Terms Checkbox */}
            <div className="flex items-center mb-5 text-sm text-[#333]">
              <input
                type="checkbox"
                id="terms"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mr-3 cursor-pointer accent-[#29B6F6] w-4 h-4"
              />
              <label htmlFor="terms" className="cursor-pointer">
                I have read and agree to the{' '}
                <a href="#" className="text-[#333] font-semibold no-underline relative inline-block after:content-[''] after:absolute after:w-full after:h-[1px] after:bottom-[-2px] after:left-0 after:bg-[#333] after:scale-x-0 after:transition-transform after:duration-300 hover:after:scale-x-100">
                  Privacy Policy
                </a>
              </label>
            </div>

            {/* Sign Up Button — disabled until agree is checked */}
            <button
              type="submit"
              disabled={!agreedToTerms}
              className={`w-full py-4 rounded-md text-lg font-bold transition-all shadow-lg ${
                agreedToTerms
                  ? 'bg-[#29B6F6] text-white cursor-pointer hover:bg-[#039BE5] hover:-translate-y-0.5 active:translate-y-0'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
              title={agreedToTerms ? '' : 'Privacy Policy에 동의해야 가입할 수 있어요'}
            >
              {agreedToTerms ? 'Sign Up' : '✓ 약관 동의 후 가입 가능'}
            </button>

            {/* Login Link */}
            <div className="text-center mt-5 text-[#333] text-sm">
              Already have an account?{' '}
              <a href="#" className="text-[#29B6F6] no-underline font-bold ml-1 hover:underline">
                Log In
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