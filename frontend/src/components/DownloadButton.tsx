import { motion } from 'framer-motion';
import { Download, Loader2 } from 'lucide-react';

interface DownloadButtonProps {
  onClick: () => void;
  disabled: boolean;
  isDownloading: boolean;
  progress?: number; // 0-100
}

export function DownloadButton({ onClick, disabled, isDownloading, progress = 0 }: DownloadButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      onClick={onClick}
      disabled={disabled || isDownloading}
      className={`relative w-full py-5 rounded-2xl font-semibold text-base flex items-center justify-center gap-3 transition-all duration-500 overflow-hidden ${
        disabled
          ? 'bg-gray-800/50 text-gray-500 cursor-not-allowed'
          : 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-xl shadow-cyan-500/30 hover:shadow-cyan-500/50'
      }`}
    >
      {/* Progress bar background */}
      {isDownloading && (
        <motion.div
          initial={{ width: '0%' }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500"
        />
      )}

      {/* Animated shine effect */}
      {!disabled && !isDownloading && (
        <motion.div
          initial={{ x: '-100%', opacity: 0 }}
          animate={{ x: '200%', opacity: [0, 1, 0] }}
          transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut', repeatDelay: 1 }}
          className="absolute inset-0 w-1/3 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"
        />
      )}

      {/* Loading wave animation */}
      {isDownloading && (
        <motion.div
          animate={{ x: ['-100%', '100%'] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
        />
      )}

      {/* Content */}
      <span className="relative flex items-center gap-3 z-10">
        {isDownloading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin flex-shrink-0" />
            <span>
              {progress > 0 ? `Загрузка ${progress}%` : 'Подготовка...'}
            </span>
          </>
        ) : (
          <>
            <Download className="w-5 h-5 flex-shrink-0" />
            <span>Скачать</span>
          </>
        )}
      </span>
    </motion.button>
  );
}
