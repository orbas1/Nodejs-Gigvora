import 'package:gigvora_foundation/gigvora_foundation.dart';
import 'package:uuid/uuid.dart';

import 'models/gig_package.dart';

class GigPurchaseRepository {
  GigPurchaseRepository(this._apiClient, this._cache);

  final ApiClient _apiClient;
  final OfflineCache _cache;

  static const _cacheKey = 'marketplace:gig_packages';
  static const _orderCacheKey = 'marketplace:gig_orders';
  static const _uuid = Uuid();

  Future<RepositoryResult<List<GigPackage>>> fetchPackages({bool forceRefresh = false}) async {
    final cached = _cache.read<List<GigPackage>>(_cacheKey, (raw) {
      if (raw is List) {
        return raw
            .whereType<Map<String, dynamic>>()
            .map(GigPackage.fromJson)
            .toList(growable: false);
      }
      return const <GigPackage>[];
    });

    if (!forceRefresh && cached != null) {
      return RepositoryResult<List<GigPackage>>(
        data: cached.value,
        fromCache: true,
        lastUpdated: cached.storedAt,
      );
    }

    try {
      final response = await _apiClient.get('/marketplace/gigs/packages');
      if (response is! List) {
        throw Exception('Unexpected gig package payload');
      }
      final packages = response
          .whereType<Map<String, dynamic>>()
          .map(GigPackage.fromJson)
          .toList(growable: false);
      await _cache.write(
        _cacheKey,
        packages.map((package) => package.toJson()).toList(growable: false),
        ttl: const Duration(minutes: 15),
      );
      return RepositoryResult<List<GigPackage>>(
        data: packages,
        fromCache: false,
        lastUpdated: DateTime.now(),
      );
    } catch (error) {
      if (cached != null) {
        return RepositoryResult<List<GigPackage>>(
          data: cached.value,
          fromCache: true,
          lastUpdated: cached.storedAt,
          error: error,
        );
      }
      rethrow;
    }
  }

  Future<void> persistPackages(List<GigPackage> packages) {
    return _cache.write(
      _cacheKey,
      packages.map((package) => package.toJson()).toList(growable: false),
      ttl: const Duration(minutes: 15),
    );
  }

  Future<Map<String, dynamic>> purchasePackage({
    required GigPackage package,
    required String buyerName,
    required String email,
    required String paymentMethod,
    String? notes,
    String? coupon,
  }) async {
    final payload = {
      'packageId': package.id,
      'buyerName': buyerName,
      'email': email,
      'paymentMethod': paymentMethod,
      'notes': notes,
      'coupon': coupon,
    };

    final response = await _apiClient.post('/marketplace/gigs/orders', body: payload);
    if (response is Map<String, dynamic>) {
      await _cache.write(
        '$_orderCacheKey:${response['orderId'] ?? _uuid.v4()}',
        response,
        ttl: const Duration(days: 1),
      );
      return response;
    }

    final fallback = {
      'orderId': _uuid.v4(),
      'status': 'processing',
      'package': package.toJson(),
      'buyerName': buyerName,
      'email': email,
      'paymentMethod': paymentMethod,
      'notes': notes,
      'coupon': coupon,
      'createdAt': DateTime.now().toIso8601String(),
    };
    await _cache.write(
      '$_orderCacheKey:${fallback['orderId']}',
      fallback,
      ttl: const Duration(days: 1),
    );
    return fallback;
  }
}
