import React, { useState, memo } from 'react';
import type { Message } from '../../types/message.types';
import { Avatar } from '../ui/Avatar';
import { EmojiPicker } from './EmojiPicker';
import { ReadReceipt } from './ReadReceipt';
import { formatMessageTime } from '../../utils/formatDate';
import { thumbnail, getFileIcon, formatFileSize } from '../../utils/cloudinary';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import { useMessageStore } from '../../store/messageStore';
import { messageService } from '../../services/message.service';
import {
  SmilePlus, MoreHorizontal, Reply, Trash2,
  Edit3, Copy, Pin, Forward, MessageSquare,
  User, AtSign, Ban,
} from 'lucide-react';
import { Dropdown } from '../ui/Dropdown';
import { ContextMenu } from '../ui/ContextMenu';
import type { ContextMenuItem } from '../ui/ContextMenu';
import clsx from 'clsx';
import toast from 'react-hot-toast';

interface MessageItemProps {
  message: Message;
  showAvatar: boolean;
}

/** Build context menu items for a message */
function getMessageMenuItems(message: Message, isOwn: boolean): ContextMenuItem[] {
  return [
    {
      label: 'Trả lời',
      icon: <Reply size={14} />,
      onClick: () => toast('Tính năng sắp ra mắt!', { icon: '🔜' }),
    },
    {
      label: 'React',
      icon: <SmilePlus size={14} />,
      onClick: () => toast('Tính năng sắp ra mắt!', { icon: '🔜' }),
      separator: true,
    },
    {
      label: 'Chỉnh sửa',
      icon: <Edit3 size={14} />,
      onClick: () => toast('Tính năng sắp ra mắt!', { icon: '🔜' }),
      hidden: !isOwn,
    },
    {
      label: 'Sao chép nội dung',
      icon: <Copy size={14} />,
      onClick: () => {
        if (message.content) {
          navigator.clipboard.writeText(message.content);
          toast.success('Đã sao chép nội dung!');
        }
      },
    },
    {
      label: 'Ghim tin nhắn',
      icon: <Pin size={14} />,
      onClick: () => toast('Tính năng sắp ra mắt!', { icon: '🔜' }),
    },
    {
      label: 'Chuyển tiếp',
      icon: <Forward size={14} />,
      onClick: () => toast('Tính năng sắp ra mắt!', { icon: '🔜' }),
    },
    {
      label: 'Tạo thread',
      icon: <MessageSquare size={14} />,
      onClick: () => toast('Tính năng sắp ra mắt!', { icon: '🔜' }),
      separator: true,
    },
    {
      label: 'Xóa',
      icon: <Trash2 size={14} />,
      danger: true,
      hidden: !isOwn,
      onClick: async () => {
        try {
          await messageService.delete(message._id);
          useMessageStore.getState().deleteMessage(message.channel, message._id);
          toast.success('Đã xóa tin nhắn');
        } catch {
          toast.error('Không thể xóa tin nhắn');
        }
      },
    },
  ];
}

/** Build context menu items for user avatar in chat */
function getUserAvatarMenuItems(message: Message, isOwn: boolean): ContextMenuItem[] {
  return [
    {
      label: 'Xem hồ sơ',
      icon: <User size={14} />,
      onClick: () => toast('Tính năng sắp ra mắt!', { icon: '🔜' }),
    },
    {
      label: 'Nhắn tin riêng',
      icon: <MessageSquare size={14} />,
      onClick: () => toast('Tính năng sắp ra mắt!', { icon: '🔜' }),
      hidden: isOwn,
    },
    {
      label: `Mention @${message.sender.username}`,
      icon: <AtSign size={14} />,
      onClick: () => toast('Tính năng sắp ra mắt!', { icon: '🔜' }),
      hidden: isOwn,
      separator: true,
    },
    {
      label: 'Chặn',
      icon: <Ban size={14} />,
      danger: true,
      onClick: () => toast('Tính năng sắp ra mắt!', { icon: '🔜' }),
      hidden: isOwn,
    },
  ];
}

/**
 * Discord-style message with avatar, hover toolbar, reactions, context menus
 */
