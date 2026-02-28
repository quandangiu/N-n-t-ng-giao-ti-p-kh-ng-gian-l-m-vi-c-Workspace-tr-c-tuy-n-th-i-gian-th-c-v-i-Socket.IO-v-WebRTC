# 18 — Voice Channel Debug Session

> Phiên sửa lỗi toàn diện: icon user không sáng khi vào voice + hai người không nghe nhau.

---

## 1. Triệu chứng ban đầu

| # | Triệu chứng | Mô tả |
|---|---|---|
| 1 | Icon user không sáng | Click vào voice channel → không hiện avatar trong danh sách thành viên |
| 2 | Không nghe nhau | Hai user cùng voice channel → không có âm thanh |
| 3 | F5 mất trạng thái | Refresh trang → rời khỏi voice, không tự rejoin |

---

## 2. Root Causes đã tìm ra

### 2.1 — Stale Session chặn Join (Critical ⚠️)

`voiceStore` dùng Zustand `persist` → lưu session vào `localStorage`.  
Sau F5 hoặc đóng tab, `sessionRef.current` vẫn giữ session cũ `{channelId, channelName, ...}`.

Khi user click cùng voice channel:

```ts
// ❌ CŨ — nghĩ rằng đã ở trong voice → return sớm
if (sessionRef.current?.channelId === channelId) return;
```

Hậu quả: không lấy mic, không emit `join_voice_channel`, không `addVoiceMember` → **icon không hiện, không có WebRTC**.

### 2.2 — Auto-rejoin cũng fail

`onConnect` gọi `joinVoice(staleSession)` nhưng vì session ref chưa xoá → joinVoice return sớm, không rejoin thực sự.

### 2.3 — `voice_user_joined` thiếu filter channelId

Handler cũ không kiểm tra `channelId` → có thể tạo peer connection nhầm giữa voice channels khác nhau.

### 2.4 — Socket null khi emit

`joinVoiceChannel()` / `leaveVoiceChannel()` dùng `socket?.emit(...)` — khi socket null, fail im lặng không có log.

### 2.5 — Audio play error bị nuốt

```ts
audioEl.play().catch(() => {}); // ❌ nuốt lỗi, không biết autoplay bị block
```

---

## 3. Các fix đã áp dụng

### 3.1 — Fix stale session

**File:** `src/hooks/useVoiceChannel.ts`

```ts
// ✅ MỚI — chỉ skip nếu CÓ stream live (không phải session cũ)
if (sessionRef.current?.channelId === channelId && localStreamRef.current) return;
```

### 3.2 — Fix auto-rejoin

**File:** `src/hooks/useVoiceChannel.ts`

```ts
const onConnect = async () => {
  const s = sessionRef.current;
  if (!s) return;
  // ✅ Xoá session cũ trước khi rejoin
  sessionRef.current = null;
  setSession(null);
  setTimeout(async () => {
    await joinVoice(s.channelId, s.channelName, s.workspaceSlug);
  }, 1500);
};
```

### 3.3 — Filter channelId cho `voice_user_joined`

**File:** `src/hooks/useVoiceChannel.ts`

```ts
// ✅ MỚI — check channelId match
const onUserJoined = ({ userId, channelId }: { userId: string; channelId: string }) => {
  const s = sessionRef.current;
  if (!stream || !s || s.channelId !== channelId || userId === me) return;
  createPeer(userId, false, stream);
};
```

### 3.4 — Socket null guard + logging

**File:** `src/socket/socket.ts`

```ts
export const joinVoiceChannel = (channelId: string): void => {
  if (!socket) {
    console.warn('[Voice] joinVoiceChannel called but socket is null!');
    return;
  }
  console.log('[Voice] socket.emit join_voice_channel', channelId, 'connected=', socket.connected);
  socket.emit('join_voice_channel', { channelId });
};
```

### 3.5 — Audio play error logging

**File:** `src/hooks/useVoiceChannel.ts`

```ts
audioEl.play().catch((err) => console.warn('[Voice] Audio play blocked:', err.message));
```

---

## 4. Logging đã thêm (Debug)

Tất cả log đều có prefix `[Voice]` để dễ filter trong DevTools Console.

### Client — `useVoiceChannel.ts`

| Vị trí | Log message |
|---|---|
| `setup()` | `socket not ready yet` / `socket found, connected = ...` |
| `joinVoice()` | `emitting join_voice_channel` + stream track count |
| `joinVoice()` | `addVoiceMember optimistic, currentUser: ...` |
| `createPeer()` | `target=..., initiator=..., streamTracks=...` |
| `peer.on('signal')` | `Sending signal to ..., type=offer/answer/candidate` |
| `peer.on('stream')` | `Got remote stream from ..., tracks=...` |
| `peer.on('connect')` | `✅ Peer CONNECTED with ...` |
| `peer.on('error')` | `Peer error with ...: message` |
| `onVoiceSignal` | `Received signal from ..., type=..., hasPeer=...` |
| `onUserJoined` | `creating non-initiator peer for ... in channel ...` |
| `onVoiceChannelUpdated` | `members: count [names]` |
| `onConnect` | `Socket (re)connected — auto-rejoin ...` |

