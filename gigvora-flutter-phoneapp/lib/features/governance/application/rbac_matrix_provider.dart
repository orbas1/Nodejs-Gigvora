import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../auth/application/session_controller.dart';
import '../data/rbac_repository.dart';
import '../domain/rbac_matrix.dart';

final rbacMatrixProvider = FutureProvider<RbacMatrix?>((ref) async {
  final sessionState = ref.watch(sessionControllerProvider);
  if (!sessionState.isAuthenticated) {
    return null;
  }
  final session = sessionState.session!;
  final accessibleRoles = <String>{
    'admin',
    'platform_admin',
    'security',
    'security_officer',
    'operations',
    'operations_lead',
    'compliance',
    'compliance_manager',
  };
  final hasAccess = session.memberships
      .map((role) => role.trim().toLowerCase())
      .any(accessibleRoles.contains);
  if (!hasAccess) {
    return null;
  }
  final repository = ref.watch(rbacRepositoryProvider);
  return repository.fetchMatrix();
});
