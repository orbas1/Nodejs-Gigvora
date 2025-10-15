import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:gigvora_foundation/gigvora_foundation.dart';

import '../../core/providers.dart';
import '../domain/domain_governance_models.dart';

class DomainGovernanceRepository {
  DomainGovernanceRepository(this._client);

  final ApiClient _client;

  Future<DomainGovernanceSummaryResponse> fetchSummaries() async {
    final response = await _client.get('/domains/governance') as Map<String, dynamic>;
    final contexts = (response['contexts'] as List<dynamic>? ?? const [])
        .map((item) => DomainGovernanceSummary.fromJson(item as Map<String, dynamic>))
        .toList();
    final generatedAt = response['generatedAt'] is String
        ? DateTime.tryParse(response['generatedAt'] as String)
        : null;
    return DomainGovernanceSummaryResponse(
      contexts: contexts,
      generatedAt: generatedAt ?? DateTime.now(),
    );
  }

  Future<DomainGovernanceDetail> fetchDetail(String contextName) async {
    final response = await _client.get('/domains/$contextName/governance') as Map<String, dynamic>;
    return DomainGovernanceDetail.fromJson(response);
  }
}

final domainGovernanceRepositoryProvider = Provider<DomainGovernanceRepository>((ref) {
  final client = ref.watch(apiClientProvider);
  return DomainGovernanceRepository(client);
});
