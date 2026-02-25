import { Button } from "./ui/button";
import { Card } from "./ui/card";

export function CTA() {
  return (
    <section className="py-20 bg-gradient-to-br from-cyan-50 to-blue-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="relative overflow-hidden bg-gradient-to-br from-white via-blue-50 to-purple-50 border-0 shadow-2xl p-8 lg:p-16 text-center">
          <div className="relative z-10">
            <h2 className="text-3xl lg:text-5xl font-bold text-gray-900 mb-6">
              开始你的托福
              <br />
              <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                冲刺120分之旅
              </span>
            </h2>
            
            <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
              加入超过10万名学生的选择，使用最专业的TOEFL备考平台
              <br />
              TPO1-75全套真题，1:1还原机考环境
            </p>
            
            <div className="space-y-8">
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="text-lg px-10 py-6 bg-gradient-to-r from-orange-400 to-yellow-400 hover:from-orange-500 hover:to-yellow-500 text-white border-0 shadow-xl">
                  立即开始学习
                </Button>
                <Button variant="outline" size="lg" className="text-lg px-10 py-6 border-blue-500 text-blue-600 hover:bg-blue-50">
                  免费试用TPO
                </Button>
              </div>
              
              <div className="grid sm:grid-cols-3 gap-6">
                <div className="group text-center hover:scale-105 transition-transform duration-300">
                  <div className="bg-gradient-to-r from-blue-500 to-cyan-500 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-xl transition-shadow">
                    <span className="text-white text-2xl">💬</span>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">微信客服</h4>
                  <p className="text-gray-600">toeful120</p>
                </div>
                
                <div className="group text-center hover:scale-105 transition-transform duration-300">
                  <div className="bg-gradient-to-r from-green-500 to-emerald-500 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-xl transition-shadow">
                    <span className="text-white text-2xl">📞</span>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">客服热线</h4>
                  <p className="text-gray-600">400-888-0120</p>
                </div>
                
                <div className="group text-center hover:scale-105 transition-transform duration-300">
                  <div className="bg-gradient-to-r from-purple-500 to-pink-500 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-xl transition-shadow">
                    <span className="text-white text-2xl">📧</span>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">邮箱咨询</h4>
                  <p className="text-gray-600">service@toefl120.cn</p>
                </div>
              </div>
            </div>
            
            {/* Special Offer */}
            <div className="mt-12 bg-gradient-to-r from-orange-400 to-yellow-400 rounded-2xl p-6 text-white">
              <h3 className="text-xl font-bold mb-2">🎉 限时特惠</h3>
              <p className="mb-4">新用户注册即享7天免费试用 + 首月8折优惠</p>
              <div className="flex items-center justify-center space-x-4">
                <span className="bg-white/20 px-3 py-1 rounded-full text-sm">TPO真题练习</span>
                <span className="bg-white/20 px-3 py-1 rounded-full text-sm">智能学习报告</span>
                <span className="bg-white/20 px-3 py-1 rounded-full text-sm">专业答疑服务</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
}