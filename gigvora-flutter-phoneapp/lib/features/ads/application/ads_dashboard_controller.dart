import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gigvora_foundation/gigvora_foundation.dart';

import '../../core/providers.dart';
import '../data/ads_repository.dart';
import '../data/models/ads_dashboard_models.dart';

const _placementsKey = 'placementsBySurface';
const _loadingSurfaceKey = 'loadingSurface';
const _contextKey = 'adsContext';

class AdsDashboardController extends StateNotifier<ResourceState<AdDashboardSnapshot>> {
  AdsDashboardController(this._repository, this._analytics)
      : super(ResourceState<AdDashboardSnapshot>.loading()) {
    load();
  }

  final AdsRepository _repository;
  final AnalyticsService _analytics;

  List<String>? _surfaces;
  AdTargetingContext? _context;
  bool _viewTracked = false;

  Future<void> load({bool forceRefresh = false}) async {
    state = state.copyWith(loading: true, error: null);
    try {
      final result = await _repository.fetchSnapshot(
        surfaces: _surfaces,
        context: _context,
        forceRefresh: forceRefresh,
      );

      final metadata = {
        ...state.metadata,
        _placementsKey: (state.metadata[_placementsKey] as Map<String, List<AdPlacement>>?) ??
            <String, List<AdPlacement>>{},
        _contextKey: _context ?? result.data.overview.context,
        _loadingSurfaceKey: null,
      };

      state = ResourceState<AdDashboardSnapshot>(
        data: result.data,
        loading: false,
        error: result.error,
        fromCache: result.fromCache,
        lastUpdated: result.lastUpdated,
        metadata: metadata,
      );

      if (!_viewTracked && !result.data.isEmpty) {
        _viewTracked = true;
        await _analytics.track(
          'mobile_ads_dashboard_viewed',
          context: {
            'surfaces': result.data.surfaces.length,
            'totalPlacements': result.data.overview.totalPlacements,
            'fromCache': result.fromCache,
          },
          metadata: const {'source': 'mobile_app'},
        );
      }

      if (result.error != null) {
        await _analytics.track(
          'mobile_ads_dashboard_partial',
          context: {
            'reason': '${result.error}',
            'fromCache': result.fromCache,
          },
          metadata: const {'source': 'mobile_app'},
        );
      }
    } catch (error) {
      state = state.copyWith(loading: false, error: error);
      await _analytics.track(
        'mobile_ads_dashboard_failed',
        context: {
          'reason': '$error',
        },
        metadata: const {'source': 'mobile_app'},
      );
    }
  }

  Future<void> refresh() => load(forceRefresh: true);

  void updateFilters({List<String>? surfaces, AdTargetingContext? context}) {
    _surfaces = surfaces;
    _context = context;
    load(forceRefresh: true);
  }

  Future<void> preloadPlacements(String surface) async {
    if (surface.isEmpty) {
      return;
    }
    final placementsBySurface = Map<String, List<AdPlacement>>.from(
      (state.metadata[_placementsKey] as Map<String, List<AdPlacement>>?) ??
          <String, List<AdPlacement>>{},
    );

    if (placementsBySurface.containsKey(surface)) {
      return;
    }

    state = state.copyWith(
      metadata: {
        ...state.metadata,
        _loadingSurfaceKey: surface,
      },
    );

    try {
      final placements = await _repository.fetchPlacementsForSurface(surface);
      placementsBySurface[surface] = placements;
      state = state.copyWith(
        metadata: {
          ...state.metadata,
          _placementsKey: placementsBySurface,
          _loadingSurfaceKey: null,
        },
      );

      await _analytics.track(
        'mobile_ads_surface_loaded',
        context: {
          'surface': surface,
          'placements': placements.length,
        },
        metadata: const {'source': 'mobile_app'},
      );
    } catch (error) {
      state = state.copyWith(
        metadata: {
          ...state.metadata,
          _loadingSurfaceKey: null,
        },
        error: error,
      );
    }
  }

  Map<String, List<AdPlacement>> get placementsBySurface =>
      (state.metadata[_placementsKey] as Map<String, List<AdPlacement>>?) ??
      const <String, List<AdPlacement>>{};

  String? get loadingSurface => state.metadata[_loadingSurfaceKey] as String?;

  AdTargetingContext? get contextOverride => state.metadata[_contextKey] as AdTargetingContext?;
}

final adsRepositoryProvider = Provider<AdsRepository>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  final cache = ref.watch(offlineCacheProvider);
  return AdsRepository(apiClient, cache);
});

final adsDashboardControllerProvider =
    StateNotifierProvider<AdsDashboardController, ResourceState<AdDashboardSnapshot>>((ref) {
  final repository = ref.watch(adsRepositoryProvider);
  final analytics = ref.watch(analyticsServiceProvider);
  return AdsDashboardController(repository, analytics);
});
