# 🖥️ SERVER PROMPT — Copy toàn bộ nội dung này vào AI Agent để tạo server

---

## Yêu cầu

Bạn là Senior Backend Engineer. Hãy build **hoàn chỉnh** phần server cho ứng dụng Chat Realtime.

**QUAN TRỌNG — CHẠY QUA MẠNG (KHÔNG CHỈ LOCALHOST):**
- Server bind `0.0.0.0` (không bind `127.0.0.1` hay `localhost`)
- MongoDB vẫn kết nối `mongodb://localhost:27017/chatapp` (trên máy server)
- Redis vẫn kết nối `redis://localhost:6379` (trên máy server)
- Server chạy tại `http://0.0.0.0:3000` → client từ máy khác truy cập bằng IP
- CORS cho phép nhiều origin (từ `.env`)
- Cookie `sameSite: 'none'` + `secure: false` cho cross-origin HTTP

---

## Tech Stack Server

- Node.js 18+ + Express + TypeScript
- MongoDB (local) + Mongoose
- Redis (local) + node redis
- Socket.io 4.x
- JWT (jsonwebtoken) + bcrypt
- Multer + Cloudinary (free tier)
- crypto-js (AES-256)
- Zod (validation)
- tsx (dev runner)

---

## Cấu trúc thư mục server/

```
server/
├── src/
│   ├── config/
│   │   ├── db.ts                # mongoose.connect
│   │   ├── redis.ts             # createClient
│   │   └── cloudinary.ts
│   │
│   ├── models/
│   │   ├── User.ts
│   │   ├── Workspace.ts
│   │   ├── Channel.ts
│   │   ├── Message.ts
│   │   └── Notification.ts
│   │
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── user.controller.ts
│   │   ├── workspace.controller.ts
│   │   ├── channel.controller.ts
│   │   ├── message.controller.ts
│   │   └── file.controller.ts
│   │
│   ├── routes/
│   │   ├── index.ts
│   │   ├── auth.routes.ts
│   │   ├── user.routes.ts
│   │   ├── workspace.routes.ts
│   │   ├── channel.routes.ts
│   │   ├── message.routes.ts
│   │   └── file.routes.ts
│   │
│   ├── middleware/
│   │   ├── auth.middleware.ts
│   │   ├── validate.middleware.ts
│   │   ├── upload.middleware.ts   # multer + cloudinary storage
│   │   └── errorHandler.ts
│   │
│   ├── socket/
│   │   ├── index.ts
│   │   └── handlers/
│   │       ├── message.handler.ts
│   │       ├── presence.handler.ts
│   │       └── video.handler.ts
│   │
│   ├── services/
│   │   ├── presence.service.ts    # Redis online status
│   │   ├── notification.service.ts
│   │   └── upload.service.ts
│   │
│   ├── utils/
│   │   ├── jwt.ts
│   │   ├── bcrypt.ts
│   │   ├── apiResponse.ts
│   │   └── encryption.ts
│   │
│   └── server.ts                  # Entry point
│
├── .env
├── tsconfig.json
└── package.json
```

---

## package.json

```json
{
  "name": "chat-realtime-server",
  "version": "1.0.0",
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "mongoose": "^8.0.0",
    "socket.io": "^4.6.1",
    "redis": "^4.6.7",
    "jsonwebtoken": "^9.0.0",
    "bcrypt": "^5.1.1",
    "multer": "^1.4.5-lts.1",
    "multer-storage-cloudinary": "^4.0.0",
    "cloudinary": "^1.41.0",
    "crypto-js": "^4.2.0",
    "cors": "^2.8.5",
    "cookie-parser": "^1.4.6",
    "dotenv": "^16.3.1",
    "zod": "^3.22.4",
    "slugify": "^1.6.6"
  },
  "devDependencies": {
    "tsx": "^4.0.0",
    "typescript": "^5.3.2",
    "@types/express": "^4.17.21",
    "@types/bcrypt": "^5.0.2",
    "@types/jsonwebtoken": "^9.0.5",
    "@types/multer": "^1.4.11",
    "@types/crypto-js": "^4.2.1",
    "@types/cors": "^2.8.17",
    "@types/cookie-parser": "^1.4.6",
    "@types/node": "^20.10.0"
  }
}
```

---

## tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

---

## .env (Template — user tự điền)

```env
PORT=3000
HOST=0.0.0.0

MONGO_URI=mongodb://localhost:27017/chatapp
REDIS_URL=redis://localhost:6379

JWT_ACCESS_SECRET=change_this_super_secret_access_key_64chars
JWT_REFRESH_SECRET=change_this_super_secret_refresh_key_64chars

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# QUAN TRỌNG: Danh sách origins cho phép, cách nhau bằng dấu phẩy
# Thêm IP client vào đây. VD: http://192.168.1.50:5173,http://192.168.1.51:5173
CLIENT_URLS=http://localhost:5173,http://localhost:3000

NODE_ENV=development
```

---

## Entry Point — server.ts

```typescript
// src/server.ts
import express from 'express';
import http from 'http';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { connectDB } from './config/db';
import { connectRedis } from './config/redis';
import { initSocket } from './socket';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

const app = express();
const server = http.createServer(app);

// CORS — cho phép nhiều origin từ .env (hỗ trợ mạng LAN)
const allowedOrigins = (process.env.CLIENT_URLS || 'http://localhost:5173')
  .split(',')
  .map(s => s.trim());

app.use(cors({
  origin: (origin, callback) => {
    // Cho phép requests không có origin (Postman, curl, mobile app)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    // Cho phép tất cả origin trên mạng local (192.168.x.x, 10.x.x.x)
    if (/^http:\/\/(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(origin)) {
      return callback(null, true);
    }
    callback(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'Server is running', timestamp: new Date() });
});

// API routes
app.use('/api', routes);

// Error handler (phải đặt cuối cùng)
app.use(errorHandler);

// Socket.io
const io = initSocket(server);

// Start
const start = async () => {
  await connectDB();
  await connectRedis();

  const PORT = process.env.PORT || 3000;
  const HOST = process.env.HOST || '0.0.0.0';

  server.listen(Number(PORT), HOST, () => {
    console.log(`✅ Server running at http://${HOST}:${PORT}`);
    console.log(`📡 Allowed origins: ${allowedOrigins.join(', ')}`);
    console.log(`🌐 LAN access: http://<YOUR_IP>:${PORT}`);
  });
};

