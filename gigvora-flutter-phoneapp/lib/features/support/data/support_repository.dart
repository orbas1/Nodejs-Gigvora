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
      final snapshot = response is Map<String, dynamic>
          ? SupportDeskSnapshot.fromJson(response)
          : SupportDeskSnapshot.seed();
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
      final seeded = SupportDeskSnapshot.seed();
      await _writeSnapshot(userId, seeded);
      return RepositoryResult<SupportDeskSnapshot>(
        data: seeded,
        fromCache: false,
        lastUpdated: DateTime.now(),
        error: error,
      );
    }
  }

  Future<SupportCase> createTicket(int userId, SupportTicketDraft draft) async {
    final existing = await fetchSnapshot(userId: userId);
    final snapshot = existing.data;
    final now = DateTime.now();

    final message = SupportMessage(
      id: 'msg-${now.microsecondsSinceEpoch}',
      author: 'You',
      role: 'member',
      body: draft.summary,
      createdAt: now,
      fromSupport: false,
    );

    final supportCase = SupportCase(
      id: 'local-${now.microsecondsSinceEpoch}',
      status: 'triage',
      priority: draft.priority.toLowerCase(),
      title: draft.subject.trim(),
      summary: draft.summary.trim(),
      category: draft.category.trim().isNotEmpty ? draft.category.trim() : 'General',
      escalatedAt: now,
      updatedAt: now,
      messages: [message],
      linkedOrder: null,
      links: const <SupportCaseLink>[],
      firstResponseAt: null,
      resolvedAt: null,
      resolutionSummary: null,
      assignedAgent: const SupportCasePerson(id: null, name: 'Gigvora support queue'),
      escalatedBy: const SupportCasePerson(id: null, name: 'You'),
    );

    final cases = [supportCase, ...snapshot.cases];
    final metrics = snapshot.metrics.copyWith(
      openSupportCases: snapshot.metrics.openSupportCases + 1,
    );
    final updatedSnapshot = snapshot.copyWith(
      refreshedAt: now,
      metrics: metrics,
      cases: cases,
    );
    await _writeSnapshot(userId, updatedSnapshot);
    return supportCase;
  }

  Future<SupportCase> addMessage(
    int userId,
    String caseId,
    SupportMessageDraft draft,
  ) async {
    final existing = await fetchSnapshot(userId: userId);
    final snapshot = existing.data;
    final message = draft.toMessage();
    final updatedCases = <SupportCase>[];
    SupportCase? updatedCase;

    for (final supportCase in snapshot.cases) {
      if (supportCase.id == caseId) {
        final messages = [message, ...supportCase.messages];
        updatedCase = supportCase.copyWith(
          messages: messages,
          updatedAt: message.createdAt,
        );
        updatedCases.add(updatedCase!);
      } else {
        updatedCases.add(supportCase);
      }
    }

    if (updatedCase == null) {
      throw StateError('Support case $caseId not found');
    }

    final updatedSnapshot = snapshot.copyWith(
      refreshedAt: DateTime.now(),
      cases: updatedCases,
    );
    await _writeSnapshot(userId, updatedSnapshot);
    return updatedCase;
  }

  Future<SupportCase> updateTicketStatus(
    int userId,
    String caseId,
    String status, {
    String? resolutionSummary,
  }) async {
    final existing = await fetchSnapshot(userId: userId);
    final snapshot = existing.data;
    final normalizedStatus = status.trim().toLowerCase();
    final now = DateTime.now();
    final updatedCases = <SupportCase>[];
    SupportCase? updatedCase;

    for (final supportCase in snapshot.cases) {
      if (supportCase.id == caseId) {
        final resolved = {'resolved', 'closed'}.contains(normalizedStatus);
        updatedCase = supportCase.copyWith(
          status: normalizedStatus,
          updatedAt: now,
          resolvedAt: resolved ? now : supportCase.resolvedAt,
          resolutionSummary: resolutionSummary ?? supportCase.resolutionSummary,
        );
        updatedCases.add(updatedCase!);
      } else {
        updatedCases.add(supportCase);
      }
    }

    if (updatedCase == null) {
      throw StateError('Support case $caseId not found');
    }

    final openCases = updatedCases.where((supportCase) => supportCase.isOpen).length;
    final metrics = snapshot.metrics.copyWith(openSupportCases: openCases);
    final updatedSnapshot = snapshot.copyWith(
      refreshedAt: now,
      metrics: metrics,
      cases: updatedCases,
    );
    await _writeSnapshot(userId, updatedSnapshot);
    return updatedCase;
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
        return SupportDeskSnapshot.seed();
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
}

final supportRepositoryProvider = Provider<SupportRepository>((ref) {
  final cache = ref.watch(offlineCacheProvider);
  final apiClient = ref.watch(apiClientProvider);
  return SupportRepository(apiClient, cache);
});
