class FeedAuthor {
  const FeedAuthor({
    required this.name,
    this.headline,
  });

  final String name;
  final String? headline;

  FeedAuthor copyWith({
    String? name,
    String? headline,
  }) {
    return FeedAuthor(
      name: name ?? this.name,
      headline: headline ?? this.headline,
    );
  }

  factory FeedAuthor.fromJson(Map<String, dynamic>? json) {
    if (json == null) {
      return const FeedAuthor(name: 'Gigvora member');
    }

    if (json['name'] is String) {
      final name = (json['name'] as String).trim();
      final headline = json['headline'] as String? ?? json['title'] as String?;
      return FeedAuthor(
        name: name.isEmpty ? 'Gigvora member' : name,
        headline: (headline?.trim().isEmpty ?? true) ? null : headline,
      );
    }

    final firstName = json['firstName'] as String? ?? '';
    final lastName = json['lastName'] as String? ?? '';
    final profile = json['Profile'] ?? json['profile'];
    final headline = profile is Map<String, dynamic>
        ? (profile['headline'] as String? ?? profile['bio'] as String?)
        : null;
    final name = [firstName, lastName].where((value) => value.trim().isNotEmpty).join(' ');
    return FeedAuthor(
      name: name.isEmpty ? 'Gigvora member' : name,
      headline: (headline?.trim().isEmpty ?? true) ? null : headline,
    );
  }
}

enum FeedPostType {
  update,
  media,
  job,
  gig,
  project,
  volunteering,
  launchpad,
  news,
}

extension FeedPostTypeMetadata on FeedPostType {
  String get label {
    return switch (this) {
      FeedPostType.update => 'Update',
      FeedPostType.media => 'Media',
      FeedPostType.job => 'Job',
      FeedPostType.gig => 'Gig',
      FeedPostType.project => 'Project',
      FeedPostType.volunteering => 'Volunteering',
      FeedPostType.launchpad => 'Launchpad',
      FeedPostType.news => 'News',
    };
  }

  String get composerDescription {
    return switch (this) {
      FeedPostType.update => 'Share wins, milestones, and shout-outs with your network.',
      FeedPostType.media => 'Upload demos, decks, and reels directly to your feed.',
      FeedPostType.job => 'List a permanent, contract, or interim opportunity.',
      FeedPostType.gig => 'Promote a specialist engagement with clear deliverables.',
      FeedPostType.project => 'Rally collaborators around a multi-disciplinary brief.',
      FeedPostType.volunteering => 'Mobilise talent towards purpose-led community missions.',
      FeedPostType.launchpad => 'Showcase cohort-based Experience Launchpad programmes.',
      FeedPostType.news => 'Gigvora-curated headlines sourced from verified publications.',
    };
  }

  String get analyticsValue => name;
}

class FeedPost {
  const FeedPost({
    required this.id,
    required this.content,
    required this.createdAt,
    required this.author,
    this.type = FeedPostType.update,
    this.link,
    this.title,
    this.summary,
    this.imageUrl,
    this.source,
    this.publishedAt,
    this.reactionCount = 0,
    this.commentCount = 0,
    this.viewerHasReacted = false,
    this.isLocal = false,
  });

  final String id;
  final String content;
  final DateTime createdAt;
  final FeedAuthor author;
  final FeedPostType type;
  final String? link;
  final String? title;
  final String? summary;
  final String? imageUrl;
  final String? source;
  final DateTime? publishedAt;
  final int reactionCount;
  final int commentCount;
  final bool viewerHasReacted;
  final bool isLocal;

  FeedPost copyWith({
    String? id,
    String? content,
    DateTime? createdAt,
    FeedAuthor? author,
    FeedPostType? type,
    String? link,
    String? title,
    String? summary,
    String? imageUrl,
    String? source,
    DateTime? publishedAt,
    int? reactionCount,
    int? commentCount,
    bool? viewerHasReacted,
    bool? isLocal,
  }) {
    return FeedPost(
      id: id ?? this.id,
      content: content ?? this.content,
      createdAt: createdAt ?? this.createdAt,
      author: author ?? this.author,
      type: type ?? this.type,
      link: link ?? this.link,
      title: title ?? this.title,
      summary: summary ?? this.summary,
      imageUrl: imageUrl ?? this.imageUrl,
      source: source ?? this.source,
      publishedAt: publishedAt ?? this.publishedAt,
      reactionCount: reactionCount ?? this.reactionCount,
      commentCount: commentCount ?? this.commentCount,
      viewerHasReacted: viewerHasReacted ?? this.viewerHasReacted,
      isLocal: isLocal ?? this.isLocal,
    );
  }

