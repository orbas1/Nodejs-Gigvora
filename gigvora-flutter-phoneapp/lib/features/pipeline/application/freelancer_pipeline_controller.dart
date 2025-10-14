import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gigvora_foundation/gigvora_foundation.dart';

import '../../core/providers.dart';
import '../data/models/freelancer_pipeline_dashboard.dart';
import '../data/pipeline_repository.dart';

class FreelancerPipelineController extends StateNotifier<ResourceState<FreelancerPipelineDashboard>> {
  FreelancerPipelineController(this._repository, this._analytics)
      : super(ResourceState<FreelancerPipelineDashboard>.loading()) {
    load();
  }

  final FreelancerPipelineRepository _repository;
  final AnalyticsService _analytics;
  bool _initialViewTracked = false;

  Future<void> load({bool forceRefresh = false}) async {
    state = state.copyWith(loading: true, error: null);
    try {
      final result = await _repository.fetchDashboard(forceRefresh: forceRefresh);
      var dashboard = result.data;
      dashboard = _syncFollowUps(dashboard).withRecalculatedSummary();
      state = ResourceState<FreelancerPipelineDashboard>(
        data: dashboard,
        loading: false,
        error: result.error,
        fromCache: result.fromCache,
        lastUpdated: result.lastUpdated,
      );
      await _repository.persistDashboard(dashboard);

      if (!_initialViewTracked && !dashboard.isEmpty) {
        _initialViewTracked = true;
        await _analytics.track(
          'mobile_pipeline_viewed',
          context: {
            'deals': dashboard.deals.length,
            'followUps': dashboard.followUps.length,
            'campaigns': dashboard.campaigns.length,
            'activeView': dashboard.activeView,
            'fromCache': result.fromCache,
          },
          metadata: const {'source': 'mobile_app'},
        );
      }

      if (result.error != null) {
        await _analytics.track(
          'mobile_pipeline_partial',
          context: {
            'reason': '${result.error}',
            'fromCache': result.fromCache,
          },
          metadata: const {'source': 'mobile_app'},
        );
      }
    } catch (error) {
      state = state.copyWith(loading: false, error: error);
      await _analytics.track(
        'mobile_pipeline_load_failed',
        context: {
          'reason': '$error',
        },
        metadata: const {'source': 'mobile_app'},
      );
    }
  }

  Future<void> refresh() => load(forceRefresh: true);

  Future<void> setView(String viewKey) async {
    final dashboard = state.data;
    if (dashboard == null || dashboard.activeView == viewKey) {
      return;
    }
    final definition = dashboard.viewDefinition(viewKey);
    final nextDashboard = _syncFollowUps(dashboard.copyWith(activeView: definition?.key ?? viewKey))
        .withRecalculatedSummary();
    await _commitDashboard(
      nextDashboard,
      event: 'mobile_pipeline_view_changed',
      context: {
        'view': nextDashboard.activeView,
        'deals': nextDashboard.deals.length,
      },
    );
  }

  Future<void> moveDeal(int dealId, int stageId) async {
    final dashboard = state.data;
    if (dashboard == null) return;
    final matchingStages = dashboard.stages.where((stage) => stage.id == stageId);
    if (matchingStages.isEmpty) return;
    final stage = matchingStages.first;

    final updatedDeals = dashboard.deals.map((deal) {
      if (deal.id != dealId) return deal;
      return deal.copyWith(
        stageId: stage.id,
        stageName: stage.name,
        status: stage.statusCategory,
        winProbability: stage.winProbability,
      );
    }).toList(growable: false);

    final nextDashboard = _syncFollowUps(dashboard.copyWith(deals: updatedDeals)).withRecalculatedSummary();
    await _commitDashboard(
      nextDashboard,
      event: 'mobile_pipeline_stage_changed',
      context: {
        'dealId': dealId,
        'stageId': stageId,
        'stageName': stage.name,
      },
    );
  }

  Future<void> createDeal({
    required String title,
    required String clientName,
    required double pipelineValue,
    required int stageId,
    int? winProbability,
    String? industry,
    String? retainerTier,
    DateTime? expectedCloseDate,
    String? campaignName,
  }) async {
    final dashboard = state.data ?? FreelancerPipelineDashboard.empty();
    final matchingStages = dashboard.stages.where((stage) => stage.id == stageId);
    final stage = matchingStages.isNotEmpty
        ? matchingStages.first
        : (dashboard.stages.isNotEmpty ? dashboard.stages.first : null);
    if (stage == null) {
      return;
    }
    final id = DateTime.now().millisecondsSinceEpoch;
    final newDeal = PipelineDeal(
      id: id,
      title: title,
      clientName: clientName,
      pipelineValue: pipelineValue,
      winProbability: winProbability ?? stage.winProbability,
      stageId: stage.id,
      stageName: stage.name,
      status: stage.statusCategory,
      industry: industry?.isNotEmpty == true ? industry! : 'General',
      retainerTier: retainerTier?.isNotEmpty == true ? retainerTier! : 'Tier TBD',
      expectedCloseDate: expectedCloseDate,
      nextFollowUpAt: null,
      campaignName: campaignName,
      notes: null,
    );
    final nextDashboard = _syncFollowUps(
      dashboard.copyWith(deals: [...dashboard.deals, newDeal]),
    ).withRecalculatedSummary();
    await _commitDashboard(
      nextDashboard,
      event: 'mobile_pipeline_deal_created',
      context: {
        'dealId': id,
        'stageId': stage.id,
        'pipelineValue': pipelineValue,
      },
    );
  }

