import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:gigvora_foundation/gigvora_foundation.dart';
import '../../../theme/widgets.dart';
import '../../auth/application/session_controller.dart';
import '../application/feed_controller.dart';
import '../data/models/feed_post.dart';
import '../domain/feed_content_moderation.dart';

const _allowedFeedRoles = <String>{
  'user',
  'freelancer',
  'agency',
  'company',
  'headhunter',
  'mentor',
  'admin',
};

class FeedScreen extends ConsumerWidget {
  const FeedScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final sessionState = ref.watch(sessionControllerProvider);
    final session = sessionState.session;
    final isAuthenticated = sessionState.isAuthenticated;
    final hasFeedAccess =
        session != null && session.memberships.any(_allowedFeedRoles.contains);

    final state = ref.watch(feedControllerProvider);
    final controller = ref.read(feedControllerProvider.notifier);
    final posts = state.data ?? const <FeedPost>[];
    final realtimeEnabled = state.metadata['realtimeEnabled'] == true;
    final realtimeConnected = state.metadata['realtimeConnected'] == true;
    final pendingLocalPosts = state.metadata['localPostCount'] as int? ?? 0;
    final isLoading = state.loading && posts.isEmpty;

    if (!isAuthenticated) {
      return GigvoraScaffold(
        title: 'Timeline',
        subtitle: 'Stories from the Gigvora community',
        body: Center(
          child: _FeedAccessCard(
            icon: Icons.lock_outline,
            title: 'Sign in to engage with the timeline',
            message:
                'Use your Gigvora credentials to view community updates, share wins, and react in real time.',
            primaryLabel: 'Sign in',
            onPrimary: () => context.go('/login'),
            secondaryLabel: 'Create account',
            onSecondary: () => context.go('/signup'),
          ),
        ),
      );
    }

    if (!hasFeedAccess) {
      return GigvoraScaffold(
        title: 'Timeline',
        subtitle: 'Stories from the Gigvora community',
        body: Center(
          child: _FeedAccessCard(
            icon: Icons.verified_user_outlined,
            title: 'Switch to an eligible workspace',
            message:
                'Timeline access is reserved for user, freelancer, agency, company, mentor, headhunter, or admin workspaces. Switch roles or request an upgrade to continue.',
            primaryLabel: 'Manage memberships',
            onPrimary: () => context.go('/home'),
            secondaryLabel: 'View dashboards',
            onSecondary: () => context.go('/home'),
            chips: _allowedFeedRoles.toList(),
          ),
        ),
      );
    }

    Future<void> openEditor(FeedPost post) {
      return showModalBottomSheet<void>(
        context: context,
        isScrollControlled: true,
        builder: (context) {
          return FeedPostEditorSheet(
            post: post,
            onSubmit: (type, content, link) async {
              await controller.updatePost(
                post,
                content: content,
                type: type,
                link: link,
              );
            },
          );
        },
      );
    }

    Future<void> removePost(FeedPost post) async {
      final confirmed = await showDialog<bool>(
        context: context,
        builder: (dialogContext) {
          return AlertDialog(
            title: const Text('Remove post'),
            content: const Text('Are you sure you want to remove this update from the timeline?'),
            actions: [
              TextButton(
                onPressed: () => Navigator.of(dialogContext).pop(false),
                child: const Text('Cancel'),
              ),
              FilledButton.tonal(
                onPressed: () => Navigator.of(dialogContext).pop(true),
                child: const Text('Remove'),
              ),
            ],
          );
        },
      );
      if (confirmed != true) {
        return;
      }
      try {
        await controller.deletePost(post);
        if (!context.mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Post removed from the timeline.')),
        );
      } catch (error) {
        if (!context.mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Unable to remove post. $error')),
        );
      }
    }

