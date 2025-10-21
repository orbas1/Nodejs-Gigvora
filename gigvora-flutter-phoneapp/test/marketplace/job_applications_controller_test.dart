import 'package:flutter_test/flutter_test.dart';
import 'package:gigvora_foundation/gigvora_foundation.dart';

import 'package:gigvora_mobile/features/marketplace/application/job_applications_controller.dart';
import 'package:gigvora_mobile/features/marketplace/data/job_application_repository.dart';
import 'package:gigvora_mobile/features/marketplace/data/models/job_application_record.dart';

import '../helpers/in_memory_offline_cache.dart';
import '../helpers/test_dependencies.dart';

void main() {
  const jobId = 'growth-lead';

  group('JobApplicationsController', () {
    late RecordingAnalyticsService analytics;
    late _RecordingJobApplicationRepository repository;

    Future<JobApplicationsController> createController() async {
      analytics = RecordingAnalyticsService();
      repository = _RecordingJobApplicationRepository();
      final controller = JobApplicationsController(jobId, repository, analytics);
      addTearDown(controller.dispose);
      await Future<void>.delayed(const Duration(milliseconds: 10));
      return controller;
    }

    test('initial load hydrates applications and records analytics', () async {
      final controller = await createController();

      expect(repository.loadInvocations, isNotEmpty);
      final initialLoad = repository.loadInvocations.first;
      expect(initialLoad.jobId, equals(jobId));
      expect(initialLoad.forceRefresh, isFalse);

      final state = controller.state;
      expect(state.loading, isFalse);
      expect(state.error, isNull);
      expect(state.data, isNotNull);
      expect(state.data, isNotEmpty);
      expect(state.metadata['saving'], isFalse);

      final loadEvent = analytics.events.singleWhere(
        (event) => event.name == 'job_applications_loaded',
      );
      expect(loadEvent.context['jobId'], equals(jobId));
      expect(loadEvent.context['count'], equals(state.data!.length));
    });

    test('refresh requests a forced reload and emits analytics', () async {
      final controller = await createController();
      analytics.events.clear();
      repository.loadInvocations.clear();

      await controller.refresh();

      expect(repository.loadInvocations, isNotEmpty);
      final refreshLoad = repository.loadInvocations.single;
      expect(refreshLoad.forceRefresh, isTrue);

      final refreshEvent = analytics.events.singleWhere(
        (event) => event.name == 'job_applications_refreshed',
      );
      expect(refreshEvent.context['jobId'], equals(jobId));
      expect(
        analytics.events.where((event) => event.name == 'job_applications_loaded'),
        isEmpty,
      );
    });

    test('create inserts the draft, reloads, and resets saving metadata', () async {
      final controller = await createController();
      analytics.events.clear();
      repository.loadInvocations.clear();

      final draft = const JobApplicationDraft(
        applicantName: '  Alex Rivera  ',
        email: ' alex.rivera@example.com ',
        resumeUrl: ' https://cdn.gigvora.com/resumes/alex.pdf ',
        coverLetter: ' Interested in experimentation leadership. ',
      );

      final record = await controller.create(draft);

      expect(record.jobId, equals(jobId));
      expect(record.applicantName, equals('Alex Rivera'));
      expect(repository.lastCreateJobId, equals(jobId));

      final state = controller.state;
      expect(state.metadata['saving'], isFalse);
      expect(state.metadata['lastAction'], isNull);
      expect(state.data!.any((entry) => entry.id == record.id), isTrue);

      final load = repository.loadInvocations.last;
      expect(load.forceRefresh, isTrue);

      final createEvent = analytics.events.singleWhere(
        (event) => event.name == 'job_application_created',
      );
      expect(createEvent.context['applicationId'], equals(record.id));
      expect(createEvent.context['jobId'], equals(jobId));
    });

    test('save updates the application and captures analytics context', () async {
      final controller = await createController();
      final existing = controller.state.data!.first;
      analytics.events.clear();
      repository.loadInvocations.clear();

      final updated = await controller.save(
        existing.copyWith(status: JobApplicationStatus.offer),
      );

      expect(repository.lastSavedRecordId, equals(existing.id));
      expect(updated.status, equals(JobApplicationStatus.offer));

      final refreshed = controller.state.data!.firstWhere((entry) => entry.id == existing.id);
      expect(refreshed.status, equals(JobApplicationStatus.offer));

      final updateEvent = analytics.events.singleWhere(
        (event) => event.name == 'job_application_updated',
      );
      expect(updateEvent.context['status'], equals('offer'));
      expect(repository.loadInvocations.last.forceRefresh, isTrue);
    });

    test('delete removes the record and records analytics', () async {
      final controller = await createController();
      final target = controller.state.data!.first;
      analytics.events.clear();
      repository.loadInvocations.clear();

      await controller.delete(target.id);

      expect(repository.lastDeletedApplicationId, equals(target.id));
      expect(
        controller.state.data!.any((record) => record.id == target.id),
        isFalse,
      );

      final deleteEvent = analytics.events.singleWhere(
        (event) => event.name == 'job_application_deleted',
      );
      expect(deleteEvent.context['applicationId'], equals(target.id));
      expect(repository.loadInvocations.last.forceRefresh, isTrue);
    });

    test('scheduleInterview persists the step and updates status', () async {
      final controller = await createController();
      analytics.events.clear();
      repository.loadInvocations.clear();

      final candidate = controller.state.data!.firstWhere((app) => app.interviews.isEmpty);
      final step = InterviewStep(
        id: 'onsite-1',
        label: 'Onsite session',
        startsAt: DateTime.now().add(const Duration(days: 3)),
        host: 'Jordan Blake',
        format: 'Video',
      );

      await controller.scheduleInterview(candidate.id, step);

      expect(repository.lastUpsertInterview?.applicationId, equals(candidate.id));
      expect(repository.lastUpsertInterview?.step.id, equals(step.id));

      final refreshed = controller.state.data!.firstWhere((entry) => entry.id == candidate.id);
      expect(refreshed.status, equals(JobApplicationStatus.interviewing));
      expect(refreshed.interviews.any((entry) => entry.id == step.id), isTrue);

      final event = analytics.events.singleWhere(
        (event) => event.name == 'job_application_interview_scheduled',
      );
      expect(event.context['interviewId'], equals(step.id));
      expect(repository.loadInvocations.last.forceRefresh, isTrue);
    });

    test('cancelInterview removes the interview and emits analytics', () async {
      final controller = await createController();
      final recordWithInterview = controller.state.data!.firstWhere(
        (entry) => entry.interviews.isNotEmpty,
      );
      final interviewId = recordWithInterview.interviews.first.id;
      analytics.events.clear();
      repository.loadInvocations.clear();

      await controller.cancelInterview(recordWithInterview.id, interviewId);

      expect(repository.lastRemovedInterviewId, equals(interviewId));
      final refreshed = controller.state.data!.firstWhere((entry) => entry.id == recordWithInterview.id);
      expect(refreshed.interviews.any((step) => step.id == interviewId), isFalse);

      final event = analytics.events.singleWhere(
        (event) => event.name == 'job_application_interview_cancelled',
      );
      expect(event.context['applicationId'], equals(recordWithInterview.id));
      expect(event.context['interviewId'], equals(interviewId));
      expect(repository.loadInvocations.last.forceRefresh, isTrue);
    });

    test('updateStatus delegates to repository and tracks analytics', () async {
      final controller = await createController();
      final record = controller.state.data!.first;
      analytics.events.clear();
      repository.loadInvocations.clear();

      await controller.updateStatus(record.id, JobApplicationStatus.offer);

      expect(repository.lastStatusUpdate?.applicationId, equals(record.id));
      expect(repository.lastStatusUpdate?.status, equals(JobApplicationStatus.offer));

      final refreshed = controller.state.data!.firstWhere((entry) => entry.id == record.id);
      expect(refreshed.status, equals(JobApplicationStatus.offer));

      final event = analytics.events.singleWhere(
        (event) => event.name == 'job_application_status_updated',
      );
      expect(event.context['status'], equals('offer'));
      expect(repository.loadInvocations.last.forceRefresh, isTrue);
    });
  });
}

