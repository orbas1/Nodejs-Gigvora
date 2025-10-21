import 'package:flutter_test/flutter_test.dart';

import 'package:gigvora_foundation/gigvora_foundation.dart';
import 'package:gigvora_mobile/features/work_management/application/work_management_controller.dart';
import 'package:gigvora_mobile/features/work_management/data/work_management_repository.dart';
import 'package:gigvora_mobile/features/work_management/data/work_management_sample.dart';

import '../../../helpers/in_memory_offline_cache.dart';
import '../../../helpers/recording_api_client.dart';
import '../../../helpers/test_dependencies.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  WorkManagementController buildController({RecordingApiClient? apiClient, RecordingAnalyticsService? analytics}) {
    final cache = InMemoryOfflineCache();
    final client = apiClient ?? RecordingApiClient(onGet: (_, __, ___, ____) => workManagementSample);
    final repository = WorkManagementRepository(client, cache);
    final analyticsService = analytics ?? RecordingAnalyticsService();
    return WorkManagementController(repository, analyticsService, projectId: 42);
  }

  test('loads overview on construction and tracks initial view once', () async {
    final analytics = RecordingAnalyticsService();
    final controller = buildController(analytics: analytics);

    await Future<void>.delayed(const Duration(milliseconds: 10));

    expect(controller.state.data?.project?.name, 'Enterprise rebrand rollout');
    expect(analytics.events.where((event) => event.name == 'mobile_work_management_viewed'), hasLength(1));

    await controller.refresh();
    expect(analytics.events.where((event) => event.name == 'mobile_work_management_viewed'), hasLength(1));
  });

  test('records partial analytics when refresh falls back to cache', () async {
    var callCount = 0;
    final apiClient = RecordingApiClient(onGet: (path, _, __, ___) {
      callCount += 1;
      if (callCount == 1) {
        return workManagementSample;
      }
      throw Exception('Offline');
    });
    final analytics = RecordingAnalyticsService();
    final controller = buildController(apiClient: apiClient, analytics: analytics);
    await Future<void>.delayed(const Duration(milliseconds: 10));

    await controller.refresh();

    expect(controller.state.error, isNotNull);
    expect(controller.state.fromCache, isTrue);
    expect(
      analytics.events.where((event) => event.name == 'mobile_work_management_partial'),
      hasLength(1),
    );
  });

  test('delegates create operations to the repository and emits analytics', () async {
    final apiClient = RecordingApiClient(onGet: (path, _, __, ___) => workManagementSample, onPost: (path, _, __, body) async {
      return {'ok': true};
    }, onPatch: (path, _, __, body) async {
      return {'ok': true};
    });
    final analytics = RecordingAnalyticsService();
    final controller = buildController(apiClient: apiClient, analytics: analytics);
    await Future<void>.delayed(const Duration(milliseconds: 10));

    await controller.createSprint(WorkSprintDraft(name: 'Sprint 7'));
    await controller.createTask(WorkTaskDraft(title: 'Design onboarding flow', sprintId: 108));
    await controller.logTime(701, WorkTimeEntryDraft(userId: 18, minutesSpent: 45));
    await controller.createRisk(WorkRiskDraft(title: 'Blocked deployment'));
    await controller.createChangeRequest(WorkChangeRequestDraft(title: 'Extend sprint scope'));
    await controller.approveChangeRequest(54);

    final paths = apiClient.requests.map((log) => log.path).toList();
    expect(paths, contains('/projects/42/work-management/sprints'));
    expect(paths, contains('/projects/42/work-management/sprints/108/tasks'));
    expect(paths, contains('/projects/42/work-management/tasks/701/time-entries'));
    expect(paths, contains('/projects/42/work-management/risks'));
    expect(paths, contains('/projects/42/work-management/change-requests'));
    expect(paths, contains('/projects/42/work-management/change-requests/54/approve'));

    final eventNames = analytics.events.map((event) => event.name).toList();
    expect(eventNames, contains('mobile_work_management_create_sprint'));
    expect(eventNames, contains('mobile_work_management_create_task'));
    expect(eventNames, contains('mobile_work_management_log_time'));
    expect(eventNames, contains('mobile_work_management_create_risk'));
    expect(eventNames, contains('mobile_work_management_create_change_request'));
    expect(eventNames, contains('mobile_work_management_approve_change_request'));
  });

  test('emits failure analytics when an operation throws and rethrows the error', () async {
    final apiClient = RecordingApiClient(onGet: (path, _, __, ___) => workManagementSample, onPost: (path, _, __, body) {
      throw Exception('Unable to create');
    });
    final analytics = RecordingAnalyticsService();
    final controller = buildController(apiClient: apiClient, analytics: analytics);
    await Future<void>.delayed(const Duration(milliseconds: 10));

    expect(
      () => controller.createTask(WorkTaskDraft(title: 'Failing task')),
      throwsException,
    );

    final events = analytics.events.map((event) => event.name).toList();
    expect(events.contains('mobile_work_management_create_task_failed'), isTrue);
  });
}
