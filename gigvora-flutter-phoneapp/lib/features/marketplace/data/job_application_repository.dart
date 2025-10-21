import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gigvora_foundation/gigvora_foundation.dart';

import 'models/job_application_record.dart';

class JobApplicationRepository {
  JobApplicationRepository(this._cache);

  final OfflineCache _cache;

  static const Duration _cacheTtl = Duration(minutes: 15);
  static const String _cachePrefix = 'marketplace:job-applications:';

  String _cacheKey(String jobId) => '$_cachePrefix${jobId.toLowerCase()}';

  Future<List<JobApplicationRecord>> loadApplications(
    String jobId, {
    bool forceRefresh = false,
  }) async {
    final key = _cacheKey(jobId);
    CacheEntry<List<JobApplicationRecord>>? cached;
    try {
      cached = _cache.read<List<JobApplicationRecord>>(key, (raw) {
        if (raw is List) {
          return raw
              .whereType<Map>()
              .map((entry) => JobApplicationRecord.fromJson(Map<String, dynamic>.from(entry as Map)))
              .toList(growable: false);
        }
        return const <JobApplicationRecord>[];
      });
    } catch (_) {
      cached = null;
    }

    if (!forceRefresh && cached != null) {
      return cached.value.sortedByMostRecent();
    }

    final seeded = _seed(jobId);
    await _persist(jobId, seeded);
    return seeded;
  }

  Future<JobApplicationRecord> createApplication(String jobId, JobApplicationDraft draft) async {
    final existing = await loadApplications(jobId);
    final now = DateTime.now();
    final record = JobApplicationRecord(
      id: 'app-${now.microsecondsSinceEpoch}',
      jobId: jobId,
      applicantName: draft.applicantName.trim(),
      email: draft.email.trim(),
      status: JobApplicationStatus.submitted,
      createdAt: now,
      updatedAt: now,
      resumeUrl: draft.resumeUrl?.trim(),
      portfolioUrl: draft.portfolioUrl?.trim(),
      coverLetter: draft.coverLetter?.trim(),
      phone: draft.phone?.trim(),
    );
    final updated = [record, ...existing].sortedByMostRecent();
    await _persist(jobId, updated);
    return record;
  }

  Future<JobApplicationRecord> saveApplication(JobApplicationRecord record) async {
    final existing = await loadApplications(record.jobId);
    final updated = existing.map((item) {
      if (item.id != record.id) {
        return item;
      }
      return record.copyWith(updatedAt: DateTime.now());
    }).toList(growable: false);
    await _persist(record.jobId, updated);
    return updated.firstWhere((item) => item.id == record.id);
  }

  Future<void> deleteApplication(String jobId, String applicationId) async {
    final existing = await loadApplications(jobId);
    final updated = existing.where((item) => item.id != applicationId).toList(growable: false);
    await _persist(jobId, updated);
  }

  Future<void> upsertInterview(String jobId, String applicationId, InterviewStep step) async {
    final existing = await loadApplications(jobId);
    final updated = existing.map((record) {
      if (record.id != applicationId) {
        return record;
      }
      final interviews = record.interviews.toList(growable: true);
      final index = interviews.indexWhere((entry) => entry.id == step.id);
      if (index >= 0) {
        interviews[index] = step;
      } else {
        interviews.add(step);
      }
      interviews.sort((a, b) => a.startsAt.compareTo(b.startsAt));
      return record.copyWith(
        interviews: List<InterviewStep>.unmodifiable(interviews),
        status: JobApplicationStatus.interviewing,
        updatedAt: DateTime.now(),
      );
    }).toList(growable: false);
    await _persist(jobId, updated);
  }

  Future<void> removeInterview(String jobId, String applicationId, String interviewId) async {
    final existing = await loadApplications(jobId);
    final updated = existing.map((record) {
      if (record.id != applicationId) {
        return record;
      }
      final interviews = record.interviews.where((step) => step.id != interviewId).toList(growable: false);
      return record.copyWith(
        interviews: interviews,
        updatedAt: DateTime.now(),
      );
    }).toList(growable: false);
    await _persist(jobId, updated);
  }

  Future<void> updateStatus(String jobId, String applicationId, JobApplicationStatus status) async {
    final existing = await loadApplications(jobId);
    final updated = existing.map((record) {
      if (record.id != applicationId) {
        return record;
      }
      return record.copyWith(status: status, updatedAt: DateTime.now());
    }).toList(growable: false);
    await _persist(jobId, updated);
  }

  Future<void> _persist(String jobId, List<JobApplicationRecord> records) {
    return _cache.write(
      _cacheKey(jobId),
      records.map((record) => record.toJson()).toList(growable: false),
      ttl: _cacheTtl,
    );
  }

  List<JobApplicationRecord> _seed(String jobId) {
    final now = DateTime.now();
    return [
      JobApplicationRecord(
        id: 'seed-${jobId.hashCode.abs()}-1',
        jobId: jobId,
        applicantName: 'Maya Singh',
        email: 'maya.singh@example.com',
        status: JobApplicationStatus.interviewing,
        createdAt: now.subtract(const Duration(days: 12)),
        updatedAt: now.subtract(const Duration(days: 1)),
        resumeUrl: 'https://cdn.gigvora.com/resumes/maya-singh.pdf',
        portfolioUrl: 'https://maya.design/work',
        phone: '+44 7700 900123',
        coverLetter:
            'Excited to bring cross-functional leadership and experimentation frameworks to Gigvora. Focused on value discovery.',
        interviews: [
          InterviewStep(
            id: 'intro',
            label: 'Product sense interview',
            startsAt: now.add(const Duration(days: 2, hours: 3)),
            format: 'Video',
            host: 'Alex Gómez',
            notes: 'Discuss experimentation approach and leadership style.',
          ),
        ],
      ),
      JobApplicationRecord(
        id: 'seed-${jobId.hashCode.abs()}-2',
        jobId: jobId,
        applicantName: 'Priya Patel',
        email: 'priya.patel@example.com',
        status: JobApplicationStatus.submitted,
        createdAt: now.subtract(const Duration(days: 4)),
        updatedAt: now.subtract(const Duration(days: 4)),
        resumeUrl: 'https://cdn.gigvora.com/resumes/priya-patel.pdf',
        coverLetter: 'Led multi-market launches for two SaaS scale ups. Passionate about community-driven growth.',
      ),
    ].sortedByMostRecent();
  }
}

final jobApplicationRepositoryProvider = Provider<JobApplicationRepository>((ref) {
  final cache = ref.watch(offlineCacheProvider);
  return JobApplicationRepository(cache);
});
