import { useRef, useState, useCallback, useEffect } from 'react';
import SimplePeer from 'simple-peer';
import { getSocket } from '../socket/socket';
import { ICE_SERVERS } from '../utils/constants';

export type CallStatus = 'idle' | 'calling' | 'ringing' | 'connected' | 'ended';

interface IncomingCall {
  callerId: string;
  callerName?: string;
  roomId: string;
}

/**
 * Hook quản lý WebRTC video call P2P
 * - Dùng simple-peer + Socket.io signaling
 * - STUN servers miễn phí của Google
 */
export const useWebRTC = () => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [callStatus, setCallStatus] = useState<CallStatus>('idle');
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);

  const peerRef = useRef<SimplePeer.Instance | null>(null);
  const roomIdRef = useRef<string>('');
  const localStreamRef = useRef<MediaStream | null>(null);

  const socket = getSocket();

  // Lấy camera + mic
  const getMedia = useCallback(async (video = true, audio = true) => {
    const stream = await navigator.mediaDevices.getUserMedia({ video, audio });
    setLocalStream(stream);
    localStreamRef.current = stream;
    return stream;
  }, []);

  // Cleanup media streams
  const cleanUp = useCallback(() => {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    peerRef.current?.destroy();
    peerRef.current = null;
    setLocalStream(null);
    setRemoteStream(null);
    localStreamRef.current = null;
  }, []);

  // Gọi cho user khác
  const callUser = useCallback(
    async (targetUserId: string) => {
      if (!socket) return;

      const roomId = `${socket.id}-${targetUserId}-${Date.now()}`;
      roomIdRef.current = roomId;

      const stream = await getMedia();
      setCallStatus('calling');

      socket.emit('call_user', { targetUserId, roomId });

      // Chờ accept → tạo peer (initiator)
      socket.once('call_accepted', ({ roomId: rid }: { roomId: string }) => {
        if (rid !== roomId) return;

        const peer = new SimplePeer({
          initiator: true,
          trickle: true,
          stream,
          config: { iceServers: ICE_SERVERS },
        });

        peer.on('signal', (offer: any) => {
          socket.emit('webrtc_offer', { targetUserId, offer });
        });

        peer.on('stream', (remote: MediaStream) => {
          setRemoteStream(remote);
          setCallStatus('connected');
        });

        peer.on('error', (err: Error) => {
          console.error('[WebRTC] Peer error:', err);
          setCallStatus('ended');
          cleanUp();
        });

        peerRef.current = peer;
      });
    },
    [socket, getMedia, cleanUp]
  );

  // Chấp nhận cuộc gọi
  const acceptCall = useCallback(async () => {
    if (!incomingCall || !socket) return;

    socket.emit('accept_call', {
      callerId: incomingCall.callerId,
      roomId: incomingCall.roomId,
    });
    roomIdRef.current = incomingCall.roomId;

    await getMedia();
    setCallStatus('connected');
    setIncomingCall(null);
  }, [incomingCall, socket, getMedia]);

  // Từ chối cuộc gọi
  const rejectCall = useCallback(() => {
    if (!incomingCall || !socket) return;
    socket.emit('reject_call', { callerId: incomingCall.callerId });
    setIncomingCall(null);
    setCallStatus('idle');
  }, [incomingCall, socket]);

  // Kết thúc cuộc gọi
  const hangUp = useCallback(() => {
    if (!socket) return;
    socket.emit('end_call', { roomId: roomIdRef.current });
    setCallStatus('ended');
    cleanUp();
    setTimeout(() => setCallStatus('idle'), 2000);
  }, [socket, cleanUp]);

  // Toggle camera
  const toggleCamera = useCallback(() => {
    localStreamRef.current?.getVideoTracks().forEach((t) => {
      t.enabled = !t.enabled;
    });
  }, []);

  // Toggle mic
  const toggleMic = useCallback(() => {
    localStreamRef.current?.getAudioTracks().forEach((t) => {
      t.enabled = !t.enabled;
    });
  }, []);

  // Lắng nghe socket events
  useEffect(() => {
    if (!socket) return;

    const handleIncoming = ({ callerId, callerName, roomId }: IncomingCall) => {
      setIncomingCall({ callerId, callerName, roomId });
      setCallStatus('ringing');
    };

    const handleOffer = async ({
      fromUserId,
      offer,
    }: {
      fromUserId: string;
      offer: SimplePeer.SignalData;
    }) => {
      const stream = localStreamRef.current || (await getMedia());

      const peer = new SimplePeer({
        initiator: false,
        trickle: true,
        stream,
        config: { iceServers: ICE_SERVERS },
      });

      peer.on('signal', (answer: any) => {
        socket.emit('webrtc_answer', { targetUserId: fromUserId, answer });
      });

      peer.on('stream', (remote: MediaStream) => {
        setRemoteStream(remote);
        setCallStatus('connected');
      });

      peer.on('error', (err: Error) => {
        console.error('[WebRTC] Peer error:', err);
        setCallStatus('ended');
        cleanUp();
      });

      peer.signal(offer);
      peerRef.current = peer;
    };

    const handleAnswer = ({ answer }: { answer: SimplePeer.SignalData }) => {
      peerRef.current?.signal(answer);
    };

    const handleIce = ({
      candidate,
    }: {
      fromUserId: string;
      candidate: SimplePeer.SignalData;
    }) => {
      peerRef.current?.signal(candidate);
    };

    const handleEnded = () => {
      setCallStatus('ended');
      cleanUp();
      setTimeout(() => setCallStatus('idle'), 2000);
    };

    const handleRejected = () => {
      setCallStatus('ended');
      cleanUp();
      setTimeout(() => setCallStatus('idle'), 2000);
    };

    socket.on('incoming_call', handleIncoming);
    socket.on('webrtc_offer', handleOffer);
    socket.on('webrtc_answer', handleAnswer);
    socket.on('webrtc_ice_candidate', handleIce);
    socket.on('call_ended', handleEnded);
    socket.on('call_rejected', handleRejected);

    return () => {
      socket.off('incoming_call', handleIncoming);
      socket.off('webrtc_offer', handleOffer);
      socket.off('webrtc_answer', handleAnswer);
      socket.off('webrtc_ice_candidate', handleIce);
      socket.off('call_ended', handleEnded);
      socket.off('call_rejected', handleRejected);
    };
  }, [socket, getMedia, cleanUp]);

  return {
    localStream,
    remoteStream,
    callStatus,
    incomingCall,
    callUser,
    acceptCall,
    rejectCall,
    hangUp,
    toggleCamera,
    toggleMic,
  };
};
