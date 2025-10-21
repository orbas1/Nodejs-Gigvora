import 'package:flutter_test/flutter_test.dart';

import 'package:gigvora_mobile/features/marketplace/data/models/gig_package.dart';

void main() {
  group('GigPackage', () {
    test('fromJson parses nested deliverables and flags', () {
      final package = GigPackage.fromJson({
        'id': 'pkg-1',
        'name': 'Design audit',
        'description': 'Comprehensive UX audit',
        'price': 1500.5,
        'deliveryDays': 7,
        'deliverables': ['Report', 123],
        'popular': true,
        'mediaPreview': 'https://example.com/preview.png',
      });

      expect(package.id, 'pkg-1');
      expect(package.price, 1500.5);
      expect(package.deliverables, equals(['Report', '123']));
      expect(package.popular, isTrue);
    });

    test('toJson serialises package fields', () {
      const package = GigPackage(
        id: 'pkg-2',
        name: 'Content sprint',
        description: 'Ship content assets quickly',
        price: 900,
        deliveryDays: 4,
        deliverables: ['Scripts'],
        popular: false,
      );

      final json = package.toJson();
      expect(json['id'], 'pkg-2');
      expect(json['deliverables'], equals(['Scripts']));
      expect(json['popular'], isFalse);
    });

    test('copyWith updates specific fields', () {
      const package = GigPackage(
        id: 'pkg-3',
        name: 'Research sprint',
        description: 'Discovery sprint',
        price: 1200,
        deliveryDays: 5,
        deliverables: ['Interviews'],
        popular: false,
      );

      final updated = package.copyWith(price: 1400, popular: true);
      expect(updated.price, 1400);
      expect(updated.popular, isTrue);
      expect(updated.name, package.name);
    });
  });
}
