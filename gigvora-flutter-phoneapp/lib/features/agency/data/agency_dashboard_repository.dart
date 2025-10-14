import 'dart:math';

import '../domain/agency_dashboard.dart';

class AgencyDashboardRepository {
  AgencyDashboardSnapshot? _cached;
  DateTime? _cachedAt;

  static const _cacheTtl = Duration(minutes: 5);

  Future<AgencyDashboardSnapshot> fetchDashboard({bool forceRefresh = false}) async {
    await Future.delayed(const Duration(milliseconds: 420));

    final now = DateTime.now();
    final cacheValid =
        !forceRefresh && _cached != null && _cachedAt != null && now.difference(_cachedAt!) < _cacheTtl;
    if (cacheValid) {
      return _cached!.copyWith(fromCache: true);
    }

    final snapshot = AgencyDashboardSnapshot(
      generatedAt: now,
      lookbackWindowDays: 120,
      fromCache: false,
      metrics: const [
        AgencyMetricCard(
          label: 'Revenue run-rate',
          value: '\$1.2M',
          trend: '+18% QoQ',
          caption: 'Across 12 retainers',
          accentHex: 0xFF2563EB,
        ),
        AgencyMetricCard(
          label: 'Gross margin',
          value: '34%',
          trend: '+3.2pp',
          caption: 'Healthy after ops automation',
          accentHex: 0xFF22C55E,
        ),
        AgencyMetricCard(
          label: 'Utilisation',
          value: '92%',
          trend: 'SLA green',
          caption: 'Bench down to 12 experts',
          accentHex: 0xFFF97316,
        ),
        AgencyMetricCard(
          label: 'Partner NPS',
          value: '4.6 / 5',
          trend: 'Trusted alliances',
          caption: 'Pulse across 24 clients',
          accentHex: 0xFF6366F1,
        ),
      ],
      alerts: const [
        AgencyAlert(
          title: 'Client Atlas Studios flagged at risk',
          message: 'Delivery retro uncovered scope drift—schedule exec sync within 48h.',
          severity: AgencyAlertSeverity.high,
        ),
        AgencyAlert(
          title: 'Bench capacity approaching threshold',
          message: '12 specialists free across brand, product, and research. Prioritise placement.',
          severity: AgencyAlertSeverity.medium,
        ),
        AgencyAlert(
          title: 'Policy acknowledgement pending',
          message: 'Three contractors have not signed the updated data processing agreement.',
          severity: AgencyAlertSeverity.low,
        ),
      ],
      squads: const [
        AgencySquadSnapshot(
          name: 'Product design pod',
          focus: 'SaaS experience refreshes',
          healthLabel: 'High momentum',
          healthScore: 0.86,
          activeEngagements: 3,
        ),
        AgencySquadSnapshot(
          name: 'Growth storytelling guild',
          focus: 'Narrative assets & pitch decks',
          healthLabel: 'On track',
          healthScore: 0.78,
          activeEngagements: 5,
        ),
        AgencySquadSnapshot(
          name: 'Data operations studio',
          focus: 'RevOps and automation',
          healthLabel: 'Stabilising',
          healthScore: 0.71,
          activeEngagements: 2,
        ),
      ],
      bench: const [
        AgencyBenchMember(name: 'Lena Fields', discipline: 'Product design lead', availability: 'Available now'),
        AgencyBenchMember(name: 'Marcos Vega', discipline: 'Brand strategist', availability: 'Available in 1 week'),
        AgencyBenchMember(name: 'Priya Chawla', discipline: 'Revenue operations', availability: 'Available now'),
        AgencyBenchMember(name: 'Ivy Laurent', discipline: 'UX researcher', availability: 'Available in 3 days'),
      ],
      pipeline: [
        AgencyPipelineItem(
          client: 'Northshore Creative',
          value: 85000,
          stage: 'Co-design workshop',
          nextAction: now.add(const Duration(days: 2)),
        ),
        AgencyPipelineItem(
          client: 'Horizon Labs',
          value: 120000,
          stage: 'Proposal review',
          nextAction: now.add(const Duration(days: 4)),
        ),
        AgencyPipelineItem(
          client: 'Impact Collective',
          value: 56000,
          stage: 'Discovery call',
          nextAction: now.add(const Duration(days: 1)),
        ),
      ],
      recommendedActions: const [
        'Share the governance update with Atlas Studios before Thursday.',
        'Warm up the Nova Health lead with a co-marketing playbook.',
        'Launch an internal spotlight on the volunteer design sprint outcomes.',
      ],
      hr: AgencyHrSnapshot(
        headcount: 148,
        contractors: 24,
        complianceOutstanding: 7,
        benchHours: 320,
        benchHealthLabel: 'Balanced',
        utilizationRate: 0.91,
        alerts: const [
          AgencyHrAlert(
            message: 'Design pod utilisation is at 96% for the third week running.',
            type: 'Utilisation',
            severity: AgencyHrAlertSeverity.warning,
            nextAction: 'Rotate bench brand strategists into the design pod to relieve capacity.',
          ),
          AgencyHrAlert(
            message: 'Policy acknowledgement overdue for data processing addendum.',
            type: 'Compliance',
            severity: AgencyHrAlertSeverity.info,
            nextAction: 'Trigger automated reminder and follow-up with contractor leads.',
          ),
          AgencyHrAlert(
            message: 'Exits pending for two delivery leads without coverage plan.',
            type: 'Exit management',
            severity: AgencyHrAlertSeverity.critical,
            nextAction: 'Schedule succession briefing and assign interim coverage owners.',
          ),
        ],
        policies: [
          AgencyHrPolicy(
            title: 'Data processing agreement',
            outstanding: 3,
            reviewCycleDays: 180,
            effectiveDate: now.subtract(const Duration(days: 28)),
          ),
          AgencyHrPolicy(
            title: 'Hybrid working handbook',
            outstanding: 5,
            reviewCycleDays: 90,
            effectiveDate: now.subtract(const Duration(days: 72)),
          ),
        ],
        roleCoverage: const [
          AgencyHrRoleCoverage(
            role: 'Product design lead',
            active: 6,
            hiring: 2,
            bench: 1,
            utilizationRate: 0.94,
          ),
          AgencyHrRoleCoverage(
            role: 'Growth strategist',
            active: 5,
            hiring: 1,
            bench: 2,
            utilizationRate: 0.72,
          ),
          AgencyHrRoleCoverage(
            role: 'Revenue operations analyst',
            active: 4,
            hiring: 2,
            bench: 0,
            utilizationRate: 0.98,
            needsAttention: true,
          ),
        ],
        staffing: const AgencyStaffingSummary(
          totalCapacityHours: 560,
          committedHours: 496,
          benchMembers: 12,
          benchRate: 0.18,
          summary: 'Capacity is balanced across pods with reserve coverage available.',
          recommendedAction: 'Deploy bench storytellers into the growth squad for upcoming campaigns.',
        ),
        onboarding: [
          AgencyHrOnboardingCandidate(
            name: 'Rachel Kim',
            role: 'Brand strategist',
            status: 'in_progress',
            startDate: now.add(const Duration(days: 5)),
          ),
          AgencyHrOnboardingCandidate(
            name: 'Jonah Patel',
            role: 'RevOps analyst',
            status: 'awaiting_it_access',
            startDate: now.add(const Duration(days: 8)),
          ),
          AgencyHrOnboardingCandidate(
            name: 'Samira Lopez',
            role: 'UX researcher',
            status: 'equipment_shipped',
            startDate: now.add(const Duration(days: 12)),
          ),
        ],
        delegation: AgencyDelegationSummary(
          activeAssignments: 18,
          backlogCount: 6,
          capacityHours: 720,
          allocatedHours: 612,
          atRiskCount: 2,
          assignments: const [
            AgencyDelegationAssignment(
              memberName: 'Elena Quinn',
              role: 'Delivery lead',
              capacityHours: 40,
              allocatedHours: 38,
              status: 'active',
            ),
            AgencyDelegationAssignment(
              memberName: 'Mason Clarke',
              role: 'Automation architect',
              capacityHours: 35,
              allocatedHours: 34,
              status: 'active',
            ),
            AgencyDelegationAssignment(
              memberName: 'Priya Chawla',
              role: 'Revenue operations',
              capacityHours: 32,
              allocatedHours: 31,
              status: 'at_risk',
            ),
          ],
        ),
        milestones: AgencyMilestoneSummary(
          completed: 42,
          overdue: 1,
          upcoming: 5,
          next: AgencyMilestoneSignal(
            title: 'Brand platform launch',
            project: 'Atlas retail modernisation',
            dueDate: now.add(const Duration(days: 3)),
            status: 'scheduled',
          ),
        ),
        paymentSplits: AgencyPaymentSplitSummary(
          totalSplits: 64,
          approvedSplits: 52,
          pendingSplits: 9,
          failedSplits: 3,
          nextPayoutDate: now.add(const Duration(days: 2)),
          nextPayoutAmount: 48600,
          nextPayoutCurrency: 'USD',
        ),
      ),
    );

    final random = Random();
    final jittered = snapshot.copyWith(
      metrics: snapshot.metrics
          .map(
            (metric) => AgencyMetricCard(
              label: metric.label,
              value: metric.value,
              trend: metric.trend,
              caption: metric.caption,
              accentHex: metric.accentHex,
            ),
          )
          .toList(),
      alerts: snapshot.alerts
          .map(
            (alert) => AgencyAlert(
              title: alert.title,
              message: alert.message,
              severity: alert.severity,
            ),
          )
          .toList(),
      squads: snapshot.squads
          .map(
            (squad) => AgencySquadSnapshot(
              name: squad.name,
              focus: squad.focus,
              healthLabel: squad.healthLabel,
              healthScore: (squad.healthScore * (0.95 + random.nextDouble() * 0.1)).clamp(0.0, 1.0),
              activeEngagements: squad.activeEngagements,
            ),
          )
          .toList(),
    );

    _cached = jittered;
    _cachedAt = now;
    return jittered;
  }
}
