import 'package:gigvora_foundation/gigvora_foundation.dart';

import 'models/role_membership.dart';

class RoleMembershipRepository {
  RoleMembershipRepository(this._apiClient, this._cache);

  final ApiClient _apiClient;
  final OfflineCache _cache;

  static const _cacheKey = 'memberships:list';
  static const _cacheTtl = Duration(minutes: 5);

  Future<RepositoryResult<List<RoleMembership>>> fetchMemberships({bool forceRefresh = false}) async {
    final cached = _cache.read<List<RoleMembership>>(_cacheKey, (raw) {
      if (raw is List) {
        return raw
            .whereType<Map>()
            .map((item) => RoleMembership.fromJson(Map<String, dynamic>.from(item as Map)))
            .toList(growable: false);
      }
      throw ArgumentError('Invalid cached membership payload');
    });

    if (!forceRefresh && cached != null) {
      return RepositoryResult<List<RoleMembership>>(
        data: cached.value,
        fromCache: true,
        lastUpdated: cached.storedAt,
      );
    }

    List<RoleMembership>? memberships;
    Object? error;

    try {
      final response = await _apiClient.get('/memberships');
      if (response is List) {
        memberships = response
            .whereType<Map>()
            .map((item) => RoleMembership.fromJson(Map<String, dynamic>.from(item as Map)))
            .toList(growable: false);
        await _cache.write(
          _cacheKey,
          memberships.map((item) => item.toJson()).toList(growable: false),
          ttl: _cacheTtl,
        );
      }
    } catch (err) {
      error = err;
    }

    if (memberships != null) {
      return RepositoryResult<List<RoleMembership>>(
        data: memberships,
        fromCache: false,
        lastUpdated: DateTime.now(),
        error: error,
      );
    }

    if (cached != null) {
      return RepositoryResult<List<RoleMembership>>(
        data: cached.value,
        fromCache: true,
        lastUpdated: cached.storedAt,
        error: error,
      );
    }

    if (error != null) {
      throw error;
    }

    throw StateError('Memberships could not be loaded');
  }

  Future<RoleMembership> createMembership(RoleMembershipDraft draft) async {
    final response = await _apiClient.post('/memberships', body: draft.toJson());
    if (response is Map<String, dynamic>) {
      await _invalidateCache();
      return RoleMembership.fromJson(response);
    }
    throw StateError('Invalid membership response');
  }

  Future<RoleMembership> updateMembership(String id, RoleMembershipUpdate update) async {
    final response = await _apiClient.patch('/memberships/$id', body: update.toJson());
    if (response is Map<String, dynamic>) {
      await _invalidateCache();
      return RoleMembership.fromJson(response);
    }
    throw StateError('Invalid membership response');
  }

  Future<RoleMembership> activateMembership(String id) async {
    final response = await _apiClient.post('/memberships/$id/activate');
    if (response is Map<String, dynamic>) {
      await _invalidateCache();
      return RoleMembership.fromJson(response);
    }
    throw StateError('Invalid membership response');
  }

  Future<void> deleteMembership(String id) async {
    await _apiClient.delete('/memberships/$id');
    await _invalidateCache();
  }

  Future<void> _invalidateCache() async {
    await _cache.remove(_cacheKey);
  }
}
