import 'package:flutter_test/flutter_test.dart';
import 'package:gigvora_foundation/gigvora_foundation.dart';

import 'package:gigvora_mobile/features/ads/application/ads_dashboard_controller.dart';
import 'package:gigvora_mobile/features/ads/data/models/ads_dashboard_models.dart';

class _FakeAdsRepository implements AdsRepository {
  _FakeAdsRepository({
    required this.snapshot,
    Map<String, List<AdPlacement>>? placements,
  }) : placementsBySurface = placements ?? <String, List<AdPlacement>>{};

  RepositoryResult<AdDashboardSnapshot> snapshot;
  final Map<String, List<AdPlacement>> placementsBySurface;
  List<String>? lastSurfaces;
  AdTargetingContext? lastContext;
  bool forceRefresh = false;

  @override
  Future<RepositoryResult<AdDashboardSnapshot>> fetchSnapshot({
    List<String>? surfaces,
    AdTargetingContext? context,
    bool forceRefresh = false,
  }) async {
    lastSurfaces = surfaces;
    lastContext = context;
    this.forceRefresh = forceRefresh;
    return snapshot;
  }

  @override
  Future<List<AdPlacement>> fetchPlacementsForSurface(String surface) async {
    return placementsBySurface[surface] ?? const <AdPlacement>[];
  }
}

class _FakeAnalyticsService implements AnalyticsService {
  final List<String> events = <String>[];
  final List<Map<String, dynamic>?> contexts = <Map<String, dynamic>?>[];

  @override
  Future<bool> track(String eventName, {Map<String, dynamic>? context, Map<String, dynamic>? metadata}) async {
    events.add(eventName);
    contexts.add(context);
    return true;
  }

  @override
  Future<void> flushQueue() async {}
}

void main() {
  group('AdsDashboardController', () {
    late _FakeAdsRepository repository;
    late _FakeAnalyticsService analytics;
    late AdsDashboardController controller;
    late AdDashboardSnapshot snapshot;

    setUp(() {
      snapshot = AdDashboardSnapshot(
        overview: const AdOverview(
          totalPlacements: 4,
          activePlacements: 3,
          upcomingPlacements: 1,
          totalCampaigns: 2,
          surfaces: <AdSurfaceSummary>[],
          keywordHighlights: <AdKeywordHighlight>[],
          taxonomyHighlights: <AdTaxonomyHighlight>[],
          context: AdTargetingContext(keywordHints: <String>[], taxonomySlugs: <String>[]),
        ),
        surfaces: <AdSurfaceGroup>[
          AdSurfaceGroup(
            surface: 'home',
            label: 'Home',
            placements: const <AdPlacement>[],
            totalPlacements: 2,
            upcomingPlacements: 0,
          ),
        ],
        recommendations: const <String>['Refresh creatives'],
        forecast: null,
        generatedAt: DateTime.now(),
      );

      repository = _FakeAdsRepository(
        snapshot: RepositoryResult<AdDashboardSnapshot>(
          data: snapshot,
          fromCache: false,
          lastUpdated: DateTime.now(),
        ),
        placements: <String, List<AdPlacement>>{
          'home': <AdPlacement>[
            AdPlacement(
              id: 1,
              surface: 'home',
              status: 'active',
              score: 9.2,
              isActive: true,
              isUpcoming: false,
              opportunityType: 'high_impact',
              priority: 1,
              timeUntilStartMinutes: 10,
              timeUntilEndMinutes: 120,
              creative: const AdCreative(
                id: 10,
                name: 'Hero',
                type: 'banner',
                format: 'static',
                status: 'live',
                headline: 'Scale faster',
                subheadline: 'Automated growth orchestration',
                body: 'Grow your agency with curated deals.',
                callToAction: 'View brief',
                campaign: AdCampaign(id: 5, name: 'Scale', objective: 'awareness', status: 'live'),
              ),
              keywords: const <AdKeywordAssignment>[],
              taxonomies: const <AdTaxonomyAssignment>[],
            ),
          ],
        },
      );
      analytics = _FakeAnalyticsService();
      controller = AdsDashboardController(repository, analytics);
    });

    test('loads snapshot data and tracks the first view', () async {
      await controller.load(forceRefresh: true);

      expect(controller.state.data, equals(snapshot));
      expect(controller.state.loading, isFalse);
      expect(controller.state.hasError, isFalse);
      expect(analytics.events, contains('mobile_ads_dashboard_viewed'));
    });

    test('passes filter metadata to repository and refreshes placements', () async {
      await controller.load();
      expect(repository.lastSurfaces, isNull);

      controller.updateFilters(surfaces: <String>['home', 'jobs'], context: const AdTargetingContext(keywordHints: <String>['design'], taxonomySlugs: <String>['creative']));
      await Future<void>.delayed(const Duration(milliseconds: 10));

      expect(repository.lastSurfaces, equals(<String>['home', 'jobs']));
      expect(repository.lastContext?.keywordHints, equals(<String>['design']));
      expect(repository.forceRefresh, isTrue);
    });

    test('preloads placements and memoises result per surface', () async {
      await controller.load();

      await controller.preloadPlacements('home');
      expect(controller.placementsBySurface['home']!.length, 1);
      expect(analytics.events, contains('mobile_ads_surface_loaded'));

      repository.placementsBySurface['home'] = const <AdPlacement>[];
      await controller.preloadPlacements('home');

      expect(controller.placementsBySurface['home']!.length, 1, reason: 'cached placements should be reused');
    });
  });
}
