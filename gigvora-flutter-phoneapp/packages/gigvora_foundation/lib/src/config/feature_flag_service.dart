import 'dart:async';

import 'package:logging/logging.dart';

import '../cache/offline_cache.dart';
import '../network/api_client.dart';
import 'app_config.dart';

class FeatureFlagService {
  FeatureFlagService({
    required ApiClient apiClient,
    required OfflineCache cache,
    required AppConfig config,
    Logger? logger,
  })  : _apiClient = apiClient,
        _cache = cache,
        _config = config,
        _logger = logger ?? Logger('FeatureFlagService'),
        _cacheKey = '${config.offlineCacheNamespace}:feature_flags:${config.environment.name}',
        _flags = Map<String, dynamic>.from(config.featureFlags);

  final ApiClient _apiClient;
  final OfflineCache _cache;
  final AppConfig _config;
  final Logger _logger;
  final String _cacheKey;
  final StreamController<Map<String, dynamic>> _controller =
      StreamController<Map<String, dynamic>>.broadcast();

  Map<String, dynamic> _flags;
  bool _initialised = false;
  DateTime? _lastSyncedAt;

  Duration get refreshInterval => _config.featureFlagRefreshInterval;

  Stream<Map<String, dynamic>> get stream => _controller.stream;

  Map<String, dynamic> get snapshot => Map.unmodifiable(_flags);

  Future<Map<String, dynamic>> bootstrap({bool forceRefresh = false}) async {
    if (!_initialised) {
      await _readFromCache();
      _initialised = true;
    }

    if (forceRefresh || _shouldRefresh()) {
      await refreshFlags();
    }

    return snapshot;
  }

  Future<Map<String, dynamic>> refreshFlags() async {
    try {
      final response = await _apiClient.get(
        '/feature-flags/mobile',
        query: {
          'environment': _config.environment.name,
          'platform': 'flutter',
        },
      );

      final remoteFlags = _extractFlags(response);
      _updateFlags(remoteFlags, fromCache: false);
      await _cache.write(_cacheKey, _flags, ttl: _config.featureFlagRefreshInterval);
      _lastSyncedAt = DateTime.now();
      return snapshot;
    } catch (error, stackTrace) {
      _logger.warning('Failed to refresh feature flags from backend', error, stackTrace);
      _lastSyncedAt = DateTime.now();
      return snapshot;
    }
  }

  bool isEnabled(String flag, {bool defaultValue = false}) {
    final value = _flags[flag];
    if (value is bool) {
      return value;
    }
    if (value is String) {
      return value.toLowerCase() == 'true';
    }
    return defaultValue;
  }

  T? value<T>(String flag) {
    final value = _flags[flag];
    if (value is T) {
      return value;
    }
    return null;
  }

  Future<void> overrideLocal(String flag, dynamic value) async {
    _flags = {
      ..._flags,
      flag: value,
    };
    await _cache.write(_cacheKey, _flags, ttl: _config.featureFlagRefreshInterval);
    _controller.add(snapshot);
  }

  Future<void> dispose() async {
    await _controller.close();
  }

  bool _shouldRefresh() {
    if (_lastSyncedAt == null) {
      return true;
    }
    final elapsed = DateTime.now().difference(_lastSyncedAt!);
    return elapsed >= _config.featureFlagRefreshInterval;
  }

  Future<void> _readFromCache() async {
    final entry = _cache.read<Map<String, dynamic>>(_cacheKey, (raw) {
      if (raw is Map<String, dynamic>) {
        return Map<String, dynamic>.from(raw);
      }
      if (raw is Map) {
        return raw.map((key, value) => MapEntry('$key', value));
      }
      return const <String, dynamic>{};
    });

    if (entry == null) {
      return;
    }

    _updateFlags(entry.value, fromCache: true);
    _lastSyncedAt = entry.storedAt;
  }

  Map<String, dynamic> _extractFlags(dynamic response) {
    if (response is Map<String, dynamic>) {
      if (response['flags'] is Map<String, dynamic>) {
        return Map<String, dynamic>.from(response['flags'] as Map<String, dynamic>);
      }
      if (response['data'] is Map<String, dynamic>) {
        return Map<String, dynamic>.from(response['data'] as Map<String, dynamic>);
      }
      return Map<String, dynamic>.from(response);
    }
    return const <String, dynamic>{};
  }

  void _updateFlags(Map<String, dynamic> remoteFlags, {required bool fromCache}) {
    if (remoteFlags.isEmpty) {
      return;
    }
    _flags = {
      ..._config.featureFlags,
      ..._flags,
      ...remoteFlags,
    };
    _controller.add(snapshot);
    if (!fromCache) {
      _logger.fine('Feature flags updated: ${_flags.keys.toList()}');
    }
  }
}
