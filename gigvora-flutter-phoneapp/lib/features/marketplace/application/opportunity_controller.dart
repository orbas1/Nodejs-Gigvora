import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gigvora_foundation/gigvora_foundation.dart';

import '../../../core/providers.dart';
import '../data/discovery_repository.dart';
import '../data/models/opportunity.dart';
import '../data/models/opportunity_detail.dart';

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
  Map<String, dynamic> _filters = const <String, dynamic>{};
  String? _sort;
  bool _includeFacets = false;

  Map<String, dynamic> get filters => Map.unmodifiable(_filters);
  String? get sort => _sort;
  String get query => _query;

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
          'sort': _sort ?? 'default',
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
            'sort': _sort ?? 'default',
          },
          metadata: const {'source': 'mobile_app'},
        );
      }
    } catch (error, stackTrace) {
      state = state.copyWith(loading: false, error: error);
      await _analytics.track(
        'mobile_opportunity_sync_failed',
        context: {
          'category': categoryToPath(category),
          'query': _query.isEmpty ? null : _query,
          'reason': '$error',
          'filters': _filters.isEmpty ? null : _filters,
          'sort': _sort ?? 'default',
        },
        metadata: const {'source': 'mobile_app'},
      );
      FlutterError.reportError(FlutterErrorDetails(exception: error, stack: stackTrace));
    }
  }

  Future<void> refresh() => load(forceRefresh: true);

  void setIncludeFacets(bool value) {
    if (_includeFacets == value) {
      return;
    }
    _includeFacets = value;
    _viewRecorded = false;
    unawaited(load());
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
        final items = state.data?.items ?? const <OpportunitySummary>[];
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

  Future<void> updateSort(String? sort) async {
    final normalised = sort?.trim();
    if ((_sort ?? '').trim() == (normalised ?? '')) {
      return;
    }
    _sort = normalised?.isEmpty ?? true ? null : normalised;
    _viewRecorded = false;
    await load();
    await _analytics.track(
      'mobile_opportunity_sort_updated',
      context: {
        'category': categoryToPath(category),
        'query': _query.isEmpty ? null : _query,
        'sort': _sort ?? 'default',
        'filters': _filters.isEmpty ? null : _filters,
      },
      metadata: const {'source': 'mobile_app'},
    );
  }

  void setFilters(Map<String, dynamic>? filters) {
    if (filters == null || filters.isEmpty) {
      _filters = const <String, dynamic>{};
      _viewRecorded = false;
      unawaited(load());
      return;
    }

    final cleaned = <String, dynamic>{};
    filters.forEach((key, value) {
      final normalised = _normaliseFilterValue(value);
      if (normalised != null) {
        cleaned[key] = normalised;
      }
    });

    if (mapEquals(cleaned, _filters)) {
      return;
    }

    _filters = cleaned;
    _viewRecorded = false;
    unawaited(load());
    unawaited(_analytics.track(
      'mobile_opportunity_filters_updated',
      context: {
        'category': categoryToPath(category),
        'query': _query.isEmpty ? null : _query,
        'filters': _filters.isEmpty ? null : _filters,
      },
      metadata: const {'source': 'mobile_app'},
    ));
  }

  void updateFilters(Map<String, dynamic> updates) {
    final next = Map<String, dynamic>.from(_filters);
    updates.forEach((key, value) {
      final normalised = _normaliseFilterValue(value);
      if (normalised == null) {
        next.remove(key);
      } else {
        next[key] = normalised;
      }
    });

    if (mapEquals(next, _filters)) {
      return;
    }

    _filters = next;
    _viewRecorded = false;
    unawaited(load());
    unawaited(_analytics.track(
      'mobile_opportunity_filters_updated',
      context: {
        'category': categoryToPath(category),
        'query': _query.isEmpty ? null : _query,
        'filters': _filters.isEmpty ? null : _filters,
      },
      metadata: const {'source': 'mobile_app'},
    ));
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

  Future<OpportunityDetail> loadDetail(String id) async {
    final headers = _ref.read(membershipHeadersProvider);
    final detail = await _repository.fetchOpportunityDetail(
      category,
      id,
      headers: headers,
    );
    unawaited(_analytics.track(
      'mobile_opportunity_detail_viewed',
      context: {
        'category': categoryToPath(category),
        'id': detail.id,
        'title': detail.title,
      },
      metadata: const {'source': 'mobile_app'},
    ));
    return detail;
  }

  Future<OpportunityDetail> createOpportunity(OpportunityDraft draft) async {
    final headers = _ref.read(membershipHeadersProvider);
    final detail = await _repository.createOpportunity(
      category,
      draft,
      headers: headers,
    );
    await _analytics.track(
      'mobile_opportunity_created',
      context: {
        'category': categoryToPath(category),
        'id': detail.id,
        'title': detail.title,
      },
      metadata: const {'source': 'mobile_app'},
    );
    await load(forceRefresh: true);
    return detail;
  }

  Future<OpportunityDetail> updateOpportunity(
    String id,
    OpportunityDraft draft,
  ) async {
    final headers = _ref.read(membershipHeadersProvider);
    final detail = await _repository.updateOpportunity(
      category,
      id,
      draft,
      headers: headers,
    );
    await _analytics.track(
      'mobile_opportunity_updated',
      context: {
        'category': categoryToPath(category),
        'id': detail.id,
        'title': detail.title,
      },
      metadata: const {'source': 'mobile_app'},
    );
    await load(forceRefresh: true);
    return detail;
  }

  Future<void> deleteOpportunity(String id) async {
    final headers = _ref.read(membershipHeadersProvider);
    await _repository.deleteOpportunity(
      category,
      id,
      headers: headers,
    );
    await _analytics.track(
      'mobile_opportunity_deleted',
      context: {
        'category': categoryToPath(category),
        'id': id,
      },
      metadata: const {'source': 'mobile_app'},
    );
    await load(forceRefresh: true);
  }

  @override
  void dispose() {
    _debounce?.cancel();
    super.dispose();
  }

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
          'sort': _sort ?? 'default',
        },
        metadata: const {'source': 'mobile_app'},
      );
      _viewRecorded = true;
    }
  }

  dynamic _normaliseFilterValue(dynamic value) {
    if (value == null) {
      return null;
    }
    if (value is String) {
      final trimmed = value.trim();
      return trimmed.isEmpty ? null : trimmed;
    }
    if (value is Iterable) {
      final cleaned = <dynamic>[];
      for (final entry in value) {
        if (entry == null) {
          continue;
        }
        if (entry is String) {
          final trimmed = entry.trim();
          if (trimmed.isNotEmpty) {
            cleaned.add(trimmed);
          }
        } else {
          cleaned.add(entry);
        }
      }
      return cleaned.isEmpty ? null : List<dynamic>.unmodifiable(cleaned);
    }
    return value;
  }
}

final discoveryRepositoryProvider = Provider<DiscoveryRepository>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  final cache = ref.watch(offlineCacheProvider);
  return DiscoveryRepository(apiClient, cache);
});

final opportunityControllerProvider =
    StateNotifierProvider.family<OpportunityController, ResourceState<OpportunityPage>, OpportunityCategory>(
  (ref, category) {
    final repository = ref.watch(discoveryRepositoryProvider);
    final analytics = ref.watch(analyticsServiceProvider);
    return OpportunityController(repository, analytics, category, ref);
  },
);
