import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gigvora_foundation/gigvora_foundation.dart';

import '../../../core/providers.dart';
import '../data/models/security_telemetry.dart';
import '../data/security_repository.dart';

class SecurityController extends StateNotifier<ResourceState<SecurityTelemetry>> {
  SecurityController(this._repository, this._analytics)
      : super(ResourceState<SecurityTelemetry>.loading()) {
    load();
  }

  final SecurityRepository _repository;
  final AnalyticsService _analytics;
  bool _viewTracked = false;

  Future<void> load({bool forceRefresh = false}) async {
    state = state.copyWith(loading: true, error: null);
    try {
      final result = await _repository.fetchTelemetry(forceRefresh: forceRefresh);
      state = ResourceState<SecurityTelemetry>(
        data: result.data,
        loading: false,
        error: result.error,
        fromCache: result.fromCache,
        lastUpdated: result.lastUpdated,
      );

      if (!_viewTracked && !result.data.isEmpty) {
        _viewTracked = true;
        await _analytics.track(
          'mobile_security_operations_viewed',
          context: {
            'alerts': result.data.alerts.length,
            'incidents': result.data.incidents.length,
            'playbooks': result.data.playbooks.length,
            'fromCache': result.fromCache,
          },
          metadata: const {'surface': 'mobile_app'},
        );
      }

      if (result.error != null) {
        await _analytics.track(
          'mobile_security_operations_partial',
          context: {
            'reason': '${result.error}',
            'fromCache': result.fromCache,
          },
          metadata: const {'surface': 'mobile_app'},
        );
      }
    } catch (error) {
      state = state.copyWith(loading: false, error: error);
      await _analytics.track(
        'mobile_security_operations_failed',
        context: {
          'reason': '$error',
        },
        metadata: const {'surface': 'mobile_app'},
      );
    }
  }

  Future<void> refresh() => load(forceRefresh: true);

  Future<void> acknowledgeAlert(SecurityAlert alert) {
    return _analytics.track(
      'mobile_security_alert_acknowledged',
      context: {
        'alertId': alert.id,
        'severity': alert.severity,
        'source': alert.source,
      },
      metadata: const {'surface': 'mobile_app'},
    );
  }

  Future<void> suppressAlert(SecurityAlert alert) {
    return _analytics.track(
      'mobile_security_alert_suppressed',
      context: {
        'alertId': alert.id,
        'severity': alert.severity,
        'source': alert.source,
      },
      metadata: const {'surface': 'mobile_app'},
    );
  }

  Future<void> triggerThreatSweep({String scope = 'all'}) {
    return _analytics.track(
      'mobile_security_threat_sweep',
      context: {
        'scope': scope,
      },
      metadata: const {'surface': 'mobile_app'},
    );
  }
}

final securityRepositoryProvider = Provider<SecurityRepository>((ref) {
  final cache = ref.watch(offlineCacheProvider);
  return SecurityRepository(cache);
});

final securityControllerProvider =
    StateNotifierProvider<SecurityController, ResourceState<SecurityTelemetry>>((ref) {
  final repository = ref.watch(securityRepositoryProvider);
  final analytics = ref.watch(analyticsServiceProvider);
  return SecurityController(repository, analytics);
});
