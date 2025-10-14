import 'dart:math';

class GroupDirectory {
  const GroupDirectory({
    required this.items,
    required this.pagination,
    required this.metadata,
  });

  final List<GroupSummary> items;
  final GroupPagination pagination;
  final GroupDirectoryMetadata metadata;

  factory GroupDirectory.fromJson(Map<String, dynamic> json) {
    final items = (json['items'] as List<dynamic>? ?? const [])
        .whereType<Map<String, dynamic>>()
        .map(GroupSummary.fromJson)
        .toList(growable: false);
    return GroupDirectory(
      items: items,
      pagination: GroupPagination.fromJson(json['pagination'] as Map<String, dynamic>? ?? const {}),
      metadata: GroupDirectoryMetadata.fromJson(json['metadata'] as Map<String, dynamic>? ?? const {}),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'items': items.map((item) => item.toJson()).toList(),
      'pagination': pagination.toJson(),
      'metadata': metadata.toJson(),
    };
  }
}

class GroupPagination {
  const GroupPagination({
    required this.total,
    required this.limit,
    required this.offset,
  });

  final int total;
  final int limit;
  final int offset;

  factory GroupPagination.fromJson(Map<String, dynamic> json) {
    return GroupPagination(
      total: _asInt(json['total']),
      limit: max(1, _asInt(json['limit'], 12)),
      offset: max(0, _asInt(json['offset'])),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'total': total,
      'limit': limit,
      'offset': offset,
    };
  }
}

class GroupDirectoryMetadata {
  const GroupDirectoryMetadata({
    required this.featured,
    required this.generatedAt,
  });

  final List<String> featured;
  final DateTime? generatedAt;

  factory GroupDirectoryMetadata.fromJson(Map<String, dynamic> json) {
    return GroupDirectoryMetadata(
      featured: (json['featured'] as List<dynamic>? ?? const [])
          .map((item) => '$item'.trim())
          .where((value) => value.isNotEmpty)
          .toList(growable: false),
      generatedAt: DateTime.tryParse(json['generatedAt'] as String? ?? ''),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'featured': featured,
      if (generatedAt != null) 'generatedAt': generatedAt!.toIso8601String(),
    };
  }
}

class GroupSummary {
  const GroupSummary({
    required this.id,
    required this.slug,
    required this.name,
    required this.summary,
    required this.description,
    required this.accentColor,
    required this.focusAreas,
    required this.joinPolicy,
    required this.allowedUserTypes,
    required this.membership,
    required this.stats,
    required this.insights,
    required this.upcomingEvents,
    required this.leadership,
    required this.resources,
    required this.guidelines,
    required this.timeline,
    required this.metadata,
  });

  final int id;
  final String slug;
  final String name;
  final String summary;
  final String description;
  final String accentColor;
  final List<String> focusAreas;
  final String joinPolicy;
  final List<String> allowedUserTypes;
  final GroupMembership membership;
  final GroupStats stats;
  final GroupInsights insights;
  final List<GroupEvent> upcomingEvents;
  final List<GroupLeader> leadership;
  final List<GroupResource> resources;
  final List<String> guidelines;
  final List<GroupTimelineEntry> timeline;
  final Map<String, dynamic> metadata;

  bool get inviteOnly => joinPolicy.toLowerCase() == 'invite_only';

  GroupSummary copyWith({
    GroupMembership? membership,
    GroupStats? stats,
  }) {
    return GroupSummary(
      id: id,
      slug: slug,
      name: name,
      summary: summary,
      description: description,
      accentColor: accentColor,
      focusAreas: focusAreas,
      joinPolicy: joinPolicy,
      allowedUserTypes: allowedUserTypes,
      membership: membership ?? this.membership,
      stats: stats ?? this.stats,
      insights: insights,
      upcomingEvents: upcomingEvents,
      leadership: leadership,
      resources: resources,
      guidelines: guidelines,
      timeline: timeline,
      metadata: metadata,
    );
  }

