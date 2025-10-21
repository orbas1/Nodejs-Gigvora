import 'package:flutter_test/flutter_test.dart';
import 'package:gigvora_foundation/gigvora_foundation.dart';
import 'package:riverpod/riverpod.dart';

import 'package:gigvora_mobile/core/providers.dart';
import 'package:gigvora_mobile/features/project_gig_management/application/project_gig_management_controller.dart';
import 'package:gigvora_mobile/features/project_gig_management/data/models/project_gig_management_snapshot.dart';
import 'package:gigvora_mobile/features/project_gig_management/data/project_gig_management_repository.dart';

import '../../../support/test_analytics_service.dart';

void main() {
  late ProviderContainer container;
  late TestAnalyticsService analytics;
  late FakeProjectGigRepository repository;
  late ProjectGigManagementSnapshot snapshot;

  setUp(() {
    analytics = TestAnalyticsService();
    snapshot = ProjectGigManagementSnapshot.fromJson(createOverviewPayload());
    repository = FakeProjectGigRepository(
      RepositoryResult<ProjectGigManagementSnapshot>(
        data: snapshot,
        fromCache: false,
        lastUpdated: DateTime(2024, 4, 2, 12),
      ),
    );
    container = ProviderContainer(
      overrides: [
        projectGigManagementRepositoryProvider.overrideWithValue(repository),
        analyticsServiceProvider.overrideWithValue(analytics),
      ],
    );
    addTearDown(container.dispose);
  });

  test('load hydrates snapshot and records analytics once', () async {
    await pumpEventQueue(times: 2);
    final state = container.read(projectGigManagementControllerProvider(12));

    expect(state.data?.summary.totalProjects, snapshot.summary.totalProjects);
    expect(state.data?.access.canManage, isTrue);
    expect(
      analytics.events.map((event) => event.name),
      contains('mobile_gig_management_viewed'),
    );

    await container.read(projectGigManagementControllerProvider(12).notifier).refresh();
    expect(repository.forceRefreshCalls, contains(12));
  });

  test('createProject prevents actions until snapshot is hydrated', () async {
    final controller = container.read(projectGigManagementControllerProvider(12).notifier);

    await expectLater(
      controller.createProject(
        const ProjectDraft(
          title: 'Premature project',
          goal: 'Do not run',
          budgetAllocated: 1000,
          budgetCurrency: 'USD',
          collaborators: <int>[21],
          source: 'mobile_app',
        ),
      ),
      throwsA(isA<StateError>()),
    );

    await pumpEventQueue(times: 2);
    final failureEvents =
        analytics.events.where((event) => event.name == 'mobile_gig_project_failed').toList();
    expect(failureEvents, isNotEmpty);
    expect(failureEvents.last.context['stage'], 'permission_check');
  });

  test('createProject persists draft when management permitted', () async {
    await pumpEventQueue(times: 2);
    final controller = container.read(projectGigManagementControllerProvider(12).notifier);

    await controller.createProject(
      const ProjectDraft(
        title: 'Market expansion',
        goal: 'Launch pilot',
        budgetAllocated: 18000,
        budgetCurrency: 'USD',
        collaborators: <int>[77],
        source: 'mobile_app',
      ),
    );

    expect(repository.createdProjectDrafts, hasLength(1));
    expect(repository.forceRefreshCalls.last, 12);
    expect(
      analytics.events.map((event) => event.name),
      contains('mobile_gig_project_created'),
    );
  });

  test('createProject throws state error when access denied', () async {
    repository = FakeProjectGigRepository(
      RepositoryResult<ProjectGigManagementSnapshot>(
        data: snapshot.copyWith(
          access: snapshot.access.copyWith(
            canManage: false,
            reason: 'Only delivery managers may create new projects.',
          ),
        ),
        fromCache: false,
        lastUpdated: DateTime.now(),
      ),
    );
    container = ProviderContainer(
      overrides: [
        projectGigManagementRepositoryProvider.overrideWithValue(repository),
        analyticsServiceProvider.overrideWithValue(analytics),
      ],
    );
    addTearDown(container.dispose);

    await pumpEventQueue(times: 2);
    final controller = container.read(projectGigManagementControllerProvider(12).notifier);

    expect(
      () => controller.createProject(
        const ProjectDraft(
          title: 'Denied project',
          goal: 'N/A',
          budgetAllocated: 1000,
          budgetCurrency: 'USD',
          collaborators: <int>[1],
          source: 'mobile_app',
        ),
      ),
      throwsA(isA<StateError>()),
    );
    expect(
      analytics.events.map((event) => event.name),
      contains('mobile_gig_project_failed'),
    );
    final failure = analytics.events.lastWhere((event) => event.name == 'mobile_gig_project_failed');
    expect(failure.context['stage'], 'permission_check');
    expect('${failure.context['reason']}', contains('Only delivery managers'));
  });
}

