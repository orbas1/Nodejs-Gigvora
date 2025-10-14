import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gigvora_foundation/gigvora_foundation.dart';

import '../../core/providers.dart';
import 'data/ad_repository.dart';
import 'data/models/ad_placement.dart';

final adRepositoryProvider = Provider<AdRepository>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  final cache = ref.watch(offlineCacheProvider);
  return AdRepository(apiClient, cache);
});

final adPlacementsProvider = FutureProvider.family<RepositoryResult<List<AdPlacement>>, String>((ref, surface) async {
  final repository = ref.watch(adRepositoryProvider);
  return repository.fetchPlacements(surface: surface);
});
