# 19 — Hoàn thiện chức năng còn thiếu

> Danh sách chi tiết tất cả tính năng cần bổ sung để hoàn thiện Chat Realtime App.
> Mỗi task có tag `_client` hoặc `_server` (hoặc cả hai) để biết sửa ở đâu.

---

## PHASE 1 — RIGHT-CLICK CONTEXT MENUS (Ưu tiên cao)

### 1.1 Context Menu cho Workspace Nav `_client`

**File:** `src/components/workspace/WorkspaceNav.tsx`

Chuột phải vào workspace icon → hiện menu:

- [ ] **Đánh dấu đã đọc** — clear tất cả unread trong workspace
- [ ] **Tắt thông báo** — mute notifications cho workspace
- [ ] **Mời bạn bè** — copy invite link
- [ ] **Chỉnh sửa workspace** — mở WorkspaceSettingsModal
- [ ] **Rời workspace** — gọi `workspaceService.removeMember(wsId, myUserId)`
- [ ] **Xóa workspace** — chỉ hiện cho owner, gọi `workspaceService.delete(wsId)`

### 1.2 Context Menu cho Channel Item `_client`

**File:** `src/components/channel/ChannelItem.tsx` + `ChannelList.tsx`

Chuột phải vào channel → hiện menu:

- [ ] **Chỉnh sửa kênh** — mở EditChannelModal (đổi tên, mô tả)
- [ ] **Xóa kênh** — confirm dialog + `channelService.delete(chId)`
- [ ] **Tắt thông báo** — mute channel
- [ ] **Sao chép link kênh** — copy channel URL
- [ ] **Ghim kênh** — pin channel lên đầu danh sách

> Voice channel chuột phải thêm:

- [ ] **Giới hạn người** — set max members
- [ ] **Chỉnh bitrate** — set audio quality

### 1.3 Context Menu cho Voice Member `_client` `_server`

**File:** `src/components/channel/ChannelItem.tsx` (VoiceMemberRow)

Chuột phải vào user trong voice channel → hiện menu:

- [ ] **Xem hồ sơ** — mở UserProfileModal
- [ ] **Nhắn tin riêng** — tạo/mở DM channel
- [ ] **Tắt mic người này** (admin) — server mute, emit `voice_force_mute` `_server`
- [ ] **Kick khỏi voice** (admin) — server kick, emit `voice_kick_user` `_server`
- [ ] **Chỉnh âm lượng** — local volume slider per user `_client`
- [ ] **Chặn người dùng** — block user `_server`

**Server cần thêm:**
```
socket.on('voice_force_mute', { channelId, targetUserId, isMuted })  → _server
socket.on('voice_kick_user', { channelId, targetUserId })            → _server
```

### 1.4 Context Menu cho Message `_client`

**File:** `src/components/chat/MessageItem.tsx`

Chuột phải vào tin nhắn → hiện menu:

- [ ] **Trả lời** — set replyTo state → focus MessageInput
- [ ] **Chỉnh sửa** (tin nhắn của mình) — inline edit mode
- [ ] **Xóa** (tin nhắn của mình) — confirm + delete
- [ ] **Sao chép nội dung** — copy text to clipboard
- [ ] **Ghim tin nhắn** — pin message `_server`
- [ ] **React** — mở emoji picker
- [ ] **Chuyển tiếp** — forward message to another channel
- [ ] **Tạo thread** — mở thread view

### 1.5 Context Menu cho User Avatar (trong chat) `_client`

Chuột phải vào avatar/tên người gửi tin nhắn:

- [ ] **Xem hồ sơ** — mở UserProfileModal
- [ ] **Nhắn tin riêng** — tạo/mở DM
- [ ] **Mention** — chèn `@username` vào MessageInput
- [ ] **Chặn** — block user

---

## PHASE 2 — WORKSPACE AVATAR / LOGO (Fix trùng logo)

