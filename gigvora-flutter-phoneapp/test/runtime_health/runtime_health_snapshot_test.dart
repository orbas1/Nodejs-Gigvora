import 'package:flutter_test/flutter_test.dart';
import 'package:gigvora_mobile/features/runtime_health/domain/runtime_health_snapshot.dart';

void main() {
  group('RuntimeHealthSnapshot enterprise360', () {
    test('parses continuity and governance risk indicators', () {
      final snapshot = RuntimeHealthSnapshot.fromJson(
        {
          'status': 'ready',
          'httpStatus': 200,
          'timestamp': '2024-04-05T12:00:00Z',
          'dependencies': const <String, dynamic>{},
          'enterprise360': {
            'summary': {
              'parityScore': 97.2,
              'mobileReadinessScore': 95.3,
              'releaseVelocityWeeks': 2.8,
              'nextReleaseWindow': '2024-04-15T09:00:00Z',
              'mobileContinuityRisk': 'critical',
              'atRiskInitiativeCount': 2,
            },
            'continuity': {
              'riskLevel': 'critical',
              'averageParity': 95.8,
              'averageReadiness': 93.1,
              'platforms': [
                {
                  'platformKey': 'ios_companion',
                  'platformName': 'iOS Companion',
                  'status': 'blocked',
                  'parityScore': 94.0,
                  'mobileReadiness': 92.5,
                  'nextReleaseWindow': '2024-04-10T09:00:00Z',
                  'blockers': [
                    {
                      'code': 'app_store_review',
                      'severity': 'high',
                      'summary': 'Awaiting App Store privacy approval.',
                      'owner': 'mobile-platform',
                    },
                  ],
                },
              ],
            },
            'governance': {
              'cadence': 'Weekly tiger team sync',
              'nextSteeringDate': '2024-04-12T15:00:00Z',
              'lastReviewedAt': '2024-03-28T12:00:00Z',
              'atRiskCount': 2,
              'executiveOwners': ['Alex Morgan', 'Jamie Rivera'],
            },
            'tracks': [
              {
                'platformKey': 'ios_companion',
                'platformName': 'iOS Companion',
                'status': 'blocked',
                'parityScore': 94.0,
                'mobileReadiness': 92.5,
                'nextReleaseWindow': '2024-04-10T09:00:00Z',
                'blockers': [
                  {
                    'code': 'app_store_review',
                    'severity': 'high',
                    'summary': 'Awaiting App Store privacy approval.',
                    'owner': 'mobile-platform',
                  },
                ],
              },
              {
                'platformKey': 'web_command_center',
                'platformName': 'Web Command Center',
                'status': 'stable',
                'parityScore': 99.1,
                'mobileReadiness': 98.4,
                'nextReleaseWindow': '2024-04-14T09:00:00Z',
                'blockers': const <Map<String, dynamic>>[],
              },
            ],
            'initiatives': [
              {
                'initiativeKey': 'enterprise-360-rollout',
                'title': 'Enterprise 360 Rollout',
                'executiveOwner': 'Alex Morgan',
                'sponsorTeam': 'Platform PMO',
                'status': 'on_track',
                'progressPercent': 74.5,
                'nextMilestoneAt': '2024-04-18T16:00:00Z',
                'outcomeMetric': 'Parity score > 95',
                'narrative': 'Deploy unified telemetry across all surfaces.',
              },
              {
                'initiativeKey': 'mobile-governance',
                'title': 'Mobile Governance Harmonisation',
                'executiveOwner': 'Jamie Rivera',
                'sponsorTeam': 'Security & Compliance',
                'status': 'at_risk',
                'progressPercent': 46.0,
                'nextMilestoneAt': '2024-04-12T11:00:00Z',
                'outcomeMetric': 'Zero critical audit findings',
                'narrative': 'Align consent flows and analytics with enterprise policy.',
              },
            ],
            'generatedAt': '2024-04-05T12:00:00Z',
          },
        },
      );

      expect(snapshot.enterprise360, isNotNull);
      expect(snapshot.enterprise360!.summary.parityScore, closeTo(97.2, 0.01));
      expect(snapshot.enterprise360!.summary.mobileContinuityRisk, equals('critical'));
      expect(snapshot.enterprise360!.continuity.platforms.first.isBlocked, isTrue);
      expect(snapshot.enterprise360!.continuity.platforms.first.blockers.first.isCritical, isTrue);
      expect(snapshot.hasEnterpriseContinuityRisk, isTrue);
      expect(snapshot.hasEnterpriseGovernanceRisk, isTrue);
      expect(snapshot.enterprise360!.governance.executiveOwners, contains('Alex Morgan'));
      expect(snapshot.enterprise360!.initiatives.last.isAtRisk, isTrue);
    });
  });
}
