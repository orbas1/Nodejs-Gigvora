class ResourceState<T> {
  const ResourceState({
    this.data,
    this.loading = false,
    this.error,
    this.fromCache = false,
    this.lastUpdated,
  });

  final T? data;
  final bool loading;
  final Object? error;
  final bool fromCache;
  final DateTime? lastUpdated;

  bool get hasError => error != null;
  bool get hasData => data != null;

  ResourceState<T> copyWith({
    T? data,
    bool? loading,
    Object? error = _sentinel,
    bool? fromCache,
    DateTime? lastUpdated,
  }) {
    return ResourceState<T>(
      data: data ?? this.data,
      loading: loading ?? this.loading,
      error: identical(error, _sentinel) ? this.error : error,
      fromCache: fromCache ?? this.fromCache,
      lastUpdated: lastUpdated ?? this.lastUpdated,
    );
  }

  static const _sentinel = Object();

  factory ResourceState.loading([T? data]) {
    return ResourceState<T>(
      data: data,
      loading: true,
      error: null,
      fromCache: false,
      lastUpdated: null,
    );
  }

  factory ResourceState.error(Object error, {T? data, bool fromCache = false, DateTime? lastUpdated}) {
    return ResourceState<T>(
      data: data,
      loading: false,
      error: error,
      fromCache: fromCache,
      lastUpdated: lastUpdated,
    );
  }
}
