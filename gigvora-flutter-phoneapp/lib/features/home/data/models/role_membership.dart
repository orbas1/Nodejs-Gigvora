import 'package:equatable/equatable.dart';

class RoleMembership extends Equatable {
  const RoleMembership({
    required this.id,
    required this.role,
    required this.label,
    this.description,
    this.permissions = const <String>[],
    this.status = 'active',
    this.isPrimary = false,
    this.isActive = false,
    this.createdAt,
    this.updatedAt,
  });

  final String id;
  final String role;
  final String label;
  final String? description;
  final List<String> permissions;
  final String status;
  final bool isPrimary;
  final bool isActive;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  factory RoleMembership.fromJson(Map<String, dynamic> json) {
    final metadata = json['metadata'];
    return RoleMembership(
      id: '${json['id'] ?? json['membershipId'] ?? json['uuid'] ?? ''}',
      role: (json['role'] as String? ?? json['type'] as String? ?? '').trim(),
      label: (json['label'] as String? ?? json['name'] as String? ?? '').trim(),
      description: (json['description'] as String?)?.trim().isEmpty ?? true
          ? null
          : (json['description'] as String).trim(),
      permissions: (json['permissions'] as List<dynamic>? ??
              (metadata is Map<String, dynamic>
                  ? metadata['permissions'] as List<dynamic>?
                  : const []))
          .whereType<String>()
          .map((value) => value.trim())
          .where((value) => value.isNotEmpty)
          .toList(growable: false),
      status: (json['status'] as String? ?? metadata is Map<String, dynamic>
              ? metadata['status'] as String?
              : null ?? 'active')
          .trim(),
      isPrimary: json['primary'] as bool? ??
          json['isPrimary'] as bool? ??
          (metadata is Map<String, dynamic> ? metadata['primary'] as bool? : null) ??
          false,
      isActive: json['active'] as bool? ??
          json['isActive'] as bool? ??
          (metadata is Map<String, dynamic> ? metadata['active'] as bool? : null) ??
          false,
      createdAt: DateTime.tryParse(json['createdAt'] as String? ??
          json['created_at'] as String? ?? ''),
      updatedAt: DateTime.tryParse(json['updatedAt'] as String? ??
          json['updated_at'] as String? ?? ''),
    );
  }

  RoleMembership copyWith({
    String? id,
    String? role,
    String? label,
    String? description,
    List<String>? permissions,
    String? status,
    bool? isPrimary,
    bool? isActive,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return RoleMembership(
      id: id ?? this.id,
      role: role ?? this.role,
      label: label ?? this.label,
      description: description ?? this.description,
      permissions: permissions ?? this.permissions,
      status: status ?? this.status,
      isPrimary: isPrimary ?? this.isPrimary,
      isActive: isActive ?? this.isActive,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'role': role,
      'label': label,
      if (description != null) 'description': description,
      'permissions': permissions,
      'status': status,
      'primary': isPrimary,
      'active': isActive,
      if (createdAt != null) 'createdAt': createdAt!.toIso8601String(),
      if (updatedAt != null) 'updatedAt': updatedAt!.toIso8601String(),
    };
  }

  @override
  List<Object?> get props => [id, role, label, status, isPrimary, isActive, permissions];
}

class RoleMembershipDraft {
  const RoleMembershipDraft({
    required this.role,
    required this.label,
    this.description,
    this.permissions = const <String>[],
    this.primary = false,
  });

  final String role;
  final String label;
  final String? description;
  final List<String> permissions;
  final bool primary;

  Map<String, dynamic> toJson() {
    return {
      'role': role,
      'label': label,
      if (description != null && description!.trim().isNotEmpty)
        'description': description,
      'permissions': permissions,
      'primary': primary,
    };
  }
}

class RoleMembershipUpdate {
  const RoleMembershipUpdate({
    this.label,
    this.description,
    this.permissions,
    this.primary,
  });

  final String? label;
  final String? description;
  final List<String>? permissions;
  final bool? primary;

  Map<String, dynamic> toJson() {
    return {
      if (label != null) 'label': label,
      if (description != null) 'description': description,
      if (permissions != null) 'permissions': permissions,
      if (primary != null) 'primary': primary,
    };
  }
}
