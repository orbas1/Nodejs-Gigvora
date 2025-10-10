import 'package:flutter/material.dart';
import '../../../theme/widgets.dart';

class FeedScreen extends StatelessWidget {
  const FeedScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final posts = [
      {
        'author': 'Maya Product',
        'time': '2m ago',
        'content': 'Launching applications for Experience Launchpad Sprint 03! Looking for researchers + builders.',
      },
      {
        'author': 'Atlas Agency',
        'time': '15m ago',
        'content': 'Hiring freelance motion designers for a fintech campaign. DM portfolios. #gigs',
      },
    ];

    return GigvoraScaffold(
      title: 'Live Feed',
      subtitle: 'Stories from the Gigvora community',
      actions: [
        IconButton(
          onPressed: () {},
          icon: const Icon(Icons.add_circle_outline),
        ),
      ],
      body: ListView.separated(
        itemCount: posts.length,
        separatorBuilder: (_, __) => const SizedBox(height: 16),
        itemBuilder: (context, index) {
          final post = posts[index];
          return GigvoraCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(post['author']!, style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 4),
                Text(
                  post['time']!,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: Theme.of(context).colorScheme.onSurfaceVariant,
                      ),
                ),
                const SizedBox(height: 12),
                Text(post['content']!, style: Theme.of(context).textTheme.bodyMedium),
                const SizedBox(height: 12),
                Row(
                  children: [
                    IconButton(onPressed: () {}, icon: const Icon(Icons.favorite_border)),
                    IconButton(onPressed: () {}, icon: const Icon(Icons.mode_comment_outlined)),
                    IconButton(onPressed: () {}, icon: const Icon(Icons.share_outlined)),
                  ],
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}
