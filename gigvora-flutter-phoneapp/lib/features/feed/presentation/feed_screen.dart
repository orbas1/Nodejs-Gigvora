import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:gigvora_foundation/gigvora_foundation.dart';
import '../../../theme/widgets.dart';
import '../application/feed_controller.dart';
import '../data/models/feed_post.dart';

class FeedScreen extends ConsumerWidget {
  const FeedScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(feedControllerProvider);
    final controller = ref.read(feedControllerProvider.notifier);
    final posts = state.data ?? const <FeedPost>[];
    final realtimeEnabled = state.metadata['realtimeEnabled'] == true;
    final realtimeConnected = state.metadata['realtimeConnected'] == true;

    return GigvoraScaffold(
      title: 'Live Feed',
      subtitle: 'Stories from the Gigvora community',
      actions: [
        IconButton(
          onPressed: () => controller.refresh(),
          tooltip: 'Refresh feed',
          icon: const Icon(Icons.refresh),
        ),
      ],
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Wrap(
            spacing: 12,
            runSpacing: 12,
            children: [
              FilledButton.tonal(
                onPressed: () => context.push('/operations'),
                child: const Text('Gig operations'),
              ),
              OutlinedButton(
                onPressed: () => context.push('/operations?section=buy'),
                child: const Text('Buy a gig'),
              ),
              OutlinedButton(
                onPressed: () => context.push('/operations?section=post'),
                child: const Text('Post a gig'),
              ),
            ],
          ),
          const SizedBox(height: 16),
          if (state.fromCache && !state.loading)
            _StatusBanner(
              icon: Icons.offline_bolt,
              background: const Color(0xFFFEF3C7),
              foreground: const Color(0xFF92400E),
              message: 'You are viewing cached updates while we reconnect.',
            ),
          if (realtimeEnabled && realtimeConnected)
            const _StatusBanner(
              icon: Icons.bolt,
              background: Color(0xFFE0F2FE),
              foreground: Color(0xFF0369A1),
              message: 'Live updates are streaming in real-time from the community.',
            )
          else if (realtimeEnabled && !realtimeConnected && !state.fromCache)
            const _StatusBanner(
              icon: Icons.sync,
              background: Color(0xFFF3E8FF),
              foreground: Color(0xFF6B21A8),
              message: 'Reconnecting to the live feed stream…',
            ),
          if (state.hasError && !state.loading)
            _StatusBanner(
              icon: Icons.error_outline,
              background: const Color(0xFFFEE2E2),
              foreground: const Color(0xFFB91C1C),
              message: 'We couldn\'t sync the latest posts. Pull to refresh to try again.',
            ),
          if (state.lastUpdated != null)
            Padding(
              padding: const EdgeInsets.only(bottom: 16),
              child: Text(
                'Last updated ${formatRelativeTime(state.lastUpdated!)}',
                style: Theme.of(context)
                    .textTheme
                    .bodySmall
                    ?.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant),
              ),
            ),
          Expanded(
            child: RefreshIndicator(
              onRefresh: () => controller.refresh(),
              child: posts.isEmpty && state.loading
                  ? _FeedSkeleton()
                  : posts.isEmpty
                      ? ListView(
                          physics: const AlwaysScrollableScrollPhysics(),
                          children: const [
                            SizedBox(height: 80),
                            _EmptyFeedState(),
                          ],
                        )
                      : ListView.separated(
                          physics: const AlwaysScrollableScrollPhysics(),
                          itemCount: posts.length,
                          separatorBuilder: (_, __) => const SizedBox(height: 16),
                          itemBuilder: (context, index) {
                            final post = posts[index];
                            return _FeedPostCard(
                              post: post,
                              onReact: () => controller.recordReaction(post, 'react'),
                              onComment: () => controller.recordCommentIntent(post),
                              onShare: () => controller.recordShareIntent(post),
                            );
                          },
                        ),
            ),
          ),
        ],
      ),
    );
  }
}

class _FeedSkeleton extends StatelessWidget {
  const _FeedSkeleton();

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      physics: const AlwaysScrollableScrollPhysics(),
      itemCount: 4,
      itemBuilder: (context, index) {
        return Padding(
          padding: const EdgeInsets.only(bottom: 16),
          child: GigvoraCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  height: 12,
                  width: 120,
                  decoration: BoxDecoration(
                    color: const Color(0xFFE2E8F0),
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
                const SizedBox(height: 12),
                Container(
                  height: 16,
                  width: double.infinity,
                  decoration: BoxDecoration(
                    color: const Color(0xFFE2E8F0),
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
                const SizedBox(height: 8),
                Container(
                  height: 14,
                  width: MediaQuery.of(context).size.width * 0.7,
                  decoration: BoxDecoration(
                    color: const Color(0xFFE2E8F0),
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
                const SizedBox(height: 8),
                Container(
                  height: 14,
                  width: MediaQuery.of(context).size.width * 0.5,
                  decoration: BoxDecoration(
                    color: const Color(0xFFE2E8F0),
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
                const SizedBox(height: 16),
                Row(
                  children: List.generate(
                    3,
                    (_) => Padding(
                      padding: const EdgeInsets.only(right: 12),
                      child: Container(
                        height: 32,
                        width: 32,
                        decoration: BoxDecoration(
                          color: const Color(0xFFE2E8F0),
                          borderRadius: BorderRadius.circular(16),
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}

class _FeedPostCard extends StatelessWidget {
  const _FeedPostCard({
    required this.post,
    required this.onReact,
    required this.onComment,
    required this.onShare,
  });

  final FeedPost post;
  final VoidCallback onReact;
  final VoidCallback onComment;
  final VoidCallback onShare;

  @override
  Widget build(BuildContext context) {
    return GigvoraCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(post.author.headline ?? 'Marketplace community update',
                        style: Theme.of(context)
                            .textTheme
                            .labelMedium
                            ?.copyWith(color: Theme.of(context).colorScheme.primary)),
                    const SizedBox(height: 4),
                    Text(post.author.name, style: Theme.of(context).textTheme.titleMedium),
                  ],
                ),
              ),
              Text(
                formatRelativeTime(post.createdAt),
                style: Theme.of(context)
                    .textTheme
                    .bodySmall
                    ?.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            post.content,
            style: Theme.of(context).textTheme.bodyMedium,
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              IconButton(onPressed: onReact, icon: const Icon(Icons.favorite_border)),
              IconButton(onPressed: onComment, icon: const Icon(Icons.mode_comment_outlined)),
              IconButton(onPressed: onShare, icon: const Icon(Icons.share_outlined)),
            ],
          ),
        ],
      ),
    );
  }
}

class _EmptyFeedState extends StatelessWidget {
  const _EmptyFeedState();

  @override
  Widget build(BuildContext context) {
    return GigvoraCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('No live updates yet', style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 8),
          Text(
            'Follow teams and projects to personalise your feed. Pull to refresh for the latest stories.',
            style: Theme.of(context).textTheme.bodyMedium,
          ),
        ],
      ),
    );
  }
}

class _StatusBanner extends StatelessWidget {
  const _StatusBanner({
    required this.icon,
    required this.background,
    required this.foreground,
    required this.message,
  });

  final IconData icon;
  final Color background;
  final Color foreground;
  final String message;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        children: [
          Icon(icon, color: foreground),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              message,
              style: Theme.of(context)
                  .textTheme
                  .bodyMedium
                  ?.copyWith(color: foreground),
            ),
          ),
        ],
      ),
    );
  }
}
