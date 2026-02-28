import React from 'react';
import clsx from 'clsx';
import { Plus, Zap, CheckCheck, BellOff, UserPlus, Settings, LogOut, Trash2 } from 'lucide-react';
import { useUIStore } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';
import { ContextMenu } from '../ui/ContextMenu';
import type { Workspace } from '../../types/workspace.types';
import type { ContextMenuItem } from '../ui/ContextMenu';
import { workspaceService } from '../../services/workspace.service';
import { useWorkspaceStore } from '../../store/workspaceStore';
import toast from 'react-hot-toast';

interface WorkspaceNavProps {
  workspaces: Workspace[];
  current: Workspace | null;
  onSelect: (ws: Workspace) => void;
}

// Generate a stable background color from the workspace name
const AVATAR_COLORS = [
  '#5865F2', '#57F287', '#FEE75C', '#EB459E', '#ED4245',
  '#3BA55D', '#FAA61A', '#9B59B6', '#1ABC9C', '#E91E63',
];

function getWorkspaceColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

/** Build context menu items for a workspace */
function getWorkspaceMenuItems(ws: Workspace, currentUserId: string | undefined): ContextMenuItem[] {
  const isOwner = ws.owner === currentUserId ||
    ws.members?.some(m => {
      const uid = typeof m.user === 'string' ? m.user : m.user?._id;
      return uid === currentUserId && m.role === 'owner';
    });

  return [
    {
      label: 'Đánh dấu đã đọc',
      icon: <CheckCheck size={14} />,
      onClick: () => toast.success('Đã đánh dấu tất cả đã đọc'),
    },
    {
      label: 'Tắt thông báo',
      icon: <BellOff size={14} />,
      onClick: () => toast('Tính năng sắp ra mắt!', { icon: '🔜' }),
      separator: true,
    },
    {
      label: 'Mời bạn bè',
      icon: <UserPlus size={14} />,
      onClick: () => {
        const code = ws.inviteCode || 'N/A';
        const link = `${window.location.origin}/invite/${code}`;
        navigator.clipboard.writeText(link);
        toast.success('Đã sao chép link mời!');
      },
    },
    {
      label: 'Chỉnh sửa workspace',
      icon: <Settings size={14} />,
      onClick: () => toast('Tính năng sắp ra mắt!', { icon: '🔜' }),
      separator: true,
    },
    {
      label: 'Rời workspace',
      icon: <LogOut size={14} />,
      danger: true,
      hidden: !!isOwner,
      onClick: async () => {
        if (!currentUserId) return;
        if (!confirm(`Bạn có chắc muốn rời "${ws.name}"?`)) return;
        try {
          await workspaceService.removeMember(ws._id, currentUserId);
          useWorkspaceStore.getState().removeWorkspace(ws._id);
          toast.success(`Đã rời ${ws.name}`);
        } catch {
          toast.error('Không thể rời workspace');
        }
      },
    },
    {
      label: 'Xóa workspace',
      icon: <Trash2 size={14} />,
      danger: true,
      hidden: !isOwner,
      onClick: async () => {
        if (!confirm(`Bạn có chắc muốn XÓA "${ws.name}"? Hành động này không thể hoàn tác!`)) return;
        try {
          await workspaceService.delete(ws._id);
          useWorkspaceStore.getState().removeWorkspace(ws._id);
          toast.success(`Đã xóa ${ws.name}`);
        } catch {
          toast.error('Không thể xóa workspace');
        }
      },
    },
  ];
}

/**
 * Discord-style workspace navigation rail (72px wide)
 * Rounded square icons with active indicator bar on left
 */
