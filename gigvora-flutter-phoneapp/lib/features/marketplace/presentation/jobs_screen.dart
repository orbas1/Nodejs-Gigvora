import 'package:flutter/material.dart';

import '../data/models/opportunity.dart';
import 'opportunity_list.dart';

class JobsScreen extends StatelessWidget {
  const JobsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return OpportunityListScreen(
      category: OpportunityCategory.job,
      title: 'Jobs',
      subtitle: 'Long-term roles across the Gigvora network',
      ctaLabel: 'Apply now',
      searchPlaceholder: 'Search by title, location, or keywords',
      emptyDefaultMessage:
          'Jobs curated from trusted teams will appear here as we sync the marketplace.',
      emptySearchMessage: 'No jobs matched your filters yet. Try broadening your search.',
    );
  }
}
