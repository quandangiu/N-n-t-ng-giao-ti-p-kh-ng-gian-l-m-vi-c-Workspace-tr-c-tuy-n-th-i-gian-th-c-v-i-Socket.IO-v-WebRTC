# 🤖 AGENT MASTER PROMPT
## Chat Realtime App — Tạo toàn bộ project từ đầu

---

Bạn là Senior Full-Stack Engineer. Hãy build hoàn chỉnh ứng dụng Chat Realtime (Slack/Discord Clone) chạy **localhost** theo đúng thứ tự dưới đây.

**QUAN TRỌNG:**
- Chạy hoàn toàn trên localhost, KHÔNG dùng Docker
- MongoDB: mongodb://localhost:27017/chatapp
- Redis: redis://localhost:6379
- Server: http://localhost:3000
- Client: http://localhost:5173 (Vite)

---

## Tech Stack

- **Frontend:** React 18 + Vite + TypeScript + Tailwind CSS + Zustand
- **Backend:** Node.js + Express + TypeScript
- **DB:** MongoDB (local) + Mongoose
- **Realtime:** Socket.io 4.x
- **Cache:** Redis (local)
- **Auth:** JWT (15min) + Refresh Token (7d, HttpOnly cookie, Redis)
- **Files:** Cloudinary free tier + Multer
- **Video:** WebRTC + simple-peer
- **Encrypt:** crypto-js (AES-256)

---

## Thứ tự thực hiện

### Bước 1: Khởi tạo project structure
Tạo thư mục đúng như docs/02_FOLDER_STRUCTURE.md

### Bước 2: Server setup
```
server/package.json (dependencies đúng version)
server/tsconfig.json
server/.env (template — user điền)
server/src/config/db.ts      → mongoose.connect('mongodb://localhost:27017/chatapp')
server/src/config/redis.ts   → createClient({ url: 'redis://localhost:6379' })
server/src/config/cloudinary.ts
server/src/server.ts         → http server + express + socket.io init
```

### Bước 3: Models
```
User.ts, Workspace.ts, Channel.ts, Message.ts, Notification.ts
(đúng như docs/03_DATABASE_SCHEMA.md — có đầy đủ indexes)
```

### Bước 4: Auth
```
utils/jwt.ts       → generateAccessToken, generateRefreshToken, verifyToken
utils/bcrypt.ts
middleware/auth.middleware.ts
controllers/auth.controller.ts  → register, login, logout, refreshToken, getMe
routes/auth.routes.ts
```

### Bước 5: API Routes
```
Workspace routes (CRUD + members)
Channel routes (CRUD + DM)
Message routes (cursor pagination + reactions)
File routes (upload Cloudinary + delete)
User routes (search + update profile)
routes/index.ts (mount tất cả)
```

### Bước 6: Socket.io
```
socket/index.ts              → init với CORS localhost:5173, auth middleware
socket/handlers/presence.handler.ts  → join_workspace, join_channel, heartbeat, disconnect
socket/handlers/message.handler.ts   → send_message, typing_start, typing_stop, mark_read
socket/handlers/video.handler.ts     → call_user, accept/reject/end, webrtc signals
services/presence.service.ts         → setOnline, setOffline, getOnlineUsers (Redis)
```

### Bước 7: Client setup
```
client/package.json
client/tsconfig.json
client/.env
client/vite.config.ts
client/tailwind.config.ts
client/src/main.tsx + App.tsx + router.tsx
```

### Bước 8: Client stores (Zustand)
```
store/authStore.ts       → persist user (không persist token)
store/workspaceStore.ts  → onlineUsers Map
store/channelStore.ts    → typingUsers Map, unreadCounts
store/messageStore.ts    → messagesByChannel Map, optimistic updates
store/uiStore.ts
```

### Bước 9: Client services
```
services/api.ts               → Axios + auto refresh interceptor
services/auth.service.ts
services/workspace.service.ts
services/channel.service.ts
services/message.service.ts
services/file.service.ts
socket/socket.ts              → io() singleton + heartbeat
socket/messageEvents.ts       → kết nối socket events với stores
socket/presenceEvents.ts
```

### Bước 10: Client hooks
```
hooks/useMessages.ts    → cursor pagination, addMessage, loadMore
hooks/useTyping.ts      → debounce 2s
hooks/useFileUpload.ts  → validate + upload + progress
hooks/useWebRTC.ts      → SimplePeer + signaling
```

### Bước 11: UI Components
```
components/ui/          → Button, Input, Modal, Avatar
components/layout/      → AppLayout, Sidebar, Header
components/chat/        → MessageList (IntersectionObserver), MessageItem, MessageInput
components/channel/     → ChannelList (unread badge), CreateChannelModal
components/workspace/   → WorkspaceList, CreateWorkspaceModal
components/video/       → VideoCallModal, CallControls
```

### Bước 12: Pages
```
LoginPage.tsx, RegisterPage.tsx
WorkspacePage.tsx, ChannelPage.tsx
```

### Bước 13: Advanced features
```
utils/encryption.ts      → AES-256 (crypto-js)
Infinite scroll hoàn chỉnh với IntersectionObserver
"Jump to latest" button
Emoji reactions
Message encryption toggle
```

---

## Yêu cầu code chất lượng

1. **TypeScript strict** — không dùng `any` trừ khi thật sự cần
2. **Error handling** — try/catch đầy đủ, error middleware ở server
3. **Validation** — Zod ở server, validate trước khi process
4. **Không hardcode** — dùng .env cho tất cả config
5. **Comments** — comment những đoạn logic phức tạp
6. **Consistent response format** — mọi API response đều qua `apiResponse.ts`

---

## Chạy và test

Sau khi code xong, hướng dẫn user:
1. Cài Node 18+, MongoDB, Redis
2. `npm install` trong server/ và client/
3. Điền .env
4. Terminal 1: `cd server && npm run dev`
5. Terminal 2: `cd client && npm run dev`
6. Mở http://localhost:5173

**Bắt đầu từ Bước 1 ngay bây giờ!**
