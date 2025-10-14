import 'dart:collection';

class PipelineSummary {
  const PipelineSummary({
    required this.openDeals,
    required this.wonDeals,
    required this.lostDeals,
    required this.pipelineValue,
    required this.weightedPipelineValue,
    required this.followUpsDue,
  });

  final int openDeals;
  final int wonDeals;
  final int lostDeals;
  final double pipelineValue;
  final double weightedPipelineValue;
  final int followUpsDue;

  factory PipelineSummary.fromJson(Map<String, dynamic> json) {
    return PipelineSummary(
      openDeals: json['openDeals'] as int? ?? 0,
      wonDeals: json['wonDeals'] as int? ?? 0,
      lostDeals: json['lostDeals'] as int? ?? 0,
      pipelineValue: (json['pipelineValue'] as num?)?.toDouble() ?? 0,
      weightedPipelineValue: (json['weightedPipelineValue'] as num?)?.toDouble() ?? 0,
      followUpsDue: json['followUpsDue'] as int? ?? json['nextFollowUps'] as int? ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'openDeals': openDeals,
      'wonDeals': wonDeals,
      'lostDeals': lostDeals,
      'pipelineValue': pipelineValue,
      'weightedPipelineValue': weightedPipelineValue,
      'followUpsDue': followUpsDue,
    };
  }

  PipelineSummary copyWith({
    int? openDeals,
    int? wonDeals,
    int? lostDeals,
    double? pipelineValue,
    double? weightedPipelineValue,
    int? followUpsDue,
  }) {
    return PipelineSummary(
      openDeals: openDeals ?? this.openDeals,
      wonDeals: wonDeals ?? this.wonDeals,
      lostDeals: lostDeals ?? this.lostDeals,
      pipelineValue: pipelineValue ?? this.pipelineValue,
      weightedPipelineValue: weightedPipelineValue ?? this.weightedPipelineValue,
      followUpsDue: followUpsDue ?? this.followUpsDue,
    );
  }
}

class PipelineStage {
  const PipelineStage({
    required this.id,
    required this.name,
    required this.winProbability,
    required this.statusCategory,
  });

  final int id;
  final String name;
  final int winProbability;
  final String statusCategory;

  factory PipelineStage.fromJson(Map<String, dynamic> json) {
    return PipelineStage(
      id: json['id'] as int? ?? 0,
      name: json['name'] as String? ?? 'Stage',
      winProbability: json['winProbability'] as int? ?? 0,
      statusCategory: json['statusCategory'] as String? ?? 'open',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'winProbability': winProbability,
      'statusCategory': statusCategory,
    };
  }
}

class PipelineDeal {
  const PipelineDeal({
    required this.id,
    required this.title,
    required this.clientName,
    required this.pipelineValue,
    required this.winProbability,
    required this.stageId,
    required this.stageName,
    required this.status,
    required this.industry,
    required this.retainerTier,
    this.expectedCloseDate,
    this.nextFollowUpAt,
    this.campaignName,
    this.notes,
  });

  final int id;
  final String title;
  final String clientName;
  final double pipelineValue;
  final int winProbability;
  final int stageId;
  final String stageName;
  final String status;
  final String industry;
  final String retainerTier;
  final DateTime? expectedCloseDate;
  final DateTime? nextFollowUpAt;
  final String? campaignName;
  final String? notes;

