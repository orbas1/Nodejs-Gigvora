import 'feed_post.dart';

class FeedComment {
  const FeedComment({
    required this.id,
    required this.postId,
    required this.message,
    required this.author,
    required this.createdAt,
    this.updatedAt,
    this.parentId,
    this.replies = const <FeedComment>[],
  });

  final int id;
  final int postId;
  final String message;
  final FeedAuthor author;
  final DateTime createdAt;
  final DateTime? updatedAt;
  final int? parentId;
  final List<FeedComment> replies;

  FeedComment copyWith({
    int? id,
    int? postId,
    String? message,
    FeedAuthor? author,
    DateTime? createdAt,
    DateTime? updatedAt,
    int? parentId,
    List<FeedComment>? replies,
  }) {
    return FeedComment(
      id: id ?? this.id,
      postId: postId ?? this.postId,
      message: message ?? this.message,
      author: author ?? this.author,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      parentId: parentId ?? this.parentId,
      replies: replies ?? this.replies,
    );
  }

  factory FeedComment.fromJson(Map<String, dynamic> json) {
    final replies = (json['replies'] as List<dynamic>? ?? const <dynamic>[])
        .whereType<Map<String, dynamic>>()
        .map(FeedComment.fromJson)
        .toList(growable: false);

    final authorJson = json['User'] ?? json['user'] ?? json['author'];
    final author = FeedAuthor.fromJson(
      authorJson is Map<String, dynamic> ? Map<String, dynamic>.from(authorJson) : null,
    );

    final createdAtRaw = json['createdAt'] ?? json['created_at'];
    final updatedAtRaw = json['updatedAt'] ?? json['updated_at'];

    return FeedComment(
      id: json['id'] is int ? json['id'] as int : int.tryParse('${json['id']}') ?? 0,
      postId:
          json['postId'] is int ? json['postId'] as int : int.tryParse('${json['postId']}') ?? 0,
      message: (json['message'] as String?)?.trim().isNotEmpty == true
          ? (json['message'] as String).trim()
          : ((json['body'] as String?) ?? '').trim(),
      author: author,
      createdAt: DateTime.tryParse('$createdAtRaw') ?? DateTime.now(),
      updatedAt: updatedAtRaw != null ? DateTime.tryParse('$updatedAtRaw') : null,
      parentId: json['parentId'] is int
          ? json['parentId'] as int?
          : int.tryParse('${json['parentId']}'),
      replies: replies,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'postId': postId,
      'message': message,
      'author': {'name': author.name, if (author.headline != null) 'headline': author.headline},
      'createdAt': createdAt.toIso8601String(),
      if (updatedAt != null) 'updatedAt': updatedAt!.toIso8601String(),
      if (parentId != null) 'parentId': parentId,
      if (replies.isNotEmpty) 'replies': replies.map((reply) => reply.toJson()).toList(),
    };
  }
}

class FeedReactionResult {
  const FeedReactionResult({
    required this.postId,
    required this.reaction,
    required this.active,
    required this.summary,
  });

  final String postId;
  final String reaction;
  final bool active;
  final Map<String, int> summary;

  int get likeCount => summary['likes'] ?? 0;

  factory FeedReactionResult.fromJson(String postId, Map<String, dynamic> json) {
    final summaryRaw = json['summary'] as Map<String, dynamic>? ?? const <String, dynamic>{};
    final summary = <String, int>{};
    summaryRaw.forEach((key, value) {
      if (value is num) {
        summary[key] = value.toInt();
      }
    });

    return FeedReactionResult(
      postId: postId,
      reaction: (json['reaction'] as String? ?? 'like').toLowerCase(),
      active: json['active'] != false,
      summary: summary,
    );
  }
}
