import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gigvora_foundation/gigvora_foundation.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../theme/widgets.dart';
import '../application/mentor_profile_controller.dart';
import '../data/models/mentor_dashboard.dart';
import '../data/models/mentor_profile.dart';

class MentorProfileScreen extends ConsumerStatefulWidget {
  const MentorProfileScreen({
    super.key,
    required this.mentorId,
  });

  final String mentorId;

  @override
  ConsumerState<MentorProfileScreen> createState() => _MentorProfileScreenState();
}

class _MentorProfileScreenState extends ConsumerState<MentorProfileScreen> {
  Future<void> _refresh() async {
    await ref.read(mentorProfileControllerProvider(widget.mentorId).notifier).refresh();
  }

  Future<void> _openBookingSheet(MentorProfile profile, {MentorPackage? package}) async {
    final result = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      backgroundColor: Colors.transparent,
      builder: (context) => _MentorBookingSheet(
        mentorId: widget.mentorId,
        profile: profile,
        package: package,
      ),
    );
    if (result == true && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Session request submitted to ${profile.name}.')),
      );
    }
  }

  Future<void> _openReviewSheet(MentorProfile profile) async {
    final result = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      backgroundColor: Colors.transparent,
      builder: (context) => _MentorReviewSheet(
        mentorId: widget.mentorId,
        profile: profile,
      ),
    );
    if (result == true && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Thanks for sharing feedback about ${profile.name}.')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(mentorProfileControllerProvider(widget.mentorId));
    final profile = state.data;
    final booking = state.metadata['booking'] == true;

    return GigvoraScaffold(
      title: profile?.name ?? 'Mentor profile',
      subtitle: profile != null ? '${profile.title} • ${profile.location}' : 'Discover mentor availability, packages, and reviews.',
      actions: [
        IconButton(
          tooltip: 'Refresh profile',
          onPressed: _refresh,
          icon: const Icon(Icons.refresh),
        ),
      ],
      floatingActionButton: profile == null
          ? null
          : FloatingActionButton.extended(
              onPressed: booking ? null : () => _openBookingSheet(profile),
              icon: booking
                  ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
                  : const Icon(Icons.video_camera_front_outlined),
              label: Text(booking ? 'Scheduling…' : 'Book mentoring session'),
            ),
      body: RefreshIndicator(
        onRefresh: _refresh,
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          children: [
            if (state.loading && profile == null)
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 48),
                child: Center(child: CircularProgressIndicator()),
              ),
            if (state.hasError && profile == null)
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
                          Text('Unable to load mentor profile'),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Text(
                        'Pull to refresh or check your network connection.',
                        style: Theme.of(context)
                            .textTheme
                            .bodySmall
                            ?.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant),
                      ),
                    ],
                  ),
                ),
              ),
            if (profile != null) ...[
              _ProfileHero(profile: profile, onBook: () => _openBookingSheet(profile)),
              const SizedBox(height: 20),
              _QuickStats(profile: profile, lastUpdated: state.lastUpdated),
              const SizedBox(height: 16),
              _PackageSection(profile: profile, onBook: (pkg) => _openBookingSheet(profile, package: pkg)),
              const SizedBox(height: 16),
              _AvailabilitySection(availability: profile.availability),
              const SizedBox(height: 16),
              if (profile.showcase.isNotEmpty) _ShowcaseSection(showcase: profile.showcase),
              if (profile.gallery.isNotEmpty) ...[
                const SizedBox(height: 16),
                _GallerySection(gallery: profile.gallery),
              ],
              const SizedBox(height: 16),
              _AboutSection(profile: profile),
              const SizedBox(height: 16),
              _ReviewSection(profile: profile, onReview: () => _openReviewSheet(profile)),
              const SizedBox(height: 16),
              if (profile.bookings.isNotEmpty)
                _BookingTimeline(bookings: profile.bookings),
              if (profile.socialLinks.isNotEmpty) ...[
                const SizedBox(height: 16),
                _SocialSection(links: profile.socialLinks),
              ],
            ],
            const SizedBox(height: 48),
          ],
        ),
      ),
    );
  }
}

