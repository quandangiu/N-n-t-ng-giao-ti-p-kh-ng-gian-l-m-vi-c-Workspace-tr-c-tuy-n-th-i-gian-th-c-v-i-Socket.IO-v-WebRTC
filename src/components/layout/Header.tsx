import React from 'react';
import { useChannelStore } from '../../store/channelStore';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { useUIStore } from '../../store/uiStore';
import {
  Hash,
  Lock,
  AtSign,
  Phone,
  Bell,
  Pin,
  Users,
  Search,
  Sun,
  Moon,
} from 'lucide-react';

/**
 * Discord-style header with # channel name, description, action buttons, search
 */
export const Header: React.FC = () => {
  const currentChannel = useChannelStore((s) => s.current);
  const currentWorkspace = useWorkspaceStore((s) => s.current);
  const { setVideoCallModal, theme, toggleTheme } = useUIStore();

  const getChannelIcon = () => {
    if (!currentChannel) return null;
    switch (currentChannel.type) {
      case 'public':
        return <span className="text-2xl text-gray-400 dark:text-gray-500 mr-2 font-light">#</span>;
      case 'private':
        return <Lock size={18} className="text-gray-400 dark:text-gray-500 mr-2" />;
      case 'dm':
        return <AtSign size={18} className="text-gray-400 dark:text-gray-500 mr-2" />;
    }
  };

  return (
    <header className="h-12 px-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-800 shadow-sm flex-shrink-0 bg-white dark:bg-chat-bg">
      {/* Left: Channel info */}
      <div className="flex items-center text-gray-800 dark:text-white min-w-0">
        {currentChannel ? (
          <>
            {getChannelIcon()}
            <h3 className="font-bold mr-3 truncate">{currentChannel.name}</h3>
            {currentChannel.description && (
              <span className="hidden md:block text-xs text-gray-500 dark:text-gray-400 border-l border-gray-300 dark:border-gray-600 pl-3 truncate">
                {currentChannel.description}
              </span>
            )}
          </>
        ) : currentWorkspace ? (
          <h3 className="font-bold truncate">{currentWorkspace.name}</h3>
        ) : null}
      </div>

      {/* Right: Action buttons */}
      <div className="flex items-center space-x-1 text-gray-600 dark:text-gray-300 flex-shrink-0">
        {currentChannel && (
          <button
            onClick={() => setVideoCallModal(true)}
            className="p-1.5 hover:text-gray-900 dark:hover:text-white transition-colors rounded hover:bg-gray-100 dark:hover:bg-gray-700"
            title="Video Call"
          >
            <Phone size={18} />
          </button>
        )}
        <button
          className="p-1.5 hover:text-gray-900 dark:hover:text-white transition-colors rounded hover:bg-gray-100 dark:hover:bg-gray-700"
          title="Notifications"
        >
          <Bell size={18} />
        </button>
        <button
          className="p-1.5 hover:text-gray-900 dark:hover:text-white transition-colors rounded hover:bg-gray-100 dark:hover:bg-gray-700 hidden sm:block"
          title="Pinned Messages"
        >
          <Pin size={18} />
        </button>
        <button
          className="p-1.5 hover:text-gray-900 dark:hover:text-white transition-colors rounded hover:bg-gray-100 dark:hover:bg-gray-700"
          title="Members"
        >
          <Users size={18} />
        </button>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="p-1.5 hover:text-gray-900 dark:hover:text-white transition-colors rounded hover:bg-gray-100 dark:hover:bg-gray-700"
          title="Toggle theme"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Search */}
        <div className="relative ml-2 hidden sm:block">
          <input
            type="text"
            className="bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 border-none rounded-md text-sm py-1 pl-2 pr-8 w-36 focus:w-52 transition-all focus:ring-0 focus:outline-none placeholder-gray-500"
            placeholder="Search"
          />
          <Search size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500" />
        </div>
      </div>
    </header>
  );
};
