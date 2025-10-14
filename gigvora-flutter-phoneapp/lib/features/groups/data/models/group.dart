class MemberProfile {
  const MemberProfile({
    required this.id,
    this.name,
    this.email,
    this.userType,
  });

  factory MemberProfile.fromJson(Map<String, dynamic> json) {
    return MemberProfile(
      id: json['id'] as int,
      name: json['name'] as String?,
      email: json['email'] as String?,
      userType: json['userType'] as String?,
    );
  }

  final int id;
  final String? name;
  final String? email;
  final String? userType;
}

class GroupMember {
  const GroupMember({
    required this.id,
    required this.userId,
    required this.role,
    required this.status,
    this.joinedAt,
    this.notes,
    this.profile,
  });

  factory GroupMember.fromJson(Map<String, dynamic> json) {
    return GroupMember(
      id: json['id'] as int,
      userId: json['userId'] as int,
      role: json['role'] as String? ?? 'member',
      status: json['status'] as String? ?? 'pending',
      joinedAt: json['joinedAt'] != null ? DateTime.tryParse(json['joinedAt'] as String) : null,
      notes: json['notes'] as String?,
      profile: json['member'] is Map<String, dynamic>
          ? MemberProfile.fromJson(Map<String, dynamic>.from(json['member'] as Map))
          : null,
    );
  }

  final int id;
  final int userId;
  final String role;
  final String status;
  final DateTime? joinedAt;
  final String? notes;
  final MemberProfile? profile;
}

class GroupMetrics {
  const GroupMetrics({
    required this.totalMembers,
    required this.activeMembers,
    required this.pendingMembers,
    required this.suspendedMembers,
    required this.acceptanceRate,
    this.lastMemberJoinedAt,
  });

  factory GroupMetrics.fromJson(Map<String, dynamic>? json) {
    if (json == null) {
      return const GroupMetrics(
        totalMembers: 0,
        activeMembers: 0,
        pendingMembers: 0,
        suspendedMembers: 0,
        acceptanceRate: 0,
      );
    }
    return GroupMetrics(
      totalMembers: (json['totalMembers'] as num?)?.toInt() ?? 0,
      activeMembers: (json['activeMembers'] as num?)?.toInt() ?? 0,
      pendingMembers: (json['pendingMembers'] as num?)?.toInt() ?? 0,
      suspendedMembers: (json['suspendedMembers'] as num?)?.toInt() ?? 0,
      acceptanceRate: (json['acceptanceRate'] as num?)?.toInt() ?? 0,
      lastMemberJoinedAt:
          json['lastMemberJoinedAt'] != null ? DateTime.tryParse(json['lastMemberJoinedAt'] as String) : null,
    );
  }

  final int totalMembers;
  final int activeMembers;
  final int pendingMembers;
  final int suspendedMembers;
  final int acceptanceRate;
  final DateTime? lastMemberJoinedAt;
}

class GroupSummary {
  const GroupSummary({
    required this.id,
    required this.name,
    required this.slug,
    required this.visibility,
    required this.memberPolicy,
    required this.avatarColor,
    this.description,
    this.bannerImageUrl,
    this.metrics = const GroupMetrics(
      totalMembers: 0,
      activeMembers: 0,
      pendingMembers: 0,
      suspendedMembers: 0,
      acceptanceRate: 0,
    ),
    this.members = const <GroupMember>[],
  });

  factory GroupSummary.fromJson(Map<String, dynamic> json) {
    final membersRaw = json['members'];
    return GroupSummary(
      id: json['id'] as int,
      name: json['name'] as String,
      slug: json['slug'] as String? ?? '',
      visibility: json['visibility'] as String? ?? 'public',
      memberPolicy: json['memberPolicy'] as String? ?? 'request',
      avatarColor: json['avatarColor'] as String? ?? '#2563eb',
      description: json['description'] as String?,
      bannerImageUrl: json['bannerImageUrl'] as String?,
      metrics: GroupMetrics.fromJson(json['metrics'] as Map<String, dynamic>?),
      members: membersRaw is List
          ? membersRaw
              .whereType<Map>()
              .map((member) => GroupMember.fromJson(Map<String, dynamic>.from(member)))
              .toList(growable: false)
          : const <GroupMember>[],
    );
  }

  final int id;
  final String name;
  final String slug;
  final String visibility;
  final String memberPolicy;
  final String avatarColor;
  final String? description;
  final String? bannerImageUrl;
  final GroupMetrics metrics;
  final List<GroupMember> members;
}
