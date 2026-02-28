import React from 'react';
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff } from 'lucide-react';
import { useState } from 'react';

interface CallControlsProps {
  onHangUp: () => void;
  onToggleCamera: () => void;
  onToggleMic: () => void;
}

export const CallControls: React.FC<CallControlsProps> = ({
  onHangUp,
  onToggleCamera,
  onToggleMic,
}) => {
  const [cameraOn, setCameraOn] = useState(true);
  const [micOn, setMicOn] = useState(true);

  return (
    <div className="flex items-center justify-center gap-4 p-4">
      {/* Toggle Mic */}
      <button
        onClick={() => {
          setMicOn(!micOn);
          onToggleMic();
        }}
        className={`p-3 rounded-full transition-colors ${
          micOn
            ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600'
            : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
        }`}
        title={micOn ? 'Tắt mic' : 'Bật mic'}
      >
        {micOn ? <Mic size={20} /> : <MicOff size={20} />}
      </button>

      {/* Toggle Camera */}
      <button
        onClick={() => {
          setCameraOn(!cameraOn);
          onToggleCamera();
        }}
        className={`p-3 rounded-full transition-colors ${
          cameraOn
            ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600'
            : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
        }`}
        title={cameraOn ? 'Tắt camera' : 'Bật camera'}
      >
        {cameraOn ? <Video size={20} /> : <VideoOff size={20} />}
      </button>

      {/* Hang Up */}
      <button
        onClick={onHangUp}
        className="p-3 rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors"
        title="Kết thúc cuộc gọi"
      >
        <PhoneOff size={20} />
      </button>
    </div>
  );
};
