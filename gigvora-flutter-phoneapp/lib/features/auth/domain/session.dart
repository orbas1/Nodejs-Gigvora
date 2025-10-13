import 'package:flutter/material.dart';

class SessionState {
  const SessionState._(this.session);

  const SessionState.unauthenticated() : this._(null);

  const SessionState.authenticated(UserSession session) : this._(session);

  final UserSession? session;

  bool get isAuthenticated => session != null;
}

class UserSession {
  const UserSession({
    required this.name,
    required this.title,
    required this.email,
    required this.location,
    required this.memberships,
    required this.activeMembership,
    required this.dashboards,
    this.avatarSeed,
    this.connections = 0,
    this.followers = 0,
    this.companies = const <String>[],
    this.agencies = const <String>[],
  }) : assert(memberships.isNotEmpty, 'memberships cannot be empty');

  final String name;
  final String title;
  final String email;
  final String location;
  final String? avatarSeed;
  final List<String> memberships;
  final String activeMembership;
  final Map<String, RoleDashboard> dashboards;
  final int connections;
  final int followers;
  final List<String> companies;
  final List<String> agencies;

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

  UserSession copyWith({
    String? activeMembership,
    List<String>? memberships,
    Map<String, RoleDashboard>? dashboards,
  }) {
    final nextMemberships = memberships ?? this.memberships;
    final nextActive = activeMembership ?? this.activeMembership;
    final activeExists = nextMemberships.contains(nextActive);
    return UserSession(
      name: name,
      title: title,
      email: email,
      location: location,
      avatarSeed: avatarSeed,
      memberships: nextMemberships,
      activeMembership: activeExists ? nextActive : nextMemberships.first,
      dashboards: dashboards ?? this.dashboards,
      connections: connections,
      followers: followers,
      companies: companies,
      agencies: agencies,
    );
  }

  static UserSession demo() {
    return UserSession(
      name: 'Lena Fields',
      title: 'Product Designer',
      email: 'lena.fields@gigvora.com',
      location: 'Berlin, Germany',
      avatarSeed: 'Lena Fields',
      memberships: const ['user', 'freelancer', 'agency'],
      activeMembership: 'user',
      followers: 1280,
      connections: 324,
      companies: const ['Gigvora Labs', 'Atlas Studios'],
      agencies: const ['Northshore Creative'],
      dashboards: const {
        'user': RoleDashboard(
          role: 'user',
          heroTitle: 'Career growth command centre',
          heroSubtitle:
              'Track your applications, documents, and upcoming interviews all in one place.',
          metrics: [
            DashboardMetric(label: 'Active applications', value: '14', trend: '▲ 3 this week'),
            DashboardMetric(label: 'Interviews scheduled', value: '5', trend: 'Next: Tue 09:00'),
            DashboardMetric(label: 'Offers in play', value: '2', trend: '→ holding pattern'),
            DashboardMetric(label: 'Connections', value: '324', trend: '↑ Trusted circle'),
          ],
          sections: [
            DashboardSection(
              title: 'Pipeline automation',
              subtitle: 'Your kanban is humming with talent brand touchpoints.',
              highlights: [
                'Career pipeline automation reports 82% completion across 5 stages.',
                'Next task: Polish "UX Lead" case study before Thursday review.',
                'Two reminders scheduled to follow up on interviews.',
              ],
              icon: Icons.track_changes,
              accentColor: Color(0xFF2563EB),
            ),
            DashboardSection(
              title: 'Document studio spotlight',
              subtitle: 'Templates and transcripts ready for recruiter sharing.',
              highlights: [
                'Portfolio hub features 6 hero projects and 12 testimonials.',
                'AI resume audit suggests a punchier leadership summary.',
                'Quick export: PDF resume & Notion profile available.',
              ],
              icon: Icons.description_outlined,
              accentColor: Color(0xFF0891B2),
            ),
            DashboardSection(
              title: 'Network momentum',
              subtitle: 'Relationship heat-maps help prioritise outreach.',
              highlights: [
                'Atlas Studios warmed up after last week’s product jam.',
                '3 pending connection requests from community mentors.',
                'Referral loops surfaced 2 product strategist intros.',
              ],
              icon: Icons.groups_3,
              accentColor: Color(0xFF7C3AED),
            ),
          ],
          actions: [
            DashboardAction(label: 'Update career story', description: 'Refresh case studies before the next recruiter sync.'),
            DashboardAction(label: 'Review interview prep kit', description: 'Talking points and transcripts queued for tomorrow.'),
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
  });

  final String label;
  final String description;
}
