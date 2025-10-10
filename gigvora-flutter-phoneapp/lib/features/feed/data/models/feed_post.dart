class FeedAuthor {
  const FeedAuthor({
    required this.name,
    this.headline,
  });

  final String name;
  final String? headline;

  factory FeedAuthor.fromJson(Map<String, dynamic>? json) {
    if (json == null) {
      return const FeedAuthor(name: 'Gigvora member');
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

class FeedPost {
  const FeedPost({
    required this.id,
    required this.content,
    required this.createdAt,
    required this.author,
  });

  final String id;
  final String content;
  final DateTime createdAt;
  final FeedAuthor author;

  factory FeedPost.fromJson(Map<String, dynamic> json) {
    final user = json['User'] ?? json['user'];
    final author = FeedAuthor.fromJson(user is Map<String, dynamic> ? Map<String, dynamic>.from(user) : null);
    return FeedPost(
      id: '${json['id']}',
      content: json['content'] as String? ?? '',
      createdAt: DateTime.tryParse(json['createdAt'] as String? ?? '') ?? DateTime.now(),
      author: author,
    );
  }
}
