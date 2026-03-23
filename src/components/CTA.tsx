import { Button } from "./ui/button";
import { Card } from "./ui/card";

export function CTA() {
  return (
    <section className="py-20 bg-gradient-to-br from-cyan-50 to-blue-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="relative overflow-hidden bg-gradient-to-br from-white via-blue-50 to-purple-50 border-0 shadow-2xl p-8 lg:p-16 text-center">
          <div className="relative z-10">
            <h2 className="text-3xl lg:text-5xl font-bold text-gray-900 mb-6">
              Begin Your TOEFL
              <br />
              <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                Journey to Score 120
              </span>
            </h2>
            
            <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
              Join over 100,000 students using the most professional TOEFL preparation platform
              <br />
              TPO 1-75 full practice tests with 1:1 exam simulation
            </p>
            
            <div className="space-y-8">
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="text-lg px-10 py-6 bg-gradient-to-r from-orange-400 to-yellow-400 hover:from-orange-500 hover:to-yellow-500 text-white border-0 shadow-xl">
                  Start Learning Now
                </Button>
                <Button variant="outline" size="lg" className="text-lg px-10 py-6 border-blue-500 text-blue-600 hover:bg-blue-50">
                  Try TPO for Free
                </Button>
              </div>
              
              <div className="grid sm:grid-cols-3 gap-6">
                <div className="group text-center hover:scale-105 transition-transform duration-300">
                  <div className="bg-gradient-to-r from-blue-500 to-cyan-500 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-xl transition-shadow">
                    <span className="text-white text-2xl">💬</span>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">WeChat Support</h4>
                  <p className="text-gray-600">toeful120</p>
                </div>
                
                <div className="group text-center hover:scale-105 transition-transform duration-300">
                  <div className="bg-gradient-to-r from-green-500 to-emerald-500 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-xl transition-shadow">
                    <span className="text-white text-2xl">📞</span>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Hotline</h4>
                  <p className="text-gray-600">400-888-0120</p>
                </div>
                
                <div className="group text-center hover:scale-105 transition-transform duration-300">
                  <div className="bg-gradient-to-r from-purple-500 to-pink-500 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-xl transition-shadow">
                    <span className="text-white text-2xl">📧</span>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Email</h4>
                  <p className="text-gray-600">service@toefl120.cn</p>
                </div>
              </div>
            </div>
            
            {/* Special Offer */}
            <div className="mt-12 bg-gradient-to-r from-orange-400 to-yellow-400 rounded-2xl p-6 text-white">
              <h3 className="text-xl font-bold mb-2">🎉 Limited Time Offer</h3>
              <p className="mb-4">New users get a 7-day free trial + 20% off the first month</p>
              <div className="flex items-center justify-center space-x-4">
                <span className="bg-white/20 px-3 py-1 rounded-full text-sm">TPO Practice Tests</span>
                <span className="bg-white/20 px-3 py-1 rounded-full text-sm">Smart Study Reports</span>
                <span className="bg-white/20 px-3 py-1 rounded-full text-sm">Expert Q&A Support</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
}