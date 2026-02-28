import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useChannelStore } from '../store/channelStore';
import { channelService } from '../services/channel.service';
import { joinChannel, leaveChannel } from '../socket/socket';
import { getSocket } from '../socket/socket';
import { MessageList } from '../components/chat/MessageList';
import { MessageInput } from '../components/chat/MessageInput';
import { VideoCallModal } from '../components/video/VideoCallModal';
import { useUIStore } from '../store/uiStore';
import { useMessages } from '../hooks/useMessages';
import { cacheChannelKey, getChannelKey } from '../utils/encryption';
import type { Attachment } from '../types/message.types';
import { Loader2 } from 'lucide-react';

export const ChannelPage: React.FC = () => {
  const { channelId } = useParams<{ channelId: string }>();
  const { current, setCurrent } = useChannelStore();
  const videoCallOpen = useUIStore((s) => s.videoCallModalOpen);

  // Load channel info
  useEffect(() => {
    if (!channelId) return;

    const load = async () => {
      try {
        const ch = await channelService.getById(channelId);
        setCurrent(ch);

        // Join socket room
        joinChannel(channelId);

        // Fetch encryption key nếu cần
        if (ch.encryptionEnabled && !getChannelKey(channelId)) {
          try {
            const key = await channelService.getEncryptionKey(channelId);
            cacheChannelKey(channelId, key);
          } catch {
            console.warn('Could not fetch encryption key');
          }
        }

        // Mark as read
        const socket = getSocket();
        socket?.emit('mark_read', { channelId });
      } catch (err) {
        console.error('Failed to load channel:', err);
      }
    };

    load();

    return () => {
      if (channelId) leaveChannel(channelId);
    };
  }, [channelId, setCurrent]);

  if (!channelId) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
        Chọn một channel để bắt đầu chat
      </div>
    );
  }

  const handleSend = async (
    content: string,
    type: 'text' | 'image' | 'file' = 'text',
    attachment?: Attachment
  ) => {
    const socket = getSocket();
    if (!socket) return;

    // Gửi qua socket (realtime) thay vì HTTP để có response nhanh hơn
    socket.emit(
      'send_message',
      {
        channelId,
        content,
        type,
        replyTo: null,
        attachment: attachment || undefined,
      },
      (response: { success?: boolean; error?: string }) => {
        if (response?.error) {
          console.error('Send message error:', response.error);
        }
      }
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Message list */}
      <MessageList channelId={channelId} />

      {/* Input */}
      <MessageInput channelId={channelId} onSend={handleSend} />

      {/* Video call modal */}
      {videoCallOpen && <VideoCallModal />}
    </div>
  );
};
