import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gigvora_foundation/gigvora_foundation.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:flutter/services.dart';

import '../../../theme/widgets.dart';
import '../../../core/providers.dart';
import '../application/job_applications_controller.dart';
import '../application/opportunity_controller.dart';
import '../data/models/job_application_record.dart';
import '../data/models/opportunity.dart';
import '../data/models/opportunity_detail.dart';
import 'opportunity_list.dart';

class JobDetailScreen extends ConsumerStatefulWidget {
  const JobDetailScreen({
    super.key,
    required this.jobId,
  });

  final String jobId;

  @override
  ConsumerState<JobDetailScreen> createState() => _JobDetailScreenState();
}

class _JobDetailScreenState extends ConsumerState<JobDetailScreen> {
  OpportunityDetail? _detail;
  bool _loading = true;
  Object? _error;

  @override
  void initState() {
    super.initState();
    _loadDetail();
  }

  Future<void> _loadDetail() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final controller = ref.read(opportunityControllerProvider(OpportunityCategory.job).notifier);
      final detail = await controller.loadDetail(widget.jobId);
      if (!mounted) return;
      setState(() {
        _detail = detail;
        _loading = false;
      });
      await ref.read(analyticsServiceProvider).track(
        'mobile_job_profile_opened',
        context: {
          'jobId': widget.jobId,
          'title': detail.title,
          'organization': detail.organization,
        },
        metadata: const {'source': 'mobile_app'},
      );
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = error;
      });
    }
  }

  Future<void> _refresh() async {
    await _loadDetail();
    await ref.read(jobApplicationsControllerProvider(widget.jobId).notifier).refresh();
  }

  Future<void> _openEditor() async {
    final detail = _detail;
    if (detail == null) return;
    final result = await showModalBottomSheet<OpportunityDetail?>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      backgroundColor: Colors.transparent,
      builder: (context) => OpportunityCrudSheet(
        category: OpportunityCategory.job,
        initialDetail: detail,
      ),
    );
    if (result != null && mounted) {
      setState(() => _detail = result);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Job listing updated successfully.')),
      );
    }
  }

  Future<void> _deleteJob() async {
    final confirmed = await showDialog<bool>(
          context: context,
          builder: (context) => AlertDialog(
            title: const Text('Archive job'),
            content: const Text(
              'Are you sure you want to archive this job? Candidates will no longer be able to apply and any in-flight campaigns will pause.',
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.of(context).pop(false),
                child: const Text('Cancel'),
              ),
              FilledButton(
                onPressed: () => Navigator.of(context).pop(true),
                style: FilledButton.styleFrom(backgroundColor: Theme.of(context).colorScheme.error),
                child: const Text('Archive'),
              ),
            ],
          ),
        ) ??
        false;
    if (!confirmed || !mounted) return;

    try {
      final controller = ref.read(opportunityControllerProvider(OpportunityCategory.job).notifier);
      await controller.deleteOpportunity(widget.jobId);
      if (!mounted) return;
      Navigator.of(context).pop();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Job archived.')),
      );
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Unable to archive job. $error')),
      );
    }
  }

  void _shareJob(OpportunityDetail detail) {
    final messenger = ScaffoldMessenger.of(context);
    final shareMessage =
        'Explore ${detail.title} at ${detail.organization ?? 'Gigvora'} · ${detail.location ?? 'Remote'}\n${detail.summary ?? detail.description}';
    messenger
      ..hideCurrentSnackBar()
      ..showSnackBar(
        SnackBar(
          content: Text('Share message copied: $shareMessage'),
          action: SnackBarAction(
            label: 'Copy',
            onPressed: () {
              Clipboard.setData(ClipboardData(text: shareMessage));
            },
          ),
        ),
      );
  }

  void _openExternalCta(OpportunityDetail detail) async {
    final url = detail.ctaUrl ?? detail.videoUrl;
    if (url == null || url.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('This job does not have an external application link configured.')),
      );
      return;
    }
    final uri = Uri.tryParse(url);
    if (uri == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Unable to open $url')),
      );
      return;
    }
    if (!await launchUrl(uri, mode: LaunchMode.externalApplication)) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Could not launch ${uri.toString()}')),
      );
    }
  }

  Future<void> _openApplicationSheet({JobApplicationRecord? record}) async {
    final result = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      backgroundColor: Colors.transparent,
      builder: (context) => _JobApplicationSheet(
        jobId: widget.jobId,
        detail: _detail,
        record: record,
      ),
    );
    if (result == true && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(record == null ? 'Application tracked.' : 'Application updated.')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final applicationsState = ref.watch(jobApplicationsControllerProvider(widget.jobId));
    final detail = _detail;
    final saving = applicationsState.metadata['saving'] == true;

    return GigvoraScaffold(
      title: detail?.title ?? 'Job profile',
      subtitle: detail != null
          ? '${detail.organization ?? 'Gigvora Network'} • ${detail.location ?? (detail.isRemote ? 'Remote' : 'Hybrid')}'
          : 'Review job profile, media, and live applications',
      actions: [
        IconButton(
          tooltip: 'Refresh job',
          onPressed: _refresh,
          icon: const Icon(Icons.refresh),
        ),
        if (detail != null)
          PopupMenuButton<_JobDetailAction>(
            onSelected: (value) {
              switch (value) {
                case _JobDetailAction.edit:
                  _openEditor();
                  break;
                case _JobDetailAction.share:
                  _shareJob(detail);
                  break;
                case _JobDetailAction.openCta:
                  _openExternalCta(detail);
                  break;
                case _JobDetailAction.delete:
                  _deleteJob();
                  break;
              }
            },
            itemBuilder: (context) => const [
              PopupMenuItem(value: _JobDetailAction.edit, child: Text('Edit job')), 
              PopupMenuItem(value: _JobDetailAction.openCta, child: Text('Open application link')), 
              PopupMenuItem(value: _JobDetailAction.share, child: Text('Share job profile')), 
              PopupMenuDivider(),
              PopupMenuItem(
                value: _JobDetailAction.delete,
                child: Text('Archive job'),
              ),
            ],
          ),
      ],
      floatingActionButton: detail == null
          ? null
          : FloatingActionButton.extended(
              onPressed: saving ? null : () => _openApplicationSheet(),
              label: Text(saving ? 'Saving…' : 'Track application'),
              icon: saving
                  ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
                  : const Icon(Icons.playlist_add),
            ),
      body: RefreshIndicator(
        onRefresh: _refresh,
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          children: [
            if (_loading)
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 48),
                child: Center(child: CircularProgressIndicator()),
              ),
            if (_error != null && !_loading)
              Padding(
                padding: const EdgeInsets.only(bottom: 24),
                child: GigvoraCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: const [
                          Icon(Icons.error_outline, color: Color(0xFFB91C1C)),
                          SizedBox(width: 12),
                          Text('We were unable to load this job profile.'),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Text(
                        'Pull to refresh or tap refresh to retry.',
                        style: Theme.of(context)
                            .textTheme
                            .bodySmall
                            ?.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant),
                      ),
                    ],
                  ),
                ),
              ),
            if (detail != null) ...[
              _JobHero(detail: detail, onOpenCta: () => _openExternalCta(detail)),
              const SizedBox(height: 20),
              _JobSnapshot(detail: detail),
              const SizedBox(height: 16),
              if ((detail.media).isNotEmpty) _JobMediaGallery(media: detail.media),
              if (detail.videoUrl != null && detail.videoUrl!.isNotEmpty) ...[
                const SizedBox(height: 16),
                _JobVideoPreview(videoUrl: detail.videoUrl!, title: detail.title, onLaunch: () => _openExternalVideo(detail.videoUrl!)),
              ],
              if ((detail.skills).isNotEmpty) ...[
                const SizedBox(height: 16),
                _JobSkills(skills: detail.skills, tags: detail.tags),
              ],
              if (detail.location != null || detail.isRemote) ...[
                const SizedBox(height: 16),
                _JobLocationCard(detail: detail),
              ],
              const SizedBox(height: 16),
              _JobPosterCard(detail: detail),
              if (detail.reviews.isNotEmpty) ...[
                const SizedBox(height: 16),
                _JobReviewSection(reviews: detail.reviews, rating: detail.rating, reviewCount: detail.reviewCount),
              ],
              const SizedBox(height: 16),
              _JobApplicationsSection(
                detail: detail,
                state: applicationsState,
                onCreate: () => _openApplicationSheet(),
                onEdit: (record) => _openApplicationSheet(record: record),
                onSchedule: (record, [step]) => _openInterviewSheet(record, step),
                onStatusChanged: (record, status) =>
                    ref.read(jobApplicationsControllerProvider(widget.jobId).notifier).updateStatus(record.id, status),
                onDelete: (record) => ref.read(jobApplicationsControllerProvider(widget.jobId).notifier).delete(record.id),
                onCancelInterview: (record, interviewId) =>
                    ref.read(jobApplicationsControllerProvider(widget.jobId).notifier).cancelInterview(record.id, interviewId),
              ),
            ],
            const SizedBox(height: 48),
          ],
        ),
      ),
    );
  }

  Future<void> _openInterviewSheet(JobApplicationRecord record, [InterviewStep? step]) async {
    final result = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      backgroundColor: Colors.transparent,
      builder: (context) => _InterviewSheet(
        jobId: widget.jobId,
        record: record,
        step: step,
      ),
    );
    if (result == true && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(step == null ? 'Interview scheduled.' : 'Interview updated.')),
      );
    }
  }

  void _openExternalVideo(String url) async {
    final uri = Uri.tryParse(url);
    if (uri == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Unable to open $url')),
      );
      return;
    }
    if (!await launchUrl(uri, mode: LaunchMode.externalApplication)) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Could not launch ${uri.toString()}')),
      );
    }
  }
}

