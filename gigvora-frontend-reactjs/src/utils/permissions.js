const FINANCE_ALLOWED_MEMBERSHIPS = ['admin', 'agency', 'company', 'finance'];
const SECURITY_ALLOWED_MEMBERSHIPS = ['security', 'trust', 'admin'];

export function hasFinanceOperationsAccess(session) {
  if (!session) {
    return false;
  }

  const memberships = Array.isArray(session.memberships) ? session.memberships : [];
  if (memberships.some((membership) => FINANCE_ALLOWED_MEMBERSHIPS.includes(membership))) {
    return true;
  }

  const permissions = session.permissions;
  if (permissions && typeof permissions === 'object') {
    if (permissions.finance === true) {
      return true;
    }
    if (permissions.finance?.controlTower) {
      return true;
    }
    if (Array.isArray(permissions.capabilities)) {
      return permissions.capabilities.includes('finance:control-tower');
    }
  }

  const capabilities = Array.isArray(session.capabilities) ? session.capabilities : [];
  if (capabilities.includes('finance:control-tower')) {
    return true;
  }

  return false;
}

export function hasSecurityOperationsAccess(session) {
  if (!session) {
    return false;
  }

  const memberships = Array.isArray(session.memberships) ? session.memberships : [];
  if (memberships.some((membership) => SECURITY_ALLOWED_MEMBERSHIPS.includes(membership))) {
    return true;
  }

  const permissions = session.permissions;
  if (permissions && typeof permissions === 'object') {
    if (permissions.security === true) {
      return true;
    }
    if (permissions.security?.operations) {
      return true;
    }
    if (Array.isArray(permissions.capabilities)) {
      return permissions.capabilities.includes('security:operations');
    }
  }

  const capabilities = Array.isArray(session.capabilities) ? session.capabilities : [];
  if (capabilities.includes('security:operations')) {
    return true;
  }

  return false;
}

export default {
  hasFinanceOperationsAccess,
  hasSecurityOperationsAccess,
  FINANCE_ALLOWED_MEMBERSHIPS,
  SECURITY_ALLOWED_MEMBERSHIPS,
};
