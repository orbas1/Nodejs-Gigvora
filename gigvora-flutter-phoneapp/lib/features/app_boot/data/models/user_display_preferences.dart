import 'package:flutter/material.dart';

class UserDisplayPreferences {
  const UserDisplayPreferences({
    required this.userId,
    required this.themeMode,
    required this.locale,
    required this.startRouteId,
    required this.lastVisitedRouteId,
    required this.tokensVersion,
    required this.metadata,
    required this.deepLinkSegments,
    required this.createdAt,
    required this.updatedAt,
  });

  factory UserDisplayPreferences.fromJson(Map<String, dynamic> json) {
    return UserDisplayPreferences(
      userId: _parseInt(json['userId']),
      themeMode: _parseThemeMode(json['themeMode']),
      locale: '${json['locale'] ?? 'en'}',
      startRouteId: '${json['startRouteId'] ?? ''}',
      lastVisitedRouteId: _parseOptionalString(json['lastVisitedRouteId']),
      tokensVersion: _parseOptionalString(json['tokensVersion']),
      metadata: _parseMetadata(json['metadata']),
      deepLinkSegments: _parseDeepLinkSegments(json['deepLinkSegments']),
      createdAt: _parseDate(json['createdAt']),
      updatedAt: _parseDate(json['updatedAt']),
    );
  }

  final int? userId;
  final ThemeMode themeMode;
  final String locale;
  final String startRouteId;
  final String? lastVisitedRouteId;
  final String? tokensVersion;
  final Map<String, dynamic> metadata;
  final List<String> deepLinkSegments;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  UserDisplayPreferences copyWith({
    ThemeMode? themeMode,
    String? locale,
    String? startRouteId,
    String? lastVisitedRouteId,
    String? tokensVersion,
    Map<String, dynamic>? metadata,
    List<String>? deepLinkSegments,
  }) {
    return UserDisplayPreferences(
      userId: userId,
      themeMode: themeMode ?? this.themeMode,
      locale: locale ?? this.locale,
      startRouteId: startRouteId ?? this.startRouteId,
      lastVisitedRouteId: lastVisitedRouteId ?? this.lastVisitedRouteId,
      tokensVersion: tokensVersion ?? this.tokensVersion,
      metadata: metadata ?? this.metadata,
      deepLinkSegments: deepLinkSegments ?? this.deepLinkSegments,
      createdAt: createdAt,
      updatedAt: updatedAt,
    );
  }

  static ThemeMode _parseThemeMode(dynamic value) {
    final normalised = '${value ?? 'system'}'.trim().toLowerCase();
    switch (normalised) {
      case 'light':
        return ThemeMode.light;
      case 'dark':
        return ThemeMode.dark;
      case 'system':
      default:
        return ThemeMode.system;
    }
  }

  static int? _parseInt(dynamic value) {
    if (value is int) {
      return value;
    }
    if (value is String) {
      return int.tryParse(value);
    }
    return null;
  }

  static String? _parseOptionalString(dynamic value) {
    if (value == null) {
      return null;
    }
    final resolved = '$value'.trim();
    return resolved.isEmpty ? null : resolved;
  }

  static Map<String, dynamic> _parseMetadata(dynamic value) {
    if (value is Map<String, dynamic>) {
      return Map<String, dynamic>.from(value);
    }
    if (value is Map) {
      return Map<String, dynamic>.fromEntries(
        value.entries
            .whereType<MapEntry<dynamic, dynamic>>()
            .map((entry) => MapEntry('${entry.key}', entry.value)),
      );
    }
    return const <String, dynamic>{};
  }

  static List<String> _parseDeepLinkSegments(dynamic value) {
    if (value is List) {
      return value
          .map((segment) => '$segment'.trim())
          .where((segment) => segment.isNotEmpty)
          .toList(growable: false);
    }
    return const <String>[];
  }

  static DateTime? _parseDate(dynamic value) {
    if (value is DateTime) {
      return value;
    }
    if (value is String && value.isNotEmpty) {
      return DateTime.tryParse(value);
    }
    return null;
  }
}
