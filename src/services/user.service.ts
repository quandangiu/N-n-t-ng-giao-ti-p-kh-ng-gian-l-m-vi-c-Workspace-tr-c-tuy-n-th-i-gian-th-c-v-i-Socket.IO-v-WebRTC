import api from './api';
import type { ApiResponse } from '../types/api.types';
import type { User, UserSearchResult } from '../types/user.types';

export const userService = {
  search: async (query: string, limit = 10) => {
    const res = await api.get<ApiResponse<UserSearchResult[]>>('/users/search', {
      params: { q: query, limit },
    });
    return res.data.data;
  },

  getById: async (id: string) => {
    const res = await api.get<ApiResponse<User>>(`/users/${id}`);
    return res.data.data;
  },

  updateProfile: async (id: string, data: FormData) => {
    const res = await api.put<ApiResponse<User>>(`/users/${id}`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data;
  },
};
