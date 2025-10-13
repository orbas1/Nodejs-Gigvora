import 'dart:async';

import 'package:gigvora_foundation/gigvora_foundation.dart';

import 'finance_control_tower_sample.dart';
import 'models/finance_overview.dart';

class FinanceRepository {
  FinanceRepository(this._apiClient, this._cache);

  final ApiClient _apiClient;
  final OfflineCache _cache;

  static const _cacheKey = 'finance:control_tower:overview';
  static const _ttl = Duration(minutes: 5);

  Future<RepositoryResult<FinanceOverview>> fetchOverview({bool forceRefresh = false}) async {
    if (!forceRefresh) {
      final cached = _cache.read<FinanceOverview>(_cacheKey, (raw) {
        if (raw is Map<String, dynamic>) {
          return FinanceOverview.fromJson(raw);
        }
        if (raw is Map) {
          return FinanceOverview.fromJson(Map<String, dynamic>.from(raw as Map));
        }
        return FinanceOverview.empty();
      });
      if (cached != null) {
        return RepositoryResult(
          data: cached.value,
          fromCache: true,
          lastUpdated: cached.storedAt,
        );
      }
    }

    try {
      final response = await _apiClient.get('/finance/control-tower/overview');
      if (response is Map<String, dynamic>) {
        final overview = FinanceOverview.fromJson(response);
        unawaited(_cache.write(_cacheKey, overview.toJson(), ttl: _ttl));
        return RepositoryResult(
          data: overview,
          fromCache: false,
          lastUpdated: DateTime.now(),
        );
      }
      throw const FormatException('Unexpected payload when fetching finance overview');
    } catch (error) {
      final cached = _cache.read<FinanceOverview>(_cacheKey, (raw) {
        if (raw is Map<String, dynamic>) {
          return FinanceOverview.fromJson(raw);
        }
        if (raw is Map) {
          return FinanceOverview.fromJson(Map<String, dynamic>.from(raw as Map));
        }
        return FinanceOverview.empty();
      });
      if (cached != null) {
        return RepositoryResult(
          data: cached.value,
          fromCache: true,
          lastUpdated: cached.storedAt,
          error: error,
        );
      }

      final fallback = FinanceOverview.fromJson(financeControlTowerSample);
      unawaited(_cache.write(_cacheKey, fallback.toJson(), ttl: _ttl));
      return RepositoryResult(
        data: fallback,
        fromCache: true,
        lastUpdated: DateTime.now(),
        error: error,
      );
    }
  }
}
