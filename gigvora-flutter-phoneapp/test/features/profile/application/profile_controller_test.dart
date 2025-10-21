import 'dart:async';

import 'package:flutter_test/flutter_test.dart';
import 'package:gigvora_foundation/gigvora_foundation.dart';
import 'package:riverpod/riverpod.dart';

import 'package:gigvora_mobile/core/providers.dart';
import 'package:gigvora_mobile/features/profile/application/profile_controller.dart';
import 'package:gigvora_mobile/features/profile/data/models/profile.dart';
import 'package:gigvora_mobile/features/profile/data/models/profile_update.dart';
import 'package:gigvora_mobile/features/profile/data/profile_repository.dart';

import '../../../support/test_analytics_service.dart';
import '../../../support/test_feature_flag_service.dart';

void main() {
  late TestAnalyticsService analytics;
  late TestFeatureFlagService featureFlags;
  late FakeProfileRepository repository;
  late ProviderContainer container;
  late ProfileModel baseProfile;

  setUp(() {
    analytics = TestAnalyticsService();
    featureFlags = TestFeatureFlagService();
    baseProfile = createProfile();
    repository = FakeProfileRepository(
      result: RepositoryResult<ProfileModel>(
        data: baseProfile,
        fromCache: false,
        lastUpdated: DateTime(2024, 4, 1, 10),
      ),
    );

    container = ProviderContainer(
      overrides: [
        profileRepositoryProvider.overrideWithValue(repository),
        analyticsServiceProvider.overrideWithValue(analytics),
        featureFlagServiceProvider.overrideWithValue(featureFlags),
      ],
    );
    addTearDown(container.dispose);
  });

  Future<ResourceState<ProfileModel>> _readState() async {
    await pumpEventQueue(times: 2);
    return container.read(profileControllerProvider(baseProfile.id));
  }

  test('initial load hydrates profile and records analytics once', () async {
    final state = await _readState();

    expect(state.data?.id, baseProfile.id);
    expect(state.loading, isFalse);
    expect(analytics.events.map((event) => event.name), contains('mobile_profile_viewed'));

    // Second refresh should not double count the viewed event.
    repository.result = RepositoryResult<ProfileModel>(
      data: baseProfile,
      fromCache: true,
      lastUpdated: DateTime.now(),
    );
    await container.read(profileControllerProvider(baseProfile.id).notifier).refresh();
    await pumpEventQueue(times: 2);

    expect(
      analytics.events.where((event) => event.name == 'mobile_profile_viewed'),
      hasLength(1),
    );
    expect(repository.lastForceRefresh, isTrue);
  });

  test('sendReferenceInvite delegates to repository and emits analytics events', () async {
    await _readState();

    await container.read(profileControllerProvider(baseProfile.id).notifier).sendReferenceInvite(
          clientName: 'Skyler',
          email: 'skyler@example.com',
          relationship: 'Product Lead',
          message: 'Would love a quick testimonial',
        );

    expect(repository.sentInvite, isNotNull);
    expect(repository.sentInvite!.clientName, 'Skyler');
    expect(
      analytics.events.map((event) => event.name),
      containsAll(<String>['mobile_reference_invite_started', 'mobile_reference_invite_sent']),
    );
  });

  test('updateReferenceSettings persists state and analytics', () async {
    await _readState();

    repository.referenceSettingsResponse = const ProfileReferenceSettings(
      allowPrivate: false,
      autoShareToFeed: true,
      autoRequest: true,
      showBadges: true,
      escalateConcerns: false,
    );

    final controller = container.read(profileControllerProvider(baseProfile.id).notifier);
    await controller.updateReferenceSettings(const ProfileReferenceSettings(allowPrivate: true));

    final state = container.read(profileControllerProvider(baseProfile.id));
    expect(state.data?.referenceSettings.allowPrivate, isFalse);
    expect(state.data?.referenceSettings.autoShareToFeed, isTrue);
    expect(
      analytics.events.map((event) => event.name),
      contains('mobile_reference_settings_updated'),
    );
  });

  test('updateProfileDetails replaces profile payload', () async {
    await _readState();

    repository.updateProfileResponse = baseProfile.copyWith(headline: 'Director of Delivery');
    final controller = container.read(profileControllerProvider(baseProfile.id).notifier);
    await controller.updateProfileDetails(const ProfileUpdateRequest(headline: 'Director of Delivery'));

    final state = container.read(profileControllerProvider(baseProfile.id));
    expect(state.data?.headline, 'Director of Delivery');
    expect(
      analytics.events.map((event) => event.name),
      contains('mobile_profile_updated'),
    );
  });

  test('saveExperience appends created experience and refreshes analytics', () async {
    await _readState();

    repository.createExperienceResponse = const ProfileExperience(
      id: 'exp-200',
      title: 'Growth Consultant',
      organisation: 'Northwind',
      startDate: DateTime(2023, 1, 1),
      summary: 'Growth strategy',
      achievements: <String>[],
    );

    final controller = container.read(profileControllerProvider(baseProfile.id).notifier);
    await controller.saveExperience(
      const ProfileExperienceDraft(
        title: 'Growth Consultant',
        organisation: 'Northwind',
        startDate: DateTime(2023, 1, 1),
      ),
    );

    final state = container.read(profileControllerProvider(baseProfile.id));
    expect(state.data?.experiences.first.id, 'exp-200');
    expect(
      analytics.events.map((event) => event.name),
      contains('mobile_experience_saved'),
    );
  });

  test('removeExperience delegates to repository and updates state', () async {
    await _readState();
    final controller = container.read(profileControllerProvider(baseProfile.id).notifier);

    await controller.removeExperience('exp-1');

    final state = container.read(profileControllerProvider(baseProfile.id));
    expect(state.data?.experiences.any((exp) => exp.id == 'exp-1'), isFalse);
    expect(repository.deletedExperienceIds, contains('exp-1'));
    expect(
      analytics.events.map((event) => event.name),
      contains('mobile_experience_deleted'),
    );
  });
}

