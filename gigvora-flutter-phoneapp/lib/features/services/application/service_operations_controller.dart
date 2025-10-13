import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gigvora_foundation/gigvora_foundation.dart';

import '../../../core/providers.dart';
import '../data/models/dispute_case.dart';
import '../data/models/fulfillment_step.dart';
import '../data/models/service_operations_overview.dart';
import '../data/models/service_order.dart';
import '../data/models/service_zone.dart';
import '../data/service_operations_repository.dart';

class ServiceOperationsController extends StateNotifier<ResourceState<ServiceOperationsOverview>> {
  ServiceOperationsController(this._repository, this._analytics)
      : super(ResourceState<ServiceOperationsOverview>.loading()) {
    load();
  }

  final ServiceOperationsRepository _repository;
  final AnalyticsService _analytics;
  bool _viewTracked = false;

  Future<void> load({bool forceRefresh = false}) async {
    state = state.copyWith(loading: true, error: null);
    try {
      final result = await _repository.fetchOverview(forceRefresh: forceRefresh);
      state = ResourceState<ServiceOperationsOverview>(
        data: result.data,
        loading: false,
        error: result.error,
        fromCache: result.fromCache,
        lastUpdated: result.lastUpdated,
      );

      if (!_viewTracked && !result.data.isEmpty) {
        _viewTracked = true;
        await _analytics.track(
          'mobile_service_operations_viewed',
          context: {
            'zones': result.data.zones.length,
            'orders': result.data.orders.length,
            'pipelines': result.data.pipelines.length,
            'disputes': result.data.disputes.length,
            'fromCache': result.fromCache,
          },
          metadata: const {'source': 'mobile_app'},
        );
      }

      if (result.error != null) {
        await _analytics.track(
          'mobile_service_operations_partial',
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
        'mobile_service_operations_failed',
        context: {
          'reason': '$error',
        },
        metadata: const {'source': 'mobile_app'},
      );
    }
  }

  Future<void> refresh() => load(forceRefresh: true);

  Future<void> recordZoneConnect(ServiceZone zone) {
    return _analytics.track(
      'mobile_service_zone_connect',
      context: {
        'zoneId': zone.id,
        'zoneName': zone.name,
        'providerCount': zone.connectedProviders.length,
      },
      metadata: const {'source': 'mobile_app'},
    );
  }

  Future<void> recordOrderAction(ServiceOrderSummary order, {required String action}) {
    return _analytics.track(
      'mobile_service_order_action',
      context: {
        'orderId': order.id,
        'action': action,
        'status': order.status.name,
        'stage': order.stage.name,
      },
      metadata: const {'source': 'mobile_app'},
    );
  }

  Future<void> recordDisputeAction(DisputeCase dispute, {required String action}) {
    return _analytics.track(
      'mobile_dispute_action',
      context: {
        'disputeId': dispute.id,
        'orderId': dispute.orderId,
        'action': action,
        'priority': dispute.priority.name,
        'stage': dispute.stage.name,
      },
      metadata: const {'source': 'mobile_app'},
    );
  }

  Future<void> recordPipelineFollowUp(FulfillmentPipeline pipeline, FulfillmentStep step, {String? action}) {
    return _analytics.track(
      'mobile_fulfillment_follow_up',
      context: {
        'orderId': pipeline.orderId,
        'orderTitle': pipeline.orderTitle,
        'zoneName': pipeline.zoneName,
        'stepId': step.id,
        'stepLabel': step.label,
        'status': step.status.name,
        'action': action ?? 'follow_up',
      },
      metadata: const {'source': 'mobile_app'},
    );
  }
}

final serviceOperationsRepositoryProvider = Provider<ServiceOperationsRepository>((ref) {
  final cache = ref.watch(offlineCacheProvider);
  return ServiceOperationsRepository(cache);
});

final serviceOperationsControllerProvider =
    StateNotifierProvider<ServiceOperationsController, ResourceState<ServiceOperationsOverview>>((ref) {
  final repository = ref.watch(serviceOperationsRepositoryProvider);
  final analytics = ref.watch(analyticsServiceProvider);
  return ServiceOperationsController(repository, analytics);
});
