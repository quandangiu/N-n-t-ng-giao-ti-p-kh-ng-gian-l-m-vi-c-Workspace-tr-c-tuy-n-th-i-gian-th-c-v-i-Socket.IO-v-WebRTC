# Chat Realtime - React Application

A modern real-time chat application built with React, featuring voice channels, video calls, file uploads, message encryption, and WebRTC support.

## 📋 Project Overview

This project is a comprehensive chat platform with real-time synchronization using Socket.io, featuring:

- **Real-time Messaging** - Instant message delivery with read receipts
- **Voice Channels** - Voice communication support
- **Video Calls** - WebRTC video calling capabilities
- **File Uploads** - Secure file sharing via Cloudinary
- **Message Encryption** - End-to-end message encryption
- **User Authentication** - Secure login and registration
- **Typing Indicators** - Real-time typing status
- **Workspace Management** - Multi-workspace support
- **Channel Management** - Create and manage chat channels

## 🚀 Quick Start

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd "Chat Realtime"
   ```

2. **Setup environment variables**
   ```bash
   # Copy the template
   cp .env.example .env
   
   # Edit .env with your configuration
   # For local development: use localhost
   # For network access: use your machine's LAN IP (e.g., 192.168.1.7)
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Build for production**
   ```bash
   npm run build
   ```

## 📁 Project Structure

```
├── docs/                           # Comprehensive documentation
│   ├── 00_AGENT_MASTER_PROMPT.md  # Project guidelines
│   ├── 01_PROJECT_OVERVIEW.md     # Feature overview
│   ├── 02_FOLDER_STRUCTURE.md     # Directory structure
│   ├── 03_DATABASE_SCHEMA.md      # Database structure
│   ├── 04_API_ENDPOINTS.md        # API documentation
│   ├── 05_SOCKET_EVENTS.md        # Socket.io events
│   ├── 06_AUTHENTICATION_FLOW.md  # Auth system
│   ├── 07_REALTIME_ARCHITECTURE.md # Real-time sync
│   ├── 08_FILE_UPLOAD_FLOW.md     # File handling
│   ├── 09_WEBRTC_VIDEO_CALL.md    # Video calls
│   ├── 10_MESSAGE_ENCRYPTION.md   # Encryption system
│   ├── 11_INFINITE_SCROLL.md      # Message loading
│   ├── 12_STATE_MANAGEMENT.md     # State (Zustand)
│   ├── 13_SETUP_LOCALHOST.md      # Local setup guide
│   ├── 14_DEVELOPMENT_PHASES.md   # Development plan
│   ├── 15_CV_SHOWCASE.md          # Portfolio features
│   ├── 16_VOICE_CHANNEL_SERVER.md # Voice server config
│   ├── 17_VOICE_SYNC_FIX.md       # Voice sync issues
│   ├── 18_VOICE_DEBUG_SESSION.md  # Voice debugging
│   ├── 19_FEATURE_COMPLETION_TASKS.md # Task list
│   └── SERVER_PROMPT.md           # Backend docs
│
├── src/
│   ├── components/                # React components
│   │   ├── channel/              # Channel components
│   │   ├── chat/                 # Chat components
│   │   ├── layout/               # Layout components
│   │   ├── ui/                   # Reusable UI elements
│   │   ├── video/                # Video call components
│   │   ├── voice/                # Voice components
│   │   └── workspace/            # Workspace components
│   │
│   ├── pages/                    # Page components
│   │   ├── ChannelPage.tsx
│   │   ├── JoinInvitePage.tsx
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   └── WorkspacePage.tsx
│   │
│   ├── hooks/                    # Custom React hooks
│   │   ├── useFileUpload.ts
│   │   ├── useMessages.ts
│   │   ├── useSocket.ts
│   │   ├── useTyping.ts
│   │   ├── useVoiceChannel.ts
│   │   └── useWebRTC.ts
│   │
│   ├── services/                 # API and service layers
│   │   ├── api.ts
│   │   ├── auth.service.ts
│   │   ├── channel.service.ts
│   │   ├── file.service.ts
│   │   ├── message.service.ts
│   │   ├── user.service.ts
│   │   └── workspace.service.ts
│   │
│   ├── socket/                   # Socket.io event handlers
│   │   ├── socket.ts
│   │   ├── messageEvents.ts
│   │   ├── presenceEvents.ts
│   │   └── voiceChannelEvents.ts
│   │
│   ├── store/                    # Zustand state management
│   │   ├── authStore.ts
│   │   ├── channelStore.ts
│   │   ├── messageStore.ts
│   │   ├── uiStore.ts
│   │   ├── voiceStore.ts
│   │   └── workspaceStore.ts
│   │
│   ├── types/                    # TypeScript type definitions
│   │   ├── api.types.ts
│   │   ├── channel.types.ts
│   │   ├── message.types.ts
│   │   ├── user.types.ts
│   │   └── workspace.types.ts
│   │
│   ├── utils/                    # Utility functions
│   │   ├── cloudinary.ts         # Image upload integration
│   │   ├── constants.ts          # App constants
│   │   ├── encryption.ts         # Message encryption
│   │   └── formatDate.ts         # Date formatting
│   │
│   ├── context/                  # React context
│   │   └── VoiceContext.tsx
│   │
│   ├── App.tsx                   # Root component
│   ├── main.tsx                  # Entry point
│   ├── router.tsx                # Route configuration
│   └── index.css                 # Global styles
│
├── .env.example                  # Environment template
├── .gitignore                    # Git ignore rules
├── package.json                  # Dependencies
├── tsconfig.json                 # TypeScript config
├── tailwind.config.ts            # Tailwind CSS config
├── postcss.config.js             # PostCSS config
├── vite.config.ts                # Vite build config
└── index.html                    # HTML entry point
```

