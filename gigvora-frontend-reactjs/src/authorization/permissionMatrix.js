import permissionMatrix from '@shared-contracts/domain/auth/permissionMatrix.json';

export function normaliseMembershipKey(value) {
  if (value == null) {
    return null;
  }
  const stringified = `${value}`.trim().toLowerCase();
  if (!stringified) {
    return null;
  }
  return stringified.replace(/[^a-z0-9]+/g, '_');
}

export function normalisePermissionKey(value) {
  if (value == null) {
    return null;
  }
  const stringified = `${value}`.trim().toLowerCase();
  return stringified || null;
}

const permissionIndex = new Map();
const permissionImplications = new Map();
const canonicalMembershipIndex = new Map();
const membershipAliasIndex = new Map();
const membershipOrder = [];

function registerPermissionImplication(source, implied) {
  const bucket = permissionImplications.get(source) ?? new Set();
  implied.forEach((permission) => {
    if (permission && permission !== source) {
      bucket.add(permission);
    }
  });
  permissionImplications.set(source, bucket);
}

(permissionMatrix.permissions ?? []).forEach((permission) => {
  const key = normalisePermissionKey(permission.key);
  if (!key || permissionIndex.has(key)) {
    return;
  }
  const implies = Array.isArray(permission.implies)
    ? permission.implies.map(normalisePermissionKey).filter(Boolean)
    : [];
  permissionIndex.set(key, {
    key,
    label: permission.label ?? key,
    description: permission.description ?? '',
    category: permission.category ?? 'general',
    surfaces: Array.isArray(permission.surfaces) ? permission.surfaces : [],
    escalationPath: Array.isArray(permission.escalationPath)
      ? permission.escalationPath.map(normaliseMembershipKey).filter(Boolean)
      : [],
    implies,
  });
  registerPermissionImplication(key, implies);
});

(permissionMatrix.memberships ?? []).forEach((membership) => {
  const canonicalKey = normaliseMembershipKey(membership.key);
  if (!canonicalKey) {
    return;
  }
  if (!canonicalMembershipIndex.has(canonicalKey)) {
    membershipOrder.push(canonicalKey);
  }
  const permissions = new Set(
    (membership.permissions ?? []).map(normalisePermissionKey).filter(Boolean),
  );
  const definition = {
    key: canonicalKey,
    label: membership.label ?? canonicalKey,
    description: membership.description ?? '',
    tier: membership.tier ?? 'standard',
    escalationPath: Array.isArray(membership.escalationPath)
      ? membership.escalationPath.map(normaliseMembershipKey).filter(Boolean)
      : [],
    grantAll: membership.grantAll === true,
    permissions,
  };
  canonicalMembershipIndex.set(canonicalKey, definition);
  const aliases = Array.isArray(membership.aliases) ? membership.aliases : [];
  const resolvedAliases = new Set([canonicalKey]);
  aliases.map(normaliseMembershipKey).filter(Boolean).forEach((alias) => resolvedAliases.add(alias));
  resolvedAliases.forEach((alias) => {
    membershipAliasIndex.set(alias, definition);
  });
});

function expandPermissionSet(permissionSet, sourceMap) {
  const queue = Array.from(permissionSet);
  while (queue.length) {
    const current = queue.pop();
    const implied = permissionImplications.get(current);
    if (!implied) {
      continue;
    }
    implied.forEach((permission) => {
      if (!permissionSet.has(permission)) {
        permissionSet.add(permission);
        queue.push(permission);
      }
      const currentSources = sourceMap.get(current);
      if (!currentSources || !currentSources.size) {
        return;
      }
      const target = sourceMap.get(permission) ?? new Set();
      currentSources.forEach((source) => target.add(source));
      sourceMap.set(permission, target);
    });
  }
}

function cloneMembership(definition) {
  if (!definition) {
    return null;
  }
  return {
    key: definition.key,
    label: definition.label,
    description: definition.description,
    tier: definition.tier,
    escalationPath: [...definition.escalationPath],
    grantAll: definition.grantAll,
    permissions: [...definition.permissions],
  };
}

