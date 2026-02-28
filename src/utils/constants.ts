// Utility constants used throughout the app

// Tự động detect URL: nếu có VITE_API_URL thì dùng, 
// không thì dùng VITE_SERVER_IP + VITE_SERVER_PORT,
// fallback cuối cùng là window.location.hostname (IP hiện tại)
const SERVER_IP = import.meta.env.VITE_SERVER_IP || window.location.hostname;
const SERVER_PORT = import.meta.env.VITE_SERVER_PORT || '3000';

export const API_URL = import.meta.env.VITE_API_URL || `http://${SERVER_IP}:${SERVER_PORT}/api`;
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || `http://${SERVER_IP}:${SERVER_PORT}`;

export const MESSAGE_LIMIT = 50;
export const TYPING_DEBOUNCE_MS = 2000;
export const HEARTBEAT_INTERVAL_MS = 4 * 60 * 1000; // 4 minutes
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'text/plain',
  'application/zip',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

export const EMOJI_LIST = ['👍', '❤️', '😂', '😮', '😢', '🔥', '🎉', '👏'];

export const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  {
    urls: 'turn:openrelay.metered.ca:80',
    username: 'openrelayproject',
    credential: 'openrelayproject',
  },
  {
    urls: 'turn:openrelay.metered.ca:443',
    username: 'openrelayproject',
    credential: 'openrelayproject',
  },
  {
    urls: 'turn:openrelay.metered.ca:443?transport=tcp',
    username: 'openrelayproject',
    credential: 'openrelayproject',
  },
];
