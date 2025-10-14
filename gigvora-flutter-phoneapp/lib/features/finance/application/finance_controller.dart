import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gigvora_foundation/gigvora_foundation.dart';

import '../../../core/providers.dart';
import '../../services/data/models/dispute_case.dart';
import '../data/finance_repository.dart';
import '../data/models/finance_overview.dart';

class FinanceController extends StateNotifier<ResourceState<FinanceOverview>> {
  FinanceController(this._repository, this._analytics)
      : super(ResourceState<FinanceOverview>.loading()) {
    load();
  }

  final FinanceRepository _repository;
  final AnalyticsService _analytics;
  bool _viewTracked = false;

  Future<void> load({bool forceRefresh = false}) async {
    state = state.copyWith(loading: true, error: null);
    try {
      final result = await _repository.fetchOverview(forceRefresh: forceRefresh);
      state = ResourceState<FinanceOverview>(
        data: result.data,
        loading: false,
        error: result.error,
        fromCache: result.fromCache,
        lastUpdated: result.lastUpdated,
      );

      if (!_viewTracked && !result.data.isEmpty) {
        _viewTracked = true;
        await _analytics.track(
          'mobile_finance_control_tower_viewed',
          context: {
            'accounts': result.data.accounts.length,
            'releases': result.data.releases.length,
            'disputes': result.data.disputes.length,
            'tasks': result.data.complianceTasks.length,
            'fromCache': result.fromCache,
          },
          metadata: const {'source': 'mobile_app'},
        );
      }

      if (result.error != null) {
        await _analytics.track(
          'mobile_finance_control_tower_partial',
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
        'mobile_finance_control_tower_failed',
        context: {
          'reason': '$error',
        },
        metadata: const {'source': 'mobile_app'},
      );
    }
  }

  Future<void> refresh() => load(forceRefresh: true);

  Future<void> recordReleaseAction(FinanceRelease release, {required String action}) {
    return _analytics.track(
      'mobile_finance_release_action',
      context: {
        'releaseId': release.id,
        'reference': release.reference,
        'vendor': release.vendor,
        'automation': release.automation,
        'risk': release.risk,
        'action': action,
      },
      metadata: const {'source': 'mobile_app'},
    );
  }

  Future<void> recordDisputeAction(DisputeCase dispute, {required String action}) {
    return _analytics.track(
      'mobile_finance_dispute_action',
      context: {
        'disputeId': dispute.id,
        'orderId': dispute.orderId,
        'stage': dispute.stage.name,
        'priority': dispute.priority.name,
        'action': action,
      },
      metadata: const {'source': 'mobile_app'},
    );
  }

  Future<void> recordTaskAction(FinanceComplianceTask task, {required String action}) {
    return _analytics.track(
      'mobile_finance_task_action',
      context: {
        'taskId': task.id,
        'severity': task.severity,
        'status': task.status,
        'action': action,
      },
      metadata: const {'source': 'mobile_app'},
    );
  }
}

final financeRepositoryProvider = Provider<FinanceRepository>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  final cache = ref.watch(offlineCacheProvider);
  return FinanceRepository(apiClient, cache);
});

final financeControllerProvider =
    StateNotifierProvider<FinanceController, ResourceState<FinanceOverview>>((ref) {
  final repository = ref.watch(financeRepositoryProvider);
  final analytics = ref.watch(analyticsServiceProvider);
  return FinanceController(repository, analytics);
});