    final columnChildren = <Widget>[
      Wrap(
        spacing: 12,
        runSpacing: 12,
        children: [
          FilledButton.tonal(
            onPressed: () => context.push('/operations'),
            child: const Text('Gig operations'),
          ),
          FilledButton.tonal(
            onPressed: () => context.push('/creation-studio'),
            child: const Text('Creation studio'),
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
    ];

    if (state.fromCache && !state.loading) {
      columnChildren.add(
        _StatusBanner(
          icon: Icons.offline_bolt,
          background: const Color(0xFFFEF3C7),
          foreground: const Color(0xFF92400E),
          message: 'You are viewing cached updates while we reconnect.',
        ),
      );
      columnChildren.add(const SizedBox(height: 12));
    }

    if (realtimeEnabled && realtimeConnected) {
      columnChildren.add(
        const _StatusBanner(
          icon: Icons.bolt,
          background: Color(0xFFE0F2FE),
          foreground: Color(0xFF0369A1),
          message: 'Live updates are streaming in real-time from the community.',
        ),
      );
      columnChildren.add(const SizedBox(height: 12));
    } else if (realtimeEnabled && !realtimeConnected && !state.fromCache) {
      columnChildren.add(
        const _StatusBanner(
          icon: Icons.sync,
          background: Color(0xFFF3E8FF),
          foreground: Color(0xFF6B21A8),
          message: 'Reconnecting to the timeline stream…',
        ),
      );
      columnChildren.add(const SizedBox(height: 12));
    }

    if (state.hasError && !state.loading) {
      columnChildren.add(
        _StatusBanner(
          icon: Icons.error_outline,
          background: const Color(0xFFFEE2E2),
          foreground: const Color(0xFFB91C1C),
          message: 'We couldn\'t sync the latest posts. Pull to refresh to try again.',
        ),
      );
      columnChildren.add(const SizedBox(height: 12));
    }

    if (state.lastUpdated != null) {
      columnChildren.add(
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
      );
    }

    final listChildren = <Widget>[
      _FeedComposer(
        pendingCount: pendingLocalPosts,
        onSubmit: (payload) => controller.createLocalPost(
          content: payload.content,
          type: payload.type,
          link: payload.link,
        ),
      ),
      const SizedBox(height: 16),
      _ExplorerPromoCard(
        onOpenExplorer: () {
          controller.recordExplorerShortcut();
          context.go('/explorer');
        },
      ),
      const SizedBox(height: 16),
    ];

    if (isLoading && posts.isEmpty) {
      listChildren.add(const _FeedSkeleton());
    } else if (posts.isEmpty) {
      listChildren.add(const _EmptyFeedState());
    } else {
      for (var i = 0; i < posts.length; i++) {
        final post = posts[i];
        final authorName = post.author.name.trim().toLowerCase();
        final canManage = post.isLocal || authorName == 'you';
        listChildren.add(
          _FeedPostCard(
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
            onEdit: canManage ? (target) => openEditor(target) : null,
            onDelete: canManage ? (target) => removePost(target) : null,
          ),
        );
        if (i != posts.length - 1) {
          listChildren.add(const SizedBox(height: 16));
        }
      }
    }

    columnChildren.add(
      Expanded(
        child: RefreshIndicator(
          onRefresh: () => controller.refresh(),
          child: ListView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.only(bottom: 32),
            children: listChildren,
          ),
        ),
      ),
    );

    return GigvoraScaffold(
      title: 'Timeline',
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
        children: columnChildren,
      ),
    );
  }
}

class _FeedAccessCard extends StatelessWidget {
  const _FeedAccessCard({
    required this.icon,
    required this.title,
    required this.message,
    required this.primaryLabel,
    required this.onPrimary,
    this.secondaryLabel,
    this.onSecondary,
    this.chips,
  });

  final IconData icon;
  final String title;
  final String message;
  final String primaryLabel;
  final VoidCallback onPrimary;
  final String? secondaryLabel;
  final VoidCallback? onSecondary;
  final List<String>? chips;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final uniqueChips = (chips ?? const <String>[]).toSet().toList()..sort();