  factory GroupSummary.fromJson(Map<String, dynamic> json) {
    return GroupSummary(
      id: _asInt(json['id']),
      slug: (json['slug'] as String? ?? '').trim(),
      name: (json['name'] as String? ?? '').trim(),
      summary: (json['summary'] as String? ?? '').trim(),
      description: (json['description'] as String? ?? '').trim(),
      accentColor: (json['accentColor'] as String? ?? '#2563EB').trim(),
      focusAreas: (json['focusAreas'] as List<dynamic>? ?? const [])
          .map((item) => '$item'.trim())
          .where((value) => value.isNotEmpty)
          .toList(growable: false),
      joinPolicy: (json['joinPolicy'] as String? ?? 'moderated').trim(),
      allowedUserTypes: (json['allowedUserTypes'] as List<dynamic>? ?? const [])
          .map((item) => '$item'.trim())
          .where((value) => value.isNotEmpty)
          .toList(growable: false),
      membership: GroupMembership.fromJson(json['membership'] as Map<String, dynamic>? ?? const {}),
      stats: GroupStats.fromJson(json['stats'] as Map<String, dynamic>? ?? const {}),
      insights: GroupInsights.fromJson(json['insights'] as Map<String, dynamic>? ?? const {}),
      upcomingEvents: (json['upcomingEvents'] as List<dynamic>? ?? const [])
          .whereType<Map<String, dynamic>>()
          .map(GroupEvent.fromJson)
          .toList(growable: false),
      leadership: (json['leadership'] as List<dynamic>? ?? const [])
          .whereType<Map<String, dynamic>>()
          .map(GroupLeader.fromJson)
          .toList(growable: false),
      resources: (json['resources'] as List<dynamic>? ?? const [])
          .whereType<Map<String, dynamic>>()
          .map(GroupResource.fromJson)
          .toList(growable: false),
      guidelines: (json['guidelines'] as List<dynamic>? ?? const [])
          .map((item) => '$item'.trim())
          .where((value) => value.isNotEmpty)
          .toList(growable: false),
      timeline: (json['timeline'] as List<dynamic>? ?? const [])
          .whereType<Map<String, dynamic>>()
          .map(GroupTimelineEntry.fromJson)
          .toList(growable: false),
      metadata: Map<String, dynamic>.from(json['metadata'] as Map? ?? const {}),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'slug': slug,
      'name': name,
      'summary': summary,
      'description': description,
      'accentColor': accentColor,
      'focusAreas': focusAreas,
      'joinPolicy': joinPolicy,
      'allowedUserTypes': allowedUserTypes,
      'membership': membership.toJson(),
      'stats': stats.toJson(),
      'insights': insights.toJson(),
      'upcomingEvents': upcomingEvents.map((event) => event.toJson()).toList(),
      'leadership': leadership.map((leader) => leader.toJson()).toList(),
      'resources': resources.map((resource) => resource.toJson()).toList(),
      'guidelines': guidelines,
      'timeline': timeline.map((entry) => entry.toJson()).toList(),
      'metadata': metadata,
    };
  }
}

class GroupProfile extends GroupSummary {
  const GroupProfile({
    required super.id,
    required super.slug,
    required super.name,
    required super.summary,
    required super.description,
    required super.accentColor,
    required super.focusAreas,
    required super.joinPolicy,
    required super.allowedUserTypes,
    required super.membership,
    required super.stats,
    required super.insights,
    required super.upcomingEvents,
    required super.leadership,
    required super.resources,
    required super.guidelines,
    required super.timeline,
    required super.metadata,
    this.membershipBreakdown = const <GroupMembershipBreakdown>[],
    this.access,
  });

  final List<GroupMembershipBreakdown> membershipBreakdown;
  final GroupAccessPolicy? access;

