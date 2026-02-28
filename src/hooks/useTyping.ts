import { useRef, useCallback } from 'react';
import { getSocket } from '../socket/socket';
import { TYPING_DEBOUNCE_MS } from '../utils/constants';

/**
 * Hook quản lý typing indicator
 * - Gửi typing_start khi user gõ
 * - Gửi typing_stop sau 2s không gõ (debounce)
 */
export const useTyping = (channelId: string) => {
  const typingRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const startTyping = useCallback(() => {
    const socket = getSocket();
    if (!socket) return;

    // Chỉ gửi typing_start nếu chưa đang typing
    if (!typingRef.current) {
      typingRef.current = true;
      socket.emit('typing_start', { channelId });
    }

    // Reset timer
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      typingRef.current = false;
      socket.emit('typing_stop', { channelId });
    }, TYPING_DEBOUNCE_MS);
  }, [channelId]);

  const stopTyping = useCallback(() => {
    const socket = getSocket();
    if (!socket) return;

    if (typingRef.current) {
      typingRef.current = false;
      clearTimeout(timerRef.current);
      socket.emit('typing_stop', { channelId });
    }
  }, [channelId]);

  return { startTyping, stopTyping };
};
