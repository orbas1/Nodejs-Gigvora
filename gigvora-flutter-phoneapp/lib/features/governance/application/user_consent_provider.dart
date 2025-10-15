import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../auth/application/session_controller.dart';
import '../data/user_consent_repository.dart';
import '../domain/consent_models.dart';

final userConsentSnapshotProvider = FutureProvider<UserConsentSnapshot?>((ref) async {
  final sessionState = ref.watch(sessionControllerProvider);
  if (!sessionState.isAuthenticated) {
    return null;
  }

  final repository = ref.watch(userConsentRepositoryProvider);
  final session = sessionState.session!;
  return repository.fetchSnapshot(session.id);
});