  factory GroupProfile.fromJson(Map<String, dynamic> json) {
    final summary = GroupSummary.fromJson(json);
    return GroupProfile(
      id: summary.id,
      slug: summary.slug,
      name: summary.name,
      summary: summary.summary,
      description: summary.description,
      accentColor: summary.accentColor,
      focusAreas: summary.focusAreas,
      joinPolicy: summary.joinPolicy,
      allowedUserTypes: summary.allowedUserTypes,
      membership: summary.membership,
      stats: summary.stats,
      insights: summary.insights,
      upcomingEvents: summary.upcomingEvents,
      leadership: summary.leadership,
      resources: summary.resources,
      guidelines: summary.guidelines,
      timeline: summary.timeline,
      metadata: summary.metadata,
      membershipBreakdown: (json['membershipBreakdown'] as List<dynamic>? ?? const [])
          .whereType<Map<String, dynamic>>()
          .map(GroupMembershipBreakdown.fromJson)
          .toList(growable: false),
      access: json['access'] is Map<String, dynamic>
          ? GroupAccessPolicy.fromJson(json['access'] as Map<String, dynamic>)
          : null,
    );
  }

  @override
  Map<String, dynamic> toJson() {
    final json = super.toJson();
    json['membershipBreakdown'] = membershipBreakdown.map((item) => item.toJson()).toList();
    if (access != null) {
      json['access'] = access!.toJson();
    }
    return json;
  }
}

class GroupAccessPolicy {
  const GroupAccessPolicy({
    required this.joinPolicy,
    required this.allowedUserTypes,
    required this.invitationRequired,
  });

  final String joinPolicy;
  final List<String> allowedUserTypes;
  final bool invitationRequired;

  factory GroupAccessPolicy.fromJson(Map<String, dynamic> json) {
    return GroupAccessPolicy(
      joinPolicy: (json['joinPolicy'] as String? ?? 'moderated').trim(),
      allowedUserTypes: (json['allowedUserTypes'] as List<dynamic>? ?? const [])
          .map((item) => '$item'.trim())
          .where((value) => value.isNotEmpty)
          .toList(growable: false),
      invitationRequired: _asBool(json['invitationRequired']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'joinPolicy': joinPolicy,
      'allowedUserTypes': allowedUserTypes,
      'invitationRequired': invitationRequired,
    };
  }
}

class GroupMembershipBreakdown {
  const GroupMembershipBreakdown({
    required this.role,
    required this.count,
  });

  final String role;
  final int count;

  factory GroupMembershipBreakdown.fromJson(Map<String, dynamic> json) {
    return GroupMembershipBreakdown(
      role: (json['role'] as String? ?? '').trim(),
      count: _asInt(json['count']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'role': role,
      'count': count,
    };
  }
}

class GroupStats {
  const GroupStats({
    required this.memberCount,
    required this.weeklyActiveMembers,
    required this.opportunitiesSharedThisWeek,
    required this.retentionRate,
    required this.engagementScore,
  });

  final int memberCount;
  final int weeklyActiveMembers;
  final int opportunitiesSharedThisWeek;
  final double retentionRate;
  final double engagementScore;

  factory GroupStats.fromJson(Map<String, dynamic> json) {
    return GroupStats(
      memberCount: _asInt(json['memberCount']),
      weeklyActiveMembers: _asInt(json['weeklyActiveMembers']),
      opportunitiesSharedThisWeek: _asInt(json['opportunitiesSharedThisWeek']),
      retentionRate: _asDouble(json['retentionRate'], 0.0),
      engagementScore: _asDouble(json['engagementScore'], 0.0),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'memberCount': memberCount,
      'weeklyActiveMembers': weeklyActiveMembers,
      'opportunitiesSharedThisWeek': opportunitiesSharedThisWeek,
      'retentionRate': retentionRate,
      'engagementScore': engagementScore,
    };
  }
}

class GroupInsights {
  const GroupInsights({
    required this.signalStrength,
    required this.trendingTopics,
  });

  final String signalStrength;
  final List<String> trendingTopics;

  factory GroupInsights.fromJson(Map<String, dynamic> json) {
    return GroupInsights(
      signalStrength: (json['signalStrength'] as String? ?? 'steady').trim(),
      trendingTopics: (json['trendingTopics'] as List<dynamic>? ?? const [])
          .map((item) => '$item'.trim())
          .where((value) => value.isNotEmpty)
          .toList(growable: false),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'signalStrength': signalStrength,
      'trendingTopics': trendingTopics,
    };
  }
}

class GroupMembership {
  const GroupMembership({
    required this.status,
    required this.role,
    required this.joinedAt,
    required this.preferences,
  });

