import 'dart:async';
import 'dart:convert';

import 'package:crypto/crypto.dart';
import 'package:graphql/client.dart';
import 'package:http/http.dart' as http;
import 'package:logging/logging.dart';

import '../cache/offline_cache.dart';
import '../config/app_config.dart';
import 'repository_result.dart';

typedef AuthTokenResolver = Future<String?> Function();

class GraphQLRequestException implements Exception {
  GraphQLRequestException(this.message, [this.errors = const []]);

  final String message;
  final List<GraphQLError> errors;

  factory GraphQLRequestException.fromOperation(OperationException exception) {
    if (exception.graphqlErrors.isNotEmpty) {
      final combinedMessage = exception.graphqlErrors.map((error) => error.message).join('; ');
      return GraphQLRequestException(combinedMessage, exception.graphqlErrors);
    }
    if (exception.linkException != null) {
      return GraphQLRequestException(exception.linkException.toString());
    }
    return GraphQLRequestException('Unknown GraphQL error occurred.');
  }

  @override
  String toString() => 'GraphQLRequestException($message)';
}

class GraphQLGateway {
  GraphQLGateway({
    required AppConfig config,
    required OfflineCache cache,
    required http.Client httpClient,
    AuthTokenResolver? authTokenResolver,
    Duration? defaultCacheTtl,
    Logger? logger,
  })  : _config = config,
        _cache = cache,
        _authTokenResolver = authTokenResolver,
        _defaultCacheTtl = defaultCacheTtl ?? const Duration(minutes: 3),
        _logger = logger ?? Logger('GraphQLGateway'),
        _client = _createClient(
          config: config,
          httpClient: httpClient,
          authTokenResolver: authTokenResolver,
        );

  final AppConfig _config;
  final OfflineCache _cache;
  final AuthTokenResolver? _authTokenResolver;
  final Duration _defaultCacheTtl;
  final Logger _logger;
  final GraphQLClient _client;
  bool _disposed = false;

  static GraphQLClient _createClient({
    required AppConfig config,
    required http.Client httpClient,
    AuthTokenResolver? authTokenResolver,
  }) {
    final httpLink = HttpLink(
      config.graphQlEndpoint.toString(),
      httpClient: httpClient,
    );

    Link link = httpLink;

    if (authTokenResolver != null) {
      final authLink = AuthLink(
        getToken: () async {
          final token = await authTokenResolver();
          if (token == null || token.isEmpty) {
            return null;
          }
          return 'Bearer $token';
        },
      );
      link = authLink.concat(link);
    }

    final subscriptionEndpoint = config.graphQlSubscriptionEndpoint;
    if (subscriptionEndpoint != null) {
      final wsLink = WebSocketLink(
        subscriptionEndpoint.toString(),
        config: SocketClientConfig(
          autoReconnect: true,
          inactivityTimeout: const Duration(minutes: 1),
          initialPayload: () async {
            if (authTokenResolver == null) {
              return const <String, dynamic>{};
            }
            final token = await authTokenResolver();
            if (token == null || token.isEmpty) {
              return const <String, dynamic>{};
            }
            return {
              'headers': {'Authorization': 'Bearer $token'},
            };
          },
        ),
      );
      link = Link.split((request) => request.isSubscription, wsLink, link);
    }

    return GraphQLClient(
      cache: GraphQLCache(store: InMemoryStore()),
      link: link,
      defaultPolicies: DefaultPolicies(
        query: Policies(fetch: FetchPolicy.networkFirst),
        watchQuery: Policies(fetch: FetchPolicy.cacheAndNetwork),
        mutate: Policies(fetch: FetchPolicy.networkOnly),
        subscribe: Policies(fetch: FetchPolicy.cacheAndNetwork),
      ),
    );
  }

