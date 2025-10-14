const normaliseToken = (value) => {
  if (typeof value !== 'string') {
    return '';
  }
  return value.trim().toLowerCase();
};

const createTokenSet = (values = []) => {
  const set = new Set();
  values.forEach((value) => {
    const normalised = normaliseToken(value);
    if (normalised) {
      set.add(normalised);
    }
  });
  return set;
};

export const MESSAGING_ALLOWED_MEMBERSHIPS = Object.freeze([
  'user',
  'freelancer',
  'agency',
  'company',
  'mentor',
  'headhunter',
  'admin',
]);

const messagingMembershipSet = createTokenSet(MESSAGING_ALLOWED_MEMBERSHIPS);

export const LAUNCHPAD_ALLOWED_MEMBERSHIPS = Object.freeze([
  'freelancer',
  'mentor',
  'agency',
  'company',
  'admin',
]);

const launchpadMembershipSet = createTokenSet(LAUNCHPAD_ALLOWED_MEMBERSHIPS);

export const SECURITY_ALLOWED_MEMBERSHIPS = Object.freeze([
  'security',
  'trust',
  'admin',
]);

const securityMembershipSet = createTokenSet(SECURITY_ALLOWED_MEMBERSHIPS);

function collectSessionAccessTokens(session) {
  if (!session) {
    return new Set();
  }

  const tokens = new Set();
  const candidates = [
    session.memberships,
    session.roles,
    session.accountTypes,
    session.activeMembership,
    session.primaryDashboard,
  ];

  candidates.forEach((candidate) => {
    if (!candidate) {
      return;
    }
    if (Array.isArray(candidate)) {
      candidate.forEach((value) => {
        const normalised = normaliseToken(value);
        if (normalised) {
          tokens.add(normalised);
        }
      });
      return;
    }

    const normalised = normaliseToken(candidate);
    if (normalised) {
      tokens.add(normalised);
    }
  });

  return tokens;
}

export function getMessagingMemberships(session) {
  const tokens = collectSessionAccessTokens(session);
  return Array.from(tokens).filter((token) => messagingMembershipSet.has(token));
}

export function canAccessMessaging(session) {
  return getMessagingMemberships(session).length > 0;
}

export function canAccessLaunchpad(session) {
  const tokens = collectSessionAccessTokens(session);
  if (!tokens.size) {
    return false;
  }

  for (const token of tokens) {
    if (launchpadMembershipSet.has(token)) {
      return true;
    }
  }

  return false;
}

export function getLaunchpadMemberships(session) {
  return Array.from(collectSessionAccessTokens(session)).filter((token) => launchpadMembershipSet.has(token));
}

export function canAccessSecurityOperations(session) {
  const tokens = collectSessionAccessTokens(session);
  if (!tokens.size) {
    return false;
  }

  for (const token of tokens) {
    if (securityMembershipSet.has(token)) {
      return true;
    }
  }

  return false;
}

export function getSecurityMemberships(session) {
  return Array.from(collectSessionAccessTokens(session)).filter((token) => securityMembershipSet.has(token));
}
