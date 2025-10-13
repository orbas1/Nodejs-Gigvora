import 'package:collection/collection.dart';

class AdDashboardSnapshot {
  const AdDashboardSnapshot({
    required this.overview,
    required this.surfaces,
    required this.recommendations,
    this.generatedAt,
  });

  final AdOverview overview;
  final List<AdSurfaceGroup> surfaces;
  final List<String> recommendations;
  final DateTime? generatedAt;

  bool get isEmpty => overview.totalPlacements == 0 && surfaces.isEmpty;

  factory AdDashboardSnapshot.empty() {
    return AdDashboardSnapshot(
      overview: AdOverview.empty(),
      surfaces: const <AdSurfaceGroup>[],
      recommendations: const <String>[],
      generatedAt: null,
    );
  }

  factory AdDashboardSnapshot.fromJson(Map<String, dynamic> json) {
    final surfaces = (json['surfaces'] as List?)
            ?.map((item) => AdSurfaceGroup.fromJson(Map<String, dynamic>.from(item as Map)))
            .toList(growable: false) ??
        const <AdSurfaceGroup>[];

    return AdDashboardSnapshot(
      overview: json['overview'] is Map<String, dynamic>
          ? AdOverview.fromJson(Map<String, dynamic>.from(json['overview'] as Map))
          : AdOverview.empty(),
      surfaces: surfaces,
      recommendations: (json['recommendations'] as List?)
              ?.whereType<String>()
              .map((value) => value.trim())
              .where((value) => value.isNotEmpty)
              .toList(growable: false) ??
          const <String>[],
      generatedAt: json['generatedAt'] != null ? DateTime.tryParse('${json['generatedAt']}') : null,
    );
  }
}

class AdOverview {
  const AdOverview({
    required this.totalPlacements,
    required this.activePlacements,
    required this.upcomingPlacements,
    required this.totalCampaigns,
    required this.surfaces,
    required this.keywordHighlights,
    required this.taxonomyHighlights,
    required this.context,
  });

  final int totalPlacements;
  final int activePlacements;
  final int upcomingPlacements;
  final int totalCampaigns;
  final List<AdSurfaceSummary> surfaces;
  final List<AdKeywordHighlight> keywordHighlights;
  final List<AdTaxonomyHighlight> taxonomyHighlights;
  final AdTargetingContext context;

  factory AdOverview.empty() {
    return AdOverview(
      totalPlacements: 0,
      activePlacements: 0,
      upcomingPlacements: 0,
      totalCampaigns: 0,
      surfaces: const <AdSurfaceSummary>[],
      keywordHighlights: const <AdKeywordHighlight>[],
      taxonomyHighlights: const <AdTaxonomyHighlight>[],
      context: const AdTargetingContext(keywordHints: <String>[], taxonomySlugs: <String>[]),
    );
  }

  factory AdOverview.fromJson(Map<String, dynamic> json) {
    return AdOverview(
      totalPlacements: json['totalPlacements'] is num ? (json['totalPlacements'] as num).round() : 0,
      activePlacements: json['activePlacements'] is num ? (json['activePlacements'] as num).round() : 0,
      upcomingPlacements: json['upcomingPlacements'] is num ? (json['upcomingPlacements'] as num).round() : 0,
      totalCampaigns: json['totalCampaigns'] is num ? (json['totalCampaigns'] as num).round() : 0,
      surfaces: (json['surfaces'] as List?)
              ?.map((item) => AdSurfaceSummary.fromJson(Map<String, dynamic>.from(item as Map)))
              .toList(growable: false) ??
          const <AdSurfaceSummary>[],
      keywordHighlights: (json['keywordHighlights'] as List?)
              ?.map((item) => AdKeywordHighlight.fromJson(Map<String, dynamic>.from(item as Map)))
              .toList(growable: false) ??
          const <AdKeywordHighlight>[],
      taxonomyHighlights: (json['taxonomyHighlights'] as List?)
              ?.map((item) => AdTaxonomyHighlight.fromJson(Map<String, dynamic>.from(item as Map)))
              .toList(growable: false) ??
          const <AdTaxonomyHighlight>[],
      context: json['context'] is Map<String, dynamic>
          ? AdTargetingContext.fromJson(Map<String, dynamic>.from(json['context'] as Map))
          : const AdTargetingContext(keywordHints: <String>[], taxonomySlugs: <String>[]),
    );
  }
}

class AdSurfaceSummary {
  const AdSurfaceSummary({
    required this.surface,
    required this.label,
    required this.totalPlacements,
    required this.activePlacements,
    required this.upcomingPlacements,
    required this.typeBreakdown,
  });

  final String surface;
  final String label;
  final int totalPlacements;
  final int activePlacements;
  final int upcomingPlacements;
  final Map<String, int> typeBreakdown;

