import 'dart:async';

import 'package:flutter_test/flutter_test.dart';

import 'package:gigvora_mobile/features/marketplace/data/gig_purchase_repository.dart';
import 'package:gigvora_mobile/features/marketplace/data/models/gig_package.dart';

import '../helpers/in_memory_offline_cache.dart';
import '../helpers/recording_api_client.dart';

void main() {
  group('GigPurchaseRepository', () {
    late RecordingApiClient apiClient;
    late InMemoryOfflineCache cache;
    late GigPurchaseRepository repository;
    bool throwPackages = false;

    RecordingApiClient buildClient({
      FutureOr<dynamic> Function(String, Map<String, dynamic>?, Map<String, String>?, Object?)? onPost,
    }) {
      return RecordingApiClient(
        onGet: (path, query, headers, body) {
          if (path == '/marketplace/gigs/packages') {
            if (throwPackages) {
              throw Exception('offline');
            }
            return [
              {
                'id': 'pkg-1',
                'name': 'Design audit',
                'description': 'Comprehensive UX audit',
                'price': 1200,
                'deliveryDays': 5,
                'deliverables': ['Audit report'],
                'popular': true,
                'mediaPreview': 'https://example.com/preview.png',
              },
            ];
          }
          throw UnimplementedError('Unhandled GET $path');
        },
        onPost: onPost ??
            (path, query, headers, body) {
              if (path == '/marketplace/gigs/orders') {
                return {
                  'orderId': 'ord-1',
                  'status': 'confirmed',
                };
              }
              throw UnimplementedError('Unhandled POST $path');
            },
      );
    }

    setUp(() {
      throwPackages = false;
      apiClient = buildClient();
      cache = InMemoryOfflineCache();
      repository = GigPurchaseRepository(apiClient, cache);
    });

    test('fetchPackages caches results and falls back to cache on error', () async {
      final initial = await repository.fetchPackages();
      expect(initial.fromCache, isFalse);
      expect(initial.data.first.name, 'Design audit');
      expect(initial.data.first.popular, isTrue);

      final cached = await repository.fetchPackages();
      expect(cached.fromCache, isTrue);

      throwPackages = true;
      final fallback = await repository.fetchPackages();
      expect(fallback.fromCache, isTrue);
      expect(fallback.error, isA<Exception>());
    });

    test('persistPackages writes packages to cache', () async {
      final package = GigPackage(
        id: 'pkg-local',
        name: 'Research sprint',
        description: 'Five day discovery sprint',
        price: 2400,
        deliveryDays: 7,
        deliverables: const ['Research plan'],
      );

      await repository.persistPackages([package]);
      final stored = cache.read('marketplace:gig_packages', (raw) => raw) as List<dynamic>?;
      expect(stored, isNotNull);
      expect((stored!.first as Map<String, dynamic>)['id'], 'pkg-local');
    });

    test('purchasePackage forwards payload and caches receipt', () async {
      final package = GigPackage(
        id: 'pkg-1',
        name: 'Design audit',
        description: 'Comprehensive UX audit',
        price: 1200,
        deliveryDays: 5,
        deliverables: const ['Audit report'],
      );

      final response = await repository.purchasePackage(
        package: package,
        buyerName: 'Lena Fields',
        email: 'lena@example.com',
        paymentMethod: 'card',
      );

      expect(response['orderId'], 'ord-1');
      expect(response['status'], 'confirmed');
      final stored = cache.read('marketplace:gig_orders:ord-1', (raw) => raw);
      expect(stored, isNotNull);
    });

    test('purchasePackage generates fallback receipt on unexpected payload', () async {
      apiClient = buildClient(onPost: (path, query, headers, body) => 'accepted');
      repository = GigPurchaseRepository(apiClient, cache);
      final package = GigPackage(
        id: 'pkg-2',
        name: 'Content sprint',
        description: 'High velocity content production',
        price: 900,
        deliveryDays: 4,
        deliverables: const ['Content pack'],
      );

      final receipt = await repository.purchasePackage(
        package: package,
        buyerName: 'Alex Gómez',
        email: 'alex@example.com',
        paymentMethod: 'wallet',
        notes: 'Priority onboarding',
      );

      expect(receipt['status'], 'processing');
      expect(receipt['buyerName'], 'Alex Gómez');
      final orderId = receipt['orderId'] as String;
      final stored = cache.read('marketplace:gig_orders:$orderId', (raw) => raw);
      expect(stored, isNotNull);
    });
  });
}
