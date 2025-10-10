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

  factory OpportunitySummary.fromJson(OpportunityCategory category, Map<String, dynamic> json) {
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
  });

  final OpportunityCategory category;
  final List<OpportunitySummary> items;
  final int page;
  final int pageSize;
  final int total;
  final int totalPages;
  final String? query;

  OpportunityPage copyWith({
    List<OpportunitySummary>? items,
    int? page,
    int? pageSize,
    int? total,
    int? totalPages,
    String? query,
  }) {
    return OpportunityPage(
      category: category,
      items: items ?? this.items,
      page: page ?? this.page,
      pageSize: pageSize ?? this.pageSize,
      total: total ?? this.total,
      totalPages: totalPages ?? this.totalPages,
      query: query ?? this.query,
    );
  }
}
