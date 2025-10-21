import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gigvora_foundation/gigvora_foundation.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../core/providers.dart';
import '../../../theme/widgets.dart';
import '../application/job_applications_controller.dart';
import '../application/opportunity_controller.dart';
import '../data/models/job_application_record.dart';
import '../data/models/opportunity.dart';
import '../data/models/opportunity_detail.dart';

class JobDetailScreen extends ConsumerStatefulWidget {
  const JobDetailScreen({super.key, required this.jobId});

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
      await ref.read(analyticsServiceProvider).track('job_profile_viewed', context: {
        'jobId': detail.id,
        'title': detail.title,
      });
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = error;
      });
    }
  }

  Future<void> _openApplicationSheet({JobApplicationRecord? record}) async {
    final detail = _detail;
    if (detail == null) {
      return;
    }
    final controller = ref.read(jobApplicationsControllerProvider(detail.id).notifier);
    final result = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      builder: (context) {
        return JobApplicationSheet(
          detail: detail,
          initial: record,
          onSubmit: (draft) async {
            if (record == null) {
              await controller.create(draft);
            } else {
              await controller.save(record.copyWith(
                applicantName: draft.applicantName.trim(),
                email: draft.email.trim(),
                resumeUrl: draft.resumeUrl?.trim(),
                portfolioUrl: draft.portfolioUrl?.trim(),
                coverLetter: draft.coverLetter?.trim(),
                phone: draft.phone?.trim(),
              ));
            }
          },
        );
      },
    );
    if (result == true && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(record == null ? 'Application added.' : 'Application updated.')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final detail = _detail;
    final applicationsState = ref.watch(jobApplicationsControllerProvider(widget.jobId));
    final jobApplicationsBusy = applicationsState.metadata['saving'] == true;

    return GigvoraScaffold(
      title: detail?.title ?? 'Job',
      subtitle: detail?.organization ?? 'Explore the opportunity',
      floatingActionButton: detail == null
          ? null
          : FloatingActionButton.extended(
              onPressed: () => _openApplicationSheet(),
              icon: const Icon(Icons.add),
              label: const Text('Add application'),
            ),
      body: RefreshIndicator(
        onRefresh: () async {
          await Future.wait([
        _loadDetail(),
        ref.read(jobApplicationsControllerProvider(widget.jobId).notifier).refresh(),
      ]);
    },
        child: _loading
            ? const _CenteredProgress()
            : _error != null
                ? _ErrorView(error: _error!, onRetry: _loadDetail)
                : ListView(
                    padding: const EdgeInsets.all(24),
                    children: [
                      if (detail != null) ...[
                        _JobHeader(detail: detail),
                        const SizedBox(height: 24),
                        _JobSummary(detail: detail),
                        const SizedBox(height: 32),
                        _JobFacts(detail: detail),
                        const SizedBox(height: 32),
                      ],
                      _ApplicationsSection(
                        state: applicationsState,
                        onCreate: () => _openApplicationSheet(),
                        onEdit: _openApplicationSheet,
                        onScheduleInterview: (record) async {
                          final result = await showDialog<InterviewStep?>(
                            context: context,
                            builder: (context) => InterviewDialog(initial: null, record: record),
                          );
                          if (result != null) {
                            await ref
                                .read(jobApplicationsControllerProvider(widget.jobId).notifier)
                                .scheduleInterview(record.id, result);
                          }
                        },
                        onCancelInterview: (record, interview) async {
                          await ref
                              .read(jobApplicationsControllerProvider(widget.jobId).notifier)
                              .cancelInterview(record.id, interview.id);
                        },
                        onStatusChanged: (record, status) async {
                          await ref
                              .read(jobApplicationsControllerProvider(widget.jobId).notifier)
                              .updateStatus(record.id, status);
                        },
                        onDelete: (record) async {
                          final confirmed = await showDialog<bool>(
                                context: context,
                                builder: (context) => AlertDialog(
                                  title: const Text('Remove application'),
                                  content: Text('Delete ${record.applicantName}\'s application?'),
                                  actions: [
                                    TextButton(
                                      onPressed: () => Navigator.of(context).pop(false),
                                      child: const Text('Cancel'),
                                    ),
                                    FilledButton(
                                      onPressed: () => Navigator.of(context).pop(true),
                                      child: const Text('Delete'),
                                    ),
                                  ],
                                ),
                              ) ??
                              false;
                          if (confirmed) {
                            await ref
                                .read(jobApplicationsControllerProvider(widget.jobId).notifier)
                                .delete(record.id);
                          }
                        },
                        busy: jobApplicationsBusy,
                      ),
                    ],
                  ),
      ),
    );
  }
}

