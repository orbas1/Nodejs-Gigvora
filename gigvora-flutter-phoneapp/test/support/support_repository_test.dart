import 'package:flutter_test/flutter_test.dart';

import 'package:gigvora_mobile/features/support/data/models/support_models.dart';
import 'package:gigvora_mobile/features/support/data/support_repository.dart';

import '../helpers/in_memory_offline_cache.dart';

void main() {
  group('SupportRepository', () {
    late InMemoryOfflineCache cache;
    late SupportRepository repository;

    setUp(() {
      cache = InMemoryOfflineCache();
      repository = SupportRepository(cache);
    });

    tearDown(() async {
      await cache.dispose();
    });

    test('fetchSnapshot seeds demo tickets and articles', () async {
      final snapshot = await repository.fetchSnapshot(forceRefresh: true);

      expect(snapshot.data.openTickets, isNotEmpty);
      expect(snapshot.data.knowledgeBase, isNotEmpty);
    });

    test('createTicket adds a ticket to the queue and recent list', () async {
      final draft = SupportTicketDraft(
        subject: 'Need sandbox reset',
        category: 'Platform',
        priority: 'Medium',
        summary: 'Provisioned sandbox has stale configuration. Please reset.',
        attachments: const <SupportAttachment>[],
      );

      final ticket = await repository.createTicket(draft);
      final snapshot = await repository.fetchSnapshot();

      expect(snapshot.data.openTickets.first.id, equals(ticket.id));
      expect(snapshot.data.recentTickets.any((item) => item.id == ticket.id), isTrue);
    });

    test('addMessage appends a reply on the ticket', () async {
      final initial = await repository.fetchSnapshot();
      final ticket = initial.data.openTickets.first;

      final draft = SupportMessageDraft(
        fromSupport: false,
        body: 'Adding additional logs for context.',
        attachments: const <SupportAttachment>[],
      );

      final updated = await repository.addMessage(ticket.id, draft);

      expect(updated.messages.first.body, contains('additional logs'));
      expect(updated.messages.first.fromSupport, isFalse);
    });

    test('updateTicketStatus updates ticket metadata and escalates when requested', () async {
      final initial = await repository.fetchSnapshot();
      final ticket = initial.data.openTickets.first;

      final updated = await repository.updateTicketStatus(ticket.id, 'escalated', escalated: true);

      expect(updated.status, equals('escalated'));
      expect(updated.escalated, isTrue);
    });
  });
}