  final String status;
  final String? role;
  final DateTime? joinedAt;
  final GroupMembershipPreferences preferences;

  bool get isMember => status == 'member';

  GroupMembership copyWith({
    String? status,
    String? role = _stringSentinel,
    DateTime? joinedAt = _dateSentinel,
    GroupMembershipPreferences? preferences,
  }) {
    return GroupMembership(
      status: status ?? this.status,
      role: identical(role, _stringSentinel) ? this.role : role,
      joinedAt: identical(joinedAt, _dateSentinel) ? this.joinedAt : joinedAt,
      preferences: preferences ?? this.preferences,
    );
  }

  factory GroupMembership.fromJson(Map<String, dynamic> json) {
    return GroupMembership(
      status: (json['status'] as String? ?? 'not_member').trim(),
      role: (json['role'] as String?)?.trim().isEmpty ?? true ? null : (json['role'] as String).trim(),
      joinedAt: DateTime.tryParse(json['joinedAt'] as String? ?? ''),
      preferences:
          GroupMembershipPreferences.fromJson(json['preferences'] as Map<String, dynamic>? ?? const {}),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'status': status,
      if (role != null) 'role': role,
      if (joinedAt != null) 'joinedAt': joinedAt!.toIso8601String(),
      'preferences': preferences.toJson(),
    };
  }

  static const _stringSentinel = Object();
  static const _dateSentinel = Object();
}

class GroupMembershipPreferences {
  const GroupMembershipPreferences({
    required this.notifications,
  });

  final GroupNotificationPreferences notifications;

  factory GroupMembershipPreferences.fromJson(Map<String, dynamic> json) {
    return GroupMembershipPreferences(
      notifications: GroupNotificationPreferences.fromJson(
        json['notifications'] as Map<String, dynamic>? ?? const {},
      ),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'notifications': notifications.toJson(),
    };
  }
}

class GroupNotificationPreferences {
  const GroupNotificationPreferences({
    this.digest = true,
    this.newThread = true,
    this.upcomingEvent = true,
  });

  final bool digest;
  final bool newThread;
  final bool upcomingEvent;

  factory GroupNotificationPreferences.fromJson(Map<String, dynamic> json) {
    return GroupNotificationPreferences(
      digest: _asBool(json['digest'], true),
      newThread: _asBool(json['newThread'], true),
      upcomingEvent: _asBool(json['upcomingEvent'], true),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'digest': digest,
      'newThread': newThread,
      'upcomingEvent': upcomingEvent,
    };
  }

  GroupNotificationPreferences copyWith({
    bool? digest,
    bool? newThread,
    bool? upcomingEvent,
  }) {
    return GroupNotificationPreferences(
      digest: digest ?? this.digest,
      newThread: newThread ?? this.newThread,
      upcomingEvent: upcomingEvent ?? this.upcomingEvent,
    );
  }
}

class GroupEvent {
  const GroupEvent({
    required this.id,
    required this.title,
    this.startAt,
    this.timezone,
    this.format,
    this.host,
    this.registrationRequired = false,
  });

  final String id;
  final String title;
  final DateTime? startAt;
  final String? timezone;
  final String? format;
  final GroupEventHost? host;
  final bool registrationRequired;

  factory GroupEvent.fromJson(Map<String, dynamic> json) {
    return GroupEvent(
      id: (json['id'] as String? ?? '').trim(),
      title: (json['title'] as String? ?? '').trim(),
      startAt: DateTime.tryParse(json['startAt'] as String? ?? ''),
      timezone: (json['timezone'] as String?)?.trim().isEmpty ?? true ? null : (json['timezone'] as String).trim(),
      format: (json['format'] as String?)?.trim().isEmpty ?? true ? null : (json['format'] as String).trim(),
      host: json['host'] is Map<String, dynamic>
          ? GroupEventHost.fromJson(json['host'] as Map<String, dynamic>)
          : null,
      registrationRequired: _asBool(json['registrationRequired']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      if (startAt != null) 'startAt': startAt!.toIso8601String(),
      if (timezone != null) 'timezone': timezone,
      if (format != null) 'format': format,
      if (host != null) 'host': host!.toJson(),
      'registrationRequired': registrationRequired,
    };
  }
}

class GroupEventHost {
  const GroupEventHost({
    required this.name,
    this.title,
  });

