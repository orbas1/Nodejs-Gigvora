import 'package:flutter_test/flutter_test.dart';
import 'package:gigvora_foundation/gigvora_foundation.dart';
import 'package:gigvora_mobile/features/settings/application/settings_controller.dart';
import 'package:gigvora_mobile/features/settings/data/models/account_settings.dart';
import 'package:gigvora_mobile/features/settings/data/settings_repository.dart';

import '../helpers/in_memory_offline_cache.dart';
import '../support/test_analytics_service.dart';
import '../support/test_api_client.dart';

typedef _FetchCallback = Future<RepositoryResult<AccountSettings>> Function(bool forceRefresh);

typedef _NotificationCallback = Future<AccountSettings> Function(NotificationPreferences preferences);
typedef _PrivacyCallback = Future<AccountSettings> Function(PrivacyPreferences preferences);
typedef _SecurityCallback = Future<AccountSettings> Function(SecurityPreferences preferences);
typedef _WorkspaceCallback = Future<AccountSettings> Function(WorkspacePreferences preferences);

class _StubSettingsRepository extends SettingsRepository {
  _StubSettingsRepository({
    required this.onFetch,
    this.onUpdateNotifications,
    this.onUpdatePrivacy,
    this.onUpdateSecurity,
    this.onUpdateWorkspace,
  }) : super(TestApiClient(), InMemoryOfflineCache());

  final _FetchCallback onFetch;
  final _NotificationCallback? onUpdateNotifications;
  final _PrivacyCallback? onUpdatePrivacy;
  final _SecurityCallback? onUpdateSecurity;
  final _WorkspaceCallback? onUpdateWorkspace;

  bool? lastForceRefresh;
  int fetchCallCount = 0;

  @override
  Future<RepositoryResult<AccountSettings>> fetchSettings({bool forceRefresh = false}) {
    fetchCallCount += 1;
    lastForceRefresh = forceRefresh;
    return onFetch(forceRefresh);
  }

  @override
  Future<AccountSettings> updateNotifications(NotificationPreferences preferences) {
    if (onUpdateNotifications == null) {
      throw UnimplementedError('updateNotifications not stubbed');
    }
    return onUpdateNotifications!(preferences);
  }

  @override
  Future<AccountSettings> updatePrivacy(PrivacyPreferences preferences) {
    if (onUpdatePrivacy == null) {
      throw UnimplementedError('updatePrivacy not stubbed');
    }
    return onUpdatePrivacy!(preferences);
  }

  @override
  Future<AccountSettings> updateSecurity(SecurityPreferences preferences) {
    if (onUpdateSecurity == null) {
      throw UnimplementedError('updateSecurity not stubbed');
    }
    return onUpdateSecurity!(preferences);
  }

  @override
  Future<AccountSettings> updateWorkspace(WorkspacePreferences preferences) {
    if (onUpdateWorkspace == null) {
      throw UnimplementedError('updateWorkspace not stubbed');
    }
    return onUpdateWorkspace!(preferences);
  }
}

AccountSettings _buildSettings() {
  return AccountSettings(
    notifications: const NotificationPreferences(weeklyReportDay: 'monday'),
    privacy: const PrivacyPreferences(profileDiscoverable: true, allowDirectMessages: true),
    security: const SecurityPreferences(twoFactorEnabled: true, biometricUnlock: false),
    workspace: const WorkspacePreferences(timezone: 'UTC', defaultLandingRoute: '/home'),
    updatedAt: DateTime(2024, 1, 1, 8),
  );
}

void main() {
  group('SettingsController', () {
    test('load hydrates account settings state', () async {
      final repository = _StubSettingsRepository(
        onFetch: (_) async => RepositoryResult(
          data: _buildSettings(),
          fromCache: false,
          lastUpdated: DateTime(2024, 1, 1, 10),
        ),
      );
      final analytics = TestAnalyticsService();
      final controller = SettingsController(repository, analytics);

      await controller.load(forceRefresh: true);

      expect(controller.state.data?.notifications.weeklyReportDay, equals('monday'));
      expect(controller.state.loading, isFalse);
      expect(controller.state.error, isNull);
    });

    test('updateNotifications persists changes and emits analytics event', () async {
      final updatedPrefs = const NotificationPreferences(
        pushAnnouncements: false,
        emailDigests: false,
        smsEscalations: true,
        weeklyReportDay: 'wednesday',
      );
      final repository = _StubSettingsRepository(
        onFetch: (_) async => RepositoryResult(
          data: _buildSettings(),
          fromCache: false,
          lastUpdated: DateTime(2024, 1, 1, 10),
        ),
        onUpdateNotifications: (preferences) async {
          expect(preferences, equals(updatedPrefs));
          return _buildSettings().copyWith(notifications: preferences);
        },
        onUpdatePrivacy: (prefs) async => _buildSettings().copyWith(privacy: prefs),
        onUpdateSecurity: (prefs) async => _buildSettings().copyWith(security: prefs),
        onUpdateWorkspace: (prefs) async => _buildSettings().copyWith(workspace: prefs),
      );
      final analytics = TestAnalyticsService();
      final controller = SettingsController(repository, analytics);
      await controller.load(forceRefresh: true);

      await controller.updateNotifications(updatedPrefs);

      expect(controller.state.data?.notifications, equals(updatedPrefs));
      expect(
        analytics.events.last.name,
        equals('mobile_settings_updated'),
      );
      expect(analytics.events.last.context['section'], equals('notifications'));
    });

    test('updateSecurity rolls back optimistic change when repository throws', () async {
      final repository = _StubSettingsRepository(
        onFetch: (_) async => RepositoryResult(
          data: _buildSettings(),
          fromCache: false,
          lastUpdated: DateTime(2024, 1, 1, 10),
        ),
        onUpdateNotifications: (prefs) async => _buildSettings().copyWith(notifications: prefs),
        onUpdatePrivacy: (prefs) async => _buildSettings().copyWith(privacy: prefs),
        onUpdateSecurity: (prefs) async {
          throw Exception('policy violation');
        },
        onUpdateWorkspace: (prefs) async => _buildSettings().copyWith(workspace: prefs),
      );
      final analytics = TestAnalyticsService();
      final controller = SettingsController(repository, analytics);
      await controller.load(forceRefresh: true);
      final original = controller.state.data!.security;

      await controller.updateSecurity(const SecurityPreferences(twoFactorEnabled: false));

      expect(controller.state.data?.security, equals(original));
      expect(controller.state.error, isNotNull);
    });

    test('refresh triggers a forced repository fetch', () async {
      final repository = _StubSettingsRepository(
        onFetch: (forceRefresh) async => RepositoryResult(
          data: _buildSettings(),
          fromCache: forceRefresh,
          lastUpdated: DateTime(2024, 1, 1, 10),
        ),
        onUpdateNotifications: (prefs) async => _buildSettings().copyWith(notifications: prefs),
        onUpdatePrivacy: (prefs) async => _buildSettings().copyWith(privacy: prefs),
        onUpdateSecurity: (prefs) async => _buildSettings().copyWith(security: prefs),
        onUpdateWorkspace: (prefs) async => _buildSettings().copyWith(workspace: prefs),
      );
      final analytics = TestAnalyticsService();
      final controller = SettingsController(repository, analytics);

      await controller.refresh();

      expect(repository.lastForceRefresh, isTrue);
      expect(controller.state.data, isNotNull);
    });
  });
}
