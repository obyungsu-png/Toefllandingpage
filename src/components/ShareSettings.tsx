import { useState } from 'react';
import { motion } from 'motion/react';
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
    toast.success('공유 설정이 저장되었습니다!');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
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
                  결과 공유 설정
                </h2>
                <p className="text-sm text-gray-600">
                  시험 결과를 자동으로 공유할 수 있습니다
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
                  <h3 className="font-bold text-gray-800 mb-1">자동 전송</h3>
                  <p className="text-sm text-gray-600">
                    시험 완료 시 결과를 자동으로 전송합니다
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
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-yellow-50 rounded-xl p-4 border border-yellow-200"
            >
              <label className="block mb-2">
                <span className="text-sm font-bold text-gray-700">
                  최소 점수 설정 (선택사항)
                </span>
                <p className="text-xs text-gray-600 mt-1">
                  설정한 점수 이상일 때만 전송합니다. 미설정 시 모든 결과를 전송합니다.
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
                  placeholder="예: 70"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <span className="text-gray-600 font-medium">점 이상</span>
              </div>
            </motion.div>
          )}

          {/* WeChat Settings */}
          <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100">
                  <MessageCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">WeChat (위챗) 공유</h3>
                  <p className="text-sm text-gray-600">위챗 ID로 결과를 전송합니다</p>
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
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-3"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    위챗 ID
                  </label>
                  <input
                    type="text"
                    value={formData.wechatId || ''}
                    onChange={(e) => setFormData({ ...formData, wechatId: e.target.value })}
                    placeholder="예: parent_wechat_123"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div className="bg-green-50 rounded-lg p-3 text-sm text-gray-700">
                  <p className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">ℹ️</span>
                    <span>위챗 API 연동이 필요합니다. 현재는 시뮬레이션 모드로 작동합니다.</span>
                  </p>
                </div>
              </motion.div>
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
                  <h3 className="font-bold text-gray-800">SMS (문자) 전송</h3>
                  <p className="text-sm text-gray-600">부모님께 문자로 결과를 전송합니다</p>
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
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-3"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    부모님 성함
                  </label>
                  <input
                    type="text"
                    value={formData.parentName || ''}
                    onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                    placeholder="예: 홍길동"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    부모님 전화번호
                  </label>
                  <input
                    type="tel"
                    value={formData.parentPhone || ''}
                    onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                    placeholder="예: 010-1234-5678"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div className="bg-purple-50 rounded-lg p-3 text-sm text-gray-700">
                  <p className="flex items-start gap-2">
                    <span className="text-purple-600 mt-0.5">ℹ️</span>
                    <span>SMS API 연동이 필요합니다. 현재는 시뮬레이션 모드로 작동합니다.</span>
                  </p>
                </div>
              </motion.div>
            )}
          </div>

          {/* Preview Message */}
          {(formData.wechatEnabled || formData.smsEnabled) && (
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
              <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                전송 메시지 미리보기
              </h4>
              <div className="bg-white rounded-lg p-4 border border-gray-300 font-mono text-sm">
                <p className="text-gray-800">
                  {formData.parentName ? `[${formData.parentName}님]` : '[부모님]'}
                </p>
                <p className="text-gray-800 mt-2">
                  학생의 토플 테스트 결과가 나왔습니다.
                </p>
                <p className="text-gray-600 mt-2">
                  테스트: TPO 75 - Reading<br />
                  점수: 85점<br />
                  정답률: 8/10 (80%)<br />
                  날짜: 2024.12.22 15:30
                </p>
                <p className="text-gray-600 mt-2">
                  - 托福TPO 在线모考练습평台
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
            취소
          </Button>
          <Button
            onClick={handleSave}
            className="flex-1 text-white"
            style={{ backgroundColor: themeColor }}
          >
            저장하기
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
