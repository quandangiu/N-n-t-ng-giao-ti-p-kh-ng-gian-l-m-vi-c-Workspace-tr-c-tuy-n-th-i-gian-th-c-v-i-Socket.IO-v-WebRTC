# 17. Voice Channel — Phân tích & Fix lỗi đồng bộ + F5

## Mô tả 2 lỗi

### Lỗi 1: Hai user cùng room nhưng tách biệt (không nghe nhau)
User A join voice channel → User B join cùng channel → Cả hai đều thấy "Voice Connected" nhưng **không nghe** tiếng nhau. WebRTC peer connection không bao giờ được tạo.

### Lỗi 2: F5 → còn "Voice Connected" nhưng icon user biến mất
User đang trong voice → nhấn F5 → thanh "Voice Connected" vẫn hiện (session persisted) nhưng **avatar/icon user biến mất** khỏi danh sách member trong channel.

---

## Phân tích nguyên nhân gốc

### Nguyên nhân 1: Socket events KHÔNG BAO GIỜ được đăng ký (Core Bug)

```
Thứ tự mount trong React:
1. AppLayout renders
   ├── <VoiceProvider> renders (bọc ngoài)
   │     └── useVoiceChannel() hook chạy
   │           └── useEffect([], []) chạy → getSocket() → NULL ❌
   │                 → return early, events KHÔNG đăng ký
   └── useSocket() hook chạy
         └── useEffect chạy → connectSocket() → socket TẠO RA
```

**Vấn đề:** Trong React, child component effects chạy **TRƯỚC** parent effects. `VoiceProvider` là child (nằm trong return JSX), `useSocket()` là hook ở parent (`AppLayout`). Khi `useVoiceChannel` chạy `useEffect([], [])`, `connectSocket()` **chưa được gọi**, nên `getSocket()` trả về `null`.

Kết quả: **Tất cả socket events** (`voice_user_joined`, `voice_channel_updated`, `voice_signal`, `voice_user_left`) và **auto-rejoin handler** (`socket.on('connect')`) **KHÔNG BAO GIỜ được đăng ký**.

→ User A join → server broadcast `voice_user_joined` → client nhận event nhưng **không có handler** → `createPeer()` không chạy → không có WebRTC connection → không nghe nhau.

### Nguyên nhân 2: F5 race condition — disconnect xảy ra trước rejoin

```
Timeline khi F5:

T=0ms    Old socket disconnect
         → Server: removeFromVoice() → XÓA user khỏi Redis
         → Server broadcast: voice_user_left + voice_channel_updated (empty)
         → Other clients: icon biến mất ✓

T=50ms   Page reload xong
         → voiceStore.session = {...} (từ localStorage, persist middleware)
         → VoiceChannelBar hiện "Voice Connected" ✓
         → channelStore.voiceMembers = new Map() (KHÔNG persist) → icon = rỗng ❌

T=200ms  useSocket() → connectSocket() → socket chạy

T=300ms  socket 'connect' event → nhưng auto-rejoin handler chưa đăng ký (Bug 1)
         → KHÔNG joinVoice() → KHÔNG gửi join_voice_channel đến server
         → Redis vẫn rỗng → icon vẫn biến mất ❌

T=500ms  WorkspacePage mount → joinWorkspace(ws._id)
         → Server gửi voice snapshot → nhưng Redis đã rỗng (user bị xóa ở T=0)
         → voice_channel_updated { members: [] } → icon vẫn rỗng ❌
```

### Nguyên nhân 3: Server không ensure socket ở workspace room

Khi auto-rejoin xảy ra (nếu timing fix được), client gửi `join_voice_channel` **TRƯỚC** khi gửi `join_workspace`. Server broadcast `voice_channel_updated` đến `workspace:xxx` room, nhưng **socket chưa join room đó** → client không nhận được broadcast.

### Nguyên nhân 4: `removeFromVoice` không emit `voice_user_left`

(Đã fix) Server xóa user khỏi Redis và broadcast `voice_channel_updated` nhưng **không emit `voice_user_left`**. Client chỉ lắng nghe `voice_user_left` để gọi `destroyPeer()`. Kết quả: stale WebRTC peer connections tồn tại mãi mãi.

### Nguyên nhân 5: `findSocketByUserId` không xử lý multi-tab

User mở 2 tab → 2 socket instances. `findSocketByUserId` trả về socket **đầu tiên** tìm thấy, có thể là tab không đang ở voice channel. Signal relay đến sai socket → peer connection fail.

---

## Fix đã áp dụng

### Fix 1: Client — Polling cho socket availability (useVoiceChannel.ts)

