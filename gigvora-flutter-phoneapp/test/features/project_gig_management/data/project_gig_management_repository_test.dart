import 'package:flutter_test/flutter_test.dart';
import 'package:gigvora_foundation/gigvora_foundation.dart';

import 'package:gigvora_mobile/features/project_gig_management/data/models/project_gig_management_snapshot.dart';
import 'package:gigvora_mobile/features/project_gig_management/data/project_gig_management_repository.dart';

import '../../../support/test_api_client.dart';
import '../../../support/test_offline_cache.dart';

void main() {
  late InMemoryOfflineCache cache;
  late ProjectGigManagementRepository repository;

  setUp(() {
    cache = InMemoryOfflineCache();
    repository = ProjectGigManagementRepository(TestApiClient(), cache);
  });

  test('fetchOverview caches snapshots and returns parsed data', () async {
    var callCount = 0;
    repository = ProjectGigManagementRepository(
      TestApiClient(onGet: (path) async {
        callCount += 1;
        expect(path, '/users/55/project-gig-management');
        return createOverviewPayload();
      }),
      cache,
    );

    final result = await repository.fetchOverview(55);

    expect(result.data, isA<ProjectGigManagementSnapshot>());
    expect(result.data!.summary.totalProjects, 2);
    expect(result.data!.projects.first.budget.currency, 'USD');
    expect(result.fromCache, isFalse);

    final cached = await repository.fetchOverview(55);
    expect(cached.fromCache, isTrue);
    expect(callCount, 1);
  });

  test('fetchOverview returns cached snapshot when API fails', () async {
    await cache.write('project_gig_management:user:77', createOverviewPayload());

    repository = ProjectGigManagementRepository(
      TestApiClient(onGet: (path) async {
        throw ApiException(503, 'Temporarily unavailable');
      }),
      cache,
    );

    final result = await repository.fetchOverview(77, forceRefresh: true);

    expect(result.fromCache, isTrue);
    expect(result.error, isA<ApiException>());
    expect(result.data!.orders, isEmpty);
  });

  test('create operations hit expected endpoints', () async {
    var projectPayload = <String, dynamic>{};
    var orderPayload = <String, dynamic>{};
    var blueprintPayload = <String, dynamic>{};
    var taskPayload = <String, dynamic>{};
    var mutationPayload = <String, dynamic>{};
    var deletePath = '';

    final client = TestApiClient(
      onPost: (path, body) async {
        switch (path) {
          case '/users/99/project-gig-management/projects':
            projectPayload = Map<String, dynamic>.from(body as Map);
            break;
          case '/users/99/project-gig-management/gig-orders':
            orderPayload = Map<String, dynamic>.from(body as Map);
            break;
          case '/freelancers/99/gigs':
            blueprintPayload = Map<String, dynamic>.from(body as Map);
            break;
          case '/projects/501/operations/tasks':
            taskPayload = Map<String, dynamic>.from(body as Map);
            break;
        }
        return null;
      },
      onPatch: (path, body) async {
        mutationPayload = Map<String, dynamic>.from(body as Map);
        return null;
      },
      onDelete: (path, body) async {
        deletePath = path;
        return null;
      },
    );

    repository = ProjectGigManagementRepository(client, cache);

    await repository.createProject(
      99,
      const ProjectDraft(
        title: 'Launch Growth Campaign',
        goal: 'Ship new landing page',
        budgetAllocated: 12000,
        budgetCurrency: 'USD',
        collaborators: <int>[42],
        source: 'mobile_app',
      ),
    );
    await repository.createGigOrder(
      99,
      const GigOrderDraft(
        vendorId: 1001,
        vendorName: 'Design Co',
        serviceName: 'Landing page',
        amount: 2400,
        currency: 'USD',
        dueAt: '2024-04-20T12:00:00.000Z',
        notes: 'Include hero animation',
      ),
    );
    await repository.createGigBlueprint(
      99,
      const GigBlueprintDraft(
        title: 'Sales Enablement Kit',
        description: 'Toolkit for launch',
        packageName: 'Core',
        packagePrice: 1500,
        currency: 'USD',
        deliveryDays: 5,
        revisionLimit: 2,
        leadTimeDays: 3,
        timezone: 'UTC',
      ),
    );
    await repository.createProjectTask(
      const ProjectTaskDraft(
        projectId: 501,
        title: 'Draft scope',
        lane: 'Backlog',
        status: 'planned',
        riskLevel: 'low',
        notes: 'Align with marketing',
      ),
    );
    await repository.updateProjectTask(
      501,
      'task-123',
      const ProjectTaskMutation(status: 'in_progress', progressPercent: 0.5),
    );
    await repository.deleteProjectTask(501, 'task-123');

    expect(projectPayload['title'], 'Launch Growth Campaign');
    expect(orderPayload['vendorName'], 'Design Co');
    expect(blueprintPayload['ownerId'], 99);
    expect(taskPayload['title'], 'Draft scope');
    expect(mutationPayload['status'], 'in_progress');
    expect(deletePath, '/projects/501/operations/tasks/task-123');
  });
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
      'projects': [
        {
          'id': 10,
          'title': 'Agency onboarding',
          'status': 'active',
          'workspace': {
            'status': 'active',
            'progressPercent': 72,
            'riskLevel': 'medium',
            'nextMilestone': 'Kick-off',
            'nextMilestoneDueAt': '2024-04-20T12:00:00.000Z',
          },
          'budget': {
            'currency': 'USD',
            'allocated': 15000,
            'spent': 5000,
            'remaining': 10000,
            'burnRatePercent': 33,
          },
          'collaborators': [
            {'status': 'invited'},
            {'status': 'active'},
          ],
          'milestones': [
            {
              'id': 1,
              'title': 'Kick-off',
              'status': 'completed',
              'dueDate': '2024-03-01T00:00:00.000Z',
            },
          ],
          'updatedAt': '2024-04-01T10:00:00.000Z',
        },
      ],
      'templates': [
        {
          'id': 1,
          'name': 'Campaign launch',
          'category': 'Marketing',
          'description': 'Multi-channel activation',
          'summary': 'Guide for go-to-market',
          'durationWeeks': 4,
          'recommendedBudgetMin': 5000,
          'recommendedBudgetMax': 15000,
          'toolkit': ['brief template'],
          'prompts': ['Draft launch brief'],
          'isFeatured': true,
        },
      ],
    },
    'assets': {
      'summary': {
        'total': 24,
        'restricted': 3,
        'watermarkCoverage': 0.45,
        'storageBytes': 2048,
      },
    },
    'managementBoard': {
      'metrics': {
        'averageProgress': 0.7,
        'atRisk': 1,
        'completed': 4,
        'activeProjects': 2,
      },
      'lanes': const <Map<String, dynamic>>[],
      'retrospectives': const <Map<String, dynamic>>[],
      'integrations': const <Map<String, dynamic>>[],
    },
    'purchasedGigs': {
      'orders': const <Map<String, dynamic>>[],
      'reminders': const <Map<String, dynamic>>[],
      'stats': {
        'totalOrders': 3,
        'active': 1,
        'completed': 1,
        'averageProgress': 0.62,
        'averages': {
          'overall': 4.8,
          'quality': 4.7,
          'communication': 4.9,
          'reliability': 4.6,
        },
      },
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
      'actorRole': 'manager',
      'allowedRoles': ['manager'],
    },
    'operations': {
      'allowedRoles': ['manager'],
      'metrics': {
        'total': 5,
        'completed': 2,
        'blocked': 1,
        'atRisk': 1,
      },
      'tasks': const <Map<String, dynamic>>[],
      'lastSyncedAt': '2024-04-01T00:00:00.000Z',
    },
  };
}
