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
                <div className="text-sm text-gray-600">Aim for 120</div>
              </div>
              
              <nav className="hidden md:flex items-center space-x-8">
                <a href="#" className="text-white bg-teal-500 px-3 py-1 rounded text-sm font-medium">Test Prep</a>
                <a href="#" className="text-gray-600 hover:text-teal-600 transition-colors text-sm">Listening</a>
                <a href="#" className="text-gray-600 hover:text-teal-600 transition-colors text-sm">Reading</a>
                <a href="#" className="text-gray-600 hover:text-teal-600 transition-colors text-sm">Writing</a>
                <a href="#" className="text-gray-600 hover:text-teal-600 transition-colors text-sm">Speaking</a>
              </nav>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm text-red-500">🔴 2023 TOEFL Exam Guide</div>
              <Button variant="outline" size="sm">Login / Register</Button>
            </div>
          </div>
        </div>
      </header>

      {/* Banner */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium">Study Abroad Chat Group</span>
            <span className="text-sm">Undergraduate/Graduate Application Guidance</span>
          </div>
          <Button size="sm" className="bg-white/20 hover:bg-white/30 text-white border-white/30">
            Join Group
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Actions */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <span className="text-gray-700 font-medium">Quick:</span>
            <Button className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded">TPO Sets</Button>
            <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded">Real Test Sets</Button>
            <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded">Friend Activity</Button>
            <span className="text-red-500 text-sm">Skip &gt;&gt;</span>
          </div>

          <div className="flex items-center space-x-2 mb-6">
            <span className="text-gray-700 font-medium">Sets:</span>
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
                <p>ETS officially restricts public distribution of TPO (TOEFL Practice Online) content. All TPO resources are provided for educational purposes only.</p>
                <p>Currently all TPO materials are publicly available. For any concerns, please contact us for clarification.</p>
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
                    <span className="text-xs text-gray-500">Not Started</span>
                    <Button size="sm" variant="outline" className="text-xs px-2 py-1">Review</Button>
                    <Button size="sm" variant="outline" className="text-xs px-2 py-1">Start Practice</Button>
                  </div>
                </div>

                {/* Listening */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Listening</span>
                  <div className="flex space-x-2">
                    <span className="text-xs text-gray-500">Not Started</span>
                    <Button size="sm" variant="outline" className="text-xs px-2 py-1">Review</Button>
                    <Button size="sm" variant="outline" className="text-xs px-2 py-1">Start Practice</Button>
                  </div>
                </div>

                {/* Speaking */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Speaking</span>
                  <div className="flex space-x-2">
                    <span className="text-xs text-gray-500">Not Started</span>
                    <Button size="sm" variant="outline" className="text-xs px-2 py-1">Review</Button>
                    <Button size="sm" variant="outline" className="text-xs px-2 py-1">Start Practice</Button>
                  </div>
                </div>

                {/* Writing */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Writing</span>
                  <div className="flex space-x-2">
                    <span className="text-xs text-gray-500">Not Started</span>
                    <Button size="sm" variant="outline" className="text-xs px-2 py-1">Review</Button>
                    <Button size="sm" variant="outline" className="text-xs px-2 py-1">Start Practice</Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Back Button */}
        <div className="mt-8 text-center">
          <Button onClick={onBack} className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2">
            Back to Home
          </Button>
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="fixed right-4 top-1/2 transform -translate-y-1/2 space-y-3">
        <div className="bg-red-500 text-white p-2 rounded text-xs text-center w-16">
          Feedback
        </div>
        <div className="bg-orange-500 text-white p-2 rounded text-xs text-center w-16">
          WeChat
        </div>
        <div className="bg-green-500 text-white p-2 rounded text-xs text-center w-16">
          TPO Chat
        </div>
        <div className="bg-blue-500 text-white p-2 rounded text-xs text-center w-16">
          Exam News
        </div>
        <div className="bg-purple-500 text-white p-2 rounded text-xs text-center w-16">
          Study Tips
        </div>
      </div>
    </div>
  );
}