start().catch(console.error);
```

---

## Config Files

### config/db.ts

```typescript
import mongoose from 'mongoose';

export const connectDB = async () => {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/chatapp';
  await mongoose.connect(uri);
  console.log('✅ MongoDB connected:', uri);
};
```

### config/redis.ts

```typescript
import { createClient } from 'redis';

export const redis = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});

redis.on('error', (err) => console.error('❌ Redis error:', err));

export const connectRedis = async () => {
  await redis.connect();
  console.log('✅ Redis connected:', process.env.REDIS_URL || 'redis://localhost:6379');
};
```

### config/cloudinary.ts

```typescript
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export { cloudinary };
```

---

## Utils

### utils/apiResponse.ts

```typescript
import { Response } from 'express';

export const sendSuccess = (res: Response, data: unknown, status = 200) => {
  res.status(status).json({ success: true, data });
};

export const sendError = (res: Response, code: string, message: string, status = 400) => {
  res.status(status).json({ success: false, error: { code, message } });
};
```

### utils/jwt.ts

```typescript
import jwt from 'jsonwebtoken';

export const generateAccessToken = (userId: string) =>
  jwt.sign({ userId }, process.env.JWT_ACCESS_SECRET!, { expiresIn: '15m' });

export const generateRefreshToken = (userId: string) =>
  jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET!, { expiresIn: '7d' });

export const verifyToken = (token: string) =>
  jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as { userId: string };

export const verifyRefreshToken = (token: string) =>
  jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as { userId: string };
```

### utils/bcrypt.ts

```typescript
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;

export const hashPassword = (password: string) => bcrypt.hash(password, SALT_ROUNDS);
export const comparePassword = (password: string, hash: string) => bcrypt.compare(password, hash);
```

### utils/encryption.ts

```typescript
import crypto from 'crypto';
import CryptoJS from 'crypto-js';

export const generateChannelKey = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

export const encryptMessage = (plaintext: string, key: string): string => {
  return CryptoJS.AES.encrypt(plaintext, key).toString();
};

export const decryptMessage = (ciphertext: string, key: string): string => {
  const bytes = CryptoJS.AES.decrypt(ciphertext, key);
  return bytes.toString(CryptoJS.enc.Utf8);
};
```

---

## Models

### models/User.ts

```typescript
import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  username: string;
  email: string;
  passwordHash: string;
  avatar: string | null;
  displayName: string;
  status: 'online' | 'offline' | 'away';
  lastSeen: Date;
  bio: string;
}

const userSchema = new Schema({
  username:     { type: String, required: true, unique: true, trim: true, minlength: 3 },
  email:        { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true, select: false },
  avatar:       { type: String, default: null },
  displayName:  { type: String, maxlength: 50 },
  status:       { type: String, enum: ['online', 'offline', 'away'], default: 'offline' },
  lastSeen:     { type: Date, default: Date.now },
  bio:          { type: String, maxlength: 200 },
}, { timestamps: true });

userSchema.index({ email: 1 });
userSchema.index({ username: 1 });

export const User = mongoose.model<IUser>('User', userSchema);
```

### models/Workspace.ts

```typescript
import mongoose, { Schema, Document } from 'mongoose';
import slugify from 'slugify';

export interface IWorkspace extends Document {
  name: string;
  slug: string;
  icon: string;
  owner: mongoose.Types.ObjectId;
  members: Array<{
    user: mongoose.Types.ObjectId;
    role: 'owner' | 'admin' | 'member';
    joinedAt: Date;
  }>;
  inviteCode: string;
}

const workspaceSchema = new Schema({
  name:   { type: String, required: true, maxlength: 80 },
  slug:   { type: String, unique: true, lowercase: true },
  icon:   { type: String, default: '💬' },
  owner:  { type: Schema.Types.ObjectId, ref: 'User', required: true },
  members: [{
    user:     { type: Schema.Types.ObjectId, ref: 'User' },
    role:     { type: String, enum: ['owner', 'admin', 'member'], default: 'member' },
    joinedAt: { type: Date, default: Date.now },
  }],
  inviteCode: { type: String, unique: true, sparse: true },
}, { timestamps: true });

workspaceSchema.index({ slug: 1 });
workspaceSchema.index({ 'members.user': 1 });

// Auto tạo slug từ name
workspaceSchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.slug = slugify(this.name, { lower: true, strict: true }) + '-' + Date.now().toString(36);
  }
  if (!this.inviteCode) {
    this.inviteCode = Math.random().toString(36).slice(2, 10);
  }
  next();
});

export const Workspace = mongoose.model<IWorkspace>('Workspace', workspaceSchema);
```

### models/Channel.ts

```typescript
import mongoose, { Schema, Document } from 'mongoose';

export interface IChannel extends Document {
  workspace: mongoose.Types.ObjectId;
  name: string;
  type: 'public' | 'private' | 'dm';
  description: string;
  members: mongoose.Types.ObjectId[];
  createdBy: mongoose.Types.ObjectId;
  lastMessage: mongoose.Types.ObjectId;
  lastActivity: Date;
  dmUsers: mongoose.Types.ObjectId[];
  encryptionEnabled: boolean;
  encryptionKey: string;
}

