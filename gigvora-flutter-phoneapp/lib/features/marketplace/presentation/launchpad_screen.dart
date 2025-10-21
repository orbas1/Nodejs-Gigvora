import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../theme/widgets.dart';
import '../../auth/application/session_controller.dart';
import '../data/models/opportunity.dart';
import 'opportunity_list.dart';

class LaunchpadScreen extends ConsumerWidget {
  const LaunchpadScreen({super.key});

  static const gateCardKey = Key('launchpad_gate_card');
  static const requestAccessMessageKey = Key('launchpad_request_access_message');
  static const cohortListKey = Key('launchpad_opportunity_list');

  static final Set<String> _allowedRoles = {
    'freelancer',
    'mentor',
    'agency',
    'company',
    'admin',
  };

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final sessionState = ref.watch(sessionControllerProvider);
    final session = sessionState.session;
    final theme = Theme.of(context);
    final memberships = session?.memberships ?? const <String>[];
    final normalizedRoles = memberships.map((role) => role.toLowerCase()).toSet();
    final hasAccess = normalizedRoles.any(_allowedRoles.contains);

    if (!sessionState.isAuthenticated || !hasAccess) {
      final isAuthenticated = sessionState.isAuthenticated;
      return GigvoraScaffold(
        title: 'Experience Launchpad',
        subtitle: 'Mentored sprints to accelerate your experience',
        body: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            GigvoraCard(
              key: gateCardKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Launchpad workspace is safeguarded', style: theme.textTheme.titleMedium),
                  const SizedBox(height: 8),
                  Text(
                    'Only verified fellows, mentors, agencies, and partner companies can access Experience Launchpad. '
                    'This protects pilot programmes, placement data, and company briefs.',
                    style: theme.textTheme.bodyMedium,
                  ),
                  const SizedBox(height: 16),
                  if (!isAuthenticated)
                    Wrap(
                      spacing: 12,
                      runSpacing: 12,
                      children: [
                        ElevatedButton(
                          onPressed: () => context.push('/login'),
                          child: const Text('Sign in'),
                        ),
                        OutlinedButton(
                          onPressed: () => context.push('/register'),
                          child: const Text('Create account'),
                        ),
                      ],
                    )
                  else
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: const [
                        Text(
                          'Request Launchpad access via launchpad@gigvora.com so our cohort operations team can enable '
                          'the workspace for you.',
                          key: requestAccessMessageKey,
                        ),
                      ],
                    ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            GigvoraCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: const [
                  Text('What you unlock'),
                  SizedBox(height: 8),
                  _LaunchpadBenefit(text: 'Curated mentor pods, company briefs, and cohort rituals.'),
                  _LaunchpadBenefit(text: 'Secure dashboards for tracking sprint progress and placements.'),
                  _LaunchpadBenefit(text: 'Direct pathways into projects, gigs, and leadership rotations.'),
                ],
              ),
            ),
          ],
        ),
      );
    }

    return OpportunityListScreen(
      key: cohortListKey,
      category: OpportunityCategory.launchpad,
      title: 'Experience Launchpad',
      subtitle: 'Mentored sprints to accelerate your experience',
      ctaLabel: 'Apply to cohort',
      searchPlaceholder: 'Search cohorts by track or mentor',
      emptyDefaultMessage:
          'Cohorts unlock as new sprints go live. Check back soon for upcoming launchpad programmes.',
      emptySearchMessage:
          'No cohorts matched those filters yet. Try another keyword or refresh for the latest schedule.',
    );
  }
}

class _LaunchpadBenefit extends StatelessWidget {
  const _LaunchpadBenefit({required this.text});

  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: const [
          Icon(Icons.check_circle, color: Color(0xFF2563EB), size: 18),
          SizedBox(width: 8),
          Expanded(child: Text(text)),
        ],
      ),
    );
  }
}
