import React, { useState, useRef, useCallback } from 'react';
import { getSocket } from '../../socket/socket';
import { useTyping } from '../../hooks/useTyping';
import { useFileUpload } from '../../hooks/useFileUpload';
import { useChannelStore } from '../../store/channelStore';
import { Send, Plus, X, Loader2, Smile, Image } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Attachment } from '../../types/message.types';

interface MessageInputProps {
  channelId: string;
  onSend: (
    content: string,
    type?: 'text' | 'image' | 'file',
    attachment?: Attachment
  ) => Promise<void>;
}

/**
 * Discord-style message input with rounded container, + button, and emoji
 */
export const MessageInput: React.FC<MessageInputProps> = ({
  channelId,
  onSend,
}) => {
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [pendingFile, setPendingFile] = useState<Attachment | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textInputRef = useRef<HTMLTextAreaElement>(null);

  const currentChannel = useChannelStore((s) => s.current);
  const { startTyping, stopTyping } = useTyping(channelId);
  const { upload, uploading, progress } = useFileUpload();

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const text = content.trim();

    if (!text && !pendingFile) return;

    setSending(true);
    stopTyping();

    try {
      if (pendingFile) {
        const type = pendingFile.mimeType.startsWith('image/')
          ? 'image'
          : 'file';
        await onSend(text, type, pendingFile);
        setPendingFile(null);
      } else {
        await onSend(text, 'text');
      }
      setContent('');
      textInputRef.current?.focus();
    } catch {
      toast.error('Gửi tin nhắn thất bại');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    startTyping();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const attachment = await upload(file);
      setPendingFile(attachment);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload thất bại');
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="px-4 pb-6 pt-2 flex-shrink-0">
      {/* Pending file preview */}
      {pendingFile && (
        <div className="mb-2 flex items-center gap-2 p-2 bg-gray-100 dark:bg-[#383a40] rounded-lg">
          {pendingFile.mimeType.startsWith('image/') ? (
            <Image size={16} className="text-primary" />
          ) : (
            <Plus size={16} className="text-primary" />
          )}
          <span className="text-sm text-gray-800 dark:text-gray-100 truncate flex-1">
            {pendingFile.name}
          </span>
          <button
            onClick={() => setPendingFile(null)}
            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-500"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Upload progress */}
      {uploading && (
        <div className="mb-2">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <Loader2 size={14} className="animate-spin" />
            <span>Đang upload... {progress}%</span>
          </div>
          <div className="mt-1 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Discord-style input container */}
      <div className="bg-gray-100 dark:bg-[#383a40] rounded-lg px-4 py-2.5 shadow-sm">
        <form onSubmit={handleSubmit} className="flex items-center">
          {/* Add file button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-6 h-6 rounded-full bg-gray-300 dark:bg-gray-500 flex items-center justify-center hover:bg-gray-400 dark:hover:bg-gray-400 text-gray-600 dark:text-gray-200 mr-3 transition-colors flex-shrink-0 disabled:opacity-50"
            title="Attach file"
          >
            <Plus size={14} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileSelect}
            accept="image/*,.pdf,.txt,.zip,.docx"
          />

          {/* Text input */}
          <textarea
            ref={textInputRef}
            value={content}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={`Message ${currentChannel ? '#' + currentChannel.name : ''}`}
            rows={1}
            className="bg-transparent border-none focus:ring-0 text-gray-800 dark:text-gray-100 placeholder-gray-500 flex-1 py-1 text-sm resize-none focus:outline-none max-h-32"
            style={{
              height: 'auto',
              minHeight: '24px',
            }}
            onInput={(e) => {
              const el = e.target as HTMLTextAreaElement;
              el.style.height = 'auto';
              el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
            }}
          />

          {/* Right side buttons */}
          <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400 flex-shrink-0 ml-2">
            <button
              type="button"
              className="hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              title="Emoji"
            >
              <Smile size={20} />
            </button>
            {(content.trim() || pendingFile) && (
              <button
                type="submit"
                disabled={sending}
                className="text-primary hover:text-primary-600 transition-colors disabled:opacity-50"
                title="Send"
              >
                <Send size={20} />
              </button>
            )}
          </div>
        </form>
      </div>

      {/* ProTip */}
      <div className="text-center mt-1">
        <span className="text-[10px] text-gray-400 dark:text-gray-500">
          <span className="font-bold">ProTip:</span> Hold{' '}
          <span className="bg-gray-200 dark:bg-gray-700 px-1 rounded text-gray-600 dark:text-gray-300 text-[9px]">
            Shift
          </span>{' '}
          +{' '}
          <span className="bg-gray-200 dark:bg-gray-700 px-1 rounded text-gray-600 dark:text-gray-300 text-[9px]">
            Enter
          </span>{' '}
          to add a new line
        </span>
      </div>
    </div>
  );
};