const channelSchema = new Schema({
  workspace:    { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
  name:         { type: String, required: true, maxlength: 80 },
  type:         { type: String, enum: ['public', 'private', 'dm'], default: 'public' },
  description:  { type: String },
  members:      [{ type: Schema.Types.ObjectId, ref: 'User' }],
  createdBy:    { type: Schema.Types.ObjectId, ref: 'User' },
  lastMessage:  { type: Schema.Types.ObjectId, ref: 'Message' },
  lastActivity: { type: Date, default: Date.now },
  dmUsers:      [{ type: Schema.Types.ObjectId, ref: 'User' }],
  encryptionEnabled: { type: Boolean, default: false },
  encryptionKey:     { type: String, select: false },
}, { timestamps: true });

channelSchema.index({ workspace: 1 });
channelSchema.index({ members: 1 });
channelSchema.index({ lastActivity: -1 });

export const Channel = mongoose.model<IChannel>('Channel', channelSchema);
```

### models/Message.ts

```typescript
import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage extends Document {
  channel: mongoose.Types.ObjectId;
  sender: mongoose.Types.ObjectId;
  content: string;
  type: 'text' | 'image' | 'file' | 'system';
  attachment: {
    url: string;
    name: string;
    size: number;
    mimeType: string;
    publicId: string;
  };
  replyTo: mongoose.Types.ObjectId;
  reactions: Map<string, mongoose.Types.ObjectId[]>;
  readBy: Array<{ user: mongoose.Types.ObjectId; readAt: Date }>;
  isEdited: boolean;
  editedAt: Date;
  isDeleted: boolean;
}

const messageSchema = new Schema({
  channel:  { type: Schema.Types.ObjectId, ref: 'Channel', required: true },
  sender:   { type: Schema.Types.ObjectId, ref: 'User', required: true },
  content:  { type: String, default: '' },
  type:     { type: String, enum: ['text', 'image', 'file', 'system'], default: 'text' },
  attachment: {
    url:      String,
    name:     String,
    size:     Number,
    mimeType: String,
    publicId: String,
  },
  replyTo:   { type: Schema.Types.ObjectId, ref: 'Message', default: null },
  reactions: { type: Map, of: [{ type: Schema.Types.ObjectId, ref: 'User' }], default: {} },
  readBy: [{
    user:   { type: Schema.Types.ObjectId, ref: 'User' },
    readAt: { type: Date, default: Date.now },
  }],
  isEdited:  { type: Boolean, default: false },
  editedAt:  Date,
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

messageSchema.index({ channel: 1, _id: -1 });
messageSchema.index({ channel: 1, createdAt: -1 });
messageSchema.index({ content: 'text' });

export const Message = mongoose.model<IMessage>('Message', messageSchema);
```

### models/Notification.ts

```typescript
import mongoose, { Schema, Document } from 'mongoose';

const notificationSchema = new Schema({
  recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type:      { type: String, enum: ['mention', 'dm', 'reaction', 'invite'], required: true },
  actor:     { type: Schema.Types.ObjectId, ref: 'User' },
  payload: {
    messageId:   { type: Schema.Types.ObjectId, ref: 'Message' },
    channelId:   { type: Schema.Types.ObjectId, ref: 'Channel' },
    workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace' },
    preview:     String,
  },
  isRead: { type: Boolean, default: false },
  readAt: Date,
}, { timestamps: true });

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

export const Notification = mongoose.model('Notification', notificationSchema);
```

---

## Middleware

### middleware/auth.middleware.ts

```typescript
import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer '))
    return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Không có token' } });

  try {
    const decoded = verifyToken(header.split(' ')[1]);
    req.userId = decoded.userId;
    next();
  } catch {
    res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Token không hợp lệ hoặc hết hạn' } });
  }
};
```

### middleware/errorHandler.ts

```typescript
import { Request, Response, NextFunction } from 'express';

export const errorHandler = (err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('❌ Error:', err.message);
  res.status(500).json({
    success: false,
    error: { code: 'INTERNAL_ERROR', message: err.message || 'Lỗi server' },
  });
};
```

### middleware/validate.middleware.ts

```typescript
import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

export const validate = (schema: ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: result.error.errors.map(e => e.message).join(', '),
      },
    });
  }
  req.body = result.data;
  next();
};
```

### middleware/upload.middleware.ts

```typescript
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { cloudinary } from '../config/cloudinary';

const ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf', 'text/plain', 'application/zip',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
const MAX_SIZE = 10 * 1024 * 1024;

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (_req: any, file: any) => ({
    folder: file.mimetype.startsWith('image/') ? 'chat/images' : 'chat/files',
    resource_type: file.mimetype.startsWith('image/') ? 'image' : 'raw',
    public_id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  }),
});

export const upload = multer({
  storage,
  limits: { fileSize: MAX_SIZE },
  fileFilter: (_req, file, cb) => {
    ALLOWED_TYPES.includes(file.mimetype) ? cb(null, true) : cb(new Error('Loại file không được hỗ trợ'));
  },
});
```

---

## Controllers

### controllers/auth.controller.ts

```typescript
import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';
import { redis } from '../config/redis';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { hashPassword, comparePassword } from '../utils/bcrypt';
import { sendSuccess, sendError } from '../utils/apiResponse';

const REFRESH_TTL = 7 * 24 * 60 * 60; // 7 days

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, email, password } = req.body;

    const exists = await User.findOne({ $or: [{ email }, { username }] });
    if (exists) return sendError(res, 'CONFLICT', 'Email hoặc username đã tồn tại', 409);

    const passwordHash = await hashPassword(password);
    const user = await User.create({ username, email, passwordHash });

    const accessToken = generateAccessToken(user._id.toString());
    const refreshToken = generateRefreshToken(user._id.toString());

    await redis.set(`refresh:${user._id}:${refreshToken}`, '1', { EX: REFRESH_TTL });

    // Cookie cho cross-origin network access
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: REFRESH_TTL * 1000,
    });

    sendSuccess(res, {
      user: { _id: user._id, username, email, avatar: null },
      accessToken,
    }, 201);
  } catch (err) { next(err); }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+passwordHash');
    if (!user || !(await comparePassword(password, user.passwordHash)))
      return sendError(res, 'UNAUTHORIZED', 'Sai email hoặc mật khẩu', 401);

    const accessToken = generateAccessToken(user._id.toString());
    const refreshToken = generateRefreshToken(user._id.toString());

    await redis.set(`refresh:${user._id}:${refreshToken}`, '1', { EX: REFRESH_TTL });
    await User.findByIdAndUpdate(user._id, { status: 'online' });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: REFRESH_TTL * 1000,
    });

    sendSuccess(res, {
      user: { _id: user._id, username: user.username, email: user.email, avatar: user.avatar, displayName: user.displayName },
      accessToken,
    });
  } catch (err) { next(err); }
};

