import { create } from 'zustand';

interface UIState {
  sidebarOpen: boolean;
  createWorkspaceModalOpen: boolean;
  createChannelModalOpen: boolean;
  videoCallModalOpen: boolean;
  lightboxUrl: string | null;
  theme: 'dark' | 'light';

  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setCreateWorkspaceModal: (open: boolean) => void;
  setCreateChannelModal: (open: boolean) => void;
  setVideoCallModal: (open: boolean) => void;
  setLightboxUrl: (url: string | null) => void;
  toggleTheme: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  createWorkspaceModalOpen: false,
  createChannelModalOpen: false,
  videoCallModalOpen: false,
  lightboxUrl: null,
  theme: 'dark',

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setCreateWorkspaceModal: (open) => set({ createWorkspaceModalOpen: open }),
  setCreateChannelModal: (open) => set({ createChannelModalOpen: open }),
  setVideoCallModal: (open) => set({ videoCallModalOpen: open }),
  setLightboxUrl: (url) => set({ lightboxUrl: url }),
  toggleTheme: () =>
    set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),
}));
