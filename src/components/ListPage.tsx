import { Button } from "./ui/button";
import { Card } from "./ui/card";

interface ListPageProps {
  onBack: () => void;
}

export function ListPage({ onBack }: ListPageProps) {
  const tpoSets = [
    { range: "TPO 75-66", active: true },
    { range: "TPO 65-56", active: false },
    { range: "TPO 55-46", active: false },
    { range: "TPO 45-36", active: false },
    { range: "TPO 35-26", active: false },
    { range: "TPO 25-16", active: false },
    { range: "TPO 15-6", active: false },
    { range: "TPO 5-1", active: false },
  ];

  const tpoCards = [
    { number: 75, status: "new" },
    { number: 74, status: "new" },
    { number: 73, status: "new" },
    { number: 72, status: "new" },
    { number: 71, status: "new" },
    { number: 70, status: "new" },
    { number: 69, status: "new" },
    { number: 68, status: "new" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3">
                <div className="text-2xl font-bold text-teal-600">TOEFL100</div>
                <div className="text-sm text-gray-600">助你冲刺120</div>
              </div>
              
              <nav className="hidden md:flex items-center space-x-8">
                <a href="#" className="text-white bg-teal-500 px-3 py-1 rounded text-sm font-medium">备考练习</a>
                <a href="#" className="text-gray-600 hover:text-teal-600 transition-colors text-sm">听力训练</a>
                <a href="#" className="text-gray-600 hover:text-teal-600 transition-colors text-sm">阅读训练</a>
                <a href="#" className="text-gray-600 hover:text-teal-600 transition-colors text-sm">写作训练</a>
                <a href="#" className="text-gray-600 hover:text-teal-600 transition-colors text-sm">口语训练</a>
              </nav>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm text-red-500">🔴 2023年托福考试图册</div>
              <Button variant="outline" size="sm">登录/注册</Button>
            </div>
          </div>
        </div>
      </header>

      {/* Banner */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium">留学申请交流群</span>
            <span className="text-sm">本科/硕士 我们阶段申请指导</span>
          </div>
          <Button size="sm" className="bg-white/20 hover:bg-white/30 text-white border-white/30">
            加入群聊
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Actions */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <span className="text-gray-700 font-medium">随便:</span>
            <Button className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded">TPO套题</Button>
            <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded">真题套题</Button>
            <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded">查询好友动态</Button>
            <span className="text-red-500 text-sm">不查做&gt;&gt;</span>
          </div>

          <div className="flex items-center space-x-2 mb-6">
            <span className="text-gray-700 font-medium">套题:</span>
            {tpoSets.map((set, index) => (
              <Button
                key={index}
                className={`px-3 py-1 rounded text-sm ${
                  set.active 
                    ? 'bg-orange-500 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {set.range}
              </Button>
            ))}
          </div>

          {/* Warning Message */}
          <div className="bg-red-50 border border-red-200 rounded p-3 mb-6">
            <div className="flex items-start space-x-2">
              <span className="text-red-500 text-sm">⚠</span>
              <div className="text-sm text-red-700">
                <p>托福官方禁止公开TPO (TOEFL Practice Online)。但托福内容，不会否认教官当前手段资源内。</p>
                <p>目前所有TPO视频资源均已公开。至于交易行为我各个平台－致。各科机构各类活学方案。信给我们10点解释</p>
              </div>
            </div>
          </div>
        </div>

        {/* TPO Cards Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {tpoCards.map((tpo, index) => (
            <Card key={index} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              {/* Card Header */}
              <div className="bg-teal-600 text-white py-3 px-4">
                <h3 className="text-lg font-bold">TPO {tpo.number}</h3>
              </div>

              {/* Card Content */}
              <div className="p-4 space-y-3">
                {/* Reading */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Reading</span>
                  <div className="flex space-x-2">
                    <span className="text-xs text-gray-500">未开始</span>
                    <Button size="sm" variant="outline" className="text-xs px-2 py-1">测试说题</Button>
                    <Button size="sm" variant="outline" className="text-xs px-2 py-1">开始练习</Button>
                  </div>
                </div>

                {/* Listening */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Listening</span>
                  <div className="flex space-x-2">
                    <span className="text-xs text-gray-500">未开始</span>
                    <Button size="sm" variant="outline" className="text-xs px-2 py-1">测试说题</Button>
                    <Button size="sm" variant="outline" className="text-xs px-2 py-1">开始练习</Button>
                  </div>
                </div>

                {/* Speaking */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Speaking</span>
                  <div className="flex space-x-2">
                    <span className="text-xs text-gray-500">未开始</span>
                    <Button size="sm" variant="outline" className="text-xs px-2 py-1">测试说题</Button>
                    <Button size="sm" variant="outline" className="text-xs px-2 py-1">开始练习</Button>
                  </div>
                </div>

                {/* Writing */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Writing</span>
                  <div className="flex space-x-2">
                    <span className="text-xs text-gray-500">未开始</span>
                    <Button size="sm" variant="outline" className="text-xs px-2 py-1">测试说题</Button>
                    <Button size="sm" variant="outline" className="text-xs px-2 py-1">开始练习</Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Back Button */}
        <div className="mt-8 text-center">
          <Button onClick={onBack} className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2">
            返回首页
          </Button>
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="fixed right-4 top-1/2 transform -translate-y-1/2 space-y-3">
        <div className="bg-red-500 text-white p-2 rounded text-xs text-center w-16">
          意见反馈
        </div>
        <div className="bg-orange-500 text-white p-2 rounded text-xs text-center w-16">
          微信群快
        </div>
        <div className="bg-green-500 text-white p-2 rounded text-xs text-center w-16">
          TPO微信
        </div>
        <div className="bg-blue-500 text-white p-2 rounded text-xs text-center w-16">
          考试动态
        </div>
        <div className="bg-purple-500 text-white p-2 rounded text-xs text-center w-16">
          备考技巧
        </div>
      </div>
    </div>
  );
}