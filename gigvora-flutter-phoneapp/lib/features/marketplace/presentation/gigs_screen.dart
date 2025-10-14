import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../auth/application/session_controller.dart';
import '../../../theme/widgets.dart';
import '../data/models/opportunity.dart';
import 'opportunity_list.dart';

class GigsScreen extends ConsumerWidget {
  const GigsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final sessionState = ref.watch(sessionControllerProvider);

    if (!sessionState.isAuthenticated) {
      return GigvoraScaffold(
        title: 'Gigs marketplace',
        subtitle: 'Freelancer workspace required',
        body: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Sign in with your freelancer profile to pitch curated briefs, sync delivery status, and collaborate with clients in real time.',
              style: Theme.of(context).textTheme.bodyMedium,
            ),
            const SizedBox(height: 24),
            Wrap(
              spacing: 12,
              runSpacing: 12,
              children: [
                ElevatedButton.icon(
                  onPressed: () => GoRouter.of(context).go('/login'),
                  icon: const Icon(Icons.lock_open),
                  label: const Text('Sign in'),
                ),
                OutlinedButton.icon(
                  onPressed: () => GoRouter.of(context).go('/signup'),
                  icon: const Icon(Icons.person_add_alt_1),
                  label: const Text('Create freelancer profile'),
                ),
              ],
            ),
          ],
        ),
      );
    }

    final session = sessionState.session!;
    final hasFreelancerAccess = session.memberships.contains('freelancer');

    if (!hasFreelancerAccess) {
      return GigvoraScaffold(
        title: 'Gigs marketplace',
        subtitle: 'Freelancer workspace required',
        body: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Only verified freelancer workspaces can access active gigs to protect budgets, scopes, and client operations.',
              style: Theme.of(context).textTheme.bodyMedium,
            ),
            const SizedBox(height: 24),
            Wrap(
              spacing: 12,
              runSpacing: 12,
              children: [
                OutlinedButton.icon(
                  onPressed: () => GoRouter.of(context).go('/home'),
                  icon: const Icon(Icons.manage_accounts_outlined),
                  label: const Text('Manage memberships'),
                ),
                ElevatedButton.icon(
                  onPressed: () => GoRouter.of(context).go('/signup'),
                  icon: const Icon(Icons.verified_user_outlined),
                  label: const Text('Request freelancer access'),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Text(
              "Once activated you'll unlock pitch tracking, compliance workflows, and seamless parity with the Gigvora mobile experience.",
              style: Theme.of(context)
                  .textTheme
                  .bodySmall
                  ?.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant),
            ),
          ],
        ),
      );
    }

    return OpportunityListScreen(
      category: OpportunityCategory.gig,
      title: 'Gigs',
      subtitle: 'Short-term engagements and micro-projects',
      ctaLabel: 'Pitch this gig',
      searchPlaceholder: 'Search gigs by keyword, budget, or duration',
      emptyDefaultMessage:
          'Gigs sourced from launch partners will populate here as soon as we complete sync.',
      emptySearchMessage: 'No gigs matched your filters. Adjust your keywords or try again soon.',
    );
  }
}