### Client — `socket.ts`

| Vị trí | Log message |
|---|---|
| `joinVoiceChannel()` | `socket.emit join_voice_channel ... connected=...` |
| `joinVoiceChannel()` | `⚠️ socket is null!` (nếu null) |
| `leaveVoiceChannel()` | `⚠️ socket is null!` (nếu null) |

### Server — `voice.handler.ts`

| Vị trí | Log message |
|---|---|
| `join_voice_channel` | `user=..., channel=...` |
| Broadcast | `Broadcasting voice_channel_updated to workspace:..., members: [names]` |
| `voice_signal` | `from=... to=..., targetFound=..., signalType=...` |
| `removeFromVoice` | `user=..., channel=...` |

---

## 5. Server fixes (sessions trước)

| Fix | File | Mô tả |
|---|---|---|
| `removeFromVoice` emit `voice_user_left` | `voice.handler.ts` | Client nhận event để destroy peer |
| `findSocketByUserId` multi-tab | `voice.handler.ts` | Ưu tiên socket có `currentVoiceChannel` |
| Auto-join workspace room | `voice.handler.ts` | `socket.join('workspace:...')` trong `join_voice_channel` |
| Voice snapshot on `join_workspace` | `presence.handler.ts` | Gửi Redis voice members cho client mới connect |

---

## 6. UI Improvements — VoiceMemberRow

**File:** `src/components/channel/ChannelItem.tsx`

| Trước | Sau |
|---|---|
| Avatar nhỏ w-5 h-5, không ring | Avatar w-7 h-7 với ring-2 |
| Cùng màu tất cả | 🟢 Green ring/bg cho self, 🔵 Primary cho others |
| Hiện `username` | Hiện `displayName` |
| Không có muted icon | 🔇 icon khi `isMuted` |
| Timer chỉ cho self | Timer cho tất cả members |
| Text trắng đều | Text xanh lá bold cho self, xám cho others |

---

## 7. Flow hoàn chỉnh (sau fix)

```
User A click voice channel
  │
  ├─ getUserMedia() → localStream ✅
  ├─ sessionRef = newSession (immediate)
  ├─ setSession(newSession) → Zustand + localStorage
  ├─ joinVoiceChannel(channelId) → socket.emit('join_voice_channel')
  ├─ addVoiceMember(optimistic) → icon hiện ngay ✅
  │
  ▼ Server
  ├─ Redis: thêm member vào voice:channelId
  ├─ socket.join('workspace:...')
  ├─ emit 'voice_user_joined' → existing members
  ├─ emit 'voice_channel_updated' → all members (bao gồm A)
  │
  ▼ User B (đã ở trong voice)
  ├─ 'voice_user_joined' → createPeer(A, initiator=false)
  ├─ 'voice_channel_updated' → createPeer(A, initiator=true) (nếu chưa có)
  │
  ▼ User A
  ├─ 'voice_channel_updated' → createPeer(B, initiator=true)
  │
  ▼ WebRTC Signaling
  ├─ A.peer.on('signal') → emit 'voice_signal' {to: B, signal: offer}
  ├─ Server relay → B.socket.emit('voice_signal', {from: A, signal: offer})
  ├─ B.peer.signal(offer) → B.peer.on('signal') → answer
  ├─ Server relay → A receives answer
  ├─ ICE candidates exchanged (trickle)
  │
  ▼ Connected
  ├─ peer.on('connect') → "✅ Peer CONNECTED"
  ├─ peer.on('stream') → audioEl.srcObject = remoteStream
  ├─ audioEl.play() → 🔊 Nghe nhau!
```

---

## 8. Files đã sửa

| File | Loại thay đổi |
|---|---|
| `src/hooks/useVoiceChannel.ts` | Fix stale session, auto-rejoin, channelId filter, logging |
| `src/socket/socket.ts` | Null guard + logging cho voice emit |
| `src/components/channel/ChannelItem.tsx` | UI VoiceMemberRow nâng cấp |
| `server/src/socket/handlers/voice.handler.ts` | Logging, voice_user_left, multi-tab fix, auto-join room |
| `docs/17_VOICE_SYNC_FIX.md` | Tài liệu phân tích 5 root causes |
| `docs/18_VOICE_DEBUG_SESSION.md` | File này — tóm tắt toàn bộ |

---

## 9. Cách test

1. **Hard refresh** (Ctrl+Shift+R) cả hai tab
2. Mở **DevTools Console** (F12), filter `[Voice]`
3. Tab 1: Click vào voice channel
   - ✅ Thấy icon user sáng lên
   - ✅ Console: `joinVoice — emitting join_voice_channel`
4. Tab 2: Click vào cùng voice channel
   - ✅ Thấy 2 icon users
   - ✅ Console: `createPeer`, `Sending signal`, `Peer CONNECTED`, `Got remote stream`
5. Nói vào mic → Tab kia nghe được âm thanh
6. F5 một tab → tự rejoin sau 1.5s
