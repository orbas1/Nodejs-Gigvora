import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../theme/widgets.dart';

class GigLifecycleShowcase extends ConsumerWidget {
  const GigLifecycleShowcase({super.key});

  static final _timelinePhases = [
    (
      title: 'Discovery & alignment',
      description:
          'Intake briefs, confirm budgets, and sync expectations before pitches move forward.',
      metrics: ['24h response SLA', 'Compliance ready', 'Kickoff assets mapped'],
    ),
    (
      title: 'Pitching & selection',
      description:
          'Structured submissions, auto-verification, and transparent scoring keep decisions moving.',
      metrics: ['Shortlist scoring', 'Live Q&A', 'Instant status updates'],
    ),
    (
      title: 'Delivery & QA',
      description:
          'Milestones, revision controls, and risk surfacing align crews through delivery.',
      metrics: ['Milestones locked', 'Revision windows', 'Escalation path set'],
    ),
    (
      title: 'Review & showcase',
      description:
          'Capture outcomes, publish highlights, and syndicate wins across Gigvora.',
      metrics: ['Review automation', 'Portfolio assets', 'Client satisfaction pulse'],
    ),
  ];

  static const _submissionSteps = [
    'Structured pitch templates mapped to buyer scoring.',
    'Identity and compliance guardrails at every handoff.',
    'Smart reminders across web and mobile to hit timelines.',
    'Escrow-ready billing with audit trails.',
  ];

  static const _levels = [
    ('Launch', 'Rapid-response gigs with fixed deliverables and lean pods.'),
    ('Growth', 'Multi-sprint missions blending strategy, build, and enablement.'),
    ('Scale', 'Enterprise programs with governance checkpoints and reporting.'),
  ];

  static const _addons = [
    'Timeline accelerators & rush delivery',
    'Gigvora specialist workshops',
    'Analytics and reporting bundles',
    'Async enablement packs',
  ];

  static const _tasks = [
    'Milestone orchestration with auto-reminders',
    'Dependency mapping and risk surfacing',
    'Live status syncing to dashboards',
    'Revision tracking and asset locking',
  ];

  static const _mediaCallouts = [
    ('Gig banner', 'Gradient-ready artwork optimised for desktop and mobile hero slots.'),
    ('Gig media', 'Upload decks, captures, and testimonials with auto-formatting safeguards.'),
    ('Description & FAQ', 'Rich text, collapsible guidance, and localisation fields.'),
  ];

  static const _faq = [
    (
      'Who can manage gigs?',
      'Verified freelancer, agency, operations, or admin memberships with marketplace clearance.',
    ),
    (
      'How do reviews work?',
      'Clients complete structured scorecards. Ratings sync to showcases with moderation controls.',
    ),
    (
      'Is the mobile app in parity?',
      'Yes. Approvals, messaging, and analytics mirror the web workspace with secure biometrics.',
    ),
  ];

