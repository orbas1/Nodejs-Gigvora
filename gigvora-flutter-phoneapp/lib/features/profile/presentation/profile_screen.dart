import 'package:flutter/material.dart';
import '../../../theme/widgets.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final skills = ['Node.js', 'React', 'Tailwind', 'MySQL'];
    final groups = ['Future of Work Collective', 'Gigvora Launchpad Cohort 01'];

    return GigvoraScaffold(
      title: 'Profile',
      subtitle: 'Your Gigvora presence',
      body: ListView(
        children: [
          GigvoraCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Leo Freelancer', style: Theme.of(context).textTheme.headlineSmall),
                const SizedBox(height: 4),
                Text('Full Stack Developer • Berlin', style: Theme.of(context).textTheme.bodySmall),
                const SizedBox(height: 12),
                Text(
                  'Building future-of-work platforms and communities. Previously launched three SaaS products and mentored 40+ builders.',
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          GigvoraCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Skills', style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 12),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: skills.map((skill) => Chip(label: Text(skill))).toList(),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          GigvoraCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Groups', style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 12),
                ...groups.map((group) => Padding(
                      padding: const EdgeInsets.only(bottom: 8),
                      child: Text(group, style: Theme.of(context).textTheme.bodyMedium),
                    )),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