class _CenteredProgress extends StatelessWidget {
  const _CenteredProgress();

  @override
  Widget build(BuildContext context) {
    return const Center(child: CircularProgressIndicator());
  }
}

class _ErrorView extends StatelessWidget {
  const _ErrorView({required this.error, required this.onRetry});

  final Object error;
  final Future<void> Function() onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.warning_amber_rounded, size: 48),
            const SizedBox(height: 16),
            Text('We couldn\'t load this job. $error'),
            const SizedBox(height: 16),
            FilledButton(onPressed: onRetry, child: const Text('Retry')),
          ],
        ),
      ),
    );
  }
}

class _JobHeader extends ConsumerWidget {
  const _JobHeader({required this.detail});

  final OpportunityDetail detail;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final formatter = NumberFormat.compact();
    final bookmarks = detail.reviewCount;
    final rating = detail.rating ?? 0;
    return GigvoraCard(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            detail.title,
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: 4),
          Text(
            [detail.organization, detail.location ?? (detail.isRemote ? 'Remote' : null)]
                .whereType<String>()
                .join(' • '),
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 16),
          Wrap(
            spacing: 12,
            runSpacing: 12,
            children: [
              _InfoPill(icon: Icons.people_outline, label: '${formatter.format(bookmarks)} applicants'),
              _InfoPill(icon: Icons.star_rate_rounded, label: rating > 0 ? '$rating rating' : 'New role'),
              if (detail.duration != null)
                _InfoPill(icon: Icons.timer_outlined, label: detail.duration!),
              if (detail.employmentType != null)
                _InfoPill(icon: Icons.work_outline, label: detail.employmentType!),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              if (detail.ctaUrl != null)
                FilledButton.icon(
                  onPressed: () async {
                    final uri = Uri.tryParse(detail.ctaUrl!);
                    if (uri != null) {
                      await launchUrl(uri, mode: LaunchMode.externalApplication);
                    }
                  },
                  icon: const Icon(Icons.open_in_new),
                  label: const Text('Apply externally'),
                ),
              const SizedBox(width: 12),
              OutlinedButton.icon(
                onPressed: () async {
                  final analytics = ref.read(analyticsServiceProvider);
                  await analytics.track('job_share_clicked', context: {'jobId': detail.id});
                  final shareText = '${detail.title} at ${detail.organization ?? 'Gigvora'}';
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('Share link copied for $shareText')),
                  );
                },
                icon: const Icon(Icons.share_outlined),
                label: const Text('Share'),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _JobSummary extends StatelessWidget {
  const _JobSummary({required this.detail});

  final OpportunityDetail detail;

  @override
  Widget build(BuildContext context) {
    return GigvoraCard(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('About this opportunity', style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 12),
          Text(detail.summary ?? detail.description),
          const SizedBox(height: 16),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: detail.skills.take(8).map((skill) => Chip(label: Text(skill))).toList(),
          ),
        ],
      ),
    );
  }
}

class _JobFacts extends StatelessWidget {
  const _JobFacts({required this.detail});

  final OpportunityDetail detail;

  @override
  Widget build(BuildContext context) {
    final published = detail.publishedAt != null
        ? DateFormat.yMMMd().format(detail.publishedAt!)
        : 'Recently added';
    return GigvoraCard(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Role details', style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 16),
          _FactRow(label: 'Budget', value: detail.budget ?? 'Competitive'),
          _FactRow(label: 'Status', value: detail.status ?? 'Open'),
          _FactRow(label: 'Posted', value: published),
          if (detail.posterName != null) _FactRow(label: 'Hiring manager', value: detail.posterName!),
        ],
      ),
    );
  }
}

class _FactRow extends StatelessWidget {
  const _FactRow({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        children: [
          SizedBox(width: 160, child: Text(label, style: Theme.of(context).textTheme.bodyMedium)),
          Expanded(child: Text(value, style: Theme.of(context).textTheme.bodyLarge)),
        ],
      ),
    );
  }
}

class _InfoPill extends StatelessWidget {
  const _InfoPill({required this.icon, required this.label});

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Chip(
      avatar: Icon(icon, size: 18),
      label: Text(label),
      labelStyle: Theme.of(context).textTheme.bodyMedium,
    );
  }
}

