import 'dart:collection';

enum OpportunityCategory {
  job,
  gig,
  project,
  launchpad,
  volunteering,
}

OpportunityCategory parseOpportunityCategory(String value) {
  switch (value.toLowerCase()) {
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
    if (slug.isEmpty) {
      throw ArgumentError('taxonomy slug is required');
    }
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

  OpportunitySummary copyWith({
    String? title,
    String? description,
    DateTime? updatedAt,
    String? location,
    String? employmentType,
    String? budget,
    String? duration,
    String? status,
    String? track,
    String? organization,
    bool? isRemote,
    List<String>? taxonomyLabels,
    List<String>? taxonomySlugs,
    List<OpportunityTaxonomyTag>? taxonomies,
  }) {
    return OpportunitySummary(
      id: id,
      category: category,
      title: title ?? this.title,
      description: description ?? this.description,
      updatedAt: updatedAt ?? this.updatedAt,
      location: location ?? this.location,
      employmentType: employmentType ?? this.employmentType,
      budget: budget ?? this.budget,
      duration: duration ?? this.duration,
      status: status ?? this.status,
      track: track ?? this.track,
      organization: organization ?? this.organization,
      isRemote: isRemote ?? this.isRemote,
      taxonomyLabels: taxonomyLabels ?? this.taxonomyLabels,
      taxonomySlugs: taxonomySlugs ?? this.taxonomySlugs,
      taxonomies: taxonomies ?? this.taxonomies,
    );
  }

  factory OpportunitySummary.fromJson(
    OpportunityCategory category,
    Map<String, dynamic> json,
  ) {
    String? normaliseString(String? value) {
      final trimmed = value?.trim();
      if (trimmed == null || trimmed.isEmpty) {
        return null;
      }
      return trimmed;
    }

    final rawTaxonomies = (json['taxonomies'] as List<dynamic>? ?? const <dynamic>[])
        .whereType<Map<String, dynamic>>()
        .map((entry) {
      try {
        return OpportunityTaxonomyTag.fromJson(entry);
      } catch (_) {
        return null;
      }
    }).whereType<OpportunityTaxonomyTag>().toList(growable: false);

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

    final updatedAt = () {
      final raw = json['updatedAt'];
      if (raw is String) {
        final parsed = DateTime.tryParse(raw);
        if (parsed != null) {
          return parsed;
        }
      }
      if (raw is int) {
        return DateTime.fromMillisecondsSinceEpoch(raw);
      }
      return DateTime.now();
    }();

    return OpportunitySummary(
      id: '${json['id']}',
      category: category,
      title: (json['title'] as String? ?? '').trim(),
      description: (json['description'] as String? ?? '').trim(),
      updatedAt: updatedAt,
      location: normaliseString(json['location'] as String?),
      employmentType: normaliseString(json['employmentType'] as String?),
      budget: normaliseString(json['budget'] as String?),
      duration: normaliseString(json['duration'] as String?),
      status: normaliseString(json['status'] as String?),
      track: normaliseString(json['track'] as String?),
      organization: normaliseString(json['organization'] as String?),
      isRemote: json['isRemote'] == true,
      taxonomyLabels: List<String>.unmodifiable(labelSet),
      taxonomySlugs: List<String>.unmodifiable(slugSet),
      taxonomies: List<OpportunityTaxonomyTag>.unmodifiable(rawTaxonomies),
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

  factory OpportunityPage.fromJson(
    OpportunityCategory category,
    Map<String, dynamic> json,
  ) {
    final items = (json['items'] as List<dynamic>? ?? const <dynamic>[])
        .whereType<Map<String, dynamic>>()
        .map((entry) => OpportunitySummary.fromJson(category, entry))
        .toList(growable: false);

    return OpportunityPage(
      category: category,
      items: items,
      page: (json['page'] as num?)?.toInt() ?? 1,
      pageSize: (json['pageSize'] as num?)?.toInt() ?? items.length,
      total: (json['total'] as num?)?.toInt() ?? items.length,
      totalPages: (json['totalPages'] as num?)?.toInt() ?? 1,
      query: (json['query'] as String?)?.trim(),
      facets: json['facets'] is Map<String, dynamic>
          ? Map<String, dynamic>.from(json['facets'] as Map<String, dynamic>)
          : null,
    );
  }
}
