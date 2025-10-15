import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:gigvora_foundation/gigvora_foundation.dart';

import '../../core/providers.dart';
import '../domain/consent_models.dart';

class UserConsentRepository {
  UserConsentRepository(this._client);

  final ApiClient _client;

  Future<UserConsentSnapshot> fetchSnapshot(int userId) async {
    final response =
        await _client.get('/users/$userId/consents') as Map<String, dynamic>;
    return UserConsentSnapshot.fromJson(response);
  }
}

final userConsentRepositoryProvider = Provider<UserConsentRepository>((ref) {
  final client = ref.watch(apiClientProvider);
  return UserConsentRepository(client);
});
