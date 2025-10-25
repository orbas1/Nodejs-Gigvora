import 'package:gigvora_foundation/gigvora_foundation.dart';

import '../domain/connection_network.dart';

class ConnectionsRepository {
  ConnectionsRepository(this._apiClient, this._cache, {Duration? cacheTtl})
      : _cacheTtl = cacheTtl ?? const Duration(minutes: 5);

  final ApiClient _apiClient;
  final OfflineCache _cache;
  final Duration _cacheTtl;

  static const _cacheKeyPrefix = 'connections:network:user:';

  Future<RepositoryResult<ConnectionNetwork>> fetchNetwork({
    required int userId,
    bool forceRefresh = false,
  }) async {
    final cacheKey = '$_cacheKeyPrefix$userId';
    final cached = _readCache(cacheKey);

    if (!forceRefresh && cached != null) {
      return RepositoryResult<ConnectionNetwork>(
        data: cached.value,
        fromCache: true,
        lastUpdated: cached.storedAt,
      );
    }

    try {
      final response = await _apiClient.get(
        '/connections/network',
        query: {'userId': userId},
      );

      final network = ConnectionNetwork.fromJson(Map<String, dynamic>.from(response as Map));
      await _cache.write(cacheKey, network.toJson(), ttl: _cacheTtl);
      return RepositoryResult<ConnectionNetwork>(
        data: network,
        fromCache: false,
        lastUpdated: DateTime.now(),
      );
    } catch (error) {
      if (cached != null) {
        return RepositoryResult<ConnectionNetwork>(
          data: cached.value,
          fromCache: true,
          lastUpdated: cached.storedAt,
          error: error,
        );
      }
      rethrow;
    }
  }

  Future<ConnectionRequestResult> requestIntroduction({
    required int actorId,
    required int targetId,
  }) async {
    final response = await _apiClient.post(
      '/connections',
      body: {
        'actorId': actorId,
        'targetId': targetId,
      },
    );

    await _cache.remove('$_cacheKeyPrefix$actorId');

    if (response is Map<String, dynamic>) {
      return ConnectionRequestResult.fromJson(response);
    }

    throw StateError('Invalid connection request response');
  }

  CacheEntry<ConnectionNetwork>? _readCache(String key) {
    try {
      return _cache.read<ConnectionNetwork>(key, (raw) {
        if (raw is Map) {
          return ConnectionNetwork.fromJson(Map<String, dynamic>.from(raw));
        }
        throw StateError('Invalid cache payload for $key');
      });
    } catch (_) {
      return null;
    }
  }
}
