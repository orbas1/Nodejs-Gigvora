import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gigvora_foundation/gigvora_foundation.dart';

import '../../../core/providers.dart';
import '../data/models/profile.dart';
import '../data/profile_repository.dart';

class ProfileController extends StateNotifier<ResourceState<ProfileModel>> {
  ProfileController(
    this._repository,
    this._analytics,
    this._featureFlags, {
    required this.profileId,
  }) : super(ResourceState<ProfileModel>.loading()) {
    _initialise();
  }

  final ProfileRepository _repository;
  final AnalyticsService _analytics;
  final FeatureFlagService _featureFlags;
  final String profileId;
  bool _viewTracked = false;

  Future<void> _initialise() async {
    await _featureFlags.bootstrap();
    await load();
  }

  Future<void> load({bool forceRefresh = false}) async {
    state = state.copyWith(loading: true, error: null);
    try {
      final result = await _repository.fetchProfile(profileId, forceRefresh: forceRefresh);
      state = ResourceState<ProfileModel>(
        data: result.data,
        loading: false,
        error: result.error,
        fromCache: result.fromCache,
        lastUpdated: result.lastUpdated,
        metadata: {
          'source': result.fromCache ? 'cache' : 'network',
          'flags': _featureFlags.snapshot,
        },
      );

      if (!_viewTracked) {
        _viewTracked = true;
        await _analytics.track(
          'mobile_profile_viewed',
          context: {
            'profileId': profileId,
            'source': result.fromCache ? 'cache' : 'network',
          },
          metadata: const {'source': 'mobile_app'},
        );
      }

      if (result.error != null) {
        await _analytics.track(
          'mobile_profile_partial',
          context: {
            'profileId': profileId,
            'reason': '${result.error}',
          },
          metadata: const {'source': 'mobile_app'},
        );
      }
    } catch (error) {
      state = ResourceState<ProfileModel>.error(
        error,
        data: state.data,
        fromCache: state.fromCache,
        lastUpdated: state.lastUpdated,
        metadata: {
          'source': 'error',
          'flags': _featureFlags.snapshot,
        },
      );
      unawaited(
        _analytics.track(
          'mobile_profile_failed',
          context: {
            'profileId': profileId,
            'reason': '$error',
          },
          metadata: const {'source': 'mobile_app'},
        ),
      );
    }
  }

  Future<void> refresh() => load(forceRefresh: true);

  Future<void> recordSkillTap(String skill) {
    return _analytics.track(
      'mobile_profile_skill_selected',
      context: {
        'profileId': profileId,
        'skill': skill,
      },
      metadata: const {'source': 'mobile_app'},
    );
  }

  Future<void> recordGroupTap(ProfileGroup group) {
    return _analytics.track(
      'mobile_profile_group_selected',
      context: {
        'profileId': profileId,
        'groupId': group.id,
        'groupName': group.name,
      },
      metadata: const {'source': 'mobile_app'},
    );
  }

  Future<void> sendReferenceInvite({
    required String clientName,
    String? email,
    String? relationship,
    String? message,
  }) async {
    await _analytics.track(
      'mobile_reference_invite_started',
      context: {
        'profileId': profileId,
        'clientName': clientName,
      },
      metadata: const {'source': 'mobile_app'},
    );

    try {
      await _repository.requestReferenceInvite(
        profileId,
        clientName: clientName,
        email: email,
        relationship: relationship,
        message: message,
      );

      await _analytics.track(
        'mobile_reference_invite_sent',
        context: {
          'profileId': profileId,
          'clientName': clientName,
        },
        metadata: const {'source': 'mobile_app'},
      );

      await refresh();
    } catch (error) {
      await _analytics.track(
        'mobile_reference_invite_failed',
        context: {
          'profileId': profileId,
          'clientName': clientName,
          'reason': '$error',
        },
        metadata: const {'source': 'mobile_app'},
      );
      rethrow;
    }
  }

  Future<void> updateReferenceSettings(ProfileReferenceSettings settings) async {
    final current = state.data;
    if (current == null) {
      throw StateError('Profile not loaded');
    }

    final previous = current.referenceSettings;
    final optimistic = current.copyWith(referenceSettings: settings);
    state = state.copyWith(data: optimistic);

    try {
      final persisted = await _repository.updateReferenceSettings(profileId, settings);
      state = state.copyWith(data: optimistic.copyWith(referenceSettings: persisted));

      await _analytics.track(
        'mobile_reference_settings_updated',
        context: {
          'profileId': profileId,
          'allowPrivate': persisted.allowPrivate,
          'showBadges': persisted.showBadges,
          'autoShareToFeed': persisted.autoShareToFeed,
          'autoRequest': persisted.autoRequest,
          'escalateConcerns': persisted.escalateConcerns,
        },
        metadata: const {'source': 'mobile_app'},
      );
    } catch (error) {
      state = state.copyWith(data: current.copyWith(referenceSettings: previous));
      await _analytics.track(
        'mobile_reference_settings_failed',
        context: {
          'profileId': profileId,
          'reason': '$error',
        },
        metadata: const {'source': 'mobile_app'},
      );
      rethrow;
    }
  }
}

final profileRepositoryProvider = Provider<ProfileRepository>((ref) {
  final graphQl = ref.watch(graphQlGatewayProvider);
  final api = ref.watch(apiClientProvider);
  final cache = ref.watch(offlineCacheProvider);
  final featureFlags = ref.watch(featureFlagServiceProvider);
  return ProfileRepository(
    graphQLGateway: graphQl,
    apiClient: api,
    cache: cache,
    featureFlags: featureFlags,
  );
});

final profileControllerProvider = StateNotifierProvider.family<ProfileController, ResourceState<ProfileModel>, String>((ref, profileId) {
  final repository = ref.watch(profileRepositoryProvider);
  final analytics = ref.watch(analyticsServiceProvider);
  final featureFlags = ref.watch(featureFlagServiceProvider);
  return ProfileController(repository, analytics, featureFlags, profileId: profileId);
});
