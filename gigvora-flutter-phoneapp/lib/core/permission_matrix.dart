class PermissionDefinition {
  const PermissionDefinition({
    required this.key,
    required this.label,
    this.implies = const <String>[],
    this.escalationPath = const <String>[],
  });

  final String key;
  final String label;
  final List<String> implies;
  final List<String> escalationPath;
}

class MembershipDefinition {
  const MembershipDefinition({
    required this.key,
    required this.label,
    this.aliases = const <String>[],
    this.permissions = const <String>[],
    this.tier = 'standard',
    this.grantAll = false,
  });

  final String key;
  final String label;
  final List<String> aliases;
  final List<String> permissions;
  final String tier;
  final bool grantAll;
}

class PermissionRequirement {
  const PermissionRequirement({
    required this.permission,
    required this.allowedMemberships,
    required this.message,
  });

  final PermissionDefinition permission;
  final List<MembershipDefinition> allowedMemberships;
  final String message;
}

class AuthorizationState {
  const AuthorizationState({
    required this.membershipKeys,
    required this.permissionKeys,
  });

  final Set<String> membershipKeys;
  final Set<String> permissionKeys;
}

String normaliseMembershipKey(String? value) {
  if (value == null || value.trim().isEmpty) {
    return '';
  }
  return value.trim().toLowerCase().replaceAll(RegExp(r'[^a-z0-9]+'), '_');
}

String normalisePermissionKey(String? value) {
  if (value == null || value.trim().isEmpty) {
    return '';
  }
  return value.trim().toLowerCase();
}

final Map<String, PermissionDefinition> _permissionIndex = <String, PermissionDefinition>{
  'rbac:matrix:view': const PermissionDefinition(
    key: 'rbac:matrix:view',
    label: 'View RBAC matrix',
  ),
  'rbac:matrix:audit': const PermissionDefinition(
    key: 'rbac:matrix:audit',
    label: 'Audit RBAC decisions',
    implies: <String>['rbac:matrix:view'],
  ),
  'rbac:matrix:simulate': const PermissionDefinition(
    key: 'rbac:matrix:simulate',
    label: 'Simulate RBAC policies',
    implies: <String>['rbac:matrix:view', 'rbac:matrix:audit'],
  ),
  'calendar:view': const PermissionDefinition(
    key: 'calendar:view',
    label: 'View company calendar',
  ),
  'calendar:manage': const PermissionDefinition(
    key: 'calendar:manage',
    label: 'Manage company calendar',
    implies: <String>['calendar:view'],
  ),
  'projects:view': const PermissionDefinition(
    key: 'projects:view',
    label: 'View project workspaces',
  ),
  'projects:manage': const PermissionDefinition(
    key: 'projects:manage',
    label: 'Manage project workspaces',
    implies: <String>['projects:view'],
  ),
  'notifications:read': const PermissionDefinition(
    key: 'notifications:read',
    label: 'Read inbox notifications',
  ),
  'notifications:manage': const PermissionDefinition(
    key: 'notifications:manage',
    label: 'Manage notification broadcasts',
    implies: <String>['notifications:read'],
  ),
};

final List<MembershipDefinition> _membershipDefinitions = <MembershipDefinition>[
  const MembershipDefinition(
    key: 'platform_admin',
    label: 'Platform Administrator',
    aliases: <String>['admin', 'platform:admin'],
    permissions: <String>['rbac:matrix:view', 'rbac:matrix:audit', 'rbac:matrix:simulate', 'calendar:manage', 'projects:manage', 'notifications:manage'],
    tier: 'privileged',
    grantAll: true,
  ),
  const MembershipDefinition(
    key: 'security_officer',
    label: 'Security Officer',
    aliases: <String>['security', 'security_officer'],
    permissions: <String>['rbac:matrix:view', 'rbac:matrix:audit', 'calendar:view', 'projects:view'],
    tier: 'privileged',
  ),
  const MembershipDefinition(
    key: 'workspace_admin',
    label: 'Workspace Administrator',
    aliases: <String>['workspace_admin', 'company_admin', 'agency_admin'],
    permissions: <String>['calendar:manage', 'projects:manage', 'notifications:manage', 'rbac:matrix:view'],
    tier: 'elevated',
  ),
  const MembershipDefinition(
    key: 'operations_lead',
    label: 'Operations Lead',
    aliases: <String>['operations_lead', 'operations'],
    permissions: <String>['calendar:manage', 'projects:manage', 'notifications:read'],
    tier: 'elevated',
  ),
  const MembershipDefinition(
    key: 'project_manager',
    label: 'Project Manager',
    aliases: <String>['project_manager', 'project_management'],
    permissions: <String>['projects:manage', 'calendar:view', 'notifications:read'],
  ),
  const MembershipDefinition(
    key: 'company_member',
    label: 'Company Member',
    aliases: <String>['company', 'company_member', 'company_manager'],
    permissions: <String>['calendar:view', 'projects:view', 'notifications:read'],
  ),
  const MembershipDefinition(
    key: 'agency_member',
    label: 'Agency Member',
    aliases: <String>['agency'],
    permissions: <String>['calendar:view', 'projects:view', 'notifications:read'],
  ),
  const MembershipDefinition(
    key: 'mentor',
    label: 'Mentor',
    aliases: <String>['mentor'],
    permissions: <String>['calendar:view', 'notifications:read'],
    tier: 'limited',
  ),
];

