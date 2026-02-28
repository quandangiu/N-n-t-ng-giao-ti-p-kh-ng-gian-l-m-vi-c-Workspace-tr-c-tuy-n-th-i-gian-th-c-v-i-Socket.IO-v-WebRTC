import React, { useRef, useEffect } from 'react';

interface VideoStreamProps {
  stream: MediaStream | null;
  muted?: boolean;
  label?: string;
  className?: string;
}

export const VideoStream: React.FC<VideoStreamProps> = ({
  stream,
  muted = false,
  label,
  className = '',
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className={`relative rounded-xl overflow-hidden bg-gray-900 ${className}`}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={muted}
        className="w-full h-full object-cover"
      />
      {!stream && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-4xl">📷</div>
        </div>
      )}
      {label && (
        <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
          {label}
        </div>
      )}
    </div>
  );
};
