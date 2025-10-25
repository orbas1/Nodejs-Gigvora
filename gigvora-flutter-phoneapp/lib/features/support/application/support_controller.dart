import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gigvora_foundation/gigvora_foundation.dart';

import '../../auth/application/session_controller.dart';
import '../../../core/providers.dart';
import '../data/models/support_models.dart';
import '../data/support_repository.dart';

class SupportController extends StateNotifier<ResourceState<SupportDeskSnapshot>> {
  SupportController(this._repository, this._analytics, this._ref)
      : super(ResourceState<SupportDeskSnapshot>.loading(null, const {
          'creatingTicket': false,
          'replyingTicketId': null,
          'search': '',
          'statusFilter': 'all',
          'categoryFilter': 'all',
        })) {
    load();
  }

  final SupportRepository _repository;
  final AnalyticsService _analytics;
  final Ref _ref;
  bool _initialised = false;

  Future<void> load({bool forceRefresh = false}) async {
    final userId = _resolveUserId();
    if (userId == null) {
      state = ResourceState<SupportDeskSnapshot>.error(
        StateError('An active session is required to load support operations.'),
        data: state.data,
        metadata: state.metadata,
      );
      return;
    }
    if (_initialised && !forceRefresh) {
      return;
    }
    _initialised = true;
    state = state.copyWith(loading: true, error: null, metadata: {
      ...state.metadata,
      'userId': userId,
    });
    try {
      final result = await _repository.fetchSnapshot(userId: userId, forceRefresh: forceRefresh);
      state = ResourceState<SupportDeskSnapshot>(
        data: result.data,
        loading: false,
        error: result.error,
        fromCache: result.fromCache,
        lastUpdated: result.lastUpdated ?? DateTime.now(),
        metadata: state.metadata,
      );
      await _analytics.track(
        'mobile_support_snapshot_loaded',
        context: {
          'ticketCount': result.data.cases.length,
          'incidentCount': result.data.incidents.length,
          'fromCache': result.fromCache,
        },
        metadata: const {'source': 'mobile_app'},
      );
    } catch (error) {
      state = state.copyWith(loading: false, error: error);
    }
  }

  Future<void> refresh() async {
    await _analytics.track(
      'mobile_support_snapshot_refreshed',
      metadata: const {'source': 'mobile_app'},
    );
    await load(forceRefresh: true);
  }

  void updateSearch(String query) {
    final metadata = Map<String, dynamic>.from(state.metadata);
    metadata['search'] = query;
    state = state.copyWith(metadata: metadata);
  }

  void updateStatusFilter(String filter) {
    final metadata = Map<String, dynamic>.from(state.metadata);
    metadata['statusFilter'] = filter;
    state = state.copyWith(metadata: metadata);
  }

  void updateCategoryFilter(String filter) {
    final metadata = Map<String, dynamic>.from(state.metadata);
    metadata['categoryFilter'] = filter;
    state = state.copyWith(metadata: metadata);
  }

  Future<SupportCase> createTicket(SupportTicketDraft draft) async {
    final userId = _requireUserId();
    _setCreating(true);
    try {
      final ticket = await _repository.createTicket(userId, draft);
      await _analytics.track(
        'mobile_support_ticket_created',
        context: {
          'category': draft.category,
          'priority': draft.priority,
        },
        metadata: const {'source': 'mobile_app'},
      );
      await load(forceRefresh: true);
      return ticket;
    } finally {
      _setCreating(false);
    }
  }

  Future<void> addMessage(String ticketId, SupportMessageDraft draft) async {
    final userId = _requireUserId();
    _setReplying(ticketId);
    try {
      await _repository.addMessage(userId, ticketId, draft);
      await _analytics.track(
        'mobile_support_reply_added',
        context: {
          'ticketId': ticketId,
          'fromSupport': draft.fromSupport,
        },
        metadata: const {'source': 'mobile_app'},
      );
      await load(forceRefresh: true);
    } finally {
      _setReplying(null);
    }
  }

  Future<void> closeTicket(String ticketId) async {
    final userId = _requireUserId();
    await _repository.updateTicketStatus(userId, ticketId, 'resolved');
    await _analytics.track(
      'mobile_support_ticket_solved',
      context: {'ticketId': ticketId},
      metadata: const {'source': 'mobile_app'},
    );
    await load(forceRefresh: true);
  }

  Future<void> escalateTicket(String ticketId) async {
    final userId = _requireUserId();
    await _repository.updateTicketStatus(userId, ticketId, 'escalated');
    await _analytics.track(
      'mobile_support_ticket_escalated',
      context: {'ticketId': ticketId},
      metadata: const {'source': 'mobile_app'},
    );
    await load(forceRefresh: true);
  }

  void _setCreating(bool value) {
    final metadata = Map<String, dynamic>.from(state.metadata);
    metadata['creatingTicket'] = value;
    state = state.copyWith(metadata: metadata);
  }

  void _setReplying(String? ticketId) {
    final metadata = Map<String, dynamic>.from(state.metadata);
    metadata['replyingTicketId'] = ticketId;
    state = state.copyWith(metadata: metadata);
  }

  int? _resolveUserId() {
    final sessionState = _ref.read(sessionControllerProvider);
    return sessionState.actorId;
  }

  int _requireUserId() {
    final userId = _resolveUserId();
    if (userId == null) {
      throw StateError('An authenticated session is required for support operations.');
    }
    return userId;
  }
}

final supportControllerProvider =
    StateNotifierProvider<SupportController, ResourceState<SupportDeskSnapshot>>((ref) {
  final repository = ref.watch(supportRepositoryProvider);
  final analytics = ref.watch(analyticsServiceProvider);
  final controller = SupportController(repository, analytics, ref);
  ref.onDispose(controller.dispose);
  return controller;
});
