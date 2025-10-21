import 'package:flutter_test/flutter_test.dart';
import 'package:gigvora_foundation/gigvora_foundation.dart';
import 'package:gigvora_mobile/features/security/data/models/security_telemetry.dart';
import 'package:gigvora_mobile/features/security/data/security_repository.dart';

import '../helpers/in_memory_offline_cache.dart';
import '../support/test_api_client.dart';

void main() {
  group('SecurityRepository', () {
    test('returns cached telemetry when available and not forcing refresh', () async {
      final cache = InMemoryOfflineCache();
      final apiClient = TestApiClient(onGet: (_) async => const <String, dynamic>{});
      final repository = SecurityRepository(cache, apiClient, clock: () => DateTime.utc(2024, 1, 1));

      final cachedTelemetry = SecurityTelemetry(
        metrics: const SecurityMetrics(
          blockedIntrusions: 5,
          quarantinedAssets: 2,
          highRiskVulnerabilities: 1,
          meanTimeToRespondMinutes: 18,
        ),
        posture: const SecurityPosture(
          status: 'steady',
          attackSurfaceScore: 90,
          attackSurfaceChange: -2,
          signals: ['database: DEGRADED'],
        ),
        patchWindow: const SecurityPatchWindow(),
        alerts: const [],
        incidents: const [],
        playbooks: const [],
      );

      await cache.write('security:telemetry', cachedTelemetry.toJson());

      final result = await repository.fetchTelemetry();

      expect(result.fromCache, isTrue);
      expect(result.data.metrics.blockedIntrusions, equals(5));
      expect(result.data.metrics.quarantinedAssets, equals(2));
      expect(result.lastUpdated, isNotNull);
    });

    test('hydrates telemetry from readiness and maintenance feeds', () async {
      final readiness = {
        'status': 'degraded',
        'dependencies': {
          'database': {'status': 'degraded'},
          'search': {'status': 'ok'},
        },
      };
      final now = DateTime.utc(2024, 1, 12, 8, 30);
      final maintenance = {
        'announcements': [
          {
            'slug': 'security-incident-1',
            'title': 'Edge WAF block',
            'message': 'Blocked suspicious traffic',
            'severity': 'security',
            'status': 'active',
            'audiences': ['customers'],
            'channels': ['edge'],
            'metadata': {'action': 'Review firewall rules'},
            'startsAt': now.subtract(const Duration(minutes: 30)).toIso8601String(),
          },
          {
            'slug': 'maintenance-window',
            'title': 'Quarterly patching',
            'message': 'Applying OS hardening patches',
            'severity': 'maintenance',
            'status': 'scheduled',
            'audiences': ['internal'],
            'channels': ['control'],
            'metadata': const <String, dynamic>{},
            'startsAt': now.add(const Duration(hours: 2)).toIso8601String(),
          },
          {
            'slug': 'resolved-incident',
            'title': 'API latency incident',
            'message': 'Latencies stabilised after database failover.',
            'severity': 'incident',
            'status': 'resolved',
            'audiences': ['customers'],
            'channels': ['status'],
            'metadata': const <String, dynamic>{},
            'startsAt': now.subtract(const Duration(hours: 3)).toIso8601String(),
            'endsAt': now.subtract(const Duration(hours: 2)).toIso8601String(),
          },
        ],
      };

      final cache = InMemoryOfflineCache();
      final apiClient = TestApiClient(onGet: (path) async {
        if (path == '/health/ready') {
          return readiness;
        }
        if (path == '/runtime/maintenance') {
          return maintenance;
        }
        fail('Unexpected GET path: $path');
      });
      final repository = SecurityRepository(cache, apiClient, clock: () => now);

      final result = await repository.fetchTelemetry(forceRefresh: true);

      expect(result.fromCache, isFalse);
      expect(result.data.metrics.blockedIntrusions, equals(1));
      expect(result.data.metrics.quarantinedAssets, equals(1));
      expect(result.data.metrics.highRiskVulnerabilities, equals(1));
      expect(result.data.metrics.meanTimeToRespondMinutes, equals(60));
      expect(result.data.posture.status, equals('attention'));
      expect(result.data.posture.attackSurfaceScore, equals(88));
      expect(result.data.posture.signals, contains('database: DEGRADED'));
      expect(result.data.patchWindow.nextWindow, equals(now.add(const Duration(hours: 2))));
      expect(result.data.alerts, hasLength(3));
      expect(result.data.incidents, hasLength(2));
      expect(result.data.playbooks.map((playbook) => playbook.id), contains('playbook-security'));
    });

    test('falls back to cached telemetry when the API errors', () async {
      final cache = InMemoryOfflineCache();
      final telemetry = SecurityTelemetry(
        metrics: const SecurityMetrics(blockedIntrusions: 2),
        posture: const SecurityPosture(status: 'steady'),
        patchWindow: const SecurityPatchWindow(),
        alerts: const [],
        incidents: const [],
        playbooks: const [],
      );
      await cache.write('security:telemetry', telemetry.toJson());

      final apiClient = TestApiClient(onGet: (path) async {
        throw Exception('network unavailable for $path');
      });
      final repository = SecurityRepository(cache, apiClient, clock: () => DateTime.utc(2024, 1, 1));

      final result = await repository.fetchTelemetry(forceRefresh: true);

      expect(result.fromCache, isTrue);
      expect(result.error, isNotNull);
      expect(result.data.metrics.blockedIntrusions, equals(2));
    });
  });
}
