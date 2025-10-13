import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:gigvora_foundation/gigvora_foundation.dart';
import 'package:go_router/go_router.dart';
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
    final pendingLocalPosts = state.metadata['localPostCount'] as int? ?? 0;
    final isLoading = state.loading && posts.isEmpty;

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
                  ? const _FeedSkeleton()
                  : ListView(
                      physics: const AlwaysScrollableScrollPhysics(),
                      children: [
                        _ExplorerPromoCard(
                          onOpenExplorer: () {
                            controller.recordExplorerShortcut();
                            context.go('/explorer');
                          },
                        ),
                        const SizedBox(height: 16),
                        if (posts.isEmpty)
                          const _EmptyFeedState()
                        else
                          ...[for (var i = 0; i < posts.length; i++) ...[
                            _FeedPostCard(
                              post: posts[i],
                              onReact: () => controller.recordReaction(posts[i], 'react'),
                              onComment: () => controller.recordCommentIntent(posts[i]),
                              onShare: () => controller.recordShareIntent(posts[i]),
                            ),
                            if (i != posts.length - 1) const SizedBox(height: 16),
                          ]],
                      ],
              child: isLoading
                  ? const _FeedSkeleton()
                  : ListView.separated(
                      physics: const AlwaysScrollableScrollPhysics(),
                      padding: const EdgeInsets.only(bottom: 32),
                      itemCount: posts.isEmpty ? 2 : posts.length + 1,
                      separatorBuilder: (_, __) => const SizedBox(height: 16),
                      itemBuilder: (context, index) {
                        if (index == 0) {
                          return _FeedComposer(
                            pendingCount: pendingLocalPosts,
                            onSubmit: (payload) => controller.createLocalPost(
                              content: payload.content,
                              type: payload.type,
                              link: payload.link,
                            ),
                          );
                        }

                        if (posts.isEmpty) {
                          return const _EmptyFeedState();
                        }

                        final post = posts[index - 1];
                        return _FeedPostCard(
                          post: post,
                          onReact: (target, liked) => controller.recordReaction(
                            target,
                            liked ? 'like' : 'unlike',
                          ),
                          onComment: (target) {
                            unawaited(controller.recordCommentIntent(target));
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text('Commenting from mobile is coming soon.'),
                                duration: Duration(seconds: 3),
                              ),
                            );
                          },
                          onShare: (target) {
                            unawaited(controller.recordShareIntent(target));
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text('Share integrations are coming soon.'),
                                duration: Duration(seconds: 3),
                              ),
                            );
                          },
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

const Map<FeedPostType, _FeedTypeStyle> _feedTypeStyles = {
  FeedPostType.update: _FeedTypeStyle(
    background: Color(0xFFE2E8F0),
    foreground: Color(0xFF1E293B),
    icon: Icons.campaign_outlined,
  ),
  FeedPostType.media: _FeedTypeStyle(
    background: Color(0xFFE0E7FF),
    foreground: Color(0xFF3730A3),
    icon: Icons.photo_outlined,
  ),
  FeedPostType.job: _FeedTypeStyle(
    background: Color(0xFFD1FAE5),
    foreground: Color(0xFF047857),
    icon: Icons.work_outline,
  ),
  FeedPostType.gig: _FeedTypeStyle(
    background: Color(0xFFFFEDD5),
    foreground: Color(0xFFB45309),
    icon: Icons.auto_graph,
  ),
  FeedPostType.project: _FeedTypeStyle(
    background: Color(0xFFDBEAFE),
    foreground: Color(0xFF1D4ED8),
    icon: Icons.groups_outlined,
  ),
  FeedPostType.volunteering: _FeedTypeStyle(
    background: Color(0xFFFEE2E2),
    foreground: Color(0xFFB91C1C),
    icon: Icons.volunteer_activism_outlined,
  ),
  FeedPostType.launchpad: _FeedTypeStyle(
    background: Color(0xFFEDE9FE),
    foreground: Color(0xFF6D28D9),
    icon: Icons.rocket_launch_outlined,
  ),
};

