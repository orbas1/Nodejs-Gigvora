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

class ProfileReference {
  const ProfileReference({
    required this.id,
    required this.client,
    required this.relationship,
    required this.company,
    required this.quote,
    required this.status,
    required this.verified,
    this.rating,
    this.weight,
    this.lastInteractionAt,
    this.isPrivate = false,
  });

  final String id;
  final String client;
  final String relationship;
  final String company;
  final String quote;
  final String status;
  final bool verified;
  final double? rating;
  final String? weight;
  final DateTime? lastInteractionAt;
  final bool isPrivate;

  factory ProfileReference.fromJson(Map<String, dynamic> json) {
    final ratingValue = json['rating'] ?? json['score'] ?? json['nps'];
    final lastInteraction = json['lastInteractionAt'] ?? json['lastInteractedAt'] ?? json['updatedAt'];
    return ProfileReference(
      id: '${json['id'] ?? json['referenceId'] ?? json['uuid'] ?? ''}',
      client: (json['client'] as String? ?? json['clientName'] as String? ?? json['reviewer'] as String? ?? '').trim(),
      relationship: (json['relationship'] as String? ?? json['role'] as String? ?? '').trim(),
      company: (json['company'] as String? ?? json['organisation'] as String? ?? json['companyName'] as String? ?? '').trim(),
      quote: (json['quote'] as String? ?? json['testimonial'] as String? ?? json['comment'] as String? ?? '').trim(),
      status: (json['status'] as String? ?? (json['published'] == true ? 'published' : 'draft')).trim(),
      verified: json['verified'] as bool? ?? json['isVerified'] as bool? ?? json['status'] == 'verified',
      rating: ratingValue is num
          ? ratingValue.toDouble()
          : ratingValue is String
              ? double.tryParse(ratingValue)
              : null,
      weight: (json['weight'] as String? ?? json['impact'] as String?)?.trim().isEmpty ?? true
          ? null
          : (json['weight'] as String? ?? json['impact'] as String?).toString().trim(),
      lastInteractionAt: lastInteraction is String && lastInteraction.isNotEmpty
          ? DateTime.tryParse(lastInteraction)
          : null,
      isPrivate: json['private'] as bool? ?? json['isPrivate'] as bool? ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'client': client,
      'relationship': relationship,
      'company': company,
      'quote': quote,
      'status': status,
      'verified': verified,
      if (rating != null) 'rating': rating,
      if (weight != null) 'weight': weight,
      if (lastInteractionAt != null) 'lastInteractionAt': lastInteractionAt!.toIso8601String(),
      'private': isPrivate,
    };
  }
}

class ProfileReferenceSettings {
  const ProfileReferenceSettings({
    this.allowPrivate = true,
    this.showBadges = true,
    this.autoShareToFeed = false,
    this.autoRequest = false,
    this.escalateConcerns = true,
  });

  final bool allowPrivate;
  final bool showBadges;
  final bool autoShareToFeed;
  final bool autoRequest;
  final bool escalateConcerns;

  factory ProfileReferenceSettings.fromJson(Map<String, dynamic>? json) {
    if (json == null) {
      return const ProfileReferenceSettings();
    }
    return ProfileReferenceSettings(
      allowPrivate: json['allowPrivate'] as bool? ?? json['allowPrivateReferences'] as bool? ?? true,
      showBadges: json['showBadges'] as bool? ?? json['displayBadges'] as bool? ?? true,
      autoShareToFeed: json['autoShareToFeed'] as bool? ?? json['feedCrossPosting'] as bool? ?? false,
      autoRequest: json['autoRequest'] as bool? ?? json['requestAutomation'] as bool? ?? false,
      escalateConcerns: json['escalateConcerns'] as bool? ?? json['routeConcernsToSupport'] as bool? ?? true,
    );
  }

  ProfileReferenceSettings copyWith({
    bool? allowPrivate,
    bool? showBadges,
    bool? autoShareToFeed,
    bool? autoRequest,
    bool? escalateConcerns,
  }) {
    return ProfileReferenceSettings(
      allowPrivate: allowPrivate ?? this.allowPrivate,
      showBadges: showBadges ?? this.showBadges,
      autoShareToFeed: autoShareToFeed ?? this.autoShareToFeed,
      autoRequest: autoRequest ?? this.autoRequest,
      escalateConcerns: escalateConcerns ?? this.escalateConcerns,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'allowPrivate': allowPrivate,
      'showBadges': showBadges,
      'autoShareToFeed': autoShareToFeed,
      'autoRequest': autoRequest,
      'escalateConcerns': escalateConcerns,
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
    this.references = const <ProfileReference>[],
    this.referenceSettings = const ProfileReferenceSettings(),
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
  final List<ProfileReference> references;
  final ProfileReferenceSettings referenceSettings;
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

    final referencesRaw = json['references'] ?? json['testimonials'] ?? json['items'];
    final references = referencesRaw is List
        ? referencesRaw
            .whereType<Map>()
            .map((item) => ProfileReference.fromJson(Map<String, dynamic>.from(item as Map)))
            .toList(growable: false)
        : const <ProfileReference>[];

    final referenceSettings = ProfileReferenceSettings.fromJson(
      json['referenceSettings'] as Map<String, dynamic>? ??
          json['settings'] as Map<String, dynamic>? ??
          json['preferences'] as Map<String, dynamic>?,
    );

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
      references: references,
      referenceSettings: referenceSettings,
      avatarUrl: (profile['avatarUrl'] as String? ?? profile['photoUrl'] as String?)?.trim(),
    );
  }

  ProfileModel copyWith({
    String? id,
    String? fullName,
    String? headline,
    String? bio,
    String? location,
    List<String>? skills,
    List<ProfileGroup>? groups,
    ProfileAvailability? availability,
    List<ProfileExperience>? experiences,
    List<ProfileMetric>? metrics,
    List<String>? focusAreas,
    List<ProfileReference>? references,
    ProfileReferenceSettings? referenceSettings,
    String? avatarUrl,
  }) {
    return ProfileModel(
      id: id ?? this.id,
      fullName: fullName ?? this.fullName,
      headline: headline ?? this.headline,
      bio: bio ?? this.bio,
      location: location ?? this.location,
      skills: skills ?? this.skills,
      groups: groups ?? this.groups,
      availability: availability ?? this.availability,
      experiences: experiences ?? this.experiences,
      metrics: metrics ?? this.metrics,
      focusAreas: focusAreas ?? this.focusAreas,
      references: references ?? this.references,
      referenceSettings: referenceSettings ?? this.referenceSettings,
      avatarUrl: avatarUrl ?? this.avatarUrl,
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
      'references': references.map((reference) => reference.toJson()).toList(),
      'referenceSettings': referenceSettings.toJson(),
      if (avatarUrl != null) 'avatarUrl': avatarUrl,
    };
  }
}
