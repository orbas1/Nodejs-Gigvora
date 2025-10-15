import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:gigvora_mobile/features/core/providers.dart';
import 'package:gigvora_mobile/features/governance/application/domain_governance_provider.dart';
import 'package:gigvora_mobile/features/governance/domain/domain_governance_models.dart';
import 'package:gigvora_mobile/features/governance/presentation/domain_governance_summary_card.dart';

import '../../support/test_api_client.dart';
import '../../support/test_design_tokens.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('DomainGovernanceSummaryCard', () {
    testWidgets('displays loading indicator while summaries are fetching', (tester) async {
      final completer = Completer<DomainGovernanceSummaryResponse>();

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            domainGovernanceSummariesProvider.overrideWith((ref) => completer.future),
            designTokensProvider.overrideWith((ref) async => buildTestDesignTokens()),
            apiClientProvider.overrideWith((ref) => TestApiClient()),
          ],
          child: const MaterialApp(
            home: Scaffold(body: DomainGovernanceSummaryCard()),
          ),
        ),
      );

      expect(find.text('Loading governance snapshot…'), findsOneWidget);

      completer.complete(
        DomainGovernanceSummaryResponse(
          contexts: const [],
          generatedAt: DateTime.now(),
        ),
      );

      await tester.pumpAndSettle();
    });

    testWidgets('renders error state when the provider fails', (tester) async {
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            domainGovernanceSummariesProvider.overrideWith(
              (ref) => Future<DomainGovernanceSummaryResponse>.error(Exception('Network down')),
            ),
            designTokensProvider.overrideWith((ref) async => buildTestDesignTokens()),
            apiClientProvider.overrideWith((ref) => TestApiClient()),
          ],
          child: const MaterialApp(
            home: Scaffold(body: DomainGovernanceSummaryCard()),
          ),
        ),
      );

      await tester.pumpAndSettle();

      expect(find.textContaining('Unable to fetch data governance status.'), findsOneWidget);
      expect(find.textContaining('Network down'), findsOneWidget);
    });

    testWidgets('orders contexts by remediation severity and surfaces metadata', (tester) async {
      final generatedAt = DateTime.utc(2024, 4, 22, 10, 30);
      final response = DomainGovernanceSummaryResponse(
        contexts: [
          DomainGovernanceSummary(
            contextName: 'payments',
            displayName: 'Payments Platform',
            dataClassification: 'Restricted',
            ownerTeam: 'Treasury Ops',
            dataSteward: 'Finance Governance',
            piiModelCount: 6,
            piiFieldCount: 42,
            reviewStatus: 'approved',
            reviewedAt: generatedAt.subtract(const Duration(days: 20)),
            nextReviewDueAt: generatedAt.add(const Duration(days: 70)),
            automationCoverage: 0.94,
            remediationItems: 0,
          ),
          DomainGovernanceSummary(
            contextName: 'talent',
            displayName: 'Talent Graph',
            dataClassification: 'Confidential',
            ownerTeam: 'Marketplace Ops',
            dataSteward: 'Talent Experience',
            piiModelCount: 4,
            piiFieldCount: 18,
            reviewStatus: 'in_progress',
            reviewedAt: generatedAt.subtract(const Duration(days: 35)),
            nextReviewDueAt: generatedAt.add(const Duration(days: 30)),
            automationCoverage: 0.81,
            remediationItems: 3,
          ),
          DomainGovernanceSummary(
            contextName: 'auth',
            displayName: 'Identity Core',
            dataClassification: 'Restricted',
            ownerTeam: 'Security Engineering',
            dataSteward: 'Compliance Office',
            piiModelCount: 5,
            piiFieldCount: 27,
            reviewStatus: 'remediation_required',
            reviewedAt: generatedAt.subtract(const Duration(days: 60)),
            nextReviewDueAt: generatedAt.add(const Duration(days: 7)),
            automationCoverage: 0.62,
            remediationItems: 5,
          ),
          DomainGovernanceSummary(
            contextName: 'marketing',
            displayName: 'Marketing Automation',
            dataClassification: 'Internal',
            ownerTeam: 'Growth',
            dataSteward: 'Content Platform',
            piiModelCount: 2,
            piiFieldCount: 4,
            reviewStatus: 'unknown',
            reviewedAt: null,
            nextReviewDueAt: null,
            automationCoverage: null,
            remediationItems: null,
          ),
        ],
        generatedAt: generatedAt,
      );

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            domainGovernanceSummariesProvider.overrideWith((ref) async => response),
            designTokensProvider.overrideWith((ref) async => buildTestDesignTokens()),
            apiClientProvider.overrideWith((ref) => TestApiClient()),
          ],
          child: const MaterialApp(
            home: Scaffold(body: DomainGovernanceSummaryCard()),
          ),
        ),
      );

      await tester.pumpAndSettle();

      expect(find.text('Identity Core'), findsOneWidget);
      expect(find.text('Talent Graph'), findsOneWidget);
      expect(find.text('Payments Platform'), findsOneWidget);
      expect(find.text('Marketing Automation'), findsNothing);

      final remediationChipOffset = tester.getTopLeft(find.text('Remediation required'));
      final inProgressChipOffset = tester.getTopLeft(find.text('In progress'));
      final approvedChipOffset = tester.getTopLeft(find.text('Approved'));

      expect(remediationChipOffset.dy < inProgressChipOffset.dy, isTrue);
      expect(inProgressChipOffset.dy < approvedChipOffset.dy, isTrue);

      expect(find.textContaining('6 models • 42 PII fields'), findsOneWidget);
      expect(find.textContaining('Snapshot generated'), findsOneWidget);
      expect(find.textContaining('Apr'), findsWidgets);
    });
  });
}
