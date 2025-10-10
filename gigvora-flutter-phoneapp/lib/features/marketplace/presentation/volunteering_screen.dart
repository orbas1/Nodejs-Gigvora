import 'package:flutter/material.dart';

import '../data/models/opportunity.dart';
import 'opportunity_list.dart';

class VolunteeringScreen extends StatelessWidget {
  const VolunteeringScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return OpportunityListScreen(
      category: OpportunityCategory.volunteering,
      title: 'Volunteering',
      subtitle: 'Give back to the Gigvora community',
      ctaLabel: 'Volunteer now',
      searchPlaceholder: 'Search volunteer roles by cause or organization',
      emptyDefaultMessage:
          'Volunteer openings from trusted causes will appear here as our partners publish opportunities.',
      emptySearchMessage: 'No volunteer roles matched your filters. Try a different cause or check back soon.',
    );
  }
}
