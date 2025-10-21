import 'package:flutter_test/flutter_test.dart';
import 'package:gigvora_foundation/gigvora_foundation.dart';
import 'package:gigvora_mobile/features/services/application/service_operations_controller.dart';
import 'package:gigvora_mobile/features/services/data/models/dispute_case.dart';
import 'package:gigvora_mobile/features/services/data/models/fulfillment_step.dart';
import 'package:gigvora_mobile/features/services/data/models/service_operations_overview.dart';
import 'package:gigvora_mobile/features/services/data/models/service_order.dart';
import 'package:gigvora_mobile/features/services/data/models/service_zone.dart';
import 'package:gigvora_mobile/features/services/data/service_operations_repository.dart';

import '../helpers/in_memory_offline_cache.dart';
import '../support/test_analytics_service.dart';

typedef _FetchCallback = Future<RepositoryResult<ServiceOperationsOverview>> Function(bool forceRefresh);

class _StubServiceOperationsRepository extends ServiceOperationsRepository {
  _StubServiceOperationsRepository(this._onFetch) : super(InMemoryOfflineCache());

  final _FetchCallback _onFetch;
  bool? lastForceRefresh;
  int callCount = 0;

  @override
  Future<RepositoryResult<ServiceOperationsOverview>> fetchOverview({bool forceRefresh = false}) {
    callCount += 1;
    lastForceRefresh = forceRefresh;
    return _onFetch(forceRefresh);
  }
}

ServiceOperationsOverview _buildOverview() {
  final now = DateTime(2024, 1, 3, 12);
  return ServiceOperationsOverview(
    metrics: const ServiceOperationsMetrics(
      activeZones: 5,
      connectedProviders: 40,
      ordersInProgress: 18,
      ordersAtRisk: 2,
      disputesOpen: 1,
      slaBreachesLastWeek: 0,
    ),
    zones: [
      ServiceZone(
        id: 'zone-nyc',
        name: 'NYC Delivery',
        region: 'US-East',
        coveragePercentage: 88,
        availableServices: const ['Logistics'],
        connectedProviders: const ['provider-1'],
        lastSynced: now.subtract(const Duration(hours: 1)),
      ),
    ],
    orders: [
      ServiceOrderSummary(
        id: 'order-42',
        serviceName: 'Pop-up activation',
        customer: 'Bright Labs',
        zoneId: 'zone-nyc',
        zoneName: 'NYC Delivery',
        status: ServiceOrderStatus.inProgress,
        stage: ServiceOrderStage.inDelivery,
        progress: 0.5,
        updatedAt: now,
      ),
    ],
    pipelines: [
      FulfillmentPipeline(
        orderId: 'order-42',
        orderTitle: 'Pop-up activation',
        zoneName: 'NYC Delivery',
        steps: const [
          FulfillmentStep(
            id: 'step-1',
            label: 'Prep inventory',
            description: 'Staging inventory in warehouse',
            status: FulfillmentStepStatus.completed,
          ),
          FulfillmentStep(
            id: 'step-2',
            label: 'Dispatch crew',
            description: 'Assign on-site team',
            status: FulfillmentStepStatus.active,
          ),
        ],
      ),
    ],
    disputes: [
      DisputeCase(
        id: 'dispute-9',
        orderId: 'order-42',
        reason: 'Damaged equipment',
        stage: DisputeStage.investigation,
        priority: DisputePriority.medium,
        status: DisputeStatus.open,
        openedAt: now.subtract(const Duration(hours: 6)),
        updatedAt: now,
      ),
    ],
  );
}

void main() {
  group('ServiceOperationsController', () {
    test('load stores overview data and tracks analytics once', () async {
      final overview = _buildOverview();
      final repository = _StubServiceOperationsRepository((_) async {
        return RepositoryResult(
          data: overview,
          fromCache: false,
          lastUpdated: DateTime(2024, 1, 3, 12),
        );
      });
      final analytics = TestAnalyticsService();

      final controller = ServiceOperationsController(repository, analytics);
      await controller.load(forceRefresh: true);

      expect(controller.state.data?.zones.single.name, equals('NYC Delivery'));
      expect(controller.state.loading, isFalse);
      expect(
        analytics.events.where((event) => event.name == 'mobile_service_operations_viewed'),
        hasLength(1),
      );
    });

    test('refresh bypasses cache and keeps state hydrated', () async {
      final repository = _StubServiceOperationsRepository((forceRefresh) async {
        return RepositoryResult(
          data: _buildOverview(),
          fromCache: forceRefresh,
          lastUpdated: DateTime(2024, 1, 3, 12),
        );
      });
      final analytics = TestAnalyticsService();
      final controller = ServiceOperationsController(repository, analytics);

      await controller.refresh();

      expect(repository.lastForceRefresh, isTrue);
      expect(controller.state.data, isNotNull);
    });

    test('records partial telemetry analytics when repository reports an error', () async {
      final repository = _StubServiceOperationsRepository((_) async {
        return RepositoryResult(
          data: _buildOverview(),
          fromCache: true,
          lastUpdated: DateTime(2024, 1, 3, 10),
          error: Exception('cache fallback'),
        );
      });
      final analytics = TestAnalyticsService();
      final controller = ServiceOperationsController(repository, analytics);

      await controller.load(forceRefresh: true);

      expect(controller.state.error, isNotNull);
      expect(
        analytics.events.last.name,
        equals('mobile_service_operations_partial'),
      );
    });

    test('recordDisputeAction forwards metadata to analytics', () async {
      final repository = _StubServiceOperationsRepository((_) async {
        return RepositoryResult(
          data: _buildOverview(),
          fromCache: false,
          lastUpdated: DateTime(2024, 1, 3, 12),
        );
      });
      final analytics = TestAnalyticsService();
      final controller = ServiceOperationsController(repository, analytics);
      final dispute = _buildOverview().disputes.single;

      await controller.recordDisputeAction(dispute, action: 'escalate');

      expect(analytics.events.last.name, equals('mobile_dispute_action'));
      expect(analytics.events.last.context['action'], equals('escalate'));
    });
  });
}
