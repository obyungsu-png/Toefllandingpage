import { motion } from 'motion/react';
import { Star, Clock, BookOpen, Headphones, Pencil, Lightbulb } from 'lucide-react';

interface LoginPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginClick: () => void;
}

export function LoginPopup({ isOpen, onClose, onLoginClick }: LoginPopupProps) {
  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      onClick={onClose}
    >
      {/* Floating Clouds Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ x: ['0%', '100%'] }}
          transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
          className="absolute top-10 left-0"
          style={{
            width: '200px',
            height: '80px',
            backgroundColor: 'rgba(255, 255, 255, 0.3)',
            borderRadius: '100px',
            filter: 'blur(20px)'
          }}
        />
        <motion.div
          animate={{ x: ['0%', '100%'] }}
          transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
          className="absolute top-40 left-0"
          style={{
            width: '150px',
            height: '60px',
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '100px',
            filter: 'blur(15px)'
          }}
        />
        <motion.div
          animate={{ x: ['0%', '100%'] }}
          transition={{ duration: 35, repeat: Infinity, ease: 'linear' }}
          className="absolute bottom-32 left-0"
          style={{
            width: '180px',
            height: '70px',
            backgroundColor: 'rgba(255, 255, 255, 0.25)',
            borderRadius: '100px',
            filter: 'blur(18px)'
          }}
        />
      </div>

      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', duration: 0.3 }}
        className="relative w-11/12 max-w-sm md:max-w-2xl rounded-lg shadow-xl p-6 md:p-10"
        style={{ 
          backgroundColor: '#E3F2FD',
          border: '1px solid #90CAF9'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-4 md:top-4 md:right-5 text-2xl md:text-3xl text-gray-700 hover:text-black transition-colors"
          style={{ fontWeight: 300 }}
        >
          ×
        </button>

        <div className="flex items-center justify-between gap-4 md:gap-8">
          {/* Left Text Area - Fade In Up */}
          <motion.div 
            className="flex-1"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h2 className="text-xl md:text-3xl mb-4 md:mb-6" style={{ 
              fontWeight: 700,
              color: '#000',
              lineHeight: 1.3 
            }}>
              <span className="md:hidden">Please<br />log in</span>
              <span className="hidden md:block">Please<br />log in and practice</span>
            </h2>
            <button
              onClick={onLoginClick}
              className="text-base md:text-2xl transition-colors hover:underline"
              style={{ 
                fontWeight: 700,
                color: '#3BB9E3'
              }}
            >
              go to log in →
            </button>
          </motion.div>

          {/* Right Image Area - Slide In Right + Float - Hidden on Mobile */}
          <motion.div 
            className="hidden md:flex flex-1 items-center justify-center"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <motion.div 
              className="relative" 
              style={{ width: '280px', height: '300px' }}
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >
              {/* Left Bunny Ear */}
              <div 
                style={{
                  position: 'absolute',
                  top: '-10px',
                  left: '60px',
                  width: '40px',
                  height: '90px',
                  backgroundColor: '#f2f0e9',
                  borderRadius: '50%',
                  transform: 'rotate(-25deg)',
                  boxShadow: '0 5px 15px rgba(0,0,0,0.1)'
                }}
              />
              
              {/* Right Bunny Ear */}
              <div 
                style={{
                  position: 'absolute',
                  top: '-10px',
                  right: '60px',
                  width: '40px',
                  height: '90px',
                  backgroundColor: '#f2f0e9',
                  borderRadius: '50%',
                  transform: 'rotate(25deg)',
                  boxShadow: '0 5px 15px rgba(0,0,0,0.1)'
                }}
              />
              
              {/* Main Balloon Body */}
              <div 
                className="flex flex-col items-center justify-center rounded-full shadow-lg"
                style={{
                  position: 'absolute',
                  top: '30px',
                  left: '10px',
                  width: '260px',
                  height: '260px',
                  backgroundColor: '#f2f0e9',
                  padding: '30px 20px 25px 20px',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                  borderRadius: '50% 50% 47% 53%'
                }}
              >
                {/* Balloon knot/tail */}
                <div 
                  style={{
                    position: 'absolute',
                    bottom: '-20px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 0,
                    height: 0,
                    borderLeft: '8px solid transparent',
                    borderRight: '8px solid transparent',
                    borderTop: '20px solid #f2f0e9',
                    filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.1))'
                  }}
                />
                
                {/* TOEFL Prep Title */}
                <div className="text-center" style={{ marginTop: '15px' }}>
                  <h3 style={{
                    fontFamily: 'Georgia, serif',
                    fontSize: '34px',
                    fontWeight: 700,
                    color: '#222',
                    margin: '8px 0 4px 0',
                    letterSpacing: '-1px',
                    lineHeight: 1
                  }}>
                    TOEFL Prep
                  </h3>
                  <p style={{
                    fontSize: '8.5px',
                    fontWeight: 800,
                    color: '#444',
                    textTransform: 'uppercase',
                    letterSpacing: '0.3px',
                    marginTop: '4px'
                  }}>
                    실력 쑥쑥 점수 쑥쑥!
                  </p>
                </div>

                {/* Icons Grid */}
                <div className="grid grid-cols-3 gap-3" style={{ marginTop: '18px' }}>
                  <Star 
                    size={30} 
                    style={{ 
                      color: '#d9452b', 
                      transform: 'rotate(-10deg)',
                      fill: 'none',
                      strokeWidth: 2
                    }} 
                  />
                  <Clock 
                    size={32} 
                    style={{ 
                      color: '#f2b705', 
                      transform: 'rotate(5deg)',
                      strokeWidth: 2
                    }} 
                  />
                  <BookOpen 
                    size={30} 
                    style={{ 
                      color: '#3b4cca', 
                      transform: 'rotate(-5deg)',
                      strokeWidth: 2
                    }} 
                  />
                  <Headphones 
                    size={28} 
                    style={{ 
                      color: '#28a745', 
                      transform: 'rotate(8deg)',
                      strokeWidth: 2
                    }} 
                  />
                  <Pencil 
                    size={32} 
                    style={{ 
                      color: '#9b3bca', 
                      transform: 'rotate(-3deg)',
                      strokeWidth: 2
                    }} 
                  />
                  <Lightbulb 
                    size={26} 
                    style={{ 
                      color: '#f08a24', 
                      transform: 'rotate(15deg)',
                      strokeWidth: 2
                    }} 
                  />
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}