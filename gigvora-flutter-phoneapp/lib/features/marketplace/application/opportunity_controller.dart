import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/analytics/analytics_service.dart';
import '../../../core/providers.dart';
import '../../../core/state/resource_state.dart';
import '../data/discovery_repository.dart';
import '../data/models/opportunity.dart';

class OpportunityController extends StateNotifier<ResourceState<OpportunityPage>> {
  OpportunityController(this._repository, this._analytics, this.category)
      : super(ResourceState<OpportunityPage>.loading()) {
    load();
  }

  final DiscoveryRepository _repository;
  final AnalyticsService _analytics;
  final OpportunityCategory category;

  String _query = '';
  Timer? _debounce;
  bool _viewRecorded = false;

  Future<void> load({bool forceRefresh = false}) async {
    state = state.copyWith(loading: true, error: null);
    try {
      final result = await _repository.fetchOpportunities(
        category,
        query: _query,
        forceRefresh: forceRefresh,
      );
      state = ResourceState<OpportunityPage>(
        data: result.data,
        loading: false,
        error: result.error,
        fromCache: result.fromCache,
        lastUpdated: result.lastUpdated,
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
        },
        metadata: const {'source': 'mobile_app'},
      );
    }
  }

  Future<void> refresh() => load(forceRefresh: true);

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
      },
      metadata: const {'source': 'mobile_app'},
    );
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
    return OpportunityController(repository, analytics, category);
  },
);
