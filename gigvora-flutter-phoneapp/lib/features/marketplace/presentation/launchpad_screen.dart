import 'package:flutter/material.dart';

import '../data/models/opportunity.dart';
import 'opportunity_list.dart';

class LaunchpadScreen extends StatelessWidget {
  const LaunchpadScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return OpportunityListScreen(
      category: OpportunityCategory.launchpad,
      title: 'Experience Launchpad',
      subtitle: 'Mentored sprints to accelerate your experience',
      ctaLabel: 'Apply to cohort',
      searchPlaceholder: 'Search cohorts by track or mentor',
      emptyDefaultMessage:
          'Cohorts unlock as new sprints go live. Check back soon for upcoming launchpad programmes.',
      emptySearchMessage:
          'No cohorts matched those filters yet. Try another keyword or refresh for the latest schedule.',
    );
  }
}
