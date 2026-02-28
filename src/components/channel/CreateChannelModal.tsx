import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Hash, Lock, Volume2 } from 'lucide-react';
import { useUIStore } from '../../store/uiStore';
import { useChannelStore } from '../../store/channelStore';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { channelService } from '../../services/channel.service';
import toast from 'react-hot-toast';

export const CreateChannelModal: React.FC = () => {
  const isOpen = useUIStore((s) => s.createChannelModalOpen);
  const close = () => useUIStore.getState().setCreateChannelModal(false);
  const addChannel = useChannelStore((s) => s.addChannel);
  const currentWorkspace = useWorkspaceStore((s) => s.current);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'public' | 'private' | 'voice'>('public');
  const [encryption, setEncryption] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !currentWorkspace) return;

    setLoading(true);
    try {
      const ch = await channelService.create({
        workspaceId: currentWorkspace._id,
        name: name.trim().toLowerCase().replace(/\s+/g, '-'),
        type,
        description: description.trim() || undefined,
        encryptionEnabled: encryption,
      });
      addChannel(ch);
      toast.success('Tạo channel thành công!');
      setName('');
      setDescription('');
      setType('public');
      setEncryption(false);
      close();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Tạo channel thất bại';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={close} title="Tạo Channel mới">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Tên Channel"
          placeholder="VD: general"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoFocus
        />
        <Input
          label="Mô tả (tùy chọn)"
          placeholder="Channel dùng để..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        {/* Type selector */}
        <div>
          <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
            Loại Channel
          </label>
          <div className="grid grid-cols-3 gap-2">
            {([
              { value: 'public',  icon: Hash,    label: 'Text',    desc: 'Kênh chat' },
              { value: 'private', icon: Lock,    label: 'Private', desc: 'Chỉ thành viên' },
              { value: 'voice',   icon: Volume2, label: 'Thoại',   desc: 'Kênh voice' },
            ] as const).map(({ value, icon: Icon, label, desc }) => (
              <button
                key={value}
                type="button"
                onClick={() => setType(value)}
                className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-colors ${
                  type === value
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <Icon size={20} />
                <span className="text-xs font-semibold">{label}</span>
                <span className="text-[10px] opacity-70 text-center leading-tight">{desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Encryption toggle — chỉ hiện cho text channels */}
        {type !== 'voice' && (
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={encryption}
              onChange={(e) => setEncryption(e.target.checked)}
              className="rounded text-primary"
            />
            <span className="text-sm text-gray-900 dark:text-white">🔒 Mã hóa tin nhắn (AES-256)</span>
          </label>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="ghost" onClick={close} type="button">
            Hủy
          </Button>
          <Button type="submit" isLoading={loading}>
            Tạo Channel
          </Button>
        </div>
      </form>
    </Modal>
  );
};
