# 13 - SETUP & RUN LOCALHOST
## Hướng dẫn cài đặt và chạy từ đầu đến cuối

---

## 1. Cài đặt Prerequisites

### Node.js
```
Tải tại: https://nodejs.org  (chọn LTS)
Kiểm tra: node -v  → >= 18
```

### MongoDB Community
```
Windows: https://www.mongodb.com/try/download/community
         → Download MSI → cài → tick "Install MongoDB as a Service"
         → MongoDB tự chạy khi khởi động Windows

macOS:   brew tap mongodb/brew && brew install mongodb-community
         brew services start mongodb/brew/mongodb-community

Kiểm tra: mongosh   (gõ exit để thoát)
```

### Redis
```
Windows: Cài WSL2 → trong WSL: sudo apt install redis
         Hoặc dùng Memurai (Redis for Windows): https://www.memurai.com

macOS:   brew install redis && brew services start redis

Kiểm tra: redis-cli ping  → phải ra PONG
```

### Cloudinary (miễn phí)
```
1. Đăng ký: https://cloudinary.com/users/register/free
2. Vào Dashboard → copy: Cloud Name, API Key, API Secret
```

---

## 2. Clone và cài packages

```bash
git clone <repo-url>
cd chat-app

# Cài server
cd server
npm install

# Cài client
cd ../client
npm install
```

---

## 3. Tạo file .env

### server/.env
```env
PORT=3000
MONGO_URI=mongodb://localhost:27017/chatapp
REDIS_URL=redis://localhost:6379
JWT_ACCESS_SECRET=change_this_to_random_string_64chars
JWT_REFRESH_SECRET=change_this_to_another_random_string
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

### client/.env
```env
VITE_API_URL=http://localhost:3000/api
VITE_SOCKET_URL=http://localhost:3000
```

---

## 4. Chạy ứng dụng

Mở **3 terminal riêng biệt**:

### Terminal 1 — Redis
```bash
# Windows (WSL)
redis-server

# macOS (nếu chưa start service)
redis-server
```

### Terminal 2 — Server
```bash
cd server
npm run dev
# Server chạy tại http://localhost:3000
```

### Terminal 3 — Client
```bash
cd client
npm run dev
# Client chạy tại http://localhost:5173
```

Mở trình duyệt: **http://localhost:5173**

---

## 5. package.json scripts

### server/package.json
```json
{
  "scripts": {
    "dev":   "tsx watch src/server.ts",
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
    "zod": "^3.22.4"
  },
  "devDependencies": {
    "tsx": "^4.0.0",
    "typescript": "^5.0.0",
    "@types/express": "^4.17.21",
    "@types/bcrypt": "^5.0.2",
    "@types/jsonwebtoken": "^9.0.5",
    "@types/multer": "^1.4.11",
    "@types/crypto-js": "^4.2.1",
    "@types/cors": "^2.8.17",
    "@types/cookie-parser": "^1.4.6"
  }
}
```

### client/package.json
```json
{
  "scripts": {
    "dev":   "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "socket.io-client": "^4.6.1",
    "axios": "^1.6.0",
    "zustand": "^4.4.6",
    "@tanstack/react-query": "^5.8.4",
    "simple-peer": "^9.11.1",
    "crypto-js": "^4.2.0",
    "date-fns": "^2.30.0",
    "tailwindcss": "^3.3.5",
    "clsx": "^2.0.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.38",
    "@types/react-dom": "^18.2.17",
    "@types/simple-peer": "^9.11.8",
    "@types/crypto-js": "^4.2.1",
    "@vitejs/plugin-react": "^4.1.1",
    "typescript": "^5.0.0",
    "vite": "^5.0.0"
  }
}
```

---

## 6. server/src/server.ts (Entry point)

```typescript
import express from 'express';
import http from 'http';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { connectDB } from './config/db';
import { connectRedis } from './config/redis';
import { initSocket } from './socket';
import routes from './routes';

dotenv.config();

const app = express();
const server = http.createServer(app);

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use('/api', routes);

const io = initSocket(server);

const start = async () => {
  await connectDB();
  await connectRedis();
  server.listen(process.env.PORT || 3000, () => {
    console.log(`Server: http://localhost:${process.env.PORT || 3000}`);
  });
};

start();
```

---

## 7. Kiểm tra hoạt động

```bash
# Test server health
curl http://localhost:3000/api/health

# Test register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@test.com","password":"Test123!"}'
```