export function resolveAuthorizationState({ memberships = [], permissions = [] } = {}) {
  const membershipSet = new Set();
  const permissionSet = new Set();
  const permissionSources = new Map();

  const pushPermission = (permissionKey, source) => {
    const normalised = normalisePermissionKey(permissionKey);
    if (!normalised) {
      return;
    }
    permissionSet.add(normalised);
    if (!permissionSources.has(normalised)) {
      permissionSources.set(normalised, new Set());
    }
    if (source) {
      permissionSources.get(normalised).add(source);
    }
  };

  memberships
    .map(normaliseMembershipKey)
    .filter(Boolean)
    .forEach((membershipKey) => {
      const definition = membershipAliasIndex.get(membershipKey);
      if (!definition) {
        return;
      }
      membershipSet.add(definition.key);
      if (definition.grantAll) {
        permissionIndex.forEach((_, permissionKey) => pushPermission(permissionKey, definition.key));
        return;
      }
      definition.permissions.forEach((permissionKey) => pushPermission(permissionKey, definition.key));
    });

  permissions
    .map(normalisePermissionKey)
    .filter(Boolean)
    .forEach((permissionKey) => pushPermission(permissionKey, 'explicit'));

  expandPermissionSet(permissionSet, permissionSources);

  const membershipKeys = [...membershipSet];
  const membershipDetails = membershipKeys
    .map((membershipKey) => cloneMembership(canonicalMembershipIndex.get(membershipKey)))
    .filter(Boolean);

  const permissionDetails = [...permissionSet].map((permissionKey) => {
    const metadata = permissionIndex.get(permissionKey) ?? {
      key: permissionKey,
      label: permissionKey,
      description: '',
      category: 'general',
      surfaces: [],
      implies: [],
      escalationPath: [],
    };
    return {
      ...metadata,
      key: permissionKey,
      grantedBy: [...(permissionSources.get(permissionKey) ?? [])],
    };
  });

  const breakdown = {};
  permissionDetails.forEach((detail) => {
    breakdown[detail.key] = {
      metadata: detail,
      grantedBy: detail.grantedBy,
    };
  });

  return {
    version: permissionMatrix.version,
    membershipKeys,
    membershipDetails,
    permissionKeys: [...permissionSet],
    permissionDetails,
    breakdown,
  };
}

export function hasPermission(context, permissionKey, { allowAdminOverride = true } = {}) {
  const normalised = normalisePermissionKey(permissionKey);
  if (!normalised) {
    return false;
  }
  const state = context?.permissionKeys ? context : resolveAuthorizationState(context);
  const permissionSet = new Set(state.permissionKeys);
  if (permissionSet.has(normalised)) {
    return true;
  }
  if (!allowAdminOverride) {
    return false;
  }
  return state.membershipKeys.some((membershipKey) => {
    const definition = canonicalMembershipIndex.get(membershipKey);
    return Boolean(definition?.grantAll);
  });
}

export function listMembershipsForPermission(permissionKey) {
  const normalised = normalisePermissionKey(permissionKey);
  if (!normalised) {
    return [];
  }
  const allowed = [];
  membershipOrder.forEach((membershipKey) => {
    const definition = canonicalMembershipIndex.get(membershipKey);
    if (!definition) {
      return;
    }
    if (definition.grantAll || definition.permissions.has(normalised)) {
      allowed.push(cloneMembership(definition));
    }
  });
  return allowed;
}

export function getMembershipMetadata(membershipKey) {
  const normalised = normaliseMembershipKey(membershipKey);
  if (!normalised) {
    return null;
  }
  const definition = membershipAliasIndex.get(normalised);
  if (!definition) {
    return null;
  }
  return cloneMembership(definition);
}

export function describePermissionRequirement(permissionKey) {
  const metadata = permissionIndex.get(normalisePermissionKey(permissionKey));
  const allowedMemberships = listMembershipsForPermission(permissionKey);
  if (!metadata) {
    const fallback = normalisePermissionKey(permissionKey);
    return {
      permission: {
        key: fallback,
        label: fallback ?? 'requested permission',
        description: '',
        category: 'general',
        surfaces: [],
        implies: [],
        escalationPath: [],
      },
      allowedMemberships,
      message: 'You do not have permission to access this resource.',
    };
  }
  const readableRoles = allowedMemberships.map((membership) => membership.label);
  const message = readableRoles.length
    ? `Access to ${metadata.label} is limited to ${readableRoles.join(', ')}.`
    : `Access to ${metadata.label} is restricted to authorised Gigvora teams.`;
  return {
    permission: metadata,
    allowedMemberships,
    message,
  };
}

export const permissionMatrixVersion = {
  version: permissionMatrix.version,
  publishedAt: permissionMatrix.publishedAt,
  reviewCadenceDays: permissionMatrix.reviewCadenceDays,
};

export default {
  permissionMatrixVersion,
  resolveAuthorizationState,
  hasPermission,
  listMembershipsForPermission,
  describePermissionRequirement,
  normaliseMembershipKey,
  normalisePermissionKey,
  getMembershipMetadata,
};
