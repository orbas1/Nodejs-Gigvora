import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../domain/page_models.dart';

class PageStudioController extends StateNotifier<PageStudioState> {
  PageStudioController()
      : super(
          PageStudioState(
            published: _initialPublished,
            drafts: _initialDrafts,
            lastSynced: DateTime.now().subtract(const Duration(minutes: 12)),
          ),
        );

  static final _initialPublished = <PageProfile>[
    PageProfile(
      id: 'gigvora-labs',
      name: 'Gigvora Labs',
      headline: 'Product innovation studio shaping the future of work.',
      blueprint: 'Employer brand page',
      status: 'published',
      followers: 12840,
      engagementScore: 86,
      conversionRate: 0.28,
      updatedAt: DateTime.now().subtract(const Duration(hours: 3)),
      audience: const ['Innovation', 'Future of work', 'Product'],
      admins: const ['Lena Fields', 'Jordan Blake'],
      nextEvent: DateTime.now().add(const Duration(days: 14)),
    ),
    PageProfile(
      id: 'northshore-creative',
      name: 'Northshore Creative',
      headline: 'Story-driven brand studio for venture-backed teams.',
      blueprint: 'Agency showcase page',
      status: 'published',
      followers: 6210,
      engagementScore: 74,
      conversionRate: 0.22,
      updatedAt: DateTime.now().subtract(const Duration(hours: 8)),
      audience: const ['Brand', 'Storytelling', 'Creative'],
      admins: const ['Priya Das'],
      nextEvent: DateTime.now().add(const Duration(days: 7)),
    ),
  ];

  static final _initialDrafts = <PageProfile>[
    PageProfile(
      id: 'experience-launchpad',
      name: 'Experience Launchpad',
      headline: 'Immersive cohort building product and operations talent.',
      blueprint: 'Community initiative page',
      status: 'review',
      followers: 0,
      engagementScore: 0,
      conversionRate: 0,
      updatedAt: DateTime.now().subtract(const Duration(days: 1)),
      audience: const ['Launchpad', 'Student talent'],
      admins: const ['Maya Cho'],
      nextEvent: DateTime.now().add(const Duration(days: 28)),
    ),
  ];

  Future<void> refresh() async {
    state = state.copyWith(loading: true, errorMessage: null);
    try {
      await Future<void>.delayed(const Duration(milliseconds: 450));
      state = state.copyWith(
        loading: false,
        lastSynced: DateTime.now(),
      );
    } catch (error) {
      state = state.copyWith(
        loading: false,
        errorMessage: 'Unable to refresh page analytics. Please retry shortly.',
      );
    }
  }

  Future<bool> createPage(PageDraft draft) async {
    state = state.copyWith(saving: true, errorMessage: null);
    try {
      await Future<void>.delayed(const Duration(milliseconds: 320));
      final now = DateTime.now();
      final profile = PageProfile(
        id: '${draft.name.toLowerCase().replaceAll(RegExp(r'[^a-z0-9]+'), '-')}-${now.millisecondsSinceEpoch}',
        name: draft.name,
        headline: draft.headline,
        blueprint: draft.blueprint,
        status: draft.visibility == 'public' ? 'published' : 'review',
        followers: 0,
        engagementScore: 0,
        conversionRate: 0,
        updatedAt: now,
        audience: draft.audience,
        admins: const ['You'],
      );
      final drafts = <PageProfile>[profile, ...state.drafts];
      final published = draft.visibility == 'public' ? <PageProfile>[profile, ...state.published] : state.published;
      state = state.copyWith(
        saving: false,
        drafts: draft.visibility == 'public' ? state.drafts : drafts,
        published: published,
        lastSynced: now,
      );
      return true;
    } catch (error) {
      state = state.copyWith(
        saving: false,
        errorMessage: 'Creating the page draft failed. Try again in a moment.',
      );
      return false;
    }
  }
}

final pageStudioControllerProvider =
    StateNotifierProvider<PageStudioController, PageStudioState>((ref) => PageStudioController());
