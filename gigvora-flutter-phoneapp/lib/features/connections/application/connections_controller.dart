import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gigvora_foundation/gigvora_foundation.dart';

import '../../../core/providers.dart';
import '../../auth/application/session_controller.dart';
import '../data/connections_repository.dart';
import '../domain/connection_network.dart';

class ConnectionsController extends StateNotifier<ResourceState<ConnectionNetwork>> {
  ConnectionsController(this._repository, this._userId)
      : super(
          _userId == null
              ? ResourceState<ConnectionNetwork>.error(
                  StateError('User not authenticated'),
                  data: null,
                )
              : ResourceState<ConnectionNetwork>.loading(),
        ) {
    if (_userId != null) {
      load();
    }
  }

  final ConnectionsRepository _repository;
  final int? _userId;

  Future<void> load({bool forceRefresh = false}) async {
    if (_userId == null) {
      state = ResourceState<ConnectionNetwork>.error(
        StateError('User not authenticated'),
        data: state.data,
      );
      return;
    }
    state = ResourceState<ConnectionNetwork>(
      data: state.data,
      loading: true,
      fromCache: state.fromCache,
      lastUpdated: state.lastUpdated,
    );
    try {
      final result = await _repository.fetchNetwork(userId: _userId!, forceRefresh: forceRefresh);
      state = ResourceState<ConnectionNetwork>(
        data: result.data,
        loading: false,
        fromCache: result.fromCache,
        lastUpdated: result.lastUpdated,
      );
    } catch (error) {
      state = ResourceState<ConnectionNetwork>.error(
        error,
        data: state.data,
        fromCache: state.fromCache,
        lastUpdated: state.lastUpdated,
      );
    }
  }

  Future<void> refresh() => load(forceRefresh: true);
}

final connectionsControllerProvider = StateNotifierProvider.autoDispose<ConnectionsController, ResourceState<ConnectionNetwork>>((ref) {
  final sessionState = ref.watch(sessionControllerProvider);
  final apiClient = ref.watch(apiClientProvider);
  final cache = ref.watch(offlineCacheProvider);
  final repository = ConnectionsRepository(apiClient, cache);
  final userId = sessionState.session?.id;
  return ConnectionsController(repository, userId);
});