class _ProfileHero extends StatelessWidget {
  const _ProfileHero({required this.profile, required this.onBook});

  final MentorProfile profile;
  final VoidCallback onBook;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final heroImage = profile.heroImageUrl;
    return GigvoraCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (heroImage.isNotEmpty)
            ClipRRect(
              borderRadius: BorderRadius.circular(24),
              child: AspectRatio(
                aspectRatio: 16 / 9,
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    Image.network(
                      heroImage,
                      fit: BoxFit.cover,
                      errorBuilder: (context, _, __) => Container(
                        color: theme.colorScheme.surfaceVariant,
                        alignment: Alignment.center,
                        child: const Icon(Icons.broken_image_outlined, size: 48),
                      ),
                    ),
                    if (profile.videoUrl != null && profile.videoUrl!.isNotEmpty)
                      Positioned(
                        bottom: 16,
                        right: 16,
                        child: FilledButton.icon(
                          onPressed: () => _launchUrl(profile.videoUrl!),
                          icon: const Icon(Icons.play_circle_outline),
                          label: const Text('Watch intro'),
                        ),
                      ),
                  ],
                ),
              ),
            ),
          const SizedBox(height: 16),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              CircleAvatar(
                radius: 40,
                backgroundImage: profile.avatarUrl.isNotEmpty ? NetworkImage(profile.avatarUrl) : null,
                child: profile.avatarUrl.isNotEmpty
                    ? null
                    : Text(profile.name[0], style: theme.textTheme.headlineMedium?.copyWith(color: Colors.white)),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(profile.name, style: theme.textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold)),
                    const SizedBox(height: 4),
                    Text(profile.headline, style: theme.textTheme.bodyMedium),
                    const SizedBox(height: 12),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: [
                        _HeroChip(icon: Icons.star, label: '${profile.rating.toStringAsFixed(1)} rating'),
                        _HeroChip(icon: Icons.timer, label: profile.responseTime),
                        _HeroChip(icon: Icons.language, label: profile.languages.join(' • ')),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Text(profile.bio, style: theme.textTheme.bodyMedium?.copyWith(height: 1.5)),
          const SizedBox(height: 16),
          Row(
            children: [
              FilledButton.icon(
                onPressed: onBook,
                icon: const Icon(Icons.calendar_today_outlined),
                label: Text('Book from ${profile.currency}${profile.rate.toStringAsFixed(0)}'),
              ),
              const SizedBox(width: 12),
              OutlinedButton.icon(
                onPressed: () => _launchUrl('mailto:mentors@gigvora.com?subject=Mentor%20introduction%20${Uri.encodeComponent(profile.name)}'),
                icon: const Icon(Icons.mail_outline),
                label: const Text('Request intro'),
              ),
            ],
          ),
          if (profile.badges.isNotEmpty) ...[
            const SizedBox(height: 16),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: profile.badges
                  .map(
                    (badge) => Chip(
                      avatar: const Icon(Icons.verified, size: 16, color: Color(0xFF2563EB)),
                      label: Text(badge),
                    ),
                  )
                  .toList(growable: false),
            ),
          ],
        ],
      ),
    );
  }
}

class _QuickStats extends StatelessWidget {
  const _QuickStats({required this.profile, required this.lastUpdated});

