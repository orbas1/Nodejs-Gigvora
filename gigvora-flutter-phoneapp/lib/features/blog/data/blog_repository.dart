import 'package:gigvora_foundation/gigvora_foundation.dart';

import '../../../core/providers.dart';
import '../domain/blog_post.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class BlogRepository {
  BlogRepository(this._apiClient);

  final ApiClient _apiClient;

  Future<List<BlogPost>> fetchPosts({int page = 1, int pageSize = 6}) async {
    final response = await _apiClient.get('/blog/posts', query: {
      'page': '$page',
      'pageSize': '$pageSize',
    });

    if (response is Map<String, dynamic>) {
      final results = response['results'];
      if (results is List) {
        return results
            .whereType<Map<String, dynamic>>()
            .map(BlogPost.fromJson)
            .toList(growable: false);
      }
    }
    return const <BlogPost>[];
  }

  Future<BlogPost> fetchPost(String slug) async {
    final response = await _apiClient.get('/blog/posts/$slug');
    if (response is Map<String, dynamic>) {
      return BlogPost.fromJson(response);
    }
    throw ApiException(500, 'Blog post not found');
  }
}

final blogRepositoryProvider = Provider<BlogRepository>((ref) {
  final client = ref.watch(apiClientProvider);
  return BlogRepository(client);
});

final blogHighlightsProvider = FutureProvider.autoDispose<List<BlogPost>>((ref) async {
  final repository = ref.watch(blogRepositoryProvider);
  return repository.fetchPosts(pageSize: 3);
});

final blogFeedProvider = FutureProvider.autoDispose<List<BlogPost>>((ref) async {
  final repository = ref.watch(blogRepositoryProvider);
  return repository.fetchPosts(pageSize: 12);
});

final blogPostProvider = FutureProvider.autoDispose.family<BlogPost, String>((ref, slug) async {
  final repository = ref.watch(blogRepositoryProvider);
  return repository.fetchPost(slug);
});
