import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:gigvora_mobile/features/auth/application/session_controller.dart';
import 'package:gigvora_mobile/features/auth/domain/session.dart';
import 'package:gigvora_mobile/features/marketplace/application/project_creation_controller.dart';
import 'package:gigvora_mobile/features/marketplace/data/models/project_creation_request.dart';
import 'package:gigvora_mobile/features/marketplace/data/project_repository.dart';
import 'package:gigvora_mobile/features/marketplace/presentation/project_post_screen.dart';

import '../support/test_api_client.dart';
import '../support/test_analytics_service.dart';

class _FakeProjectRepository extends ProjectRepository {
  _FakeProjectRepository() : super(TestApiClient(onPost: (_, __) async => <String, dynamic>{'id': 'demo'}));

  @override
  Future<Map<String, dynamic>> createProject(ProjectCreationRequest request) async {
    return {'id': 'demo'};
  }
}

void main() {
  group('ProjectPostScreen', () {
    testWidgets('shows access requirements when session is not eligible', (tester) async {
      await tester.pumpWidget(
        const ProviderScope(
          child: MaterialApp(home: ProjectPostScreen()),
        ),
      );

      await tester.pumpAndSettle();

      expect(find.text('Workspace access required'), findsOneWidget);
      expect(find.text('Project details'), findsNothing);
    });

    testWidgets('surfaces success banner when controller reports completion', (tester) async {
      final sessionController = SessionController();
      sessionController.login(
        UserSession.demo().copyWith(
          memberships: const ['company', 'user'],
          activeMembership: 'company',
        ),
      );

      final controller = ProjectCreationController(_FakeProjectRepository(), TestAnalyticsService());
      controller.state = const ProjectCreationState(success: true);

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            sessionControllerProvider.overrideWith((ref) => sessionController),
            projectCreationControllerProvider.overrideWith((ref) => controller),
          ],
          child: const MaterialApp(home: ProjectPostScreen()),
        ),
      );

      await tester.pumpAndSettle();

      expect(find.text('Project details'), findsOneWidget);
      expect(
        find.text('Project created successfully. Redirecting you back to the programmes view…'),
        findsOneWidget,
      );
    });
  });
}
