import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../theme/widgets.dart';
import '../application/mentor_profile_controller.dart';
import '../data/models/mentor_profile.dart';

class MentorProfileScreen extends ConsumerWidget {
  const MentorProfileScreen({super.key, required this.mentorId});

  final String mentorId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(mentorProfileControllerProvider(mentorId));
    final controller = ref.read(mentorProfileControllerProvider(mentorId).notifier);

    if (state.loading || state.data == null) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    final profile = state.data!;
    final busy = state.metadata['booking'] == true || state.metadata['reviewing'] == true;

    return GigvoraScaffold(
      title: profile.name,
      subtitle: profile.headline,
      actions: [
        IconButton(
          tooltip: 'Refresh profile',
          onPressed: controller.refresh,
          icon: const Icon(Icons.refresh),
        ),
      ],
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _openBookingSheet(context, controller, profile),
        icon: const Icon(Icons.calendar_month_outlined),
        label: const Text('Book session'),
      ),
      body: RefreshIndicator(
        onRefresh: controller.refresh,
        child: ListView(
          padding: const EdgeInsets.all(24),
          children: [
            _HeroHeader(profile: profile),
            const SizedBox(height: 24),
            _AboutSection(profile: profile),
            const SizedBox(height: 24),
            _PackageSection(profile: profile, onBook: () => _openBookingSheet(context, controller, profile)),
            const SizedBox(height: 24),
            _AvailabilitySection(slots: profile.availability),
            if (profile.gallery.isNotEmpty) ...[
              const SizedBox(height: 24),
              _GallerySection(gallery: profile.gallery, onTap: (asset) => _launchUrl(asset.url)),
            ],
            const SizedBox(height: 24),
            _ReviewSection(
              profile: profile,
              busy: busy,
              onReview: () => _openReviewSheet(context, controller, profile),
            ),
            const SizedBox(height: 48),
          ],
        ),
      ),
    );
  }

  Future<void> _openBookingSheet(
    BuildContext context,
    MentorProfileController controller,
    MentorProfile profile,
  ) async {
    final result = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      builder: (context) {
        return MentorBookingSheet(profile: profile, onSubmit: controller.bookSession);
      },
    );
    if (result == true && context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Session request sent to mentor.')),
      );
    }
  }

  Future<void> _openReviewSheet(
    BuildContext context,
    MentorProfileController controller,
    MentorProfile profile,
  ) async {
    final result = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      builder: (context) => MentorReviewSheet(onSubmit: controller.submitReview, profile: profile),
    );
    if (result == true && context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Review published.')), 
      );
    }
  }
}

class _HeroHeader extends StatelessWidget {
  const _HeroHeader({required this.profile});

  final MentorProfile profile;

  @override
  Widget build(BuildContext context) {
    return GigvoraCard(
      padding: const EdgeInsets.all(20),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          CircleAvatar(radius: 36, backgroundImage: NetworkImage(profile.avatarUrl)),
          const SizedBox(width: 20),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(profile.name, style: Theme.of(context).textTheme.headlineSmall),
                Text(profile.title, style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: profile.tags.take(6).map((tag) => Chip(label: Text(tag))).toList(),
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    const Icon(Icons.star_rate_rounded, color: Colors.amber),
                    const SizedBox(width: 4),
                    Text('${profile.rating.toStringAsFixed(1)} (${profile.reviewCount} reviews)'),
                    const SizedBox(width: 16),
                    const Icon(Icons.location_on_outlined, size: 20),
                    Text(profile.location),
                  ],
                ),
              ],
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
    return GigvoraCard(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Why operators book ${profile.name.split(' ').first}', style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 12),
          Text(profile.bio),
          const SizedBox(height: 16),
          Wrap(
            spacing: 12,
            runSpacing: 12,
            children: profile.skills.take(8).map((skill) => Chip(label: Text(skill))).toList(),
          ),
          const SizedBox(height: 16),
          Wrap(
            spacing: 12,
            runSpacing: 12,
            children: profile.languages.map((language) => Chip(label: Text(language))).toList(),
          ),
        ],
      ),
    );
  }
}

