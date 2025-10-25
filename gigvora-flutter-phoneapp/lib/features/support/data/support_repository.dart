import 'package:gigvora_foundation/gigvora_foundation.dart';

import '../../../core/providers.dart';
import 'models/support_models.dart';

class SupportRepository {
  SupportRepository(this._apiClient, this._cache);

  final ApiClient _apiClient;
  final OfflineCache _cache;

  static const _cacheTtl = Duration(minutes: 5);

  String _cacheKey(int userId) => 'support:desk:$userId';

  Future<RepositoryResult<SupportDeskSnapshot>> fetchSnapshot({
    required int userId,
    bool forceRefresh = false,
  }) async {
    final cacheKey = _cacheKey(userId);
    final cached = _readCachedSnapshot(cacheKey);

    if (!forceRefresh && cached != null) {
      return RepositoryResult<SupportDeskSnapshot>(
        data: cached.value,
        fromCache: true,
        lastUpdated: cached.storedAt,
      );
    }

    try {
      final response = await _apiClient.get(
        '/users/$userId/support-desk',
        query: forceRefresh ? const {'fresh': 'true'} : null,
      );
      final snapshot = _parseSnapshot(response);
      await _writeSnapshot(userId, snapshot);
      return RepositoryResult<SupportDeskSnapshot>(
        data: snapshot,
        fromCache: false,
        lastUpdated: DateTime.now(),
      );
    } catch (error) {
      if (cached != null) {
        return RepositoryResult<SupportDeskSnapshot>(
          data: cached.value,
          fromCache: true,
          lastUpdated: cached.storedAt,
          error: error,
        );
      }
      final fallback = SupportDeskSnapshot.empty();
      await _writeSnapshot(userId, fallback);
      return RepositoryResult<SupportDeskSnapshot>(
        data: fallback,
        fromCache: false,
        lastUpdated: DateTime.now(),
        error: error,
      );
    }
  }

  Future<SupportCase> createTicket(int userId, SupportTicketDraft draft) async {
    final subject = draft.subject.trim().isEmpty ? 'Support request' : draft.subject.trim();
    final category = draft.category.trim().isNotEmpty ? draft.category.trim() : 'general';
    final priority = draft.priority.trim().isNotEmpty ? draft.priority.trim().toLowerCase() : 'medium';
    final summary = draft.summary.trim();

    final threadResponse = await _apiClient.post(
      '/messaging/threads',
      body: {
        'subject': subject,
        'channelType': 'support',
        'participantIds': [userId],
        'metadata': {
          'category': category,
          'priority': priority,
          'origin': 'mobile_app',
        },
      },
    );
    final thread = _asJsonMap(threadResponse);
    final threadId = _parseId(thread['id']);
    if (threadId == null) {
      throw StateError('Support thread identifier missing from create response.');
    }

    await _apiClient.post(
      '/messaging/threads/$threadId/messages',
      body: {
        'messageType': 'text',
        'body': summary,
        'metadata': {
          'origin': 'mobile_app',
          'fromSupport': false,
          'support': {
            'category': category,
            'priority': priority,
          },
        },
      },
    );

    final escalateResponse = await _apiClient.post(
      '/messaging/threads/$threadId/escalate',
      body: {
        'reason': summary.isNotEmpty ? summary : subject,
        'priority': priority,
        'metadata': {
          'category': category,
          'subject': subject,
          'origin': 'mobile_app',
        },
      },
    );
    final casePayload = _asJsonMap(escalateResponse);
    final caseId = casePayload['id'] != null ? '${casePayload['id']}' : null;

    return _refreshCase(
      userId,
      caseId: caseId,
      threadId: _parseId(casePayload['threadId']) ?? threadId,
    );
  }

  Future<SupportCase> addMessage(
    int userId,
    String caseId,
    SupportMessageDraft draft,
  ) async {
    final current = await fetchSnapshot(userId: userId);
    var supportCase = _findCase(current.data.cases, caseId: caseId);
    if (supportCase == null) {
      supportCase = await _refreshCase(userId, caseId: caseId);
    }
    final threadId = supportCase.threadId;
    if (threadId == null) {
      throw StateError('Support case $caseId is missing a messaging thread.');
    }

    await _apiClient.post(
      '/messaging/threads/$threadId/messages',
      body: {
        'messageType': 'text',
        'body': draft.body.trim(),
        'metadata': {
          'origin': 'mobile_app',
          'fromSupport': draft.fromSupport,
        },
      },
    );

    return _refreshCase(userId, caseId: caseId, threadId: threadId);
  }

