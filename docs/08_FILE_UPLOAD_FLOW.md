# 08 - FILE UPLOAD FLOW
## Multer + Cloudinary (free tier)

---

## Cloudinary Config

```typescript
// server/src/config/cloudinary.ts
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

export { cloudinary };
```

---

## Multer Middleware

```typescript
// server/src/middleware/upload.middleware.ts
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { cloudinary } from '../config/cloudinary';

const ALLOWED_TYPES = [
  'image/jpeg','image/png','image/gif','image/webp',
  'application/pdf','text/plain',
  'application/zip',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: file.mimetype.startsWith('image/') ? 'chat/images' : 'chat/files',
    resource_type: file.mimetype.startsWith('image/') ? 'image' : 'raw',
    public_id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  })
});

export const upload = multer({
  storage,
  limits: { fileSize: MAX_SIZE },
  fileFilter: (_req, file, cb) => {
    ALLOWED_TYPES.includes(file.mimetype) ? cb(null, true) : cb(new Error('Loại file không được hỗ trợ'));
  }
});
```

---

## File Controller

```typescript
// server/src/controllers/file.controller.ts
export const uploadFile = async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, error: { message: 'Không có file' } });

  const file = req.file as any;
  res.status(201).json({
    success: true,
    data: {
      url:      file.path,        // Cloudinary secure URL
      name:     file.originalname,
      size:     file.size,
      mimeType: file.mimetype,
      publicId: file.filename     // Cloudinary public_id
    }
  });
};

export const deleteFile = async (req, res) => {
  const { publicId } = req.params;
  await cloudinary.uploader.destroy(decodeURIComponent(publicId), { resource_type: 'raw' });
  res.json({ success: true });
};
```

---

## File Route

```typescript
// server/src/routes/file.routes.ts
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

## Client — useFileUpload Hook

```typescript
// client/src/hooks/useFileUpload.ts
import { useState, useRef } from 'react';
import api from '../services/api';

export const useFileUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const validate = (file: File) => {
    if (file.size > 10 * 1024 * 1024) throw new Error('File phải nhỏ hơn 10MB');
    const allowed = ['image/jpeg','image/png','image/gif','image/webp','application/pdf'];
    if (!allowed.includes(file.type)) throw new Error('Loại file không hỗ trợ');
  };

  const upload = async (file: File) => {
    validate(file);
    const form = new FormData();
    form.append('file', file);

    setUploading(true);
    setProgress(0);
    try {
      const { data } = await api.post('/files/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => e.total && setProgress(Math.round(e.loaded / e.total * 100))
      });
      return data.data; // { url, name, size, mimeType, publicId }
    } finally {
      setUploading(false);
    }
  };

  return { upload, uploading, progress };
};
```

---

## Client — MessageInput với File Upload

```typescript
// Trong MessageInput.tsx
const { upload, uploading, progress } = useFileUpload();

const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;
  try {
    const attachment = await upload(file);
    // Gửi message với attachment
    socket.emit('send_message', {
      channelId,
      content: '',
      type: file.type.startsWith('image/') ? 'image' : 'file',
      attachment
    });
  } catch (err) {
    toast.error(err.message);
  }
};
```

---

## Hiển thị ảnh tối ưu (Cloudinary URL transform)

```typescript
// utils/cloudinary.ts
export const thumbnail = (url: string) =>
  url.replace('/upload/', '/upload/w_300,h_300,c_fill,q_auto,f_auto/');

export const preview = (url: string, w = 800) =>
  url.replace('/upload/', `/upload/w_${w},q_auto,f_auto/`);

// Dùng:
<img src={thumbnail(msg.attachment.url)} onClick={() => setLightbox(msg.attachment.url)} />
```
