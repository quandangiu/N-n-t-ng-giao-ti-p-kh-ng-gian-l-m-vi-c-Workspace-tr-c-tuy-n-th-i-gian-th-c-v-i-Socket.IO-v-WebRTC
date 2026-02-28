# 05 - SOCKET EVENTS
## Socket.io — localhost:3000

---

## Server Setup (localhost)

```typescript
// server/src/socket/index.ts
import { Server } from 'socket.io';
import { verifyToken } from '../utils/jwt';

export const initSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: 'http://localhost:5173', // Vite dev server
      credentials: true
    }
  });

  // Auth middleware
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) throw new Error('No token');
      const decoded = verifyToken(token);
      socket.userId = decoded.userId;
      next();
    } catch {
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    // Personal room cho notifications
    socket.join(`user:${socket.userId}`);
    registerPresenceHandlers(io, socket);
    registerMessageHandlers(io, socket);
    registerVideoHandlers(io, socket);
  });

  return io;
};
```

---

## 🏠 Room Strategy

```
user:{userId}            → Personal (notifications, DM)
workspace:{workspaceId}  → Workspace-wide events
channel:{channelId}      → Chat messages, typing
video:{roomId}           → WebRTC signaling
```

---

## 📤 Client → Server

```typescript
// Rooms
socket.emit('join_workspace', { workspaceId })
socket.emit('join_channel',   { channelId })
socket.emit('leave_channel',  { channelId })

// Chat
socket.emit('send_message', { channelId, content, type, replyTo, attachment })
socket.emit('typing_start',  { channelId })
socket.emit('typing_stop',   { channelId })
socket.emit('mark_read',     { channelId, messageId })
socket.emit('add_reaction',  { messageId, emoji })

// Presence
socket.emit('heartbeat')   // mỗi 4 phút
socket.emit('update_status', { status: 'away' })

// Video
socket.emit('call_user',          { targetUserId, roomId })
socket.emit('accept_call',        { callerId, roomId })
socket.emit('reject_call',        { callerId })
socket.emit('end_call',           { roomId })
socket.emit('webrtc_offer',       { targetUserId, offer })
socket.emit('webrtc_answer',      { targetUserId, answer })
socket.emit('webrtc_ice_candidate', { targetUserId, candidate })
```

---

## 📥 Server → Client

```typescript
// Chat
socket.on('new_message',      ({ message }) => {})
socket.on('message_updated',  ({ messageId, content }) => {})
socket.on('message_deleted',  ({ messageId, channelId }) => {})
socket.on('reaction_updated', ({ messageId, reactions }) => {})

// Typing
socket.on('user_typing',      ({ userId, username, channelId }) => {})
socket.on('user_stop_typing', ({ userId, channelId }) => {})

// Presence
socket.on('user_status_changed', ({ userId, status, lastSeen }) => {})
socket.on('messages_read',       ({ userId, channelId, lastReadMessageId }) => {})

// Notifications
socket.on('notification', ({ type, actor, payload }) => {})

// Video
socket.on('incoming_call',         ({ callerId, callerName, roomId }) => {})
socket.on('call_accepted',         ({ userId, roomId }) => {})
socket.on('call_rejected',         ({ userId }) => {})
socket.on('call_ended',            ({ userId }) => {})
socket.on('webrtc_offer',          ({ fromUserId, offer }) => {})
socket.on('webrtc_answer',         ({ fromUserId, answer }) => {})
socket.on('webrtc_ice_candidate',  ({ fromUserId, candidate }) => {})
```

---

## 🔄 Flow: Send Message

```
Client A              Server              Client B (same channel)
   │                     │                       │
   │ send_message ───────>│                       │
   │                     │ validate + save DB     │
   │ [ack] <─────────────│                       │
   │                     │ new_message ───────────>
   │                     │                       │ update UI
```

## 🔄 Flow: Typing Indicator

```
Client A         Server          Client B, C
   │                │                 │
   │ typing_start ─>│                 │
   │                │ user_typing ────>
   │                │                 │ show "A is typing..."
   │ [2s silence]   │                 │
   │ typing_stop ──>│                 │
   │                │ user_stop_typing>
   │                │                 │ hide indicator
```

## 🔄 Flow: Video Call

```
Caller A        Server         Callee B
   │               │               │
   │ call_user ───>│               │
   │               │ incoming_call >
   │               │               │ [show popup]
   │               │  accept_call <│
   │ call_accepted <│               │
   │               │               │
   │ webrtc_offer ─>│─── forward ──>│
   │               │  webrtc_answer <│
   │<── forward ───│               │
   │               │               │
   │<════ ICE candidates ══════════>│
   │<════════ P2P Connection ══════>│
```

---

## 📨 Message Handler Code

```typescript
// server/src/socket/handlers/message.handler.ts
export const registerMessageHandlers = (io, socket) => {
  socket.on('send_message', async (data, callback) => {
    try {
      const { channelId, content, type, replyTo, attachment } = data;

      const channel = await Channel.findOne({ _id: channelId, members: socket.userId });
      if (!channel) return callback?.({ error: 'Not a member' });

      const message = await Message.create({
        channel: channelId, sender: socket.userId,
        content, type, replyTo, attachment
      });

      await message.populate('sender', 'username avatar displayName');
      await Channel.findByIdAndUpdate(channelId, { lastMessage: message._id, lastActivity: new Date() });

      io.to(`channel:${channelId}`).emit('new_message', { message });
      callback?.({ success: true, message });
    } catch (err) {
      callback?.({ error: err.message });
    }
  });

  socket.on('typing_start', ({ channelId }) => {
    socket.to(`channel:${channelId}`).emit('user_typing', { userId: socket.userId, channelId });
  });

  socket.on('typing_stop', ({ channelId }) => {
    socket.to(`channel:${channelId}`).emit('user_stop_typing', { userId: socket.userId, channelId });
  });

  socket.on('mark_read', async ({ channelId, messageId }) => {
    await Message.updateMany(
      { channel: channelId, _id: { $lte: messageId }, 'readBy.user': { $ne: socket.userId } },
      { $push: { readBy: { user: socket.userId } } }
    );
    io.to(`channel:${channelId}`).emit('messages_read', {
      userId: socket.userId, channelId, lastReadMessageId: messageId
    });
  });
};
```
