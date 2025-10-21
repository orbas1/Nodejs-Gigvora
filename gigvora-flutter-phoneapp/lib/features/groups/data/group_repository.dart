import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gigvora_foundation/gigvora_foundation.dart';

import '../../../core/providers.dart';
import 'models/group.dart' as admin_models;
import 'models/group_models.dart' as community_models;

typedef GroupDirectory = community_models.GroupDirectory;
typedef GroupSummary = community_models.GroupSummary;
typedef GroupProfile = community_models.GroupProfile;
typedef GroupNotificationPreferences = community_models.GroupNotificationPreferences;
typedef AdminGroupSummary = admin_models.GroupSummary;
typedef GroupMember = admin_models.GroupMember;

class GroupRepository {
  GroupRepository(this._apiClient, this._cache);

  final ApiClient _apiClient;
  final OfflineCache _cache;

  static const _directoryCachePrefix = 'groups:directory:';
  static const _profileCachePrefix = 'groups:profile:';
  static const _managedCacheKey = 'groups:managed';
  static const _directoryTtl = Duration(minutes: 2);
  static const _profileTtl = Duration(minutes: 5);
  static const _managedCacheTtl = Duration(minutes: 2);

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
        '/groups/directory',
        query: {
          'actorId': actorId,
          if (normalizedQuery.isNotEmpty) 'query': normalizedQuery,
          if (normalizedFocus != 'all') 'focus': focus,
          if (includeEmpty) 'includeEmpty': includeEmpty,
        },
      );

      final directory = _parseDirectoryResponse(response);
      await _cache.write(cacheKey, directory.toJson(), ttl: _directoryTtl);
      return RepositoryResult<GroupDirectory>(
        data: directory,
        fromCache: false,
        lastUpdated: DateTime.now(),
      );
    } catch (error, stackTrace) {
      debugPrint('Failed to load group directory: $error\n$stackTrace');
      if (cached != null) {
        return RepositoryResult<GroupDirectory>(
          data: cached.value,
          fromCache: true,
          lastUpdated: cached.storedAt,
          error: error,
        );
      }
      rethrow;
    }
  }

  Future<RepositoryResult<List<AdminGroupSummary>>> fetchManagedGroups({
    bool forceRefresh = false,
  }) async {
    final cached = forceRefresh ? null : _readManagedCache();
    if (cached != null) {
      return RepositoryResult<List<AdminGroupSummary>>(
        data: cached.value,
        fromCache: true,
        lastUpdated: cached.storedAt,
      );
    }

    try {
      final response = await _apiClient.get(
        '/groups/managed',
        query: const {
          'includeMembers': 'true',
          'pageSize': '50',
        },
      );

      final groups = _parseManagedGroupsResponse(response);
      await _cache.write(
        _managedCacheKey,
        {
          'data': groups.map((item) => item.toJson()).toList(growable: false),
        },
        ttl: _managedCacheTtl,
      );
      return RepositoryResult<List<AdminGroupSummary>>(
        data: groups,
        fromCache: false,
        lastUpdated: DateTime.now(),
      );
    } catch (error, stackTrace) {
      debugPrint('Failed to load managed groups: $error\n$stackTrace');
      final fallback = cached ?? _readManagedCache();
      if (fallback != null) {
        return RepositoryResult<List<AdminGroupSummary>>(
          data: fallback.value,
          fromCache: true,
          lastUpdated: fallback.storedAt,
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
    final cacheKey = _profileCacheKey(actorId, groupId);
    if (!forceRefresh) {
      final cached = _cache.read<GroupProfile>(cacheKey, _parseProfileCache);
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

  Future<AdminGroupSummary> createGroup(Map<String, dynamic> payload) async {
    final response = await _apiClient.post('/groups', body: payload);
    if (response is! Map && response is! Map<String, dynamic>) {
      throw StateError('Unexpected create group response: $response');
    }
    await _cache.remove(_managedCacheKey);
    return admin_models.GroupSummary.fromJson(_coerceMap(response));
  }

  Future<AdminGroupSummary> updateGroup(int groupId, Map<String, dynamic> payload) async {
    final response = await _apiClient.put('/groups/$groupId', body: payload);
    if (response is! Map && response is! Map<String, dynamic>) {
      throw StateError('Unexpected update group response: $response');
    }
    await _cache.remove(_managedCacheKey);
    return admin_models.GroupSummary.fromJson(_coerceMap(response));
  }

  Future<GroupMember> addMember(int groupId, Map<String, dynamic> payload) async {
    final response = await _apiClient.post('/groups/$groupId/memberships', body: payload);
    if (response is! Map && response is! Map<String, dynamic>) {
      throw StateError('Unexpected add member response: $response');
    }
    await _cache.remove(_managedCacheKey);
    return admin_models.GroupMember.fromJson(_coerceMap(response));
  }

  Future<GroupMember> updateMember(int groupId, int membershipId, Map<String, dynamic> payload) async {
    final response = await _apiClient.patch('/groups/$groupId/memberships/$membershipId', body: payload);
    if (response is! Map && response is! Map<String, dynamic>) {
      throw StateError('Unexpected update member response: $response');
    }
    await _cache.remove(_managedCacheKey);
    return admin_models.GroupMember.fromJson(_coerceMap(response));
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

  CacheEntry<List<AdminGroupSummary>>? _readManagedCache() {
    try {
      return _cache.read<List<AdminGroupSummary>>(
        _managedCacheKey,
        (raw) {
          final map = _coerceMap(raw);
          final data = _coerceList(map['data'] ?? map['items'] ?? raw);
          return data
              .whereType<Map>()
              .map((item) => admin_models.GroupSummary.fromJson(_coerceMap(item)))
              .toList(growable: false);
        },
      );
    } catch (error, stackTrace) {
      debugPrint('Failed to parse managed groups cache: $error\n$stackTrace');
      return null;
    }
  }

  GroupDirectory _parseDirectoryResponse(dynamic response) {
    if (response is GroupDirectory) {
      return response;
    }
    if (response is List) {
      return community_models.GroupDirectory.fromJson({
        'items': response,
        'pagination': {
          'total': response.length,
          'limit': response.length,
          'offset': 0,
        },
        'metadata': const <String, dynamic>{},
      });
    }

    final map = _coerceMap(response);
    final meta = _coerceMap(map['meta']);
    final payload = <String, dynamic>{
      'items': _coerceList(map['items'] ?? map['data'] ?? map['groups']),
      'pagination': _coerceMap(map['pagination'] ?? meta['pagination']),
      'metadata': _coerceMap(map['metadata'] ?? meta['metadata'] ?? map['context']),
    };
    return community_models.GroupDirectory.fromJson(payload);
  }

  GroupDirectory _parseDirectoryCache(dynamic raw) {
    if (raw is GroupDirectory) {
      return raw;
    }
    final map = _coerceMap(raw);
    return community_models.GroupDirectory.fromJson(map);
  }

  GroupProfile _parseProfileResponse(dynamic response) {
    if (response is GroupProfile) {
      return response;
    }
    final map = _coerceMap(
      response is Map && response.containsKey('data') ? response['data'] : response,
    );
    return community_models.GroupProfile.fromJson(map);
  }

  GroupProfile _parseProfileCache(dynamic raw) {
    if (raw is GroupProfile) {
      return raw;
    }
    final map = _coerceMap(raw);
    return community_models.GroupProfile.fromJson(map);
  }

  List<AdminGroupSummary> _parseManagedGroupsResponse(dynamic response) {
    if (response is List) {
      return response
          .whereType<Map>()
          .map((item) => admin_models.GroupSummary.fromJson(_coerceMap(item)))
          .toList(growable: false);
    }
    final map = _coerceMap(
      response is Map && response.containsKey('data') ? response : {'data': response},
    );
    final data = _coerceList(map['data']);
    return data
        .whereType<Map>()
        .map((item) => admin_models.GroupSummary.fromJson(_coerceMap(item)))
        .toList(growable: false);
  }

  Map<String, dynamic> _coerceMap(dynamic value) {
    if (value is Map<String, dynamic>) {
      return value;
    }
    if (value is Map) {
      return Map<String, dynamic>.from(value as Map);
    }
    if (value is String && value.trim().isNotEmpty) {
      final decoded = jsonDecode(value);
      if (decoded is Map<String, dynamic>) {
        return decoded;
      }
      if (decoded is Map) {
        return Map<String, dynamic>.from(decoded as Map);
      }
    }
    return <String, dynamic>{};
  }

  List<dynamic> _coerceList(dynamic value) {
    if (value is List<dynamic>) {
      return value;
    }
    if (value is List) {
      return List<dynamic>.from(value as List);
    }
    if (value is String && value.trim().isNotEmpty) {
      final decoded = jsonDecode(value);
      if (decoded is List<dynamic>) {
        return decoded;
      }
      if (decoded is List) {
        return List<dynamic>.from(decoded as List);
      }
    }
    return const <dynamic>[];
  }

  String _profileCacheKey(int actorId, String slug) => '$_profileCachePrefix$actorId:${slug.toLowerCase()}';
}

final groupRepositoryProvider = Provider<GroupRepository>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  final cache = ref.watch(offlineCacheProvider);
  return GroupRepository(apiClient, cache);
});
