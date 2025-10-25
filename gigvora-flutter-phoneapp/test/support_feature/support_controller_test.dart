import 'package:flutter_test/flutter_test.dart';
import 'package:gigvora_foundation/gigvora_foundation.dart';
import 'package:gigvora_mobile/features/support/application/support_controller.dart';
import 'package:gigvora_mobile/features/support/data/models/support_models.dart';
import 'package:gigvora_mobile/features/support/data/support_repository.dart';

import '../helpers/in_memory_offline_cache.dart';
import '../support/test_analytics_service.dart';

typedef _FetchCallback = Future<RepositoryResult<SupportSnapshot>> Function(bool forceRefresh);
typedef _CreateTicketCallback = Future<SupportTicket> Function(SupportTicketDraft draft);
typedef _AddMessageCallback = Future<SupportTicket> Function(String ticketId, SupportMessageDraft draft);
typedef _UpdateStatusCallback = Future<SupportTicket> Function(String ticketId, String status, {bool escalated});

class _StubSupportRepository extends SupportRepository {
  _StubSupportRepository({
    required this.onFetch,
    this.onCreateTicket,
    this.onAddMessage,
    this.onUpdateStatus,
  }) : super(InMemoryOfflineCache());

  final _FetchCallback onFetch;
  final _CreateTicketCallback? onCreateTicket;
  final _AddMessageCallback? onAddMessage;
  final _UpdateStatusCallback? onUpdateStatus;

  bool? lastForceRefresh;
  int fetchCount = 0;
  int createCount = 0;
  int addMessageCount = 0;
  int updateStatusCount = 0;

  @override
  Future<RepositoryResult<SupportSnapshot>> fetchSnapshot({bool forceRefresh = false}) {
    fetchCount += 1;
    lastForceRefresh = forceRefresh;
    return onFetch(forceRefresh);
  }

  @override
  Future<SupportTicket> createTicket(SupportTicketDraft draft) {
    createCount += 1;
    if (onCreateTicket == null) {
      throw UnimplementedError('createTicket not stubbed');
    }
    return onCreateTicket!(draft);
  }

  @override
  Future<SupportTicket> addMessage(String ticketId, SupportMessageDraft draft) {
    addMessageCount += 1;
    if (onAddMessage == null) {
      throw UnimplementedError('addMessage not stubbed');
    }
    return onAddMessage!(ticketId, draft);
  }

  @override
  Future<SupportTicket> updateTicketStatus(String ticketId, String status, {bool escalated = false}) {
    updateStatusCount += 1;
    if (onUpdateStatus == null) {
      throw UnimplementedError('updateTicketStatus not stubbed');
    }
    return onUpdateStatus!(ticketId, status, escalated: escalated);
  }
}

SupportSnapshot _buildSnapshot() {
  final now = DateTime(2024, 1, 4, 12);
  final ticket = SupportTicket(
    id: 'sup-100',
    subject: 'Verify billing statement',
    category: 'Finance',
    priority: 'High',
    status: 'open',
    summary: 'Need last quarter statement for audit.',
    createdAt: now.subtract(const Duration(hours: 6)),
    updatedAt: now.subtract(const Duration(hours: 2)),
    messages: const [],
  );
  return SupportSnapshot(
    openTickets: [ticket],
    recentTickets: [ticket],
    articles: const [
      SupportArticle(
        id: 'billing-guide',
        title: 'Export billing statements',
        summary: 'Step-by-step instructions for finance exports.',
        url: 'https://support.gigvora.com/articles/billing-guide',
        tags: ['finance'],
        readTimeMinutes: 4,
      ),
    ],
    firstResponseMinutes: 42,
    satisfactionScore: 4.6,
    incidents: const [
      SupportIncident(
        id: 'trust-incident',
        title: 'Realtime alerts delayed',
        status: 'monitoring',
        severity: 'medium',
        summary: 'Push notifications delayed in EU region while infrastructure recovers.',
        openedAt: DateTime(2024, 1, 4, 10),
      ),
    ],
  );
}