class _ApplicationsSection extends StatelessWidget {
  const _ApplicationsSection({
    required this.state,
    required this.onCreate,
    required this.onEdit,
    required this.onScheduleInterview,
    required this.onCancelInterview,
    required this.onStatusChanged,
    required this.onDelete,
    required this.busy,
  });

  final ResourceState<List<JobApplicationRecord>> state;
  final VoidCallback onCreate;
  final ValueChanged<JobApplicationRecord?> onEdit;
  final Future<void> Function(JobApplicationRecord record) onScheduleInterview;
  final Future<void> Function(JobApplicationRecord record, InterviewStep interview) onCancelInterview;
  final Future<void> Function(JobApplicationRecord record, JobApplicationStatus status) onStatusChanged;
  final Future<void> Function(JobApplicationRecord record) onDelete;
  final bool busy;

  @override
  Widget build(BuildContext context) {
    final applications = state.data ?? const <JobApplicationRecord>[];
    if (state.loading) {
      return const _CenteredProgress();
    }
    if (applications.isEmpty) {
      return GigvoraCard(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Applications', style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 12),
            const Text('No applications yet. Capture candidates directly from calls, referrals, or live events.'),
            const SizedBox(height: 12),
            FilledButton.icon(
              onPressed: onCreate,
              icon: const Icon(Icons.add),
              label: const Text('Add first application'),
            ),
          ],
        ),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Text('Applications', style: Theme.of(context).textTheme.titleLarge),
            if (busy) ...[
              const SizedBox(width: 12),
              const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2)),
            ],
            const Spacer(),
            TextButton.icon(
              onPressed: onCreate,
              icon: const Icon(Icons.add),
              label: const Text('New application'),
            ),
          ],
        ),
        const SizedBox(height: 12),
        ...applications.map((record) {
          return Padding(
            padding: const EdgeInsets.only(bottom: 16),
            child: _ApplicationCard(
              record: record,
              onEdit: () => onEdit(record),
              onScheduleInterview: () => onScheduleInterview(record),
              onCancelInterview: (interview) => onCancelInterview(record, interview),
              onStatusChanged: (status) => onStatusChanged(record, status),
              onDelete: () => onDelete(record),
            ),
          );
        }),
      ],
    );
  }
}

class _ApplicationCard extends StatelessWidget {
  const _ApplicationCard({
    required this.record,
    required this.onEdit,
    required this.onScheduleInterview,
    required this.onCancelInterview,
    required this.onStatusChanged,
    required this.onDelete,
  });

  final JobApplicationRecord record;
  final VoidCallback onEdit;
  final Future<void> Function() onScheduleInterview;
  final Future<void> Function(InterviewStep interview) onCancelInterview;
  final Future<void> Function(JobApplicationStatus status) onStatusChanged;
  final Future<void> Function() onDelete;

