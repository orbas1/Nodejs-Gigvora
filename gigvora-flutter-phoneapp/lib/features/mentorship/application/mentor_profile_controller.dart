import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gigvora_foundation/gigvora_foundation.dart';

import '../../../core/providers.dart';
import '../data/mentor_profile_repository.dart';
import '../data/models/mentor_profile.dart';

class MentorProfileController extends StateNotifier<ResourceState<MentorProfile>> {
  MentorProfileController(
    this.mentorId,
    this._repository,
    this._analytics,
  ) : super(ResourceState<MentorProfile>.loading(null, const {
          'booking': false,
          'reviewing': false,
        })) {
    load();
  }

  final String mentorId;
  final MentorProfileRepository _repository;
  final AnalyticsService _analytics;
  bool _initialised = false;

  Future<void> load({bool forceRefresh = false}) async {
    if (_initialised && !forceRefresh) {
      return;
    }
    _initialised = true;
    state = state.copyWith(loading: true, error: null);
    try {
      final result = await _repository.fetchProfile(mentorId, forceRefresh: forceRefresh);
      state = ResourceState<MentorProfile>(
        data: result.data,
        loading: false,
        error: result.error,
        fromCache: result.fromCache,
        lastUpdated: result.lastUpdated ?? DateTime.now(),
        metadata: state.metadata,
      );
      await _analytics.track(
        'mobile_mentor_profile_loaded',
        context: {
          'mentorId': mentorId,
          'fromCache': result.fromCache,
        },
        metadata: const {'source': 'mobile_app'},
      );
    } catch (error) {
      state = state.copyWith(loading: false, error: error);
    }
  }

  Future<void> refresh() async {
    await _analytics.track(
      'mobile_mentor_profile_refreshed',
      context: {'mentorId': mentorId},
      metadata: const {'source': 'mobile_app'},
    );
    await load(forceRefresh: true);
  }

  Future<void> bookSession(MentorSessionDraft draft) async {
    _setMetadata(booking: true);
    try {
      final updated = await _repository.bookSession(mentorId, draft);
      state = state.copyWith(
        data: updated,
        lastUpdated: DateTime.now(),
      );
      await _analytics.track(
        'mobile_mentor_session_booked',
        context: {
          'mentorId': mentorId,
          'format': draft.format,
          'packageId': draft.packageId,
        },
        metadata: const {'source': 'mobile_app'},
      );
    } finally {
      _setMetadata(booking: false);
    }
  }

  Future<void> submitReview(MentorReviewDraft draft) async {
    _setMetadata(reviewing: true);
    try {
      final updated = await _repository.addReview(mentorId, draft);
      state = state.copyWith(
        data: updated,
        lastUpdated: DateTime.now(),
      );
      await _analytics.track(
        'mobile_mentor_review_submitted',
        context: {
          'mentorId': mentorId,
          'rating': draft.rating,
        },
        metadata: const {'source': 'mobile_app'},
      );
    } finally {
      _setMetadata(reviewing: false);
    }
  }

  Future<void> updateGallery(List<MentorMediaAsset> gallery) async {
    final updated = await _repository.updateGallery(mentorId, gallery);
    state = state.copyWith(data: updated, lastUpdated: DateTime.now());
  }

  void _setMetadata({bool? booking, bool? reviewing}) {
    final metadata = Map<String, dynamic>.from(state.metadata);
    if (booking != null) {
      metadata['booking'] = booking;
    }
    if (reviewing != null) {
      metadata['reviewing'] = reviewing;
    }
    state = state.copyWith(metadata: metadata);
  }
}

final mentorProfileControllerProvider =
    StateNotifierProvider.family<MentorProfileController, ResourceState<MentorProfile>, String>(
  (ref, mentorId) {
    final repository = ref.watch(mentorProfileRepositoryProvider);
    final analytics = ref.watch(analyticsServiceProvider);
    final controller = MentorProfileController(mentorId, repository, analytics);
    ref.onDispose(controller.dispose);
    return controller;
  },
);
