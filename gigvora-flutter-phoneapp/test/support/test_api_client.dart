import 'package:gigvora_foundation/gigvora_foundation.dart';
import 'package:http/http.dart' as http;

class TestApiClient extends ApiClient {
  TestApiClient({
    Future<dynamic> Function(String path)? onGet,
    Future<dynamic> Function(String path, Object? body)? onPost,
    Future<dynamic> Function(String path, Object? body)? onPut,
    Future<dynamic> Function(String path, Object? body)? onPatch,
    Future<dynamic> Function(String path, Object? body)? onDelete,
  })  : _onGet = onGet,
        _onPost = onPost,
        _onPut = onPut,
        _onPatch = onPatch,
        _onDelete = onDelete,
        super(
          httpClient: _DummyHttpClient(),
          config: _testConfig,
        );

  final Future<dynamic> Function(String path)? _onGet;
  final Future<dynamic> Function(String path, Object? body)? _onPost;
  final Future<dynamic> Function(String path, Object? body)? _onPut;
  final Future<dynamic> Function(String path, Object? body)? _onPatch;
  final Future<dynamic> Function(String path, Object? body)? _onDelete;

  static final AppConfig _testConfig = AppConfig(
    environment: AppEnvironment.development,
    apiBaseUrl: Uri.parse('https://example.com/api'),
    graphQlEndpoint: Uri.parse('https://example.com/graphql'),
    realtimeEndpoint: Uri.parse('wss://example.com/realtime'),
    defaultCacheTtl: const Duration(minutes: 5),
    enableNetworkLogging: false,
    analyticsFlushThreshold: 1,
    offlineCacheNamespace: 'gigvora_test',
    featureFlags: const <String, dynamic>{},
    featureFlagRefreshInterval: const Duration(minutes: 5),
  );

  @override
  Future<dynamic> get(
    String path, {
    Map<String, dynamic>? query,
    Map<String, String>? headers,
    Duration timeout = const Duration(seconds: 12),
  }) {
    if (_onGet != null) {
      return _onGet!(path);
    }
    return super.get(path, query: query, headers: headers, timeout: timeout);
  }

  @override
  Future<dynamic> post(
    String path, {
    Object? body,
    Map<String, dynamic>? query,
    Map<String, String>? headers,
    Duration timeout = const Duration(seconds: 12),
  }) {
    if (_onPost != null) {
      return _onPost!(path, body);
    }
    return super.post(path, body: body, query: query, headers: headers, timeout: timeout);
  }

  @override
  Future<dynamic> put(
    String path, {
    Object? body,
    Map<String, dynamic>? query,
    Map<String, String>? headers,
    Duration timeout = const Duration(seconds: 12),
  }) {
    if (_onPut != null) {
      return _onPut!(path, body);
    }
    return super.put(path, body: body, query: query, headers: headers, timeout: timeout);
  }

  @override
  Future<dynamic> patch(
    String path, {
    Object? body,
    Map<String, dynamic>? query,
    Map<String, String>? headers,
    Duration timeout = const Duration(seconds: 12),
  }) {
    if (_onPatch != null) {
      return _onPatch!(path, body);
    }
    return super.patch(path, body: body, query: query, headers: headers, timeout: timeout);
  }

  @override
  Future<dynamic> delete(
    String path, {
    Object? body,
    Map<String, dynamic>? query,
    Map<String, String>? headers,
    Duration timeout = const Duration(seconds: 12),
  }) {
    if (_onDelete != null) {
      return _onDelete!(path, body);
    }
    return super.delete(path, body: body, query: query, headers: headers, timeout: timeout);
  }
}

class _DummyHttpClient extends http.BaseClient {
  @override
  Future<http.StreamedResponse> send(http.BaseRequest request) {
    throw UnimplementedError('Network calls are not supported in TestApiClient');
  }
}
