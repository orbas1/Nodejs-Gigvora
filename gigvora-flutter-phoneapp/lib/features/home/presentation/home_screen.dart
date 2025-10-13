import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../auth/application/session_controller.dart';
import '../../auth/domain/session.dart';
import '../../../theme/widgets.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final sessionState = ref.watch(sessionControllerProvider);
    final controller = ref.read(sessionControllerProvider.notifier);

    if (!sessionState.isAuthenticated) {
      return GigvoraScaffold(
        title: 'Gigvora home',
        subtitle: 'Sign in to unlock personalised dashboards',
        body: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Pick a path to join the network or return to your saved progress.',
              style: Theme.of(context).textTheme.bodyLarge,
            ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: () => GoRouter.of(context).go('/login'),
              icon: const Icon(Icons.lock_open),
              label: const Text('Sign in to continue'),
            ),
            const SizedBox(height: 12),
            OutlinedButton.icon(
              onPressed: () => GoRouter.of(context).go('/signup'),
              icon: const Icon(Icons.person_add_alt),
              label: const Text('Create a Gigvora profile'),
            ),
            const SizedBox(height: 24),
            Text(
              'Not sure where to start? Tap "Create a Gigvora profile" to explore freelancer, company, and agency onboarding.',
              style: Theme.of(context)
                  .textTheme
                  .bodySmall
                  ?.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant),
            ),
          ],
        ),
      );
    }

    final session = sessionState.session!;
    final activeRole = session.activeMembership;
    final activeDashboard = session.dashboardFor(activeRole) ??
        session.dashboardFor(session.memberships.first) ??
        session.dashboards.values.first;

    return GigvoraScaffold(
      title: 'Hi, ${session.name.split(' ').first}',
      subtitle: '${session.title} • ${session.location}',
      actions: [
        IconButton(
          tooltip: 'Log out',
          onPressed: () {
            controller.logout();
            GoRouter.of(context).go('/login');
          },
          icon: const Icon(Icons.logout_outlined),
        ),
      ],
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Switch context',
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 12),
            _RoleSwitcher(
              session: session,
              onChanged: controller.selectRole,
            ),
            const SizedBox(height: 24),
            _DashboardHero(
              session: session,
              dashboard: activeDashboard,
            ),
            const SizedBox(height: 24),
            _MetricsWrap(metrics: activeDashboard.metrics),
            const SizedBox(height: 24),
            ...activeDashboard.sections
                .map((section) => Padding(
                      padding: const EdgeInsets.only(bottom: 16),
                      child: _DashboardSectionCard(section: section),
                    ))
                .toList(),
            if (activeDashboard.actions.isNotEmpty) ...[
              const SizedBox(height: 8),
              _DashboardActions(actions: activeDashboard.actions),
            ],
            const SizedBox(height: 12),
          ],
        ),
      ),
    );
  }
}

class _RoleSwitcher extends StatelessWidget {
  const _RoleSwitcher({required this.session, required this.onChanged});

  final UserSession session;
  final ValueChanged<String> onChanged;

  @override
  Widget build(BuildContext context) {
    final memberships = session.memberships;
    return Wrap(
      spacing: 12,
      runSpacing: 12,
      children: memberships
          .map(
            (role) => ChoiceChip(
              selected: role == session.activeMembership,
              onSelected: (_) => onChanged(role),
              showCheckmark: false,
              label: Text(session.roleLabel(role)),
              avatar: role == session.activeMembership
                  ? const Icon(Icons.check_circle, size: 18)
                  : const Icon(Icons.circle_outlined, size: 18),
            ),
          )
          .toList(),
    );
  }
}

class _DashboardHero extends StatelessWidget {
  const _DashboardHero({required this.session, required this.dashboard});

  final UserSession session;
  final RoleDashboard dashboard;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final textTheme = theme.textTheme;
    final colorScheme = theme.colorScheme;
    final emphasisColor = colorScheme.primary.withOpacity(0.12);

