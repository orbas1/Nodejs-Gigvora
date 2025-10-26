import '../features/auth/domain/session.dart';
import 'permission_matrix.dart';

const Set<String> _projectManagementRoles = <String>{
  'project_manager',
  'project_management',
  'operations_lead',
  'operations',
  'agency',
  'agency_admin',
  'company',
  'company_admin',
  'workspace_admin',
  'admin',
};

const Set<String> _workManagementRoles = <String>{
  'freelancer',
  ..._projectManagementRoles,
};

Set<String> resolveRoles(UserSession? session) {
  final roles = <String>{};
  if (session == null) {
    return roles;
  }

  roles.add(normaliseMembershipKey(session.activeMembership));
  for (final membership in session.memberships) {
    roles.add(normaliseMembershipKey(membership));
  }
  for (final dashboard in session.dashboards.keys) {
    roles.add(normaliseMembershipKey(dashboard));
  }
  return roles..removeWhere((element) => element.isEmpty);
}

class ProjectAccess {
  const ProjectAccess({
    required this.allowed,
    required this.roles,
    this.reason,
    bool? allowedToManage,
  }) : _allowedToManage = allowedToManage;

  final bool allowed;
  final Set<String> roles;
  final String? reason;
  final bool? _allowedToManage;

  bool get allowedToManage => _allowedToManage ?? allowed;
}

ProjectAccess evaluateProjectAccess(UserSession? session) {
  final roles = resolveRoles(session);
  final AuthorizationState authorization = resolveAuthorizationState(memberships: roles);
  final bool allowedByPermission = authorization.permissionKeys.contains('projects:manage');
  final bool allowedByRole = roles.any(_projectManagementRoles.contains);
  final bool allowed = allowedByPermission || allowedByRole;
  final PermissionRequirement requirement = describePermissionRequirement('projects:manage');
  final String? reason = allowed
      ? null
      : requirement.message;
  return ProjectAccess(allowed: allowed, roles: roles, reason: reason, allowedToManage: allowedByPermission || allowedByRole);
}

ProjectAccess evaluateWorkManagementAccess(UserSession? session) {
  final roles = resolveRoles(session);
  final AuthorizationState authorization = resolveAuthorizationState(memberships: roles);
  final bool allowedByPermission = authorization.permissionKeys.contains('projects:view');
  final bool allowedByRole = roles.any(_workManagementRoles.contains);
  final bool allowed = allowedByPermission || allowedByRole;
  final bool canManage = authorization.permissionKeys.contains('projects:manage') ||
      roles.any(_projectManagementRoles.contains);
  final PermissionRequirement requirement = describePermissionRequirement('projects:view');
  final String? reason = allowed
      ? null
      : requirement.message;
  return ProjectAccess(
    allowed: allowed,
    roles: roles,
    reason: reason,
    allowedToManage: canManage,
  );
}