Thay vì:
```ts
// ❌ Chạy 1 lần, nếu socket null thì bỏ qua vĩnh viễn
useEffect(() => {
  const socket = getSocket();
  if (!socket) return;  // NULL → exit, events KHÔNG BAO GIỜ đăng ký
  socket.on('voice_user_joined', ...);
}, []);
```

Đổi thành:
```ts
// ✅ Poll thử socket mỗi 200ms cho đến khi connectSocket() được gọi
useEffect(() => {
  let mounted = true;
  let cleanupSocket: (() => void) | null = null;

  const setup = () => {
    const socket = getSocket();
    if (!socket) return false;  // Chưa có → thử lại sau

    // Đăng ký TẤT CẢ voice events + auto-rejoin handler
    socket.on('voice_user_joined', onUserJoined);
    socket.on('voice_channel_updated', onVoiceChannelUpdated);
    socket.on('voice_signal', onVoiceSignal);
    socket.on('voice_user_left', onUserLeft);
    socket.on('connect', onConnect);  // auto-rejoin

    cleanupSocket = () => { socket.off(...) };

    // Nếu socket ĐÃ connected + có persisted session → rejoin ngay
    if (socket.connected && sessionRef.current) {
      onConnect();
    }
    return true;
  };

  if (!setup()) {
    const timer = setInterval(() => {
      if (!mounted) return clearInterval(timer);
      if (setup()) clearInterval(timer);
    }, 200);
  }

  return () => { mounted = false; cleanupSocket?.(); };
}, []);
```

### Fix 2: Client — Auto-rejoin delay tăng từ 500ms → 1500ms

```ts
const onConnect = async () => {
  const s = sessionRef.current;
  if (!s) return;
  // Chờ 1500ms để:
  // 1. Auth handshake hoàn tất
  // 2. WorkspacePage mount → joinWorkspace() chạy
  // 3. Socket đã join workspace room
  setTimeout(async () => {
    await joinVoice(s.channelId, s.channelName, s.workspaceSlug);
  }, 1500);
};
```

### Fix 3: Server — Auto-join workspace room khi join_voice_channel

```ts
// voice.handler.ts — trong join_voice_channel
const channel = await Channel.findById(channelId).select('workspace');
if (channel) {
  // ✅ MỚI: Đảm bảo socket ở workspace room
  // F5 auto-rejoin có thể xảy ra TRƯỚC join_workspace
  // → socket chưa ở workspace room → không nhận broadcast
  socket.join(`workspace:${channel.workspace}`);

  // 1. Thông báo existing members
  socket.to(`workspace:${channel.workspace}`).emit('voice_user_joined', ...);
  // 2. Broadcast member list (bao gồm user mới)
  io.to(`workspace:${channel.workspace}`).emit('voice_channel_updated', ...);
}
```

### Fix 4: Server — `removeFromVoice` emit `voice_user_left`

```ts
async function removeFromVoice(io, channelId, userId) {
  // ... cập nhật Redis ...
  if (channel) {
    // ✅ MỚI: Emit voice_user_left TRƯỚC voice_channel_updated
    // Client dùng event này để destroyPeer()
    io.to(`workspace:${channel.workspace}`).emit('voice_user_left', {
      userId, channelId,
    });
    io.to(`workspace:${channel.workspace}`).emit('voice_channel_updated', {
      channelId, members: updated,
    });
  }
}
```

### Fix 5: Server — `findSocketByUserId` ưu tiên socket đang voice

```ts
// ❌ Cũ: trả về socket đầu tiên (có thể là tab không ở voice)
function findSocketByUserId(io, userId) {
  for (const [, s] of io.sockets.sockets) {
    if (s.userId === userId) return s;
  }
  return null;
}

// ✅ Mới: ưu tiên socket đang trong voice channel
function findSocketByUserId(io, userId) {
  let fallback = null;
  for (const [, s] of io.sockets.sockets) {
    if (s.userId === userId) {
      if (s.currentVoiceChannel) return s;  // Socket đang voice → ưu tiên
      if (!fallback) fallback = s;
    }
  }
  return fallback;
}
```

### Fix 6: Client — Ref-based state (fix từ session trước)

Socket handlers dùng `sessionRef` + `currentUserRef` (luôn cập nhật) thay vì state (stale trong closure):

```ts
const sessionRef = useRef(useVoiceStore.getState().session);
useEffect(() => { sessionRef.current = session; }, [session]);

const currentUserRef = useRef(useAuthStore.getState().user);
useEffect(() => {
  return useAuthStore.subscribe((s) => { currentUserRef.current = s.user; });
}, []);
```

### Fix 7: Client — voiceStore persist (fix từ session trước)

```ts
export const useVoiceStore = create<VoiceState>()(
  persist(
    (set) => ({ ... }),
    {
      name: 'voice-session',  // localStorage key
      partialize: (state) => ({ session: state.session }),
    }
  )
);
```

