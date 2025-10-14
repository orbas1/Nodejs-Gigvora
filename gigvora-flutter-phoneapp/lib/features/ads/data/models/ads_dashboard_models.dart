import 'package:collection/collection.dart';

class AdDashboardSnapshot {
  const AdDashboardSnapshot({
    required this.overview,
    required this.surfaces,
    required this.recommendations,
    this.forecast,
    this.generatedAt,
  });

  final AdOverview overview;
  final List<AdSurfaceGroup> surfaces;
  final List<String> recommendations;
  final AdForecast? forecast;
  final DateTime? generatedAt;

  bool get isEmpty => overview.totalPlacements == 0 && surfaces.isEmpty;

  factory AdDashboardSnapshot.empty() {
    return AdDashboardSnapshot(
      overview: AdOverview.empty(),
      surfaces: const <AdSurfaceGroup>[],
      recommendations: const <String>[],
      forecast: null,
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
      forecast: json['forecast'] is Map<String, dynamic>
          ? AdForecast.fromJson(Map<String, dynamic>.from(json['forecast'] as Map))
          : null,
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

class AdForecast {
  const AdForecast({
    required this.summary,
    required this.scenarios,
    required this.traffic,
    required this.assumptions,
    required this.safetyChecks,
    this.generatedAt,
  });

  final AdForecastSummary summary;
  final List<AdForecastScenario> scenarios;
  final AdForecastTraffic traffic;
  final List<String> assumptions;
  final List<AdForecastSafetyCheck> safetyChecks;
  final DateTime? generatedAt;

  factory AdForecast.fromJson(Map<String, dynamic> json) {
    return AdForecast(
      summary: json['summary'] is Map<String, dynamic>
          ? AdForecastSummary.fromJson(Map<String, dynamic>.from(json['summary'] as Map))
          : AdForecastSummary.empty(),
      scenarios: (json['scenarios'] as List?)
              ?.map((item) => AdForecastScenario.fromJson(Map<String, dynamic>.from(item as Map)))
              .toList(growable: false) ??
          const <AdForecastScenario>[],
      traffic: json['traffic'] is Map<String, dynamic>
          ? AdForecastTraffic.fromJson(Map<String, dynamic>.from(json['traffic'] as Map))
          : AdForecastTraffic.empty(),
      assumptions: (json['assumptions'] as List?)
              ?.whereType<String>()
              .map((value) => value.trim())
              .where((value) => value.isNotEmpty)
              .toList(growable: false) ??
          const <String>[],
      safetyChecks: (json['safetyChecks'] as List?)
              ?.map((item) => AdForecastSafetyCheck.fromJson(Map<String, dynamic>.from(item as Map)))
              .toList(growable: false) ??
          const <AdForecastSafetyCheck>[],
      generatedAt: json['generatedAt'] != null ? DateTime.tryParse('${json['generatedAt']}') : null,
    );
  }
}

class AdForecastSummary {
  const AdForecastSummary({
    required this.horizonDays,
    required this.projectedSessions,
    required this.expectedImpressions,
    required this.expectedClicks,
    required this.expectedLeads,
    required this.expectedSpend,
    required this.expectedRevenue,
    required this.projectedRoi,
    required this.coverageScore,
    required this.activePlacementRatio,
    required this.couponCoverage,
    required this.averageScore,
    required this.ctr,
    required this.conversionRate,
    required this.creativeVariants,
  });

  final int horizonDays;
  final int projectedSessions;
  final int expectedImpressions;
  final int expectedClicks;
  final int expectedLeads;
  final double expectedSpend;
  final double expectedRevenue;
  final double? projectedRoi;
  final double coverageScore;
  final double activePlacementRatio;
  final double couponCoverage;
  final double averageScore;
  final double ctr;
  final double conversionRate;
  final int creativeVariants;

  factory AdForecastSummary.empty() {
    return const AdForecastSummary(
      horizonDays: 0,
      projectedSessions: 0,
      expectedImpressions: 0,
      expectedClicks: 0,
      expectedLeads: 0,
      expectedSpend: 0,
      expectedRevenue: 0,
      projectedRoi: null,
      coverageScore: 0,
      activePlacementRatio: 0,
      couponCoverage: 0,
      averageScore: 0,
      ctr: 0,
      conversionRate: 0,
      creativeVariants: 0,
    );
  }

  factory AdForecastSummary.fromJson(Map<String, dynamic> json) {
    return AdForecastSummary(
      horizonDays: json['horizonDays'] is num ? (json['horizonDays'] as num).round() : 0,
      projectedSessions: json['projectedSessions'] is num ? (json['projectedSessions'] as num).round() : 0,
      expectedImpressions: json['expectedImpressions'] is num ? (json['expectedImpressions'] as num).round() : 0,
      expectedClicks: json['expectedClicks'] is num ? (json['expectedClicks'] as num).round() : 0,
      expectedLeads: json['expectedLeads'] is num ? (json['expectedLeads'] as num).round() : 0,
      expectedSpend: json['expectedSpend'] is num ? (json['expectedSpend'] as num).toDouble() : 0,
      expectedRevenue: json['expectedRevenue'] is num ? (json['expectedRevenue'] as num).toDouble() : 0,
      projectedRoi: json['projectedRoi'] is num ? (json['projectedRoi'] as num).toDouble() : null,
      coverageScore: json['coverageScore'] is num ? (json['coverageScore'] as num).toDouble() : 0,
      activePlacementRatio:
          json['activePlacementRatio'] is num ? (json['activePlacementRatio'] as num).toDouble() : 0,
      couponCoverage: json['couponCoverage'] is num ? (json['couponCoverage'] as num).toDouble() : 0,
      averageScore: json['averageScore'] is num ? (json['averageScore'] as num).toDouble() : 0,
      ctr: json['ctr'] is num ? (json['ctr'] as num).toDouble() : 0,
      conversionRate: json['conversionRate'] is num ? (json['conversionRate'] as num).toDouble() : 0,
      creativeVariants: json['creativeVariants'] is num ? (json['creativeVariants'] as num).round() : 0,
    );
  }
}

class AdForecastScenario {
  const AdForecastScenario({
    required this.label,
    required this.confidence,
    required this.impressions,
    required this.clicks,
    required this.leads,
    required this.spend,
    required this.revenue,
    this.roi,
  });

  final String label;
  final double confidence;
  final int impressions;
  final int clicks;
  final int leads;
  final double spend;
  final double revenue;
  final double? roi;

  factory AdForecastScenario.fromJson(Map<String, dynamic> json) {
    return AdForecastScenario(
      label: (json['label'] as String?)?.trim() ?? 'Scenario',
      confidence: json['confidence'] is num ? (json['confidence'] as num).toDouble() : 0,
      impressions: json['impressions'] is num ? (json['impressions'] as num).round() : 0,
      clicks: json['clicks'] is num ? (json['clicks'] as num).round() : 0,
      leads: json['leads'] is num ? (json['leads'] as num).round() : 0,
      spend: json['spend'] is num ? (json['spend'] as num).toDouble() : 0,
      revenue: json['revenue'] is num ? (json['revenue'] as num).toDouble() : 0,
      roi: json['roi'] is num ? (json['roi'] as num).toDouble() : null,
    );
  }
}

class AdForecastTraffic {
  const AdForecastTraffic({
    required this.averageDailySessions,
    required this.growthRate,
    required this.returningVisitorRate,
    required this.mobileShare,
    required this.conversionRate,
    required this.ctrBaseline,
    required this.spendPerClick,
    required this.revenuePerLead,
    required this.sourceBreakdown,
    required this.trend,
    required this.lookbackDays,
    required this.usesFallback,
  });

  final int averageDailySessions;
  final double growthRate;
  final double returningVisitorRate;
  final double mobileShare;
  final double conversionRate;
  final double ctrBaseline;
  final double spendPerClick;
  final double revenuePerLead;
  final List<AdForecastTrafficSource> sourceBreakdown;
  final List<AdForecastTrendPoint> trend;
  final int lookbackDays;
  final bool usesFallback;

  factory AdForecastTraffic.empty() {
    return const AdForecastTraffic(
      averageDailySessions: 0,
      growthRate: 0,
      returningVisitorRate: 0,
      mobileShare: 0,
      conversionRate: 0,
      ctrBaseline: 0,
      spendPerClick: 0,
      revenuePerLead: 0,
      sourceBreakdown: <AdForecastTrafficSource>[],
      trend: <AdForecastTrendPoint>[],
      lookbackDays: 0,
      usesFallback: false,
    );
  }

  factory AdForecastTraffic.fromJson(Map<String, dynamic> json) {
    return AdForecastTraffic(
      averageDailySessions:
          json['averageDailySessions'] is num ? (json['averageDailySessions'] as num).round() : 0,
      growthRate: json['growthRate'] is num ? (json['growthRate'] as num).toDouble() : 0,
      returningVisitorRate:
          json['returningVisitorRate'] is num ? (json['returningVisitorRate'] as num).toDouble() : 0,
      mobileShare: json['mobileShare'] is num ? (json['mobileShare'] as num).toDouble() : 0,
      conversionRate: json['conversionRate'] is num ? (json['conversionRate'] as num).toDouble() : 0,
      ctrBaseline: json['ctrBaseline'] is num ? (json['ctrBaseline'] as num).toDouble() : 0,
      spendPerClick: json['spendPerClick'] is num ? (json['spendPerClick'] as num).toDouble() : 0,
      revenuePerLead: json['revenuePerLead'] is num ? (json['revenuePerLead'] as num).toDouble() : 0,
      sourceBreakdown: (json['sourceBreakdown'] as List?)
              ?.map((item) => AdForecastTrafficSource.fromJson(Map<String, dynamic>.from(item as Map)))
              .toList(growable: false) ??
          const <AdForecastTrafficSource>[],
      trend: (json['trend'] as List?)
              ?.map((item) => AdForecastTrendPoint.fromJson(Map<String, dynamic>.from(item as Map)))
              .toList(growable: false) ??
          const <AdForecastTrendPoint>[],
      lookbackDays: json['lookbackDays'] is num ? (json['lookbackDays'] as num).round() : 0,
      usesFallback: json['usesFallback'] == true,
    );
  }
}

class AdForecastTrafficSource {
  const AdForecastTrafficSource({
    required this.source,
    required this.share,
  });

  final String source;
  final double share;

  factory AdForecastTrafficSource.fromJson(Map<String, dynamic> json) {
    return AdForecastTrafficSource(
      source: (json['source'] as String?)?.trim() ?? 'other',
      share: json['share'] is num ? (json['share'] as num).toDouble() : 0,
    );
  }
}

class AdForecastTrendPoint {
  const AdForecastTrendPoint({
    required this.date,
    required this.sessions,
  });

  final DateTime? date;
  final int sessions;

  factory AdForecastTrendPoint.fromJson(Map<String, dynamic> json) {
    return AdForecastTrendPoint(
      date: json['date'] != null ? DateTime.tryParse('${json['date']}') : null,
      sessions: json['sessions'] is num ? (json['sessions'] as num).round() : 0,
    );
  }
}

class AdForecastSafetyCheck {
  const AdForecastSafetyCheck({
    required this.level,
    required this.message,
    required this.suggestion,
  });

  final String level;
  final String message;
  final String suggestion;

  factory AdForecastSafetyCheck.fromJson(Map<String, dynamic> json) {
    return AdForecastSafetyCheck(
      level: (json['level'] as String?)?.trim() ?? 'info',
      message: (json['message'] as String?)?.trim() ?? '',
      suggestion: (json['suggestion'] as String?)?.trim() ?? '',
    );
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
