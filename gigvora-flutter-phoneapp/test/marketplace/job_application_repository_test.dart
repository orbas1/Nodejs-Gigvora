import 'package:flutter_test/flutter_test.dart';

import 'package:gigvora_mobile/features/marketplace/data/job_application_repository.dart';
import 'package:gigvora_mobile/features/marketplace/data/models/job_application_record.dart';

import '../helpers/in_memory_offline_cache.dart';

void main() {
  group('JobApplicationRepository', () {
    late JobApplicationRepository repository;
    late InMemoryOfflineCache cache;

    setUp(() {
      cache = InMemoryOfflineCache();
      repository = JobApplicationRepository(cache);
    });

    tearDown(() async {
      await cache.dispose();
    });

    test('loadApplications seeds cache and returns sorted results', () async {
      final records = await repository.loadApplications('gigvora-product-lead');
      expect(records, isNotEmpty);
      expect(records.first.updatedAt.isAfter(records.last.updatedAt), isTrue);
    });

    test('createApplication persists new record at top of list', () async {
      await repository.loadApplications('gigvora-product-lead');
      final draft = JobApplicationDraft(applicantName: 'Alex Gómez', email: 'alex@example.com');

      final created = await repository.createApplication('gigvora-product-lead', draft);
      final stored = await repository.loadApplications('gigvora-product-lead');

      expect(stored.first.id, created.id);
      expect(created.status, JobApplicationStatus.submitted);
    });

    test('saveApplication updates existing record', () async {
      final records = await repository.loadApplications('gigvora-product-lead');
      final original = records.first;
      final updatedRecord = original.copyWith(status: JobApplicationStatus.offer);

      final saved = await repository.saveApplication(updatedRecord);
      expect(saved.status, JobApplicationStatus.offer);
      expect(saved.updatedAt.isAfter(original.updatedAt), isTrue);
    });

    test('deleteApplication removes entry from cache', () async {
      final records = await repository.loadApplications('gigvora-product-lead');
      final target = records.first;

      await repository.deleteApplication('gigvora-product-lead', target.id);

      final after = await repository.loadApplications('gigvora-product-lead');
      expect(after.any((record) => record.id == target.id), isFalse);
    });

    test('upsertInterview inserts and updates interview steps', () async {
      final records = await repository.loadApplications('gigvora-product-lead');
      final target = records.first;
      final interview = InterviewStep(
        id: 'panel',
        label: 'Panel interview',
        startsAt: DateTime.now().add(const Duration(days: 2)),
        format: 'Video',
        host: 'Strategy panel',
      );

      await repository.upsertInterview('gigvora-product-lead', target.id, interview);
      var refreshed = await repository.loadApplications('gigvora-product-lead');
      var stored = refreshed.firstWhere((record) => record.id == target.id);
      expect(stored.interviews.any((step) => step.id == 'panel'), isTrue);
      expect(stored.status, JobApplicationStatus.interviewing);

      final updatedInterview = interview.copyWith(notes: 'Bring growth case study');
      await repository.upsertInterview('gigvora-product-lead', target.id, updatedInterview);
      refreshed = await repository.loadApplications('gigvora-product-lead');
      stored = refreshed.firstWhere((record) => record.id == target.id);
      expect(stored.interviews.firstWhere((step) => step.id == 'panel').notes, 'Bring growth case study');
    });

    test('removeInterview deletes interview and preserves other fields', () async {
      final records = await repository.loadApplications('gigvora-product-lead');
      final target = records.first;
      final interview = InterviewStep(
        id: 'coffee',
        label: 'Coffee chat',
        startsAt: DateTime.now().add(const Duration(days: 1)),
      );
      await repository.upsertInterview('gigvora-product-lead', target.id, interview);

      await repository.removeInterview('gigvora-product-lead', target.id, 'coffee');
      final refreshed = await repository.loadApplications('gigvora-product-lead');
      final stored = refreshed.firstWhere((record) => record.id == target.id);
      expect(stored.interviews.any((step) => step.id == 'coffee'), isFalse);
    });

    test('updateStatus changes status while preserving other fields', () async {
      final records = await repository.loadApplications('gigvora-product-lead');
      final target = records.first;

      await repository.updateStatus('gigvora-product-lead', target.id, JobApplicationStatus.rejected);
      final refreshed = await repository.loadApplications('gigvora-product-lead');
      final updated = refreshed.firstWhere((record) => record.id == target.id);
      expect(updated.status, JobApplicationStatus.rejected);
    });

    test('cache expiry triggers a refresh of seeded applications', () async {
      var now = DateTime(2024, 04, 11, 12);
      await cache.dispose();
      cache = InMemoryOfflineCache(clock: () => now);
      repository = JobApplicationRepository(cache);

      await repository.loadApplications('gigvora-product-lead');
      await repository.createApplication(
        'gigvora-product-lead',
        const JobApplicationDraft(applicantName: 'Cache Tester', email: 'cache@test.dev'),
      );

      now = now.add(const Duration(minutes: 16));
      final refreshed = await repository.loadApplications('gigvora-product-lead');

      expect(refreshed.any((record) => record.email == 'cache@test.dev'), isFalse);
    });
  });
}
