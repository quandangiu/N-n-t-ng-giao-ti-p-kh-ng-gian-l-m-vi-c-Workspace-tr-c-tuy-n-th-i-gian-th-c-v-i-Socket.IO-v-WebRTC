# 06 - AUTHENTICATION FLOW
## JWT + Refresh Token + Redis localhost:6379

---

## Kết nối Redis localhost

```typescript
// server/src/config/redis.ts
import { createClient } from 'redis';

export const redis = createClient({ url: 'redis://localhost:6379' });

redis.on('error', (err) => console.error('Redis error:', err));

export const connectRedis = async () => {
  await redis.connect();
  console.log('Redis connected: localhost:6379');
};
```

---

## JWT Utils

```typescript
// server/src/utils/jwt.ts
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

---

## Auth Controller

```typescript
// server/src/controllers/auth.controller.ts
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;
const REFRESH_TTL = 7 * 24 * 60 * 60; // 7 ngày (giây)

export const register = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    const exists = await User.findOne({ $or: [{ email }, { username }] });
    if (exists) return res.status(409).json({ success: false, error: { code: 'CONFLICT', message: 'Email hoặc username đã tồn tại' } });

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await User.create({ username, email, passwordHash });

    const accessToken  = generateAccessToken(user._id.toString());
    const refreshToken = generateRefreshToken(user._id.toString());

    // Lưu refresh token vào Redis (key: refresh:{userId}:{token})
    await redis.set(`refresh:${user._id}:${refreshToken}`, '1', { EX: REFRESH_TTL });

    // Gửi refresh token qua HttpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: false,        // false vì localhost HTTP
      sameSite: 'lax',
      maxAge: REFRESH_TTL * 1000
    });

    res.status(201).json({
      success: true,
      data: { user: { _id: user._id, username, email }, accessToken }
    });
  } catch (err) { next(err); }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+passwordHash');
    if (!user || !(await bcrypt.compare(password, user.passwordHash)))
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Sai email hoặc mật khẩu' } });

    const accessToken  = generateAccessToken(user._id.toString());
    const refreshToken = generateRefreshToken(user._id.toString());

    await redis.set(`refresh:${user._id}:${refreshToken}`, '1', { EX: REFRESH_TTL });
    await User.findByIdAndUpdate(user._id, { status: 'online' });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true, secure: false, sameSite: 'lax', maxAge: REFRESH_TTL * 1000
    });

    res.json({ success: true, data: { user: { _id: user._id, username: user.username, email: user.email, avatar: user.avatar }, accessToken } });
  } catch (err) { next(err); }
};

export const refreshToken = async (req, res, next) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Không có refresh token' } });

    const decoded = verifyRefreshToken(token);
    const exists  = await redis.get(`refresh:${decoded.userId}:${token}`);
    if (!exists) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Refresh token đã bị thu hồi' } });

    const newAccessToken = generateAccessToken(decoded.userId);
    res.json({ success: true, data: { accessToken: newAccessToken } });
  } catch (err) { next(err); }
};

export const logout = async (req, res, next) => {
  try {
    const token = req.cookies.refreshToken;
    if (token) {
      const decoded = verifyRefreshToken(token);
      await redis.del(`refresh:${decoded.userId}:${token}`);
    }
    await User.findByIdAndUpdate(req.userId, { status: 'offline', lastSeen: new Date() });
    res.clearCookie('refreshToken');
    res.json({ success: true });
  } catch (err) { next(err); }
};
```

---

## Auth Middleware

```typescript
// server/src/middleware/auth.middleware.ts
export const authenticate = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer '))
    return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Không có token' } });

  try {
    const decoded = verifyToken(header.split(' ')[1]);
    req.userId = decoded.userId;
    next();
  } catch {
    res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Token không hợp lệ' } });
  }
};
```

---

## .env Server

```env
PORT=3000
MONGO_URI=mongodb://localhost:27017/chatapp
REDIS_URL=redis://localhost:6379
JWT_ACCESS_SECRET=super_secret_access_key_change_this
JWT_REFRESH_SECRET=super_secret_refresh_key_change_this
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

---

## .env Client

```env
VITE_API_URL=http://localhost:3000/api
VITE_SOCKET_URL=http://localhost:3000
```

---

## Client Axios + Auto Refresh

```typescript
// client/src/services/api.ts
import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true // quan trọng: gửi cookie kèm request
});

// Đính kèm access token
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Tự động refresh khi 401
let isRefreshing = false;
let waitQueue: Function[] = [];

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      if (!isRefreshing) {
        isRefreshing = true;
        try {
          const { data } = await axios.post(
            `${import.meta.env.VITE_API_URL}/auth/refresh-token`,
            {},
            { withCredentials: true }
          );
          useAuthStore.getState().setAccessToken(data.data.accessToken);
          waitQueue.forEach(fn => fn(data.data.accessToken));
          waitQueue = [];
        } catch {
          useAuthStore.getState().logout();
          window.location.href = '/login';
        } finally { isRefreshing = false; }
      }
      return new Promise(resolve => {
        waitQueue.push((token: string) => {
          original.headers.Authorization = `Bearer ${token}`;
          resolve(api(original));
        });
      });
    }
    return Promise.reject(error);
  }
);

export default api;
```
