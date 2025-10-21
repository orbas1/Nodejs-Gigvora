import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:gigvora_mobile/features/marketing/gigvora_ads.dart';

class _NavigatorObserver extends NavigatorObserver {
  Route<dynamic>? lastPushed;

  @override
  void didPush(Route<dynamic> route, Route<dynamic>? previousRoute) {
    lastPushed = route;
    super.didPush(route, previousRoute);
  }
}

void main() {
  group('GigvoraAdBanner', () {
    testWidgets('renders banner content and navigates on CTA tap', (tester) async {
      final observer = _NavigatorObserver();
      final data = GigvoraAdBannerData(
        eyebrow: 'Gigvora Ads Network',
        title: 'Accelerate your pipeline',
        description: 'Pair brand placements with curated cohorts.',
        ctaLabel: 'Book strategy session',
        ctaRoute: '/target',
        stats: const [
          GigvoraBannerStat(label: 'CTR', value: '4.7%', helper: 'Last 30 days'),
        ],
      );

      await tester.pumpWidget(
        MaterialApp(
          routes: {'/target': (_) => const Scaffold(body: Text('Target route'))},
          home: Scaffold(
            body: GigvoraAdBanner(data: data),
          ),
          navigatorObservers: [observer],
        ),
      );

      expect(find.text('Accelerate your pipeline'), findsOneWidget);
      expect(find.text('4.7%'), findsOneWidget);

      await tester.tap(find.text('Book strategy session'));
      await tester.pumpAndSettle();

      expect(observer.lastPushed?.settings.name, '/target');
    });

    testWidgets('shows fallback snackbar when CTA route missing', (tester) async {
      final data = GigvoraAdBannerData(
        title: 'Pipeline boost',
        description: 'Let strategists orchestrate your sponsorship plan.',
        ctaLabel: 'Talk to us',
      );

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: GigvoraAdBanner(data: data),
          ),
        ),
      );

      await tester.tap(find.text('Talk to us'));
      await tester.pump();

      expect(find.text('Your Gigvora strategist will follow up shortly.'), findsOneWidget);
    });
  });

  group('GigvoraAdGrid', () {
    testWidgets('renders ad cards with metrics and CTA', (tester) async {
      final ads = [
        GigvoraAd(
          id: 'ad-1',
          title: 'Executive spotlight',
          description: 'Tell strategic stories across explorer cohorts.',
          badge: 'Spotlight',
          ctaLabel: 'Schedule review',
          metrics: const [
            GigvoraAdMetric(label: 'CTR', value: '5.2%'),
          ],
        ),
      ];

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: GigvoraAdGrid(ads: ads),
          ),
        ),
      );

      expect(find.text('Executive spotlight'), findsOneWidget);
      expect(find.text('5.2%'), findsOneWidget);
      expect(find.text('Schedule review'), findsOneWidget);
    });
  });
}
