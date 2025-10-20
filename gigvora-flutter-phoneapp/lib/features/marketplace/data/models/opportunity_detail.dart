import 'opportunity.dart';

String? _cleanString(dynamic value) {
  if (value is! String) {
    return null;
  }
  final trimmed = value.trim();
  return trimmed.isEmpty ? null : trimmed;
}

enum OpportunityMediaType { image, video }

OpportunityMediaType parseMediaType(String? value) {
  switch (value?.toLowerCase()) {
    case 'video':
      return OpportunityMediaType.video;
    case 'image':
    default:
      return OpportunityMediaType.image;
  }
}

class OpportunityMediaAsset {
  const OpportunityMediaAsset({
    required this.url,
    required this.type,
    this.thumbnailUrl,
    this.caption,
  });

  final String url;
  final OpportunityMediaType type;
  final String? thumbnailUrl;
  final String? caption;

  bool get isVideo => type == OpportunityMediaType.video;

  factory OpportunityMediaAsset.fromJson(Map<String, dynamic> json) {
    final url = (json['url'] as String? ?? '').trim();
    if (url.isEmpty) {
      throw ArgumentError('media url is required');
    }
    return OpportunityMediaAsset(
      url: url,
      type: parseMediaType(json['type'] as String?),
      thumbnailUrl: _cleanString(json['thumbnailUrl']),
      caption: _cleanString(json['caption']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'url': url,
      'type': type.name,
      if (thumbnailUrl != null && thumbnailUrl!.isNotEmpty) 'thumbnailUrl': thumbnailUrl,
      if (caption != null && caption!.isNotEmpty) 'caption': caption,
    };
  }
}

class OpportunityReview {
  const OpportunityReview({
    required this.reviewer,
    required this.rating,
    required this.comment,
    required this.createdAt,
  });

  final String reviewer;
  final double rating;
  final String comment;
  final DateTime createdAt;

  factory OpportunityReview.fromJson(Map<String, dynamic> json) {
    final reviewer = _cleanString(json['reviewer']) ?? 'Anonymous';
    final comment = _cleanString(json['comment']) ?? '';
    return OpportunityReview(
      reviewer: reviewer,
      rating: (json['rating'] as num?)?.toDouble() ?? 0,
      comment: comment,
      createdAt: () {
        final raw = json['createdAt'];
        if (raw is String) {
          return DateTime.tryParse(raw) ?? DateTime.now();
        }
        if (raw is int) {
          return DateTime.fromMillisecondsSinceEpoch(raw);
        }
        return DateTime.now();
      }(),
    );
  }
}

class OpportunityDetail {
  const OpportunityDetail({
    required this.id,
    required this.category,
    required this.title,
    required this.description,
    required this.summary,
    required this.location,
    required this.organization,
    required this.isRemote,
    required this.skills,
    required this.tags,
    required this.media,
    required this.reviews,
    required this.rating,
    required this.reviewCount,
    required this.posterName,
    required this.posterAvatarUrl,
    required this.ctaUrl,
    required this.budget,
    required this.duration,
    required this.employmentType,
    required this.status,
    required this.videoUrl,
    required this.publishedAt,
  });

  final String id;
  final OpportunityCategory category;
  final String title;
  final String description;
  final String? summary;
  final String? location;
  final String? organization;
  final bool isRemote;
  final List<String> skills;
  final List<String> tags;
  final List<OpportunityMediaAsset> media;
  final List<OpportunityReview> reviews;
  final double? rating;
  final int reviewCount;
  final String? posterName;
  final String? posterAvatarUrl;
  final String? ctaUrl;
  final String? budget;
  final String? duration;
  final String? employmentType;
  final String? status;
  final String? videoUrl;
  final DateTime? publishedAt;

  OpportunityDraft toDraft() {
    return OpportunityDraft(
      title: title,
      description: description,
      summary: summary,
      location: location,
      organization: organization,
      isRemote: isRemote,
      skills: skills,
      tags: tags,
      media: media,
      ctaUrl: ctaUrl,
      budget: budget,
      duration: duration,
      employmentType: employmentType,
      status: status,
      videoUrl: videoUrl,
      posterName: posterName,
      posterAvatarUrl: posterAvatarUrl,
    );
  }

