# 03 - DATABASE SCHEMA
## MongoDB Local — mongoose Schemas

---

## Kết nối MongoDB localhost

```typescript
// server/src/config/db.ts
import mongoose from 'mongoose';

export const connectDB = async () => {
  await mongoose.connect('mongodb://localhost:27017/chatapp');
  console.log('MongoDB connected: localhost:27017/chatapp');
};
```

---

## 👤 User

```typescript
// server/src/models/User.ts
import mongoose, { Schema } from 'mongoose';

const userSchema = new Schema({
  username:     { type: String, required: true, unique: true, trim: true, minlength: 3 },
  email:        { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true, select: false },
  avatar:       { type: String, default: null },
  displayName:  { type: String, maxlength: 50 },
  status:       { type: String, enum: ['online','offline','away'], default: 'offline' },
  lastSeen:     { type: Date, default: Date.now },
  bio:          { type: String, maxlength: 200 }
}, { timestamps: true });

userSchema.index({ email: 1 });
userSchema.index({ username: 1 });

export const User = mongoose.model('User', userSchema);
```

---

## 🏢 Workspace

```typescript
// server/src/models/Workspace.ts
const workspaceSchema = new Schema({
  name:   { type: String, required: true, maxlength: 80 },
  slug:   { type: String, unique: true, lowercase: true }, // auto từ name
  icon:   { type: String, default: '💬' },
  owner:  { type: Schema.Types.ObjectId, ref: 'User', required: true },
  members: [{
    user:     { type: Schema.Types.ObjectId, ref: 'User' },
    role:     { type: String, enum: ['owner','admin','member'], default: 'member' },
    joinedAt: { type: Date, default: Date.now }
  }],
  inviteCode: { type: String, unique: true, sparse: true }
}, { timestamps: true });

workspaceSchema.index({ slug: 1 });
workspaceSchema.index({ 'members.user': 1 });

export const Workspace = mongoose.model('Workspace', workspaceSchema);
```

---

## 📢 Channel

```typescript
// server/src/models/Channel.ts
const channelSchema = new Schema({
  workspace:    { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
  name:         { type: String, required: true, maxlength: 80 },
  type:         { type: String, enum: ['public','private','dm'], default: 'public' },
  description:  { type: String },
  members:      [{ type: Schema.Types.ObjectId, ref: 'User' }],
  createdBy:    { type: Schema.Types.ObjectId, ref: 'User' },
  lastMessage:  { type: Schema.Types.ObjectId, ref: 'Message' },
  lastActivity: { type: Date, default: Date.now },
  dmUsers:      [{ type: Schema.Types.ObjectId, ref: 'User' }] // chỉ dùng khi type=dm
}, { timestamps: true });

channelSchema.index({ workspace: 1 });
channelSchema.index({ members: 1 });
channelSchema.index({ lastActivity: -1 });

export const Channel = mongoose.model('Channel', channelSchema);
```

---

## 💬 Message

```typescript
// server/src/models/Message.ts
const messageSchema = new Schema({
  channel:  { type: Schema.Types.ObjectId, ref: 'Channel', required: true },
  sender:   { type: Schema.Types.ObjectId, ref: 'User', required: true },
  content:  { type: String, default: '' }, // có thể là ciphertext nếu bật encryption
  type:     { type: String, enum: ['text','image','file','system'], default: 'text' },
  attachment: {
    url:      String,
    name:     String,
    size:     Number,
    mimeType: String,
    publicId: String  // Cloudinary public_id để xóa
  },
  replyTo:   { type: Schema.Types.ObjectId, ref: 'Message', default: null },
  // reactions: { "👍": ["userId1","userId2"], "❤️": ["userId3"] }
  reactions: { type: Map, of: [{ type: Schema.Types.ObjectId, ref: 'User' }], default: {} },
  readBy: [{
    user:   { type: Schema.Types.ObjectId, ref: 'User' },
    readAt: { type: Date, default: Date.now }
  }],
  isEdited:  { type: Boolean, default: false },
  editedAt:  Date,
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

// Index quan trọng cho performance
messageSchema.index({ channel: 1, _id: -1 });      // cursor pagination
messageSchema.index({ channel: 1, createdAt: -1 }); // sort
messageSchema.index({ content: 'text' });           // full-text search

export const Message = mongoose.model('Message', messageSchema);
```

---

## 🔔 Notification

```typescript
// server/src/models/Notification.ts
const notificationSchema = new Schema({
  recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type:      { type: String, enum: ['mention','dm','reaction','invite'], required: true },
  actor:     { type: Schema.Types.ObjectId, ref: 'User' },
  payload: {
    messageId:   { type: Schema.Types.ObjectId, ref: 'Message' },
    channelId:   { type: Schema.Types.ObjectId, ref: 'Channel' },
    workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace' },
    preview:     String // preview text ngắn
  },
  isRead: { type: Boolean, default: false },
  readAt: Date
}, { timestamps: true });

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

export const Notification = mongoose.model('Notification', notificationSchema);
```

---

## 📊 Quan hệ giữa các Collection

```
User ──── owns ──────────── Workspace
 │                              │
 └─── member of ─────────── Channel
                                │
                            Message
                           ┌────┴────┐
                        readBy    reactions
                        (User[])  (Map)
```

---

## 💡 Design Notes

- `Message.readBy` array thay vì collection riêng → đọc/ghi cùng document
- Cursor dùng `_id` thay vì `createdAt` → unique, tránh tie-breaking
- `isDeleted: true` (soft delete) → giữ nguyên thread integrity
- `Channel.lastActivity` index → sort sidebar by recent activity
