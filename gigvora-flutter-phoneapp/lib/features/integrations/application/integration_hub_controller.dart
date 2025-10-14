import 'dart:convert';

import 'package:crypto/crypto.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gigvora_foundation/gigvora_foundation.dart';

import '../../../core/providers.dart';
import '../data/integration_repository.dart';
import '../data/models/integration_models.dart';

class IntegrationHubController extends StateNotifier<ResourceState<IntegrationHubOverview>> {
  IntegrationHubController(this._repository, this._analytics)
      : super(ResourceState<IntegrationHubOverview>.loading()) {
    load();
  }

  final IntegrationRepository _repository;
  final AnalyticsService _analytics;
  bool _viewTracked = false;

  Future<void> load({bool forceRefresh = false}) async {
    state = state.copyWith(loading: true, error: null);
    try {
      final result = await _repository.fetchOverview(forceRefresh: forceRefresh);
      state = ResourceState<IntegrationHubOverview>(
        data: result.data,
        loading: false,
        error: result.error,
        fromCache: result.fromCache,
        lastUpdated: result.lastUpdated,
      );

      if (!_viewTracked && !result.data.isEmpty) {
        _viewTracked = true;
        final summary = result.data.summary;
        await _analytics.track(
          'mobile_company_integrations_viewed',
          context: {
            'connectors': summary.total,
            'connected': summary.connected,
            'openIncidents': summary.openIncidents,
            'fromCache': result.fromCache,
          },
          metadata: const {'source': 'mobile_app'},
        );
      }

      if (result.error != null) {
        await _analytics.track(
          'mobile_company_integrations_partial',
          context: {
            'reason': '${result.error}',
            'fromCache': result.fromCache,
          },
          metadata: const {'source': 'mobile_app'},
        );
      }
    } catch (error) {
      state = state.copyWith(loading: false, error: error);
      await _analytics.track(
        'mobile_company_integrations_failed',
        context: {'reason': '$error'},
        metadata: const {'source': 'mobile_app'},
      );
    }
  }

  Future<void> refresh() => load(forceRefresh: true);

  Future<void> toggleConnector(String key, IntegrationStatus status) async {
    final current = state.data ?? IntegrationHubOverview.empty();
    final categories = current.categories
        .map(
          (category) => category.copyWith(
            connectors: category.connectors
                .map(
                  (connector) => connector.key == key
                      ? connector.copyWith(
                          status: status,
                          connectedAt: status == IntegrationStatus.connected ? DateTime.now() : null,
                          lastSyncedAt: status == IntegrationStatus.connected ? DateTime.now() : null,
                        )
                      : connector,
                )
                .toList(growable: false),
          ),
        )
        .toList(growable: false);

    final updated = current.copyWith(categories: categories, lastSyncedAt: DateTime.now());
    state = state.copyWith(data: updated);
    await _repository.persistOverview(updated);
    await _analytics.track(
      'mobile_integration_toggle',
      context: {
        'connector': key,
        'status': integrationStatusToString(status),
      },
      metadata: const {'source': 'mobile_app'},
    );
  }

  Future<void> resolveIncident(String connectorKey, String incidentId) async {
    final current = state.data ?? IntegrationHubOverview.empty();
    final categories = current.categories
        .map((category) => category.copyWith(
              connectors: category.connectors
                  .map((connector) => connector.key == connectorKey
                      ? connector.copyWith(
                          incidents: connector.incidents
                              .map((incident) => incident.id == incidentId ? incident.close() : incident)
                              .toList(growable: false),
                        )
                      : connector)
                  .toList(growable: false),
            ))
        .toList(growable: false);
    final updated = current.copyWith(categories: categories, lastSyncedAt: DateTime.now());
    state = state.copyWith(data: updated);
    await _repository.persistOverview(updated);
    await _analytics.track(
      'mobile_integration_incident_resolved',
      context: {
        'connector': connectorKey,
        'incident': incidentId,
      },
      metadata: const {'source': 'mobile_app'},
    );
  }

  Future<void> rotateApiKey(String connectorKey, String? secret, {String actor = 'mobile_user'}) async {
    final fingerprint = _fingerprint(secret);
    final current = state.data ?? IntegrationHubOverview.empty();
    final categories = current.categories
        .map((category) => category.copyWith(
              connectors: category.connectors
                  .map((connector) => connector.key == connectorKey
                      ? connector.copyWith(
                          status: fingerprint != null ? IntegrationStatus.connected : IntegrationStatus.actionRequired,
                          apiKeyFingerprint: fingerprint,
                          lastSyncedAt: fingerprint != null ? DateTime.now() : connector.lastSyncedAt,
                          connectedAt: fingerprint != null ? DateTime.now() : connector.connectedAt,
                        )
                      : connector)
                  .toList(growable: false),
            ))
        .toList(growable: false);
    final updated = current.copyWith(
      categories: categories,
      lastSyncedAt: DateTime.now(),
      auditLog: [
        IntegrationAuditEvent(
          id: 'audit-$connectorKey-${DateTime.now().millisecondsSinceEpoch}',
          connector: connectorKey,
          action: fingerprint != null ? 'api_key_rotated' : 'api_key_cleared',
          actor: actor,
          createdAt: DateTime.now(),
          context: fingerprint != null
              ? 'BYOK credential rotated via mobile command center.'
              : 'API key removed pending replacement.',
        ),
        ...current.auditLog,
      ],
    );
    state = state.copyWith(data: updated);
    await _repository.persistOverview(updated);
    await _analytics.track(
      'mobile_integration_key_rotated',
      context: {
        'connector': connectorKey,
        'fingerprint': fingerprint ?? 'cleared',
      },
      metadata: const {'source': 'mobile_app'},
    );
  }

  Future<void> appendAudit(IntegrationAuditEvent event) async {
    final current = state.data ?? IntegrationHubOverview.empty();
    final updated = current.copyWith(
      auditLog: [event, ...current.auditLog].take(25).toList(growable: false),
    );
    state = state.copyWith(data: updated);
    await _repository.persistOverview(updated);
  }

  String? _fingerprint(String? secret) {
    if (secret == null || secret.trim().isEmpty) {
      return null;
    }
    final bytes = utf8.encode(secret.trim());
    final digest = sha256.convert(bytes).toString();
    return '****-${digest.substring(digest.length - 8)}';
  }
}

final integrationRepositoryProvider = Provider<IntegrationRepository>((ref) {
  final cache = ref.watch(offlineCacheProvider);
  return IntegrationRepository(cache);
});

final integrationHubControllerProvider =
    StateNotifierProvider<IntegrationHubController, ResourceState<IntegrationHubOverview>>((ref) {
  final repository = ref.watch(integrationRepositoryProvider);
  final analytics = ref.watch(analyticsServiceProvider);
  return IntegrationHubController(repository, analytics);
});
