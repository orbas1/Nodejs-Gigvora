import 'package:flutter/material.dart';
import '../../../theme/widgets.dart';

class JobsScreen extends StatelessWidget {
  const JobsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final jobs = [
      {
        'title': 'Senior Frontend Engineer',
        'company': 'Orbit Labs',
        'location': 'Remote',
        'salary': 'USD 130k - 150k',
      },
      {
        'title': 'Growth Marketing Lead',
        'company': 'Gigvora HQ',
        'location': 'Hybrid • NYC',
        'salary': 'USD 110k - 130k + bonus',
      },
    ];

    return GigvoraScaffold(
      title: 'Jobs',
      subtitle: 'Long-term roles across the Gigvora network',
      body: ListView.separated(
        itemCount: jobs.length,
        separatorBuilder: (_, __) => const SizedBox(height: 12),
        itemBuilder: (context, index) {
          final job = jobs[index];
          return GigvoraCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(job['title']!, style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 4),
                Text('${job['company']} • ${job['location']}', style: Theme.of(context).textTheme.bodySmall),
                const SizedBox(height: 4),
                Text(job['salary']!, style: Theme.of(context).textTheme.bodySmall?.copyWith(color: Colors.white70)),
                const SizedBox(height: 12),
                ElevatedButton(onPressed: () {}, child: const Text('Apply now')),
              ],
            ),
          );
        },
      ),
    );
  }
}
