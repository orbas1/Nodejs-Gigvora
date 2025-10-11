import 'dart:async';
import 'dart:convert';
import 'dart:math' as math;

import 'package:logging/logging.dart';
import 'package:web_socket_channel/io.dart';
import 'package:web_socket_channel/web_socket_channel.dart';

import '../config/app_config.dart';
import '../network/graphql_gateway.dart' show AuthTokenResolver;

typedef WebSocketConnector = WebSocketChannel Function(
  Uri uri, {
  Iterable<String>? protocols,
  Map<String, dynamic>? headers,
});

enum RealtimeConnectionState { disconnected, connecting, connected }

class RealtimeMessage {
  RealtimeMessage({
    required this.topic,
    required this.event,
    required this.receivedAt,
    this.payload,
    this.raw,
  });

  final String topic;
  final String event;
  final DateTime receivedAt;
  final Map<String, dynamic>? payload;
  final dynamic raw;
}

class RealtimeGateway {
  RealtimeGateway({
    required AppConfig config,
    AuthTokenResolver? authTokenResolver,
    Duration? pingInterval,
    Duration? reconnectBaseDelay,
    WebSocketConnector? connector,
    Logger? logger,
  })  : _config = config,
        _authTokenResolver = authTokenResolver,
        _pingInterval = pingInterval ?? const Duration(seconds: 30),
        _reconnectBaseDelay = reconnectBaseDelay ?? const Duration(seconds: 2),
        _connector = connector ??
            ((uri, {protocols, headers}) =>
                IOWebSocketChannel.connect(uri, protocols: protocols, headers: headers)),
        _logger = logger ?? Logger('RealtimeGateway');

  final AppConfig _config;
  final AuthTokenResolver? _authTokenResolver;
  final Duration _pingInterval;
  final Duration _reconnectBaseDelay;
  final WebSocketConnector _connector;
  final Logger _logger;

  final Map<String, Map<String, dynamic>> _topics = <String, Map<String, dynamic>>{};
  final StreamController<RealtimeMessage> _messageController =
      StreamController<RealtimeMessage>.broadcast();
  final StreamController<RealtimeConnectionState> _statusController =
      StreamController<RealtimeConnectionState>.broadcast();

  WebSocketChannel? _channel;
  StreamSubscription? _channelSubscription;
  Timer? _pingTimer;
  Timer? _reconnectTimer;
  int _reconnectAttempts = 0;
  bool _connecting = false;
  bool _disposed = false;
  RealtimeConnectionState _status = RealtimeConnectionState.disconnected;

  Stream<RealtimeMessage> streamFor(String topic, {Map<String, dynamic>? parameters}) {
    if (_disposed) {
      throw StateError('RealtimeGateway has been disposed.');
    }
    _topics[topic] = parameters ?? const <String, dynamic>{};
    _ensureConnected();
    if (_channel != null) {
      _send({
        'type': 'subscribe',
        'topic': topic,
        'payload': _topics[topic],
      });
    }
    return _messageController.stream.where((message) => message.topic == topic);
  }

  Stream<RealtimeConnectionState> get statusStream => _statusController.stream;

  RealtimeConnectionState get status => _status;

  Future<void> ensureConnected() async {
    _ensureConnected();
    while (_connecting) {
      await Future<void>.delayed(const Duration(milliseconds: 50));
    }
  }

  Future<void> dispose() async {
    if (_disposed) {
      return;
    }
    _disposed = true;
    _reconnectTimer?.cancel();
    _pingTimer?.cancel();
    await _channelSubscription?.cancel();
    await _channel?.sink.close();
    _channel = null;
    await _messageController.close();
    await _statusController.close();
  }

  Future<void> unsubscribe(String topic) async {
    _topics.remove(topic);
    if (_channel != null) {
      _send({
        'type': 'unsubscribe',
        'topic': topic,
      });
    }
    if (_topics.isEmpty) {
      await _teardownChannel();
    }
  }

  void _ensureConnected() {
    if (_disposed || _connecting || _channel != null || _topics.isEmpty) {
      return;
    }
    _connecting = true;
    _setStatus(RealtimeConnectionState.connecting);
    _connect().whenComplete(() => _connecting = false);
  }

  Future<void> _connect() async {
    try {
      final headers = <String, dynamic>{};
      if (_authTokenResolver != null) {
        final token = await _authTokenResolver!();
        if (token != null && token.isNotEmpty) {
          headers['Authorization'] = 'Bearer $token';
        }
      }

      final channel = _connector(
        _config.realtimeEndpoint,
        headers: headers.isEmpty ? null : headers,
      );

      _channel = channel;
      _channelSubscription = channel.stream.listen(
        _handleMessage,
        onError: _handleError,
        onDone: _handleDone,
        cancelOnError: false,
      );

      _startPing();
      _reconnectAttempts = 0;
      _setStatus(RealtimeConnectionState.connected);
      _resubscribeAll();
    } catch (error, stackTrace) {
      _logger.warning('Failed to establish realtime connection', error, stackTrace);
      _scheduleReconnect();
      rethrow;
    }
  }

