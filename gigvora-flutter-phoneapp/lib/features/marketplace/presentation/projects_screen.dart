import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../data/models/opportunity.dart';
import 'opportunity_list.dart';

class ProjectsScreen extends StatelessWidget {
  const ProjectsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return OpportunityListScreen(
      category: OpportunityCategory.project,
      title: 'Projects',
      subtitle: 'Collaborate with teams building new products',
      ctaLabel: 'Request access',
      searchPlaceholder: 'Search projects by focus area or status',
      emptyDefaultMessage:
          'We\'re syncing projects from agencies, companies, and launchpad cohorts. Check back shortly.',
      emptySearchMessage: 'No projects matched your filters just yet. Try another keyword or refresh soon.',
      actions: [
        TextButton.icon(
          onPressed: () => context.push('/projects/new'),
          icon: const Icon(Icons.add),
          label: const Text('Post project'),
        ),
      ],
    );
  }
}
