import 'package:collection/collection.dart';

class ReputationOverview {
  const ReputationOverview({
    this.freelancer,
    required this.summary,
    required this.metrics,
    this.featuredTestimonial,
    this.recentTestimonials = const <ReputationTestimonial>[],
    this.featuredStory,
    this.stories = const <ReputationSuccessStory>[],
    this.promotedBadges = const <ReputationBadge>[],
    this.badges = const <ReputationBadge>[],
    this.reviewWidgets = const <ReputationWidget>[],
    this.automationPlaybooks = const <String>[],
    this.integrationTouchpoints = const <String>[],
    this.shareableLinks = const <ReputationShareableLink>[],
  });

  final ReputationFreelancer? freelancer;
  final ReputationSummary summary;
  final List<ReputationMetric> metrics;
  final ReputationTestimonial? featuredTestimonial;
  final List<ReputationTestimonial> recentTestimonials;
  final ReputationSuccessStory? featuredStory;
  final List<ReputationSuccessStory> stories;
  final List<ReputationBadge> promotedBadges;
  final List<ReputationBadge> badges;
  final List<ReputationWidget> reviewWidgets;
  final List<String> automationPlaybooks;
  final List<String> integrationTouchpoints;
  final List<ReputationShareableLink> shareableLinks;

  factory ReputationOverview.fromJson(Map<String, dynamic> json) {
    final metrics = (json['metrics'] as List<dynamic>? ?? const [])
        .whereType<Map>()
        .map((item) => ReputationMetric.fromJson(Map<String, dynamic>.from(item)))
        .toList(growable: false);

    final testimonialsRaw = json['testimonials'] as Map?;
    final featuredTestimonial = testimonialsRaw is Map
        ? ReputationTestimonial.tryParse(testimonialsRaw['featured'])
        : null;
    final recentTestimonials = testimonialsRaw is Map
        ? (testimonialsRaw['recent'] as List<dynamic>? ?? const [])
            .whereType<Map>()
            .map(
              (item) => ReputationTestimonial.fromJson(
                Map<String, dynamic>.from(item),
              ),
            )
            .toList(growable: false)
        : const <ReputationTestimonial>[];

    final storiesRaw = json['successStories'] as Map?;
    final featuredStory = storiesRaw is Map
        ? ReputationSuccessStory.tryParse(storiesRaw['featured'])
        : null;
    final storyCollection = storiesRaw is Map
        ? (storiesRaw['collection'] as List<dynamic>? ?? const [])
            .whereType<Map>()
            .map(
              (item) => ReputationSuccessStory.fromJson(
                Map<String, dynamic>.from(item),
              ),
            )
            .toList(growable: false)
        : const <ReputationSuccessStory>[];

    final badgeRaw = json['badges'] as Map?;
    final promotedBadges = badgeRaw is Map
        ? (badgeRaw['promoted'] as List<dynamic>? ?? const [])
            .whereType<Map>()
            .map(
              (item) => ReputationBadge.fromJson(
                Map<String, dynamic>.from(item),
              ),
            )
            .toList(growable: false)
        : const <ReputationBadge>[];
    final badgeCollection = badgeRaw is Map
        ? (badgeRaw['collection'] as List<dynamic>? ?? const [])
            .whereType<Map>()
            .map(
              (item) => ReputationBadge.fromJson(
                Map<String, dynamic>.from(item),
              ),
            )
            .toList(growable: false)
        : const <ReputationBadge>[];

    final widgets = (json['reviewWidgets'] as List<dynamic>? ?? const [])
        .whereType<Map>()
        .map((item) => ReputationWidget.fromJson(Map<String, dynamic>.from(item)))
        .toList(growable: false);

    final automation = (json['automationPlaybooks'] as List<dynamic>? ?? const [])
        .whereType<String>()
        .map((value) => value.trim())
        .where((value) => value.isNotEmpty)
        .toList(growable: false);

    final integration = (json['integrationTouchpoints'] as List<dynamic>? ?? const [])
        .whereType<String>()
        .map((value) => value.trim())
        .where((value) => value.isNotEmpty)
        .toList(growable: false);

    final links = (json['shareableLinks'] as List<dynamic>? ?? const [])
        .whereType<Map>()
        .map((item) => ReputationShareableLink.tryParse(item))
        .whereNotNull()
        .toList(growable: false);

    return ReputationOverview(
      freelancer: json['freelancer'] is Map<String, dynamic>
          ? ReputationFreelancer.fromJson(
              Map<String, dynamic>.from(json['freelancer'] as Map),
            )
          : null,
      summary: ReputationSummary.fromJson(
        Map<String, dynamic>.from(json['summary'] as Map? ?? const {}),
      ),
      metrics: metrics,
      featuredTestimonial: featuredTestimonial,
      recentTestimonials: recentTestimonials,
      featuredStory: featuredStory,
      stories: storyCollection,
      promotedBadges: promotedBadges,
      badges: badgeCollection,
      reviewWidgets: widgets,
      automationPlaybooks: automation,
      integrationTouchpoints: integration,
      shareableLinks: links,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      if (freelancer != null) 'freelancer': freelancer!.toJson(),
      'summary': summary.toJson(),
      'metrics': metrics.map((metric) => metric.toJson()).toList(),
      'testimonials': {
        'featured': featuredTestimonial?.toJson(),
        'recent': recentTestimonials.map((item) => item.toJson()).toList(),
      },
      'successStories': {
        'featured': featuredStory?.toJson(),
        'collection': stories.map((story) => story.toJson()).toList(),
      },
      'badges': {
        'promoted': promotedBadges.map((badge) => badge.toJson()).toList(),
        'collection': badges.map((badge) => badge.toJson()).toList(),
      },
      'reviewWidgets': reviewWidgets.map((widget) => widget.toJson()).toList(),
      'automationPlaybooks': automationPlaybooks,
      'integrationTouchpoints': integrationTouchpoints,
      'shareableLinks': shareableLinks.map((link) => link.toJson()).toList(),
    };
  }
}

