import 'dart:async';

import 'package:gigvora_foundation/gigvora_foundation.dart';

import 'models/security_telemetry.dart';
import 'security_operations_sample.dart';

class SecurityRepository {
  SecurityRepository(this._cache);

  final OfflineCache _cache;

  static const _cacheKey = 'security:telemetry';
  static const _ttl = Duration(minutes: 5);

  Future<RepositoryResult<SecurityTelemetry>> fetchTelemetry({bool forceRefresh = false}) async {
    final cached = forceRefresh
        ? null
        : _cache.read<SecurityTelemetry>(
            _cacheKey,
            (raw) {
              if (raw is SecurityTelemetry) {
                return raw;
              }
              if (raw is Map<String, dynamic>) {
                return SecurityTelemetry.fromJson(raw);
              }
              if (raw is Map) {
                return SecurityTelemetry.fromJson(Map<String, dynamic>.from(raw as Map));
              }
              return SecurityTelemetry.empty();
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
      await Future<void>.delayed(const Duration(milliseconds: 240));
      final telemetry = SecurityTelemetry.fromJson(securityOperationsSample);
      await _cache.write(_cacheKey, telemetry.toJson(), ttl: _ttl);
      return RepositoryResult(
        data: telemetry,
        fromCache: false,
        lastUpdated: DateTime.now(),
      );
    } catch (error) {
      final fallback = _cache.read<SecurityTelemetry>(
        _cacheKey,
        (raw) {
          if (raw is SecurityTelemetry) {
            return raw;
          }
          if (raw is Map<String, dynamic>) {
            return SecurityTelemetry.fromJson(raw);
          }
          if (raw is Map) {
            return SecurityTelemetry.fromJson(Map<String, dynamic>.from(raw as Map));
          }
          return SecurityTelemetry.empty();
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
}
