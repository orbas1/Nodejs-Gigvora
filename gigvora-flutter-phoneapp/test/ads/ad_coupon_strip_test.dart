import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gigvora_foundation/gigvora_foundation.dart';

import 'package:gigvora_mobile/features/ads/data/models/ad_coupon.dart';
import 'package:gigvora_mobile/features/ads/data/models/ad_placement.dart';
import 'package:gigvora_mobile/features/ads/presentation/ad_coupon_strip.dart';
import 'package:gigvora_mobile/features/ads/providers.dart';

void main() {
  group('AdCouponStrip', () {
    testWidgets('renders coupon offers when placements provide coupons', (WidgetTester tester) async {
      final placements = <AdPlacement>[
        AdPlacement(
          id: 1,
          surface: 'home',
          position: 'hero',
          status: 'active',
          isActive: true,
          isUpcoming: false,
          coupons: const <AdCoupon>[
            AdCoupon(
              id: 10,
              code: 'GIGVORA20',
              name: 'Launch special',
              description: 'Save on your first campaign.',
              discountType: 'percentage',
              discountValue: 20,
              lifecycleStatus: 'active',
              isActive: true,
              startAt: null,
              endAt: null,
              surfaceTargets: <String>['home'],
              termsUrl: 'https://gigvora.com/terms',
              metadata: <String, dynamic>{},
            ),
          ],
          creative: const AdCreative(
            id: 5,
            name: 'Hero creative',
            headline: 'Amplify your reach',
            subheadline: 'Automated campaign orchestration',
            callToAction: 'Redeem now',
            ctaUrl: 'https://gigvora.com/redeem',
          ),
          startAt: null,
          endAt: null,
        ),
      ];

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            adPlacementsProvider.overrideWith(
              (ref, surface) async => RepositoryResult<List<AdPlacement>>(
                data: placements,
                fromCache: false,
              ),
            ),
          ],
          child: const MaterialApp(
            home: Scaffold(
              body: AdCouponStrip(surface: 'home'),
            ),
          ),
        ),
      );

      await tester.pumpAndSettle();

      expect(find.text('Featured offers'), findsOneWidget);
      expect(find.text('GIGVORA20'), findsOneWidget);
      expect(find.textContaining('Save 20%'), findsOneWidget);
      expect(find.text('REDEEM NOW'), findsOneWidget);
    });

    testWidgets('is hidden when no placements or coupons exist', (WidgetTester tester) async {
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            adPlacementsProvider.overrideWith(
              (ref, surface) async => RepositoryResult<List<AdPlacement>>(
                data: const <AdPlacement>[],
                fromCache: false,
              ),
            ),
          ],
          child: const MaterialApp(
            home: Scaffold(
              body: AdCouponStrip(surface: 'home'),
            ),
          ),
        ),
      );

      await tester.pumpAndSettle();

      expect(find.byType(AdCouponStrip), findsOneWidget);
      expect(find.text('Featured offers'), findsNothing);
    });

    testWidgets('disables unsafe call-to-action URLs', (WidgetTester tester) async {
      final placements = <AdPlacement>[ 
        AdPlacement(
          id: 2,
          surface: 'jobs',
          position: 'sidebar',
          status: 'active',
          isActive: true,
          isUpcoming: false,
          coupons: const <AdCoupon>[
            AdCoupon(
              id: 21,
              code: 'GROW10',
              name: 'Growth boost',
              description: 'Add automation to your outreach.',
              discountType: 'percentage',
              discountValue: 10,
              lifecycleStatus: 'active',
              isActive: true,
              startAt: null,
              endAt: null,
              surfaceTargets: <String>['jobs'],
              termsUrl: 'ftp://invalid.example.com',
              metadata: <String, dynamic>{},
            ),
          ],
          creative: const AdCreative(
            id: 11,
            name: 'Sidebar creative',
            headline: 'Scale your outreach',
            subheadline: 'Activate curated leads with automation.',
            callToAction: 'Claim now',
            ctaUrl: 'javascript:alert(1)',
          ),
          startAt: null,
          endAt: null,
        ),
      ];

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            adPlacementsProvider.overrideWith(
              (ref, surface) async => RepositoryResult<List<AdPlacement>>(
                data: placements,
                fromCache: false,
              ),
            ),
          ],
          child: const MaterialApp(
            home: Scaffold(
              body: AdCouponStrip(surface: 'jobs'),
            ),
          ),
        ),
      );

      await tester.pumpAndSettle();

      final buttonFinder = find.widgetWithText(ElevatedButton, 'CLAIM NOW');
      expect(buttonFinder, findsOneWidget);
      final button = tester.widget<ElevatedButton>(buttonFinder);
      expect(button.onPressed, isNull);
      expect(find.text('Terms & conditions'), findsNothing);
    });
  });
}
