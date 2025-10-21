import 'package:flutter_test/flutter_test.dart';
import 'package:gigvora_foundation/gigvora_foundation.dart';
import 'package:http/http.dart' as http;

import 'package:gigvora_mobile/features/cv/data/cv_document_repository.dart';
import 'package:gigvora_mobile/features/cv/data/models/cv_workspace_snapshot.dart';

import '../../../support/test_app_config.dart';
import '../../../support/test_offline_cache.dart';

void main() {
  late _RecordingApiClient apiClient;
  late InMemoryOfflineCache cache;
  late CvDocumentRepository repository;

  setUp(() {
    apiClient = _RecordingApiClient();
    cache = InMemoryOfflineCache();
    repository = CvDocumentRepository(apiClient, cache);
  });

  test('loads workspace snapshot and caches response', () async {
    apiClient.response = _workspaceResponse;

    final result = await repository.fetchWorkspace(12, headers: const {'X-Test': 'true'});

    expect(apiClient.lastPath, '/users/12/cv-documents/workspace');
    expect(apiClient.lastHeaders?['X-Test'], 'true');
    expect(result.data.summary.totalDocuments, equals(2));

    final cached = await repository.fetchWorkspace(12);
    expect(cached.fromCache, isTrue);
    expect(apiClient.requestCount, equals(1));
  });

  test('returns cached snapshot when API request fails', () async {
    apiClient.response = _workspaceResponse;
    await repository.fetchWorkspace(5);

    apiClient.shouldThrow = true;
    final result = await repository.fetchWorkspace(5, forceRefresh: true);

    expect(result.fromCache, isTrue);
    expect(result.error, isNotNull);
    expect(result.data.summary.totalVersions, equals(6));
  });

  test('createDocument invalidates cache and returns parsed document', () async {
    apiClient.response = _workspaceResponse;
    await repository.fetchWorkspace(7);

    apiClient.nextPostResponse = _documentResponse;
    final draft = CvDocumentDraft(title: 'Growth Strategist');
    final created = await repository.createDocument(7, draft);

    expect(created.title, 'Growth Strategist');
    final cached = cache.read<CvWorkspaceSnapshot>('cv-workspace:user:7', (raw) {
      return CvWorkspaceSnapshot.fromJson(Map<String, dynamic>.from(raw as Map));
    });
    expect(cached, isNull);
  });
}

class _RecordingApiClient extends ApiClient {
  _RecordingApiClient()
      : super(
          httpClient: _DummyHttpClient(),
          config: createTestConfig(),
        );

  dynamic response;
  dynamic nextPostResponse;
  bool shouldThrow = false;
  String? lastPath;
  Map<String, dynamic>? lastQuery;
  Map<String, String>? lastHeaders;
  Object? lastBody;
  int requestCount = 0;

  @override
  Future<dynamic> get(
    String path, {
    Map<String, dynamic>? query,
    Map<String, String>? headers,
    Duration timeout = const Duration(seconds: 12),
  }) async {
    lastPath = path;
    lastQuery = query;
    lastHeaders = headers;
    requestCount += 1;
    if (shouldThrow) {
      throw Exception('network unavailable');
    }
    return response;
  }

  @override
  Future<dynamic> post(
    String path, {
    Object? body,
    Map<String, dynamic>? query,
    Map<String, String>? headers,
    Duration timeout = const Duration(seconds: 12),
  }) async {
    lastPath = path;
    lastBody = body;
    lastHeaders = headers;
    return nextPostResponse ?? response;
  }

  @override
  Future<dynamic> put(
    String path, {
    Object? body,
    Map<String, dynamic>? query,
    Map<String, String>? headers,
    Duration timeout = const Duration(seconds: 12),
  }) async {
    lastPath = path;
    lastBody = body;
    lastHeaders = headers;
    return nextPostResponse ?? response;
  }

}

class _DummyHttpClient extends http.BaseClient {
  @override
  Future<http.StreamedResponse> send(http.BaseRequest request) {
    throw UnimplementedError('HTTP calls are not supported in tests');
  }
}

const _workspaceResponse = <String, dynamic>{
  'summary': {
    'totalDocuments': 2,
    'totalVersions': 6,
    'aiAssistedCount': 1,
  },
  'baseline': {
    'id': 11,
    'title': 'Baseline CV',
    'status': 'published',
    'metadata': {'isBaseline': true},
  },
  'variants': [
    {
      'id': 12,
      'title': 'Product Lead CV',
      'status': 'draft',
      'tags': ['product'],
    },
  ],
};

const _documentResponse = <String, dynamic>{
  'id': 31,
  'title': 'Growth Strategist',
  'status': 'draft',
  'tags': ['growth'],
};
