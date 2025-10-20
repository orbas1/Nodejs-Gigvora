import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gigvora_foundation/gigvora_foundation.dart';

import '../../../core/providers.dart';
import '../../auth/application/session_controller.dart';
import '../../auth/domain/session.dart';
import '../data/models/role_membership.dart';
import '../data/role_membership_repository.dart';

class RoleManagementController extends StateNotifier<ResourceState<List<RoleMembership>>> {
  RoleManagementController(this._ref, this._repository, this._analytics)
      : super(ResourceState<List<RoleMembership>>.loading()) {
    _initialise();
  }

  final Ref _ref;
  final RoleMembershipRepository _repository;
  final AnalyticsService _analytics;
  List<RoleMembership> _memberships = const <RoleMembership>[];

  Future<void> _initialise() async {
    await load();
  }

  Future<void> load({bool forceRefresh = false}) async {
    state = state.copyWith(loading: true, error: null);
    try {
      final result = await _repository.fetchMemberships(forceRefresh: forceRefresh);
      _memberships = result.data;
      state = ResourceState<List<RoleMembership>>(
        data: _sortedMemberships(),
        loading: false,
        error: result.error,
        fromCache: result.fromCache,
        lastUpdated: result.lastUpdated,
      );
    } catch (error) {
      state = ResourceState<List<RoleMembership>>.error(
        error,
        data: state.data,
        fromCache: state.fromCache,
        lastUpdated: state.lastUpdated,
      );
    }
  }

  List<RoleMembership> _sortedMemberships() {
    final sorted = [..._memberships];
    sorted.sort((a, b) {
      if (a.isActive != b.isActive) {
        return a.isActive ? -1 : 1;
      }
      if (a.isPrimary != b.isPrimary) {
        return a.isPrimary ? -1 : 1;
      }
      return a.label.compareTo(b.label);
    });
    return sorted;
  }

  Future<void> refresh() => load(forceRefresh: true);

  Future<RoleMembership> create(RoleMembershipDraft draft) async {
    final membership = await _repository.createMembership(draft);
    _memberships = [..._memberships, membership];
    await _synchroniseSession();
    await _analytics.track(
      'mobile_role_created',
      context: {
        'role': membership.role,
        'membershipId': membership.id,
        'primary': membership.isPrimary,
      },
      metadata: const {'source': 'mobile_app'},
    );
    _emit();
    return membership;
  }

  Future<RoleMembership> update(RoleMembership membership, RoleMembershipUpdate update) async {
    final persisted = await _repository.updateMembership(membership.id, update);
    final index = _memberships.indexWhere((item) => item.id == membership.id);
    if (index >= 0) {
      _memberships[index] = persisted;
    } else {
      _memberships = [..._memberships, persisted];
    }
    await _synchroniseSession();
    await _analytics.track(
      'mobile_role_updated',
      context: {
        'role': persisted.role,
        'membershipId': persisted.id,
        'primary': persisted.isPrimary,
      },
      metadata: const {'source': 'mobile_app'},
    );
    _emit();
    return persisted;
  }

  Future<void> activate(RoleMembership membership) async {
    final persisted = await _repository.activateMembership(membership.id);
    _memberships = _memberships
        .map((item) => item.copyWith(
              isActive: item.id == persisted.id,
              isPrimary: item.id == persisted.id ? persisted.isPrimary : item.isPrimary,
            ))
        .toList(growable: false);
    await _synchroniseSession(activeRole: persisted.role);
    await _analytics.track(
      'mobile_role_activated',
      context: {
        'role': persisted.role,
        'membershipId': persisted.id,
      },
      metadata: const {'source': 'mobile_app'},
    );
    _emit();
  }

  Future<void> delete(RoleMembership membership) async {
    await _repository.deleteMembership(membership.id);
    _memberships = _memberships.where((item) => item.id != membership.id).toList(growable: false);
    await _synchroniseSession(removeRole: membership.role);
    await _analytics.track(
      'mobile_role_deleted',
      context: {
        'role': membership.role,
        'membershipId': membership.id,
      },
      metadata: const {'source': 'mobile_app'},
    );
    _emit();
  }

  void _emit() {
    state = state.copyWith(
      data: _sortedMemberships(),
      loading: false,
      error: null,
      metadata: {
        'updatedAt': DateTime.now().toIso8601String(),
      },
    );
  }

  Future<void> _synchroniseSession({String? activeRole, String? removeRole}) async {
    final sessionState = _ref.read(sessionControllerProvider);
    final session = sessionState.session;
    if (session == null) {
      return;
    }
    final currentMemberships = session.memberships.toList(growable: true);
    final availableRoles = _memberships.map((item) => item.role).toSet();

    for (final role in availableRoles) {
      if (!currentMemberships.contains(role)) {
        currentMemberships.add(role);
      }
    }
    if (removeRole != null) {
      currentMemberships.remove(removeRole);
    }

    final resolvedActive = activeRole ??
        (_memberships.firstWhere(
          (item) => item.isActive,
          orElse: () => _memberships.isEmpty
              ? membershipFallback(session)
              : _memberships.first,
        )).role;

    final sanitized = currentMemberships.toSet().toList()..sort();
    final controller = _ref.read(sessionControllerProvider.notifier);
    controller.login(
      session.copyWith(
        memberships: sanitized,
        activeMembership: sanitized.contains(resolvedActive) ? resolvedActive : sanitized.first,
      ),
    );
  }

  RoleMembership membershipFallback(UserSession session) {
    final fallbackRole = session.memberships.isNotEmpty ? session.memberships.first : session.activeMembership;
    return RoleMembership(
      id: fallbackRole,
      role: fallbackRole,
      label: session.roleLabel(fallbackRole),
      isActive: true,
      isPrimary: true,
    );
  }
}

final roleMembershipRepositoryProvider = Provider<RoleMembershipRepository>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  final cache = ref.watch(offlineCacheProvider);
  return RoleMembershipRepository(apiClient, cache);
});

final roleManagementControllerProvider =
    StateNotifierProvider<RoleManagementController, ResourceState<List<RoleMembership>>>((ref) {
  final repository = ref.watch(roleMembershipRepositoryProvider);
  final analytics = ref.watch(analyticsServiceProvider);
  return RoleManagementController(ref, repository, analytics);
});
