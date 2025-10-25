import 'dart:async';

import 'package:gigvora_foundation/gigvora_foundation.dart';

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

      rethrow;
    }
  }

  Future<void> recordReleaseAction(
    String releaseId, {
    required String action,
    String? note,
  }) async {
    final payload = <String, dynamic>{'action': action};
    if (note != null && note.isNotEmpty) {
      payload['note'] = note;
    }
    await _apiClient.post('/finance/releases/$releaseId/actions', data: payload);
    await _cache.remove(_cacheKey);
  }

  Future<void> recordDisputeAction(
    String disputeId, {
    required String action,
    String? note,
  }) async {
    final payload = <String, dynamic>{'action': action};
    if (note != null && note.isNotEmpty) {
      payload['note'] = note;
    }
    await _apiClient.post('/finance/disputes/$disputeId/actions', data: payload);
    await _cache.remove(_cacheKey);
  }

  Future<void> recordComplianceAction(
    String obligationId, {
    required String action,
    String? note,
  }) async {
    final payload = <String, dynamic>{'action': action};
    if (note != null && note.isNotEmpty) {
      payload['note'] = note;
    }
    await _apiClient.post('/finance/compliance/$obligationId/actions', data: payload);
    await _cache.remove(_cacheKey);
  }
}
