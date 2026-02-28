# 01 - PROJECT OVERVIEW
## Chat Realtime App (Slack/Discord Clone)

---

## 📌 Mô tả Project

Ứng dụng chat realtime chuyên nghiệp chạy localhost, đủ tính năng để show CV:
- Chat realtime theo workspace → channel
- Gửi file, ảnh
- Seen message, typing indicator, online status
- Video call P2P (WebRTC)
- Message encryption (AES-256)

---

## 🛠 Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | React.js + Vite + TypeScript | React 18 |
| State | Zustand + React Query | Latest |
| Styling | Tailwind CSS + shadcn/ui | Latest |
| Backend | Node.js + Express.js | Node 18+ |
| Database | MongoDB (local) | 6.x |
| Realtime | Socket.io | 4.x |
| Cache | Redis (local) | 7.x |
| Auth | JWT + Refresh Token | - |
| File | Cloudinary (free tier) | - |
| Video | WebRTC + simple-peer | - |
| Encrypt | crypto-js | - |

---

## 🖥 Yêu cầu cài đặt localhost

```bash
# Cài Node.js
https://nodejs.org  (chọn LTS >= 18)

# Cài MongoDB Community (local)
https://www.mongodb.com/try/download/community
# Sau cài: mongod chạy mặc định ở mongodb://localhost:27017

# Cài Redis (Windows dùng WSL2 hoặc Memurai)
https://redis.io/docs/install/
# Sau cài: redis-server chạy mặc định ở localhost:6379

# Cài Cloudinary (free account)
https://cloudinary.com/users/register/free
```

---

## 🏗 Kiến trúc localhost

```
Browser (localhost:5173)
        │  HTTP REST / WebSocket
        ▼
Express Server (localhost:3000)
    │           │           │
    ▼           ▼           ▼
MongoDB      Redis       Cloudinary
:27017       :6379       (cloud CDN)
```

---

## ✅ Features

### MVP
- Đăng ký / Đăng nhập (JWT)
- Tạo Workspace + Channel
- Chat realtime (Socket.io)
- Typing indicator
- Online/Offline status
- Gửi ảnh/file (Cloudinary)
- Seen message
- Emoji reactions
- In-app notifications

### Advanced
- Video call (WebRTC)
- Message encryption (AES-256)
- Infinite scroll (cursor pagination)
- Message search

---

## 📅 Timeline (7 tuần, ~3-4h/ngày)

| Phase | Nội dung | Thời gian |
|-------|----------|-----------|
| 1 | Setup + Auth + CRUD | Tuần 1-2 |
| 2 | Core Chat + Realtime | Tuần 3-4 |
| 3 | Files + Notifications | Tuần 5 |
| 4 | Advanced features | Tuần 6 |
| 5 | Polish + README | Tuần 7 |
