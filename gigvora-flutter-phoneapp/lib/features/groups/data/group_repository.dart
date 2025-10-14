import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gigvora_foundation/gigvora_foundation.dart';

import '../../../core/providers.dart';
import 'models/group_models.dart';
import 'package:flutter/foundation.dart';
import 'package:gigvora_foundation/gigvora_foundation.dart';

import 'models/group.dart';

class GroupRepository {
  GroupRepository(this._apiClient, this._cache);

  final ApiClient _apiClient;
  final OfflineCache _cache;

  static const _directoryCachePrefix = 'groups:directory:';
  static const _profileCachePrefix = 'groups:profile:';
  static const _directoryTtl = Duration(minutes: 2);
  static const _profileTtl = Duration(minutes: 5);
  final Map<int, Set<String>> _directoryCacheKeys = <int, Set<String>>{};

  Future<RepositoryResult<GroupDirectory>> fetchDirectory({
    required int actorId,
    String? query,
    String? focus,
    bool includeEmpty = false,
    bool forceRefresh = false,
  }) async {
    final normalizedQuery = (query ?? '').trim().toLowerCase();
    final normalizedFocus = (focus ?? 'all').trim().toLowerCase();
    final cacheKey = '$_directoryCachePrefix$actorId:$normalizedFocus:$normalizedQuery:$includeEmpty';
    _directoryCacheKeys.putIfAbsent(actorId, () => <String>{}).add(cacheKey);

    CacheEntry<GroupDirectory>? cached;
    if (!forceRefresh) {
      cached = _cache.read<GroupDirectory>(cacheKey, _parseDirectoryCache);
      if (cached != null) {
        return RepositoryResult<GroupDirectory>(
          data: cached.value,
          fromCache: true,
          lastUpdated: cached.storedAt,
        );
      }
    }

    try {
      final response = await _apiClient.get(
        '/groups',
        query: {
          'actorId': actorId,
          if (normalizedQuery.isNotEmpty) 'query': normalizedQuery,
          if (focus != null && focus.trim().isNotEmpty && normalizedFocus != 'all') 'focus': focus,
          if (includeEmpty) 'includeEmpty': includeEmpty,
        },
      );

      final directory = _parseDirectoryResponse(response);
      await _cache.write(cacheKey, directory.toJson(), ttl: _directoryTtl);
      return RepositoryResult<GroupDirectory>(
        data: directory,
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
        return RepositoryResult<GroupDirectory>(
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

  Future<GroupProfile> fetchProfile(
    String groupId, {
    required int actorId,
    bool forceRefresh = false,
  }) async {
    final cacheKey = '$_profileCachePrefix$actorId:${groupId.toLowerCase()}';
    CacheEntry<GroupProfile>? cached;
    if (!forceRefresh) {
      cached = _cache.read<GroupProfile>(cacheKey, _parseProfileCache);
      if (cached != null && !cached.isExpired) {
        return cached.value;
      }
    }

    final response = await _apiClient.get(
      '/groups/$groupId',
      query: {'actorId': actorId},
    );

    final profile = _parseProfileResponse(response);
    await _cache.write(cacheKey, profile.toJson(), ttl: _profileTtl);
    return profile;
  }

  Future<GroupProfile> joinGroup(
    String groupId, {
    required int actorId,
    String role = 'member',
  }) async {
    final response = await _apiClient.post(
      '/groups/$groupId/join',
      query: {'actorId': actorId},
      body: {'actorId': actorId, 'role': role},
    );
    final profile = _parseProfileResponse(response);
    await _cache.write(_profileCacheKey(actorId, profile.slug), profile.toJson(), ttl: _profileTtl);
    await _invalidateDirectory(actorId);
    return profile;
  }

  Future<GroupProfile> leaveGroup(
    String groupId, {
    required int actorId,
  }) async {
    final response = await _apiClient.delete(
      '/groups/$groupId/leave',
      query: {'actorId': actorId},
      body: {'actorId': actorId},
    );
    final profile = _parseProfileResponse(response);
    await _cache.write(_profileCacheKey(actorId, profile.slug), profile.toJson(), ttl: _profileTtl);
    await _invalidateDirectory(actorId);
    return profile;
  }

  Future<GroupProfile> updateMembership(
    String groupId, {
    required int actorId,
    String? role,
    GroupNotificationPreferences? notifications,
  }) async {
    final payload = <String, dynamic>{'actorId': actorId};
    if (role != null && role.trim().isNotEmpty) {
      payload['role'] = role.trim();
    }
    if (notifications != null) {
      payload['notifications'] = notifications.toJson();
    }

    final response = await _apiClient.patch(
      '/groups/$groupId/membership',
      query: {'actorId': actorId},
      body: payload,
    );

    final profile = _parseProfileResponse(response);
    await _cache.write(_profileCacheKey(actorId, profile.slug), profile.toJson(), ttl: _profileTtl);
    await _invalidateDirectory(actorId);
    return profile;
  }

  Future<void> _invalidateDirectory(int actorId) async {
    final keys = _directoryCacheKeys[actorId];
    if (keys == null || keys.isEmpty) {
      return;
    }
    for (final key in keys) {
      await _cache.remove(key);
    }
    keys.clear();
  }

  GroupDirectory _parseDirectoryResponse(dynamic response) {
    if (response is GroupDirectory) {
      return response;
    }
    if (response is Map<String, dynamic>) {
      return GroupDirectory.fromJson(response);
    }
    if (response is Map) {
      return GroupDirectory.fromJson(Map<String, dynamic>.from(response as Map));
    }
    throw StateError('Unexpected directory response: $response');
  }

  GroupProfile _parseProfileResponse(dynamic response) {
    if (response is GroupProfile) {
      return response;
    }
    if (response is Map<String, dynamic>) {
      return GroupProfile.fromJson(response);
    }
    if (response is Map) {
      return GroupProfile.fromJson(Map<String, dynamic>.from(response as Map));
    }
    throw StateError('Unexpected profile response: $response');
  }

  GroupDirectory _parseDirectoryCache(dynamic raw) {
    if (raw is GroupDirectory) {
      return raw;
    }
    if (raw is Map<String, dynamic>) {
      return GroupDirectory.fromJson(raw);
    }
    if (raw is Map) {
      return GroupDirectory.fromJson(Map<String, dynamic>.from(raw as Map));
    }
    throw StateError('Invalid directory cache payload');
  }

  GroupProfile _parseProfileCache(dynamic raw) {
    if (raw is GroupProfile) {
      return raw;
    }
    if (raw is Map<String, dynamic>) {
      return GroupProfile.fromJson(raw);
    }
    if (raw is Map) {
      return GroupProfile.fromJson(Map<String, dynamic>.from(raw as Map));
    }
    throw StateError('Invalid profile cache payload');
  }

  String _profileCacheKey(int actorId, String slug) => '$_profileCachePrefix$actorId:${slug.toLowerCase()}';
}

final groupRepositoryProvider = Provider<GroupRepository>((ref) {
  final api = ref.watch(apiClientProvider);
  final cache = ref.watch(offlineCacheProvider);
  return GroupRepository(api, cache);
});
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