class FakeProjectGigRepository implements ProjectGigManagementRepository {
  FakeProjectGigRepository(this.result);

  RepositoryResult<ProjectGigManagementSnapshot> result;
  final List<int> forceRefreshCalls = <int>[];
  final List<ProjectDraft> createdProjectDrafts = <ProjectDraft>[];
  final List<GigOrderDraft> createdGigOrders = <GigOrderDraft>[];
  final List<GigBlueprintDraft> createdBlueprints = <GigBlueprintDraft>[];
  final List<ProjectTaskDraft> createdTaskDrafts = <ProjectTaskDraft>[];
  ProjectTaskMutation? lastTaskMutation;
  List<String> deletedTaskIds = <String>[];

  @override
  Future<RepositoryResult<ProjectGigManagementSnapshot>> fetchOverview(int userId, {bool forceRefresh = false}) async {
    if (forceRefresh) {
      forceRefreshCalls.add(userId);
    }
    return result;
  }

  @override
  Future<void> createProject(int userId, ProjectDraft draft) async {
    createdProjectDrafts.add(draft);
  }

  @override
  Future<void> createGigOrder(int userId, GigOrderDraft draft) async {
    createdGigOrders.add(draft);
  }

  @override
  Future<void> createGigBlueprint(int userId, GigBlueprintDraft draft) async {
    createdBlueprints.add(draft);
  }

  @override
  Future<void> createProjectTask(ProjectTaskDraft draft) async {
    createdTaskDrafts.add(draft);
  }

  @override
  Future<void> updateProjectTask(int projectId, String taskId, ProjectTaskMutation mutation) async {
    lastTaskMutation = mutation;
  }

  @override
  Future<void> deleteProjectTask(int projectId, String taskId) async {
    deletedTaskIds.add(taskId);
  }
}

extension on ProjectGigManagementSnapshot {
  ProjectGigManagementSnapshot copyWith({ProjectGigAccess? access}) {
    return ProjectGigManagementSnapshot(
      summary: summary,
      projects: projects,
      templates: templates,
      assetSummary: assetSummary,
      board: board,
      orders: orders,
      reminders: reminders,
      vendorStats: vendorStats,
      storytelling: storytelling,
      access: access ?? this.access,
      operations: operations,
    );
  }
}

extension on ProjectGigAccess {
  ProjectGigAccess copyWith({bool? canManage, String? reason}) {
    return ProjectGigAccess(
      canManage: canManage ?? this.canManage,
      canView: canView,
      actorRole: actorRole,
      allowedRoles: allowedRoles,
      reason: reason ?? this.reason,
    );
  }
}

Map<String, dynamic> createOverviewPayload() {
  return {
    'summary': {
      'totalProjects': 2,
      'activeProjects': 1,
      'budgetInPlay': 52000,
      'gigsInDelivery': 1,
      'templatesAvailable': 4,
      'assetsSecured': 12,
    },
    'projectCreation': {
      'projects': const <Map<String, dynamic>>[],
      'templates': const <Map<String, dynamic>>[],
    },
    'assets': {
      'summary': const <String, dynamic>{},
    },
    'managementBoard': {
      'metrics': const <String, dynamic>{},
      'lanes': const <Map<String, dynamic>>[],
      'retrospectives': const <Map<String, dynamic>>[],
      'integrations': const <Map<String, dynamic>>[],
    },
    'purchasedGigs': {
      'orders': const <Map<String, dynamic>>[],
      'reminders': const <Map<String, dynamic>>[],
      'stats': const <String, dynamic>{},
    },
    'storytelling': {
      'achievements': const <Map<String, dynamic>>[],
      'quickExports': {
        'resume': const <String>[],
        'linkedin': const <String>[],
        'coverLetter': const <String>[],
      },
      'prompts': const <String>[],
    },
    'access': {
      'canManage': true,
      'canView': true,
    },
    'operations': const <String, dynamic>{},
  };
}