export const refreshTokenHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) return sendError(res, 'UNAUTHORIZED', 'Không có refresh token', 401);

    const decoded = verifyRefreshToken(token);
    const exists = await redis.get(`refresh:${decoded.userId}:${token}`);
    if (!exists) return sendError(res, 'UNAUTHORIZED', 'Refresh token đã bị thu hồi', 401);

    const newAccessToken = generateAccessToken(decoded.userId);
    sendSuccess(res, { accessToken: newAccessToken });
  } catch (err) { next(err); }
};

export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies.refreshToken;
    if (token) {
      try {
        const decoded = verifyRefreshToken(token);
        await redis.del(`refresh:${decoded.userId}:${token}`);
      } catch { /* ignore invalid token */ }
    }
    if (req.userId) {
      await User.findByIdAndUpdate(req.userId, { status: 'offline', lastSeen: new Date() });
    }
    res.clearCookie('refreshToken');
    sendSuccess(res, null);
  } catch (err) { next(err); }
};

export const getMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return sendError(res, 'NOT_FOUND', 'User không tồn tại', 404);
    sendSuccess(res, user);
  } catch (err) { next(err); }
};
```

### controllers/user.controller.ts

```typescript
import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';
import { sendSuccess, sendError } from '../utils/apiResponse';

export const searchUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { q, limit = 10 } = req.query;
    if (!q) return sendSuccess(res, []);

    const users = await User.find({
      $or: [
        { username: { $regex: q, $options: 'i' } },
        { displayName: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
      ],
      _id: { $ne: req.userId },
    })
      .select('username avatar displayName status')
      .limit(Number(limit));

    sendSuccess(res, users);
  } catch (err) { next(err); }
};

export const getUserById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return sendError(res, 'NOT_FOUND', 'User không tồn tại', 404);
    sendSuccess(res, user);
  } catch (err) { next(err); }
};

export const updateProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.params.id !== req.userId)
      return sendError(res, 'FORBIDDEN', 'Không có quyền', 403);

    const updates: any = {};
    if (req.body.displayName !== undefined) updates.displayName = req.body.displayName;
    if (req.body.bio !== undefined) updates.bio = req.body.bio;
    if ((req as any).file) updates.avatar = (req as any).file.path;

    const user = await User.findByIdAndUpdate(req.userId, updates, { new: true });
    sendSuccess(res, user);
  } catch (err) { next(err); }
};
```

### controllers/workspace.controller.ts

```typescript
import { Request, Response, NextFunction } from 'express';
import { Workspace } from '../models/Workspace';
import { Channel } from '../models/Channel';
import { sendSuccess, sendError } from '../utils/apiResponse';

export const createWorkspace = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, description } = req.body;
    const ws = await Workspace.create({
      name,
      description,
      owner: req.userId,
      members: [{ user: req.userId, role: 'owner' }],
    });

    // Tạo channel #general mặc định
    await Channel.create({
      workspace: ws._id,
      name: 'general',
      type: 'public',
      description: 'Channel chung',
      members: [req.userId],
      createdBy: req.userId,
    });

    sendSuccess(res, ws, 201);
  } catch (err) { next(err); }
};

export const getMyWorkspaces = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaces = await Workspace.find({ 'members.user': req.userId })
      .populate('members.user', 'username avatar displayName status');
    sendSuccess(res, workspaces);
  } catch (err) { next(err); }
};

export const getWorkspaceById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ws = await Workspace.findById(req.params.id)
      .populate('members.user', 'username avatar displayName status');
    if (!ws) return sendError(res, 'NOT_FOUND', 'Workspace không tồn tại', 404);

    const isMember = ws.members.some(m => m.user && (m.user as any)._id?.toString() === req.userId);
    if (!isMember) return sendError(res, 'FORBIDDEN', 'Không phải member', 403);

    sendSuccess(res, ws);
  } catch (err) { next(err); }
};

export const updateWorkspace = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ws = await Workspace.findById(req.params.id);
    if (!ws) return sendError(res, 'NOT_FOUND', 'Workspace không tồn tại', 404);

    const member = ws.members.find(m => m.user.toString() === req.userId);
    if (!member || !['owner', 'admin'].includes(member.role))
      return sendError(res, 'FORBIDDEN', 'Không đủ quyền', 403);

    Object.assign(ws, req.body);
    await ws.save();
    sendSuccess(res, ws);
  } catch (err) { next(err); }
};

export const deleteWorkspace = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ws = await Workspace.findById(req.params.id);
    if (!ws) return sendError(res, 'NOT_FOUND', 'Workspace không tồn tại', 404);
    if (ws.owner.toString() !== req.userId)
      return sendError(res, 'FORBIDDEN', 'Chỉ owner mới được xóa', 403);

    await Channel.deleteMany({ workspace: ws._id });
    await ws.deleteOne();
    sendSuccess(res, null);
  } catch (err) { next(err); }
};

