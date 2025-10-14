import 'dart:math';

import 'package:flutter/material.dart';

import '../domain/user_dashboard.dart';

class UserDashboardRepository {
  UserDashboardSnapshot? _cached;
  DateTime? _cachedAt;

  static const _cacheTtl = Duration(minutes: 3);

  Future<UserDashboardSnapshot> fetchDashboard({bool forceRefresh = false}) async {
    final now = DateTime.now();
    final cacheValid =
        !forceRefresh && _cached != null && _cachedAt != null && now.difference(_cachedAt!) < _cacheTtl;
    if (cacheValid) {
      return _cached!.copyWith(fromCache: true);
    }

    await Future.delayed(const Duration(milliseconds: 360));

    final random = Random();
    int jitter(int base, int spread) => max(0, base + random.nextInt(spread * 2 + 1) - spread);
    double jitterRatio(double base, double spread) {
      final offset = (random.nextDouble() * spread * 2) - spread;
      return (base + offset).clamp(0.0, 1.0);
    }

    final summary = UserDashboardSummary(
      totalApplications: jitter(48, 4),
      activeApplications: jitter(14, 3),
      interviewsScheduled: jitter(5, 2),
      documentsUploaded: jitter(18, 3),
      offersNegotiating: jitter(2, 1),
      connections: jitter(126, 12),
    );

    final stages = <UserPipelineStage>[
      UserPipelineStage(name: 'Sourcing', count: jitter(12, 2), serviceLevelHealth: jitterRatio(0.92, 0.04)),
      UserPipelineStage(name: 'Applied', count: jitter(18, 3), serviceLevelHealth: jitterRatio(0.88, 0.05)),
      UserPipelineStage(name: 'Interviewing', count: jitter(9, 2), serviceLevelHealth: jitterRatio(0.83, 0.05)),
      UserPipelineStage(name: 'Offers', count: jitter(3, 1), serviceLevelHealth: jitterRatio(0.79, 0.06)),
    ];

    final reminders = <UserPipelineReminder>[
      UserPipelineReminder(
        label: 'Send thank-you note to Atlas Studios panel',
        dueAt: now.add(const Duration(hours: 6)),
        priority: ReminderPriority.high,
      ),
      UserPipelineReminder(
        label: 'Review auto-apply guardrails',
        dueAt: now.add(const Duration(hours: 14)),
        priority: ReminderPriority.medium,
      ),
      UserPipelineReminder(
        label: 'Prep compensation benchmarks for Nova Health',
        dueAt: now.add(const Duration(days: 1)),
        priority: ReminderPriority.low,
      ),
    ];

    final pipeline = UserPipelineAutomation(
      boardName: 'Automation workbench',
      completionRate: jitterRatio(0.82, 0.05),
      stages: stages,
      reminders: reminders,
      guardrails: const [
        'Two-step verification on premium roles',
        'Manual review for executive offers',
        'Diversity interview slate enforcement',
      ],
      nextAudit: now.add(const Duration(days: 3)),
    );

    final interviews = <UserInterviewSchedule>[
      UserInterviewSchedule(
        role: 'Product Design Lead',
        company: 'Atlas Studios',
        scheduledAt: now.add(const Duration(days: 1, hours: 3)),
        stage: 'Portfolio deep-dive',
        panel: 'Hiring manager + design director',
        location: 'Video conference',
      ),
      UserInterviewSchedule(
        role: 'Design Systems Architect',
        company: 'Nova Health',
        scheduledAt: now.add(const Duration(days: 2, hours: 5)),
        stage: 'Technical presentation',
        panel: 'Principal designer & VP product',
        location: 'Hybrid - HQ North Wing',
      ),
      UserInterviewSchedule(
        role: 'Experience Strategy Consultant',
        company: 'Horizon Labs',
        scheduledAt: now.add(const Duration(days: 4, hours: 2)),
        stage: 'Executive alignment',
        panel: 'CPO + Strategy lead',
        location: 'Video conference',
      ),
    ];

    final documentStudio = DocumentStudioDigest(
      totalAssets: jitter(28, 4),
      templates: jitter(12, 2),
      portfolioProjects: jitter(6, 1),
      vendorDeliverables: jitter(4, 1),
      lastUpdatedBy: 'You, ${now.subtract(const Duration(hours: 5)).hour}:00 today',
      highlights: const [
        'Leadership resume updated with quantified outcomes',
        'Offer negotiation pack refreshed with compensation grids',
        'Case study vault synced for recruiter sharing',
      ],
    );

    final nextActions = <UserDashboardAction>[
      UserDashboardAction(
        label: 'Approve automation nudges',
        description: 'Review 3 recommended follow-ups before the evening send window.',
        icon: Icons.rule,
        accent: const Color(0xFF2563EB),
      ),
      UserDashboardAction(
        label: 'Share interview prep kit',
        description: 'Distribute tomorrow’s talking points and scorecards to collaborators.',
        icon: Icons.groups_2_outlined,
        accent: const Color(0xFF7C3AED),
      ),
      UserDashboardAction(
        label: 'Launch CV refresh',
        description: 'Roll new portfolio metrics into the enterprise CV suite before Friday.',
        icon: Icons.description_outlined,
        accent: const Color(0xFF0EA5E9),
      ),
    ];

    final focusDigest = FocusDigest(
      nextFocusBlock: now.add(const Duration(hours: 20)),
      focusArea: 'Interview readiness sprint',
      minutesReserved: 90,
      highlights: const [
        'Deep-dive rehearsal with mentor scheduled for 08:30 tomorrow.',
        'Scorecard feedback loop captured for iterative improvements.',
        'AI assistant drafted STAR stories for top competencies.',
      ],
    );

    final complianceAlerts = <String>[
      'Offer vault flagged 1 pending approval for executive compensation.',
      'Background check automation completed 3 of 3 required forms.',
      'No SLA breaches detected in the last 7 days across pipeline stages.',
    ];

    final snapshot = UserDashboardSnapshot(
      generatedAt: now,
      fromCache: false,
      summary: summary,
      pipeline: pipeline,
      upcomingInterviews: interviews,
      documentStudio: documentStudio,
      nextActions: nextActions,
      focusDigest: focusDigest,
      complianceAlerts: complianceAlerts,
    );

    _cached = snapshot;
    _cachedAt = now;
    return snapshot;
  }
}
