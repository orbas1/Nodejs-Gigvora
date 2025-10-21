import 'package:gigvora_foundation/gigvora_foundation.dart';

import 'models/ad_placement.dart';

class AdRepository {
  AdRepository(this._apiClient, this._cache);

  final ApiClient _apiClient;
  final OfflineCache _cache;

  static const _cacheTtl = Duration(minutes: 2);

  Future<RepositoryResult<List<AdPlacement>>> fetchPlacements({
    required String surface,
    bool forceRefresh = false,
  }) async {
    final normalizedSurface = surface.trim().isNotEmpty ? surface.trim() : 'global_dashboard';
    final cacheKey = 'ads:placements:$normalizedSurface';

    final cached = _cache.read<List<AdPlacement>>(cacheKey, (raw) {
      if (raw is Map<String, dynamic> && raw['placements'] is List) {
        return (raw['placements'] as List)
            .map((entry) => AdPlacement.fromJson(Map<String, dynamic>.from(entry as Map)))
            .toList();
      }
      if (raw is List) {
        return raw
            .map((entry) => AdPlacement.fromJson(Map<String, dynamic>.from(entry as Map)))
            .toList();
      }
      return const <AdPlacement>[];
    });

    if (!forceRefresh && cached != null) {
      return RepositoryResult<List<AdPlacement>>(
        data: cached.value,
        fromCache: true,
        lastUpdated: cached.storedAt,
      );
    }

    try {
      final response = await _apiClient.get(
        '/ads/placements',
        query: {
          'surface': normalizedSurface,
        },
        headers: const {
          'x-user-type': 'admin',
        },
      );
      if (response is! Map<String, dynamic>) {
        throw Exception('Unexpected ad placement payload');
      }
      final placementsJson = response['placements'];
      final placements = (placementsJson is List)
          ? placementsJson
              .map((entry) => AdPlacement.fromJson(Map<String, dynamic>.from(entry as Map)))
              .toList()
          : <AdPlacement>[];
      await _cache.write(cacheKey, {'placements': placementsJson}, ttl: _cacheTtl);
      return RepositoryResult<List<AdPlacement>>(
        data: placements,
        fromCache: false,
        lastUpdated: DateTime.now(),
      );
    } catch (error) {
      if (cached != null) {
        return RepositoryResult<List<AdPlacement>>(
          data: cached.value,
          fromCache: true,
          lastUpdated: cached.storedAt,
          error: error,
        );
      }
      rethrow;
    }
  }
}
