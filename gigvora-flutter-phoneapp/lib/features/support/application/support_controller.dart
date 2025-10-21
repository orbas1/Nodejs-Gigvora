import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gigvora_foundation/gigvora_foundation.dart';

import '../../../core/providers.dart';
import '../data/models/support_models.dart';
import '../data/support_repository.dart';

class SupportController extends StateNotifier<ResourceState<SupportSnapshot>> {
  SupportController(this._repository, this._analytics)
      : super(ResourceState<SupportSnapshot>.loading(null, const {
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
  bool _initialised = false;

  Future<void> load({bool forceRefresh = false}) async {
    if (_initialised && !forceRefresh) {
      return;
    }
    _initialised = true;
    state = state.copyWith(loading: true, error: null);
    try {
      final result = await _repository.fetchSnapshot(forceRefresh: forceRefresh);
      state = ResourceState<SupportSnapshot>(
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
          'ticketCount': result.data.openTickets.length,
          'fromCache': result.fromCache,
        },
        metadata: const {'source': 'mobile_app'},
      );
    } catch (error) {
      state = state.copyWith(loading: false, error: error);
    }
  }

  Future<void> refresh() async {
    await _analytics.track('mobile_support_snapshot_refreshed', metadata: const {'source': 'mobile_app'});
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

  Future<SupportTicket> createTicket(SupportTicketDraft draft) async {
    _setCreating(true);
    try {
      final ticket = await _repository.createTicket(draft);
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
    _setReplying(ticketId);
    try {
      await _repository.addMessage(ticketId, draft);
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
    await _repository.updateTicketStatus(ticketId, 'solved');
    await _analytics.track(
      'mobile_support_ticket_solved',
      context: {'ticketId': ticketId},
      metadata: const {'source': 'mobile_app'},
    );
    await load(forceRefresh: true);
  }

  Future<void> escalateTicket(String ticketId) async {
    await _repository.updateTicketStatus(ticketId, 'escalated', escalated: true);
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
}

final supportControllerProvider = StateNotifierProvider<SupportController, ResourceState<SupportSnapshot>>((ref) {
  final repository = ref.watch(supportRepositoryProvider);
  final analytics = ref.watch(analyticsServiceProvider);
  final controller = SupportController(repository, analytics);
  ref.onDispose(controller.dispose);
  return controller;
});
