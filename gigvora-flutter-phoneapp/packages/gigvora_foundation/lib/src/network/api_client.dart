import 'dart:convert';
import 'dart:io';

import 'package:logging/logging.dart';
import 'package:http/http.dart' as http;

import '../config/app_config.dart';

class ApiException implements Exception {
  ApiException(this.statusCode, this.message, [this.body]);

  final int statusCode;
  final String message;
  final dynamic body;

  @override
  String toString() => 'ApiException($statusCode): $message';
}

class ApiRequestContext {
  ApiRequestContext({
    required this.method,
    required this.uri,
    required this.headers,
    this.body,
  });

  final String method;
  final Uri uri;
  final Map<String, String> headers;
  Object? body;
}

class ApiResponseContext {
  ApiResponseContext(this.response, this.body);

  final http.Response response;
  final dynamic body;
}

typedef ApiRequestInterceptor = Future<void> Function(ApiRequestContext context);
typedef ApiResponseInterceptor = Future<void> Function(ApiResponseContext context);

dynamic _decodeBody(http.Response response) {
  final contentType = response.headers['content-type'] ?? '';
  if (contentType.contains('application/json') && response.body.isNotEmpty) {
    return jsonDecode(response.body);
  }
  if (response.body.isEmpty) {
    return null;
  }
  return response.body;
}

class ApiClient {
  ApiClient({
    required http.Client httpClient,
    required AppConfig config,
    List<ApiRequestInterceptor>? requestInterceptors,
    List<ApiResponseInterceptor>? responseInterceptors,
    Logger? logger,
  })  : _httpClient = httpClient,
        _config = config,
        _requestInterceptors = List.unmodifiable(requestInterceptors ?? const []),
        _responseInterceptors = List.unmodifiable(responseInterceptors ?? const []),
        _logger = logger ?? Logger('ApiClient');

  final http.Client _httpClient;
  final AppConfig _config;
  final List<ApiRequestInterceptor> _requestInterceptors;
  final List<ApiResponseInterceptor> _responseInterceptors;
  final Logger _logger;

  Uri _buildUri(String path, [Map<String, dynamic>? query]) {
    final normalizedPath = path.startsWith('/') ? path : '/$path';
    final base = _config.apiBaseUrl;
    final uri = Uri(
      scheme: base.scheme,
      host: base.host,
      port: base.hasPort ? base.port : null,
      path: '${base.path}$normalizedPath',
    );

    if (query == null || query.isEmpty) {
      return uri;
    }

    final sanitized = query.entries
        .where((entry) => entry.value != null)
        .map((entry) => MapEntry(entry.key, '${entry.value}'));

    return uri.replace(
      queryParameters: {
        ...uri.queryParameters,
        for (final entry in sanitized)
          if (entry.value.trim().isNotEmpty) entry.key: entry.value,
      },
    );
  }

  Map<String, String> _headers([Map<String, String>? override]) {
    return {
      HttpHeaders.acceptHeader: 'application/json',
      HttpHeaders.contentTypeHeader: 'application/json',
      if (override != null) ...override,
    };
  }

  Future<dynamic> get(
    String path, {
    Map<String, dynamic>? query,
    Map<String, String>? headers,
    Duration timeout = const Duration(seconds: 12),
  }) {
    return _send(
      method: 'GET',
      path: path,
      query: query,
      headers: headers,
      timeout: timeout,
    );
  }

  Future<dynamic> post(
    String path, {
    Object? body,
    Map<String, dynamic>? query,
    Map<String, String>? headers,
    Duration timeout = const Duration(seconds: 12),
  }) {
    return _send(
      method: 'POST',
      path: path,
      body: body,
      query: query,
      headers: headers,
      timeout: timeout,
    );
  }

  Future<dynamic> put(
    String path, {
    Object? body,
    Map<String, dynamic>? query,
    Map<String, String>? headers,
    Duration timeout = const Duration(seconds: 12),
  }) {
    return _send(
      method: 'PUT',
      path: path,
      body: body,
      query: query,
      headers: headers,
      timeout: timeout,
    );
  }

  Future<dynamic> patch(
    String path, {
    Object? body,
    Map<String, dynamic>? query,
    Map<String, String>? headers,
    Duration timeout = const Duration(seconds: 12),
  }) {
    return _send(
      method: 'PATCH',
      path: path,
      body: body,
      query: query,
      headers: headers,
      timeout: timeout,
    );
  }

  Future<dynamic> delete(
    String path, {
    Object? body,
    Map<String, dynamic>? query,
    Map<String, String>? headers,
    Duration timeout = const Duration(seconds: 12),
  }) {
    return _send(
      method: 'DELETE',
      path: path,
      body: body,
      query: query,
      headers: headers,
      timeout: timeout,
    );
  }

  Future<dynamic> _send({
    required String method,
    required String path,
    Object? body,
    Map<String, dynamic>? query,
    Map<String, String>? headers,
    Duration timeout = const Duration(seconds: 12),
  }) async {
    final uri = _buildUri(path, query);
    final mergedHeaders = _headers(headers);
    final context = ApiRequestContext(
      method: method,
      uri: uri,
      headers: mergedHeaders,
      body: body,
    );

    for (final interceptor in _requestInterceptors) {
      await interceptor(context);
    }

    final encodedBody = context.body == null ? null : jsonEncode(context.body);

    if (_config.enableNetworkLogging) {
      _logger.fine('[${context.method}] ${context.uri}');
      if (context.body != null) {
        _logger.finer(context.body);
      }
    }

    late http.Response response;
    switch (context.method) {
      case 'GET':
        response = await _httpClient
            .get(context.uri, headers: context.headers)
            .timeout(timeout);
        break;
      case 'POST':
        response = await _httpClient
            .post(context.uri, headers: context.headers, body: encodedBody)
            .timeout(timeout);
        break;
      case 'PUT':
        response = await _httpClient
            .put(context.uri, headers: context.headers, body: encodedBody)
            .timeout(timeout);
        break;
      case 'DELETE':
        response = await _httpClient
            .delete(context.uri, headers: context.headers, body: encodedBody)
            .timeout(timeout);
        break;
      default:
        throw UnsupportedError('Unsupported HTTP method: ${context.method}');
    }

    final decodedBody = _decodeBody(response);

    final responseContext = ApiResponseContext(response, decodedBody);
    for (final interceptor in _responseInterceptors) {
      await interceptor(responseContext);
    }

    if (_config.enableNetworkLogging) {
      _logger.fine('[${response.statusCode}] ${context.method} ${context.uri}');
    }

    if (response.statusCode >= 200 && response.statusCode < 300) {
      return decodedBody;
    }

    throw ApiException(
      response.statusCode,
      decodedBody is Map ? decodedBody['message'] ?? 'Request failed' : 'Request failed',
      decodedBody,
    );
  }

  void dispose() {
    _httpClient.close();
  }
}

ApiClient createApiClient(AppConfig config) {
  final client = http.Client();
  return ApiClient(httpClient: client, config: config);
}
