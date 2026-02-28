import React from 'react';
import { Mic, MicOff, Headphones, VolumeX, PhoneOff, Volume2, Wifi } from 'lucide-react';
import { useVoiceStore } from '../../store/voiceStore';
import { useVoice } from '../../context/VoiceContext';
import clsx from 'clsx';

/**
 * Discord-style "Voice Connected" bar — hiện phía trên user panel khi đang ở voice channel
 */
export const VoiceChannelBar: React.FC = () => {
  const session = useVoiceStore((s) => s.session);
  const { leaveVoice, toggleMute, toggleDeafen } = useVoice();

  if (!session) return null;

  return (
    <div className="bg-green-950/40 dark:bg-[#1e2a1e] border-t border-green-900/30">
      {/* Status row */}
      <div className="flex items-center px-3 pt-2 pb-1 gap-2">
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <Wifi size={12} className="text-green-400 flex-shrink-0" />
          <span className="text-xs font-semibold text-green-400 truncate">Voice Connected</span>
        </div>
        {/* Disconnect button */}
        <button
          onClick={leaveVoice}
          className="flex items-center gap-1 text-gray-400 hover:text-red-400 transition-colors p-1 rounded hover:bg-red-400/10"
          title="Rời kênh thoại"
        >
          <PhoneOff size={14} />
        </button>
      </div>

      {/* Channel name row */}
      <div className="flex items-center px-3 pb-2 gap-1.5">
        <Volume2 size={11} className="text-green-500 flex-shrink-0" />
        <span className="text-[11px] text-green-500 truncate flex-1">{session.channelName}</span>
      </div>

      {/* Controls row */}
      <div className="flex items-center px-3 pb-2 gap-1">
        {/* Mic toggle */}
        <button
          onClick={toggleMute}
          title={session.isMuted ? 'Bật mic' : 'Tắt mic'}
          className={clsx(
            'flex-1 flex items-center justify-center gap-1.5 py-1 rounded text-xs font-medium transition-colors',
            session.isMuted
              ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
              : 'bg-gray-200/60 dark:bg-gray-700/60 text-gray-600 dark:text-gray-300 hover:bg-gray-300/60 dark:hover:bg-gray-600/60'
          )}
        >
          {session.isMuted ? <MicOff size={13} /> : <Mic size={13} />}
          <span>{session.isMuted ? 'Muted' : 'Mic'}</span>
        </button>

        {/* Deafen toggle */}
        <button
          onClick={toggleDeafen}
          title={session.isDeafened ? 'Bỏ điếc' : 'Tắt tai nghe'}
          className={clsx(
            'flex-1 flex items-center justify-center gap-1.5 py-1 rounded text-xs font-medium transition-colors',
            session.isDeafened
              ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
              : 'bg-gray-200/60 dark:bg-gray-700/60 text-gray-600 dark:text-gray-300 hover:bg-gray-300/60 dark:hover:bg-gray-600/60'
          )}
        >
          {session.isDeafened
            ? <VolumeX size={13} />
            : <Headphones size={13} />}
          <span>{session.isDeafened ? 'Deafened' : 'Sound'}</span>
        </button>
      </div>
    </div>
  );
};
