import React, { useEffect, useRef, useState } from 'react';
import { useMessages } from '../../hooks/useMessages';
import { MessageItem } from './MessageItem';
import { TypingIndicator } from './TypingIndicator';
import { useChannelStore } from '../../store/channelStore';
import { ArrowDown, Loader2 } from 'lucide-react';

interface MessageListProps {
  channelId: string;
}

/**
 * Discord-style message list with welcome header and date separators
 */
export const MessageList: React.FC<MessageListProps> = ({ channelId }) => {
  const { messages, hasMore, loading, initialLoad, loadMore } =
    useMessages(channelId);

  const topRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const isAtBottom = useRef(true);
  const [showJumpBtn, setShowJumpBtn] = useState(false);

  const currentChannel = useChannelStore((s) => s.current);
  const typingUsers = useChannelStore((s) => s.getTypingUsers(channelId));

  // Auto scroll to bottom khi có tin mới
  useEffect(() => {
    if (isAtBottom.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]);

  // Scroll to bottom khi load lần đầu
  useEffect(() => {
    if (!initialLoad) {
      bottomRef.current?.scrollIntoView();
    }
  }, [initialLoad]);

  // Track scroll position
  const handleScroll = () => {
    const el = listRef.current;
    if (!el) return;
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    isAtBottom.current = distFromBottom < 100;
    setShowJumpBtn(distFromBottom > 300);
  };

  // IntersectionObserver
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          const el = listRef.current;
          const prevHeight = el?.scrollHeight ?? 0;
          loadMore();
          requestAnimationFrame(() => {
            if (el) {
              el.scrollTop = el.scrollHeight - prevHeight;
            }
          });
        }
      },
      { threshold: 0.1 }
    );
    if (topRef.current) observer.observe(topRef.current);
    return () => observer.disconnect();
  }, [hasMore, loading, loadMore]);

  const jumpToLatest = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (initialLoad) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="relative flex-1 flex flex-col min-h-0">
      <div
        ref={listRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto min-h-0 px-4 py-4 space-y-1 scroll-smooth"
      >
        {/* Top sentinel */}
        <div ref={topRef} className="py-2">
          {loading && (
            <div className="flex items-center justify-center py-2">
              <Loader2 className="animate-spin text-gray-400 dark:text-chat-muted" size={20} />
              <span className="ml-2 text-sm text-gray-400 dark:text-chat-muted">
                Đang tải...
              </span>
            </div>
          )}
        </div>

        {/* Channel welcome header */}
        {!hasMore && messages.length > 0 && currentChannel && (
          <div className="pt-8 pb-4 border-b border-gray-200 dark:border-gray-700 mb-6">
            <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
              <span className="text-3xl font-light text-gray-500 dark:text-gray-300">#</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Welcome to #{currentChannel.name}!
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              This is the start of the{' '}
              <span className="font-semibold text-gray-800 dark:text-gray-200">
                #{currentChannel.name}
              </span>{' '}
              channel.{' '}
              {currentChannel.description || 'Start chatting here!'}
            </p>
          </div>
        )}

        {/* Empty state */}
        {messages.length === 0 && (
          <div className="flex-1 flex items-center justify-center text-gray-400 dark:text-chat-muted">
            <div className="text-center">
              <p className="text-lg">💬</p>
              <p className="text-sm">Chưa có tin nhắn nào</p>
              <p className="text-xs mt-1">Hãy gửi tin nhắn đầu tiên!</p>
            </div>
          </div>
        )}

        {/* Messages */}
        {messages.map((msg, index) => (
          <MessageItem
            key={msg._id}
            message={msg}
            showAvatar={
              index === 0 ||
              messages[index - 1]?.sender._id !== msg.sender._id
            }
          />
        ))}

        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <TypingIndicator usernames={typingUsers} />
        )}

        <div ref={bottomRef} />
      </div>

      {/* Jump to Latest */}
      {showJumpBtn && (
        <button
          onClick={jumpToLatest}
          className="absolute bottom-4 right-4 bg-primary text-white p-2 rounded-full shadow-lg hover:bg-primary-600 transition-colors z-10"
          title="Xuống cuối"
        >
          <ArrowDown size={20} />
        </button>
      )}
    </div>
  );
};
