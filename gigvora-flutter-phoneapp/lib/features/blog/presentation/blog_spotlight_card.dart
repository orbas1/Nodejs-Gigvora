import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../router/routes.dart';

import '../data/blog_repository.dart';
import '../domain/blog_post.dart';

class BlogSpotlightCard extends ConsumerWidget {
  const BlogSpotlightCard({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final blogAsync = ref.watch(blogHighlightsProvider);
    return blogAsync.when(
      data: (posts) {
        if (posts.isEmpty) {
          return const SizedBox.shrink();
        }
        final heroPost = posts.first;
        final secondaryPosts = posts.skip(1).toList();
        return Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(28),
            border: Border.all(color: Theme.of(context).colorScheme.outlineVariant),
            color: Theme.of(context).colorScheme.surface,
            boxShadow: [
              BoxShadow(
                color: Theme.of(context).colorScheme.primary.withOpacity(0.05),
                blurRadius: 24,
                offset: const Offset(0, 18),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Gigvora blog',
                        style: Theme.of(context)
                            .textTheme
                            .labelSmall
                            ?.copyWith(letterSpacing: 1.4, fontWeight: FontWeight.w600, color: Theme.of(context).colorScheme.primary),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Latest stories & playbooks',
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
                      ),
                    ],
                  ),
                  TextButton(
                    onPressed: () => GoRouter.of(context).go(AppRoute.blogList.path),
                    child: const Text('View all'),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              _HeroPostCard(post: heroPost),
              if (secondaryPosts.isNotEmpty) ...[
                const SizedBox(height: 16),
                Wrap(
                  spacing: 12,
                  runSpacing: 12,
                  children: secondaryPosts
                      .map((post) => _SecondaryPostChip(
                            post: post,
                            onTap: () => GoRouter.of(context)
                                .go(AppRoute.blogDetail.location(pathParameters: {'slug': post.slug})),
                          ))
                      .toList(),
                ),
              ],
            ],
          ),
        );
      },
      loading: () => Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(28),
          color: Theme.of(context).colorScheme.surfaceVariant,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(height: 16, width: 160, decoration: BoxDecoration(color: Theme.of(context).colorScheme.outlineVariant, borderRadius: BorderRadius.circular(12))),
            const SizedBox(height: 12),
            Container(height: 24, width: 220, decoration: BoxDecoration(color: Theme.of(context).colorScheme.outlineVariant, borderRadius: BorderRadius.circular(12))),
            const SizedBox(height: 24),
            Container(height: 140, decoration: BoxDecoration(color: Theme.of(context).colorScheme.outlineVariant, borderRadius: BorderRadius.circular(24))),
          ],
        ),
      ),
      error: (error, _) => Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(28),
          border: Border.all(color: Theme.of(context).colorScheme.error.withOpacity(0.4)),
          color: Theme.of(context).colorScheme.errorContainer,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Blog unavailable',
              style: Theme.of(context)
                  .textTheme
                  .titleMedium
                  ?.copyWith(color: Theme.of(context).colorScheme.onErrorContainer, fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 8),
            Text(
              'We had trouble loading the latest posts. Check your connection or try again shortly.',
              style: Theme.of(context)
                  .textTheme
                  .bodySmall
                  ?.copyWith(color: Theme.of(context).colorScheme.onErrorContainer),
            ),
            const SizedBox(height: 12),
            OutlinedButton(
              onPressed: () => ref.refresh(blogHighlightsProvider.future),
              child: const Text('Retry'),
            ),
          ],
        ),
      ),
    );
  }
}

class _HeroPostCard extends StatelessWidget {
  const _HeroPostCard({required this.post});

  final BlogPost post;

  @override
  Widget build(BuildContext context) {
    final cover = post.coverImageUrl;
    return GestureDetector(
      onTap: () => GoRouter.of(context)
          .go(AppRoute.blogDetail.location(pathParameters: {'slug': post.slug})),
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: Theme.of(context).colorScheme.outlineVariant),
        ),
        clipBehavior: Clip.antiAlias,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (cover != null)
              AspectRatio(
                aspectRatio: 3 / 2,
                child: Image.network(cover, fit: BoxFit.cover),
              ),
            Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    post.title,
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    post.excerpt.isNotEmpty ? post.excerpt : 'Tap to read the full story.',
                    style: Theme.of(context).textTheme.bodyMedium,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _SecondaryPostChip extends StatelessWidget {
  const _SecondaryPostChip({required this.post, required this.onTap});

  final BlogPost post;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      borderRadius: BorderRadius.circular(20),
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(20),
          color: Theme.of(context).colorScheme.surfaceVariant,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            if (post.category != null)
              Text(
                post.category!,
                style: Theme.of(context)
                    .textTheme
                    .labelSmall
                    ?.copyWith(color: Theme.of(context).colorScheme.primary, letterSpacing: 1.4),
              ),
            const SizedBox(height: 6),
            Text(
              post.title,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w600),
            ),
          ],
        ),
      ),
    );
  }
}