class ReputationFreelancer {
  const ReputationFreelancer({
    required this.id,
    required this.name,
    required this.title,
    required this.initials,
    this.location,
    this.timezone,
    this.trustScore,
  });

  final String id;
  final String name;
  final String title;
  final String initials;
  final String? location;
  final String? timezone;
  final double? trustScore;

  factory ReputationFreelancer.fromJson(Map<String, dynamic> json) {
    final stats = json['stats'] as Map?;
    return ReputationFreelancer(
      id: '${json['id'] ?? ''}',
      name: (json['name'] as String? ?? '').trim(),
      title: (json['title'] as String? ?? '').trim(),
      initials: (json['initials'] as String? ?? '').trim(),
      location: (json['location'] as String?)?.trim(),
      timezone: (json['timezone'] as String?)?.trim(),
      trustScore: stats is Map && stats['trustScore'] != null
          ? double.tryParse('${stats['trustScore']}')
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'title': title,
      'initials': initials,
      if (location != null) 'location': location,
      if (timezone != null) 'timezone': timezone,
      'stats': {
        if (trustScore != null) 'trustScore': trustScore,
      },
    };
  }
}

class ReputationSummary {
  const ReputationSummary({
    required this.totals,
    required this.performance,
    this.lastVerifiedAt,
  });

  final ReputationSummaryTotals totals;
  final ReputationSummaryPerformance performance;
  final DateTime? lastVerifiedAt;

  factory ReputationSummary.fromJson(Map<String, dynamic> json) {
    final totals = json['totals'] as Map? ?? const {};
    final performance = json['performance'] as Map? ?? const {};
    final lastVerified = json['lastVerifiedAt'];
    return ReputationSummary(
      totals: ReputationSummaryTotals.fromJson(
        Map<String, dynamic>.from(totals),
      ),
      performance: ReputationSummaryPerformance.fromJson(
        Map<String, dynamic>.from(performance),
      ),
      lastVerifiedAt: lastVerified == null || '$lastVerified'.isEmpty
          ? null
          : DateTime.tryParse('$lastVerified'),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'totals': totals.toJson(),
      'performance': performance.toJson(),
      'lastVerifiedAt': lastVerifiedAt?.toIso8601String(),
    };
  }
}

class ReputationSummaryTotals {
  const ReputationSummaryTotals({
    required this.testimonials,
    required this.publishedStories,
    required this.badges,
    required this.activeWidgets,
  });

  final int testimonials;
  final int publishedStories;
  final int badges;
  final int activeWidgets;

  factory ReputationSummaryTotals.fromJson(Map<String, dynamic> json) {
    int _parseInt(dynamic value) => int.tryParse('$value') ?? 0;
    return ReputationSummaryTotals(
      testimonials: _parseInt(json['testimonials']),
      publishedStories: _parseInt(json['publishedStories']),
      badges: _parseInt(json['badges']),
      activeWidgets: _parseInt(json['activeWidgets']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'testimonials': testimonials,
      'publishedStories': publishedStories,
      'badges': badges,
      'activeWidgets': activeWidgets,
    };
  }
}

class ReputationSummaryPerformance {
  const ReputationSummaryPerformance({
    this.onTimeDeliveryRate,
    this.averageCsat,
    this.referralReadyClients,
    this.caseStudiesPublished,
  });

  final double? onTimeDeliveryRate;
  final double? averageCsat;
  final double? referralReadyClients;
  final int? caseStudiesPublished;