enum _JobDetailAction { edit, share, delete, openCta }

class _JobHero extends StatelessWidget {
  const _JobHero({
    required this.detail,
    required this.onOpenCta,
  });

  final OpportunityDetail detail;
  final VoidCallback onOpenCta;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final headline = detail.summary ?? detail.description;
    final media = detail.media;
    final coverImage = media.isNotEmpty ? media.firstWhere((asset) => !asset.isVideo, orElse: () => media.first) : null;
    return GigvoraCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (coverImage != null)
            ClipRRect(
              borderRadius: BorderRadius.circular(18),
              child: AspectRatio(
                aspectRatio: 16 / 9,
                child: Stack(
                  children: [
                    Positioned.fill(
                      child: Image.network(
                        coverImage.url,
                        fit: BoxFit.cover,
                        errorBuilder: (context, _, __) => Container(
                          color: theme.colorScheme.surfaceVariant,
                          alignment: Alignment.center,
                          child: const Icon(Icons.broken_image_outlined, size: 48),
                        ),
                      ),
                    ),
                    Positioned(
                      bottom: 12,
                      right: 12,
                      child: FilledButton.tonalIcon(
                        onPressed: onOpenCta,
                        icon: const Icon(Icons.open_in_new),
                        label: const Text('Apply externally'),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          const SizedBox(height: 16),
          Wrap(
            spacing: 12,
            runSpacing: 8,
            children: [
              _PillChip(label: detail.location ?? 'Global', icon: Icons.location_on_outlined),
              if (detail.employmentType != null && detail.employmentType!.isNotEmpty)
                _PillChip(label: detail.employmentType!, icon: Icons.badge_outlined),
              _PillChip(
                label: detail.isRemote ? 'Remote friendly' : 'On-site or hybrid',
                icon: detail.isRemote ? Icons.public : Icons.apartment,
              ),
              if (detail.budget != null && detail.budget!.isNotEmpty)
                _PillChip(label: detail.budget!, icon: Icons.payments_outlined),
              if (detail.duration != null && detail.duration!.isNotEmpty)
                _PillChip(label: detail.duration!, icon: Icons.access_time),
            ],
          ),
          const SizedBox(height: 16),
          Text(headline, style: theme.textTheme.bodyLarge),
          const SizedBox(height: 12),
          Text(
            detail.description,
            style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.onSurfaceVariant),
          ),
          if (detail.publishedAt != null) ...[
            const SizedBox(height: 16),
            Row(
              children: [
                Icon(Icons.event_available, size: 18, color: theme.colorScheme.primary),
                const SizedBox(width: 8),
                Text('Published ${formatRelativeTime(detail.publishedAt!)}',
                    style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant)),
              ],
            ),
          ],
        ],
      ),
    );
  }
}