  factory AdSurfaceSummary.fromJson(Map<String, dynamic> json) {
    final typeBreakdown = <String, int>{};
    if (json['typeBreakdown'] is Map) {
      Map<String, dynamic>.from(json['typeBreakdown'] as Map).forEach((key, value) {
        if (value is num) {
          typeBreakdown[key] = value.round();
        }
      });
    }
    return AdSurfaceSummary(
      surface: '${json['surface'] ?? ''}',
      label: (json['label'] as String?)?.trim() ?? '${json['surface'] ?? ''}',
      totalPlacements: json['totalPlacements'] is num ? (json['totalPlacements'] as num).round() : 0,
      activePlacements: json['activePlacements'] is num ? (json['activePlacements'] as num).round() : 0,
      upcomingPlacements: json['upcomingPlacements'] is num ? (json['upcomingPlacements'] as num).round() : 0,
      typeBreakdown: typeBreakdown,
    );
  }
}

class AdKeywordHighlight {
  const AdKeywordHighlight({required this.keyword, required this.weight});

  final String keyword;
  final int weight;

  factory AdKeywordHighlight.fromJson(Map<String, dynamic> json) {
    return AdKeywordHighlight(
      keyword: (json['keyword'] as String?)?.trim() ?? '',
      weight: json['weight'] is num ? (json['weight'] as num).round() : 0,
    );
  }
}

class AdTaxonomyHighlight {
  const AdTaxonomyHighlight({required this.slug, required this.weight});

  final String slug;
  final int weight;

  factory AdTaxonomyHighlight.fromJson(Map<String, dynamic> json) {
    return AdTaxonomyHighlight(
      slug: (json['slug'] as String?)?.trim() ?? '',
      weight: json['weight'] is num ? (json['weight'] as num).round() : 0,
    );
  }
}

class AdTargetingContext {
  const AdTargetingContext({
    required this.keywordHints,
    required this.taxonomySlugs,
  });

  final List<String> keywordHints;
  final List<String> taxonomySlugs;

  factory AdTargetingContext.fromJson(Map<String, dynamic> json) {
    return AdTargetingContext(
      keywordHints: (json['keywordHints'] as List?)
              ?.whereType<String>()
              .map((value) => value.trim())
              .where((value) => value.isNotEmpty)
              .toList(growable: false) ??
          const <String>[],
      taxonomySlugs: (json['taxonomySlugs'] as List?)
              ?.whereType<String>()
              .map((value) => value.trim())
              .where((value) => value.isNotEmpty)
              .toList(growable: false) ??
          const <String>[],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'keywordHints': keywordHints,
      'taxonomySlugs': taxonomySlugs,
    };
  }
}

class AdSurfaceGroup {
  const AdSurfaceGroup({
    required this.surface,
    required this.label,
    required this.placements,
    required this.totalPlacements,
    required this.upcomingPlacements,
  });

  final String surface;
  final String label;
  final List<AdPlacement> placements;
  final int totalPlacements;
  final int upcomingPlacements;

  factory AdSurfaceGroup.fromJson(Map<String, dynamic> json) {
    return AdSurfaceGroup(
      surface: '${json['surface'] ?? ''}',
      label: (json['label'] as String?)?.trim() ?? '${json['surface'] ?? ''}',
      placements: (json['placements'] as List?)
              ?.map((item) => AdPlacement.fromJson(Map<String, dynamic>.from(item as Map)))
              .toList(growable: false) ??
          const <AdPlacement>[],
      totalPlacements: json['totalPlacements'] is num ? (json['totalPlacements'] as num).round() : 0,
      upcomingPlacements: json['upcomingPlacements'] is num ? (json['upcomingPlacements'] as num).round() : 0,
    );
  }
}

class AdPlacement {
  const AdPlacement({
    required this.id,
    required this.surface,
    required this.status,
    required this.score,
    required this.isActive,
    required this.isUpcoming,
    this.opportunityType,
    this.priority,
    this.timeUntilStartMinutes,
    this.timeUntilEndMinutes,
    this.creative,
    required this.keywords,
    required this.taxonomies,
  });

  final int id;
  final String surface;
  final String status;
  final double score;
  final bool isActive;
  final bool isUpcoming;
  final String? opportunityType;
  final int? priority;
  final int? timeUntilStartMinutes;
  final int? timeUntilEndMinutes;
  final AdCreative? creative;
  final List<AdKeywordAssignment> keywords;
  final List<AdTaxonomyAssignment> taxonomies;

