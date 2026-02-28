import { useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '../store/authStore';
import { connectSocket, disconnectSocket, getSocket } from '../socket/socket';
import { registerMessageEvents } from '../socket/messageEvents';
import { registerPresenceEvents } from '../socket/presenceEvents';
import { registerVoiceChannelEvents } from '../socket/voiceChannelEvents';

/**
 * Hook quản lý kết nối Socket.io
 * - Tự connect khi có accessToken
 * - Tự disconnect khi logout
 * - Đăng ký message + presence events
 */
export const useSocket = () => {
  const accessToken = useAuthStore((s) => s.accessToken);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const cleanupRef = useRef<(() => void)[]>([]);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      disconnectSocket();
      return;
    }

    const socket = connectSocket(accessToken);

    // Đăng ký events khi connect thành công
    const onConnect = () => {
      cleanupRef.current.forEach((fn) => fn());
      cleanupRef.current = [];

      const cleanupMessage = registerMessageEvents();
      const cleanupPresence = registerPresenceEvents();
      const cleanupVoice = registerVoiceChannelEvents();
      cleanupRef.current.push(cleanupMessage, cleanupPresence, cleanupVoice);
    };

    if (socket.connected) {
      onConnect();
    }
    socket.on('connect', onConnect);

    return () => {
      socket.off('connect', onConnect);
      cleanupRef.current.forEach((fn) => fn());
      cleanupRef.current = [];
      disconnectSocket();
    };
  }, [isAuthenticated, accessToken]);

  const emit = useCallback(
    (event: string, data?: unknown) => {
      const socket = getSocket();
      socket?.emit(event, data);
    },
    []
  );

  return { socket: getSocket(), emit };
};
