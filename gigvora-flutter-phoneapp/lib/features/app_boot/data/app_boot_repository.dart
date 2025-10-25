import 'dart:async';

import 'package:flutter/material.dart';
import 'package:gigvora_foundation/gigvora_foundation.dart';

import 'models/app_boot_snapshot.dart';
import 'models/user_display_preferences.dart';

class AppDisplayPreferencePatch {
  AppDisplayPreferencePatch({
    this.themeMode,
    this.locale,
    this.startRouteId,
    this.lastVisitedRouteId,
    this.tokensVersion,
    this.metadata,
  });

  final ThemeMode? themeMode;
  final String? locale;
  final String? startRouteId;
  final String? lastVisitedRouteId;
  final String? tokensVersion;
  final Map<String, dynamic>? metadata;

  Map<String, dynamic> toJson() {
    final payload = <String, dynamic>{};
    if (themeMode != null) {
      payload['themeMode'] = themeMode!.name;
    }
    if (locale != null && locale!.trim().isNotEmpty) {
      payload['locale'] = locale;
    }
    if (startRouteId != null && startRouteId!.trim().isNotEmpty) {
      payload['startRouteId'] = startRouteId;
    }
    if (lastVisitedRouteId != null && lastVisitedRouteId!.trim().isNotEmpty) {
      payload['lastVisitedRouteId'] = lastVisitedRouteId;
    }
    if (tokensVersion != null && tokensVersion!.trim().isNotEmpty) {
      payload['tokensVersion'] = tokensVersion;
    }
    if (metadata != null && metadata!.isNotEmpty) {
      payload['metadata'] = metadata;
    }
    return payload;
  }

  bool get isEmpty => toJson().isEmpty;
}

class AppBootRepository {
  AppBootRepository({ApiClient? apiClient})
      : _apiClient = apiClient ?? ServiceLocator.read<ApiClient>();

  final ApiClient _apiClient;

  Future<AppBootSnapshot> fetchSnapshot({bool syncRegistry = false}) async {
    final response = await _apiClient.get(
      '/mobile/app-boot',
      query: syncRegistry ? const {'sync': 'true'} : null,
    );
    if (response is Map<String, dynamic>) {
      return AppBootSnapshot.fromJson(response);
    }
    if (response is Map) {
      return AppBootSnapshot.fromJson(Map<String, dynamic>.from(response));
    }
    throw ApiException(500, 'Unexpected response when loading app boot snapshot', response);
  }

  Future<UserDisplayPreferences> updateDisplayPreferences(AppDisplayPreferencePatch patch) async {
    final payload = patch.toJson();
    if (payload.isEmpty) {
      throw ArgumentError('Display preference patch cannot be empty.');
    }

    final response = await _apiClient.put('/mobile/app-boot/preferences', body: payload);
    return _mapPreferenceResponse(response);
  }

  Future<UserDisplayPreferences> updateLastVisitedRoute(String routeId) async {
    final trimmed = routeId.trim();
    if (trimmed.isEmpty) {
      throw ArgumentError('routeId cannot be empty.');
    }

    final response = await _apiClient.patch(
      '/mobile/app-boot/last-route',
      body: {'routeId': trimmed},
    );
    return _mapPreferenceResponse(response);
  }

  UserDisplayPreferences _mapPreferenceResponse(dynamic response) {
    if (response is Map<String, dynamic>) {
      final payload = response['preferences'];
      if (payload is Map<String, dynamic>) {
        return UserDisplayPreferences.fromJson(payload);
      }
      if (payload is Map) {
        return UserDisplayPreferences.fromJson(Map<String, dynamic>.from(payload));
      }
    }
    if (response is Map) {
      final mapResponse = Map<String, dynamic>.from(response);
      final payload = mapResponse['preferences'];
      if (payload is Map<String, dynamic>) {
        return UserDisplayPreferences.fromJson(payload);
      }
      if (payload is Map) {
        return UserDisplayPreferences.fromJson(Map<String, dynamic>.from(payload));
      }
    }
    throw ApiException(500, 'Unexpected response when updating display preferences', response);
  }
}
