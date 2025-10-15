import 'dart:async';

import 'package:gigvora_foundation/gigvora_foundation.dart';

import 'models/security_telemetry.dart';

class SecurityRepository {
  SecurityRepository(this._cache, this._apiClient, {DateTime Function()? clock})
      : _clock = clock ?? DateTime.now;

  final OfflineCache _cache;
  final ApiClient _apiClient;
  final DateTime Function() _clock;

  static const _cacheKey = 'security:telemetry';
  static const _ttl = Duration(minutes: 4);

  Future<RepositoryResult<SecurityTelemetry>> fetchTelemetry({bool forceRefresh = false}) async {
    final cached = forceRefresh
        ? null
        : _cache.read<SecurityTelemetry>(
            _cacheKey,
            (raw) {
              if (raw is SecurityTelemetry) {
                return raw;
              }
              if (raw is Map<String, dynamic>) {
                return SecurityTelemetry.fromJson(raw);
              }
              if (raw is Map) {
                return SecurityTelemetry.fromJson(Map<String, dynamic>.from(raw as Map));
              }
              return SecurityTelemetry.empty();
            },
          );

    if (cached != null) {
      return RepositoryResult(
        data: cached.value,
        fromCache: true,
        lastUpdated: cached.storedAt,
      );
    }

    try {
      final readiness = await _apiClient.get('/health/ready');
      final maintenance = await _apiClient.get(
        '/runtime/maintenance',
        query: {
          'audience': 'operations',
          'channel': 'mobile',
          'windowMinutes': 180,
          'includeResolved': true,
          'limit': 25,
        },
      );

      final telemetry = _composeTelemetry(
        readiness is Map ? Map<String, dynamic>.from(readiness as Map) : const <String, dynamic>{},
        maintenance is Map ? Map<String, dynamic>.from(maintenance as Map) : const <String, dynamic>{},
      );

      await _cache.write(_cacheKey, telemetry.toJson(), ttl: _ttl);
      return RepositoryResult(
        data: telemetry,
        fromCache: false,
        lastUpdated: _clock(),
      );
    } catch (error) {
      final fallback = _cache.read<SecurityTelemetry>(
        _cacheKey,
        (raw) {
          if (raw is SecurityTelemetry) {
            return raw;
          }
          if (raw is Map<String, dynamic>) {
            return SecurityTelemetry.fromJson(raw);
          }
          if (raw is Map) {
            return SecurityTelemetry.fromJson(Map<String, dynamic>.from(raw as Map));
          }
          return SecurityTelemetry.empty();
        },
      );

      if (fallback != null) {
        return RepositoryResult(
          data: fallback.value,
          fromCache: true,
          lastUpdated: fallback.storedAt,
          error: error,
        );
      }

      rethrow;
    }
  }

  SecurityTelemetry _composeTelemetry(
    Map<String, dynamic> readiness,
    Map<String, dynamic> maintenance,
  ) {
    final dependencies = _parseDependencies(readiness['dependencies']);
    final dependencySignals = dependencies
        .where((entry) => entry.status != 'ok')
        .map((entry) => '${entry.name}: ${entry.status.toUpperCase()}')
        .toList();

    final announcements = _parseAnnouncements(maintenance['announcements']);
    final activeIncidents = announcements
        .where((announcement) =>
            (announcement.severity == 'incident' || announcement.severity == 'security') &&
            (announcement.status == 'active' || announcement.status == 'scheduled'))
        .toList();
    final resolvedIncidents = announcements
        .where((announcement) =>
            (announcement.severity == 'incident' || announcement.severity == 'security') &&
            announcement.status == 'resolved' &&
            announcement.startsAt != null &&
            announcement.endsAt != null)
        .toList();

    final metrics = SecurityMetrics(
      blockedIntrusions: announcements.where((announcement) => announcement.severity == 'security').length,
      quarantinedAssets: activeIncidents.length,
      highRiskVulnerabilities: dependencies.where((entry) => entry.status == 'degraded').length,
      meanTimeToRespondMinutes: _calculateMeanTimeToRespond(resolvedIncidents),
    );

    final posture = SecurityPosture(
      status: _mapReadinessStatus('${readiness['status'] ?? 'ok'}'),
      attackSurfaceScore: _calculateAttackSurfaceScore(dependencies),
      attackSurfaceChange: -dependencies.where((entry) => entry.status != 'ok').length * 5,
      signals: dependencySignals,
    );

    final patchWindow = _buildPatchWindow(announcements);
    final alerts = announcements.map(_mapAnnouncementToAlert).toList();
    final incidents = announcements
        .where((announcement) => announcement.severity == 'incident' || announcement.severity == 'security')
        .map(_mapAnnouncementToIncident)
        .toList();
    final playbooks = _buildPlaybooks(announcements);

    return SecurityTelemetry(
      metrics: metrics,
      posture: posture,
      patchWindow: patchWindow,
      alerts: alerts,
      incidents: incidents,
      playbooks: playbooks,
    );
  }

  int _calculateMeanTimeToRespond(List<_Announcement> incidents) {
    if (incidents.isEmpty) {
      return 0;
    }
    final totalMinutes = incidents
        .map((incident) =>
            incident.endsAt!.difference(incident.startsAt!).inMinutes.clamp(0, 24 * 60))
        .fold<int>(0, (sum, minutes) => sum + minutes);
    return (totalMinutes / incidents.length).round();
  }

  String _mapReadinessStatus(String status) {
    switch (status.toLowerCase()) {
      case 'starting':
        return 'warming_up';
      case 'degraded':
        return 'attention';
      case 'error':
        return 'critical';
      default:
        return 'steady';
    }
  }

