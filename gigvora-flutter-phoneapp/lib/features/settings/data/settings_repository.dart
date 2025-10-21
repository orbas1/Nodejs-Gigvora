import 'package:flutter/foundation.dart';
import 'package:gigvora_foundation/gigvora_foundation.dart';

import '../../../core/providers.dart';
import 'models/account_settings.dart';

class SettingsRepository {
  SettingsRepository(this._client, this._cache);

  final ApiClient _client;
  final OfflineCache _cache;

  static const _cacheKey = 'settings:account';

  Future<RepositoryResult<AccountSettings>> fetchSettings({bool forceRefresh = false}) async {
    final cached = _cache.read<AccountSettings>(_cacheKey, (raw) {
      if (raw is Map<String, dynamic>) {
        return AccountSettings.fromJson(raw);
      }
      if (raw is Map) {
        return AccountSettings.fromJson(Map<String, dynamic>.from(raw as Map));
      }
      return AccountSettings.demo();
    });

    if (!forceRefresh && cached != null) {
      return RepositoryResult<AccountSettings>(
        data: cached.value,
        fromCache: true,
        lastUpdated: cached.storedAt,
      );
    }

    try {
      final response = await _client.get('/settings/account');
      final accountSettings = response is Map<String, dynamic>
          ? AccountSettings.fromJson(response)
          : AccountSettings.demo();
      await _cache.write(
        _cacheKey,
        accountSettings.toJson(),
        ttl: const Duration(minutes: 15),
      );
      return RepositoryResult<AccountSettings>(
        data: accountSettings,
        fromCache: false,
        lastUpdated: DateTime.now(),
      );
    } catch (error, stackTrace) {
      debugPrint('Failed to fetch settings: $error');
      debugPrint('$stackTrace');
      if (cached != null) {
        return RepositoryResult<AccountSettings>(
          data: cached.value,
          fromCache: true,
          lastUpdated: cached.storedAt,
          error: error,
        );
      }
      rethrow;
    }
  }

  Future<AccountSettings> updateNotifications(NotificationPreferences preferences) async {
    final response = await _client.patch(
      '/settings/account/notifications',
      body: preferences.toJson(),
    );
    final updated = _materialise(response)?.copyWith(notifications: preferences) ??
        AccountSettings.demo().copyWith(notifications: preferences);
    await _persist(updated);
    return updated;
  }

  Future<AccountSettings> updatePrivacy(PrivacyPreferences preferences) async {
    final response = await _client.patch(
      '/settings/account/privacy',
      body: preferences.toJson(),
    );
    final updated = _materialise(response)?.copyWith(privacy: preferences) ??
        AccountSettings.demo().copyWith(privacy: preferences);
    await _persist(updated);
    return updated;
  }

  Future<AccountSettings> updateSecurity(SecurityPreferences preferences) async {
    final response = await _client.patch(
      '/settings/account/security',
      body: preferences.toJson(),
    );
    final updated = _materialise(response)?.copyWith(security: preferences) ??
        AccountSettings.demo().copyWith(security: preferences);
    await _persist(updated);
    return updated;
  }

  Future<AccountSettings> updateWorkspace(WorkspacePreferences preferences) async {
    final response = await _client.patch(
      '/settings/account/workspace',
      body: preferences.toJson(),
    );
    final updated = _materialise(response)?.copyWith(workspace: preferences) ??
        AccountSettings.demo().copyWith(workspace: preferences);
    await _persist(updated);
    return updated;
  }

  AccountSettings? _materialise(dynamic payload) {
    if (payload is Map<String, dynamic>) {
      return AccountSettings.fromJson(payload);
    }
    if (payload is Map) {
      return AccountSettings.fromJson(Map<String, dynamic>.from(payload as Map));
    }
    return null;
  }

  Future<void> _persist(AccountSettings settings) {
    return _cache.write(
      _cacheKey,
      settings.toJson(),
      ttl: const Duration(minutes: 15),
    );
  }
}

final settingsRepositoryProvider = Provider<SettingsRepository>((ref) {
  final client = ref.watch(apiClientProvider);
  final cache = ref.watch(offlineCacheProvider);
  return SettingsRepository(client, cache);
});