  final MentorProfile profile;
  final DateTime? lastUpdated;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final remoteLabels = profile.remoteOptions
        .map(
          (option) => switch (option) {
            MentorRemoteOption.inPerson => 'In-person',
            MentorRemoteOption.hybrid => 'Hybrid',
            MentorRemoteOption.remote => 'Remote',
          },
        )
        .toList(growable: false)
      ..sort();
    return GigvoraCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Engagement snapshot', style: theme.textTheme.titleMedium),
          if (lastUpdated != null) ...[
            const SizedBox(height: 4),
            Text('Updated ${formatRelativeTime(lastUpdated!)}',
                style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant)),
          ],
          const SizedBox(height: 12),
          Wrap(
            spacing: 12,
            runSpacing: 12,
            children: [
              _StatTile(
                icon: Icons.groups_outlined,
                label: 'Active mentees',
                value: profile.bookings.length.toString(),
              ),
              _StatTile(
                icon: Icons.rate_review_outlined,
                label: 'Reviews',
                value: profile.reviewCount.toString(),
              ),
              _StatTile(
                icon: Icons.travel_explore_outlined,
                label: 'Collaboration modes',
                value: remoteLabels.join(' • '),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _PackageSection extends StatelessWidget {
  const _PackageSection({required this.profile, required this.onBook});

  final MentorProfile profile;
  final ValueChanged<MentorPackage> onBook;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final packages = profile.packages;
    return GigvoraCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Mentorship packages', style: theme.textTheme.titleMedium),
          const SizedBox(height: 8),
          Text(
            'Curated engagements to accelerate your leadership journey. Pick a package or request a custom plan.',
            style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant),
          ),
          const SizedBox(height: 16),
          ...packages.map(
            (pack) => Padding(
              padding: const EdgeInsets.only(bottom: 16),
              child: Container(
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  color: theme.colorScheme.surfaceVariant.withOpacity(0.35),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(pack.name, style: theme.textTheme.titleMedium),
                              const SizedBox(height: 4),
                              Text(pack.description, style: theme.textTheme.bodyMedium),
                            ],
                          ),
                        ),
                        Text('${pack.currency}${pack.price.toStringAsFixed(0)}',
                            style: theme.textTheme.titleMedium?.copyWith(color: theme.colorScheme.primary)),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: [
                        Chip(label: Text('${pack.sessions} sessions')), 
                        Chip(label: Text(pack.format)),
                        Chip(label: Text(pack.outcome)),
                      ],
                    ),
                    const SizedBox(height: 12),
                    SizedBox(
                      width: double.infinity,
                      child: FilledButton.tonal(
                        onPressed: () => onBook(pack),
                        child: const Text('Book this package'),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _AvailabilitySection extends StatelessWidget {
  const _AvailabilitySection({required this.availability});

  final List<MentorAvailabilitySlot> availability;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final formatter = DateFormat('HH:mm');
    return GigvoraCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Weekly availability', style: theme.textTheme.titleMedium),
          const SizedBox(height: 8),
          if (availability.isEmpty)
            Text(
              'No upcoming availability published. Request a session to coordinate directly with the mentor.',
              style: theme.textTheme.bodyMedium,
            )
          else
            Column(
              children: availability
                  .map(
                    (slot) => ListTile(
                      contentPadding: EdgeInsets.zero,
                      leading: CircleAvatar(
                        backgroundColor: theme.colorScheme.primary.withOpacity(0.1),
                        child: Text(slot.day.substring(0, 2).toUpperCase(),
                            style: theme.textTheme.labelLarge?.copyWith(color: theme.colorScheme.primary)),
                      ),
                      title: Text('${slot.day} • ${formatter.format(slot.start)}-${formatter.format(slot.end)}'),
                      subtitle: Text('${slot.format} • ${slot.capacity} mentee slots'),
                    ),
                  )
                  .toList(growable: false),
            ),
        ],
      ),
    );
  }
}

class _ShowcaseSection extends StatefulWidget {
  const _ShowcaseSection({required this.showcase});

  final List<MentorShowcaseItem> showcase;

  @override
  State<_ShowcaseSection> createState() => _ShowcaseSectionState();
}

