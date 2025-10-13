import 'package:flutter/foundation.dart';
import 'package:gigvora_foundation/gigvora_foundation.dart';

import 'models/group.dart';

class GroupRepository {
  GroupRepository(this._apiClient, this._cache);

  final ApiClient _apiClient;
  final OfflineCache _cache;

  static const _managedCacheKey = 'groups:managed';
  static const _managedCacheTtl = Duration(minutes: 2);

  Future<RepositoryResult<List<GroupSummary>>> fetchManagedGroups({ bool forceRefresh = false }) async {
    final cached = _readManagedCache();
    if (!forceRefresh && cached != null) {
      return RepositoryResult<List<GroupSummary>>(
        data: cached.value,
        fromCache: true,
        lastUpdated: cached.storedAt,
      );
    }

    try {
      final response = await _apiClient.get('/groups', query: {
        'includeMembers': 'true',
        'pageSize': '50',
      }) as Map<String, dynamic>;
      final data = response['data'];
      final groups = data is List
          ? data
              .whereType<Map>()
              .map((item) => GroupSummary.fromJson(Map<String, dynamic>.from(item)))
              .toList(growable: false)
          : const <GroupSummary>[];
      await _cache.write(_managedCacheKey, response, ttl: _managedCacheTtl);
      return RepositoryResult<List<GroupSummary>>(
        data: groups,
        fromCache: false,
        lastUpdated: DateTime.now(),
      );
    } catch (error) {
      if (cached != null) {
        return RepositoryResult<List<GroupSummary>>(
          data: cached.value,
          fromCache: true,
          lastUpdated: cached.storedAt,
          error: error,
        );
      }
      rethrow;
    }
  }

  Future<GroupSummary> createGroup(Map<String, dynamic> payload) async {
    final response = await _apiClient.post('/groups', body: payload) as Map<String, dynamic>;
    await _cache.remove(_managedCacheKey);
    return GroupSummary.fromJson(response);
  }

  Future<GroupSummary> updateGroup(int groupId, Map<String, dynamic> payload) async {
    final response = await _apiClient.put('/groups/$groupId', body: payload) as Map<String, dynamic>;
    await _cache.remove(_managedCacheKey);
    return GroupSummary.fromJson(response);
  }

  Future<GroupMember> addMember(int groupId, Map<String, dynamic> payload) async {
    final response = await _apiClient.post('/groups/$groupId/memberships', body: payload) as Map<String, dynamic>;
    await _cache.remove(_managedCacheKey);
    return GroupMember.fromJson(response);
  }

  Future<GroupMember> updateMember(int groupId, int membershipId, Map<String, dynamic> payload) async {
    final response = await _apiClient.patch(
      '/groups/$groupId/memberships/$membershipId',
      body: payload,
    ) as Map<String, dynamic>;
    await _cache.remove(_managedCacheKey);
    return GroupMember.fromJson(response);
  }

  CacheEntry<List<GroupSummary>>? _readManagedCache() {
    try {
      final entry = _cache.read<List<GroupSummary>>(
        _managedCacheKey,
        (raw) {
          if (raw is Map<String, dynamic>) {
            final data = raw['data'];
            if (data is List) {
              return data
                  .whereType<Map>()
                  .map((item) => GroupSummary.fromJson(Map<String, dynamic>.from(item)))
                  .toList(growable: false);
            }
          }
          return const <GroupSummary>[];
        },
      );
      return entry;
    } catch (error) {
      debugPrint('Failed to parse cached groups: $error');
      return null;
    }
  }
}