    return ConstrainedBox(
      constraints: const BoxConstraints(maxWidth: 520),
      child: GigvoraCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: colorScheme.primaryContainer,
                borderRadius: BorderRadius.circular(16),
              ),
              child: Icon(icon, color: colorScheme.onPrimaryContainer, size: 28),
            ),
            const SizedBox(height: 16),
            Text(title, style: theme.textTheme.titleMedium),
            const SizedBox(height: 8),
            Text(
              message,
              style: theme.textTheme.bodyMedium?.copyWith(
                color: colorScheme.onSurfaceVariant,
              ),
            ),
            if (uniqueChips.isNotEmpty) ...[
              const SizedBox(height: 16),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: uniqueChips
                    .map(
                      (role) {
                        final normalised = role.replaceAll('_', ' ');
                        final formatted = normalised.isNotEmpty
                            ? normalised[0].toUpperCase() + normalised.substring(1)
                            : normalised;
                        return Chip(label: Text(formatted));
                      },
                    )
                    .toList(growable: false),
              ),
            ],
            const SizedBox(height: 20),
            Row(
              children: [
                FilledButton(
                  onPressed: onPrimary,
                  child: Text(primaryLabel),
                ),
                if (secondaryLabel != null && onSecondary != null) ...[
                  const SizedBox(width: 12),
                  OutlinedButton(
                    onPressed: onSecondary,
                    child: Text(secondaryLabel!),
                  ),
                ],
              ],
            ),
          ],
        ),
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
  FeedPostType.news: _FeedTypeStyle(
    background: Color(0xFFE0F2FE),
    foreground: Color(0xFF0369A1),
    icon: Icons.article_outlined,
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
    if (_submitting) {
      return;
    }

    FeedModerationResult moderated;
    try {
      moderated = FeedContentModeration.evaluate(
        content: _contentController.text,
        summary: _contentController.text,
        link: _linkController.text,
        type: _selectedType,
      );
    } on FeedModerationException catch (error) {
      if (!mounted) {
        return;
      }
      final buffer = StringBuffer(error.message);
      if (error.reasons.isNotEmpty) {
        for (final reason in error.reasons) {
          buffer.write('\n• $reason');
        }
      }
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(buffer.toString()),
          backgroundColor: Theme.of(context).colorScheme.errorContainer,
          behavior: SnackBarBehavior.floating,
          duration: const Duration(seconds: 4),
        ),
      );
      return;
    }

    setState(() => _submitting = true);
    try {
      await widget.onSubmit(
        _FeedComposerData(
          type: _selectedType,
          content: moderated.content,
          link: moderated.link,
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
          content: Text('Your update is publishing to the timeline.'),
          duration: Duration(seconds: 3),
        ),
      );
    } catch (error) {
      if (!mounted) {
        return;
      }
      if (error is FeedModerationException) {
        final buffer = StringBuffer(error.message);
        if (error.reasons.isNotEmpty) {
          for (final reason in error.reasons) {
            buffer.write('\n• $reason');
          }
        }
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(buffer.toString()),
            backgroundColor: Theme.of(context).colorScheme.errorContainer,
            behavior: SnackBarBehavior.floating,
            duration: const Duration(seconds: 4),
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('We couldn\'t share your update. Please try again.'),
          ),
        );
      }
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
            children: FeedPostType.values.where((type) => type != FeedPostType.news).map((type) {
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
              label: Text(_submitting ? 'Publishing…' : 'Publish to timeline'),
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
    this.onEdit,
    this.onDelete,
  });

  final FeedPost post;
  final Future<void> Function(FeedPost post, bool liked) onReact;
  final Future<void> Function(FeedPost post) onComment;
  final Future<void> Function(FeedPost post) onShare;
  final Future<void> Function(FeedPost post)? onEdit;
  final Future<void> Function(FeedPost post)? onDelete;

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
    final isNews = widget.post.type == FeedPostType.news;
    final titleCandidate = isNews
        ? (widget.post.title?.trim().isNotEmpty ?? false)
            ? widget.post.title!
            : (widget.post.summary?.trim().isNotEmpty ?? false)
                ? widget.post.summary!
                : widget.post.content
        : widget.post.author.name;
    final bodyCandidate = isNews ? widget.post.summary ?? widget.post.content : widget.post.content;
    final bodyText = bodyCandidate.trim();
    final publishedAt = widget.post.publishedAt ?? widget.post.createdAt;
    final hasSource = isNews && (widget.post.source?.trim().isNotEmpty ?? false);
    final linkLabel = isNews ? 'Read full story' : null;
    final hasByline =
        isNews && widget.post.author.name.trim().isNotEmpty && widget.post.author.name.trim() != titleCandidate.trim();
    final imageUrl = widget.post.imageUrl?.trim();

    final hasManagement = widget.onEdit != null || widget.onDelete != null;

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
                        if (hasSource)
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                            decoration: BoxDecoration(
                              color: colorScheme.primary.withOpacity(0.08),
                              borderRadius: BorderRadius.circular(999),
                            ),
                            child: Text(
                              widget.post.source!,
                              style: theme.textTheme.labelSmall?.copyWith(
                                color: colorScheme.primary,
                                fontWeight: FontWeight.w700,
                                letterSpacing: 0.6,
                              ),
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Text(
                      titleCandidate,
                      style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
                    ),
                    if (!isNews && widget.post.author.headline != null)
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
                    if (isNews && widget.post.author.headline != null)
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
                    if (hasByline)
                      Padding(
                        padding: const EdgeInsets.only(top: 4),
                        child: Text(
                          'By ${widget.post.author.name}',
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: colorScheme.onSurfaceVariant,
                            fontStyle: FontStyle.italic,
                          ),
                        ),
                      ),
                  ],
                ),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  if (hasManagement)
                    PopupMenuButton<String>(
                      tooltip: 'Post actions',
                      onSelected: (value) {
                        switch (value) {
                          case 'edit':
                            if (widget.onEdit != null) {
                              unawaited(widget.onEdit!(widget.post));
                            }
                            break;
                          case 'delete':
                            if (widget.onDelete != null) {
                              unawaited(widget.onDelete!(widget.post));
                            }
                            break;
                        }
                      },
                      itemBuilder: (context) => [
                        if (widget.onEdit != null)
                          const PopupMenuItem<String>(
                            value: 'edit',
                            child: ListTile(
                              leading: Icon(Icons.edit_outlined),
                              title: Text('Edit post'),
                            ),
                          ),
                        if (widget.onDelete != null)
                          const PopupMenuItem<String>(
                            value: 'delete',
                            child: ListTile(
                              leading: Icon(Icons.delete_outline),
                              title: Text('Delete post'),
                            ),
                          ),
                      ],
                    ),
                  const SizedBox(height: 4),
                  Text(
                    formatRelativeTime(publishedAt),
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: colorScheme.onSurfaceVariant,
                    ),
                  ),
                ],
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
          if (bodyText.isNotEmpty) ...[
            const SizedBox(height: 12),
            Text(
              bodyText,
              style: theme.textTheme.bodyMedium,
            ),
          ],
          if (imageUrl != null && imageUrl.isNotEmpty) ...[
            const SizedBox(height: 12),
            ClipRRect(
              borderRadius: BorderRadius.circular(28),
              child: Container(
                decoration: BoxDecoration(
                  border: Border.all(color: colorScheme.outlineVariant),
                ),
                child: AspectRatio(
                  aspectRatio: 16 / 9,
                  child: Image.network(
                    imageUrl,
                    fit: BoxFit.cover,
                    errorBuilder: (context, error, stackTrace) {
                      return Container(
                        color: colorScheme.surfaceVariant,
                        alignment: Alignment.center,
                        child: Icon(Icons.broken_image_outlined, color: colorScheme.onSurfaceVariant),
                      );
                    },
                  ),
                ),
              ),
            ),
          ],
          if (widget.post.link != null) ...[
            const SizedBox(height: 12),
            _FeedLinkButton(
              link: widget.post.link!,
              label: linkLabel,
            ),
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
  const _FeedLinkButton({required this.link, this.label});

  final String link;
  final String? label;

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
        label ?? link,
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

class FeedPostEditorSheet extends StatefulWidget {
  const FeedPostEditorSheet({required this.post, required this.onSubmit, super.key});

  final FeedPost post;
  final Future<void> Function(FeedPostType type, String content, String? link) onSubmit;

  @override
  State<FeedPostEditorSheet> createState() => _FeedPostEditorSheetState();
}

class _FeedPostEditorSheetState extends State<FeedPostEditorSheet> {
  late FeedPostType _selectedType;
  late final TextEditingController _contentController;
  late final TextEditingController _linkController;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    _selectedType = widget.post.type;
    _contentController = TextEditingController(text: widget.post.content);
    _linkController = TextEditingController(text: widget.post.link ?? '');
  }

  @override
  void dispose() {
    _contentController.dispose();
    _linkController.dispose();
    super.dispose();
  }

  Future<void> _handleSubmit() async {
    if (_saving) {
      return;
    }
    FeedModerationResult moderated;
    try {
      moderated = FeedContentModeration.evaluate(
        content: _contentController.text,
        summary: _contentController.text,
        link: _linkController.text,
        type: _selectedType,
      );
    } on FeedModerationException catch (error) {
      if (!mounted) return;
      final buffer = StringBuffer(error.message);
      if (error.reasons.isNotEmpty) {
        for (final reason in error.reasons) {
          buffer.write('\n• $reason');
        }
      }
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(buffer.toString()),
          backgroundColor: Theme.of(context).colorScheme.errorContainer,
        ),
      );
      return;
    }

    setState(() => _saving = true);
    try {
      await widget.onSubmit(_selectedType, moderated.content, moderated.link);
      if (!mounted) return;
      Navigator.of(context).maybePop();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Post updated.')),
      );
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Unable to update post. $error')),
      );
    } finally {
      if (mounted) {
        setState(() => _saving = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    return SafeArea(
      child: Padding(
        padding: EdgeInsets.only(
          left: 24,
          right: 24,
          top: 24,
          bottom: MediaQuery.of(context).viewInsets.bottom + 24,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Edit timeline post', style: theme.textTheme.titleLarge),
            const SizedBox(height: 4),
            Text(
              'Update the content, category, or link attached to this update.',
              style: theme.textTheme.bodySmall?.copyWith(color: colorScheme.onSurfaceVariant),
            ),
            const SizedBox(height: 20),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: FeedPostType.values
                  .where((type) => type != FeedPostType.news)
                  .map(
                    (type) => ChoiceChip(
                      label: Text(type.label),
                      selected: _selectedType == type,
                      onSelected: (_) => setState(() => _selectedType = type),
                    ),
                  )
                  .toList(),
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _contentController,
              maxLines: 5,
              minLines: 3,
              decoration: const InputDecoration(
                labelText: 'Post content',
                hintText: 'Share context, wins, or opportunities with your network.',
              ),
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _linkController,
              decoration: const InputDecoration(
                labelText: 'Attachment link',
                hintText: 'https://…',
              ),
            ),
            const SizedBox(height: 20),
            FilledButton.icon(
              onPressed: _saving ? null : _handleSubmit,
              icon: _saving
                  ? const SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Icon(Icons.check),
              label: Text(_saving ? 'Saving…' : 'Save changes'),
            ),
          ],
        ),
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
