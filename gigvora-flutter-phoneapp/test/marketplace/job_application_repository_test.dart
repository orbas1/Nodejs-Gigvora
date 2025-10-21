import 'package:flutter_test/flutter_test.dart';

import 'package:gigvora_mobile/features/marketplace/data/job_application_repository.dart';
import 'package:gigvora_mobile/features/marketplace/data/models/job_application_record.dart';

import '../helpers/in_memory_offline_cache.dart';

void main() {
  group('JobApplicationRepository', () {
    late InMemoryOfflineCache cache;
    late JobApplicationRepository repository;

    const jobId = 'staff-product-manager';

    setUp(() {
      cache = InMemoryOfflineCache();
      repository = JobApplicationRepository(cache);
    });

    tearDown(() async {
      await cache.dispose();
    });

    test('seeds a collection of demo applications when cache is empty', () async {
      final applications = await repository.loadApplications(jobId, forceRefresh: true);

      expect(applications, isNotEmpty);
      expect(applications.first.jobId, equals(jobId));
    });

    test('createApplication stores a new record at the top of the list', () async {
      final draft = const JobApplicationDraft(
        applicantName: 'Jordan Miles',
        email: 'jordan.miles@example.com',
        phone: '+1 202 555 0182',
        resumeUrl: 'https://cdn.gigvora.com/resumes/jordan-miles.pdf',
        coverLetter: 'Excited about the opportunity to build inclusive marketplaces.',
      );

      final record = await repository.createApplication(jobId, draft);
      final applications = await repository.loadApplications(jobId);

      expect(applications.first.id, equals(record.id));
      expect(applications.first.applicantName, equals('Jordan Miles'));
      expect(applications.first.status, equals(JobApplicationStatus.submitted));
    });

    test('saveApplication updates the stored record', () async {
      final applications = await repository.loadApplications(jobId);
      final record = applications.first;
      final updated = await repository.saveApplication(
        record.copyWith(applicantName: 'Updated Name', phone: '+1 202 555 0100'),
      );

      final refreshed = await repository.loadApplications(jobId);
      final persisted = refreshed.firstWhere((entry) => entry.id == record.id);

      expect(updated.applicantName, equals('Updated Name'));
      expect(persisted.phone, equals('+1 202 555 0100'));
      expect(updated.updatedAt.isAfter(record.updatedAt), isTrue);
    });

    test('updateStatus persists a status change', () async {
      final applications = await repository.loadApplications(jobId);
      final record = applications.first;

      await repository.updateStatus(jobId, record.id, JobApplicationStatus.offer);
      final refreshed = await repository.loadApplications(jobId);

      final updated = refreshed.firstWhere((entry) => entry.id == record.id);
      expect(updated.status, JobApplicationStatus.offer);
    });

    test('upsertInterview creates and updates interview slots', () async {
      final applications = await repository.loadApplications(jobId);
      final record = applications.first;
      final interview = InterviewStep(
        id: 'onsite',
        label: 'Onsite loop',
        startsAt: DateTime.now().add(const Duration(days: 5)),
        format: 'In person',
        host: 'Hiring panel',
      );

      await repository.upsertInterview(jobId, record.id, interview);
      var refreshed = await repository.loadApplications(jobId);
      var updated = refreshed.firstWhere((entry) => entry.id == record.id);

      expect(updated.interviews.any((step) => step.id == 'onsite'), isTrue);

      final amended = interview.copyWith(notes: 'Bring roadmap deep dive');
      await repository.upsertInterview(jobId, record.id, amended);
      refreshed = await repository.loadApplications(jobId);
      updated = refreshed.firstWhere((entry) => entry.id == record.id);

      final stored = updated.interviews.firstWhere((step) => step.id == 'onsite');
      expect(stored.notes, equals('Bring roadmap deep dive'));
      expect(updated.status, equals(JobApplicationStatus.interviewing));
    });

    test('removeInterview deletes the requested interview entry', () async {
      final applications = await repository.loadApplications(jobId);
      final record = applications.first;
      final interview = InterviewStep(
        id: 'panel',
        label: 'Panel',
        startsAt: DateTime.now().add(const Duration(days: 3)),
      );

      await repository.upsertInterview(jobId, record.id, interview);
      await repository.removeInterview(jobId, record.id, interview.id);

      final refreshed = await repository.loadApplications(jobId);
      final updated = refreshed.firstWhere((entry) => entry.id == record.id);

      expect(updated.interviews.any((step) => step.id == interview.id), isFalse);
    });

    test('deleteApplication removes the record from storage', () async {
      final applications = await repository.loadApplications(jobId);
      final record = applications.first;

      await repository.deleteApplication(jobId, record.id);
      final refreshed = await repository.loadApplications(jobId);

      expect(refreshed.any((entry) => entry.id == record.id), isFalse);
    });
  });
}
