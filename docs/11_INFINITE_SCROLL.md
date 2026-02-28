# 11 - INFINITE SCROLL
## Cursor Pagination + IntersectionObserver

---

## Server — Cursor Pagination

```typescript
// server/src/controllers/message.controller.ts
export const getMessages = async (req, res) => {
  const { channelId } = req.params;
  const { cursor, limit = 50 } = req.query;

  // Verify member
  const isMember = await Channel.exists({ _id: channelId, members: req.userId });
  if (!isMember) return res.status(403).json({ success: false });

  const query: any = { channel: channelId, isDeleted: false };

  // Cursor: lấy messages CŨ HƠN cursor (_id nhỏ hơn)
  if (cursor) query._id = { $lt: cursor };

  const messages = await Message
    .find(query)
    .sort({ _id: -1 })        // newest first
    .limit(Number(limit) + 1) // lấy dư 1 để biết còn data không
    .populate('sender', 'username avatar displayName')
    .populate('replyTo', 'content sender');

  const hasMore = messages.length > Number(limit);
  if (hasMore) messages.pop(); // bỏ phần tử dư

  const nextCursor = hasMore ? messages[messages.length - 1]._id : null;

  res.json({
    success: true,
    data: {
      messages: messages.reverse(), // trả về old → new cho client
      nextCursor,
      hasMore
    }
  });
};
```

---

## Client — useMessages Hook

```typescript
// client/src/hooks/useMessages.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';
import { Message } from '../types/message.types';

export const useMessages = (channelId: string) => {
  const [messages, setMessages]   = useState<Message[]>([]);
  const [cursor, setCursor]       = useState<string | null>(null);
  const [hasMore, setHasMore]     = useState(true);
  const [loading, setLoading]     = useState(false);
  const [initialLoad, setInitial] = useState(true);

  // Load lần đầu hoặc khi đổi channel
  useEffect(() => {
    setMessages([]);
    setCursor(null);
    setHasMore(true);
    setInitial(true);
    loadMessages(null, true);
  }, [channelId]);

  const loadMessages = useCallback(async (cursorId: string | null, isFirst = false) => {
    if (loading || (!hasMore && !isFirst)) return;
    setLoading(true);
    try {
      const params: any = { limit: 50 };
      if (cursorId) params.cursor = cursorId;

      const { data } = await api.get(`/messages/channel/${channelId}`, { params });
      const { messages: newMsgs, nextCursor, hasMore: more } = data.data;

      setMessages(prev => isFirst ? newMsgs : [...newMsgs, ...prev]); // prepend khi load more
      setCursor(nextCursor);
      setHasMore(more);
    } finally {
      setLoading(false);
      if (isFirst) setInitial(false);
    }
  }, [channelId, loading, hasMore]);

  const loadMore = useCallback(() => {
    if (cursor) loadMessages(cursor);
  }, [cursor, loadMessages]);

  // Thêm tin nhắn mới (từ socket)
  const addMessage = useCallback((msg: Message) => {
    setMessages(prev => [...prev, msg]);
  }, []);

  // Cập nhật message (edit/delete/reaction)
  const updateMessage = useCallback((msgId: string, updates: Partial<Message>) => {
    setMessages(prev => prev.map(m => m._id === msgId ? { ...m, ...updates } : m));
  }, []);

  return { messages, hasMore, loading, initialLoad, loadMore, addMessage, updateMessage };
};
```

---

## Client — MessageList với IntersectionObserver

```typescript
// client/src/components/chat/MessageList.tsx
import { useEffect, useRef } from 'react';

export const MessageList = ({ channelId }) => {
  const { messages, hasMore, loading, loadMore, addMessage } = useMessages(channelId);

  const topRef    = useRef<HTMLDivElement>(null); // sentinel ở đầu list
  const bottomRef = useRef<HTMLDivElement>(null); // auto scroll to bottom
  const listRef   = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom khi có tin mới (chỉ khi đang ở bottom)
  const isAtBottom = useRef(true);
  useEffect(() => {
    if (isAtBottom.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]);

  // Theo dõi scroll position
  const handleScroll = () => {
    const el = listRef.current;
    if (!el) return;
    isAtBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
  };

  // IntersectionObserver: khi sentinel top vào viewport → load more
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          // Lưu scroll position trước khi prepend
          const el = listRef.current;
          const prevHeight = el?.scrollHeight ?? 0;

          loadMore();

          // Sau khi render, restore scroll position
          requestAnimationFrame(() => {
            if (el) el.scrollTop = el.scrollHeight - prevHeight;
          });
        }
      },
      { threshold: 0.1 }
    );

    if (topRef.current) observer.observe(topRef.current);
    return () => observer.disconnect();
  }, [hasMore, loading, loadMore]);

  // Lắng nghe socket new_message
  useEffect(() => {
    const socket = getSocket();
    socket?.on('new_message', ({ message }) => {
      if (message.channel === channelId) addMessage(message);
    });
    return () => { socket?.off('new_message'); };
  }, [channelId, addMessage]);

  return (
    <div ref={listRef} onScroll={handleScroll}
      className="flex-1 overflow-y-auto flex flex-col p-4 gap-1">

      {/* Sentinel + loading indicator */}
      <div ref={topRef} className="py-2">
        {loading && <p className="text-center text-sm text-gray-400">Đang tải...</p>}
        {!hasMore && <p className="text-center text-sm text-gray-400">Đã tải hết tin nhắn</p>}
      </div>

      {messages.map(msg => (
        <MessageItem key={msg._id} message={msg} />
      ))}

      <div ref={bottomRef} />
    </div>
  );
};
```

---

## "Jump to Latest" Button

```typescript
// Hiện button khi user scroll lên quá xa
const [showJumpBtn, setShowJumpBtn] = useState(false);

const handleScroll = () => {
  const el = listRef.current;
  if (!el) return;
  const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
  setShowJumpBtn(distFromBottom > 500);
};

// Trong JSX
{showJumpBtn && (
  <button
    onClick={() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' })}
    className="absolute bottom-20 right-6 bg-blue-500 text-white px-4 py-2 rounded-full shadow">
    ↓ Tin nhắn mới
  </button>
)}
```
