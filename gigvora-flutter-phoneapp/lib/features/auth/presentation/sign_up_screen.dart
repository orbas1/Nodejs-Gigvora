import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:gigvora_mobile/router/app_routes.dart';

import '../../../theme/widgets.dart';

class SignUpScreen extends StatefulWidget {
  const SignUpScreen({super.key});

  @override
  State<SignUpScreen> createState() => _SignUpScreenState();
}

class _SignUpScreenState extends State<SignUpScreen> {
  String _organisationType = 'company';

  @override
  Widget build(BuildContext context) {
    return GigvoraScaffold(
      title: 'Join Gigvora',
      subtitle: 'Choose how you want to participate',
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Select the journey that aligns with your goals. You can always expand into new roles once your account is live.',
              style: Theme.of(context).textTheme.bodyLarge,
            ),
            const SizedBox(height: 24),
            _SignUpCard(
              eyebrow: 'Talent',
              title: 'Freelancers & professionals',
              description:
                  'Create a portfolio-ready profile, unlock tailored feeds, and access live operations dashboards for gigs and projects.',
              highlights: const [
                'AI-assisted profile builder with testimonials and hero projects.',
                'Smart recommendations across jobs, gigs, launchpad challenges, and volunteering.',
                'Network graph visualisations and tools to nurture warm introductions.',
              ],
              primaryLabel: 'Create freelancer profile',
              onPrimaryTap: () =>
                  GoRouter.of(context).go(AppRoute.register.path),
              secondaryLabel: 'Need a company hub? Switch below.',
            ),
            const SizedBox(height: 24),
            GigvoraCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: const Color(0xFF2563EB).withOpacity(0.12),
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: const Icon(Icons.groups_2, color: Color(0xFF2563EB)),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Teams & partners',
                              style: Theme.of(context)
                                  .textTheme
                                  .titleMedium
                                  ?.copyWith(fontWeight: FontWeight.w600),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'Build a branded workspace for hiring, collaborations, and partner activations.',
                              style: Theme.of(context)
                                  .textTheme
                                  .bodySmall
                                  ?.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),
                  Text(
                    'What type of organisation are you registering?',
                    style: Theme.of(context).textTheme.labelLarge,
                  ),
                  const SizedBox(height: 12),
                  SegmentedButton<String>(
                    segments: const [
                      ButtonSegment(value: 'company', label: Text('Company')),
                      ButtonSegment(value: 'agency', label: Text('Agency')),
                    ],
                    selected: <String>{_organisationType},
                    onSelectionChanged: (value) {
                      setState(() {
                        _organisationType = value.first;
                      });
                    },
                  ),
                  const SizedBox(height: 20),
                  _OrganisationHighlights(type: _organisationType),
                  const SizedBox(height: 20),
                  FilledButton(
                    onPressed: () => GoRouter.of(context)
                        .go(AppRoute.registerCompany.path),
                    child: Text(
                      _organisationType == 'company'
                          ? 'Launch company hub'
                          : 'Launch agency hub',
                    ),
                  ),
                  const SizedBox(height: 8),
                  TextButton(
                    onPressed: () =>
                        GoRouter.of(context).go(AppRoute.login.path),
                    child: const Text('Already collaborating? Sign in'),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _SignUpCard extends StatelessWidget {
  const _SignUpCard({
    required this.eyebrow,
    required this.title,
    required this.description,
    required this.highlights,
    required this.primaryLabel,
    required this.onPrimaryTap,
    this.secondaryLabel,
  });

  final String eyebrow;
  final String title;
  final String description;
  final List<String> highlights;
  final String primaryLabel;
  final VoidCallback onPrimaryTap;
  final String? secondaryLabel;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    return GigvoraCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            eyebrow.toUpperCase(),
            style: theme.textTheme.labelSmall
                ?.copyWith(color: colorScheme.primary, fontWeight: FontWeight.w700, letterSpacing: 1.2),
          ),
          const SizedBox(height: 8),
          Text(
            title,
            style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 12),
          Text(
            description,
            style: theme.textTheme.bodyMedium
                ?.copyWith(color: theme.colorScheme.onSurfaceVariant, height: 1.4),
          ),
          const SizedBox(height: 16),
          ...highlights.map(
            (item) => Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(Icons.star_rounded, color: Color(0xFF2563EB), size: 18),
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
          ),
          const SizedBox(height: 12),
          FilledButton(
            onPressed: onPrimaryTap,
            child: Text(primaryLabel),
          ),
          if (secondaryLabel != null) ...[
            const SizedBox(height: 4),
            Text(
              secondaryLabel!,
              style: theme.textTheme.bodySmall
                  ?.copyWith(color: theme.colorScheme.onSurfaceVariant),
            ),
          ],
        ],
      ),
    );
  }
}

class _OrganisationHighlights extends StatelessWidget {
  const _OrganisationHighlights({required this.type});

  final String type;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isCompany = type == 'company';
    final header = isCompany ? 'Company hub benefits' : 'Agency workspace benefits';
    final bulletPoints = isCompany
        ? const [
            'Launch branded careers pages with multimedia job posts.',
            'Collaborate with hiring managers using shared scorecards.',
            'Integrate Slack, Notion, and ATS tooling with secure permissions.',
          ]
        : const [
            'Coordinate multi-disciplinary squads with shared retrospectives.',
            'Centralise rosters, briefs, and client comms in one collaboration hub.',
            'Surface gig-ready specialists with live availability matrices.',
          ];
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          header,
          style: theme.textTheme.labelLarge?.copyWith(fontWeight: FontWeight.w600),
        ),
        const SizedBox(height: 12),
        ...bulletPoints.map(
          (item) => Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Icon(
                  Icons.brightness_1,
                  size: 8,
                  color: Theme.of(context).colorScheme.primary,
                ),
                const SizedBox(width: 8),
                Expanded(child: Text(item, style: theme.textTheme.bodyMedium)),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
