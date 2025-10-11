import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gigvora_foundation/gigvora_foundation.dart';

import '../../../core/providers.dart';
import '../../marketplace/application/opportunity_controller.dart';
import '../../marketplace/data/discovery_repository.dart';
import '../../marketplace/data/models/opportunity.dart';
import '../data/discovery_models.dart';

class ExplorerState {
  const ExplorerState({
    required this.query,
    required this.snapshot,
    required this.search,
  });

  final String query;
  final ResourceState<DiscoverySnapshot> snapshot;
  final ResourceState<GlobalSearchResult> search;

  ExplorerState copyWith({
    String? query,
    ResourceState<DiscoverySnapshot>? snapshot,
    ResourceState<GlobalSearchResult>? search,
  }) {
    return ExplorerState(
      query: query ?? this.query,
      snapshot: snapshot ?? this.snapshot,
      search: search ?? this.search,
    );
  }

  factory ExplorerState.initial() {
    return ExplorerState(
      query: '',
      snapshot: ResourceState<DiscoverySnapshot>.loading(),
      search: ResourceState<GlobalSearchResult>(
        data: GlobalSearchResult.empty(),
        loading: false,
      ),
    );
  }
}

class ExplorerController extends StateNotifier<ExplorerState> {
  ExplorerController(this._repository, this._analytics) : super(ExplorerState.initial()) {
    loadSnapshot();
  }

  final DiscoveryRepository _repository;
  final AnalyticsService _analytics;
  Timer? _debounce;

  Future<void> loadSnapshot({bool forceRefresh = false}) async {
    final current = state.snapshot.data;
    state = state.copyWith(
      snapshot: state.snapshot.copyWith(
        loading: true,
        error: null,
        data: current,
      ),
    );

    try {
      final result = await _repository.fetchSnapshot(forceRefresh: forceRefresh);
      state = state.copyWith(
        snapshot: ResourceState<DiscoverySnapshot>(
          data: result.data,
          loading: false,
          error: result.error,
          fromCache: result.fromCache,
          lastUpdated: result.lastUpdated,
        ),
      );
    } catch (error) {
      state = state.copyWith(
        snapshot: state.snapshot.copyWith(loading: false, error: error),
      );
    }
  }

  void updateQuery(String value) {
    final trimmed = value.trim();
    state = state.copyWith(query: trimmed);
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 350), () {
      _performSearch();
    });
  }

  Future<void> refreshActive() async {
    if (state.query.isEmpty) {
      await loadSnapshot(forceRefresh: true);
    } else {
      await _performSearch(forceRefresh: true);
    }
  }

  Future<void> recordFilterSelection(OpportunityCategory? category) {
    return _analytics.track(
      'mobile_search_filter_selected',
      context: {
        'category': category == null ? 'people' : categoryToPath(category),
        'query': state.query.isEmpty ? null : state.query,
      },
      metadata: const {'source': 'mobile_app'},
    );
  }

  Future<void> recordResultOpened({
    required OpportunityCategory category,
    required String id,
    required String title,
  }) {
    return _analytics.track(
      'mobile_search_result_opened',
      context: {
        'category': categoryToPath(category),
        'id': id,
        'title': title,
        'query': state.query.isEmpty ? null : state.query,
      },
      metadata: const {'source': 'mobile_app'},
    );
  }

  Future<void> recordPersonOpened(SearchPerson person) {
    return _analytics.track(
      'mobile_search_person_opened',
      context: {
        'id': person.id,
        'name': person.displayName,
        'query': state.query.isEmpty ? null : state.query,
      },
      metadata: const {'source': 'mobile_app'},
    );
  }

  Future<void> _performSearch({bool forceRefresh = false}) async {
    final query = state.query.trim();
    if (query.isEmpty) {
      state = state.copyWith(
        search: ResourceState<GlobalSearchResult>(
          data: GlobalSearchResult.empty(),
          loading: false,
        ),
      );
      return;
    }

    final current = state.search.data;
    state = state.copyWith(
      search: state.search.copyWith(
        loading: true,
        error: null,
        data: current,
      ),
    );

    try {
      final result = await _repository.searchGlobal(query, forceRefresh: forceRefresh);
      state = state.copyWith(
        search: ResourceState<GlobalSearchResult>(
          data: result.data,
          loading: false,
          error: result.error,
          fromCache: result.fromCache,
          lastUpdated: result.lastUpdated,
        ),
      );

      final opportunities = result.data.opportunities.values.fold<int>(
            0,
            (previousValue, element) => previousValue + element.length,
          ) +
          result.data.people.length;
      await _analytics.track(
        'mobile_search_performed',
        context: {
          'category': 'global',
          'query': query,
          'results': opportunities,
        },
        metadata: const {'source': 'mobile_app'},
      );
    } catch (error) {
      state = state.copyWith(
        search: state.search.copyWith(loading: false, error: error),
      );
      await _analytics.track(
        'mobile_search_failed',
        context: {
          'query': query,
          'reason': '$error',
        },
        metadata: const {'source': 'mobile_app'},
      );
    }
  }

  @override
  void dispose() {
    _debounce?.cancel();
    super.dispose();
  }
}

final explorerControllerProvider = StateNotifierProvider<ExplorerController, ExplorerState>((ref) {
  final repository = ref.watch(discoveryRepositoryProvider);
  final analytics = ref.watch(analyticsServiceProvider);
  return ExplorerController(repository, analytics);
});
