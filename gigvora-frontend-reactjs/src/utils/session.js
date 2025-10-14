function normaliseId(value) {
  const numeric = Number.parseInt(value, 10);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
}

export function resolveActorId(session) {
  if (!session) {
    return null;
  }
  const candidates = [
    session.userId,
    session.id,
    session.user?.id,
    session.profile?.id,
    session.memberId,
    session.accountId,
  ];
  for (const candidate of candidates) {
    const resolved = normaliseId(candidate);
    if (resolved) {
      return resolved;
    }
  }
  return null;
}

export function hasMembership(session, membership) {
  if (!session || !membership) {
    return false;
  }
  const memberships = Array.isArray(session.memberships) ? session.memberships : [];
  return memberships.some((value) => value === membership);
}

export function hasAnyMembership(session, memberships = []) {
  if (!session || !Array.isArray(memberships) || memberships.length === 0) {
    return false;
  }
  const userMemberships = Array.isArray(session.memberships) ? session.memberships : [];
  return memberships.some((value) => userMemberships.includes(value));
}

export default {
  resolveActorId,
  hasMembership,
  hasAnyMembership,
};