class _JobSnapshot extends StatelessWidget {
  const _JobSnapshot({required this.detail});

  final OpportunityDetail detail;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return GigvoraCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Role overview', style: theme.textTheme.titleMedium),
          const SizedBox(height: 12),
          _SnapshotTile(
            label: 'Team',
            value: detail.organization ?? 'Growth & partnerships',
            icon: Icons.people_outline,
          ),
          _SnapshotTile(
            label: 'Status',
            value: detail.status ?? 'Open to candidates',
            icon: Icons.analytics_outlined,
          ),
          if (detail.videoUrl != null && detail.videoUrl!.isNotEmpty)
            _SnapshotTile(
              label: 'Video',
              value: 'Watch role overview',
              icon: Icons.video_library_outlined,
            ),
          if ((detail.tags).isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(top: 12),
              child: Wrap(
                spacing: 8,
                runSpacing: 8,
                children: detail.tags
                    .map(
                      (tag) => Chip(
                        label: Text(tag),
                        backgroundColor: theme.colorScheme.surfaceVariant,
                      ),
                    )
                    .toList(growable: false),
              ),
            ),
        ],
      ),
    );
  }
}

class _JobSkills extends StatelessWidget {
  const _JobSkills({required this.skills, required this.tags});

  final List<String> skills;
  final List<String> tags;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return GigvoraCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Capabilities & stack', style: theme.textTheme.titleMedium),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: skills
                .map((skill) => Chip(
                      avatar: const Icon(Icons.auto_awesome, size: 16),
                      label: Text(skill),
                    ))
                .toList(growable: false),
          ),
          if (tags.isNotEmpty) ...[
            const SizedBox(height: 16),
            Text('Search keywords', style: theme.textTheme.labelLarge),
            const SizedBox(height: 8),
            Wrap(
              spacing: 6,
              runSpacing: 6,
              children: tags
                  .map((tag) => Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: theme.colorScheme.primary.withOpacity(0.08),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(
                          '#${tag.replaceAll(' ', '').toLowerCase()}',
                          style: theme.textTheme.labelMedium?.copyWith(color: theme.colorScheme.primary),
                        ),
                      ))
                  .toList(growable: false),
            ),
          ],
        ],
      ),
    );
  }
}

class _JobMediaGallery extends StatefulWidget {
  const _JobMediaGallery({required this.media});

  final List<OpportunityMediaAsset> media;

  @override
  State<_JobMediaGallery> createState() => _JobMediaGalleryState();
}

class _JobMediaGalleryState extends State<_JobMediaGallery> {
  int _index = 0;

  @override
  Widget build(BuildContext context) {
    final media = widget.media;
    final theme = Theme.of(context);
    if (media.isEmpty) {
      return const SizedBox.shrink();
    }
    return GigvoraCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Media gallery', style: theme.textTheme.titleMedium),
              if (media.length > 1)
                Text('${_index + 1}/${media.length}', style: theme.textTheme.labelMedium),
            ],
          ),
          const SizedBox(height: 12),
          ClipRRect(
            borderRadius: BorderRadius.circular(20),
            child: AspectRatio(
              aspectRatio: 16 / 9,
              child: PageView.builder(
                itemCount: media.length,
                onPageChanged: (value) => setState(() => _index = value),
                itemBuilder: (context, index) {
                  final asset = media[index];
                  return Stack(
                    fit: StackFit.expand,
                    children: [
                      Positioned.fill(
                        child: Image.network(
                          asset.thumbnailUrl ?? asset.url,
                          fit: BoxFit.cover,
                          errorBuilder: (context, _, __) => Container(
                            color: theme.colorScheme.surfaceVariant,
                            alignment: Alignment.center,
                            child: const Icon(Icons.broken_image_outlined, size: 48),
                          ),
                        ),
                      ),
                      if (asset.isVideo)
                        Positioned(
                          bottom: 16,
                          right: 16,
                          child: FilledButton.icon(
                            onPressed: () => _launchUrl(asset.url),
                            icon: const Icon(Icons.play_arrow),
                            label: const Text('Play video'),
                          ),
                        ),
                      Positioned(
                        left: 16,
                        bottom: 16,
                        right: 16,
                        child: Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: Colors.black.withOpacity(0.35),
                            borderRadius: BorderRadius.circular(16),
                          ),
                          child: Text(
                            asset.caption ?? (asset.isVideo ? 'Company reel' : 'Office culture'),
                            style: theme.textTheme.bodyMedium?.copyWith(color: Colors.white),
                          ),
                        ),
                      ),
                    ],
                  );
                },
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _launchUrl(String url) async {
    final uri = Uri.tryParse(url);
    if (uri == null) {
      return;
    }
    await launchUrl(uri, mode: LaunchMode.externalApplication);
  }
}