### 2.1 Workspace Model thêm field avatar `_server`

**File:** `server/src/models/Workspace.ts`

```typescript
// Thêm field:
avatar: { type: String, default: null },  // URL ảnh từ Cloudinary
```

### 2.2 Workspace avatar upload API `_server`

**File:** `server/src/controllers/workspace.controller.ts` + `server/src/routes/workspace.routes.ts`

- [ ] `PUT /api/workspaces/:id` — accept `avatar` file upload (multer + Cloudinary)
- [ ] Validation: chỉ owner/admin mới được đổi avatar
- [ ] Broadcast `workspace_updated` event qua socket

### 2.3 CreateWorkspaceModal thêm avatar upload `_client`

**File:** `src/components/workspace/CreateWorkspaceModal.tsx`

- [ ] Thêm input avatar upload (drag & drop hoặc click)
- [ ] Preview ảnh trước khi submit
- [ ] Upload lên Cloudinary cùng với tạo workspace
- [ ] Fallback về icon emoji nếu không upload

### 2.4 WorkspaceNav hiện avatar thật `_client`

**File:** `src/components/workspace/WorkspaceNav.tsx`

- [ ] Nếu `ws.avatar` có → hiện `<img>` thay vì initials/emoji
- [ ] Nếu không có avatar → giữ logic cũ (color hash + initials)
- [ ] Mỗi workspace phải có avatar riêng → không còn trùng logo

---

## PHASE 3 — WORKSPACE SETTINGS

### 3.1 WorkspaceSettingsModal `_client`

**File mới:** `src/components/workspace/WorkspaceSettingsModal.tsx`

- [ ] **Tab: Tổng quan** — đổi tên, mô tả, avatar, icon
- [ ] **Tab: Thành viên** — danh sách members + role badges (owner/admin/member)
- [ ] **Tab: Phân quyền** — promote/demote members (owner/admin only)
- [ ] **Tab: Mời** — invite link + regenerate invite code
- [ ] **Tab: Nguy hiểm** — xóa workspace (owner only), rời workspace

### 3.2 Sidebar Header Dropdown `_client`

**File:** `src/components/layout/Sidebar.tsx`

- [ ] Click vào workspace name + chevron → mở dropdown menu:
  - Mời bạn bè
  - Cài đặt workspace
  - Tạo kênh mới
  - Tạo danh mục
  - Rời workspace

### 3.3 Role Management API `_server`

**File:** `server/src/controllers/workspace.controller.ts`

- [ ] `PUT /api/workspaces/:id/members/:userId/role` — đổi role
- [ ] Validation: chỉ owner promote/demote, admin không tự promote
- [ ] Broadcast `member_role_updated` socket event

---

## PHASE 4 — CHANNEL SETTINGS

### 4.1 EditChannelModal `_client`

**File mới:** `src/components/channel/EditChannelModal.tsx`

- [ ] Đổi tên kênh
- [ ] Đổi mô tả
- [ ] Bật/tắt encryption
- [ ] Quản lý members (private channel)
- [ ] Xóa kênh (owner/admin)

### 4.2 Channel Settings API check `_server`

- [ ] `PUT /api/channels/:id` — đã có, verify hoạt động đúng
- [ ] `DELETE /api/channels/:id` — đã có, verify hoạt động đúng
- [ ] Broadcast `channel_updated` / `channel_deleted` events

---

## PHASE 5 — MESSAGE FEATURES

### 5.1 Message Edit (Inline) `_client`

**File:** `src/components/chat/MessageItem.tsx`

- [ ] Thêm "Chỉnh sửa" vào hover toolbar + context menu
- [ ] Click edit → nội dung chuyển thành `<textarea>` editable
- [ ] Enter = save, Escape = cancel
- [ ] Gọi `messageService.update(msgId, { content })` → server broadcast `message_updated`
- [ ] Hiện label "(đã chỉnh sửa)" bên cạnh timestamp