  static const _reviews = [
    'Scorecards track quality, communication, and outcome confidence.',
    'Sentiment analysis surfaces coaching moments and wins.',
    'Visibility rules ensure only approved stories publish to your showcase.',
  ];

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(36),
        gradient: LinearGradient(
          colors: [
            colorScheme.surface,
            colorScheme.surfaceVariant.withOpacity(0.4),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        border: Border.all(color: colorScheme.outlineVariant.withOpacity(0.35)),
      ),
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Gig operations',
            style: theme.textTheme.labelSmall?.copyWith(
              letterSpacing: 4,
              fontWeight: FontWeight.w600,
              color: colorScheme.primary,
            ),
          ),
          const SizedBox(height: 12),
          Text(
            'Operational blueprint',
            style: theme.textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: 8),
          Text(
            'Timeline, compliance, storytelling, and reviews all stay in sync across Gigvora web and mobile. Use this playbook to launch every engagement with confidence.',
            style: theme.textTheme.bodyMedium?.copyWith(color: colorScheme.onSurfaceVariant),
          ),
          const SizedBox(height: 24),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              GigvoraCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _sectionEyebrow(context, 'Timeline'),
                    const SizedBox(height: 16),
                    ..._timelinePhases.map((phase) => _TimelineTile(phase: phase)),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              GigvoraCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _sectionEyebrow(context, 'Submission & setup'),
                    const SizedBox(height: 12),
                    ..._submissionSteps.map(
                      (step) => Padding(
                        padding: const EdgeInsets.only(bottom: 8),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Container(
                              margin: const EdgeInsets.only(top: 6),
                              height: 8,
                              width: 8,
                              decoration: BoxDecoration(
                                color: colorScheme.primary,
                                borderRadius: BorderRadius.circular(999),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Text(
                                step,
                                style: theme.textTheme.bodyMedium,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    Container(
                      margin: const EdgeInsets.only(top: 12),
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: colorScheme.primaryContainer.withOpacity(0.4),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: colorScheme.primary.withOpacity(0.4)),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Mobile parity',
                            style: theme.textTheme.titleSmall?.copyWith(
                              fontWeight: FontWeight.w600,
                              color: colorScheme.primary,
                            ),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            'Gigvora for iOS and Android mirrors approvals, messaging, and analytics so teams stay aligned everywhere.',
                            style: theme.textTheme.bodySmall?.copyWith(
                              color: colorScheme.primary,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              GigvoraCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _sectionEyebrow(context, 'Levels & addons', color: colorScheme.tertiary),
                    const SizedBox(height: 12),
                    ..._levels.map(
                      (level) => Container(
                        margin: const EdgeInsets.only(bottom: 12),
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: colorScheme.tertiaryContainer.withOpacity(0.35),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: colorScheme.tertiary.withOpacity(0.4)),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              level.$1,
                              style: theme.textTheme.titleSmall?.copyWith(
                                fontWeight: FontWeight.w600,
                                color: colorScheme.tertiary,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              level.$2,
                              style: theme.textTheme.bodySmall?.copyWith(
                                color: colorScheme.tertiary,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    Text(
                      'Popular addons',
                      style: theme.textTheme.labelSmall?.copyWith(
                        letterSpacing: 1.2,
                        fontWeight: FontWeight.w600,
                        color: colorScheme.tertiary,
                      ),
                    ),
                    const SizedBox(height: 8),
                    ..._addons.map(
                      (addon) => Padding(
                        padding: const EdgeInsets.only(bottom: 6),
                        child: Text('• $addon', style: theme.textTheme.bodySmall?.copyWith(color: colorScheme.tertiary)),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              GigvoraCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _sectionEyebrow(context, 'Tasks & media'),
                    const SizedBox(height: 12),
                    ..._tasks.map(
                      (task) => Padding(
                        padding: const EdgeInsets.only(bottom: 6),
                        child: Text('• $task', style: theme.textTheme.bodyMedium),
                      ),
                    ),
                    const SizedBox(height: 16),
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: colorScheme.surfaceVariant.withOpacity(0.4),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: colorScheme.outlineVariant.withOpacity(0.5)),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: _mediaCallouts
                            .map(
                              (callout) => Padding(
                                padding: const EdgeInsets.only(bottom: 12),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      callout.$1,
                                      style: theme.textTheme.labelMedium?.copyWith(
                                        letterSpacing: 1.1,
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      callout.$2,
                                      style: theme.textTheme.bodySmall?.copyWith(
                                        color: colorScheme.onSurfaceVariant,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            )
                            .toList(),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              GigvoraCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _sectionEyebrow(context, 'FAQ & reviews', color: colorScheme.secondary),
                    const SizedBox(height: 12),
                    ..._faq.map(
                      (entry) => Container(
                        margin: const EdgeInsets.only(bottom: 12),
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: colorScheme.secondaryContainer.withOpacity(0.35),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: colorScheme.secondary.withOpacity(0.3)),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              entry.$1,
                              style: theme.textTheme.titleSmall?.copyWith(
                                fontWeight: FontWeight.w600,
                                color: colorScheme.secondary,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              entry.$2,
                              style: theme.textTheme.bodySmall?.copyWith(color: colorScheme.secondary),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Reviews & showcase',
                      style: theme.textTheme.labelSmall?.copyWith(
                        letterSpacing: 1.2,
                        fontWeight: FontWeight.w600,
                        color: colorScheme.secondary,
                      ),
                    ),
                    const SizedBox(height: 8),
                    ..._reviews.map(
                      (entry) => Padding(
                        padding: const EdgeInsets.only(bottom: 6),
                        child: Text('• $entry', style: theme.textTheme.bodySmall?.copyWith(color: colorScheme.secondary)),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _sectionEyebrow(BuildContext context, String label, {Color? color}) {
    final theme = Theme.of(context);
    final resolved = color ?? Theme.of(context).colorScheme.primary;
    return Text(
      label.toUpperCase(),
      style: theme.textTheme.labelSmall?.copyWith(
        letterSpacing: 1.8,
        fontWeight: FontWeight.w600,
        color: resolved,
      ),
    );
  }
}

class _TimelineTile extends StatelessWidget {
  const _TimelineTile({required this.phase});

  final (String title, String description, List<String> metrics) phase;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: colorScheme.surfaceVariant.withOpacity(0.35),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: colorScheme.primary.withOpacity(0.25)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            phase.$1,
            style: theme.textTheme.titleSmall?.copyWith(
              fontWeight: FontWeight.w600,
              color: colorScheme.primary,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            phase.$2,
            style: theme.textTheme.bodySmall?.copyWith(
              color: colorScheme.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: phase.$3
                .map(
                  (metric) => Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: colorScheme.primary.withOpacity(0.08),
                      borderRadius: BorderRadius.circular(999),
                      border: Border.all(color: colorScheme.primary.withOpacity(0.2)),
                    ),
                    child: Text(
                      metric,
                      style: theme.textTheme.labelSmall?.copyWith(
                        fontWeight: FontWeight.w600,
                        color: colorScheme.primary,
                      ),
                    ),
                  ),
                )
                .toList(),
          ),
        ],
      ),
    );
  }
}
