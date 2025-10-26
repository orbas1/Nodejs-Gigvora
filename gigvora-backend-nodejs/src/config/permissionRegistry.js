import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PERMISSION_MATRIX_PATH = path.resolve(
  __dirname,
  '../../..',
  'shared-contracts/domain/auth/permissionMatrix.json',
);

function readPermissionMatrix() {
  const raw = fs.readFileSync(PERMISSION_MATRIX_PATH, 'utf8');
  return JSON.parse(raw);
}

function normaliseMembershipKey(value) {
  if (value == null) {
    return null;
  }
  const stringified = `${value}`.trim().toLowerCase();
  if (!stringified) {
    return null;
  }
  return stringified.replace(/[^a-z0-9]+/g, '_');
}

function normalisePermissionKey(value) {
  if (value == null) {
    return null;
  }
  const stringified = `${value}`.trim().toLowerCase();
  return stringified || null;
}

const permissionMatrix = readPermissionMatrix();

const permissionIndex = new Map();
const permissionImplications = new Map();
const membershipIndex = new Map();
const canonicalMembershipIndex = new Map();
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

function buildPermissionIndex() {
  (permissionMatrix.permissions ?? []).forEach((permission) => {
    const key = normalisePermissionKey(permission.key);
    if (!key) {
      return;
    }
    if (permissionIndex.has(key)) {
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
      implies,
      escalationPath: Array.isArray(permission.escalationPath)
        ? permission.escalationPath.map(normaliseMembershipKey).filter(Boolean)
        : [],
    });
    registerPermissionImplication(key, implies);
  });
}

function buildMembershipIndex() {
  (permissionMatrix.memberships ?? []).forEach((membership) => {
    const canonicalKey = normaliseMembershipKey(membership.key);
    if (!canonicalKey) {
      return;
    }
    if (!canonicalMembershipIndex.has(canonicalKey)) {
      membershipOrder.push(canonicalKey);
    }
    const permissionSet = new Set(
      (membership.permissions ?? [])
        .map(normalisePermissionKey)
        .filter(Boolean),
    );
    const canonicalDefinition = {
      key: canonicalKey,
      label: membership.label ?? canonicalKey,
      description: membership.description ?? '',
      tier: membership.tier ?? 'standard',
      escalationPath: Array.isArray(membership.escalationPath)
        ? membership.escalationPath.map(normaliseMembershipKey).filter(Boolean)
        : [],
      grantAll: membership.grantAll === true,
      permissions: permissionSet,
    };
    canonicalMembershipIndex.set(canonicalKey, canonicalDefinition);
    const aliases = Array.isArray(membership.aliases) ? membership.aliases : [];
    const resolvedAliases = new Set([canonicalKey]);
    aliases.map(normaliseMembershipKey).filter(Boolean).forEach((alias) => resolvedAliases.add(alias));
    resolvedAliases.forEach((alias) => {
      membershipIndex.set(alias, canonicalDefinition);
    });
  });
}

buildPermissionIndex();
buildMembershipIndex();

function expandPermissionSet(permissionSet, sourcesMap) {
  const queue = Array.from(permissionSet);
  while (queue.length > 0) {
    const current = queue.pop();
    const implied = permissionImplications.get(current);
    if (!implied || !implied.size) {
      continue;
    }
    implied.forEach((permission) => {
      if (!permissionSet.has(permission)) {
        permissionSet.add(permission);
        queue.push(permission);
      }
      const currentSources = sourcesMap.get(current);
      if (!currentSources || !currentSources.size) {
        return;
      }
      const target = sourcesMap.get(permission) ?? new Set();
      currentSources.forEach((source) => target.add(source));
      sourcesMap.set(permission, target);
    });
  }
}

function cloneMembershipSummary(definition) {
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
      const definition = membershipIndex.get(membershipKey);
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
    .map((membershipKey) => cloneMembershipSummary(canonicalMembershipIndex.get(membershipKey)))
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

  const state = {
    version: permissionMatrix.version,
    membershipKeys,
    membershipDetails,
    permissionKeys: [...permissionSet],
    permissionDetails,
    breakdown,
  };

  Object.defineProperty(state, 'permissionSet', {
    value: permissionSet,
    enumerable: false,
  });
  Object.defineProperty(state, 'membershipSet', {
    value: membershipSet,
    enumerable: false,
  });

  return state;
}

export function hasPermission(context, permissionKey, { allowAdminOverride = true } = {}) {
  const normalisedPermission = normalisePermissionKey(permissionKey);
  if (!normalisedPermission) {
    return false;
  }
  const state = context?.permissionSet instanceof Set ? context : resolveAuthorizationState(context);
  if (state.permissionSet.has(normalisedPermission)) {
    return true;
  }
  if (!allowAdminOverride) {
    return false;
  }
  const membershipSet = state.membershipSet instanceof Set ? state.membershipSet : new Set(state.membershipKeys);
  for (const membershipKey of membershipSet) {
    const definition = canonicalMembershipIndex.get(membershipKey);
    if (definition?.grantAll) {
      return true;
    }
  }
  return false;
}

export function getPermissionMetadata(permissionKey) {
  const normalised = normalisePermissionKey(permissionKey);
  if (!normalised) {
    return null;
  }
  return permissionIndex.get(normalised) ?? null;
}

export function getMembershipMetadata(membershipKey) {
  const normalised = normaliseMembershipKey(membershipKey);
  if (!normalised) {
    return null;
  }
  const definition = membershipIndex.get(normalised);
  if (!definition) {
    return null;
  }
  return cloneMembershipSummary(definition);
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
      allowed.push(cloneMembershipSummary(definition));
    }
  });
  return allowed;
}

export function describePermissionRequirement(permissionKey) {
  const metadata = getPermissionMetadata(permissionKey);
  const allowedMemberships = listMembershipsForPermission(permissionKey);
  if (!metadata) {
    const normalised = normalisePermissionKey(permissionKey);
    return {
      permission: {
        key: normalised,
        label: normalised ?? 'requested permission',
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

export {
  normaliseMembershipKey,
  normalisePermissionKey,
  permissionMatrix,
};

export default {
  resolveAuthorizationState,
  hasPermission,
  describePermissionRequirement,
  getPermissionMetadata,
  getMembershipMetadata,
  listMembershipsForPermission,
  normaliseMembershipKey,
  normalisePermissionKey,
  permissionMatrix,
};
