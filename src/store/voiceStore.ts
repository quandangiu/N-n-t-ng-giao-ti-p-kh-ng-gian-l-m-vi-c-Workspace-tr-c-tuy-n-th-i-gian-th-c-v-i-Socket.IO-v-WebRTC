import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface VoiceSession {
  channelId: string;
  channelName: string;
  workspaceSlug: string;
  isMuted: boolean;
  isDeafened: boolean;
  connectedAt: string; // ISO
}

interface VoiceState {
  session: VoiceSession | null;
  setSession: (s: VoiceSession | null) => void;
  toggleMute: () => void;
  toggleDeafen: () => void;
}

export const useVoiceStore = create<VoiceState>()(
  persist(
    (set) => ({
      session: null,

      setSession: (session) => set({ session }),

      toggleMute: () =>
        set((state) =>
          state.session
            ? { session: { ...state.session, isMuted: !state.session.isMuted } }
            : state
        ),

      toggleDeafen: () =>
        set((state) =>
          state.session
            ? { session: { ...state.session, isDeafened: !state.session.isDeafened } }
            : state
        ),
    }),
    {
      name: 'voice-session', // localStorage key
      // Only persist minimal data needed to rejoin
      partialize: (state) => ({ session: state.session }),
    }
  )
);
