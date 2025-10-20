import 'package:gigvora_foundation/gigvora_foundation.dart';

import 'models/creation_brief.dart';

class CreationStudioRepository {
  CreationStudioRepository(this._apiClient, this._cache);

  final ApiClient _apiClient;
  final OfflineCache _cache;

  static const _cacheKey = 'creation_studio:briefs';
  static const _cacheTtl = Duration(minutes: 3);

  Future<RepositoryResult<List<CreationBrief>>> fetchBriefs({bool forceRefresh = false}) async {
    final cached = _cache.read<List<CreationBrief>>(_cacheKey, (raw) {
      if (raw is List) {
        return raw
            .whereType<Map>()
            .map((item) => CreationBrief.fromJson(Map<String, dynamic>.from(item as Map)))
            .toList(growable: false);
      }
      return <CreationBrief>[];
    });

    if (!forceRefresh && cached != null) {
      return RepositoryResult<List<CreationBrief>>(
        data: cached.value,
        fromCache: true,
        lastUpdated: cached.storedAt,
      );
    }

    try {
      final response = await _apiClient.get('/creation-studio/briefs');
      if (response is List) {
        final briefs = response
            .whereType<Map>()
            .map((item) => CreationBrief.fromJson(Map<String, dynamic>.from(item as Map)))
            .toList(growable: false);
        await _cache.write(
          _cacheKey,
          briefs.map((brief) => brief.toJson()).toList(growable: false),
          ttl: _cacheTtl,
        );
        return RepositoryResult<List<CreationBrief>>(
          data: briefs,
          fromCache: false,
          lastUpdated: DateTime.now(),
        );
      }
    } catch (error) {
      if (cached != null) {
        return RepositoryResult<List<CreationBrief>>(
          data: cached.value,
          fromCache: true,
          lastUpdated: cached.storedAt,
          error: error,
        );
      }
      rethrow;
    }

    if (cached != null) {
      return RepositoryResult<List<CreationBrief>>(
        data: cached.value,
        fromCache: true,
        lastUpdated: cached.storedAt,
      );
    }

    return RepositoryResult<List<CreationBrief>>(
      data: const <CreationBrief>[],
      fromCache: false,
      lastUpdated: DateTime.now(),
    );
  }

  Future<CreationBrief> createBrief(CreationBriefDraft draft) async {
    final response = await _apiClient.post('/creation-studio/briefs', body: draft.toJson());
    if (response is Map<String, dynamic>) {
      await _cache.remove(_cacheKey);
      return CreationBrief.fromJson(response);
    }
    throw StateError('Invalid creation brief response');
  }

  Future<CreationBrief> updateBrief(String id, CreationBriefDraft draft) async {
    final response = await _apiClient.put('/creation-studio/briefs/$id', body: draft.toJson());
    if (response is Map<String, dynamic>) {
      await _cache.remove(_cacheKey);
      return CreationBrief.fromJson(response);
    }
    throw StateError('Invalid creation brief response');
  }

  Future<CreationBrief> publishBrief(String id) async {
    final response = await _apiClient.post('/creation-studio/briefs/$id/publish');
    if (response is Map<String, dynamic>) {
      await _cache.remove(_cacheKey);
      return CreationBrief.fromJson(response);
    }
    throw StateError('Invalid creation brief response');
  }

  Future<void> deleteBrief(String id) async {
    await _apiClient.delete('/creation-studio/briefs/$id');
    await _cache.remove(_cacheKey);
  }
}