typedef _FeedComposerSubmit = Future<void> Function(_FeedComposerData data);

class _FeedComposerData {
  const _FeedComposerData({
    required this.type,
    required this.content,
    this.link,
  });

  final FeedPostType type;
  final String content;
  final String? link;
}

class _FeedComposer extends StatefulWidget {
  const _FeedComposer({
    required this.onSubmit,
    this.pendingCount = 0,
  });

  final _FeedComposerSubmit onSubmit;
  final int pendingCount;

  @override
  State<_FeedComposer> createState() => _FeedComposerState();
}

class _FeedComposerState extends State<_FeedComposer> {
  late FeedPostType _selectedType;
  late final TextEditingController _contentController;
  late final TextEditingController _linkController;
  bool _submitting = false;

  @override
  void initState() {
    super.initState();
    _selectedType = FeedPostType.update;
    _contentController = TextEditingController();
    _linkController = TextEditingController();
  }

  @override
  void dispose() {
    _contentController.dispose();
    _linkController.dispose();
    super.dispose();
  }

  Future<void> _handleSubmit() async {
    final content = _contentController.text.trim();
    if (content.isEmpty || _submitting) {
      return;
    }

    final link = _linkController.text.trim();
    setState(() => _submitting = true);
    try {
      await widget.onSubmit(
        _FeedComposerData(
          type: _selectedType,
          content: content,
          link: link.isEmpty ? null : link,
        ),
      );
      if (!mounted) {
        return;
      }
      FocusScope.of(context).unfocus();
      _contentController.clear();
      _linkController.clear();
      setState(() => _selectedType = FeedPostType.update);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Your update is publishing to the live feed.'),
          duration: Duration(seconds: 3),
        ),
      );
    } catch (_) {
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('We couldn\'t share your update. Please try again.'),
        ),
      );
    } finally {
      if (mounted) {
        setState(() => _submitting = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final style = _feedTypeStyles[_selectedType] ?? _feedTypeStyles[FeedPostType.update]!;

    return GigvoraCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(style.icon, color: style.foreground),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Share with your network',
                      style: theme.textTheme.titleMedium,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Updates appear instantly for connections, followers, and collaborators.',
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: colorScheme.onSurfaceVariant,
                      ),
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: const Color(0xFFDCFCE7),
                  borderRadius: BorderRadius.circular(999),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: const [
                    Icon(Icons.bolt, size: 16, color: Color(0xFF047857)),
                    SizedBox(width: 6),
                    Text(
                      'Live',
                      style: TextStyle(
                        fontWeight: FontWeight.w600,
                        color: Color(0xFF047857),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          if (widget.pendingCount > 0) ...[
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              decoration: BoxDecoration(
                color: const Color(0xFFFDF4FF),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Text(
                widget.pendingCount == 1
                    ? '1 local update is publishing to the community feed.'
                    : '${widget.pendingCount} local updates are publishing to the community feed.',
                style: theme.textTheme.bodySmall?.copyWith(color: const Color(0xFF6B21A8)),
              ),
            ),
          ],
          const SizedBox(height: 16),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: FeedPostType.values.map((type) {
              final optionStyle = _feedTypeStyles[type] ?? _feedTypeStyles[FeedPostType.update]!;
              final selected = type == _selectedType;
              return ChoiceChip(
                showCheckmark: false,
                selected: selected,
                onSelected: (_) => setState(() => _selectedType = type),
                label: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(optionStyle.icon, size: 18, color: selected ? optionStyle.foreground : colorScheme.onSurfaceVariant),
                    const SizedBox(width: 6),
                    Text(type.label),
                  ],
                ),
                backgroundColor: colorScheme.surfaceVariant.withOpacity(0.35),
                selectedColor: optionStyle.background,
                labelStyle: theme.textTheme.labelMedium?.copyWith(
                  color: selected ? optionStyle.foreground : colorScheme.onSurface,
                  fontWeight: FontWeight.w600,
                ),
              );
            }).toList(),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _contentController,
            maxLines: 4,
            decoration: InputDecoration(
              hintText: 'Tell your network about ${_selectedType.label.toLowerCase()}…',
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(20)),
            ),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _linkController,
            decoration: InputDecoration(
              labelText: 'Attach a resource (link, deck, or listing URL)',
              hintText: 'https://',
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(20)),
            ),
          ),
          const SizedBox(height: 12),
          Text(
            _selectedType.composerDescription,
            style: theme.textTheme.bodySmall?.copyWith(color: colorScheme.onSurfaceVariant),
          ),
          const SizedBox(height: 16),
          Align(
            alignment: Alignment.centerRight,
            child: FilledButton.icon(
              onPressed: _submitting ? null : _handleSubmit,
              icon: const Icon(Icons.send_rounded),
              label: Text(_submitting ? 'Publishing…' : 'Publish to live feed'),
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
    return ListView.separated(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.only(bottom: 32),
      itemCount: 4,
      separatorBuilder: (_, __) => const SizedBox(height: 16),
      itemBuilder: (context, index) {
        if (index == 0) {
          return const _ComposerSkeleton();
        }
        return const _PostSkeleton();
      },
    );
  }
}

