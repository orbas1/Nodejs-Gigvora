class BlogPost {
  const BlogPost({
    required this.id,
    required this.title,
    required this.slug,
    required this.excerpt,
    required this.content,
    required this.category,
    required this.tags,
    required this.publishedAt,
    required this.featured,
    required this.coverImageUrl,
    required this.readingTimeMinutes,
  });

  final int id;
  final String title;
  final String slug;
  final String excerpt;
  final String content;
  final String? category;
  final List<String> tags;
  final DateTime? publishedAt;
  final bool featured;
  final String? coverImageUrl;
  final int? readingTimeMinutes;

  factory BlogPost.fromJson(Map<String, dynamic> json) {
    DateTime? parseDate(dynamic value) {
      if (value is String && value.isNotEmpty) {
        final parsed = DateTime.tryParse(value);
        return parsed;
      }
      return null;
    }

    String? parseCover(dynamic value) {
      if (value is Map<String, dynamic>) {
        return value['url'] as String?;
      }
      return null;
    }

    final tags = (json['tags'] as List<dynamic>? ?? [])
        .whereType<Map<String, dynamic>>()
        .map((tag) => tag['name'] as String?)
        .whereType<String>()
        .toList(growable: false);

    return BlogPost(
      id: json['id'] is int ? json['id'] as int : int.tryParse('${json['id']}') ?? 0,
      title: json['title'] as String? ?? 'Untitled',
      slug: json['slug'] as String? ?? '',
      excerpt: json['excerpt'] as String? ?? '',
      content: json['content'] as String? ?? '',
      category: (json['category'] as Map<String, dynamic>?)?['name'] as String?,
      tags: tags,
      publishedAt: parseDate(json['publishedAt']),
      featured: json['featured'] == true,
      coverImageUrl: parseCover(json['coverImage']),
      readingTimeMinutes: json['readingTimeMinutes'] is int
          ? json['readingTimeMinutes'] as int
          : int.tryParse('${json['readingTimeMinutes']}'),
    );
  }
}
