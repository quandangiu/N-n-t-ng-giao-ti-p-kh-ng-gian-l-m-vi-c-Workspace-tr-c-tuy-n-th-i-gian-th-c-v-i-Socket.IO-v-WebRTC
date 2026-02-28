# 15 - CV SHOWCASE POINTS
## Cách nói về project này trong phỏng vấn

---

## 🎯 Một câu pitch (30 giây)

> "Tôi tự build một ứng dụng chat realtime tương tự Slack — có workspace, channel, gửi file, seen message, typing indicator, video call P2P bằng WebRTC, và mã hóa tin nhắn AES-256. Backend dùng Node.js + Socket.io + MongoDB + Redis, frontend dùng React + Zustand. Tôi tập trung vào kiến trúc realtime scalable và các kỹ thuật như cursor pagination, optimistic UI update, và presence system dùng Redis."

---

## 💪 Điểm kỹ thuật nổi bật (nói được trong phỏng vấn)

### 1. Realtime Architecture
**Nói:** "Tôi dùng Socket.io với room strategy có 4 loại room: user personal room cho notifications, workspace room để broadcast status, channel room cho messages, và video room cho WebRTC signaling. Khi user disconnect, tôi check xem họ còn tab nào không rồi mới set offline — xử lý trường hợp multi-tab."

### 2. JWT + Refresh Token
**Nói:** "Access token expire sau 15 phút, refresh token 7 ngày lưu trong Redis và HttpOnly cookie. Tôi implement silent refresh — khi 401, axios interceptor tự gọi refresh endpoint, queue các request đang pending, rồi retry tất cả sau khi có token mới. User không cần login lại."

### 3. Cursor Pagination thay vì Offset
**Nói:** "Tôi không dùng skip/limit vì offset pagination có vấn đề khi data thay đổi — nếu có tin mới insert trong khi user đang scroll, page 2 sẽ bị lệch. Tôi dùng cursor dựa trên _id: lấy messages có _id nhỏ hơn cursor. MongoDB ObjectId có embedded timestamp nên sorted tự nhiên."

### 4. Optimistic UI Update
**Nói:** "Khi gửi tin nhắn, tôi render message ngay lập tức với ID tạm thời (temp_xxx) và trạng thái pending, không cần chờ server. Khi server confirm qua socket, tôi thay thế message tạm bằng message thật. Nếu thất bại, tôi xóa message tạm và hiện lỗi."

### 5. Presence System
**Nói:** "Tôi lưu trạng thái online trong Redis với TTL 5 phút thay vì MongoDB để tránh write heavy. Client gửi heartbeat mỗi 4 phút để refresh TTL. Nếu user đột ngột mất kết nối, Redis tự xóa key sau 5 phút và user tự động offline."

### 6. WebRTC P2P
**Nói:** "Video call không qua server — chỉ dùng Socket.io để trao đổi SDP offer/answer và ICE candidates (signaling). Sau đó media stream đi thẳng P2P giữa 2 browser qua STUN server của Google. Server không xử lý media nên không tốn bandwidth."

---

## 🔧 Câu hỏi hay gặp + Gợi ý trả lời

**Q: Tại sao dùng Redis mà không dùng MongoDB cho presence?**
A: "MongoDB write mỗi khi user online/offline + heartbeat rất tốn I/O. Redis in-memory nhanh hơn 10-100x cho read/write, và TTL built-in xử lý automatic expiry không cần cron job."

**Q: Làm sao handle khi Socket.io mất kết nối?**
A: "Client có reconnection: true với reconnectionAttempts và exponential backoff. Khi reconnect, client re-emit join_workspace và join_channel để vào lại các rooms. Heartbeat timer restart sau connect event."

**Q: Encryption của bạn có phải E2E không?**
A: "Hiện tại là symmetric AES-256 key per channel, server giữ key nên chưa phải true E2E. Để làm E2E thật sự, cần dùng RSA key pair — client generate key pair, private key lưu local, channel key được encrypt bằng public key của mỗi member. Server chỉ thấy ciphertext. Tôi đã hiểu cách làm nhưng chọn approach đơn giản hơn để tập trung vào các tính năng khác."

**Q: Làm sao scale app này khi có nhiều user?**
A: "Thêm Redis Adapter cho Socket.io để sync events giữa nhiều server instance. MongoDB có thể dùng replica set + sharding. Cho presence có thể dùng Redis Cluster. Hiện tại chạy 1 server vì đây là localhost demo."

**Q: Infinite scroll implement thế nào?**
A: "Dùng IntersectionObserver theo dõi sentinel element ở đầu list. Khi nó vào viewport, load thêm 50 tin cũ. Trước khi prepend, tôi lưu scrollHeight hiện tại, sau khi render xong tôi set scrollTop = newScrollHeight - prevScrollHeight để giữ nguyên vị trí đang xem."

---

## 📊 Metrics nên đạt được

- Load initial messages: < 200ms
- Send message → nhận ở client khác: < 100ms
- File upload 1MB: < 3s
- Reconnect sau mất mạng: < 5s

---

## 📝 GitHub README Template

```markdown
# 💬 ChatApp — Slack/Discord Clone

> Ứng dụng chat realtime full-stack với React, Node.js, Socket.io

![demo gif]

## ✨ Tính năng
- 🔐 Auth với JWT + Refresh Token
- 💬 Chat realtime (Socket.io)
- 📁 Upload file/ảnh (Cloudinary)
- 👁 Seen message + Typing indicator
- 🟢 Online/Offline status (Redis)
- 📹 Video call P2P (WebRTC)
- 🔒 Message encryption (AES-256)
- ♾️ Infinite scroll (cursor pagination)

## 🛠 Tech Stack
Frontend: React 18 · TypeScript · Zustand · Tailwind CSS
Backend: Node.js · Express · Socket.io · MongoDB · Redis

## 🚀 Chạy localhost
\`\`\`bash
# Yêu cầu: Node 18+, MongoDB, Redis
cd server && cp .env.example .env  # điền thông tin
cd client && cp .env.example .env
npm install  # trong cả 2 thư mục
npm run dev  # terminal riêng cho mỗi thư mục
\`\`\`
```
