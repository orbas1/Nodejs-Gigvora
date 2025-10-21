import 'package:flutter_test/flutter_test.dart';

import 'package:gigvora_mobile/features/user_dashboard/data/user_dashboard_repository.dart';
import 'package:gigvora_mobile/features/user_dashboard/domain/user_dashboard.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  UserDashboardSnapshot buildBaselineSnapshot(UserDashboardSnapshot snapshot) {
    return UserDashboardSnapshot(
      generatedAt: snapshot.generatedAt,
      fromCache: snapshot.fromCache,
      summary: snapshot.summary,
      pipeline: snapshot.pipeline,
      upcomingInterviews: snapshot.upcomingInterviews,
      documentStudio: snapshot.documentStudio,
      nextActions: snapshot.nextActions,
      focusDigest: snapshot.focusDigest,
      complianceAlerts: snapshot.complianceAlerts,
      affiliateProgram: snapshot.affiliateProgram,
    );
  }

  test('reuses cached snapshot within the TTL window', () async {
    final repository = UserDashboardRepository();

    final first = await repository.fetchDashboard();
    expect(first.fromCache, isFalse);

    final second = await repository.fetchDashboard();
    expect(second.fromCache, isTrue);

    final baseline = buildBaselineSnapshot(first);
    expect(second.summary, same(baseline.summary));
    expect(second.pipeline, same(baseline.pipeline));
    expect(second.upcomingInterviews, same(baseline.upcomingInterviews));
    expect(second.documentStudio, same(baseline.documentStudio));
    expect(second.focusDigest, same(baseline.focusDigest));
    expect(second.affiliateProgram, same(baseline.affiliateProgram));
  });

  test('force refresh bypasses cache and produces a fresh snapshot', () async {
    final repository = UserDashboardRepository();

    final first = await repository.fetchDashboard();
    final second = await repository.fetchDashboard(forceRefresh: true);

    expect(second.fromCache, isFalse);
    expect(second.generatedAt.isAfter(first.generatedAt), isTrue);
    expect(identical(second.summary, first.summary), isFalse);
    expect(identical(second.pipeline, first.pipeline), isFalse);
    expect(identical(second.documentStudio, first.documentStudio), isFalse);
  });
}
