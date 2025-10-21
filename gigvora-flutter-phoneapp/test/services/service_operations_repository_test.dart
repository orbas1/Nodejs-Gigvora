import 'package:flutter_test/flutter_test.dart';
import 'package:gigvora_mobile/features/services/data/models/dispute_case.dart';
import 'package:gigvora_mobile/features/services/data/models/fulfillment_step.dart';
import 'package:gigvora_mobile/features/services/data/models/service_operations_overview.dart';
import 'package:gigvora_mobile/features/services/data/models/service_order.dart';
import 'package:gigvora_mobile/features/services/data/models/service_zone.dart';
import 'package:gigvora_mobile/features/services/data/service_operations_repository.dart';

import '../helpers/in_memory_offline_cache.dart';

class _FailingWriteCache extends InMemoryOfflineCache {
  _FailingWriteCache();

  bool shouldFail = false;

  @override
  Future<void> write(String key, dynamic value, {Duration? ttl}) {
    if (shouldFail) {
      throw Exception('write disabled');
    }
    return super.write(key, value, ttl: ttl);
  }
}

ServiceOperationsOverview _buildOverview() {
  final zone = ServiceZone(
    id: 'zone-1',
    name: 'North Hub',
    region: 'North America',
    coveragePercentage: 92,
    availableServices: const ['Logistics', 'Onboarding'],
    connectedProviders: const ['ops-team'],
    lastSynced: DateTime(2024, 1, 1, 9),
    slaCommitment: '99.9%',
    escalationContact: 'ops@gigvora.com',
  );
  final order = ServiceOrderSummary(
    id: 'order-1',
    serviceName: 'Executive Onboarding',
    customer: 'Acme Corp',
    zoneId: 'zone-1',
    zoneName: 'North Hub',
    status: ServiceOrderStatus.inProgress,
    stage: ServiceOrderStage.dispatch,
    progress: 0.65,
    eta: DateTime(2024, 1, 3, 10),
    updatedAt: DateTime(2024, 1, 2, 14),
    orderValue: 12000,
    currencyCode: 'USD',
    requirementsOutstanding: 2,
  );
  final pipeline = FulfillmentPipeline(
    orderId: 'order-1',
    orderTitle: 'Executive Onboarding',
    zoneName: 'North Hub',
    steps: const [
      FulfillmentStep(
        id: 'step-1',
        label: 'Requirement intake',
        description: 'Collect kickoff documents',
        status: FulfillmentStepStatus.completed,
        completedAt: DateTime(2024, 1, 2, 8),
      ),
      FulfillmentStep(
        id: 'step-2',
        label: 'Assign crew',
        description: 'Assign onboarding specialists',
        status: FulfillmentStepStatus.active,
      ),
    ],
  );
  final dispute = DisputeCase(
    id: 'dispute-1',
    orderId: 'order-1',
    reason: 'Schedule slip',
    stage: DisputeStage.investigation,
    priority: DisputePriority.high,
    status: DisputeStatus.actionRequired,
    openedAt: DateTime(2024, 1, 2, 12),
    updatedAt: DateTime(2024, 1, 2, 15),
    amount: 450,
    currencyCode: 'USD',
    customer: 'Acme Corp',
  );

  return ServiceOperationsOverview(
    metrics: const ServiceOperationsMetrics(
      activeZones: 4,
      connectedProviders: 28,
      ordersInProgress: 16,
      ordersAtRisk: 3,
      disputesOpen: 2,
      slaBreachesLastWeek: 1,
    ),
    zones: [zone],
    orders: [order],
    pipelines: [pipeline],
    disputes: [dispute],
  );
}

void main() {
  group('ServiceOperationsRepository', () {
    test('returns cached overview when available', () async {
      final cache = InMemoryOfflineCache();
      final repository = ServiceOperationsRepository(cache);
      final overview = _buildOverview();
      await cache.write('service_operations:overview', overview.toJson());

      final result = await repository.fetchOverview();

      expect(result.fromCache, isTrue);
      expect(result.data.metrics.activeZones, equals(4));
      expect(result.data.zones.single.name, equals('North Hub'));
      expect(result.lastUpdated, isNotNull);
    });

    test('hydrates from seed data and caches result on miss', () async {
      final cache = InMemoryOfflineCache();
      final repository = ServiceOperationsRepository(cache);

      final first = await repository.fetchOverview(forceRefresh: true);
      expect(first.fromCache, isFalse);
      expect(first.data.isEmpty, isFalse);

      final cached = await repository.fetchOverview();
      expect(cached.fromCache, isTrue);
      expect(cached.data.zones, isNotEmpty);
    });

    test('uses cached data when persistence fails during refresh', () async {
      final cache = _FailingWriteCache();
      final repository = ServiceOperationsRepository(cache);
      await cache.write('service_operations:overview', _buildOverview().toJson());
      cache.shouldFail = true;

      final result = await repository.fetchOverview(forceRefresh: true);

      expect(result.fromCache, isTrue);
      expect(result.error, isNotNull);
      expect(result.data.orders.single.id, equals('order-1'));
    });
  });
}
