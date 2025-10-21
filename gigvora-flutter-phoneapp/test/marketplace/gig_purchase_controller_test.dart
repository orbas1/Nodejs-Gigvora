import 'package:flutter_test/flutter_test.dart';
import 'package:gigvora_foundation/gigvora_foundation.dart';

import 'package:gigvora_mobile/features/marketplace/application/gig_purchase_controller.dart';
import 'package:gigvora_mobile/features/marketplace/data/gig_purchase_repository.dart';
import 'package:gigvora_mobile/features/marketplace/data/models/gig_package.dart';

import '../helpers/in_memory_offline_cache.dart';
import '../helpers/test_dependencies.dart';

void main() {
  group('GigPurchaseController', () {
    late RecordingAnalyticsService analytics;
    late _FakeGigPurchaseRepository repository;

    setUp(() {
      analytics = RecordingAnalyticsService();
      repository = _FakeGigPurchaseRepository();
    });

    test('load populates packages and records analytics metadata', () async {
      final controller = GigPurchaseController(repository, analytics);
      await Future<void>.delayed(const Duration(milliseconds: 10));
      analytics.events.clear();

      await controller.load();

      final state = controller.state;
      expect(state.loading, isFalse);
      expect(state.error, isNull);
      expect(state.data, isNotNull);
      expect(state.data, hasLength(repository.packages.length));

      final event = analytics.events.singleWhere(
        (entry) => entry.name == 'mobile_gig_packages_loaded',
      );
      expect(event.context['count'], repository.packages.length);
      expect(event.context['fromCache'], isFalse);
    });

    test('load surfaces errors and emits failure analytics event', () async {
      repository.fetchError = Exception('network down');
      final controller = GigPurchaseController(repository, analytics);

      await Future<void>.delayed(const Duration(milliseconds: 10));

      expect(controller.state.hasError, isTrue);
      final failureEvent = analytics.events.singleWhere(
        (entry) => entry.name == 'mobile_gig_packages_failed',
      );
      expect(failureEvent.context['reason'], contains('network down'));
    });

    test('refresh requests a force refresh from the repository', () async {
      final controller = GigPurchaseController(repository, analytics);
      await Future<void>.delayed(const Duration(milliseconds: 10));
      repository.fromCacheNext = true;
      analytics.events.clear();

      await controller.refresh();

      expect(repository.lastForceRefresh, isTrue);
      final event = analytics.events.singleWhere(
        (entry) => entry.name == 'mobile_gig_packages_loaded',
      );
      expect(event.context['fromCache'], isTrue);
    });

    test('upsertPackage adds new packages and persists changes', () async {
      final controller = GigPurchaseController(repository, analytics);
      await Future<void>.delayed(const Duration(milliseconds: 10));
      final draft = const GigPackage(
        id: 'growth-lab',
        name: 'Growth lab sprint',
        description: 'Two-week experimentation engagement with weekly reporting.',
        price: 8500,
        deliveryDays: 14,
        deliverables: <String>['Strategy workshop', 'Growth experiments', 'Executive summary'],
      );

      await controller.upsertPackage(draft);

      final packages = controller.state.data ?? const <GigPackage>[];
      expect(packages.any((package) => package.id == draft.id), isTrue);
      expect(repository.packages.any((package) => package.id == draft.id), isTrue);
    });

    test('deletePackage removes entries and updates state', () async {
      final controller = GigPurchaseController(repository, analytics);
      await Future<void>.delayed(const Duration(milliseconds: 10));
      final toRemove = repository.packages.first;

      await controller.deletePackage(toRemove);

      final packages = controller.state.data ?? const <GigPackage>[];
      expect(packages.any((package) => package.id == toRemove.id), isFalse);
      expect(repository.packages.any((package) => package.id == toRemove.id), isFalse);
    });

    test('purchase delegates to repository and emits analytics context', () async {
      final controller = GigPurchaseController(repository, analytics);
      await Future<void>.delayed(const Duration(milliseconds: 10));
      analytics.events.clear();

      final package = repository.packages.first;
      final receipt = await controller.purchase(
        package: package,
        buyerName: 'Jordan Rivera',
        email: 'jordan.rivera@example.com',
        paymentMethod: 'card',
        notes: 'Kick-off on Monday',
        coupon: 'SPRING24',
      );

      expect(receipt['orderId'], equals(repository.purchaseResponse['orderId']));
      expect(repository.lastPurchasePayload?['paymentMethod'], equals('card'));

      final event = analytics.events.singleWhere(
        (entry) => entry.name == 'mobile_gig_purchase_created',
      );
      expect(event.context['packageId'], equals(package.id));
      expect(event.context['couponApplied'], isTrue);
    });
  });
}

class _FakeGigPurchaseRepository extends GigPurchaseRepository {
  _FakeGigPurchaseRepository()
      : packages = <GigPackage>[
          const GigPackage(
            id: 'brand-uplift',
            name: 'Brand uplift sprint',
            description: 'Narrative and creative overhaul with an embedded strategist.',
            price: 5200,
            deliveryDays: 10,
            deliverables: <String>['Narrative playbook', 'Creative toolkit'],
            popular: true,
          ),
          const GigPackage(
            id: 'ops-audit',
            name: 'Operations audit',
            description: 'Deep dive into delivery rituals, tooling, and compliance.',
            price: 4200,
            deliveryDays: 7,
            deliverables: <String>['Ops scorecard', 'Implementation roadmap'],
          ),
        ],
        super(TestApiClient(), InMemoryOfflineCache());

  final List<GigPackage> packages;
  Object? fetchError;
  bool fromCacheNext = false;
  bool lastForceRefresh = false;
  Map<String, dynamic>? lastPurchasePayload;
  Map<String, dynamic> purchaseResponse = const {
    'orderId': 'order-001',
    'status': 'processing',
  };

  @override
  Future<RepositoryResult<List<GigPackage>>> fetchPackages({bool forceRefresh = false}) async {
    lastForceRefresh = forceRefresh;
    if (fetchError != null) {
      throw fetchError!;
    }
    return RepositoryResult<List<GigPackage>>(
      data: List<GigPackage>.unmodifiable(packages),
      fromCache: fromCacheNext,
      lastUpdated: DateTime.now(),
    );
  }

  @override
  Future<void> persistPackages(List<GigPackage> packages) async {
    this.packages
      ..clear()
      ..addAll(packages);
  }

  @override
  Future<Map<String, dynamic>> purchasePackage({
    required GigPackage package,
    required String buyerName,
    required String email,
    required String paymentMethod,
    String? notes,
    String? coupon,
  }) async {
    lastPurchasePayload = {
      'packageId': package.id,
      'buyerName': buyerName,
      'email': email,
      'paymentMethod': paymentMethod,
      'notes': notes,
      'coupon': coupon,
    };
    return purchaseResponse;
  }
}
