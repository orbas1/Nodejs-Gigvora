import 'package:flutter_test/flutter_test.dart';

import 'package:gigvora_mobile/features/marketplace/data/models/project_creation_request.dart';
import 'package:gigvora_mobile/features/marketplace/data/project_repository.dart';

import '../helpers/recording_api_client.dart';

void main() {
  group('ProjectRepository', () {
    test('createProject returns response body as map', () async {
      final apiClient = RecordingApiClient(onPost: (path, query, headers, body) {
        expect(path, '/projects');
        return {
          'id': 42,
          'title': (body as Map<String, dynamic>)['title'],
        };
      });
      final repository = ProjectRepository(apiClient);
      final request = ProjectCreationRequest(title: 'Test', description: 'Build it.');

      final response = await repository.createProject(request);

      expect(response['id'], 42);
      expect(response['title'], 'Test');
    });

    test('createProject throws when API returns unexpected payload', () async {
      final apiClient = RecordingApiClient(onPost: (path, query, headers, body) => 'ok');
      final repository = ProjectRepository(apiClient);
      final request = ProjectCreationRequest(title: 'Invalid', description: 'payload');

      expect(
        () => repository.createProject(request),
        throwsA(isA<Exception>()),
      );
    });
  });
}
