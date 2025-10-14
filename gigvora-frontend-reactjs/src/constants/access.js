export const MESSAGING_ALLOWED_MEMBERSHIPS = Object.freeze([
  'user',
  'freelancer',
  'agency',
  'company',
  'mentor',
  'headhunter',
  'admin',
]);

export function getMessagingMemberships(session) {
  if (!session) {
    return [];
  }
  const memberships = Array.isArray(session.memberships) ? session.memberships : [];
  return memberships.filter((membership) => MESSAGING_ALLOWED_MEMBERSHIPS.includes(membership));
}

export function canAccessMessaging(session) {
  return getMessagingMemberships(session).length > 0;
}
