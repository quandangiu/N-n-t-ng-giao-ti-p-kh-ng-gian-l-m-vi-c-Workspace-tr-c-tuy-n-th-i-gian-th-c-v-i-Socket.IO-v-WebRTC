import api from './api';
import type { ApiResponse, AuthResponse, RefreshTokenResponse } from '../types/api.types';

export const authService = {
  register: async (data: { username: string; email: string; password: string }) => {
    const res = await api.post<ApiResponse<AuthResponse>>('/auth/register', data);
    return res.data.data;
  },

  login: async (data: { email: string; password: string }) => {
    const res = await api.post<ApiResponse<AuthResponse>>('/auth/login', data);
    return res.data.data;
  },

  logout: async () => {
    const res = await api.post<ApiResponse<null>>('/auth/logout');
    return res.data;
  },

  refreshToken: async () => {
    const res = await api.post<ApiResponse<RefreshTokenResponse>>('/auth/refresh-token');
    return res.data.data;
  },

  getMe: async () => {
    const res = await api.get<ApiResponse<AuthResponse['user']>>('/auth/me');
    return res.data.data;
  },
};
