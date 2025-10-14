import 'dart:async';

import 'package:gigvora_foundation/gigvora_foundation.dart';

import 'company_analytics_sample.dart';
import 'models/company_analytics_dashboard.dart';

class CompanyAnalyticsRepository {
  CompanyAnalyticsRepository(this._cache);

  final OfflineCache _cache;

  static const _cacheKey = 'company:analytics:dashboard';
  static const _ttl = Duration(minutes: 5);

  Future<RepositoryResult<CompanyAnalyticsDashboard>> fetchDashboard({bool forceRefresh = false}) async {
    final cached = forceRefresh
        ? null
        : _cache.read<CompanyAnalyticsDashboard>(
            _cacheKey,
            (raw) {
              if (raw is Map<String, dynamic>) {
                return CompanyAnalyticsDashboard.fromJson(raw);
              }
              if (raw is Map) {
                return CompanyAnalyticsDashboard.fromJson(Map<String, dynamic>.from(raw as Map));
              }
              return CompanyAnalyticsDashboard.empty();
            },
          );

    if (cached != null) {
      return RepositoryResult(
        data: cached.value,
        fromCache: true,
        lastUpdated: cached.storedAt,
      );
    }

    try {
      await Future<void>.delayed(const Duration(milliseconds: 200));
      final dashboard = CompanyAnalyticsDashboard.fromJson(companyAnalyticsSample);
      await _cache.write(_cacheKey, dashboard.toJson(), ttl: _ttl);
      return RepositoryResult(
        data: dashboard,
        fromCache: false,
        lastUpdated: DateTime.now(),
      );
    } catch (error) {
      final fallback = _cache.read<CompanyAnalyticsDashboard>(
        _cacheKey,
        (raw) {
          if (raw is Map<String, dynamic>) {
            return CompanyAnalyticsDashboard.fromJson(raw);
          }
          if (raw is Map) {
            return CompanyAnalyticsDashboard.fromJson(Map<String, dynamic>.from(raw as Map));
          }
          return CompanyAnalyticsDashboard.empty();
        },
      );

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

  Future<void> persistDashboard(CompanyAnalyticsDashboard dashboard) {
    return _cache.write(_cacheKey, dashboard.toJson(), ttl: _ttl);
  }
}
