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

  Future<RepositoryResult<OpportunityPage>> fetchOpportunities(
    OpportunityCategory category, {
    String? query,
    bool forceRefresh = false,
    int pageSize = 20,
    Map<String, dynamic>? filters,
    String? sort,
    bool includeFacets = false,
    Map<String, String>? headers,
  }) async {
    final queryKey = (query ?? '').trim().toLowerCase();
    final filterToken = _serialiseFilters(filters);
    final sortToken = sort?.trim().isEmpty ?? true ? 'default' : sort!.trim();
    final facetToken = includeFacets ? 'facets' : 'no-facets';
    final cacheKey =
        'opportunities:${categoryToPath(category)}:${queryKey.isEmpty ? 'all' : queryKey}:$filterToken:$sortToken:$facetToken:$pageSize';

    final cached = _cache.read<OpportunityPage>(cacheKey, (raw) {
      if (raw is Map) {
        return _mapToOpportunityPage(category, Map<String, dynamic>.from(raw));
      }
      return OpportunityPage(
        category: category,
        items: const <OpportunitySummary>[],
        page: 1,
        pageSize: pageSize,
        total: 0,
        totalPages: 1,
        query: queryKey,
      );
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
          'filters': filterToken == 'none' ? null : filterToken,
          'sort': sortToken == 'default' ? null : sortToken,
          'includeFacets': includeFacets ? 'true' : null,
        },
        headers: headers,
      );

      if (response is! Map<String, dynamic>) {
        throw Exception('Unexpected response from $endpoint');
      }

      await _cache.write(cacheKey, response, ttl: _opportunityTtl);
      final page = _mapToOpportunityPage(category, response).copyWith(query: queryKey);
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
    final cacheKey = 'search:${trimmed.toLowerCase()}:$limit';

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

  String _serialiseFilters(Map<String, dynamic>? filters) {
    if (filters == null || filters.isEmpty) {
      return 'none';
    }

    dynamic normalise(dynamic value) {
      if (value is Map) {
        final sorted = SplayTreeMap<String, dynamic>.fromIterables(
          value.keys.map((key) => key.toString()),
          value.values.map(normalise),
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

    final normalised = normalise(filters);
    return jsonEncode(normalised);
  }

  OpportunityPage _mapToOpportunityPage(
    OpportunityCategory category,
    Map<String, dynamic> payload,
  ) {
    return OpportunityPage.fromJson(category, payload);
  }
}
