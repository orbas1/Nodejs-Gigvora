import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/domain_governance_repository.dart';
import '../domain/domain_governance_models.dart';

final domainGovernanceSummariesProvider =
    FutureProvider<DomainGovernanceSummaryResponse>((ref) async {
  final repository = ref.watch(domainGovernanceRepositoryProvider);
  return repository.fetchSummaries();
});