class _RecordingJobApplicationRepository extends JobApplicationRepository {
  _RecordingJobApplicationRepository()
      : loadInvocations = <_LoadInvocation>[],
        super(InMemoryOfflineCache());

  final List<_LoadInvocation> loadInvocations;
  String? lastCreateJobId;
  String? lastSavedRecordId;
  String? lastDeletedApplicationId;
  _InterviewOperation? lastUpsertInterview;
  String? lastRemovedInterviewId;
  _StatusUpdate? lastStatusUpdate;

  @override
  Future<List<JobApplicationRecord>> loadApplications(
    String jobId, {
    bool forceRefresh = false,
  }) async {
    loadInvocations.add(_LoadInvocation(jobId: jobId, forceRefresh: forceRefresh));
    return super.loadApplications(jobId, forceRefresh: forceRefresh);
  }

  @override
  Future<JobApplicationRecord> createApplication(String jobId, JobApplicationDraft draft) async {
    lastCreateJobId = jobId;
    return super.createApplication(jobId, draft);
  }

  @override
  Future<JobApplicationRecord> saveApplication(JobApplicationRecord record) async {
    lastSavedRecordId = record.id;
    return super.saveApplication(record);
  }

  @override
  Future<void> deleteApplication(String jobId, String applicationId) async {
    lastDeletedApplicationId = applicationId;
    return super.deleteApplication(jobId, applicationId);
  }

  @override
  Future<void> upsertInterview(String jobId, String applicationId, InterviewStep step) async {
    lastUpsertInterview = _InterviewOperation(applicationId: applicationId, step: step);
    return super.upsertInterview(jobId, applicationId, step);
  }

  @override
  Future<void> removeInterview(String jobId, String applicationId, String interviewId) async {
    lastRemovedInterviewId = interviewId;
    return super.removeInterview(jobId, applicationId, interviewId);
  }

  @override
  Future<void> updateStatus(
    String jobId,
    String applicationId,
    JobApplicationStatus status,
  ) async {
    lastStatusUpdate = _StatusUpdate(applicationId: applicationId, status: status);
    return super.updateStatus(jobId, applicationId, status);
  }
}

class _LoadInvocation {
  const _LoadInvocation({
    required this.jobId,
    required this.forceRefresh,
  });

  final String jobId;
  final bool forceRefresh;
}

class _InterviewOperation {
  const _InterviewOperation({
    required this.applicationId,
    required this.step,
  });

  final String applicationId;
  final InterviewStep step;
}

class _StatusUpdate {
  const _StatusUpdate({
    required this.applicationId,
    required this.status,
  });

  final String applicationId;
  final JobApplicationStatus status;
}
