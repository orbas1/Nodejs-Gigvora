import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:gigvora_foundation/gigvora_foundation.dart';

import 'package:gigvora_mobile/features/marketplace/application/project_creation_controller.dart';
import 'package:gigvora_mobile/features/marketplace/data/models/project_creation_request.dart';

import '../helpers/noop_api_client.dart';
import '../helpers/test_dependencies.dart';

class _StubProjectRepository extends ProjectRepository {
  _StubProjectRepository()
      : super(NoopApiClient());

  Map<String, dynamic> response = const {'id': 'proj-1', 'status': 'planning'};
  bool throwApiError = false;
  bool throwUnknown = false;
  ProjectCreationRequest? lastRequest;

  @override
  Future<Map<String, dynamic>> createProject(ProjectCreationRequest request) async {
    lastRequest = request;
    if (throwApiError) {
      throw ApiException(400, 'Invalid location');
    }
    if (throwUnknown) {
      throw Exception('offline');
    }
    return response;
  }
}

void main() {
  group('ProjectCreationController', () {
    late _StubProjectRepository repository;
    late RecordingAnalyticsService analytics;

    ProviderContainer createContainer() {
      repository = _StubProjectRepository();
      analytics = RecordingAnalyticsService();
      final container = ProviderContainer(
        overrides: [
          projectRepositoryProvider.overrideWithValue(repository),
          analyticsServiceProvider.overrideWithValue(analytics),
        ],
      );
      addTearDown(container.dispose);
      return container;
    }

    ProjectCreationRequest buildRequest() {
      return ProjectCreationRequest(
        title: 'Launch mission control',
        description: 'Build experimentation workspace for the growth team.',
        location: 'Remote',
        budgetAmount: 45000,
        budgetCurrency: 'usd',
        autoAssignEnabled: true,
        limit: 6,
        expiresInMinutes: 180,
        fairnessMaxAssignments: 2,
      );
    }

    test('submit stores response and records analytics on success', () async {
      final container = createContainer();
      final controller = container.read(projectCreationControllerProvider.notifier);

      await controller.submit(buildRequest());

      final state = container.read(projectCreationControllerProvider);
      expect(state.success, isTrue);
      expect(state.response, equals(repository.response));
      expect(state.error, isNull);
      expect(repository.lastRequest, isNotNull);

      final events = analytics.events.where((event) => event.name == 'mobile_project_created').toList();
      expect(events, hasLength(1));
      expect(events.first.context['status'], equals('planning'));
      expect(events.first.context['autoAssignEnabled'], isTrue);
    });

    test('submit exposes ApiException message and tracks failure event', () async {
      final container = createContainer();
      final controller = container.read(projectCreationControllerProvider.notifier);
      repository.throwApiError = true;

      await controller.submit(buildRequest());

      final state = container.read(projectCreationControllerProvider);
      expect(state.success, isFalse);
      expect(state.error, 'Invalid location');

      final events = analytics.events.where((event) => event.name == 'mobile_project_create_failed').toList();
      expect(events, hasLength(1));
      expect(events.first.context['reason'], 'Invalid location');
    });

    test('submit surfaces generic error for unexpected exceptions', () async {
      final container = createContainer();
      final controller = container.read(projectCreationControllerProvider.notifier);
      repository.throwUnknown = true;

      await controller.submit(buildRequest());

      final state = container.read(projectCreationControllerProvider);
      expect(state.error, 'Unable to create project. Please try again.');
      expect(state.success, isFalse);

      final failureEvents = analytics.events.where((event) => event.name == 'mobile_project_create_failed');
      expect(failureEvents.length, 1);
      expect(failureEvents.first.context['reason'], contains('offline'));
    });

    test('reset clears state for subsequent submissions', () {
      final container = createContainer();
      final controller = container.read(projectCreationControllerProvider.notifier);

      controller.state = const ProjectCreationState(error: 'broken');
      controller.reset();

      final state = container.read(projectCreationControllerProvider);
      expect(state.error, isNull);
      expect(state.success, isFalse);
      expect(state.response, isNull);
    });
  });
}
