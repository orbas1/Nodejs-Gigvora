import 'package:gigvora_foundation/gigvora_foundation.dart';

import '../../../core/providers.dart';
import 'models/support_models.dart';

class SupportRepository {
  SupportRepository(this._cache);

  final OfflineCache _cache;

  static const _cacheKey = 'support:snapshot';
  static const _cacheTtl = Duration(minutes: 4);

  Future<RepositoryResult<SupportSnapshot>> fetchSnapshot({bool forceRefresh = false}) async {
    CacheEntry<SupportSnapshot>? cached;
    try {
      cached = _cache.read<SupportSnapshot>(_cacheKey, (raw) {
        if (raw is Map<String, dynamic>) {
          return _snapshotFromJson(raw);
        }
        if (raw is Map) {
          return _snapshotFromJson(Map<String, dynamic>.from(raw as Map));
        }
        return _seedSnapshot();
      });
    } catch (_) {
      cached = null;
    }

    if (!forceRefresh && cached != null) {
      return RepositoryResult<SupportSnapshot>(
        data: cached.value,
        fromCache: true,
        lastUpdated: cached.storedAt,
      );
    }

    final seeded = _seedSnapshot();
    await _writeSnapshot(seeded);
    return RepositoryResult<SupportSnapshot>(
      data: seeded,
      fromCache: false,
      lastUpdated: DateTime.now(),
    );
  }

  Future<SupportTicket> createTicket(SupportTicketDraft draft) async {
    final snapshot = (await fetchSnapshot()).data;
    final ticket = SupportTicket(
      id: 'sup-${DateTime.now().microsecondsSinceEpoch}',
      subject: draft.subject,
      category: draft.category,
      priority: draft.priority,
      status: 'open',
      summary: draft.summary,
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
      attachments: draft.attachments,
      messages: const <SupportMessage>[],
    );
    final updatedSnapshot = snapshot.copyWith(
      openTickets: [ticket, ...snapshot.openTickets],
      recentTickets: [ticket, ...snapshot.recentTickets].take(8).toList(growable: false),
    );
    await _writeSnapshot(updatedSnapshot);
    return ticket;
  }

  Future<SupportTicket> addMessage(String ticketId, SupportMessageDraft draft) async {
    final snapshot = (await fetchSnapshot()).data;
    final message = draft.toMessage();
    final openTickets = snapshot.openTickets.map((ticket) {
      if (ticket.id != ticketId) {
        return ticket;
      }
      final updatedMessages = [message, ...ticket.messages];
      return ticket.copyWith(messages: updatedMessages, updatedAt: message.createdAt);
    }).toList(growable: false);
    final recentTickets = snapshot.recentTickets.map((ticket) {
      if (ticket.id != ticketId) {
        return ticket;
      }
      final updatedMessages = [message, ...ticket.messages];
      return ticket.copyWith(messages: updatedMessages, updatedAt: message.createdAt);
    }).toList(growable: false);
    await _writeSnapshot(snapshot.copyWith(openTickets: openTickets, recentTickets: recentTickets));
    return openTickets.firstWhere((ticket) => ticket.id == ticketId, orElse: () {
      return recentTickets.firstWhere((ticket) => ticket.id == ticketId);
    });
  }

  Future<SupportTicket> updateTicketStatus(String ticketId, String status, {bool escalated = false}) async {
    final snapshot = (await fetchSnapshot()).data;
    SupportTicket? updatedTicket;
    final openTickets = snapshot.openTickets.map((ticket) {
      if (ticket.id != ticketId) {
        return ticket;
      }
      updatedTicket = ticket.copyWith(status: status, escalated: escalated, updatedAt: DateTime.now());
      return updatedTicket!;
    }).toList(growable: false);

    final recentTickets = snapshot.recentTickets.map((ticket) {
      if (ticket.id != ticketId) {
        return ticket;
      }
      return updatedTicket ?? ticket.copyWith(status: status, escalated: escalated, updatedAt: DateTime.now());
    }).toList(growable: false);

    await _writeSnapshot(snapshot.copyWith(openTickets: openTickets, recentTickets: recentTickets));
    return updatedTicket ??
        recentTickets.firstWhere((ticket) => ticket.id == ticketId, orElse: () => openTickets.firstWhere((ticket) => ticket.id == ticketId));
  }

  Future<void> _writeSnapshot(SupportSnapshot snapshot) {
    return _cache.write(_cacheKey, _snapshotToJson(snapshot), ttl: _cacheTtl);
  }

