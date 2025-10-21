import 'package:gigvora_foundation/gigvora_foundation.dart';
import 'package:http/http.dart' as http;

import 'test_dependencies.dart';

class NoopApiClient extends ApiClient {
  NoopApiClient()
      : super(
          httpClient: _NoopHttpClient(),
          config: testAppConfig,
        );
}

class _NoopHttpClient extends http.BaseClient {
  @override
  Future<http.StreamedResponse> send(http.BaseRequest request) {
    throw UnimplementedError('Network access is disabled in NoopApiClient');
  }
}
