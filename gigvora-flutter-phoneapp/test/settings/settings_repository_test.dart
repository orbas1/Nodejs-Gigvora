import 'package:flutter_test/flutter_test.dart';
import 'package:gigvora_mobile/features/settings/data/models/account_settings.dart';
import 'package:gigvora_mobile/features/settings/data/settings_repository.dart';

import '../helpers/in_memory_offline_cache.dart';
import '../support/test_api_client.dart';

AccountSettings _createSettings() {
  return AccountSettings(
    notifications: const NotificationPreferences(
      pushAnnouncements: false,
      emailDigests: true,
      smsEscalations: true,
      weeklyReportDay: 'tuesday',
    ),
    security: const SecurityPreferences(twoFactorEnabled: true, biometricUnlock: true, sessionTimeoutMinutes: 15),
    privacy: const PrivacyPreferences(profileDiscoverable: false, showAvailability: true, shareEngagementMetrics: false),
    workspace: const WorkspacePreferences(timezone: 'Europe/London', defaultLandingRoute: '/dashboard'),
    updatedAt: DateTime(2024, 1, 1, 9),
  );
}

Map<String, dynamic> _serialize(AccountSettings settings) => settings.toJson();

void main() {
  group('SettingsRepository', () {
    test('returns cached settings when available', () async {
      final cache = InMemoryOfflineCache();
      final apiClient = TestApiClient(onGet: (_) async => const <String, dynamic>{});
      final repository = SettingsRepository(apiClient, cache);
      final settings = _createSettings();
      await cache.write('settings:account', _serialize(settings));

      final result = await repository.fetchSettings();

      expect(result.fromCache, isTrue);
      expect(result.data.notifications.weeklyReportDay, equals('tuesday'));
      expect(result.data.security.biometricUnlock, isTrue);
    });

    test('hydrates from remote source and caches response', () async {
      final cache = InMemoryOfflineCache();
      late Map<String, dynamic> requestedQuery;
      final response = _serialize(_createSettings().copyWith(
        notifications: const NotificationPreferences(weeklyReportDay: 'friday'),
      ));
      final apiClient = TestApiClient(onGet: (path) async {
        expect(path, equals('/settings/account'));
        requestedQuery = const <String, dynamic>{};
        return response;
      });
      final repository = SettingsRepository(apiClient, cache);

      final result = await repository.fetchSettings(forceRefresh: true);

      expect(result.fromCache, isFalse);
      expect(result.data.notifications.weeklyReportDay, equals('friday'));
      final cached = cache.read<AccountSettings>('settings:account', (raw) {
        return AccountSettings.fromJson(Map<String, dynamic>.from(raw as Map));
      });
      expect(cached?.value.notifications.weeklyReportDay, equals('friday'));
      expect(requestedQuery, isEmpty);
    });

    test('falls back to cache when remote fetch fails', () async {
      final cache = InMemoryOfflineCache();
      final settings = _createSettings();
      await cache.write('settings:account', _serialize(settings));
      final apiClient = TestApiClient(onGet: (_) async {
        throw Exception('unreachable');
      });
      final repository = SettingsRepository(apiClient, cache);

      final result = await repository.fetchSettings(forceRefresh: true);

      expect(result.fromCache, isTrue);
      expect(result.error, isNotNull);
      expect(result.data.notifications.pushAnnouncements, isFalse);
    });

    test('updateNotifications persists preferences and caches new state', () async {
      final cache = InMemoryOfflineCache();
      Map<String, dynamic>? capturedBody;
      final preferences = const NotificationPreferences(
        pushAnnouncements: false,
        emailDigests: false,
        smsEscalations: true,
        weeklyReportDay: 'thursday',
      );
      final apiClient = TestApiClient(
        onPatch: (path, body) async {
          expect(path, equals('/settings/account/notifications'));
          capturedBody = Map<String, dynamic>.from(body as Map);
          return {
            'notifications': preferences.toJson(),
            'security': const SecurityPreferences().toJson(),
            'privacy': const PrivacyPreferences().toJson(),
            'workspace': const WorkspacePreferences().toJson(),
          };
        },
        onGet: (_) async => const <String, dynamic>{},
      );
      final repository = SettingsRepository(apiClient, cache);

      final updated = await repository.updateNotifications(preferences);

      expect(capturedBody, equals(preferences.toJson()));
      expect(updated.notifications, equals(preferences));
      final cached = cache.read<AccountSettings>('settings:account', (raw) {
        return AccountSettings.fromJson(Map<String, dynamic>.from(raw as Map));
      });
      expect(cached?.value.notifications.weeklyReportDay, equals('thursday'));
    });

    test('updatePrivacy sends patch request and stores persisted value', () async {
      final cache = InMemoryOfflineCache();
      Map<String, dynamic>? capturedBody;
      final preferences = const PrivacyPreferences(
        profileDiscoverable: false,
        showAvailability: false,
        shareEngagementMetrics: true,
        allowDirectMessages: false,
      );
      final apiClient = TestApiClient(
        onPatch: (path, body) async {
          expect(path, equals('/settings/account/privacy'));
          capturedBody = Map<String, dynamic>.from(body as Map);
          return {
            'privacy': preferences.toJson(),
            'notifications': const NotificationPreferences().toJson(),
            'security': const SecurityPreferences().toJson(),
            'workspace': const WorkspacePreferences().toJson(),
          };
        },
      );
      final repository = SettingsRepository(apiClient, cache);

      final updated = await repository.updatePrivacy(preferences);

      expect(capturedBody, equals(preferences.toJson()));
      expect(updated.privacy, equals(preferences));
      final cached = cache.read<AccountSettings>('settings:account', (raw) {
        return AccountSettings.fromJson(Map<String, dynamic>.from(raw as Map));
      });
      expect(cached?.value.privacy.allowDirectMessages, isFalse);
    });

    test('updateSecurity persists security preferences to cache', () async {
      final cache = InMemoryOfflineCache();
      Map<String, dynamic>? capturedBody;
      final preferences = const SecurityPreferences(
        twoFactorEnabled: true,
        biometricUnlock: true,
        sessionTimeoutMinutes: 12,
        loginAlerts: false,
      );
      final apiClient = TestApiClient(
        onPatch: (path, body) async {
          expect(path, equals('/settings/account/security'));
          capturedBody = Map<String, dynamic>.from(body as Map);
          return {
            'security': preferences.toJson(),
            'notifications': const NotificationPreferences().toJson(),
            'privacy': const PrivacyPreferences().toJson(),
            'workspace': const WorkspacePreferences().toJson(),
          };
        },
      );
      final repository = SettingsRepository(apiClient, cache);

      final updated = await repository.updateSecurity(preferences);

      expect(capturedBody, equals(preferences.toJson()));
      expect(updated.security, equals(preferences));
      final cached = cache.read<AccountSettings>('settings:account', (raw) {
        return AccountSettings.fromJson(Map<String, dynamic>.from(raw as Map));
      });
      expect(cached?.value.security.sessionTimeoutMinutes, equals(12));
    });

    test('updateWorkspace writes workspace preferences to cache', () async {
      final cache = InMemoryOfflineCache();
      Map<String, dynamic>? capturedBody;
      final preferences = const WorkspacePreferences(
        timezone: 'Asia/Singapore',
        defaultLandingRoute: '/calendar',
        autoSyncCalendar: false,
        theme: 'slate',
      );
      final apiClient = TestApiClient(
        onPatch: (path, body) async {
          expect(path, equals('/settings/account/workspace'));
          capturedBody = Map<String, dynamic>.from(body as Map);
          return {
            'workspace': preferences.toJson(),
            'notifications': const NotificationPreferences().toJson(),
            'privacy': const PrivacyPreferences().toJson(),
            'security': const SecurityPreferences().toJson(),
          };
        },
      );
      final repository = SettingsRepository(apiClient, cache);

      final updated = await repository.updateWorkspace(preferences);

      expect(capturedBody, equals(preferences.toJson()));
      expect(updated.workspace, equals(preferences));
      final cached = cache.read<AccountSettings>('settings:account', (raw) {
        return AccountSettings.fromJson(Map<String, dynamic>.from(raw as Map));
      });
      expect(cached?.value.workspace.timezone, equals('Asia/Singapore'));
      expect(cached?.value.workspace.autoSyncCalendar, isFalse);
    });
  });
}
