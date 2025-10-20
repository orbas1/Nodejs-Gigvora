import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:gigvora_foundation/gigvora_foundation.dart';

import 'package:gigvora_mobile/core/providers.dart';
import 'package:gigvora_mobile/features/creation_studio/application/creation_studio_controller.dart';
import 'package:gigvora_mobile/features/creation_studio/data/models/creation_brief.dart';
import 'package:gigvora_mobile/features/creation_studio/data/creation_studio_repository.dart';

import '../../../support/test_analytics_service.dart';
import '../../../support/test_api_client.dart';
import '../../../support/test_offline_cache.dart';

class FakeCreationStudioRepository extends CreationStudioRepository {
  FakeCreationStudioRepository({List<CreationBrief>? initial})
      : _briefs = List<CreationBrief>.from(initial ?? const <CreationBrief>[]),
        super(TestApiClient(), InMemoryOfflineCache());

  List<CreationBrief> _briefs;
  CreationBriefDraft? lastDraft;
  String? lastPublishedId;
  String? lastDeletedId;

  @override
  Future<RepositoryResult<List<CreationBrief>>> fetchBriefs({bool forceRefresh = false}) async {
    return RepositoryResult<List<CreationBrief>>(
      data: List<CreationBrief>.from(_briefs),
      fromCache: false,
      lastUpdated: DateTime.now(),
    );
  }

  @override
  Future<CreationBrief> createBrief(CreationBriefDraft draft) async {
    lastDraft = draft;
    final brief = CreationBrief(
      id: 'brief-${_briefs.length + 1}',
      kind: draft.kind,
      title: draft.title,
      summary: draft.summary,
      status: 'draft',
      updatedAt: DateTime.now(),
      metadata: {
        'audience': draft.audience,
        'objective': draft.objective,
        'attachments': draft.attachments,
      },
    );
    _briefs = [..._briefs, brief];
    return brief;
  }

  @override
  Future<CreationBrief> updateBrief(String id, CreationBriefDraft draft) async {
    lastDraft = draft;
    final index = _briefs.indexWhere((item) => item.id == id);
    if (index < 0) {
      throw ArgumentError('Unknown brief $id');
    }
    final brief = _briefs[index].copyWith(
      title: draft.title,
      summary: draft.summary,
      metadata: {
        'audience': draft.audience,
        'objective': draft.objective,
        'attachments': draft.attachments,
      },
    );
    _briefs[index] = brief;
    return brief;
  }

  @override
  Future<CreationBrief> publishBrief(String id) async {
    lastPublishedId = id;
    final index = _briefs.indexWhere((item) => item.id == id);
    if (index < 0) {
      throw ArgumentError('Unknown brief $id');
    }
    final published = _briefs[index].copyWith(status: 'published');
    _briefs[index] = published;
    return published;
  }

  @override
  Future<void> deleteBrief(String id) async {
    lastDeletedId = id;
    _briefs = _briefs.where((item) => item.id != id).toList(growable: false);
  }
}

void main() {
  late FakeCreationStudioRepository repository;
  late TestAnalyticsService analytics;

  ProviderContainer buildContainer({List<CreationBrief>? briefs}) {
    repository = FakeCreationStudioRepository(initial: briefs);
    analytics = TestAnalyticsService();

    final container = ProviderContainer(
      overrides: [
        creationStudioRepositoryProvider.overrideWithValue(repository),
        analyticsServiceProvider.overrideWithValue(analytics),
      ],
    );
    addTearDown(container.dispose);
    return container;
  }

  CreationBrief createBrief({String id = 'brief-1', CreationKind kind = CreationKind.cv}) {
    return CreationBrief(
      id: id,
      kind: kind,
      title: 'Existing $id',
      summary: 'Summary for $id',
      status: 'draft',
      updatedAt: DateTime.now(),
      metadata: const <String, dynamic>{},
    );
  }

  test('saves new briefs and transitions to review step', () async {
    final container = buildContainer(briefs: const []);
    final controller = container.read(creationStudioControllerProvider.notifier);

    controller.selectKind(CreationKind.coverLetter);
    controller.updateForm(
      title: 'Strategic Product Designer',
      summary: 'Impact-focused cover letter for fintech roles.',
      objective: 'Highlight measurable growth wins.',
      audience: 'Venture-backed SaaS scaleups',
    );
    controller.addAttachment('https://cdn.example.com/portfolio.pdf');

    final saved = await controller.saveDraft();

    final state = container.read(creationStudioControllerProvider);
    expect(saved.kind, CreationKind.coverLetter);
    expect(state.step, 2);
    expect(state.editing, isNotNull);
    expect(state.form.attachments, contains('https://cdn.example.com/portfolio.pdf'));
    expect(repository.lastDraft, isNotNull);
    expect(repository.lastDraft!.title, 'Strategic Product Designer');
    expect(analytics.events.map((event) => event.name), contains('mobile_creation_studio_saved'));
  });

  test('publishing without prior save persists draft and resets form', () async {
    final container = buildContainer(briefs: const []);
    final controller = container.read(creationStudioControllerProvider.notifier);

    controller.selectKind(CreationKind.gig);
    controller.updateForm(
      title: 'AI adoption sprint',
      summary: 'Rapid discovery and integration sprint for AI tooling.',
      objective: 'Launch automation playbooks in 6 weeks.',
    );

    await controller.publishDraft();

    final state = container.read(creationStudioControllerProvider);
    expect(repository.lastPublishedId, isNotNull);
    expect(state.step, 0);
    expect(state.form.kind, isNull);
    expect(state.form.title, isEmpty);
    expect(analytics.events.map((event) => event.name), contains('mobile_creation_studio_published'));
  });

  test('delete removes brief and clears editing context', () async {
    final brief = createBrief();
    final container = buildContainer(briefs: [brief]);
    final controller = container.read(creationStudioControllerProvider.notifier);

    controller.editBrief(brief);
    await controller.deleteBrief(brief);

    final state = container.read(creationStudioControllerProvider);
    expect(repository.lastDeletedId, brief.id);
    expect(state.briefs, isEmpty);
    expect(state.editing, isNull);
  });
}