class _ComposerSkeleton extends StatelessWidget {
  const _ComposerSkeleton();

  @override
  Widget build(BuildContext context) {
    return GigvoraCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            height: 18,
            width: 160,
            decoration: BoxDecoration(
              color: const Color(0xFFE2E8F0),
              borderRadius: BorderRadius.circular(8),
            ),
          ),
          const SizedBox(height: 12),
          Container(
            height: 44,
            decoration: BoxDecoration(
              color: const Color(0xFFE2E8F0),
              borderRadius: BorderRadius.circular(24),
            ),
          ),
          const SizedBox(height: 12),
          Container(
            height: 96,
            decoration: BoxDecoration(
              color: const Color(0xFFE2E8F0),
              borderRadius: BorderRadius.circular(24),
            ),
          ),
          const SizedBox(height: 12),
          Container(
            height: 44,
            decoration: BoxDecoration(
              color: const Color(0xFFE2E8F0),
              borderRadius: BorderRadius.circular(24),
            ),
          ),
          const SizedBox(height: 16),
          Align(
            alignment: Alignment.centerRight,
            child: Container(
              height: 40,
              width: 140,
              decoration: BoxDecoration(
                color: const Color(0xFFE2E8F0),
                borderRadius: BorderRadius.circular(20),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _PostSkeleton extends StatelessWidget {
  const _PostSkeleton();

  @override
  Widget build(BuildContext context) {
    final width = MediaQuery.of(context).size.width;
    return GigvoraCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            height: 14,
            width: 120,
            decoration: BoxDecoration(
              color: const Color(0xFFE2E8F0),
              borderRadius: BorderRadius.circular(8),
            ),
          ),
          const SizedBox(height: 12),
          Container(
            height: 20,
            width: width * 0.6,
            decoration: BoxDecoration(
              color: const Color(0xFFE2E8F0),
              borderRadius: BorderRadius.circular(10),
            ),
          ),
          const SizedBox(height: 8),
          Container(
            height: 18,
            width: width * 0.75,
            decoration: BoxDecoration(
              color: const Color(0xFFE2E8F0),
              borderRadius: BorderRadius.circular(10),
            ),
          ),
          const SizedBox(height: 8),
          Container(
            height: 18,
            width: width * 0.5,
            decoration: BoxDecoration(
              color: const Color(0xFFE2E8F0),
              borderRadius: BorderRadius.circular(10),
            ),
          ),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: List.generate(
              3,
              (_) => Container(
                height: 32,
                width: width * 0.22,
                decoration: BoxDecoration(
                  color: const Color(0xFFE2E8F0),
                  borderRadius: BorderRadius.circular(20),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _FeedPostCard extends StatefulWidget {
  const _FeedPostCard({
    required this.post,
    required this.onReact,
    required this.onComment,
    required this.onShare,
  });

  final FeedPost post;
  final Future<void> Function(FeedPost post, bool liked) onReact;
  final Future<void> Function(FeedPost post) onComment;
  final Future<void> Function(FeedPost post) onShare;

  @override
  State<_FeedPostCard> createState() => _FeedPostCardState();
}

class _FeedPostCardState extends State<_FeedPostCard> {
  late bool _liked;
  late int _reactionCount;

  @override
  void initState() {
    super.initState();
    _syncFromWidget();
  }

  @override
  void didUpdateWidget(covariant _FeedPostCard oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.post.id != widget.post.id ||
        oldWidget.post.reactionCount != widget.post.reactionCount ||
        oldWidget.post.viewerHasReacted != widget.post.viewerHasReacted) {
      _syncFromWidget();
    }
  }

  void _syncFromWidget() {
    _liked = widget.post.viewerHasReacted;
    _reactionCount = widget.post.reactionCount;
  }

  void _handleReact() {
    final nextLiked = !_liked;
    setState(() {
      _liked = nextLiked;
      final updated = nextLiked ? _reactionCount + 1 : _reactionCount - 1;
      _reactionCount = updated.clamp(0, 1000000);
    });
    unawaited(widget.onReact(widget.post, nextLiked));
  }

  void _handleComment() {
    unawaited(widget.onComment(widget.post));
  }

  void _handleShare() {
    unawaited(widget.onShare(widget.post));
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final style = _feedTypeStyles[widget.post.type] ?? _feedTypeStyles[FeedPostType.update]!;
    final commentCount = widget.post.commentCount;

    return GigvoraCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: [
                        _TypeBadge(style: style, label: widget.post.type.label),
                        if (widget.post.isLocal) const _PendingBadge(),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Text(
                      widget.post.author.name,
                      style: theme.textTheme.titleMedium,
                    ),
                    if (widget.post.author.headline != null)
                      Padding(
                        padding: const EdgeInsets.only(top: 4),
                        child: Text(
                          widget.post.author.headline!,
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: colorScheme.primary,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                  ],
                ),
              ),
              Text(
                formatRelativeTime(widget.post.createdAt),
                style: theme.textTheme.bodySmall?.copyWith(
                  color: colorScheme.onSurfaceVariant,
                ),
              ),
            ],
          ),
          if (widget.post.isLocal) ...[
            const SizedBox(height: 8),
            Text(
              'Publishing to the Gigvora network…',
              style: theme.textTheme.bodySmall?.copyWith(color: const Color(0xFF92400E)),
            ),
          ],
          if (widget.post.content.trim().isNotEmpty) ...[
            const SizedBox(height: 12),
            Text(
              widget.post.content,
              style: theme.textTheme.bodyMedium,
            ),
          ],
          if (widget.post.link != null) ...[
            const SizedBox(height: 12),
            _FeedLinkButton(link: widget.post.link!),
          ],
          if (_reactionCount > 0 || commentCount > 0) ...[
            const SizedBox(height: 12),
            Row(
              children: [
                if (_reactionCount > 0)
                  Text(
                    '${_reactionCount == 1 ? '1 reaction' : '$_reactionCount reactions'}',
                    style: theme.textTheme.bodySmall?.copyWith(color: colorScheme.onSurfaceVariant),
                  ),
                if (_reactionCount > 0 && commentCount > 0)
                  Text(
                    ' • ',
                    style: theme.textTheme.bodySmall?.copyWith(color: colorScheme.onSurfaceVariant),
                  ),
                if (commentCount > 0)
                  Text(
                    '${commentCount == 1 ? '1 comment' : '$commentCount comments'}',
                    style: theme.textTheme.bodySmall?.copyWith(color: colorScheme.onSurfaceVariant),
                  ),
              ],
            ),
          ],
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _FeedActionButton(
                icon: _liked ? Icons.favorite : Icons.favorite_border,
                label: _reactionCount > 0 ? '$_reactionCount' : 'Appreciate',
                active: _liked,
                onPressed: _handleReact,
              ),
              _FeedActionButton(
                icon: Icons.mode_comment_outlined,
                label: commentCount > 0 ? '$commentCount' : 'Comment',
                onPressed: _handleComment,
              ),
              _FeedActionButton(
                icon: Icons.share_outlined,
                label: 'Share',
                onPressed: _handleShare,
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _FeedActionButton extends StatelessWidget {
  const _FeedActionButton({
    required this.icon,
    required this.label,
    required this.onPressed,
    this.active = false,
  });

  final IconData icon;
  final String label;
  final VoidCallback onPressed;
  final bool active;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return TextButton.icon(
      onPressed: onPressed,
      icon: Icon(icon),
      label: Text(label),
      style: TextButton.styleFrom(
        foregroundColor: active ? colorScheme.primary : colorScheme.onSurface,
        backgroundColor: active ? colorScheme.primary.withOpacity(0.08) : Colors.transparent,
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      ),
    );
  }
}

class _FeedLinkButton extends StatelessWidget {
  const _FeedLinkButton({required this.link});

  final String link;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return OutlinedButton.icon(
      onPressed: () async {
        await Clipboard.setData(ClipboardData(text: link));
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Link copied to clipboard.'),
            duration: Duration(seconds: 2),
          ),
        );
      },
      icon: const Icon(Icons.link),
      label: Text(
        link,
        overflow: TextOverflow.ellipsis,
      ),
      style: OutlinedButton.styleFrom(
        foregroundColor: theme.colorScheme.primary,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
      ),
    );
  }
}

class _TypeBadge extends StatelessWidget {
  const _TypeBadge({required this.style, required this.label});

  final _FeedTypeStyle style;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: style.background,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(style.icon, size: 16, color: style.foreground),
          const SizedBox(width: 6),
          Text(
            label,
            style: TextStyle(
              fontWeight: FontWeight.w600,
              color: style.foreground,
            ),
          ),
        ],
      ),
    );
  }
}

