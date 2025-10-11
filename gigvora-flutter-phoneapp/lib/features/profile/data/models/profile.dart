class ProfileGroup {
  const ProfileGroup({
    required this.id,
    required this.name,
    this.description,
  });

  final String id;
  final String name;
  final String? description;

  factory ProfileGroup.fromJson(Map<String, dynamic> json) {
    return ProfileGroup(
      id: '${json['id'] ?? json['groupId'] ?? ''}'.trim(),
      name: (json['name'] as String? ?? json['title'] as String? ?? '').trim(),
      description: (json['description'] as String?)?.trim().isEmpty ?? true
          ? null
          : (json['description'] as String).trim(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      if (description != null) 'description': description,
    };
  }
}

class ProfileMetric {
  const ProfileMetric({
    required this.key,
    required this.value,
    required this.label,
  });

  final String key;
  final num value;
  final String label;

  factory ProfileMetric.fromJson(String key, dynamic raw) {
    if (raw is Map<String, dynamic>) {
      return ProfileMetric(
        key: key,
        value: raw['value'] is num ? raw['value'] as num : num.tryParse('${raw['value']}') ?? 0,
        label: (raw['label'] as String? ?? key).trim(),
      );
    }
    final numeric = raw is num ? raw : num.tryParse('$raw') ?? 0;
    final label = key
        .split('_')
        .map((segment) => segment.isEmpty ? segment : '${segment[0].toUpperCase()}${segment.substring(1)}')
        .join(' ');
    return ProfileMetric(key: key, value: numeric, label: label);
  }

  Map<String, dynamic> toJson() {
    return {
      'key': key,
      'value': value,
      'label': label,
    };
  }
}

class ProfileAvailability {
  const ProfileAvailability({
    required this.status,
    this.nextAvailability,
    this.acceptingVolunteers = false,
    this.acceptingLaunchpad = false,
  });

  final String status;
  final DateTime? nextAvailability;
  final bool acceptingVolunteers;
  final bool acceptingLaunchpad;

  factory ProfileAvailability.fromJson(Map<String, dynamic>? json) {
    if (json == null) {
      return const ProfileAvailability(status: 'available_now');
    }
    return ProfileAvailability(
      status: (json['status'] as String? ?? 'available_now').trim(),
      nextAvailability: DateTime.tryParse(json['nextAvailability'] as String? ?? ''),
      acceptingVolunteers: json['acceptingVolunteers'] as bool? ?? false,
      acceptingLaunchpad: json['acceptingLaunchpad'] as bool? ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'status': status,
      'nextAvailability': nextAvailability?.toIso8601String(),
      'acceptingVolunteers': acceptingVolunteers,
      'acceptingLaunchpad': acceptingLaunchpad,
    };
  }
}

class ProfileExperience {
  const ProfileExperience({
    required this.id,
    required this.title,
    required this.organisation,
    required this.startDate,
    this.endDate,
    this.summary,
    this.achievements = const <String>[],
  });

  final String id;
  final String title;
  final String organisation;
  final DateTime startDate;
  final DateTime? endDate;
  final String? summary;
  final List<String> achievements;

  factory ProfileExperience.fromJson(Map<String, dynamic> json) {
    return ProfileExperience(
      id: '${json['id'] ?? json['experienceId'] ?? json['uuid'] ?? ''}',
      title: (json['title'] as String? ?? json['role'] as String? ?? '').trim(),
      organisation: (json['organisation'] as String? ?? json['company'] as String? ?? '').trim(),
      startDate: DateTime.tryParse(json['startDate'] as String? ?? json['from'] as String? ?? '') ?? DateTime.now(),
      endDate: DateTime.tryParse(json['endDate'] as String? ?? json['to'] as String? ?? ''),
      summary: (json['summary'] as String? ?? json['description'] as String?)?.trim().isEmpty ?? true
          ? null
          : (json['summary'] as String? ?? json['description'] as String?)!.trim(),
      achievements: (json['achievements'] as List<dynamic>? ?? const [])
          .whereType<String>()
          .map((value) => value.trim())
          .where((value) => value.isNotEmpty)
          .toList(growable: false),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'organisation': organisation,
      'startDate': startDate.toIso8601String(),
      'endDate': endDate?.toIso8601String(),
      if (summary != null) 'summary': summary,
      'achievements': achievements,
    };
  }
}

class ProfileModel {
  const ProfileModel({
    required this.id,
    required this.fullName,
    required this.headline,
    required this.bio,
    required this.location,
    required this.skills,
    required this.groups,
    required this.availability,
    required this.experiences,
    required this.metrics,
    required this.focusAreas,
    this.avatarUrl,
  });

  final String id;
  final String fullName;
  final String headline;
  final String bio;
  final String location;
  final List<String> skills;
  final List<ProfileGroup> groups;
  final ProfileAvailability availability;
  final List<ProfileExperience> experiences;
  final List<ProfileMetric> metrics;
  final List<String> focusAreas;
  final String? avatarUrl;

  factory ProfileModel.fromJson(Map<String, dynamic> json) {
    final skills = (json['skills'] as List<dynamic>? ?? json['skillSet'] as List<dynamic>? ?? const [])
        .whereType<String>()
        .map((value) => value.trim())
        .where((value) => value.isNotEmpty)
        .toList(growable: false);

    final groupsRaw = json['groups'] ?? json['communities'];
    final groups = groupsRaw is List
        ? groupsRaw
            .whereType<Map>()
            .map((item) => ProfileGroup.fromJson(Map<String, dynamic>.from(item as Map)))
            .toList(growable: false)
        : const <ProfileGroup>[];

    final experiencesRaw = json['experiences'] ?? json['experience'];
    final experiences = experiencesRaw is List
        ? experiencesRaw
            .whereType<Map>()
            .map((item) => ProfileExperience.fromJson(Map<String, dynamic>.from(item as Map)))
            .toList(growable: false)
        : const <ProfileExperience>[];

    final metricsRaw = json['metrics'] ?? json['stats'];
    final metrics = <ProfileMetric>[];
    if (metricsRaw is Map) {
      for (final entry in metricsRaw.entries) {
        metrics.add(ProfileMetric.fromJson('${entry.key}', entry.value));
      }
    }

    final focusAreas = (json['focusAreas'] as List<dynamic>? ?? json['domains'] as List<dynamic>? ?? const [])
        .whereType<String>()
        .map((value) => value.trim())
        .where((value) => value.isNotEmpty)
        .toList(growable: false);

    final profile = json['profile'] is Map<String, dynamic>
        ? Map<String, dynamic>.from(json['profile'] as Map<String, dynamic>)
        : json;

    return ProfileModel(
      id: '${profile['id'] ?? profile['profileId'] ?? json['id'] ?? ''}',
      fullName: (profile['fullName'] as String? ?? profile['name'] as String? ?? '').trim(),
      headline: (profile['headline'] as String? ?? profile['title'] as String? ?? '').trim(),
      bio: (profile['bio'] as String? ?? profile['summary'] as String? ?? '').trim(),
      location: (profile['location'] as String? ?? profile['city'] as String? ?? '').trim(),
      skills: skills,
      groups: groups,
      availability: ProfileAvailability.fromJson(profile['availability'] as Map<String, dynamic>?),
      experiences: experiences,
      metrics: metrics,
      focusAreas: focusAreas,
      avatarUrl: (profile['avatarUrl'] as String? ?? profile['photoUrl'] as String?)?.trim(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'fullName': fullName,
      'headline': headline,
      'bio': bio,
      'location': location,
      'skills': skills,
      'groups': groups.map((group) => group.toJson()).toList(),
      'availability': availability.toJson(),
      'experiences': experiences.map((exp) => exp.toJson()).toList(),
      'metrics': {for (final metric in metrics) metric.key: metric.toJson()},
      'focusAreas': focusAreas,
      if (avatarUrl != null) 'avatarUrl': avatarUrl,
    };
  }
}
