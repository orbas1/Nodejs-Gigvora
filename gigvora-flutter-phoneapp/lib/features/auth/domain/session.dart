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
  UserSession({
    this.id = 0,
    this.userId,
    this.memberId,
    this.accountId,
    required this.name,
    required this.title,
    required this.email,
    required this.location,
    this.avatarSeed,
    String profileId = 'profile',
    required List<String> memberships,
    required String activeMembership,
    required Map<String, RoleDashboard> dashboards,
    this.connections = 0,
    this.followers = 0,
    List<String> companies = const <String>[],
    List<String> agencies = const <String>[],
    this.accessToken,
    this.refreshToken,
    this.tokenExpiresAt,
    this.twoFactorEnabled = true,
    this.userType = 'user',
  })  : profileId = profileId.trim().isNotEmpty ? profileId.trim() : 'profile',
        dashboards = Map.unmodifiable(dashboards) {
    final normalisedMemberships = _normaliseMemberships(memberships);
    this.memberships = normalisedMemberships;
    this.activeMembership = _resolveActiveMembership(activeMembership, normalisedMemberships);
    this.companies = _normaliseStrings(companies);
    this.agencies = _normaliseStrings(agencies);
  }

  final int id;
  final int? userId;
  final int? memberId;
  final int? accountId;
  final String name;
  final String title;
  final String email;
  final String location;
  final String? avatarSeed;
  final String profileId;
  final Map<String, RoleDashboard> dashboards;
  final int connections;
  final int followers;
  final String? accessToken;
  final String? refreshToken;
  final DateTime? tokenExpiresAt;
  final bool twoFactorEnabled;
  final String userType;
  late final List<String> memberships;
  late final String activeMembership;
  late final List<String> companies;
  late final List<String> agencies;

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

  RoleDashboard? dashboardFor(String role) => dashboards[role];

  String roleLabel(String role) => roleLabels[role] ?? role;

  int? get actorId {
    final candidates = <int?>[userId, memberId, accountId, id];
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
    String? name,
    String? title,
    String? email,
    String? location,
    String? avatarSeed,
    String? profileId,
    List<String>? memberships,
    String? activeMembership,
    Map<String, RoleDashboard>? dashboards,
    int? connections,
    int? followers,
    List<String>? companies,
    List<String>? agencies,
    String? accessToken,
    String? refreshToken,
    DateTime? tokenExpiresAt,
    bool? twoFactorEnabled,
    String? userType,
  }) {
    return UserSession(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      memberId: memberId ?? this.memberId,
      accountId: accountId ?? this.accountId,
      name: name ?? this.name,
      title: title ?? this.title,
      email: email ?? this.email,
      location: location ?? this.location,
      avatarSeed: avatarSeed ?? this.avatarSeed,
      profileId: profileId ?? this.profileId,
      memberships: memberships ?? this.memberships,
      activeMembership: activeMembership ?? this.activeMembership,
      dashboards: dashboards ?? this.dashboards,
      connections: connections ?? this.connections,
      followers: followers ?? this.followers,
      companies: companies ?? this.companies,
      agencies: agencies ?? this.agencies,
      accessToken: accessToken ?? this.accessToken,
      refreshToken: refreshToken ?? this.refreshToken,
      tokenExpiresAt: tokenExpiresAt ?? this.tokenExpiresAt,
      twoFactorEnabled: twoFactorEnabled ?? this.twoFactorEnabled,
      userType: userType ?? this.userType,
    );
  }

  static UserSession demo() {
    return UserSession(
      id: 1,
      userId: 1,
      memberId: 2001,
      accountId: 5001,
      name: 'Lena Fields',
      title: 'Product Designer',
      email: 'lena.fields@gigvora.com',
      location: 'Berlin, Germany',
      profileId: 'usr_demo',
      avatarSeed: 'Lena Fields',
      memberships: const ['company', 'user', 'freelancer', 'agency', 'admin'],
      activeMembership: 'company',
      dashboards: {
        'company': RoleDashboard(
          role: 'company',
          heroTitle: 'Talent acquisition command centre',
          heroSubtitle: 'Monitor requisitions, approvals, and experience metrics in one workspace.',
          metrics: const [
            DashboardMetric(label: 'Open requisitions', value: '24', trend: '▲ 6 this week'),
            DashboardMetric(label: 'Hiring velocity', value: '18 days', trend: '↘ better than target'),
            DashboardMetric(label: 'Candidate NPS', value: '4.7/5', trend: '▲ +0.3 vs 30d'),
          ],
          sections: const [
            DashboardSection(
              title: 'Lifecycle intelligence',
              subtitle: 'Spot bottlenecks across intake, interviews, and offers.',
              highlights: [
                'Interview SLAs are green across 5 stages.',
                'Automation nudges improved offer acceptances by 12%.',
                'Background checks cleared 100% on schedule.',
              ],
              icon: Icons.analytics_outlined,
              accentColor: Color(0xFF4F46E5),
            ),
            DashboardSection(
              title: 'Collaboration health',
              subtitle: 'Keep hiring squads aligned on approvals and retros.',
              highlights: [
                'Approval queue cleared with auto-escalations.',
                'Calibration workshop scheduled for new interviewers.',
                'Weekly retros captured three process wins.',
              ],
              icon: Icons.groups_outlined,
              accentColor: Color(0xFF2563EB),
            ),
          ],
          actions: const [
            DashboardAction(
              label: 'Open analytics control room',
              description: 'Forecast hiring capacity and monitor requisition health.',
            ),
            DashboardAction(
              label: 'Share hiring roadmap',
              description: 'Loop in agencies and headhunters on upcoming needs.',
            ),
          ],
        ),
        'agency': RoleDashboard(
          role: 'agency',
          heroTitle: 'Agency collaboration cockpit',
          heroSubtitle: 'Synchronise rosters, briefs, and partner feedback in real time.',
          metrics: const [
            DashboardMetric(label: 'Active retainers', value: '4', trend: 'Stable pipelines'),
            DashboardMetric(label: 'Bench strength', value: '12 experts', trend: 'Across 5 disciplines'),
            DashboardMetric(label: 'Partner NPS', value: '4.6/5', trend: 'Trusted alliances'),
          ],
          sections: const [
            DashboardSection(
              title: 'Collaboration rooms',
              subtitle: 'Cross-functional squads ready for co-delivery.',
              highlights: [
                'Content guild handling three brand sprints in parallel.',
                'Shared retros highlight two workflow tweaks for next week.',
                'Partner updates published automatically after each demo.',
              ],
              icon: Icons.handshake,
              accentColor: Color(0xFFEC4899),
            ),
            DashboardSection(
              title: 'Placement radar',
              subtitle: 'Match briefs with bench availability in seconds.',
              highlights: [
                'Product strategist shortlist sent to Atlas Studios.',
                'New marketplace lead tagged for review.',
                'Volunteer squad assembled for an Impact Labs sprint.',
              ],
              icon: Icons.how_to_reg,
              accentColor: Color(0xFF6366F1),
            ),
          ],
          actions: const [
            DashboardAction(
              label: 'Kick off partner retro',
              description: 'Review shared wins with Atlas Studios leadership.',
            ),
            DashboardAction(
              label: 'Update availability matrix',
              description: 'Sync talent roster before Monday planning.',
            ),
          ],
        ),
        'freelancer': RoleDashboard(
          role: 'freelancer',
          heroTitle: 'Freelancer mission control',
          heroSubtitle: 'Operate gigs, growth, and reputation with telemetry across every engagement.',
          metrics: const [
            DashboardMetric(label: 'Trustscore', value: '96 / 100', trend: '▲ 2.1 vs last month'),
            DashboardMetric(label: 'Active jobs', value: '7', trend: '2 in kickoff'),
            DashboardMetric(label: 'Gig orders', value: '11', trend: '3 awaiting QA'),
          ],
          sections: const [
            DashboardSection(
              title: 'Mission overview',
              subtitle: 'Live revenue, trust, and client telemetry in one cockpit.',
              highlights: [
                'Zero open disputes with response SLAs green.',
                'Automation studio cleared 18 tasks this week.',
                'Renewal nudges scheduled for two key retainers.',
              ],
              icon: Icons.dashboard_customize,
              accentColor: Color(0xFF0EA5E9),
            ),
            DashboardSection(
              title: 'Finance & compliance',
              subtitle: 'Stay ahead of cash flow and verification checkpoints.',
              highlights: [
                'Escrow release queue processed on time.',
                'Insurance certificates verified for upcoming work.',
                'Reputation engine holding at 4.9/5 NPS.',
              ],
              icon: Icons.account_balance,
              accentColor: Color(0xFF2563EB),
            ),
          ],
          actions: const [
            DashboardAction(
              label: 'Send client pulse update',
              description: 'Share milestone recap for the Gigvora Labs engagement.',
            ),
            DashboardAction(
              label: 'Review compliance locker',
              description: 'Confirm NDAs and certifications before renewals.',
            ),
          ],
        ),
        'user': RoleDashboard(
          role: 'user',
          heroTitle: 'Career navigation hub',
          heroSubtitle: 'Track applications, interviews, and collaborations with enterprise guardrails.',
          metrics: const [
            DashboardMetric(label: 'Active pipeline', value: '14 roles', trend: 'SLA windows green'),
            DashboardMetric(label: 'Upcoming interviews', value: '5', trend: 'Next Tue 09:00'),
            DashboardMetric(label: 'Portfolio assets', value: '18', trend: 'Export ready'),
          ],
          sections: const [
            DashboardSection(
              title: 'Pipeline automation',
              subtitle: 'Keep follow-ups, nudges, and offer workflows aligned.',
              highlights: [
                '82% of opportunities progressing on schedule.',
                'Two proactive reminders queued for interview follow-ups.',
                'Offer negotiation vault tracks two packages in review.',
              ],
              icon: Icons.track_changes,
              accentColor: Color(0xFF2563EB),
            ),
            DashboardSection(
              title: 'Document studio',
              subtitle: 'Resumes, transcripts, and brand hubs are export ready.',
              highlights: [
                'Portfolio hub features six hero projects and testimonials.',
                'AI resume audit recommends sharpening leadership narrative.',
                'One-click export to PDF and web profile is prepared.',
              ],
              icon: Icons.description_outlined,
              accentColor: Color(0xFF0EA5E9),
            ),
          ],
          actions: const [
            DashboardAction(
              label: 'Review interview prep kit',
              description: 'Talking points and recordings queued for tomorrow’s panel.',
            ),
            DashboardAction(
              label: 'Run follow-up queue',
              description: 'Trigger nudges for recruiters awaiting updates.',
            ),
          ],
        ),
        'admin': RoleDashboard(
          role: 'admin',
          heroTitle: 'Admin control tower',
          heroSubtitle: 'Monitor trust, campaign coverage, and monetisation signals.',
          metrics: const [
            DashboardMetric(label: 'Live campaigns', value: '24', trend: '▲ 3 this week'),
            DashboardMetric(label: 'Support backlog', value: '12', trend: '→ steady'),
            DashboardMetric(label: 'Escrow volume', value: 'USD 1.8M', trend: '↑ strong'),
          ],
          sections: const [
            DashboardSection(
              title: 'Trust & operations',
              subtitle: 'Keep disputes, compliance, and support SLAs on track.',
              highlights: [
                'Support first-response holding at 8 minutes network-wide.',
                'Compliance alerts down 14% after verification sprint.',
                'Escrow release queue cleared ahead of payroll batches.',
              ],
              icon: Icons.shield_moon_outlined,
              accentColor: Color(0xFF2563EB),
            ),
            DashboardSection(
              title: 'Gigvora ads',
              subtitle: 'Review surface coverage, targeting gaps, and creative freshness.',
              highlights: [
                'Global dashboard coverage at 96% with fresh creatives.',
                'Company portals need two new hero assets this week.',
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
      },
      connections: 324,
      followers: 1280,
      companies: const ['Gigvora Labs', 'Atlas Studios'],
      agencies: const ['Northshore Creative'],
      twoFactorEnabled: true,
      userType: 'freelancer',
    );
  }

  static List<String> _normaliseMemberships(List<String> roles) {
    final cleaned = roles
        .map((role) => role.trim())
        .where((role) => role.isNotEmpty)
        .toList(growable: false);
    if (cleaned.isEmpty) {
      return const ['user'];
    }
    return List.unmodifiable(cleaned);
  }

  static List<String> _normaliseStrings(List<String> values) {
    return List.unmodifiable(
      values
          .map((value) => value.trim())
          .where((value) => value.isNotEmpty)
          .toList(growable: false),
    );
  }

  static String _resolveActiveMembership(String candidate, List<String> roles) {
    final trimmed = candidate.trim();
    if (trimmed.isNotEmpty && roles.contains(trimmed)) {
      return trimmed;
    }
    return roles.isNotEmpty ? roles.first : 'user';
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
