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

  String _filtersCacheKey(Map<String, dynamic>? filters) {
    if (filters == null || filters.isEmpty) {
      return 'no-filters';
    }
    return jsonEncode(_normaliseForEncoding(filters));
  }

  Map<String, String>? _sanitizeHeaders(Map<String, String>? headers) {
    if (headers == null || headers.isEmpty) {
      return null;
    }
    final sanitized = <String, String>{};
    headers.forEach((key, value) {
      if (value.trim().isNotEmpty) {
        sanitized[key] = value.trim();
      }
    });
    return sanitized.isEmpty ? null : sanitized;
  }

  Future<RepositoryResult<OpportunityPage>> fetchOpportunities(
    OpportunityCategory category, {
    String? query,
    bool forceRefresh = false,
    int page = 1,
    int pageSize = 20,
    Map<String, dynamic>? filters,
    String? sort,
    bool includeFacets = false,
    Map<String, String>? headers,
  }) async {
    final queryKey = (query ?? '').trim().toLowerCase();
    final filterToken = _filtersCacheKey(filters);
    final sortToken = (sort ?? '').trim().isEmpty ? 'default' : (sort ?? '').trim();
    final facetToken = includeFacets ? 'facets' : 'no-facets';
    final cacheKey =
        'opportunities:${categoryToPath(category)}:${queryKey.isEmpty ? 'all' : queryKey}:$filterToken:$sortToken:$facetToken:page$page:size$pageSize';

    final cached = _cache.read<OpportunityPage>(cacheKey, (raw) {
      if (raw is Map<String, dynamic>) {
        return _mapToOpportunityPage(category, raw);
      }
      return null;
    });

    if (!forceRefresh && cached != null) {
      return RepositoryResult(
        data: cached.value.copyWith(query: queryKey.isEmpty ? null : queryKey),
        fromCache: true,
        lastUpdated: cached.storedAt,
      );
    }

    try {
      final endpoint = '/discovery/${categoryToPath(category)}';
      final params = <String, dynamic>{
        'page': page,
        'pageSize': pageSize,
        'q': queryKey.isEmpty ? null : queryKey,
        'filters': filters == null || filters.isEmpty ? null : jsonEncode(filters),
        'sort': sortToken == 'default' ? null : sortToken,
        'includeFacets': includeFacets ? 'true' : null,
      };
      final response = await _apiClient.get(
        endpoint,
        query: params,
        headers: _sanitizeHeaders(headers),
      );
      if (response is! Map<String, dynamic>) {
        throw Exception('Unexpected response from $endpoint');
      }
      await _cache.write(cacheKey, response, ttl: _opportunityTtl);
      final pageData =
          _mapToOpportunityPage(category, response).copyWith(query: queryKey.isEmpty ? null : queryKey);
      return RepositoryResult(
        data: pageData,
        fromCache: false,
        lastUpdated: DateTime.now(),
      );
    } catch (error) {
      if (cached != null) {
        return RepositoryResult(
          data: cached.value.copyWith(query: queryKey.isEmpty ? null : queryKey),
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
      if (raw is Map<String, dynamic>) {
        return DiscoverySnapshot.fromJson(Map<String, dynamic>.from(raw));
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
    final cacheKey = 'search:${trimmed.toLowerCase()}:$limit';

    final cached = trimmed.isEmpty
        ? null
        : _cache.read<GlobalSearchResult>(cacheKey, (raw) {
            if (raw is Map<String, dynamic>) {
              return GlobalSearchResult.fromJson(Map<String, dynamic>.from(raw));
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
      page: (payload['page'] as num?)?.toInt() ?? 1,
      pageSize: (payload['pageSize'] as num?)?.toInt() ?? items.length,
      total: (payload['total'] as num?)?.toInt() ?? items.length,
      totalPages: (payload['totalPages'] as num?)?.toInt() ?? 1,
      query: payload['query'] as String?,
      facets: payload['facets'] as Map<String, dynamic>?,
    );
  }
}
