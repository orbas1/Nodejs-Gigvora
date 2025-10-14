import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../domain/auth_token_store.dart';
import '../domain/session.dart';

class SessionController extends StateNotifier<SessionState> {
  SessionController() : super(const SessionState.unauthenticated());

  void login(UserSession session) {
    state = SessionState.authenticated(session);
  }

  void loginDemo() {
    login(UserSession.demo());
  }

  void selectRole(String role) {
    final current = state.session;
    if (current == null) {
      return;
    }
    if (!current.memberships.contains(role)) {
      return;
    }
    state = SessionState.authenticated(current.copyWith(activeMembership: role));
  }

  void logout() {
    unawaited(AuthTokenStore.clear());
    state = const SessionState.unauthenticated();
  }
}

final sessionControllerProvider =
    StateNotifierProvider<SessionController, SessionState>((ref) {
  return SessionController();
});
