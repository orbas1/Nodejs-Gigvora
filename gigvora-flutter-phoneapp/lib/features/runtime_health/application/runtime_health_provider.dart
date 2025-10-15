import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/runtime_health_repository.dart';
import '../domain/runtime_health_snapshot.dart';

final runtimeHealthStreamProvider = StreamProvider<RuntimeHealthSnapshot>((ref) async* {
  final repository = ref.watch(runtimeHealthRepositoryProvider);
  final controller = StreamController<RuntimeHealthSnapshot>();
  Timer? timer;

  Future<void> poll({bool quiet = false}) async {
    try {
      final snapshot = await repository.fetch();
      if (!controller.isClosed) {
        controller.add(snapshot);
      }
    } catch (error, stackTrace) {
      if (!quiet && !controller.isClosed) {
        controller.addError(error, stackTrace);
      }
    }
  }

  await poll();
  timer = Timer.periodic(const Duration(minutes: 1), (_) => poll(quiet: true));

  ref.onDispose(() {
    timer?.cancel();
    controller.close();
  });

  yield* controller.stream;
});
