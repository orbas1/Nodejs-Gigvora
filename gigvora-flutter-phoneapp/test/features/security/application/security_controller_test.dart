import 'package:flutter_test/flutter_test.dart';
import 'package:gigvora_foundation/gigvora_foundation.dart';
import 'package:riverpod/riverpod.dart';

import 'package:gigvora_mobile/core/providers.dart';
import 'package:gigvora_mobile/features/security/application/security_controller.dart';
import 'package:gigvora_mobile/features/security/data/models/security_telemetry.dart';
import 'package:gigvora_mobile/features/security/data/security_repository.dart';

import '../../../support/test_analytics_service.dart';

void main() {
  late ProviderContainer container;
  late TestAnalyticsService analytics;
  late FakeSecurityRepository repository;
  late SecurityTelemetry telemetry;

  setUp(() {
    analytics = TestAnalyticsService();
    telemetry = createTelemetry();
    repository = FakeSecurityRepository(
      RepositoryResult<SecurityTelemetry>(
        data: telemetry,
        fromCache: false,
        lastUpdated: DateTime(2024, 4, 2, 14),
      ),
    );
    container = ProviderContainer(
      overrides: [
        securityRepositoryProvider.overrideWithValue(repository),
        analyticsServiceProvider.overrideWithValue(analytics),
      ],
    );
    addTearDown(container.dispose);
  });

  test('load populates telemetry and tracks analytics', () async {
    await pumpEventQueue(times: 2);
    final state = container.read(securityControllerProvider);

    expect(state.data?.metrics.blockedIntrusions, telemetry.metrics.blockedIntrusions);
    expect(state.loading, isFalse);
    expect(
      analytics.events.map((event) => event.name),
      contains('mobile_security_operations_viewed'),
    );
  });

  test('refresh requests a force refresh from repository', () async {
    await pumpEventQueue(times: 2);
    await container.read(securityControllerProvider.notifier).refresh();
    expect(repository.forceRefresh, isTrue);
  });

  test('acknowledge alert records analytics event', () async {
    await pumpEventQueue(times: 2);
    final controller = container.read(securityControllerProvider.notifier);

    await controller.acknowledgeAlert(telemetry.alerts.first);

    expect(
      analytics.events.map((event) => event.name),
      contains('mobile_security_alert_acknowledged'),
    );
  });
}

class FakeSecurityRepository implements SecurityRepository {
  FakeSecurityRepository(this.result);

  RepositoryResult<SecurityTelemetry> result;
  bool forceRefresh = false;

  @override
  Future<RepositoryResult<SecurityTelemetry>> fetchTelemetry({bool forceRefresh = false}) async {
    this.forceRefresh = forceRefresh;
    return result;
  }
}

SecurityTelemetry createTelemetry() {
  return SecurityTelemetry(
    metrics: const SecurityMetrics(
      blockedIntrusions: 4,
      quarantinedAssets: 2,
      highRiskVulnerabilities: 1,
      meanTimeToRespondMinutes: 45,
    ),
    posture: const SecurityPosture(status: 'steady', attackSurfaceScore: 82, attackSurfaceChange: -5, signals: <String>['db: OK']),
    patchWindow: SecurityPatchWindow(
      nextWindow: DateTime(2024, 4, 20, 12),
      backlog: 3,
      backlogChange: -1,
    ),
    alerts: [
      SecurityAlert(
        id: 'alert-1',
        severity: 'high',
        category: 'WAF',
        source: 'Cloudflare',
        asset: 'marketing-site',
        location: 'edge',
        detectedAt: DateTime(2024, 4, 2, 13),
        status: 'open',
        recommendedAction: 'Investigate origin IP',
      ),
    ],
    incidents: const <SecurityIncident>[],
    playbooks: const <SecurityPlaybook>[],
  );
}