void main() {
  group('SupportController', () {
    test('load hydrates snapshot and tracks analytics', () async {
      final repository = _StubSupportRepository(
        onFetch: (_) async => RepositoryResult(
          data: _buildSnapshot(),
          fromCache: false,
          lastUpdated: DateTime(2024, 1, 4, 12),
        ),
        onCreateTicket: (draft) async => SupportTicket(
          id: 'sup-new',
          subject: draft.subject,
          category: draft.category,
          priority: draft.priority,
          status: 'open',
          summary: draft.summary,
          createdAt: DateTime(2024, 1, 4, 12),
          updatedAt: DateTime(2024, 1, 4, 12),
          messages: const [],
        ),
        onAddMessage: (ticketId, draft) async => SupportTicket(
          id: ticketId,
          subject: 'Verify billing statement',
          category: 'Finance',
          priority: 'High',
          status: 'open',
          summary: 'Need last quarter statement for audit.',
          createdAt: DateTime(2024, 1, 4, 8),
          updatedAt: DateTime(2024, 1, 4, 12),
          messages: [draft.toMessage()],
        ),
        onUpdateStatus: (ticketId, status, {bool escalated = false}) async => SupportTicket(
          id: ticketId,
          subject: 'Verify billing statement',
          category: 'Finance',
          priority: 'High',
          status: status,
          summary: 'Need last quarter statement for audit.',
          createdAt: DateTime(2024, 1, 4, 8),
          updatedAt: DateTime(2024, 1, 4, 12),
          escalated: escalated,
          messages: const [],
        ),
      );
      final analytics = TestAnalyticsService();
      final controller = SupportController(repository, analytics);

      await controller.load(forceRefresh: true);

      expect(controller.state.data?.openTickets, isNotEmpty);
      expect(controller.state.loading, isFalse);
      expect(
        analytics.events.first.name,
        equals('mobile_support_snapshot_loaded'),
      );
    });

    test('refresh triggers forced fetch and analytics event', () async {
      final repository = _StubSupportRepository(
        onFetch: (forceRefresh) async => RepositoryResult(
          data: _buildSnapshot(),
          fromCache: forceRefresh,
          lastUpdated: DateTime(2024, 1, 4, 12),
        ),
      );
      final analytics = TestAnalyticsService();
      final controller = SupportController(repository, analytics);

      await controller.refresh();

      expect(repository.lastForceRefresh, isTrue);
      expect(analytics.events.last.name, equals('mobile_support_snapshot_refreshed'));
    });

    test('createTicket toggles metadata and records analytics', () async {
      final repository = _StubSupportRepository(
        onFetch: (_) async => RepositoryResult(
          data: _buildSnapshot(),
          fromCache: false,
          lastUpdated: DateTime(2024, 1, 4, 12),
        ),
        onCreateTicket: (draft) async => SupportTicket(
          id: 'sup-new',
          subject: draft.subject,
          category: draft.category,
          priority: draft.priority,
          status: 'open',
          summary: draft.summary,
          createdAt: DateTime(2024, 1, 4, 12),
          updatedAt: DateTime(2024, 1, 4, 12),
          messages: const [],
        ),
        onAddMessage: (ticketId, draft) async => SupportTicket(
          id: ticketId,
          subject: 'Verify billing statement',
          category: 'Finance',
          priority: 'High',
          status: 'open',
          summary: 'Need last quarter statement for audit.',
          createdAt: DateTime(2024, 1, 4, 8),
          updatedAt: DateTime(2024, 1, 4, 12),
          messages: [draft.toMessage()],
        ),
        onUpdateStatus: (ticketId, status, {bool escalated = false}) async => SupportTicket(
          id: ticketId,
          subject: 'Verify billing statement',
          category: 'Finance',
          priority: 'High',
          status: status,
          summary: 'Need last quarter statement for audit.',
          createdAt: DateTime(2024, 1, 4, 8),
          updatedAt: DateTime(2024, 1, 4, 12),
          escalated: escalated,
          messages: const [],
        ),
      );
      final analytics = TestAnalyticsService();
      final controller = SupportController(repository, analytics);
      await controller.load(forceRefresh: true);
      final draft = const SupportTicketDraft(
        subject: 'Escalate payroll issue',
        category: 'Payroll',
        priority: 'High',
        summary: 'W2 download returning 500 error.',
      );

      final ticket = await controller.createTicket(draft);

      expect(ticket.subject, equals('Escalate payroll issue'));
      expect(controller.state.metadata['creatingTicket'], isFalse);
      expect(analytics.events.last.name, equals('mobile_support_ticket_created'));
    });

    test('addMessage updates replying metadata lifecycle', () async {
      final repository = _StubSupportRepository(
        onFetch: (_) async => RepositoryResult(
          data: _buildSnapshot(),
          fromCache: false,
          lastUpdated: DateTime(2024, 1, 4, 12),
        ),
        onCreateTicket: (draft) async => SupportTicket(
          id: 'sup-new',
          subject: draft.subject,
          category: draft.category,
          priority: draft.priority,
          status: 'open',
          summary: draft.summary,
          createdAt: DateTime(2024, 1, 4, 12),
          updatedAt: DateTime(2024, 1, 4, 12),
          messages: const [],
        ),
        onAddMessage: (ticketId, draft) async => SupportTicket(
          id: ticketId,
          subject: 'Verify billing statement',
          category: 'Finance',
          priority: 'High',
          status: 'open',
          summary: 'Need last quarter statement for audit.',
          createdAt: DateTime(2024, 1, 4, 8),
          updatedAt: DateTime(2024, 1, 4, 12),
          messages: [draft.toMessage()],
        ),
        onUpdateStatus: (ticketId, status, {bool escalated = false}) async => SupportTicket(
          id: ticketId,
          subject: 'Verify billing statement',
          category: 'Finance',
          priority: 'High',
          status: status,
          summary: 'Need last quarter statement for audit.',
          createdAt: DateTime(2024, 1, 4, 8),
          updatedAt: DateTime(2024, 1, 4, 12),
          escalated: escalated,
          messages: const [],
        ),
      );
      final analytics = TestAnalyticsService();
      final controller = SupportController(repository, analytics);
      await controller.load(forceRefresh: true);

      await controller.addMessage(
        'sup-100',
        const SupportMessageDraft(
          author: 'Alex Doe',
          role: 'Platform admin',
          body: 'Providing requested logs.',
          fromSupport: false,
        ),
      );

      expect(controller.state.metadata['replyingTicketId'], isNull);
      expect(analytics.events.last.name, equals('mobile_support_reply_added'));
    });

    test('escalateTicket records analytics and refreshes snapshot', () async {
      final repository = _StubSupportRepository(
        onFetch: (_) async => RepositoryResult(
          data: _buildSnapshot(),
          fromCache: false,
          lastUpdated: DateTime(2024, 1, 4, 12),
        ),
        onCreateTicket: (draft) async => SupportTicket(
          id: 'sup-new',
          subject: draft.subject,
          category: draft.category,
          priority: draft.priority,
          status: 'open',
          summary: draft.summary,
          createdAt: DateTime(2024, 1, 4, 12),
          updatedAt: DateTime(2024, 1, 4, 12),
          messages: const [],
        ),
        onAddMessage: (ticketId, draft) async => SupportTicket(
          id: ticketId,
          subject: 'Verify billing statement',
          category: 'Finance',
          priority: 'High',
          status: 'open',
          summary: 'Need last quarter statement for audit.',
          createdAt: DateTime(2024, 1, 4, 8),
          updatedAt: DateTime(2024, 1, 4, 12),
          messages: [draft.toMessage()],
        ),
        onUpdateStatus: (ticketId, status, {bool escalated = false}) async => SupportTicket(
          id: ticketId,
          subject: 'Verify billing statement',
          category: 'Finance',
          priority: 'High',
          status: status,
          summary: 'Need last quarter statement for audit.',
          createdAt: DateTime(2024, 1, 4, 8),
          updatedAt: DateTime(2024, 1, 4, 12),
          escalated: escalated,
          messages: const [],
        ),
      );
      final analytics = TestAnalyticsService();
      final controller = SupportController(repository, analytics);
      await controller.load(forceRefresh: true);

      await controller.escalateTicket('sup-100');

      expect(repository.updateStatusCount, equals(1));
      expect(analytics.events.last.name, equals('mobile_support_ticket_escalated'));
    });

    test('metadata helpers update filters locally', () async {
      final repository = _StubSupportRepository(
        onFetch: (_) async => RepositoryResult(
          data: _buildSnapshot(),
          fromCache: false,
          lastUpdated: DateTime(2024, 1, 4, 12),
        ),
      );
      final analytics = TestAnalyticsService();
      final controller = SupportController(repository, analytics);
      await controller.load(forceRefresh: true);

      controller.updateSearch('billing');
      controller.updateStatusFilter('awaiting_customer');
      controller.updateCategoryFilter('finance');

      expect(controller.state.metadata['search'], equals('billing'));
      expect(controller.state.metadata['statusFilter'], equals('awaiting_customer'));
      expect(controller.state.metadata['categoryFilter'], equals('finance'));
    });
  });
}
