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

  const thumbnailUrl = video.thumbnail ? getThumbnailUrl(video.thumbnail) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="glass-card-elevated rounded-2xl overflow-hidden"
    >
      <div className="relative aspect-video bg-gray-950">
        {thumbnailUrl && !imageError ? (
          <>
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                  className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full"
                />
              </div>
            )}
            <img
              src={thumbnailUrl}
              alt={video.title}
              className={`w-full h-full object-cover transition-opacity duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
            />
          </>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-violet-950/50 to-gray-950 flex items-center justify-center">
            <PlatformIcon platform={video.platform} size={48} />
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="absolute bottom-4 right-4 flex items-center gap-2 px-3.5 py-2 rounded-lg bg-black/60 backdrop-blur-md border border-white/10"
        >
          <Clock className="w-3.5 h-3.5 text-violet-400" />
          <span className="text-xs text-white font-medium tabular-nums">{formatDuration(video.duration)}</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="absolute top-4 left-4 flex items-center justify-center w-10 h-10 rounded-lg bg-black/60 backdrop-blur-md border border-white/10"
        >
          <PlatformIcon platform={video.platform} size={18} />
        </motion.div>
      </div>

      <div className="px-6 py-5 md:px-7 md:py-6">
        <h3 className="text-sm md:text-base font-medium text-gray-200 leading-relaxed break-words line-clamp-2">
          {video.title}
        </h3>
      </div>
    </motion.div>
  );
}
