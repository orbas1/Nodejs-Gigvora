import 'package:flutter_test/flutter_test.dart';

import 'package:gigvora_mobile/features/marketplace/data/project_auto_match_repository.dart';

import '../helpers/recording_api_client.dart';

void main() {
  group('ProjectAutoMatchRepository', () {
    late RecordingApiClient apiClient;
    late ProjectAutoMatchRepository repository;
    late Map<String, dynamic> projectPayload;
    late Map<String, dynamic> queuePayload;

    setUp(() {
      projectPayload = {
        'id': '7',
        'title': 'Product redesign',
        'description': 'Overhaul onboarding experience',
        'status': 'active',
        'budgetAmount': '24500',
        'budgetCurrency': 'GBP',
        'autoAssignStatus': 'enabled',
      };
      queuePayload = {
        'entries': [
          {
            'id': 11,
            'freelancerId': '99',
            'status': 'pending',
            'score': 82.4,
            'priorityBucket': 2,
            'position': 1,
            'expiresAt': '2024-05-01T12:00:00Z',
            'metadata': {'invitedBy': 'system'},
            'breakdown': {'recency': 0.4},
            'freelancer': {'id': 99, 'firstName': 'Lena', 'lastName': 'Fields'},
          }
        ],
      };
      apiClient = RecordingApiClient(onGet: (path, query, headers, body) {
        if (path == '/projects/7') {
          return projectPayload;
        }
        if (path == '/auto-assign/projects/7/queue') {
          return queuePayload;
        }
        throw UnimplementedError('Unhandled GET $path');
      }, onPost: (path, query, headers, body) {
        return {'status': 'ok'};
      });
      repository = ProjectAutoMatchRepository(apiClient);
    });

    test('fetchProject normalises primitive types', () async {
      final project = await repository.fetchProject(7);
      expect(project.id, 7);
      expect(project.title, 'Product redesign');
      expect(project.budgetAmount, closeTo(24500, 0.001));
      expect(project.autoAssignStatus, 'enabled');
    });

    test('fetchQueue maps entries and freelancers', () async {
      final entries = await repository.fetchQueue(7);
      expect(entries, hasLength(1));
      final entry = entries.first;
      expect(entry.id, 11);
      expect(entry.freelancer.id, 99);
      expect(entry.breakdown['recency'], 0.4);
      expect(entry.metadata['invitedBy'], 'system');
      expect(entry.expiresAt, DateTime.parse('2024-05-01T12:00:00Z'));
    });

    test('fetchSnapshot combines project and queue data', () async {
      final before = DateTime.now();
      final snapshot = await repository.fetchSnapshot(7);
      final after = DateTime.now();

      expect(snapshot.project.title, 'Product redesign');
      expect(snapshot.entries, hasLength(1));
      expect(snapshot.retrievedAt.isAfter(before.subtract(const Duration(seconds: 1))), isTrue);
      expect(snapshot.retrievedAt.isBefore(after.add(const Duration(seconds: 1))), isTrue);
    });

    test('regenerateQueue posts command payload to API', () async {
      final command = ProjectAutoMatchCommand(
        limit: 6,
        expiresInMinutes: 180,
        projectValue: 18000,
        ensureNewcomer: true,
        maxAssignments: 3,
        weights: const {'recency': 0.4, 'rating': 0.6},
      );

      await repository.regenerateQueue(7, command);

      final postRequest = apiClient.requests.last;
      expect(postRequest.method, 'POST');
      expect(postRequest.path, '/auto-assign/projects/7/enqueue');
      final body = postRequest.body as Map<String, dynamic>;
      expect(body['limit'], 6);
      expect(body['fairness']['ensureNewcomer'], isTrue);
      expect(body['weights']['rating'], 0.6);
    });
  });
}