  Future<void> scheduleFollowUp({
    required int dealId,
    required DateTime dueAt,
    String channel = 'email',
    String? note,
  }) async {
    final dashboard = state.data ?? FreelancerPipelineDashboard.empty();
    final id = DateTime.now().millisecondsSinceEpoch;
    final followUp = PipelineFollowUp(
      id: id,
      dealId: dealId,
      subject: 'Pipeline follow-up',
      dueAt: dueAt,
      channel: channel,
      status: 'scheduled',
      note: note,
    );
    final nextDashboard = _syncFollowUps(
      dashboard.copyWith(followUps: [...dashboard.followUps, followUp]),
    ).withRecalculatedSummary();
    await _commitDashboard(
      nextDashboard,
      event: 'mobile_pipeline_follow_up_created',
      context: {
        'dealId': dealId,
        'followUpId': id,
        'channel': channel,
      },
    );
  }

  Future<void> completeFollowUp(int followUpId) async {
    final dashboard = state.data;
    if (dashboard == null) return;
    final updatedFollowUps = dashboard.followUps.map((followUp) {
      if (followUp.id != followUpId) return followUp;
      return followUp.copyWith(status: 'completed');
    }).toList(growable: false);
    final nextDashboard = _syncFollowUps(dashboard.copyWith(followUps: updatedFollowUps))
        .withRecalculatedSummary();
    await _commitDashboard(
      nextDashboard,
      event: 'mobile_pipeline_follow_up_completed',
      context: {
        'followUpId': followUpId,
      },
    );
  }

  Future<void> createCampaign({
    required String name,
    String status = 'Planning',
    String? targetService,
    DateTime? launchDate,
    Map<String, dynamic>? metrics,
    String? description,
  }) async {
    final dashboard = state.data ?? FreelancerPipelineDashboard.empty();
    final id = DateTime.now().millisecondsSinceEpoch;
    final campaign = PipelineCampaign(
      id: id,
      name: name,
      status: status,
      targetService: targetService,
      launchDate: launchDate,
      metrics: metrics ?? const <String, dynamic>{},
      description: description,
    );
    final nextDashboard = dashboard.copyWith(campaigns: [...dashboard.campaigns, campaign]);
    await _commitDashboard(
      nextDashboard,
      event: 'mobile_pipeline_campaign_created',
      context: {
        'campaignId': id,
        'status': status,
      },
    );
  }

  Future<void> trackProposalGenerated(int templateId, {int? dealId}) {
    return _analytics.track(
      'mobile_pipeline_proposal_generated',
      context: {
        'templateId': templateId,
        if (dealId != null) 'dealId': dealId,
      },
      metadata: const {'source': 'mobile_app'},
    );
  }

  Future<void> _commitDashboard(
    FreelancerPipelineDashboard dashboard, {
    String? event,
    Map<String, dynamic>? context,
  }) async {
    final recalculated = _syncFollowUps(dashboard).withRecalculatedSummary();
    state = state.copyWith(
      data: recalculated,
      loading: false,
      error: null,
      fromCache: false,
      lastUpdated: DateTime.now(),
    );
    await _repository.persistDashboard(recalculated);
    if (event != null) {
      await _analytics.track(
        event,
        context: context ?? const <String, dynamic>{},
        metadata: const {'source': 'mobile_app'},
      );
    }
  }

  FreelancerPipelineDashboard _syncFollowUps(FreelancerPipelineDashboard dashboard) {
    final Map<int, DateTime?> nextFollowUps = {};
    for (final followUp in dashboard.followUps) {
      if (followUp.status == 'completed') continue;
      final current = nextFollowUps[followUp.dealId];
      if (current == null || followUp.dueAt.isBefore(current)) {
        nextFollowUps[followUp.dealId] = followUp.dueAt;
      }
    }
    final updatedDeals = dashboard.deals
        .map(
          (deal) => deal.copyWith(nextFollowUpAt: nextFollowUps[deal.id]),
        )
        .toList(growable: false);
    return dashboard.copyWith(deals: updatedDeals);
  }
}

final freelancerPipelineRepositoryProvider = Provider<FreelancerPipelineRepository>((ref) {
  final cache = ref.watch(offlineCacheProvider);
  return FreelancerPipelineRepository(cache);
});

final freelancerPipelineControllerProvider =
    StateNotifierProvider<FreelancerPipelineController, ResourceState<FreelancerPipelineDashboard>>((ref) {
  final repository = ref.watch(freelancerPipelineRepositoryProvider);
  final analytics = ref.watch(analyticsServiceProvider);
  return FreelancerPipelineController(repository, analytics);
});
