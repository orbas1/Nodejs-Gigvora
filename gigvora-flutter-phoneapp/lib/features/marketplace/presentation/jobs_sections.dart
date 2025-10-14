import 'package:flutter/material.dart';
import 'package:gigvora_foundation/gigvora_foundation.dart';

import '../../../theme/widgets.dart';

class JobApplication {
  const JobApplication({
    required this.id,
    required this.role,
    required this.company,
    required this.stage,
    required this.submittedAt,
    required this.lastUpdated,
    this.nextStep,
    this.requiresAction = false,
  });

  final String id;
  final String role;
  final String company;
  final JobApplicationStage stage;
  final DateTime submittedAt;
  final DateTime lastUpdated;
  final String? nextStep;
  final bool requiresAction;
}

enum JobApplicationStage {
  submitted('Submitted', Color(0xFF38BDF8), false),
  reviewing('Under review', Color(0xFFFBBF24), false),
  interview('Interviewing', Color(0xFF34D399), false),
  offer('Offer', Color(0xFF6366F1), false),
  rejected('Closed', Color(0xFF94A3B8), true);

  const JobApplicationStage(this.label, this.color, this.isClosed);

  final String label;
  final Color color;
  final bool isClosed;
}

class JobInterview {
  const JobInterview({
    required this.id,
    required this.role,
    required this.company,
    required this.stage,
    required this.scheduledAt,
    required this.format,
    required this.host,
    this.location,
    this.prepNotes,
  });

  final String id;
  final String role;
  final String company;
  final String stage;
  final DateTime scheduledAt;
  final InterviewFormat format;
  final String host;
  final String? location;
  final String? prepNotes;
}

enum InterviewFormat { inPerson, virtual }

class ManagedJob {
  const ManagedJob({
    required this.id,
    required this.title,
    required this.team,
    required this.status,
    required this.pipelineStage,
    required this.totalApplicants,
    required this.lastActivity,
    this.highlight,
  });

  final String id;
  final String title;
  final String team;
  final String status;
  final String pipelineStage;
  final int totalApplicants;
  final DateTime lastActivity;
  final String? highlight;
}

class JobApplicationsPanel extends StatelessWidget {
  const JobApplicationsPanel({super.key, required this.applications});

  final List<JobApplication> applications;

  int get _activeCount =>
      applications.where((application) => !application.stage.isClosed).length;

  @override
  Widget build(BuildContext context) {
    if (applications.isEmpty) {
      return _EmptyState(
        icon: Icons.task_alt,
        message: 'You have not submitted any applications yet. Start from the jobs board to find a role that fits you.',
        actionLabel: 'Browse open jobs',
      );
    }

    final total = applications.length;
    final awaitingAction = applications.where((app) => app.requiresAction).length;

    return ListView.separated(
      physics: const AlwaysScrollableScrollPhysics(),
      itemCount: applications.length + 1,
      separatorBuilder: (_, __) => const SizedBox(height: 16),
      itemBuilder: (context, index) {
        if (index == 0) {
          return GigvoraCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Application summary', style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 12),
                Wrap(
                  spacing: 16,
                  runSpacing: 12,
                  children: [
                    _SummaryChip(label: 'Active', value: '$_activeCount'),
                    _SummaryChip(label: 'Total submitted', value: '$total'),
                    _SummaryChip(label: 'Awaiting action', value: '$awaitingAction'),
                  ],
                ),
                const SizedBox(height: 16),
                Text(
                  'Stay ahead of the hiring team by nudging stalled conversations or preparing for upcoming interviews.',
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
              ],
            ),
          );
        }

        final application = applications[index - 1];
        return GigvoraCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Text(
                      application.role,
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Chip(
                    backgroundColor: application.stage.color.withOpacity(0.12),
                    label: Text(
                      application.stage.label,
                      style: Theme.of(context)
                          .textTheme
                          .bodySmall
                          ?.copyWith(color: application.stage.color),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 4),
              Text(
                application.company,
                style: Theme.of(context)
                    .textTheme
                    .bodyMedium
                    ?.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant),
              ),
              const SizedBox(height: 12),
              Text(
                'Submitted ${formatRelativeTime(application.submittedAt)} · Updated ${formatRelativeTime(application.lastUpdated)}',
                style: Theme.of(context).textTheme.bodySmall,
              ),
              if (application.nextStep != null) ...[
                const SizedBox(height: 12),
                _InformationRow(icon: Icons.flag, label: application.nextStep!),
              ],
              const SizedBox(height: 16),
              Row(
                children: [
                  ElevatedButton(onPressed: () {}, child: const Text('View application')),
                  const SizedBox(width: 12),
                  if (application.requiresAction)
                    OutlinedButton(onPressed: () {}, child: const Text('Upload update')),
                ],
              ),
            ],
          ),
        );
      },
    );
  }
}

