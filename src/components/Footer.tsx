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
                <div className="text-xl font-bold">Aim for 120</div>
                <div className="text-sm text-gray-300">Online Practice Platform</div>
              </div>
            </div>
            <p className="text-gray-300 leading-relaxed">
              Professional TOEFL preparation platform with TPO 1-75 full practice tests, 1:1 exam interface simulation, helping you achieve your study abroad dreams
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
            <h4 className="text-lg font-semibold">Study Content</h4>
            <ul className="space-y-2 text-gray-300">
              <li><a href="#" className="hover:text-white transition-colors">TPO Practice Tests</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Reading Training</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Listening Training</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Speaking Training</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Writing Training</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Vocabulary Practice</a></li>
            </ul>
          </div>
          
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Study Tools</h4>
            <ul className="space-y-2 text-gray-300">
              <li><a href="#" className="hover:text-white transition-colors">Smart Study Reports</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Wrong Answer Book</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Study Plan</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Progress Tracking</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Skill Assessment</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Exam Predictions</a></li>
            </ul>
          </div>
          
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Support</h4>
            <ul className="space-y-2 text-gray-300">
              <li>Hotline: 400-888-0120</li>
              <li>WeChat: toefl120</li>
              <li>Email: service@toefl120.cn</li>
              <li>Hours: 9:00 AM - 9:00 PM</li>
            </ul>
            <div className="bg-gradient-to-r from-orange-400 to-yellow-400 text-gray-900 p-3 rounded-lg">
              <p className="text-sm font-medium">🎯 7-Day Free Trial</p>
              <p className="text-xs">Exclusive offer for new users</p>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-700 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">
            © 2024 TOEFL Practice Platform. All Rights Reserved.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Privacy Policy</a>
            <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Terms of Service</a>
            <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">User Agreement</a>
          </div>
        </div>
      </div>
    </footer>
  );
}