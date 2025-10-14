import 'dart:async';

import 'package:gigvora_foundation/gigvora_foundation.dart';

import 'models/freelancer_pipeline_dashboard.dart';
import 'pipeline_sample.dart';

class FreelancerPipelineRepository {
  FreelancerPipelineRepository(this._cache);

  final OfflineCache _cache;

  static const _cacheKey = 'freelancer:pipeline:dashboard';
  static const _ttl = Duration(minutes: 5);

  Future<RepositoryResult<FreelancerPipelineDashboard>> fetchDashboard({bool forceRefresh = false}) async {
    final cached = forceRefresh
        ? null
        : _cache.read<FreelancerPipelineDashboard>(
            _cacheKey,
            (raw) {
              if (raw is Map<String, dynamic>) {
                return FreelancerPipelineDashboard.fromJson(raw);
              }
              if (raw is Map) {
                return FreelancerPipelineDashboard.fromJson(Map<String, dynamic>.from(raw as Map));
              }
              return FreelancerPipelineDashboard.empty();
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
      await Future<void>.delayed(const Duration(milliseconds: 250));
      final dashboard = FreelancerPipelineDashboard.fromJson(freelancerPipelineSample);
      await _cache.write(_cacheKey, dashboard.toJson(), ttl: _ttl);
      return RepositoryResult(
        data: dashboard,
        fromCache: false,
        lastUpdated: DateTime.now(),
      );
    } catch (error) {
      final fallback = _cache.read<FreelancerPipelineDashboard>(
        _cacheKey,
        (raw) {
          if (raw is Map<String, dynamic>) {
            return FreelancerPipelineDashboard.fromJson(raw);
          }
          if (raw is Map) {
            return FreelancerPipelineDashboard.fromJson(Map<String, dynamic>.from(raw as Map));
          }
          return FreelancerPipelineDashboard.empty();
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

  Future<void> persistDashboard(FreelancerPipelineDashboard dashboard) {
    return _cache.write(_cacheKey, dashboard.toJson(), ttl: _ttl);
  }
}
