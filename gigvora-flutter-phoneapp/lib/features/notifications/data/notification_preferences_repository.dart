import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gigvora_foundation/gigvora_foundation.dart';

import '../../core/providers.dart';

class NotificationPreferenceSnapshot {
  const NotificationPreferenceSnapshot({
    required this.emailEnabled,
    required this.pushEnabled,
    required this.smsEnabled,
    required this.inAppEnabled,
    required this.digestFrequency,
    this.quietHoursStart,
    this.quietHoursEnd,
  });

  factory NotificationPreferenceSnapshot.fromJson(Map<String, dynamic> json) {
    return NotificationPreferenceSnapshot(
      emailEnabled: json['emailEnabled'] != false,
      pushEnabled: json['pushEnabled'] != false,
      smsEnabled: json['smsEnabled'] == true,
      inAppEnabled: json['inAppEnabled'] != false,
      digestFrequency: (json['digestFrequency'] as String? ?? 'daily').trim(),
      quietHoursStart: (json['quietHoursStart'] as String?)?.trim().isNotEmpty == true
          ? (json['quietHoursStart'] as String).trim()
          : null,
      quietHoursEnd: (json['quietHoursEnd'] as String?)?.trim().isNotEmpty == true
          ? (json['quietHoursEnd'] as String).trim()
          : null,
    );
  }

  final bool emailEnabled;
  final bool pushEnabled;
  final bool smsEnabled;
  final bool inAppEnabled;
  final String digestFrequency;
  final String? quietHoursStart;
  final String? quietHoursEnd;

  Map<String, dynamic> toJson() {
    return {
      'emailEnabled': emailEnabled,
      'pushEnabled': pushEnabled,
      'smsEnabled': smsEnabled,
      'inAppEnabled': inAppEnabled,
      'digestFrequency': digestFrequency,
      'quietHoursStart': quietHoursStart,
      'quietHoursEnd': quietHoursEnd,
    };
  }

  NotificationPreferenceSnapshot copyWith({
    bool? emailEnabled,
    bool? pushEnabled,
    bool? smsEnabled,
    bool? inAppEnabled,
    String? digestFrequency,
    String? quietHoursStart,
    String? quietHoursEnd,
  }) {
    return NotificationPreferenceSnapshot(
      emailEnabled: emailEnabled ?? this.emailEnabled,
      pushEnabled: pushEnabled ?? this.pushEnabled,
      smsEnabled: smsEnabled ?? this.smsEnabled,
      inAppEnabled: inAppEnabled ?? this.inAppEnabled,
      digestFrequency: digestFrequency ?? this.digestFrequency,
      quietHoursStart: quietHoursStart ?? this.quietHoursStart,
      quietHoursEnd: quietHoursEnd ?? this.quietHoursEnd,
    );
  }
}

class NotificationPreferencesRepository {
  NotificationPreferencesRepository(this._apiClient);

  final ApiClient _apiClient;

  Future<NotificationPreferenceSnapshot> fetchPreferences({required int userId}) async {
    final response = await _apiClient.get('/users/$userId/notifications/preferences');
    return NotificationPreferenceSnapshot.fromJson(_asJsonMap(response));
  }

  Future<NotificationPreferenceSnapshot> updatePreferences({
    required int userId,
    required Map<String, dynamic> patch,
  }) async {
    final response = await _apiClient.patch('/users/$userId/notifications/preferences', body: patch);
    final body = _asJsonMap(response);
    final preferences = body['preferences'];
    if (preferences != null) {
      return NotificationPreferenceSnapshot.fromJson(_asJsonMap(preferences));
    }
    return NotificationPreferenceSnapshot.fromJson(body);
  }

  Map<String, dynamic> _asJsonMap(dynamic payload) {
    if (payload is Map<String, dynamic>) {
      return payload;
    }
    if (payload is Map) {
      return Map<String, dynamic>.from(payload as Map);
    }
    throw StateError('Unexpected notification preferences payload: ${payload.runtimeType}');
  }
}

final notificationPreferencesRepositoryProvider = Provider<NotificationPreferencesRepository>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return NotificationPreferencesRepository(apiClient);
});
