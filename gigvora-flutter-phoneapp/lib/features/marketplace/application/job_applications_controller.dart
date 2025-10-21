import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gigvora_foundation/gigvora_foundation.dart';

import '../../../core/providers.dart';
import '../data/job_application_repository.dart';
import '../data/models/job_application_record.dart';

class JobApplicationsController extends StateNotifier<ResourceState<List<JobApplicationRecord>>> {
  JobApplicationsController(
    this.jobId,
    this._repository,
    this._analytics,
  ) : super(ResourceState<List<JobApplicationRecord>>.loading(const <JobApplicationRecord>[], const {
          'saving': false,
          'lastAction': null,
        })) {
    _load();
  }

  final String jobId;
  final JobApplicationRepository _repository;
  final AnalyticsService _analytics;
  bool _initialised = false;

  Future<void> _load({bool forceRefresh = false}) async {
    if (_initialised && !forceRefresh) {
      return;
    }
    _initialised = true;
    state = state.copyWith(loading: true, error: null);
    try {
      final records = await _repository.loadApplications(jobId, forceRefresh: forceRefresh);
      state = ResourceState<List<JobApplicationRecord>>(
        data: records,
        loading: false,
        error: null,
        lastUpdated: DateTime.now(),
        metadata: state.metadata,
      );
      if (!forceRefresh) {
        await _analytics.track(
          'mobile_job_applications_loaded',
          context: {
            'jobId': jobId,
            'applicationCount': records.length,
          },
          metadata: const {'source': 'mobile_app'},
        );
      }
    } catch (error) {
      state = state.copyWith(loading: false, error: error);
    }
  }

  Future<void> refresh() async {
    await _analytics.track(
      'mobile_job_applications_refreshed',
      context: {'jobId': jobId},
      metadata: const {'source': 'mobile_app'},
    );
    await _load(forceRefresh: true);
  }

  Future<JobApplicationRecord> create(JobApplicationDraft draft) async {
    _setSaving(true, action: 'create');
    try {
      final record = await _repository.createApplication(jobId, draft);
      await _analytics.track(
        'mobile_job_application_created',
        context: {
          'jobId': jobId,
          'applicationId': record.id,
          'status': record.status.name,
        },
        metadata: const {'source': 'mobile_app'},
      );
      await _load(forceRefresh: true);
      return record;
    } catch (error) {
      rethrow;
    } finally {
      _setSaving(false);
    }
  }

  Future<JobApplicationRecord> save(JobApplicationRecord record) async {
    _setSaving(true, action: 'update');
    try {
      final updated = await _repository.saveApplication(record);
      await _analytics.track(
        'mobile_job_application_updated',
        context: {
          'jobId': jobId,
          'applicationId': record.id,
          'status': updated.status.name,
        },
        metadata: const {'source': 'mobile_app'},
      );
      await _load(forceRefresh: true);
      return updated;
    } finally {
      _setSaving(false);
    }
  }

  Future<void> delete(String applicationId) async {
    _setSaving(true, action: 'delete');
    try {
      await _repository.deleteApplication(jobId, applicationId);
      await _analytics.track(
        'mobile_job_application_deleted',
        context: {
          'jobId': jobId,
          'applicationId': applicationId,
        },
        metadata: const {'source': 'mobile_app'},
      );
      await _load(forceRefresh: true);
    } finally {
      _setSaving(false);
    }
  }

  Future<void> scheduleInterview(String applicationId, InterviewStep step) async {
    _setSaving(true, action: 'schedule_interview');
    try {
      await _repository.upsertInterview(jobId, applicationId, step);
      await _analytics.track(
        'mobile_job_application_interview_scheduled',
        context: {
          'jobId': jobId,
          'applicationId': applicationId,
          'interviewId': step.id,
        },
        metadata: const {'source': 'mobile_app'},
      );
      await _load(forceRefresh: true);
    } finally {
      _setSaving(false);
    }
  }

  Future<void> cancelInterview(String applicationId, String interviewId) async {
    _setSaving(true, action: 'cancel_interview');
    try {
      await _repository.removeInterview(jobId, applicationId, interviewId);
      await _analytics.track(
        'mobile_job_application_interview_cancelled',
        context: {
          'jobId': jobId,
          'applicationId': applicationId,
          'interviewId': interviewId,
        },
        metadata: const {'source': 'mobile_app'},
      );
      await _load(forceRefresh: true);
    } finally {
      _setSaving(false);
    }
  }

  Future<void> updateStatus(String applicationId, JobApplicationStatus status) async {
    _setSaving(true, action: 'update_status');
    try {
      await _repository.updateStatus(jobId, applicationId, status);
      await _analytics.track(
        'mobile_job_application_status_updated',
        context: {
          'jobId': jobId,
          'applicationId': applicationId,
          'status': status.name,
        },
        metadata: const {'source': 'mobile_app'},
      );
      await _load(forceRefresh: true);
    } finally {
      _setSaving(false);
    }
  }

  void _setSaving(bool value, {String? action}) {
    final metadata = Map<String, dynamic>.from(state.metadata)
      ..['saving'] = value
      ..['lastAction'] = action;
    state = state.copyWith(metadata: metadata);
  }
}

final jobApplicationsControllerProvider =
    StateNotifierProvider.family<JobApplicationsController, ResourceState<List<JobApplicationRecord>>, String>(
  (ref, jobId) {
    final repository = ref.watch(jobApplicationRepositoryProvider);
    final analytics = ref.watch(analyticsServiceProvider);
    final controller = JobApplicationsController(jobId, repository, analytics);
    ref.onDispose(controller.dispose);
    return controller;
  },
);
