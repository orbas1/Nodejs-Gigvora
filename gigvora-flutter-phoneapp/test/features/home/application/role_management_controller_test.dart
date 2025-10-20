import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:gigvora_foundation/gigvora_foundation.dart';

import 'package:gigvora_mobile/core/providers.dart';
import 'package:gigvora_mobile/features/auth/application/session_controller.dart';
import 'package:gigvora_mobile/features/auth/domain/session.dart';
import 'package:gigvora_mobile/features/home/application/role_management_controller.dart';
import 'package:gigvora_mobile/features/home/data/models/role_membership.dart';

import '../../../support/test_analytics_service.dart';
import '../../../support/test_api_client.dart';
import '../../../support/test_offline_cache.dart';

class FakeRoleMembershipRepository extends RoleMembershipRepository {
  FakeRoleMembershipRepository({List<RoleMembership>? initial})
      : _memberships = List<RoleMembership>.from(initial ?? const <RoleMembership>[]),
        super(TestApiClient(), InMemoryOfflineCache());

  List<RoleMembership> _memberships;
  RoleMembershipDraft? lastDraft;
  RoleMembershipUpdate? lastUpdate;
  String? lastDeletedId;
  String? lastActivatedId;

  @override
  Future<RepositoryResult<List<RoleMembership>>> fetchMemberships({bool forceRefresh = false}) async {
    return RepositoryResult<List<RoleMembership>>(
      data: List<RoleMembership>.from(_memberships),
      fromCache: false,
      lastUpdated: DateTime.now(),
    );
  }

  @override
  Future<RoleMembership> createMembership(RoleMembershipDraft draft) async {
    lastDraft = draft;
    final membership = RoleMembership(
      id: 'mem-${_memberships.length + 1}',
      role: draft.role,
      label: draft.label,
      description: draft.description,
      permissions: draft.permissions,
      isPrimary: draft.primary,
      isActive: draft.primary,
    );
    _memberships = [..._memberships, membership];
    return membership;
  }

  @override
  Future<RoleMembership> updateMembership(String id, RoleMembershipUpdate update) async {
    lastUpdate = update;
    final index = _memberships.indexWhere((item) => item.id == id);
    if (index < 0) {
      throw ArgumentError('Unknown membership $id');
    }
    final next = _memberships[index].copyWith(
      label: update.label ?? _memberships[index].label,
      description: update.description ?? _memberships[index].description,
      permissions: update.permissions ?? _memberships[index].permissions,
      isPrimary: update.primary ?? _memberships[index].isPrimary,
    );
    _memberships[index] = next;
    return next;
  }

  @override
  Future<RoleMembership> activateMembership(String id) async {
    lastActivatedId = id;
    final index = _memberships.indexWhere((item) => item.id == id);
    if (index < 0) {
      throw ArgumentError('Unknown membership $id');
    }
    final activated = _memberships[index].copyWith(isActive: true, isPrimary: true);
    _memberships = _memberships
        .map((item) => item.id == id ? activated : item.copyWith(isActive: false))
        .toList(growable: false);
    return activated;
  }

  @override
  Future<void> deleteMembership(String id) async {
    lastDeletedId = id;
    _memberships = _memberships.where((item) => item.id != id).toList(growable: false);
  }
}

class _RecordingSessionController extends SessionController {
  _RecordingSessionController(UserSession initial) {
    login(initial);
  }

  UserSession? lastLogin;

  @override
  void login(UserSession session) {
    lastLogin = session;
    super.login(session);
  }
}

