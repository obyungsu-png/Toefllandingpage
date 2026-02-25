import { Card } from "./ui/card";
import { motion } from 'framer-motion';

const features = [
  {
    icon: "💻",
    title: "1:1还原机考界面",
    description: "完全模拟真实TOEFL iBT考试环境，让你提前适应考试界面和操作方式",
    color: "from-blue-500 to-cyan-500"
  },
  {
    icon: "📚",
    title: "TPO 1-75全套真题",
    description: "官方权威真题，按难度分级，循序渐进提升实战能力",
    color: "from-green-500 to-emerald-500"
  },
  {
    icon: "🎯",
    title: "18种题型专练",
    description: "听说读写四大分项，每种题型都有针对性的专项练习和技巧指导",
    color: "from-purple-500 to-pink-500"
  },
  {
    icon: "📊",
    title: "智能学习报告",
    description: "详细的答题分析和能力评估，精准定位薄弱环节，制定个性化学习计划",
    color: "from-orange-500 to-red-500"
  },
  {
    icon: "🎤",
    title: "口语录音回放",
    description: "支持录音功能，可反复练习和回放，配合AI评分系统提升口语表达",
    color: "from-indigo-500 to-purple-500"
  },
  {
    icon: "✍️",
    title: "在线写作练习",
    description: "真实打字环境，计时练习，智能批改和范文对比分析",
    color: "from-pink-500 to-rose-500"
  },
  {
    icon: "📱",
    title: "多设备同步",
    description: "支持电脑、平板、手机多设备学习，进度自动同步，随时随地练习",
    color: "from-teal-500 to-cyan-500"
  },
  {
    icon: "🏆",
    title: "冲刺120分",
    description: "科学的学习方法和全面的题型覆盖，助你冲刺托福120分满分",
    color: "from-yellow-500 to-orange-500"
  }
];

export function Features() {
  return (
    <section id="features" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-5xl font-bold text-gray-900 mb-4">
            强大的学习功能
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            全方位的TOEFL学习解决方案，助你高效备考
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              animate={{ 
                y: [0, -10, 0],
              }}
              transition={{
                duration: 3 + (index % 3) * 0.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: index * 0.2
              }}
            >
              <Card className="group relative overflow-hidden bg-gradient-to-br from-gray-50 to-white border shadow-lg hover:shadow-xl transition-all duration-500 hover:scale-105 p-6 text-center h-full">
                <div className="space-y-4">
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-r ${feature.color} text-white text-2xl shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">{feature.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
        
        {/* Statistics Section */}
        <div className="bg-gradient-to-r from-blue-900 via-purple-900 to-cyan-800 rounded-3xl p-8 lg:p-12 text-center text-white">
          <h3 className="text-2xl lg:text-4xl font-bold mb-4">
            超过 <span className="text-yellow-400">100,000+</span> 学生的选择
          </h3>
          <p className="text-blue-100 text-lg mb-8">
            专业的TOEFL备考平台，助你实现留学梦想
          </p>
          
          <div className="grid sm:grid-cols-4 gap-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <div className="text-3xl font-bold text-yellow-400 mb-2">75</div>
              <div className="text-sm text-blue-100">套TPO真题</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <div className="text-3xl font-bold text-green-400 mb-2">18</div>
              <div className="text-sm text-blue-100">种题型练习</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <div className="text-3xl font-bold text-pink-400 mb-2">100K+</div>
              <div className="text-sm text-blue-100">活跃用户</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <div className="text-3xl font-bold text-orange-400 mb-2">95%</div>
              <div className="text-sm text-blue-100">提分率</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}