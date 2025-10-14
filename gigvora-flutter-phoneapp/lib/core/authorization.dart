import '../features/auth/domain/session.dart';

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

String _normaliseRole(String? value) {
  if (value == null || value.trim().isEmpty) {
    return '';
  }
  return value.trim().toLowerCase().replaceAll(RegExp(r'[^a-z0-9]+'), '_');
}

Set<String> resolveRoles(UserSession? session) {
  final roles = <String>{};
  if (session == null) {
    return roles;
  }

  roles.add(_normaliseRole(session.activeMembership));
  for (final membership in session.memberships) {
    roles.add(_normaliseRole(membership));
  }
  for (final dashboard in session.dashboards.keys) {
    roles.add(_normaliseRole(dashboard));
  }
  return roles..removeWhere((element) => element.isEmpty);
}

class ProjectAccess {
  const ProjectAccess({
    required this.allowed,
    required this.roles,
    required this.reason,
  });

  final bool allowed;
  final Set<String> roles;
  final String? reason;
}

ProjectAccess evaluateProjectAccess(UserSession? session) {
  final roles = resolveRoles(session);
  final allowed = roles.any(_projectManagementRoles.contains);
  final reason = allowed
      ? null
      : 'Project workspaces are restricted to agency, company, operations, and admin leads. Request access from your workspace administrator.';
  return ProjectAccess(allowed: allowed, roles: roles, reason: reason);
}
