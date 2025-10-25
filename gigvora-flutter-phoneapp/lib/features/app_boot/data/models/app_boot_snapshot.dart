import 'mobile_route_definition.dart';
import 'user_display_preferences.dart';

class AppBootSnapshot {
  const AppBootSnapshot({
    required this.routes,
    required this.deepLinkSegments,
    required this.preferences,
  });

  factory AppBootSnapshot.fromJson(Map<String, dynamic> json) {
    final routes = (json['routes'] as List?) ?? const <dynamic>[];
    final segments = (json['deepLinkSegments'] as List?) ?? const <dynamic>[];
    final preferencesJson = json['preferences'] as Map<String, dynamic>? ?? const <String, dynamic>{};
    return AppBootSnapshot(
      routes: routes
          .whereType<Map>()
          .map((value) => MobileRouteDefinition.fromJson(Map<String, dynamic>.from(value)))
          .toList(growable: false),
      deepLinkSegments: segments
          .map((segment) => '$segment'.trim())
          .where((segment) => segment.isNotEmpty)
          .toList(growable: false),
      preferences: UserDisplayPreferences.fromJson(preferencesJson),
    );
  }

  final List<MobileRouteDefinition> routes;
  final List<String> deepLinkSegments;
  final UserDisplayPreferences preferences;
}
