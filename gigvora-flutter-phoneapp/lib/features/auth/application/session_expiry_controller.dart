import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gigvora_foundation/gigvora_foundation.dart';

import '../../../core/providers.dart';
import '../domain/session.dart';

class SessionExpiryState {
  const SessionExpiryState({
    this.expiresAt,
    this.promptVisible = false,
    this.remaining,
  });

  final DateTime? expiresAt;
  final bool promptVisible;
  final Duration? remaining;

  SessionExpiryState copyWith({
    DateTime? expiresAt,
    bool? promptVisible,
    Duration? remaining,
  }) {
    return SessionExpiryState(
      expiresAt: expiresAt ?? this.expiresAt,
      promptVisible: promptVisible ?? this.promptVisible,
      remaining: remaining ?? this.remaining,
    );
  }
}

class SessionExpiryController extends StateNotifier<SessionExpiryState> {
  SessionExpiryController(this._ref)
      : _analytics = _ref.read(analyticsServiceProvider),
        super(const SessionExpiryState());

  final Ref _ref;
  final AnalyticsService _analytics;
  Timer? _timer;

  static const Duration _promptLeadTime = Duration(minutes: 5);

  void observe(UserSession? session) {
    _timer?.cancel();
    if (session?.tokenExpiresAt == null) {
      state = const SessionExpiryState();
      return;
    }

    final expiresAt = session!.tokenExpiresAt!;
    final now = DateTime.now();
    final remaining = expiresAt.difference(now);
    if (remaining.isNegative || remaining <= _promptLeadTime) {
      _triggerPrompt(expiresAt, remaining.isNegative ? Duration.zero : remaining);
      return;
    }

    state = SessionExpiryState(expiresAt: expiresAt, promptVisible: false, remaining: remaining);

    final delay = remaining - _promptLeadTime;
    _timer = Timer(delay, () => _triggerPrompt(expiresAt, _promptLeadTime));
  }

  void acknowledgePrompt() {
    if (!state.promptVisible) {
      return;
    }
    state = state.copyWith(promptVisible: false);
    unawaited(_analytics.track('mobile_auth_session_expiry_prompt_ack', metadata: const {
      'actorType': 'user',
      'source': 'mobile_app',
    }));
  }

  void _triggerPrompt(DateTime expiresAt, Duration remaining) {
    state = SessionExpiryState(expiresAt: expiresAt, promptVisible: true, remaining: remaining);
    unawaited(_analytics.track('mobile_auth_session_expiry_prompt', metadata: {
      'actorType': 'user',
      'source': 'mobile_app',
      'expiresAt': expiresAt.toIso8601String(),
    }));
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }
}

final sessionExpiryControllerProvider =
    StateNotifierProvider<SessionExpiryController, SessionExpiryState>((ref) {
  return SessionExpiryController(ref);
});
