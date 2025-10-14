import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:logging/logging.dart';
import 'package:permission_handler/permission_handler.dart';

import '../cache/offline_cache.dart';
import '../config/app_config.dart';
import '../network/api_client.dart';

enum PushPermissionStatus {
  unknown,
  granted,
  denied,
  provisional,
  notSupported,
}

class PushNotificationException implements Exception {
  PushNotificationException(this.message, [this.cause]);

  final String message;
  final Object? cause;

  @override
  String toString() => 'PushNotificationException: $message';
}

class PushNotificationService {
  PushNotificationService({
    required ApiClient apiClient,
    required OfflineCache cache,
    required AppConfig config,
    Logger? logger,
  })  : _apiClient = apiClient,
        _cache = cache,
        _config = config,
        _logger = logger ?? Logger('PushNotificationService'),
        _statusCacheKey = '${config.offlineCacheNamespace}:push:permission_status',
        _registrationCacheKey = '${config.offlineCacheNamespace}:push:device_registration';

  final ApiClient _apiClient;
  final OfflineCache _cache;
  final AppConfig _config;
  final Logger _logger;
  final String _statusCacheKey;
  final String _registrationCacheKey;

  bool get _isSupportedPlatform {
    if (kIsWeb) return false;
    return switch (defaultTargetPlatform) {
      TargetPlatform.android || TargetPlatform.iOS => true,
      _ => false,
    };
  }

  String get _platformLabel {
    return switch (defaultTargetPlatform) {
      TargetPlatform.android => 'android',
      TargetPlatform.iOS => 'ios',
      TargetPlatform.macOS => 'macos',
      TargetPlatform.windows => 'windows',
      TargetPlatform.linux => 'linux',
      TargetPlatform.fuchsia => 'fuchsia',
    };
  }

  Future<void> bootstrap() async {
    if (!_isSupportedPlatform) {
      await _persistStatus(PushPermissionStatus.notSupported);
      return;
    }

    final cached = _readCachedStatus();
    if (cached == null || cached == PushPermissionStatus.unknown) {
      try {
        final status = await _queryCurrentStatus();
        await _persistStatus(status);
      } on PushNotificationException catch (error, stackTrace) {
        _logger.warning('Unable to determine push permission status', error, stackTrace);
      }
    }
  }

  Future<PushPermissionStatus> getStatus({bool refresh = false}) async {
    if (!refresh) {
      final cached = _readCachedStatus();
      if (cached != null) {
        return cached;
      }
    }

    final status = await _queryCurrentStatus();
    await _persistStatus(status);
    return status;
  }

  Future<PushPermissionStatus> requestPermission() async {
    if (!_isSupportedPlatform) {
      await _persistStatus(PushPermissionStatus.notSupported);
      return PushPermissionStatus.notSupported;
    }

    try {
      final permission = await Permission.notification.request();
      final status = _mapPermissionStatus(permission);
      await _persistStatus(status);
      return status;
    } on UnimplementedError catch (error, stackTrace) {
      _logger.warning('Push permission request is not supported on this platform', error, stackTrace);
      await _persistStatus(PushPermissionStatus.notSupported);
      return PushPermissionStatus.notSupported;
    } catch (error, stackTrace) {
      _logger.severe('Failed to request push permission', error, stackTrace);
      throw PushNotificationException('Unable to request push notification permission', error);
    }
  }

  Future<bool> registerDevice({
    String? token,
    Map<String, dynamic>? metadata,
  }) async {
    if (!_isSupportedPlatform) {
      await _recordRegistration(
        status: 'unsupported',
        metadata: metadata,
      );
      return false;
    }

    if (token == null || token.trim().isEmpty) {
      _logger.info('Skipping push registration: no device token available.');
      await _recordRegistration(
        status: 'skipped',
        metadata: metadata,
      );
      return false;
    }

    final payload = <String, dynamic>{
      'token': token,
      'platform': _platformLabel,
      'environment': describeEnum(_config.environment),
      'metadata': {
        'app': 'gigvora_mobile',
        if (metadata != null) ...metadata,
      },
    };

    try {
      await _apiClient.post('/notifications/devices', body: payload);
      await _recordRegistration(status: 'registered', metadata: metadata);
      return true;
    } catch (error, stackTrace) {
      _logger.warning('Failed to register device for push notifications', error, stackTrace);
      throw PushNotificationException('Unable to register device for push notifications', error);
    }
  }

  Future<void> openSystemSettings() async {
    if (!_isSupportedPlatform) {
      return;
    }

    try {
      final opened = await openAppSettings();
      if (!opened) {
        _logger.info('System settings could not be opened for push notifications.');
      }
    } catch (error, stackTrace) {
      _logger.warning('Unable to open system settings for push notifications', error, stackTrace);
      throw PushNotificationException('Unable to open notification settings', error);
    }
  }

  Future<void> dispose() async {}

  PushPermissionStatus? _readCachedStatus() {
    final entry = _cache.read<String?>(_statusCacheKey, (raw) {
      if (raw is String && raw.isNotEmpty) {
        return raw;
      }
      return null;
    });

    final value = entry?.value;
    if (value == null) {
      return null;
    }

    return PushPermissionStatus.values.firstWhere(
      (status) => status.name == value,
      orElse: () => PushPermissionStatus.unknown,
    );
  }

  Future<void> _persistStatus(PushPermissionStatus status) {
    return _cache.write(_statusCacheKey, status.name, ttl: Duration.zero);
  }

  Future<PushPermissionStatus> _queryCurrentStatus() async {
    if (!_isSupportedPlatform) {
      return PushPermissionStatus.notSupported;
    }

    try {
      final permission = await Permission.notification.status;
      return _mapPermissionStatus(permission);
    } on UnimplementedError {
      return PushPermissionStatus.notSupported;
    } catch (error, stackTrace) {
      _logger.warning('Unable to read push permission status', error, stackTrace);
      throw PushNotificationException('Unable to determine push notification status', error);
    }
  }

  PushPermissionStatus _mapPermissionStatus(PermissionStatus status) {
    return switch (status) {
      PermissionStatus.granted || PermissionStatus.limited => PushPermissionStatus.granted,
      PermissionStatus.provisional => PushPermissionStatus.provisional,
      PermissionStatus.denied || PermissionStatus.restricted || PermissionStatus.permanentlyDenied =>
        PushPermissionStatus.denied,
    };
  }

  Future<void> _recordRegistration({
    required String status,
    Map<String, dynamic>? metadata,
  }) {
    return _cache.write(
      _registrationCacheKey,
      {
        'status': status,
        'timestamp': DateTime.now().toUtc().toIso8601String(),
        'metadata': metadata ?? const <String, dynamic>{},
      },
      ttl: Duration.zero,
    );
  }
}
