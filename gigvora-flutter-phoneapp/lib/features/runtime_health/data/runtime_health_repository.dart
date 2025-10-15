import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gigvora_foundation/gigvora_foundation.dart';

import '../../core/providers.dart';
import '../domain/runtime_health_snapshot.dart';

class RuntimeHealthRepository {
  RuntimeHealthRepository(this._client);

  final ApiClient _client;

  Future<RuntimeHealthSnapshot> fetch({bool authenticated = true}) async {
    try {
      final response = await _client.get(
        authenticated ? '/api/admin/runtime/health' : '/health/ready',
      ) as Map<String, dynamic>;
      if (authenticated) {
        final readiness = Map<String, dynamic>.from(response['readiness'] as Map? ?? <String, dynamic>{});
        return RuntimeHealthSnapshot.fromJson(
          readiness,
          maintenance: Map<String, dynamic>.from(response['maintenance'] as Map? ?? const <String, dynamic>{}),
          perimeter: Map<String, dynamic>.from(response['perimeter'] as Map? ?? const <String, dynamic>{}),
        );
      }
      return RuntimeHealthSnapshot.fromJson(response);
    } on ApiException catch (error) {
      if (error.statusCode == 401 || error.statusCode == 403) {
        final response = await _client.get('/health/ready') as Map<String, dynamic>;
        return RuntimeHealthSnapshot.fromJson(response);
      }
      rethrow;
    }
  }
}

final runtimeHealthRepositoryProvider = Provider<RuntimeHealthRepository>((ref) {
  final client = ref.watch(apiClientProvider);
  return RuntimeHealthRepository(client);
});