ProfileModel createProfile() {
  return ProfileModel(
    id: 'user-100',
    fullName: 'Morgan Quinn',
    headline: 'Principal Delivery Lead',
    bio: 'Works across delivery pods to unblock launches.',
    location: 'Remote',
    skills: const <String>['Delivery', 'Leadership'],
    groups: const <ProfileGroup>[ProfileGroup(id: 'grp-1', name: 'Guild')],
    availability: const ProfileAvailability(status: 'available_now'),
    experiences: const <ProfileExperience>[
      ProfileExperience(
        id: 'exp-1',
        title: 'Delivery Lead',
        organisation: 'Gigvora',
        startDate: DateTime(2021, 1, 1),
        achievements: <String>[],
      ),
    ],
    metrics: const <ProfileMetric>[ProfileMetric(key: 'trust_score', value: 4.9, label: 'Trust score')],
    focusAreas: const <String>['workflow'],
    references: const <ProfileReference>[],
    referenceSettings: const ProfileReferenceSettings(),
  );
}

class FakeProfileRepository implements ProfileRepository {
  FakeProfileRepository({required this.result});

  RepositoryResult<ProfileModel> result;
  RepositoryResult<ProfileModel>? lastFetch;
  ProfileReferenceSettings? referenceSettingsResponse;
  ProfileModel? updateProfileResponse;
  ProfileExperience? createExperienceResponse;
  ProfileExperience? updateExperienceResponse;
  InvitePayload? sentInvite;
  final List<String> deletedExperienceIds = <String>[];
  bool lastForceRefresh = false;

  @override
  Future<RepositoryResult<ProfileModel>> fetchProfile(String profileId, {bool forceRefresh = false}) async {
    lastForceRefresh = forceRefresh;
    lastFetch = result;
    return result;
  }

  @override
  Future<void> requestReferenceInvite(
    String profileId, {
    required String clientName,
    String? email,
    String? relationship,
    String? message,
  }) async {
    sentInvite = InvitePayload(
      clientName: clientName,
      email: email,
      relationship: relationship,
      message: message,
    );
  }

  @override
  Future<ProfileReferenceSettings> updateReferenceSettings(
    String profileId,
    ProfileReferenceSettings settings,
  ) async {
    return referenceSettingsResponse ?? settings;
  }

  @override
  Future<ProfileModel> updateProfile(String profileId, ProfileUpdateRequest request) async {
    return updateProfileResponse ?? result.data!;
  }

  @override
  Future<ProfileExperience> createExperience(String profileId, ProfileExperienceDraft draft) async {
    return createExperienceResponse ??
        ProfileExperience(
          id: 'generated-${draft.title}',
          title: draft.title,
          organisation: draft.organisation,
          startDate: draft.startDate,
          endDate: draft.endDate,
          summary: draft.summary,
          achievements: draft.achievements,
        );
  }

  @override
  Future<ProfileExperience> updateExperience(
    String profileId,
    String experienceId,
    ProfileExperienceDraft draft,
  ) async {
    return updateExperienceResponse ??
        ProfileExperience(
          id: experienceId,
          title: draft.title,
          organisation: draft.organisation,
          startDate: draft.startDate,
          endDate: draft.endDate,
          summary: draft.summary,
          achievements: draft.achievements,
        );
  }

  @override
  Future<void> deleteExperience(String profileId, String experienceId) async {
    deletedExperienceIds.add(experienceId);
  }
}

class InvitePayload {
  InvitePayload({
    required this.clientName,
    this.email,
    this.relationship,
    this.message,
  });

  final String clientName;
  final String? email;
  final String? relationship;
  final String? message;
}
