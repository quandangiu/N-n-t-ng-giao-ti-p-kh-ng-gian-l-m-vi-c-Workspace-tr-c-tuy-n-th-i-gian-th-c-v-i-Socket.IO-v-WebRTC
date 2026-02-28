import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useChannelStore } from '../../store/channelStore';
import { useUIStore } from '../../store/uiStore';
import { channelService } from '../../services/channel.service';
import { useVoice } from '../../context/VoiceContext';
import { joinChannel, leaveChannel } from '../../socket/socket';
import { ChannelItem } from './ChannelItem';
import { ChevronDown, Plus } from 'lucide-react';
import clsx from 'clsx';

interface ChannelListProps {
  workspaceId: string;
  workspaceSlug: string;
}

/**
 * Discord-style channel list with expandable categories
 */
export const ChannelList: React.FC<ChannelListProps> = ({
  workspaceId,
  workspaceSlug,
}) => {
  const { channelId } = useParams();
  const navigate = useNavigate();
  const { channels, setChannels, setCurrent } = useChannelStore();
  const unreadCounts = useChannelStore((s) => s.unreadCounts);
  const setCreateChannelModal = useUIStore((s) => s.setCreateChannelModal);
  const { session: voiceSession, joinVoice, leaveVoice } = useVoice();

  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const toggleCategory = (cat: string) => {
    setCollapsed((prev) => ({ ...prev, [cat]: !prev[cat] }));
  };

  // Load channels khi workspace đổi
  useEffect(() => {
    const load = async () => {
      try {
        const data = await channelService.getByWorkspace(workspaceId);
        setChannels(data);
      } catch (err) {
        console.error('Failed to load channels:', err);
      }
    };
    load();
  }, [workspaceId, setChannels]);

  const handleSelect = (ch: typeof channels[0]) => {
    const currentCh = useChannelStore.getState().current;

    if (ch.type === 'voice') {
      const isAlreadyIn = voiceSession?.channelId === ch._id;
      if (isAlreadyIn) {
        // Click lại → rời kênh
        leaveVoice();
      } else {
        // Tham gia voice channel mới
        joinVoice(ch._id, ch.name, workspaceSlug).catch((err) => {
          console.error(err);
          alert(err.message);
        });
      }
      return; // Voice channel không navigate
    }

    // Text / private channel
    if (currentCh) leaveChannel(currentCh._id);
    setCurrent(ch);
    joinChannel(ch._id);
    navigate(`/workspace/${workspaceSlug}/channel/${ch._id}`);
  };

  const publicChannels = channels.filter((c) => c.type === 'public');
  const privateChannels = channels.filter((c) => c.type === 'private');
  const voiceChannels = channels.filter((c) => c.type === 'voice');
  const dmChannels = channels.filter((c) => c.type === 'dm');

  const renderCategory = (
    label: string,
    items: typeof channels,
    key: string
  ) => {
    if (items.length === 0) return null;
    const isCollapsed = collapsed[key] ?? false;

    return (
      <div key={key}>
        {/* Category header */}
        <div
          className="flex items-center justify-between px-2 mb-0.5 group cursor-pointer text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          onClick={() => toggleCategory(key)}
        >
          <div className="flex items-center text-xs font-bold uppercase tracking-wide">
            <ChevronDown
              size={10}
              className={clsx(
                'mr-0.5 transition-transform',
                isCollapsed && '-rotate-90'
              )}
            />
            {label}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setCreateChannelModal(true);
            }}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Plus size={14} />
          </button>
        </div>

        {/* Channel items */}
        {!isCollapsed && (
          <ul className="space-y-0.5">
            {items.map((ch) => (
              <li key={ch._id}>
                <ChannelItem
                  channel={ch}
                  isActive={channelId === ch._id}
                  unreadCount={unreadCounts.get(ch._id) ?? 0}
                  onClick={() => handleSelect(ch)}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {renderCategory('Text Channels', publicChannels, 'public')}
      {renderCategory('Private Channels', privateChannels, 'private')}
      {renderCategory('Kênh Thoại', voiceChannels, 'voice')}
      {renderCategory('Direct Messages', dmChannels, 'dm')}

      {channels.length === 0 && (
        <p className="text-xs text-gray-500 dark:text-sidebar-muted px-2">
          Chưa có channel nào
        </p>
      )}
    </div>
  );
};