class _PackageSection extends StatelessWidget {
  const _PackageSection({required this.profile, required this.onBook});

  final MentorProfile profile;
  final VoidCallback onBook;

  @override
  Widget build(BuildContext context) {
    final currency = profile.currency;
    return GigvoraCard(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text('Mentoring packages', style: Theme.of(context).textTheme.titleMedium),
              const Spacer(),
              TextButton.icon(onPressed: onBook, icon: const Icon(Icons.calendar_month_outlined), label: const Text('Request')),
            ],
          ),
          const SizedBox(height: 12),
          ...profile.packages.map((pkg) {
            final price = NumberFormat.compactCurrency(symbol: currency).format(pkg.price);
            return Padding(
              padding: const EdgeInsets.only(bottom: 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(pkg.name, style: Theme.of(context).textTheme.titleMedium),
                  const SizedBox(height: 4),
                  Text(pkg.description),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 12,
                    runSpacing: 8,
                    children: [
                      Chip(label: Text('${pkg.sessions} sessions')),
                      Chip(label: Text(pkg.format)),
                      Chip(label: Text(price)),
                    ],
                  ),
                  if (pkg.outcome != null) ...[
                    const SizedBox(height: 6),
                    Text('Outcome: ${pkg.outcome!}', style: Theme.of(context).textTheme.bodySmall),
                  ],
                ],
              ),
            );
          }),
        ],
      ),
    );
  }
}

class _AvailabilitySection extends StatelessWidget {
  const _AvailabilitySection({required this.slots});

  final List<MentorAvailabilitySlot> slots;

  @override
  Widget build(BuildContext context) {
    final formatter = DateFormat('HH:mm');
    return GigvoraCard(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Typical availability', style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 12),
          ...slots.map((slot) {
            final range = '${formatter.format(slot.start)} – ${formatter.format(slot.end)}';
            return ListTile(
              contentPadding: EdgeInsets.zero,
              leading: const Icon(Icons.schedule_outlined),
              title: Text('${slot.day} • ${slot.format}'),
              subtitle: Text('$range · ${slot.capacity} seat(s)'),
            );
          }),
        ],
      ),
    );
  }
}

class _GallerySection extends StatelessWidget {
  const _GallerySection({required this.gallery, required this.onTap});

  final List<MentorMediaAsset> gallery;
  final void Function(MentorMediaAsset asset) onTap;

  @override
  Widget build(BuildContext context) {
    return GigvoraCard(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Showcase & resources', style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 12),
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: gallery.length,
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              mainAxisSpacing: 12,
              crossAxisSpacing: 12,
              childAspectRatio: 1.4,
            ),
            itemBuilder: (context, index) {
              final asset = gallery[index];
              return InkWell(
                onTap: () => onTap(asset),
                child: Container(
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(12),
                    color: Theme.of(context).colorScheme.surfaceVariant,
                  ),
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Icon(_iconForMedia(asset.type), size: 32),
                      const Spacer(),
                      Text(asset.caption ?? asset.url, maxLines: 2, overflow: TextOverflow.ellipsis),
                    ],
                  ),
                ),
              );
            },
          ),
        ],
      ),
    );
  }

  IconData _iconForMedia(MentorMediaType type) {
    switch (type) {
      case MentorMediaType.video:
        return Icons.play_circle_outline;
      case MentorMediaType.article:
        return Icons.article_outlined;
      case MentorMediaType.deck:
        return Icons.slideshow_outlined;
      case MentorMediaType.image:
      default:
        return Icons.photo_outlined;
    }
  }
}

class _ReviewSection extends StatelessWidget {
  const _ReviewSection({required this.profile, required this.busy, required this.onReview});

