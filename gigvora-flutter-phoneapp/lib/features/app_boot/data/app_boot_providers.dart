import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gigvora_foundation/gigvora_foundation.dart';

import '../../../router/app_routes.dart';
import '../../auth/application/session_controller.dart';
import 'app_boot_repository.dart';
import 'models/app_boot_snapshot.dart';

final appBootRepositoryProvider = Provider<AppBootRepository>((ref) {
  final apiClient = ServiceLocator.read<ApiClient>();
  return AppBootRepository(apiClient: apiClient);
});

final appBootSnapshotProvider = FutureProvider<AppBootSnapshot>((ref) async {
  ref.watch(sessionControllerProvider);
  final repository = ref.watch(appBootRepositoryProvider);
  final snapshot = await repository.fetchSnapshot();

  final segments = snapshot.preferences.deepLinkSegments.isNotEmpty
      ? snapshot.preferences.deepLinkSegments
      : snapshot.deepLinkSegments;
  if (segments.isNotEmpty) {
    AppRouteRegistry.syncDeepLinkSegments(segments);
  } else {
    AppRouteRegistry.syncDeepLinkSegments(snapshot.deepLinkSegments);
  }

  ref.onDispose(AppRouteRegistry.resetDeepLinkSegments);

  return snapshot;
});