  factory OpportunityDetail.fromJson(
    OpportunityCategory category,
    Map<String, dynamic> json,
  ) {
    final skills = (json['skills'] as List<dynamic>? ?? const [])
        .whereType<String>()
        .map((skill) => skill.trim())
        .where((skill) => skill.isNotEmpty)
        .toList(growable: false);
    final tags = (json['tags'] as List<dynamic>? ?? const [])
        .whereType<String>()
        .map((tag) => tag.trim())
        .where((tag) => tag.isNotEmpty)
        .toList(growable: false);
    final media = (json['media'] as List<dynamic>? ?? const [])
        .whereType<Map<String, dynamic>>()
        .map((entry) {
      try {
        return OpportunityMediaAsset.fromJson(entry);
      } catch (_) {
        return null;
      }
    }).whereType<OpportunityMediaAsset>().toList(growable: false);
    final reviews = (json['reviews'] as List<dynamic>? ?? const [])
        .whereType<Map<String, dynamic>>()
        .map((entry) {
      try {
        return OpportunityReview.fromJson(entry);
      } catch (_) {
        return null;
      }
    }).whereType<OpportunityReview>().toList(growable: false);

    return OpportunityDetail(
      id: '${json['id'] ?? json['opportunityId'] ?? ''}',
      category: category,
      title: _cleanString(json['title']) ?? '',
      description: _cleanString(json['description']) ?? '',
      summary: _cleanString(json['summary']),
      location: _cleanString(json['location']),
      organization: _cleanString(json['organization']),
      isRemote: json['isRemote'] == true,
      skills: List<String>.unmodifiable(skills),
      tags: List<String>.unmodifiable(tags),
      media: List<OpportunityMediaAsset>.unmodifiable(media),
      reviews: List<OpportunityReview>.unmodifiable(reviews),
      rating: (json['rating'] as num?)?.toDouble(),
      reviewCount: (json['reviewCount'] as num?)?.toInt() ?? reviews.length,
      posterName: _cleanString((json['poster'] as Map<String, dynamic>?)?['name'])
          ?? _cleanString(json['posterName']),
      posterAvatarUrl:
          _cleanString((json['poster'] as Map<String, dynamic>?)?['avatarUrl'])
              ?? _cleanString(json['posterAvatarUrl']),
      ctaUrl: _cleanString(json['ctaUrl']),
      budget: _cleanString(json['budget']),
      duration: _cleanString(json['duration']),
      employmentType: _cleanString(json['employmentType']),
      status: _cleanString(json['status']),
      videoUrl: _cleanString(json['videoUrl']),
      publishedAt: () {
        final raw = json['publishedAt'];
        if (raw is String) {
          return DateTime.tryParse(raw);
        }
        if (raw is int) {
          return DateTime.fromMillisecondsSinceEpoch(raw);
        }
        return null;
      }(),
    );
  }
}

class OpportunityDraft {
  const OpportunityDraft({
    required this.title,
    required this.description,
    this.summary,
    this.location,
    this.organization,
    this.isRemote = false,
    this.skills = const <String>[],
    this.tags = const <String>[],
    this.media = const <OpportunityMediaAsset>[],
    this.ctaUrl,
    this.budget,
    this.duration,
    this.employmentType,
    this.status,
    this.videoUrl,
    this.posterName,
    this.posterAvatarUrl,
  });

  final String title;
  final String description;
  final String? summary;
  final String? location;
  final String? organization;
  final bool isRemote;
  final List<String> skills;
  final List<String> tags;
  final List<OpportunityMediaAsset> media;
  final String? ctaUrl;
  final String? budget;
  final String? duration;
  final String? employmentType;
  final String? status;
  final String? videoUrl;
  final String? posterName;
  final String? posterAvatarUrl;

  Map<String, dynamic> toJson() {
    Map<String, dynamic> writeNullable(String key, String? value) {
      if (value == null) return <String, dynamic>{};
      final trimmed = value.trim();
      if (trimmed.isEmpty) return <String, dynamic>{};
      return {key: trimmed};
    }

    final payload = <String, dynamic>{
      'title': title.trim(),
      'description': description.trim(),
      ...writeNullable('summary', summary),
      ...writeNullable('location', location),
      ...writeNullable('organization', organization),
      ...writeNullable('ctaUrl', ctaUrl),
      ...writeNullable('budget', budget),
      ...writeNullable('duration', duration),
      ...writeNullable('employmentType', employmentType),
      ...writeNullable('status', status),
      if (isRemote) 'isRemote': true,
      if (skills.isNotEmpty) 'skills': skills,
      if (tags.isNotEmpty) 'tags': tags,
      if (media.isNotEmpty) 'media': media.map((asset) => asset.toJson()).toList(),
      ...writeNullable('videoUrl', videoUrl),
    };

    if (!payload.containsKey('isRemote')) {
      payload['isRemote'] = false;
    }

    final posterPayload = {
      if (posterName != null && posterName!.trim().isNotEmpty) 'name': posterName!.trim(),
      if (posterAvatarUrl != null && posterAvatarUrl!.trim().isNotEmpty)
        'avatarUrl': posterAvatarUrl!.trim(),
    };
    if (posterPayload.isNotEmpty) {
      payload['poster'] = posterPayload;
    }

    return payload;
  }
}