  Future<void> _teardownChannel() async {
    _pingTimer?.cancel();
    _pingTimer = null;
    await _channelSubscription?.cancel();
    _channelSubscription = null;
    if (_channel != null) {
      await _channel!.sink.close();
      _channel = null;
    }
    _setStatus(RealtimeConnectionState.disconnected);
  }

  void _handleMessage(dynamic raw) {
    try {
      final decoded = _decode(raw);
      final type = (decoded['type'] as String?)?.toLowerCase() ?? 'message';
      switch (type) {
        case 'ping':
          _send({'type': 'pong'});
          return;
        case 'welcome':
        case 'ack':
          _setStatus(RealtimeConnectionState.connected);
          return;
      }

      final topic = decoded['topic'] as String? ?? decoded['channel'] as String?;
      if (topic == null) {
        return;
      }

      Map<String, dynamic>? payload;
      final rawPayload = decoded['payload'];
      if (rawPayload is Map<String, dynamic>) {
        payload = Map<String, dynamic>.from(rawPayload);
      } else if (rawPayload is Map) {
        payload = rawPayload.map((key, value) => MapEntry('$key', value));
      }

      final event = decoded['event'] as String? ?? type;
      _messageController.add(
        RealtimeMessage(
          topic: topic,
          event: event,
          payload: payload,
          raw: decoded,
          receivedAt: DateTime.now(),
        ),
      );
    } catch (error, stackTrace) {
      _logger.warning('Failed to decode realtime payload', error, stackTrace);
    }
  }

  void _handleError(Object error, StackTrace stackTrace) {
    if (_disposed) {
      return;
    }
    _logger.warning('Realtime connection error', error, stackTrace);
    _scheduleReconnect();
  }

  void _handleDone() {
    if (_disposed) {
      return;
    }
    _logger.info('Realtime connection closed');
    _teardownChannel();
    if (_topics.isNotEmpty) {
      _scheduleReconnect();
    }
  }

  void _resubscribeAll() {
    if (_channel == null) {
      return;
    }
    for (final entry in _topics.entries) {
      _send({
        'type': 'subscribe',
        'topic': entry.key,
        'payload': entry.value,
      });
    }
  }

  void _startPing() {
    _pingTimer?.cancel();
    if (_pingInterval <= Duration.zero) {
      return;
    }
    _pingTimer = Timer.periodic(_pingInterval, (_) {
      if (_channel == null) {
        return;
      }
      _send({
        'type': 'ping',
        'timestamp': DateTime.now().toUtc().toIso8601String(),
      });
    });
  }

  void _scheduleReconnect() {
    if (_disposed || _reconnectTimer != null) {
      return;
    }
    _setStatus(RealtimeConnectionState.disconnected);
    final multiplier = math.pow(2, _reconnectAttempts).toInt().clamp(1, 16);
    final millis = (_reconnectBaseDelay.inMilliseconds * multiplier)
        .clamp(_reconnectBaseDelay.inMilliseconds, 30000);
    _reconnectAttempts = (_reconnectAttempts + 1).clamp(0, 10);
    _reconnectTimer = Timer(Duration(milliseconds: millis), () {
      _reconnectTimer = null;
      if (_topics.isEmpty || _disposed) {
        return;
      }
      _ensureConnected();
    });
  }

  Map<String, dynamic> _decode(dynamic raw) {
    if (raw is String) {
      return Map<String, dynamic>.from(jsonDecode(raw) as Map);
    }
    if (raw is List<int>) {
      return Map<String, dynamic>.from(jsonDecode(utf8.decode(raw)) as Map);
    }
    if (raw is Map<String, dynamic>) {
      return raw;
    }
    if (raw is Map) {
      return raw.map((key, value) => MapEntry('$key', value));
    }
    throw FormatException('Unsupported realtime payload: ${raw.runtimeType}');
  }

  void _send(Map<String, dynamic> payload) {
    final channel = _channel;
    if (channel == null) {
      return;
    }
    try {
      channel.sink.add(jsonEncode(payload));
    } catch (error, stackTrace) {
      _logger.warning('Failed to send realtime payload', error, stackTrace);
    }
  }

  void _setStatus(RealtimeConnectionState status) {
    if (_status == status || _disposed) {
      return;
    }
    _status = status;
    if (!_statusController.isClosed) {
      _statusController.add(status);
    }
  }
}
