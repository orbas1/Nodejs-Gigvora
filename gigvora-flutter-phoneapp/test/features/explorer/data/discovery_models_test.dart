import 'package:flutter_test/flutter_test.dart';

import 'package:gigvora_mobile/features/explorer/data/discovery_models.dart';
import 'package:gigvora_mobile/features/marketplace/data/models/opportunity.dart';

void main() {
  test('DiscoverySnapshot parses category buckets correctly', () {
    final snapshot = DiscoverySnapshot.fromJson(_snapshotJson);

    expect(snapshot.itemsFor(OpportunityCategory.job), hasLength(1));
    expect(snapshot.itemsFor(OpportunityCategory.volunteering), isEmpty);
  });

  test('GlobalSearchResult parses opportunities and people', () {
    final result = GlobalSearchResult.fromJson(_searchJson);

    expect(result.resultsFor(OpportunityCategory.job).first.title, 'Lead Designer');
    expect(result.people.first.displayName, 'Mira Chen');
  });

}

const _snapshotJson = <String, dynamic>{
  'jobs': {
    'items': [
      {
        'id': 'job-1',
        'title': 'Lead Designer',
        'description': 'Shape product experiences',
        'updatedAt': '2024-03-01T00:00:00Z',
      }
    ],
  },
  'gigs': {'items': []},
  'projects': {'items': []},
  'launchpads': {'items': []},
  'volunteering': {'items': []},
};

const _searchJson = <String, dynamic>{
  'jobs': [
    {
      'id': 'job-2',
      'title': 'Lead Designer',
      'description': 'Lead design systems',
      'updatedAt': '2024-03-02T00:00:00Z',
    }
  ],
  'people': [
    {
      'id': 'person-8',
      'firstName': 'Mira',
      'lastName': 'Chen',
      'email': 'mira@example.com',
    }
  ],
};
