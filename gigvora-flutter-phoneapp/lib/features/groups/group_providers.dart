import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gigvora_foundation/gigvora_foundation.dart';

import '../../core/providers.dart';
import 'application/group_management_controller.dart';
import 'data/group_repository.dart';

final groupManagementControllerProvider = StateNotifierProvider<GroupManagementController, GroupManagementState>((ref) {
  final repository = ref.watch(groupRepositoryProvider);
  return GroupManagementController(repository);
});