  Future<RepositoryResult<Map<String, dynamic>>> query(
    String document, {
    String? operationName,
    Map<String, dynamic>? variables,
    bool forceRefresh = false,
    Duration? cacheTtl,
  }) async {
    _ensureNotDisposed();
    final cacheKey = _cacheKey('query', operationName, variables, document);
    final cached = _readCache(cacheKey);

    if (!forceRefresh && cached != null) {
      return RepositoryResult<Map<String, dynamic>>(
        data: cached.value,
        fromCache: true,
        lastUpdated: cached.storedAt,
      );
    }

    try {
      final result = await _client.query(
        QueryOptions(
          document: gql(document),
          operationName: operationName,
          variables: variables ?? const <String, dynamic>{},
          fetchPolicy: forceRefresh ? FetchPolicy.networkOnly : FetchPolicy.networkFirst,
        ),
      );

      if (result.hasException) {
        throw GraphQLRequestException.fromOperation(result.exception!);
      }

      final data = Map<String, dynamic>.from(result.data ?? const <String, dynamic>{});
      await _cache.write(
        cacheKey,
        data,
        ttl: cacheTtl ?? _defaultCacheTtl,
      );

      return RepositoryResult<Map<String, dynamic>>(
        data: data,
        fromCache: false,
        lastUpdated: DateTime.now(),
      );
    } catch (error, stackTrace) {
      _logger.warning('GraphQL query failed. Falling back to cache if available.', error, stackTrace);
      if (cached != null) {
        return RepositoryResult<Map<String, dynamic>>(
          data: cached.value,
          fromCache: true,
          lastUpdated: cached.storedAt,
          error: error,
        );
      }
      rethrow;
    }
  }

  Future<RepositoryResult<Map<String, dynamic>>> mutate(
    String document, {
    String? operationName,
    Map<String, dynamic>? variables,
  }) async {
    _ensureNotDisposed();
    try {
      final result = await _client.mutate(
        MutationOptions(
          document: gql(document),
          operationName: operationName,
          variables: variables ?? const <String, dynamic>{},
          fetchPolicy: FetchPolicy.networkOnly,
        ),
      );

      if (result.hasException) {
        throw GraphQLRequestException.fromOperation(result.exception!);
      }

      final data = Map<String, dynamic>.from(result.data ?? const <String, dynamic>{});
      return RepositoryResult<Map<String, dynamic>>(
        data: data,
        fromCache: false,
        lastUpdated: DateTime.now(),
      );
    } catch (error, stackTrace) {
      _logger.severe('GraphQL mutation failed', error, stackTrace);
      rethrow;
    }
  }

  Stream<Map<String, dynamic>> subscribe(
    String document, {
    String? operationName,
    Map<String, dynamic>? variables,
  }) {
    _ensureNotDisposed();
    final controller = StreamController<Map<String, dynamic>>();
    final subscription = _client
        .subscribe(
          SubscriptionOptions(
            document: gql(document),
            operationName: operationName,
            variables: variables ?? const <String, dynamic>{},
          ),
        )
        .listen(
      (result) {
        if (result.hasException) {
          controller.addError(GraphQLRequestException.fromOperation(result.exception!));
          return;
        }
        controller.add(Map<String, dynamic>.from(result.data ?? const <String, dynamic>{}));
      },
      onError: controller.addError,
      onDone: controller.close,
    );

    controller.onCancel = () {
      subscription.cancel();
    };

    return controller.stream;
  }

  Future<void> purgeCacheFor(
    String document, {
    String? operationName,
    Map<String, dynamic>? variables,
  }) {
    final cacheKey = _cacheKey('query', operationName, variables, document);
    return _cache.remove(cacheKey);
  }

  Future<void> dispose() async {
    if (_disposed) {
      return;
    }
    _disposed = true;
    await _client.dispose();
  }

  CacheEntry<Map<String, dynamic>>? _readCache(String cacheKey) {
    try {
      return _cache.read<Map<String, dynamic>>(cacheKey, (raw) {
        if (raw is Map<String, dynamic>) {
          return Map<String, dynamic>.from(raw);
        }
        if (raw is Map) {
          return raw.map((key, value) => MapEntry('$key', value));
        }
        return const <String, dynamic>{};
      });
    } catch (error, stackTrace) {
      _logger.warning('Failed to parse cached GraphQL payload', error, stackTrace);
      return null;
    }
  }

  String _cacheKey(
    String type,
    String? operationName,
    Map<String, dynamic>? variables,
    String document,
  ) {
    final builder = StringBuffer(type)
      ..write('::')
      ..write(operationName ?? 'anonymous')
      ..write('::');

    if (variables != null && variables.isNotEmpty) {
      builder.write(jsonEncode(_sorted(variables)));
    }

    builder
      ..write('::')
      ..write(document.trim());

    final digest = sha1.convert(utf8.encode(builder.toString()));
    return 'graphql:${_config.environment.name}:${digest.toString()}';
  }

  Map<String, dynamic> _sorted(Map<String, dynamic> input) {
    final sortedKeys = input.keys.toList()..sort();
    return {
      for (final key in sortedKeys)
        key: input[key] is Map<String, dynamic>
            ? _sorted(input[key] as Map<String, dynamic>)
            : input[key],
    };
  }

  void _ensureNotDisposed() {
    if (_disposed) {
      throw StateError('GraphQLGateway has been disposed.');
    }
  }
}