export const MessageItem: React.FC<MessageItemProps> = memo(
  ({ message, showAvatar }) => {
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const currentUserId = useAuthStore((s) => s.user?._id);
    const setLightboxUrl = useUIStore((s) => s.setLightboxUrl);
    const isOwn = message.sender._id === currentUserId;

    if (message.isDeleted) {
      return (
        <div className="px-4 py-1 text-sm text-gray-400 dark:text-chat-muted italic">
          🗑️ Tin nhắn đã bị xóa
        </div>
      );
    }

    const handleReaction = async (emoji: string) => {
      try {
        const existing = message.reactions[emoji] ?? [];
        const action = existing.includes(currentUserId ?? '') ? 'remove' : 'add';
        await messageService.addReaction(message._id, emoji, action);
      } catch {
        toast.error('Không thể thêm reaction');
      }
      setShowEmojiPicker(false);
    };

    const handleDelete = async () => {
      try {
        await messageService.delete(message._id);
        useMessageStore
          .getState()
          .deleteMessage(message.channel, message._id);
        toast.success('Đã xóa tin nhắn');
      } catch {
        toast.error('Không thể xóa tin nhắn');
      }
    };

    const dropdownItems = [
      ...(isOwn
        ? [{ label: 'Xóa', icon: <Trash2 size={14} />, onClick: handleDelete, danger: true }]
        : []),
    ];

    return (
      <ContextMenu items={getMessageMenuItems(message, isOwn)}>
        <div
          className={clsx(
            'group relative flex hover:bg-gray-50 dark:hover:bg-[#2e3035] -mx-4 px-4 py-1 transition-colors',
            message.isPending && 'opacity-60'
          )}
        >
          {/* Avatar column */}
          <div className="flex-shrink-0 w-10 mr-4 mt-1">
            {showAvatar && (
              <ContextMenu items={getUserAvatarMenuItems(message, isOwn)}>
                <Avatar
                  src={message.sender.avatar}
                  name={message.sender.displayName || message.sender.username}
                  size="md"
                  className="cursor-pointer hover:shadow-md transition-shadow"
                />
              </ContextMenu>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {showAvatar && (
              <div className="flex items-center mb-0.5">
                <ContextMenu items={getUserAvatarMenuItems(message, isOwn)}>
                  <span className="font-medium text-gray-900 dark:text-white cursor-pointer hover:underline mr-2 text-sm">
                    {message.sender.displayName || message.sender.username}
                  </span>
                </ContextMenu>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {formatMessageTime(message.createdAt)}
                </span>
                {message.isEdited && (
                  <span className="text-xs text-gray-400 dark:text-gray-500 ml-1">(edited)</span>
                )}
                {message.isPending && (
                  <span className="text-xs text-gray-400 dark:text-gray-500 ml-1">Sending...</span>
                )}
              </div>
            )}

            {/* Reply quote */}
            {message.replyTo && (
              <div className="mb-1 pl-3 border-l-2 border-primary text-xs text-gray-500 dark:text-chat-muted">
                <span className="font-medium">{message.replyTo.sender.username}</span>
                : {message.replyTo.content?.slice(0, 100)}
              </div>
            )}

            {/* Text content */}
            {message.content && message.type === 'text' && (
              <p className="text-sm text-gray-800 dark:text-gray-300 leading-relaxed whitespace-pre-wrap break-words">
                {message.content}
              </p>
            )}

            {/* Image attachment */}
            {message.type === 'image' && message.attachment && (
              <img
                src={thumbnail(message.attachment.url)}
                alt={message.attachment.name}
                className="max-w-xs rounded-lg cursor-pointer hover:opacity-90 transition-opacity mt-1"
                onClick={() => setLightboxUrl(message.attachment!.url)}
              />
            )}

            {/* File attachment */}
            {message.type === 'file' && message.attachment && (
              <a
                href={message.attachment.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-2 px-3 py-2 bg-gray-100 dark:bg-[#2b2d31] border border-gray-200 dark:border-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <span className="text-lg">
                  {getFileIcon(message.attachment.mimeType)}
                </span>
                <div>
                  <p className="text-sm font-medium text-primary">
                    {message.attachment.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatFileSize(message.attachment.size)}
                  </p>
                </div>
              </a>
            )}

            {/* Reactions */}
            {Object.keys(message.reactions).length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {Object.entries(message.reactions).map(([emoji, userIds]) => (
                  <button
                    key={emoji}
                    onClick={() => handleReaction(emoji)}
                    className={clsx(
                      'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs border transition-colors cursor-pointer',
                      userIds.includes(currentUserId ?? '')
                        ? 'border-primary/50 bg-primary/10 text-primary'
                        : 'border-transparent bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
                    )}
                  >
                    <span className="text-sm">{emoji}</span>
                    <span className="font-bold">{userIds.length}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Read receipts */}
            {message.readBy && message.readBy.length > 0 && (
              <ReadReceipt readBy={message.readBy} />
            )}
          </div>

          {/* Hover action toolbar - Discord style floating */}
          <div className="opacity-0 group-hover:opacity-100 absolute right-4 -top-3 bg-white dark:bg-gray-800 shadow-md border border-gray-200 dark:border-gray-700 rounded-md flex items-center p-0.5 transition-opacity z-10">
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-500 dark:text-gray-300"
              title="Add Reaction"
            >
              <SmilePlus size={16} />
            </button>
            <button
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-500 dark:text-gray-300"
              title="Reply"
            >
              <Reply size={16} />
            </button>
            {dropdownItems.length > 0 && (
              <Dropdown
                trigger={
                  <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-500 dark:text-gray-300" title="More">
                    <MoreHorizontal size={16} />
                  </button>
                }
                items={dropdownItems}
              />
            )}
          </div>

          {/* Emoji picker popup */}
          {showEmojiPicker && (
            <div className="absolute right-4 top-6 z-20">
              <EmojiPicker onSelect={handleReaction} />
            </div>
          )}
        </div>
      </ContextMenu>
    );
  }
);

MessageItem.displayName = 'MessageItem';
