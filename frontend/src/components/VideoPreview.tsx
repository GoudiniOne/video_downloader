import { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';
import { PlatformIcon } from './PlatformIcon';
import { getThumbnailUrl } from '../api/client';
import type { VideoInfo } from '../types';

interface VideoPreviewProps {
  video: VideoInfo;
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

export function VideoPreview({ video }: VideoPreviewProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Use proxied thumbnail URL to avoid CORS issues
  const thumbnailUrl = video.thumbnail ? getThumbnailUrl(video.thumbnail) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
      className="glass-card rounded-2xl overflow-hidden"
    >
      {/* Thumbnail Container */}
      <div className="relative aspect-video bg-gray-900">
        {thumbnailUrl && !imageError ? (
          <>
            {/* Loading placeholder */}
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                  className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full"
                />
              </div>
            )}
            <img
              src={thumbnailUrl}
              alt={video.title}
              className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
            />
          </>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
            <PlatformIcon platform={video.platform} size={48} />
          </div>
        )}
        
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />
        
        {/* Duration badge */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="absolute bottom-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/50 backdrop-blur-sm"
        >
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-xs text-white font-semibold">{formatDuration(video.duration)}</span>
        </motion.div>

        {/* Platform badge */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="absolute top-4 left-4 flex items-center justify-center w-9 h-9 rounded-lg bg-black/50 backdrop-blur-sm"
        >
          <PlatformIcon platform={video.platform} size={20} />
        </motion.div>
      </div>

      {/* Info Section */}
      <div className="p-5 text-center">
        <h3 className="text-base font-medium text-white leading-relaxed break-words">
          {video.title}
        </h3>
      </div>
    </motion.div>
  );
}
