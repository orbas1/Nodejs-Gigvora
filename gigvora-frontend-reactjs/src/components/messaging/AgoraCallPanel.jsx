import { useCallback, useEffect, useRef, useState } from 'react';
import AgoraRTC from 'agora-rtc-sdk-ng';
import {
  MicrophoneIcon,
  MicrophoneSlashIcon,
  PhoneXMarkIcon,
  VideoCameraIcon,
  VideoCameraSlashIcon,
} from '@heroicons/react/24/outline';
import { formatRelativeTime } from '../../utils/date.js';

function RemoteTile({ user }) {
  return (
    <div className="relative flex h-40 w-full items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-900/80 text-white shadow-inner">
      <div id={`remote-${user.uid}`} className="h-full w-full" />
      <span className="pointer-events-none absolute bottom-2 right-2 rounded-full bg-slate-900/70 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide">
        {user.uid}
      </span>
    </div>
  );
}

export default function AgoraCallPanel({ session, onClose }) {
  const clientRef = useRef(null);
  const localTracksRef = useRef([]);
  const localVideoRef = useRef(null);
  const [remoteUsers, setRemoteUsers] = useState([]);
  const [micEnabled, setMicEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(session?.callType === 'video');
  const [error, setError] = useState(null);

  const cleanupClient = useCallback(async () => {
    const tracks = localTracksRef.current;
    localTracksRef.current = [];
    for (const track of tracks) {
      try {
        track.stop();
        track.close();
      } catch (err) {
        console.warn('Failed to stop local track', err);
      }
    }

    const client = clientRef.current;
    if (client) {
      try {
        client.removeAllListeners();
        await client.leave();
      } catch (err) {
        console.warn('Failed to leave Agora client', err);
      }
      clientRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!session) {
      return undefined;
    }

    let mounted = true;
    setError(null);
    setRemoteUsers([]);
    setMicEnabled(true);
    setCameraEnabled(session.callType === 'video');

    const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
    clientRef.current = client;

    const refreshRemoteUsers = () => {
      if (mounted) {
        setRemoteUsers([...client.remoteUsers]);
      }
    };

    client.on('user-published', async (user, mediaType) => {
      try {
        await client.subscribe(user, mediaType);
        if (mediaType === 'video') {
          setRemoteUsers([...client.remoteUsers]);
          setTimeout(() => {
            try {
              user.videoTrack?.play(`remote-${user.uid}`);
            } catch (err) {
              console.warn('Unable to render remote video', err);
            }
          }, 0);
        }
        if (mediaType === 'audio') {
          user.audioTrack?.play();
          refreshRemoteUsers();
        }
      } catch (err) {
        console.error('Failed to subscribe to remote user', err);
      }
    });

    client.on('user-unpublished', (user, mediaType) => {
      if (mediaType === 'video') {
        user.videoTrack?.stop();
      }
      if (mediaType === 'audio') {
        user.audioTrack?.stop();
      }
      refreshRemoteUsers();
    });

    client.on('user-left', () => {
      refreshRemoteUsers();
    });

    const startCall = async () => {
      try {
        await client.join(session.agoraAppId, session.channelName, session.rtcToken, session.identity);
        if (session.callType === 'video') {
          const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
          localTracksRef.current = [audioTrack, videoTrack];
          videoTrack.play(localVideoRef.current);
          await client.publish([audioTrack, videoTrack]);
        } else {
          const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
          localTracksRef.current = [audioTrack];
          await client.publish([audioTrack]);
        }
      } catch (err) {
        console.error('Failed to start Agora call', err);
        if (mounted) {
          setError(err?.message ?? 'Unable to start the call. Check your microphone and camera permissions.');
        }
      }
    };

    startCall();

    return () => {
      mounted = false;
      cleanupClient();
    };
  }, [session, cleanupClient]);

  const leaveCall = useCallback(async () => {
    await cleanupClient();
    if (typeof onClose === 'function') {
      onClose();
    }
  }, [cleanupClient, onClose]);

  const toggleMic = useCallback(async () => {
    const [audioTrack] = localTracksRef.current;
    if (!audioTrack) {
      return;
    }
    try {
      if (micEnabled) {
        await audioTrack.setEnabled(false);
        setMicEnabled(false);
      } else {
        await audioTrack.setEnabled(true);
        setMicEnabled(true);
      }
    } catch (err) {
      console.warn('Failed to toggle microphone', err);
    }
  }, [micEnabled]);

  const toggleCamera = useCallback(async () => {
    if (session?.callType !== 'video') {
      return;
    }
    const videoTrack = localTracksRef.current?.[1];
    if (!videoTrack) {
      return;
    }
    try {
      if (cameraEnabled) {
        await videoTrack.setEnabled(false);
        setCameraEnabled(false);
      } else {
        await videoTrack.setEnabled(true);
        setCameraEnabled(true);
      }
    } catch (err) {
      console.warn('Failed to toggle camera', err);
    }
  }, [cameraEnabled, session?.callType]);

  if (!session) {
    return null;
  }

  return (
    <div className="mt-4 rounded-3xl border border-slate-200 bg-white shadow-lg">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-slate-800">
            {session.callType === 'video' ? 'Video call in progress' : 'Voice call in progress'}
          </p>
          <p className="text-xs text-slate-500">
            Channel {session.channelName} • expires {formatRelativeTime(session.expiresAt)}
          </p>
        </div>
        <button
          type="button"
          onClick={leaveCall}
          className="inline-flex items-center gap-2 rounded-full bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-rose-700"
        >
          <PhoneXMarkIcon className="h-4 w-4" /> Leave call
        </button>
      </div>
      {error ? (
        <div className="px-4 py-5 text-sm text-rose-600">
          {error}
          <div className="mt-3">
            <button
              type="button"
              onClick={leaveCall}
              className="rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600 transition hover:border-rose-400 hover:text-rose-700"
            >
              Close
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4 px-4 py-5">
          <div className={`grid gap-3 ${remoteUsers.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {remoteUsers.length === 0 ? (
              <div className="flex h-40 w-full items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-500">
                Waiting for others to join…
              </div>
            ) : (
              remoteUsers.map((user) => <RemoteTile key={user.uid} user={user} />)
            )}
          </div>
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
            <div
              ref={localVideoRef}
              className={`relative flex h-28 w-40 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-900/80 text-xs font-semibold uppercase tracking-wide text-white shadow-inner ${
                session.callType === 'video' ? '' : 'opacity-70'
              }`}
            >
              {session.callType === 'video' ? 'You' : 'Microphone active'}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleMic}
                className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  micEnabled
                    ? 'border border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    : 'border border-amber-400 bg-amber-50 text-amber-600 hover:border-amber-500'
                }`}
              >
                {micEnabled ? (
                  <MicrophoneIcon className="h-4 w-4" />
                ) : (
                  <MicrophoneSlashIcon className="h-4 w-4" />
                )}
                {micEnabled ? 'Mute' : 'Unmute'}
              </button>
              {session.callType === 'video' ? (
                <button
                  type="button"
                  onClick={toggleCamera}
                  className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    cameraEnabled
                      ? 'border border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      : 'border border-amber-400 bg-amber-50 text-amber-600 hover:border-amber-500'
                  }`}
                >
                  {cameraEnabled ? (
                    <VideoCameraIcon className="h-4 w-4" />
                  ) : (
                    <VideoCameraSlashIcon className="h-4 w-4" />
                  )}
                  {cameraEnabled ? 'Stop video' : 'Start video'}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
