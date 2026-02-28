import { create } from 'zustand';
import type { Channel, VoiceMember } from '../types/channel.types';

interface ChannelState {
  channels: Channel[];
  current: Channel | null;
  unreadCounts: Map<string, number>;
  typingUsers: Map<string, Map<string, string>>;
  // voiceChannelId → danh sách thành viên đang ở trong kênh thoại
  voiceMembers: Map<string, VoiceMember[]>;
  // Set userId đang nói (speaking indicator)
  speakingUsers: Set<string>;

  setChannels: (chs: Channel[]) => void;
  addChannel: (ch: Channel) => void;
  setCurrent: (ch: Channel | null) => void;
  updateChannel: (id: string, updates: Partial<Channel>) => void;
  removeChannel: (id: string) => void;

  incrementUnread: (channelId: string) => void;
  clearUnread: (channelId: string) => void;
  setTyping: (channelId: string, userId: string, username: string, isTyping: boolean) => void;
  getTypingUsers: (channelId: string) => string[];

  setVoiceMembers: (channelId: string, members: VoiceMember[]) => void;
  addVoiceMember: (channelId: string, member: VoiceMember) => void;
  removeVoiceMember: (channelId: string, userId: string) => void;
  getVoiceMembers: (channelId: string) => VoiceMember[];
  setSpeaking: (userId: string, isSpeaking: boolean) => void;
}

export const useChannelStore = create<ChannelState>((set, get) => ({
  channels: [],
  current: null,
  unreadCounts: new Map(),
  typingUsers: new Map(),
  voiceMembers: new Map(),
  speakingUsers: new Set(),

  setChannels: (channels) => set({ channels }),

  addChannel: (ch) =>
    set((state) => ({ channels: [...state.channels, ch] })),

  setCurrent: (current) => {
    set({ current });
    if (current) {
      // Clear unread khi vào channel
      get().clearUnread(current._id);
    }
  },

  updateChannel: (id, updates) =>
    set((state) => ({
      channels: state.channels.map((ch) =>
        ch._id === id ? { ...ch, ...updates } : ch
      ),
      current: state.current?._id === id
        ? { ...state.current, ...updates }
        : state.current,
    })),

  removeChannel: (id) =>
    set((state) => ({
      channels: state.channels.filter((ch) => ch._id !== id),
      current: state.current?._id === id ? null : state.current,
    })),

  incrementUnread: (channelId) => {
    // Không tăng nếu đang ở channel đó
    if (get().current?._id === channelId) return;
    const map = new Map(get().unreadCounts);
    map.set(channelId, (map.get(channelId) ?? 0) + 1);
    set({ unreadCounts: map });
  },

  clearUnread: (channelId) => {
    const map = new Map(get().unreadCounts);
    map.delete(channelId);
    set({ unreadCounts: map });
  },

  setTyping: (channelId, userId, username, isTyping) => {
    const map = new Map(get().typingUsers);
    const users = new Map(map.get(channelId) ?? []);
    if (isTyping) {
      users.set(userId, username);
    } else {
      users.delete(userId);
    }
    map.set(channelId, users);
    set({ typingUsers: map });
  },

  getTypingUsers: (channelId) => {
    const users = get().typingUsers.get(channelId);
    return users ? Array.from(users.values()) : [];
  },

  setVoiceMembers: (channelId, members) => {
    const map = new Map(get().voiceMembers);
    map.set(channelId, members);
    set({ voiceMembers: map });
  },

  addVoiceMember: (channelId, member) => {
    const map = new Map(get().voiceMembers);
    const existing = map.get(channelId) ?? [];
    // Tránh duplicate
    const filtered = existing.filter((m) => m.userId !== member.userId);
    map.set(channelId, [...filtered, member]);
    set({ voiceMembers: map });
  },

  removeVoiceMember: (channelId, userId) => {
    const map = new Map(get().voiceMembers);
    const existing = map.get(channelId) ?? [];
    map.set(channelId, existing.filter((m) => m.userId !== userId));
    set({ voiceMembers: map });
  },

  getVoiceMembers: (channelId) => {
    return get().voiceMembers.get(channelId) ?? [];
  },

  setSpeaking: (userId, isSpeaking) => {
    const current = get().speakingUsers;
    const has = current.has(userId);
    if (isSpeaking && !has) {
      const next = new Set(current);
      next.add(userId);
      set({ speakingUsers: next });
    } else if (!isSpeaking && has) {
      const next = new Set(current);
      next.delete(userId);
      set({ speakingUsers: next });
    }
  },
}));
