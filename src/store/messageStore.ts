import { create } from 'zustand';
import type { Message } from '../types/message.types';

interface MessageState {
  messagesByChannel: Map<string, Message[]>;
  cursors: Map<string, string | null>;
  hasMore: Map<string, boolean>;

  setMessages: (channelId: string, messages: Message[], cursor: string | null, hasMore: boolean) => void;
  prependMessages: (channelId: string, messages: Message[], cursor: string | null, hasMore: boolean) => void;
  addMessage: (channelId: string, msg: Message) => void;
  addOptimistic: (channelId: string, tempMsg: Message) => void;
  confirmOptimistic: (channelId: string, tempId: string, realMsg: Message) => void;
  removeOptimistic: (channelId: string, tempId: string) => void;
  updateMessage: (channelId: string, msgId: string, updates: Partial<Message>) => void;
  deleteMessage: (channelId: string, msgId: string) => void;
  updateReactions: (channelId: string, msgId: string, reactions: Record<string, string[]>) => void;
  clearChannel: (channelId: string) => void;
  getMessages: (channelId: string) => Message[];
  getCursor: (channelId: string) => string | null;
  getHasMore: (channelId: string) => boolean;
}

export const useMessageStore = create<MessageState>((set, get) => ({
  messagesByChannel: new Map(),
  cursors: new Map(),
  hasMore: new Map(),

  setMessages: (channelId, messages, cursor, hasMore) => {
    const map = new Map(get().messagesByChannel);
    map.set(channelId, messages);
    const cMap = new Map(get().cursors);
    cMap.set(channelId, cursor);
    const hMap = new Map(get().hasMore);
    hMap.set(channelId, hasMore);
    set({ messagesByChannel: map, cursors: cMap, hasMore: hMap });
  },

  prependMessages: (channelId, messages, cursor, hasMore) => {
    const map = new Map(get().messagesByChannel);
    const existing = map.get(channelId) ?? [];
    map.set(channelId, [...messages, ...existing]);
    const cMap = new Map(get().cursors);
    cMap.set(channelId, cursor);
    const hMap = new Map(get().hasMore);
    hMap.set(channelId, hasMore);
    set({ messagesByChannel: map, cursors: cMap, hasMore: hMap });
  },

  addMessage: (channelId, msg) => {
    const map = new Map(get().messagesByChannel);
    const msgs = [...(map.get(channelId) ?? []), msg];
    map.set(channelId, msgs);
    set({ messagesByChannel: map });
  },

  addOptimistic: (channelId, tempMsg) => {
    const map = new Map(get().messagesByChannel);
    const msgs = [...(map.get(channelId) ?? []), { ...tempMsg, isPending: true }];
    map.set(channelId, msgs);
    set({ messagesByChannel: map });
  },

  confirmOptimistic: (channelId, tempId, realMsg) => {
    const map = new Map(get().messagesByChannel);
    const msgs = (map.get(channelId) ?? []).map((m) =>
      m._id === tempId ? realMsg : m
    );
    map.set(channelId, msgs);
    set({ messagesByChannel: map });
  },

  removeOptimistic: (channelId, tempId) => {
    const map = new Map(get().messagesByChannel);
    const msgs = (map.get(channelId) ?? []).filter((m) => m._id !== tempId);
    map.set(channelId, msgs);
    set({ messagesByChannel: map });
  },

  updateMessage: (channelId, msgId, updates) => {
    const map = new Map(get().messagesByChannel);
    const msgs = (map.get(channelId) ?? []).map((m) =>
      m._id === msgId ? { ...m, ...updates } : m
    );
    map.set(channelId, msgs);
    set({ messagesByChannel: map });
  },

  deleteMessage: (channelId, msgId) => {
    const map = new Map(get().messagesByChannel);
    const msgs = (map.get(channelId) ?? []).map((m) =>
      m._id === msgId
        ? { ...m, isDeleted: true, content: 'Tin nhắn đã bị xóa' }
        : m
    );
    map.set(channelId, msgs);
    set({ messagesByChannel: map });
  },

  updateReactions: (channelId, msgId, reactions) => {
    const map = new Map(get().messagesByChannel);
    const msgs = (map.get(channelId) ?? []).map((m) =>
      m._id === msgId ? { ...m, reactions } : m
    );
    map.set(channelId, msgs);
    set({ messagesByChannel: map });
  },

  clearChannel: (channelId) => {
    const map = new Map(get().messagesByChannel);
    map.delete(channelId);
    const cMap = new Map(get().cursors);
    cMap.delete(channelId);
    const hMap = new Map(get().hasMore);
    hMap.delete(channelId);
    set({ messagesByChannel: map, cursors: cMap, hasMore: hMap });
  },

  getMessages: (channelId) => get().messagesByChannel.get(channelId) ?? [],
  getCursor: (channelId) => get().cursors.get(channelId) ?? null,
  getHasMore: (channelId) => get().hasMore.get(channelId) ?? true,
}));
