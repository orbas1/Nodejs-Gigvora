import 'package:gigvora_foundation/gigvora_foundation.dart';

class ProjectAutoMatchProject {
  const ProjectAutoMatchProject({
    required this.id,
    required this.title,
    required this.description,
    required this.status,
    required this.budgetAmount,
    required this.budgetCurrency,
    required this.autoAssignStatus,
  });

  factory ProjectAutoMatchProject.fromJson(Map<String, dynamic> json) {
    return ProjectAutoMatchProject(
      id: json['id'] is int ? json['id'] as int : int.tryParse('${json['id']}') ?? 0,
      title: '${json['title'] ?? 'Project'}',
      description: '${json['description'] ?? ''}',
      status: '${json['status'] ?? 'planning'}',
      budgetAmount: _parseDouble(json['budgetAmount']),
      budgetCurrency: json['budgetCurrency'] as String?,
      autoAssignStatus: json['autoAssignStatus'] as String?,
    );
  }

  final int id;
  final String title;
  final String description;
  final String status;
  final double? budgetAmount;
  final String? budgetCurrency;
  final String? autoAssignStatus;
}

class ProjectAutoMatchFreelancer {
  const ProjectAutoMatchFreelancer({
    required this.id,
    required this.firstName,
    required this.lastName,
  });

  factory ProjectAutoMatchFreelancer.fromJson(Map<String, dynamic>? json) {
    if (json == null) {
      return const ProjectAutoMatchFreelancer(id: 0, firstName: 'Freelancer', lastName: '');
    }
    return ProjectAutoMatchFreelancer(
      id: json['id'] is int ? json['id'] as int : int.tryParse('${json['id']}') ?? 0,
      firstName: '${json['firstName'] ?? ''}',
      lastName: '${json['lastName'] ?? ''}',
    );
  }

  final int id;
  final String firstName;
  final String lastName;
}

class ProjectAutoMatchEntry {
  const ProjectAutoMatchEntry({
    required this.id,
    required this.freelancerId,
    required this.status,
    required this.score,
    required this.priorityBucket,
    required this.position,
    required this.expiresAt,
    required this.metadata,
    required this.breakdown,
    required this.freelancer,
  });

  factory ProjectAutoMatchEntry.fromJson(Map<String, dynamic> json) {
    final metadata = json['metadata'] is Map<String, dynamic>
        ? Map<String, dynamic>.from(json['metadata'] as Map)
        : const <String, dynamic>{};
    final breakdown = json['breakdown'] is Map<String, dynamic>
        ? Map<String, dynamic>.from(json['breakdown'] as Map)
        : const <String, dynamic>{};
    return ProjectAutoMatchEntry(
      id: json['id'] is int ? json['id'] as int : int.tryParse('${json['id']}') ?? 0,
      freelancerId: json['freelancerId'] is int
          ? json['freelancerId'] as int
          : int.tryParse('${json['freelancerId']}') ??
              ProjectAutoMatchFreelancer.fromJson(json['freelancer'] as Map<String, dynamic>?).id,
      status: '${json['status'] ?? 'pending'}',
      score: _resolveScore(json, metadata),
      priorityBucket: json['priorityBucket'] is int
          ? json['priorityBucket'] as int
          : int.tryParse('${json['priorityBucket']}'),
      position: json['position'] is int ? json['position'] as int : int.tryParse('${json['position']}'),
      expiresAt: _parseDate(json['expiresAt']),
      metadata: metadata,
      breakdown: breakdown,
      freelancer: ProjectAutoMatchFreelancer.fromJson(
        json['freelancer'] is Map ? Map<String, dynamic>.from(json['freelancer'] as Map) : null,
      ),
    );
  }

  final int id;
  final int freelancerId;
  final String status;
  final double? score;
  final int? priorityBucket;
  final int? position;
  final DateTime? expiresAt;
  final Map<String, dynamic> metadata;
  final Map<String, dynamic> breakdown;
  final ProjectAutoMatchFreelancer freelancer;
}

