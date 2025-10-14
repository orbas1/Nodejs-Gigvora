const EXPLORER_ALLOWED_MEMBERSHIPS = new Set([
  'user',
  'freelancer',
  'agency',
  'company',
  'headhunter',
  'mentor',
  'admin',
]);

function normalise(value) {
  if (typeof value !== 'string') {
    return '';
  }
  return value.trim().toLowerCase();
}

export function getExplorerAllowedMemberships() {
  return Array.from(EXPLORER_ALLOWED_MEMBERSHIPS);
}

export function hasExplorerAccess(session) {
  if (!session) {
    return false;
  }

  const memberships = Array.isArray(session.memberships) ? session.memberships : [];
  if (memberships.some((membership) => EXPLORER_ALLOWED_MEMBERSHIPS.has(normalise(membership)))) {
    return true;
  }

  if (session.activeMembership && EXPLORER_ALLOWED_MEMBERSHIPS.has(normalise(session.activeMembership))) {
    return true;
  }

  if (session?.featureFlags?.explorerAccess === true) {
    return true;
  }

  const explorerPermission = session?.permissions?.explorer;
  if (explorerPermission && (explorerPermission === true || explorerPermission?.enabled === true)) {
    return true;
  }

  return false;
}

export default hasExplorerAccess;
