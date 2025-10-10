import '../../marketplace/data/models/opportunity.dart';

class DiscoverySnapshot {
  DiscoverySnapshot({required this.buckets});

  final Map<OpportunityCategory, List<OpportunitySummary>> buckets;

  List<OpportunitySummary> itemsFor(OpportunityCategory category) =>
      buckets[category] ?? const <OpportunitySummary>[];

  factory DiscoverySnapshot.fromJson(Map<String, dynamic> json) {
    return DiscoverySnapshot(buckets: {
      OpportunityCategory.job: _parseBucket(OpportunityCategory.job, json['jobs']),
      OpportunityCategory.gig: _parseBucket(OpportunityCategory.gig, json['gigs']),
      OpportunityCategory.project: _parseBucket(OpportunityCategory.project, json['projects']),
      OpportunityCategory.launchpad: _parseBucket(OpportunityCategory.launchpad, json['launchpads']),
      OpportunityCategory.volunteering:
          _parseBucket(OpportunityCategory.volunteering, json['volunteering']),
    });
  }

  factory DiscoverySnapshot.empty() {
    return DiscoverySnapshot(buckets: {
      for (final category in OpportunityCategory.values) category: const <OpportunitySummary>[],
    });
  }

  static List<OpportunitySummary> _parseBucket(
    OpportunityCategory category,
    dynamic data,
  ) {
    final items = (data is Map<String, dynamic> ? data['items'] : data) as List<dynamic>? ?? const [];
    return items
        .whereType<Map<String, dynamic>>()
        .map((item) => OpportunitySummary.fromJson(category, item))
        .toList(growable: false);
  }
}

class SearchPerson {
  const SearchPerson({
    required this.id,
    required this.firstName,
    required this.lastName,
    required this.email,
    required this.userType,
  });

  final String id;
  final String firstName;
  final String lastName;
  final String email;
  final String userType;

  String get displayName {
    final name = '$firstName $lastName'.trim();
    return name.isEmpty ? 'Gigvora member' : name;
  }

  factory SearchPerson.fromJson(Map<String, dynamic> json) {
    return SearchPerson(
      id: '${json['id']}',
      firstName: (json['firstName'] as String? ?? '').trim(),
      lastName: (json['lastName'] as String? ?? '').trim(),
      email: (json['email'] as String? ?? '').trim(),
      userType: (json['userType'] as String? ?? 'member').trim(),
    );
  }
}

class GlobalSearchResult {
  const GlobalSearchResult({
    required this.opportunities,
    required this.people,
  });

  final Map<OpportunityCategory, List<OpportunitySummary>> opportunities;
  final List<SearchPerson> people;

  List<OpportunitySummary> resultsFor(OpportunityCategory category) =>
      opportunities[category] ?? const <OpportunitySummary>[];

  factory GlobalSearchResult.fromJson(Map<String, dynamic> json) {
    return GlobalSearchResult(
      opportunities: {
        OpportunityCategory.job: _parseOpportunityList(OpportunityCategory.job, json['jobs']),
        OpportunityCategory.gig: _parseOpportunityList(OpportunityCategory.gig, json['gigs']),
        OpportunityCategory.project: _parseOpportunityList(OpportunityCategory.project, json['projects']),
        OpportunityCategory.launchpad: _parseOpportunityList(OpportunityCategory.launchpad, json['launchpads']),
        OpportunityCategory.volunteering:
            _parseOpportunityList(OpportunityCategory.volunteering, json['volunteering']),
      },
      people: (json['people'] as List<dynamic>? ?? const [])
          .whereType<Map<String, dynamic>>()
          .map(SearchPerson.fromJson)
          .toList(growable: false),
    );
  }

  factory GlobalSearchResult.empty() {
    return GlobalSearchResult(
      opportunities: {
        for (final category in OpportunityCategory.values) category: const <OpportunitySummary>[],
      },
      people: const <SearchPerson>[],
    );
  }

  static List<OpportunitySummary> _parseOpportunityList(
    OpportunityCategory category,
    dynamic raw,
  ) {
    final data = raw as List<dynamic>? ?? const [];
    return data
        .whereType<Map<String, dynamic>>()
        .map((item) => OpportunitySummary.fromJson(category, item))
        .toList(growable: false);
  }
}
