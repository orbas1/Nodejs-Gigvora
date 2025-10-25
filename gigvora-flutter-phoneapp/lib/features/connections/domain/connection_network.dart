class ConnectionActorSummary {
  const ConnectionActorSummary({
    required this.id,
    required this.name,
    required this.userType,
    this.headline,
    this.location,
  });

  final int id;
  final String name;
  final String userType;
  final String? headline;
  final String? location;

  factory ConnectionActorSummary.fromJson(Map<String, dynamic> json) {
    return ConnectionActorSummary(
      id: json['id'] as int,
      name: json['name'] as String? ?? 'Unknown member',
      userType: json['userType'] as String? ?? 'user',
      headline: json['headline'] as String?,
      location: json['location'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'userType': userType,
      if (headline != null) 'headline': headline,
      if (location != null) 'location': location,
    };
  }
}

class ConnectionNodeActions {
  const ConnectionNodeActions({
    required this.canMessage,
    required this.canRequestConnection,
    required this.requiresIntroduction,
    this.reason,
  });

  final bool canMessage;
  final bool canRequestConnection;
  final bool requiresIntroduction;
  final String? reason;

  factory ConnectionNodeActions.fromJson(Map<String, dynamic>? json) {
    if (json == null) {
      return const ConnectionNodeActions(
        canMessage: false,
        canRequestConnection: false,
        requiresIntroduction: false,
      );
    }
    return ConnectionNodeActions(
      canMessage: json['canMessage'] as bool? ?? false,
      canRequestConnection: json['canRequestConnection'] as bool? ?? false,
      requiresIntroduction: json['requiresIntroduction'] as bool? ?? false,
      reason: json['reason'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'canMessage': canMessage,
      'canRequestConnection': canRequestConnection,
      'requiresIntroduction': requiresIntroduction,
      if (reason != null) 'reason': reason,
    };
  }
}

class ConnectionNode {
  const ConnectionNode({
    required this.id,
    required this.name,
    required this.userType,
    required this.headline,
    required this.location,
    required this.degree,
    required this.degreeLabel,
    required this.mutualConnections,
    required this.connectors,
    required this.path,
    required this.actions,
  });

  final int id;
  final String name;
  final String userType;
  final String? headline;
  final String? location;
  final int degree;
  final String degreeLabel;
  final int mutualConnections;
  final List<ConnectionActorSummary> connectors;
  final List<ConnectionActorSummary> path;
  final ConnectionNodeActions actions;

  factory ConnectionNode.fromJson(Map<String, dynamic> json) {
    final connectors = (json['connectors'] as List<dynamic>? ?? const <dynamic>[])
        .whereType<Map<String, dynamic>>()
        .map(ConnectionActorSummary.fromJson)
        .toList(growable: false);
    final path = (json['path'] as List<dynamic>? ?? const <dynamic>[])
        .whereType<Map<String, dynamic>>()
        .map(ConnectionActorSummary.fromJson)
        .toList(growable: false);
    return ConnectionNode(
      id: json['id'] as int,
      name: json['name'] as String? ?? 'Network member',
      userType: json['userType'] as String? ?? 'user',
      headline: json['headline'] as String?,
      location: json['location'] as String?,
      degree: json['degree'] as int? ?? 0,
      degreeLabel: json['degreeLabel'] as String? ?? 'Connection',
      mutualConnections: json['mutualConnections'] as int? ?? 0,
      connectors: connectors,
      path: path,
      actions: ConnectionNodeActions.fromJson(json['actions'] as Map<String, dynamic>?),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'userType': userType,
      'headline': headline,
      'location': location,
      'degree': degree,
      'degreeLabel': degreeLabel,
      'mutualConnections': mutualConnections,
      'connectors': connectors.map((connector) => connector.toJson()).toList(),
      'path': path.map((segment) => segment.toJson()).toList(),
      'actions': actions.toJson(),
    };
  }
}

class ConnectionPolicy {
  const ConnectionPolicy({
    required this.actorRole,
    required this.allowedRoles,
    required this.matrix,
    this.notes,
  });

  final String actorRole;
  final List<String> allowedRoles;
  final Map<String, List<String>> matrix;
  final String? notes;

  factory ConnectionPolicy.fromJson(Map<String, dynamic>? json) {
    if (json == null) {
      return const ConnectionPolicy(
        actorRole: 'user',
        allowedRoles: <String>[],
        matrix: <String, List<String>>{},
      );
    }
    final matrix = <String, List<String>>{};
    final rawMatrix = json['matrix'] as Map<String, dynamic>? ?? const <String, dynamic>{};
    rawMatrix.forEach((key, value) {
      if (value is List) {
        matrix[key] = value.whereType<String>().toList(growable: false);
      }
    });
    return ConnectionPolicy(
      actorRole: json['actorRole'] as String? ?? 'user',
      allowedRoles: (json['allowedRoles'] as List<dynamic>? ?? const <dynamic>[])
          .whereType<String>()
          .toList(growable: false),
      matrix: matrix,
      notes: json['notes'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'actorRole': actorRole,
      'allowedRoles': allowedRoles,
      'matrix': matrix,
      if (notes != null) 'notes': notes,
    };
  }
}

class ConnectionSummary {
  const ConnectionSummary({
    required this.firstDegree,
    required this.secondDegree,
    required this.thirdDegree,
    required this.total,
  });

  final int firstDegree;
  final int secondDegree;
  final int thirdDegree;
  final int total;

  factory ConnectionSummary.fromJson(Map<String, dynamic>? json) {
    if (json == null) {
      return const ConnectionSummary(firstDegree: 0, secondDegree: 0, thirdDegree: 0, total: 0);
    }
    return ConnectionSummary(
      firstDegree: json['firstDegree'] as int? ?? 0,
      secondDegree: json['secondDegree'] as int? ?? 0,
      thirdDegree: json['thirdDegree'] as int? ?? 0,
      total: json['total'] as int? ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'firstDegree': firstDegree,
      'secondDegree': secondDegree,
      'thirdDegree': thirdDegree,
      'total': total,
    };
  }
}

class ConnectionNetwork {
  const ConnectionNetwork({
    required this.user,
    required this.viewer,
    required this.policy,
    required this.summary,
    required this.firstDegree,
    required this.secondDegree,
    required this.thirdDegree,
    required this.generatedAt,
  });

  final ConnectionActorSummary user;
  final ConnectionActorSummary viewer;
  final ConnectionPolicy policy;
  final ConnectionSummary summary;
  final List<ConnectionNode> firstDegree;
  final List<ConnectionNode> secondDegree;
  final List<ConnectionNode> thirdDegree;
  final DateTime generatedAt;

  factory ConnectionNetwork.fromJson(Map<String, dynamic> json) {
    return ConnectionNetwork(
      user: ConnectionActorSummary.fromJson(Map<String, dynamic>.from(json['user'] as Map)),
      viewer: ConnectionActorSummary.fromJson(Map<String, dynamic>.from(json['viewer'] as Map)),
      policy: ConnectionPolicy.fromJson(json['policy'] as Map<String, dynamic>?),
      summary: ConnectionSummary.fromJson(json['summary'] as Map<String, dynamic>?),
      firstDegree: (json['firstDegree'] as List<dynamic>? ?? const <dynamic>[])
          .whereType<Map<String, dynamic>>()
          .map(ConnectionNode.fromJson)
          .toList(growable: false),
      secondDegree: (json['secondDegree'] as List<dynamic>? ?? const <dynamic>[])
          .whereType<Map<String, dynamic>>()
          .map(ConnectionNode.fromJson)
          .toList(growable: false),
      thirdDegree: (json['thirdDegree'] as List<dynamic>? ?? const <dynamic>[])
          .whereType<Map<String, dynamic>>()
          .map(ConnectionNode.fromJson)
          .toList(growable: false),
      generatedAt: DateTime.tryParse(json['generatedAt'] as String? ?? '') ?? DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'user': user.toJson(),
      'viewer': viewer.toJson(),
      'policy': policy.toJson(),
      'summary': summary.toJson(),
      'firstDegree': firstDegree.map((node) => node.toJson()).toList(),
      'secondDegree': secondDegree.map((node) => node.toJson()).toList(),
      'thirdDegree': thirdDegree.map((node) => node.toJson()).toList(),
      'generatedAt': generatedAt.toIso8601String(),
    };
  }
}

class ConnectionRequestResult {
  const ConnectionRequestResult({
    required this.id,
    required this.status,
    required this.createdAt,
  });

  final int id;
  final String status;
  final DateTime createdAt;

  factory ConnectionRequestResult.fromJson(Map<String, dynamic> json) {
    return ConnectionRequestResult(
      id: json['id'] is int ? json['id'] as int : int.tryParse('${json['id']}') ?? 0,
      status: (json['status'] as String? ?? 'pending').toLowerCase(),
      createdAt:
          DateTime.tryParse(json['createdAt'] as String? ?? json['created_at'] as String? ?? '') ?? DateTime.now(),
    );
  }
}
