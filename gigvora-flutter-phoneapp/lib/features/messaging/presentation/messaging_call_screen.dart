import 'dart:async';

import 'package:agora_rtc_engine/agora_rtc_engine.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:permission_handler/permission_handler.dart';

import '../data/models/thread_message.dart';
import '../application/messaging_controller.dart';

class MessagingCallScreen extends ConsumerStatefulWidget {
  const MessagingCallScreen({super.key, required this.session, required this.onEnd});

  final CallSession session;
  final VoidCallback onEnd;

  @override
  ConsumerState<MessagingCallScreen> createState() => _MessagingCallScreenState();
}

class _MessagingCallScreenState extends ConsumerState<MessagingCallScreen> {
  late final RtcEngine _engine;
  bool _initialised = false;
  bool _joined = false;
  bool _micEnabled = true;
  bool _cameraEnabled = false;
  String? _error;
  final Set<int> _remoteUsers = <int>{};

  @override
  void initState() {
    super.initState();
    _cameraEnabled = widget.session.callType == 'video';
    unawaited(_bootstrap());
    ref.listen<MessagingState>(messagingControllerProvider, (previous, next) {
      if (previous?.callSession != null && next.callSession == null) {
        _hangUp();
      }
    });
  }

  Future<void> _bootstrap() async {
    final permissions = <Permission>[Permission.microphone];
    if (widget.session.callType == 'video') {
      permissions.add(Permission.camera);
    }
    final results = await permissions.request();
    final denied = results.entries.where((entry) => entry.value.isDenied || entry.value.isPermanentlyDenied).toList();
    if (denied.isNotEmpty) {
      setState(() {
        _error = 'Microphone and camera permissions are required to join the call.';
      });
      return;
    }

    _engine = createAgoraRtcEngine();
    await _engine.initialize(RtcEngineContext(appId: widget.session.agoraAppId ?? ''));
    _engine.registerEventHandler(RtcEngineEventHandler(
      onJoinChannelSuccess: (RtcConnection connection, int elapsed) {
        if (!mounted) return;
        setState(() {
          _joined = true;
          _error = null;
        });
      },
      onUserJoined: (RtcConnection connection, int uid, int elapsed) {
        if (!mounted) return;
        setState(() {
          _remoteUsers.add(uid);
        });
      },
      onUserOffline: (RtcConnection connection, int uid, UserOfflineReasonType reason) {
        if (!mounted) return;
        setState(() {
          _remoteUsers.remove(uid);
        });
      },
      onError: (ErrorCodeType code, String message) {
        if (!mounted) return;
        setState(() {
          _error = message;
        });
      },
    ));

    await _engine.enableAudio();
    if (widget.session.callType == 'video') {
      await _engine.enableVideo();
      await _engine.startPreview();
    } else {
      await _engine.disableVideo();
    }

    final options = ChannelMediaOptions(
      channelProfile: ChannelProfileType.channelProfileCommunication,
      clientRoleType: ClientRoleType.clientRoleBroadcaster,
      publishCameraTrack: widget.session.callType == 'video',
      publishMicrophoneTrack: true,
      autoSubscribeAudio: true,
      autoSubscribeVideo: true,
      enableAudioRecordingOrPlayout: true,
    );

    await _engine.joinChannel(
      token: widget.session.rtcToken ?? '',
      channelId: widget.session.channelName,
      uid: 0,
      options: options,
    );

    setState(() {
      _initialised = true;
    });
  }

  Future<void> _toggleMic() async {
    if (!_initialised) return;
    try {
      _micEnabled = !_micEnabled;
      await _engine.muteLocalAudioStream(!_micEnabled);
      setState(() {});
    } catch (error) {
      setState(() {
        _error = 'Unable to toggle microphone: $error';
      });
    }
  }

  Future<void> _toggleCamera() async {
    if (!_initialised || widget.session.callType != 'video') return;
    try {
      _cameraEnabled = !_cameraEnabled;
      await _engine.muteLocalVideoStream(!_cameraEnabled);
      setState(() {});
    } catch (error) {
      setState(() {
        _error = 'Unable to toggle camera: $error';
      });
    }
  }

