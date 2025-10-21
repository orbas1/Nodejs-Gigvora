import 'dart:convert';

import 'package:gigvora_foundation/gigvora_foundation.dart';

import 'models/ads_dashboard_models.dart';

class AdsRepository {
  AdsRepository(this._apiClient, this._cache);

  final ApiClient _apiClient;
  final OfflineCache _cache;

  static const _ttl = Duration(minutes: 3);

  String _cacheKey(List<String>? surfaces, AdTargetingContext? context) {
    final surfaceKey = [...(surfaces ?? const <String>[])].map((value) => value.trim()).toList()
      ..sort();
    final contextKey = context == null
        ? ''
        : '${context.keywordHints.join(',')}|${context.taxonomySlugs.join(',')}';
    return 'ads:dashboard:${surfaceKey.join('|')}::$contextKey';
  }

  Future<RepositoryResult<AdDashboardSnapshot>> fetchSnapshot({
    List<String>? surfaces,
    AdTargetingContext? context,
    bool forceRefresh = false,
  }) async {
    final cacheKey = _cacheKey(surfaces, context);
    CacheEntry<AdDashboardSnapshot>? cached;
    if (!forceRefresh) {
      cached = _cache.read<AdDashboardSnapshot>(cacheKey, (raw) {
        if (raw is Map<String, dynamic>) {
          return AdDashboardSnapshot.fromJson(raw);
        }
        if (raw is Map) {
          return AdDashboardSnapshot.fromJson(Map<String, dynamic>.from(raw as Map));
        }
        return AdDashboardSnapshot.empty();
      });
    }

    if (cached != null) {
      return RepositoryResult<AdDashboardSnapshot>(
        data: cached.value,
        fromCache: true,
        lastUpdated: cached.storedAt,
      );
    }

    try {
      final response = await _apiClient.get(
        '/ads/dashboard',
        query: {
          if (surfaces != null && surfaces.isNotEmpty) 'surfaces': surfaces.join(','),
          if (context != null) 'context': jsonEncode(context.toJson()),
        },
        headers: const {
          'x-user-type': 'admin',
        },
      );

      if (response is! Map<String, dynamic>) {
        throw ApiException(500, 'Unexpected payload when loading ads dashboard', response);
      }

      await _cache.write(cacheKey, response, ttl: _ttl);
      final snapshot = AdDashboardSnapshot.fromJson(response);
      return RepositoryResult<AdDashboardSnapshot>(
        data: snapshot,
        fromCache: false,
        lastUpdated: DateTime.now(),
      );
    } catch (error) {
      if (cached != null) {
        return RepositoryResult<AdDashboardSnapshot>(
          data: cached.value,
          fromCache: true,
          lastUpdated: cached.storedAt,
          error: error,
        );
      }
      rethrow;
    }
  }

  Future<List<AdPlacement>> fetchPlacementsForSurface(String surface) async {
    final normalizedSurface = surface.trim();
    if (normalizedSurface.isEmpty) {
      return const <AdPlacement>[];
    }
    final response = await _apiClient.get(
      '/ads/placements',
      query: {'surfaces': normalizedSurface},
      headers: const {
        'x-user-type': 'admin',
      },
    );

    if (response is Map<String, dynamic>) {
      final placements = response['placements'] ?? response['surface'];
      if (placements is List) {
        return List<AdPlacement>.unmodifiable(
          placements
              .map((item) => AdPlacement.fromJson(Map<String, dynamic>.from(item as Map)))
              .toList(growable: false),
        );
      }
      if (placements is Map && placements['placements'] is List) {
        return List<AdPlacement>.unmodifiable(
          (placements['placements'] as List)
              .map((item) => AdPlacement.fromJson(Map<String, dynamic>.from(item as Map)))
              .toList(growable: false),
        );
      }
    }

    return const <AdPlacement>[];
  }
}
