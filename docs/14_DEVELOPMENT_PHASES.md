# 14 - DEVELOPMENT PHASES
## Lộ trình 5 Phases — 7 tuần

---

## Phase 1 — Foundation (Tuần 1–2)

### Mục tiêu: Project chạy được, auth hoạt động

**Server setup:**
- [ ] Khởi tạo Node.js + Express + TypeScript
- [ ] Kết nối MongoDB localhost (config/db.ts)
- [ ] Kết nối Redis localhost (config/redis.ts)
- [ ] Cấu hình CORS, cookie-parser, dotenv
- [ ] Error handler middleware
- [ ] Health check endpoint GET /api/health

**Auth:**
- [ ] User model + Workspace model
- [ ] POST /auth/register (bcrypt + JWT)
- [ ] POST /auth/login
- [ ] POST /auth/logout (xóa Redis)
- [ ] POST /auth/refresh-token (HttpOnly cookie)
- [ ] GET /auth/me
- [ ] Auth middleware (verifyToken)

**Workspace + Channel CRUD:**
- [ ] Workspace model + routes (tạo, list, chi tiết)
- [ ] Channel model + routes (tạo, list theo workspace)
- [ ] Phân quyền: owner/admin/member

**Client setup:**
- [ ] Vite + React + TypeScript + Tailwind
- [ ] React Router (Login, Register, Workspace, Channel pages)
- [ ] Axios instance + interceptors (auto refresh token)
- [ ] Zustand: authStore, workspaceStore
- [ ] LoginPage, RegisterPage hoàn chỉnh

**Definition of Done Phase 1:**
✅ Đăng ký/đăng nhập thành công
✅ Tạo workspace, tạo channel
✅ Token tự refresh không cần login lại

---

## Phase 2 — Core Chat + Realtime (Tuần 3–4)

### Mục tiêu: Gửi/nhận tin nhắn realtime

**Server:**
- [ ] Message model
- [ ] GET /messages/channel/:id (cursor pagination)
- [ ] POST /messages/channel/:id
- [ ] PUT /messages/:id (edit)
- [ ] DELETE /messages/:id (soft delete)
- [ ] Socket.io server init + auth middleware
- [ ] message.handler: send_message, typing, mark_read
- [ ] presence.handler: join_workspace, join_channel, online/offline
- [ ] Redis presence: setOnline, setOffline, heartbeat

**Client:**
- [ ] connectSocket() singleton
- [ ] MessageList (infinite scroll - Phase cơ bản: scroll event)
- [ ] MessageItem component
- [ ] MessageInput (text + enter to send)
- [ ] Typing indicator (debounce 2s)
- [ ] Online status dot (xanh/xám)
- [ ] messageStore, channelStore (Zustand)
- [ ] Socket events: new_message, user_typing, user_status_changed

**Definition of Done Phase 2:**
✅ Mở 2 tab → gửi tin → tab kia nhận ngay
✅ "X đang nhập..." hiện khi gõ
✅ User avatar có chấm xanh khi online

---

## Phase 3 — Files + Notifications + Polish (Tuần 5)

### Mục tiêu: Upload file, seen message, notifications

**Server:**
- [ ] Cloudinary config
- [ ] Multer middleware (validate type, size)
- [ ] POST /files/upload
- [ ] Notification model + service
- [ ] mark_read socket handler
- [ ] GET /api/notifications

**Client:**
- [ ] useFileUpload hook + progress bar
- [ ] Kéo thả file vào chat area
- [ ] Image preview trong tin nhắn (click để zoom)
- [ ] File attachment (PDF, doc) với icon + download
- [ ] ReadReceipt: avatars nhỏ dưới tin nhắn cuối
- [ ] Unread badge trên channel list
- [ ] Emoji reactions (click → popup chọn emoji)
- [ ] NotificationBell + NotificationItem

**Definition of Done Phase 3:**
✅ Upload ảnh → hiện trong chat
✅ Seen avatars xuất hiện khi đọc
✅ Badge đỏ hiện số tin chưa đọc

---

## Phase 4 — Advanced Features (Tuần 6)

### Mục tiêu: Video call, encryption, infinite scroll chuẩn

**Video Call:**
- [ ] video.handler server (call_user, accept, reject, end, webrtc signals)
- [ ] useWebRTC hook client
- [ ] VideoCallModal (local + remote video, controls)
- [ ] Call button trong channel header
- [ ] IncomingCall notification popup

**Message Encryption:**
- [ ] generateChannelKey() khi tạo channel
- [ ] Encrypt khi lưu, decrypt khi đọc (server-side)
- [ ] GET /channels/:id/key endpoint
- [ ] Client cache key trong memory
- [ ] Toggle encryption khi tạo channel

**Infinite Scroll (chuẩn):**
- [ ] Cursor pagination server hoàn chỉnh
- [ ] IntersectionObserver thay scroll event
- [ ] Preserve scroll position khi prepend messages
- [ ] "Jump to latest" button

**Message Search:**
- [ ] GET /messages/search?q=&channelId=
- [ ] SearchBar component

**Definition of Done Phase 4:**
✅ Video call P2P hoạt động (2 tab localhost)
✅ Scroll lên → load thêm tin cũ mà không nhảy position
✅ Encryption toggle hoạt động

---

## Phase 5 — Polish + README (Tuần 7)

### Mục tiêu: Đẹp, mượt, sẵn sàng show CV

**UI/UX:**
- [ ] Dark mode + Light mode toggle
- [ ] Responsive (mobile friendly)
- [ ] Loading skeletons
- [ ] Empty states (chưa có tin nhắn, chưa có channel)
- [ ] Error boundaries
- [ ] Toast notifications (sonner hoặc react-hot-toast)

**Performance:**
- [ ] Memo hóa MessageItem (React.memo)
- [ ] Debounce search input
- [ ] Lazy load pages (React.lazy)

**Code Quality:**
- [ ] Xóa console.log
- [ ] Xử lý edge cases (network error, reconnect socket)
- [ ] TypeScript strict mode

**Documentation:**
- [ ] README.md đẹp với screenshots
- [ ] .env.example cho cả server và client
- [ ] GIF demo ngắn

**Definition of Done Phase 5:**
✅ App chạy mượt không có lỗi console
✅ README có hình ảnh demo rõ ràng
✅ Sẵn sàng demo cho nhà tuyển dụng
