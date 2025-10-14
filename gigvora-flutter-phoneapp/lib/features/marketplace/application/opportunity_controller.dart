import 'dart:async';
import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gigvora_foundation/gigvora_foundation.dart';

import '../../../core/providers.dart';
import '../data/discovery_repository.dart';
import '../data/models/opportunity.dart';

class OpportunityController extends StateNotifier<ResourceState<OpportunityPage>> {
  OpportunityController(this._repository, this._analytics, this.category, this._ref)
      : super(ResourceState<OpportunityPage>.loading()) {
    load();
  }

  final DiscoveryRepository _repository;
  final AnalyticsService _analytics;
  final OpportunityCategory category;
  final Ref _ref;

  String _query = '';
  Timer? _debounce;
  bool _viewRecorded = false;
  Map<String, dynamic> _filters = const {};
  String? _sort;
  bool _includeFacets = false;
  Map<String, dynamic> _filters = const <String, dynamic>{};

  Future<void> load({bool forceRefresh = false}) async {
    state = state.copyWith(loading: true, error: null);
    try {
      final headers = _ref.read(membershipHeadersProvider);
      final result = await _repository.fetchOpportunities(
        category,
        query: _query,
        forceRefresh: forceRefresh,
        filters: _filters.isEmpty ? null : _filters,
        sort: _sort,
        includeFacets: _includeFacets,
        headers: headers,
      );
      state = ResourceState<OpportunityPage>(
        data: result.data,
        loading: false,
        error: result.error,
        fromCache: result.fromCache,
        lastUpdated: result.lastUpdated,
        metadata: {
          ...state.metadata,
          'filters': _filters,
        },
      );

      await _emitViewAnalytics(result.data, fromCache: result.fromCache);

      if (result.error != null) {
        await _analytics.track(
          'mobile_opportunity_sync_partial',
          context: {
            'category': categoryToPath(category),
            'query': _query.isEmpty ? null : _query,
            'reason': '${result.error}',
            'fromCache': result.fromCache,
            'filters': _filters.isEmpty ? null : _filters,
          },
          metadata: const {'source': 'mobile_app'},
        );
      }
    } catch (error) {
      state = state.copyWith(loading: false, error: error);
      await _analytics.track(
        'mobile_opportunity_sync_failed',
        context: {
          'category': categoryToPath(category),
          'query': _query.isEmpty ? null : _query,
          'reason': '$error',
          'filters': _filters.isEmpty ? null : _filters,
        },
        metadata: const {'source': 'mobile_app'},
      );
    }
  }

  Future<void> refresh() => load(forceRefresh: true);

  Future<void> updateFilters(Map<String, dynamic> filters) async {
    _filters = Map<String, dynamic>.from(filters);
    await load();
    await _analytics.track(
      'mobile_opportunity_filters_updated',
      context: {
        'category': categoryToPath(category),
        'query': _query.isEmpty ? null : _query,
        'filters': _filters,
      },
      metadata: const {'source': 'mobile_app'},
    );
  }

  Future<void> updateSort(String? sort) async {
    final normalised = sort?.trim();
    if (_sort == normalised) {
      return;
    }
    _sort = normalised?.isEmpty ?? true ? null : normalised;
    await load();
    await _analytics.track(
      'mobile_opportunity_sort_updated',
      context: {
        'category': categoryToPath(category),
        'query': _query.isEmpty ? null : _query,
        'sort': _sort ?? 'default',
      },
      metadata: const {'source': 'mobile_app'},
    );
  }

  void setIncludeFacets(bool value) {
    _includeFacets = value;
  }

  void updateQuery(String value) {
    final trimmed = value.trim();
    if (trimmed == _query) {
      return;
    }
    _query = trimmed;
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 400), () async {
      await load();
      if (_query.isNotEmpty) {
        final items = state.data?.items ?? const [];
        await _analytics.track(
          'mobile_search_performed',
          context: {
            'category': categoryToPath(category),
            'query': _query,
            'results': items.length,
            'filters': _filters.isEmpty ? null : _filters,
          },
          metadata: const {'source': 'mobile_app'},
        );
      }
    });
  }

  Future<void> recordPrimaryCta(OpportunitySummary opportunity) {
    return _analytics.track(
      'mobile_opportunity_cta',
      context: {
        'category': categoryToPath(category),
        'id': opportunity.id,
        'title': opportunity.title,
        'query': _query.isEmpty ? null : _query,
        'filters': _filters.isEmpty ? null : _filters,
      },
      metadata: const {'source': 'mobile_app'},
    );
  }

  @override
  void dispose() {
    _debounce?.cancel();
    super.dispose();
  }

  void updateFilters(Map<String, dynamic> updates) {
    final next = Map<String, dynamic>.from(_filters);
    updates.forEach((key, value) {
      if (value == null) {
        next.remove(key);
        return;
      }
      if (value is String && value.trim().isEmpty) {
        next.remove(key);
        return;
      }
      if (value is Iterable && value.isEmpty) {
        next.remove(key);
        return;
      }
      next[key] = value;
    });

    if (mapEquals(next, _filters)) {
      return;
    }

    _filters = next;
    _viewRecorded = false;
    unawaited(load());
  }

  Map<String, dynamic> get filters => _filters;

  Future<void> _emitViewAnalytics(OpportunityPage page, {required bool fromCache}) async {
    final items = page.items;
    if (items.isEmpty) {
      return;
    }

    if (!_viewRecorded) {
      await _analytics.track(
        'mobile_opportunity_listing_viewed',
        context: {
          'category': categoryToPath(category),
          'resultCount': items.length,
          'fromCache': fromCache,
          'query': _query.isEmpty ? null : _query,
          'filters': _filters.isEmpty ? null : _filters,
        },
        metadata: const {'source': 'mobile_app'},
      );
      _viewRecorded = true;
    }
  }
}

final discoveryRepositoryProvider = Provider<DiscoveryRepository>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  final cache = ref.watch(offlineCacheProvider);
  return DiscoveryRepository(apiClient, cache);
});

final opportunityControllerProvider = StateNotifierProvider.family<OpportunityController, ResourceState<OpportunityPage>, OpportunityCategory>(
  (ref, category) {
    final repository = ref.watch(discoveryRepositoryProvider);
    final analytics = ref.watch(analyticsServiceProvider);
    return OpportunityController(repository, analytics, category, ref);
  },
);
