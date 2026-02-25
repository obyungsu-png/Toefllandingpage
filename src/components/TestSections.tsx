import { Card } from "./ui/card";
import { Button } from "./ui/button";

const sections = [
  {
    title: "Reading 阅读",
    icon: "📖",
    duration: "54-72分钟",
    questions: "30-40题",
    features: [
      "全真还原托福机考界面功能",
      "原版/改编分类TPO1-75题题建立练习",
      "划分文章易难度层级排列"
    ],
    color: "from-blue-500 to-cyan-500",
    bgColor: "bg-blue-50"
  },
  {
    title: "Listening 听力", 
    icon: "🎧",
    duration: "41-57分钟",
    questions: "28-39题",
    features: [
      "对话和讲座两大类型全覆盖",
      "音频播放速度可调节",
      "笔记功能完全还原真实考试"
    ],
    color: "from-green-500 to-emerald-500",
    bgColor: "bg-green-50"
  },
  {
    title: "Speaking 口语",
    icon: "🎤", 
    duration: "17分钟",
    questions: "4题",
    features: [
      "独立口语和综合口语练习",
      "录音功能和回放分析",
      "AI智能评分和改进建议"
    ],
    color: "from-purple-500 to-pink-500", 
    bgColor: "bg-purple-50"
  },
  {
    title: "Writing 写作",
    icon: "✍️",
    duration: "50分钟", 
    questions: "2题",
    features: [
      "综合写作和独立写作",
      "在线打字练习环境",
      "范文对比和评分标准"
    ],
    color: "from-orange-500 to-red-500",
    bgColor: "bg-orange-50"
  }
];

export function TestSections() {
  return (
    <section id="sections" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-5xl font-bold text-gray-900 mb-4">
            四大分项专项练习
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            听说读写全方位覆盖，18种题型精准练习
          </p>
        </div>

        {/* Advertisement Banner */}
        <div className="mb-12">
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 flex items-center gap-4">
            {/* Left Image */}
            <div className="shrink-0 w-24 h-24 rounded-lg overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1639396104908-a8f2037ad565?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdHVkeSUyMGJvb2tzJTIwZGVza3xlbnwxfHx8fDE3NjE2MzExMzF8MA&ixlib=rb-4.1.0&q=80&w=1080"
                alt="학원 광고"
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* Right Content */}
            <div className="flex-1 flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-[#2d5a5d] mb-1">TOEFL 실전 모의고사 프로그램</h3>
                <p className="text-gray-600 text-sm">
                  실제 시험과 동일한 환경에서 모의고사를 경험하세요. 완벽한 시간 관리와 실전 감각을 익힐 수 있습니다.
                </p>
              </div>
              <Button
                onClick={() => alert('프로그램 문의하기')}
                className="bg-[#f39c12] text-white hover:bg-[#e67e22] transition-colors shadow-md hover:shadow-lg ml-6 px-5 py-4 shrink-0 rounded-full"
              >
                더 알아보기
              </Button>
            </div>
          </div>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8">
          {sections.map((section, index) => (
            <Card key={index} className={`group relative overflow-hidden ${section.bgColor} border-0 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105`}>
              <div className="p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`text-4xl p-4 rounded-xl bg-gradient-to-r ${section.color} text-white shadow-lg`}>
                      {section.icon}
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">{section.title}</h3>
                      <div className="text-gray-600">
                        {section.duration} | {section.questions}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {section.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-center space-x-3">
                      <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${section.color}`}></div>
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
                
                <Button className={`w-full bg-gradient-to-r ${section.color} hover:shadow-lg transition-all duration-300 border-0 text-white font-medium`}>
                  开始 {section.title.split(' ')[0]} 练习
                </Button>
              </div>
            </Card>
          ))}
        </div>
        
        {/* Reading Section Detail */}
        <div className="mt-16 bg-white rounded-2xl shadow-xl p-8 border">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Reading 阅读</h3>
              <div className="space-y-4 text-gray-700">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>全真还原托福机考界面功能</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>原版/改编分类TPO1-75题题建立练习</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span>划分文章易难度层级排列的实力</span>
                </div>
              </div>
            </div>
            <div className="bg-gray-100 rounded-xl p-6">
              <div className="bg-white rounded-lg p-4 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <div className="bg-blue-500 text-white px-2 py-1 rounded text-sm">新题</div>
                    <span className="text-sm text-gray-600">详文</span>
                  </div>
                  <div className="text-sm text-gray-500">剩余时间: 18:24</div>
                </div>
                <div className="space-y-2 text-sm text-gray-700">
                  <p>The subject matter of cultural anthropology is the shared...</p>
                  <p>In studying these different groups, anthropologists try to...</p>
                  <p className="text-blue-600 cursor-pointer hover:underline">
                    ▶ Click to continue reading...
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}