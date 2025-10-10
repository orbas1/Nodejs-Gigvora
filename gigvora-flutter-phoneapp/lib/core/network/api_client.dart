import 'dart:convert';
import 'dart:io';

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

class ApiClient {
  ApiClient(this._httpClient);

  final http.Client _httpClient;

  Uri _buildUri(String path, [Map<String, dynamic>? query]) {
    final normalizedPath = path.startsWith('/') ? path : '/$path';
    final baseUri = Uri.parse(AppConfig.apiBaseUrl);
    final uri = Uri(
      scheme: baseUri.scheme,
      host: baseUri.host,
      port: baseUri.port,
      path: '${baseUri.path}$normalizedPath',
    );
    if (query == null) {
      return uri;
    }
    final filtered = query.entries.where((entry) => entry.value != null && '${entry.value}'.isNotEmpty);
    return uri.replace(
      queryParameters: {
        ...uri.queryParameters,
        for (final entry in filtered) entry.key: '${entry.value}',
      },
    );
  }

  Map<String, String> _headers([Map<String, String>? override]) {
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      if (override != null) ...override,
    };
  }

  Future<dynamic> get(
    String path, {
    Map<String, dynamic>? query,
    Map<String, String>? headers,
    Duration timeout = const Duration(seconds: 12),
  }) async {
    final response = await _httpClient
        .get(_buildUri(path, query), headers: _headers(headers))
        .timeout(timeout);
    return _handleResponse(response);
  }

  Future<dynamic> post(
    String path, {
    Object? body,
    Map<String, dynamic>? query,
    Map<String, String>? headers,
    Duration timeout = const Duration(seconds: 12),
  }) async {
    final response = await _httpClient
        .post(
          _buildUri(path, query),
          headers: _headers(headers),
          body: jsonEncode(body ?? <String, dynamic>{}),
        )
        .timeout(timeout);
    return _handleResponse(response);
  }

  dynamic _handleResponse(http.Response response) {
    final contentType = response.headers['content-type'] ?? '';
    dynamic body;
    if (contentType.contains('application/json') && response.body.isNotEmpty) {
      body = jsonDecode(response.body);
    } else if (response.body.isNotEmpty) {
      body = response.body;
    }

    if (response.statusCode >= 200 && response.statusCode < 300) {
      return body;
    }

    throw ApiException(response.statusCode, body is Map ? body['message'] ?? 'Request failed' : 'Request failed', body);
  }

  void dispose() {
    _httpClient.close();
  }
}

ApiClient createApiClient() {
  final client = http.Client();
  return ApiClient(client);
}