  factory ReputationSummaryPerformance.fromJson(Map<String, dynamic> json) {
    double? _parseDouble(dynamic value) => value == null ? null : double.tryParse('$value');
    int? _parseInt(dynamic value) => value == null ? null : int.tryParse('$value');
    return ReputationSummaryPerformance(
      onTimeDeliveryRate: _parseDouble(json['onTimeDeliveryRate']),
      averageCsat: _parseDouble(json['averageCsat']),
      referralReadyClients: _parseDouble(json['referralReadyClients']),
      caseStudiesPublished: _parseInt(json['caseStudiesPublished']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      if (onTimeDeliveryRate != null) 'onTimeDeliveryRate': onTimeDeliveryRate,
      if (averageCsat != null) 'averageCsat': averageCsat,
      if (referralReadyClients != null) 'referralReadyClients': referralReadyClients,
      if (caseStudiesPublished != null) 'caseStudiesPublished': caseStudiesPublished,
    };
  }
}

class ReputationMetric {
  const ReputationMetric({
    required this.metricType,
    required this.label,
    required this.value,
    this.formattedValue,
    this.unit,
    this.trendDirection,
    this.trendValue,
    this.trendLabel,
    this.periodLabel,
    this.source,
  });

  final String metricType;
  final String label;
  final num value;
  final String? formattedValue;
  final String? unit;
  final String? trendDirection;
  final num? trendValue;
  final String? trendLabel;
  final String? periodLabel;
  final String? source;

  factory ReputationMetric.fromJson(Map<String, dynamic> json) {
    return ReputationMetric(
      metricType: (json['metricType'] as String? ?? '').trim(),
      label: (json['label'] as String? ?? '').trim(),
      value: json['value'] is num ? json['value'] as num : num.tryParse('${json['value']}') ?? 0,
      formattedValue: (json['formattedValue'] as String?)?.trim().isEmpty ?? true
          ? null
          : (json['formattedValue'] as String).trim(),
      unit: (json['unit'] as String?)?.trim(),
      trendDirection: (json['trendDirection'] as String?)?.trim(),
      trendValue: json['trendValue'] == null ? null : num.tryParse('${json['trendValue']}'),
      trendLabel: (json['trendLabel'] as String?)?.trim(),
      periodLabel: (json['periodLabel'] as String?)?.trim(),
      source: (json['source'] as String?)?.trim(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'metricType': metricType,
      'label': label,
      'value': value,
      if (formattedValue != null) 'formattedValue': formattedValue,
      if (unit != null) 'unit': unit,
      if (trendDirection != null) 'trendDirection': trendDirection,
      if (trendValue != null) 'trendValue': trendValue,
      if (trendLabel != null) 'trendLabel': trendLabel,
      if (periodLabel != null) 'periodLabel': periodLabel,
      if (source != null) 'source': source,
    };
  }
}

class ReputationTestimonial {
  const ReputationTestimonial({
    required this.id,
    required this.clientName,
    required this.comment,
    this.clientRole,
    this.company,
    this.rating,
    this.capturedAt,
    this.shareUrl,
  });

  final String id;
  final String clientName;
  final String comment;
  final String? clientRole;
  final String? company;
  final double? rating;
  final DateTime? capturedAt;
  final String? shareUrl;

  static ReputationTestimonial? tryParse(dynamic raw) {
    if (raw is Map) {
      return ReputationTestimonial.fromJson(Map<String, dynamic>.from(raw));
    }
    return null;
  }

  factory ReputationTestimonial.fromJson(Map<String, dynamic> json) {
    final ratingValue = json['rating'];
    final captured = json['capturedAt'] ?? json['deliveredAt'];
    return ReputationTestimonial(
      id: '${json['id'] ?? json['testimonialId'] ?? ''}',
      clientName: (json['clientName'] as String? ?? '').trim(),
      comment: (json['comment'] as String? ?? '').trim(),
      clientRole: (json['clientRole'] as String?)?.trim(),
      company: (json['company'] as String?)?.trim(),
      rating: ratingValue == null ? null : double.tryParse('$ratingValue'),
      capturedAt: captured == null ? null : DateTime.tryParse('$captured'),
      shareUrl: (json['shareUrl'] as String?)?.trim(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'clientName': clientName,
      'comment': comment,
      if (clientRole != null) 'clientRole': clientRole,
      if (company != null) 'company': company,
      if (rating != null) 'rating': rating,
      if (capturedAt != null) 'capturedAt': capturedAt!.toIso8601String(),
      if (shareUrl != null) 'shareUrl': shareUrl,
    };
  }
}

class ReputationSuccessStory {
  const ReputationSuccessStory({
    required this.id,
    required this.title,
    required this.summary,
    this.featured = false,
    this.impactMetrics = const <String, String>{},
    this.ctaUrl,
  });

  final String id;
  final String title;
  final String summary;
  final bool featured;
  final Map<String, String> impactMetrics;
  final String? ctaUrl;