  factory AdPlacement.fromJson(Map<String, dynamic> json) {
    return AdPlacement(
      id: json['id'] is num ? (json['id'] as num).round() : 0,
      surface: '${json['surface'] ?? ''}',
      status: (json['status'] as String?)?.trim() ?? 'unknown',
      score: json['score'] is num ? (json['score'] as num).toDouble() : 0,
      isActive: json['isActive'] == true,
      isUpcoming: json['isUpcoming'] == true,
      opportunityType: (json['opportunityType'] as String?)?.trim(),
      priority: json['priority'] is num ? (json['priority'] as num).round() : null,
      timeUntilStartMinutes:
          json['timeUntilStartMinutes'] is num ? (json['timeUntilStartMinutes'] as num).round() : null,
      timeUntilEndMinutes: json['timeUntilEndMinutes'] is num ? (json['timeUntilEndMinutes'] as num).round() : null,
      creative: json['creative'] is Map<String, dynamic>
          ? AdCreative.fromJson(Map<String, dynamic>.from(json['creative'] as Map))
          : null,
      keywords: (json['keywords'] as List?)
              ?.map((item) => AdKeywordAssignment.fromJson(Map<String, dynamic>.from(item as Map)))
              .whereNotNull()
              .toList(growable: false) ??
          const <AdKeywordAssignment>[],
      taxonomies: (json['taxonomies'] as List?)
              ?.map((item) => AdTaxonomyAssignment.fromJson(Map<String, dynamic>.from(item as Map)))
              .whereNotNull()
              .toList(growable: false) ??
          const <AdTaxonomyAssignment>[],
    );
  }
}

class AdCreative {
  const AdCreative({
    required this.id,
    required this.name,
    this.type,
    this.format,
    this.status,
    this.headline,
    this.subheadline,
    this.body,
    this.callToAction,
    this.campaign,
  });

  final int id;
  final String name;
  final String? type;
  final String? format;
  final String? status;
  final String? headline;
  final String? subheadline;
  final String? body;
  final String? callToAction;
  final AdCampaign? campaign;

  factory AdCreative.fromJson(Map<String, dynamic> json) {
    return AdCreative(
      id: json['id'] is num ? (json['id'] as num).round() : 0,
      name: (json['name'] as String?)?.trim() ?? 'Creative',
      type: (json['type'] as String?)?.trim(),
      format: (json['format'] as String?)?.trim(),
      status: (json['status'] as String?)?.trim(),
      headline: (json['headline'] as String?)?.trim(),
      subheadline: (json['subheadline'] as String?)?.trim(),
      body: (json['body'] as String?)?.trim(),
      callToAction: (json['callToAction'] as String?)?.trim(),
      campaign: json['campaign'] is Map<String, dynamic>
          ? AdCampaign.fromJson(Map<String, dynamic>.from(json['campaign'] as Map))
          : null,
    );
  }
}

class AdCampaign {
  const AdCampaign({required this.id, required this.name, this.objective, this.status});

  final int id;
  final String name;
  final String? objective;
  final String? status;

  factory AdCampaign.fromJson(Map<String, dynamic> json) {
    return AdCampaign(
      id: json['id'] is num ? (json['id'] as num).round() : 0,
      name: (json['name'] as String?)?.trim() ?? 'Campaign',
      objective: (json['objective'] as String?)?.trim(),
      status: (json['status'] as String?)?.trim(),
    );
  }
}

class AdKeywordAssignment {
  const AdKeywordAssignment({required this.id, required this.keyword, required this.weight});

  final int id;
  final String keyword;
  final int weight;

  factory AdKeywordAssignment.fromJson(Map<String, dynamic> json) {
    final keyword = (json['keyword'] as Map?) != null
        ? (json['keyword'] as Map)['keyword']
        : json['keyword'];
    if (keyword is! String) {
      return const AdKeywordAssignment(id: 0, keyword: '', weight: 0);
    }
    return AdKeywordAssignment(
      id: json['id'] is num ? (json['id'] as num).round() : 0,
      keyword: keyword.trim(),
      weight: json['weight'] is num ? (json['weight'] as num).round() : 0,
    );
  }
}

class AdTaxonomyAssignment {
  const AdTaxonomyAssignment({required this.id, required this.slug, required this.weight});

  final int id;
  final String slug;
  final int weight;

  factory AdTaxonomyAssignment.fromJson(Map<String, dynamic> json) {
    final taxonomy = json['taxonomy'];
    String? slug;
    if (taxonomy is Map && taxonomy['slug'] is String) {
      slug = (taxonomy['slug'] as String).trim();
    } else if (taxonomy is String) {
      slug = taxonomy.trim();
    }

    if (slug == null || slug.isEmpty) {
      return const AdTaxonomyAssignment(id: 0, slug: '', weight: 0);
    }

    return AdTaxonomyAssignment(
      id: json['id'] is num ? (json['id'] as num).round() : 0,
      slug: slug,
      weight: json['weight'] is num ? (json['weight'] as num).round() : 0,
    );
  }
}
