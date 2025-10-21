import 'dart:async';

import 'package:gigvora_foundation/gigvora_foundation.dart';
import 'package:http/http.dart' as http;

import 'test_dependencies.dart';

class ApiRequestLog {
  ApiRequestLog({
    required this.method,
    required this.path,
    this.query,
    this.headers,
    this.body,
  });

  final String method;
  final String path;
  final Map<String, dynamic>? query;
  final Map<String, String>? headers;
  final Object? body;
}

typedef _RequestHandler = FutureOr<dynamic> Function(
  String path,
  Map<String, dynamic>? query,
  Map<String, String>? headers,
  Object? body,
);

class RecordingApiClient extends ApiClient {
  RecordingApiClient({
    _RequestHandler? onGet,
    _RequestHandler? onPost,
    _RequestHandler? onPatch,
    _RequestHandler? onDelete,
  })  : _onGet = onGet,
        _onPost = onPost,
        _onPatch = onPatch,
        _onDelete = onDelete,
        super(
          httpClient: _NoopHttpClient(),
          config: testAppConfig,
        );

  final _RequestHandler? _onGet;
  final _RequestHandler? _onPost;
  final _RequestHandler? _onPatch;
  final _RequestHandler? _onDelete;

  final List<ApiRequestLog> requests = <ApiRequestLog>[];

  @override
  Future<dynamic> get(
    String path, {
    Map<String, dynamic>? query,
    Map<String, String>? headers,
    Duration timeout = const Duration(seconds: 12),
  }) async {
    requests.add(ApiRequestLog(
      method: 'GET',
      path: path,
      query: query,
      headers: headers,
    ));
    if (_onGet != null) {
      return _onGet!(path, query, headers, null);
    }
    throw UnimplementedError('GET handler not provided for $path');
  }

  @override
  Future<dynamic> post(
    String path, {
    Object? body,
    Map<String, dynamic>? query,
    Map<String, String>? headers,
    Duration timeout = const Duration(seconds: 12),
  }) async {
    requests.add(ApiRequestLog(
      method: 'POST',
      path: path,
      query: query,
      headers: headers,
      body: body,
    ));
    if (_onPost != null) {
      return _onPost!(path, query, headers, body);
    }
    throw UnimplementedError('POST handler not provided for $path');
  }

  @override
  Future<dynamic> patch(
    String path, {
    Object? body,
    Map<String, dynamic>? query,
    Map<String, String>? headers,
    Duration timeout = const Duration(seconds: 12),
  }) async {
    requests.add(ApiRequestLog(
      method: 'PATCH',
      path: path,
      query: query,
      headers: headers,
      body: body,
    ));
    if (_onPatch != null) {
      return _onPatch!(path, query, headers, body);
    }
    throw UnimplementedError('PATCH handler not provided for $path');
  }

  @override
  Future<dynamic> delete(
    String path, {
    Object? body,
    Map<String, dynamic>? query,
    Map<String, String>? headers,
    Duration timeout = const Duration(seconds: 12),
  }) async {
    requests.add(ApiRequestLog(
      method: 'DELETE',
      path: path,
      query: query,
      headers: headers,
      body: body,
    ));
    if (_onDelete != null) {
      return _onDelete!(path, query, headers, body);
    }
    throw UnimplementedError('DELETE handler not provided for $path');
  }
}

class _NoopHttpClient extends http.BaseClient {
  @override
  Future<http.StreamedResponse> send(http.BaseRequest request) {
    throw UnimplementedError('Network access disabled in RecordingApiClient');
  }
}