void main() {
  late FakeRoleMembershipRepository repository;
  late TestAnalyticsService analytics;
  late _RecordingSessionController sessionController;

  ProviderContainer buildContainer({required List<RoleMembership> initialMemberships}) {
    repository = FakeRoleMembershipRepository(initial: initialMemberships);
    analytics = TestAnalyticsService();
    sessionController = _RecordingSessionController(
      UserSession.demo().copyWith(
        memberships: initialMemberships.map((item) => item.role).toList(growable: false),
        activeMembership: initialMemberships.first.role,
      ),
    );

    final container = ProviderContainer(
      overrides: [
        roleMembershipRepositoryProvider.overrideWithValue(repository),
        analyticsServiceProvider.overrideWithValue(analytics),
        sessionControllerProvider.overrideWith((ref) => sessionController),
      ],
    );
    addTearDown(container.dispose);
    return container;
  }

  test('loads and sorts memberships placing active and primary roles first', () async {
    final initialMemberships = [
      const RoleMembership(id: '2', role: 'client', label: 'Client', isPrimary: true, isActive: false),
      const RoleMembership(id: '1', role: 'freelancer', label: 'Freelancer', isPrimary: true, isActive: true),
      const RoleMembership(id: '3', role: 'mentor', label: 'Mentor', isPrimary: false, isActive: false),
    ];
    final container = buildContainer(initialMemberships: initialMemberships);

    await container.read(roleManagementControllerProvider.notifier).refresh();

    final state = container.read(roleManagementControllerProvider);
    expect(state.loading, isFalse);
    expect(state.data, isNotNull);
    expect(state.data, hasLength(3));
    expect(state.data!.first.role, 'freelancer');
    expect(state.data![1].role, 'client');
  });

  test('creating membership updates session and sends analytics', () async {
    final container = buildContainer(initialMemberships: const [
      RoleMembership(id: '1', role: 'freelancer', label: 'Freelancer', isPrimary: true, isActive: true),
    ]);

    final controller = container.read(roleManagementControllerProvider.notifier);
    await controller.refresh();

    await controller.create(
      const RoleMembershipDraft(
        role: 'agency',
        label: 'Agency',
        permissions: ['contracts:manage'],
        primary: true,
      ),
    );

    final state = container.read(roleManagementControllerProvider);
    expect(state.data!.map((item) => item.role), containsAll(<String>['freelancer', 'agency']));
    expect(repository.lastDraft, isNotNull);
    expect(repository.lastDraft!.role, 'agency');
    expect(sessionController.lastLogin, isNotNull);
    expect(sessionController.lastLogin!.memberships, contains('agency'));
    expect(analytics.events.map((event) => event.name), contains('mobile_role_created'));
  });

  test('activating membership promotes role and syncs session', () async {
    final container = buildContainer(initialMemberships: const [
      RoleMembership(id: '1', role: 'freelancer', label: 'Freelancer', isPrimary: true, isActive: true),
      RoleMembership(id: '2', role: 'agency', label: 'Agency', isPrimary: false, isActive: false),
    ]);

    final controller = container.read(roleManagementControllerProvider.notifier);
    await controller.refresh();

    await controller.activate(const RoleMembership(
      id: '2',
      role: 'agency',
      label: 'Agency',
      isPrimary: false,
      isActive: false,
    ));

    final state = container.read(roleManagementControllerProvider);
    expect(repository.lastActivatedId, '2');
    expect(state.data!.first.role, 'agency');
    expect(sessionController.lastLogin!.activeMembership, 'agency');
    expect(analytics.events.map((event) => event.name), contains('mobile_role_activated'));
  });

  test('deleting membership removes role from session roster', () async {
    final container = buildContainer(initialMemberships: const [
      RoleMembership(id: '1', role: 'freelancer', label: 'Freelancer', isPrimary: true, isActive: true),
      RoleMembership(id: '2', role: 'agency', label: 'Agency', isPrimary: false, isActive: false),
    ]);

    final controller = container.read(roleManagementControllerProvider.notifier);
    await controller.refresh();

    await controller.delete(const RoleMembership(id: '2', role: 'agency', label: 'Agency'));

    final state = container.read(roleManagementControllerProvider);
    expect(state.data, hasLength(1));
    expect(repository.lastDeletedId, '2');
    expect(sessionController.lastLogin!.memberships, isNot(contains('agency')));
    expect(analytics.events.map((event) => event.name), contains('mobile_role_deleted'));
  });
}
