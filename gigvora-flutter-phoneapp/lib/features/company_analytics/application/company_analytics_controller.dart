import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gigvora_foundation/gigvora_foundation.dart';

import '../../../core/providers.dart';
import '../data/company_analytics_repository.dart';
import '../data/models/company_analytics_dashboard.dart';

class CompanyAnalyticsController extends StateNotifier<ResourceState<CompanyAnalyticsDashboard>> {
  CompanyAnalyticsController(this._repository, this._analytics)
      : super(ResourceState<CompanyAnalyticsDashboard>.loading()) {
    load();
  }

  final CompanyAnalyticsRepository _repository;
  final AnalyticsService _analytics;
  bool _viewTracked = false;

  Future<void> load({bool forceRefresh = false}) async {
    state = state.copyWith(loading: true, error: null);
    try {
      final result = await _repository.fetchDashboard(forceRefresh: forceRefresh);
      final dashboard = result.data;
      state = ResourceState<CompanyAnalyticsDashboard>(
        data: dashboard,
        loading: false,
        error: result.error,
        fromCache: result.fromCache,
        lastUpdated: result.lastUpdated,
      );
      await _repository.persistDashboard(dashboard);

      if (!_viewTracked) {
        _viewTracked = true;
        await _analytics.track(
          'mobile_company_analytics_viewed',
          context: {
            'projectedHires': dashboard.forecast.projectedHires,
            'backlog': dashboard.forecast.backlog,
            'offerToHire': dashboard.conversion.offerToHire,
            'fromCache': result.fromCache,
          },
          metadata: const {'surface': 'mobile_app'},
        );
      }

      if (result.error != null) {
        await _analytics.track(
          'mobile_company_analytics_partial',
          context: {
            'reason': '${result.error}',
            'fromCache': result.fromCache,
          },
          metadata: const {'surface': 'mobile_app'},
        );
      }
    } catch (error, stackTrace) {
      state = state.copyWith(loading: false, error: error);
      await _analytics.track(
        'mobile_company_analytics_failed',
        context: {
          'reason': '$error',
        },
        metadata: const {'surface': 'mobile_app'},
      );
      _analytics.logger.warning('Company analytics sync failed', error, stackTrace);
    }
  }

  Future<void> refresh() => load(forceRefresh: true);
}

final companyAnalyticsRepositoryProvider = Provider<CompanyAnalyticsRepository>((ref) {
  final cache = ref.watch(offlineCacheProvider);
  return CompanyAnalyticsRepository(cache);
});

final companyAnalyticsControllerProvider =
    StateNotifierProvider<CompanyAnalyticsController, ResourceState<CompanyAnalyticsDashboard>>((ref) {
  final repository = ref.watch(companyAnalyticsRepositoryProvider);
  final analytics = ref.watch(analyticsServiceProvider);
  return CompanyAnalyticsController(repository, analytics);
});
