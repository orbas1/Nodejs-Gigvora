import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gigvora_foundation/gigvora_foundation.dart';

import '../../../core/providers.dart';
import '../data/company_ats_repository.dart';
import '../data/models/company_ats_dashboard.dart';

class CompanyAtsController extends StateNotifier<ResourceState<CompanyAtsDashboard>> {
  CompanyAtsController(this._repository, this._analytics)
      : super(ResourceState<CompanyAtsDashboard>.loading()) {
    load();
  }

  final CompanyAtsRepository _repository;
  final AnalyticsService _analytics;
  bool _initialTracked = false;

  Future<void> load({bool forceRefresh = false}) async {
    state = state.copyWith(loading: true, error: null);
    try {
      final result = await _repository.fetchDashboard(forceRefresh: forceRefresh);
      final dashboard = result.data;
      state = ResourceState<CompanyAtsDashboard>(
        data: dashboard,
        loading: false,
        error: result.error,
        fromCache: result.fromCache,
        lastUpdated: result.lastUpdated,
      );
      await _repository.persistDashboard(dashboard);

      if (!_initialTracked) {
        _initialTracked = true;
        await _analytics.track(
          'mobile_company_ats_viewed',
          context: {
            'stages': dashboard.stages.length,
            'approvals': dashboard.approvals.total,
            'campaignChannels': dashboard.campaigns.length,
            'fromCache': result.fromCache,
          },
          metadata: const {'surface': 'mobile_app'},
        );
      }

      if (result.error != null) {
        await _analytics.track(
          'mobile_company_ats_partial',
          context: {
            'reason': '${result.error}',
            'fromCache': result.fromCache,
          },
          metadata: const {'surface': 'mobile_app'},
        );
      }
    } catch (error) {
      state = state.copyWith(loading: false, error: error);
      await _analytics.track(
        'mobile_company_ats_failed',
        context: {
          'reason': '$error',
        },
        metadata: const {'surface': 'mobile_app'},
      );
    }
  }

  Future<void> refresh() => load(forceRefresh: true);
}

final companyAtsRepositoryProvider = Provider<CompanyAtsRepository>((ref) {
  final cache = ref.watch(offlineCacheProvider);
  return CompanyAtsRepository(cache);
});

final companyAtsControllerProvider =
    StateNotifierProvider<CompanyAtsController, ResourceState<CompanyAtsDashboard>>((ref) {
  final repository = ref.watch(companyAtsRepositoryProvider);
  final analytics = ref.watch(analyticsServiceProvider);
  return CompanyAtsController(repository, analytics);
});