class JobInterviewsPanel extends StatelessWidget {
  const JobInterviewsPanel({super.key, required this.interviews});

  final List<JobInterview> interviews;

  @override
  Widget build(BuildContext context) {
    if (interviews.isEmpty) {
      return _EmptyState(
        icon: Icons.video_camera_front,
        message: 'Interviews that you schedule or are invited to will appear here.',
        actionLabel: 'Review your applications',
      );
    }

    final sortedInterviews = List<JobInterview>.from(interviews)
      ..sort((a, b) => a.scheduledAt.compareTo(b.scheduledAt));

    final nextInterview = sortedInterviews.first;

    return ListView.separated(
      physics: const AlwaysScrollableScrollPhysics(),
      itemCount: sortedInterviews.length + 1,
      separatorBuilder: (_, __) => const SizedBox(height: 16),
      itemBuilder: (context, index) {
        if (index == 0) {
          return GigvoraCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Next interview', style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 12),
                Text(
                  '${nextInterview.role} with ${nextInterview.company}',
                  style: Theme.of(context).textTheme.titleSmall,
                ),
                const SizedBox(height: 8),
                _InformationRow(
                  icon: nextInterview.format == InterviewFormat.virtual ? Icons.laptop : Icons.pin_drop,
                  label:
                      nextInterview.format == InterviewFormat.virtual ? 'Virtual session' : (nextInterview.location ?? 'On-site'),
                ),
                const SizedBox(height: 4),
                _InformationRow(
                  icon: Icons.schedule,
                  label: formatAbsolute(nextInterview.scheduledAt),
                ),
                const SizedBox(height: 12),
                Text(
                  'Arrive 10 minutes early and prepare a short case study on your most impactful recent project.',
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
              ],
            ),
          );
        }

        final interview = sortedInterviews[index - 1];
        return GigvoraCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                interview.role,
                style: Theme.of(context).textTheme.titleMedium,
              ),
              const SizedBox(height: 4),
              Text(
                interview.company,
                style: Theme.of(context)
                    .textTheme
                    .bodyMedium
                    ?.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant),
              ),
              const SizedBox(height: 12),
              Wrap(
                spacing: 12,
                runSpacing: 8,
                children: [
                  _InformationRow(
                    icon: Icons.schedule,
                    label: formatAbsolute(interview.scheduledAt),
                  ),
                  _InformationRow(
                    icon: interview.format == InterviewFormat.virtual ? Icons.wifi : Icons.meeting_room,
                    label: interview.format == InterviewFormat.virtual
                        ? 'Virtual · Hosted by ${interview.host}'
                        : '${interview.location ?? 'On-site'} · Host ${interview.host}',
                  ),
                  _InformationRow(icon: Icons.layers, label: interview.stage),
                ],
              ),
              if (interview.prepNotes != null) ...[
                const SizedBox(height: 12),
                Text(
                  interview.prepNotes!,
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
              ],
              const SizedBox(height: 16),
              Row(
                children: [
                  ElevatedButton(onPressed: () {}, child: const Text('Add to calendar')),
                  const SizedBox(width: 12),
                  OutlinedButton(onPressed: () {}, child: const Text('Share availability')),
                ],
              ),
            ],
          ),
        );
      },
    );
  }
}