  factory PipelineDeal.fromJson(Map<String, dynamic> json) {
    return PipelineDeal(
      id: json['id'] as int? ?? DateTime.now().millisecondsSinceEpoch,
      title: json['title'] as String? ?? 'Untitled deal',
      clientName: json['clientName'] as String? ?? 'Client',
      pipelineValue: (json['pipelineValue'] as num?)?.toDouble() ?? 0,
      winProbability: json['winProbability'] as int? ?? 0,
      stageId: json['stageId'] as int? ?? 0,
      stageName: json['stageName'] as String? ?? 'Stage',
      status: json['status'] as String? ?? 'open',
      industry: json['industry'] as String? ?? 'General',
      retainerTier: json['retainerTier'] as String? ?? 'Not set',
      expectedCloseDate: json['expectedCloseDate'] != null
          ? DateTime.tryParse(json['expectedCloseDate'].toString())
          : null,
      nextFollowUpAt:
          json['nextFollowUpAt'] != null ? DateTime.tryParse(json['nextFollowUpAt'].toString()) : null,
      campaignName: json['campaignName'] as String?,
      notes: json['notes'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'clientName': clientName,
      'pipelineValue': pipelineValue,
      'winProbability': winProbability,
      'stageId': stageId,
      'stageName': stageName,
      'status': status,
      'industry': industry,
      'retainerTier': retainerTier,
      'expectedCloseDate': expectedCloseDate?.toIso8601String(),
      'nextFollowUpAt': nextFollowUpAt?.toIso8601String(),
      'campaignName': campaignName,
      'notes': notes,
    };
  }

  PipelineDeal copyWith({
    int? stageId,
    String? stageName,
    String? status,
    int? winProbability,
    DateTime? expectedCloseDate,
    DateTime? nextFollowUpAt,
    String? campaignName,
    String? notes,
  }) {
    return PipelineDeal(
      id: id,
      title: title,
      clientName: clientName,
      pipelineValue: pipelineValue,
      winProbability: winProbability ?? this.winProbability,
      stageId: stageId ?? this.stageId,
      stageName: stageName ?? this.stageName,
      status: status ?? this.status,
      industry: industry,
      retainerTier: retainerTier,
      expectedCloseDate: expectedCloseDate ?? this.expectedCloseDate,
      nextFollowUpAt: nextFollowUpAt ?? this.nextFollowUpAt,
      campaignName: campaignName ?? this.campaignName,
      notes: notes ?? this.notes,
    );
  }
}

class PipelineFollowUp {
  const PipelineFollowUp({
    required this.id,
    required this.dealId,
    required this.subject,
    required this.dueAt,
    required this.channel,
    required this.status,
    this.note,
  });

  final int id;
  final int dealId;
  final String subject;
  final DateTime dueAt;
  final String channel;
  final String status;
  final String? note;

  factory PipelineFollowUp.fromJson(Map<String, dynamic> json) {
    return PipelineFollowUp(
      id: json['id'] as int? ?? DateTime.now().millisecondsSinceEpoch,
      dealId: json['dealId'] as int? ?? 0,
      subject: json['subject'] as String? ?? json['title'] as String? ?? 'Follow-up',
      dueAt: json['dueAt'] != null
          ? DateTime.tryParse(json['dueAt'].toString()) ?? DateTime.now()
          : DateTime.now(),
      channel: json['channel'] as String? ?? 'email',
      status: json['status'] as String? ?? 'scheduled',
      note: json['note'] as String? ?? json['notes'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'dealId': dealId,
      'subject': subject,
      'dueAt': dueAt.toIso8601String(),
      'channel': channel,
      'status': status,
      'note': note,
    };
  }

  PipelineFollowUp copyWith({String? status, DateTime? dueAt}) {
    return PipelineFollowUp(
      id: id,
      dealId: dealId,
      subject: subject,
      dueAt: dueAt ?? this.dueAt,
      channel: channel,
      status: status ?? this.status,
      note: note,
    );
  }
}

class PipelineCampaign {
  const PipelineCampaign({
    required this.id,
    required this.name,
    required this.status,
    this.targetService,
    this.launchDate,
    this.metrics = const <String, dynamic>{},
    this.description,
  });

  final int id;
  final String name;
  final String status;
  final String? targetService;
  final DateTime? launchDate;
  final Map<String, dynamic> metrics;
  final String? description;

  factory PipelineCampaign.fromJson(Map<String, dynamic> json) {
    return PipelineCampaign(
      id: json['id'] as int? ?? DateTime.now().millisecondsSinceEpoch,
      name: json['name'] as String? ?? 'Campaign',
      status: json['status'] as String? ?? 'draft',
      targetService: json['targetService'] as String?,
      launchDate: json['launchDate'] != null
          ? DateTime.tryParse(json['launchDate'].toString())
          : null,
      metrics: json['metrics'] is Map<String, dynamic>
          ? Map<String, dynamic>.from(json['metrics'] as Map)
          : const <String, dynamic>{},
      description: json['description'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'status': status,
      'targetService': targetService,
      'launchDate': launchDate?.toIso8601String(),
      'metrics': metrics,
      'description': description,
    };
  }
}

class PipelineProposalTemplate {
  const PipelineProposalTemplate({
    required this.id,
    required this.name,
    required this.description,
    required this.pricingType,
    required this.amount,
    required this.cadence,
  });

