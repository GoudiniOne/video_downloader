import { motion } from 'framer-motion';
import { Download, Loader2, Server } from 'lucide-react';

interface DownloadButtonProps {
  onClick: () => void;
  disabled: boolean;
  isProcessing?: boolean;
  isDownloading: boolean;
  progress?: number;
}

export function DownloadButton({ 
  onClick, 
  disabled, 
  isProcessing,
  isDownloading, 
  progress = 0 
}: DownloadButtonProps) {
  const isBusy = isProcessing || isDownloading;
  const isStreaming = isDownloading && progress > 0;

  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.01 }}
      whileTap={{ scale: disabled ? 1 : 0.99 }}
      onClick={onClick}
      disabled={disabled || isBusy}
      className={`relative w-full py-[22px] rounded-2xl font-semibold text-base flex items-center justify-center gap-3 transition-all duration-500 overflow-hidden ${
        disabled
          ? 'bg-white/4 text-gray-600 cursor-not-allowed border border-white/5'
          : isProcessing
            ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/20'
            : isDownloading
              ? 'bg-white/5 text-white border border-white/10'
              : 'accent-gradient text-white accent-glow-strong hover:accent-glow-strong'
      }`}
    >
      {isStreaming && (
        <motion.div
          initial={{ width: '0%' }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="absolute inset-0 bg-gradient-to-r from-violet-600 to-indigo-500 opacity-80"
        />
      )}

      {isProcessing && (
        <motion.div
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
          className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-cyan-500/15 to-cyan-500/5"
        />
      )}

      {!disabled && !isBusy && (
        <motion.div
          initial={{ x: '-100%', opacity: 0 }}
          animate={{ x: '200%', opacity: [0, 0.6, 0] }}
          transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut', repeatDelay: 2 }}
          className="absolute inset-0 w-1/4 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"
        />
      )}

      {(isProcessing || isDownloading) && (
        <motion.div
          animate={{ x: ['-100%', '100%'] }}
          transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
        />
      )}

      <span className="relative flex items-center gap-2.5 z-10">
        {isProcessing ? (
          <>
            <Server className="w-4 h-4 animate-pulse flex-shrink-0" />
            <span>Скачивание на сервере...</span>
          </>
        ) : isDownloading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
            <span>{progress > 0 ? `Загрузка ${progress}%` : 'Подготовка...'}</span>
          </>
        ) : (
          <>
            <Download className="w-4 h-4 flex-shrink-0" />
            <span>Скачать</span>
          </>
        )}
      </span>
    </motion.button>
  );
}
