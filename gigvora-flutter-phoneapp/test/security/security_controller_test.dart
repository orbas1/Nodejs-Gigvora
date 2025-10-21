import 'package:flutter_test/flutter_test.dart';
import 'package:gigvora_foundation/gigvora_foundation.dart';
import 'package:gigvora_mobile/features/security/application/security_controller.dart';
import 'package:gigvora_mobile/features/security/data/models/security_telemetry.dart';
import 'package:gigvora_mobile/features/security/data/security_repository.dart';

import '../helpers/in_memory_offline_cache.dart';
import '../support/test_analytics_service.dart';
import '../support/test_api_client.dart';

typedef _FetchCallback = Future<RepositoryResult<SecurityTelemetry>> Function(bool forceRefresh);

class _StubSecurityRepository extends SecurityRepository {
  _StubSecurityRepository(this._onFetch)
      : super(InMemoryOfflineCache(), TestApiClient(onGet: (_) async => const <String, dynamic>{}));

  final _FetchCallback _onFetch;
  bool? lastForceRefresh;
  int callCount = 0;

  @override
  Future<RepositoryResult<SecurityTelemetry>> fetchTelemetry({bool forceRefresh = false}) {
    callCount += 1;
    lastForceRefresh = forceRefresh;
    return _onFetch(forceRefresh);
  }
}

SecurityTelemetry _buildTelemetry() {
  return SecurityTelemetry(
    metrics: const SecurityMetrics(blockedIntrusions: 4, quarantinedAssets: 1),
    posture: const SecurityPosture(status: 'steady', signals: ['database: DEGRADED']),
    patchWindow: const SecurityPatchWindow(),
    alerts: const [
      SecurityAlert(
        id: 'alert-1',
        severity: 'security',
        category: 'Security',
        source: 'runtime',
        asset: 'edge',
        location: 'global',
        detectedAt: DateTime(2024, 1, 1),
        status: 'active',
        recommendedAction: 'Review firewall rules',
      ),
    ],
    incidents: const [
      SecurityIncident(
        id: 'incident-1',
        title: 'API latency incident',
        severity: 'security',
        owner: 'Security operations',
        openedAt: DateTime(2024, 1, 1),
        status: 'active',
        summary: 'Investigating upstream outage.',
      ),
    ],
    playbooks: const [
      SecurityPlaybook(
        id: 'playbook-incident',
        name: 'Incident response runbook',
        owner: 'Security operations',
        runCount: 3,
        lastExecutedAt: DateTime(2024, 1, 1),
      ),
    ],
  );
}

void main() {
  group('SecurityController', () {
    test('load stores telemetry and tracks first view event', () async {
      final telemetry = _buildTelemetry();
      final repository = _StubSecurityRepository((_) async {
        return RepositoryResult(
          data: telemetry,
          fromCache: false,
          lastUpdated: DateTime(2024, 1, 1, 12),
        );
      });
      final analytics = TestAnalyticsService();

      final controller = SecurityController(repository, analytics);
      await controller.load(forceRefresh: true);

      expect(controller.state.data?.alerts, isNotEmpty);
      expect(controller.state.loading, isFalse);
      expect(repository.callCount, greaterThanOrEqualTo(1));
      expect(
        analytics.events.where((event) => event.name == 'mobile_security_operations_viewed'),
        hasLength(1),
      );
    });

    test('refresh forces a cache bypass', () async {
      final repository = _StubSecurityRepository((forceRefresh) async {
        return RepositoryResult(
          data: _buildTelemetry(),
          fromCache: forceRefresh,
          lastUpdated: DateTime(2024, 1, 1, 12),
        );
      });
      final analytics = TestAnalyticsService();
      final controller = SecurityController(repository, analytics);

      await controller.refresh();

      expect(repository.lastForceRefresh, isTrue);
      expect(controller.state.data, isNotNull);
    });

    test('captures errors from repository and records failure analytics', () async {
      final repository = _StubSecurityRepository((_) async {
        throw Exception('maintenance API unavailable');
      });
      final analytics = TestAnalyticsService();
      final controller = SecurityController(repository, analytics);

      await controller.load(forceRefresh: true);

      expect(controller.state.error, isNotNull);
      expect(
        analytics.events.last.name,
        equals('mobile_security_operations_failed'),
      );
    });
  });
}
