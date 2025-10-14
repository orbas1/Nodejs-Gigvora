import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/blog_repository.dart';

class BlogDetailScreen extends ConsumerWidget {
  const BlogDetailScreen({super.key, required this.slug});

  final String slug;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final blogAsync = ref.watch(blogPostProvider(slug));
    return Scaffold(
      appBar: AppBar(
        title: const Text('Gigvora blog'),
      ),
      body: blogAsync.when(
        data: (post) => SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (post.category != null)
                Text(
                  post.category!,
                  style: Theme.of(context)
                      .textTheme
                      .labelSmall
                      ?.copyWith(color: Theme.of(context).colorScheme.primary, letterSpacing: 1.4),
                ),
              const SizedBox(height: 8),
              Text(
                post.title,
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w700),
              ),
              const SizedBox(height: 12),
              if (post.coverImageUrl != null)
                ClipRRect(
                  borderRadius: BorderRadius.circular(24),
                  child: Image.network(post.coverImageUrl!, fit: BoxFit.cover),
                ),
              const SizedBox(height: 16),
              Text(
                post.content,
                style: Theme.of(context).textTheme.bodyLarge,
              ),
            ],
          ),
        ),
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text('We could not load this article.'),
              const SizedBox(height: 12),
              FilledButton(
                onPressed: () => ref.refresh(blogPostProvider(slug)),
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
