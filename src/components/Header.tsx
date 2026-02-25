import { Button } from "./ui/button";
import { QuestionUploader } from "./QuestionUploader";

export function Header() {
  return (
    <header className="bg-white shadow-sm sticky top-0 z-50 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-4 py-2 rounded-lg shadow-lg">
              <span className="text-xl font-bold">TOEFL</span>
            </div>
            <div>
              <div className="text-xl font-bold text-gray-900">助你冲刺120</div>
              <div className="text-sm text-gray-500">在线模考练习平台</div>
            </div>
          </div>
          
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#tpo" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">
              TPO模考
            </a>
            <a href="#sections" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">
              四大分项
            </a>
            <a href="#features" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">
              学习功能
            </a>
            <a href="#about" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">
              关于我们
            </a>
          </nav>
          
          <div className="flex items-center space-x-4">
            <QuestionUploader />
            <Button variant="outline" className="border-blue-500 text-blue-600 hover:bg-blue-50">
              登录注册
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}