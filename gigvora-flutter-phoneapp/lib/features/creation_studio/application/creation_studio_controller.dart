import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gigvora_foundation/gigvora_foundation.dart';

import '../../../core/providers.dart';
import '../data/creation_studio_repository.dart';
import '../data/models/creation_brief.dart';

class CreationStudioForm {
  const CreationStudioForm({
    this.kind,
    this.title = '',
    this.summary = '',
    this.audience = '',
    this.objective = '',
    this.attachments = const <String>[],
  });

  final CreationKind? kind;
  final String title;
  final String summary;
  final String audience;
  final String objective;
  final List<String> attachments;

  bool get isComplete =>
      kind != null && title.trim().isNotEmpty && summary.trim().isNotEmpty && objective.trim().isNotEmpty;

  CreationStudioForm copyWith({
    CreationKind? kind,
    String? title,
    String? summary,
    String? audience,
    String? objective,
    List<String>? attachments,
  }) {
    return CreationStudioForm(
      kind: kind ?? this.kind,
      title: title ?? this.title,
      summary: summary ?? this.summary,
      audience: audience ?? this.audience,
      objective: objective ?? this.objective,
      attachments: attachments ?? this.attachments,
    );
  }

  CreationBriefDraft toDraft() {
    return CreationBriefDraft(
      kind: kind ?? CreationKind.project,
      title: title,
      summary: summary,
      audience: audience.isEmpty ? null : audience,
      objective: objective.isEmpty ? null : objective,
      attachments: attachments,
    );
  }
}

class CreationStudioState {
  const CreationStudioState({
    required this.step,
    required this.form,
    required this.briefs,
    this.loading = false,
    this.saving = false,
    this.publishing = false,
    this.error,
    this.editing,
  });

  final int step;
  final CreationStudioForm form;
  final List<CreationBrief> briefs;
  final bool loading;
  final bool saving;
  final bool publishing;
  final Object? error;
  final CreationBrief? editing;

  CreationStudioState copyWith({
    int? step,
    CreationStudioForm? form,
    List<CreationBrief>? briefs,
    bool? loading,
    bool? saving,
    bool? publishing,
    Object? error = _sentinel,
    CreationBrief? editing = _sentinelBrief,
  }) {
    return CreationStudioState(
      step: step ?? this.step,
      form: form ?? this.form,
      briefs: briefs ?? this.briefs,
      loading: loading ?? this.loading,
      saving: saving ?? this.saving,
      publishing: publishing ?? this.publishing,
      error: identical(error, _sentinel) ? this.error : error,
      editing: identical(editing, _sentinelBrief) ? this.editing : editing as CreationBrief?,
    );
  }

  static const _sentinel = Object();
  static const _sentinelBrief = Object();

  static CreationStudioState initial() {
    return CreationStudioState(
      step: 0,
      form: const CreationStudioForm(),
      briefs: const <CreationBrief>[],
    );
  }
}

class CreationStudioController extends StateNotifier<CreationStudioState> {
  CreationStudioController(this._repository, this._analytics)
      : super(CreationStudioState.initial()) {
    unawaited(load());
  }

  final CreationStudioRepository _repository;
  final AnalyticsService _analytics;

  Future<void> load({bool forceRefresh = false}) async {
    state = state.copyWith(loading: true, error: null);
    try {
      final result = await _repository.fetchBriefs(forceRefresh: forceRefresh);
      state = state.copyWith(
        briefs: result.data,
        loading: false,
        error: result.error,
      );
    } catch (error) {
      state = state.copyWith(loading: false, error: error);
    }
  }

  void selectKind(CreationKind kind) {
    state = state.copyWith(
      form: state.form.copyWith(kind: kind),
      step: 1,
    );
  }

  void updateForm({
    String? title,
    String? summary,
    String? audience,
    String? objective,
    List<String>? attachments,
  }) {
    state = state.copyWith(
      form: state.form.copyWith(
        title: title,
        summary: summary,
        audience: audience,
        objective: objective,
        attachments: attachments,
      ),
    );
  }

