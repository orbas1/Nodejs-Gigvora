import 'package:flutter/material.dart';
import '../../../theme/widgets.dart';

class VolunteeringScreen extends StatelessWidget {
  const VolunteeringScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final roles = [
      {
        'title': 'Open Source Mentor',
        'organization': 'Gigvora Foundation',
        'commitment': '4 hrs/week',
      },
      {
        'title': 'Career Navigator',
        'organization': 'Launchpad Collective',
        'commitment': '2 hrs/week',
      },
    ];

    return GigvoraScaffold(
      title: 'Volunteering',
      subtitle: 'Give back to the Gigvora community',
      body: ListView.separated(
        itemCount: roles.length,
        separatorBuilder: (_, __) => const SizedBox(height: 12),
        itemBuilder: (context, index) {
          final role = roles[index];
          return GigvoraCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(role['title']!, style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 4),
                Text(role['organization']!, style: Theme.of(context).textTheme.bodySmall),
                const SizedBox(height: 4),
                Text(
                  role['commitment']!,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: Theme.of(context).colorScheme.onSurfaceVariant,
                      ),
                ),
                const SizedBox(height: 12),
                OutlinedButton(onPressed: () {}, child: const Text('Volunteer now')),
              ],
            ),
          );
        },
      ),
    );
  }
}