  final int id;
  final String name;
  final String description;
  final String pricingType;
  final double amount;
  final String cadence;

  factory PipelineProposalTemplate.fromJson(Map<String, dynamic> json) {
    return PipelineProposalTemplate(
      id: json['id'] as int? ?? DateTime.now().millisecondsSinceEpoch,
      name: json['name'] as String? ?? 'Template',
      description: json['description'] as String? ?? '',
      pricingType: json['pricingType'] as String? ?? json['pricingModel']?['type'] as String? ?? 'retainer',
      amount: json['amount'] is num
          ? (json['amount'] as num).toDouble()
          : (json['pricingModel']?['amount'] as num?)?.toDouble() ?? 0,
      cadence: json['cadence'] as String? ?? json['pricingModel']?['cadence'] as String? ?? 'monthly',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'description': description,
      'pricingType': pricingType,
      'amount': amount,
      'cadence': cadence,
    };
  }
}

class PipelineViewDefinition {
  const PipelineViewDefinition({
    required this.key,
    required this.label,
    required this.description,
  });

  final String key;
  final String label;
  final String description;

  factory PipelineViewDefinition.fromJson(Map<String, dynamic> json) {
    return PipelineViewDefinition(
      key: json['key'] as String? ?? 'stage',
      label: json['label'] as String? ?? 'Pipeline view',
      description: json['description'] as String? ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'key': key,
      'label': label,
      'description': description,
    };
  }
}

class PipelineColumn {
  const PipelineColumn({
    required this.key,
    required this.label,
    required this.deals,
    required this.totalValue,
    required this.weightedValue,
  });

  final String key;
  final String label;
  final List<PipelineDeal> deals;
  final double totalValue;
  final double weightedValue;
}

PipelineSummary computeSummary(List<PipelineDeal> deals, List<PipelineFollowUp> followUps) {
  final openDeals = deals.where((deal) => deal.status != 'won' && deal.status != 'lost').length;
  final wonDeals = deals.where((deal) => deal.status == 'won').length;
  final lostDeals = deals.where((deal) => deal.status == 'lost').length;

  final pipelineValue = deals
      .where((deal) => deal.status != 'lost')
      .fold<double>(0, (sum, deal) => sum + deal.pipelineValue);

  final weightedPipelineValue = deals.fold<double>(
    0,
    (sum, deal) => sum + (deal.pipelineValue * (deal.winProbability.clamp(0, 100) / 100)),
  );

  final now = DateTime.now();
  final horizon = now.add(const Duration(days: 14));
  final followUpsDue = followUps
      .where((followUp) =>
          followUp.status != 'completed' &&
          (followUp.dueAt.isBefore(horizon) || followUp.dueAt.isAtSameMomentAs(horizon)))
      .length;

  return PipelineSummary(
    openDeals: openDeals,
    wonDeals: wonDeals,
    lostDeals: lostDeals,
    pipelineValue: double.parse(pipelineValue.toStringAsFixed(2)),
    weightedPipelineValue: double.parse(weightedPipelineValue.toStringAsFixed(2)),
    followUpsDue: followUpsDue,
  );
}

class FreelancerPipelineDashboard {
  const FreelancerPipelineDashboard({
    required this.summary,
    required this.stages,
    required this.deals,
    required this.followUps,
    required this.campaigns,
    required this.templates,
    required this.views,
    required this.activeView,
  });

  final PipelineSummary summary;
  final List<PipelineStage> stages;
  final List<PipelineDeal> deals;
  final List<PipelineFollowUp> followUps;
  final List<PipelineCampaign> campaigns;
  final List<PipelineProposalTemplate> templates;
  final List<PipelineViewDefinition> views;
  final String activeView;

