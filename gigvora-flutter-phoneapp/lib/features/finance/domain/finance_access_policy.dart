import '../../auth/domain/session.dart';

class FinanceAccessPolicy {
  static const Set<String> allowedMemberships = {
    'admin',
    'agency',
    'company',
    'finance',
  };

  static bool hasAccess(UserSession? session) {
    if (session == null) {
      return false;
    }
    return session.memberships.any(allowedMemberships.contains);
  }
}
