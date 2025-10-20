import 'package:equatable/equatable.dart';

enum CreationKind {
  cv,
  coverLetter,
  gig,
  project,
  volunteering,
  experience,
  mentorship,
}

extension CreationKindMetadata on CreationKind {
  String get label {
    switch (this) {
      case CreationKind.cv:
        return 'CV';
      case CreationKind.coverLetter:
        return 'Cover letter';
      case CreationKind.gig:
        return 'Gig offering';
      case CreationKind.project:
        return 'Project brief';
      case CreationKind.volunteering:
        return 'Volunteering mission';
      case CreationKind.experience:
        return 'Experience launchpad';
      case CreationKind.mentorship:
        return 'Mentorship offering';
    }
  }

  String get description {
    switch (this) {
      case CreationKind.cv:
        return 'Craft multi-format resumes ready for enterprise export.';
      case CreationKind.coverLetter:
        return 'Generate tailored outreach letters with tracked variants.';
      case CreationKind.gig:
        return 'Package specialist services with clear deliverables and pricing.';
      case CreationKind.project:
        return 'Launch multi-disciplinary collaborations with transparent scopes.';
      case CreationKind.volunteering:
        return 'Mobilise community missions and volunteer opportunities.';
      case CreationKind.experience:
        return 'Design Experience Launchpad programmes and cohort journeys.';
      case CreationKind.mentorship:
        return 'Offer mentorship tracks with scheduled rituals and outcomes.';
    }
  }

  String get apiValue => name.replaceAll(RegExp(r'([A-Z])'), (match) => '_${match.group(0)!.toLowerCase()}');
}

CreationKind parseCreationKind(String value) {
  final normalised = value.trim().toLowerCase().replaceAll('-', '_');
  return CreationKind.values.firstWhere(
    (kind) => kind.name == normalised || kind.apiValue == normalised,
    orElse: () => CreationKind.project,
  );
}

class CreationBrief extends Equatable {
  const CreationBrief({
    required this.id,
    required this.kind,
    required this.title,
    required this.summary,
    required this.status,
    required this.updatedAt,
    this.metadata = const <String, dynamic>{},
  });

  final String id;
  final CreationKind kind;
  final String title;
  final String summary;
  final String status;
  final DateTime updatedAt;
  final Map<String, dynamic> metadata;

  factory CreationBrief.fromJson(Map<String, dynamic> json) {
    final details = json['details'] is Map<String, dynamic>
        ? Map<String, dynamic>.from(json['details'] as Map<String, dynamic>)
        : const <String, dynamic>{};
    return CreationBrief(
      id: '${json['id'] ?? json['uuid'] ?? ''}',
      kind: parseCreationKind(json['kind'] as String? ?? json['type'] as String? ?? 'project'),
      title: (json['title'] as String? ?? json['name'] as String? ?? '').trim(),
      summary: (json['summary'] as String? ?? json['description'] as String? ?? '').trim(),
      status: (json['status'] as String? ?? 'draft').trim(),
      updatedAt: DateTime.tryParse(json['updatedAt'] as String? ?? json['updated_at'] as String? ?? '') ?? DateTime.now(),
      metadata: {
        ...details,
        'attachments': json['attachments'],
        'audience': json['audience'],
        'surface': json['surface'],
      },
    );
  }

  CreationBrief copyWith({
    String? title,
    String? summary,
    String? status,
    DateTime? updatedAt,
    Map<String, dynamic>? metadata,
  }) {
    return CreationBrief(
      id: id,
      kind: kind,
      title: title ?? this.title,
      summary: summary ?? this.summary,
      status: status ?? this.status,
      updatedAt: updatedAt ?? this.updatedAt,
      metadata: metadata ?? this.metadata,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'kind': kind.apiValue,
      'title': title,
      'summary': summary,
      'status': status,
      'updatedAt': updatedAt.toIso8601String(),
      'metadata': metadata,
    };
  }

  @override
  List<Object?> get props => [id, kind, title, summary, status, updatedAt];
}

class CreationBriefDraft {
  const CreationBriefDraft({
    required this.kind,
    required this.title,
    required this.summary,
    this.audience,
    this.objective,
    this.attachments = const <String>[],
  });

  final CreationKind kind;
  final String title;
  final String summary;
  final String? audience;
  final String? objective;
  final List<String> attachments;

  Map<String, dynamic> toJson() {
    return {
      'kind': kind.apiValue,
      'title': title.trim(),
      'summary': summary.trim(),
      if (audience != null && audience!.trim().isNotEmpty) 'audience': audience!.trim(),
      if (objective != null && objective!.trim().isNotEmpty) 'objective': objective!.trim(),
      if (attachments.isNotEmpty) 'attachments': attachments,
    };
  }
}
