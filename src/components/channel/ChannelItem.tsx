import React, { useEffect, useState } from 'react';
import clsx from 'clsx';
import {
  Lock, Volume2, UserPlus, Edit3, Trash2, BellOff, Link2, Pin,
  User, MessageSquare, MicOff, LogOut, Volume1,
} from 'lucide-react';
import type { Channel, VoiceMember } from '../../types/channel.types';
import { useChannelStore } from '../../store/channelStore';
import { useAuthStore } from '../../store/authStore';
import { useVoiceStore } from '../../store/voiceStore';
import { ContextMenu } from '../ui/ContextMenu';
import type { ContextMenuItem } from '../ui/ContextMenu';
import { channelService } from '../../services/channel.service';
import toast from 'react-hot-toast';

interface ChannelItemProps {
  channel: Channel;
  isActive: boolean;
  unreadCount: number;
  onClick: () => void;
}

// Hook đếm thời gian online trong voice channel
function useVoiceTimer(joinedAt: string | undefined): string {
  const [elapsed, setElapsed] = useState('');
  useEffect(() => {
    if (!joinedAt) return;
    const update = () => {
      const secs = Math.floor((Date.now() - new Date(joinedAt).getTime()) / 1000);
      const m = Math.floor(secs / 60);
      const s = secs % 60;
      setElapsed(`${m}:${String(s).padStart(2, '0')}`);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [joinedAt]);
  return elapsed;
}

/** Build context menu items for voice member row */
function getVoiceMemberMenuItems(member: VoiceMember, isMe: boolean): ContextMenuItem[] {
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
      hidden: isMe,
      separator: true,
    },
    {
      label: member.isMuted ? 'Bật mic người này' : 'Tắt mic người này',
      icon: <MicOff size={14} />,
      onClick: () => toast('Tính năng sắp ra mắt!', { icon: '🔜' }),
      hidden: isMe,
    },
    {
      label: 'Kick khỏi voice',
      icon: <LogOut size={14} />,
      danger: true,
      onClick: () => toast('Tính năng sắp ra mắt!', { icon: '🔜' }),
      hidden: isMe,
    },
    {
      label: 'Chỉnh âm lượng',
      icon: <Volume1 size={14} />,
      onClick: () => toast('Tính năng sắp ra mắt!', { icon: '🔜' }),
      hidden: isMe,
      separator: true,
    },
  ];
}

// Avatar nhỏ trong voice member list — sáng lên khi user đang nói
const VoiceMemberRow: React.FC<{ member: VoiceMember; isMe: boolean }> = ({ member, isMe }) => {
  const timer = useVoiceTimer(member.joinedAt);
  const isSpeaking = useChannelStore((s) => s.speakingUsers.has(member.userId));

  return (
    <ContextMenu items={getVoiceMemberMenuItems(member, isMe)}>
      <div className="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700/50 group/vm">
        <div className="relative flex-shrink-0">
          {member.avatar ? (
            <img
              src={member.avatar}
              alt={member.username}
              className={clsx(
                'w-7 h-7 rounded-full object-cover ring-2 transition-all duration-200',
                isSpeaking
                  ? 'ring-green-400 shadow-[0_0_10px_rgba(74,222,128,0.7)]'
                  : isMe ? 'ring-green-400/40' : 'ring-gray-500/30'
              )}
            />
          ) : (
            <div
              className={clsx(
                'w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-bold ring-2 transition-all duration-200',
                isSpeaking
                  ? 'bg-green-500 ring-green-400 shadow-[0_0_10px_rgba(74,222,128,0.7)]'
                  : isMe ? 'bg-green-600/70 ring-green-400/40' : 'bg-primary/70 ring-gray-500/30'
              )}
            >
              {member.username.slice(0, 1).toUpperCase()}
            </div>
          )}
          {/* Green dot — nhấp nháy khi đang nói */}
          <span
            className={clsx(
              'absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-gray-800',
              isSpeaking ? 'bg-green-400 animate-pulse' : 'bg-gray-500'
            )}
          />
        </div>
        <span className={clsx(
          'text-xs truncate flex-1',
          isSpeaking ? 'text-green-400 font-semibold' : isMe ? 'text-green-400/70 font-medium' : 'text-gray-400'
        )}>
          {member.displayName || member.username}
        </span>
        {/* Muted icon */}
        {member.isMuted && (
          <span className="text-red-400 text-[10px] flex-shrink-0" title="Đã tắt mic">🔇</span>
        )}
        {timer && (
          <span className="text-[10px] text-green-400/70 font-mono flex-shrink-0">{timer}</span>
        )}
      </div>
    </ContextMenu>
  );
};

