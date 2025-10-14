import 'package:flutter/foundation.dart';
import 'package:gigvora_foundation/gigvora_foundation.dart';

import 'models/project_workspace_snapshot.dart';

class ProjectWorkspaceRepository {
  ProjectWorkspaceRepository(this._apiClient, this._cache);

  final ApiClient _apiClient;
  final OfflineCache _cache;

  static const _ttl = Duration(minutes: 3);

  String _cacheKey(int projectId) => 'project_workspace:project:$projectId';

  Future<RepositoryResult<ProjectWorkspaceSnapshot>> fetchWorkspace(
    int projectId, {
    bool forceRefresh = false,
  }) async {
    final cacheKey = _cacheKey(projectId);
    CacheEntry<ProjectWorkspaceSnapshot>? cached;
    try {
      cached = _cache.read<ProjectWorkspaceSnapshot>(cacheKey, (raw) {
        if (raw is Map) {
          return ProjectWorkspaceSnapshot.fromJson(Map<String, dynamic>.from(raw as Map));
        }
        return ProjectWorkspaceSnapshot.fromJson(const <String, dynamic>{});
      });
    } catch (error, stackTrace) {
      debugPrint('Failed to parse cached project workspace snapshot: $error\n$stackTrace');
      cached = null;
    }

    if (!forceRefresh && cached != null) {
      return RepositoryResult<ProjectWorkspaceSnapshot>(
        data: cached.value,
        fromCache: true,
        lastUpdated: cached.storedAt,
      );
    }

    try {
      final response = await _apiClient.get('/projects/$projectId/workspace');
      if (response is! Map<String, dynamic>) {
        throw Exception('Unexpected payload when fetching project workspace');
      }
      await _cache.write(cacheKey, response, ttl: _ttl);
      final snapshot = ProjectWorkspaceSnapshot.fromJson(response);
      return RepositoryResult<ProjectWorkspaceSnapshot>(
        data: snapshot,
        fromCache: false,
        lastUpdated: DateTime.now(),
      );
    } catch (error) {
      if (cached != null) {
        return RepositoryResult<ProjectWorkspaceSnapshot>(
          data: cached.value,
          fromCache: true,
          lastUpdated: cached.storedAt,
          error: error,
        );
      }
      rethrow;
    }
  }

  Future<ProjectWorkspaceSnapshot> acknowledgeConversation(int projectId, int conversationId) async {
    final response = await _apiClient.patch(
      '/projects/$projectId/workspace/conversations/$conversationId',
      body: const <String, dynamic>{},
    );
    if (response is! Map<String, dynamic>) {
      throw Exception('Unexpected payload when acknowledging workspace conversation');
    }
    await _cache.write(_cacheKey(projectId), response, ttl: _ttl);
    return ProjectWorkspaceSnapshot.fromJson(response);
  }
}
