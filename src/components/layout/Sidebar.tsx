import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import { ChannelList } from '../channel/ChannelList';
import { CreateWorkspaceModal } from '../workspace/CreateWorkspaceModal';
import { CreateChannelModal } from '../channel/CreateChannelModal';
import { Avatar } from '../ui/Avatar';
import { VoiceChannelBar } from '../voice/VoiceChannelBar';
import { ChevronDown, Mic, Headphones, Settings, Plus } from 'lucide-react';
import { authService } from '../../services/auth.service';
import { disconnectSocket } from '../../socket/socket';
import toast from 'react-hot-toast';

export const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { current } = useWorkspaceStore();
  const { setCreateChannelModal } = useUIStore();

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch {
      // ignore
    }
    disconnectSocket();
    logout();
    navigate('/login');
  };

  return (
    <div className="h-full flex flex-col bg-gray-100 dark:bg-sidebar-dark border-r border-gray-200 dark:border-gray-800">
      {/* Workspace header */}
      <div className="h-12 px-4 flex items-center justify-between shadow-sm border-b border-gray-200 dark:border-gray-900 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
        <h1 className="font-bold truncate text-gray-800 dark:text-white text-sm">
          {current?.name || 'Select Workspace'}
        </h1>
        <ChevronDown size={14} className="text-gray-500 dark:text-gray-300" />
      </div>

      {/* Channel list */}
      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
        {current && (
          <ChannelList
            workspaceId={current._id}
            workspaceSlug={current.slug}
          />
        )}
      </div>

      {/* Voice channel bar — xuất hiện khi đang ở trong voice channel */}
      <VoiceChannelBar />

      {/* User panel - Discord style */}
      <div className="h-[52px] bg-gray-100 dark:bg-[#232428] flex items-center px-2 space-x-2">
        <div className="relative group cursor-pointer" onClick={handleLogout} title="Click to logout">
          <Avatar
            src={user?.avatar}
            name={user?.displayName || user?.username || '?'}
            size="sm"
            isOnline={true}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">
            {user?.displayName || user?.username}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
            Online
          </div>
        </div>
        <div className="flex items-center">
          <button className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-300" title="Mic">
            <Mic size={16} />
          </button>
          <button className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-300" title="Headset">
            <Headphones size={16} />
          </button>
          <button className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-300" title="Settings">
            <Settings size={16} />
          </button>
        </div>
      </div>

      {/* Modals */}
      <CreateWorkspaceModal />
      <CreateChannelModal />
    </div>
  );
};
