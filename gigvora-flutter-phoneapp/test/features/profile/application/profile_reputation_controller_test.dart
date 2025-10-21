import 'package:flutter_test/flutter_test.dart';
import 'package:gigvora_foundation/gigvora_foundation.dart';
import 'package:riverpod/riverpod.dart';

import 'package:gigvora_mobile/features/profile/application/profile_reputation_controller.dart';
import 'package:gigvora_mobile/features/profile/data/models/reputation.dart';
import 'package:gigvora_mobile/features/profile/data/reputation_repository.dart';

void main() {
  late FakeReputationRepository repository;
  late ProviderContainer container;

  setUp(() {
    repository = FakeReputationRepository();
    container = ProviderContainer(
      overrides: [
        reputationRepositoryProvider.overrideWithValue(repository),
      ],
    );
    addTearDown(container.dispose);
  });

  test('invalid profile id returns error state', () async {
    final state = container.read(profileReputationControllerProvider('abc'));

    expect(state.error, isA<ArgumentError>());
    expect(state.loading, isFalse);
  });

  test('load hydrates overview and allows refresh', () async {
    final state = container.read(profileReputationControllerProvider('42'));
    expect(state.data?.summary.totalReviews, 10);
    expect(state.fromCache, isFalse);

    await container.read(profileReputationControllerProvider('42').notifier).refresh();

    expect(repository.forceRefreshCalls, contains('42'));
  });
}

class FakeReputationRepository implements ReputationRepository {
  FakeReputationRepository();

  final List<String> forceRefreshCalls = <String>[];

  @override
  Future<RepositoryResult<ReputationOverview>> fetchOverview(
    String freelancerId, {
    bool forceRefresh = false,
  }) async {
    if (forceRefresh) {
      forceRefreshCalls.add(freelancerId);
    }
    return RepositoryResult<ReputationOverview>(
      data: ReputationOverview(
        summary: ReputationSummary(
          totalReviews: 10,
          publishedReviews: 9,
          trustScore: 4.8,
          nps: 70,
        ),
        metrics: const <ReputationMetric>[],
      ),
      fromCache: false,
      lastUpdated: DateTime(2024, 4, 3, 8),
    );
  }
}
