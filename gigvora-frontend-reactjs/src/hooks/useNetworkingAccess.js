import { useMemo } from 'react';
import useSession from './useSession.js';

const ALLOWED_MEMBERSHIPS = new Set(['company', 'agency']);
const REQUIRED_PERMISSIONS = ['networking.manage', 'networking.manage.any'];
const FEATURE_FLAGS = ['networking:enabled', 'networking_hub'];
const SUSPENDED_FLAGS = ['networking:suspended', 'networking:revoked'];

function normaliseValues(values) {
  if (!Array.isArray(values)) {
    return [];
  }
  return values
    .map((value) => `${value}`.toLowerCase())
    .filter((value) => value.length > 0);
}

export default function useNetworkingAccess() {
  const { session, isAuthenticated } = useSession();

  return useMemo(() => {
    const memberships = normaliseValues(session?.memberships);
    const allowedMemberships = memberships.filter((value) => ALLOWED_MEMBERSHIPS.has(value));

    const permissions = normaliseValues(session?.permissions);
    const featureFlags = normaliseValues(session?.featureFlags);
    const restrictions = normaliseValues(session?.restrictions);

    const hasExplicitPermission = REQUIRED_PERMISSIONS.some((permission) => permissions.includes(permission));
    const featureEnabled =
      featureFlags.length === 0 || FEATURE_FLAGS.some((flag) => featureFlags.includes(flag));
    const isRestricted = SUSPENDED_FLAGS.some((flag) => restrictions.includes(flag));

    const canManageNetworking =
      Boolean(isAuthenticated) && !isRestricted && featureEnabled && (hasExplicitPermission || allowedMemberships.length > 0);

    let reason = null;
    if (!isAuthenticated) {
      reason = 'Sign in with a verified workspace to access networking controls.';
    } else if (isRestricted) {
      reason = 'Networking controls are temporarily suspended for this workspace.';
    } else if (!(hasExplicitPermission || allowedMemberships.length > 0)) {
      reason = 'Networking hub access is reserved for company or agency workspaces with manager permissions.';
    } else if (!featureEnabled) {
      reason = 'Networking hub is not enabled for your account. Contact support to activate the feature.';
    }

    return {
      isAuthenticated: Boolean(isAuthenticated),
      canManageNetworking,
      allowedMemberships,
      hasExplicitPermission,
      isRestricted,
      featureEnabled,
      reason,
    };
  }, [isAuthenticated, session?.memberships, session?.permissions, session?.featureFlags, session?.restrictions]);
}
