import { Card } from "./ui/card";
import { ImageWithFallback } from "./figma/ImageWithFallback";

export function AboutToefl() {
  return (
    <section id="about" className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-5xl font-bold text-gray-900 mb-4">
            为什么选择我们的平台？
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            专业、高效、全面的TOEFL备考解决方案
          </p>
        </div>
        
        <div className="grid lg:grid-cols-3 gap-8 mb-16">
          <Card className="bg-white border-0 shadow-xl p-8 text-center">
            <div className="bg-gradient-to-r from-blue-500 to-cyan-500 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 text-white text-2xl shadow-lg">
              🎯
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">精准定位</h3>
            <p className="text-gray-600">
              基于大数据分析的智能诊断系统，精准识别你的薄弱环节，提供个性化的学习方案
            </p>
          </Card>
          
          <Card className="bg-white border-0 shadow-xl p-8 text-center">
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 text-white text-2xl shadow-lg">
              📈
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">高效提升</h3>
            <p className="text-gray-600">
              科学的学习路径和方法，平均提分25+，让你在最短时间内达到目标分数
            </p>
          </Card>
          
          <Card className="bg-white border-0 shadow-xl p-8 text-center">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 text-white text-2xl shadow-lg">
              🏆
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">权威认证</h3>
            <p className="text-gray-600">
              使用官方TPO真题，完全模拟真实考试环境，确保你的练习效果和考试体验一致
            </p>
          </Card>
        </div>
        
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="bg-white rounded-2xl shadow-xl p-8 border">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">学习进度追踪</h3>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">阅读 Reading</span>
                  <span className="text-blue-600 font-semibold">85%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div className="bg-gradient-to-r from-blue-500 to-cyan-500 h-3 rounded-full" style={{width: '85%'}}></div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">听力 Listening</span>
                  <span className="text-green-600 font-semibold">78%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full" style={{width: '78%'}}></div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">口语 Speaking</span>
                  <span className="text-purple-600 font-semibold">72%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full" style={{width: '72%'}}></div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">写作 Writing</span>
                  <span className="text-orange-600 font-semibold">68%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div className="bg-gradient-to-r from-orange-500 to-red-500 h-3 rounded-full" style={{width: '68%'}}></div>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg">
                <p className="text-blue-700 font-medium">
                  🎯 继续努力！预计再练习2周可达到目标分数105分
                </p>
              </div>
            </div>
          </div>
          
          <div className="space-y-8">
            <h3 className="text-2xl font-bold text-gray-900">
              全面的学习支持
            </h3>
            
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <span className="text-blue-600 text-xl">📝</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">详细解析</h4>
                  <p className="text-gray-600">每道题目都配有详细的解题思路和技巧分析，帮你理解题目背后的逻辑</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="bg-green-100 p-3 rounded-lg">
                  <span className="text-green-600 text-xl">📊</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">学习报告</h4>
                  <p className="text-gray-600">智能生成个人学习报告，追踪进度，调整学习策略</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="bg-purple-100 p-3 rounded-lg">
                  <span className="text-purple-600 text-xl">🎯</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">高效动力</h4>
                  <p className="text-gray-600">科学的练习安排和目标设定，保持学习动力和效率</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}