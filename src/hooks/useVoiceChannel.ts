import { useRef, useCallback, useEffect } from 'react';
import SimplePeer from 'simple-peer';
import { getSocket, joinVoiceChannel, leaveVoiceChannel } from '../socket/socket';
import { useVoiceStore } from '../store/voiceStore';
import { useChannelStore } from '../store/channelStore';
import { useAuthStore } from '../store/authStore';
import { ICE_SERVERS } from '../utils/constants';

/**
 * WebRTC Mesh Voice Channel — Ref-based fix + Speaking indicator
 *
 * Key features:
 *  1. sessionRef + currentUserRef always up-to-date → no stale closures
 *  2. Socket events registered ONCE (empty deps) → no missed events
 *  3. Auto-rejoin on socket ‘connect’ for F5 recovery (voiceStore persisted)
 *  4. Speaking detection via AudioContext AnalyserNode
 *  5. Signal acknowledgment for better error diagnosis
 */

interface PeerConnection {
  peer: SimplePeer.Instance;
  audioEl: HTMLAudioElement;
}

export const useVoiceChannel = () => {
  const localStreamRef = useRef<MediaStream | null>(null);
  const peersRef = useRef<Map<string, PeerConnection>>(new Map());
  const speakingCleanups = useRef<Map<string, () => void>>(new Map());

  // Reactive state for consumers (VoiceChannelBar etc.)
  const session = useVoiceStore((s) => s.session);
  const { setSession, toggleMute: storeMute, toggleDeafen: storeDeafen } = useVoiceStore();
  const { addVoiceMember, removeVoiceMember, setVoiceMembers } = useChannelStore();

  // Ref mirrors — always current, safe to use inside socket handlers (no stale closures)
  const sessionRef = useRef(useVoiceStore.getState().session);
  useEffect(() => { sessionRef.current = session; }, [session]);

  const currentUserRef = useRef(useAuthStore.getState().user);
  useEffect(() => {
    return useAuthStore.subscribe((s) => { currentUserRef.current = s.user; });
  }, []);

  // ---------------------------------------------------------------------------
  // Speaking detection via AudioContext AnalyserNode
  // ---------------------------------------------------------------------------

  const startSpeakingDetector = useCallback((userId: string, stream: MediaStream) => {
    // Cleanup existing detector for this user
    speakingCleanups.current.get(userId)?.();
    speakingCleanups.current.delete(userId);

    try {
      const audioCtx = new AudioContext();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.5;
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      let wasSpeaking = false;

      const timer = setInterval(() => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
        const avg = sum / dataArray.length;
        const isSpeaking = avg > 8;

        if (isSpeaking !== wasSpeaking) {
          wasSpeaking = isSpeaking;
          useChannelStore.getState().setSpeaking(userId, isSpeaking);

          // Broadcast speaking state to other users via socket
          // Only emit for the local user (self)
          const currentUser = currentUserRef.current;
          const s = sessionRef.current;
          if (currentUser && s && userId === currentUser._id) {
            const socket = getSocket();
            socket?.emit('voice_speaking', {
              channelId: s.channelId,
              isSpeaking,
            });
          }
        }
      }, 100);

      const cleanup = () => {
        clearInterval(timer);
        source.disconnect();
        audioCtx.close().catch(() => { });
        useChannelStore.getState().setSpeaking(userId, false);
      };

      speakingCleanups.current.set(userId, cleanup);
    } catch (err) {
      console.warn('[Voice] Failed to start speaking detector:', err);
    }
  }, []);

  const stopSpeakingDetector = useCallback((userId: string) => {
    speakingCleanups.current.get(userId)?.();
    speakingCleanups.current.delete(userId);
  }, []);

  const stopAllSpeakingDetectors = useCallback(() => {
    speakingCleanups.current.forEach(cleanup => cleanup());
    speakingCleanups.current.clear();
  }, []);

  // ---------------------------------------------------------------------------
  // Peer helpers
  // ---------------------------------------------------------------------------

  const destroyPeer = useCallback((userId: string) => {
    const conn = peersRef.current.get(userId);
    if (!conn) return;
    conn.peer.destroy();
    conn.audioEl.srcObject = null;
    conn.audioEl.remove();
    peersRef.current.delete(userId);
    stopSpeakingDetector(userId);
  }, [stopSpeakingDetector]);

  const destroyAllPeers = useCallback(() => {
    peersRef.current.forEach((_, uid) => destroyPeer(uid));
  }, [destroyPeer]);

  const createPeer = useCallback(
    (targetUserId: string, initiator: boolean, stream: MediaStream) => {
      const socket = getSocket();
      if (!socket) return null;

      destroyPeer(targetUserId); // cleanup stale peer first

      console.log(`[Voice] createPeer: target=${targetUserId}, initiator=${initiator}, streamTracks=${stream.getAudioTracks().length}`);

      const peer = new SimplePeer({
        initiator,
        trickle: true,
        stream,
        config: { iceServers: ICE_SERVERS },
        offerOptions: { offerToReceiveAudio: true, offerToReceiveVideo: false },
      });

      // Create audio element and attach to DOM (required by some browsers)
      const audioEl = document.createElement('audio');
      audioEl.autoplay = true;
      audioEl.volume = 1;
      audioEl.setAttribute('playsinline', '');
      audioEl.style.display = 'none';
      document.body.appendChild(audioEl);

      peer.on('signal', (data: any) => {
        console.log(`[Voice] Sending signal to ${targetUserId}, type=${(data as any).type || 'candidate'}`);
        socket.emit('voice_signal', { to: targetUserId, signal: data }, (response: any) => {
          if (response?.error) {
            console.warn(`[Voice] Signal relay FAILED to ${targetUserId}:`, response.error);
          }
        });
      });


      peer.on('stream', (remoteStream: MediaStream) => {
        const tracks = remoteStream.getAudioTracks();
        console.log(`[Voice] Got remote stream from ${targetUserId}, tracks=${tracks.length}`);
        tracks.forEach((t: MediaStreamTrack, i: number) => {
          console.log(`[Voice]   Track[${i}]: enabled=${t.enabled}, muted=${t.muted}, readyState=${t.readyState}`);
        });

        audioEl.srcObject = remoteStream;
        audioEl.volume = 1;
        audioEl.muted = false;

        const tryPlay = () => {
          audioEl.play()
            .then(() => console.log(`[Voice] ✅ Audio playing for ${targetUserId}`))
            .catch((err) => {
              console.warn('[Voice] Audio play blocked:', err.message, '— will retry on user click');
              // Retry on next user interaction (autoplay policy)
              const resumeOnClick = () => {
                audioEl.play().catch(() => { });
                document.removeEventListener('click', resumeOnClick);
              };
              document.addEventListener('click', resumeOnClick, { once: true });
            });
        };
        tryPlay();

        // Respect current deafen state
        if (sessionRef.current?.isDeafened) audioEl.muted = true;
        // Start speaking detection for remote user
        startSpeakingDetector(targetUserId, remoteStream);
      });

      peer.on('error', (err: Error) => {
        console.warn(`[Voice] Peer error with ${targetUserId}:`, (err as Error).message);
        destroyPeer(targetUserId);
      });

      peer.on('connect', () => {
        console.log(`[Voice] ✅ Peer CONNECTED with ${targetUserId}`);
      });

      peer.on('close', () => destroyPeer(targetUserId));

      peersRef.current.set(targetUserId, { peer, audioEl });
      return peer;
    },
    [destroyPeer, startSpeakingDetector]
  );


  // ---------------------------------------------------------------------------
  // Join voice channel
  // ---------------------------------------------------------------------------
  const joinVoice = useCallback(
    async (channelId: string, channelName: string, workspaceSlug: string) => {
      // Only skip if we're ACTUALLY in this channel (have a live stream).
      // A stale persisted session (after F5) won't have a stream → must rejoin.
      if (sessionRef.current?.channelId === channelId && localStreamRef.current) return;

      // Leave current voice channel first if we're already somewhere
      if (sessionRef.current) {
        leaveVoiceChannel(sessionRef.current.channelId);
        destroyAllPeers();
        localStreamRef.current?.getTracks().forEach((t) => t.stop());
        localStreamRef.current = null;
        const cu = currentUserRef.current;
        if (cu) removeVoiceMember(sessionRef.current.channelId, cu._id);
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        localStreamRef.current = stream;

        const newSession = {
          channelId,
          channelName,
          workspaceSlug,
          isMuted: false,
          isDeafened: false,
          connectedAt: new Date().toISOString(),
        };

        // Update ref IMMEDIATELY so socket handlers see it before React re-renders
        sessionRef.current = newSession;
        setSession(newSession);

        console.log('[Voice] joinVoice — emitting join_voice_channel', channelId, 'stream tracks:', stream.getAudioTracks().length);
        joinVoiceChannel(channelId);

        // Start speaking detection for self (local mic) + Optimistic UI update
        const cu = currentUserRef.current;
        console.log('[Voice] joinVoice — addVoiceMember optimistic, currentUser:', cu?.username, cu?._id);
        if (cu) {
          startSpeakingDetector(cu._id, stream);
          addVoiceMember(channelId, {
            userId: cu._id,
            username: cu.username,
            displayName: (cu as any).displayName || cu.username,
            avatar: cu.avatar ?? null,
            joinedAt: new Date().toISOString(),
            isMuted: false,
            isDeafened: false,
          });
        }
      } catch {
        throw new Error('Không thể truy cập microphone. Vui lòng cấp quyền mic trong trình duyệt.');
      }
    },
    [setSession, addVoiceMember, removeVoiceMember, destroyAllPeers, startSpeakingDetector]
  );

  // ---------------------------------------------------------------------------
  // Leave voice channel
  // ---------------------------------------------------------------------------
  const leaveVoice = useCallback(() => {
    const s = sessionRef.current;
    if (!s) return;
    leaveVoiceChannel(s.channelId);
    destroyAllPeers();
    stopAllSpeakingDetectors();
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    const cu = currentUserRef.current;
    if (cu) removeVoiceMember(s.channelId, cu._id);
    sessionRef.current = null;
    setSession(null);
  }, [setSession, destroyAllPeers, removeVoiceMember, stopAllSpeakingDetectors]);

  // ---------------------------------------------------------------------------
  // Toggle mute
  // ---------------------------------------------------------------------------
  const toggleMute = useCallback(() => {
    const s = sessionRef.current;
    const stream = localStreamRef.current;
    if (!s || !stream) return;
    const newMuted = !s.isMuted;
    stream.getAudioTracks().forEach((t) => (t.enabled = !newMuted));
    storeMute();
    const socket = getSocket();
    socket?.emit('voice_mute', { channelId: s.channelId, isMuted: newMuted });
  }, [storeMute]);

  // ---------------------------------------------------------------------------
  // Toggle deafen
  // ---------------------------------------------------------------------------
  const toggleDeafen = useCallback(() => {
    const s = sessionRef.current;
    if (!s) return;
    const newDeafened = !s.isDeafened;
    peersRef.current.forEach(({ audioEl }) => { audioEl.muted = newDeafened; });
    storeDeafen();
  }, [storeDeafen]);

  // ---------------------------------------------------------------------------
  // Auto-rejoin after F5 — socket reconnects, persisted session detected
  // Also handles initial registration: VoiceProvider mounts BEFORE useSocket()
  // calls connectSocket(), so getSocket() might be null on first effect run.
  // We poll until the socket is available, then register events + auto-rejoin.
  // ---------------------------------------------------------------------------
  useEffect(() => {
    let mounted = true;
    let pollTimer: ReturnType<typeof setInterval> | null = null;
    let cleanupSocket: (() => void) | null = null;

    const setup = () => {
      const socket = getSocket();
      if (!socket) { console.log('[Voice] setup: socket not ready yet'); return false; }
      console.log('[Voice] setup: socket found, connected =', socket.connected, ', registering events');

      // --- Register ONCE: socket voice events ---
      const onUserJoined = ({ userId, channelId }: { userId: string; channelId: string }) => {
        const stream = localStreamRef.current;
        const s = sessionRef.current;
        if (!stream || !s || s.channelId !== channelId || userId === currentUserRef.current?._id) return;
        console.log('[Voice] voice_user_joined — creating non-initiator peer for', userId, 'in channel', channelId);
        createPeer(userId, false, stream);
      };

      const onVoiceChannelUpdated = ({
        channelId,
        members,
      }: {
        channelId: string;
        members: { userId: string }[];
      }) => {
        console.log('[Voice] voice_channel_updated received:', channelId, 'members:', members.length, members.map(m => (m as any).username || m.userId));
        setVoiceMembers(channelId, members as any);

        const stream = localStreamRef.current;
        const s = sessionRef.current;
        if (!stream || !s || channelId !== s.channelId) return;

        members.forEach(({ userId }) => {
          if (userId === currentUserRef.current?._id) return;
          if (!peersRef.current.has(userId)) {
            console.log('[Voice] voice_channel_updated — creating initiator peer for', userId);
            createPeer(userId, true, stream);
          }
        });
      };

      const onVoiceSignal = ({
        from,
        signal,
      }: {
        from: string;
        signal: SimplePeer.SignalData;
      }) => {
        console.log(`[Voice] Received signal from ${from}, type=${(signal as any).type || 'candidate'}, hasPeer=${peersRef.current.has(from)}`);
        const conn = peersRef.current.get(from);
        if (conn) {
          conn.peer.signal(signal);
        } else {
          const stream = localStreamRef.current;
          if (!stream) return;
          console.log('[Voice] Signal race — creating non-initiator peer for', from);
          const peer = createPeer(from, false, stream);
          if (peer) peer.signal(signal);
        }
      };

      const onUserLeft = ({ userId, channelId }: { userId: string; channelId: string }) => {
        console.log('[Voice] voice_user_left:', userId);
        destroyPeer(userId);
        removeVoiceMember(channelId, userId);
      };

      // --- Receive remote speaking state ---
      const onVoiceSpeaking = ({ userId, isSpeaking }: { userId: string; channelId: string; isSpeaking: boolean }) => {
        useChannelStore.getState().setSpeaking(userId, isSpeaking);
      };

      // --- Auto-rejoin on reconnect (F5 or network drop) ---
      const onConnect = async () => {
        if (!mounted) return;
        const s = sessionRef.current;
        if (!s) return;
        console.log('[Voice] Socket (re)connected — auto-rejoin', s.channelName);
        // Clear stale session so joinVoice doesn't think we're already in
        sessionRef.current = null;
        setSession(null);
        // Delay to let auth + join_workspace complete first
        setTimeout(async () => {
          if (!mounted) return;
          try {
            await joinVoice(s.channelId, s.channelName, s.workspaceSlug);
          } catch (err) {
            console.warn('[Voice] Auto-rejoin failed:', err);
            sessionRef.current = null;
            setSession(null);
          }
        }, 1500);
      };

      socket.on('voice_user_joined', onUserJoined);
      socket.on('voice_channel_updated', onVoiceChannelUpdated);
      socket.on('voice_signal', onVoiceSignal);
      socket.on('voice_user_left', onUserLeft);
      socket.on('voice_speaking', onVoiceSpeaking);
      socket.on('connect', onConnect);

      cleanupSocket = () => {
        socket.off('voice_user_joined', onUserJoined);
        socket.off('voice_channel_updated', onVoiceChannelUpdated);
        socket.off('voice_signal', onVoiceSignal);
        socket.off('voice_user_left', onUserLeft);
        socket.off('voice_speaking', onVoiceSpeaking);
        socket.off('connect', onConnect);
      };

      // If socket is ALREADY connected and we have a persisted session → rejoin now
      if (socket.connected && sessionRef.current) {
        console.log('[Voice] setup: socket already connected + persisted session → auto-rejoin');
        onConnect();
      } else {
        console.log('[Voice] setup: no auto-rejoin needed. connected =', socket.connected, ', session =', !!sessionRef.current);
      }

      return true;
    };

    // Try immediately. If socket isn't ready (VoiceProvider mounts before useSocket),
    // poll every 200ms until connectSocket() has been called.
    if (!setup()) {
      pollTimer = setInterval(() => {
        if (!mounted) { clearInterval(pollTimer!); return; }
        if (setup()) { clearInterval(pollTimer!); pollTimer = null; }
      }, 200);
    }

    return () => {
      mounted = false;
      if (pollTimer) clearInterval(pollTimer);
      cleanupSocket?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cleanup on unmount (tab close)
  useEffect(() => {
    return () => {
      const s = sessionRef.current;
      if (s) {
        leaveVoiceChannel(s.channelId);
        destroyAllPeers();
        stopAllSpeakingDetectors();
        localStreamRef.current?.getTracks().forEach((t) => t.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { session, joinVoice, leaveVoice, toggleMute, toggleDeafen };
};
