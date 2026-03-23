import React, { useState } from 'react';
import { X, ExternalLink, Play, Image as ImageIcon, FileText, ChevronRight, Sparkles } from 'lucide-react';
import { Button } from './ui/button';
import { Advertisement } from './AdManagement';

interface AdModalProps {
  ad: Advertisement;
  isOpen: boolean;
  onClose: () => void;
}

type ContentTab = 'video' | 'image' | 'text';

export function AdModal({ ad, isOpen, onClose }: AdModalProps) {
  const [activeTab, setActiveTab] = useState<ContentTab>(() => {
    if (ad.videoUrl) return 'video';
    if (ad.imageUrl) return 'image';
    return 'text';
  });

  if (!isOpen) return null;

  // Extract YouTube video ID
  const getYouTubeEmbedUrl = (url: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11
      ? `https://www.youtube.com/embed/${match[2]}`
      : url;
  };

  const embedUrl = ad.videoUrl ? getYouTubeEmbedUrl(ad.videoUrl) : null;

  // Determine available tabs
  const availableTabs: ContentTab[] = [];
  if (embedUrl) availableTabs.push('video');
  if (ad.imageUrl) availableTabs.push('image');
  availableTabs.push('text');

  const tabs = [
    { id: 'video' as ContentTab, label: '동영상', icon: Play, available: !!embedUrl },
    { id: 'image' as ContentTab, label: '사진', icon: ImageIcon, available: !!ad.imageUrl },
    { id: 'text' as ContentTab, label: '상세정보', icon: FileText, available: true }
  ].filter(tab => tab.available);

  return (
    <>
      {isOpen && (
        <>
          {/* Backdrop with blur */}
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-md z-[9998]"
            style={{ animation: 'fadeIn 0.3s ease-out' }}
            onClick={onClose}
          />

          {/* Modal */}
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
            style={{ animation: 'scaleIn 0.3s ease-out' }}
            onClick={onClose}
          >
            <div
              className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Decorative gradient overlay */}
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#e67e22] via-[#f39c12] to-[#e67e22] animate-pulse" />

              {/* Header with glassmorphism effect */}
              <div className="relative bg-gradient-to-br from-[#005f61] via-[#2d7a7c] to-[#1e6b73] text-white p-8 overflow-hidden">
                {/* Animated background shapes */}
                <div
                  className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"
                  style={{ animation: 'slowRotate 20s linear infinite' }}
                />
                <div
                  className="absolute -bottom-20 -left-20 w-64 h-64 bg-[#f39c12]/20 rounded-full blur-3xl"
                  style={{ animation: 'slowRotate 15s linear infinite reverse' }}
                />

                {/* Close button */}
                <button
                  onClick={onClose}
                  className="absolute top-6 right-6 text-white hover:bg-white/20 rounded-full p-2 transition-all backdrop-blur-sm z-10 hover:scale-110 hover:rotate-90 active:scale-90"
                >
                  <X className="w-6 h-6" />
                </button>

                {/* Title */}
                <div className="relative z-10">
                  <div
                    className="flex items-center gap-2 mb-2"
                    style={{ animation: 'fadeInUp 0.4s ease-out 0.1s both' }}
                  >
                    <Sparkles className="w-6 h-6 text-[#f39c12]" />
                    <span className="text-sm font-medium text-[#f39c12] tracking-wide">FEATURED</span>
                  </div>
                  <h2
                    className="text-3xl md:text-4xl font-bold pr-12 leading-tight"
                    style={{ animation: 'fadeInUp 0.4s ease-out 0.2s both' }}
                  >
                    {ad.title}
                  </h2>
                </div>
              </div>

              {/* Tabs Navigation */}
              {tabs.length > 1 && (
                <div className="border-b border-gray-200 bg-gray-50/50 backdrop-blur-sm sticky top-0 z-20">
                  <div className="flex px-6">
                    {tabs.map((tab) => {
                      const Icon = tab.icon;
                      const isActive = activeTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={`relative flex items-center gap-2 px-6 py-4 font-medium transition-all ${
                            isActive
                              ? 'text-[#e67e22]'
                              : 'text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
                          <span>{tab.label}</span>
                          
                          {/* Active indicator */}
                          {isActive && (
                            <div
                              className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#e67e22] to-[#f39c12] transition-all"
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Content Area with scroll */}
              <div className="overflow-y-auto max-h-[calc(90vh-280px)]">
                {/* Video Tab */}
                {activeTab === 'video' && embedUrl && (
                  <div
                    className="p-6"
                    style={{ animation: 'fadeIn 0.3s ease-out' }}
                  >
                    <div className="relative w-full rounded-2xl overflow-hidden shadow-2xl bg-black aspect-video">
                      <iframe
                        className="absolute top-0 left-0 w-full h-full"
                        src={embedUrl}
                        title={ad.title}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  </div>
                )}

                {/* Image Tab */}
                {activeTab === 'image' && ad.imageUrl && (
                  <div
                    className="p-6"
                    style={{ animation: 'fadeIn 0.3s ease-out' }}
                  >
                    <div
                      className="relative rounded-2xl overflow-hidden shadow-2xl hover:scale-[1.02] transition-transform duration-300"
                    >
                      <img
                        src={ad.imageUrl}
                        alt={ad.title}
                        className="w-full h-auto object-cover"
                      />
                      {/* Image overlay on hover */}
                      <div
                        className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end p-6 opacity-0 hover:opacity-100 transition-opacity"
                      >
                        <p className="text-white font-medium">{ad.title}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Text Tab */}
                {activeTab === 'text' && (
                  <div
                    className="p-8 space-y-6"
                    style={{ animation: 'fadeIn 0.3s ease-out' }}
                  >
                    {/* Content with decorative elements */}
                    <div className="prose prose-lg max-w-none">
                      <div className="relative" style={{ animation: 'fadeInUp 0.4s ease-out 0.2s both' }}>
                        {/* Decorative quote mark */}
                        <div className="absolute -left-4 -top-2 text-6xl text-[#e67e22]/20 font-serif">"</div>
                        
                        <p className="text-gray-700 text-lg leading-relaxed whitespace-pre-wrap relative z-10">
                          {ad.content}
                        </p>
                      </div>

                      {/* Additional info cards */}
                      {(ad.videoUrl || ad.imageUrl) && (
                        <div
                          className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8"
                          style={{ animation: 'fadeInUp 0.4s ease-out 0.4s both' }}
                        >
                          {ad.videoUrl && (
                            <button
                              onClick={() => setActiveTab('video')}
                              className="bg-gradient-to-br from-[#e67e22] to-[#f39c12] text-white p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all hover:scale-105 hover:-translate-y-1 active:scale-95 text-left"
                            >
                              <Play className="w-8 h-8 mb-2" />
                              <h3 className="font-bold mb-1">동영상 보기</h3>
                              <p className="text-sm text-white/90">자세한 내용을 확인하세요</p>
                            </button>
                          )}
                          {ad.imageUrl && (
                            <button
                              onClick={() => setActiveTab('image')}
                              className="bg-gradient-to-br from-[#005f61] to-[#2d7a7c] text-white p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all hover:scale-105 hover:-translate-y-1 active:scale-95 text-left"
                            >
                              <ImageIcon className="w-8 h-8 mb-2" />
                              <h3 className="font-bold mb-1">사진 보기</h3>
                              <p className="text-sm text-white/90">비주얼 콘텐츠 확인</p>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer with CTA */}
              <div className="border-t border-gray-200 p-6 bg-gradient-to-r from-gray-50 to-white">
                <div className="flex flex-col md:flex-row gap-3 justify-between items-center">
                  <p className="text-sm text-gray-600">
                    💡 더 많은 정보가 필요하신가요?
                  </p>
                  
                  <div className="flex gap-3 w-full md:w-auto">
                    <Button
                      variant="outline"
                      onClick={onClose}
                      className="flex-1 md:flex-none border-gray-300 text-gray-700 hover:bg-gray-100 rounded-xl"
                    >
                      닫기
                    </Button>
                    {ad.buttonAction && (
                      <div className="flex-1 md:flex-none hover:scale-105 active:scale-95 transition-transform">
                        <Button
                          onClick={() => {
                            if (ad.buttonAction?.startsWith('http')) {
                              window.open(ad.buttonAction, '_blank');
                            }
                          }}
                          className="w-full bg-gradient-to-r from-[#e67e22] to-[#f39c12] text-white hover:from-[#d35400] hover:to-[#e67e22] shadow-lg hover:shadow-xl rounded-xl relative overflow-hidden group"
                        >
                          {/* Button shine effect */}
                          <div
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                            style={{ animation: 'shimmer 3s infinite' }}
                          />
                          <span className="relative flex items-center gap-2">
                            {ad.buttonText || '더 알아보기'}
                            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                          </span>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
