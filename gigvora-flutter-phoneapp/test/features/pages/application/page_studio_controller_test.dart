import 'package:flutter_test/flutter_test.dart';
import 'package:gigvora_mobile/features/pages/application/page_studio_controller.dart';
import 'package:gigvora_mobile/features/pages/domain/page_models.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('PageStudioController', () {
    late PageStudioController controller;

    setUp(() {
      controller = PageStudioController();
    });

    tearDown(() {
      controller.dispose();
    });

    test('refresh updates sync timestamp and clears loading state', () async {
      final previousSynced = controller.state.lastSynced;

      await controller.refresh();

      expect(controller.state.loading, isFalse);
      expect(controller.state.lastSynced, isNot(equals(previousSynced)));
    });

    test('createPage stores a private draft without publishing', () async {
      final draft = PageDraft(
        name: 'Design camp',
        headline: 'Immersive mentorship pod for design leaders.',
        blueprint: 'Community initiative page',
        audience: const ['Design', 'Leadership'],
        visibility: 'private',
      );

      final created = await controller.createPage(draft);

      expect(created, isTrue);
      expect(controller.state.saving, isFalse);
      expect(controller.state.drafts.any((page) => page.name == 'Design camp'), isTrue);
      expect(controller.state.published.any((page) => page.name == 'Design camp'), isFalse);
    });

    test('createPage publishes immediately when visibility is public', () async {
      final draft = PageDraft(
        name: 'Talent accelerator',
        headline: 'Growth playbooks for hiring teams and agencies.',
        blueprint: 'Employer brand page',
        audience: const ['Talent acquisition', 'Employer brand'],
        visibility: 'public',
      );

      final created = await controller.createPage(draft);

      expect(created, isTrue);
      expect(controller.state.published.any((page) => page.name == 'Talent accelerator'), isTrue);
    });
  });
}
