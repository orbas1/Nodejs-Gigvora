import 'package:flutter_test/flutter_test.dart';
import 'package:gigvora_foundation/gigvora_foundation.dart';
import 'package:riverpod/riverpod.dart';

import 'package:gigvora_mobile/features/runtime_health/application/runtime_health_provider.dart';
import 'package:gigvora_mobile/features/runtime_health/data/runtime_health_repository.dart';
import 'package:gigvora_mobile/features/runtime_health/domain/runtime_health_snapshot.dart';

class FakeRuntimeHealthRepository implements RuntimeHealthRepository {
  FakeRuntimeHealthRepository(this.snapshots, {this.throwOnFetch = false}) : _index = 0;

  final List<RuntimeHealthSnapshot> snapshots;
  final bool throwOnFetch;
  int _index;

  @override
  Future<RuntimeHealthSnapshot> fetch({bool authenticated = true}) async {
    if (throwOnFetch) {
      throw StateError('fetch failed');
    }
    final snapshot = snapshots[_index % snapshots.length];
    _index += 1;
    return snapshot;
  }
}

void main() {
  test('emits health snapshots from repository', () async {
    final repository = FakeRuntimeHealthRepository([
      RuntimeHealthSnapshot.fromJson({
        'status': 'ok',
        'httpStatus': 200,
        'timestamp': '2024-04-12T10:00:00.000Z',
        'dependencies': const <String, dynamic>{},
      }),
    ]);

    final container = ProviderContainer(
      overrides: [runtimeHealthRepositoryProvider.overrideWithValue(repository)],
    );
    addTearDown(container.dispose);

    final snapshot = await container.read(runtimeHealthStreamProvider.future);
    expect(snapshot.status, 'ok');
    expect(snapshot.httpStatus, 200);
  });

  test('bubbles initial fetch error to listeners', () async {
    final container = ProviderContainer(
      overrides: [
        runtimeHealthRepositoryProvider.overrideWithValue(
          FakeRuntimeHealthRepository(const <RuntimeHealthSnapshot>[], throwOnFetch: true),
        ),
      ],
    );
    addTearDown(container.dispose);

    expect(
      container.read(runtimeHealthStreamProvider.future),
      throwsA(isA<StateError>()),
    );
  });
}