export const addMember = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ws = await Workspace.findById(req.params.id);
    if (!ws) return sendError(res, 'NOT_FOUND', 'Workspace không tồn tại', 404);

    const adminMember = ws.members.find(m => m.user.toString() === req.userId);
    if (!adminMember || !['owner', 'admin'].includes(adminMember.role))
      return sendError(res, 'FORBIDDEN', 'Không đủ quyền', 403);

    const { userId } = req.body;
    const alreadyMember = ws.members.some(m => m.user.toString() === userId);
    if (alreadyMember) return sendError(res, 'CONFLICT', 'Đã là member', 409);

    ws.members.push({ user: userId, role: 'member', joinedAt: new Date() });
    await ws.save();

    // Thêm vào tất cả public channels
    await Channel.updateMany(
      { workspace: ws._id, type: 'public' },
      { $addToSet: { members: userId } }
    );

    sendSuccess(res, ws);
  } catch (err) { next(err); }
};

export const removeMember = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ws = await Workspace.findById(req.params.id);
    if (!ws) return sendError(res, 'NOT_FOUND', 'Workspace không tồn tại', 404);

    const adminMember = ws.members.find(m => m.user.toString() === req.userId);
    if (!adminMember || !['owner', 'admin'].includes(adminMember.role))
      return sendError(res, 'FORBIDDEN', 'Không đủ quyền', 403);

    ws.members = ws.members.filter(m => m.user.toString() !== req.params.userId) as any;
    await ws.save();

    await Channel.updateMany(
      { workspace: ws._id },
      { $pull: { members: req.params.userId } }
    );

    sendSuccess(res, null);
  } catch (err) { next(err); }
};

export const joinByInvite = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ws = await Workspace.findOne({ inviteCode: req.params.inviteCode });
    if (!ws) return sendError(res, 'NOT_FOUND', 'Invite code không hợp lệ', 404);

    const alreadyMember = ws.members.some(m => m.user.toString() === req.userId);
    if (!alreadyMember) {
      ws.members.push({ user: req.userId as any, role: 'member', joinedAt: new Date() });
      await ws.save();

      await Channel.updateMany(
        { workspace: ws._id, type: 'public' },
        { $addToSet: { members: req.userId } }
      );
    }

    sendSuccess(res, ws);
  } catch (err) { next(err); }
};
```

### controllers/channel.controller.ts

```typescript
import { Request, Response, NextFunction } from 'express';
import { Channel } from '../models/Channel';
import { Workspace } from '../models/Workspace';
import { Message } from '../models/Message';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { generateChannelKey } from '../utils/encryption';

export const createChannel = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { workspaceId, name, type, description, encryptionEnabled } = req.body;

    const ws = await Workspace.findById(workspaceId);
    if (!ws) return sendError(res, 'NOT_FOUND', 'Workspace không tồn tại', 404);

    const isMember = ws.members.some(m => m.user.toString() === req.userId);
    if (!isMember) return sendError(res, 'FORBIDDEN', 'Không phải member', 403);

    const channelData: any = {
      workspace: workspaceId,
      name,
      type: type || 'public',
      description,
      members: type === 'public'
        ? ws.members.map(m => m.user)
        : [req.userId],
      createdBy: req.userId,
    };

    if (encryptionEnabled) {
      channelData.encryptionEnabled = true;
      channelData.encryptionKey = generateChannelKey();
    }

    const channel = await Channel.create(channelData);
    sendSuccess(res, channel, 201);
  } catch (err) { next(err); }
};

export const getChannelsByWorkspace = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const channels = await Channel.find({
      workspace: req.params.workspaceId,
      members: req.userId,
    }).sort({ lastActivity: -1 });

    // Đếm unread (đơn giản: messages chưa có trong readBy)
    const result = await Promise.all(channels.map(async (ch) => {
      const unreadCount = await Message.countDocuments({
        channel: ch._id,
        sender: { $ne: req.userId },
        'readBy.user': { $ne: req.userId },
        isDeleted: false,
      });
      return { ...ch.toObject(), unreadCount };
    }));

    sendSuccess(res, result);
  } catch (err) { next(err); }
};

export const getChannelById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const channel = await Channel.findById(req.params.id);
    if (!channel) return sendError(res, 'NOT_FOUND', 'Channel không tồn tại', 404);

    const isMember = channel.members.some(m => m.toString() === req.userId);
    if (!isMember) return sendError(res, 'FORBIDDEN', 'Không phải member', 403);

    sendSuccess(res, channel);
  } catch (err) { next(err); }
};

export const updateChannel = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const channel = await Channel.findById(req.params.id);
    if (!channel) return sendError(res, 'NOT_FOUND', 'Channel không tồn tại', 404);
    if (channel.createdBy.toString() !== req.userId)
      return sendError(res, 'FORBIDDEN', 'Chỉ người tạo mới được sửa', 403);

    Object.assign(channel, req.body);
    await channel.save();
    sendSuccess(res, channel);
  } catch (err) { next(err); }
};

export const deleteChannel = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const channel = await Channel.findById(req.params.id);
    if (!channel) return sendError(res, 'NOT_FOUND', 'Channel không tồn tại', 404);
    if (channel.createdBy.toString() !== req.userId)
      return sendError(res, 'FORBIDDEN', 'Chỉ người tạo mới được xóa', 403);

    await Message.deleteMany({ channel: channel._id });
    await channel.deleteOne();
    sendSuccess(res, null);
  } catch (err) { next(err); }
};

export const createOrGetDM = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { workspaceId, targetUserId } = req.body;

    // Tìm DM channel đã tồn tại
    const existing = await Channel.findOne({
      workspace: workspaceId,
      type: 'dm',
      dmUsers: { $all: [req.userId, targetUserId], $size: 2 },
    });

    if (existing) return sendSuccess(res, existing);

    const channel = await Channel.create({
      workspace: workspaceId,
      name: `dm-${Date.now()}`,
      type: 'dm',
      members: [req.userId, targetUserId],
      dmUsers: [req.userId, targetUserId],
      createdBy: req.userId,
    });

    sendSuccess(res, channel, 201);
  } catch (err) { next(err); }
};

