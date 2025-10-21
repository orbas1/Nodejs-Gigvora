import 'dart:async';

import 'package:gigvora_foundation/gigvora_foundation.dart';

class GraphQLInvocation {
  GraphQLInvocation({
    required this.document,
    this.operationName,
    this.variables,
    this.forceRefresh = false,
  });

  final String document;
  final String? operationName;
  final Map<String, dynamic>? variables;
  final bool forceRefresh;
}

class TestGraphQLGateway implements GraphQLGateway {
  TestGraphQLGateway({
    this.onQuery,
    this.onMutate,
  });

  final Future<RepositoryResult<Map<String, dynamic>>> Function(GraphQLInvocation request)?
      onQuery;
  final Future<RepositoryResult<Map<String, dynamic>>> Function(GraphQLInvocation request)?
      onMutate;

  final List<GraphQLInvocation> queryInvocations = <GraphQLInvocation>[];
  final List<GraphQLInvocation> mutationInvocations = <GraphQLInvocation>[];

  bool disposed = false;

  @override
  Future<RepositoryResult<Map<String, dynamic>>> query(
    String document, {
    String? operationName,
    Map<String, dynamic>? variables,
    bool forceRefresh = false,
    Duration? cacheTtl,
  }) async {
    _ensureNotDisposed();
    final invocation = GraphQLInvocation(
      document: document,
      operationName: operationName,
      variables: variables == null ? null : Map<String, dynamic>.from(variables),
      forceRefresh: forceRefresh,
    );
    queryInvocations.add(invocation);
    if (onQuery != null) {
      return onQuery!(invocation);
    }
    return RepositoryResult<Map<String, dynamic>>(
      data: const <String, dynamic>{},
      fromCache: false,
      lastUpdated: DateTime.now(),
    );
  }

  @override
  Future<RepositoryResult<Map<String, dynamic>>> mutate(
    String document, {
    String? operationName,
    Map<String, dynamic>? variables,
  }) async {
    _ensureNotDisposed();
    final invocation = GraphQLInvocation(
      document: document,
      operationName: operationName,
      variables: variables == null ? null : Map<String, dynamic>.from(variables),
    );
    mutationInvocations.add(invocation);
    if (onMutate != null) {
      return onMutate!(invocation);
    }
    return RepositoryResult<Map<String, dynamic>>(
      data: const <String, dynamic>{},
      fromCache: false,
      lastUpdated: DateTime.now(),
    );
  }

  @override
  Stream<Map<String, dynamic>> subscribe(
    String document, {
    String? operationName,
    Map<String, dynamic>? variables,
  }) {
    _ensureNotDisposed();
    return const Stream<Map<String, dynamic>>.empty();
  }

  @override
  Future<void> purgeCacheFor(
    String document, {
    String? operationName,
    Map<String, dynamic>? variables,
  }) async {
    _ensureNotDisposed();
  }

  @override
  Future<void> dispose() async {
    disposed = true;
  }

  void _ensureNotDisposed() {
    if (disposed) {
      throw StateError('GraphQL gateway disposed');
    }
  }
}
