import api from './api';
import type { ApiResponse } from '../types/api.types';
import type { Workspace, CreateWorkspacePayload } from '../types/workspace.types';

export const workspaceService = {
  getAll: async () => {
    const res = await api.get<ApiResponse<Workspace[]>>('/workspaces');
    return res.data.data;
  },

  getById: async (id: string) => {
    const res = await api.get<ApiResponse<Workspace>>(`/workspaces/${id}`);
    return res.data.data;
  },

  create: async (data: CreateWorkspacePayload) => {
    const res = await api.post<ApiResponse<Workspace>>('/workspaces', data);
    return res.data.data;
  },

  update: async (id: string, data: Partial<CreateWorkspacePayload>) => {
    const res = await api.put<ApiResponse<Workspace>>(`/workspaces/${id}`, data);
    return res.data.data;
  },

  delete: async (id: string) => {
    const res = await api.delete<ApiResponse<null>>(`/workspaces/${id}`);
    return res.data;
  },

  addMember: async (workspaceId: string, userId: string) => {
    const res = await api.post<ApiResponse<Workspace>>(
      `/workspaces/${workspaceId}/members`,
      { userId }
    );
    return res.data.data;
  },

  removeMember: async (workspaceId: string, userId: string) => {
    const res = await api.delete<ApiResponse<null>>(
      `/workspaces/${workspaceId}/members/${userId}`
    );
    return res.data;
  },

  joinByInvite: async (inviteCode: string) => {
    const res = await api.get<ApiResponse<Workspace>>(
      `/workspaces/join/${inviteCode}`
    );
    return res.data.data;
  },
};
