import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, Search, Loader2, X } from 'lucide-react';
import { PlatformIcon } from './PlatformIcon';

interface UrlInputProps {
  onAnalyze: (url: string) => void;
  isLoading: boolean;
  disabled?: boolean;
}

type Platform = 'youtube' | 'instagram' | 'tiktok' | null;

function detectPlatform(url: string): Platform {
  if (!url) return null;
  const lower = url.toLowerCase();
  if (lower.includes('youtube.com') || lower.includes('youtu.be') || lower.includes('music.youtube.com')) {
    return 'youtube';
  }
  if (lower.includes('instagram.com') || lower.includes('instagr.am')) {
    return 'instagram';
  }
  if (lower.includes('tiktok.com') || lower.includes('vm.tiktok.com')) {
    return 'tiktok';
  }
  return null;
}

export function UrlInput({ onAnalyze, isLoading, disabled }: UrlInputProps) {
  const [url, setUrl] = useState('');
  const [platform, setPlatform] = useState<Platform>(null);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    setPlatform(detectPlatform(url));
  }, [url]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim() && !isLoading && !disabled && platform === 'youtube') {
      onAnalyze(url.trim());
    }
  };

  const handleClear = () => {
    setUrl('');
    setPlatform(null);
  };

  const isValidUrl = url.trim().length > 0 && platform === 'youtube';
  const isComingSoon = platform === 'instagram' || platform === 'tiktok';

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <motion.div 
        className="relative"
        animate={{ scale: isFocused ? 1.01 : 1 }}
        transition={{ duration: 0.2 }}
      >
        {/* Glow effect */}
        <AnimatePresence>
          {isFocused && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute -inset-1 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-2xl blur-lg"
            />
          )}
        </AnimatePresence>
        
        <div className={`relative glass-card rounded-2xl transition-all duration-300 ${isFocused ? 'border-cyan-500/50' : ''}`}>
          <div className="flex items-center gap-4 p-4">
            {/* Platform Icon */}
            <div className="w-12 h-12 flex items-center justify-center flex-shrink-0">
              <AnimatePresence mode="wait">
                {platform ? (
                  <motion.div
                    key={platform}
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, rotate: 180 }}
                    transition={{ type: 'spring', damping: 15 }}
                    className="flex items-center justify-center"
                  >
                    <PlatformIcon platform={platform} size={24} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="link"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center justify-center"
                  >
                    <Link className="w-6 h-6 text-gray-500" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Input */}
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="Вставьте ссылку на видео..."
              disabled={disabled || isLoading}
              className="flex-1 min-w-0 bg-transparent border-none outline-none text-white text-base placeholder-gray-500 py-3 h-12"
            />

            {/* Clear button */}
            <AnimatePresence>
              {url && (
                <motion.button
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  type="button"
                  onClick={handleClear}
                  className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-all flex-shrink-0"
                >
                  <X className="w-5 h-5" />
                </motion.button>
              )}
            </AnimatePresence>

            {/* Submit button */}
            <motion.button
              whileHover={{ scale: isValidUrl && !isLoading ? 1.02 : 1 }}
              whileTap={{ scale: isValidUrl && !isLoading ? 0.98 : 1 }}
              type="submit"
              disabled={!isValidUrl || isLoading || disabled}
              className={`h-12 px-6 rounded-xl font-semibold text-base flex items-center justify-center gap-2 transition-all duration-300 flex-shrink-0 whitespace-nowrap ${
                isValidUrl && !isLoading
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40'
                  : 'bg-gray-700/50 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin flex-shrink-0" />
                  <span>Поиск</span>
                </>
              ) : (
                <>
                  <Search className="w-5 h-5 flex-shrink-0" />
                  <span>Найти</span>
                </>
              )}
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Coming soon message */}
      <AnimatePresence>
        {isComingSoon && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-4 text-amber-400 text-xs flex items-center justify-center gap-2"
          >
            <span className="px-3 py-1.5 rounded-lg bg-amber-500/20">
              {platform === 'instagram' ? 'Instagram' : 'TikTok'} скоро будет поддерживаться
            </span>
          </motion.p>
        )}
      </AnimatePresence>
    </form>
  );
}
