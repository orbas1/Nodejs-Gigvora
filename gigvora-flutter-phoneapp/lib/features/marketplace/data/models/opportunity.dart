import 'dart:collection';

enum OpportunityCategory {
  job,
  gig,
  project,
  launchpad,
  volunteering,
}

OpportunityCategory parseOpportunityCategory(String value) {
  switch (value) {
    case 'job':
    case 'jobs':
      return OpportunityCategory.job;
    case 'gig':
    case 'gigs':
      return OpportunityCategory.gig;
    case 'project':
    case 'projects':
      return OpportunityCategory.project;
    case 'launchpad':
    case 'launchpads':
      return OpportunityCategory.launchpad;
    case 'volunteering':
      return OpportunityCategory.volunteering;
    default:
      return OpportunityCategory.project;
  }
}

String categoryToPath(OpportunityCategory category) {
  switch (category) {
    case OpportunityCategory.job:
      return 'jobs';
    case OpportunityCategory.gig:
      return 'gigs';
    case OpportunityCategory.project:
      return 'projects';
    case OpportunityCategory.launchpad:
      return 'launchpads';
    case OpportunityCategory.volunteering:
      return 'volunteering';
  }
}

class OpportunityTaxonomyTag {
  const OpportunityTaxonomyTag({
    required this.slug,
    this.label,
    this.type,
    this.weight,
    this.source,
  });

  final String slug;
  final String? label;
  final String? type;
  final int? weight;
  final String? source;

  factory OpportunityTaxonomyTag.fromJson(Map<String, dynamic> json) {
    final slug = (json['slug'] as String? ?? '').trim();
    return OpportunityTaxonomyTag(
      slug: slug,
      label: (json['label'] as String?)?.trim(),
      type: (json['type'] as String?)?.trim(),
      weight: json['weight'] is num ? (json['weight'] as num).toInt() : null,
      source: (json['source'] as String?)?.trim(),
    );
  }
}

class OpportunitySummary {
  const OpportunitySummary({
    required this.id,
    required this.category,
    required this.title,
    required this.description,
    required this.updatedAt,
    this.location,
    this.employmentType,
    this.budget,
    this.duration,
    this.status,
    this.track,
    this.organization,
    this.isRemote = false,
    this.taxonomyLabels = const <String>[],
    this.taxonomySlugs = const <String>[],
    this.taxonomies = const <OpportunityTaxonomyTag>[],
  });

  final String id;
  final OpportunityCategory category;
  final String title;
  final String description;
  final DateTime updatedAt;
  final String? location;
  final String? employmentType;
  final String? budget;
  final String? duration;
  final String? status;
  final String? track;
  final String? organization;
  final bool isRemote;
  final List<String> taxonomyLabels;
  final List<String> taxonomySlugs;
  final List<OpportunityTaxonomyTag> taxonomies;

  factory OpportunitySummary.fromJson(OpportunityCategory category, Map<String, dynamic> json) {
    final rawTaxonomies = (json['taxonomies'] as List<dynamic>? ?? const <dynamic>[])
        .whereType<Map<String, dynamic>>()
        .map(OpportunityTaxonomyTag.fromJson)
        .where((tag) => tag.slug.isNotEmpty)
        .toList(growable: false);

    final labelSet = LinkedHashSet<String>()
      ..addAll((json['taxonomyLabels'] as List<dynamic>? ?? const <dynamic>[])
          .whereType<String>()
          .map((label) => label.trim())
          .where((label) => label.isNotEmpty))
      ..addAll(rawTaxonomies
          .map((tag) => tag.label)
          .whereType<String>()
          .map((label) => label.trim())
          .where((label) => label.isNotEmpty));

    final slugSet = LinkedHashSet<String>()
      ..addAll((json['taxonomySlugs'] as List<dynamic>? ?? const <dynamic>[])
          .whereType<String>()
          .map((slug) => slug.trim())
          .where((slug) => slug.isNotEmpty))
      ..addAll(rawTaxonomies.map((tag) => tag.slug).where((slug) => slug.isNotEmpty));

    return OpportunitySummary(
      id: '${json['id']}',
      category: category,
      title: (json['title'] as String? ?? '').trim(),
      description: (json['description'] as String? ?? '').trim(),
      updatedAt: DateTime.tryParse(json['updatedAt'] as String? ?? '') ?? DateTime.now(),
      location: json['location'] as String?,
      employmentType: json['employmentType'] as String?,
      budget: json['budget'] as String?,
      duration: json['duration'] as String?,
      status: json['status'] as String?,
      track: json['track'] as String?,
      organization: json['organization'] as String?,
      isRemote: json['isRemote'] == true,
      taxonomyLabels: List<String>.unmodifiable(labelSet),
      taxonomySlugs: List<String>.unmodifiable(slugSet),
      taxonomies: rawTaxonomies,
    );
  }
}

class OpportunityPage {
  const OpportunityPage({
    required this.category,
    required this.items,
    required this.page,
    required this.pageSize,
    required this.total,
    required this.totalPages,
    this.query,
    this.facets,
  });

  final OpportunityCategory category;
  final List<OpportunitySummary> items;
  final int page;
  final int pageSize;
  final int total;
  final int totalPages;
  final String? query;
  final Map<String, dynamic>? facets;

  OpportunityPage copyWith({
    List<OpportunitySummary>? items,
    int? page,
    int? pageSize,
    int? total,
    int? totalPages,
    String? query,
    Map<String, dynamic>? facets,
  }) {
    return OpportunityPage(
      category: category,
      items: items ?? this.items,
      page: page ?? this.page,
      pageSize: pageSize ?? this.pageSize,
      total: total ?? this.total,
      totalPages: totalPages ?? this.totalPages,
      query: query ?? this.query,
      facets: facets ?? this.facets,
    );
  }
}
