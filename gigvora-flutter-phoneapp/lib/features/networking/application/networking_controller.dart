import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gigvora_foundation/gigvora_foundation.dart';

import '../../../core/providers.dart';
import '../data/models/networking_overview.dart';
import '../data/networking_repository.dart';

class NetworkingController extends StateNotifier<ResourceState<NetworkingOverviewBundle>> {
  NetworkingController(this._repository, this._analytics, {this.lookbackDays = 180, int? initialWorkspace})
      : _workspaceId = initialWorkspace,
        super(ResourceState<NetworkingOverviewBundle>.loading(const NetworkingOverviewBundle(
          overview: NetworkingOverview(
            sessions: NetworkingSessionsAnalytics(
              total: 0,
              active: 0,
              upcoming: 0,
              completed: 0,
              draft: 0,
              cancelled: 0,
              averageJoinLimit: null,
              rotationDurationSeconds: null,
              registered: 0,
              waitlist: 0,
              checkedIn: 0,
              completedAttendees: 0,
              paid: 0,
              free: 0,
              revenueCents: 0,
              averagePriceCents: null,
              satisfactionAverage: null,
              list: const <NetworkingSession>[],
            ),
            scheduling: NetworkingSchedulingAnalytics(
              preRegistrations: 0,
              waitlist: 0,
              remindersSent: 0,
              searches: 0,
              sponsorSlots: 0,
            ),
            monetization: NetworkingMonetizationAnalytics(
              paid: 0,
              free: 0,
              revenueCents: 0,
              averagePriceCents: null,
            ),
            penalties: NetworkingPenaltyAnalytics(
              noShowRate: null,
              activePenalties: 0,
              restrictedParticipants: 0,
              cooldownDays: 14,
            ),
            attendeeExperience: NetworkingAttendeeExperience(
              profilesShared: 0,
              connectionsSaved: 0,
              averageMessagesPerSession: 0,
              followUpsScheduled: 0,
            ),
            digitalCards: NetworkingDigitalCardAnalytics(
              created: 0,
              updatedThisWeek: 0,
              sharedInSession: 0,
              templates: 3,
              available: 0,
            ),
            video: NetworkingVideoAnalytics(
              averageQualityScore: null,
              browserLoadShare: null,
              hostAnnouncements: 0,
              failoverRate: null,
            ),
            showcase: NetworkingShowcase(
              featuredSessionId: null,
              librarySize: 0,
              cardsAvailable: 0,
              highlights: const ['Timed rotations', 'Digital business cards', 'Browser-based video'],
            ),
          ),
          permittedWorkspaceIds: const <int>[],
          selectedWorkspaceId: null,
        ), const {
          'selectedWorkspaceId': null,
          'selectedSessionId': null,
        })) {
    load();
  }

  final NetworkingRepository _repository;
  final AnalyticsService _analytics;
  final int lookbackDays;
  int? _workspaceId;
  bool _viewTracked = false;

  Future<void> load({bool forceRefresh = false}) async {
    state = state.copyWith(loading: true, error: null);
    try {
      final result = await _repository.fetchOverview(
        companyId: _workspaceId,
        lookbackDays: lookbackDays,
        forceRefresh: forceRefresh,
      );
      final bundle = result.data;
      final sessions = bundle.overview.sessions.list;
      final metadata = Map<String, dynamic>.from(state.metadata);
      _workspaceId = bundle.selectedWorkspaceId ?? _workspaceId;
      metadata['selectedWorkspaceId'] = _workspaceId;
      final selectedSessionId = metadata['selectedSessionId'] as int?;
      final resolvedSessionId =
          selectedSessionId != null && sessions.any((session) => session.id == selectedSessionId)
              ? selectedSessionId
              : sessions.isNotEmpty
                  ? sessions.first.id
                  : null;
      metadata['selectedSessionId'] = resolvedSessionId;

      state = ResourceState<NetworkingOverviewBundle>(
        data: bundle,
        loading: false,
        error: result.error,
        fromCache: result.fromCache,
        lastUpdated: result.lastUpdated,
        metadata: metadata,
      );

      await _recordView(bundle, fromCache: result.fromCache);

      await _analytics.track(
        'mobile_networking_overview_loaded',
        context: {
          'workspaceId': _workspaceId,
          'sessionCount': sessions.length,
          'fromCache': result.fromCache,
          'lookbackDays': lookbackDays,
        },
        metadata: const {'source': 'mobile_app'},
      );
    } catch (error) {
      state = state.copyWith(loading: false, error: error);
      await _analytics.track(
        'mobile_networking_overview_failed',
        context: {
          'workspaceId': _workspaceId,
          'reason': '$error',
        },
        metadata: const {'source': 'mobile_app'},
      );
    }
  }

  Future<void> refresh() async {
    await _analytics.track(
      'mobile_networking_overview_refresh',
      context: {
        'workspaceId': _workspaceId,
        'lookbackDays': lookbackDays,
      },
      metadata: const {'source': 'mobile_app'},
    );
    await load(forceRefresh: true);
  }

  Future<void> selectWorkspace(int? workspaceId) async {
    if (workspaceId == _workspaceId) {
      return;
    }
    _workspaceId = workspaceId;
    state = state.copyWith(metadata: {
      ...state.metadata,
      'selectedWorkspaceId': workspaceId,
      'selectedSessionId': null,
    });
    _viewTracked = false;
    await _analytics.track(
      'mobile_networking_workspace_switched',
      context: {
        'workspaceId': workspaceId,
      },
      metadata: const {'source': 'mobile_app'},
    );
    await load(forceRefresh: true);
  }

  void selectSession(int? sessionId) {
    state = state.copyWith(metadata: {
      ...state.metadata,
      'selectedSessionId': sessionId,
    });
    if (sessionId != null) {
      _analytics.track(
        'mobile_networking_session_selected',
        context: {
          'sessionId': sessionId,
          'workspaceId': _workspaceId,
        },
        metadata: const {'source': 'mobile_app'},
      );
    }
  }

  Future<void> _recordView(NetworkingOverviewBundle bundle, {required bool fromCache}) async {
    if (_viewTracked) {
      return;
    }
    final sessions = bundle.overview.sessions.list;
    if (sessions.isEmpty) {
      return;
    }
    _viewTracked = true;
    await _analytics.track(
      'mobile_networking_overview_viewed',
      context: {
        'workspaceId': bundle.selectedWorkspaceId,
        'sessionCount': sessions.length,
        'fromCache': fromCache,
        'hasDigitalCards': bundle.overview.digitalCards.created > 0,
      },
      metadata: const {'source': 'mobile_app'},
    );
  }
}

final networkingRepositoryProvider = Provider<NetworkingRepository>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  final cache = ref.watch(offlineCacheProvider);
  return NetworkingRepository(apiClient, cache);
});

final networkingControllerProvider =
    StateNotifierProvider<NetworkingController, ResourceState<NetworkingOverviewBundle>>((ref) {
  final repository = ref.watch(networkingRepositoryProvider);
  final analytics = ref.watch(analyticsServiceProvider);
  return NetworkingController(repository, analytics);
});
