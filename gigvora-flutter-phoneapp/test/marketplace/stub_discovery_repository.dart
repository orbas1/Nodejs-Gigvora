import 'dart:async';

import 'package:gigvora_foundation/gigvora_foundation.dart';

import 'package:gigvora_mobile/features/marketplace/data/discovery_repository.dart';
import 'package:gigvora_mobile/features/marketplace/data/models/opportunity.dart';
import 'package:gigvora_mobile/features/marketplace/data/models/opportunity_detail.dart';

import '../helpers/in_memory_offline_cache.dart';
import '../helpers/noop_api_client.dart';

class StubDiscoveryRepository extends DiscoveryRepository {
  StubDiscoveryRepository({
    required this.page,
    required this.detail,
  })  : detailRequests = <String>[],
        super(NoopApiClient(), InMemoryOfflineCache());

  OpportunityPage page;
  OpportunityDetail detail;
  bool throwOnLoad = false;
  Object? detailError;
  Map<String, dynamic>? lastFilters;
  String? lastSort;
  String? lastQuery;
  bool? lastIncludeFacets;
  Map<String, String>? lastHeaders;
  final List<String> detailRequests;
  int loadCount = 0;
  Completer<void>? _loadCompleter;

  Future<void> waitForNextLoad() {
    final completer = Completer<void>();
    _loadCompleter = completer;
    return completer.future;
  }

  @override
  Future<RepositoryResult<OpportunityPage>> fetchOpportunities(
    OpportunityCategory category, {
    String? query,
    bool forceRefresh = false,
    int page = 1,
    int pageSize = 20,
    Map<String, dynamic>? filters,
    String? sort,
    bool includeFacets = false,
    Map<String, String>? headers,
  }) async {
    loadCount += 1;
    lastQuery = query;
    lastFilters = filters == null ? null : Map<String, dynamic>.from(filters);
    lastSort = sort;
    lastIncludeFacets = includeFacets;
    lastHeaders = headers == null ? null : Map<String, String>.from(headers);
    _loadCompleter?..complete();
    _loadCompleter = null;

    if (throwOnLoad) {
      throw Exception('Failed to fetch opportunities');
    }

    return RepositoryResult<OpportunityPage>(
      data: this.page,
      fromCache: false,
      lastUpdated: DateTime.now(),
    );
  }

  @override
  Future<OpportunityDetail> fetchOpportunityDetail(
    OpportunityCategory category,
    String id, {
    Map<String, String>? headers,
  }) async {
    detailRequests.add(id);
    lastHeaders = headers == null ? null : Map<String, String>.from(headers);
    final error = detailError;
    if (error != null) {
      if (error is Exception) {
        throw error;
      }
      throw Exception('$error');
    }
    return detail;
  }

  void updateDetail(OpportunityDetail nextDetail) {
    detail = nextDetail;
  }

  void updatePage(OpportunityPage nextPage) {
    page = nextPage;
  }
}
