import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gigvora_foundation/gigvora_foundation.dart';

import '../../../core/providers.dart';
import '../data/models/reputation.dart';
import '../data/reputation_repository.dart';

class ProfileReputationController
    extends StateNotifier<ResourceState<ReputationOverview>> {
  ProfileReputationController(
    this._repository, {
    required this.profileId,
  }) : super(ResourceState<ReputationOverview>.loading()) {
    _initialise();
  }

  final ReputationRepository _repository;
  final String profileId;

  Future<void> _initialise() async {
    await load();
  }

  bool get _hasValidId => int.tryParse(profileId) != null && int.parse(profileId) > 0;

  Future<void> load({bool forceRefresh = false}) async {
    if (!_hasValidId) {
      state = ResourceState<ReputationOverview>.error(
        ArgumentError('A numeric freelancer id is required for reputation insights.'),
        data: state.data,
        fromCache: state.fromCache,
        lastUpdated: state.lastUpdated,
        metadata: {'reason': 'invalid_id'},
      );
      return;
    }

    state = state.copyWith(loading: true, error: null);
    try {
      final result = await _repository.fetchOverview(profileId, forceRefresh: forceRefresh);
      state = ResourceState<ReputationOverview>(
        data: result.data,
        loading: false,
        error: result.error,
        fromCache: result.fromCache,
        lastUpdated: result.lastUpdated,
        metadata: {'source': result.fromCache ? 'cache' : 'network'},
      );
    } catch (error) {
      state = ResourceState<ReputationOverview>.error(
        error,
        data: state.data,
        fromCache: state.fromCache,
        lastUpdated: state.lastUpdated,
      );
    }
  }

  Future<void> refresh() => load(forceRefresh: true);
}

final reputationRepositoryProvider = Provider<ReputationRepository>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  final cache = ref.watch(offlineCacheProvider);
  return ReputationRepository(apiClient: apiClient, cache: cache);
});

final profileReputationControllerProvider = StateNotifierProvider.family<
    ProfileReputationController,
    ResourceState<ReputationOverview>,
    String>((ref, profileId) {
  final repository = ref.watch(reputationRepositoryProvider);
  return ProfileReputationController(repository, profileId: profileId);
});