  Future<void> _hangUp() async {
    if (_initialised) {
      await _engine.leaveChannel();
      await _engine.release();
      _initialised = false;
    }
    if (mounted) {
      widget.onEnd();
    }
  }

  @override
  void dispose() {
    if (_initialised) {
      unawaited(_engine.leaveChannel());
      unawaited(_engine.release());
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final session = widget.session;
    return Scaffold(
      appBar: AppBar(
        title: Text(session.callType == 'video' ? 'Video call' : 'Voice call'),
        actions: [
          IconButton(
            icon: const Icon(Icons.call_end),
            onPressed: _hangUp,
            tooltip: 'End call',
            color: theme.colorScheme.error,
          ),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Channel ${session.channelName}',
                    style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    session.hasCredentials
                        ? 'Expires ${session.expiresAt?.toLocal().toString() ?? 'soon'}'
                        : 'Waiting for call credentials…',
                    style: theme.textTheme.bodySmall,
                  ),
                  if (_error != null) ...[
                    const SizedBox(height: 8),
                    Text(
                      _error!,
                      style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.error),
                    ),
                  ],
                ],
              ),
            ),
            Expanded(
              child: widget.session.callType == 'video'
                  ? _VideoStage(
                      engine: _engine,
                      remoteUsers: _remoteUsers,
                      channelId: session.channelName,
                    )
                  : _VoiceStage(joined: _joined, remoteUsers: _remoteUsers),
            ),
            Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: [
                  FilledButton.tonal(
                    onPressed: _toggleMic,
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(_micEnabled ? Icons.mic : Icons.mic_off),
                        const SizedBox(width: 8),
                        Text(_micEnabled ? 'Mute' : 'Unmute'),
                      ],
                    ),
                  ),
                  if (widget.session.callType == 'video')
                    FilledButton.tonal(
                      onPressed: _toggleCamera,
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(_cameraEnabled ? Icons.videocam : Icons.videocam_off),
                          const SizedBox(width: 8),
                          Text(_cameraEnabled ? 'Disable video' : 'Enable video'),
                        ],
                      ),
                    ),
                  FilledButton(
                    style: FilledButton.styleFrom(backgroundColor: theme.colorScheme.error),
                    onPressed: _hangUp,
                    child: const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.call_end),
                        SizedBox(width: 8),
                        Text('End call'),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _VideoStage extends StatelessWidget {
  const _VideoStage({required this.engine, required this.remoteUsers, required this.channelId});

  final RtcEngine engine;
  final Set<int> remoteUsers;
  final String channelId;

  @override
  Widget build(BuildContext context) {
    final tiles = <Widget>[
      Padding(
        padding: const EdgeInsets.all(8),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(20),
          child: AgoraVideoView(
            controller: VideoViewController(
              rtcEngine: engine,
              canvas: const VideoCanvas(uid: 0),
            ),
          ),
        ),
      ),
      ...remoteUsers.map(
        (uid) => Padding(
          padding: const EdgeInsets.all(8),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(20),
            child: AgoraVideoView(
              controller: VideoViewController.remote(
                rtcEngine: engine,
                canvas: VideoCanvas(uid: uid),
                connection: RtcConnection(channelId: channelId),
              ),
            ),
          ),
        ),
      ),
    ];

    final crossAxis = tiles.length > 1 ? 2 : 1;
    return GridView.count(
      crossAxisCount: crossAxis,
      children: tiles,
    );
  }
}

class _VoiceStage extends StatelessWidget {
  const _VoiceStage({required this.joined, required this.remoteUsers});

  final bool joined;
  final Set<int> remoteUsers;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.graphic_eq, size: 64, color: theme.colorScheme.primary),
          const SizedBox(height: 16),
          Text(joined ? 'Connected' : 'Connecting…', style: theme.textTheme.titleMedium),
          const SizedBox(height: 8),
          Text('Participants: ${remoteUsers.length + 1}', style: theme.textTheme.bodySmall),
        ],
      ),
    );
  }
}
