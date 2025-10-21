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
    this.profileId,
    required this.name,
    required this.title,
    required this.email,
    required this.location,
    this.avatarSeed,
    required List<String> memberships,
    required this.activeMembership,
    required Map<String, RoleDashboard> dashboards,
    this.userType = 'user',
    this.connections = 0,
    this.followers = 0,
    List<String> companies = const <String>[],
    List<String> agencies = const <String>[],
    this.accessToken,
    this.refreshToken,
    this.tokenExpiresAt,
    this.twoFactorEnabled = true,
  })  : assert(memberships.isNotEmpty, 'memberships cannot be empty'),
        memberships = List.unmodifiable(memberships.map((role) => role.toLowerCase())),
        dashboards = Map.unmodifiable(dashboards),
        companies = List.unmodifiable(companies),
        agencies = List.unmodifiable(agencies);

  final int? id;
  final int? userId;
  final int? memberId;
  final int? accountId;
  final String? profileId;
  final String name;
  final String title;
  final String email;
  final String location;
  final String? avatarSeed;
  final List<String> memberships;
  final String activeMembership;
  final Map<String, RoleDashboard> dashboards;
  final String userType;
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
    'volunteer': 'Volunteer',
  };

  RoleDashboard? dashboardFor(String role) => dashboards[role.toLowerCase()];

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
    int? id,
    int? userId,
    int? memberId,
    int? accountId,
    String? profileId,
    String? name,
    String? title,
    String? email,
    String? location,
    String? avatarSeed,
    List<String>? memberships,
    String? activeMembership,
    Map<String, RoleDashboard>? dashboards,
    int? connections,
    int? followers,
    List<String>? companies,
    List<String>? agencies,
    String? userType,
    String? accessToken,
    String? refreshToken,
    DateTime? tokenExpiresAt,
    bool? twoFactorEnabled,
  }) {
    final nextMemberships = memberships ?? this.memberships;
    assert(nextMemberships.isNotEmpty, 'memberships cannot be empty');
    final candidateActive = activeMembership ?? this.activeMembership;
    final resolvedActive = nextMemberships.contains(candidateActive)
        ? candidateActive
        : nextMemberships.first;

    return UserSession(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      memberId: memberId ?? this.memberId,
      accountId: accountId ?? this.accountId,
      profileId: profileId ?? this.profileId,
      name: name ?? this.name,
      title: title ?? this.title,
      email: email ?? this.email,
      location: location ?? this.location,
      avatarSeed: avatarSeed ?? this.avatarSeed,
      memberships: nextMemberships,
      activeMembership: resolvedActive,
      dashboards: dashboards ?? this.dashboards,
      userType: userType ?? this.userType,
      connections: connections ?? this.connections,
      followers: followers ?? this.followers,
      companies: companies ?? this.companies,
      agencies: agencies ?? this.agencies,
      accessToken: accessToken ?? this.accessToken,
      refreshToken: refreshToken ?? this.refreshToken,
      tokenExpiresAt: tokenExpiresAt ?? this.tokenExpiresAt,
      twoFactorEnabled: twoFactorEnabled ?? this.twoFactorEnabled,
    );
  }

  static UserSession demo() {
    final dashboards = <String, RoleDashboard>{
      'user': RoleDashboard(
        role: 'user',
        heroTitle: 'Career mission control',
        heroSubtitle: 'Track interviews, documents, and collaborations in one secure cockpit.',
        metrics: const [
          DashboardMetric(label: 'Active applications', value: '12', trend: '▲ 3 this week'),
          DashboardMetric(label: 'Upcoming interviews', value: '4', trend: 'Next: Tue 09:00'),
          DashboardMetric(label: 'Documents ready', value: '18', trend: 'AI audit complete'),
          DashboardMetric(label: 'Mentor touchpoints', value: '6', trend: 'Stay warm'),
        ],
        sections: const [
          DashboardSection(
            title: 'Pipeline automation',
            subtitle: 'SLA-aware stages and nudges keep every opportunity on track.',
            highlights: [
              'All interview prep kits synced with tomorrow’s calendar.',
              'Two follow-up nudges queued for recruiter responses.',
              'Offer vault flagged a compensation review for Friday.',
            ],
            icon: Icons.track_changes,
          ),
          DashboardSection(
            title: 'Document studio spotlight',
            subtitle: 'Templates, transcripts, and brand hubs export-ready in seconds.',
            highlights: [
              'Portfolio hub features six hero projects with smart tags applied.',
              'AI resume audit recommends sharpening the leadership narrative.',
              'Purchased gig deliverables synced from escrow vault for recruiter export.',
            ],
            icon: Icons.description_outlined,
          ),
        ],
        actions: const [
          DashboardAction(
            label: 'Review interview prep kit',
            description: 'Talking points, scorecards, and recordings are queued for tomorrow’s panel.',
          ),
          DashboardAction(
            label: 'Trigger follow-up queue',
            description: 'Send personalised updates to recruiters awaiting responses.',
          ),
        ],
      ),
      'freelancer': RoleDashboard(
        role: 'freelancer',
        heroTitle: 'Freelancer mission control',
        heroSubtitle: 'Operate gigs, growth, finance, and reputation with live telemetry.',
        metrics: const [
          DashboardMetric(label: 'Trustscore', value: '96 / 100', trend: '▲ 2.1 vs last month'),
          DashboardMetric(label: 'Active jobs', value: '7', trend: '2 in kickoff'),
          DashboardMetric(label: 'Gig orders', value: '11', trend: '3 awaiting QA'),
          DashboardMetric(label: 'Client NPS', value: '4.9 / 5', trend: 'Fresh testimonials'),
        ],
        sections: const [
          DashboardSection(
            title: 'Mission overview',
            subtitle: 'Revenue, trust, and client telemetry in a single cockpit.',
            highlights: [
              'Seven active jobs and eleven gig orders tracking within SLA.',
              'Automation nudges keep renewal conversations warm.',
              'No open disputes — reputation score holding steady.',
            ],
            icon: Icons.dashboard_customize,
          ),
          DashboardSection(
            title: 'Finance & compliance',
            subtitle: 'Cash flow, escrow exposure, and guardrails stay aligned.',
            highlights: [
              'Escrow exposure within limits after last night’s reconciliation.',
              'Two retainers entering negotiation with pricing guidance ready.',
              'Compliance locker verified — next audit in 12 days.',
            ],
            icon: Icons.account_balance,
          ),
        ],
        actions: const [
          DashboardAction(
            label: 'Open gig delivery board',
            description: 'Review sprint cadence and QA status across engagements.',
          ),
        ],
      ),
      'agency': RoleDashboard(
        role: 'agency',
        heroTitle: 'Agency growth hub',
        heroSubtitle: 'Co-ordinate clients, recruiters, and marketing in one workspace.',
        metrics: const [
          DashboardMetric(label: 'Active retainers', value: '8', trend: '↑ Two onboarding'),
          DashboardMetric(label: 'Pipeline health', value: '22 leads', trend: 'Priority intros queued'),
          DashboardMetric(label: 'Team utilisation', value: '87%', trend: 'Balanced load'),
          DashboardMetric(label: 'SLA adherence', value: '98%', trend: 'On target'),
        ],
        sections: const [
          DashboardSection(
            title: 'Client partnerships',
            subtitle: 'Shared briefs, scorecards, and compliance signals stay aligned.',
            highlights: [
              'All enterprise MSAs verified with zero blockers.',
              'Partner scorecards refreshed with 24h performance data.',
              'Referral programmes synced to nurture sequences.',
            ],
            icon: Icons.groups_2_outlined,
          ),
          DashboardSection(
            title: 'Delivery cadence',
            subtitle: 'Sprint dashboards highlight risks before they escalate.',
            highlights: [
              'Ops board shows 18 tasks cleared across four engagements this week.',
              'Automation studio keeping advocacy and referral programmes on track.',
              'Signal centre confirms zero open incidents.',
            ],
            icon: Icons.assignment_turned_in,
          ),
        ],
        actions: const [
          DashboardAction(
            label: 'Sync hiring partners',
            description: 'Share priority briefs with headhunters and agencies.',
          ),
        ],
      ),
      'company': RoleDashboard(
        role: 'company',
        heroTitle: 'Talent acquisition hub',
        heroSubtitle: 'Design roles, orchestrate interviews, and scale partnerships with confidence.',
        metrics: const [
          DashboardMetric(label: 'Open requisitions', value: '24', trend: '▲ 6 this week'),
          DashboardMetric(label: 'Candidate NPS', value: '4.7 / 5', trend: '↗ 0.3 over 30d'),
          DashboardMetric(label: 'Automation coverage', value: '82%', trend: 'Playbooks active'),
          DashboardMetric(label: 'Diversity health', value: 'Green', trend: 'SLA stable'),
        ],
        sections: const [
          DashboardSection(
            title: 'Hiring pipeline intelligence',
            subtitle: 'Signal-based analytics keep offers, interviews, and approvals in sync.',
            highlights: [
              'ATS and hiring manager sync automates candidate scorecards.',
              'Diversity guardrails flagged two roles for review this morning.',
              'Offer desk automation prepped compensation scenarios for finance.',
            ],
            icon: Icons.analytics_outlined,
          ),
          DashboardSection(
            title: 'Employer brand studio',
            subtitle: 'Showcase culture stories, benefits, and launch campaigns in minutes.',
            highlights: [
              'Storytelling modules ready for onboarding and candidate nurture.',
              'Live career site blocks prepared for social amplification.',
              'Video spotlights curated with comms and people partners.',
            ],
            icon: Icons.campaign_outlined,
          ),
        ],
        actions: const [
          DashboardAction(
            label: 'Review hiring pipeline health',
            description: 'Align recruiters and interview panels around upcoming decision gates.',
          ),
        ],
      ),
      'admin': RoleDashboard(
        role: 'admin',
        heroTitle: 'Admin control tower',
        heroSubtitle: 'Monitor marketplace health, finances, and trust in real time.',
        metrics: const [
          DashboardMetric(label: 'Live incidents', value: '0', trend: 'All clear'),
          DashboardMetric(label: 'Escrow health', value: 'Green', trend: 'SLA 99%'),
          DashboardMetric(label: 'Support SLA', value: '96%', trend: 'On target'),
          DashboardMetric(label: 'Risk posture', value: 'Low', trend: 'Guards active'),
        ],
        sections: const [
          DashboardSection(
            title: 'Security & compliance',
            subtitle: 'Audit trails, anomaly detection, and incident playbooks on standby.',
            highlights: [
              'Privileged actions protected by enforced 2FA and device fingerprints.',
              'Realtime anomaly detection inspects every admin session.',
              'Escrow reconciliation completes under 90 seconds with automated alerts.',
            ],
            icon: Icons.shield_outlined,
          ),
          DashboardSection(
            title: 'Operational cadence',
            subtitle: 'Cross-functional telemetry keeps launch readiness on track.',
            highlights: [
              'Trust & safety, support, and finance signals converge into unified runbooks.',
              'PagerDuty and Slack integrations route high-severity incidents instantly.',
              'Enterprise encryption protects collaboration across web and mobile.',
            ],
            icon: Icons.dashboard_customize_outlined,
          ),
        ],
        actions: const [
          DashboardAction(
            label: 'Review overnight audit log',
            description: 'Confirm no privileged changes occurred outside the change window.',
          ),
          DashboardAction(
            label: 'Run incident readiness drill',
            description: 'Validate warm-standby plans and cross-team communication ladders.',
          ),
        ],
      ),
    };

    return UserSession(
      id: 1,
      userId: 1,
      memberId: 2001,
      accountId: 3001,
      profileId: 'usr_demo',
      name: 'Lena Fields',
      title: 'Product Designer',
      email: 'lena.fields@gigvora.com',
      location: 'Berlin, Germany',
      avatarSeed: 'Lena Fields',
      memberships: dashboards.keys.toList(),
      activeMembership: 'user',
      dashboards: dashboards,
      userType: 'freelancer',
      connections: 324,
      followers: 1280,
      companies: const ['Gigvora Labs', 'Atlas Studios'],
      agencies: const ['Northshore Creative'],
      twoFactorEnabled: true,
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
