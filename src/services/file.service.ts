import api from './api';
import type { ApiResponse } from '../types/api.types';
import type { Attachment } from '../types/message.types';

export const fileService = {
  upload: async (
    file: File,
    onProgress?: (percent: number) => void
  ): Promise<Attachment> => {
    const form = new FormData();
    form.append('file', file);

    const res = await api.post<ApiResponse<Attachment>>('/files/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (e.total && onProgress) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      },
    });
    return res.data.data;
  },

  delete: async (publicId: string) => {
    const res = await api.delete<ApiResponse<null>>(
      `/files/${encodeURIComponent(publicId)}`
    );
    return res.data;
  },
};