class _ShowcaseSectionState extends State<_ShowcaseSection> {
  int _index = 0;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return GigvoraCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Showcase', style: theme.textTheme.titleMedium),
              if (widget.showcase.length > 1)
                Text('${_index + 1}/${widget.showcase.length}', style: theme.textTheme.labelMedium),
            ],
          ),
          const SizedBox(height: 12),
          ClipRRect(
            borderRadius: BorderRadius.circular(24),
            child: AspectRatio(
              aspectRatio: 16 / 9,
              child: PageView.builder(
                itemCount: widget.showcase.length,
                onPageChanged: (value) => setState(() => _index = value),
                itemBuilder: (context, index) {
                  final item = widget.showcase[index];
                  return Stack(
                    fit: StackFit.expand,
                    children: [
                      Positioned.fill(
                        child: item.coverImageUrl != null && item.coverImageUrl!.isNotEmpty
                            ? Image.network(item.coverImageUrl!, fit: BoxFit.cover,
                                errorBuilder: (context, _, __) => Container(
                                      color: theme.colorScheme.surfaceVariant,
                                      alignment: Alignment.center,
                                      child: const Icon(Icons.broken_image_outlined, size: 48),
                                    ))
                            : Container(
                                decoration: BoxDecoration(
                                  gradient: LinearGradient(
                                    colors: [theme.colorScheme.primary, theme.colorScheme.secondary],
                                    begin: Alignment.topLeft,
                                    end: Alignment.bottomRight,
                                  ),
                                ),
                              ),
                      ),
                      Positioned(
                        bottom: 16,
                        left: 16,
                        right: 16,
                        child: Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: Colors.black.withOpacity(0.45),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(item.title,
                                  style: theme.textTheme.titleMedium?.copyWith(color: Colors.white)),
                              const SizedBox(height: 8),
                              Text(item.description,
                                  style: theme.textTheme.bodySmall?.copyWith(color: Colors.white70)),
                              const SizedBox(height: 8),
                              FilledButton.tonal(
                                onPressed: () => _launchUrl(item.url),
                                child: Text(switch (item.type) {
                                  MentorMediaType.video => 'Play video',
                                  MentorMediaType.article => 'Read article',
                                  MentorMediaType.deck => 'Open playbook',
                                  MentorMediaType.image => 'View asset',
                                }),
                              ),
                            ],
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
}

class _GallerySection extends StatefulWidget {
  const _GallerySection({required this.gallery});

  final List<MentorMediaAsset> gallery;

  @override
  State<_GallerySection> createState() => _GallerySectionState();
}

class _GallerySectionState extends State<_GallerySection> {
  int _index = 0;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return GigvoraCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Studio gallery', style: theme.textTheme.titleMedium),
              if (widget.gallery.length > 1)
                Text('${_index + 1}/${widget.gallery.length}', style: theme.textTheme.labelMedium),
            ],
          ),
          const SizedBox(height: 12),
          ClipRRect(
            borderRadius: BorderRadius.circular(24),
            child: AspectRatio(
              aspectRatio: 4 / 3,
              child: PageView.builder(
                itemCount: widget.gallery.length,
                onPageChanged: (value) => setState(() => _index = value),
                itemBuilder: (context, index) {
                  final asset = widget.gallery[index];
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
                            label: const Text('Play clip'),
                          ),
                        ),
                      if ((asset.caption ?? '').isNotEmpty)
                        Positioned(
                          left: 16,
                          bottom: 16,
                          right: 16,
                          child: Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: Colors.black.withOpacity(0.45),
                              borderRadius: BorderRadius.circular(16),
                            ),
                            child: Text(
                              asset.caption!,
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
}

class _AboutSection extends StatelessWidget {
  const _AboutSection({required this.profile});

  final MentorProfile profile;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return GigvoraCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('How ${profile.name.split(' ').first} mentors', style: theme.textTheme.titleMedium),
          const SizedBox(height: 8),
          Text(
            'Mentoring focus areas',
            style: theme.textTheme.labelLarge,
          ),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: profile.categories
                .map((category) => Chip(label: Text(category)))
                .toList(growable: false),
          ),
          const SizedBox(height: 12),
          Text('Signature skills', style: theme.textTheme.labelLarge),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: profile.skills
                .map(
                  (skill) => InputChip(
                    avatar: const Icon(Icons.auto_awesome, size: 16),
                    label: Text(skill),
                  ),
                )
                .toList(growable: false),
          ),
          const SizedBox(height: 12),
          Text('Keywords & topics', style: theme.textTheme.labelLarge),
          const SizedBox(height: 8),
          Wrap(
            spacing: 6,
            runSpacing: 6,
            children: profile.tags
                .map(
                  (tag) => Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: theme.colorScheme.primary.withOpacity(0.08),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Text('#${tag.replaceAll(' ', '').toLowerCase()}',
                        style: theme.textTheme.labelMedium?.copyWith(color: theme.colorScheme.primary)),
                  ),
                )
                .toList(growable: false),
          ),
        ],
      ),
    );
  }
}

class _ReviewSection extends ConsumerWidget {
  const _ReviewSection({required this.profile, required this.onReview});

