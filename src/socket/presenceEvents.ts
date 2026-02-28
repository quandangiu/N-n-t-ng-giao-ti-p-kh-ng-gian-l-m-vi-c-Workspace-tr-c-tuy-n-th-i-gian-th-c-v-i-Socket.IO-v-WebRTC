import { getSocket } from './socket';
import { useWorkspaceStore } from '../store/workspaceStore';

/**
 * Đăng ký tất cả socket events liên quan đến presence (online/offline)
 */
export const registerPresenceEvents = (): (() => void) => {
  const socket = getSocket();
  if (!socket) return () => {};

  // User thay đổi status (online/offline/away)
  const handleStatusChanged = ({
    userId,
    status,
  }: {
    userId: string;
    status: string;
    lastSeen?: string;
  }) => {
    useWorkspaceStore.getState().updateUserStatus(userId, status);
  };

  // Nhận danh sách user đang online trong workspace
  const handleOnlineUsers = ({
    workspaceId,
    onlineIds,
  }: {
    workspaceId: string;
    onlineIds: string[];
  }) => {
    useWorkspaceStore.getState().setOnlineUsers(workspaceId, onlineIds);
  };

  socket.on('user_status_changed', handleStatusChanged);
  socket.on('workspace_online_users', handleOnlineUsers);

  // Cleanup
  return () => {
    socket.off('user_status_changed', handleStatusChanged);
    socket.off('workspace_online_users', handleOnlineUsers);
  };
};