class _JobVideoPreview extends StatelessWidget {
  const _JobVideoPreview({
    required this.videoUrl,
    required this.title,
    required this.onLaunch,
  });

  final String videoUrl;
  final String title;
  final VoidCallback onLaunch;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return GigvoraCard(
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Role showcase', style: theme.textTheme.titleMedium),
                const SizedBox(height: 8),
                Text(
                  'Watch a quick walkthrough of the ${title.toLowerCase()} role with the hiring squad.',
                  style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.onSurfaceVariant),
                ),
                const SizedBox(height: 16),
                FilledButton.icon(
                  onPressed: onLaunch,
                  icon: const Icon(Icons.play_circle_outline),
                  label: const Text('Play video'),
                ),
              ],
            ),
          ),
          const SizedBox(width: 16),
          Container(
            width: 120,
            height: 120,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(20),
              gradient: LinearGradient(
                colors: [theme.colorScheme.primary, theme.colorScheme.secondary],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
            ),
            child: const Icon(Icons.movie_filter_outlined, color: Colors.white, size: 48),
          ),
        ],
      ),
    );
  }
}

class _JobLocationCard extends StatelessWidget {
  const _JobLocationCard({required this.detail});

  final OpportunityDetail detail;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isRemote = detail.isRemote;
    return GigvoraCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Location & coverage', style: theme.textTheme.titleMedium),
          const SizedBox(height: 12),
          Container(
            height: 180,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(24),
              gradient: LinearGradient(
                colors: [
                  theme.colorScheme.primary.withOpacity(0.1),
                  theme.colorScheme.secondary.withOpacity(0.08),
                ],
              ),
            ),
            alignment: Alignment.center,
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(isRemote ? Icons.public : Icons.location_city, size: 42, color: theme.colorScheme.primary),
                const SizedBox(height: 12),
                Text(
                  isRemote
                      ? 'Remote role with async collaboration rituals'
                      : detail.location ?? 'Hybrid collaboration hub',
                  style: theme.textTheme.titleMedium,
                ),
                if (detail.location != null) ...[
                  const SizedBox(height: 8),
                  Text(
                    detail.location!,
                    style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.onSurfaceVariant),
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(height: 16),
          Text(
            'We align workstyles across timezones, async rituals, and in-person intensives. Use the availability panel to check flexibility.',
            style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant),
          ),
        ],
      ),
    );
  }
}

class _JobPosterCard extends StatelessWidget {
  const _JobPosterCard({required this.detail});

  final OpportunityDetail detail;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return GigvoraCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Hiring team', style: theme.textTheme.titleMedium),
          const SizedBox(height: 12),
          ListTile(
            contentPadding: EdgeInsets.zero,
            leading: CircleAvatar(
              radius: 28,
              backgroundImage: detail.posterAvatarUrl != null && detail.posterAvatarUrl!.isNotEmpty
                  ? NetworkImage(detail.posterAvatarUrl!)
                  : null,
              child: detail.posterAvatarUrl != null && detail.posterAvatarUrl!.isNotEmpty
                  ? null
                  : Text(
                      (detail.posterName ?? 'Team')[0].toUpperCase(),
                      style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
                    ),
            ),
            title: Text(detail.posterName ?? 'Gigvora hiring team'),
            subtitle: Text(
              detail.organization ?? 'Talent operations',
              style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant),
            ),
            trailing: FilledButton.tonalIcon(
              onPressed: () {},
              icon: const Icon(Icons.message_outlined),
              label: const Text('Message'),
            ),
          ),
          const SizedBox(height: 12),
          Text(
            'Ask about collaboration rituals, product discovery cadences, and the team\'s mentorship expectations.',
            style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant),
          ),
        ],
      ),
    );
  }
}

class _JobReviewSection extends StatelessWidget {
  const _JobReviewSection({
    required this.reviews,
    required this.rating,
    required this.reviewCount,
  });

