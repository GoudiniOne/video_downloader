import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, X, Download, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import type { QueueItem } from '../types';

interface QueuePanelProps {
  items: QueueItem[];
  currentItem: QueueItem | null;
  onRemove: (id: string) => void;
}

export function QueuePanel({ items, currentItem, onRemove }: QueuePanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const activeItems = items.filter(
    (item) => item.status === 'queued' || item.status === 'downloading'
  );

  if (activeItems.length === 0) {
    return null;
  }

  const queuedItems = items.filter((item) => item.status === 'queued');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      className="fixed bottom-6 right-6 z-50 w-80"
    >
      <div className="glass-card-elevated rounded-2xl overflow-hidden">
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-white/5 transition-colors"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          <div className="flex items-center gap-2">
            <Download className="w-4 h-4 text-violet-400" />
            <span className="text-sm font-medium text-white">
              Очередь загрузок
            </span>
            <span className="text-xs text-gray-500">
              ({activeItems.length})
            </span>
          </div>
          <button className="p-1 hover:bg-white/10 rounded-lg transition-colors">
            {isCollapsed ? (
              <ChevronUp className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            )}
          </button>
        </div>

        {/* Content */}
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 space-y-3">
                {/* Current download */}
                {currentItem && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
                      <span className="text-xs text-gray-400 uppercase tracking-wider">
                        Скачивается
                      </span>
                    </div>
                    <QueueItemCard
                      item={currentItem}
                      onRemove={onRemove}
                      isCurrent
                    />
                  </div>
                )}

                {/* Queued items */}
                {queuedItems.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3 h-3 text-gray-500" />
                      <span className="text-xs text-gray-400 uppercase tracking-wider">
                        В очереди ({queuedItems.length})
                      </span>
                    </div>
                    <div className="space-y-2">
                      {queuedItems.map((item, index) => (
                        <QueueItemCard
                          key={item.id}
                          item={item}
                          onRemove={onRemove}
                          position={index + 1}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

interface QueueItemCardProps {
  item: QueueItem;
  onRemove: (id: string) => void;
  isCurrent?: boolean;
  position?: number;
}

function QueueItemCard({ item, onRemove, isCurrent, position }: QueueItemCardProps) {
  const truncatedTitle =
    item.title.length > 35 ? item.title.slice(0, 35) + '...' : item.title;

  return (
    <div className="relative bg-white/5 rounded-xl p-3 group">
      <div className="flex items-start gap-3">
        {/* Thumbnail */}
        <div className="relative w-12 h-9 rounded-lg overflow-hidden flex-shrink-0 bg-white/5">
          {item.thumbnail && (
            <img
              src={item.thumbnail}
              alt=""
              className="w-full h-full object-cover"
            />
          )}
          {position && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60">
              <span className="text-xs font-bold text-white">#{position}</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-white truncate" title={item.title}>
            {truncatedTitle}
          </p>
          <div className="flex items-center gap-2 mt-1">
            {item.status === 'downloading' && (
              <>
                <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-violet-500 to-indigo-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${item.progress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <span className="text-xs text-gray-400 tabular-nums">
                  {item.progress}%
                </span>
              </>
            )}
            {item.status === 'queued' && (
              <span className="text-xs text-gray-500">Ожидание...</span>
            )}
            {item.status === 'done' && (
              <span className="text-xs text-emerald-400 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Готово
              </span>
            )}
            {item.status === 'error' && (
              <span className="text-xs text-rose-400 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Ошибка
              </span>
            )}
          </div>
        </div>

        {/* Remove button */}
        {item.status === 'queued' && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove(item.id);
            }}
            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded-lg transition-all"
          >
            <X className="w-3.5 h-3.5 text-gray-400" />
          </button>
        )}
      </div>

      {/* Progress bar for current */}
      {isCurrent && item.progress === 0 && (
        <div className="mt-2">
          <div className="h-1 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full w-1/3 bg-gradient-to-r from-violet-500/50 to-indigo-500/50"
              animate={{ x: ['-100%', '400%'] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
            />
          </div>
          <span className="text-xs text-gray-500 mt-1 block">
            Обработка на сервере...
          </span>
        </div>
      )}
    </div>
  );
}
