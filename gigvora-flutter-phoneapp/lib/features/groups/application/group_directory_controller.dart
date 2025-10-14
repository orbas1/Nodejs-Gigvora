import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gigvora_foundation/gigvora_foundation.dart';

import '../../auth/application/session_controller.dart';
import '../../core/providers.dart';
import '../data/group_repository.dart';
import '../data/models/group_models.dart';

const _communityMemberships = <String>{
  'user',
  'freelancer',
  'agency',
  'company',
  'mentor',
  'headhunter',
};

class GroupFeedbackMessage {
  const GroupFeedbackMessage({required this.type, required this.message});

  final GroupFeedbackType type;
  final String message;

  static GroupFeedbackMessage success(String message) =>
      GroupFeedbackMessage(type: GroupFeedbackType.success, message: message);

  static GroupFeedbackMessage neutral(String message) =>
      GroupFeedbackMessage(type: GroupFeedbackType.neutral, message: message);

  static GroupFeedbackMessage error(String message) =>
      GroupFeedbackMessage(type: GroupFeedbackType.error, message: message);
}

enum GroupFeedbackType { success, neutral, error }

class GroupDirectoryState {
  const GroupDirectoryState({
    required this.actorId,
    required this.memberships,
    required this.directory,
    this.query = '',
    this.focus = 'all',
    this.includeEmpty = false,
    this.pendingGroupSlug,
    this.feedback,
    this.lastRequestedAt,
    this.accessRestricted = false,
    this.initialised = false,
  });

  final int? actorId;
  final List<String> memberships;
  final ResourceState<GroupDirectory> directory;
  final String query;
  final String focus;
  final bool includeEmpty;
  final String? pendingGroupSlug;
  final GroupFeedbackMessage? feedback;
  final DateTime? lastRequestedAt;
  final bool accessRestricted;
  final bool initialised;

  bool get canAccess => !accessRestricted && actorId != null && actorId! > 0;

  GroupDirectoryState copyWith({
    int? actorId,
    List<String>? memberships,
    ResourceState<GroupDirectory>? directory,
    String? query,
    String? focus,
    bool? includeEmpty,
    String? pendingGroupSlug,
    GroupFeedbackMessage? feedback,
    bool feedbackSet = false,
    DateTime? lastRequestedAt,
    bool? accessRestricted,
    bool? initialised,
  }) {
    return GroupDirectoryState(
      actorId: actorId ?? this.actorId,
      memberships: memberships ?? this.memberships,
      directory: directory ?? this.directory,
      query: query ?? this.query,
      focus: focus ?? this.focus,
      includeEmpty: includeEmpty ?? this.includeEmpty,
      pendingGroupSlug: pendingGroupSlug ?? this.pendingGroupSlug,
      feedback: feedbackSet ? feedback : this.feedback,
      lastRequestedAt: lastRequestedAt ?? this.lastRequestedAt,
      accessRestricted: accessRestricted ?? this.accessRestricted,
      initialised: initialised ?? this.initialised,
    );
  }
}

class GroupsController extends StateNotifier<GroupDirectoryState> {
  GroupsController(
    this._repository,
    this._analytics, {
    required int? actorId,
    required List<String> memberships,
  }) : super(
          GroupDirectoryState(
            actorId: actorId,
            memberships: List<String>.unmodifiable(memberships),
            directory: ResourceState<GroupDirectory>.loading(),
            accessRestricted: !_hasCommunityAccess(memberships),
          ),
        ) {
    _bootstrap();
  }

  final GroupRepository _repository;
  final AnalyticsService _analytics;
  Timer? _debounce;
  bool _viewTracked = false;

  static bool _hasCommunityAccess(List<String> memberships) {
    if (memberships.isEmpty) {
      return false;
    }
    for (final membership in memberships) {
      if (_communityMemberships.contains(membership.toLowerCase())) {
        return true;
      }
    }
    return false;
  }

  Future<void> _bootstrap() async {
    if (state.canAccess) {
      await loadDirectory();
    }
  }

  @override
  void dispose() {
    _debounce?.cancel();
    super.dispose();
  }

  void updateQuery(String value) {
    if (value == state.query) {
      return;
    }
    state = state.copyWith(query: value);
    _scheduleRefresh();
  }

  void updateFocus(String focus) {
    if (focus == state.focus) {
      return;
    }
    state = state.copyWith(focus: focus);
    _scheduleRefresh(immediate: true);
  }

  void toggleIncludeEmpty(bool value) {
    if (value == state.includeEmpty) {
      return;
    }
    state = state.copyWith(includeEmpty: value);
    _scheduleRefresh(immediate: true);
  }