class _PendingBadge extends StatelessWidget {
  const _PendingBadge();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: const Color(0xFFFEF3C7),
        borderRadius: BorderRadius.circular(999),
      ),
      child: const Text(
        'Pending sync',
        style: TextStyle(
          fontWeight: FontWeight.w600,
          color: Color(0xFF92400E),
        ),
      ),
    );
  }
}

class _FeedTypeStyle {
  const _FeedTypeStyle({
    required this.background,
    required this.foreground,
    required this.icon,
  });

  final Color background;
  final Color foreground;
  final IconData icon;
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

class _ExplorerPromoCard extends StatelessWidget {
  const _ExplorerPromoCard({required this.onOpenExplorer});

  final VoidCallback onOpenExplorer;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return GigvoraCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Explorer consolidation',
            style: Theme.of(context)
                .textTheme
                .titleMedium
                ?.copyWith(color: colorScheme.primary),
          ),
          const SizedBox(height: 8),
          Text(
            'Jobs, gigs, projects, cohorts, volunteering, and talent discovery now live inside the Explorer. '
            'Use filters to pivot without leaving your flow.',
            style: Theme.of(context).textTheme.bodyMedium,
          ),
          const SizedBox(height: 12),
          Align(
            alignment: Alignment.centerLeft,
            child: ElevatedButton.icon(
              onPressed: onOpenExplorer,
              icon: const Icon(Icons.travel_explore_outlined),
              label: const Text('Open Explorer'),
              style: ElevatedButton.styleFrom(
                backgroundColor: colorScheme.primary,
                foregroundColor: colorScheme.onPrimary,
                shape: const StadiumBorder(),
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
              ),
            ),
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
