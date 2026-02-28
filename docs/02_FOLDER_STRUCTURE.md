# 02 - FOLDER STRUCTURE
## Cấu trúc thư mục chi tiết

---

```
chat-app/
├── client/                          # React + Vite + TypeScript
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/                  # shadcn/ui base
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Input.tsx
│   │   │   │   ├── Modal.tsx
│   │   │   │   ├── Avatar.tsx
│   │   │   │   └── Dropdown.tsx
│   │   │   ├── layout/
│   │   │   │   ├── AppLayout.tsx    # Sidebar + main content
│   │   │   │   ├── Sidebar.tsx      # Workspace + channels list
│   │   │   │   └── Header.tsx
│   │   │   ├── workspace/
│   │   │   │   ├── WorkspaceList.tsx
│   │   │   │   └── CreateWorkspaceModal.tsx
│   │   │   ├── channel/
│   │   │   │   ├── ChannelList.tsx
│   │   │   │   ├── ChannelItem.tsx  # Kèm unread badge
│   │   │   │   └── CreateChannelModal.tsx
│   │   │   ├── chat/
│   │   │   │   ├── MessageList.tsx  # Infinite scroll
│   │   │   │   ├── MessageItem.tsx  # Message + reactions
│   │   │   │   ├── MessageInput.tsx # Text + file upload
│   │   │   │   ├── TypingIndicator.tsx
│   │   │   │   ├── ReadReceipt.tsx  # Seen avatars
│   │   │   │   └── EmojiPicker.tsx
│   │   │   └── video/
│   │   │       ├── VideoCallModal.tsx
│   │   │       ├── VideoStream.tsx
│   │   │       └── CallControls.tsx
│   │   │
│   │   ├── pages/
│   │   │   ├── LoginPage.tsx
│   │   │   ├── RegisterPage.tsx
│   │   │   ├── WorkspacePage.tsx    # /workspace/:slug
│   │   │   └── ChannelPage.tsx      # /workspace/:slug/channel/:id
│   │   │
│   │   ├── hooks/
│   │   │   ├── useSocket.ts         # Socket connection
│   │   │   ├── useMessages.ts       # Infinite scroll messages
│   │   │   ├── useTyping.ts         # Debounce typing
│   │   │   ├── useFileUpload.ts
│   │   │   └── useWebRTC.ts         # Video call
│   │   │
│   │   ├── store/                   # Zustand
│   │   │   ├── authStore.ts
│   │   │   ├── workspaceStore.ts
│   │   │   ├── channelStore.ts
│   │   │   ├── messageStore.ts      # Map<channelId, Message[]>
│   │   │   └── uiStore.ts
│   │   │
│   │   ├── socket/
│   │   │   ├── socket.ts            # io() singleton
│   │   │   ├── messageEvents.ts
│   │   │   └── presenceEvents.ts
│   │   │
│   │   ├── services/                # Axios API calls
│   │   │   ├── api.ts               # Axios instance + interceptors
│   │   │   ├── auth.service.ts
│   │   │   ├── workspace.service.ts
│   │   │   ├── channel.service.ts
│   │   │   ├── message.service.ts
│   │   │   └── file.service.ts
│   │   │
│   │   ├── types/
│   │   │   ├── user.types.ts
│   │   │   ├── message.types.ts
│   │   │   └── channel.types.ts
│   │   │
│   │   ├── utils/
│   │   │   ├── encryption.ts
│   │   │   ├── formatDate.ts
│   │   │   └── constants.ts
│   │   │
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── router.tsx
│   │
│   ├── .env                         # VITE_API_URL=http://localhost:3000
│   ├── index.html
│   ├── tailwind.config.ts
│   └── vite.config.ts
│
├── server/
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.ts                # mongoose.connect()
│   │   │   ├── redis.ts             # createClient localhost
│   │   │   └── cloudinary.ts
│   │   │
│   │   ├── models/
│   │   │   ├── User.ts
│   │   │   ├── Workspace.ts
│   │   │   ├── Channel.ts
│   │   │   ├── Message.ts
│   │   │   └── Notification.ts
│   │   │
│   │   ├── controllers/
│   │   │   ├── auth.controller.ts
│   │   │   ├── user.controller.ts
│   │   │   ├── workspace.controller.ts
│   │   │   ├── channel.controller.ts
│   │   │   ├── message.controller.ts
│   │   │   └── file.controller.ts
│   │   │
│   │   ├── routes/
│   │   │   ├── index.ts
│   │   │   ├── auth.routes.ts
│   │   │   ├── user.routes.ts
│   │   │   ├── workspace.routes.ts
│   │   │   ├── channel.routes.ts
│   │   │   ├── message.routes.ts
│   │   │   └── file.routes.ts
│   │   │
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts
│   │   │   ├── validate.middleware.ts
│   │   │   ├── upload.middleware.ts  # multer
│   │   │   └── errorHandler.ts
│   │   │
│   │   ├── socket/
│   │   │   ├── index.ts
│   │   │   └── handlers/
│   │   │       ├── message.handler.ts
│   │   │       ├── presence.handler.ts
│   │   │       └── video.handler.ts
│   │   │
│   │   ├── services/
│   │   │   ├── presence.service.ts  # Redis online status
│   │   │   ├── notification.service.ts
│   │   │   └── upload.service.ts
│   │   │
│   │   └── utils/
│   │       ├── jwt.ts
│   │       ├── bcrypt.ts
│   │       └── apiResponse.ts
│   │
│   ├── server.ts                    # Entry point
│   ├── .env                         # PORT=3000, MONGO_URI=...
│   ├── tsconfig.json
│   └── package.json
│
├── docs/                            # Tất cả file kế hoạch MD
└── README.md
```
