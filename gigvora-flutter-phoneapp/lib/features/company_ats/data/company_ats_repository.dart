import 'dart:async';

import 'package:gigvora_foundation/gigvora_foundation.dart';

import 'company_ats_sample.dart';
import 'models/company_ats_dashboard.dart';

class CompanyAtsRepository {
  CompanyAtsRepository(this._cache);

  final OfflineCache _cache;

  static const _cacheKey = 'company:ats:dashboard';
  static const _ttl = Duration(minutes: 5);

  Future<RepositoryResult<CompanyAtsDashboard>> fetchDashboard({bool forceRefresh = false}) async {
    final cached = forceRefresh
        ? null
        : _cache.read<CompanyAtsDashboard>(
            _cacheKey,
            (raw) {
              if (raw is Map<String, dynamic>) {
                return CompanyAtsDashboard.fromJson(raw);
              }
              if (raw is Map) {
                return CompanyAtsDashboard.fromJson(Map<String, dynamic>.from(raw as Map));
              }
              return CompanyAtsDashboard.empty();
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
      await Future<void>.delayed(const Duration(milliseconds: 220));
      final dashboard = CompanyAtsDashboard.fromJson(companyAtsSample);
      await _cache.write(_cacheKey, dashboard.toJson(), ttl: _ttl);
      return RepositoryResult(
        data: dashboard,
        fromCache: false,
        lastUpdated: DateTime.now(),
      );
    } catch (error) {
      final fallback = _cache.read<CompanyAtsDashboard>(
        _cacheKey,
        (raw) {
          if (raw is Map<String, dynamic>) {
            return CompanyAtsDashboard.fromJson(raw);
          }
          if (raw is Map) {
            return CompanyAtsDashboard.fromJson(Map<String, dynamic>.from(raw as Map));
          }
          return CompanyAtsDashboard.empty();
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

  Future<void> persistDashboard(CompanyAtsDashboard dashboard) {
    return _cache.write(_cacheKey, dashboard.toJson(), ttl: _ttl);
  }
}
