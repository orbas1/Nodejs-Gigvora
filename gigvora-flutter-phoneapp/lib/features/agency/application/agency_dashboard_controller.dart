import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/agency_dashboard_repository.dart';
import '../domain/agency_dashboard.dart';

class AgencyDashboardController extends AutoDisposeAsyncNotifier<AgencyDashboardSnapshot> {
  @override
  Future<AgencyDashboardSnapshot> build() {
    final repository = ref.watch(agencyDashboardRepositoryProvider);
    return repository.fetchDashboard();
  }

  Future<void> refresh({bool forceRefresh = false}) async {
    final repository = ref.read(agencyDashboardRepositoryProvider);
    state = const AsyncLoading();
    state = await AsyncValue.guard(() => repository.fetchDashboard(forceRefresh: forceRefresh));
  }
}

final agencyDashboardRepositoryProvider = Provider<AgencyDashboardRepository>((ref) {
  return AgencyDashboardRepository();
});

final agencyDashboardControllerProvider =
    AutoDisposeAsyncNotifierProvider<AgencyDashboardController, AgencyDashboardSnapshot>(
  AgencyDashboardController.new,
);