  final MentorProfile profile;
  final bool busy;
  final VoidCallback onReview;

  @override
  Widget build(BuildContext context) {
    return GigvoraCard(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text('Reviews & social proof', style: Theme.of(context).textTheme.titleMedium),
              if (busy) ...[
                const SizedBox(width: 12),
                const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2)),
              ],
              const Spacer(),
              TextButton.icon(onPressed: onReview, icon: const Icon(Icons.edit_outlined), label: const Text('Add review')),
            ],
          ),
          const SizedBox(height: 12),
          if (profile.reviews.isEmpty)
            const Text('No testimonials yet. Share your experience after the first session.'),
          ...profile.reviews.map((review) {
            final date = DateFormat.yMMMd().format(review.createdAt);
            return Padding(
              padding: const EdgeInsets.only(bottom: 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('${review.reviewer} • ${review.role} @ ${review.company}',
                      style: Theme.of(context).textTheme.titleSmall),
                  const SizedBox(height: 4),
                  Row(
                    children: List.generate(5, (index) {
                      final filled = index + 1 <= review.rating.round();
                      return Icon(filled ? Icons.star_rounded : Icons.star_border_rounded,
                          size: 18, color: Colors.amber);
                    }),
                  ),
                  const SizedBox(height: 4),
                  Text(review.comment),
                  Text(date, style: Theme.of(context).textTheme.bodySmall),
                ],
              ),
            );
          }),
        ],
      ),
    );
  }
}

class MentorBookingSheet extends StatefulWidget {
  const MentorBookingSheet({super.key, required this.profile, required this.onSubmit});

  final MentorProfile profile;
  final Future<void> Function(MentorSessionDraft draft) onSubmit;

  @override
  State<MentorBookingSheet> createState() => _MentorBookingSheetState();
}

class _MentorBookingSheetState extends State<MentorBookingSheet> {
  final _formKey = GlobalKey<FormState>();
  String? _packageId;
  late final TextEditingController _nameController;
  late final TextEditingController _emailController;
  late final TextEditingController _goalController;
  late final TextEditingController _formatController;
  DateTime? _preferredDate;
  bool _submitting = false;