  final List<OpportunityReview> reviews;
  final double? rating;
  final int reviewCount;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final formatter = DateFormat('MMM d, yyyy');
    return GigvoraCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(child: Text('What teammates say', style: theme.textTheme.titleMedium)),
              if (rating != null)
                Chip(
                  avatar: const Icon(Icons.star, color: Colors.amber),
                  label: Text('${rating!.toStringAsFixed(1)} • $reviewCount reviews'),
                ),
            ],
          ),
          const SizedBox(height: 12),
          ...reviews.map(
            (review) => Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(review.reviewer, style: theme.textTheme.labelLarge),
                      Text(formatter.format(review.createdAt),
                          style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant)),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(review.comment, style: theme.textTheme.bodyMedium),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _JobApplicationsSection extends ConsumerWidget {
  const _JobApplicationsSection({
    required this.detail,
    required this.state,
    required this.onCreate,
    required this.onEdit,
    required this.onSchedule,
    required this.onStatusChanged,
    required this.onDelete,
    required this.onCancelInterview,
  });

  final OpportunityDetail detail;
  final ResourceState<List<JobApplicationRecord>> state;
  final VoidCallback onCreate;
  final ValueChanged<JobApplicationRecord> onEdit;
  final Future<void> Function(JobApplicationRecord, [InterviewStep? step]) onSchedule;
  final void Function(JobApplicationRecord, JobApplicationStatus) onStatusChanged;
  final ValueChanged<JobApplicationRecord> onDelete;
  final void Function(JobApplicationRecord, String) onCancelInterview;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final applications = state.data ?? const <JobApplicationRecord>[];

    return GigvoraCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(child: Text('Applications & pipeline', style: theme.textTheme.titleMedium)),
              FilledButton.icon(
                onPressed: onCreate,
                icon: const Icon(Icons.add_circle_outline),
                label: const Text('Track new application'),
              ),
            ],
          ),
          if (state.loading) ...[
            const SizedBox(height: 12),
            LinearProgressIndicator(
              minHeight: 4,
              backgroundColor: theme.colorScheme.surfaceVariant,
            ),
          ],
          if (applications.isEmpty && !state.loading)
            Padding(
              padding: const EdgeInsets.only(top: 16),
              child: Text(
                'No applications tracked yet. Capture outreach, submissions, and interviews to keep stakeholders aligned.',
                style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.onSurfaceVariant),
              ),
            ),
          for (final record in applications) ...[
            const SizedBox(height: 16),
            _ApplicationTile(
              record: record,
              detail: detail,
              onEdit: () => onEdit(record),
              onSchedule: (step) => onSchedule(record, step),
              onStatusChanged: (status) => onStatusChanged(record, status),
              onDelete: () => onDelete(record),
              onCancelInterview: (interviewId) => onCancelInterview(record, interviewId),
            ),
          ],
        ],
      ),
    );
  }
}

class _ApplicationTile extends StatelessWidget {
  const _ApplicationTile({
    required this.record,
    required this.detail,
    required this.onEdit,
    required this.onSchedule,
    required this.onStatusChanged,
    required this.onDelete,
    required this.onCancelInterview,
  });

  final JobApplicationRecord record;
  final OpportunityDetail detail;
  final VoidCallback onEdit;
  final ValueChanged<InterviewStep?> onSchedule;
  final ValueChanged<JobApplicationStatus> onStatusChanged;
  final VoidCallback onDelete;
  final ValueChanged<String> onCancelInterview;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final formatter = DateFormat('MMM d, yyyy');
    final interviews = record.interviews;
    final statusColor = _statusColor(theme, record.status);
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        color: theme.colorScheme.surfaceVariant.withOpacity(0.4),
      ),
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
                    Text(record.role, style: theme.textTheme.titleMedium),
                    const SizedBox(height: 4),
                    Text(
                      record.company,
                      style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant),
                    ),
                  ],
                ),
              ),
              PopupMenuButton<String>(
                onSelected: (value) {
                  switch (value) {
                    case 'edit':
                      onEdit();
                      break;
                    case 'schedule':
                      onSchedule(null);
                      break;
                    case 'delete':
                      _confirmDelete(context);
                      break;
                  }
                },
                itemBuilder: (context) => const [
                  PopupMenuItem(value: 'edit', child: Text('Edit application')), 
                  PopupMenuItem(value: 'schedule', child: Text('Schedule interview')), 
                  PopupMenuDivider(),
                  PopupMenuItem(value: 'delete', child: Text('Remove from tracker')),
                ],
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: statusColor.withOpacity(0.16),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Text(record.status.label,
                    style: theme.textTheme.labelMedium?.copyWith(color: statusColor, fontWeight: FontWeight.w600)),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: DropdownButton<JobApplicationStatus>(
                  value: record.status,
                  onChanged: (value) {
                    if (value != null) {
                      onStatusChanged(value);
                    }
                  },
                  items: JobApplicationStatus.values
                      .map(
                        (status) => DropdownMenuItem(
                          value: status,
                          child: Text(status.label),
                        ),
                      )
                      .toList(growable: false),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            'Submitted ${formatter.format(record.submittedAt)} • Updated ${formatRelativeTime(record.updatedAt)}',
            style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant),
          ),
          if (record.notes != null && record.notes!.isNotEmpty) ...[
            const SizedBox(height: 12),
            Text(record.notes!, style: theme.textTheme.bodyMedium),
          ],
          if (record.attachments.isNotEmpty) ...[
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: record.attachments
                  .map((attachment) => InputChip(
                        avatar: const Icon(Icons.attach_file, size: 18),
                        label: Text(attachment.split('/').last),
                        onPressed: () => _launchUrl(attachment),
                      ))
                  .toList(growable: false),
            ),
          ],
          if (interviews.isNotEmpty) ...[
            const SizedBox(height: 16),
            Text('Interview cadence', style: theme.textTheme.labelLarge),
            const SizedBox(height: 8),
            Column(
              children: interviews
                  .map(
                    (interview) => Card(
                      elevation: 0,
                      color: theme.colorScheme.surface,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      child: ListTile(
                        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                        title: Text(interview.label),
                        subtitle: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const SizedBox(height: 4),
                            Text(
                              '${formatter.format(interview.startsAt)} · ${DateFormat.Hm().format(interview.startsAt)}-${DateFormat.Hm().format(interview.endsAt)} (${interview.format})',
                            ),
                            if (interview.location != null)
                              Text(interview.location!, style: theme.textTheme.bodySmall),
                            if (interview.notes != null)
                              Text(interview.notes!, style: theme.textTheme.bodySmall),
                          ],
                        ),
                        trailing: PopupMenuButton<String>(
                          onSelected: (value) {
                            switch (value) {
                              case 'edit':
                                onSchedule(interview);
                                break;
                              case 'cancel':
                                onCancelInterview(interview.id);
                                break;
                              case 'join':
                                if (interview.videoUrl != null) {
                                  _launchUrl(interview.videoUrl!);
                                }
                                break;
                            }
                          },
                          itemBuilder: (context) => [
                            const PopupMenuItem(value: 'edit', child: Text('Edit step')),
                            if (interview.videoUrl != null)
                              const PopupMenuItem(value: 'join', child: Text('Join call')),
                            const PopupMenuDivider(),
                            const PopupMenuItem(value: 'cancel', child: Text('Remove step')),
                          ],
                        ),
                      ),
                    ),
                  )
                  .toList(growable: false),
            ),
          ],
        ],
      ),
    );
  }

  void _confirmDelete(BuildContext context) async {
    final confirmed = await showDialog<bool>(
          context: context,
          builder: (dialogContext) => AlertDialog(
            title: const Text('Remove application tracker'),
            content: const Text('Remove this application from your tracker? This will not affect the hiring team.'),
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
          ),
        ) ??
        false;
    if (confirmed) {
      onDelete();
    }
  }

  Color _statusColor(ThemeData theme, JobApplicationStatus status) {
    switch (status) {
      case JobApplicationStatus.draft:
        return theme.colorScheme.outline;
      case JobApplicationStatus.submitted:
        return theme.colorScheme.primary;
      case JobApplicationStatus.interviewing:
        return theme.colorScheme.tertiary;
      case JobApplicationStatus.offer:
        return theme.colorScheme.secondary;
      case JobApplicationStatus.rejected:
        return theme.colorScheme.error;
      case JobApplicationStatus.withdrawn:
        return theme.colorScheme.outline;
    }
  }

  void _launchUrl(String url) async {
    final uri = Uri.tryParse(url);
    if (uri == null) return;
    await launchUrl(uri, mode: LaunchMode.externalApplication);
  }
}