  Future<SupportCase> updateTicketStatus(
    int userId,
    String caseId,
    String status, {
    String? resolutionSummary,
  }) async {
    final current = await fetchSnapshot(userId: userId);
    var supportCase = _findCase(current.data.cases, caseId: caseId);
    if (supportCase == null) {
      supportCase = await _refreshCase(userId, caseId: caseId);
    }
    final threadId = supportCase.threadId;
    if (threadId == null) {
      throw StateError('Support case $caseId is missing a messaging thread.');
    }

    final normalizedStatus = status.trim().toLowerCase();
    if (normalizedStatus == 'escalated') {
      await _apiClient.post(
        '/messaging/threads/$threadId/escalate',
        body: {
          'reason': resolutionSummary?.trim().isNotEmpty == true
              ? resolutionSummary!.trim()
              : supportCase.summary,
          'priority': supportCase.priority.toLowerCase(),
          'metadata': {
            'category': supportCase.category,
            'origin': 'mobile_app',
          },
        },
      );
    } else {
      await _apiClient.post(
        '/messaging/threads/$threadId/support-status',
        body: {
          'status': normalizedStatus,
          if (resolutionSummary?.trim().isNotEmpty == true)
            'resolutionSummary': resolutionSummary!.trim(),
          'metadata': {
            'origin': 'mobile_app',
          },
        },
      );
    }

    return _refreshCase(userId, caseId: caseId, threadId: threadId);
  }

  CacheEntry<SupportDeskSnapshot>? _readCachedSnapshot(String cacheKey) {
    try {
      return _cache.read<SupportDeskSnapshot>(cacheKey, (raw) {
        if (raw is Map<String, dynamic>) {
          return SupportDeskSnapshot.fromJson(raw);
        }
        if (raw is Map) {
          return SupportDeskSnapshot.fromJson(Map<String, dynamic>.from(raw as Map));
        }
        return SupportDeskSnapshot.empty();
      });
    } catch (_) {
      return null;
    }
  }

  Future<void> _writeSnapshot(int userId, SupportDeskSnapshot snapshot) {
    return _cache.write(
      _cacheKey(userId),
      snapshot.toJson(),
      ttl: _cacheTtl,
    );
  }

  Map<String, dynamic> _asJsonMap(dynamic payload) {
    if (payload is Map<String, dynamic>) {
      return payload;
    }
    if (payload is Map) {
      return Map<String, dynamic>.from(payload as Map);
    }
    throw StateError('Unexpected payload type: ${payload.runtimeType}');
  }

  SupportDeskSnapshot _parseSnapshot(dynamic payload) {
    return SupportDeskSnapshot.fromJson(_asJsonMap(payload));
  }

  SupportCase? _findCase(
    Iterable<SupportCase> cases, {
    String? caseId,
    int? threadId,
  }) {
    for (final supportCase in cases) {
      final matchesId = caseId != null && supportCase.id == caseId;
      final matchesThread = threadId != null && supportCase.threadId == threadId;
      if (matchesId || matchesThread) {
        return supportCase;
      }
    }
    return null;
  }

  Future<SupportCase> _refreshCase(
    int userId, {
    String? caseId,
    int? threadId,
  }) async {
    final refreshed = await fetchSnapshot(userId: userId, forceRefresh: true);
    final match = _findCase(
      refreshed.data.cases,
      caseId: caseId,
      threadId: threadId,
    );
    if (match != null) {
      return match;
    }
    throw StateError('Support case ${caseId ?? threadId ?? 'unknown'} not found after refresh.');
  }

  int? _parseId(dynamic value) {
    if (value == null) {
      return null;
    }
    if (value is int) {
      return value;
    }
    if (value is num) {
      return value.toInt();
    }
    return int.tryParse('$value');
  }
}

final supportRepositoryProvider = Provider<SupportRepository>((ref) {
  final cache = ref.watch(offlineCacheProvider);
  final apiClient = ref.watch(apiClientProvider);
  return SupportRepository(apiClient, cache);
});
