import 'package:gigvora_foundation/gigvora_foundation.dart';

import 'models/profile.dart';

class ProfileRepository {
  ProfileRepository({
    required GraphQLGateway graphQLGateway,
    required ApiClient apiClient,
    required OfflineCache cache,
    required FeatureFlagService featureFlags,
  })  : _graphQLGateway = graphQLGateway,
        _apiClient = apiClient,
        _cache = cache,
        _featureFlags = featureFlags;

  final GraphQLGateway _graphQLGateway;
  final ApiClient _apiClient;
  final OfflineCache _cache;
  final FeatureFlagService _featureFlags;

  static const _cachePrefix = 'profile:details:';
  static const _query = r'''
    query GetProfile($profileId: ID!) {
      profile(id: $profileId) {
        id
        fullName
        headline
        bio
        location
        avatarUrl
        skills
        focusAreas
        availability {
          status
          nextAvailability
          acceptingVolunteers
          acceptingLaunchpad
        }
        metrics {
          completedProjects
          responseRate
          trustScore
        }
        groups {
          id
          name
          description
        }
        references {
          id
          client
          relationship
          company
          quote
          rating
          status
          verified
          lastInteractionAt
          private
          weight
        }
        referenceSettings {
          allowPrivate
          showBadges
          autoShareToFeed
          autoRequest
          escalateConcerns
        }
        experiences {
          id
          title
          organisation
          startDate
          endDate
          summary
          achievements
        }
      }
    }
  ''';

  Future<RepositoryResult<ProfileModel>> fetchProfile(
    String profileId, {
    bool forceRefresh = false,
  }) async {
    final cacheKey = '$_cachePrefix$profileId';
    final cached = _cache.read<ProfileModel>(cacheKey, (raw) {
      if (raw is Map<String, dynamic>) {
        return ProfileModel.fromJson(raw);
      }
      if (raw is Map) {
        return ProfileModel.fromJson(Map<String, dynamic>.from(raw as Map));
      }
      throw ArgumentError('Invalid cached profile payload');
    });

    if (!forceRefresh && cached != null) {
      return RepositoryResult<ProfileModel>(
        data: cached.value,
        fromCache: true,
        lastUpdated: cached.storedAt,
      );
    }

    Object? error;
    ProfileModel? profile;
    final preferGraphQl = _featureFlags.isEnabled('mobile_profile_graphql', defaultValue: true);

    if (preferGraphQl) {
      try {
        final result = await _graphQLGateway.query(
          _query,
          operationName: 'GetProfile',
          variables: {'profileId': profileId},
          forceRefresh: forceRefresh,
          cacheTtl: const Duration(minutes: 5),
        );
        final data = result.data['profile'] ?? result.data['data'];
        if (data is Map<String, dynamic>) {
          profile = ProfileModel.fromJson(data);
        }
      } catch (err) {
        error = err;
      }
    }

    if (profile == null) {
      try {
        final response = await _apiClient.get('/profiles/$profileId');
        if (response is Map<String, dynamic>) {
          profile = ProfileModel.fromJson(response);
        }
      } catch (err) {
        error = err;
      }
    }

    if (profile != null) {
      await _cache.write(cacheKey, profile.toJson(), ttl: const Duration(minutes: 5));
      return RepositoryResult<ProfileModel>(
        data: profile,
        fromCache: false,
        lastUpdated: DateTime.now(),
        error: error,
      );
    }

    if (cached != null) {
      return RepositoryResult<ProfileModel>(
        data: cached.value,
        fromCache: true,
        lastUpdated: cached.storedAt,
        error: error,
      );
    }

    if (error != null) {
      throw error;
    }

    throw StateError('Profile $profileId could not be loaded');
  }

  Future<void> requestReferenceInvite(
    String profileId, {
    required String clientName,
    String? email,
    String? relationship,
    String? message,
  }) async {
    final payload = <String, dynamic>{
      'clientName': clientName.trim(),
      if (email != null && email.trim().isNotEmpty) 'email': email.trim(),
      if (relationship != null && relationship.trim().isNotEmpty) 'relationship': relationship.trim(),
      if (message != null && message.trim().isNotEmpty) 'message': message.trim(),
    };

    await _apiClient.post('/profiles/$profileId/references/requests', payload);
  }

  Future<ProfileReferenceSettings> updateReferenceSettings(
    String profileId,
    ProfileReferenceSettings settings,
  ) async {
    final response = await _apiClient.put(
      '/profiles/$profileId/references/settings',
      settings.toJson(),
    );

    if (response is Map<String, dynamic>) {
      return ProfileReferenceSettings.fromJson(response);
    }

    return settings;
  }
}
