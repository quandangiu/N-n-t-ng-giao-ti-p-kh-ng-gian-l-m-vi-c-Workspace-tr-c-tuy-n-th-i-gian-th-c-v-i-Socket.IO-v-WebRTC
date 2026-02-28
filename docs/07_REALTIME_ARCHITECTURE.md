# 07 - REALTIME ARCHITECTURE
## Socket.io + Redis Presence (localhost)

---

## Kiến trúc localhost

```
Browser (localhost:5173)
    │  WebSocket / HTTP
    ▼
Node Server (localhost:3000)
    │           │
    ▼           ▼
MongoDB      Redis (localhost:6379)
(messages)   (presence: online/offline)
```

> Không cần Redis Adapter vì chỉ chạy 1 server localhost. Redis dùng để lưu trạng thái online.

---

## Presence Service

```typescript
// server/src/services/presence.service.ts
import { redis } from '../config/redis';
import { User } from '../models/User';

const ONLINE_TTL = 300; // 5 phút

export const setOnline = async (userId: string) => {
  await redis.set(`presence:${userId}`, 'online', { EX: ONLINE_TTL });
  await User.findByIdAndUpdate(userId, { status: 'online' });
};

export const setOffline = async (userId: string) => {
  await redis.del(`presence:${userId}`);
  await User.findByIdAndUpdate(userId, { status: 'offline', lastSeen: new Date() });
};

export const isOnline = async (userId: string): Promise<boolean> => {
  return !!(await redis.get(`presence:${userId}`));
};

export const getOnlineUsers = async (userIds: string[]): Promise<string[]> => {
  if (!userIds.length) return [];
  const results = await redis.mGet(userIds.map(id => `presence:${id}`));
  return userIds.filter((_, i) => results[i] !== null);
};

export const refreshPresence = async (userId: string) => {
  await redis.expire(`presence:${userId}`, ONLINE_TTL);
};
```

---

## Presence Handler

```typescript
// server/src/socket/handlers/presence.handler.ts
import { setOnline, setOffline, getOnlineUsers, refreshPresence } from '../../services/presence.service';

export const registerPresenceHandlers = (io, socket) => {
  const { userId } = socket;

  // --- Connect ---
  (async () => {
    await setOnline(userId);
    // Lấy workspaces của user để broadcast status
    const workspaces = await Workspace.find({ 'members.user': userId }, '_id');
    for (const ws of workspaces) {
      io.to(`workspace:${ws._id}`).emit('user_status_changed', { userId, status: 'online' });
    }
  })();

  // --- Join workspace room ---
  socket.on('join_workspace', async ({ workspaceId }) => {
    const isMember = await Workspace.exists({ _id: workspaceId, 'members.user': userId });
    if (!isMember) return;

    socket.join(`workspace:${workspaceId}`);

    // Trả về danh sách user đang online trong workspace
    const ws = await Workspace.findById(workspaceId, 'members');
    const memberIds = ws.members.map(m => m.user.toString());
    const onlineIds = await getOnlineUsers(memberIds);
    socket.emit('workspace_online_users', { workspaceId, onlineIds });
  });

  // --- Join/leave channel ---
  socket.on('join_channel', async ({ channelId }) => {
    const ok = await Channel.exists({ _id: channelId, members: userId });
    if (ok) socket.join(`channel:${channelId}`);
  });

  socket.on('leave_channel', ({ channelId }) => {
    socket.leave(`channel:${channelId}`);
  });

  // --- Heartbeat (client gửi mỗi 4 phút) ---
  socket.on('heartbeat', () => refreshPresence(userId));

  // --- Disconnect ---
  socket.on('disconnect', async () => {
    // Nếu user không còn tab nào kết nối
    const sockets = await io.in(`user:${userId}`).fetchSockets();
    if (sockets.length === 0) {
      await setOffline(userId);
      const workspaces = await Workspace.find({ 'members.user': userId }, '_id');
      for (const ws of workspaces) {
        io.to(`workspace:${ws._id}`).emit('user_status_changed', {
          userId, status: 'offline', lastSeen: new Date()
        });
      }
    }
  });
};
```

---

## Client — Socket Singleton

```typescript
// client/src/socket/socket.ts
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;
let heartbeatTimer: ReturnType<typeof setInterval>;

export const connectSocket = (accessToken: string): Socket => {
  if (socket?.connected) return socket;

  socket = io(import.meta.env.VITE_SOCKET_URL, {
    auth: { token: accessToken },
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 2000,
    transports: ['websocket']
  });

  socket.on('connect', () => {
    console.log('Socket connected:', socket!.id);
    // Heartbeat mỗi 4 phút
    heartbeatTimer = setInterval(() => socket?.emit('heartbeat'), 4 * 60 * 1000);
  });

  socket.on('disconnect', () => {
    clearInterval(heartbeatTimer);
  });

  return socket;
};

export const disconnectSocket = () => {
  clearInterval(heartbeatTimer);
  socket?.disconnect();
  socket = null;
};

export const getSocket = (): Socket | null => socket;
```

---

## Client — Presence Events

```typescript
// client/src/socket/presenceEvents.ts
import { getSocket } from './socket';
import { useWorkspaceStore } from '../store/workspaceStore';

export const registerPresenceEvents = () => {
  const socket = getSocket();
  if (!socket) return;

  socket.on('user_status_changed', ({ userId, status, lastSeen }) => {
    useWorkspaceStore.getState().updateUserStatus(userId, status, lastSeen);
  });

  socket.on('workspace_online_users', ({ workspaceId, onlineIds }) => {
    useWorkspaceStore.getState().setOnlineUsers(workspaceId, onlineIds);
  });
};
```

---

## Redis Keys

```
presence:{userId}            → 'online'     TTL: 5min
refresh:{userId}:{token}     → '1'          TTL: 7d
```
