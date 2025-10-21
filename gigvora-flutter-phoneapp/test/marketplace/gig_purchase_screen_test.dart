import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:gigvora_foundation/gigvora_foundation.dart';

import 'package:gigvora_mobile/features/auth/application/session_controller.dart';
import 'package:gigvora_mobile/features/auth/domain/session.dart';
import 'package:gigvora_mobile/features/marketplace/application/gig_purchase_controller.dart';
import 'package:gigvora_mobile/features/marketplace/data/models/gig_package.dart';
import 'package:gigvora_mobile/features/marketplace/presentation/gig_purchase_screen.dart';

import '../helpers/in_memory_offline_cache.dart';
import '../helpers/noop_api_client.dart';
import '../helpers/test_dependencies.dart';

class _StubGigPurchaseRepository extends GigPurchaseRepository {
  _StubGigPurchaseRepository() : super(NoopApiClient(), InMemoryOfflineCache());
}

class _TestGigPurchaseController extends GigPurchaseController {
  _TestGigPurchaseController(
    ResourceState<List<GigPackage>> initialState,
    GigPurchaseRepository repository,
    AnalyticsService analytics,
  ) : super(repository, analytics) {
    state = initialState;
  }

  int refreshCalls = 0;
  GigPackage? lastUpserted;
  GigPackage? lastDeleted;
  Map<String, dynamic>? lastPurchase;

  @override
  Future<void> load({bool forceRefresh = false}) async {}

  @override
  Future<void> refresh() async {
    refreshCalls += 1;
  }

  @override
  Future<Map<String, dynamic>> purchase({
    required GigPackage package,
    required String buyerName,
    required String email,
    required String paymentMethod,
    String? notes,
    String? coupon,
  }) async {
    lastPurchase = {
      'package': package,
      'buyerName': buyerName,
      'email': email,
      'paymentMethod': paymentMethod,
      'notes': notes,
      'coupon': coupon,
    };
    return {'orderId': 'ord-test', 'status': 'processing'};
  }

  @override
  Future<void> upsertPackage(GigPackage package) async {
    lastUpserted = package;
  }

  @override
  Future<void> deletePackage(GigPackage package) async {
    lastDeleted = package;
  }
}

Future<_TestGigPurchaseController> _pumpGigPurchaseScreen(
  WidgetTester tester, {
  required ResourceState<List<GigPackage>> state,
  required SessionState sessionState,
}) async {
  final controller = _TestGigPurchaseController(
    state,
    _StubGigPurchaseRepository(),
    RecordingAnalyticsService(),
  );

  final router = GoRouter(
    routes: [
      GoRoute(path: '/', builder: (context, _) => const GigPurchaseScreen()),
      GoRoute(path: '/calendar', builder: (context, _) => const SizedBox()),
      GoRoute(path: '/home', builder: (context, _) => const SizedBox()),
      GoRoute(path: '/profile', builder: (context, _) => const SizedBox()),
    ],
  );

  await tester.pumpWidget(
    ProviderScope(
      overrides: [
        gigPurchaseControllerProvider.overrideWith((ref) => controller),
        sessionControllerProvider.overrideWith((ref) {
          final sessionController = SessionController();
          sessionController.state = sessionState;
          return sessionController;
        }),
      ],
      child: MaterialApp.router(routerConfig: router),
    ),
  );
  await tester.pump();
  return controller;
}

void main() {
  final packages = [
    GigPackage(
      id: 'pkg-1',
      name: 'Design audit',
      description: 'Comprehensive UX audit',
      price: 1200,
      deliveryDays: 5,
      deliverables: const ['Audit report'],
      popular: true,
    ),
  ];

  group('GigPurchaseScreen', () {
    testWidgets('renders packages and admin actions for admin members', (tester) async {
      final session = UserSession.demo().copyWith(
        memberships: ['admin', 'freelancer'],
        activeMembership: 'admin',
      );
      await _pumpGigPurchaseScreen(
        tester,
        state: ResourceState<List<GigPackage>>(data: packages),
        sessionState: SessionState.authenticated(session),
      );

      expect(find.text('Design audit'), findsOneWidget);
      expect(find.text('New package'), findsOneWidget);
      expect(find.byIcon(Icons.edit_outlined), findsWidgets);
    });

    testWidgets('shows offline banner when state is from cache', (tester) async {
      final session = UserSession.demo();
      await _pumpGigPurchaseScreen(
        tester,
        state: ResourceState<List<GigPackage>>(data: packages, fromCache: true),
        sessionState: SessionState.authenticated(session),
      );

      expect(find.textContaining('Offline first'), findsOneWidget);
    });

    testWidgets('shows error banner when repository returns error', (tester) async {
      final session = UserSession.demo();
      await _pumpGigPurchaseScreen(
        tester,
        state: ResourceState<List<GigPackage>>(data: const [], error: 'boom'),
        sessionState: SessionState.authenticated(session),
      );

      expect(find.textContaining('Purchase catalogue is unavailable'), findsOneWidget);
    });

    testWidgets('renders empty state when no packages exist', (tester) async {
      await _pumpGigPurchaseScreen(
        tester,
        state: const ResourceState<List<GigPackage>>(data: []),
        sessionState: const SessionState.unauthenticated(),
      );

      expect(find.text('No packages published yet'), findsOneWidget);
    });
  });
}