class ProjectAutoMatchSnapshot {
  const ProjectAutoMatchSnapshot({
    required this.project,
    required this.entries,
    required this.retrievedAt,
  });

  final ProjectAutoMatchProject project;
  final List<ProjectAutoMatchEntry> entries;
  final DateTime retrievedAt;
}

class ProjectAutoMatchCommand {
  ProjectAutoMatchCommand({
    required this.limit,
    required this.expiresInMinutes,
    required this.projectValue,
    required this.ensureNewcomer,
    required this.maxAssignments,
    required this.weights,
  });

  final int? limit;
  final int? expiresInMinutes;
  final double? projectValue;
  final bool ensureNewcomer;
  final int? maxAssignments;
  final Map<String, double> weights;

  Map<String, dynamic> toJson() {
    return {
      if (projectValue != null) 'projectValue': projectValue,
      if (limit != null) 'limit': limit,
      if (expiresInMinutes != null) 'expiresInMinutes': expiresInMinutes,
      'fairness': {
        'ensureNewcomer': ensureNewcomer,
        if (maxAssignments != null) 'maxAssignments': maxAssignments,
      },
      'weights': weights,
    };
  }
}

class ProjectAutoMatchRepository {
  ProjectAutoMatchRepository(this._apiClient);

  final ApiClient _apiClient;

  Future<ProjectAutoMatchProject> fetchProject(int projectId) async {
    final response = await _apiClient.get('/projects/$projectId');
    if (response is Map<String, dynamic>) {
      return ProjectAutoMatchProject.fromJson(response);
    }
    if (response is Map) {
      return ProjectAutoMatchProject.fromJson(Map<String, dynamic>.from(response));
    }
    throw ApiException(500, 'Unexpected response when fetching project details', response);
  }

  Future<List<ProjectAutoMatchEntry>> fetchQueue(int projectId) async {
    final response = await _apiClient.get('/auto-assign/projects/$projectId/queue');
    final entries = response is Map<String, dynamic>
        ? response['entries']
        : response is Map
            ? (response as Map)['entries']
            : null;
    if (entries is List) {
      return entries
          .whereType<Map>()
          .map((item) => ProjectAutoMatchEntry.fromJson(Map<String, dynamic>.from(item)))
          .toList(growable: false);
    }
    return const <ProjectAutoMatchEntry>[];
  }

  Future<ProjectAutoMatchSnapshot> fetchSnapshot(int projectId) async {
    final project = await fetchProject(projectId);
    final entries = await fetchQueue(projectId);
    return ProjectAutoMatchSnapshot(
      project: project,
      entries: entries,
      retrievedAt: DateTime.now(),
    );
  }

  Future<void> regenerateQueue(int projectId, ProjectAutoMatchCommand command) {
    return _apiClient.post(
      '/auto-assign/projects/$projectId/enqueue',
      body: command.toJson(),
    );
  }
}

double? _resolveScore(Map<String, dynamic> json, Map<String, dynamic> metadata) {
  final candidates = <dynamic>[
    json['score'],
    json['matchScore'],
    metadata['score'],
    metadata['matchScore'],
  ];
  for (final candidate in candidates) {
    if (candidate == null) continue;
    final parsed = _parseDouble(candidate);
    if (parsed == null) {
      continue;
    }
    final raw = '$candidate'.trim();
    if (parsed >= 0 && parsed <= 1 && !raw.endsWith('%')) {
      return (parsed * 100).clamp(0, 100);
    }
    return parsed;
  }
  return null;
}

double? _parseDouble(dynamic value) {
  if (value == null) return null;
  if (value is num) return value.toDouble();
  final stringValue = '$value'.trim();
  if (stringValue.isEmpty) {
    return null;
  }
  final sanitized = stringValue.endsWith('%')
      ? stringValue.substring(0, stringValue.length - 1).trim()
      : stringValue;
  return double.tryParse(sanitized);
}

DateTime? _parseDate(dynamic value) {
  if (value == null) return null;
  if (value is DateTime) return value;
  return DateTime.tryParse('$value');
}
