import 'package:gigvora_foundation/gigvora_foundation.dart';

import '../../../core/providers.dart';
import 'models/reputation.dart';

class ReputationRepository {
  ReputationRepository({
    required ApiClient apiClient,
    required OfflineCache cache,
  })  : _apiClient = apiClient,
        _cache = cache;

  final ApiClient _apiClient;
  final OfflineCache _cache;

  static const _cachePrefix = 'profile:reputation:';
  static const _cacheTtl = Duration(minutes: 5);

  Future<RepositoryResult<ReputationOverview>> fetchOverview(
    String freelancerId, {
    bool forceRefresh = false,
  }) async {
    final cacheKey = '$_cachePrefix$freelancerId';
    final cached = _cache.read<ReputationOverview>(cacheKey, (raw) {
      if (raw is Map<String, dynamic>) {
        return ReputationOverview.fromJson(raw);
      }
      if (raw is Map) {
        return ReputationOverview.fromJson(
          Map<String, dynamic>.from(raw as Map),
        );
      }
      throw ArgumentError('Invalid cached reputation payload');
    });

    if (!forceRefresh && cached != null) {
      return RepositoryResult<ReputationOverview>(
        data: cached.value,
        fromCache: true,
        lastUpdated: cached.storedAt,
      );
    }

    Object? error;
    ReputationOverview? overview;

    try {
      final response = await _apiClient.get('/reputation/freelancers/$freelancerId');
      if (response is Map<String, dynamic>) {
        overview = ReputationOverview.fromJson(response);
      } else if (response is Map) {
        overview = ReputationOverview.fromJson(
          Map<String, dynamic>.from(response as Map),
        );
      }
    } catch (err) {
      error = err;
    }

    if (overview != null) {
      await _cache.write(cacheKey, overview.toJson(), ttl: _cacheTtl);
      return RepositoryResult<ReputationOverview>(
        data: overview,
        fromCache: false,
        lastUpdated: DateTime.now(),
        error: error,
      );
    }

    if (cached != null) {
      return RepositoryResult<ReputationOverview>(
        data: cached.value,
        fromCache: true,
        lastUpdated: cached.storedAt,
        error: error,
      );
    }

    if (error != null) {
      throw error;
    }

    throw StateError('Reputation overview for $freelancerId could not be loaded');
  }
}
