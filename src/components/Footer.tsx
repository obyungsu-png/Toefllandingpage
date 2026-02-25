export function Footer() {
  return (
    <footer className="bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-4 py-2 rounded-xl shadow-lg">
                <span className="font-bold">TOEFL</span>
              </div>
              <div>
                <div className="text-xl font-bold">助你冲刺120</div>
                <div className="text-sm text-gray-300">在线模考练习平台</div>
              </div>
            </div>
            <p className="text-gray-300 leading-relaxed">
              专业的TOEFL备考平台，TPO1-75全套真题，1:1还原机考环境，助你实现留学梦想
            </p>
            <div className="flex space-x-4">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center hover:scale-110 transition-transform cursor-pointer shadow-lg">
                <span>📱</span>
              </div>
              <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center hover:scale-110 transition-transform cursor-pointer shadow-lg">
                <span>💬</span>
              </div>
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center hover:scale-110 transition-transform cursor-pointer shadow-lg">
                <span>📧</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">学习内容</h4>
            <ul className="space-y-2 text-gray-300">
              <li><a href="#" className="hover:text-white transition-colors">TPO模考练习</a></li>
              <li><a href="#" className="hover:text-white transition-colors">阅读专项训练</a></li>
              <li><a href="#" className="hover:text-white transition-colors">听力专项训练</a></li>
              <li><a href="#" className="hover:text-white transition-colors">口语专项训练</a></li>
              <li><a href="#" className="hover:text-white transition-colors">写作专项训练</a></li>
              <li><a href="#" className="hover:text-white transition-colors">词汇练习</a></li>
            </ul>
          </div>
          
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">学习工具</h4>
            <ul className="space-y-2 text-gray-300">
              <li><a href="#" className="hover:text-white transition-colors">智能学习报告</a></li>
              <li><a href="#" className="hover:text-white transition-colors">错题本</a></li>
              <li><a href="#" className="hover:text-white transition-colors">学习计划</a></li>
              <li><a href="#" className="hover:text-white transition-colors">进度追踪</a></li>
              <li><a href="#" className="hover:text-white transition-colors">能力评估</a></li>
              <li><a href="#" className="hover:text-white transition-colors">机经预测</a></li>
            </ul>
          </div>
          
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">客服支持</h4>
            <ul className="space-y-2 text-gray-300">
              <li>客服热线: 400-888-0120</li>
              <li>微信客服: toefl120</li>
              <li>邮箱: service@toefl120.cn</li>
              <li>在线时间: 9:00-21:00</li>
            </ul>
            <div className="bg-gradient-to-r from-orange-400 to-yellow-400 text-gray-900 p-3 rounded-lg">
              <p className="text-sm font-medium">🎯 7天免费试用</p>
              <p className="text-xs">新用户专享福利</p>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-700 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">
            © 2024 TOEFL助你冲刺120. 保留所有权利.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">隐私政策</a>
            <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">服务条款</a>
            <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">用户协议</a>
          </div>
        </div>
      </div>
    </footer>
  );
}