  static ReputationSuccessStory? tryParse(dynamic raw) {
    if (raw is Map) {
      return ReputationSuccessStory.fromJson(Map<String, dynamic>.from(raw));
    }
    return null;
  }

  factory ReputationSuccessStory.fromJson(Map<String, dynamic> json) {
    final impact = (json['impactMetrics'] as Map? ?? const {})
        .map((key, value) => MapEntry('$key'.trim(), '$value'.trim()))
      ..removeWhere((key, value) => key.isEmpty || value.isEmpty);
    return ReputationSuccessStory(
      id: '${json['id'] ?? json['storyId'] ?? json['slug'] ?? ''}',
      title: (json['title'] as String? ?? '').trim(),
      summary: (json['summary'] as String? ?? '').trim(),
      featured: json['featured'] == true,
      impactMetrics: Map<String, String>.from(impact),
      ctaUrl: (json['ctaUrl'] as String?)?.trim(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'summary': summary,
      'featured': featured,
      'impactMetrics': impactMetrics,
      if (ctaUrl != null) 'ctaUrl': ctaUrl,
    };
  }
}

class ReputationBadge {
  const ReputationBadge({
    required this.id,
    required this.name,
    this.badgeType,
    this.description,
    this.issuedBy,
    this.issuedAt,
    this.level,
    this.isPromoted = false,
  });

  final String id;
  final String name;
  final String? badgeType;
  final String? description;
  final String? issuedBy;
  final DateTime? issuedAt;
  final String? level;
  final bool isPromoted;

  factory ReputationBadge.fromJson(Map<String, dynamic> json) {
    return ReputationBadge(
      id: '${json['id'] ?? json['slug'] ?? ''}',
      name: (json['name'] as String? ?? '').trim(),
      badgeType: (json['badgeType'] as String?)?.trim(),
      description: (json['description'] as String?)?.trim(),
      issuedBy: (json['issuedBy'] as String?)?.trim(),
      issuedAt: json['issuedAt'] == null ? null : DateTime.tryParse('${json['issuedAt']}'),
      level: (json['level'] as String?)?.trim(),
      isPromoted: json['isPromoted'] == true,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      if (badgeType != null) 'badgeType': badgeType,
      if (description != null) 'description': description,
      if (issuedBy != null) 'issuedBy': issuedBy,
      if (issuedAt != null) 'issuedAt': issuedAt!.toIso8601String(),
      if (level != null) 'level': level,
      'isPromoted': isPromoted,
    };
  }
}

class ReputationWidget {
  const ReputationWidget({
    required this.id,
    required this.name,
    required this.widgetType,
    this.status,
    this.placement,
    this.impressions,
    this.ctaClicks,
  });

  final String id;
  final String name;
  final String widgetType;
  final String? status;
  final String? placement;
  final int? impressions;
  final int? ctaClicks;

  factory ReputationWidget.fromJson(Map<String, dynamic> json) {
    final metadata = json['metadata'] as Map? ?? const {};
    final config = json['config'] as Map? ?? const {};
    final placement = metadata['placement'] ?? config['placement'];
    int? _parseInt(dynamic value) => value == null ? null : int.tryParse('$value');
    return ReputationWidget(
      id: '${json['id'] ?? json['widgetId'] ?? ''}',
      name: (json['name'] as String? ?? '').trim(),
      widgetType: (json['widgetType'] as String? ?? '').trim(),
      status: (json['status'] as String?)?.trim(),
      placement: placement == null ? null : '$placement'.trim(),
      impressions: _parseInt(json['impressions']),
      ctaClicks: _parseInt(json['ctaClicks']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'widgetType': widgetType,
      if (status != null) 'status': status,
      if (placement != null)
        'metadata': {
          'placement': placement,
        },
      if (impressions != null) 'impressions': impressions,
      if (ctaClicks != null) 'ctaClicks': ctaClicks,
    };
  }
}

class ReputationShareableLink {
  const ReputationShareableLink({
    required this.label,
    required this.url,
  });

  final String label;
  final String url;

  static ReputationShareableLink? tryParse(dynamic raw) {
    if (raw is Map) {
      final label = (raw['label'] as String? ?? '').trim();
      final url = (raw['url'] as String? ?? '').trim();
      if (label.isEmpty || url.isEmpty) {
        return null;
      }
      return ReputationShareableLink(label: label, url: url);
    }
    return null;
  }

  Map<String, dynamic> toJson() {
    return {
      'label': label,
      'url': url,
    };
  }
}

extension ReputationMetricLookup on List<ReputationMetric> {
  ReputationMetric? byType(String type) {
    return firstWhereOrNull(
      (metric) => metric.metricType.toLowerCase() == type.toLowerCase(),
    );
  }
}