  final String name;
  final String? title;

  factory GroupEventHost.fromJson(Map<String, dynamic> json) {
    return GroupEventHost(
      name: (json['name'] as String? ?? '').trim(),
      title: (json['title'] as String?)?.trim().isEmpty ?? true ? null : (json['title'] as String).trim(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      if (title != null) 'title': title,
    };
  }
}

class GroupLeader {
  const GroupLeader({
    required this.name,
    this.title,
    this.role,
    this.avatarSeed,
  });

  final String name;
  final String? title;
  final String? role;
  final String? avatarSeed;

  factory GroupLeader.fromJson(Map<String, dynamic> json) {
    return GroupLeader(
      name: (json['name'] as String? ?? '').trim(),
      title: (json['title'] as String?)?.trim().isEmpty ?? true ? null : (json['title'] as String).trim(),
      role: (json['role'] as String?)?.trim().isEmpty ?? true ? null : (json['role'] as String).trim(),
      avatarSeed:
          (json['avatarSeed'] as String?)?.trim().isEmpty ?? true ? null : (json['avatarSeed'] as String).trim(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      if (title != null) 'title': title,
      if (role != null) 'role': role,
      if (avatarSeed != null) 'avatarSeed': avatarSeed,
    };
  }
}

class GroupResource {
  const GroupResource({
    required this.id,
    required this.title,
    required this.type,
    required this.url,
  });

  final String id;
  final String title;
  final String type;
  final String url;

  factory GroupResource.fromJson(Map<String, dynamic> json) {
    return GroupResource(
      id: (json['id'] as String? ?? '').trim(),
      title: (json['title'] as String? ?? '').trim(),
      type: (json['type'] as String? ?? '').trim(),
      url: (json['url'] as String? ?? '').trim(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'type': type,
      'url': url,
    };
  }
}

class GroupTimelineEntry {
  const GroupTimelineEntry({
    required this.label,
    this.occursAt,
    this.description,
  });

  final String label;
  final DateTime? occursAt;
  final String? description;

  factory GroupTimelineEntry.fromJson(Map<String, dynamic> json) {
    return GroupTimelineEntry(
      label: (json['label'] as String? ?? '').trim(),
      occursAt: DateTime.tryParse(json['occursAt'] as String? ?? ''),
      description: (json['description'] as String?)?.trim().isEmpty ?? true
          ? null
          : (json['description'] as String).trim(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'label': label,
      if (occursAt != null) 'occursAt': occursAt!.toIso8601String(),
      if (description != null) 'description': description,
    };
  }
}

int _asInt(dynamic value, [int fallback = 0]) {
  if (value is int) {
    return value;
  }
  if (value is num) {
    return value.toInt();
  }
  if (value is String) {
    return int.tryParse(value) ?? fallback;
  }
  return fallback;
}

double _asDouble(dynamic value, [double fallback = 0]) {
  if (value is double) {
    return value;
  }
  if (value is num) {
    return value.toDouble();
  }
  if (value is String) {
    return double.tryParse(value) ?? fallback;
  }
  return fallback;
}

bool _asBool(dynamic value, [bool fallback = false]) {
  if (value is bool) {
    return value;
  }
  if (value is num) {
    return value != 0;
  }
  if (value is String) {
    final normalized = value.toLowerCase().trim();
    if (['1', 'true', 'yes', 'on', 'enabled'].contains(normalized)) {
      return true;
    }
    if (['0', 'false', 'no', 'off', 'disabled'].contains(normalized)) {
      return false;
    }
  }
  return fallback;
}
