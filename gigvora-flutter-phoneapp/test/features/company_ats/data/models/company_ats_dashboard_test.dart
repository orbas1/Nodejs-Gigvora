import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';

import 'package:gigvora_mobile/features/company_ats/data/company_ats_sample.dart';
import 'package:gigvora_mobile/features/company_ats/data/models/company_ats_dashboard.dart';

void main() {
  test('parses bundled sample data and preserves key metrics', () {
    final dashboard = CompanyAtsDashboard.fromJson(companyAtsSample);

    expect(dashboard.metrics, isNotEmpty);
    expect(dashboard.approvals.total, greaterThanOrEqualTo(0));
    expect(dashboard.readiness.status, isNotEmpty);
    expect(dashboard.candidateExperience.averageScore, isNotNull);
  });

  test('serialises back to JSON compatible with transport format', () {
    final dashboard = CompanyAtsDashboard.fromJson(companyAtsSample);
    final serialised = dashboard.toJson();

    expect(serialised['metrics'], isA<List>());
    expect(serialised['readiness'], isA<Map<String, dynamic>>());

    final encoded = jsonDecode(jsonEncode(serialised)) as Map<String, dynamic>;
    final roundTrip = CompanyAtsDashboard.fromJson(encoded);

    expect(roundTrip.metrics.length, dashboard.metrics.length);
    expect(roundTrip.approvals.total, dashboard.approvals.total);
    expect(roundTrip.activity.approvalsCompleted, dashboard.activity.approvalsCompleted);
  });
}
