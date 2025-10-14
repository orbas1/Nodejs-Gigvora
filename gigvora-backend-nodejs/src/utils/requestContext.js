export function resolveRequestUserId(req) {
  if (!req) {
    return null;
  }

  const candidates = [
    req.user?.id,
    req.userId,
    req.headers?.['x-user-id'],
    req.headers?.['x-actor-id'],
    req.headers?.['x-user'],
    req.query?.userId,
    req.body?.userId,
  ];

  for (const candidate of candidates) {
    if (candidate === undefined || candidate === null) {
      continue;
    }
    const value = Number.parseInt(candidate, 10);
    if (!Number.isNaN(value)) {
      return value;
    }
  }

  return null;
}

export function resolveRequestUserRole(req) {
  if (!req) {
    return null;
  }

  const candidates = [
    req.user?.role,
    req.user?.roleKey,
    req.userRole,
    req.headers?.['x-user-role'],
    req.headers?.['x-actor-role'],
    req.headers?.['x-role'],
    req.query?.role,
    req.body?.role,
  ];

  for (const candidate of candidates) {
    if (!candidate) {
      continue;
    }
    return candidate.toString();
  }

  return null;
}

export function resolveRequestPermissions(req) {
  if (!req) {
    return [];
  }

  const rawCollections = [
    req.user?.permissions,
    req.user?.scopes,
    req.userPermissions,
    req.headers?.['x-user-permissions'],
    req.headers?.['x-permissions'],
    req.headers?.['x-scopes'],
  ].filter(Boolean);

  const values = new Set();

  for (const entry of rawCollections) {
    if (Array.isArray(entry)) {
      entry
        .filter(Boolean)
        .forEach((value) => values.add(value.toString()));
    } else if (typeof entry === 'string') {
      entry
        .split(/[\s,]+/)
        .map((value) => value.trim())
        .filter(Boolean)
        .forEach((value) => values.add(value));
    }
  }

  return Array.from(values);
}

export default {
  resolveRequestUserId,
  resolveRequestUserRole,
  resolveRequestPermissions,
};