  Future<void> loadDirectory({bool forceRefresh = false}) async {
    if (!state.canAccess) {
      state = state.copyWith(
        directory: state.directory.copyWith(
          loading: false,
          error: StateError('Community access is required to view groups.'),
        ),
        initialised: true,
      );
      return;
    }

    final current = state.directory;
    state = state.copyWith(
      directory: current.copyWith(loading: true, error: null),
      initialised: true,
      feedback: null,
      feedbackSet: true,
    );

    try {
      final result = await _repository.fetchDirectory(
        actorId: state.actorId!,
        query: state.query,
        focus: state.focus == 'all' ? null : state.focus,
        includeEmpty: state.includeEmpty,
        forceRefresh: forceRefresh,
      );
      final now = DateTime.now();
      final metadata = {
        ...current.metadata,
        'query': state.query,
        'focus': state.focus,
        'includeEmpty': state.includeEmpty,
        'requestedAt': now.toIso8601String(),
      };
      state = state.copyWith(
        directory: ResourceState<GroupDirectory>(
          data: result.data,
          loading: false,
          error: result.error,
          fromCache: result.fromCache,
          lastUpdated: result.lastUpdated ?? now,
          metadata: metadata,
        ),
        lastRequestedAt: now,
        feedback: null,
        feedbackSet: true,
      );

      if (!_viewTracked) {
        _viewTracked = true;
        unawaited(
          _analytics.track(
            'mobile_groups_directory_viewed',
            context: {
              'groupCount': result.data.items.length,
              'fromCache': result.fromCache,
            },
            metadata: const {'source': 'mobile_app'},
          ),
        );
      }
    } catch (error) {
      state = state.copyWith(
        directory: current.copyWith(loading: false, error: error),
      );
    }
  }

  Future<void> joinGroup(GroupSummary group) async {
    if (!state.canAccess) {
      state = state.copyWith(
        feedback: GroupFeedbackMessage.error('Sign in with a community-enabled workspace to join groups.'),
      );
      return;
    }

    state = state.copyWith(pendingGroupSlug: group.slug, feedback: null, feedbackSet: true);
    try {
      final profile = await _repository.joinGroup(group.slug, actorId: state.actorId!);
      _applyProfileToDirectory(profile);
      state = state.copyWith(
        pendingGroupSlug: null,
        feedback: GroupFeedbackMessage.success('You are now a member of ${profile.name}.'),
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
      await loadDirectory(forceRefresh: true);
    } catch (error) {
      state = state.copyWith(
        pendingGroupSlug: null,
        feedback: GroupFeedbackMessage.error(_humanizeError(error)),
        feedbackSet: true,
      );
    }
  }

  Future<void> leaveGroup(GroupSummary group) async {
    if (!state.canAccess) {
      return;
    }
    state = state.copyWith(pendingGroupSlug: group.slug, feedback: null, feedbackSet: true);
    try {
      final profile = await _repository.leaveGroup(group.slug, actorId: state.actorId!);
      _applyProfileToDirectory(profile);
      state = state.copyWith(
        pendingGroupSlug: null,
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
      await loadDirectory(forceRefresh: true);
    } catch (error) {
      state = state.copyWith(
        pendingGroupSlug: null,
        feedback: GroupFeedbackMessage.error(_humanizeError(error)),
        feedbackSet: true,
      );
    }
  }

  void _applyProfileToDirectory(GroupProfile profile) {
    final directory = state.directory.data;
    if (directory == null) {
      return;
    }
    final updated = <GroupSummary>[];
    var replaced = false;
    for (final item in directory.items) {
      if (!replaced && (item.slug == profile.slug || item.id == profile.id)) {
        updated.add(
          item.copyWith(
            membership: profile.membership,
            stats: profile.stats,
          ),
        );
        replaced = true;
      } else {
        updated.add(item);
      }
    }
    if (!replaced) {
      updated.insert(0, profile);
    }
    final nextDirectory = GroupDirectory(
      items: List<GroupSummary>.unmodifiable(updated),
      pagination: directory.pagination,
      metadata: directory.metadata,
    );
    state = state.copyWith(
      directory: state.directory.copyWith(data: nextDirectory),
    );
  }

  void _scheduleRefresh({bool immediate = false}) {
    _debounce?.cancel();
    if (immediate) {
      unawaited(loadDirectory(forceRefresh: true));
      return;
    }
    _debounce = Timer(const Duration(milliseconds: 320), () {
      unawaited(loadDirectory(forceRefresh: true));
    });
  }

  String _humanizeError(Object error) {
    if (error is ApiException) {
      return error.message;
    }
    return error.toString();
  }
}

final groupsControllerProvider =
    StateNotifierProvider<GroupsController, GroupDirectoryState>((ref) {
  final repository = ref.watch(groupRepositoryProvider);
  final analytics = ref.watch(analyticsServiceProvider);
  final sessionState = ref.watch(sessionControllerProvider);
  final session = sessionState.session;
  return GroupsController(
    repository,
    analytics,
    actorId: session?.actorId,
    memberships: session?.memberships ?? const <String>[],
  );
});