  final MentorProfile profile;
  final VoidCallback onReview;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final reviews = profile.reviews;
    final formatter = DateFormat('MMM d, yyyy');
    return GigvoraCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('What mentees say', style: theme.textTheme.titleMedium),
              TextButton.icon(
                onPressed: onReview,
                icon: const Icon(Icons.rate_review_outlined),
                label: const Text('Share feedback'),
              ),
            ],
          ),
          const SizedBox(height: 12),
          if (reviews.isEmpty)
            Text(
              'Be the first to leave feedback and help other mentees understand the mentorship experience.',
              style: theme.textTheme.bodyMedium,
            )
          else
            Column(
              children: reviews
                  .map(
                    (review) => Padding(
                      padding: const EdgeInsets.only(bottom: 16),
                      child: Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: theme.colorScheme.surfaceVariant.withOpacity(0.4),
                          borderRadius: BorderRadius.circular(20),
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
                                    Text(review.reviewer, style: theme.textTheme.titleSmall),
                                    Text('${review.role} • ${review.company}',
                                        style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant)),
                                  ],
                                ),
                                Chip(
                                  avatar: const Icon(Icons.star, size: 18, color: Colors.amber),
                                  label: Text(review.rating.toStringAsFixed(1)),
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            Text(review.comment, style: theme.textTheme.bodyMedium?.copyWith(height: 1.5)),
                            const SizedBox(height: 8),
                            Text(formatter.format(review.createdAt),
                                style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant)),
                            if (review.highlight != null) ...[
                              const SizedBox(height: 8),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                decoration: BoxDecoration(
                                  color: theme.colorScheme.secondary.withOpacity(0.15),
                                  borderRadius: BorderRadius.circular(14),
                                ),
                                child: Text(review.highlight!,
                                    style: theme.textTheme.labelSmall?.copyWith(color: theme.colorScheme.secondary)),
                              ),
                            ],
                          ],
                        ),
                      ),
                    ),
                  )
                  .toList(growable: false),
            ),
        ],
      ),
    );
  }
}

class _BookingTimeline extends StatelessWidget {
  const _BookingTimeline({required this.bookings});

  final List<MentorBooking> bookings;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final formatter = DateFormat('MMM d • HH:mm');
    return GigvoraCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Upcoming sessions', style: theme.textTheme.titleMedium),
          const SizedBox(height: 12),
          ...bookings.map(
            (booking) => Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: ListTile(
                contentPadding: EdgeInsets.zero,
                leading: CircleAvatar(
                  backgroundColor: theme.colorScheme.primary.withOpacity(0.12),
                  child: Icon(Icons.calendar_today_outlined, color: theme.colorScheme.primary),
                ),
                title: Text('${booking.mentee} • ${booking.role}'),
                subtitle: Text(
                  '${formatter.format(booking.scheduledAt)} • ${booking.channel} • ${booking.package}',
                ),
                trailing: Text('${booking.currency}${booking.price.toStringAsFixed(0)}'),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _SocialSection extends StatelessWidget {
  const _SocialSection({required this.links});

  final Map<String, String> links;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return GigvoraCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Connect with the mentor', style: theme.textTheme.titleMedium),
          const SizedBox(height: 8),
          Wrap(
            spacing: 12,
            runSpacing: 12,
            children: links.entries
                .map(
                  (entry) => OutlinedButton.icon(
                    onPressed: () => _launchUrl(entry.value),
                    icon: const Icon(Icons.link),
                    label: Text(entry.key),
                  ),
                )
                .toList(growable: false),
          ),
        ],
      ),
    );
  }
}

class _MentorBookingSheet extends ConsumerStatefulWidget {
  const _MentorBookingSheet({
    required this.mentorId,
    required this.profile,
    this.package,
  });

  final String mentorId;
  final MentorProfile profile;
  final MentorPackage? package;

  @override
  ConsumerState<_MentorBookingSheet> createState() => _MentorBookingSheetState();
}

