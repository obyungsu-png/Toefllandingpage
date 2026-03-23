import { Card } from "./ui/card";
import { ImageWithFallback } from "./figma/ImageWithFallback";

export function AboutToefl() {
  return (
    <section id="about" className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-5xl font-bold text-gray-900 mb-4">
            Why Choose Our Platform?
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            A professional, efficient, and comprehensive TOEFL preparation solution
          </p>
        </div>
        
        <div className="grid lg:grid-cols-3 gap-8 mb-16">
          <Card className="bg-white border-0 shadow-xl p-8 text-center">
            <div className="bg-gradient-to-r from-blue-500 to-cyan-500 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 text-white text-2xl shadow-lg">
              🎯
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">Precise Targeting</h3>
            <p className="text-gray-600">
              AI-powered diagnostic system based on big data analysis to pinpoint your weaknesses and provide personalized study plans
            </p>
          </Card>
          
          <Card className="bg-white border-0 shadow-xl p-8 text-center">
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 text-white text-2xl shadow-lg">
              📈
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">Efficient Improvement</h3>
            <p className="text-gray-600">
              Scientific learning paths and methods with an average score improvement of 25+, helping you reach your target score in the shortest time
            </p>
          </Card>
          
          <Card className="bg-white border-0 shadow-xl p-8 text-center">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 text-white text-2xl shadow-lg">
              🏆
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">Official & Authentic</h3>
            <p className="text-gray-600">
              Using official TPO practice tests with a fully simulated real exam environment to ensure your practice matches the actual test experience
            </p>
          </Card>
        </div>
        
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="bg-white rounded-2xl shadow-xl p-8 border">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Study Progress Tracking</h3>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Reading</span>
                  <span className="text-blue-600 font-semibold">85%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div className="bg-gradient-to-r from-blue-500 to-cyan-500 h-3 rounded-full" style={{width: '85%'}}></div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Listening</span>
                  <span className="text-green-600 font-semibold">78%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full" style={{width: '78%'}}></div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Speaking</span>
                  <span className="text-purple-600 font-semibold">72%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full" style={{width: '72%'}}></div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Writing</span>
                  <span className="text-orange-600 font-semibold">68%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div className="bg-gradient-to-r from-orange-500 to-red-500 h-3 rounded-full" style={{width: '68%'}}></div>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg">
                <p className="text-blue-700 font-medium">
                  Keep it up! Estimated 2 more weeks of practice to reach your target score of 105
                </p>
              </div>
            </div>
          </div>
          
          <div className="space-y-8">
            <h3 className="text-2xl font-bold text-gray-900">
              Comprehensive Learning Support
            </h3>
            
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <span className="text-blue-600 text-xl">📝</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Detailed Explanations</h4>
                  <p className="text-gray-600">Every question comes with detailed solution analysis and strategy tips to help you understand the logic behind each problem</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="bg-green-100 p-3 rounded-lg">
                  <span className="text-green-600 text-xl">📊</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Study Reports</h4>
                  <p className="text-gray-600">AI-generated personalized study reports to track progress and adjust learning strategies</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="bg-purple-100 p-3 rounded-lg">
                  <span className="text-purple-600 text-xl">🎯</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Effective Motivation</h4>
                  <p className="text-gray-600">Scientific practice scheduling and goal setting to maintain learning momentum and efficiency</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}