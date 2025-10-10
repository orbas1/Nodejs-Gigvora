import 'package:flutter/material.dart';
import '../../../theme/widgets.dart';

class GigsScreen extends StatelessWidget {
  const GigsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final gigs = [
      {
        'title': 'Brand Identity Sprint',
        'poster': 'Nova Agency',
        'budget': 'Budget 3,500 USD',
        'duration': '4 weeks',
      },
      {
        'title': 'AI Recruiting Prototype',
        'poster': 'Gigvora Labs',
        'budget': 'Budget 2,000 USD',
        'duration': '2 weeks',
      },
    ];

    return GigvoraScaffold(
      title: 'Gigs',
      subtitle: 'Short-term engagements and micro-projects',
      body: ListView.separated(
        itemCount: gigs.length,
        separatorBuilder: (_, __) => const SizedBox(height: 12),
        itemBuilder: (context, index) {
          final gig = gigs[index];
          return GigvoraCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(gig['title']!, style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 4),
                Text('${gig['poster']} • ${gig['duration']}', style: Theme.of(context).textTheme.bodySmall),
                const SizedBox(height: 4),
                Text(gig['budget']!, style: Theme.of(context).textTheme.bodySmall?.copyWith(color: Colors.white70)),
                const SizedBox(height: 12),
                OutlinedButton(onPressed: () {}, child: const Text('Pitch this gig')),
              ],
            ),
          );
        },
      ),
    );
  }
}
