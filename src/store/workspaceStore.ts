import { create } from 'zustand';
import type { Workspace } from '../types/workspace.types';

interface WorkspaceState {
  workspaces: Workspace[];
  current: Workspace | null;
  onlineUsers: Map<string, Set<string>>; // workspaceId → Set<userId>

  setWorkspaces: (ws: Workspace[]) => void;
  addWorkspace: (ws: Workspace) => void;
  setCurrent: (ws: Workspace | null) => void;
  updateWorkspace: (id: string, updates: Partial<Workspace>) => void;
  removeWorkspace: (id: string) => void;

  setOnlineUsers: (workspaceId: string, userIds: string[]) => void;
  updateUserStatus: (userId: string, status: string, lastSeen?: string) => void;
  isUserOnline: (workspaceId: string, userId: string) => boolean;
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  workspaces: [],
  current: null,
  onlineUsers: new Map(),

  setWorkspaces: (workspaces) => set({ workspaces }),

  addWorkspace: (ws) =>
    set((state) => ({ workspaces: [...state.workspaces, ws] })),

  setCurrent: (current) => set({ current }),

  updateWorkspace: (id, updates) =>
    set((state) => ({
      workspaces: state.workspaces.map((ws) =>
        ws._id === id ? { ...ws, ...updates } : ws
      ),
      current: state.current?._id === id
        ? { ...state.current, ...updates }
        : state.current,
    })),

  removeWorkspace: (id) =>
    set((state) => ({
      workspaces: state.workspaces.filter((ws) => ws._id !== id),
      current: state.current?._id === id ? null : state.current,
    })),

  setOnlineUsers: (workspaceId, userIds) => {
    const map = new Map(get().onlineUsers);
    map.set(workspaceId, new Set(userIds));
    set({ onlineUsers: map });
  },

  updateUserStatus: (userId, status) => {
    const map = new Map(get().onlineUsers);
    map.forEach((users, wsId) => {
      const updated = new Set(users);
      if (status === 'online') {
        updated.add(userId);
      } else {
        updated.delete(userId);
      }
      map.set(wsId, updated);
    });
    set({ onlineUsers: map });
  },

  isUserOnline: (workspaceId, userId) => {
    const users = get().onlineUsers.get(workspaceId);
    return users?.has(userId) ?? false;
  },
}));
