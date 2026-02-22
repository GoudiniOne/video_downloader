import { useState, useCallback, useRef, useEffect } from 'react';
import { downloadFile } from '../api/client';
import type { QueueItem } from '../types';

const MAX_QUEUE_SIZE = 3;
const AUTO_REMOVE_DELAY = 5000;

export function useDownloadQueue() {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [currentItem, setCurrentItem] = useState<QueueItem | null>(null);
  const isProcessingRef = useRef(false);

  const processNext = useCallback(async () => {
    if (isProcessingRef.current) return;

    const nextItem = items.find((item) => item.status === 'queued');
    if (!nextItem) {
      setCurrentItem(null);
      return;
    }

    isProcessingRef.current = true;

    setItems((prev) =>
      prev.map((item) =>
        item.id === nextItem.id ? { ...item, status: 'downloading' as const, progress: 0 } : item
      )
    );
    setCurrentItem({ ...nextItem, status: 'downloading', progress: 0 });

    try {
      await downloadFile(
        nextItem.url,
        nextItem.formatId,
        nextItem.formatType,
        (progress) => {
          setItems((prev) =>
            prev.map((item) =>
              item.id === nextItem.id ? { ...item, progress } : item
            )
          );
          setCurrentItem((curr) => (curr?.id === nextItem.id ? { ...curr, progress } : curr));
        },
        () => {
          // Streaming started - item is already marked as downloading
        }
      );

      setItems((prev) =>
        prev.map((item) =>
          item.id === nextItem.id ? { ...item, status: 'done' as const, progress: 100 } : item
        )
      );
      setCurrentItem(null);

      // Auto-remove completed item after delay
      setTimeout(() => {
        setItems((prev) => prev.filter((item) => item.id !== nextItem.id));
      }, AUTO_REMOVE_DELAY);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка скачивания';
      setItems((prev) =>
        prev.map((item) =>
          item.id === nextItem.id ? { ...item, status: 'error' as const } : item
        )
      );
      setCurrentItem(null);
      console.error('Queue download error:', errorMessage);
    } finally {
      isProcessingRef.current = false;
    }
  }, [items]);

  // Process queue when items change
  useEffect(() => {
    if (!isProcessingRef.current && items.some((item) => item.status === 'queued')) {
      processNext();
    }
  }, [items, processNext]);

  const addToQueue = useCallback(
    (item: Omit<QueueItem, 'id' | 'status' | 'progress'>): boolean => {
      const queuedCount = items.filter(
        (i) => i.status === 'queued' || i.status === 'downloading'
      ).length;

      if (queuedCount >= MAX_QUEUE_SIZE) {
        return false;
      }

      const newItem: QueueItem = {
        ...item,
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        status: 'queued',
        progress: 0,
      };

      setItems((prev) => [...prev, newItem]);
      return true;
    },
    [items]
  );

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    if (currentItem?.id === id) {
      setCurrentItem(null);
    }
  }, [currentItem]);

  const isDownloading = items.some((item) => item.status === 'downloading');

  const queuedItems = items.filter((item) => item.status === 'queued');
  const activeItems = items.filter(
    (item) => item.status === 'queued' || item.status === 'downloading'
  );

  return {
    items,
    currentItem,
    queuedItems,
    activeItems,
    isDownloading,
    addToQueue,
    removeItem,
    canAddMore: activeItems.length < MAX_QUEUE_SIZE,
  };
}