    return GigvoraCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            dashboard.heroTitle,
            style: textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: 12),
          Text(
            dashboard.heroSubtitle,
            style: textTheme.bodyMedium?.copyWith(
              color: colorScheme.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: 16),
          Wrap(
            spacing: 12,
            runSpacing: 12,
            children: [
              _HeroPill(
                icon: Icons.people_outline,
                label: 'Connections',
                value: session.connections.toString(),
                backgroundColor: emphasisColor,
              ),
              _HeroPill(
                icon: Icons.favorite_outline,
                label: 'Followers',
                value: session.followers.toString(),
                backgroundColor: emphasisColor,
              ),
              if (session.companies.isNotEmpty)
                _HeroPill(
                  icon: Icons.business,
                  label: 'Companies',
                  value: session.companies.join(', '),
                  backgroundColor: emphasisColor,
                ),
              if (session.agencies.isNotEmpty)
                _HeroPill(
                  icon: Icons.apartment_outlined,
                  label: 'Agencies',
                  value: session.agencies.join(', '),
                  backgroundColor: emphasisColor,
                ),
            ],
          ),
        ],
      ),
    );
  }
}

class _HeroPill extends StatelessWidget {
  const _HeroPill({
    required this.icon,
    required this.label,
    required this.value,
    required this.backgroundColor,
  });

  final IconData icon;
  final String label;
  final String value;
  final Color backgroundColor;

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 18),
          const SizedBox(width: 8),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label, style: textTheme.labelSmall),
              Text(
                value,
                style: textTheme.labelLarge?.copyWith(fontWeight: FontWeight.w600),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _MetricsWrap extends StatelessWidget {
  const _MetricsWrap({required this.metrics});

  final List<DashboardMetric> metrics;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final maxWidth = constraints.maxWidth;
        const spacing = 16.0;
        final twoColumn = maxWidth > 520;
        final cardWidth = twoColumn ? (maxWidth - spacing) / 2 : maxWidth;
        return Wrap(
          spacing: spacing,
          runSpacing: spacing,
          children: metrics
              .map(
                (metric) => SizedBox(
                  width: cardWidth,
                  child: _MetricCard(metric: metric),
                ),
              )
              .toList(),
        );
      },
    );
  }
}

class _MetricCard extends StatelessWidget {
  const _MetricCard({required this.metric});

  final DashboardMetric metric;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    return GigvoraCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            metric.label,
            style: theme.textTheme.labelLarge,
          ),
          const SizedBox(height: 12),
          Text(
            metric.value,
            style: theme.textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w600),
          ),
          if (metric.trend != null) ...[
            const SizedBox(height: 8),
            Text(
              metric.trend!,
              style: theme.textTheme.bodySmall?.copyWith(
                color: colorScheme.onSurfaceVariant,
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _DashboardSectionCard extends StatelessWidget {
  const _DashboardSectionCard({required this.section});

  final DashboardSection section;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final accent = section.accentColor ?? colorScheme.primary;
    return GigvoraCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                decoration: BoxDecoration(
                  color: accent.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(16),
                ),
                padding: const EdgeInsets.all(10),
                child: Icon(section.icon, color: accent),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      section.title,
                      style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      section.subtitle,
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: colorScheme.onSurfaceVariant,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: section.highlights
                .map(
                  (item) => Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Icon(Icons.brightness_1, size: 8, color: accent),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            item,
                            style: theme.textTheme.bodyMedium,
                          ),
                        ),
                      ],
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

class _DashboardActions extends StatelessWidget {
  const _DashboardActions({required this.actions});

  final List<DashboardAction> actions;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    return GigvoraCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Next best actions',
            style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: 12),
          ...actions.map(
            (action) => Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    margin: const EdgeInsets.only(top: 4),
                    width: 8,
                    height: 8,
                    decoration: BoxDecoration(
                      color: colorScheme.primary,
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          action.label,
                          style: theme.textTheme.labelLarge?.copyWith(fontWeight: FontWeight.w600),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          action.description,
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: colorScheme.onSurfaceVariant,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
