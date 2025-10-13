import 'package:gigvora_foundation/gigvora_foundation.dart';

import 'models/networking_overview.dart';

class NetworkingRepository {
  NetworkingRepository(this._apiClient, this._cache);

  final ApiClient _apiClient;
  final OfflineCache _cache;

  static const _overviewTtl = Duration(minutes: 2);

  Future<RepositoryResult<NetworkingOverviewBundle>> fetchOverview({
    int? companyId,
    int lookbackDays = 180,
    bool forceRefresh = false,
  }) async {
    final cacheKey = 'networking:overview:${companyId ?? 'all'}:$lookbackDays';
    final cachedEntry = _cache.read<Map<String, dynamic>>(cacheKey, (raw) {
      if (raw is Map<String, dynamic>) {
        return raw;
      }
      if (raw is Map) {
        return Map<String, dynamic>.from(raw as Map);
      }
      return const <String, dynamic>{};
    });

    NetworkingOverviewBundle? cachedBundle;
    if (cachedEntry != null && cachedEntry.value.isNotEmpty) {
      try {
        cachedBundle = NetworkingOverviewBundle.fromJson(cachedEntry.value);
      } catch (_) {
        cachedBundle = null;
      }
    }

    if (!forceRefresh && cachedBundle != null) {
      return RepositoryResult<NetworkingOverviewBundle>(
        data: cachedBundle,
        fromCache: true,
        lastUpdated: cachedEntry?.storedAt,
      );
    }

    try {
      final sessionsResponse = await _apiClient.get('/networking/sessions', query: {
        if (companyId != null) 'companyId': companyId,
        'includeMetrics': true,
        'lookbackDays': lookbackDays,
      });
      if (sessionsResponse is! Map<String, dynamic>) {
        throw Exception('Unexpected networking sessions payload');
      }

      final sessionList = (sessionsResponse['sessions'] as List<dynamic>? ?? const <dynamic>[])
          .whereType<Map>()
          .map((raw) => NetworkingSession.fromJson(Map<String, dynamic>.from(raw)))
          .toList(growable: false);

      final meta = sessionsResponse['meta'];
      final permittedWorkspaceIds = meta is Map
          ? (meta['permittedWorkspaceIds'] as List<dynamic>? ?? const <dynamic>[])
              .map((value) => int.tryParse('$value') ?? 0)
              .where((value) => value > 0)
              .toList(growable: false)
          : const <int>[];
      final metaSelected = meta is Map ? int.tryParse('${meta['selectedWorkspaceId']}') : null;

      final resolvedCompanyId = _resolveWorkspace(
        requested: companyId,
        metaSelected: metaSelected,
        permitted: permittedWorkspaceIds,
        sessions: sessionList,
      );

      final cardResponse = resolvedCompanyId == null
          ? const <dynamic>[]
          : await _apiClient.get('/networking/business-cards', query: {
              'companyId': resolvedCompanyId,
            });
      final cards = (cardResponse is List ? cardResponse : const <dynamic>[])
          .whereType<Map>()
          .map((raw) => NetworkingBusinessCard.fromJson(Map<String, dynamic>.from(raw)))
          .toList(growable: false);

      final overview = NetworkingOverview.compute(sessions: sessionList, cards: cards);
      final bundle = NetworkingOverviewBundle(
        overview: overview,
        permittedWorkspaceIds: permittedWorkspaceIds,
        selectedWorkspaceId: resolvedCompanyId,
      );

      await _cache.write(cacheKey, bundle.toJson(), ttl: _overviewTtl);

      return RepositoryResult<NetworkingOverviewBundle>(
        data: bundle,
        fromCache: false,
        lastUpdated: DateTime.now(),
      );
    } catch (error) {
      if (cachedBundle != null) {
        return RepositoryResult<NetworkingOverviewBundle>(
          data: cachedBundle,
          fromCache: true,
          lastUpdated: cachedEntry?.storedAt,
          error: error,
        );
      }
      rethrow;
    }
  }

  int? _resolveWorkspace({
    int? requested,
    int? metaSelected,
    required List<int> permitted,
    required List<NetworkingSession> sessions,
  }) {
    final validRequested =
        requested != null && (permitted.isEmpty || permitted.contains(requested)) ? requested : null;
    if (validRequested != null) {
      return validRequested;
    }

    final validMeta = metaSelected != null && (permitted.isEmpty || permitted.contains(metaSelected))
        ? metaSelected
        : null;
    if (validMeta != null) {
      return validMeta;
    }

    final sessionWorkspace = sessions
        .map((session) => session.companyId)
        .firstWhere((value) => value != null && (permitted.isEmpty || permitted.contains(value)), orElse: () => null);
    if (sessionWorkspace != null) {
      return sessionWorkspace;
    }

    return permitted.isEmpty ? null : permitted.first;
  }
}