  @override
  Widget build(BuildContext context) {
    final dateFormat = DateFormat.yMMMd();
    return GigvoraCard(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(record.applicantName, style: Theme.of(context).textTheme.titleMedium),
                    Text(record.email, style: Theme.of(context).textTheme.bodySmall),
                  ],
                ),
              ),
              PopupMenuButton<JobApplicationStatus>(
                tooltip: 'Update status',
                onSelected: onStatusChanged,
                itemBuilder: (context) {
                  return JobApplicationStatus.values
                      .map(
                        (status) => PopupMenuItem<JobApplicationStatus>(
                          value: status,
                          child: Text(status.label),
                        ),
                      )
                      .toList();
                },
                child: Chip(
                  label: Text(record.status.label),
                  avatar: const Icon(Icons.flag_outlined, size: 18),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 12,
            runSpacing: 8,
            children: [
              _MiniInfo(label: 'Submitted', value: dateFormat.format(record.createdAt)),
              if (record.resumeUrl != null)
                TextButton.icon(
                  onPressed: () => launchUrl(Uri.parse(record.resumeUrl!)),
                  icon: const Icon(Icons.description_outlined),
                  label: const Text('Resume'),
                ),
              if (record.portfolioUrl != null)
                TextButton.icon(
                  onPressed: () => launchUrl(Uri.parse(record.portfolioUrl!)),
                  icon: const Icon(Icons.open_in_browser),
                  label: const Text('Portfolio'),
                ),
            ],
          ),
          if (record.coverLetter != null && record.coverLetter!.isNotEmpty) ...[
            const SizedBox(height: 12),
            Text(
              record.coverLetter!,
              style: Theme.of(context).textTheme.bodyMedium,
            ),
          ],
          if (record.interviews.isNotEmpty) ...[
            const SizedBox(height: 12),
            _InterviewTimeline(record: record, onCancel: onCancelInterview),
          ],
          const SizedBox(height: 12),
          Row(
            children: [
              TextButton.icon(onPressed: onEdit, icon: const Icon(Icons.edit_outlined), label: const Text('Edit')),
              const SizedBox(width: 12),
              TextButton.icon(
                onPressed: onScheduleInterview,
                icon: const Icon(Icons.calendar_today_outlined),
                label: const Text('Schedule interview'),
              ),
              const Spacer(),
              TextButton.icon(
                onPressed: onDelete,
                icon: const Icon(Icons.delete_outline),
                label: const Text('Delete'),
                style: TextButton.styleFrom(foregroundColor: Theme.of(context).colorScheme.error),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _MiniInfo extends StatelessWidget {
  const _MiniInfo({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label.toUpperCase(), style: Theme.of(context).textTheme.labelSmall),
        Text(value, style: Theme.of(context).textTheme.bodyMedium),
      ],
    );
  }
}

class _InterviewTimeline extends StatelessWidget {
  const _InterviewTimeline({required this.record, required this.onCancel});

  final JobApplicationRecord record;
  final Future<void> Function(InterviewStep interview) onCancel;

  @override
  Widget build(BuildContext context) {
    final format = DateFormat('MMM d • HH:mm');
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Interviews', style: Theme.of(context).textTheme.titleSmall),
        const SizedBox(height: 8),
        ...record.interviews.map((step) {
          return Padding(
            padding: const EdgeInsets.symmetric(vertical: 6),
            child: Row(
              children: [
                const Icon(Icons.calendar_today_outlined, size: 18),
                const SizedBox(width: 8),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(step.label, style: Theme.of(context).textTheme.bodyMedium),
                      Text(format.format(step.startsAt), style: Theme.of(context).textTheme.bodySmall),
                      if (step.format != null)
                        Text(step.format!, style: Theme.of(context).textTheme.bodySmall),
                    ],
                  ),
                ),
                IconButton(
                  tooltip: 'Cancel interview',
                  onPressed: () => onCancel(step),
                  icon: const Icon(Icons.close),
                ),
              ],
            ),
          );
        }),
      ],
    );
  }
}

class JobApplicationSheet extends StatefulWidget {
  const JobApplicationSheet({
    super.key,
    required this.detail,
    this.initial,
    required this.onSubmit,
  });

  final OpportunityDetail detail;
  final JobApplicationRecord? initial;
  final Future<void> Function(JobApplicationDraft draft) onSubmit;

  @override
  State<JobApplicationSheet> createState() => _JobApplicationSheetState();
}

class _JobApplicationSheetState extends State<JobApplicationSheet> {
  late final TextEditingController _nameController;
  late final TextEditingController _emailController;
  late final TextEditingController _phoneController;
  late final TextEditingController _resumeController;
  late final TextEditingController _portfolioController;
  late final TextEditingController _coverLetterController;
  final _formKey = GlobalKey<FormState>();
  bool _submitting = false;

