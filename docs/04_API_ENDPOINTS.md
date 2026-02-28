# 04 - API ENDPOINTS
## REST API — Base URL: http://localhost:3000/api

---

## 🔐 /api/auth

| Method | Path | Auth | Mô tả |
|--------|------|------|-------|
| POST | /auth/register | ❌ | Đăng ký |
| POST | /auth/login | ❌ | Đăng nhập |
| POST | /auth/logout | ✅ | Đăng xuất |
| POST | /auth/refresh-token | ❌ (cookie) | Lấy access token mới |
| GET | /auth/me | ✅ | Lấy thông tin user hiện tại |

### POST /auth/register
```json
// Body
{ "username": "johndoe", "email": "john@example.com", "password": "Pass123!" }

// 201 Response
{
  "success": true,
  "data": {
    "user": { "_id": "...", "username": "johndoe", "email": "..." },
    "accessToken": "eyJ..."
  }
}
// refreshToken → set HttpOnly cookie tự động
```

### POST /auth/login
```json
// Body
{ "email": "john@example.com", "password": "Pass123!" }

// 200 Response
{ "success": true, "data": { "user": {...}, "accessToken": "eyJ..." } }
```

### POST /auth/refresh-token
```json
// Tự lấy refreshToken từ cookie
// 200 Response
{ "success": true, "data": { "accessToken": "eyJ..." } }
```

---

## 👤 /api/users

| Method | Path | Auth | Mô tả |
|--------|------|------|-------|
| GET | /users/search?q=john | ✅ | Tìm user |
| GET | /users/:id | ✅ | Lấy profile |
| PUT | /users/:id | ✅ | Cập nhật profile |

### GET /users/search?q=john&limit=10
```json
// 200 Response
{
  "success": true,
  "data": [{ "_id": "...", "username": "john", "avatar": "...", "status": "online" }]
}
```

### PUT /users/:id (multipart/form-data)
```
Fields: displayName, bio
File:   avatar (ảnh)
```

---

## 🏢 /api/workspaces

| Method | Path | Auth | Mô tả |
|--------|------|------|-------|
| POST | /workspaces | ✅ | Tạo workspace |
| GET | /workspaces | ✅ | Danh sách workspace của mình |
| GET | /workspaces/:id | ✅ Member | Chi tiết workspace |
| PUT | /workspaces/:id | ✅ Admin | Sửa workspace |
| DELETE | /workspaces/:id | ✅ Owner | Xóa workspace |
| POST | /workspaces/:id/members | ✅ Admin | Thêm member |
| DELETE | /workspaces/:id/members/:userId | ✅ Admin | Xóa member |
| GET | /workspaces/join/:inviteCode | ✅ | Join qua invite link |

### POST /workspaces
```json
// Body
{ "name": "My Company", "description": "..." }

// 201 Response
{ "success": true, "data": { "_id": "...", "name": "My Company", "slug": "my-company", ... } }
```

---

## 📢 /api/channels

| Method | Path | Auth | Mô tả |
|--------|------|------|-------|
| POST | /channels | ✅ | Tạo channel |
| GET | /channels/workspace/:workspaceId | ✅ Member | Channels của workspace |
| GET | /channels/:id | ✅ Member | Chi tiết channel |
| PUT | /channels/:id | ✅ Creator | Sửa channel |
| DELETE | /channels/:id | ✅ Creator | Xóa channel |
| POST | /channels/dm | ✅ | Tạo/lấy DM channel |

### POST /channels
```json
// Body
{
  "workspaceId": "...",
  "name": "general",
  "type": "public",
  "description": "General discussion"
}
```

### GET /channels/workspace/:workspaceId
```json
// 200 Response — kèm unreadCount
{
  "success": true,
  "data": [{ "_id": "...", "name": "general", "type": "public", "unreadCount": 3 }]
}
```

### POST /channels/dm
```json
// Body
{ "workspaceId": "...", "targetUserId": "..." }
// Nếu đã có DM → trả về existing channel
```

---

## 💬 /api/messages

| Method | Path | Auth | Mô tả |
|--------|------|------|-------|
| GET | /messages/channel/:channelId | ✅ Member | Load messages (cursor) |
| POST | /messages/channel/:channelId | ✅ Member | Gửi message |
| PUT | /messages/:id | ✅ Author | Sửa message |
| DELETE | /messages/:id | ✅ Author/Admin | Xóa message |
| POST | /messages/:id/reactions | ✅ Member | Thêm/xóa reaction |

### GET /messages/channel/:channelId
```
Query params:
  cursor: string   (messageId — bỏ qua lần đầu)
  limit:  number   (default 50, max 100)

// 200 Response
{
  "success": true,
  "data": {
    "messages": [...],     // newest → oldest
    "nextCursor": "msgId", // null nếu hết
    "hasMore": true
  }
}
```

### POST /messages/channel/:channelId
```json
// Body
{ "content": "Hello!", "type": "text", "replyTo": null }
// Nếu có file: body kèm attachment { url, name, size, mimeType, publicId }
```

### POST /messages/:id/reactions
```json
// Body
{ "emoji": "👍", "action": "add" }  // action: "add" | "remove"
```

---

## 📁 /api/files

| Method | Path | Auth | Mô tả |
|--------|------|------|-------|
| POST | /files/upload | ✅ | Upload file/ảnh |
| DELETE | /files/:publicId | ✅ Uploader | Xóa file |

### POST /files/upload (multipart/form-data)
```
Field: file     (max 10MB)
       channelId

// 201 Response
{
  "success": true,
  "data": { "url": "https://res.cloudinary.com/...", "name": "img.png", "size": 204800, "mimeType": "image/png", "publicId": "chat/images/abc" }
}
```

---

## ❌ Error Format

```json
{ "success": false, "error": { "code": "UNAUTHORIZED", "message": "Token expired" } }
```

| Status | Code | Khi nào |
|--------|------|---------|
| 400 | VALIDATION_ERROR | Input sai |
| 401 | UNAUTHORIZED | Token hết hạn |
| 403 | FORBIDDEN | Không đủ quyền |
| 404 | NOT_FOUND | Không tìm thấy |
| 409 | CONFLICT | Email/username trùng |
| 500 | INTERNAL_ERROR | Lỗi server |
