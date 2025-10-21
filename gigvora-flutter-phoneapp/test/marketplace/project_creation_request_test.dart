import 'package:flutter_test/flutter_test.dart';

import 'package:gigvora_mobile/features/marketplace/data/models/project_creation_request.dart';

void main() {
  group('ProjectCreationRequest', () {
    test('normalised weights clamp values and sum to one', () {
      final request = ProjectCreationRequest(
        title: 'Ops',
        description: 'Automate onboarding',
        weights: {
          'recency': 5,
          'rating': double.infinity,
          'completionQuality': -2,
        },
      );

      final weights = request.normalizedWeights;
      expect(weights.values.every((value) => value >= 0 && value <= 1), isTrue);
      final total = weights.values.fold<double>(0, (sum, value) => sum + value);
      expect(total, closeTo(1, 0.0001));
    });

    test('toJson builds auto-assign payload with defaults', () {
      final request = ProjectCreationRequest(
        title: 'Automation',
        description: 'Build mission control',
        status: '  launch  ',
        location: ' Remote ',
        budgetAmount: 18000,
        budgetCurrency: 'gbp',
        limit: 6,
        expiresInMinutes: 90,
        fairnessMaxAssignments: 3,
        actorId: 99,
      );

      final json = request.toJson();
      expect(json['title'], 'Automation');
      expect(json['status'], 'launch');
      expect(json['budgetCurrency'], 'GBP');
      expect(json['autoAssign']['enabled'], isTrue);
      expect(json['autoAssign']['limit'], 6);
      expect(json['autoAssign']['fairness']['maxAssignments'], 3);
      expect(json['autoAssign']['weights'], isA<Map<String, double>>());
    });

    test('toJson disables auto-assign when flag set to false', () {
      final request = ProjectCreationRequest(
        title: 'Manual project',
        description: 'Curate crew by hand',
        autoAssignEnabled: false,
      );

      final json = request.toJson();
      expect(json['autoAssign'], equals({'enabled': false}));
    });
  });
}
