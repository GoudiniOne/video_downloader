import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { useDisclaimer } from './hooks/useDisclaimer';
import {
  DisclaimerModal,
  UrlInput,
  VideoPreview,
  FormatSelector,
  DownloadButton,
} from './components';
import { analyzeUrl, downloadFile } from './api/client';
import type { VideoInfo, Format, AppState } from './types';

function App() {
  const { accepted, accept } = useDisclaimer();
  const [state, setState] = useState<AppState>('idle');
  const [video, setVideo] = useState<VideoInfo | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<Format | null>(null);
  const [currentUrl, setCurrentUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);

  const handleAnalyze = useCallback(async (url: string) => {
    setError(null);
    setState('analyzing');
    setVideo(null);
    setSelectedFormat(null);
    setCurrentUrl(url);
    setDownloadProgress(0);

    try {
      const info = await analyzeUrl(url);
      setVideo(info);
      const firstVideo = info.formats.find((f) => f.type === 'video');
      const firstAudio = info.formats.find((f) => f.type === 'audio');
      setSelectedFormat(firstVideo || firstAudio || info.formats[0] || null);
      setState('ready');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка');
      setState('error');
    }
  }, []);

  const handleDownload = useCallback(async () => {
    if (!currentUrl || !selectedFormat) return;

    setState('processing');
    setDownloadProgress(0);

    try {
      await downloadFile(
        currentUrl,
        selectedFormat.id,
        selectedFormat.type,
        (progress) => {
          setDownloadProgress(progress);
        },
        () => {
          setState('downloading');
        },
        selectedFormat.size,
      );
      setState('ready');
      setDownloadProgress(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка скачивания');
      setState('error');
    }
  }, [currentUrl, selectedFormat]);

  const handleReset = () => {
    setState('idle');
    setVideo(null);
    setSelectedFormat(null);
    setCurrentUrl('');
    setError(null);
    setDownloadProgress(0);
  };

  const isDownloading = state === 'processing' || state === 'downloading';

  if (accepted === null) {
    return (
      <div className="min-h-screen bg-gradient-main flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!accepted) {
    return <DisclaimerModal onAccept={accept} />;
  }

  return (
    <div className="min-h-screen bg-gradient-main">
      <div className="noise-overlay" />
      <div className="grid-pattern" />

      <div className="min-h-screen flex flex-col items-center px-6 py-12 relative z-10">
        <div className="flex-1 min-h-8 max-h-24" />

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-10"
        >
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 200, damping: 15 }}
            className="inline-flex items-center justify-center w-18 h-18 rounded-2xl accent-gradient mb-7 accent-glow"
          >
            <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.6 }}
            className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4"
          >
            <span className="accent-gradient-text">Video</span>{' '}
            <span className="text-white">Downloader</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-base text-gray-500 font-light"
          >
            Скачивайте видео быстро и без ограничений
          </motion.p>
        </motion.div>

        {/* Platform badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="flex flex-wrap justify-center gap-3 mb-14"
        >
          <PlatformBadge platform="YouTube" icon="youtube" active />
          <PlatformBadge platform="Instagram" icon="instagram" soon />
          <PlatformBadge platform="TikTok" icon="tiktok" soon />
        </motion.div>

        {/* URL Input */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-2xl"
        >
          <UrlInput
            onAnalyze={handleAnalyze}
            isLoading={state === 'analyzing'}
            disabled={isDownloading}
          />
        </motion.div>

        {/* Error */}
        <AnimatePresence>
          {state === 'error' && error && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.97 }}
              className="w-full max-w-2xl mt-8 px-6 py-5 rounded-2xl bg-rose-500/8 border border-rose-500/20 flex items-center gap-4"
            >
              <div className="p-2.5 rounded-xl bg-rose-500/15 flex-shrink-0">
                <AlertCircle className="w-4 h-4 text-rose-400" />
              </div>
              <p className="text-rose-300 flex-1 text-sm font-light">{error}</p>
              <button
                onClick={handleReset}
                className="p-2.5 hover:bg-rose-500/15 rounded-xl transition-colors flex-shrink-0"
              >
                <RefreshCw className="w-4 h-4 text-rose-400" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Video results */}
        <AnimatePresence>
          {video && state !== 'error' && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="w-full max-w-2xl mt-12 space-y-8"
            >
              <VideoPreview video={video} />

              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="glass-card-elevated rounded-2xl p-7 md:p-8"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-1 rounded-full accent-gradient flex-shrink-0 self-stretch" />
                  <h3 className="text-base font-semibold text-white py-0.5">Формат загрузки</h3>
                </div>
                <FormatSelector
                  formats={video.formats}
                  selectedFormat={selectedFormat}
                  onSelect={setSelectedFormat}
                  disabled={isDownloading}
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
              >
                <DownloadButton
                  onClick={handleDownload}
                  disabled={!selectedFormat}
                  isProcessing={state === 'processing'}
                  isDownloading={state === 'downloading'}
                  progress={downloadProgress}
                />
              </motion.div>

              {!isDownloading && (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  onClick={handleReset}
                  className="w-full py-4 text-gray-500 hover:text-gray-300 transition-all flex items-center justify-center gap-2.5 rounded-xl hover:bg-white/3"
                >
                  <RefreshCw className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="text-sm font-medium">Скачать другое видео</span>
                </motion.button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex-1 min-h-10 max-h-28" />

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="pb-6"
        >
          <p className="text-gray-600 text-xs font-medium tracking-widest uppercase">
            by goudini
          </p>
        </motion.footer>
      </div>
    </div>
  );
}

function PlatformBadge({ platform, icon, active, soon }: {
  platform: string;
  icon: 'youtube' | 'instagram' | 'tiktok';
  active?: boolean;
  soon?: boolean;
}) {
  const iconMap = {
    youtube: (
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="#ef4444">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
    instagram: (
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="url(#ig-badge)">
        <defs>
          <linearGradient id="ig-badge" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FFDC80" />
            <stop offset="50%" stopColor="#F77737" />
            <stop offset="100%" stopColor="#C13584" />
          </linearGradient>
        </defs>
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    ),
    tiktok: (
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="white">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
      </svg>
    ),
  };

  return (
    <div className={`flex items-center gap-2.5 h-10 px-5 rounded-full border text-xs font-medium transition-all ${
      active
        ? 'bg-white/5 border-white/10 text-white'
        : 'bg-white/2 border-white/5 text-gray-500'
    }`}>
      {iconMap[icon]}
      <span>{platform}</span>
      {active && (
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
      )}
      {soon && (
        <span className="text-[10px] text-gray-600 ml-0.5">скоро</span>
      )}
    </div>
  );
}

export default App;