  factory FreelancerPipelineDashboard.fromJson(Map<String, dynamic> json) {
    final views = (json['views'] as List?)
            ?.map((view) => view is Map<String, dynamic> ? PipelineViewDefinition.fromJson(view) : null)
            .whereType<PipelineViewDefinition>()
            .toList(growable: false) ??
        const <PipelineViewDefinition>[];

    final stages = (json['stages'] as List?)
            ?.map((stage) => stage is Map<String, dynamic> ? PipelineStage.fromJson(stage) : null)
            .whereType<PipelineStage>()
            .toList(growable: false) ??
        const <PipelineStage>[];

    final deals = (json['deals'] as List?)
            ?.map((deal) => deal is Map<String, dynamic> ? PipelineDeal.fromJson(deal) : null)
            .whereType<PipelineDeal>()
            .toList(growable: false) ??
        const <PipelineDeal>[];

    final followUps = (json['followUps'] as List?)
            ?.map((followUp) =>
                followUp is Map<String, dynamic> ? PipelineFollowUp.fromJson(followUp) : null)
            .whereType<PipelineFollowUp>()
            .toList(growable: false) ??
        const <PipelineFollowUp>[];

    final campaigns = (json['campaigns'] as List?)
            ?.map((campaign) => campaign is Map<String, dynamic> ? PipelineCampaign.fromJson(campaign) : null)
            .whereType<PipelineCampaign>()
            .toList(growable: false) ??
        const <PipelineCampaign>[];

    final templates = (json['templates'] as List?)
            ?.map((template) =>
                template is Map<String, dynamic> ? PipelineProposalTemplate.fromJson(template) : null)
            .whereType<PipelineProposalTemplate>()
            .toList(growable: false) ??
        const <PipelineProposalTemplate>[];

    final summary = PipelineSummary.fromJson(json['summary'] as Map<String, dynamic>? ?? const {});
    final defaultView = json['activeView'] as String? ?? (views.isNotEmpty ? views.first.key : 'stage');

    return FreelancerPipelineDashboard(
      summary: summary,
      stages: stages,
      deals: deals,
      followUps: followUps,
      campaigns: campaigns,
      templates: templates,
      views: views,
      activeView: defaultView,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'summary': summary.toJson(),
      'stages': stages.map((stage) => stage.toJson()).toList(growable: false),
      'deals': deals.map((deal) => deal.toJson()).toList(growable: false),
      'followUps': followUps.map((followUp) => followUp.toJson()).toList(growable: false),
      'campaigns': campaigns.map((campaign) => campaign.toJson()).toList(growable: false),
      'templates': templates.map((template) => template.toJson()).toList(growable: false),
      'views': views.map((view) => view.toJson()).toList(growable: false),
      'activeView': activeView,
    };
  }

  bool get isEmpty => deals.isEmpty && followUps.isEmpty && campaigns.isEmpty;

  List<String> get viewKeys => views.map((view) => view.key).toList(growable: false);

  PipelineViewDefinition? viewDefinition(String key) {
    final match = views.where((view) => view.key == key);
    if (match.isNotEmpty) {
      return match.first;
    }
    return views.isNotEmpty ? views.first : null;
  }

  List<PipelineColumn> columnsForActiveView() => columnsForView(activeView);

  List<PipelineColumn> columnsForView(String viewKey) {
    switch (viewKey) {
      case 'industry':
        return _groupDeals(
          orderKeys: deals.map((deal) => deal.industry).toSet().toList(growable: false),
          labelBuilder: (key) => key.isEmpty ? 'Unassigned' : key,
          dealSelector: (deal) => deal.industry.isEmpty ? 'Unassigned' : deal.industry,
        );
      case 'retainer_size':
        return _groupDeals(
          orderKeys: deals.map((deal) => deal.retainerTier).toSet().toList(growable: false),
          labelBuilder: (key) => key.isEmpty ? 'Tier TBD' : key,
          dealSelector: (deal) => deal.retainerTier.isEmpty ? 'Tier TBD' : deal.retainerTier,
        );
      case 'probability':
        return _groupProbability();
      case 'stage':
      default:
        return _groupStages();
    }
  }

  List<PipelineColumn> _groupStages() {
    final Map<int, List<PipelineDeal>> grouped = {for (final stage in stages) stage.id: <PipelineDeal>[]};
    for (final deal in deals) {
      grouped.putIfAbsent(deal.stageId, () => <PipelineDeal>[]).add(deal);
    }
    final columns = <PipelineColumn>[];
    for (final stage in stages) {
      final stageDeals = List<PipelineDeal>.unmodifiable(grouped[stage.id] ?? const <PipelineDeal>[]);
      columns.add(
        PipelineColumn(
          key: 'stage-${stage.id}',
          label: stage.name,
          deals: stageDeals,
          totalValue: _sumPipeline(stageDeals),
          weightedValue: _sumWeighted(stageDeals),
        ),
      );
    }
    return columns;
  }

