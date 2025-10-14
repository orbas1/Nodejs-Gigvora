import '../../features/auth/domain/session.dart';

const Set<String> kExplorerAllowedMemberships = {
  'user',
  'freelancer',
  'agency',
  'company',
  'headhunter',
  'mentor',
  'admin',
};

String _normalise(String value) => value.trim().toLowerCase();

bool hasExplorerAccess(UserSession? session) {
  if (session == null) {
    return false;
  }

  final memberships = session.memberships.map(_normalise).toSet();
  if (memberships.any(kExplorerAllowedMemberships.contains)) {
    return true;
  }

  final active = session.activeMembership;
  if (active.isNotEmpty && kExplorerAllowedMemberships.contains(_normalise(active))) {
    return true;
  }

  return false;
}
