import 'dart:collection';
import 'dart:convert';

import 'package:gigvora_foundation/gigvora_foundation.dart';

import '../../explorer/data/discovery_models.dart';
import 'models/opportunity.dart';

class DiscoveryRepository {
  DiscoveryRepository(this._apiClient, this._cache);

  final ApiClient _apiClient;
  final OfflineCache _cache;

  static const _opportunityTtl = Duration(minutes: 5);
  static const _snapshotTtl = Duration(minutes: 3);
  static const _searchTtl = Duration(minutes: 4);

  dynamic _normaliseForEncoding(dynamic value) {
    if (value is Map) {
      final sorted = SplayTreeMap<String, dynamic>.fromIterables(
        value.keys.map((key) => key.toString()),
        value.values.map(_normaliseForEncoding),
      );
      return sorted;
    }
    if (value is Iterable) {
      final list = value.map(_normaliseForEncoding).toList();
      list.sort((a, b) => jsonEncode(a).compareTo(jsonEncode(b)));
      return list;
    }
    return value;
  }

  Future<RepositoryResult<OpportunityPage>> fetchOpportunities(
    OpportunityCategory category, {
    String? query,
    int pageSize = 20,
    Map<String, dynamic>? filters,
    String? sort,
    bool includeFacets = false,
    Map<String, String>? headers,
    bool forceRefresh = false,
  }) async {
    final queryKey = (query ?? '').trim();
    final filtersKey = _filtersCacheKey(filters);
    final sortKey = (sort?.trim().isNotEmpty ?? false) ? sort!.trim() : 'default';
    final facetKey = includeFacets ? 'facets' : 'no-facets';
    final headerKey = headers == null || headers.isEmpty ? 'no-headers' : _filtersCacheKey(headers);
    final cacheKey =
        'opportunities:${categoryToPath(category)}:${queryKey.isEmpty ? 'all' : queryKey}:$filtersKey:$sortKey:$facetKey:$headerKey:$pageSize';

    final cached = _cache.read<OpportunityPage>(cacheKey, (raw) {
      if (raw is Map<String, dynamic>) {
        return _mapToOpportunityPage(category, raw).copyWith(query: queryKey.isEmpty ? null : queryKey);
      }
      return null;
    });

    if (!forceRefresh && cached != null) {
      return RepositoryResult(
        data: cached.value,
        fromCache: true,
        lastUpdated: cached.storedAt,
      );
    }

    try {
      final endpoint = '/discovery/${categoryToPath(category)}';
      final response = await _apiClient.get(
        endpoint,
        query: {
          'q': queryKey.isEmpty ? null : queryKey,
          'pageSize': pageSize,
          'filters': filtersKey == 'none' ? null : filtersKey,
          'sort': sortKey == 'default' ? null : sortKey,
          'includeFacets': includeFacets ? 'true' : null,
        },
        headers: headers,
      );
      if (response is! Map<String, dynamic>) {
        throw Exception('Unexpected response from $endpoint');
      }
      await _cache.write(cacheKey, response, ttl: _opportunityTtl);
      final page = _mapToOpportunityPage(category, response).copyWith(query: queryKey.isEmpty ? null : queryKey);
      return RepositoryResult(
        data: page,
        fromCache: false,
        lastUpdated: DateTime.now(),
      );
    } catch (error) {
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

  Future<RepositoryResult<DiscoverySnapshot>> fetchSnapshot({int limit = 8, bool forceRefresh = false}) async {
    final cacheKey = 'discovery:snapshot:$limit';
    final cached = _cache.read<DiscoverySnapshot>(cacheKey, (raw) {
      if (raw is Map) {
        return DiscoverySnapshot.fromJson(Map<String, dynamic>.from(raw));
      }
      return DiscoverySnapshot.empty();
    });

    if (!forceRefresh && cached != null) {
      return RepositoryResult(
        data: cached.value,
        fromCache: true,
        lastUpdated: cached.storedAt,
      );
    }

    try {
      final response = await _apiClient.get('/discovery/snapshot', query: {'limit': limit});
      if (response is! Map<String, dynamic>) {
        throw Exception('Unexpected snapshot payload');
      }
      await _cache.write(cacheKey, response, ttl: _snapshotTtl);
      final snapshot = DiscoverySnapshot.fromJson(response);
      return RepositoryResult(
        data: snapshot,
        fromCache: false,
        lastUpdated: DateTime.now(),
      );
    } catch (error) {
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

  Future<RepositoryResult<GlobalSearchResult>> searchGlobal(
    String query, {
    int limit = 12,
    bool forceRefresh = false,
  }) async {
    final trimmed = query.trim();
    final cacheKey = 'search:${trimmed.toLowerCase()}:${limit}';

    final cached = trimmed.isEmpty
        ? null
        : _cache.read<GlobalSearchResult>(cacheKey, (raw) {
            if (raw is Map) {
              return GlobalSearchResult.fromJson(Map<String, dynamic>.from(raw));
            }
            return GlobalSearchResult.empty();
          });

    if (!forceRefresh && cached != null) {
      return RepositoryResult(
        data: cached.value,
        fromCache: true,
        lastUpdated: cached.storedAt,
      );
    }

    try {
      final response = await _apiClient.get('/search', query: {
        'q': trimmed,
        'limit': limit,
      });
      if (response is! Map<String, dynamic>) {
        throw Exception('Unexpected search payload');
      }
      if (trimmed.isNotEmpty) {
        await _cache.write(cacheKey, response, ttl: _searchTtl);
      }
      final result = GlobalSearchResult.fromJson(response);
      return RepositoryResult(
        data: result,
        fromCache: false,
        lastUpdated: DateTime.now(),
      );
    } catch (error) {
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

  OpportunityPage _mapToOpportunityPage(
    OpportunityCategory category,
    Map<String, dynamic> payload,
  ) {
    final items = (payload['items'] as List<dynamic>? ?? const [])
        .whereType<Map<String, dynamic>>()
        .map((item) => OpportunitySummary.fromJson(category, item))
        .toList(growable: false);
    return OpportunityPage(
      category: category,
      items: items,
      page: payload['page'] is num ? (payload['page'] as num).toInt() : 1,
      pageSize: payload['pageSize'] is num ? (payload['pageSize'] as num).toInt() : items.length,
      total: payload['total'] is num ? (payload['total'] as num).toInt() : items.length,
      totalPages: payload['totalPages'] is num ? (payload['totalPages'] as num).toInt() : 1,
      query: payload['query'] as String?,
      facets: payload['facets'] is Map<String, dynamic>
          ? Map<String, dynamic>.from(payload['facets'] as Map)
          : null,
    );
  }
}

String _filtersCacheKey(Map<String, dynamic>? filters) {
  final normalised = _normaliseFilters(filters);
  if (normalised == null) {
    return 'none';
  }
  return jsonEncode(normalised);
}

dynamic _normaliseFilters(dynamic value) {
  if (value is Map<String, dynamic>) {
    final sorted = SplayTreeMap<String, dynamic>();
    value.forEach((key, val) {
      final normalised = _normaliseFilters(val);
      if (_isMeaningful(normalised)) {
        sorted[key] = normalised;
      }
    });
    return sorted.isEmpty ? null : sorted;
  }

  if (value is Iterable) {
    final list = value
        .map(_normaliseFilters)
        .where(_isMeaningful)
        .toList(growable: false);
    return list.isEmpty ? null : list;
  }

  if (value == null) {
    return null;
  }

  if (value is String) {
    final trimmed = value.trim();
    return trimmed.isEmpty ? null : trimmed;
  }

  if (value is bool || value is num) {
    return value;
  }

  return '$value';
}

bool _isMeaningful(dynamic value) {
  if (value == null) {
    return false;
  }
  if (value is String) {
    return value.isNotEmpty;
  }
  if (value is Iterable) {
    return value.isNotEmpty;
  }
  if (value is Map) {
    return value.isNotEmpty;
  }
  return true;
}
