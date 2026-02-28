/**
 * Cloudinary URL transforms for optimized image delivery
 */
export const thumbnail = (url: string, w = 300, h = 300): string =>
  url.replace('/upload/', `/upload/w_${w},h_${h},c_fill,q_auto,f_auto/`);

export const preview = (url: string, w = 800): string =>
  url.replace('/upload/', `/upload/w_${w},q_auto,f_auto/`);

export const getFileIcon = (mimeType: string): string => {
  if (mimeType.startsWith('image/')) return '🖼️';
  if (mimeType === 'application/pdf') return '📄';
  if (mimeType.includes('word')) return '📝';
  if (mimeType === 'application/zip') return '📦';
  if (mimeType === 'text/plain') return '📃';
  return '📎';
};

export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};
