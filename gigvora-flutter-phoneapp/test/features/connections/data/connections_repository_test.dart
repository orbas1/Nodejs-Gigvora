import 'package:flutter_test/flutter_test.dart';
import 'package:gigvora_foundation/gigvora_foundation.dart';
import 'package:http/http.dart' as http;

import 'package:gigvora_mobile/features/connections/data/connections_repository.dart';
import 'package:gigvora_mobile/features/connections/domain/connection_network.dart';

import '../../../support/test_app_config.dart';
import '../../../support/test_offline_cache.dart';

void main() {
  late _RecordingApiClient apiClient;
  late InMemoryOfflineCache cache;
  late ConnectionsRepository repository;

  setUp(() {
    apiClient = _RecordingApiClient();
    cache = InMemoryOfflineCache();
    repository = ConnectionsRepository(apiClient, cache, cacheTtl: const Duration(minutes: 10));
  });

  test('fetches network from API and caches it', () async {
    apiClient.response = _sampleNetworkResponse;

    final result = await repository.fetchNetwork(userId: 7);

    expect(apiClient.lastPath, '/connections/network');
    expect(apiClient.lastQuery?['userId'], '7');
    expect(result.fromCache, isFalse);
    expect(result.data.nodes, isNotEmpty);

    final second = await repository.fetchNetwork(userId: 7);
    expect(second.fromCache, isTrue);
    expect(apiClient.requestCount, equals(1));
  });

  test('returns cached data when the API request fails', () async {
    apiClient.response = _sampleNetworkResponse;
    await repository.fetchNetwork(userId: 42);

    apiClient.shouldThrow = true;
    final result = await repository.fetchNetwork(userId: 42, forceRefresh: true);

    expect(result.fromCache, isTrue);
    expect(result.error, isNotNull);
    expect(result.data.summary.total, equals(6));
  });
}

class _RecordingApiClient extends ApiClient {
  _RecordingApiClient()
      : super(
          httpClient: _DummyHttpClient(),
          config: createTestConfig(),
        );

  dynamic response;
  bool shouldThrow = false;
  String? lastPath;
  Map<String, dynamic>? lastQuery;
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
    requestCount += 1;
    if (shouldThrow) {
      throw Exception('network unavailable');
    }
    return response;
  }
}

class _DummyHttpClient extends http.BaseClient {
  @override
  Future<http.StreamedResponse> send(http.BaseRequest request) {
    throw UnimplementedError('Network calls are not supported in tests');
  }
}

const _sampleNetworkResponse = <String, dynamic>{
  'summary': {
    'firstDegree': 2,
    'secondDegree': 3,
    'thirdDegree': 1,
    'total': 6,
  },
  'policies': [
    {
      'actorRole': 'founder',
      'allowedRoles': ['talent', 'employer'],
      'matrix': {
        'talent': ['message', 'request_connection'],
      },
    }
  ],
  'nodes': [
    {
      'id': 1,
      'name': 'Avery Johnson',
      'userType': 'talent',
      'headline': 'Fractional CPO',
      'location': 'London',
      'degree': 1,
      'degreeLabel': 'First degree',
      'mutualConnections': 8,
      'connectors': [
        {'id': 99, 'name': 'Mina Ortiz', 'userType': 'talent'},
      ],
      'path': [
        {'id': 11, 'name': 'Salem Rhodes', 'userType': 'employer'},
      ],
      'actions': {
        'canMessage': true,
        'canRequestConnection': false,
        'requiresIntroduction': false,
      },
    },
  ],
};