export const getChannelKey = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const channel = await Channel.findOne(
      { _id: req.params.id, members: req.userId },
      '+encryptionKey'
    );
    if (!channel?.encryptionKey)
      return sendError(res, 'NOT_FOUND', 'Channel không có encryption key', 404);

    sendSuccess(res, { key: channel.encryptionKey });
  } catch (err) { next(err); }
};
```

### controllers/message.controller.ts

```typescript
import { Request, Response, NextFunction } from 'express';
import { Message } from '../models/Message';
import { Channel } from '../models/Channel';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { encryptMessage, decryptMessage } from '../utils/encryption';

export const getMessages = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { channelId } = req.params;
    const { cursor, limit = 50 } = req.query;

    const isMember = await Channel.exists({ _id: channelId, members: req.userId });
    if (!isMember) return sendError(res, 'FORBIDDEN', 'Không phải member', 403);

    const query: any = { channel: channelId, isDeleted: false };
    if (cursor) query._id = { $lt: cursor };

    const messages = await Message
      .find(query)
      .sort({ _id: -1 })
      .limit(Number(limit) + 1)
      .populate('sender', 'username avatar displayName')
      .populate('replyTo', 'content sender');

    const hasMore = messages.length > Number(limit);
    if (hasMore) messages.pop();

    const nextCursor = hasMore ? messages[messages.length - 1]._id : null;

    // Decrypt nếu channel có encryption
    const channel = await Channel.findById(channelId).select('+encryptionKey');
    let result = messages.reverse();
    if (channel?.encryptionEnabled && channel.encryptionKey) {
      result = result.map(msg => {
        const obj = msg.toObject();
        try {
          obj.content = decryptMessage(obj.content, channel.encryptionKey);
        } catch { /* giữ nguyên nếu decrypt fail */ }
        return obj;
      }) as any;
    }

    sendSuccess(res, { messages: result, nextCursor, hasMore });
  } catch (err) { next(err); }
};

export const sendMessage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { channelId } = req.params;
    const { content, type, replyTo, attachment } = req.body;

    const channel = await Channel.findOne({ _id: channelId, members: req.userId }).select('+encryptionKey');
    if (!channel) return sendError(res, 'FORBIDDEN', 'Không phải member', 403);

    let finalContent = content;
    if (channel.encryptionEnabled && channel.encryptionKey && content) {
      finalContent = encryptMessage(content, channel.encryptionKey);
    }

    const message = await Message.create({
      channel: channelId,
      sender: req.userId,
      content: finalContent,
      type: type || 'text',
      replyTo: replyTo || null,
      attachment,
    });

    await message.populate('sender', 'username avatar displayName');
    if (message.replyTo) await message.populate('replyTo', 'content sender');

    await Channel.findByIdAndUpdate(channelId, {
      lastMessage: message._id,
      lastActivity: new Date(),
    });

    // Trả về content đã decrypt cho người gửi
    const result = message.toObject();
    result.content = content; // original plaintext

    sendSuccess(res, result, 201);
  } catch (err) { next(err); }
};

export const updateMessage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) return sendError(res, 'NOT_FOUND', 'Message không tồn tại', 404);
    if (message.sender.toString() !== req.userId)
      return sendError(res, 'FORBIDDEN', 'Chỉ người gửi mới được sửa', 403);

    message.content = req.body.content;
    message.isEdited = true;
    message.editedAt = new Date();
    await message.save();
    sendSuccess(res, message);
  } catch (err) { next(err); }
};

export const deleteMessage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) return sendError(res, 'NOT_FOUND', 'Message không tồn tại', 404);
    if (message.sender.toString() !== req.userId)
      return sendError(res, 'FORBIDDEN', 'Không có quyền xóa', 403);

    message.isDeleted = true;
    message.content = '';
    await message.save();
    sendSuccess(res, null);
  } catch (err) { next(err); }
};

export const toggleReaction = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { emoji, action } = req.body;
    const message = await Message.findById(req.params.id);
    if (!message) return sendError(res, 'NOT_FOUND', 'Message không tồn tại', 404);

    const reactions = message.reactions || new Map();
    const users = reactions.get(emoji) || [];

    if (action === 'add') {
      if (!users.some((u: any) => u.toString() === req.userId)) {
        users.push(req.userId as any);
      }
    } else {
      const idx = users.findIndex((u: any) => u.toString() === req.userId);
      if (idx > -1) users.splice(idx, 1);
    }

    if (users.length === 0) {
      reactions.delete(emoji);
    } else {
      reactions.set(emoji, users);
    }

    message.reactions = reactions;
    await message.save();

    // Convert Map to plain object for response
    const reactionsObj: Record<string, string[]> = {};
    reactions.forEach((val: any, key: string) => {
      reactionsObj[key] = val.map((v: any) => v.toString());
    });

    sendSuccess(res, { reactions: reactionsObj });
  } catch (err) { next(err); }
};

export const searchMessages = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { q, channelId } = req.query;
    if (!q) return sendSuccess(res, []);

    const query: any = { $text: { $search: q as string }, isDeleted: false };
    if (channelId) query.channel = channelId;

    const messages = await Message.find(query)
      .sort({ score: { $meta: 'textScore' } })
      .limit(20)
      .populate('sender', 'username avatar displayName');

    sendSuccess(res, messages);
  } catch (err) { next(err); }
};
```

### controllers/file.controller.ts

```typescript
import { Request, Response, NextFunction } from 'express';
import { cloudinary } from '../config/cloudinary';
import { sendSuccess, sendError } from '../utils/apiResponse';

export const uploadFile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) return sendError(res, 'VALIDATION_ERROR', 'Không có file', 400);

    const file = req.file as any;
    sendSuccess(res, {
      url: file.path,
      name: file.originalname,
      size: file.size,
      mimeType: file.mimetype,
      publicId: file.filename,
    }, 201);
  } catch (err) { next(err); }
};

