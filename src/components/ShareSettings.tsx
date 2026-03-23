import { useState } from 'react';
import { Send, MessageCircle, Mail, CheckCircle, Settings, X } from 'lucide-react';
import { Button } from './ui/button';
import { toast } from 'sonner@2.0.3';

export interface ShareConfig {
  enabled: boolean;
  wechatEnabled: boolean;
  smsEnabled: boolean;
  wechatId?: string;
  parentPhone?: string;
  parentName?: string;
  autoSend: boolean;
  minScore?: number; // Only send if score is above this
}

interface ShareSettingsProps {
  themeColor?: string;
  config: ShareConfig;
  onSave: (config: ShareConfig) => void;
  onClose: () => void;
}

export function ShareSettings({ 
  themeColor = '#005f61',
  config,
  onSave,
  onClose
}: ShareSettingsProps) {
  const [formData, setFormData] = useState<ShareConfig>(config);

  const handleSave = () => {
    onSave(formData);
    toast.success('Share settings saved!');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        style={{ animation: 'fadeIn 0.3s ease-out' }}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl" style={{ backgroundColor: `${themeColor}20` }}>
                <Settings className="w-6 h-6" style={{ color: themeColor }} />
              </div>
              <div>
                <h2 className="text-2xl font-bold" style={{ color: themeColor }}>
                  Result Sharing Settings
                </h2>
                <p className="text-sm text-gray-600">
                  Automatically share test results with parents
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Auto Send Toggle */}
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-6 border-l-4 border-blue-500">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <Send className="w-6 h-6 text-blue-600 mt-1" />
                <div>
                  <h3 className="font-bold text-gray-800 mb-1">Auto Send</h3>
                  <p className="text-sm text-gray-600">
                    Automatically send results when a test is completed
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.autoSend}
                  onChange={(e) => setFormData({ ...formData, autoSend: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>

          {/* Minimum Score Filter */}
          {formData.autoSend && (
            <div
              className="bg-yellow-50 rounded-xl p-4 border border-yellow-200"
            >
              <label className="block mb-2">
                <span className="text-sm font-bold text-gray-700">
                  Minimum Score Threshold (Optional)
                </span>
                <p className="text-xs text-gray-600 mt-1">
                  Only send when the score is above the set threshold. If not set, all results will be sent.
                </p>
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.minScore || ''}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    minScore: e.target.value ? parseInt(e.target.value) : undefined 
                  })}
                  placeholder="e.g. 70"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <span className="text-gray-600 font-medium">or above</span>
              </div>
            </div>
          )}

          {/* WeChat Settings */}
          <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100">
                  <MessageCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">WeChat Sharing</h3>
                  <p className="text-sm text-gray-600">Send results via WeChat ID</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.wechatEnabled}
                  onChange={(e) => setFormData({ ...formData, wechatEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
              </label>
            </div>

            {formData.wechatEnabled && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    WeChat ID
                  </label>
                  <input
                    type="text"
                    value={formData.wechatId || ''}
                    onChange={(e) => setFormData({ ...formData, wechatId: e.target.value })}
                    placeholder="e.g. parent_wechat_123"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div className="bg-green-50 rounded-lg p-3 text-sm text-gray-700">
                  <p className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">ℹ️</span>
                    <span>WeChat API integration required. Currently running in simulation mode.</span>
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* SMS Settings */}
          <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-100">
                  <Mail className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">SMS Notification</h3>
                  <p className="text-sm text-gray-600">Send results to parents via SMS</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.smsEnabled}
                  onChange={(e) => setFormData({ ...formData, smsEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>

            {formData.smsEnabled && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Parent Name
                  </label>
                  <input
                    type="text"
                    value={formData.parentName || ''}
                    onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                    placeholder="e.g. John Smith"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Parent Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.parentPhone || ''}
                    onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                    placeholder="e.g. +1-234-567-8900"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div className="bg-purple-50 rounded-lg p-3 text-sm text-gray-700">
                  <p className="flex items-start gap-2">
                    <span className="text-purple-600 mt-0.5">ℹ️</span>
                    <span>SMS API integration required. Currently running in simulation mode.</span>
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Preview Message */}
          {(formData.wechatEnabled || formData.smsEnabled) && (
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
              <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Message Preview
              </h4>
              <div className="bg-white rounded-lg p-4 border border-gray-300 font-mono text-sm">
                <p className="text-gray-800">
                  {formData.parentName ? `[${formData.parentName}]` : '[Parent]'}
                </p>
                <p className="text-gray-800 mt-2">
                  Your child's TOEFL test results are ready.
                </p>
                <p className="text-gray-600 mt-2">
                  Test: TPO 75 - Reading<br />
                  Score: 85<br />
                  Accuracy: 8/10 (80%)<br />
                  Date: 2024.12.22 15:30
                </p>
                <p className="text-gray-600 mt-2">
                  - TOEFL TPO Online Practice Platform
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 rounded-b-2xl flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="flex-1 text-white"
            style={{ backgroundColor: themeColor }}
          >
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}