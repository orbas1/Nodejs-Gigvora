import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gigvora_foundation/gigvora_foundation.dart';

import '../../auth/application/session_controller.dart';
import '../../core/providers.dart';
import '../data/group_repository.dart';
import '../data/models/group_models.dart';
import 'group_directory_controller.dart';

class GroupProfileState {
  const GroupProfileState({
    required this.groupId,
    required this.actorId,
    required this.resource,
    this.pending = false,
    this.feedback,
    this.accessDenied = false,
  });

  final String groupId;
  final int? actorId;
  final ResourceState<GroupProfile> resource;
  final bool pending;
  final GroupFeedbackMessage? feedback;
  final bool accessDenied;

  GroupProfileState copyWith({
    String? groupId,
    int? actorId,
    ResourceState<GroupProfile>? resource,
    bool? pending,
    GroupFeedbackMessage? feedback,
    bool feedbackSet = false,
    bool? accessDenied,
  }) {
    return GroupProfileState(
      groupId: groupId ?? this.groupId,
      actorId: actorId ?? this.actorId,
      resource: resource ?? this.resource,
      pending: pending ?? this.pending,
      feedback: feedbackSet ? feedback : this.feedback,
      accessDenied: accessDenied ?? this.accessDenied,
    );
  }
}

class GroupProfileController extends StateNotifier<GroupProfileState> {
  GroupProfileController(
    this._repository,
    this._analytics, {
    required String groupId,
    required int? actorId,
  }) : super(
          GroupProfileState(
            groupId: groupId,
            actorId: actorId,
            resource: ResourceState<GroupProfile>.loading(),
          ),
        ) {
    _load();
  }

  final GroupRepository _repository;
  final AnalyticsService _analytics;
  bool _viewTracked = false;

  Future<void> _load({bool forceRefresh = false}) async {
    final actorId = state.actorId;
    if (actorId == null || actorId <= 0) {
      state = state.copyWith(
        resource: ResourceState<GroupProfile>.error(
          StateError('Sign in to view community details.'),
        ),
        accessDenied: true,
      );
      return;
    }

    state = state.copyWith(
      resource: state.resource.copyWith(loading: true, error: null),
      pending: false,
      feedback: null,
      feedbackSet: true,
    );

    try {
      final profile = await _repository.fetchProfile(state.groupId, actorId: actorId, forceRefresh: forceRefresh);
      state = state.copyWith(
        resource: ResourceState<GroupProfile>(
          data: profile,
          loading: false,
          fromCache: false,
          lastUpdated: DateTime.now(),
          metadata: state.resource.metadata,
        ),
        accessDenied: false,
        pending: false,
        feedback: null,
        feedbackSet: true,
      );
      if (!_viewTracked) {
        _viewTracked = true;
        unawaited(
          _analytics.track(
            'mobile_group_profile_viewed',
            context: {
              'groupId': profile.id,
              'groupSlug': profile.slug,
              'joinPolicy': profile.joinPolicy,
            },
            metadata: const {'source': 'mobile_app'},
          ),
        );
      }
    } catch (error) {
      final isForbidden = error is ApiException && error.statusCode == 403;
      state = state.copyWith(
        resource: state.resource.copyWith(loading: false, error: error),
        accessDenied: isForbidden,
      );
    }
  }

  Future<void> refresh() => _load(forceRefresh: true);

  Future<void> join() async {
    final actorId = state.actorId;
    if (actorId == null || actorId <= 0) {
      state = state.copyWith(
        feedback: GroupFeedbackMessage.error('Sign in with an eligible workspace to join this community.'),
        feedbackSet: true,
      );
      return;
    }
    state = state.copyWith(pending: true, feedback: null, feedbackSet: true);
    try {
      final profile = await _repository.joinGroup(state.groupId, actorId: actorId);
      state = state.copyWith(
        resource: ResourceState<GroupProfile>(
          data: profile,
          loading: false,
          lastUpdated: DateTime.now(),
        ),
        pending: false,
        feedback: GroupFeedbackMessage.success('Welcome to ${profile.name}!'),
        feedbackSet: true,
      );
      unawaited(
        _analytics.track(
          'mobile_group_joined',
          context: {
            'groupId': profile.id,
            'groupSlug': profile.slug,
          },
          metadata: const {'source': 'mobile_app'},
        ),
      );
    } catch (error) {
      state = state.copyWith(
        pending: false,
        feedback: GroupFeedbackMessage.error(_humanize(error)),
        feedbackSet: true,
      );
    }
  }

  Future<void> leave() async {
    final actorId = state.actorId;
    if (actorId == null || actorId <= 0) {
      return;
    }
    state = state.copyWith(pending: true, feedback: null, feedbackSet: true);
    try {
      final profile = await _repository.leaveGroup(state.groupId, actorId: actorId);
      state = state.copyWith(
        resource: ResourceState<GroupProfile>(
          data: profile,
          loading: false,
          lastUpdated: DateTime.now(),
        ),
        pending: false,
        feedback: GroupFeedbackMessage.neutral('You have left ${profile.name}.'),
        feedbackSet: true,
      );
      unawaited(
        _analytics.track(
          'mobile_group_left',
          context: {
            'groupId': profile.id,
            'groupSlug': profile.slug,
          },
          metadata: const {'source': 'mobile_app'},
        ),
      );
    } catch (error) {
      state = state.copyWith(
        pending: false,
        feedback: GroupFeedbackMessage.error(_humanize(error)),
        feedbackSet: true,
      );
    }
  }

  Future<void> updateNotifications(GroupNotificationPreferences preferences) async {
    final actorId = state.actorId;
    if (actorId == null || actorId <= 0) {
      return;
    }
    state = state.copyWith(pending: true, feedback: null, feedbackSet: true);
    try {
      final profile = await _repository.updateMembership(
        state.groupId,
        actorId: actorId,
        notifications: preferences,
      );
      state = state.copyWith(
        resource: ResourceState<GroupProfile>(
          data: profile,
          loading: false,
          lastUpdated: DateTime.now(),
        ),
        pending: false,
        feedback: GroupFeedbackMessage.success('Notification preferences updated.'),
        feedbackSet: true,
      );
      unawaited(
        _analytics.track(
          'mobile_group_preferences_updated',
          context: {
            'groupId': profile.id,
            'groupSlug': profile.slug,
          },
          metadata: const {'source': 'mobile_app'},
        ),
      );
    } catch (error) {
      state = state.copyWith(
        pending: false,
        feedback: GroupFeedbackMessage.error(_humanize(error)),
        feedbackSet: true,
      );
    }
  }

  String _humanize(Object error) {
    if (error is ApiException) {
      return error.message;
    }
    return error.toString();
  }
}

final groupProfileControllerProvider = StateNotifierProvider.family<
    GroupProfileController, GroupProfileState, String>((ref, groupId) {
  final repository = ref.watch(groupRepositoryProvider);
  final analytics = ref.watch(analyticsServiceProvider);
  final sessionState = ref.watch(sessionControllerProvider);
  return GroupProfileController(
    repository,
    analytics,
    groupId: groupId,
    actorId: sessionState.session?.actorId,
  );
});
