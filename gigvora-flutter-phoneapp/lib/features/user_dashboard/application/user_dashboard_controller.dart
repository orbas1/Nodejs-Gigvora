import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/user_dashboard_repository.dart';
import '../domain/user_dashboard.dart';

class UserDashboardController extends AutoDisposeAsyncNotifier<UserDashboardSnapshot> {
  @override
  Future<UserDashboardSnapshot> build() {
    final repository = ref.watch(userDashboardRepositoryProvider);
    return repository.fetchDashboard();
  }

  Future<void> refresh({bool forceRefresh = false}) async {
    final repository = ref.read(userDashboardRepositoryProvider);
    state = const AsyncLoading();
    state = await AsyncValue.guard(() => repository.fetchDashboard(forceRefresh: forceRefresh));
  }
}

final userDashboardRepositoryProvider = Provider<UserDashboardRepository>((ref) {
  return UserDashboardRepository();
});

final userDashboardControllerProvider =
    AutoDisposeAsyncNotifierProvider<UserDashboardController, UserDashboardSnapshot>(
  UserDashboardController.new,
);
