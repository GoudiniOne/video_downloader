import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Music, Video, Check } from 'lucide-react';
import type { Format } from '../types';

interface FormatSelectorProps {
  formats: Format[];
  selectedFormat: Format | null;
  onSelect: (format: Format) => void;
}

type TabType = 'audio' | 'video';

export function FormatSelector({ formats, selectedFormat, onSelect }: FormatSelectorProps) {
  const [activeTab, setActiveTab] = useState<TabType>('video');

  const groupedFormats = useMemo(() => {
    const audio = formats.filter((f) => f.type === 'audio');
    const video = formats.filter((f) => f.type === 'video');
    const videoOnly = formats.filter((f) => f.type === 'video_only');
    return { audio, video, videoOnly };
  }, [formats]);

  const currentFormats = activeTab === 'audio'
    ? groupedFormats.audio
    : [...groupedFormats.video, ...groupedFormats.videoOnly];

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
  };

  const formatSize = (bytes?: number) => {
    if (!bytes) return '';
    const mb = bytes / (1024 * 1024);
    if (mb < 1) return `${Math.round(bytes / 1024)} KB`;
    return `${mb.toFixed(1)} MB`;
  };

  return (
    <div className="space-y-5">
      {/* Tabs */}
      <div className="flex gap-2 p-2 rounded-xl bg-white/3">
        {[
          { id: 'video' as TabType, icon: Video, label: 'Видео' },
          { id: 'audio' as TabType, icon: Music, label: 'Аудио' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`relative flex-1 flex items-center justify-center gap-2.5 py-3 px-5 rounded-lg font-medium text-sm transition-all duration-300 ${
              activeTab === tab.id
                ? 'text-white'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {activeTab === tab.id && (
              <motion.div
                layoutId="activeTab"
                className="absolute inset-0 rounded-lg accent-gradient opacity-90"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative flex items-center gap-2 z-10">
              <tab.icon className="w-4 h-4 flex-shrink-0" />
              {tab.label}
            </span>
          </button>
        ))}
      </div>

      {/* Format cards */}
      <div className="space-y-2.5 max-h-72 overflow-y-auto py-1 px-1 -mx-1">
        {currentFormats.length === 0 ? (
          <p className="py-6 text-gray-500 text-center text-sm">Нет доступных форматов</p>
        ) : (
          currentFormats.map((format, index) => {
            const isSelected = selectedFormat?.id === format.id;
            return (
              <motion.button
                key={format.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
                onClick={() => onSelect(format)}
                className={`w-full p-4 flex items-center gap-4 text-left rounded-xl transition-all duration-300 group ${
                  isSelected
                    ? 'bg-violet-500/12 border border-violet-500/25'
                    : 'bg-white/2 border border-transparent hover:bg-white/5 hover:border-white/8'
                }`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                  isSelected
                    ? 'accent-gradient accent-glow'
                    : 'bg-white/5 group-hover:bg-white/8'
                }`}>
                  {isSelected ? (
                    <Check className="w-4 h-4 text-white" />
                  ) : format.type === 'audio' ? (
                    <Music className="w-3.5 h-3.5 text-gray-500" />
                  ) : (
                    <Video className="w-3.5 h-3.5 text-gray-500" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate transition-colors ${
                    isSelected ? 'text-violet-300' : 'text-gray-300 group-hover:text-white'
                  }`}>
                    {format.quality}
                  </p>
                  <p className="text-xs text-gray-600 truncate mt-1">
                    {format.ext.toUpperCase()}
                    {format.type === 'video_only' && ' (без звука)'}
                  </p>
                </div>

                {format.size && (
                  <span className={`text-xs px-3 py-1 rounded-md flex-shrink-0 transition-colors ${
                    isSelected
                      ? 'text-violet-400 bg-violet-500/10'
                      : 'text-gray-600 bg-white/3'
                  }`}>
                    {formatSize(format.size)}
                  </span>
                )}
              </motion.button>
            );
          })
        )}
      </div>
    </div>
  );
}
