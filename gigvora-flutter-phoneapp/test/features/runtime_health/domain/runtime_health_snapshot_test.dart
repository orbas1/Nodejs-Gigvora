import 'package:flutter_test/flutter_test.dart';

import 'package:gigvora_mobile/features/runtime_health/domain/runtime_health_snapshot.dart';

void main() {
  test('parses nested auto block and metrics metadata correctly', () {
    final snapshot = RuntimeHealthSnapshot.fromJson(
      {
        'status': 'ok',
        'httpStatus': 200,
        'timestamp': '2024-04-12T10:00:00.000Z',
        'dependencies': {'database': {'status': 'ok'}},
      },
      maintenance: {'supportContact': 'status@gigvora.com'},
      perimeter: {'totalBlocked': 5},
      waf: {
        'blockedRequests': 3,
        'evaluatedRequests': 42,
        'lastBlockedAt': '2024-04-12T09:45:00.000Z',
        'autoBlock': {
          'enabled': true,
          'threshold': 3,
          'windowSeconds': 300,
          'ttlSeconds': 600,
          'totalTriggered': 2,
          'active': [
            {
              'ip': '203.0.113.12',
              'blockedAt': '2024-04-12T09:30:00.000Z',
              'expiresAt': '2024-04-12T09:40:00.000Z',
              'hits': 12,
            },
          ],
        },
      },
      metrics: {
        'exporter': 'prometheus',
        'endpoint': '/metrics',
        'scrapes': 4,
        'stale': false,
        'rateLimit': {
          'hits': 1400,
          'allowed': 1500,
          'blocked': 5,
        },
        'waf': {'blockedRequests': 3},
        'perimeter': {'totalBlocked': 5},
        'database': {'vendor': 'mysql', 'size': 15, 'available': 12, 'borrowed': 2, 'pending': 1},
      },
    );

    expect(snapshot.healthy, isTrue);
    expect(snapshot.wafAutoBlock?.enabled, isTrue);
    expect(snapshot.wafAutoBlock?.active.first.ip, '203.0.113.12');
    expect(snapshot.metrics?.rateLimit?.hits, 1400);
    expect(snapshot.metrics?.database?.vendor, 'mysql');
    expect(snapshot.metricsStale, isFalse);
  });
}
