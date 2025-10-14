import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/providers.dart';
import '../data/cv_document_repository.dart';
import '../data/models/cv_workspace_snapshot.dart';

typedef CvWorkspaceKey = int;

final cvWorkspaceProvider = FutureProvider.autoDispose
    .family<CvWorkspaceSnapshot, CvWorkspaceKey>((ref, userId) async {
  final repository = ref.watch(cvDocumentRepositoryProvider);
  final headers = ref.watch(membershipHeadersProvider);
  final result = await repository.fetchWorkspace(
    userId,
    headers: headers,
  );
  return result.data;
});
