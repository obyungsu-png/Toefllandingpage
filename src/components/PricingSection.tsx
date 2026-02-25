import { Crown, Diamond, Check } from 'lucide-react';
import { useState } from 'react';

export function PricingSection() {
  const [selectedCategory, setSelectedCategory] = useState('TOEFL');
  const [selectedPeriod, setSelectedPeriod] = useState('6 Months');

  const categories = ['TOEFL', 'IELTS'];
  const periods = ['1 Month', '3 Months', '6 Months', '1 Year'];

  return (
    <div className="bg-gradient-to-b from-white to-gray-50 relative shrink-0 w-full shadow-sm pb-24 md:pb-0">
      <div className="max-w-7xl mx-auto px-3 md:px-8 py-6 md:py-12">
        {/* Header */}
        <div className="text-center mb-4 md:mb-8">
          <h1 className="text-2xl md:text-4xl font-bold text-[#2d5a5d] mb-2 md:mb-4">
            Start Your Journey to Success
          </h1>
          <p className="text-gray-600 text-sm md:text-lg max-w-3xl mx-auto px-3">
            Conquer your high school academic career with Test Ninjas premium products. Cancel anytime, no hidden charges.
          </p>
        </div>

        {/* Category Tabs */}
        <div className="flex justify-center gap-2 md:gap-3 mb-4 md:mb-6">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-6 md:px-8 py-2 md:py-3 rounded-full font-semibold transition-all text-sm md:text-base ${
                selectedCategory === category
                  ? 'bg-[#2d5a5d] text-white shadow-lg'
                  : 'bg-white text-gray-700 border border-gray-300 hover:border-[#2d5a5d]'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Period Selection */}
        <div className="text-center mb-4 md:mb-8">
          <p className="text-gray-600 mb-3 md:mb-4 text-xs md:text-base px-3">Save more with longer commitments.</p>
          <div className="flex justify-center gap-2 md:gap-3 flex-wrap px-2">
            {periods.map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-3 md:px-6 py-1.5 md:py-2 rounded-full font-semibold transition-all text-xs md:text-base ${
                  selectedPeriod === period
                    ? 'bg-[#2d5a5d] text-white shadow-md'
                    : 'bg-white text-gray-700 border border-gray-300 hover:border-[#2d5a5d]'
                }`}
              >
                {period}
              </button>
            ))}
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 max-w-5xl mx-auto">
          {/* Digital Plan */}
          <div className="bg-gray-50 rounded-2xl p-4 md:p-8 border border-gray-200 shadow-lg hover:shadow-xl transition-all">
            <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
              <Diamond className="w-6 h-6 md:w-8 md:h-8 text-gray-700" />
              <h2 className="text-lg md:text-2xl font-bold text-gray-800">Digital {selectedCategory}</h2>
            </div>

            <div className="mb-4 md:mb-6">
              <div className="flex items-baseline gap-2">
                <span className="text-gray-400 line-through text-base md:text-xl">$39</span>
                <span className="text-2xl md:text-4xl font-bold text-gray-800">$19</span>
                <span className="text-gray-600 text-sm md:text-base">/month</span>
              </div>
              <div className="mt-2 inline-block">
                <span className="bg-[#10b981] text-white px-2 md:px-3 py-0.5 md:py-1 rounded-full text-xs md:text-sm font-semibold">
                  Save 51%
                </span>
              </div>
              <p className="text-gray-600 text-xs md:text-sm mt-2">$114 billed every 6 months</p>
            </div>

            <button className="w-full bg-[#2d5a5d] text-white py-3 md:py-4 rounded-lg font-bold text-sm md:text-lg hover:bg-[#1e6b73] transition-all shadow-md hover:shadow-lg mb-3 md:mb-6">
              Start 7-day Free Trial
            </button>

            <p className="text-[#3b82f6] text-xs md:text-sm font-semibold mb-3 md:mb-6">
              150-point increase money-back guarantee
            </p>

            {/* Features List - Condensed for mobile */}
            <ul className="space-y-1.5 md:space-y-3">
              {[
                '20 Full-length practice tests',
                'Online course with 92 lessons',
                '3000 practice questions',
                '30 Reading & Writing modules',
                '30 Math practice modules',
                '122 Question-type sets',
                'Unlimited study tools access'
              ].map((feature, index) => (
                <li key={index} className="flex items-start gap-2 text-gray-700">
                  <Check className="w-4 h-4 md:w-5 md:h-5 text-[#10b981] shrink-0 mt-0.5" />
                  <span className="text-xs md:text-sm">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* High School Success Plan */}
          <div className="bg-white rounded-2xl p-4 md:p-8 border-2 border-[#3b82f6] shadow-xl hover:shadow-2xl transition-all relative">
            {/* Most Popular Badge */}
            <div className="absolute -top-2 md:-top-3 left-1/2 -translate-x-1/2">
              <div className="bg-[#3b82f6] text-white px-3 md:px-4 py-0.5 md:py-1 rounded-full text-xs md:text-sm font-bold flex items-center gap-1">
                <Crown className="w-3 h-3 md:w-4 md:h-4" />
                Most popular
              </div>
            </div>

            <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
              <Crown className="w-6 h-6 md:w-8 md:h-8 text-[#3b82f6]" />
              <h2 className="text-lg md:text-2xl font-bold text-gray-800">High School Success</h2>
            </div>

            <div className="mb-4 md:mb-6">
              <div className="flex items-baseline gap-2">
                <span className="text-gray-400 line-through text-base md:text-xl">$69</span>
                <span className="text-2xl md:text-4xl font-bold text-gray-800">$35</span>
                <span className="text-gray-600 text-sm md:text-base">/month</span>
              </div>
              <div className="mt-2 inline-block">
                <span className="bg-[#10b981] text-white px-2 md:px-3 py-0.5 md:py-1 rounded-full text-xs md:text-sm font-semibold">
                  Save 49%
                </span>
              </div>
              <p className="text-gray-600 text-xs md:text-sm mt-2">$210 billed every 6 months</p>
            </div>

            <p className="text-gray-700 font-semibold mb-3 md:mb-6 text-sm md:text-base">
              Everything in one amazing deal
            </p>

            <button className="w-full bg-[#3b82f6] text-white py-3 md:py-4 rounded-lg font-bold text-sm md:text-lg hover:bg-[#2563eb] transition-all shadow-md hover:shadow-lg mb-3 md:mb-6">
              Start 7-Day Free Trial
            </button>

            {/* Included Packages */}
            <div className="space-y-2 md:space-y-3 bg-gray-50 p-3 md:p-6 rounded-xl border border-gray-200">
              <div className="flex items-start gap-2">
                <Check className="w-4 h-4 md:w-5 md:h-5 text-[#10b981] shrink-0 mt-0.5" />
                <div className="text-xs md:text-base">
                  <span className="font-semibold text-gray-800">Complete Digital {selectedCategory}</span>
                  <span className="text-gray-600"> premium package</span>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-4 h-4 md:w-5 md:h-5 text-[#10b981] shrink-0 mt-0.5" />
                <div className="text-xs md:text-base">
                  <span className="font-semibold text-gray-800">Complete IELTS</span>
                  <span className="text-gray-600"> premium package</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="mt-6 md:mt-12 text-center">
          <div className="flex justify-center items-center gap-4 md:gap-8 flex-wrap px-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 md:w-12 md:h-12 bg-[#10b981] rounded-full flex items-center justify-center">
                <Check className="w-4 h-4 md:w-6 md:h-6 text-white" />
              </div>
              <div className="text-left">
                <p className="font-bold text-gray-800 text-xs md:text-base">Money-Back</p>
                <p className="text-xs md:text-sm text-gray-600">150+ points</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 md:w-12 md:h-12 bg-[#3b82f6] rounded-full flex items-center justify-center">
                <Check className="w-4 h-4 md:w-6 md:h-6 text-white" />
              </div>
              <div className="text-left">
                <p className="font-bold text-gray-800 text-xs md:text-base">Cancel Anytime</p>
                <p className="text-xs md:text-sm text-gray-600">No fees</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 md:w-12 md:h-12 bg-[#f39c12] rounded-full flex items-center justify-center">
                <Check className="w-4 h-4 md:w-6 md:h-6 text-white" />
              </div>
              <div className="text-left">
                <p className="font-bold text-gray-800 text-xs md:text-base">7-Day Trial</p>
                <p className="text-xs md:text-sm text-gray-600">Try it free</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}