import 'package:flutter_test/flutter_test.dart';
import 'package:gigvora_foundation/gigvora_foundation.dart';

import 'package:gigvora_mobile/features/runtime_health/data/runtime_health_repository.dart';

import '../../../support/test_api_client.dart';

void main() {
  test('fetch returns readiness snapshot for unauthenticated polling', () async {
    final repository = RuntimeHealthRepository(
      TestApiClient(onGet: (path) async {
        expect(path, '/health/ready');
        return {
          'status': 'ok',
          'httpStatus': 200,
          'timestamp': '2024-04-11T10:00:00.000Z',
          'dependencies': {
            'database': {'status': 'ok'},
          },
        };
      }),
    );

    final snapshot = await repository.fetch(authenticated: false);

    expect(snapshot.status, 'ok');
    expect(snapshot.httpStatus, 200);
    expect(snapshot.healthy, isTrue);
    expect(snapshot.dependencies['database'], isNotNull);
    expect(snapshot.supportContact, isNull);
    expect(snapshot.totalPerimeterBlocks, 0);
  });

  test('falls back to public readiness when admin endpoint returns 401', () async {
    var callCount = 0;
    final repository = RuntimeHealthRepository(
      TestApiClient(onGet: (path) async {
        callCount += 1;
        if (path == '/api/admin/runtime/health') {
          throw ApiException(401, 'Unauthorized');
        }
        expect(path, '/health/ready');
        return {
          'status': 'ready',
          'httpStatus': 200,
          'timestamp': '2024-04-11T10:05:00.000Z',
          'dependencies': const <String, dynamic>{},
        };
      }),
    );

    final snapshot = await repository.fetch(authenticated: true);

    expect(callCount, 2);
    expect(snapshot.status, 'ready');
    expect(snapshot.healthy, isTrue);
  });

  test('parses nested readiness payloads from the admin endpoint', () async {
    final repository = RuntimeHealthRepository(
      TestApiClient(onGet: (path) async {
        expect(path, '/api/admin/runtime/health');
        return {
          'readiness': {
            'status': 'ok',
            'httpStatus': 200,
            'timestamp': '2024-04-11T11:00:00.000Z',
            'dependencies': {
              'database': {'status': 'ok'},
              'paymentsCore': {'status': 'degraded'},
            },
          },
          'maintenance': {
            'supportContact': 'status@gigvora.com',
          },
          'perimeter': {
            'totalBlocked': 4,
          },
        };
      }),
    );

    final snapshot = await repository.fetch(authenticated: true);

    expect(snapshot.status, 'ok');
    expect(snapshot.dependencies['paymentsCore'], isNotNull);
    expect(snapshot.dependencies['paymentsCore']['status'], 'degraded');
    expect(snapshot.supportContact, 'status@gigvora.com');
    expect(snapshot.totalPerimeterBlocks, 4);
  });
}
