import 'package:flutter_test/flutter_test.dart';
import 'package:gigvora_mobile/features/pipeline/application/freelancer_pipeline_controller.dart';
import 'package:gigvora_mobile/features/pipeline/data/pipeline_repository.dart';

import '../../../helpers/in_memory_offline_cache.dart';
import '../../../support/test_analytics_service.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('FreelancerPipelineController', () {
    late InMemoryOfflineCache cache;
    late FreelancerPipelineRepository repository;
    late TestAnalyticsService analytics;
    late FreelancerPipelineController controller;

    setUp(() {
      cache = InMemoryOfflineCache();
      repository = FreelancerPipelineRepository(cache);
      analytics = TestAnalyticsService();
      controller = FreelancerPipelineController(repository, analytics);
    });

    tearDown(() {
      controller.dispose();
    });

    Future<void> pumpDashboard() async {
      await controller.load(forceRefresh: true);
    }

    test('load hydrates the dashboard and records analytics', () async {
      await pumpDashboard();

      expect(controller.state.loading, isFalse);
      expect(controller.state.data, isNotNull);
      expect(controller.state.data!.deals, isNotEmpty);
      expect(
        analytics.events.any((event) => event.name == 'mobile_pipeline_viewed'),
        isTrue,
      );
    });

    test('createDeal persists a new opportunity and updates cache', () async {
      await pumpDashboard();
      final dashboard = controller.state.data!;
      final initialDeals = dashboard.deals.length;
      final stageId = dashboard.stages.first.id;

      await controller.createDeal(
        title: 'Growth strategy sprint',
        clientName: 'Atlas Co',
        pipelineValue: 18000,
        stageId: stageId,
      );

      expect(controller.state.data!.deals.length, initialDeals + 1);
      final cached = await repository.fetchDashboard();
      expect(cached.data.deals.length, controller.state.data!.deals.length);
    });

    test('moveDeal updates the deal stage and persists the change', () async {
      await pumpDashboard();
      final dashboard = controller.state.data!;
      final deal = dashboard.deals.first;
      final targetStage = dashboard.stages.firstWhere(
        (stage) => stage.id != deal.stageId && stage.statusCategory == 'open',
        orElse: () => dashboard.stages.first,
      );

      await controller.moveDeal(deal.id, targetStage.id);

      final updatedDeal = controller.state.data!.deals.firstWhere((item) => item.id == deal.id);
      expect(updatedDeal.stageId, targetStage.id);
      expect(updatedDeal.stageName, targetStage.name);

      final persisted = await repository.fetchDashboard();
      final persistedDeal = persisted.data.deals.firstWhere((item) => item.id == deal.id);
      expect(persistedDeal.stageId, targetStage.id);
    });
  });
}