class JobsManagementPanel extends StatelessWidget {
  const JobsManagementPanel({super.key, required this.jobs});

  final List<ManagedJob> jobs;

  @override
  Widget build(BuildContext context) {
    if (jobs.isEmpty) {
      return _EmptyState(
        icon: Icons.work_outline,
        message: 'Roles that you publish across the network will show up here so you can track applicants end-to-end.',
        actionLabel: 'Post a role',
      );
    }

    return ListView.separated(
      physics: const AlwaysScrollableScrollPhysics(),
      itemCount: jobs.length + 1,
      separatorBuilder: (_, __) => const SizedBox(height: 16),
      itemBuilder: (context, index) {
        if (index == 0) {
          return GigvoraCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Manage your hiring pipeline', style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 12),
                Text(
                  'Monitor candidates and collaborate with your team without leaving the mobile app. You can pause sourcing, message candidates, or schedule interviews in one place.',
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    ElevatedButton(onPressed: () {}, child: const Text('Post a role')),
                    const SizedBox(width: 12),
                    OutlinedButton(onPressed: () {}, child: const Text('Sync with ATS')),
                  ],
                ),
              ],
            ),
          );
        }

        final job = jobs[index - 1];
        return GigvoraCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Text(job.title, style: Theme.of(context).textTheme.titleMedium),
                  ),
                  const SizedBox(width: 12),
                  Chip(
                    backgroundColor: Theme.of(context).colorScheme.primary.withOpacity(0.12),
                    label: Text(
                      job.status,
                      style: Theme.of(context)
                          .textTheme
                          .bodySmall
                          ?.copyWith(color: Theme.of(context).colorScheme.primary),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 4),
              Text(
                job.team,
                style: Theme.of(context)
                    .textTheme
                    .bodyMedium
                    ?.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant),
              ),
              const SizedBox(height: 12),
              Wrap(
                spacing: 12,
                runSpacing: 8,
                children: [
                  _InformationRow(
                    icon: Icons.groups,
                    label: '${job.totalApplicants} applicants',
                  ),
                  _InformationRow(icon: Icons.timeline, label: job.pipelineStage),
                  _InformationRow(
                    icon: Icons.update,
                    label: 'Updated ${formatRelativeTime(job.lastActivity)}',
                  ),
                ],
              ),
              if (job.highlight != null) ...[
                const SizedBox(height: 12),
                Text(
                  job.highlight!,
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
              ],
              const SizedBox(height: 16),
              Row(
                children: [
                  ElevatedButton(onPressed: () {}, child: const Text('Review candidates')),
                  const SizedBox(width: 12),
                  OutlinedButton(onPressed: () {}, child: const Text('Share update')),
                ],
              ),
            ],
          ),
        );
      },
    );
  }
}

class _SummaryChip extends StatelessWidget {
  const _SummaryChip({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: const Color(0xFFE2E8F0),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: Theme.of(context).textTheme.bodySmall),
          const SizedBox(height: 4),
          Text(
            value,
            style: Theme.of(context).textTheme.titleMedium,
          ),
        ],
      ),
    );
  }
}

class _InformationRow extends StatelessWidget {
  const _InformationRow({required this.icon, required this.label});

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Icon(icon, size: 18, color: Theme.of(context).colorScheme.primary),
        const SizedBox(width: 6),
        Flexible(
          child: Text(
            label,
            style: Theme.of(context).textTheme.bodySmall,
          ),
        ),
      ],
    );
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState({
    required this.icon,
    required this.message,
    required this.actionLabel,
  });

  final IconData icon;
  final String message;
  final String actionLabel;

  @override
  Widget build(BuildContext context) {
    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      children: [
        const SizedBox(height: 80),
        GigvoraCard(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Icon(icon, size: 48, color: Theme.of(context).colorScheme.primary),
              const SizedBox(height: 16),
              Text(
                message,
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodyMedium,
              ),
              const SizedBox(height: 16),
              OutlinedButton(onPressed: () {}, child: Text(actionLabel)),
            ],
          ),
        ),
      ],
    );
  }
}

