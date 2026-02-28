import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { useUIStore } from '../../store/uiStore';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { workspaceService } from '../../services/workspace.service';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export const CreateWorkspaceModal: React.FC = () => {
  const isOpen = useUIStore((s) => s.createWorkspaceModalOpen);
  const close = () => useUIStore.getState().setCreateWorkspaceModal(false);
  const addWorkspace = useWorkspaceStore((s) => s.addWorkspace);
  const setCurrent = useWorkspaceStore((s) => s.setCurrent);
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      const ws = await workspaceService.create({ name: name.trim(), description: description.trim() || undefined });
      addWorkspace(ws);
      setCurrent(ws);
      navigate(`/workspace/${ws.slug}`);
      toast.success('Tạo workspace thành công!');
      setName('');
      setDescription('');
      close();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Tạo workspace thất bại';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={close} title="Tạo Workspace mới">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Tên Workspace"
          placeholder="VD: Công ty ABC"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoFocus
        />
        <Input
          label="Mô tả (tùy chọn)"
          placeholder="Mô tả ngắn về workspace..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="ghost" onClick={close} type="button">
            Hủy
          </Button>
          <Button type="submit" isLoading={loading}>
            Tạo Workspace
          </Button>
        </div>
      </form>
    </Modal>
  );
};