export const WorkspaceNav: React.FC<WorkspaceNavProps> = ({
  workspaces,
  current,
  onSelect,
}) => {
  const setCreateWorkspaceModal = useUIStore((s) => s.setCreateWorkspaceModal);
  const currentUserId = useAuthStore((s) => s.user?._id);

  return (
    <nav className="w-[72px] bg-gray-200 dark:bg-nav-dark flex flex-col items-center py-3 space-y-2 flex-shrink-0">
      {/* Home / Logo button */}
      <div className="group relative flex items-center justify-center">
        <div
          className={clsx(
            'absolute left-0 w-1 bg-gray-700 dark:bg-white rounded-r-full -ml-1 transition-all',
            !current ? 'h-8' : 'h-0 group-hover:h-5'
          )}
        />
        <button
          className="w-12 h-12 bg-primary rounded-[16px] flex items-center justify-center text-white hover:rounded-[12px] transition-all shadow-md"
          title="Home"
        >
          <Zap size={24} />
        </button>
      </div>

      {/* Separator */}
      <div className="w-8 h-[2px] bg-gray-300 dark:bg-gray-700 rounded-full mx-auto" />

      {/* Workspace icons */}
      {workspaces.map((ws) => {
        const isActive = current?._id === ws._id;
        const bgColor = getWorkspaceColor(ws.name);
        const initials = getInitials(ws.name);
        const imageUrl = (ws as any).imageUrl as string | undefined;

        return (
          <ContextMenu
            key={ws._id}
            items={getWorkspaceMenuItems(ws, currentUserId)}
          >
            <div className="group relative flex items-center justify-center">
              {/* Active indicator bar */}
              <div
                className={clsx(
                  'absolute left-0 w-1 rounded-r-full -ml-1 transition-all duration-200',
                  isActive
                    ? 'h-8 bg-gray-900 dark:bg-white'
                    : 'h-0 group-hover:h-5 bg-gray-700 dark:bg-white'
                )}
              />

              <button
                onClick={() => onSelect(ws)}
                title={ws.name}
                style={!imageUrl && !ws.icon ? { backgroundColor: isActive ? bgColor : undefined } : undefined}
                className={clsx(
                  'w-12 h-12 flex items-center justify-center transition-all duration-200 shadow-sm overflow-hidden',
                  isActive ? 'rounded-[12px]' : 'rounded-[24px] group-hover:rounded-[12px]'
                )}
              >
                {imageUrl ? (
                  <img src={imageUrl} alt={ws.name} className="w-full h-full object-cover" />
                ) : ws.icon ? (
                  <span
                    className={clsx(
                      'text-xl w-full h-full flex items-center justify-center',
                      isActive
                        ? 'bg-primary text-white'
                        : 'bg-white dark:bg-gray-700 group-hover:bg-primary group-hover:text-white text-gray-700 dark:text-gray-200'
                    )}
                  >
                    {ws.icon}
                  </span>
                ) : (
                  <span
                    className="w-full h-full flex items-center justify-center font-bold text-sm text-white select-none"
                    style={{ backgroundColor: bgColor }}
                  >
                    {initials}
                  </span>
                )}
              </button>

              {/* Tooltip */}
              <div className="pointer-events-none absolute left-full ml-4 px-3 py-1.5 bg-gray-900 text-white text-sm font-semibold rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50 shadow-xl">
                {ws.name}
                <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900" />
              </div>
            </div>
          </ContextMenu>
        );
      })}

      {/* Add workspace button */}
      <div className="group relative flex items-center justify-center pt-1">
        <button
          onClick={() => setCreateWorkspaceModal(true)}
          className="w-12 h-12 bg-transparent border-2 border-dashed border-gray-400 dark:border-gray-600 rounded-[24px] flex items-center justify-center hover:border-primary hover:text-primary text-gray-500 dark:text-gray-400 transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-800 hover:rounded-[12px]"
          title="Tạo workspace mới"
        >
          <Plus size={22} />
        </button>
        <div className="pointer-events-none absolute left-full ml-4 px-3 py-1.5 bg-gray-900 text-white text-sm font-semibold rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50 shadow-xl">
          Thêm workspace
          <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900" />
        </div>
      </div>
    </nav>
  );
};
