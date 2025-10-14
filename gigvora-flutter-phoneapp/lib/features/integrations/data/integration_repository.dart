import 'dart:async';

import 'package:gigvora_foundation/gigvora_foundation.dart';

import 'integration_sample.dart';
import 'models/integration_models.dart';

class IntegrationRepository {
  IntegrationRepository(this._cache);

  final OfflineCache _cache;

  static const _cacheKey = 'company-integrations:overview';
  static const _ttl = Duration(minutes: 5);

  Future<RepositoryResult<IntegrationHubOverview>> fetchOverview({bool forceRefresh = false}) async {
    final cached = forceRefresh
        ? null
        : _cache.read<IntegrationHubOverview>(_cacheKey, (raw) {
            if (raw is IntegrationHubOverview) {
              return raw;
            }
            if (raw is String) {
              return IntegrationHubOverview.decode(raw);
            }
            if (raw is Map<String, dynamic>) {
              return IntegrationHubOverview.fromJson(raw);
            }
            if (raw is Map) {
              return IntegrationHubOverview.fromJson(Map<String, dynamic>.from(raw as Map));
            }
            return IntegrationHubOverview.empty();
          });

    if (cached != null) {
      return RepositoryResult(
        data: cached.value,
        fromCache: true,
        lastUpdated: cached.storedAt,
      );
    }

    try {
      await Future<void>.delayed(const Duration(milliseconds: 250));
      final overview = IntegrationHubOverview.fromJson(integrationSample);
      await _cache.write(_cacheKey, overview.toJson(), ttl: _ttl);
      return RepositoryResult(
        data: overview,
        fromCache: false,
        lastUpdated: DateTime.now(),
      );
    } catch (error) {
      final fallback = _cache.read<IntegrationHubOverview>(_cacheKey, (raw) {
        if (raw is IntegrationHubOverview) {
          return raw;
        }
        if (raw is String) {
          return IntegrationHubOverview.decode(raw);
        }
        if (raw is Map<String, dynamic>) {
          return IntegrationHubOverview.fromJson(raw);
        }
        if (raw is Map) {
          return IntegrationHubOverview.fromJson(Map<String, dynamic>.from(raw as Map));
        }
        return IntegrationHubOverview.empty();
      });

      if (fallback != null) {
        return RepositoryResult(
          data: fallback.value,
          fromCache: true,
          lastUpdated: fallback.storedAt,
          error: error,
        );
      }

      rethrow;
    }
  }

  Future<void> persistOverview(IntegrationHubOverview overview) {
    return _cache.write(_cacheKey, overview.toJson(), ttl: _ttl);
  }
}
