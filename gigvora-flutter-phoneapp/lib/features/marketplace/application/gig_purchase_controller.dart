import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gigvora_foundation/gigvora_foundation.dart';

import '../../../core/providers.dart';
import '../data/gig_purchase_repository.dart';
import '../data/models/gig_package.dart';

class GigPurchaseController extends StateNotifier<ResourceState<List<GigPackage>>> {
  GigPurchaseController(this._repository, this._analytics)
      : super(ResourceState<List<GigPackage>>.loading()) {
    load();
  }

  final GigPurchaseRepository _repository;
  final AnalyticsService _analytics;

  Future<void> load({bool forceRefresh = false}) async {
    state = state.copyWith(loading: true, error: null);
    try {
      final result = await _repository.fetchPackages(forceRefresh: forceRefresh);
      state = ResourceState<List<GigPackage>>(
        data: result.data,
        loading: false,
        error: result.error,
        fromCache: result.fromCache,
        lastUpdated: result.lastUpdated,
      );
      await _analytics.track(
        'mobile_gig_packages_loaded',
        context: {
          'count': result.data.length,
          'fromCache': result.fromCache,
        },
        metadata: const {'source': 'mobile_app'},
      );
    } catch (error) {
      state = state.copyWith(loading: false, error: error);
      await _analytics.track(
        'mobile_gig_packages_failed',
        context: {'reason': '$error'},
        metadata: const {'source': 'mobile_app'},
      );
    }
  }

  Future<void> refresh() => load(forceRefresh: true);

  Future<Map<String, dynamic>> purchase({
    required GigPackage package,
    required String buyerName,
    required String email,
    required String paymentMethod,
    String? notes,
    String? coupon,
  }) async {
    final response = await _repository.purchasePackage(
      package: package,
      buyerName: buyerName,
      email: email,
      paymentMethod: paymentMethod,
      notes: notes,
      coupon: coupon,
    );
    await _analytics.track(
      'mobile_gig_purchase_created',
      context: {
        'packageId': package.id,
        'paymentMethod': paymentMethod,
        'couponApplied': coupon?.isNotEmpty == true,
      },
      metadata: const {'source': 'mobile_app'},
    );
    return response;
  }

  Future<void> upsertPackage(GigPackage package) async {
    final packages = List<GigPackage>.from(state.data ?? const <GigPackage>[]);
    final index = packages.indexWhere((element) => element.id == package.id);
    if (index == -1) {
      packages.add(package);
    } else {
      packages[index] = package;
    }
    state = state.copyWith(data: packages);
    await _repository.persistPackages(packages);
  }

  Future<void> deletePackage(GigPackage package) async {
    final packages = List<GigPackage>.from(state.data ?? const <GigPackage>[]);
    packages.removeWhere((element) => element.id == package.id);
    state = state.copyWith(data: packages);
    await _repository.persistPackages(packages);
  }
}

final gigPurchaseRepositoryProvider = Provider<GigPurchaseRepository>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  final cache = ref.watch(offlineCacheProvider);
  return GigPurchaseRepository(apiClient, cache);
});

final gigPurchaseControllerProvider =
    StateNotifierProvider<GigPurchaseController, ResourceState<List<GigPackage>>>((ref) {
  final repository = ref.watch(gigPurchaseRepositoryProvider);
  final analytics = ref.watch(analyticsServiceProvider);
  return GigPurchaseController(repository, analytics);
});
