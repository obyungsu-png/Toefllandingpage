import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Plus, Edit2, Trash2, Save, X, Image as ImageIcon, Video, FileText, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner@2.0.3';
import { projectId, publicAnonKey } from '../utils/supabase/info';

// ============================================================================
// Types
// ============================================================================

export interface Advertisement {
  id: string;
  title: string;
  content: string; // Main description text (used in banner)
  imageUrl?: string;
  videoUrl?: string;
  buttonText?: string; // Button text
  buttonAction?: string; // Button URL or action
  locations?: string[]; // Array of locations: ['TPO', 'Test', 'QuestionTypes', 'Training', 'History']
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// AdManagement Component
// ============================================================================

interface AdManagementProps {
  themeColor?: string;
}

export function AdManagement({ themeColor = '#005f61' }: AdManagementProps) {
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingAd, setEditingAd] = useState<Advertisement | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    imageUrl: '',
    videoUrl: '',
    buttonText: '더 알아보기',
    buttonAction: '',
    locations: ['TPO', 'Test'],
    isActive: true
  });

  // Load ads from server
  useEffect(() => {
    loadAds();
  }, []);

  const loadAds = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-e46cd33a/advertisements`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          setAds(data);
        }
      }
    } catch (error) {
      console.error('Failed to load ads:', error);
      toast.error('광고 불러오기 실패');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.content) {
      toast.error('제목과 내용은 필수입니다');
      return;
    }

    try {
      setIsLoading(true);

      const adData: Advertisement = {
        id: editingAd?.id || `ad-${Date.now()}`,
        ...formData,
        createdAt: editingAd?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      console.log('💾 Saving advertisement:', adData);

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-e46cd33a/advertisements`,
        {
          method: editingAd ? 'PUT' : 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(adData)
        }
      );

      if (response.ok) {
        toast.success(editingAd ? '광고가 수정되었습니다' : '광고가 생성되었습니다');
        await loadAds();
        handleCancel();
      } else {
        throw new Error('Failed to save ad');
      }
    } catch (error) {
      console.error('Failed to save ad:', error);
      toast.error('광고 저장 실패');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (ad: Advertisement) => {
    setEditingAd(ad);
    setFormData({
      title: ad.title,
      content: ad.content,
      imageUrl: ad.imageUrl || '',
      videoUrl: ad.videoUrl || '',
      buttonText: ad.buttonText || '더 알아보기',
      buttonAction: ad.buttonAction || '',
      locations: ad.locations || ['TPO', 'Test'],
      isActive: ad.isActive
    });
    setIsEditing(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('정말 이 광고를 삭제하시겠습니까?')) return;

    try {
      setIsLoading(true);
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-e46cd33a/advertisements/${id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`
          }
        }
      );

      if (response.ok) {
        toast.success('광고가 삭제되었습니다');
        await loadAds();
      }
    } catch (error) {
      console.error('Failed to delete ad:', error);
      toast.error('광고 삭제 실패');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditingAd(null);
    setFormData({
      title: '',
      content: '',
      imageUrl: '',
      videoUrl: '',
      buttonText: '더 알아보기',
      buttonAction: '',
      locations: ['TPO', 'Test'],
      isActive: true
    });
  };

  const handleToggleActive = async (ad: Advertisement) => {
    try {
      const updatedAd = { ...ad, isActive: !ad.isActive, updatedAt: new Date().toISOString() };
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-e46cd33a/advertisements`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(updatedAd)
        }
      );

      if (response.ok) {
        toast.success(updatedAd.isActive ? '광고가 활성화되었습니다' : '광고가 비활성화되었습니다');
        await loadAds();
      }
    } catch (error) {
      console.error('Failed to toggle ad:', error);
      toast.error('광고 상태 변경 실패');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 pb-24 md:pb-0">
      <div className="max-w-7xl mx-auto px-8 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#2d5a5d]">광고 관리</h1>
            <p className="text-sm text-gray-600 mt-1">플랫폼에 표시될 광고를 관리합니다</p>
          </div>
          {!isEditing && (
            <Button
              onClick={() => setIsEditing(true)}
              className="bg-gradient-to-r from-[#e67e22] to-[#f39c12] text-white hover:from-[#d35400] hover:to-[#e67e22]"
            >
              <Plus className="w-4 h-4 mr-2" />
              새 광고 만들기
            </Button>
          )}
        </div>

        {/* Edit/Create Form */}
        <AnimatePresence>
          {isEditing && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-xl border-2 border-gray-200 p-6 mb-6 shadow-lg"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold" style={{ color: themeColor }}>
                  {editingAd ? '광고 수정' : '새 광고 만들기'}
                </h2>
                <Button variant="ghost" size="sm" onClick={handleCancel}>
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    제목 *
                  </label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="광고 제목을 입력하세요"
                    required
                  />
                </div>

                {/* Content */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    내용 *
                  </label>
                  <Textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="광고 배너에 표시될 내용"
                    rows={2}
                    required
                  />
                </div>

                {/* Image URL */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                    <ImageIcon className="w-4 h-4 mr-1" />
                    이미지 URL
                  </label>
                  <Input
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                    type="url"
                  />
                  {formData.imageUrl && (
                    <img 
                      src={formData.imageUrl} 
                      alt="Preview" 
                      className="mt-2 w-full h-40 object-cover rounded-lg border"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  )}
                </div>

                {/* Video URL */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                    <Video className="w-4 h-4 mr-1" />
                    동영상 URL (YouTube, Vimeo 등)
                  </label>
                  <Input
                    value={formData.videoUrl}
                    onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                    placeholder="https://www.youtube.com/watch?v=..."
                    type="url"
                  />
                </div>

                {/* Button Text */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    버튼 텍스트
                  </label>
                  <Input
                    value={formData.buttonText}
                    onChange={(e) => setFormData({ ...formData, buttonText: e.target.value })}
                    placeholder="더 알아보기"
                  />
                </div>

                {/* Button Action */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                    <ExternalLink className="w-4 h-4 mr-1" />
                    외부 링크 (선택)
                  </label>
                  <Input
                    value={formData.buttonAction}
                    onChange={(e) => setFormData({ ...formData, buttonAction: e.target.value })}
                    placeholder="https://example.com"
                    type="url"
                  />
                </div>

                {/* Locations */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    표시 위치
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <label className="inline-flex items-center">
                      <input
                        type="checkbox"
                        value="TPO"
                        checked={formData.locations.includes('TPO')}
                        onChange={(e) => {
                          const newLocations = e.target.checked
                            ? [...formData.locations, 'TPO']
                            : formData.locations.filter(loc => loc !== 'TPO');
                          setFormData({ ...formData, locations: newLocations });
                        }}
                        className="w-4 h-4 rounded border-gray-300"
                      />
                      <span className="ml-2 text-sm font-medium text-gray-700">TPO</span>
                    </label>
                    <label className="inline-flex items-center">
                      <input
                        type="checkbox"
                        value="Test"
                        checked={formData.locations.includes('Test')}
                        onChange={(e) => {
                          const newLocations = e.target.checked
                            ? [...formData.locations, 'Test']
                            : formData.locations.filter(loc => loc !== 'Test');
                          setFormData({ ...formData, locations: newLocations });
                        }}
                        className="w-4 h-4 rounded border-gray-300"
                      />
                      <span className="ml-2 text-sm font-medium text-gray-700">Test</span>
                    </label>
                    <label className="inline-flex items-center">
                      <input
                        type="checkbox"
                        value="QuestionTypes"
                        checked={formData.locations.includes('QuestionTypes')}
                        onChange={(e) => {
                          const newLocations = e.target.checked
                            ? [...formData.locations, 'QuestionTypes']
                            : formData.locations.filter(loc => loc !== 'QuestionTypes');
                          setFormData({ ...formData, locations: newLocations });
                        }}
                        className="w-4 h-4 rounded border-gray-300"
                      />
                      <span className="ml-2 text-sm font-medium text-gray-700">QuestionTypes</span>
                    </label>
                    <label className="inline-flex items-center">
                      <input
                        type="checkbox"
                        value="Training"
                        checked={formData.locations.includes('Training')}
                        onChange={(e) => {
                          const newLocations = e.target.checked
                            ? [...formData.locations, 'Training']
                            : formData.locations.filter(loc => loc !== 'Training');
                          setFormData({ ...formData, locations: newLocations });
                        }}
                        className="w-4 h-4 rounded border-gray-300"
                      />
                      <span className="ml-2 text-sm font-medium text-gray-700">Training</span>
                    </label>
                    <label className="inline-flex items-center">
                      <input
                        type="checkbox"
                        value="History"
                        checked={formData.locations.includes('History')}
                        onChange={(e) => {
                          const newLocations = e.target.checked
                            ? [...formData.locations, 'History']
                            : formData.locations.filter(loc => loc !== 'History');
                          setFormData({ ...formData, locations: newLocations });
                        }}
                        className="w-4 h-4 rounded border-gray-300"
                      />
                      <span className="ml-2 text-sm font-medium text-gray-700">History</span>
                    </label>
                  </div>
                </div>

                {/* Active Toggle */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                    광고 활성화
                  </label>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-4">
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 bg-gradient-to-r from-[#e67e22] to-[#f39c12] text-white hover:from-[#d35400] hover:to-[#e67e22]"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {isLoading ? '저장 중...' : editingAd ? '수정하기' : '생성하기'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                    disabled={isLoading}
                  >
                    취소
                  </Button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Ads List */}
        <div className="space-y-4">
          {isLoading && ads.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              광고를 불러오는 중...
            </div>
          ) : ads.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border-2 border-dashed border-gray-300">
              <ImageIcon className="w-12 h-12 mx-auto text-gray-400 mb-3" />
              <p className="text-gray-500 mb-2">등록된 광고가 없습니다</p>
              <p className="text-sm text-gray-400">새 광고를 만들어보세요</p>
            </div>
          ) : (
            ads.map((ad) => (
              <motion.div
                key={ad.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-white rounded-xl border-2 p-6 shadow-sm hover:shadow-md transition-all ${
                  ad.isActive ? 'border-green-200' : 'border-gray-200 opacity-60'
                }`}
              >
                <div className="flex gap-4">
                  {/* Thumbnail */}
                  {ad.imageUrl && (
                    <img
                      src={ad.imageUrl}
                      alt={ad.title}
                      className="w-32 h-32 object-cover rounded-lg"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  )}

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-lg font-bold text-[#2d5a5d]">{ad.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">{ad.content}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleActive(ad)}
                          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                            ad.isActive
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {ad.isActive ? '활성화' : '비활성화'}
                        </button>
                      </div>
                    </div>

                    {/* Meta Info */}
                    <div className="flex flex-wrap gap-3 text-xs text-gray-500 mb-3">
                      {ad.locations && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded font-medium">
                          📍 {ad.locations.join(', ')}
                        </span>
                      )}
                      {ad.videoUrl && (
                        <span className="flex items-center">
                          <Video className="w-3 h-3 mr-1" />
                          동영상 포함
                        </span>
                      )}
                      {ad.buttonAction && (
                        <span className="flex items-center">
                          <ExternalLink className="w-3 h-3 mr-1" />
                          외부 링크
                        </span>
                      )}
                      <span>생성: {new Date(ad.createdAt).toLocaleDateString('ko-KR')}</span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(ad)}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        <Edit2 className="w-3 h-3 mr-1" />
                        수정
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(ad.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        삭제
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}