class _MentorBookingSheetState extends ConsumerState<_MentorBookingSheet> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _nameController;
  late final TextEditingController _emailController;
  late final TextEditingController _goalController;
  late final TextEditingController _notesController;
  String _format = 'Virtual';
  DateTime? _preferredDate;
  MentorPackage? _selectedPackage;

  @override
  void initState() {
    super.initState();
    _nameController = TextEditingController();
    _emailController = TextEditingController();
    _goalController = TextEditingController(text: widget.package?.outcome ?? '');
    _notesController = TextEditingController();
    _selectedPackage = widget.package;
  }

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _goalController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final controller = ref.read(mentorProfileControllerProvider(widget.mentorId).notifier);
    final booking = ref.watch(mentorProfileControllerProvider(widget.mentorId)).metadata['booking'] == true;
    final theme = Theme.of(context);
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
                    child: Text('Book ${widget.profile.name}', style: theme.textTheme.titleLarge),
                  ),
                  IconButton(
                    onPressed: () => Navigator.of(context).pop(false),
                    icon: const Icon(Icons.close),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              DropdownButtonFormField<MentorPackage?>(
                value: _selectedPackage,
                decoration: const InputDecoration(labelText: 'Choose package (optional)'),
                onChanged: (value) => setState(() => _selectedPackage = value),
                items: [
                  const DropdownMenuItem(value: null, child: Text('Custom engagement')), 
                  ...widget.profile.packages.map(
                    (pack) => DropdownMenuItem(
                      value: pack,
                      child: Text('${pack.name} (${widget.profile.currency}${pack.price.toStringAsFixed(0)})'),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _nameController,
                decoration: const InputDecoration(labelText: 'Your name'),
                validator: (value) => value == null || value.trim().isEmpty ? 'Name is required' : null,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _emailController,
                decoration: const InputDecoration(labelText: 'Work email'),
                keyboardType: TextInputType.emailAddress,
                validator: (value) => value == null || value.trim().isEmpty ? 'Email is required' : null,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _goalController,
                decoration: const InputDecoration(labelText: 'What outcome are you seeking?'),
                maxLines: 3,
                validator: (value) => value == null || value.trim().isEmpty ? 'Tell the mentor a little about your goals.' : null,
              ),
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                value: _format,
                decoration: const InputDecoration(labelText: 'Preferred format'),
                items: const [
                  DropdownMenuItem(value: 'Virtual', child: Text('Virtual')), 
                  DropdownMenuItem(value: 'Hybrid', child: Text('Hybrid')), 
                  DropdownMenuItem(value: 'In person', child: Text('In person')),
                ],
                onChanged: (value) => setState(() => _format = value ?? 'Virtual'),
              ),
              const SizedBox(height: 12),
              OutlinedButton.icon(
                onPressed: () async {
                  final date = await showDatePicker(
                    context: context,
                    initialDate: DateTime.now().add(const Duration(days: 3)),
                    firstDate: DateTime.now(),
                    lastDate: DateTime.now().add(const Duration(days: 365)),
                  );
                  if (date == null) return;
                  final time = await showTimePicker(
                    context: context,
                    initialTime: const TimeOfDay(hour: 10, minute: 0),
                  );
                  setState(() {
                    _preferredDate = time == null
                        ? DateTime(date.year, date.month, date.day)
                        : DateTime(date.year, date.month, date.day, time.hour, time.minute);
                  });
                },
                icon: const Icon(Icons.calendar_month),
                label: Text(_preferredDate == null
                    ? 'Select preferred date'
                    : DateFormat('MMM d, HH:mm').format(_preferredDate!)),
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _notesController,
                decoration: const InputDecoration(labelText: 'Additional context (optional)'),
                maxLines: 3,
              ),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                child: FilledButton(
                  onPressed: booking
                      ? null
                      : () async {
                          if (!_formKey.currentState!.validate()) {
                            return;
                          }
                          try {
                            await controller.bookSession(
                              MentorSessionDraft(
                                fullName: _nameController.text.trim(),
                                email: _emailController.text.trim(),
                                goal: _goalController.text.trim(),
                                format: _format,
                                packageId: _selectedPackage?.id,
                                preferredDate: _preferredDate,
                                notes: _notesController.text.trim(),
                              ),
                            );
                            if (!mounted) return;
                            Navigator.of(context).pop(true);
                          } catch (error) {
                            if (!mounted) return;
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(content: Text('Unable to submit session request. $error')),
                            );
                          }
                        },
                  child: Text(booking ? 'Sending…' : 'Submit request'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _MentorReviewSheet extends ConsumerStatefulWidget {
  const _MentorReviewSheet({
    required this.mentorId,
    required this.profile,
  });

  final String mentorId;
  final MentorProfile profile;

  @override
  ConsumerState<_MentorReviewSheet> createState() => _MentorReviewSheetState();
}

class _MentorReviewSheetState extends ConsumerState<_MentorReviewSheet> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _nameController;
  late final TextEditingController _roleController;
  late final TextEditingController _companyController;
  late final TextEditingController _commentController;
  double _rating = 4.5;

  @override
  void initState() {
    super.initState();
    _nameController = TextEditingController();
    _roleController = TextEditingController();
    _companyController = TextEditingController();
    _commentController = TextEditingController();
  }

  @override
  void dispose() {
    _nameController.dispose();
    _roleController.dispose();
    _companyController.dispose();
    _commentController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final controller = ref.read(mentorProfileControllerProvider(widget.mentorId).notifier);
    final reviewing = ref.watch(mentorProfileControllerProvider(widget.mentorId)).metadata['reviewing'] == true;
    final theme = Theme.of(context);
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
                    child: Text('Share feedback for ${widget.profile.name}', style: theme.textTheme.titleLarge),
                  ),
                  IconButton(
                    onPressed: () => Navigator.of(context).pop(false),
                    icon: const Icon(Icons.close),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _nameController,
                decoration: const InputDecoration(labelText: 'Your name'),
                validator: (value) => value == null || value.trim().isEmpty ? 'Name is required' : null,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _roleController,
                decoration: const InputDecoration(labelText: 'Role'),
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _companyController,
                decoration: const InputDecoration(labelText: 'Company'),
              ),
              const SizedBox(height: 12),
              Text('Rating: ${_rating.toStringAsFixed(1)}', style: theme.textTheme.titleMedium),
              Slider(
                value: _rating,
                min: 3,
                max: 5,
                divisions: 10,
                label: _rating.toStringAsFixed(1),
                onChanged: (value) => setState(() => _rating = value),
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _commentController,
                decoration: const InputDecoration(labelText: 'What did this mentorship unlock for you?'),
                maxLines: 4,
                validator: (value) => value == null || value.trim().isEmpty ? 'Please share a few words.' : null,
              ),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                child: FilledButton(
                  onPressed: reviewing
                      ? null
                      : () async {
                          if (!_formKey.currentState!.validate()) {
                            return;
                          }
                          try {
                            await controller.submitReview(
                              MentorReviewDraft(
                                reviewer: _nameController.text.trim(),
                                role: _roleController.text.trim(),
                                company: _companyController.text.trim(),
                                rating: double.parse(_rating.toStringAsFixed(1)),
                                comment: _commentController.text.trim(),
                              ),
                            );
                            if (!mounted) return;
                            Navigator.of(context).pop(true);
                          } catch (error) {
                            if (!mounted) return;
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(content: Text('Unable to save review. $error')),
                            );
                          }
                        },
                  child: Text(reviewing ? 'Submitting…' : 'Submit review'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _HeroChip extends StatelessWidget {
  const _HeroChip({required this.icon, required this.label});

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: theme.colorScheme.primary.withOpacity(0.08),
        borderRadius: BorderRadius.circular(16),
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

class _StatTile extends StatelessWidget {
  const _StatTile({required this.icon, required this.label, required this.value});

  final IconData icon;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: theme.colorScheme.surfaceVariant.withOpacity(0.4),
        borderRadius: BorderRadius.circular(18),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: theme.colorScheme.primary),
          const SizedBox(height: 8),
          Text(value, style: theme.textTheme.titleMedium),
          const SizedBox(height: 4),
          Text(label, style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant)),
        ],
      ),
    );
  }
}

void _launchUrl(String url) async {
  final uri = Uri.tryParse(url);
  if (uri == null) return;
  await launchUrl(uri, mode: LaunchMode.externalApplication);
}
