import 'dart:async';
import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:gigvora_foundation/gigvora_foundation.dart';
import 'package:http/http.dart' as http;
import 'package:logging/logging.dart';

typedef _RequestHandler = Future<http.Response> Function(
  http.BaseRequest request,
  List<int> bodyBytes,
);

class _StubHttpClient extends http.BaseClient {
  _StubHttpClient(this._handler);

  final _RequestHandler _handler;
  bool closed = false;

  @override
  Future<http.StreamedResponse> send(http.BaseRequest request) async {
    final payload = await request.finalize().toBytes();
    final response = await _handler(request, payload);
    return http.StreamedResponse(
      Stream<List<int>>.value(response.bodyBytes),
      response.statusCode,
      headers: response.headers,
      reasonPhrase: response.reasonPhrase,
      request: request,
      isRedirect: response.isRedirect,
    );
  }

  @override
  void close() {
    closed = true;
  }
}

AppConfig _createConfig() {
  return AppConfig(
    environment: AppEnvironment.development,
    apiBaseUrl: Uri.parse('https://api.dev.gigvora.com/api'),
    graphQlEndpoint: Uri.parse('https://api.dev.gigvora.com/graphql'),
    graphQlSubscriptionEndpoint: Uri.parse('wss://api.dev.gigvora.com/graphql'),
    realtimeEndpoint: Uri.parse('wss://ws.dev.gigvora.com'),
    defaultCacheTtl: const Duration(minutes: 5),
    enableNetworkLogging: true,
    analyticsFlushThreshold: 25,
    offlineCacheNamespace: 'gigvora_dev_cache',
    featureFlags: const {'feature': true},
    featureFlagRefreshInterval: const Duration(minutes: 5),
  );
}