  List<PipelineColumn> _groupDeals({
    required List<String> orderKeys,
    required String Function(String key) labelBuilder,
    required String Function(PipelineDeal deal) dealSelector,
  }) {
    final Map<String, List<PipelineDeal>> grouped = SplayTreeMap<String, List<PipelineDeal>>();
    for (final deal in deals) {
      final key = dealSelector(deal);
      grouped.putIfAbsent(key, () => <PipelineDeal>[]).add(deal);
    }

    final keys = orderKeys.isEmpty ? grouped.keys.toList(growable: false) : orderKeys;
    return keys.map((key) {
      final bucket = List<PipelineDeal>.unmodifiable(grouped[key] ?? const <PipelineDeal>[]);
      return PipelineColumn(
        key: 'group-$key',
        label: labelBuilder(key),
        deals: bucket,
        totalValue: _sumPipeline(bucket),
        weightedValue: _sumWeighted(bucket),
      );
    }).toList(growable: false);
  }

  List<PipelineColumn> _groupProbability() {
    final buckets = <String, List<PipelineDeal>>{
      'commit': <PipelineDeal>[],
      'upside': <PipelineDeal>[],
      'early': <PipelineDeal>[],
    };

    for (final deal in deals) {
      if (deal.winProbability >= 70) {
        buckets['commit']!.add(deal);
      } else if (deal.winProbability >= 40) {
        buckets['upside']!.add(deal);
      } else {
        buckets['early']!.add(deal);
      }
    }

    return [
      PipelineColumn(
        key: 'probability-commit',
        label: 'Commit (70-100%)',
        deals: List<PipelineDeal>.unmodifiable(buckets['commit']!),
        totalValue: _sumPipeline(buckets['commit']!),
        weightedValue: _sumWeighted(buckets['commit']!),
      ),
      PipelineColumn(
        key: 'probability-upside',
        label: 'Upside (40-69%)',
        deals: List<PipelineDeal>.unmodifiable(buckets['upside']!),
        totalValue: _sumPipeline(buckets['upside']!),
        weightedValue: _sumWeighted(buckets['upside']!),
      ),
      PipelineColumn(
        key: 'probability-early',
        label: 'Early pipeline (0-39%)',
        deals: List<PipelineDeal>.unmodifiable(buckets['early']!),
        totalValue: _sumPipeline(buckets['early']!),
        weightedValue: _sumWeighted(buckets['early']!),
      ),
    ];
  }

  double _sumPipeline(List<PipelineDeal> deals) {
    return double.parse(deals.fold<double>(0, (sum, deal) => sum + deal.pipelineValue).toStringAsFixed(2));
  }

  double _sumWeighted(List<PipelineDeal> deals) {
    return double.parse(
      deals
          .fold<double>(
            0,
            (sum, deal) => sum + (deal.pipelineValue * (deal.winProbability.clamp(0, 100) / 100)),
          )
          .toStringAsFixed(2),
    );
  }

  FreelancerPipelineDashboard copyWith({
    PipelineSummary? summary,
    List<PipelineStage>? stages,
    List<PipelineDeal>? deals,
    List<PipelineFollowUp>? followUps,
    List<PipelineCampaign>? campaigns,
    List<PipelineProposalTemplate>? templates,
    List<PipelineViewDefinition>? views,
    String? activeView,
  }) {
    return FreelancerPipelineDashboard(
      summary: summary ?? this.summary,
      stages: stages ?? this.stages,
      deals: deals ?? this.deals,
      followUps: followUps ?? this.followUps,
      campaigns: campaigns ?? this.campaigns,
      templates: templates ?? this.templates,
      views: views ?? this.views,
      activeView: activeView ?? this.activeView,
    );
  }

  FreelancerPipelineDashboard withRecalculatedSummary() {
    return copyWith(summary: computeSummary(deals, followUps));
  }

  static FreelancerPipelineDashboard empty() {
    return FreelancerPipelineDashboard(
      summary: const PipelineSummary(
        openDeals: 0,
        wonDeals: 0,
        lostDeals: 0,
        pipelineValue: 0,
        weightedPipelineValue: 0,
        followUpsDue: 0,
      ),
      stages: const <PipelineStage>[],
      deals: const <PipelineDeal>[],
      followUps: const <PipelineFollowUp>[],
      campaigns: const <PipelineCampaign>[],
      templates: const <PipelineProposalTemplate>[],
      views: const <PipelineViewDefinition>[],
      activeView: 'stage',
    );
  }
}