  @override
  void initState() {
    super.initState();
    _packageId = widget.profile.packages.isNotEmpty ? widget.profile.packages.first.id : null;
    _nameController = TextEditingController();
    _emailController = TextEditingController();
    _goalController = TextEditingController();
    _formatController = TextEditingController(text: 'Virtual');
  }

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _goalController.dispose();
    _formatController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }
    setState(() => _submitting = true);
    final draft = MentorSessionDraft(
      packageId: _packageId,
      fullName: _nameController.text.trim(),
      email: _emailController.text.trim(),
      goal: _goalController.text.trim(),
      preferredDate: _preferredDate,
      format: _formatController.text.trim(),
    );
    await widget.onSubmit(draft);
    if (!mounted) return;
    Navigator.of(context).pop(true);
  }

  Future<void> _pickDate() async {
    final date = await showDatePicker(
      context: context,
      initialDate: DateTime.now().add(const Duration(days: 3)),
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 120)),
    );
    if (date != null) {
      setState(() => _preferredDate = date);
    }
  }

  @override
  Widget build(BuildContext context) {
    final bottom = MediaQuery.of(context).viewInsets.bottom;
    return Padding(
      padding: EdgeInsets.only(left: 24, right: 24, top: 24, bottom: bottom + 24),
      child: Form(
        key: _formKey,
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Request a session', style: Theme.of(context).textTheme.titleLarge),
              const SizedBox(height: 16),
              DropdownButtonFormField<String?>(
                value: _packageId,
                decoration: const InputDecoration(labelText: 'Package'),
                items: widget.profile.packages
                    .map((pkg) => DropdownMenuItem(value: pkg.id, child: Text(pkg.name)))
                    .toList(),
                onChanged: (value) => setState(() => _packageId = value),
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _nameController,
                decoration: const InputDecoration(labelText: 'Full name'),
                validator: (value) => value == null || value.trim().isEmpty ? 'Enter your name' : null,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _emailController,
                decoration: const InputDecoration(labelText: 'Email'),
                keyboardType: TextInputType.emailAddress,
                validator: (value) => value == null || value.trim().isEmpty ? 'Enter an email' : null,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _goalController,
                decoration: const InputDecoration(labelText: 'Focus or goal'),
                maxLines: 3,
                validator: (value) => value == null || value.trim().isEmpty ? 'Share context for the mentor' : null,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _formatController,
                decoration: const InputDecoration(labelText: 'Preferred format'),
              ),
              const SizedBox(height: 12),
              ListTile(
                contentPadding: EdgeInsets.zero,
                leading: const Icon(Icons.event_available_outlined),
                title: Text(_preferredDate == null
                    ? 'Select preferred date'
                    : DateFormat.yMMMMd().format(_preferredDate!)),
                onTap: _pickDate,
              ),
              const SizedBox(height: 20),
              FilledButton.icon(
                onPressed: _submitting ? null : _submit,
                icon: _submitting
                    ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
                    : const Icon(Icons.send),
                label: Text(_submitting ? 'Sending...' : 'Submit request'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class MentorReviewSheet extends StatefulWidget {
  const MentorReviewSheet({super.key, required this.profile, required this.onSubmit});

  final MentorProfile profile;
  final Future<void> Function(MentorReviewDraft draft) onSubmit;

  @override
  State<MentorReviewSheet> createState() => _MentorReviewSheetState();
}

class _MentorReviewSheetState extends State<MentorReviewSheet> {
  final _formKey = GlobalKey<FormState>();
  double _rating = 4.0;
  late final TextEditingController _nameController;
  late final TextEditingController _roleController;
  late final TextEditingController _companyController;
  late final TextEditingController _commentController;
  bool _submitting = false;

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

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }
    setState(() => _submitting = true);
    final draft = MentorReviewDraft(
      reviewer: _nameController.text.trim(),
      role: _roleController.text.trim(),
      company: _companyController.text.trim(),
      rating: _rating,
      comment: _commentController.text.trim(),
    );
    await widget.onSubmit(draft);
    if (!mounted) return;
    Navigator.of(context).pop(true);
  }

  @override
  Widget build(BuildContext context) {
    final bottom = MediaQuery.of(context).viewInsets.bottom;
    return Padding(
      padding: EdgeInsets.only(left: 24, right: 24, top: 24, bottom: bottom + 24),
      child: Form(
        key: _formKey,
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Share your experience with ${widget.profile.name.split(' ').first}',
                  style: Theme.of(context).textTheme.titleLarge),
              const SizedBox(height: 16),
              Slider(
                value: _rating,
                min: 1,
                max: 5,
                divisions: 8,
                label: _rating.toStringAsFixed(1),
                onChanged: (value) => setState(() => _rating = value),
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _nameController,
                decoration: const InputDecoration(labelText: 'Your name'),
                validator: (value) => value == null || value.trim().isEmpty ? 'Required' : null,
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
              TextFormField(
                controller: _commentController,
                decoration: const InputDecoration(labelText: 'Testimonial'),
                maxLines: 4,
                validator: (value) => value == null || value.trim().isEmpty ? 'Tell us about the session' : null,
              ),
              const SizedBox(height: 20),
              FilledButton.icon(
                onPressed: _submitting ? null : _submit,
                icon: _submitting
                    ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
                    : const Icon(Icons.check),
                label: Text(_submitting ? 'Submitting...' : 'Publish review'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

Future<void> _launchUrl(String url) async {
  final uri = Uri.tryParse(url);
  if (uri != null) {
    await launchUrl(uri, mode: LaunchMode.externalApplication);
  }
}
