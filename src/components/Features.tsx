import { Card } from "./ui/card";
// motion removed - using CSS animations

const features = [
  {
    icon: "💻",
    title: "1:1 Exam Interface",
    description: "Fully simulates the real TOEFL iBT exam environment so you can get familiar with the interface and controls beforehand",
    color: "from-blue-500 to-cyan-500"
  },
  {
    icon: "📚",
    title: "TPO 1-75 Full Set",
    description: "Official authentic practice tests, organized by difficulty level for progressive skill building",
    color: "from-green-500 to-emerald-500"
  },
  {
    icon: "🎯",
    title: "18 Question Types",
    description: "Targeted practice for all four sections — Reading, Listening, Speaking, and Writing — with skill-specific drills",
    color: "from-purple-500 to-pink-500"
  },
  {
    icon: "📊",
    title: "Smart Study Reports",
    description: "Detailed answer analysis and skill assessments to pinpoint weaknesses and create personalized study plans",
    color: "from-orange-500 to-red-500"
  },
  {
    icon: "🎤",
    title: "Speaking Recording & Playback",
    description: "Record your responses, replay and practice repeatedly, with AI-powered scoring to improve oral expression",
    color: "from-indigo-500 to-purple-500"
  },
  {
    icon: "✍️",
    title: "Online Writing Practice",
    description: "Realistic typing environment with timed practice, smart grading, and model essay comparison",
    color: "from-pink-500 to-rose-500"
  },
  {
    icon: "📱",
    title: "Multi-Device Sync",
    description: "Study on desktop, tablet, or phone — progress syncs automatically so you can practice anytime, anywhere",
    color: "from-teal-500 to-cyan-500"
  },
  {
    icon: "🏆",
    title: "Aim for 120",
    description: "Scientific study methods and comprehensive question coverage to help you aim for a perfect TOEFL score of 120",
    color: "from-yellow-500 to-orange-500"
  }
];

export function Features() {
  return (
    <section id="features" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-5xl font-bold text-gray-900 mb-4">
            Powerful Learning Features
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            A comprehensive TOEFL study solution to help you prepare efficiently
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {features.map((feature, index) => (
            <div
              key={index}
              className="animate-[float_3s_ease-in-out_infinite]"
              style={{ animationDelay: `${index * 0.2}s`, animationDuration: `${3 + (index % 3) * 0.5}s` }}
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
            </div>
          ))}
        </div>
        
        {/* Statistics Section */}
        <div className="bg-gradient-to-r from-blue-900 via-purple-900 to-cyan-800 rounded-3xl p-8 lg:p-12 text-center text-white">
          <h3 className="text-2xl lg:text-4xl font-bold mb-4">
            Trusted by Over <span className="text-yellow-400">100,000+</span> Students
          </h3>
          <p className="text-blue-100 text-lg mb-8">
            A professional TOEFL preparation platform to help you achieve your study abroad dreams
          </p>
          
          <div className="grid sm:grid-cols-4 gap-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <div className="text-3xl font-bold text-yellow-400 mb-2">75</div>
              <div className="text-sm text-blue-100">TPO Practice Tests</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <div className="text-3xl font-bold text-green-400 mb-2">18</div>
              <div className="text-sm text-blue-100">Question Types</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <div className="text-3xl font-bold text-pink-400 mb-2">100K+</div>
              <div className="text-sm text-blue-100">Active Users</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <div className="text-3xl font-bold text-orange-400 mb-2">95%</div>
              <div className="text-sm text-blue-100">Score Improvement Rate</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}