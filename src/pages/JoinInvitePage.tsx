import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { workspaceService } from '../services/workspace.service';
import { useWorkspaceStore } from '../store/workspaceStore';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import toast from 'react-hot-toast';

export const JoinInvitePage: React.FC = () => {
  const { inviteCode } = useParams<{ inviteCode: string }>();
  const navigate = useNavigate();
  const addWorkspace = useWorkspaceStore((s) => s.addWorkspace);
  const setCurrent = useWorkspaceStore((s) => s.setCurrent);

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!inviteCode) return;

    const join = async () => {
      try {
        const ws = await workspaceService.joinByInvite(inviteCode);
        addWorkspace(ws);
        setCurrent(ws);
        setStatus('success');
        toast.success(`Đã tham gia workspace "${ws.name}"!`);
        setTimeout(() => navigate(`/workspace/${ws.slug}`), 1500);
      } catch (err: any) {
        setStatus('error');
        setError(err?.response?.data?.error?.message || 'Invite code không hợp lệ');
      }
    };

    join();
  }, [inviteCode]);

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="max-w-md text-center space-y-4">
        {status === 'loading' && (
          <>
            <Loader2 className="animate-spin text-primary mx-auto" size={48} />
            <p className="text-gray-500 dark:text-gray-400">Đang tham gia workspace...</p>
          </>
        )}
        {status === 'success' && (
          <>
            <CheckCircle className="text-green-500 mx-auto" size={48} />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Tham gia thành công!</h2>
            <p className="text-gray-500 dark:text-gray-400">Đang chuyển hướng...</p>
          </>
        )}
        {status === 'error' && (
          <>
            <XCircle className="text-red-500 mx-auto" size={48} />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Không thể tham gia</h2>
            <p className="text-red-400">{error}</p>
            <Button onClick={() => navigate('/')} variant="secondary">
              Về trang chủ
            </Button>
          </>
        )}
      </div>
    </div>
  );
};