final Map<String, MembershipDefinition> _canonicalMembershipIndex = <String, MembershipDefinition>{};
final Map<String, MembershipDefinition> _membershipAliasIndex = <String, MembershipDefinition>{};

void _initialiseMembershipIndexes() {
  if (_canonicalMembershipIndex.isNotEmpty) {
    return;
  }
  for (final MembershipDefinition definition in _membershipDefinitions) {
    _canonicalMembershipIndex[definition.key] = definition;
    final Set<String> aliases = <String>{definition.key, ...definition.aliases.map(normaliseMembershipKey)};
    for (final String alias in aliases) {
      if (alias.isEmpty) {
        continue;
      }
      _membershipAliasIndex[alias] = definition;
    }
  }
}

AuthorizationState resolveAuthorizationState({
  Iterable<String> memberships = const <String>[],
  Iterable<String> permissions = const <String>[],
}) {
  _initialiseMembershipIndexes();
  final Set<String> membershipKeys = <String>{};
  final Set<String> permissionKeys = <String>{};

  void addPermission(String permission, {String? source}) {
    final String normalised = normalisePermissionKey(permission);
    if (normalised.isEmpty) {
      return;
    }
    permissionKeys.add(normalised);
    final PermissionDefinition? definition = _permissionIndex[normalised];
    if (definition != null) {
      for (final String implied in definition.implies) {
        permissionKeys.add(implied);
      }
    }
  }

  for (final String membership in memberships) {
    final String key = normaliseMembershipKey(membership);
    if (key.isEmpty) {
      continue;
    }
    final MembershipDefinition? definition = _membershipAliasIndex[key];
    if (definition == null) {
      continue;
    }
    membershipKeys.add(definition.key);
    if (definition.grantAll) {
      permissionKeys.addAll(_permissionIndex.keys);
      continue;
    }
    for (final String permission in definition.permissions) {
      addPermission(permission, source: definition.key);
    }
  }

  for (final String permission in permissions) {
    addPermission(permission, source: 'explicit');
  }

  return AuthorizationState(membershipKeys: membershipKeys, permissionKeys: permissionKeys);
}

PermissionRequirement describePermissionRequirement(String permissionKey) {
  _initialiseMembershipIndexes();
  final String normalised = normalisePermissionKey(permissionKey);
  final PermissionDefinition definition =
      _permissionIndex[normalised] ?? PermissionDefinition(key: normalised, label: normalised);
  final List<MembershipDefinition> allowed = <MembershipDefinition>[];
  for (final MembershipDefinition membership in _membershipDefinitions) {
    if (membership.grantAll || membership.permissions.contains(normalised)) {
      allowed.add(membership);
    }
  }
  final String message = allowed.isEmpty
      ? 'You do not have permission to access this resource.'
      : 'Access to ${definition.label} is limited to ${allowed.map((MembershipDefinition item) => item.label).join(', ')}.';
  return PermissionRequirement(permission: definition, allowedMemberships: allowed, message: message);
}

MembershipDefinition? membershipMetadata(String membershipKey) {
  _initialiseMembershipIndexes();
  final String normalised = normaliseMembershipKey(membershipKey);
  if (normalised.isEmpty) {
    return null;
  }
  return _membershipAliasIndex[normalised];
}
