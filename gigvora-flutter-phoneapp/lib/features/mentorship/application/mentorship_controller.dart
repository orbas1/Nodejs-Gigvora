import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gigvora_foundation/gigvora_foundation.dart';

import '../../../core/providers.dart';
import '../data/mentorship_repository.dart';
import '../data/models/mentor_dashboard.dart';

class MentorshipController extends StateNotifier<ResourceState<MentorDashboard>> {
  MentorshipController(this._repository, this._analytics, {this.lookbackDays = 30})
      : super(ResourceState<MentorDashboard>.loading(const MentorDashboard(), const {
          'savingAvailability': false,
          'savingPackages': false,
        })) {
    load();
  }

  final MentorshipRepository _repository;
  final AnalyticsService _analytics;
  final int lookbackDays;
  bool _viewRecorded = false;

  Future<void> load({bool forceRefresh = false}) async {
    state = state.copyWith(loading: true, error: null);
    try {
      final result = await _repository.fetchDashboard(
        lookbackDays: lookbackDays,
        forceRefresh: forceRefresh,
      );
      state = ResourceState<MentorDashboard>(
        data: result.data,
        loading: false,
        error: result.error,
        fromCache: result.fromCache,
        lastUpdated: result.lastUpdated,
        metadata: state.metadata,
      );

      await _recordViewAnalytics(result.data, fromCache: result.fromCache);

      if (result.error != null) {
        await _analytics.track(
          'mobile_mentor_dashboard_sync_partial',
          context: {
            'reason': '${result.error}',
            'fromCache': result.fromCache,
          },
          metadata: const {'source': 'mobile_app'},
        );
      }
    } catch (error) {
      state = state.copyWith(loading: false, error: error);
      await _analytics.track(
        'mobile_mentor_dashboard_sync_failed',
        context: {
          'reason': '$error',
        },
        metadata: const {'source': 'mobile_app'},
      );
    }
  }

  Future<void> refresh() async {
    await _analytics.track(
      'mobile_mentor_dashboard_refresh',
      context: {
        'lookbackDays': lookbackDays,
      },
      metadata: const {'source': 'mobile_app'},
    );
    await load(forceRefresh: true);
  }

  Future<void> saveAvailability(List<MentorAvailabilitySlot> slots) async {
    _updateMetadata(savingAvailability: true);
    try {
      await _repository.saveAvailability(slots);
      final current = state.data ?? const MentorDashboard();
      final updated = current.copyWith(availability: List<MentorAvailabilitySlot>.from(slots));
      state = state.copyWith(data: updated);
      await _analytics.track(
        'mobile_mentor_availability_saved',
        context: {
          'slotCount': slots.length,
        },
        metadata: const {'source': 'mobile_app'},
      );
    } catch (error) {
      await _analytics.track(
        'mobile_mentor_availability_failed',
        context: {
          'reason': '$error',
        },
        metadata: const {'source': 'mobile_app'},
      );
      rethrow;
    } finally {
      _updateMetadata(savingAvailability: false);
    }
  }

  Future<void> savePackages(List<MentorPackage> packages) async {
    _updateMetadata(savingPackages: true);
    try {
      await _repository.savePackages(packages);
      final current = state.data ?? const MentorDashboard();
      final updated = current.copyWith(packages: List<MentorPackage>.from(packages));
      state = state.copyWith(data: updated);
      await _analytics.track(
        'mobile_mentor_packages_saved',
        context: {
          'packageCount': packages.length,
        },
        metadata: const {'source': 'mobile_app'},
      );
    } catch (error) {
      await _analytics.track(
        'mobile_mentor_packages_failed',
        context: {
          'reason': '$error',
        },
        metadata: const {'source': 'mobile_app'},
      );
      rethrow;
    } finally {
      _updateMetadata(savingPackages: false);
    }
  }

  void _updateMetadata({bool? savingAvailability, bool? savingPackages}) {
    final metadata = Map<String, dynamic>.from(state.metadata);
    if (savingAvailability != null) {
      metadata['savingAvailability'] = savingAvailability;
    }
    if (savingPackages != null) {
      metadata['savingPackages'] = savingPackages;
    }
    state = state.copyWith(metadata: metadata);
  }

  Future<void> _recordViewAnalytics(MentorDashboard dashboard, {required bool fromCache}) async {
    if (_viewRecorded) {
      return;
    }
    if (dashboard.availability.isEmpty &&
        dashboard.packages.isEmpty &&
        dashboard.bookings.isEmpty &&
        dashboard.conversion.isEmpty &&
        dashboard.stats == null) {
      return;
    }
    _viewRecorded = true;
    await _analytics.track(
      'mobile_mentor_dashboard_viewed',
      context: {
        'hasStats': dashboard.stats != null,
        'bookings': dashboard.bookings.length,
        'packages': dashboard.packages.length,
        'availability': dashboard.availability.length,
        'fromCache': fromCache,
        'lookbackDays': lookbackDays,
      },
      metadata: const {'source': 'mobile_app'},
    );
  }
}

final mentorshipRepositoryProvider = Provider<MentorshipRepository>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  final cache = ref.watch(offlineCacheProvider);
  return MentorshipRepository(apiClient, cache);
});

final mentorshipControllerProvider =
    StateNotifierProvider<MentorshipController, ResourceState<MentorDashboard>>((ref) {
  final repository = ref.watch(mentorshipRepositoryProvider);
  final analytics = ref.watch(analyticsServiceProvider);
  return MentorshipController(repository, analytics);
});
