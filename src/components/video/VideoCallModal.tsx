import React from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { VideoStream } from './VideoStream';
import { CallControls } from './CallControls';
import { useUIStore } from '../../store/uiStore';
import { useWebRTC } from '../../hooks/useWebRTC';
import { Phone, PhoneOff } from 'lucide-react';

export const VideoCallModal: React.FC = () => {
  const isOpen = useUIStore((s) => s.videoCallModalOpen);
  const close = () => useUIStore.getState().setVideoCallModal(false);

  const {
    localStream,
    remoteStream,
    callStatus,
    incomingCall,
    acceptCall,
    rejectCall,
    hangUp,
    toggleCamera,
    toggleMic,
  } = useWebRTC();

  const handleClose = () => {
    if (callStatus === 'connected' || callStatus === 'calling') {
      hangUp();
    }
    close();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Video Call" maxWidth="lg">
      <div className="space-y-4">
        {/* Incoming call notification */}
        {incomingCall && callStatus === 'ringing' && (
          <div className="text-center p-6 space-y-4">
            <div className="text-6xl animate-bounce-slow">📞</div>
            <p className="text-lg text-gray-900 dark:text-white">Cuộc gọi đến...</p>
            <div className="flex justify-center gap-4">
              <Button
                variant="primary"
                onClick={acceptCall}
                className="!bg-emerald-600 hover:!bg-emerald-700"
              >
                <Phone size={18} className="mr-2" /> Chấp nhận
              </Button>
              <Button variant="danger" onClick={rejectCall}>
                <PhoneOff size={18} className="mr-2" /> Từ chối
              </Button>
            </div>
          </div>
        )}

        {/* Calling status */}
        {callStatus === 'calling' && (
          <div className="text-center p-6">
            <div className="text-6xl animate-pulse">📱</div>
            <p className="text-lg text-gray-900 dark:text-white mt-4">Đang gọi...</p>
            <Button variant="danger" onClick={hangUp} className="mt-4">
              <PhoneOff size={18} className="mr-2" /> Hủy
            </Button>
          </div>
        )}

        {/* Connected — show video streams */}
        {callStatus === 'connected' && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <VideoStream
                stream={localStream}
                muted
                label="Bạn"
                className="aspect-video"
              />
              <VideoStream
                stream={remoteStream}
                label="Đối phương"
                className="aspect-video"
              />
            </div>
            <CallControls
              onHangUp={hangUp}
              onToggleCamera={toggleCamera}
              onToggleMic={toggleMic}
            />
          </>
        )}

        {/* Ended */}
        {callStatus === 'ended' && (
          <div className="text-center p-6">
            <p className="text-lg text-gray-500 dark:text-gray-400">Cuộc gọi đã kết thúc</p>
          </div>
        )}

        {/* Idle */}
        {callStatus === 'idle' && !incomingCall && (
          <div className="text-center p-6 text-gray-500 dark:text-gray-400">
            <p>Sẵn sàng gọi video. Chọn một user để bắt đầu cuộc gọi.</p>
          </div>
        )}
      </div>
    </Modal>
  );
};
