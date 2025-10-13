import 'package:flutter/material.dart';

class SessionState {
  const SessionState._(this.session);

  const SessionState.unauthenticated() : this._(null);

  const SessionState.authenticated(UserSession session) : this._(session);

  final UserSession? session;

  bool get isAuthenticated => session != null;

  int? get actorId => session?.actorId;
}

class UserSession {
  const UserSession({
    this.id,
    this.userId,
    this.memberId,
    this.accountId,
    required this.id,
    required this.name,
    required this.title,
    required this.email,
    required this.location,
    required this.memberships,
    required this.activeMembership,
    required this.dashboards,
    required this.userType,
    this.avatarSeed,
    this.connections = 0,
    this.followers = 0,
    this.companies = const <String>[],
    this.agencies = const <String>[],
    this.accessToken,
    this.refreshToken,
    this.tokenExpiresAt,
    this.twoFactorEnabled = true,
  }) : assert(memberships.isNotEmpty, 'memberships cannot be empty');

  final int id;
  final String name;
  final String title;
  final String email;
  final String location;
  final String? avatarSeed;
  final int? id;
  final int? userId;
  final int? memberId;
  final int? accountId;
  final String userType;
  final List<String> memberships;
  final String activeMembership;
  final Map<String, RoleDashboard> dashboards;
  final int connections;
  final int followers;
  final List<String> companies;
  final List<String> agencies;
  final String? accessToken;
  final String? refreshToken;
  final DateTime? tokenExpiresAt;
  final bool twoFactorEnabled;

  static const Map<String, String> roleLabels = {
    'user': 'User & Job Seeker',
    'freelancer': 'Freelancer',
    'agency': 'Agency',
    'company': 'Company',
    'headhunter': 'Headhunter',
    'mentor': 'Mentor',
    'admin': 'Admin',
  };

  RoleDashboard? dashboardFor(String role) => dashboards[role];

  String roleLabel(String role) => roleLabels[role] ?? role;

  int? get actorId {
    final candidates = [userId, id, memberId, accountId];
    for (final candidate in candidates) {
      if (candidate != null && candidate > 0) {
        return candidate;
      }
    }
    return null;
  }

  UserSession copyWith({
    String? activeMembership,
    List<String>? memberships,
    Map<String, RoleDashboard>? dashboards,
    int? id,
    int? userId,
    int? memberId,
    int? accountId,
    String? accessToken,
    String? refreshToken,
    DateTime? tokenExpiresAt,
    bool? twoFactorEnabled,
  }) {
    final nextMemberships = memberships ?? this.memberships;
    final nextActive = activeMembership ?? this.activeMembership;
    final activeExists = nextMemberships.contains(nextActive);
    return UserSession(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      memberId: memberId ?? this.memberId,
      accountId: accountId ?? this.accountId,
      id: id,
      name: name,
      title: title,
      email: email,
      location: location,
      userType: userType,
      avatarSeed: avatarSeed,
      memberships: nextMemberships,
      activeMembership: activeExists ? nextActive : nextMemberships.first,
      dashboards: dashboards ?? this.dashboards,
      connections: connections,
      followers: followers,
      companies: companies,
      agencies: agencies,
      accessToken: accessToken ?? this.accessToken,
      refreshToken: refreshToken ?? this.refreshToken,
      tokenExpiresAt: tokenExpiresAt ?? this.tokenExpiresAt,
      twoFactorEnabled: twoFactorEnabled ?? this.twoFactorEnabled,
    );
  }

