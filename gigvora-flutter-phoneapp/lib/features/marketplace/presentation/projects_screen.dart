import 'package:flutter/material.dart';
import '../../../theme/widgets.dart';

class ProjectsScreen extends StatelessWidget {
  const ProjectsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final projects = [
      {
        'title': 'Experience Launchpad Sprint 03',
        'stage': 'Accepting applications',
        'collaborators': '24 collaborators',
      },
      {
        'title': 'Creator Studio Collective',
        'stage': 'In progress',
        'collaborators': '18 collaborators',
      },
    ];

    return GigvoraScaffold(
      title: 'Projects',
      subtitle: 'Collaborate with teams building new products',
      body: ListView.separated(
        itemCount: projects.length,
        separatorBuilder: (_, __) => const SizedBox(height: 12),
        itemBuilder: (context, index) {
          final project = projects[index];
          return GigvoraCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(project['title']!, style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 4),
                Text(project['stage']!, style: Theme.of(context).textTheme.bodySmall?.copyWith(color: Colors.tealAccent)),
                const SizedBox(height: 4),
                Text(project['collaborators']!, style: Theme.of(context).textTheme.bodySmall),
                const SizedBox(height: 12),
                OutlinedButton(onPressed: () {}, child: const Text('Join project')),
              ],
            ),
          );
        },
      ),
    );
  }
}
