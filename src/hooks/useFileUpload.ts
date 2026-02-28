import { useState, useCallback } from 'react';
import { fileService } from '../services/file.service';
import { MAX_FILE_SIZE, ALLOWED_FILE_TYPES } from '../utils/constants';
import type { Attachment } from '../types/message.types';

/**
 * Hook quản lý upload file
 * - Validate file type + size
 * - Upload với progress tracking
 */
export const useFileUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const validate = useCallback((file: File) => {
    if (file.size > MAX_FILE_SIZE) {
      throw new Error('File phải nhỏ hơn 10MB');
    }
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      throw new Error('Loại file không được hỗ trợ');
    }
  }, []);

  const upload = useCallback(async (file: File): Promise<Attachment> => {
    setError(null);
    validate(file);

    setUploading(true);
    setProgress(0);

    try {
      const attachment = await fileService.upload(file, setProgress);
      return attachment;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Upload thất bại';
      setError(msg);
      throw err;
    } finally {
      setUploading(false);
    }
  }, [validate]);

  const reset = useCallback(() => {
    setUploading(false);
    setProgress(0);
    setError(null);
  }, []);

  return { upload, uploading, progress, error, reset };
};
