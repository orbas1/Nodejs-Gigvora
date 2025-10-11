class RepositoryResult<T> {
  RepositoryResult({
    required this.data,
    this.fromCache = false,
    this.lastUpdated,
    this.error,
  });

  final T data;
  final bool fromCache;
  final DateTime? lastUpdated;
  final Object? error;

  bool get hasError => error != null;

  RepositoryResult<T> copyWith({
    T? data,
    bool? fromCache,
    DateTime? lastUpdated,
    Object? error,
  }) {
    return RepositoryResult<T>(
      data: data ?? this.data,
      fromCache: fromCache ?? this.fromCache,
      lastUpdated: lastUpdated ?? this.lastUpdated,
      error: error ?? this.error,
    );
  }
}