---

## Luồng hoạt động SAU khi fix

### User A join voice channel lần đầu

```
1. A click voice channel
2. Client: joinVoice() → getUserMedia() → mic stream
3. Client: sessionRef.current = { channelId, ... } (ref cập nhật NGAY)
4. Client: setSession() → voiceStore (+ persist localStorage)
5. Client: addVoiceMember() → icon A xuất hiện (optimistic)
6. Client: emit 'join_voice_channel' { channelId }
7. Server: lưu A vào Redis voice:<channelId>
8. Server: socket.join('workspace:xxx')  ← ĐẢM BẢO ở room
9. Server: broadcast voice_user_joined → (chưa ai, ignore)
10. Server: broadcast voice_channel_updated { members: [A] }
11. Client A nhận voice_channel_updated → setVoiceMembers → icon update ✓
```

### User B join cùng channel

```
1. B click voice channel
2. Client B: joinVoice() → mic stream
3. Client B: emit 'join_voice_channel'
4. Server: lưu B vào Redis [A, B]
5. Server: broadcast voice_user_joined { userId: B }
   → Client A nhận → createPeer(B, non-initiator) ← chờ offer
6. Server: broadcast voice_channel_updated { members: [A, B] }
   → Client B nhận → createPeer(A, initiator) ← gửi offer
7. Client B peer signal → server relay voice_signal → Client A
8. Client A peer nhận signal → tạo answer → relay về B
9. WebRTC P2P established → Audio flows ✓
```

### F5 reload (User A đang trong voice)

```
T=0ms    A nhấn F5
         Old socket disconnect
         → Server: removeFromVoice(channelId, A)
           → Redis: xóa A, members = [B] (nếu B ở đó)
           → Broadcast: voice_user_left { userId: A }
           → Broadcast: voice_channel_updated { members: [B] }
         → Client B: destroyPeer(A) ← xóa peer cũ

T=50ms   Page reload
         voiceStore.session = persisted từ localStorage ✓
         VoiceChannelBar hiện "Voice Connected" ✓
         channelStore.voiceMembers = rỗng (chưa có data)

T=100ms  VoiceProvider mount → useVoiceChannel()
         useEffect chạy → getSocket() → null (useSocket chưa chạy)
         → Bắt đầu polling mỗi 200ms

T=200ms  useSocket() effect → connectSocket() → socket tạo ra

T=300ms  Polling tick → getSocket() → có socket ✓
         → Đăng ký voice events + auto-rejoin handler
         → Socket đã connected + có session → trigger onConnect()

T=500ms  WorkspacePage mount → joinWorkspace(ws._id)
         → socket.join('workspace:xxx')

T=1800ms Auto-rejoin timer fire (1500ms delay)
         → joinVoice(channelId, channelName, workspaceSlug)
         → getUserMedia() → mic stream mới
         → emit 'join_voice_channel'
         → Server: lưu A vào Redis [B, A]
         → Server: socket.join('workspace:xxx')  ← đảm bảo
         → Server: voice_user_joined → B tạo peer non-initiator
         → Server: voice_channel_updated { members: [B, A] }
         → Client A tạo peer initiator cho B
         → WebRTC re-established ✓
         → Icon A xuất hiện lại ✓
```

---

## Files đã thay đổi

### Server (C:\Users\Quan\node.js\server_chat realtime\server\)

| File | Thay đổi |
|------|----------|
| `src/socket/handlers/voice.handler.ts` | `findSocketByUserId` ưu tiên socket voice; `join_voice_channel` auto-join workspace room; `removeFromVoice` emit `voice_user_left` |

### Client (C:\Users\Quan\react\Chat Realtime\)

| File | Thay đổi |
|------|----------|
| `src/hooks/useVoiceChannel.ts` | Gộp socket events + auto-rejoin vào 1 useEffect với polling mechanism; ref-based state |
| `src/store/voiceStore.ts` | Thêm zustand `persist` middleware |
| `src/socket/voiceChannelEvents.ts` | Chuyển thành no-op (tránh double handler) |

---

## Kiểm tra (Checklist)

- [ ] User A join voice → icon A hiện trong channel
- [ ] User B join cùng channel → icon B hiện + cả 2 nghe nhau
- [ ] User A rời → icon A biến mất, B không còn nghe A
- [ ] User A F5 → "Voice Connected" hiện + icon A re-appear sau ~2s
- [ ] User A F5 → B vẫn nghe A sau khi rejoin
- [ ] Mở 2 tab → voice signal relay đúng tab đang voice
- [ ] User disconnect (đóng tab) → icon biến mất, peer bị destroy
