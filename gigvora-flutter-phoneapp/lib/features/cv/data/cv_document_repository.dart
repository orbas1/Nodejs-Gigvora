import 'package:flutter/foundation.dart';
import 'package:gigvora_foundation/gigvora_foundation.dart';

import 'models/cv_workspace_snapshot.dart';

class CvDocumentRepository {
  CvDocumentRepository(this._apiClient, this._cache);

  final ApiClient _apiClient;
  final OfflineCache _cache;

  static const _ttl = Duration(minutes: 3);

  String _cacheKey(int userId) => 'cv-workspace:user:$userId';

  Future<RepositoryResult<CvWorkspaceSnapshot>> fetchWorkspace(
    int userId, {
    bool forceRefresh = false,
    Map<String, String>? headers,
  }) async {
    final cacheKey = _cacheKey(userId);
    CacheEntry<CvWorkspaceSnapshot>? cached;
    try {
      cached = _cache.read<CvWorkspaceSnapshot>(cacheKey, (raw) {
        if (raw is Map) {
          return CvWorkspaceSnapshot.fromJson(Map<String, dynamic>.from(raw as Map));
        }
        return CvWorkspaceSnapshot.fromJson(const <String, dynamic>{});
      });
    } catch (error, stackTrace) {
      debugPrint('Failed to parse cached CV workspace snapshot: $error\n$stackTrace');
      cached = null;
    }

    if (!forceRefresh && cached != null) {
      return RepositoryResult<CvWorkspaceSnapshot>(
        data: cached.value,
        fromCache: true,
        lastUpdated: cached.storedAt,
      );
    }

    try {
      final response = await _apiClient.get(
        '/users/$userId/cv-documents/workspace',
        headers: headers,
      );
      if (response is! Map<String, dynamic>) {
        throw ApiException(500, 'Unexpected response when loading CV workspace');
      }
      await _cache.write(cacheKey, response, ttl: _ttl);
      final snapshot = CvWorkspaceSnapshot.fromJson(response);
      return RepositoryResult<CvWorkspaceSnapshot>(
        data: snapshot,
        fromCache: false,
        lastUpdated: DateTime.now(),
      );
    } catch (error) {
      if (cached != null) {
        return RepositoryResult<CvWorkspaceSnapshot>(
          data: cached.value,
          fromCache: true,
          lastUpdated: cached.storedAt,
          error: error,
        );
      }
      rethrow;
    }
  }

  Future<CvDocument> createDocument(
    int userId,
    CvDocumentDraft draft, {
    Map<String, String>? headers,
  }) async {
    final response = await _apiClient.post(
      '/users/$userId/cv-documents',
      body: draft.toJson(),
      headers: headers,
    );
    if (response is! Map<String, dynamic>) {
      throw ApiException(500, 'Unexpected response when creating CV document');
    }
    await _cache.remove(_cacheKey(userId));
    return CvDocument.fromJson(response);
  }

  Future<CvDocument> uploadVersion(
    int userId,
    int documentId,
    CvVersionUpload upload, {
    Map<String, String>? headers,
  }) async {
    final response = await _apiClient.post(
      '/users/$userId/cv-documents/$documentId/upload',
      body: upload.toJson(),
      headers: headers,
    );
    if (response is! Map<String, dynamic>) {
      throw ApiException(500, 'Unexpected response when uploading CV version');
    }
    await _cache.remove(_cacheKey(userId));
    return CvDocument.fromJson(response);
  }
}

final cvDocumentRepositoryProvider = Provider<CvDocumentRepository>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  final cache = ref.watch(offlineCacheProvider);
  return CvDocumentRepository(apiClient, cache);
});
