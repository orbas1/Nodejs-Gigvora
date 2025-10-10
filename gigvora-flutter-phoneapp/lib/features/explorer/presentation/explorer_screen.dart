import 'package:flutter/material.dart';
import '../../../theme/widgets.dart';

class ExplorerScreen extends StatefulWidget {
  const ExplorerScreen({super.key});

  @override
  State<ExplorerScreen> createState() => _ExplorerScreenState();
}

class _ExplorerScreenState extends State<ExplorerScreen> {
  final categories = [
    'All',
    'Jobs',
    'Gigs',
    'Projects',
    'Launchpad',
    'Volunteering',
    'People',
  ];
  String selected = 'All';

  final results = const [
    {'title': 'Product Designer • Remote', 'category': 'Jobs'},
    {'title': 'AI Recruiting Prototype', 'category': 'Projects'},
    {'title': 'Community Catalyst Fellowship', 'category': 'Launchpad'},
    {'title': 'Volunteer Frontend Mentor', 'category': 'Volunteering'},
  ];

  @override
  Widget build(BuildContext context) {
    final filtered = selected == 'All'
        ? results
        : results.where((element) => element['category'] == selected).toList();

    return GigvoraScaffold(
      title: 'Explorer Search',
      subtitle: 'Discover talent, opportunities, and collaborators',
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: categories.map((category) {
              final isActive = category == selected;
              return ChoiceChip(
                label: Text(category),
                selected: isActive,
                onSelected: (_) => setState(() => selected = category),
              );
            }).toList(),
          ),
          const SizedBox(height: 24),
          Expanded(
            child: ListView.separated(
              itemCount: filtered.length,
              separatorBuilder: (_, __) => const SizedBox(height: 12),
              itemBuilder: (context, index) {
                final result = filtered[index];
                return GigvoraCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        result['category']!,
                        style: Theme.of(context).textTheme.labelMedium?.copyWith(color: Colors.tealAccent),
                      ),
                      const SizedBox(height: 8),
                      Text(result['title']!, style: Theme.of(context).textTheme.titleMedium),
                      const SizedBox(height: 12),
                      OutlinedButton(
                        onPressed: () {},
                        child: const Text('Open details'),
                      ),
                    ],
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
