import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:gigvora_mobile/features/marketplace/presentation/jobs_sections.dart';

Widget _wrapWithMaterialApp(Widget child) {
  return MaterialApp(
    home: Scaffold(body: child),
  );
}

void main() {
  group('JobApplicationsPanel', () {
    testWidgets('invokes callbacks for application actions', (tester) async {
      var viewedApplicationId = '';
      var uploadedApplicationId = '';
      var exploredJobs = false;

      final applications = [
        JobApplication(
          id: 'app-1',
          role: 'Product Designer',
          company: 'Gigvora',
          stage: JobApplicationStage.reviewing,
          submittedAt: DateTime.now().subtract(const Duration(days: 2)),
          lastUpdated: DateTime.now().subtract(const Duration(days: 1)),
          nextStep: 'Share updated portfolio',
          requiresAction: true,
        ),
      ];

      await tester.pumpWidget(
        _wrapWithMaterialApp(
          JobApplicationsPanel(
            applications: applications,
            actions: JobApplicationActions(
              onViewApplication: (application) => viewedApplicationId = application.id,
              onUploadUpdate: (application) => uploadedApplicationId = application.id,
              onExploreJobs: () => exploredJobs = true,
            ),
          ),
        ),
      );

      await tester.pumpAndSettle();

      await tester.tap(find.byKey(const ValueKey('view_application_app-1')));
      await tester.pump();
      expect(viewedApplicationId, 'app-1');

      await tester.tap(find.byKey(const ValueKey('upload_update_app-1')));
      await tester.pump();
      expect(uploadedApplicationId, 'app-1');

      await tester.drag(find.byType(ListView), const Offset(0, -400));
      await tester.pump();
      await tester.tap(find.byKey(const ValueKey('browse_open_jobs_empty_state')));
      await tester.pump();
      expect(exploredJobs, isTrue);
    });
  });

  group('JobInterviewsPanel', () {
    testWidgets('invokes callbacks for empty state actions', (tester) async {
      var reviewedApplications = false;

      await tester.pumpWidget(
        _wrapWithMaterialApp(
          JobInterviewsPanel(
            interviews: const [],
            actions: JobInterviewActions(
              onAddToCalendar: (_) {},
              onShareAvailability: (_) {},
              onReviewApplications: () => reviewedApplications = true,
            ),
          ),
        ),
      );

      await tester.pumpAndSettle();

      await tester.tap(find.byKey(const ValueKey('review_your_applications_empty_state')));
      await tester.pump();

      expect(reviewedApplications, isTrue);
    });

    testWidgets('invokes callbacks for interview actions', (tester) async {
      var addedToCalendar = '';
      var sharedAvailability = '';

      final interviews = [
        JobInterview(
          id: 'int-1',
          role: 'Engineering Manager',
          company: 'Gigvora',
          stage: 'Panel interview',
          scheduledAt: DateTime.now().add(const Duration(days: 3)),
          format: InterviewFormat.virtual,
          host: 'Alex',
          location: 'Zoom',
          prepNotes: 'Prepare system design refresher.',
        ),
      ];

      await tester.pumpWidget(
        _wrapWithMaterialApp(
          JobInterviewsPanel(
            interviews: interviews,
            actions: JobInterviewActions(
              onAddToCalendar: (interview) => addedToCalendar = interview.id,
              onShareAvailability: (interview) => sharedAvailability = interview.id,
              onReviewApplications: () {},
            ),
          ),
        ),
      );

      await tester.pumpAndSettle();

      await tester.tap(find.byKey(const ValueKey('add_to_calendar_int-1')));
      await tester.pump();
      expect(addedToCalendar, 'int-1');

      await tester.tap(find.byKey(const ValueKey('share_availability_int-1')));
      await tester.pump();
      expect(sharedAvailability, 'int-1');
    });
  });

  group('JobsManagementPanel', () {
    testWidgets('invokes callbacks for job management actions', (tester) async {
      var postRoleTapped = false;
      var syncAtsTapped = false;
      var reviewedJobId = '';
      var sharedUpdateJobId = '';

      final jobs = [
        ManagedJob(
          id: 'job-42',
          title: 'Senior Product Designer',
          team: 'Design Systems',
          status: 'Open',
          pipelineStage: 'Interviews',
          totalApplicants: 18,
          lastActivity: DateTime.now().subtract(const Duration(hours: 6)),
          highlight: '4 candidates need scorecards this week.',
        ),
      ];

      await tester.pumpWidget(
        _wrapWithMaterialApp(
          JobsManagementPanel(
            jobs: jobs,
            actions: ManagedJobActions(
              onPostRole: () => postRoleTapped = true,
              onSyncAts: () => syncAtsTapped = true,
              onReviewCandidates: (job) => reviewedJobId = job.id,
              onShareUpdate: (job) => sharedUpdateJobId = job.id,
            ),
          ),
        ),
      );

      await tester.pumpAndSettle();

      await tester.tap(find.byKey(const ValueKey('post_role_action')));
      await tester.pump();
      expect(postRoleTapped, isTrue);

      await tester.tap(find.byKey(const ValueKey('sync_ats_action')));
      await tester.pump();
      expect(syncAtsTapped, isTrue);

      await tester.tap(find.byKey(const ValueKey('review_candidates_job-42')));
      await tester.pump();
      expect(reviewedJobId, 'job-42');

      await tester.tap(find.byKey(const ValueKey('share_update_job-42')));
      await tester.pump();
      expect(sharedUpdateJobId, 'job-42');
    });
  });
}
