class ResourceState<T> {
  const ResourceState({
    this.data,
    this.loading = false,
    this.error,
    this.fromCache = false,
    this.lastUpdated,
    Map<String, dynamic>? metadata,
  }) : metadata = metadata ?? const <String, dynamic>{};

  final T? data;
  final bool loading;
  final Object? error;
  final bool fromCache;
  final DateTime? lastUpdated;
  final Map<String, dynamic> metadata;

  bool get hasError => error != null;
  bool get hasData => data != null;
  bool get isFresh => !fromCache && !loading;

  ResourceState<T> copyWith({
    T? data,
    bool? loading,
    Object? error = _sentinel,
    bool? fromCache,
    DateTime? lastUpdated,
    Map<String, dynamic>? metadata,
  }) {
    return ResourceState<T>(
      data: data ?? this.data,
      loading: loading ?? this.loading,
      error: identical(error, _sentinel) ? this.error : error,
      fromCache: fromCache ?? this.fromCache,
      lastUpdated: lastUpdated ?? this.lastUpdated,
      metadata: metadata ?? this.metadata,
    );
  }

  static const _sentinel = Object();

  factory ResourceState.loading([T? data, Map<String, dynamic>? metadata]) {
    return ResourceState<T>(
      data: data,
      loading: true,
      error: null,
      fromCache: false,
      lastUpdated: null,
      metadata: metadata,
    );
  }

  factory ResourceState.error(
    Object error, {
    T? data,
    bool fromCache = false,
    DateTime? lastUpdated,
    Map<String, dynamic>? metadata,
  }) {
    return ResourceState<T>(
      data: data,
      loading: false,
      error: error,
      fromCache: fromCache,
      lastUpdated: lastUpdated,
      metadata: metadata,
    );
  }
}