### 5.2 Message Reply Flow `_client`

**File:** `src/components/chat/MessageInput.tsx` + `MessageItem.tsx`

- [ ] Nút Reply có `onClick` → set `replyToMessage` state (store hoặc context)
- [ ] `MessageInput` hiện preview reply (tên + nội dung trích dẫn) + nút X để hủy
- [ ] Send message kèm `replyTo: messageId`

### 5.3 Pin Message `_client` `_server`

**Server:**
- [ ] Thêm `isPinned: Boolean` + `pinnedAt: Date` vào Message model `_server`
- [ ] `PUT /api/messages/:id/pin` — toggle pin `_server`
- [ ] Broadcast `message_pinned` / `message_unpinned` events `_server`

**Client:**
- [ ] Nút "Ghim" trong context menu `_client`
- [ ] Header Pin icon → mở Pinned Messages panel `_client`
- [ ] Panel hiện danh sách tin nhắn đã ghim `_client`

### 5.4 Message Search UI `_client`

**File:** `src/components/layout/Header.tsx` + **File mới:** `SearchPanel.tsx`

- [ ] Search input trong Header → onChange debounce 300ms
- [ ] Gọi `messageService.search(query, channelId)`
- [ ] Hiện kết quả trong dropdown/panel
- [ ] Click vào kết quả → scroll tới tin nhắn đó

### 5.5 Date Separators `_client`

**File:** `src/components/chat/MessageList.tsx`

- [ ] Giữa các tin nhắn khác ngày → hiện divider "Hôm nay", "Hôm qua", "15/02/2026"
- [ ] Logic: so sánh `createdAt` giữa message[i] và message[i-1]

### 5.6 Forward Message `_client` `_server`

- [ ] Chọn kênh đích → gửi tin nhắn mới với nội dung quoted
- [ ] Hoặc copy message object sang kênh khác

---

## PHASE 6 — USER PROFILE

### 6.1 UserProfileModal `_client`

**File mới:** `src/components/user/UserProfileModal.tsx`

- [ ] Hiện khi click vào avatar trong chat hoặc member list
- [ ] Thông tin: avatar, displayName, username, bio, status online/offline
- [ ] Nút: Nhắn tin, Gọi video, Block

### 6.2 Edit Profile Modal `_client`

**File mới:** `src/components/user/EditProfileModal.tsx`

- [ ] Mở từ Settings icon ở sidebar bottom
- [ ] Đổi displayName, bio
- [ ] Upload avatar mới (Cloudinary)
- [ ] Gọi `userService.updateProfile(data)`

### 6.3 Sidebar User Panel fix `_client`

**File:** `src/components/layout/Sidebar.tsx`

- [ ] Settings icon → onClick mở EditProfileModal
- [ ] Mic icon → onClick toggle mute (kết nối VoiceContext nếu đang voice)
- [ ] Headphones icon → onClick toggle deafen

---

## PHASE 7 — NOTIFICATIONS

### 7.1 Notification Routes + Controller `_server`

**File mới:** `server/src/routes/notification.routes.ts` + `server/src/controllers/notification.controller.ts`

- [ ] `GET /api/notifications` — danh sách notifications (paginated)
- [ ] `PUT /api/notifications/:id/read` — đánh dấu đã đọc
- [ ] `PUT /api/notifications/read-all` — đánh dấu tất cả đã đọc
- [ ] `DELETE /api/notifications/:id` — xóa notification

### 7.2 Tạo notification tự động `_server`

**File:** `server/src/socket/handlers/message.handler.ts`

- [ ] Khi nhận tin nhắn mới → tạo notification cho tất cả members (trừ sender)
- [ ] Khi bị @mention → tạo notification type `mention`
- [ ] Khi nhận reaction → tạo notification type `reaction`
- [ ] Khi được invite → tạo notification type `invite`
- [ ] Emit `new_notification` realtime event