  @override
  void initState() {
    super.initState();
    final initial = widget.initial;
    _nameController = TextEditingController(text: initial?.applicantName ?? '');
    _emailController = TextEditingController(text: initial?.email ?? '');
    _phoneController = TextEditingController(text: initial?.phone ?? '');
    _resumeController = TextEditingController(text: initial?.resumeUrl ?? '');
    _portfolioController = TextEditingController(text: initial?.portfolioUrl ?? '');
    _coverLetterController = TextEditingController(text: initial?.coverLetter ?? '');
  }

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _resumeController.dispose();
    _portfolioController.dispose();
    _coverLetterController.dispose();
    super.dispose();
  }

  Future<void> _handleSubmit() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }
    setState(() => _submitting = true);
    final draft = JobApplicationDraft(
      applicantName: _nameController.text.trim(),
      email: _emailController.text.trim(),
      phone: _phoneController.text.trim().isEmpty ? null : _phoneController.text.trim(),
      resumeUrl: _resumeController.text.trim().isEmpty ? null : _resumeController.text.trim(),
      portfolioUrl: _portfolioController.text.trim().isEmpty ? null : _portfolioController.text.trim(),
      coverLetter: _coverLetterController.text.trim().isEmpty ? null : _coverLetterController.text.trim(),
    );
    await widget.onSubmit(draft);
    if (!mounted) return;
    Navigator.of(context).pop(true);
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        left: 24,
        right: 24,
        bottom: MediaQuery.of(context).viewInsets.bottom + 24,
        top: 24,
      ),
      child: Form(
        key: _formKey,
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(widget.initial == null ? 'New application' : 'Edit application',
                  style: Theme.of(context).textTheme.titleLarge),
              const SizedBox(height: 16),
              TextFormField(
                controller: _nameController,
                decoration: const InputDecoration(labelText: 'Candidate name'),
                validator: (value) => value == null || value.trim().isEmpty ? 'Enter a name' : null,
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
                controller: _phoneController,
                decoration: const InputDecoration(labelText: 'Phone (optional)'),
                keyboardType: TextInputType.phone,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _resumeController,
                decoration: const InputDecoration(labelText: 'Resume URL'),
                keyboardType: TextInputType.url,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _portfolioController,
                decoration: const InputDecoration(labelText: 'Portfolio URL'),
                keyboardType: TextInputType.url,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _coverLetterController,
                decoration: const InputDecoration(labelText: 'Cover letter or notes'),
                maxLines: 5,
              ),
              const SizedBox(height: 20),
              FilledButton.icon(
                onPressed: _submitting ? null : _handleSubmit,
                icon: _submitting
                    ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
                    : const Icon(Icons.check),
                label: Text(_submitting ? 'Saving...' : 'Save application'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class InterviewDialog extends StatefulWidget {
  const InterviewDialog({super.key, required this.initial, required this.record});

  final InterviewStep? initial;
  final JobApplicationRecord record;

  @override
  State<InterviewDialog> createState() => _InterviewDialogState();
}

class _InterviewDialogState extends State<InterviewDialog> {
  late final TextEditingController _labelController;
  late final TextEditingController _formatController;
  late final TextEditingController _hostController;
  late final TextEditingController _notesController;
  DateTime _dateTime = DateTime.now().add(const Duration(days: 2));

  @override
  void initState() {
    super.initState();
    final initial = widget.initial;
    _labelController = TextEditingController(text: initial?.label ?? 'Interview');
    _formatController = TextEditingController(text: initial?.format ?? 'Video');
    _hostController = TextEditingController(text: initial?.host ?? '');
    _notesController = TextEditingController(text: initial?.notes ?? '');
    _dateTime = initial?.startsAt ?? _dateTime;
  }

  @override
  void dispose() {
    _labelController.dispose();
    _formatController.dispose();
    _hostController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _pickDateTime() async {
    final date = await showDatePicker(
      context: context,
      initialDate: _dateTime,
      firstDate: DateTime.now().subtract(const Duration(days: 1)),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );
    if (date == null) return;
    final time = await showTimePicker(context: context, initialTime: TimeOfDay.fromDateTime(_dateTime));
    if (time == null) return;
    setState(() {
      _dateTime = DateTime(date.year, date.month, date.day, time.hour, time.minute);
    });
  }

  @override
  Widget build(BuildContext context) {
    final dateLabel = DateFormat('EEE, MMM d – HH:mm').format(_dateTime);
    return AlertDialog(
      title: const Text('Schedule interview'),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: _labelController,
              decoration: const InputDecoration(labelText: 'Title'),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _formatController,
              decoration: const InputDecoration(labelText: 'Format'),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _hostController,
              decoration: const InputDecoration(labelText: 'Host (optional)'),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _notesController,
              decoration: const InputDecoration(labelText: 'Notes (optional)'),
              maxLines: 3,
            ),
            const SizedBox(height: 16),
            ListTile(
              contentPadding: EdgeInsets.zero,
              leading: const Icon(Icons.calendar_today_outlined),
              title: Text(dateLabel),
              subtitle: const Text('Tap to change'),
              onTap: _pickDateTime,
            ),
          ],
        ),
      ),
      actions: [
        TextButton(onPressed: () => Navigator.of(context).pop(), child: const Text('Cancel')),
        FilledButton(
          onPressed: () {
            final step = InterviewStep(
              id: widget.initial?.id ?? 'interview-${DateTime.now().microsecondsSinceEpoch}',
              label: _labelController.text.trim().isEmpty ? 'Interview' : _labelController.text.trim(),
              startsAt: _dateTime,
              format: _formatController.text.trim().isEmpty ? null : _formatController.text.trim(),
              host: _hostController.text.trim().isEmpty ? null : _hostController.text.trim(),
              notes: _notesController.text.trim().isEmpty ? null : _notesController.text.trim(),
            );
            Navigator.of(context).pop(step);
          },
          child: const Text('Save'),
        ),
      ],
    );
  }
}