  SupportSnapshot _seedSnapshot() {
    final now = DateTime.now();
    final articles = [
      const SupportArticle(
        id: 'workflow-automation',
        title: 'Configuring workflow automation guardrails',
        summary: 'Ship automations confidently with staging sandboxes, role-based access, and rollback controls.',
        url: 'https://support.gigvora.com/articles/workflow-automation',
        tags: ['automation', 'governance', 'rbac'],
        readTimeMinutes: 6,
      ),
      const SupportArticle(
        id: 'mobile-inbox',
        title: 'Staying responsive in the mobile inbox',
        summary: 'Set up notifications, pin workflows, and sync transcript exports across devices.',
        url: 'https://support.gigvora.com/articles/mobile-inbox',
        tags: ['messaging', 'mobile'],
        readTimeMinutes: 3,
      ),
      const SupportArticle(
        id: 'billing',
        title: 'Managing billing and statement exports',
        summary: 'Step-by-step guide to configure cost centres, download statements, and set approval thresholds.',
        url: 'https://support.gigvora.com/articles/billing',
        tags: ['finance', 'billing'],
        readTimeMinutes: 5,
      ),
    ];

    final tickets = [
      SupportTicket(
        id: 'sup-30221',
        subject: 'Unable to connect Slack workspace',
        category: 'Integrations',
        priority: 'High',
        status: 'awaiting_customer',
        summary: 'OAuth handshake failing for workspace-id 8392 after rolling out new scopes. Need assistance verifying callbacks.',
        createdAt: now.subtract(const Duration(hours: 9)),
        updatedAt: now.subtract(const Duration(hours: 3)),
        messages: [
          SupportMessage(
            id: 'msg-1',
            author: 'Gigvora Support',
            role: 'Support engineer',
            body: 'Hi team! We see a mismatch with the redirect URI configured. Can you confirm the slug on your Slack app settings?',
            createdAt: now.subtract(const Duration(hours: 3, minutes: 20)),
            fromSupport: true,
          ),
          SupportMessage(
            id: 'msg-2',
            author: 'Priya Patel',
            role: 'Platform admin',
            body: 'We updated the URI to include /oauth/redirect. Still receiving scope mismatch warnings.',
            createdAt: now.subtract(const Duration(hours: 2, minutes: 40)),
          ),
        ],
        attachments: const ['https://cdn.gigvora.com/uploads/slack-error.png'],
      ),
      SupportTicket(
        id: 'sup-30218',
        subject: 'Need guidance on workforce analytics',
        category: 'Analytics',
        priority: 'Medium',
        status: 'open',
        summary: 'Looking to forecast contractor utilisation across two agencies and internal squads.',
        createdAt: now.subtract(const Duration(days: 1, hours: 2)),
        updatedAt: now.subtract(const Duration(hours: 16)),
        messages: const [],
      ),
    ];

    final recent = [
      SupportTicket(
        id: 'sup-30211',
        subject: 'Mentor availability sync',
        category: 'Mentorship',
        priority: 'Low',
        status: 'solved',
        summary: 'Availability not showing in Explorer after timezone update.',
        createdAt: now.subtract(const Duration(days: 3, hours: 4)),
        updatedAt: now.subtract(const Duration(days: 1, hours: 6)),
        messages: const [],
      ),
      ...tickets,
    ];

    return SupportSnapshot(
      openTickets: tickets,
      recentTickets: recent,
      articles: articles,
      firstResponseMinutes: 8,
      satisfactionScore: 4.8,
    );
  }

  Map<String, dynamic> _snapshotToJson(SupportSnapshot snapshot) {
    return {
      'openTickets': snapshot.openTickets.map((ticket) => ticket.toJson()).toList(growable: false),
      'recentTickets': snapshot.recentTickets.map((ticket) => ticket.toJson()).toList(growable: false),
      'articles': snapshot.articles.map((article) => article.toJson()).toList(growable: false),
      'firstResponseMinutes': snapshot.firstResponseMinutes,
      'satisfactionScore': snapshot.satisfactionScore,
    };
  }

  SupportSnapshot _snapshotFromJson(Map<String, dynamic> json) {
    final openTickets = (json['openTickets'] as List<dynamic>? ?? const [])
        .whereType<Map>()
        .map((entry) => SupportTicket.fromJson(Map<String, dynamic>.from(entry)))
        .toList(growable: false);
    final recentTickets = (json['recentTickets'] as List<dynamic>? ?? const [])
        .whereType<Map>()
        .map((entry) => SupportTicket.fromJson(Map<String, dynamic>.from(entry)))
        .toList(growable: false);
    final articles = (json['articles'] as List<dynamic>? ?? const [])
        .whereType<Map>()
        .map((entry) => SupportArticle.fromJson(Map<String, dynamic>.from(entry)))
        .toList(growable: false);
    final firstResponse = json['firstResponseMinutes'] is int
        ? json['firstResponseMinutes'] as int
        : int.tryParse('${json['firstResponseMinutes']}') ?? 9;
    final satisfaction = json['satisfactionScore'] is num
        ? (json['satisfactionScore'] as num).toDouble()
        : double.tryParse('${json['satisfactionScore']}') ?? 4.7;
    return SupportSnapshot(
      openTickets: openTickets,
      recentTickets: recentTickets,
      articles: articles,
      firstResponseMinutes: firstResponse,
      satisfactionScore: satisfaction,
    );
  }
}

final supportRepositoryProvider = Provider<SupportRepository>((ref) {
  final cache = ref.watch(offlineCacheProvider);
  return SupportRepository(cache);
});