### 7.3 Notification Panel UI `_client`

**File mới:** `src/components/notification/NotificationPanel.tsx`

- [ ] Header Bell icon → onClick toggle NotificationPanel
- [ ] Badge đỏ hiện số notification chưa đọc
- [ ] Danh sách: avatar + tên + nội dung + thời gian
- [ ] Click vào notification → navigate tới message/channel/workspace
- [ ] Nút "Đánh dấu tất cả đã đọc"

### 7.4 Notification Store + Service `_client`

- [ ] `src/store/notificationStore.ts` — Zustand store
- [ ] `src/services/notification.service.ts` — API calls
- [ ] `src/socket/notificationEvents.ts` — socket handler cho `new_notification`

---

## PHASE 8 — MEMBERS PANEL

### 8.1 MemberListPanel `_client`

**File mới:** `src/components/member/MemberListPanel.tsx`

- [ ] Header Users icon → onClick toggle MemberListPanel (sidebar phải)
- [ ] Hiện danh sách members của workspace hiện tại
- [ ] Phân nhóm: Online / Offline
- [ ] Mỗi member: Avatar + displayName + role badge + online dot
- [ ] Click vào member → mở UserProfileModal
- [ ] Chuột phải → context menu (DM, kick, promote)

### 8.2 Online Status cho user khác `_client`

**File:** `src/components/chat/MessageItem.tsx` + `MemberListPanel`

- [ ] Lấy online status từ `workspaceStore.onlineUsers`
- [ ] Hiện online dot xanh bên avatar trong chat + member list + DM list

---

## PHASE 9 — @MENTIONS

### 9.1 Mention Autocomplete UI `_client`

**File:** `src/components/chat/MessageInput.tsx`

- [ ] Gõ `@` → hiện dropdown danh sách members
- [ ] Filter theo ký tự sau `@`
- [ ] Click/Enter → chèn `@username` styled (highlight xanh)
- [ ] Gửi message kèm `mentions: [userId1, userId2]`

### 9.2 Mention Parsing + Notification `_server`

**File:** `server/src/socket/handlers/message.handler.ts`

- [ ] Parse `@username` trong content → tìm userId
- [ ] Tạo Notification type `mention` cho mỗi user được mention
- [ ] Emit `new_notification` cho user được mention

### 9.3 Mention Styling trong MessageItem `_client`

- [ ] Parse `@username` trong rendered content → highlight xanh + bold
- [ ] Click vào mention → mở UserProfileModal

---

## PHASE 10 — DM (Direct Message) CREATION

### 10.1 New DM Button + User Picker `_client`

**File mới:** `src/components/channel/CreateDMModal.tsx`

- [ ] Nút "+" hoặc "New Message" ở DM section trong ChannelList
- [ ] Modal: search user → select → tạo DM channel
- [ ] Gọi `channelService.createOrGetDM({ workspaceId, targetUserId })`
- [ ] Navigate tới DM channel vừa tạo

---

## PHASE 11 — EMOJI PICKER TRONG MESSAGE INPUT

### 11.1 Wire EmojiPicker `_client`

**File:** `src/components/chat/MessageInput.tsx`

- [ ] Smile button → onClick toggle `<EmojiPicker>` popover
- [ ] Chọn emoji → chèn vào vị trí cursor trong textarea
- [ ] Đóng picker sau khi chọn

---

## PHASE 12 — IMAGE LIGHTBOX

### 12.1 Lightbox Component `_client`

**File mới:** `src/components/ui/Lightbox.tsx`

- [ ] Render khi `uiStore.lightboxUrl` khác null
- [ ] Full-screen overlay + ảnh lớn
- [ ] Click outside hoặc X → đóng (`setLightboxUrl(null)`)
- [ ] Keyboard: Escape đóng
- [ ] Zoom in/out (optional)
- [ ] Mount trong AppLayout

---

