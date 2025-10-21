import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:gigvora_mobile/features/auth/application/session_controller.dart';
import 'package:gigvora_mobile/features/auth/domain/session.dart';
import 'package:gigvora_mobile/features/marketplace/presentation/project_auto_match_screen.dart';
import 'package:gigvora_mobile/features/marketplace/application/project_auto_match_controller.dart';
import 'package:gigvora_mobile/features/marketplace/data/project_auto_match_repository.dart';

import '../support/test_api_client.dart';

class _FakeProjectAutoMatchRepository extends ProjectAutoMatchRepository {
  _FakeProjectAutoMatchRepository()
      : super(TestApiClient(
          onGet: (_) async => <String, dynamic>{},
          onPost: (_, __) async => <String, dynamic>{},
        ));

  @override
  Future<ProjectAutoMatchSnapshot> fetchSnapshot(int projectId) async {
    return ProjectAutoMatchSnapshot(
      project: ProjectAutoMatchProject(
        id: projectId,
        title: 'Demo project',
        description: 'Synchronised launch across squads.',
        status: 'active',
        budgetAmount: 12500,
        budgetCurrency: 'USD',
        autoAssignStatus: 'generated',
      ),
      entries: [
        ProjectAutoMatchEntry(
          id: 1,
          freelancerId: 12,
          status: 'pending',
          score: 0.82,
          priorityBucket: 1,
          position: 1,
          expiresAt: DateTime(2024, 1, 1, 10),
          metadata: const {'fairness': {'maxAssignments': 2}},
          breakdown: const {'recency': 24, 'rating': 18},
          freelancer: const ProjectAutoMatchFreelancer(id: 12, firstName: 'Kai', lastName: 'Lopez'),
        ),
      ],
      retrievedAt: DateTime(2024, 1, 1, 9),
    );
  }

  @override
  Future<void> regenerateQueue(int projectId, ProjectAutoMatchCommand command) async {}
}

void main() {
  group('ProjectAutoMatchScreen', () {
    testWidgets('requires a project context', (tester) async {
      await tester.pumpWidget(
        const ProviderScope(
          child: MaterialApp(home: ProjectAutoMatchScreen(projectId: null)),
        ),
      );

      await tester.pump();

      expect(find.textContaining('No project selected'), findsOneWidget);
    });

    testWidgets('blocks access when membership is insufficient', (tester) async {
      final sessionController = SessionController();
      sessionController.login(
        UserSession.demo().copyWith(
          memberships: const ['freelancer', 'user'],
          activeMembership: 'freelancer',
        ),
      );

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            sessionControllerProvider.overrideWith((ref) => sessionController),
            projectAutoMatchRepositoryProvider.overrideWithValue(_FakeProjectAutoMatchRepository()),
          ],
          child: const MaterialApp(home: ProjectAutoMatchScreen(projectId: 99)),
        ),
      );

      await tester.pumpAndSettle();

      expect(find.byKey(const Key('project_auto_match_membership_card')), findsOneWidget);
      expect(find.textContaining('Operations access only'), findsOneWidget);
    });

    testWidgets('renders queue telemetry for authorised roles', (tester) async {
      final sessionController = SessionController();
      sessionController.login(
        UserSession.demo().copyWith(
          memberships: const ['company', 'user'],
          activeMembership: 'company',
        ),
      );

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            sessionControllerProvider.overrideWith((ref) => sessionController),
            projectAutoMatchRepositoryProvider.overrideWithValue(_FakeProjectAutoMatchRepository()),
          ],
          child: const MaterialApp(home: ProjectAutoMatchScreen(projectId: 42)),
        ),
      );

      await tester.pumpAndSettle();

      expect(find.textContaining('Project overview'), findsOneWidget);
      expect(find.textContaining('Queue telemetry'), findsOneWidget);
      expect(find.textContaining('Total'), findsWidgets);
    });
  });
}
