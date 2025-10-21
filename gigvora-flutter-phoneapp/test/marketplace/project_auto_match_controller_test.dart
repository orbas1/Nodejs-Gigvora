import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gigvora_foundation/gigvora_foundation.dart';

import 'package:gigvora_mobile/features/marketplace/application/project_auto_match_controller.dart';
import 'package:gigvora_mobile/features/marketplace/data/project_auto_match_repository.dart';

import '../helpers/noop_api_client.dart';

void main() {
  group('ProjectAutoMatchController', () {
    late _StubProjectAutoMatchRepository repository;

    ProviderContainer createContainer() {
      repository = _StubProjectAutoMatchRepository();
      final container = ProviderContainer(
        overrides: [
          projectAutoMatchRepositoryProvider.overrideWithValue(repository),
        ],
      );
      addTearDown(container.dispose);
      return container;
    }

    test('load fetches snapshot and clears previous errors', () async {
      final container = createContainer();
      final controller = container.read(projectAutoMatchControllerProvider(42).notifier);

      await controller.load(42);

      final state = container.read(projectAutoMatchControllerProvider(42));
      expect(state.loading, isFalse);
      expect(state.error, isNull);
      expect(state.snapshot?.project.id, 42);
      expect(state.snapshot?.entries, isEmpty);
    });

    test('load captures ApiException message', () async {
      final container = createContainer();
      final controller = container.read(projectAutoMatchControllerProvider(42).notifier);
      repository.throwOnFetch = true;

      await controller.load(42);

      final state = container.read(projectAutoMatchControllerProvider(42));
      expect(state.loading, isFalse);
      expect(state.snapshot, isNull);
      expect(state.error, 'server exploded');
    });

    test('refresh updates snapshot without toggling loading flag', () async {
      final container = createContainer();
      final controller = container.read(projectAutoMatchControllerProvider(99).notifier);
      await controller.load(99);

      repository.snapshot = ProjectAutoMatchSnapshot(
        project: const ProjectAutoMatchProject(
          id: 99,
          title: 'Revamp analytics',
          description: 'Expand experimentation command centre',
          status: 'active',
          budgetAmount: 48000,
          budgetCurrency: 'USD',
          autoAssignStatus: 'enabled',
        ),
        entries: const <ProjectAutoMatchEntry>[],
        retrievedAt: DateTime(2024, 4, 2, 9),
      );

      await controller.refresh(99);

      final state = container.read(projectAutoMatchControllerProvider(99));
      expect(state.loading, isFalse);
      expect(state.snapshot?.project.title, 'Revamp analytics');
    });

    test('configuration mutators update config and weights in state', () async {
      final container = createContainer();
      final controller = container.read(projectAutoMatchControllerProvider(1).notifier);

      controller
        ..updateLimit(12)
        ..updateExpires(90)
        ..updateProjectValue(12500)
        ..updateFairnessCap(4)
        ..toggleEnsureNewcomer(false)
        ..updateWeight('recency', 32);

      final state = container.read(projectAutoMatchControllerProvider(1));
      expect(state.config.limit, 12);
      expect(state.config.expiresInMinutes, 90);
      expect(state.config.projectValue, 12500);
      expect(state.config.fairnessMaxAssignments, 4);
      expect(state.config.ensureNewcomer, isFalse);
      expect(state.weights['recency'], 32);

      controller.updateProjectValue(null);
      final withNullValue = container.read(projectAutoMatchControllerProvider(1));
      expect(withNullValue.config.projectValue, isNull);
    });

    test('regenerate sends normalized weights and refreshes snapshot', () async {
      final container = createContainer();
      final controller = container.read(projectAutoMatchControllerProvider(55).notifier);
      await controller.load(55);

      // Force zeroed weights to exercise equal distribution branch.
      final initialState = container.read(projectAutoMatchControllerProvider(55));
      final keys = initialState.weights.keys.toList(growable: false);
      for (final key in keys) {
        controller.updateWeight(key, 0);
      }

      repository.snapshot = ProjectAutoMatchSnapshot(
        project: repository.snapshot.project,
        entries: const <ProjectAutoMatchEntry>[],
        retrievedAt: DateTime(2024, 6, 12, 15),
      );

      await controller.regenerate(55);

      final command = repository.lastCommand;
      expect(command, isNotNull);
      final updatedState = container.read(projectAutoMatchControllerProvider(55));
      expect(command!.limit, updatedState.config.limit);
      expect(command.ensureNewcomer, updatedState.config.ensureNewcomer);
      final weightValues = command.weights.values.toList();
      expect(weightValues, isNotEmpty);
      expect(weightValues.every((value) => (value - weightValues.first).abs() < 0.0001), isTrue);

      final state = container.read(projectAutoMatchControllerProvider(55));
      expect(state.loading, isFalse);
      expect(state.feedback, isNotNull);
      expect(state.snapshot?.retrievedAt, DateTime(2024, 6, 12, 15));
    });

    test('regenerate surfaces repository failure', () async {
      final container = createContainer();
      final controller = container.read(projectAutoMatchControllerProvider(5).notifier);
      await controller.load(5);
      repository.throwOnRegenerate = true;

      await controller.regenerate(5);

      final state = container.read(projectAutoMatchControllerProvider(5));
      expect(state.loading, isFalse);
      expect(state.error, 'validation failed');
    });
  });
}

class _StubProjectAutoMatchRepository extends ProjectAutoMatchRepository {
  _StubProjectAutoMatchRepository()
      : snapshot = ProjectAutoMatchSnapshot(
          project: const ProjectAutoMatchProject(
            id: 42,
            title: 'Design sprint',
            description: 'Ship an onboarding flow redesign',
            status: 'active',
            budgetAmount: 24000,
            budgetCurrency: 'GBP',
            autoAssignStatus: 'enabled',
          ),
          entries: const <ProjectAutoMatchEntry>[],
          retrievedAt: DateTime(2024, 1, 1, 12),
        ),
        super(NoopApiClient());

  ProjectAutoMatchSnapshot snapshot;
  ProjectAutoMatchCommand? lastCommand;
  bool throwOnFetch = false;
  bool throwOnRegenerate = false;

  @override
  Future<ProjectAutoMatchSnapshot> fetchSnapshot(int projectId) async {
    if (throwOnFetch) {
      throw ApiException(500, 'server exploded');
    }
    return snapshot;
  }

  @override
  Future<void> regenerateQueue(int projectId, ProjectAutoMatchCommand command) async {
    if (throwOnRegenerate) {
      throw ApiException(422, 'validation failed');
    }
    lastCommand = command;
  }
}

