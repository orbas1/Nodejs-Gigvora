import 'dart:collection';
import 'dart:convert';

import 'package:gigvora_foundation/gigvora_foundation.dart';

import '../../explorer/data/discovery_models.dart';
import 'models/opportunity.dart';
import 'models/opportunity_detail.dart';

class DiscoveryRepository {
  DiscoveryRepository(this._apiClient, this._cache);

  final ApiClient _apiClient;
  final OfflineCache _cache;

  static const _opportunityTtl = Duration(minutes: 5);
  static const _snapshotTtl = Duration(minutes: 3);
  static const _searchTtl = Duration(minutes: 4);

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
    final queryKey = (query ?? '').trim();
    final filterToken = _serialiseForCache(filters);
    final sortToken = (sort ?? '').trim().isEmpty ? 'default' : (sort ?? '').trim();
    final facetToken = includeFacets ? 'facets' : 'no-facets';
    final headerToken = _serialiseHeaders(headers);
    final cacheKey =
        'opportunities:${categoryToPath(category)}:${queryKey.isEmpty ? 'all' : queryKey}:$filterToken:$sortToken:$facetToken:$headerToken:page$page:size$pageSize';

    final cached = _cache.read<OpportunityPage>(cacheKey, (raw) {
      if (raw is Map<String, dynamic>) {
        return _mapToOpportunityPage(category, raw).copyWith(
          query: queryKey.isEmpty ? null : queryKey,
        );
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
      final response = await _apiClient.get(
        '/discovery/${categoryToPath(category)}',
        query: {
          'page': page,
          'pageSize': pageSize,
          'q': queryKey.isEmpty ? null : queryKey,
          'filters': filters == null || filters.isEmpty ? null : jsonEncode(filters),
          'sort': sortToken == 'default' ? null : sortToken,
          'includeFacets': includeFacets ? 'true' : null,
        },
        headers: _sanitizeHeaders(headers),
      );

      if (response is! Map<String, dynamic>) {
        throw Exception('Unexpected response from discovery endpoint');
      }

      await _cache.write(cacheKey, response, ttl: _opportunityTtl);
      final pageData = _mapToOpportunityPage(category, response).copyWith(
        query: queryKey.isEmpty ? null : queryKey,
      );
      return RepositoryResult(
        data: pageData,
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

  Future<OpportunityDetail> fetchOpportunityDetail(
    OpportunityCategory category,
    String id, {
    Map<String, String>? headers,
  }) async {
    final response = await _apiClient.get(
      '/discovery/${categoryToPath(category)}/$id',
      headers: _sanitizeHeaders(headers),
    );
    if (response is! Map<String, dynamic>) {
      throw Exception('Unexpected opportunity detail payload');
    }
    return OpportunityDetail.fromJson(category, Map<String, dynamic>.from(response));
  }

  Future<OpportunityDetail> createOpportunity(
    OpportunityCategory category,
    OpportunityDraft draft, {
    Map<String, String>? headers,
  }) async {
    final response = await _apiClient.post(
      '/discovery/${categoryToPath(category)}',
      body: draft.toJson(),
      headers: _sanitizeHeaders(headers),
    );
    if (response is! Map<String, dynamic>) {
      throw Exception('Unexpected response creating opportunity');
    }
    await _invalidateCaches();
    return OpportunityDetail.fromJson(category, Map<String, dynamic>.from(response));
  }

  Future<OpportunityDetail> updateOpportunity(
    OpportunityCategory category,
    String id,
    OpportunityDraft draft, {
    Map<String, String>? headers,
  }) async {
    final response = await _apiClient.patch(
      '/discovery/${categoryToPath(category)}/$id',
      body: draft.toJson(),
      headers: _sanitizeHeaders(headers),
    );
    if (response is! Map<String, dynamic>) {
      throw Exception('Unexpected response updating opportunity');
    }
    await _invalidateCaches();
    return OpportunityDetail.fromJson(category, Map<String, dynamic>.from(response));
  }

  Future<void> deleteOpportunity(
    OpportunityCategory category,
    String id, {
    Map<String, String>? headers,
  }) async {
    await _apiClient.delete(
      '/discovery/${categoryToPath(category)}/$id',
      headers: _sanitizeHeaders(headers),
    );
    await _invalidateCaches();
  }

  Future<void> _invalidateCaches() async {
    try {
      await _cache.clear();
    } catch (_) {
      // Ignore cache clear failures to avoid breaking core flows.
    }
  }

  Future<RepositoryResult<DiscoverySnapshot>> fetchSnapshot({
    int limit = 8,
    bool forceRefresh = false,
  }) async {
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
      final response = await _apiClient.get(
        '/discovery/snapshot',
        query: {'limit': limit},
      );
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
      final response = await _apiClient.get(
        '/search',
        query: {
          'q': trimmed,
          'limit': limit,
        },
      );
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

  Map<String, String>? _sanitizeHeaders(Map<String, String>? headers) {
    if (headers == null || headers.isEmpty) {
      return null;
    }
    final sanitized = <String, String>{};
    headers.forEach((key, value) {
      final trimmed = value.trim();
      if (trimmed.isNotEmpty) {
        sanitized[key] = trimmed;
      }
    });
    return sanitized.isEmpty ? null : sanitized;
  }

  String _serialiseForCache(Map<String, dynamic>? values) {
    if (values == null || values.isEmpty) {
      return 'none';
    }

    dynamic normalise(dynamic value) {
      if (value is Map) {
        final sorted = SplayTreeMap<String, dynamic>.fromIterable(
          value.keys.map((key) => key.toString()),
          value: (key) => normalise(value[key]),
        );
        return sorted;
      }
      if (value is Iterable) {
        final list = value.map(normalise).toList();
        list.sort((a, b) => jsonEncode(a).compareTo(jsonEncode(b)));
        return list;
      }
      return value;
    }

    final normalised = normalise(values);
    return jsonEncode(normalised);
  }

  String _serialiseHeaders(Map<String, String>? headers) {
    if (headers == null || headers.isEmpty) {
      return 'no-headers';
    }
    return _serialiseForCache(headers);
  }

  OpportunityPage _mapToOpportunityPage(
    OpportunityCategory category,
    Map<String, dynamic> payload,
  ) {
    return OpportunityPage.fromJson(category, payload);
  }
}
