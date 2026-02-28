# 09 - WEBRTC VIDEO CALL
## P2P với simple-peer + Socket.io Signaling (localhost)

---

## Cài đặt

```bash
# Client
npm install simple-peer
npm install -D @types/simple-peer
```

---

## Server — Video Handler

```typescript
// server/src/socket/handlers/video.handler.ts
export const registerVideoHandlers = (io, socket) => {
  socket.on('call_user', ({ targetUserId, roomId }) => {
    io.to(`user:${targetUserId}`).emit('incoming_call', {
      callerId:   socket.userId,
      roomId
    });
  });

  socket.on('accept_call', ({ callerId, roomId }) => {
    socket.join(`video:${roomId}`);
    io.to(`user:${callerId}`).emit('call_accepted', { userId: socket.userId, roomId });
  });

  socket.on('reject_call', ({ callerId }) => {
    io.to(`user:${callerId}`).emit('call_rejected', { userId: socket.userId });
  });

  socket.on('end_call', ({ roomId }) => {
    io.to(`video:${roomId}`).emit('call_ended', { userId: socket.userId });
    socket.leave(`video:${roomId}`);
  });

  // Forward WebRTC signals — server chỉ relay, không xử lý
  socket.on('webrtc_offer', ({ targetUserId, offer }) => {
    io.to(`user:${targetUserId}`).emit('webrtc_offer', { fromUserId: socket.userId, offer });
  });

  socket.on('webrtc_answer', ({ targetUserId, answer }) => {
    io.to(`user:${targetUserId}`).emit('webrtc_answer', { fromUserId: socket.userId, answer });
  });

  socket.on('webrtc_ice_candidate', ({ targetUserId, candidate }) => {
    io.to(`user:${targetUserId}`).emit('webrtc_ice_candidate', { fromUserId: socket.userId, candidate });
  });
};
```

---

## Client — useWebRTC Hook

