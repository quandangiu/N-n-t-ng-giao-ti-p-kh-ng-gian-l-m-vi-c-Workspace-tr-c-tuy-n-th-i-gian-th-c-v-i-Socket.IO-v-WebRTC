# 12 - FRONTEND STATE MANAGEMENT
## Zustand Stores

---

## authStore

```typescript
// client/src/store/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  setAccessToken: (token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      setAuth: (user, accessToken) => set({ user, accessToken, isAuthenticated: true }),
      setAccessToken: (accessToken) => set({ accessToken }),
      logout: () => set({ user: null, accessToken: null, isAuthenticated: false })
    }),
    { name: 'auth', partialize: (s) => ({ user: s.user }) } // chỉ persist user, không persist token
  )
);
```

---

## workspaceStore

```typescript
// client/src/store/workspaceStore.ts
import { create } from 'zustand';

interface WorkspaceState {
  workspaces: Workspace[];
  current: Workspace | null;
  onlineUsers: Map<string, Set<string>>; // workspaceId → Set<userId>
  setWorkspaces: (ws: Workspace[]) => void;
  setCurrent: (ws: Workspace) => void;
  updateUserStatus: (userId: string, status: string) => void;
  setOnlineUsers: (workspaceId: string, userIds: string[]) => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  workspaces: [],
  current: null,
  onlineUsers: new Map(),
  setWorkspaces: (workspaces) => set({ workspaces }),
  setCurrent: (current) => set({ current }),
  setOnlineUsers: (workspaceId, userIds) => {
    const map = new Map(get().onlineUsers);
    map.set(workspaceId, new Set(userIds));
    set({ onlineUsers: map });
  },
  updateUserStatus: (userId, status) => {
    // Cập nhật trong tất cả workspaces
    const map = new Map(get().onlineUsers);
    map.forEach((users, wsId) => {
      const updated = new Set(users);
      status === 'online' ? updated.add(userId) : updated.delete(userId);
      map.set(wsId, updated);
    });
    set({ onlineUsers: map });
  }
}));
```

---

## channelStore

```typescript
// client/src/store/channelStore.ts
import { create } from 'zustand';

interface ChannelState {
  channels: Channel[];
  current: Channel | null;
  unreadCounts: Map<string, number>; // channelId → count
  typingUsers: Map<string, Set<string>>; // channelId → Set<userId>
  setChannels: (chs: Channel[]) => void;
  setCurrent: (ch: Channel) => void;
  incrementUnread: (channelId: string) => void;
  clearUnread: (channelId: string) => void;
  setTyping: (channelId: string, userId: string, isTyping: boolean) => void;
}

export const useChannelStore = create<ChannelState>((set, get) => ({
  channels: [],
  current: null,
  unreadCounts: new Map(),
  typingUsers: new Map(),
  setChannels: (channels) => set({ channels }),
  setCurrent: (current) => {
    set({ current });
    get().clearUnread(current._id);
  },
  incrementUnread: (channelId) => {
    const map = new Map(get().unreadCounts);
    map.set(channelId, (map.get(channelId) ?? 0) + 1);
    set({ unreadCounts: map });
  },
  clearUnread: (channelId) => {
    const map = new Map(get().unreadCounts);
    map.delete(channelId);
    set({ unreadCounts: map });
  },
  setTyping: (channelId, userId, isTyping) => {
    const map = new Map(get().typingUsers);
    const users = new Set(map.get(channelId) ?? []);
    isTyping ? users.add(userId) : users.delete(userId);
    map.set(channelId, users);
    set({ typingUsers: map });
  }
}));
```

---

## messageStore (Optimistic Updates)

```typescript
// client/src/store/messageStore.ts
import { create } from 'zustand';

interface MessageState {
  // Map: channelId → Message[]
  messagesByChannel: Map<string, Message[]>;
  addMessage: (channelId: string, msg: Message) => void;
  addOptimistic: (channelId: string, tempMsg: Message) => void;  // trước khi server confirm
  confirmOptimistic: (channelId: string, tempId: string, realMsg: Message) => void;
  updateMessage: (channelId: string, msgId: string, updates: Partial<Message>) => void;
  deleteMessage: (channelId: string, msgId: string) => void;
}

export const useMessageStore = create<MessageState>((set, get) => ({
  messagesByChannel: new Map(),

  addMessage: (channelId, msg) => {
    const map = new Map(get().messagesByChannel);
    const msgs = [...(map.get(channelId) ?? []), msg];
    map.set(channelId, msgs);
    set({ messagesByChannel: map });
  },

  // Thêm message tạm với id bắt đầu bằng 'temp_'
  addOptimistic: (channelId, tempMsg) => {
    const map = new Map(get().messagesByChannel);
    const msgs = [...(map.get(channelId) ?? []), { ...tempMsg, isPending: true }];
    map.set(channelId, msgs);
    set({ messagesByChannel: map });
  },

  // Thay thế message tạm bằng message thật từ server
  confirmOptimistic: (channelId, tempId, realMsg) => {
    const map = new Map(get().messagesByChannel);
    const msgs = (map.get(channelId) ?? []).map(m => m._id === tempId ? realMsg : m);
    map.set(channelId, msgs);
    set({ messagesByChannel: map });
  },

  updateMessage: (channelId, msgId, updates) => {
    const map = new Map(get().messagesByChannel);
    const msgs = (map.get(channelId) ?? []).map(m => m._id === msgId ? { ...m, ...updates } : m);
    map.set(channelId, msgs);
    set({ messagesByChannel: map });
  },

  deleteMessage: (channelId, msgId) => {
    const map = new Map(get().messagesByChannel);
    const msgs = (map.get(channelId) ?? []).map(m =>
      m._id === msgId ? { ...m, isDeleted: true, content: 'Tin nhắn đã bị xóa' } : m
    );
    map.set(channelId, msgs);
    set({ messagesByChannel: map });
  }
}));
```

---

## uiStore

```typescript
// client/src/store/uiStore.ts
import { create } from 'zustand';

export const useUIStore = create((set) => ({
  sidebarOpen:  true,
  theme:        'dark' as 'dark' | 'light',
  activeModal:  null as string | null,
  toggleSidebar: () => set(s => ({ sidebarOpen: !s.sidebarOpen })),
  setTheme:      (theme: string) => set({ theme }),
  openModal:     (name: string) => set({ activeModal: name }),
  closeModal:    () => set({ activeModal: null })
}));
```

---

## Socket → Store Integration

```typescript
// client/src/socket/messageEvents.ts
// Gọi một lần khi app mount
export const registerMessageEvents = () => {
  const socket = getSocket();
  if (!socket) return;

  socket.on('new_message', ({ message }) => {
    const { current } = useChannelStore.getState();
    useMessageStore.getState().addMessage(message.channel, message);
    // Nếu không phải channel đang xem → tăng unread
    if (current?._id !== message.channel)
      useChannelStore.getState().incrementUnread(message.channel);
  });

  socket.on('message_updated', ({ messageId, content, channelId }) => {
    useMessageStore.getState().updateMessage(channelId, messageId, { content, isEdited: true });
  });

  socket.on('message_deleted', ({ messageId, channelId }) => {
    useMessageStore.getState().deleteMessage(channelId, messageId);
  });

  socket.on('user_typing', ({ userId, channelId }) => {
    useChannelStore.getState().setTyping(channelId, userId, true);
  });

  socket.on('user_stop_typing', ({ userId, channelId }) => {
    useChannelStore.getState().setTyping(channelId, userId, false);
  });
};
```
