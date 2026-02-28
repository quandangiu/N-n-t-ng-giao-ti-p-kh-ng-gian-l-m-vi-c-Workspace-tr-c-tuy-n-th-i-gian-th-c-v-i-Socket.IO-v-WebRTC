import api from './api';
import type { ApiResponse } from '../types/api.types';
import type { Message, MessagesResponse } from '../types/message.types';

export const messageService = {
  getByChannel: async (
    channelId: string,
    cursor?: string | null,
    limit = 50
  ) => {
    const params: Record<string, string | number> = { limit };
    if (cursor) params.cursor = cursor;

    const res = await api.get<ApiResponse<MessagesResponse>>(
      `/messages/channel/${channelId}`,
      { params }
    );
    return res.data.data;
  },

  send: async (
    channelId: string,
    data: { content: string; type?: string; replyTo?: string | null; attachment?: unknown }
  ) => {
    const res = await api.post<ApiResponse<Message>>(
      `/messages/channel/${channelId}`,
      data
    );
    return res.data.data;
  },

  update: async (id: string, content: string) => {
    const res = await api.put<ApiResponse<Message>>(`/messages/${id}`, {
      content,
    });
    return res.data.data;
  },

  delete: async (id: string) => {
    const res = await api.delete<ApiResponse<null>>(`/messages/${id}`);
    return res.data;
  },

  addReaction: async (
    id: string,
    emoji: string,
    action: 'add' | 'remove'
  ) => {
    const res = await api.post<ApiResponse<{ reactions: Record<string, string[]> }>>(
      `/messages/${id}/reactions`,
      { emoji, action }
    );
    return res.data.data;
  },

  search: async (channelId: string, query: string) => {
    const res = await api.get<ApiResponse<Message[]>>('/messages/search', {
      params: { channelId, q: query },
    });
    return res.data.data;
  },
};
