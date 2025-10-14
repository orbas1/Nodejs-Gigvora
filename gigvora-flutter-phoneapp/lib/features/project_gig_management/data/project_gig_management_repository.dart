import 'package:flutter/foundation.dart';
import 'package:gigvora_foundation/gigvora_foundation.dart';

import 'models/project_gig_management_snapshot.dart';

class ProjectGigManagementRepository {
  ProjectGigManagementRepository(this._apiClient, this._cache);

  final ApiClient _apiClient;
  final OfflineCache _cache;

  static const _ttl = Duration(minutes: 5);

  String _cacheKey(int userId) => 'project_gig_management:user:$userId';

  Future<RepositoryResult<ProjectGigManagementSnapshot>> fetchOverview(
    int userId, {
    bool forceRefresh = false,
  }) async {
    final cacheKey = _cacheKey(userId);
    CacheEntry<ProjectGigManagementSnapshot>? cached;
    try {
      cached = _cache.read<ProjectGigManagementSnapshot>(cacheKey, (raw) {
        if (raw is Map) {
          return ProjectGigManagementSnapshot.fromJson(
            Map<String, dynamic>.from(raw as Map),
          );
        }
        return ProjectGigManagementSnapshot.fromJson(const <String, dynamic>{});
      });
    } catch (error, stackTrace) {
      debugPrint('Failed to parse cached project gig management snapshot: $error\n$stackTrace');
      cached = null;
    }

    if (!forceRefresh && cached != null) {
      return RepositoryResult<ProjectGigManagementSnapshot>(
        data: cached.value,
        fromCache: true,
        lastUpdated: cached.storedAt,
      );
    }

    try {
      final response = await _apiClient.get('/users/$userId/project-gig-management');
      if (response is! Map<String, dynamic>) {
        throw Exception('Unexpected payload when fetching project gig management snapshot');
      }
      await _cache.write(cacheKey, response, ttl: _ttl);
      final snapshot = ProjectGigManagementSnapshot.fromJson(response);
      return RepositoryResult<ProjectGigManagementSnapshot>(
        data: snapshot,
        fromCache: false,
        lastUpdated: DateTime.now(),
      );
    } catch (error) {
      if (cached != null) {
        return RepositoryResult<ProjectGigManagementSnapshot>(
          data: cached.value,
          fromCache: true,
          lastUpdated: cached.storedAt,
          error: error,
        );
      }
      rethrow;
    }
  }

  Future<void> createProject(int userId, ProjectDraft draft) {
    return _apiClient.post(
      '/users/$userId/project-gig-management/projects',
      body: draft.toJson(),
    );
  }

  Future<void> createGigOrder(int userId, GigOrderDraft draft) {
    return _apiClient.post(
      '/users/$userId/project-gig-management/gig-orders',
      body: draft.toJson(),
    );
  }

  Future<void> createGigBlueprint(int userId, GigBlueprintDraft draft) {
    return _apiClient.post(
      '/freelancers/$userId/gigs',
      body: draft.toJson(userId),
    );
  }
}
