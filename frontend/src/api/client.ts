import type { VideoInfo, ConfigResponse, AnalyzeRequest, ErrorResponse } from '../types';

const API_BASE = '/api';

class ApiError extends Error {
  status: number;
  
  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error: ErrorResponse = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new ApiError(response.status, error.error);
  }
  return response.json();
}

export async function getConfig(): Promise<ConfigResponse> {
  const response = await fetch(`${API_BASE}/config`);
  return handleResponse<ConfigResponse>(response);
}

export async function analyzeUrl(url: string): Promise<VideoInfo> {
  const response = await fetch(`${API_BASE}/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ url } as AnalyzeRequest),
  });
  return handleResponse<VideoInfo>(response);
}

export function getDownloadUrl(url: string, formatId: string, formatType?: string): string {
  const params = new URLSearchParams({
    url: url,
    format_id: formatId,
  });
  if (formatType) {
    params.set('type', formatType);
  }
  return `${API_BASE}/download?${params.toString()}`;
}

export function getThumbnailUrl(originalUrl: string): string {
  const params = new URLSearchParams({
    url: originalUrl,
  });
  return `${API_BASE}/thumbnail?${params.toString()}`;
}

// Download file with progress tracking
export async function downloadFile(
  url: string,
  formatId: string,
  formatType?: string,
  onProgress?: (progress: number) => void,
  onStreamingStart?: () => void,
  expectedSize?: number,
): Promise<void> {
  const downloadUrl = getDownloadUrl(url, formatId, formatType);
  
  const response = await fetch(downloadUrl);
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Download failed' }));
    throw new ApiError(response.status, error.error || 'Download failed');
  }
  
  // Get filename from Content-Disposition header
  const contentDisposition = response.headers.get('Content-Disposition');
  let filename = 'video.mp4';
  if (contentDisposition) {
    // Try to get UTF-8 filename first (filename*=UTF-8'')
    const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
    if (utf8Match) {
      filename = decodeURIComponent(utf8Match[1]);
    } else {
      // Fallback to regular filename
      const match = contentDisposition.match(/filename="?([^";\n]+)"?/i);
      if (match) {
        filename = match[1];
      }
    }
  }
  
  // Get total size for progress calculation (from header or expected size)
  const contentLength = response.headers.get('Content-Length');
  const totalSize = contentLength ? parseInt(contentLength, 10) : (expectedSize || 0);
  
  // Signal that streaming has started
  onStreamingStart?.();
  
  // Read the response as a stream with progress
  const reader = response.body?.getReader();
  if (!reader) {
    throw new ApiError(500, 'Streaming not supported');
  }
  
  const chunks: BlobPart[] = [];
  let receivedSize = 0;
  
  while (true) {
    const { done, value } = await reader.read();
    
    if (done) break;
    
    chunks.push(value);
    receivedSize += value.length;
    
    // Report progress (use expected size if Content-Length not available)
    if (onProgress) {
      if (totalSize > 0) {
        const progress = Math.min(Math.round((receivedSize / totalSize) * 100), 99);
        onProgress(progress);
      }
    }
  }
  
  // Final progress update
  if (onProgress) {
    onProgress(100);
  }
  
  // Combine chunks into a single blob
  const blob = new Blob(chunks);
  
  // Create download link and trigger download
  const blobUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  
  // Cleanup
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);
  }, 100);
}

export async function checkHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/health`);
    return response.ok;
  } catch {
    return false;
  }
}

export { ApiError };
