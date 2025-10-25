import 'package:collection/collection.dart';

class MobileRouteDefinition {
  const MobileRouteDefinition({
    required this.routeId,
    required this.name,
    required this.path,
    required this.allowDeepLink,
    required this.requiresAuth,
    required this.metadata,
  });

  factory MobileRouteDefinition.fromJson(Map<String, dynamic> json) {
    return MobileRouteDefinition(
      routeId: '${json['routeId'] ?? ''}',
      name: '${json['name'] ?? ''}',
      path: '${json['path'] ?? ''}',
      allowDeepLink: json['allowDeepLink'] == null
          ? true
          : json['allowDeepLink'] == true || json['allowDeepLink'] == 'true',
      requiresAuth: json['requiresAuth'] == true || json['requiresAuth'] == 'true',
      metadata: _normaliseMetadata(json['metadata']),
    );
  }

  final String routeId;
  final String name;
  final String path;
  final bool allowDeepLink;
  final bool requiresAuth;
  final Map<String, dynamic> metadata;

  static Map<String, dynamic> _normaliseMetadata(dynamic value) {
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

  Map<String, dynamic> toJson() {
    return {
      'routeId': routeId,
      'name': name,
      'path': path,
      'allowDeepLink': allowDeepLink,
      'requiresAuth': requiresAuth,
      'metadata': metadata,
    };
  }

  @override
  bool operator ==(Object other) {
    return other is MobileRouteDefinition &&
        other.routeId == routeId &&
        other.name == name &&
        other.path == path &&
        other.allowDeepLink == allowDeepLink &&
        other.requiresAuth == requiresAuth &&
        const DeepCollectionEquality().equals(other.metadata, metadata);
  }

  @override
  int get hashCode => Object.hash(
        routeId,
        name,
        path,
        allowDeepLink,
        requiresAuth,
        const DeepCollectionEquality().hash(metadata),
      );
}