## PHASE 13 — VOICE CHANNEL NÂNG CAO

### 13.1 Voice Kick / Force Mute `_server`

**File:** `server/src/socket/handlers/voice.handler.ts`

```typescript
// Kick user ra khỏi voice
socket.on('voice_kick_user', async ({ channelId, targetUserId }) => {
  // Verify sender is admin/owner
  // removeFromVoice(io, channelId, targetUserId)
  // Emit 'voice_kicked' to target user
});

// Server-side force mute
socket.on('voice_force_mute', async ({ channelId, targetUserId, isMuted }) => {
  // Verify sender is admin/owner
  // Update Redis + broadcast voice_channel_updated
  // Emit 'voice_force_muted' to target → client disables mic track
});
```

### 13.2 Voice Invite `_client`

**File:** `src/components/channel/ChannelItem.tsx`

- [ ] Nút "Mời vào Kênh thoại" → onClick mở UserPicker
- [ ] Gửi invite notification tới user được chọn
- [ ] User nhận → click accept → join voice channel

### 13.3 Voice Volume Per User `_client`

- [ ] Chuột phải vào user → slider âm lượng
- [ ] Thay đổi `audioEl.volume` trong `peersRef` cho user đó

---

## PHASE 14 — THREAD REPLIES (Optional — Advanced)

### 14.1 Thread View `_client`

- [ ] Click "Tạo thread" → mở sidebar panel bên phải
- [ ] Hiện message gốc + replies bên dưới
- [ ] MessageInput riêng cho thread
- [ ] Badge "X replies" bên dưới message gốc

### 14.2 Thread API `_server`

- [ ] Messages có `threadId` hoặc `parentId` field
- [ ] `GET /api/messages/:id/thread` — lấy replies
- [ ] Realtime broadcast `thread_reply`

---

## TÓM TẮT ƯU TIÊN

| # | Phase | Mức độ | Thời gian ước tính |
|---|-------|--------|-------------------|
| 1 | Right-click context menus | 🔴 Cao | 2-3 ngày |
| 2 | Workspace avatar/logo | 🔴 Cao | 1 ngày |
| 3 | Workspace settings | 🔴 Cao | 1-2 ngày |
| 4 | Channel settings | 🟠 TB | 1 ngày |
| 5 | Message edit/reply/pin | 🔴 Cao | 2 ngày |
| 6 | User profile | 🟠 TB | 1 ngày |
| 7 | Notifications | 🟠 TB | 2 ngày |
| 8 | Members panel | 🟠 TB | 1 ngày |
| 9 | @Mentions | 🟡 Thấp | 1-2 ngày |
| 10 | DM creation UI | 🟠 TB | 0.5 ngày |
| 11 | Emoji picker in input | 🟡 Thấp | 0.5 ngày |
| 12 | Image lightbox | 🟡 Thấp | 0.5 ngày |
| 13 | Voice nâng cao | 🟡 Thấp | 1-2 ngày |
| 14 | Thread replies | 🟢 Optional | 2-3 ngày |

**Tổng ước tính: 15-20 ngày**

---

## CÁCH DÙNG FILE NÀY LÀM PROMPT

Copy từng Phase vào prompt cho AI agent. Ví dụ:

```
Hãy implement Phase 1.3 — Context Menu cho Voice Member.

Tạo ContextMenu component trong src/components/ui/ContextMenu.tsx (reusable).
Thêm onContextMenu vào VoiceMemberRow trong ChannelItem.tsx.
Menu items: Xem hồ sơ, Nhắn tin riêng, Kick khỏi voice (admin), Tắt mic (admin), Chỉnh âm lượng.

Server cần thêm:
- voice_kick_user event handler trong voice.handler.ts
- voice_force_mute event handler trong voice.handler.ts
- Verify role trước khi cho phép kick/mute
```

Mỗi Phase nên làm xong rồi test trước khi sang Phase tiếp.
