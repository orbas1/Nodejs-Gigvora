import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../domain/auth_token_store.dart';
import '../domain/session.dart';
import 'session_expiry_controller.dart';

class SessionController extends StateNotifier<SessionState> {
  SessionController(this._ref) : super(const SessionState.unauthenticated());

  final Ref _ref;

  void login(UserSession session) {
    state = SessionState.authenticated(session);
    _ref.read(sessionExpiryControllerProvider.notifier).observe(session);
  }

  void loginDemo() {
    final demo = UserSession.demo();
    state = SessionState.authenticated(demo);
    _ref.read(sessionExpiryControllerProvider.notifier).observe(demo);
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
    _ref.read(sessionExpiryControllerProvider.notifier).observe(null);
  }
}

final sessionControllerProvider =
    StateNotifierProvider<SessionController, SessionState>((ref) {
  return SessionController(ref);
});
