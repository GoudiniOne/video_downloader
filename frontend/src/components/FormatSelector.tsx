import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Music, Video, ChevronDown, Check } from 'lucide-react';
import type { Format } from '../types';

interface FormatSelectorProps {
  formats: Format[];
  selectedFormat: Format | null;
  onSelect: (format: Format) => void;
}

type TabType = 'audio' | 'video';

export function FormatSelector({ formats, selectedFormat, onSelect }: FormatSelectorProps) {
  const [activeTab, setActiveTab] = useState<TabType>('video');
  const [isOpen, setIsOpen] = useState(false);

  const groupedFormats = useMemo(() => {
    const audio = formats.filter((f) => f.type === 'audio');
    const video = formats.filter((f) => f.type === 'video');
    const videoOnly = formats.filter((f) => f.type === 'video_only');
    return { audio, video, videoOnly };
  }, [formats]);

  const currentFormats = activeTab === 'audio' 
    ? groupedFormats.audio 
    : [...groupedFormats.video, ...groupedFormats.videoOnly];

  const handleSelect = (format: Format) => {
    onSelect(format);
    setIsOpen(false);
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setIsOpen(false);
  };

  const formatSize = (bytes?: number) => {
    if (!bytes) return '';
    const mb = bytes / (1024 * 1024);
    if (mb < 1) return `${Math.round(bytes / 1024)} KB`;
    return `${mb.toFixed(1)} MB`;
  };

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-3">
        {[
          { id: 'video' as TabType, icon: Video, label: 'Видео' },
          { id: 'audio' as TabType, icon: Music, label: 'Аудио' },
        ].map((tab) => (
          <motion.button
            key={tab.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleTabChange(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium text-sm transition-all duration-300 ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/20'
                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <tab.icon className="w-4 h-4 flex-shrink-0" />
            <span>{tab.label}</span>
          </motion.button>
        ))}
      </div>

      {/* Dropdown - opens down, content shifts */}
      <div>
        <motion.button
          whileHover={{ scale: 1.01 }}
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full glass-card rounded-xl p-4 flex items-center justify-between text-left transition-all duration-300 ${
            isOpen ? 'border-cyan-500/50 rounded-b-none' : 'hover:border-white/20'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {selectedFormat && (
              <div className="w-9 h-9 rounded-lg bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                {selectedFormat.type === 'audio' ? (
                  <Music className="w-4 h-4 text-cyan-400" />
                ) : (
                  <Video className="w-4 h-4 text-cyan-400" />
                )}
              </div>
            )}
            <div className="min-w-0 flex-1">
              {selectedFormat ? (
                <>
                  <p className="text-white font-medium text-sm truncate">{selectedFormat.quality}</p>
                  <p className="text-xs text-gray-400 truncate">
                    {selectedFormat.ext.toUpperCase()}
                    {selectedFormat.size ? ` • ${formatSize(selectedFormat.size)}` : ''}
                  </p>
                </>
              ) : (
                <p className="text-gray-400 text-sm">Выберите качество...</p>
              )}
            </div>
          </div>
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.3 }}
            className="p-2 rounded-lg bg-white/5 flex-shrink-0 ml-3"
          >
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </motion.div>
        </motion.button>

        {/* Dropdown list - pushes content down */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div 
                className="glass-card rounded-xl rounded-t-none border-t-0 max-h-64 overflow-y-auto"
                style={{ background: 'rgb(12, 12, 20)' }}
              >
                {currentFormats.length === 0 ? (
                  <p className="p-4 text-gray-400 text-center text-sm">Нет доступных форматов</p>
                ) : (
                  <div className="p-2">
                    {currentFormats.map((format, index) => (
                      <motion.button
                        key={format.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.02 }}
                        onClick={() => handleSelect(format)}
                        className={`w-full p-3 flex items-center gap-3 text-left rounded-lg transition-all duration-200 mb-1 last:mb-0 ${
                          selectedFormat?.id === format.id 
                            ? 'bg-cyan-500/20' 
                            : 'hover:bg-white/5'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          selectedFormat?.id === format.id ? 'bg-cyan-500' : 'bg-white/10'
                        }`}>
                          {selectedFormat?.id === format.id ? (
                            <Check className="w-4 h-4 text-white" />
                          ) : format.type === 'audio' ? (
                            <Music className="w-4 h-4 text-gray-400" />
                          ) : (
                            <Video className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium truncate ${selectedFormat?.id === format.id ? 'text-cyan-400' : 'text-white'}`}>
                            {format.quality}
                          </p>
                          <p className="text-xs text-gray-500 truncate">{format.ext.toUpperCase()}</p>
                        </div>
                        {format.size && (
                          <span className="text-xs text-gray-500 bg-white/5 px-2 py-1 rounded flex-shrink-0">
                            {formatSize(format.size)}
                          </span>
                        )}
                      </motion.button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