## 🔧 Environment Variables

Create a `.env` file based on `.env.example`:

```env
# Server Configuration
VITE_SERVER_IP=localhost           # Or your machine's IP (e.g., 192.168.1.7)
VITE_SERVER_PORT=3000

# API URLs
VITE_API_URL=http://localhost:3000/api
VITE_SOCKET_URL=http://localhost:3000
```

### Network Access
- **Localhost only**: Use `localhost`
- **LAN access**: Use your machine's IP (e.g., `192.168.1.7`)
- **Get your IP**: Run `ipconfig` (Windows) or `ifconfig` (Linux/Mac)

## 📚 Documentation

All documentation is in the `docs/` folder. Key documents:

1. **[01_PROJECT_OVERVIEW.md](docs/01_PROJECT_OVERVIEW.md)** - Features and architecture
2. **[02_FOLDER_STRUCTURE.md](docs/02_FOLDER_STRUCTURE.md)** - Detailed folder descriptions
3. **[04_API_ENDPOINTS.md](docs/04_API_ENDPOINTS.md)** - API reference
4. **[05_SOCKET_EVENTS.md](docs/05_SOCKET_EVENTS.md)** - Real-time events
5. **[13_SETUP_LOCALHOST.md](docs/13_SETUP_LOCALHOST.md)** - Detailed local development guide

## 🛠️ Technology Stack

- **Frontend Framework**: React 18
- **Styling**: Tailwind CSS
- **Build Tool**: Vite
- **Language**: TypeScript
- **State Management**: Zustand
- **Real-time**: Socket.io
- **Video/Voice**: WebRTC
- **File Upload**: Cloudinary
- **Encryption**: crypto-js
- **HTTP Client**: Axios

## 📝 Available Scripts

```bash
# Development server with hot reload
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code (if configured)
npm run lint
```

## 🔒 Security Features

- User authentication with JWT
- Message encryption for privacy
- Secure password hashing
- CORS protection
- WebRTC peer-to-peer video calls

## 🐛 Debugging & Troubleshooting

### Common Issues

**Cannot connect to server:**
- Check if backend server is running on the configured port
- Verify `VITE_SERVER_IP` and `VITE_SERVER_PORT` in `.env`
- For network access, ensure firewall allows connections

**WebRTC Issues:**
- Check WebRTC server configuration
- Ensure STUN/TURN servers are reachable
- See [09_WEBRTC_VIDEO_CALL.md](docs/09_WEBRTC_VIDEO_CALL.md)

**Voice Channel Issues:**
- Refer to [16_VOICE_CHANNEL_SERVER.md](docs/16_VOICE_CHANNEL_SERVER.md)
- Check [17_VOICE_SYNC_FIX.md](docs/17_VOICE_SYNC_FIX.md) for known issues

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/amazing-feature`
2. Commit changes: `git commit -m 'Add amazing feature'`
3. Push to branch: `git push origin feature/amazing-feature`
4. Open a Pull Request

## 📄 Git Configuration

### Files Tracked
- `src/` - Application source code
- `docs/` - Documentation
- `.env.example` - Environment template
- `package.json` - Dependencies manifest
- Configuration files (Vite, TypeScript, Tailwind, PostCSS)

### Files Ignored
- `node_modules/` - Dependencies (regenerated with `npm install`)
- `dist/` - Build output
- `.env` - Local configuration (use `.env.example` as template)

### Clone and Setup Flow

```bash
git clone <repository-url>
cd "Chat Realtime"
cp .env.example .env           # Create local .env
# Edit .env with your settings
npm install                     # Install dependencies
npm run dev                     # Start development server
```

## 🚀 Deployment

See [14_DEVELOPMENT_PHASES.md](docs/14_DEVELOPMENT_PHASES.md) for deployment guidelines.

## 📞 Support

For detailed information about specific features:
- Check relevant documentation in `docs/` folder
- Review TypeScript types in `src/types/`
- Check service implementations in `src/services/`

## 📊 Project Status

**Version**: 1.0.0  
**Last Updated**: February 2026  
**Status**: Active Development

See [19_FEATURE_COMPLETION_TASKS.md](docs/19_FEATURE_COMPLETION_TASKS.md) for current tasks and progress.

---

**Made with ❤️ for real-time communication**


# N?n t?ng giao ti?p kh�ng gian l�m vi?c Workspace tr?c tuy?n th?i gian th?c v?i Socket.IO v� WebRTC
