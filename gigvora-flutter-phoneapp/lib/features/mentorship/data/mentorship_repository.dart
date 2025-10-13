import 'package:gigvora_foundation/gigvora_foundation.dart';

import 'models/mentor_dashboard.dart';

class MentorshipRepository {
  MentorshipRepository(this._apiClient, this._cache);

  final ApiClient _apiClient;
  final OfflineCache _cache;

  static const _dashboardTtl = Duration(minutes: 3);

  Future<RepositoryResult<MentorDashboard>> fetchDashboard({
    int lookbackDays = 30,
    bool forceRefresh = false,
  }) async {
    final cacheKey = 'mentorship:dashboard:$lookbackDays';
    final cached = _cache.read<MentorDashboard>(cacheKey, (raw) {
      if (raw is Map) {
        return MentorDashboard.fromJson(Map<String, dynamic>.from(raw));
      }
      return const MentorDashboard();
    });

    if (!forceRefresh && cached != null) {
      return RepositoryResult<MentorDashboard>(
        data: cached.value,
        fromCache: true,
        lastUpdated: cached.storedAt,
      );
    }

    try {
      final response = await _apiClient.get('/mentors/dashboard', query: {
        'lookbackDays': lookbackDays,
      });
      if (response is! Map<String, dynamic>) {
        throw Exception('Unexpected mentor dashboard payload');
      }
      await _cache.write(cacheKey, response, ttl: _dashboardTtl);
      final dashboard = MentorDashboard.fromJson(response);
      return RepositoryResult<MentorDashboard>(
        data: dashboard,
        fromCache: false,
        lastUpdated: DateTime.now(),
      );
    } catch (error) {
      if (cached != null) {
        return RepositoryResult<MentorDashboard>(
          data: cached.value,
          fromCache: true,
          lastUpdated: cached.storedAt,
          error: error,
        );
      }
      rethrow;
    }
  }

  Future<void> saveAvailability(List<MentorAvailabilitySlot> slots) {
    return _apiClient.post('/mentors/availability', body: {
      'slots': slots.map((slot) => slot.toPayload()).toList(growable: false),
    });
  }

  Future<void> savePackages(List<MentorPackage> packages) {
    return _apiClient.post('/mentors/packages', body: {
      'packages': packages.map((pack) => pack.toJson()).toList(growable: false),
    });
  }
}
