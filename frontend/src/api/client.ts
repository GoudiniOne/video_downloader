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

export async function downloadFile(
  url: string,
  formatId: string,
  formatType?: string,
  onProgress?: (progress: number) => void,
  onStreamingStart?: () => void,
): Promise<void> {
  const downloadUrl = getDownloadUrl(url, formatId, formatType);

  const response = await fetch(downloadUrl);

  if (!response.ok) {
    const body = await response.json().catch(() => ({ error: 'Download failed' }));
    throw new ApiError(response.status, body.error || 'Download failed');
  }

  onStreamingStart?.();

  const contentDisposition = response.headers.get('Content-Disposition');
  let filename = 'video.mp4';
  
  if (contentDisposition) {
    const filenameStarMatch = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
    if (filenameStarMatch) {
      filename = decodeURIComponent(filenameStarMatch[1]);
    } else {
      const filenameMatch = contentDisposition.match(/filename="?([^";\n]+)"?/i);
      if (filenameMatch) {
        filename = filenameMatch[1];
      }
    }
  }

  const contentLength = response.headers.get('Content-Length');
  const total = contentLength ? parseInt(contentLength, 10) : 0;
  
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('Failed to read response body');
  }

  const chunks: ArrayBuffer[] = [];
  let received = 0;

  while (true) {
    const { done, value } = await reader.read();
    
    if (done) break;
    
    chunks.push(value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength));
    received += value.length;
    
    if (total > 0 && onProgress) {
      onProgress(Math.round((received / total) * 100));
    }
  }

  const blob = new Blob(chunks);
  
  const blobUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(blobUrl);
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
