# 16. Voice Channel — Server Implementation

## Tổng quan

Client emit `join_voice_channel` / `leave_voice_channel` qua Socket.io.  
Server lưu danh sách members vào Redis và broadcast `voice_channel_updated` về toàn workspace.  
Client sidebar tự cập nhật realtime (không cần reload).

---

## 1. Channel Model — Thêm type `voice`

```js
// models/Channel.js
type: {
  type: String,
  enum: ['public', 'private', 'dm', 'voice'],
  default: 'public',
}
```

---

## 2. VoiceMember shape (dùng trong Redis + broadcast)

```ts
interface VoiceMember {
  userId: string;
  username: string;
  displayName?: string;
  avatar: string | null;
  joinedAt: string;       // ISO string — client dùng để tính timer
  isMuted: boolean;
  isDeafened: boolean;
}
```

---

## 3. Socket.io Events

### Cấu trúc Redis key

```
voice:<channelId>  →  JSON.stringify(VoiceMember[])
```

---

### Helper `removeFromVoice`

```js
async function removeFromVoice(channelId, userId) {
  const key = `voice:${channelId}`;
  const raw = await redis.get(key);
  if (!raw) return;

  const list = JSON.parse(raw);
  const updated = list.filter((m) => m.userId !== userId);

  if (updated.length === 0) {
    await redis.del(key);
  } else {
    await redis.set(key, JSON.stringify(updated));
  }

  const channel = await Channel.findById(channelId).select('workspace');
  if (channel) {
    io.to(`workspace:${channel.workspace}`).emit('voice_channel_updated', {
      channelId,
      members: updated,
    });
  }
}
```

---

### `join_voice_channel`

```js
socket.on('join_voice_channel', async ({ channelId }) => {
  try {
    const user = await User.findById(socket.userId)
      .select('username displayName avatar');
    if (!user) return;

    const member = {
      userId: socket.userId,
      username: user.username,
      displayName: user.displayName || user.username,
      avatar: user.avatar || null,
      joinedAt: new Date().toISOString(),
      isMuted: false,
      isDeafened: false,
    };

    const key = `voice:${channelId}`;
    const raw = await redis.get(key);
    const list = raw ? JSON.parse(raw) : [];

    // Tránh duplicate — remove nếu đã có
    const filtered = list.filter((m) => m.userId !== socket.userId);
    filtered.push(member);
    await redis.set(key, JSON.stringify(filtered));

    // Track để auto-remove khi disconnect
    socket.currentVoiceChannel = channelId;

    const channel = await Channel.findById(channelId).select('workspace');
    if (channel) {
      io.to(`workspace:${channel.workspace}`).emit('voice_channel_updated', {
        channelId,
        members: filtered,
      });
    }
  } catch (err) {
    console.error('join_voice_channel error:', err);
  }
});
```

---

### `leave_voice_channel`

```js
socket.on('leave_voice_channel', async ({ channelId }) => {
  await removeFromVoice(channelId, socket.userId);
  socket.currentVoiceChannel = null;
});
```

---

### Auto-remove khi disconnect

Thêm vào trong handler `disconnect` đã có:

```js
socket.on('disconnect', async () => {
  // ... code hiện tại (presence offline, v.v.) ...

  // Auto rời voice channel
  if (socket.currentVoiceChannel) {
    await removeFromVoice(socket.currentVoiceChannel, socket.userId);
    socket.currentVoiceChannel = null;
  }
});
```

---

## 4. REST API — Tạo voice channel

Endpoint `POST /api/channels` đã có sẵn.  
Chỉ cần đảm bảo `type: 'voice'` không bị validation reject.

```js
// Ví dụ: nếu có Joi / express-validator
type: Joi.string().valid('public', 'private', 'voice').required(),
```

---

## 5. Lấy danh sách voice members khi load workspace (optional)

Khi client vào workspace, server có thể gửi snapshot hiện tại:

```js
socket.on('join_workspace', async ({ workspaceId }) => {
  socket.join(`workspace:${workspaceId}`);

  // Gửi snapshot voice members cho tất cả voice channels của workspace
  const voiceChannels = await Channel.find({
    workspace: workspaceId,
    type: 'voice',
  }).select('_id');

  for (const ch of voiceChannels) {
    const key = `voice:${ch._id}`;
    const raw = await redis.get(key);
    if (raw) {
      const members = JSON.parse(raw);
      if (members.length > 0) {
        socket.emit('voice_channel_updated', {
          channelId: ch._id.toString(),
          members,
        });
      }
    }
  }
});
```

---

## 6. Summary — Socket events

| Direction | Event | Payload |
|-----------|-------|---------|
| Client → Server | `join_voice_channel` | `{ channelId }` |
| Client → Server | `leave_voice_channel` | `{ channelId }` |
| Client → Server | `voice_signal` | `{ to: userId, signal: SimplePeerSignal }` |
| Client → Server | `voice_mute` | `{ channelId, isMuted: boolean }` |
| Server → Client (broadcast workspace) | `voice_channel_updated` | `{ channelId, members: VoiceMember[] }` |
| Server → Client (broadcast workspace) | `voice_user_joined` | `{ userId, channelId }` |
| Server → Client (broadcast workspace) | `voice_user_left` | `{ userId, channelId }` |
| Server → Client (private relay) | `voice_signal` | `{ from: userId, signal: SimplePeerSignal }` |

---

## 7. WebRTC Signaling Relay

Client dùng **SimplePeer** (mesh P2P). Server chỉ relay tín hiệu, KHÔNG xử lý media.

```js
// Relay voice signal giữa 2 peers
socket.on('voice_signal', ({ to, signal }) => {
  const targetSocket = findSocketByUserId(to); // tìm socket theo userId
  if (targetSocket) {
    targetSocket.emit('voice_signal', {
      from: socket.userId,
      signal,
    });
  }
});

// voice_mute: cập nhật Redis và broadcast
socket.on('voice_mute', async ({ channelId, isMuted }) => {
  const key = `voice:${channelId}`;
  const raw = await redis.get(key);
  if (!raw) return;
  const list = JSON.parse(raw);
  const updated = list.map((m) =>
    m.userId === socket.userId ? { ...m, isMuted } : m
  );
  await redis.set(key, JSON.stringify(updated));
  const channel = await Channel.findById(channelId).select('workspace');
  if (channel) {
    io.to(`workspace:${channel.workspace}`).emit('voice_channel_updated', {
      channelId,
      members: updated,
    });
  }
});
```

### Cách tìm socket theo userId

Thêm vào `socket.userId` khi authenticate, và dùng:

```js
function findSocketByUserId(userId) {
  for (const [, s] of io.sockets.sockets) {
    if (s.userId === userId) return s;
  }
  return null;
}
```

---

## 8. Khi join: thông báo cho existing members

Quan trọng: Khi user A vào kênh, server cần gửi `voice_user_joined` cho các user đang ở trong kênh **trước** khi broadcast `voice_channel_updated`. Điều này để existing members tạo peer (non-initiator) trước khi nhận offer từ A.

```js
socket.on('join_voice_channel', async ({ channelId }) => {
  // ... (lưu Redis như trước)

  const channel = await Channel.findById(channelId).select('workspace');
  if (!channel) return;

  // 1. Thông báo cho existing members tạo peer non-initiator
  socket.to(`workspace:${channel.workspace}`).emit('voice_user_joined', {
    userId: socket.userId,
    channelId,
  });

  // 2. Broadcast danh sách mới (bao gồm cả user vừa join, kèm existing members)
  io.to(`workspace:${channel.workspace}`).emit('voice_channel_updated', {
    channelId,
    members: filtered,
  });
});
```