```typescript
// client/src/hooks/useWebRTC.ts
import { useRef, useState, useCallback, useEffect } from 'react';
import SimplePeer from 'simple-peer';
import { getSocket } from '../socket/socket';

// STUN servers miễn phí (localhost dev dùng được)
const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' }
];

export const useWebRTC = () => {
  const [localStream,  setLocalStream]  = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [callStatus, setCallStatus] = useState<'idle'|'calling'|'ringing'|'connected'|'ended'>('idle');
  const [incomingCall, setIncomingCall] = useState<{ callerId: string; roomId: string } | null>(null);

  const peerRef    = useRef<SimplePeer.Instance | null>(null);
  const roomIdRef  = useRef<string>('');
  const socket     = getSocket();

  // --- Lấy camera + mic ---
  const getMedia = async (video = true, audio = true) => {
    const stream = await navigator.mediaDevices.getUserMedia({ video, audio });
    setLocalStream(stream);
    return stream;
  };

  // --- Gọi cho người khác ---
  const callUser = useCallback(async (targetUserId: string) => {
    const roomId = `${socket!.id}-${targetUserId}-${Date.now()}`;
    roomIdRef.current = roomId;

    const stream = await getMedia();
    setCallStatus('calling');

    socket!.emit('call_user', { targetUserId, roomId });

    // Chờ accept thì tạo peer
    socket!.once('call_accepted', ({ roomId: rid }) => {
      if (rid !== roomId) return;

      socket!.join?.(`video:${roomId}`); // không cần join từ client
      const peer = new SimplePeer({
        initiator: true,
        trickle: true,
        stream,
        config: { iceServers: ICE_SERVERS }
      });

      peer.on('signal', (offer) => {
        socket!.emit('webrtc_offer', { targetUserId, offer });
      });

      peer.on('stream', (remote) => {
        setRemoteStream(remote);
        setCallStatus('connected');
      });

      peerRef.current = peer;
    });
  }, [socket]);

  // --- Nghe events từ socket ---
  useEffect(() => {
    if (!socket) return;

    // Có người gọi đến
    socket.on('incoming_call', ({ callerId, roomId }) => {
      setIncomingCall({ callerId, roomId });
      setCallStatus('ringing');
    });

    // Nhận offer → tạo peer answer
    socket.on('webrtc_offer', async ({ fromUserId, offer }) => {
      const stream = localStream || await getMedia();

      const peer = new SimplePeer({
        initiator: false,
        trickle: true,
        stream,
        config: { iceServers: ICE_SERVERS }
      });

      peer.on('signal', (answer) => {
        socket.emit('webrtc_answer', { targetUserId: fromUserId, answer });
      });

      peer.on('stream', (remote) => {
        setRemoteStream(remote);
        setCallStatus('connected');
      });

      peer.signal(offer);
      peerRef.current = peer;
    });

    // Nhận answer
    socket.on('webrtc_answer', ({ answer }) => {
      peerRef.current?.signal(answer);
    });

    // Nhận ICE candidate
    socket.on('webrtc_ice_candidate', ({ candidate }) => {
      peerRef.current?.signal(candidate);
    });

    socket.on('call_ended', () => hangUp());
    socket.on('call_rejected', () => {
      setCallStatus('ended');
      cleanUp();
    });

    return () => {
      socket.off('incoming_call');
      socket.off('webrtc_offer');
      socket.off('webrtc_answer');
      socket.off('webrtc_ice_candidate');
      socket.off('call_ended');
      socket.off('call_rejected');
    };
  }, [socket, localStream]);

  // --- Chấp nhận cuộc gọi ---
  const acceptCall = useCallback(async () => {
    if (!incomingCall) return;
    socket!.emit('accept_call', { callerId: incomingCall.callerId, roomId: incomingCall.roomId });
    roomIdRef.current = incomingCall.roomId;
    setCallStatus('connected');
    setIncomingCall(null);
  }, [incomingCall, socket]);

  // --- Từ chối ---
  const rejectCall = useCallback(() => {
    if (!incomingCall) return;
    socket!.emit('reject_call', { callerId: incomingCall.callerId });
    setIncomingCall(null);
    setCallStatus('idle');
  }, [incomingCall, socket]);

  // --- Kết thúc ---
  const hangUp = useCallback(() => {
    if (roomIdRef.current)
      socket!.emit('end_call', { roomId: roomIdRef.current });
    cleanUp();
  }, [socket]);

  const cleanUp = () => {
    peerRef.current?.destroy();
    peerRef.current = null;
    localStream?.getTracks().forEach(t => t.stop());
    setLocalStream(null);
    setRemoteStream(null);
    setCallStatus('ended');
    setTimeout(() => setCallStatus('idle'), 2000);
  };

  // --- Toggle mic/camera ---
  const toggleMic = () => {
    localStream?.getAudioTracks().forEach(t => t.enabled = !t.enabled);
  };

  const toggleCamera = () => {
    localStream?.getVideoTracks().forEach(t => t.enabled = !t.enabled);
  };

  return {
    localStream, remoteStream, callStatus, incomingCall,
    callUser, acceptCall, rejectCall, hangUp, toggleMic, toggleCamera
  };
};
```

---

## VideoCallModal Component (UI)

```typescript
// client/src/components/video/VideoCallModal.tsx
import { useEffect, useRef } from 'react';

export const VideoCallModal = ({ localStream, remoteStream, callStatus, onHangUp, onToggleMic, onToggleCamera }) => {
  const localRef  = useRef<HTMLVideoElement>(null);
  const remoteRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (localRef.current  && localStream)  localRef.current.srcObject  = localStream;
    if (remoteRef.current && remoteStream) remoteRef.current.srcObject = remoteStream;
  }, [localStream, remoteStream]);

  if (callStatus === 'idle') return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="relative w-full max-w-2xl">
        {/* Remote video (full) */}
        <video ref={remoteRef} autoPlay playsInline className="w-full rounded-xl" />

        {/* Local video (small, góc dưới phải) */}
        <video ref={localRef} autoPlay playsInline muted
          className="absolute bottom-4 right-4 w-40 rounded-lg border-2 border-white" />

        {/* Controls */}
        <div className="flex justify-center gap-4 mt-4">
          <button onClick={onToggleMic}    className="p-3 bg-gray-700 rounded-full text-white">🎤</button>
          <button onClick={onToggleCamera} className="p-3 bg-gray-700 rounded-full text-white">📷</button>
          <button onClick={onHangUp}       className="p-3 bg-red-600 rounded-full text-white">📵</button>
        </div>

        <p className="text-center text-white mt-2">{callStatus}</p>
      </div>
    </div>
  );
};
```
