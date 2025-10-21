import 'package:gigvora_foundation/gigvora_foundation.dart';

import 'models/job_application_record.dart';

class JobApplicationRepository {
  JobApplicationRepository(this._cache);

  final OfflineCache _cache;

  static const Duration _cacheTtl = Duration(minutes: 10);
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
              .map(
                (entry) => JobApplicationRecord.fromJson(
                  Map<String, dynamic>.from(entry as Map),
                ),
              )
              .toList(growable: false);
        }
        return const <JobApplicationRecord>[];
      });
    } catch (_) {
      cached = null;
    }

    if (!forceRefresh && cached != null) {
      return cached.value;
    }

    final seeded = _seed(jobId);
    await _cache.write(
      key,
      seeded.map((record) => record.toJson()).toList(growable: false),
      ttl: _cacheTtl,
    );
    return seeded;
  }

  Future<JobApplicationRecord> createApplication(
    String jobId,
    JobApplicationDraft draft,
  ) async {
    final existing = await loadApplications(jobId);
    final now = DateTime.now();
    final record = JobApplicationRecord(
      id: 'app-${now.microsecondsSinceEpoch}',
      jobId: jobId,
      role: draft.role,
      company: draft.company,
      status: JobApplicationStatus.submitted,
      submittedAt: now,
      updatedAt: now,
      coverLetter: draft.coverLetter,
      resumeUrl: draft.resumeUrl,
      portfolioUrl: draft.portfolioUrl,
      recruiterEmail: draft.recruiterEmail,
      salaryExpectation: draft.salaryExpectation,
      notes: draft.notes,
      locationPreference: draft.locationPreference,
      remotePreference: draft.remotePreference,
      attachments: draft.attachments,
    );
    await _persist(jobId, [record, ...existing]);
    return record;
  }

  Future<JobApplicationRecord> saveApplication(JobApplicationRecord record) async {
    final existing = await loadApplications(record.jobId);
    final updated = existing
        .map((item) => item.id == record.id
            ? record.copyWith(updatedAt: DateTime.now())
            : item)
        .toList(growable: false);
    await _persist(record.jobId, updated);
    return updated.firstWhere((item) => item.id == record.id);
  }

  Future<void> deleteApplication(String jobId, String applicationId) async {
    final existing = await loadApplications(jobId);
    final updated = existing.where((item) => item.id != applicationId).toList(growable: false);
    await _persist(jobId, updated);
  }

  Future<void> upsertInterview(
    String jobId,
    String applicationId,
    InterviewStep step,
  ) async {
    final existing = await loadApplications(jobId);
    final updated = existing.map((record) {
      if (record.id != applicationId) {
        return record;
      }
      final interviews = <InterviewStep>[...record.interviews];
      final index = interviews.indexWhere((entry) => entry.id == step.id);
      if (index >= 0) {
        interviews[index] = step;
      } else {
        interviews.add(step);
        interviews.sort((a, b) => a.startsAt.compareTo(b.startsAt));
      }
      return record.copyWith(
        interviews: List<InterviewStep>.unmodifiable(interviews),
        updatedAt: DateTime.now(),
        status: JobApplicationStatus.interviewing,
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
        interviews: List<InterviewStep>.unmodifiable(interviews),
        updatedAt: DateTime.now(),
      );
    }).toList(growable: false);
    await _persist(jobId, updated);
  }

  Future<void> updateStatus(
    String jobId,
    String applicationId,
    JobApplicationStatus status,
  ) async {
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
    final truncatedId = jobId.length > 8 ? jobId.substring(0, 8) : jobId;
    return [
      JobApplicationRecord(
        id: 'seed-$truncatedId-1',
        jobId: jobId,
        role: 'Senior Product Strategist',
        company: 'Gigvora Studio',
        status: JobApplicationStatus.interviewing,
        submittedAt: now.subtract(const Duration(days: 18)),
        updatedAt: now.subtract(const Duration(days: 2)),
        coverLetter:
            'Excited about redefining digital-first talent experiences across launchpads, gigs, and mentorship.',
        resumeUrl: 'https://cdn.gigvora.com/resumes/strategist.pdf',
        portfolioUrl: 'https://work.gigvora.com/strategist-demo',
        recruiterEmail: 'debbie.chan@gigvora.com',
        salaryExpectation: '£115k - £130k + equity',
        notes:
            'Great alignment with growth OKRs. Prepare workshop artefacts for next panel. Send post-interview follow up.',
        locationPreference: 'Hybrid London or fully-remote UK/EU',
        remotePreference: true,
        attachments: const [
          'https://cdn.gigvora.com/case-studies/customer-retention.pdf',
          'https://cdn.gigvora.com/briefs/growth-workshop-deck.pptx',
        ],
        interviews: [
          InterviewStep(
            id: 'discovery',
            label: 'Discovery session',
            startsAt: now.add(const Duration(days: 3, hours: 9)),
            endsAt: now.add(const Duration(days: 3, hours: 10)),
            format: 'Virtual',
            host: 'Alex Gómez',
            location: 'Zoom',
            notes: 'Focus on market thesis for marketplace supply acquisition.',
          ),
          InterviewStep(
            id: 'portfolio',
            label: 'Portfolio deep dive',
            startsAt: now.add(const Duration(days: 5, hours: 14)),
            endsAt: now.add(const Duration(days: 5, hours: 15)),
            format: 'Hybrid',
            host: 'Leah Mensah',
            location: 'Gigvora London HQ · Collaboration Studio B',
            notes: 'Bring product accelerators and retention dashboards.',
            videoUrl: 'https://video.gigvora.com/replays/portfolio-walkthrough.mp4',
          ),
        ],
      ),
      JobApplicationRecord(
        id: 'seed-$truncatedId-2',
        jobId: jobId,
        role: 'Lifecycle Marketing Lead',
        company: 'Nova Partnerships',
        status: JobApplicationStatus.submitted,
        submittedAt: now.subtract(const Duration(days: 7)),
        updatedAt: now.subtract(const Duration(days: 1)),
        coverLetter:
            'Bringing omni-channel lifecycle expertise and a passion for onboarding journeys that convert and retain.',
        recruiterEmail: 'talent@novapartnerships.com',
        salaryExpectation: '€95k + variable',
        notes: 'Awaiting hiring manager review. Automations audit completed.',
        locationPreference: 'Remote within EU timezones',
        remotePreference: true,
        attachments: const [
          'https://cdn.gigvora.com/automation/audience-framework.png',
        ],
        interviews: const [],
      ),
    ];
  }
}

final jobApplicationRepositoryProvider = Provider<JobApplicationRepository>((ref) {
  final cache = ref.watch(offlineCacheProvider);
  return JobApplicationRepository(cache);
});