/** Build context menu items for a channel */
function getChannelMenuItems(channel: Channel): ContextMenuItem[] {
  const isVoice = channel.type === 'voice';

  return [
    {
      label: 'Chỉnh sửa kênh',
      icon: <Edit3 size={14} />,
      onClick: () => toast('Tính năng sắp ra mắt!', { icon: '🔜' }),
    },
    {
      label: 'Tắt thông báo',
      icon: <BellOff size={14} />,
      onClick: () => toast('Tính năng sắp ra mắt!', { icon: '🔜' }),
    },
    {
      label: 'Sao chép link kênh',
      icon: <Link2 size={14} />,
      onClick: () => {
        const link = `${window.location.origin}/channels/${channel._id}`;
        navigator.clipboard.writeText(link);
        toast.success('Đã sao chép link kênh!');
      },
    },
    {
      label: 'Ghim kênh',
      icon: <Pin size={14} />,
      onClick: () => toast('Tính năng sắp ra mắt!', { icon: '🔜' }),
      separator: true,
    },
    // Voice channel extras
    {
      label: 'Giới hạn người',
      icon: <UserPlus size={14} />,
      onClick: () => toast('Tính năng sắp ra mắt!', { icon: '🔜' }),
      hidden: !isVoice,
    },
    {
      label: 'Chỉnh bitrate',
      icon: <Volume2 size={14} />,
      onClick: () => toast('Tính năng sắp ra mắt!', { icon: '🔜' }),
      hidden: !isVoice,
      separator: isVoice,
    },
    {
      label: 'Xóa kênh',
      icon: <Trash2 size={14} />,
      danger: true,
      onClick: async () => {
        if (!confirm(`Bạn có chắc muốn xóa kênh "${channel.name}"?`)) return;
        try {
          await channelService.delete(channel._id);
          toast.success(`Đã xóa kênh ${channel.name}`);
        } catch {
          toast.error('Không thể xóa kênh');
        }
      },
    },
  ];
}

/**
 * Discord-style channel item
 * - Voice channel: hiện danh sách members đang ở trong kênh
 */
export const ChannelItem: React.FC<ChannelItemProps> = ({
  channel,
  isActive,
  unreadCount,
  onClick,
}) => {
  const voiceMembers = useChannelStore((s) => s.voiceMembers.get(channel._id) ?? []);
  const currentUserId = useAuthStore((s) => s.user?._id);
  const voiceSession = useVoiceStore((s) => s.session);
  const isVoice = channel.type === 'voice';
  const hasVoiceMembers = voiceMembers.length > 0;
  const isMeInVoice = isVoice && voiceSession?.channelId === channel._id;

  return (
    <div>
      {/* Channel row */}
      <ContextMenu items={getChannelMenuItems(channel)}>
        <button
          onClick={onClick}
          className={clsx(
            'w-full flex items-center px-2 py-1 rounded text-sm transition-colors group',
            isActive || isMeInVoice
              ? 'bg-gray-200 dark:bg-gray-700/60 text-gray-800 dark:text-white'
              : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700/60 hover:text-gray-700 dark:hover:text-gray-200'
          )}
        >
          {/* Channel icon */}
          {isVoice ? (
            <Volume2
              size={15}
              className={clsx(
                'mr-1.5 flex-shrink-0',
                isActive || isMeInVoice
                  ? 'text-green-400'
                  : 'text-gray-400 dark:text-gray-500'
              )}
            />
          ) : channel.type === 'private' ? (
            <Lock size={14} className="mr-1.5 flex-shrink-0 text-gray-400 dark:text-gray-500" />
          ) : channel.type === 'dm' ? (
            <span className="mr-1.5 text-gray-400 dark:text-gray-500 text-sm flex-shrink-0">@</span>
          ) : (
            <span
              className={clsx(
                'mr-1.5 text-lg leading-none flex-shrink-0',
                isActive
                  ? 'text-gray-500 dark:text-gray-400'
                  : 'text-gray-400 dark:text-gray-500'
              )}
            >
              #
            </span>
          )}

          {/* Channel name */}
          <span
            className={clsx(
              'truncate flex-1 text-left',
              unreadCount > 0 && !isActive && 'font-semibold text-gray-800 dark:text-white'
            )}
          >
            {channel.name}
          </span>

          {/* Voice: user count badge or invite icon */}
          {isVoice && hasVoiceMembers && !isMeInVoice && (
            <span className="ml-auto opacity-0 group-hover:opacity-100 text-gray-400 dark:text-gray-500 transition-opacity">
              <UserPlus size={14} />
            </span>
          )}

          {/* Text channel unread badge */}
          {!isVoice && unreadCount > 0 && (
            <span className="ml-auto bg-primary text-white text-[10px] px-1.5 rounded-full font-bold flex-shrink-0">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      </ContextMenu>

      {/* Voice members list (shown khi có người trong kênh) */}
      {isVoice && hasVoiceMembers && (
        <div className="ml-4 mt-0.5 mb-1 space-y-0.5">
          {/* Invite row */}
          <button className="flex items-center gap-1.5 px-2 py-0.5 w-full rounded text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700/50 group/inv">
            <UserPlus size={12} />
            <span>Mời vào Kênh thoại</span>
            <span className="ml-auto opacity-0 group-hover/inv:opacity-100">›</span>
          </button>
          {/* Member rows */}
          {voiceMembers.map((member) => (
            <VoiceMemberRow
              key={member.userId}
              member={member}
              isMe={member.userId === currentUserId}
            />
          ))}
        </div>
      )}
    </div>
  );
};