export const deleteFile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { publicId } = req.params;
    await cloudinary.uploader.destroy(decodeURIComponent(publicId), { resource_type: 'raw' });
    sendSuccess(res, null);
  } catch (err) { next(err); }
};
```

---

## Routes

### routes/index.ts

```typescript
import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import workspaceRoutes from './workspace.routes';
import channelRoutes from './channel.routes';
import messageRoutes from './message.routes';
import fileRoutes from './file.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/workspaces', workspaceRoutes);
router.use('/channels', channelRoutes);
router.use('/messages', messageRoutes);
router.use('/files', fileRoutes);

export default router;
```

### routes/auth.routes.ts

```typescript
import { Router } from 'express';
import { register, login, logout, refreshTokenHandler, getMe } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', authenticate, logout);
router.post('/refresh-token', refreshTokenHandler);
router.get('/me', authenticate, getMe);

export default router;
```

### routes/user.routes.ts

```typescript
import { Router } from 'express';
import { searchUsers, getUserById, updateProfile } from '../controllers/user.controller';
import { authenticate } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload.middleware';

const router = Router();

router.get('/search', authenticate, searchUsers);
router.get('/:id', authenticate, getUserById);
router.put('/:id', authenticate, upload.single('avatar'), updateProfile);

export default router;
```

### routes/workspace.routes.ts

```typescript
import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
  createWorkspace, getMyWorkspaces, getWorkspaceById,
  updateWorkspace, deleteWorkspace, addMember, removeMember, joinByInvite,
} from '../controllers/workspace.controller';

const router = Router();

router.post('/', authenticate, createWorkspace);
router.get('/', authenticate, getMyWorkspaces);
router.get('/join/:inviteCode', authenticate, joinByInvite);
router.get('/:id', authenticate, getWorkspaceById);
router.put('/:id', authenticate, updateWorkspace);
router.delete('/:id', authenticate, deleteWorkspace);
router.post('/:id/members', authenticate, addMember);
router.delete('/:id/members/:userId', authenticate, removeMember);

export default router;
```

### routes/channel.routes.ts

```typescript
import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
  createChannel, getChannelsByWorkspace, getChannelById,
  updateChannel, deleteChannel, createOrGetDM, getChannelKey,
} from '../controllers/channel.controller';

const router = Router();

router.post('/', authenticate, createChannel);
router.post('/dm', authenticate, createOrGetDM);
router.get('/workspace/:workspaceId', authenticate, getChannelsByWorkspace);
router.get('/:id', authenticate, getChannelById);
router.get('/:id/key', authenticate, getChannelKey);
router.put('/:id', authenticate, updateChannel);
router.delete('/:id', authenticate, deleteChannel);

export default router;
```

### routes/message.routes.ts

```typescript
import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
  getMessages, sendMessage, updateMessage,
  deleteMessage, toggleReaction, searchMessages,
} from '../controllers/message.controller';

const router = Router();

router.get('/search', authenticate, searchMessages);
router.get('/channel/:channelId', authenticate, getMessages);
router.post('/channel/:channelId', authenticate, sendMessage);
router.put('/:id', authenticate, updateMessage);
router.delete('/:id', authenticate, deleteMessage);
router.post('/:id/reactions', authenticate, toggleReaction);

export default router;
```

### routes/file.routes.ts

```typescript
import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload.middleware';
import { uploadFile, deleteFile } from '../controllers/file.controller';

const router = Router();

router.post('/upload', authenticate, upload.single('file'), uploadFile);
router.delete('/:publicId', authenticate, deleteFile);

export default router;
```

---

## Socket.io

### socket/index.ts

```typescript
import { Server } from 'socket.io';
import http from 'http';
import { verifyToken } from '../utils/jwt';
import { registerPresenceHandlers } from './handlers/presence.handler';
import { registerMessageHandlers } from './handlers/message.handler';
import { registerVideoHandlers } from './handlers/video.handler';

declare module 'socket.io' {
  interface Socket {
    userId: string;
  }
}

export const initSocket = (httpServer: http.Server) => {
  const allowedOrigins = (process.env.CLIENT_URLS || 'http://localhost:5173')
    .split(',')
    .map(s => s.trim());

  const io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        // Cho phép LAN
        if (/^http:\/\/(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(origin)) {
          return callback(null, true);
        }
        callback(null, true); // dev mode: cho tất cả
      },
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  // Auth middleware
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) throw new Error('No token');
      const decoded = verifyToken(token);
      socket.userId = decoded.userId;
      next();
    } catch {
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`[Socket] User connected: ${socket.userId} (${socket.id})`);
    socket.join(`user:${socket.userId}`);

    registerPresenceHandlers(io, socket);
    registerMessageHandlers(io, socket);
    registerVideoHandlers(io, socket);
  });

  return io;
};
```

### socket/handlers/presence.handler.ts

```typescript
import { Server, Socket } from 'socket.io';
import { Workspace } from '../../models/Workspace';
import { Channel } from '../../models/Channel';
import { setOnline, setOffline, getOnlineUsers, refreshPresence } from '../../services/presence.service';

export const registerPresenceHandlers = (io: Server, socket: Socket) => {
  const { userId } = socket;

  // Connect → set online
  (async () => {
    await setOnline(userId);
    const workspaces = await Workspace.find({ 'members.user': userId }, '_id');
    for (const ws of workspaces) {
      io.to(`workspace:${ws._id}`).emit('user_status_changed', { userId, status: 'online' });
    }
  })();

  // Join workspace room
  socket.on('join_workspace', async ({ workspaceId }) => {
    const isMember = await Workspace.exists({ _id: workspaceId, 'members.user': userId });
    if (!isMember) return;

    socket.join(`workspace:${workspaceId}`);

    const ws = await Workspace.findById(workspaceId, 'members');
    if (ws) {
      const memberIds = ws.members.map(m => m.user.toString());
      const onlineIds = await getOnlineUsers(memberIds);
      socket.emit('workspace_online_users', { workspaceId, onlineIds });
    }
  });

  // Join/leave channel
  socket.on('join_channel', async ({ channelId }) => {
    const ok = await Channel.exists({ _id: channelId, members: userId });
    if (ok) socket.join(`channel:${channelId}`);
  });

  socket.on('leave_channel', ({ channelId }) => {
    socket.leave(`channel:${channelId}`);
  });

  // Heartbeat
  socket.on('heartbeat', () => refreshPresence(userId));

  // Disconnect
  socket.on('disconnect', async () => {
    console.log(`[Socket] User disconnected: ${userId}`);
    const sockets = await io.in(`user:${userId}`).fetchSockets();
    if (sockets.length === 0) {
      await setOffline(userId);
      const workspaces = await Workspace.find({ 'members.user': userId }, '_id');
      for (const ws of workspaces) {
        io.to(`workspace:${ws._id}`).emit('user_status_changed', {
          userId, status: 'offline', lastSeen: new Date(),
        });
      }
    }
  });
};
```

### socket/handlers/message.handler.ts

```typescript
import { Server, Socket } from 'socket.io';
import { Message } from '../../models/Message';
import { Channel } from '../../models/Channel';

