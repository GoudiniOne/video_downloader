import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Loader2, X } from 'lucide-react';
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
      <div className="relative">
        <AnimatePresence>
          {isFocused && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute -inset-[1px] rounded-2xl"
              style={{
                background: 'linear-gradient(135deg, rgba(139,92,246,0.3), rgba(99,102,241,0.2), rgba(6,182,212,0.3))',
                filter: 'blur(12px)',
              }}
            />
          )}
        </AnimatePresence>

        <div
          className={`relative rounded-2xl transition-all duration-500 ${
            isFocused
              ? 'glass-card-elevated'
              : 'glass-card hover:border-white/10'
          }`}
          style={isFocused ? { borderColor: 'rgba(139, 92, 246, 0.3)' } : undefined}
        >
          <div className="flex items-center gap-4 p-5 md:p-6">
            <div className="w-12 h-12 flex items-center justify-center flex-shrink-0 rounded-xl bg-white/5">
              <AnimatePresence mode="wait">
                {platform ? (
                  <motion.div
                    key={platform}
                    initial={{ scale: 0, rotate: -90 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, rotate: 90 }}
                    transition={{ type: 'spring', damping: 15 }}
                  >
                    <PlatformIcon platform={platform} size={20} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="search"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <Search className="w-4 h-4 text-gray-600" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="Вставьте ссылку на видео..."
              disabled={disabled || isLoading}
              className="flex-1 min-w-0 bg-transparent border-none outline-none text-white text-sm md:text-base placeholder-gray-600 py-3"
            />

            <AnimatePresence>
              {url && !isLoading && (
                <motion.button
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  type="button"
                  onClick={handleClear}
                  className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/8 rounded-lg transition-all flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </motion.button>
              )}
            </AnimatePresence>

            <motion.button
              whileHover={{ scale: isValidUrl && !isLoading ? 1.03 : 1 }}
              whileTap={{ scale: isValidUrl && !isLoading ? 0.97 : 1 }}
              type="submit"
              disabled={!isValidUrl || isLoading || disabled}
              className={`h-12 px-6 rounded-xl font-semibold text-sm flex items-center justify-center gap-2.5 transition-all duration-500 flex-shrink-0 ${
                isValidUrl && !isLoading
                  ? 'accent-gradient text-white accent-glow'
                  : 'bg-white/5 text-gray-600 cursor-not-allowed'
              }`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
                  <span className="hidden sm:inline">Анализ...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 flex-shrink-0" />
                  <span className="hidden sm:inline">Найти</span>
                </>
              )}
            </motion.button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isComingSoon && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mt-3 flex justify-center"
          >
            <span className="text-xs text-amber-400/80 bg-amber-500/8 border border-amber-500/15 px-4 py-2 rounded-lg">
              {platform === 'instagram' ? 'Instagram' : 'TikTok'} — скоро
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </form>
  );
}
