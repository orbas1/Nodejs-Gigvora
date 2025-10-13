import 'package:gigvora_foundation/gigvora_foundation.dart';

import 'models/project_creation_request.dart';

class ProjectRepository {
  ProjectRepository(this._apiClient);

  final ApiClient _apiClient;

  Future<Map<String, dynamic>> createProject(ProjectCreationRequest request) async {
    final response = await _apiClient.post('/projects', body: request.toJson());
    if (response is Map<String, dynamic>) {
      return Map<String, dynamic>.from(response);
    }
    throw Exception('Unexpected response when creating project.');
  }
}
