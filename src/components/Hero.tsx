import { Button } from "./ui/button";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { motion } from 'framer-motion';

interface HeroProps {
  onStartLearning: () => void;
}

export function Hero({ onStartLearning }: HeroProps) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-cyan-100 via-blue-100 to-yellow-100 py-16 lg:py-24">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 left-0 w-64 h-64 bg-blue-300 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-yellow-300 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-300 rounded-full blur-3xl"></div>
      </div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="space-y-6">
              <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 leading-tight">
                托福TPO
                <br />
                <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                  在线模考练习平台
                </span>
              </h1>
              
              <div className="space-y-4 text-lg text-gray-700">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>托福TPO1-75在线模考练习</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>听说读写四大分项18种题型练习</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span>真实模考1:1还原机考界面功能</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>详文/解析/学习报告/高效动力题解</span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                size="lg" 
                className="text-lg px-8 py-6 bg-gradient-to-r from-orange-400 to-yellow-400 hover:from-orange-500 hover:to-yellow-500 text-white shadow-lg"
                onClick={onStartLearning}
              >
                开始学习
              </Button>
              <Button variant="outline" size="lg" className="text-lg px-8 py-6 border-blue-500 text-blue-600 hover:bg-blue-50">
                免费试用
              </Button>
            </div>
            
            <div className="grid grid-cols-3 gap-6 pt-4">
              <div className="text-center bg-white/70 backdrop-blur-sm rounded-xl p-4 shadow-lg">
                <div className="text-2xl font-bold text-blue-600 mb-1">75套</div>
                <div className="text-sm text-gray-600">TPO真题</div>
              </div>
              <div className="text-center bg-white/70 backdrop-blur-sm rounded-xl p-4 shadow-lg">
                <div className="text-2xl font-bold text-green-600 mb-1">18种</div>
                <div className="text-sm text-gray-600">题型练习</div>
              </div>
              <div className="text-center bg-white/70 backdrop-blur-sm rounded-xl p-4 shadow-lg">
                <div className="text-2xl font-bold text-orange-600 mb-1">1:1</div>
                <div className="text-sm text-gray-600">还原机考</div>
              </div>
            </div>
          </div>
          
          <div className="relative">
            <motion.div 
              className="bg-white rounded-2xl shadow-2xl p-6 border"
              animate={{ 
                y: [0, -15, 0],
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              {/* Mock TOEFL Interface */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-3">
                  <div className="flex items-center space-x-2">
                    <div className="bg-blue-500 text-white px-3 py-1 rounded text-sm font-medium">
                      TOEFL iBT
                    </div>
                    <span className="text-sm text-gray-500">真实机考界面</span>
                  </div>
                  <div className="text-sm text-gray-500">剩余时间: 54:32</div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-4 text-sm">
                    <span className="text-gray-500">题目:</span>
                    <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded">TPO 1</span>
                    <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">TPO 25</span>
                    <span className="bg-green-100 text-green-700 px-2 py-1 rounded">TPO 47</span>
                    <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded">TPO 54</span>
                    <span className="bg-red-100 text-red-700 px-2 py-1 rounded">TPO 70</span>
                    <span className="bg-pink-100 text-pink-700 px-2 py-1 rounded">TPO 75</span>
                  </div>
                  
                  <div className="grid grid-cols-6 gap-2 text-xs">
                    <div className="bg-gray-100 p-2 rounded text-center font-medium">听力</div>
                    <div className="bg-gray-100 p-2 rounded text-center font-medium">阅读</div>
                    <div className="bg-gray-100 p-2 rounded text-center font-medium">口语</div>
                    <div className="bg-gray-100 p-2 rounded text-center font-medium">写作</div>
                    <div className="bg-gray-100 p-2 rounded text-center font-medium">词汇</div>
                    <div className="bg-gray-100 p-2 rounded text-center font-medium">机经预测</div>
                  </div>
                  
                  {Array.from({ length: 8 }, (_, i) => (
                    <div key={i} className="grid grid-cols-6 gap-2 text-xs">
                      <div className="bg-orange-100 text-orange-700 p-2 rounded text-center">TPO {i + 1}</div>
                      <div className="bg-blue-100 text-blue-700 p-2 rounded text-center">练习中</div>
                      <div className="bg-green-100 text-green-700 p-2 rounded text-center">已完成</div>
                      <div className="bg-purple-100 text-purple-700 p-2 rounded text-center">未开始</div>
                      <div className="bg-red-100 text-red-700 p-2 rounded text-center">已完成</div>
                      <div className="bg-pink-100 text-pink-700 p-2 rounded text-center">机经预测</div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}