export const registerMessageHandlers = (io: Server, socket: Socket) => {
  const { userId } = socket;

  socket.on('send_message', async (data, callback) => {
    try {
      const { channelId, content, type, replyTo, attachment } = data;

      const channel = await Channel.findOne({ _id: channelId, members: userId });
      if (!channel) return callback?.({ error: 'Not a member' });

      const message = await Message.create({
        channel: channelId,
        sender: userId,
        content, type,
        replyTo: replyTo || null,
        attachment,
      });

      await message.populate('sender', 'username avatar displayName');
      if (message.replyTo) await message.populate('replyTo', 'content sender');

      await Channel.findByIdAndUpdate(channelId, {
        lastMessage: message._id,
        lastActivity: new Date(),
      });

      io.to(`channel:${channelId}`).emit('new_message', { message });
      callback?.({ success: true, message });
    } catch (err: any) {
      callback?.({ error: err.message });
    }
  });

  socket.on('typing_start', ({ channelId }) => {
    socket.to(`channel:${channelId}`).emit('user_typing', {
      userId, username: '', channelId,
    });
  });

  socket.on('typing_stop', ({ channelId }) => {
    socket.to(`channel:${channelId}`).emit('user_stop_typing', { userId, channelId });
  });

  socket.on('mark_read', async ({ channelId, messageId }) => {
    await Message.updateMany(
      { channel: channelId, _id: { $lte: messageId }, 'readBy.user': { $ne: userId } },
      { $push: { readBy: { user: userId } } }
    );
    io.to(`channel:${channelId}`).emit('messages_read', {
      userId, channelId, lastReadMessageId: messageId,
    });
  });
};
```

### socket/handlers/video.handler.ts

```typescript
import { Server, Socket } from 'socket.io';

export const registerVideoHandlers = (io: Server, socket: Socket) => {
  socket.on('call_user', ({ targetUserId, roomId }) => {
    io.to(`user:${targetUserId}`).emit('incoming_call', {
      callerId: socket.userId,
      roomId,
    });
  });

  socket.on('accept_call', ({ callerId, roomId }) => {
    socket.join(`video:${roomId}`);
    io.to(`user:${callerId}`).emit('call_accepted', { userId: socket.userId, roomId });
  });

  socket.on('reject_call', ({ callerId }) => {
    io.to(`user:${callerId}`).emit('call_rejected', { userId: socket.userId });
  });

  socket.on('end_call', ({ roomId }) => {
    io.to(`video:${roomId}`).emit('call_ended', { userId: socket.userId });
    socket.leave(`video:${roomId}`);
  });

  socket.on('webrtc_offer', ({ targetUserId, offer }) => {
    io.to(`user:${targetUserId}`).emit('webrtc_offer', { fromUserId: socket.userId, offer });
  });

  socket.on('webrtc_answer', ({ targetUserId, answer }) => {
    io.to(`user:${targetUserId}`).emit('webrtc_answer', { fromUserId: socket.userId, answer });
  });

  socket.on('webrtc_ice_candidate', ({ targetUserId, candidate }) => {
    io.to(`user:${targetUserId}`).emit('webrtc_ice_candidate', { fromUserId: socket.userId, candidate });
  });
};
```

---

## Services

### services/presence.service.ts

```typescript
import { redis } from '../config/redis';
import { User } from '../models/User';

const ONLINE_TTL = 300; // 5 phút

export const setOnline = async (userId: string) => {
  await redis.set(`presence:${userId}`, 'online', { EX: ONLINE_TTL });
  await User.findByIdAndUpdate(userId, { status: 'online' });
};

export const setOffline = async (userId: string) => {
  await redis.del(`presence:${userId}`);
  await User.findByIdAndUpdate(userId, { status: 'offline', lastSeen: new Date() });
};

export const isOnline = async (userId: string): Promise<boolean> => {
  return !!(await redis.get(`presence:${userId}`));
};

export const getOnlineUsers = async (userIds: string[]): Promise<string[]> => {
  if (!userIds.length) return [];
  const results = await redis.mGet(userIds.map(id => `presence:${id}`));
  return userIds.filter((_, i) => results[i] !== null);
};

export const refreshPresence = async (userId: string) => {
  await redis.expire(`presence:${userId}`, ONLINE_TTL);
};
```

---

## Lệnh chạy Server

```bash
# 1. Tạo thư mục server (nơi riêng, không cùng thư mục client)
mkdir server
cd server

# 2. Copy tất cả code ở trên vào đúng cấu trúc

# 3. Cài dependencies
npm install

# 4. Điền file .env (QUAN TRỌNG: thêm IP client vào CLIENT_URLS)

# 5. Đảm bảo MongoDB và Redis đang chạy
# MongoDB: mongosh (kiểm tra)
# Redis: redis-cli ping (phải ra PONG)

# 6. Chạy server
npm run dev

# Server sẽ chạy tại http://0.0.0.0:3000
# Có thể truy cập từ máy khác qua http://<IP_SERVER>:3000
```

---

**Bắt đầu tạo toàn bộ server ngay bây giờ!**
