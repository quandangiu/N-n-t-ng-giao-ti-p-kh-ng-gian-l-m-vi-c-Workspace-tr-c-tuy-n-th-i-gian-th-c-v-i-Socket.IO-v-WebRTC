import { io, Socket } from 'socket.io-client';
import { SOCKET_URL, HEARTBEAT_INTERVAL_MS } from '../utils/constants';

let socket: Socket | null = null;
let heartbeatTimer: ReturnType<typeof setInterval>;

/**
 * Kết nối socket với server, gửi access token để auth
 */
export const connectSocket = (accessToken: string): Socket => {
  if (socket?.connected) return socket;

  socket = io(SOCKET_URL, {
    auth: { token: accessToken },
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 2000,
    transports: ['websocket'],
  });

  socket.on('connect', () => {
    console.log('[Socket] Connected:', socket!.id);
    // Heartbeat mỗi 4 phút để duy trì presence
    heartbeatTimer = setInterval(() => {
      socket?.emit('heartbeat');
    }, HEARTBEAT_INTERVAL_MS);
  });

  socket.on('disconnect', (reason) => {
    console.log('[Socket] Disconnected:', reason);
    clearInterval(heartbeatTimer);
  });

  socket.on('connect_error', (err) => {
    console.error('[Socket] Connection error:', err.message);
  });

  return socket;
};

/**
 * Ngắt kết nối socket
 */
export const disconnectSocket = (): void => {
  clearInterval(heartbeatTimer);
  socket?.disconnect();
  socket = null;
};

/**
 * Lấy socket instance hiện tại
 */
export const getSocket = (): Socket | null => socket;

/**
 * Join workspace room
 */
export const joinWorkspace = (workspaceId: string): void => {
  socket?.emit('join_workspace', { workspaceId });
};

/**
 * Join channel room
 */
export const joinChannel = (channelId: string): void => {
  socket?.emit('join_channel', { channelId });
};

/**
 * Leave channel room
 */
export const leaveChannel = (channelId: string): void => {
  socket?.emit('leave_channel', { channelId });
};

/**
 * Tham gia kênh thoại (voice channel)
 */
export const joinVoiceChannel = (channelId: string): void => {
  if (!socket) {
    console.warn('[Voice] joinVoiceChannel called but socket is null!');
    return;
  }
  console.log('[Voice] socket.emit join_voice_channel', channelId, 'connected=', socket.connected);
  socket.emit('join_voice_channel', { channelId });
};

/**
 * Rời kênh thoại (voice channel)
 */
export const leaveVoiceChannel = (channelId: string): void => {
  if (!socket) {
    console.warn('[Voice] leaveVoiceChannel called but socket is null!');
    return;
  }
  socket.emit('leave_voice_channel', { channelId });
};