void main() {
  group('AppConfig', () {
    test('exposes environment helpers', () {
      final baseConfig = _createConfig();
      expect(baseConfig.isDevelopment, isTrue);
      expect(baseConfig.isStaging, isFalse);
      expect(baseConfig.isProduction, isFalse);

      final staging = baseConfig.copyWith(environment: AppEnvironment.staging);
      expect(staging.isStaging, isTrue);
    });

    test('copyWith overrides selected fields while preserving defaults', () {
      final baseConfig = _createConfig();
      final copy = baseConfig.copyWith(
        apiBaseUrl: Uri.parse('https://api.prod.gigvora.com/api'),
        offlineCacheNamespace: 'gigvora_prod_cache',
        analyticsFlushThreshold: 40,
      );

      expect(copy.apiBaseUrl.toString(), 'https://api.prod.gigvora.com/api');
      expect(copy.offlineCacheNamespace, 'gigvora_prod_cache');
      expect(copy.analyticsFlushThreshold, 40);
      expect(copy.graphQlEndpoint, baseConfig.graphQlEndpoint);
      expect(copy.featureFlags, baseConfig.featureFlags);
    });
  });

  group('ApiClient', () {
    test('sends PATCH requests with JSON body and decodes responses', () async {
      final requests = <http.BaseRequest>[];
      final bodies = <String>[];
      final client = _StubHttpClient((request, bodyBytes) async {
        requests.add(request);
        bodies.add(utf8.decode(bodyBytes));
        return http.Response(
          jsonEncode({'status': 'ok'}),
          200,
          headers: {'content-type': 'application/json'},
        );
      });

      final apiClient = ApiClient(httpClient: client, config: _createConfig());
      final response = await apiClient.patch(
        '/v1/profile',
        body: {'displayName': 'Gigvora'},
      );

      expect(response, {'status': 'ok'});
      expect(requests, hasLength(1));
      expect(requests.single.method, 'PATCH');
      expect(requests.single.url.toString(), 'https://api.dev.gigvora.com/api/v1/profile');
      expect(jsonDecode(bodies.single), {'displayName': 'Gigvora'});

      apiClient.dispose();
      expect(client.closed, isTrue);
    });

    test('applies request and response interceptors', () async {
      final seenHeaders = <String, String>{};
      final responseStatuses = <int>[];
      final client = _StubHttpClient((request, bodyBytes) async {
        seenHeaders.addAll(request.headers);
        expect(utf8.decode(bodyBytes), 'raw-body');
        return http.Response(
          jsonEncode({'result': 'ok'}),
          200,
          headers: {'content-type': 'application/json'},
        );
      });

      final apiClient = ApiClient(
        httpClient: client,
        config: _createConfig(),
        requestInterceptors: [
          (context) async {
            context.headers['Authorization'] = 'Bearer token-123';
            context.body = 'raw-body';
          },
        ],
        responseInterceptors: [
          (context) async {
            responseStatuses.add(context.response.statusCode);
          },
        ],
      );

      final response = await apiClient.post('/v1/metrics');

      expect(response, {'result': 'ok'});
      expect(seenHeaders['Authorization'], 'Bearer token-123');
      expect(responseStatuses.single, 200);

      apiClient.dispose();
    });

    test('head resolves without decoding payloads', () async {
      final client = _StubHttpClient((request, bodyBytes) async {
        expect(request.method, 'HEAD');
        expect(bodyBytes, isEmpty);
        return http.Response('', 200, headers: {'content-type': 'application/json'});
      });

      final apiClient = ApiClient(httpClient: client, config: _createConfig());
      final response = await apiClient.head('/v1/ping');

      expect(response, isNull);

      apiClient.dispose();
    });

    test('throws ApiException with backend message on failure', () async {
      final client = _StubHttpClient((request, bodyBytes) async {
        return http.Response(
          jsonEncode({'message': 'Not allowed'}),
          403,
          headers: {'content-type': 'application/json'},
        );
      });

      final apiClient = ApiClient(httpClient: client, config: _createConfig());

      expect(
        () => apiClient.delete('/v1/resources', body: {'id': 'abc'}),
        throwsA(
          isA<ApiException>()
              .having((error) => error.statusCode, 'statusCode', 403)
              .having((error) => error.message, 'message', 'Not allowed')
              .having((error) => error.body, 'body', {'message': 'Not allowed'}),
        ),
      );

      apiClient.dispose();
    });
  });

  group('Date formatting utilities', () {
    test('returns concise labels for past timestamps', () {
      final anchor = DateTime.utc(2024, 1, 1, 12, 0);

      expect(formatRelativeTime(anchor.subtract(const Duration(seconds: 30)), reference: anchor), 'just now');
      expect(formatRelativeTime(anchor.subtract(const Duration(minutes: 5)), reference: anchor), '5m ago');
      expect(formatRelativeTime(anchor.subtract(const Duration(hours: 12)), reference: anchor), '12h ago');
      expect(formatRelativeTime(anchor.subtract(const Duration(days: 3)), reference: anchor), '3d ago');
      expect(formatRelativeTime(anchor.subtract(const Duration(days: 10)), reference: anchor), '1w ago');
      expect(formatRelativeTime(anchor.subtract(const Duration(days: 65)), reference: anchor), '2mo ago');
      expect(formatRelativeTime(anchor.subtract(const Duration(days: 500)), reference: anchor), '1y ago');
    });

    test('handles future timestamps gracefully', () {
      final anchor = DateTime.utc(2024, 1, 1, 12, 0);

      expect(formatRelativeTime(anchor.add(const Duration(seconds: 20)), reference: anchor), 'in a moment');
      expect(formatRelativeTime(anchor.add(const Duration(minutes: 2)), reference: anchor), 'in 2m');
      expect(formatRelativeTime(anchor.add(const Duration(hours: 6)), reference: anchor), 'in 6h');
      expect(formatRelativeTime(anchor.add(const Duration(days: 2)), reference: anchor), 'in 2d');
      expect(formatRelativeTime(anchor.add(const Duration(days: 18)), reference: anchor), 'in 2w');
      expect(formatRelativeTime(anchor.add(const Duration(days: 300)), reference: anchor), 'in 10mo');
    });
  });

  group('RealtimeGateway', () {
    test('recovers from connector failures without surfacing unhandled errors', () async {
      final gateway = RealtimeGateway(
        config: _createConfig(),
        reconnectBaseDelay: const Duration(milliseconds: 10),
        logger: Logger.detached('test-realtime'),
        connector: (uri, {protocols, headers}) {
          throw Exception('socket offline');
        },
      );

      gateway.streamFor('alerts');

      await gateway.ensureConnected();
      await Future<void>.delayed(const Duration(milliseconds: 20));

      expect(gateway.status, RealtimeConnectionState.disconnected);

      await gateway.dispose();
    });
  });
}
