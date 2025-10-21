import 'package:flutter_test/flutter_test.dart';
import 'package:gigvora_mobile/features/support/data/models/support_models.dart';
import 'package:gigvora_mobile/features/support/data/support_repository.dart';

import '../helpers/in_memory_offline_cache.dart';

void main() {
  group('SupportRepository', () {
    test('fetchSnapshot seeds data and serves cache on subsequent calls', () async {
      final cache = InMemoryOfflineCache();
      final repository = SupportRepository(cache);

      final first = await repository.fetchSnapshot(forceRefresh: true);
      expect(first.fromCache, isFalse);
      expect(first.data.openTickets, isNotEmpty);

      final cached = await repository.fetchSnapshot();
      expect(cached.fromCache, isTrue);
      expect(cached.data.openTickets, isNotEmpty);
    });

    test('createTicket persists new tickets to the cached snapshot', () async {
      final cache = InMemoryOfflineCache();
      final repository = SupportRepository(cache);
      final draft = const SupportTicketDraft(
        subject: 'Need help connecting CRM',
        category: 'Integrations',
        priority: 'High',
        summary: 'OAuth callback failing for new workspace.',
        attachments: ['https://files.example.com/callback-error.png'],
      );

      final ticket = await repository.createTicket(draft);
      final snapshot = (await repository.fetchSnapshot()).data;

      expect(ticket.subject, equals('Need help connecting CRM'));
      expect(snapshot.openTickets.first.id, equals(ticket.id));
      expect(snapshot.recentTickets.first.id, equals(ticket.id));
    });

    test('addMessage appends replies and refreshes cached tickets', () async {
      final cache = InMemoryOfflineCache();
      final repository = SupportRepository(cache);
      final ticket = await repository.createTicket(
        const SupportTicketDraft(
          subject: 'Escalation example',
          category: 'Operations',
          priority: 'Medium',
          summary: 'Investigating workforce sync.',
        ),
      );

      final updated = await repository.addMessage(
        ticket.id,
        const SupportMessageDraft(
          author: 'Gigvora Support',
          role: 'Support engineer',
          body: 'We are reviewing the sync logs now.',
          fromSupport: true,
        ),
      );

      expect(updated.messages, isNotEmpty);
      expect(updated.messages.first.body, contains('reviewing the sync logs'));

      final snapshot = (await repository.fetchSnapshot()).data;
      final persisted = snapshot.openTickets.firstWhere((element) => element.id == ticket.id);
      expect(persisted.messages.first.body, contains('reviewing the sync logs'));
    });

    test('updateTicketStatus changes status and escalated flag consistently', () async {
      final cache = InMemoryOfflineCache();
      final repository = SupportRepository(cache);
      final ticket = await repository.createTicket(
        const SupportTicketDraft(
          subject: 'Close request',
          category: 'General',
          priority: 'Low',
          summary: 'Testing close workflow',
        ),
      );

      final updated = await repository.updateTicketStatus(ticket.id, 'solved', escalated: true);

      expect(updated.status, equals('solved'));
      expect(updated.escalated, isTrue);

      final snapshot = (await repository.fetchSnapshot()).data;
      final persisted = snapshot.openTickets.firstWhere((element) => element.id == ticket.id);
      expect(persisted.status, equals('solved'));
      expect(persisted.escalated, isTrue);
    });
  });
}
