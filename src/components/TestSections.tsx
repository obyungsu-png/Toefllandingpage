import { Card } from "./ui/card";
import { Button } from "./ui/button";

const sections = [
  {
    title: "Reading",
    icon: "📖",
    duration: "54-72 min",
    questions: "30-40 Q",
    features: [
      "Fully simulated TOEFL iBT exam interface",
      "TPO 1-75 original/adapted question practice",
      "Articles organized by difficulty level"
    ],
    color: "from-blue-500 to-cyan-500",
    bgColor: "bg-blue-50"
  },
  {
    title: "Listening", 
    icon: "🎧",
    duration: "41-57 min",
    questions: "28-39 Q",
    features: [
      "Full coverage of conversation and lecture types",
      "Adjustable audio playback speed",
      "Note-taking feature replicates real exam"
    ],
    color: "from-green-500 to-emerald-500",
    bgColor: "bg-green-50"
  },
  {
    title: "Speaking",
    icon: "🎤", 
    duration: "17 min",
    questions: "4 Q",
    features: [
      "Independent and integrated speaking practice",
      "Recording and playback analysis",
      "AI-powered scoring and improvement tips"
    ],
    color: "from-purple-500 to-pink-500", 
    bgColor: "bg-purple-50"
  },
  {
    title: "Writing",
    icon: "✍️",
    duration: "50 min", 
    questions: "2 Q",
    features: [
      "Integrated and independent writing tasks",
      "Online typing practice environment",
      "Model essay comparison and scoring rubrics"
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
            Four Section Practice
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Complete coverage of all four skills with 18 targeted question types
          </p>
        </div>

        {/* Advertisement Banner */}
        <div className="mb-12">
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 flex items-center gap-4">
            {/* Left Image */}
            <div className="shrink-0 w-24 h-24 rounded-lg overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1639396104908-a8f2037ad565?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdHVkeSUyMGJvb2tzJTIwZGVza3xlbnwxfHx8fDE3NjE2MzExMzF8MA&ixlib=rb-4.1.0&q=80&w=1080"
                alt="Study advertisement"
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* Right Content */}
            <div className="flex-1 flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-[#2d5a5d] mb-1">TOEFL Full-Length Practice Test Program</h3>
                <p className="text-gray-600 text-sm">
                  Experience mock exams in the same environment as the real test. Perfect your time management and build test-taking skills.
                </p>
              </div>
              <Button
                onClick={() => alert('Contact us for more info')}
                className="bg-[#f39c12] text-white hover:bg-[#e67e22] transition-colors shadow-md hover:shadow-lg ml-6 px-5 py-4 shrink-0 rounded-full"
              >
                Learn More
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
                  Start {section.title} Practice
                </Button>
              </div>
            </Card>
          ))}
        </div>
        
        {/* Reading Section Detail */}
        <div className="mt-16 bg-white rounded-2xl shadow-xl p-8 border">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Reading</h3>
              <div className="space-y-4 text-gray-700">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Fully simulated TOEFL iBT exam interface</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>TPO 1-75 original/adapted question practice</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span>Articles organized by difficulty for progressive learning</span>
                </div>
              </div>
            </div>
            <div className="bg-gray-100 rounded-xl p-6">
              <div className="bg-white rounded-lg p-4 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <div className="bg-blue-500 text-white px-2 py-1 rounded text-sm">New</div>
                    <span className="text-sm text-gray-600">Passage</span>
                  </div>
                  <div className="text-sm text-gray-500">Time Remaining: 18:24</div>
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