class _JobApplicationSheet extends ConsumerStatefulWidget {
  const _JobApplicationSheet({
    required this.jobId,
    required this.detail,
    this.record,
  });

  final String jobId;
  final OpportunityDetail? detail;
  final JobApplicationRecord? record;

  @override
  ConsumerState<_JobApplicationSheet> createState() => _JobApplicationSheetState();
}

class _JobApplicationSheetState extends ConsumerState<_JobApplicationSheet> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _roleController;
  late final TextEditingController _companyController;
  late final TextEditingController _emailController;
  late final TextEditingController _salaryController;
  late final TextEditingController _locationController;
  late final TextEditingController _resumeController;
  late final TextEditingController _portfolioController;
  late final TextEditingController _notesController;
  late final TextEditingController _coverLetterController;
  bool _remote = true;
  late List<String> _attachments;
  JobApplicationStatus? _status;
  final TextEditingController _attachmentInput = TextEditingController();

  @override
  void initState() {
    super.initState();
    final record = widget.record;
    _roleController = TextEditingController(text: record?.role ?? widget.detail?.title ?? '');
    _companyController = TextEditingController(text: record?.company ?? widget.detail?.organization ?? '');
    _emailController = TextEditingController(text: record?.recruiterEmail ?? '');
    _salaryController = TextEditingController(text: record?.salaryExpectation ?? '');
    _locationController = TextEditingController(text: record?.locationPreference ?? widget.detail?.location ?? '');
    _resumeController = TextEditingController(text: record?.resumeUrl ?? '');
    _portfolioController = TextEditingController(text: record?.portfolioUrl ?? '');
    _notesController = TextEditingController(text: record?.notes ?? '');
    _coverLetterController = TextEditingController(text: record?.coverLetter ?? '');
    _remote = record?.remotePreference ?? widget.detail?.isRemote ?? true;
    _attachments = List<String>.from(record?.attachments ?? const <String>[]);
    _status = record?.status;
  }

  @override
  void dispose() {
    _roleController.dispose();
    _companyController.dispose();
    _emailController.dispose();
    _salaryController.dispose();
    _locationController.dispose();
    _resumeController.dispose();
    _portfolioController.dispose();
    _notesController.dispose();
    _coverLetterController.dispose();
    _attachmentInput.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final controller = ref.read(jobApplicationsControllerProvider(widget.jobId).notifier);
    final saving = ref.watch(jobApplicationsControllerProvider(widget.jobId)).metadata['saving'] == true;
    final theme = Theme.of(context);
    final isEditing = widget.record != null;
    return Container(
      padding: EdgeInsets.only(
        left: 24,
        right: 24,
        top: 24,
        bottom: MediaQuery.of(context).viewInsets.bottom + 24,
      ),
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
      ),
      child: Form(
        key: _formKey,
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      isEditing ? 'Update application' : 'Track new application',
                      style: theme.textTheme.titleLarge,
                    ),
                  ),
                  IconButton(
                    onPressed: () => Navigator.of(context).pop(false),
                    icon: const Icon(Icons.close),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _roleController,
                decoration: const InputDecoration(labelText: 'Role title'),
                validator: (value) => value == null || value.trim().isEmpty ? 'Role title is required' : null,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _companyController,
                decoration: const InputDecoration(labelText: 'Company'),
                validator: (value) => value == null || value.trim().isEmpty ? 'Company is required' : null,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _emailController,
                decoration: const InputDecoration(labelText: 'Recruiter email'),
                keyboardType: TextInputType.emailAddress,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _salaryController,
                decoration: const InputDecoration(labelText: 'Salary expectation'),
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _locationController,
                decoration: const InputDecoration(labelText: 'Location preference'),
              ),
              SwitchListTile.adaptive(
                value: _remote,
                onChanged: (value) => setState(() => _remote = value),
                title: const Text('Remote friendly'),
                subtitle: const Text('Toggle if you are open to remote or hybrid collaboration.'),
              ),
              TextFormField(
                controller: _resumeController,
                decoration: const InputDecoration(labelText: 'Resume URL'),
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _portfolioController,
                decoration: const InputDecoration(labelText: 'Portfolio URL'),
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _coverLetterController,
                decoration: const InputDecoration(labelText: 'Cover letter notes'),
                maxLines: 4,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _notesController,
                decoration: const InputDecoration(labelText: 'Private notes'),
                maxLines: 4,
              ),
              const SizedBox(height: 16),
              Text('Attachments', style: theme.textTheme.labelLarge),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  for (final attachment in _attachments)
                    InputChip(
                      label: Text(attachment.split('/').last),
                      onDeleted: () => setState(() => _attachments.remove(attachment)),
                    ),
                  SizedBox(
                    width: 240,
                    child: TextField(
                      controller: _attachmentInput,
                      decoration: InputDecoration(
                        labelText: 'Add link',
                        suffixIcon: IconButton(
                          icon: const Icon(Icons.add),
                          onPressed: () {
                            final value = _attachmentInput.text.trim();
                            if (value.isEmpty) return;
                            setState(() {
                              _attachments.add(value);
                              _attachmentInput.clear();
                            });
                          },
                        ),
                      ),
                    ),
                  ),
                ],
              ),
              if (isEditing) ...[
                const SizedBox(height: 16),
                DropdownButtonFormField<JobApplicationStatus>(
                  value: _status,
                  decoration: const InputDecoration(labelText: 'Status'),
                  onChanged: (value) => setState(() => _status = value),
                  items: JobApplicationStatus.values
                      .map(
                        (status) => DropdownMenuItem(
                          value: status,
                          child: Text(status.label),
                        ),
                      )
                      .toList(growable: false),
                ),
              ],
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                child: FilledButton(
                  onPressed: saving
                      ? null
                      : () async {
                          if (!_formKey.currentState!.validate()) {
                            return;
                          }
                          try {
                            if (widget.record == null) {
                              await controller.create(
                                JobApplicationDraft(
                                  role: _roleController.text.trim(),
                                  company: _companyController.text.trim(),
                                  coverLetter: _coverLetterController.text.trim(),
                                  resumeUrl: _resumeController.text.trim(),
                                  portfolioUrl: _portfolioController.text.trim(),
                                  recruiterEmail: _emailController.text.trim(),
                                  salaryExpectation: _salaryController.text.trim(),
                                  notes: _notesController.text.trim(),
                                  locationPreference: _locationController.text.trim(),
                                  remotePreference: _remote,
                                  attachments: _attachments,
                                ),
                              );
                            } else {
                              final record = widget.record!.copyWith(
                                role: _roleController.text.trim(),
                                company: _companyController.text.trim(),
                                coverLetter: _coverLetterController.text.trim(),
                                resumeUrl: _resumeController.text.trim(),
                                portfolioUrl: _portfolioController.text.trim(),
                                recruiterEmail: _emailController.text.trim(),
                                salaryExpectation: _salaryController.text.trim(),
                                notes: _notesController.text.trim(),
                                locationPreference: _locationController.text.trim(),
                                remotePreference: _remote,
                                attachments: List<String>.from(_attachments),
                                status: _status ?? widget.record!.status,
                              );
                              await controller.save(record);
                            }
                            if (!mounted) return;
                            Navigator.of(context).pop(true);
                          } catch (error) {
                            if (!mounted) return;
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(content: Text('Unable to save application. $error')),
                            );
                          }
                        },
                  child: Text(saving
                      ? 'Saving…'
                      : widget.record == null
                          ? 'Add to tracker'
                          : 'Save changes'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _InterviewSheet extends ConsumerStatefulWidget {
  const _InterviewSheet({
    required this.jobId,
    required this.record,
    this.step,
  });

  final String jobId;
  final JobApplicationRecord record;
  final InterviewStep? step;

  @override
  ConsumerState<_InterviewSheet> createState() => _InterviewSheetState();
}

class _InterviewSheetState extends ConsumerState<_InterviewSheet> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _labelController;
  late final TextEditingController _hostController;
  late final TextEditingController _locationController;
  late final TextEditingController _notesController;
  late final TextEditingController _videoController;
  String _format = 'Virtual';
  late DateTime _start;
  late DateTime _end;

  @override
  void initState() {
    super.initState();
    final step = widget.step;
    _labelController = TextEditingController(text: step?.label ?? 'Interview');
    _hostController = TextEditingController(text: step?.host ?? '');
    _locationController = TextEditingController(text: step?.location ?? '');
    _notesController = TextEditingController(text: step?.notes ?? '');
    _videoController = TextEditingController(text: step?.videoUrl ?? '');
    _format = step?.format ?? 'Virtual';
    final now = DateTime.now();
    _start = step?.startsAt ?? now.add(const Duration(days: 2));
    _end = step?.endsAt ?? _start.add(const Duration(hours: 1));
  }

  @override
  void dispose() {
    _labelController.dispose();
    _hostController.dispose();
    _locationController.dispose();
    _notesController.dispose();
    _videoController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final controller = ref.read(jobApplicationsControllerProvider(widget.jobId).notifier);
    final saving = ref.watch(jobApplicationsControllerProvider(widget.jobId)).metadata['saving'] == true;
    final isEditing = widget.step != null;
    return Container(
      padding: EdgeInsets.only(
        left: 24,
        right: 24,
        top: 24,
        bottom: MediaQuery.of(context).viewInsets.bottom + 24,
      ),
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
      ),
      child: Form(
        key: _formKey,
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      isEditing ? 'Update interview' : 'Schedule interview',
                      style: theme.textTheme.titleLarge,
                    ),
                  ),
                  IconButton(
                    onPressed: () => Navigator.of(context).pop(false),
                    icon: const Icon(Icons.close),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _labelController,
                decoration: const InputDecoration(labelText: 'Interview stage'),
                validator: (value) => value == null || value.trim().isEmpty ? 'Stage is required' : null,
              ),
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                value: _format,
                decoration: const InputDecoration(labelText: 'Format'),
                onChanged: (value) => setState(() => _format = value ?? 'Virtual'),
                items: const [
                  DropdownMenuItem(value: 'Virtual', child: Text('Virtual')), 
                  DropdownMenuItem(value: 'Hybrid', child: Text('Hybrid')), 
                  DropdownMenuItem(value: 'In person', child: Text('In person')),
                ],
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _hostController,
                decoration: const InputDecoration(labelText: 'Host'),
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _locationController,
                decoration: const InputDecoration(labelText: 'Location / link'),
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () async {
                        final date = await showDatePicker(
                          context: context,
                          firstDate: DateTime.now().subtract(const Duration(days: 1)),
                          lastDate: DateTime.now().add(const Duration(days: 365)),
                          initialDate: _start,
                        );
                        if (date == null) return;
                        final time = await showTimePicker(
                          context: context,
                          initialTime: TimeOfDay.fromDateTime(_start),
                        );
                        if (time == null) return;
                        setState(() {
                          _start = DateTime(date.year, date.month, date.day, time.hour, time.minute);
                          if (!_end.isAfter(_start)) {
                            _end = _start.add(const Duration(hours: 1));
                          }
                        });
                      },
                      icon: const Icon(Icons.calendar_today_outlined),
                      label: Text('Start ${DateFormat('MMM d • HH:mm').format(_start)}'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () async {
                        final date = await showDatePicker(
                          context: context,
                          firstDate: _start,
                          lastDate: DateTime.now().add(const Duration(days: 365)),
                          initialDate: _end,
                        );
                        if (date == null) return;
                        final time = await showTimePicker(
                          context: context,
                          initialTime: TimeOfDay.fromDateTime(_end),
                        );
                        if (time == null) return;
                        setState(() {
                          _end = DateTime(date.year, date.month, date.day, time.hour, time.minute);
                          if (!_end.isAfter(_start)) {
                            _end = _start.add(const Duration(hours: 1));
                          }
                        });
                      },
                      icon: const Icon(Icons.timer_outlined),
                      label: Text('End ${DateFormat('MMM d • HH:mm').format(_end)}'),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _notesController,
                decoration: const InputDecoration(labelText: 'Notes for prep'),
                maxLines: 3,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _videoController,
                decoration: const InputDecoration(labelText: 'Video conference link'),
              ),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                child: FilledButton(
                  onPressed: saving
                      ? null
                      : () async {
                          if (!_formKey.currentState!.validate()) {
                            return;
                          }
                          final step = InterviewStep(
                            id: widget.step?.id ?? 'int-${DateTime.now().microsecondsSinceEpoch}',
                            label: _labelController.text.trim(),
                            startsAt: _start,
                            endsAt: _end,
                            format: _format,
                            host: _hostController.text.trim().isEmpty ? null : _hostController.text.trim(),
                            location: _locationController.text.trim().isEmpty ? null : _locationController.text.trim(),
                            notes: _notesController.text.trim().isEmpty ? null : _notesController.text.trim(),
                            videoUrl: _videoController.text.trim().isEmpty ? null : _videoController.text.trim(),
                          );
                          try {
                            await controller.scheduleInterview(widget.record.id, step);
                            if (!mounted) return;
                            Navigator.of(context).pop(true);
                          } catch (error) {
                            if (!mounted) return;
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(content: Text('Unable to schedule interview. $error')),
                            );
                          }
                        },
                  child: Text(saving ? 'Saving…' : (isEditing ? 'Save changes' : 'Schedule interview')),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _PillChip extends StatelessWidget {
  const _PillChip({required this.label, required this.icon});

  final String label;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: theme.colorScheme.primary.withOpacity(0.08),
        borderRadius: BorderRadius.circular(18),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 16, color: theme.colorScheme.primary),
          const SizedBox(width: 8),
          Text(label, style: theme.textTheme.labelMedium?.copyWith(color: theme.colorScheme.primary)),
        ],
      ),
    );
  }
}

class _SnapshotTile extends StatelessWidget {
  const _SnapshotTile({
    required this.label,
    required this.value,
    required this.icon,
  });

  final String label;
  final String value;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        children: [
          Icon(icon, size: 20, color: theme.colorScheme.primary),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label, style: theme.textTheme.labelLarge),
                Text(value, style: theme.textTheme.bodyMedium),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
