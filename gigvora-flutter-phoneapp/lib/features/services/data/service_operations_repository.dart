import 'dart:async';

import 'package:gigvora_foundation/gigvora_foundation.dart';

import 'models/service_operations_overview.dart';
import 'service_operations_sample.dart';

class ServiceOperationsRepository {
  ServiceOperationsRepository(this._cache);

  final OfflineCache _cache;

  static const _cacheKey = 'service_operations:overview';
  static const _ttl = Duration(minutes: 5);

  Future<RepositoryResult<ServiceOperationsOverview>> fetchOverview({bool forceRefresh = false}) async {
    final cached = forceRefresh
        ? null
        : _cache.read<ServiceOperationsOverview>(_cacheKey, (raw) {
            if (raw is Map<String, dynamic>) {
              return ServiceOperationsOverview.fromJson(raw);
            }
            if (raw is Map) {
              return ServiceOperationsOverview.fromJson(
                Map<String, dynamic>.from(raw as Map),
              );
            }
            return ServiceOperationsOverview.empty();
          });

    if (cached != null) {
      return RepositoryResult(
        data: cached.value,
        fromCache: true,
        lastUpdated: cached.storedAt,
      );
    }

    try {
      // Simulate a short network fetch before returning data.
      await Future<void>.delayed(const Duration(milliseconds: 250));
      final overview = ServiceOperationsOverview.fromJson(serviceOperationsSample);
      await _cache.write(_cacheKey, overview.toJson(), ttl: _ttl);
      return RepositoryResult(
        data: overview,
        fromCache: false,
        lastUpdated: DateTime.now(),
      );
    } catch (error) {
      final fallback = _cache.read<ServiceOperationsOverview>(_cacheKey, (raw) {
        if (raw is Map<String, dynamic>) {
          return ServiceOperationsOverview.fromJson(raw);
        }
        if (raw is Map) {
          return ServiceOperationsOverview.fromJson(Map<String, dynamic>.from(raw as Map));
        }
        return ServiceOperationsOverview.empty();
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
}