  static UserSession demo() {
    return UserSession(
      id: 2,
      userId: 2,
      memberId: 2002,
      id: 1,
      name: 'Lena Fields',
      title: 'Product Designer',
      email: 'lena.fields@gigvora.com',
      location: 'Berlin, Germany',
      avatarSeed: 'Lena Fields',
      memberships: const ['user', 'freelancer', 'agency', 'company'],
      memberships: const ['user', 'freelancer', 'agency', 'headhunter'],
      memberships: const ['user', 'freelancer', 'agency', 'admin'],
      activeMembership: 'user',
      userType: 'freelancer',
      followers: 1280,
      connections: 324,
      companies: const ['Gigvora Labs', 'Atlas Studios'],
      agencies: const ['Northshore Creative'],
      twoFactorEnabled: true,
      dashboards: const {
        'user': RoleDashboard(
          role: 'user',
          heroTitle: 'User & Job Seeker Command Center',
          heroSubtitle:
              'Monitor applications, interviews, documents, and collaborations with enterprise-grade orchestration.',
          metrics: [
            DashboardMetric(label: 'Total applications', value: '48', trend: '▲ 6 this quarter'),
            DashboardMetric(label: 'Active pipeline', value: '14 live', trend: 'SLA windows green'),
            DashboardMetric(label: 'Interviews scheduled', value: '5 upcoming', trend: 'Next: Tue 09:00'),
            DashboardMetric(label: 'Documents uploaded', value: '18 assets', trend: 'CVs & case studies ready'),
          ],
          sections: [
            DashboardSection(
              title: 'Career pipeline automation',
              subtitle: 'Kanban governance, SLA nudges, and offer workflows stay in sync.',
              highlights: [
                '82% of opportunities progressing on schedule across five stages.',
                'Two proactive reminders prepared for interview follow-ups.',
                'Offer vault flagged one comp review for Friday’s negotiation huddle.',
              ],
              icon: Icons.track_changes,
              accentColor: Color(0xFF2563EB),
            ),
            DashboardSection(
              title: 'Document studio spotlight',
              subtitle: 'Templates, transcripts, and brand hubs export-ready in seconds.',
              highlights: [
                'Portfolio hub features 6 hero projects and 12 testimonials.',
                'AI resume audit recommends sharpening leadership narrative.',
                'One-click export to PDF, Notion, and web profile is primed.',
              ],
              icon: Icons.description_outlined,
              accentColor: Color(0xFF0EA5E9),
            ),
            DashboardSection(
              title: 'Insights & network',
              subtitle: 'Relationship heat-maps and accountability rituals keep momentum.',
              highlights: [
                'Atlas Studios warmed up after last week’s product jam session.',
                '3 pending mentor intros surfaced in the connections CRM.',
                'Talent intelligence benchmarks refreshed against design market peers.',
              ],
              icon: Icons.groups_3,
              accentColor: Color(0xFF7C3AED),
            ),
          ],
          actions: [
            DashboardAction(label: 'Run follow-up queue', description: 'Trigger nudges for recruiters awaiting updates.'),
            DashboardAction(label: 'Generate CV refresh', description: 'Roll latest portfolio wins into the enterprise CV suite.'),
          ],
        ),
        'freelancer': RoleDashboard(
          role: 'freelancer',
          heroTitle: 'Freelancer mission control',
          heroSubtitle:
              'Operate gigs, growth, finance, and reputation with enterprise-grade telemetry across every engagement.',
          metrics: [
            DashboardMetric(label: 'Trustscore', value: '96 / 100', trend: '▲ 2.1 vs last month'),
            DashboardMetric(label: 'Reviews', value: '182', trend: '4 new this week'),
            DashboardMetric(label: 'Active jobs', value: '7', trend: '2 in kickoff'),
            DashboardMetric(label: 'Gig orders', value: '11', trend: '3 awaiting QA'),
          ],
          sections: [
            DashboardSection(
              title: 'Operations HQ',
              subtitle: 'Sprint boards, QA automation, and live workstream telemetry.',
              highlights: [
                'Velocity up 12% after automating stand-ups and QA gates.',
                'Ops board shows 18 tasks cleared across four engagements this week.',
                'Client pulse checks flagged one relationship that needs proactive outreach.',
              ],
              icon: Icons.dashboard_customize,
              accentColor: Color(0xFF0EA5E9),
            ),
            DashboardSection(
              title: 'Opportunity radar',
              subtitle: 'Hand-picked gigs, referrals, and launchpad challenges ready for action.',
              highlights: [
                'Priority brief: Product design sprint for Horizon Labs with a $24K retainer.',
                'Two shortlist invitations waiting in the pipeline for follow-up.',
                'Launchpad challenge closes in 3 days—reward tier already unlocked.',
              ],
              icon: Icons.radar,
              accentColor: Color(0xFF22C55E),
            ),
            DashboardSection(
              title: 'Storytelling stack',
              subtitle: 'Content studio assets prime pitches and renewals.',
              highlights: [
                'New hero banner deployed for SaaS growth campaigns across three landing pages.',
                'Client testimonials auto-synced to community profile and proposal templates.',
                'Three video snippets ready for social proof drops this week.',
              ],
              icon: Icons.auto_stories,
              accentColor: Color(0xFFF97316),
            ),
            DashboardSection(
              title: 'Finance & compliance',
              subtitle: 'Cash flow, contract renewals, and reputation telemetry.',
              highlights: [
                'Revenue pacing 18% ahead of target with two retainers in negotiation.',
                'All MSAs and NDAs verified—next renewal checkpoint in 12 days.',
                'Reputation engine shows 4.9/5 NPS with zero open disputes.',
              ],
              icon: Icons.account_balance,
              accentColor: Color(0xFF6366F1),
            ),
          ],
          actions: [
            DashboardAction(label: 'Send client pulse update', description: 'Share milestone recap for the Gigvora Labs engagement.'),
            DashboardAction(label: 'Polish launchpad pitch deck', description: 'Integrate the newest conversion case study slides.'),
            DashboardAction(label: 'Review compliance locker', description: 'Confirm NDAs and insurance certificates before renewals.'),
          ],
        ),
        'agency': RoleDashboard(
          role: 'agency',
          heroTitle: 'Agency collaboration cockpit',
          heroSubtitle: 'Synchronise rosters, briefs, and partner feedback in real time.',
          metrics: [
            DashboardMetric(label: 'Active retainers', value: '4', trend: 'Stable pipelines'),
            DashboardMetric(label: 'Bench strength', value: '12 experts', trend: 'Across 5 disciplines'),
            DashboardMetric(label: 'Avg fulfilment', value: '92%', trend: '▲ SLA confidence'),
            DashboardMetric(label: 'Partner NPS', value: '4.6/5', trend: 'Trusted alliances'),
          ],
          sections: [
            DashboardSection(
              title: 'Collaboration rooms',
              subtitle: 'Cross-functional squads ready for co-delivery.',
              highlights: [
                'Content guild tackling 3 concurrent brand sprints.',
                'Ops handshake with Northshore Creative finalised.',
                'Shared retrospectives highlight 2 workflow tweaks.',
              ],
              icon: Icons.handshake,
              accentColor: Color(0xFFEC4899),
            ),
            DashboardSection(
              title: 'Talent placement radar',
              subtitle: 'Opportunities matched to bench availability in seconds.',
              highlights: [
                'Product strategist shortlist sent to Atlas Studios.',
                'New lead from Gigvora Marketplace tagged for review.',
                'Volunteering micro-squad assembled for Impact Labs.',
              ],
              icon: Icons.how_to_reg,
              accentColor: Color(0xFF6366F1),
            ),
            DashboardSection(
              title: 'Insights & finance',
              subtitle: 'Margin tracking and billing ready for partner syncs.',
              highlights: [
                'Forecast predicts +15% revenue in next sprint.',
                'Two invoices awaiting approval—auto reminders queued.',
                'Cash flow dashboard signals healthy runway.',
              ],
              icon: Icons.insights,
              accentColor: Color(0xFF14B8A6),
            ),
          ],
          actions: [
            DashboardAction(label: 'Kick off partner retro', description: 'Review shared wins with Atlas Studios leadership.'),
            DashboardAction(label: 'Update availability matrix', description: 'Sync talent roster before Monday planning.'),
            DashboardAction(
              label: 'Launch brand page',
              description: 'Publish a fresh company or program page to boost Explorer visibility.',
            ),
          ],
        ),
        'admin': RoleDashboard(
          role: 'admin',
          heroTitle: 'Admin control tower',
          heroSubtitle: 'Monitor trust, campaign coverage, and monetisation signals.',
          metrics: [
            DashboardMetric(label: 'Live campaigns', value: '24', trend: '▲ 3 this week'),
            DashboardMetric(label: 'Active disputes', value: '6', trend: '▼ improving'),
            DashboardMetric(label: 'Escrow volume', value: '1.8M USD', trend: '↑ strong'),
            DashboardMetric(label: 'Support backlog', value: '12', trend: '→ steady'),
          ],
          sections: [
            DashboardSection(
              title: 'Trust & operations',
              subtitle: 'Keep disputes, compliance, and support SLAs on track.',
              highlights: [
                'Escrow release queue cleared ahead of payroll batches.',
                'Compliance alerts down 14% after verification sprint.',
                'Support first-response holding at 8 minutes network-wide.',
              ],
              icon: Icons.shield_moon_outlined,
              accentColor: Color(0xFF2563EB),
            ),
            DashboardSection(
              title: 'Gigvora ads',
              subtitle: 'Review surface coverage, targeting gaps, and creative freshness.',
              highlights: [
                'Global dashboard coverage at 96% with fresh hero video.',
                'Company portals need two new creatives for onboarding runs.',
                'Volunteer hub placements scored 4.6 quality rating.',
              ],
              icon: Icons.campaign_outlined,
              accentColor: Color(0xFF1E3A8A),
            ),
          ],
          actions: const [
            DashboardAction(
              label: 'Open Gigvora Ads console',
              description: 'Review placements, targeting telemetry, and recommendations.',
            ),
          ],
        ),
        'headhunter': RoleDashboard(
          role: 'headhunter',
          heroTitle: 'Headhunter command centre',
          heroSubtitle: 'Command mandates, pipelines, and client expectations with confidence.',
          metrics: [
            DashboardMetric(label: 'Active mandates', value: '12', trend: '▲ 2 this month'),
            DashboardMetric(label: 'Pipeline value', value: '\$1.8M', trend: '▲ 14% QoQ'),
            DashboardMetric(label: 'Avg days in stage', value: '6.4', trend: '→ on target'),
            DashboardMetric(label: 'Client NPS', value: '4.7/5', trend: 'Trusted partner'),
          ],
          sections: [
            DashboardSection(
              title: 'Pipeline health',
              subtitle: 'Stage velocity, conversion rates, and automation guardrails.',
              highlights: [
                'Discovery to shortlist conversion holding at 42%.',
                'Two offers pending with enterprise design and data mandates.',
                'AI enrichment unlocked 18 fresh outreach targets.',
              ],
              icon: Icons.timeline,
              accentColor: Color(0xFF2563EB),
            ),
            DashboardSection(
              title: 'Client partnership spotlight',
              subtitle: 'Retainers, renewals, and portal engagement signals.',
              highlights: [
                'Atlas Studios renewal due in 18 days—prep success fee brief.',
                'Shared portal engagement up 23% after last briefing.',
                'Issue desk clear—no escalations awaiting action.',
              ],
              icon: Icons.handshake,
              accentColor: Color(0xFF0EA5E9),
            ),
            DashboardSection(
              title: 'Outreach operations',
              subtitle: 'Sequenced campaigns and pass-on collaborations ready to scale.',
              highlights: [
                'Warm introductions campaign running at 68% reply rate.',
                'Compliance centre cleared 5 pending consent requests.',
                'Two partner agencies awaiting feedback on pass-on matches.',
              ],
              icon: Icons.send,
              accentColor: Color(0xFFF59E0B),
            ),
          ],
          actions: [
            DashboardAction(
              label: 'Refresh mandate scorecard',
              description: 'Align client reporting ahead of Tuesday status review.',
            ),
            DashboardAction(
              label: 'Schedule outreach stand-up',
              description: 'Sync prioritised sequences with sourcing leads.',
            ),
          ],
        ),
        'company': RoleDashboard(
          role: 'company',
          heroTitle: 'Company talent acquisition hub',
          heroSubtitle:
              'Monitor requisitions, interviews, offers, and partner performance with enterprise guardrails.',
          metrics: [
            DashboardMetric(label: 'Open requisitions', value: '48', trend: '▲ 6 net new'),
            DashboardMetric(label: 'Active candidates', value: '1,260', trend: 'Pipeline steady'),
            DashboardMetric(label: 'Upcoming interviews', value: '32', trend: 'Next: Wed 14:00'),
            DashboardMetric(label: 'Offer win rate', value: '78%', trend: '▲ 5 pts'),
            DashboardMetric(label: 'Candidate NPS', value: '4.6/5', trend: 'Satisfaction green'),
            DashboardMetric(label: 'Open alerts', value: '2', trend: '▼ Cleared 3 today'),
          ],
          sections: [
            DashboardSection(
              title: 'Hiring overview',
              subtitle: 'Velocity, diversity, and governance signals for every requisition.',
              highlights: [
                'Average time to decision sits at 18 days with SLA green.',
                'Diversity representation index tracking at 1.04 across funnel.',
                'Two medium-severity compliance alerts require review this week.',
              ],
              icon: Icons.bar_chart_rounded,
              accentColor: const Color(0xFF2563EB),
            ),
            DashboardSection(
              title: 'Sourcing intelligence',
              subtitle: 'Campaign ROI, nurture cadences, and partner pipelines.',
              highlights: [
                'Referral campaigns delivering 32% of qualified interviews.',
                'Headhunter briefs on track with 11 submissions awaiting review.',
                'Applicant nurture flows triggered 540 follow-ups this month.',
              ],
              icon: Icons.public,
              accentColor: const Color(0xFF0EA5E9),
            ),
            DashboardSection(
              title: 'Experience & governance',
              subtitle: 'Interview automation, offer bridge, and care centre coverage.',
              highlights: [
                'Scheduler coverage at 92% with auto-reminders live for panels.',
                'Offer bridge shows 5 approvals pending; average start in 21 days.',
                'Candidate care centre resolved 18 tickets with 2 escalations open.',
              ],
              icon: Icons.verified_user,
              accentColor: const Color(0xFF22C55E),
            ),
          ],
          actions: [
            DashboardAction(
              label: 'Review networking insights',
              description: 'Validate attendance controls before Friday sessions.',
            ),
            DashboardAction(
              label: 'Publish new employer story',
              description: 'Showcase culture wins to boost campaign conversion.',
            ),
          ],
        ),
        'admin': RoleDashboard(
          role: 'admin',
          heroTitle: 'Workspace governance HQ',
          heroSubtitle: 'Oversee community health, approvals, and compliance signals in one console.',
          metrics: [
            DashboardMetric(label: 'Managed groups', value: '24', trend: '↑ 3 this week'),
            DashboardMetric(label: 'Pending approvals', value: '11', trend: 'Queue clear in 4h'),
            DashboardMetric(label: 'Escalations', value: '2', trend: '⇢ None overdue'),
            DashboardMetric(label: 'Security posture', value: 'AA', trend: 'Policy coverage green'),
          ],
          sections: [
            DashboardSection(
              title: 'Community health pulse',
              subtitle: 'Keep every group vibrant and well supported.',
              highlights: [
                'Engagement sentiment steady at 4.6 / 5 across top cohorts.',
                'Two groups flagged for review due to inactive moderators.',
                'Weekly growth pacing +18% after refined onboarding journeys.',
              ],
              icon: Icons.health_and_safety_outlined,
              accentColor: Color(0xFF2563EB),
            ),
            DashboardSection(
              title: 'Approval runway',
              subtitle: 'Triage join requests, invites, and compliance signals with clarity.',
              highlights: [
                '11 join requests awaiting final approval across 4 groups.',
                'Auto-reminders sent to mentors for outstanding references.',
                'No SLA breaches detected in the last 24 hours.',
              ],
              icon: Icons.fact_check_outlined,
              accentColor: Color(0xFF16A34A),
            ),
            DashboardSection(
              title: 'Security and governance',
              subtitle: 'Monitor policies, access tiers, and audit events.',
              highlights: [
                'All admin sessions passing MFA and device trust checks.',
                '4 policy updates shipped to community guidelines this month.',
                'Audit trail synced to compliance vault at 04:00 UTC.',
              ],
              icon: Icons.admin_panel_settings_outlined,
              accentColor: Color(0xFF9333EA),
            ),
          ],
          actions: [
            DashboardAction(
              label: 'Open group management console',
              description: 'Review requests, send invites, and curate visibility settings in real time.',
              route: '/groups/manage',
            ),
            DashboardAction(
              label: 'Audit membership escalations',
              description: 'Double-check escalation queue before the weekly compliance review.',
            ),
          ],
        ),
        'company': RoleDashboard(
          role: 'company',
          heroTitle: 'Company networking orchestration',
          heroSubtitle: 'Coordinate speed networking, sponsors, and business card experiences for your community.',
          metrics: [
            DashboardMetric(label: 'Active hubs', value: '3', trend: 'In progress'),
            DashboardMetric(label: 'Upcoming events', value: '5', trend: 'Next: Wed 18:00'),
            DashboardMetric(label: 'Attendee NPS', value: '4.7/5', trend: '↑ 0.3 WoW'),
            DashboardMetric(label: 'Revenue (90d)', value: 'USD 86K', trend: '▲ 22% QoQ'),
          ],
          sections: [
            DashboardSection(
              title: 'Speed networking hub',
              subtitle: 'Rotations, waitlists, and host controls are staged for the next showcase.',
              highlights: [
                'Auto-matched 420 introductions in the last 30 days.',
                'Business card sharing up 18% after rolling out new templates.',
                'Sponsor spotlight for Atlas Capital locked for Thursday session.',
              ],
              icon: Icons.auto_awesome,
              accentColor: Color(0xFF2563EB),
            ),
            DashboardSection(
              title: 'Attendee experience lab',
              subtitle: 'Monitor satisfaction, follow-ups, and community momentum.',
              highlights: [
                'Average satisfaction score holding at 4.7/5.',
                'Follow-up scheduler booked 58 meetings this month.',
                'Messaging heatmap shows peak engagement at 18 minutes.',
              ],
              icon: Icons.groups_3,
              accentColor: Color(0xFF10B981),
            ),
            DashboardSection(
              title: 'Operational telemetry',
              subtitle: 'Reminders, load share, and failover readiness are in the green.',
              highlights: [
                'Browser load share stable at 82% Chrome / 12% Safari.',
                'Host announcements averaging 6 per event—keep sponsors engaged.',
                'Failover rate below 0.4% with auto-heal on standby.',
              ],
              icon: Icons.speed,
              accentColor: Color(0xFFF59E0B),
            ),
          ],
          actions: [
            DashboardAction(label: 'Open networking hub', description: 'Review sessions, cards, and live telemetry.'),
            DashboardAction(label: 'Plan sponsor spotlight', description: 'Coordinate messaging ahead of the next rotation.'),
          ],
        ),
      },
    );
  }
}

class RoleDashboard {
  const RoleDashboard({
    required this.role,
    required this.heroTitle,
    required this.heroSubtitle,
    required this.metrics,
    required this.sections,
    this.actions = const <DashboardAction>[],
  });

  final String role;
  final String heroTitle;
  final String heroSubtitle;
  final List<DashboardMetric> metrics;
  final List<DashboardSection> sections;
  final List<DashboardAction> actions;
}

class DashboardMetric {
  const DashboardMetric({
    required this.label,
    required this.value,
    this.trend,
  });

  final String label;
  final String value;
  final String? trend;
}

class DashboardSection {
  const DashboardSection({
    required this.title,
    required this.subtitle,
    required this.highlights,
    required this.icon,
    this.accentColor,
  });

  final String title;
  final String subtitle;
  final List<String> highlights;
  final IconData icon;
  final Color? accentColor;
}

class DashboardAction {
  const DashboardAction({
    required this.label,
    required this.description,
    this.route,
  });

  final String label;
  final String description;
  final String? route;
}
