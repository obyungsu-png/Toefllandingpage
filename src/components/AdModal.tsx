import React, { useState } from 'react';
import { X, ExternalLink, Play, Image as ImageIcon, FileText, ChevronRight, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
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
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop with blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-md z-[9998]"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 50 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
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
                <motion.div
                  animate={{
                    rotate: [0, 360],
                    scale: [1, 1.2, 1]
                  }}
                  transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: 'linear'
                  }}
                  className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"
                />
                <motion.div
                  animate={{
                    rotate: [360, 0],
                    scale: [1, 1.3, 1]
                  }}
                  transition={{
                    duration: 15,
                    repeat: Infinity,
                    ease: 'linear'
                  }}
                  className="absolute -bottom-20 -left-20 w-64 h-64 bg-[#f39c12]/20 rounded-full blur-3xl"
                />

                {/* Close button */}
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className="absolute top-6 right-6 text-white hover:bg-white/20 rounded-full p-2 transition-all backdrop-blur-sm z-10"
                >
                  <X className="w-6 h-6" />
                </motion.button>

                {/* Title with animation */}
                <div className="relative z-10">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="flex items-center gap-2 mb-2"
                  >
                    <Sparkles className="w-6 h-6 text-[#f39c12]" />
                    <span className="text-sm font-medium text-[#f39c12] tracking-wide">FEATURED</span>
                  </motion.div>
                  <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-3xl md:text-4xl font-bold pr-12 leading-tight"
                  >
                    {ad.title}
                  </motion.h2>
                </div>
              </div>

              {/* Tabs Navigation */}
              {tabs.length > 1 && (
                <div className="border-b border-gray-200 bg-gray-50/50 backdrop-blur-sm sticky top-0 z-20">
                  <div className="flex px-6">
                    {tabs.map((tab, index) => {
                      const Icon = tab.icon;
                      const isActive = activeTab === tab.id;
                      return (
                        <motion.button
                          key={tab.id}
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 + index * 0.1 }}
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
                            <motion.div
                              layoutId="activeTab"
                              className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#e67e22] to-[#f39c12]"
                              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                            />
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Content Area with scroll */}
              <div className="overflow-y-auto max-h-[calc(90vh-280px)]">
                <AnimatePresence mode="wait">
                  {/* Video Tab */}
                  {activeTab === 'video' && embedUrl && (
                    <motion.div
                      key="video"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                      className="p-6"
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
                    </motion.div>
                  )}

                  {/* Image Tab */}
                  {activeTab === 'image' && ad.imageUrl && (
                    <motion.div
                      key="image"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                      className="p-6"
                    >
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        transition={{ duration: 0.3 }}
                        className="relative rounded-2xl overflow-hidden shadow-2xl"
                      >
                        <img
                          src={ad.imageUrl}
                          alt={ad.title}
                          className="w-full h-auto object-cover"
                        />
                        {/* Image overlay on hover */}
                        <motion.div
                          initial={{ opacity: 0 }}
                          whileHover={{ opacity: 1 }}
                          className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end p-6"
                        >
                          <p className="text-white font-medium">{ad.title}</p>
                        </motion.div>
                      </motion.div>
                    </motion.div>
                  )}

                  {/* Text Tab */}
                  {activeTab === 'text' && (
                    <motion.div
                      key="text"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                      className="p-8 space-y-6"
                    >
                      {/* Content with decorative elements */}
                      <div className="prose prose-lg max-w-none">
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 }}
                          className="relative"
                        >
                          {/* Decorative quote mark */}
                          <div className="absolute -left-4 -top-2 text-6xl text-[#e67e22]/20 font-serif">"</div>
                          
                          <p className="text-gray-700 text-lg leading-relaxed whitespace-pre-wrap relative z-10">
                            {ad.content}
                          </p>
                        </motion.div>

                        {/* Additional info cards */}
                        {(ad.videoUrl || ad.imageUrl) && (
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8"
                          >
                            {ad.videoUrl && (
                              <motion.button
                                whileHover={{ scale: 1.05, y: -5 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setActiveTab('video')}
                                className="bg-gradient-to-br from-[#e67e22] to-[#f39c12] text-white p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all"
                              >
                                <Play className="w-8 h-8 mb-2" />
                                <h3 className="font-bold mb-1">동영상 보기</h3>
                                <p className="text-sm text-white/90">자세한 내용을 확인하세요</p>
                              </motion.button>
                            )}
                            {ad.imageUrl && (
                              <motion.button
                                whileHover={{ scale: 1.05, y: -5 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setActiveTab('image')}
                                className="bg-gradient-to-br from-[#005f61] to-[#2d7a7c] text-white p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all"
                              >
                                <ImageIcon className="w-8 h-8 mb-2" />
                                <h3 className="font-bold mb-1">사진 보기</h3>
                                <p className="text-sm text-white/90">비주얼 콘텐츠 확인</p>
                              </motion.button>
                            )}
                          </motion.div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Footer with CTA */}
              <div className="border-t border-gray-200 p-6 bg-gradient-to-r from-gray-50 to-white">
                <div className="flex flex-col md:flex-row gap-3 justify-between items-center">
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-sm text-gray-600"
                  >
                    💡 더 많은 정보가 필요하신가요?
                  </motion.p>
                  
                  <div className="flex gap-3 w-full md:w-auto">
                    <Button
                      variant="outline"
                      onClick={onClose}
                      className="flex-1 md:flex-none border-gray-300 text-gray-700 hover:bg-gray-100 rounded-xl"
                    >
                      닫기
                    </Button>
                    {ad.buttonAction && (
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex-1 md:flex-none"
                      >
                        <Button
                          onClick={() => {
                            if (ad.buttonAction?.startsWith('http')) {
                              window.open(ad.buttonAction, '_blank');
                            }
                          }}
                          className="w-full bg-gradient-to-r from-[#e67e22] to-[#f39c12] text-white hover:from-[#d35400] hover:to-[#e67e22] shadow-lg hover:shadow-xl rounded-xl relative overflow-hidden group"
                        >
                          {/* Button shine effect */}
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                            animate={{
                              x: ['-200%', '200%']
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              repeatDelay: 1
                            }}
                          />
                          <span className="relative flex items-center gap-2">
                            {ad.buttonText || '더 알아보기'}
                            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                          </span>
                        </Button>
                      </motion.div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
