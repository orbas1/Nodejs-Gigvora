import 'package:flutter/material.dart';

import '../data/models/opportunity.dart';
import 'opportunity_list.dart';

class GigsScreen extends StatelessWidget {
  const GigsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return OpportunityListScreen(
      category: OpportunityCategory.gig,
      title: 'Gigs',
      subtitle: 'Short-term engagements and micro-projects',
      ctaLabel: 'Pitch this gig',
      searchPlaceholder: 'Search gigs by keyword, budget, or duration',
      emptyDefaultMessage:
          'Gigs sourced from launch partners will populate here as soon as we complete sync.',
      emptySearchMessage: 'No gigs matched your filters. Adjust your keywords or try again soon.',
    );
  }
}
