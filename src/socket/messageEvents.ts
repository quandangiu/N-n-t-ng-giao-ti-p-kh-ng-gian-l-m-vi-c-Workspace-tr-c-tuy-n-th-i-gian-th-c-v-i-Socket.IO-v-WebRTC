import { getSocket } from './socket';
import { useMessageStore } from '../store/messageStore';
import { useChannelStore } from '../store/channelStore';
import { useAuthStore } from '../store/authStore';
import type { Message } from '../types/message.types';

/**
 * Đăng ký tất cả socket events liên quan đến message
 */
export const registerMessageEvents = (): (() => void) => {
  const socket = getSocket();
  if (!socket) return () => {};

  const currentUserId = useAuthStore.getState().user?._id;

  // Nhận tin nhắn mới
  const handleNewMessage = ({ message }: { message: Message }) => {
    useMessageStore.getState().addMessage(message.channel, message);

    // Increment unread nếu không phải tin nhắn của mình
    if (message.sender._id !== currentUserId) {
      useChannelStore.getState().incrementUnread(message.channel);
    }
  };

  // Tin nhắn được sửa
  const handleMessageUpdated = ({
    messageId,
    channelId,
    content,
  }: {
    messageId: string;
    channelId: string;
    content: string;
  }) => {
    useMessageStore
      .getState()
      .updateMessage(channelId, messageId, { content, isEdited: true });
  };

  // Tin nhắn bị xóa
  const handleMessageDeleted = ({
    messageId,
    channelId,
  }: {
    messageId: string;
    channelId: string;
  }) => {
    useMessageStore.getState().deleteMessage(channelId, messageId);
  };

  // Reaction được cập nhật
  const handleReactionUpdated = ({
    messageId,
    channelId,
    reactions,
  }: {
    messageId: string;
    channelId: string;
    reactions: Record<string, string[]>;
  }) => {
    useMessageStore.getState().updateReactions(channelId, messageId, reactions);
  };

  // User đang gõ
  const handleUserTyping = ({
    userId,
    username,
    channelId,
  }: {
    userId: string;
    username: string;
    channelId: string;
  }) => {
    if (userId !== currentUserId) {
      useChannelStore.getState().setTyping(channelId, userId, username, true);
    }
  };

  // User ngừng gõ
  const handleUserStopTyping = ({
    userId,
    channelId,
  }: {
    userId: string;
    channelId: string;
  }) => {
    useChannelStore.getState().setTyping(channelId, userId, '', false);
  };

  // Tin nhắn được đọc
  const handleMessagesRead = ({
    userId,
    channelId,
  }: {
    userId: string;
    channelId: string;
    lastReadMessageId: string;
  }) => {
    // Có thể update readBy trên UI nếu cần
    console.log(`[Socket] User ${userId} read messages in channel ${channelId}`);
  };

  socket.on('new_message', handleNewMessage);
  socket.on('message_updated', handleMessageUpdated);
  socket.on('message_deleted', handleMessageDeleted);
  socket.on('reaction_updated', handleReactionUpdated);
  socket.on('user_typing', handleUserTyping);
  socket.on('user_stop_typing', handleUserStopTyping);
  socket.on('messages_read', handleMessagesRead);

  // Cleanup function
  return () => {
    socket.off('new_message', handleNewMessage);
    socket.off('message_updated', handleMessageUpdated);
    socket.off('message_deleted', handleMessageDeleted);
    socket.off('reaction_updated', handleReactionUpdated);
    socket.off('user_typing', handleUserTyping);
    socket.off('user_stop_typing', handleUserStopTyping);
    socket.off('messages_read', handleMessagesRead);
  };
};