  void addAttachment(String value) {
    final trimmed = value.trim();
    if (trimmed.isEmpty) return;
    final attachments = <String>{...state.form.attachments, trimmed}.toList();
    updateForm(attachments: attachments);
  }

  void removeAttachment(String value) {
    final attachments = state.form.attachments.where((item) => item != value).toList();
    updateForm(attachments: attachments);
  }

  void nextStep() {
    final next = (state.step + 1).clamp(0, 2);
    state = state.copyWith(step: next);
  }

  void previousStep() {
    final next = (state.step - 1).clamp(0, 2);
    state = state.copyWith(step: next);
  }

  void startNew() {
    state = CreationStudioState.initial();
  }

  void editBrief(CreationBrief brief) {
    state = state.copyWith(
      editing: brief,
      step: 1,
      form: _formFromBrief(brief),
    );
  }

  Future<CreationBrief> saveDraft() async {
    final form = state.form;
    if (!form.isComplete) {
      throw StateError('Form is incomplete');
    }
    state = state.copyWith(saving: true, error: null);
    try {
      final saved = state.editing == null
          ? await _repository.createBrief(form.toDraft())
          : await _repository.updateBrief(state.editing!.id, form.toDraft());
      await _analytics.track(
        'mobile_creation_studio_saved',
        context: {
          'kind': form.kind?.apiValue,
          'attachments': form.attachments.length,
          'editing': state.editing != null,
        },
        metadata: const {'source': 'mobile_app'},
      );
      await load(forceRefresh: true);
      state = state.copyWith(
        saving: false,
        editing: saved,
        step: 2,
        form: _formFromBrief(saved),
      );
      return saved;
    } catch (error) {
      state = state.copyWith(saving: false, error: error);
      rethrow;
    }
  }

  Future<void> publishDraft() async {
    var target = state.editing;
    if (target == null) {
      target = await saveDraft();
    }
    target ??= state.editing;
    if (target == null) {
      throw StateError('No brief selected for publishing');
    }
    state = state.copyWith(publishing: true, error: null);
    try {
      await _repository.publishBrief(target.id);
      await _analytics.track(
        'mobile_creation_studio_published',
        context: {
          'briefId': target.id,
          'kind': target.kind.apiValue,
        },
        metadata: const {'source': 'mobile_app'},
      );
      await load(forceRefresh: true);
      state = state.copyWith(publishing: false);
      startNew();
    } catch (error) {
      state = state.copyWith(publishing: false, error: error);
      rethrow;
    }
  }

  Future<void> deleteBrief(CreationBrief brief) async {
    await _repository.deleteBrief(brief.id);
    await _analytics.track(
      'mobile_creation_studio_deleted',
      context: {
        'briefId': brief.id,
        'kind': brief.kind.apiValue,
      },
      metadata: const {'source': 'mobile_app'},
    );
    await load(forceRefresh: true);
    if (state.editing?.id == brief.id) {
      startNew();
    }
  }

  CreationStudioForm _formFromBrief(CreationBrief brief) {
    return CreationStudioForm(
      kind: brief.kind,
      title: brief.title,
      summary: brief.summary,
      audience: (brief.metadata['audience'] as String?) ?? '',
      objective: (brief.metadata['objective'] as String?) ?? '',
      attachments: (brief.metadata['attachments'] as List<dynamic>? ?? const [])
          .whereType<String>()
          .toList(growable: false),
    );
  }
}

final creationStudioRepositoryProvider = Provider<CreationStudioRepository>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  final cache = ref.watch(offlineCacheProvider);
  return CreationStudioRepository(apiClient, cache);
});

final creationStudioControllerProvider =
    StateNotifierProvider<CreationStudioController, CreationStudioState>((ref) {
  final repository = ref.watch(creationStudioRepositoryProvider);
  final analytics = ref.watch(analyticsServiceProvider);
  return CreationStudioController(repository, analytics);
});