  int _calculateAttackSurfaceScore(List<_DependencyStatus> dependencies) {
    final degradedCount = dependencies.where((entry) => entry.status != 'ok').length;
    final score = 100 - degradedCount * 12;
    return score.clamp(40, 100);
  }

  SecurityPatchWindow _buildPatchWindow(List<_Announcement> announcements) {
    final scheduled = announcements.where((announcement) => announcement.status == 'scheduled').toList();
    if (scheduled.isEmpty) {
      return const SecurityPatchWindow(nextWindow: null, backlog: 0, backlogChange: 0);
    }

    scheduled.sort((a, b) {
      final first = a.startsAt?.millisecondsSinceEpoch ?? 0;
      final second = b.startsAt?.millisecondsSinceEpoch ?? 0;
      return first.compareTo(second);
    });

    final next = scheduled.first.startsAt;
    return SecurityPatchWindow(
      nextWindow: next,
      backlog: scheduled.length,
      backlogChange: scheduled.length - announcements.where((announcement) => announcement.status == 'active').length,
    );
  }

  List<_DependencyStatus> _parseDependencies(dynamic value) {
    if (value is Map) {
      return value.entries
          .map(
            (entry) => _DependencyStatus(
              name: '${entry.key}',
              status: '${(entry.value as Map?)?['status'] ?? 'unknown'}'.toLowerCase(),
            ),
          )
          .toList();
    }
    return const [];
  }

  List<_Announcement> _parseAnnouncements(dynamic value) {
    if (value is List) {
      return value
          .whereType<Map>()
          .map((item) => _Announcement.fromJson(Map<String, dynamic>.from(item)))
          .toList();
    }
    return const [];
  }

  SecurityAlert _mapAnnouncementToAlert(_Announcement announcement) {
    final detectedAt = announcement.startsAt ?? _clock().toUtc();
    final recommended = announcement.metadata['action'] ?? announcement.message;
    return SecurityAlert(
      id: announcement.slug,
      severity: announcement.severity,
      category: announcement.severity == 'maintenance' ? 'Maintenance' : 'Security',
      source: 'runtime_maintenance',
      asset: announcement.channels.isNotEmpty ? announcement.channels.join(', ') : 'platform',
      location: announcement.audiences.isNotEmpty ? announcement.audiences.join(', ') : 'global',
      detectedAt: detectedAt,
      status: announcement.status,
      recommendedAction: '$recommended',
    );
  }

  SecurityIncident _mapAnnouncementToIncident(_Announcement announcement) {
    final openedAt = announcement.startsAt ?? _clock().toUtc();
    return SecurityIncident(
      id: announcement.slug,
      title: announcement.title,
      severity: announcement.severity,
      owner: 'Security operations',
      openedAt: openedAt,
      status: announcement.status,
      summary: announcement.message,
    );
  }

  List<SecurityPlaybook> _buildPlaybooks(List<_Announcement> announcements) {
    final grouped = <String, int>{};
    for (final announcement in announcements) {
      grouped.update(announcement.severity, (value) => value + 1, ifAbsent: () => 1);
    }

    final now = _clock();
    return grouped.entries
        .map(
          (entry) => SecurityPlaybook(
            id: 'playbook-${entry.key}',
            name: '${entry.key.toUpperCase()} response runbook',
            owner: 'Security operations',
            runCount: entry.value,
            lastExecutedAt: now,
          ),
        )
        .toList();
  }
}

class _DependencyStatus {
  const _DependencyStatus({required this.name, required this.status});

  final String name;
  final String status;
}

class _Announcement {
  _Announcement({
    required this.slug,
    required this.title,
    required this.message,
    required this.severity,
    required this.status,
    required this.audiences,
    required this.channels,
    required this.metadata,
    this.startsAt,
    this.endsAt,
  });

  final String slug;
  final String title;
  final String message;
  final String severity;
  final String status;
  final List<String> audiences;
  final List<String> channels;
  final Map<String, dynamic> metadata;
  final DateTime? startsAt;
  final DateTime? endsAt;

  factory _Announcement.fromJson(Map<String, dynamic> json) {
    DateTime? parseDate(dynamic value) {
      if (value is String && value.isNotEmpty) {
        return DateTime.tryParse(value)?.toUtc();
      }
      if (value is DateTime) {
        return value.toUtc();
      }
      return null;
    }

    return _Announcement(
      slug: (json['slug'] as String?)?.trim() ?? 'announcement-${DateTime.now().millisecondsSinceEpoch}',
      title: (json['title'] as String?)?.trim() ?? 'Maintenance window',
      message: (json['message'] as String?)?.trim() ?? '',
      severity: (json['severity'] as String?)?.trim().toLowerCase() ?? 'info',
      status: (json['status'] as String?)?.trim().toLowerCase() ?? 'active',
      audiences: (json['audiences'] as List<dynamic>? ?? const [])
          .map((value) => '$value'.trim())
          .where((value) => value.isNotEmpty)
          .toList(),
      channels: (json['channels'] as List<dynamic>? ?? const [])
          .map((value) => '$value'.trim())
          .where((value) => value.isNotEmpty)
          .toList(),
      metadata: json['metadata'] is Map<String, dynamic>
          ? Map<String, dynamic>.from(json['metadata'] as Map)
          : <String, dynamic>{},
      startsAt: parseDate(json['startsAt']),
      endsAt: parseDate(json['endsAt']),
    );
  }
}
