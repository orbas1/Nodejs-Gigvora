import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:gigvora_mobile/features/governance/application/rbac_matrix_provider.dart';
import 'package:gigvora_mobile/features/governance/domain/rbac_matrix.dart';
import 'package:gigvora_mobile/features/governance/presentation/rbac_matrix_card.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  final matrix = RbacMatrix(
    version: '2024.10.21',
    publishedAt: DateTime.utc(2024, 4, 1, 8),
    reviewCadenceDays: 30,
    personas: [
      RbacPersona(
        key: 'platform_admin',
        label: 'Platform Administrator',
        description: 'Owns production configuration and emergency response.',
        defaultChannels: const ['email', 'slack'],
        escalationTarget: 'security.operations',
        grants: const [],
      ),
      RbacPersona(
        key: 'security_officer',
        label: 'Security Officer',
        description: 'Handles perimeter enforcement and incident response.',
        defaultChannels: const ['pagerduty'],
        escalationTarget: 'chief.security.officer',
        grants: const [],
      ),
    ],
    guardrails: [
      RbacGuardrail(
        key: 'mfa-enforcement',
        label: 'Multi-factor enforcement',
        description: 'Privileged actions require WebAuthn or TOTP.',
        coverage: const ['platform_admin', 'security_officer'],
        severity: 'critical',
      ),
      RbacGuardrail(
        key: 'change-window-governance',
        label: 'Change window governance',
        description: 'Runtime changes restricted to approved windows.',
        coverage: const ['platform_admin'],
        severity: 'high',
      ),
      RbacGuardrail(
        key: 'dual-approval',
        label: 'Dual approval for secret rotation',
        description: 'Secret rotations require dual approval before execution.',
        coverage: const ['platform_admin'],
        severity: 'high',
      ),
    ],
    resources: [
      RbacResource(
        key: 'runtime.telemetry',
        label: 'Runtime telemetry & readiness',
        description: 'Aggregated readiness snapshots and exporter freshness.',
        owner: 'Platform Operations',
        dataClassification: 'Operational — restricted',
        surfaces: const ['admin-dashboard'],
      ),
    ],
  );

  group('RbacMatrixCard', () {
    testWidgets('shows loading skeleton while the matrix is fetching', (tester) async {
      final completer = Completer<RbacMatrix?>();

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            rbacMatrixProvider.overrideWith((ref) => completer.future),
          ],
          child: const MaterialApp(
            home: Scaffold(body: RbacMatrixCard()),
          ),
        ),
      );

      expect(find.text('Security guardrails'), findsOneWidget);
      expect(find.textContaining('RBAC telemetry will appear here'), findsNothing);

      completer.complete(null);
      await tester.pumpAndSettle();
    });

    testWidgets('renders guardrail metrics and next review cadence', (tester) async {
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            rbacMatrixProvider.overrideWith((ref) async => matrix),
          ],
          child: const MaterialApp(
            home: Scaffold(body: RbacMatrixCard()),
          ),
        ),
      );

      await tester.pumpAndSettle();

      expect(find.text('3 guardrails across 2 personas'), findsOneWidget);
      expect(find.text('Guardrails'), findsOneWidget);
      expect(find.text('Resources'), findsOneWidget);
      expect(find.text('Review cadence'), findsOneWidget);
      expect(find.textContaining('Next review'), findsOneWidget);
      expect(find.text('Multi-factor enforcement'), findsOneWidget);
      expect(find.text('Runtime telemetry & readiness'), findsOneWidget);
    });

    testWidgets('shows empty state guidance when no matrix is available', (tester) async {
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            rbacMatrixProvider.overrideWith((ref) async => null),
          ],
          child: const MaterialApp(
            home: Scaffold(body: RbacMatrixCard()),
          ),
        ),
      );

      await tester.pumpAndSettle();

      expect(
        find.text('RBAC telemetry will appear here once your account is assigned to an operations or security persona.'),
        findsOneWidget,
      );
    });

    testWidgets('surfaces provider failures with actionable messaging', (tester) async {
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            rbacMatrixProvider.overrideWith(
              (ref) => Future<RbacMatrix?>.error(Exception('RBAC service unavailable')),
            ),
          ],
          child: const MaterialApp(
            home: Scaffold(body: RbacMatrixCard()),
          ),
        ),
      );

      await tester.pumpAndSettle();

      expect(find.textContaining('RBAC service unavailable'), findsOneWidget);
    });
  });
}
