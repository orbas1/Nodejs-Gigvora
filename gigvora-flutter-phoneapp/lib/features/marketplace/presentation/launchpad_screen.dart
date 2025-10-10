import 'package:flutter/material.dart';
import '../../../theme/widgets.dart';

class LaunchpadScreen extends StatelessWidget {
  const LaunchpadScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final cohorts = [
      {
        'name': 'Launchpad Cohort • Product Builders',
        'dates': 'June 2024',
        'mentors': 'Mentors: Ava Founder, Leo Freelancer',
      },
      {
        'name': 'Launchpad Cohort • Creative Producers',
        'dates': 'August 2024',
        'mentors': 'Mentors: Nova Agency, Atlas Studios',
      },
    ];

    return GigvoraScaffold(
      title: 'Experience Launchpad',
      subtitle: 'Mentored sprints to accelerate your experience',
      body: ListView.separated(
        itemCount: cohorts.length,
        separatorBuilder: (_, __) => const SizedBox(height: 12),
        itemBuilder: (context, index) {
          final cohort = cohorts[index];
          return GigvoraCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(cohort['name']!, style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 4),
                Text(cohort['dates']!, style: Theme.of(context).textTheme.bodySmall?.copyWith(color: Colors.white70)),
                const SizedBox(height: 4),
                Text(cohort['mentors']!, style: Theme.of(context).textTheme.bodySmall),
                const SizedBox(height: 12),
                ElevatedButton(onPressed: () {}, child: const Text('Apply to cohort')),
              ],
            ),
          );
        },
      ),
    );
  }
}
