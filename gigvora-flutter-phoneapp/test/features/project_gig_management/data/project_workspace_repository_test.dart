import 'package:flutter_test/flutter_test.dart';
import 'package:gigvora_foundation/gigvora_foundation.dart';

import 'package:gigvora_mobile/features/project_gig_management/data/models/project_workspace_snapshot.dart';
import 'package:gigvora_mobile/features/project_gig_management/data/project_workspace_repository.dart';

import '../../../support/test_api_client.dart';
import '../../../support/test_offline_cache.dart';

void main() {
  late InMemoryOfflineCache cache;
  late ProjectWorkspaceRepository repository;

  setUp(() {
    cache = InMemoryOfflineCache();
    repository = ProjectWorkspaceRepository(TestApiClient(), cache);
  });

  test('fetchWorkspace caches snapshot and handles network failures', () async {
    var callCount = 0;
    repository = ProjectWorkspaceRepository(
      TestApiClient(onGet: (path) async {
        callCount += 1;
        expect(path, '/projects/501/workspace');
        return createWorkspacePayload();
      }),
      cache,
    );

    final result = await repository.fetchWorkspace(501);

    expect(result.data, isA<ProjectWorkspaceSnapshot>());
    expect(result.data!.projectId, 501);
    expect(result.data!.whiteboards, isNotEmpty);
    expect(result.fromCache, isFalse);

    // cached call
    final cached = await repository.fetchWorkspace(501);
    expect(cached.fromCache, isTrue);
    expect(callCount, 1);

    repository = ProjectWorkspaceRepository(
      TestApiClient(onGet: (path) async {
        throw ApiException(500, 'Failure');
      }),
      cache,
    );

    final fallback = await repository.fetchWorkspace(501, forceRefresh: true);
    expect(fallback.fromCache, isTrue);
    expect(fallback.error, isA<ApiException>());
  });

  test('acknowledgeConversation patches endpoint and updates cache', () async {
    var patchPath = '';
    repository = ProjectWorkspaceRepository(
      TestApiClient(
        onGet: (path) async => createWorkspacePayload(),
        onPatch: (path, body) async {
          patchPath = path;
          return createWorkspacePayload();
        },
      ),
      cache,
    );

    await repository.fetchWorkspace(600);
    final snapshot = await repository.acknowledgeConversation(600, 9001);

    expect(patchPath, '/projects/600/workspace/conversations/9001');
    expect(snapshot.projectId, 22);
    final cached = cache.read('project_workspace:project:600', (raw) => raw);
    expect(cached, isNotNull);
  });
}

Map<String, dynamic> createWorkspacePayload() {
  return {
    'project': {'id': 22, 'title': 'Launchpad'},
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
    'brief': {
      'title': 'Project overview',
      'summary': 'Align cross-functional pods',
      'objectives': ['Launch revised workspace'],
      'updatedAt': '2024-03-28T09:00:00.000Z',
    },
    'whiteboards': [
      {
        'id': 1,
        'title': 'Roadmap',
        'status': 'active',
        'ownerName': 'Taylor',
        'activeCollaborators': ['Taylor'],
        'lastEditedAt': '2024-04-01T12:00:00.000Z',
      },
    ],
    'files': [
      {
        'id': 'file-1',
        'name': 'Scope.pdf',
        'type': 'document',
        'sizeBytes': 1024,
        'uploadedAt': '2024-03-15T15:00:00.000Z',
        'tags': ['scope'],
      },
    ],
    'conversations': [
      {
        'id': 5,
        'subject': 'Kick-off',
        'updatedAt': '2024-04-01T13:00:00.000Z',
        'messages': [
          {
            'id': 1,
            'author': 'Morgan',
            'body': 'Ready for lift-off',
            'sentAt': '2024-04-01T12:59:00.000Z',
          },
        ],
      },
    ],
    'approvals': [
      {
        'id': 4,
        'title': 'Scope approval',
        'status': 'pending',
        'requestedBy': 'Morgan',
        'requestedAt': '2024-03-25T12:00:00.000Z',
      },
    ],
  };
}
