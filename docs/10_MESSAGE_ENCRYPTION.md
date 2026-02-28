# 10 - MESSAGE ENCRYPTION
## AES-256 (Symmetric) với crypto-js

---

## Approach đơn giản nhất (phù hợp portfolio)

Dùng **AES-256 symmetric key per channel**. Key được tạo khi channel được tạo, lưu trong DB (server biết key). Đây không phải E2E hoàn toàn nhưng đủ để demo + giải thích trade-off trong phỏng vấn.

---

## Cài đặt

```bash
npm install crypto-js
npm install -D @types/crypto-js
```

---

## Server — Tạo key khi tạo channel

```typescript
// server/src/utils/encryption.ts
import crypto from 'crypto';
import CryptoJS from 'crypto-js';

// Tạo key ngẫu nhiên 256-bit
export const generateChannelKey = (): string => {
  return crypto.randomBytes(32).toString('hex'); // 64 ký tự hex
};

// Encrypt message content
export const encryptMessage = (plaintext: string, key: string): string => {
  return CryptoJS.AES.encrypt(plaintext, key).toString();
};

// Decrypt message content
export const decryptMessage = (ciphertext: string, key: string): string => {
  const bytes = CryptoJS.AES.decrypt(ciphertext, key);
  return bytes.toString(CryptoJS.enc.Utf8);
};
```

---

## Channel Schema — thêm encryptionKey

```typescript
// Thêm vào channelSchema
encryptionEnabled: { type: Boolean, default: false },
encryptionKey:     { type: String, select: false }  // không trả về mặc định
```

---

## API — lấy key khi cần decrypt

```typescript
// GET /api/channels/:id/key — chỉ trả về nếu là member
export const getChannelKey = async (req, res) => {
  const channel = await Channel.findOne(
    { _id: req.params.id, members: req.userId },
    '+encryptionKey' // explicitly select
  );
  if (!channel?.encryptionKey) return res.status(404).json({ success: false });
  res.json({ success: true, data: { key: channel.encryptionKey } });
};
```

---

## Server — Encrypt khi lưu, decrypt khi đọc

```typescript
// Trong message.handler.ts — send_message
if (channel.encryptionEnabled && channel.encryptionKey) {
  const encrypted = encryptMessage(content, channel.encryptionKey);
  message = await Message.create({ ...data, content: encrypted });
} else {
  message = await Message.create({ ...data, content });
}

// Trong message.controller.ts — GET /messages/channel/:id
const channel = await Channel.findById(channelId).select('+encryptionKey');
let messages = await Message.find(...);

if (channel.encryptionEnabled && channel.encryptionKey) {
  messages = messages.map(msg => ({
    ...msg.toObject(),
    content: decryptMessage(msg.content, channel.encryptionKey)
  }));
}
```

---

## Client — Encryption Utils

```typescript
// client/src/utils/encryption.ts
import CryptoJS from 'crypto-js';

// Cache key trong memory (session only, không lưu localStorage)
const keyCache = new Map<string, string>();

export const cacheChannelKey = (channelId: string, key: string) => {
  keyCache.set(channelId, key);
};

export const getChannelKey = (channelId: string): string | undefined => {
  return keyCache.get(channelId);
};

export const encryptMsg = (text: string, key: string): string =>
  CryptoJS.AES.encrypt(text, key).toString();

export const decryptMsg = (cipher: string, key: string): string => {
  try {
    const bytes = CryptoJS.AES.decrypt(cipher, key);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch {
    return '[Không thể giải mã]';
  }
};
```

---

## Client — Fetch key khi vào channel

```typescript
// Trong useMessages.ts hoặc ChannelPage.tsx
useEffect(() => {
  const fetchKey = async () => {
    if (!channel.encryptionEnabled) return;
    if (getChannelKey(channelId)) return; // đã có trong cache

    const { data } = await api.get(`/channels/${channelId}/key`);
    cacheChannelKey(channelId, data.data.key);
  };
  fetchKey();
}, [channelId]);
```

---

## 💡 Trade-offs để nói trong phỏng vấn

| | Approach này | True E2E |
|--|--|--|
| Server biết key? | Có | Không |
| Phức tạp | Thấp | Rất cao |
| Key management | Server giữ | Client giữ (RSA) |
| Demo được không? | Dễ | Khó |
| Phù hợp portfolio? | Tốt | Overkill |

**Câu trả lời phỏng vấn:** "Tôi dùng AES-256 symmetric key per channel. Server lưu key nên chưa phải E2E hoàn toàn. Nếu cần true E2E, sẽ dùng RSA để mỗi user có key pair riêng, channel key được encrypt bằng public key của từng member, server không bao giờ thấy plaintext."
