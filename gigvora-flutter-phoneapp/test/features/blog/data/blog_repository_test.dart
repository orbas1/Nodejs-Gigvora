import 'package:flutter_test/flutter_test.dart';

import 'package:gigvora_foundation/gigvora_foundation.dart';
import 'package:gigvora_mobile/features/blog/data/blog_repository.dart';
import 'package:gigvora_mobile/features/blog/domain/blog_post.dart';

import '../../../support/test_api_client.dart';

void main() {
  group('BlogRepository', () {
    test('fetchPosts parses paginated response and ignores malformed entries', () async {
      final client = TestApiClient(
        onGet: (path) async {
          expect(path, '/blog/posts');
          return {
            'results': [
              {
                'id': 10,
                'title': 'Crafting resilient independents',
                'slug': 'resilient-independents',
                'excerpt': 'How Gigvora crews stay resilient.',
                'content': '<p>Resilience is a system design.</p>',
                'category': {'name': 'Strategy'},
                'tags': [
                  {'name': 'growth'},
                  {'name': 'ops'},
                  {'label': 'ignored'},
                ],
                'publishedAt': '2024-01-10T12:00:00Z',
                'featured': true,
                'coverImage': {'url': 'https://cdn.example.com/cover.jpg'},
                'readingTimeMinutes': 6,
              },
              'unexpected-entry',
            ],
          };
        },
      );

      final repository = BlogRepository(client);
      final posts = await repository.fetchPosts();

      expect(posts, hasLength(1));
      final post = posts.first;
      expect(post.title, 'Crafting resilient independents');
      expect(post.slug, 'resilient-independents');
      expect(post.category, 'Strategy');
      expect(post.tags, ['growth', 'ops']);
      expect(post.coverImageUrl, 'https://cdn.example.com/cover.jpg');
      expect(post.readingTimeMinutes, 6);
    });

    test('fetchPost retrieves detail page and throws when not found', () async {
      var attempts = 0;
      final client = TestApiClient(
        onGet: (path) async {
          attempts += 1;
          if (path == '/blog/posts/insights') {
            return {
              'id': 42,
              'title': 'Network intelligence',
              'slug': 'insights',
              'excerpt': 'Preview the future of work graphs.',
              'content': '<p>Networks unlock context.</p>',
              'category': {'name': 'Product'},
              'tags': const [],
            };
          }
          return null;
        },
      );

      final repository = BlogRepository(client);
      final post = await repository.fetchPost('insights');
      expect(post, isA<BlogPost>());
      expect(post.title, 'Network intelligence');

      expect(
        () => repository.fetchPost('missing'),
        throwsA(isA<ApiException>()),
      );
      expect(attempts, 2);
    });
  });
}
