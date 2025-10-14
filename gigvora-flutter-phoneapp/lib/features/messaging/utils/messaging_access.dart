import '../../auth/domain/session.dart';

const Set<String> messagingAllowedMemberships = {
  'user',
  'freelancer',
  'agency',
  'company',
  'mentor',
  'headhunter',
  'admin',
};

bool canAccessMessaging(UserSession? session) {
  if (session == null) {
    return false;
  }
  return session.memberships.any(messagingAllowedMemberships.contains);
}

List<String> messagingMembershipLabels(UserSession? session) {
  if (session == null) {
    return const [];
  }
  return session.memberships
      .where(messagingAllowedMemberships.contains)
      .map((role) => session.roleLabel(role))
      .toList(growable: false);
}

List<String> messagingAllowedRoleLabels(UserSession? session) {
  if (session != null) {
    return messagingAllowedMemberships
        .map((role) => session.roleLabel(role))
        .toSet()
        .toList(growable: false);
  }
  return messagingAllowedMemberships
      .map((role) => UserSession.roleLabels[role] ?? role)
      .toList(growable: false);
}
