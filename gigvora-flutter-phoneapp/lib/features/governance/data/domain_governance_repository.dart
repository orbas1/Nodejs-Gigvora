import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:gigvora_foundation/gigvora_foundation.dart';

import '../../core/providers.dart';
import '../domain/domain_governance_models.dart';

class DomainGovernanceException implements Exception {
  DomainGovernanceException(this.message, [this.cause]);

  final String message;
  final Object? cause;

  @override
  String toString() => 'DomainGovernanceException($message${cause != null ? ', cause: $cause' : ''})';
}

class DomainGovernanceRepository {
  DomainGovernanceRepository(this._client, this._cache);

  final ApiClient _client;
  final OfflineCache _cache;

  static const _summaryCacheKey = 'governance:domains:summaries';
  static const _detailCachePrefix = 'governance:domains:detail:';
  static const _summaryTtl = Duration(minutes: 15);
  static const _detailTtl = Duration(minutes: 30);

  Future<DomainGovernanceSummaryResponse> fetchSummaries({bool forceRefresh = false}) async {
    if (!forceRefresh) {
      final cached = _cache.read<DomainGovernanceSummaryResponse>(
        _summaryCacheKey,
        (raw) => _parseSummaryResponse(_coerceMap(raw)),
      );
      if (cached != null) {
        return cached.value;
      }
    }

    try {
      final response = await _client.get('/domains/governance');
      final summary = _parseSummaryResponse(_ensureMap(response));
      unawaited(_cache.write(_summaryCacheKey, summary.toJson(), ttl: _summaryTtl));
      return summary;
    } catch (error) {
      final cached = _cache.read<DomainGovernanceSummaryResponse>(
        _summaryCacheKey,
        (raw) => _parseSummaryResponse(_coerceMap(raw)),
      );
      if (cached != null) {
        return cached.value;
      }
      throw DomainGovernanceException('Unable to load domain governance summaries', error);
    }
  }

  Future<DomainGovernanceDetail> fetchDetail(String contextName, {bool forceRefresh = false}) async {
    final cacheKey = '$_detailCachePrefix$contextName';
    if (!forceRefresh) {
      final cached = _cache.read<DomainGovernanceDetail>(
        cacheKey,
        (raw) => DomainGovernanceDetail.fromJson(_coerceMap(raw)),
      );
      if (cached != null) {
        return cached.value;
      }
    }

    try {
      final response = await _client.get('/domains/$contextName/governance');
      final detail = DomainGovernanceDetail.fromJson(_ensureMap(response));
      unawaited(_cache.write(cacheKey, detail.toJson(), ttl: _detailTtl));
      return detail;
    } catch (error) {
      final cached = _cache.read<DomainGovernanceDetail>(
        cacheKey,
        (raw) => DomainGovernanceDetail.fromJson(_coerceMap(raw)),
      );
      if (cached != null) {
        return cached.value;
      }
      throw DomainGovernanceException(
        'Unable to load governance detail for $contextName',
        error,
      );
    }
  }

  static Map<String, dynamic> _ensureMap(dynamic value) {
    if (value is Map<String, dynamic>) {
      return value;
    }
    if (value is Map) {
      return Map<String, dynamic>.from(value as Map);
    }
    throw const FormatException('Unexpected payload from governance endpoint');
  }

  static Map<String, dynamic> _coerceMap(dynamic value) {
    try {
      return _ensureMap(value);
    } catch (_) {
      return <String, dynamic>{};
    }
  }

  static DomainGovernanceSummaryResponse _parseSummaryResponse(Map<String, dynamic> payload) {
    final contexts = (payload['contexts'] as List<dynamic>? ?? const [])
        .map((item) => DomainGovernanceSummary.fromJson(Map<String, dynamic>.from(item as Map)))
        .toList(growable: false);
    final generatedRaw = payload['generatedAt'];
    final generatedAt = generatedRaw is String ? DateTime.tryParse(generatedRaw) : null;
    return DomainGovernanceSummaryResponse(
      contexts: contexts,
      generatedAt: generatedAt ?? DateTime.now(),
    );
  }
}

final domainGovernanceRepositoryProvider = Provider<DomainGovernanceRepository>((ref) {
  final client = ref.watch(apiClientProvider);
  final cache = ref.watch(offlineCacheProvider);
  return DomainGovernanceRepository(client, cache);
});