  factory FeedPost.fromJson(Map<String, dynamic> json) {
    final user = json['User'] ?? json['user'];
    final authorJson = json['author'];
    FeedAuthor author;
    if (authorJson is Map<String, dynamic>) {
      author = FeedAuthor.fromJson(Map<String, dynamic>.from(authorJson));
    } else {
      author = FeedAuthor.fromJson(user is Map<String, dynamic> ? Map<String, dynamic>.from(user) : null);
    }
    final reactionCount = _parseCount(
      json['reactionCount'] ??
          (json['reactions'] is Map ? (json['reactions'] as Map)['likes'] : null) ??
          json['likes'] ??
          (json['metrics'] is Map ? (json['metrics'] as Map)['reactions'] : null),
    );
    final commentCount = _parseCount(
      json['commentCount'] ??
          (json['comments'] is Map ? _extractFirstMetric(json['comments'] as Map) : null) ??
          json['comments'],
    );
    final reactions = json['reactions'];
    final viewerReacted = reactions is Map ? reactions['viewerHasReacted'] == true : false;

    return FeedPost(
      id: '${json['id'] ?? json['uuid'] ?? json['postId'] ?? DateTime.now().millisecondsSinceEpoch}',
      content: json['content'] as String? ?? json['message'] as String? ?? '',
      createdAt:
          DateTime.tryParse(json['createdAt'] as String? ?? json['created_at'] as String? ?? '') ?? DateTime.now(),
      author: author,
      type: _parseType(json['type'] ?? json['category'] ?? json['opportunityType']),
      link: _parseLink(json),
      title: _parseString(json['title'] ?? json['headline']),
      summary: _parseString(json['summary'] ?? json['content']),
      imageUrl: _parseString(json['imageUrl'] ?? json['imageURL'] ?? json['mediaUrl']),
      source: _parseString(json['source'] ?? json['publisher']),
      publishedAt: _parseDate(json['publishedAt']),
      reactionCount: reactionCount,
      commentCount: commentCount,
      viewerHasReacted: viewerReacted,
      isLocal: false,
    );
  }
}

FeedPostType _parseType(dynamic raw) {
  if (raw is FeedPostType) {
    return raw;
  }
  final value = raw is String ? raw.toLowerCase() : '';
  return switch (value) {
    'media' => FeedPostType.media,
    'job' || 'jobs' => FeedPostType.job,
    'gig' || 'gigs' => FeedPostType.gig,
    'project' || 'projects' => FeedPostType.project,
    'volunteering' || 'volunteer' => FeedPostType.volunteering,
    'launchpad' => FeedPostType.launchpad,
    'news' => FeedPostType.news,
    _ => FeedPostType.update,
  };
}

String? _parseLink(Map<String, dynamic> json) {
  final possibleKeys = [
    'link',
    'url',
    'resourceUrl',
    'resourceURL',
    'attachmentUrl',
    'attachmentURL',
    'shareUrl',
  ];
  for (final key in possibleKeys) {
    final value = json[key];
    if (value is String && value.trim().isNotEmpty) {
      return value.trim();
    }
  }
  return null;
}

String? _parseString(dynamic value) {
  if (value is String) {
    final trimmed = value.trim();
    return trimmed.isEmpty ? null : trimmed;
  }
  return null;
}

DateTime? _parseDate(dynamic value) {
  if (value is String) {
    return DateTime.tryParse(value);
  }
  if (value is DateTime) {
    return value;
  }
  return null;
}

int _parseCount(dynamic value) {
  if (value is int) {
    return value;
  }
  if (value is double) {
    return value.round();
  }
  if (value is String) {
    return int.tryParse(value) ?? 0;
  }
  return 0;
}

dynamic _extractFirstMetric(Map<dynamic, dynamic> raw) {
  for (final entry in raw.entries) {
    final key = '${entry.key}'.toLowerCase();
    if (key == 'total' || key == 'count' || key == 'value') {
      return entry.value;
    }
  }
  return raw.values.isEmpty ? null : raw.values.first;
}
