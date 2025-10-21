import 'package:flutter_test/flutter_test.dart';
import 'package:gigvora_foundation/gigvora_foundation.dart';
import 'package:riverpod/riverpod.dart';

import 'package:gigvora_mobile/core/providers.dart';
import 'package:gigvora_mobile/features/project_gig_management/application/project_workspace_controller.dart';
import 'package:gigvora_mobile/features/project_gig_management/data/models/project_workspace_snapshot.dart';
import 'package:gigvora_mobile/features/project_gig_management/data/project_workspace_repository.dart';

import '../../../support/test_analytics_service.dart';

void main() {
  late ProviderContainer container;
  late TestAnalyticsService analytics;
  late FakeWorkspaceRepository repository;
  late ProjectWorkspaceSnapshot snapshot;

  setUp(() {
    analytics = TestAnalyticsService();
    snapshot = ProjectWorkspaceSnapshot.fromJson(createWorkspacePayload());
    repository = FakeWorkspaceRepository(
      RepositoryResult<ProjectWorkspaceSnapshot>(
        data: snapshot,
        fromCache: false,
        lastUpdated: DateTime(2024, 4, 2, 9),
      ),
    );
    container = ProviderContainer(
      overrides: [
        projectWorkspaceRepositoryProvider.overrideWithValue(repository),
        analyticsServiceProvider.overrideWithValue(analytics),
      ],
    );
    addTearDown(container.dispose);
  });

  test('controller loads workspace snapshot and records analytics', () async {
    await pumpEventQueue(times: 2);
    final state = container.read(projectWorkspaceControllerProvider(501));

    expect(state.data?.projectId, snapshot.projectId);
    expect(state.data?.workspace.progressPercent, snapshot.workspace.progressPercent);
    expect(
      analytics.events.map((event) => event.name),
      contains('mobile_project_workspace_viewed'),
    );
  });

  test('acknowledgeConversation updates repository and refreshes snapshot', () async {
    await pumpEventQueue(times: 2);
    final controller = container.read(projectWorkspaceControllerProvider(501).notifier);

    repository.acknowledgeResult = snapshot;
    await controller.acknowledgeConversation(7);

    expect(repository.acknowledgedConversations, contains(7));
    expect(
      analytics.events.map((event) => event.name),
      contains('mobile_project_workspace_conversation_acknowledged'),
    );
  });

  test('acknowledgeConversation rejects unknown conversations', () async {
    await pumpEventQueue(times: 2);
    final controller = container.read(projectWorkspaceControllerProvider(501).notifier);

    await expectLater(
      controller.acknowledgeConversation(99),
      throwsA(isA<StateError>()),
    );

    await pumpEventQueue(times: 2);
    final failure =
        analytics.events.lastWhere((event) => event.name == 'mobile_project_workspace_conversation_failed');
    expect(failure.context['stage'], 'permission_check');
    expect('${failure.context['reason']}', contains('not part of this workspace'));
  });
}

class FakeWorkspaceRepository implements ProjectWorkspaceRepository {
  FakeWorkspaceRepository(this.result);

  RepositoryResult<ProjectWorkspaceSnapshot> result;
  ProjectWorkspaceSnapshot? acknowledgeResult;
  final List<int> acknowledgedConversations = <int>[];

  @override
  Future<RepositoryResult<ProjectWorkspaceSnapshot>> fetchWorkspace(int projectId, {bool forceRefresh = false}) async {
    return result;
  }

  @override
  Future<ProjectWorkspaceSnapshot> acknowledgeConversation(int projectId, int conversationId) async {
    acknowledgedConversations.add(conversationId);
    return acknowledgeResult ?? result.data!;
  }
}

Map<String, dynamic> createWorkspacePayload() {
  return {
    'project': {'id': 501, 'title': 'Workspace readiness'},
    'workspace': {
      'progressPercent': 0.58,
      'riskLevel': 'medium',
      'nextMilestone': 'Internal review',
      'nextMilestoneDueAt': '2024-04-18T12:00:00.000Z',
      'metricsSnapshot': {
        'automationRuns': 2,
        'activeStreams': 1,
        'deliverablesInProgress': 1,
        'teamUtilization': 0.64,
      },
    },
    'metrics': {
      'pendingApprovals': 1,
      'unreadMessages': 3,
      'totalAssets': 5,
      'automationCoverage': 0.42,
    },
    'conversations': [
      {
        'id': 7,
        'topic': 'Vendor escalation',
        'unreadCount': 2,
        'channelType': 'ops',
      },
    ],
    'brief': {
      'title': 'Project overview',
      'summary': 'Align cross-functional pods',
      'objectives': ['Launch revised workspace'],
      'updatedAt': '2024-03-28T09:00:00.000Z',
    },
  };
}
