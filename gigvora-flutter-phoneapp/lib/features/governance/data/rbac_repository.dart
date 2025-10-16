import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gigvora_foundation/gigvora_foundation.dart';

import '../../../core/providers.dart';
import '../domain/rbac_matrix.dart';

class RbacRepository {
  RbacRepository(this._client);

  final ApiClient _client;

  Future<RbacMatrix> fetchMatrix() async {
    final response = await _client.get('/api/admin/governance/rbac/matrix') as Map<String, dynamic>;
    return RbacMatrix.fromJson(response);
  }
}

final rbacRepositoryProvider = Provider<RbacRepository>((ref) {
  final client = ref.watch(apiClientProvider);
  return RbacRepository(client);
});
