import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ExternalLink, Play } from 'lucide-react';
import { Button } from './ui/button';
import type { Advertisement } from './AdManagement';

interface AdDetailPopupProps {
  ad: Advertisement | null;
  isOpen: boolean;
  onClose: () => void;
}

export function AdDetailPopup({ ad, isOpen, onClose }: AdDetailPopupProps) {
  if (!ad) return null;

  // Extract YouTube video ID
  const getYouTubeEmbedUrl = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    const videoId = match && match[2].length === 11 ? match[2] : null;
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
  };

  // Extract Vimeo video ID
  const getVimeoEmbedUrl = (url: string) => {
    const regExp = /vimeo\.com\/(\d+)/;
    const match = url.match(regExp);
    return match ? `https://player.vimeo.com/video/${match[1]}` : null;
  };

  const getEmbedUrl = (url: string) => {
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      return getYouTubeEmbedUrl(url);
    } else if (url.includes('vimeo.com')) {
      return getVimeoEmbedUrl(url);
    }
    return null;
  };

  const embedUrl = ad.videoUrl ? getEmbedUrl(ad.videoUrl) : null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Popup */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="relative">
                {/* Featured Image or Video */}
                {ad.imageUrl && !embedUrl && (
                  <div className="relative h-64 md:h-80 overflow-hidden">
                    <img
                      src={ad.imageUrl}
                      alt={ad.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  </div>
                )}

                {/* Close Button */}
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-2 bg-white/90 hover:bg-white rounded-full shadow-lg transition-all hover:scale-110 z-10"
                >
                  <X className="w-5 h-5 text-gray-700" />
                </button>

                {/* Title Overlay (if image exists) */}
                {ad.imageUrl && !embedUrl && (
                  <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                    <h2 className="text-3xl font-bold mb-2">{ad.title}</h2>
                    <p className="text-white/90">{ad.description}</p>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-6 md:p-8 overflow-y-auto max-h-[calc(90vh-20rem)]">
                {/* Title (if no image) */}
                {(!ad.imageUrl || embedUrl) && (
                  <div className="mb-6">
                    <h2 className="text-3xl font-bold text-[#2d5a5d] mb-2">{ad.title}</h2>
                    <p className="text-gray-600">{ad.description}</p>
                  </div>
                )}

                {/* Video Embed */}
                {embedUrl && (
                  <div className="mb-6 rounded-xl overflow-hidden shadow-lg">
                    <div className="relative pb-[56.25%] h-0">
                      <iframe
                        src={embedUrl}
                        className="absolute top-0 left-0 w-full h-full"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        title={ad.title}
                      />
                    </div>
                  </div>
                )}

                {/* Video Link (if not embeddable) */}
                {ad.videoUrl && !embedUrl && (
                  <a
                    href={ad.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-4 mb-6 bg-gradient-to-r from-[#e67e22]/10 to-[#f39c12]/10 border-2 border-[#e67e22]/30 rounded-xl hover:border-[#e67e22] transition-all group"
                  >
                    <div className="w-12 h-12 bg-[#e67e22] rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Play className="w-6 h-6 text-white ml-1" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-[#e67e22]">동영상 보기</p>
                      <p className="text-sm text-gray-600">{ad.videoUrl}</p>
                    </div>
                    <ExternalLink className="w-5 h-5 text-[#e67e22]" />
                  </a>
                )}

                {/* Main Content */}
                {ad.content && (
                  <div className="prose prose-sm md:prose-base max-w-none mb-6">
                    <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                      {ad.content}
                    </div>
                  </div>
                )}

                {/* Additional Images (if multiple) */}
                {ad.imageUrl && embedUrl && (
                  <div className="mb-6">
                    <img
                      src={ad.imageUrl}
                      alt={ad.title}
                      className="w-full rounded-xl shadow-lg"
                    />
                  </div>
                )}

                {/* Call to Action */}
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  {ad.ctaUrl ? (
                    <a
                      href={ad.ctaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1"
                    >
                      <Button className="w-full bg-gradient-to-r from-[#e67e22] to-[#f39c12] text-white hover:from-[#d35400] hover:to-[#e67e22] py-6 text-lg">
                        {ad.ctaText}
                        <ExternalLink className="w-5 h-5 ml-2" />
                      </Button>
                    </a>
                  ) : (
                    <Button
                      onClick={onClose}
                      className="flex-1 bg-gradient-to-r from-[#005f61] to-[#2d7a7c] text-white hover:from-[#004d56] hover:to-[#1e6b73] py-6 text-lg"
                    >
                      닫기
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
