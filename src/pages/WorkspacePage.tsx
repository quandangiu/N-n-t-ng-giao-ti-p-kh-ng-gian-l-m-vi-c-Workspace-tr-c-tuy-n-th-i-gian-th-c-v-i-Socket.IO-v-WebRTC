import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWorkspaceStore } from '../store/workspaceStore';
import { workspaceService } from '../services/workspace.service';
import { joinWorkspace } from '../socket/socket';
import { Loader2, Users, Link as LinkIcon, Settings } from 'lucide-react';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import toast from 'react-hot-toast';

export const WorkspacePage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { current, setCurrent, workspaces } = useWorkspaceStore();

  // Load workspace khi có slug
  useEffect(() => {
    if (!slug) return;

    const ws = workspaces.find((w) => w.slug === slug);
    if (ws) {
      setCurrent(ws);
      joinWorkspace(ws._id);
    }
  }, [slug, workspaces, setCurrent]);

  if (!current) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin text-primary mx-auto" size={32} />
          <p className="text-gray-500 dark:text-gray-400 mt-2">Đang tải workspace...</p>
        </div>
      </div>
    );
  }

  const inviteLink = current.inviteCode
    ? `${window.location.origin}/workspace/join/${current.inviteCode}`
    : '';

  const copyInviteLink = () => {
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink);
      toast.success('Đã copy invite link!');
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="max-w-lg text-center space-y-6">
        <div className="text-6xl">{current.icon}</div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{current.name}</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Chọn một channel ở sidebar để bắt đầu chat
        </p>

        {/* Stats */}
        <div className="flex items-center justify-center gap-6 text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-1">
            <Users size={16} />
            <span>{current.members?.length ?? 0} thành viên</span>
          </div>
        </div>

        {/* Invite box */}
        {inviteLink && (
          <div className="bg-white dark:bg-[#2b2d31] border border-gray-200 dark:border-gray-700 rounded-xl p-5 text-left space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <LinkIcon size={16} className="text-primary" />
              Mời người khác vào workspace
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Gửi link bên dưới cho người muốn mời. Họ cần đăng ký tài khoản trước, sau đó mở link để tham gia.
            </p>
            <div className="flex gap-2">
              <input
                readOnly
                value={inviteLink}
                className="flex-1 bg-white dark:bg-[#313338] border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white font-mono select-all"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <Button onClick={copyInviteLink} size="sm">
                Copy
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
