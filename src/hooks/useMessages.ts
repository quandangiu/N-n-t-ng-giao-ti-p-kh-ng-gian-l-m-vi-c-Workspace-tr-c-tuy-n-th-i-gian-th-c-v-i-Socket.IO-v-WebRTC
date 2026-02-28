import { useState, useEffect, useCallback, useRef } from 'react';
import { messageService } from '../services/message.service';
import { useMessageStore } from '../store/messageStore';
import type { Message } from '../types/message.types';

/**
 * Hook quản lý messages cho một channel
 * - Cursor pagination
 * - Load more (infinite scroll)
 * - Add message (từ socket hoặc optimistic)
 * - Update / delete message
 */
export const useMessages = (channelId: string) => {
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const loadingRef = useRef(false);

  const messages = useMessageStore((s) => s.getMessages(channelId));
  const cursor = useMessageStore((s) => s.getCursor(channelId));
  const hasMore = useMessageStore((s) => s.getHasMore(channelId));
  const setMessages = useMessageStore((s) => s.setMessages);
  const prependMessages = useMessageStore((s) => s.prependMessages);

  // Load messages lần đầu khi đổi channel
  useEffect(() => {
    const load = async () => {
      setInitialLoad(true);
      setLoading(true);
      loadingRef.current = true;

      try {
        const data = await messageService.getByChannel(channelId);
        setMessages(channelId, data.messages, data.nextCursor, data.hasMore);
      } catch (err) {
        console.error('[useMessages] Load error:', err);
      } finally {
        setLoading(false);
        setInitialLoad(false);
        loadingRef.current = false;
      }
    };

    load();
  }, [channelId, setMessages]);

  // Load thêm messages cũ
  const loadMore = useCallback(async () => {
    if (loadingRef.current || !hasMore || !cursor) return;

    setLoading(true);
    loadingRef.current = true;

    try {
      const data = await messageService.getByChannel(channelId, cursor);
      prependMessages(channelId, data.messages, data.nextCursor, data.hasMore);
    } catch (err) {
      console.error('[useMessages] LoadMore error:', err);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [channelId, cursor, hasMore, prependMessages]);

  // Gửi tin nhắn optimistic  
  const sendMessage = useCallback(
    async (content: string, type: 'text' | 'image' | 'file' = 'text', attachment?: Message['attachment'], replyTo?: string) => {
      const tempId = `temp_${Date.now()}`;
      const user = useMessageStore.getState(); // for optimistic

      // Tạo message tạm
      const tempMsg: Message = {
        _id: tempId,
        channel: channelId,
        sender: {
          _id: '',
          username: '',
          avatar: null,
        },
        content,
        type,
        attachment,
        replyTo: replyTo ? { _id: replyTo, content: '', sender: { _id: '', username: '' } } : null,
        reactions: {},
        readBy: [],
        isEdited: false,
        isDeleted: false,
        isPending: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      useMessageStore.getState().addOptimistic(channelId, tempMsg);

      try {
        const realMsg = await messageService.send(channelId, {
          content,
          type,
          replyTo: replyTo || null,
          attachment,
        });
        useMessageStore.getState().confirmOptimistic(channelId, tempId, realMsg);
        return realMsg;
      } catch (err) {
        useMessageStore.getState().removeOptimistic(channelId, tempId);
        throw err;
      }
    },
    [channelId]
  );

  return {
    messages,
    hasMore,
    loading,
    initialLoad,
    loadMore,
    sendMessage,
  };
};
