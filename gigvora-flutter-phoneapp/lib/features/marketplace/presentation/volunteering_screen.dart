import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../theme/widgets.dart';
import '../../auth/application/session_controller.dart';
import '../data/models/opportunity.dart';
import 'opportunity_list.dart';

class VolunteeringScreen extends ConsumerWidget {
  const VolunteeringScreen({super.key});

  static final Set<String> _allowedRoles = {'volunteer', 'mentor', 'admin'};

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final sessionState = ref.watch(sessionControllerProvider);
    final session = sessionState.session;
    final memberships = session?.memberships ?? const <String>[];
    final hasAccess = memberships.any((role) => _allowedRoles.contains(role.toLowerCase()));

    if (!hasAccess) {
      final theme = Theme.of(context);
      final isAuthenticated = session != null;
      return GigvoraScaffold(
        title: 'Volunteering',
        subtitle: 'Give back to the Gigvora community',
        body: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            GigvoraCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Volunteer workspace is safeguarded', style: theme.textTheme.titleMedium),
                  const SizedBox(height: 8),
                  Text(
                    'Only vetted mentors and community operators can mobilise inside Gigvora volunteering. This keeps our civic partners and vulnerable communities safe.',
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
                          'Request volunteer access via impact@gigvora.com so our safeguarding team can enable the workspace for you.',
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
                  _VolunteerBenefit(text: 'Priority community missions from climate, education, and civic partners.'),
                  _VolunteerBenefit(text: 'Secure chat, document vaults, and compliance logging baked in.'),
                  _VolunteerBenefit(text: 'Impact credits and badges that elevate your profile across the platform.'),
                ],
              ),
            ),
          ],
        ),
      );
    }

    return OpportunityListScreen(
      category: OpportunityCategory.volunteering,
      title: 'Volunteering',
      subtitle: 'Give back to the Gigvora community',
      ctaLabel: 'Volunteer now',
      searchPlaceholder: 'Search volunteer roles by cause or organization',
      emptyDefaultMessage:
          'Volunteer openings from trusted causes will appear here as our partners publish opportunities.',
      emptySearchMessage: 'No volunteer roles matched your filters. Try a different cause or check back soon.',
    );
  }
}

class _VolunteerBenefit extends StatelessWidget {
  const _VolunteerBenefit({required this.text});

  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(Icons.check_circle, color: Color(0xFF2563EB), size: 18),
          const SizedBox(width: 8),
          Expanded(child: Text(text)),
        ],
      ),
    );
  }
}
