import 'dart:async';

import 'package:gigvora_foundation/gigvora_foundation.dart';

class TestFeatureFlagService implements FeatureFlagService {
  TestFeatureFlagService({
    Map<String, dynamic>? initialFlags,
    Duration refreshInterval = const Duration(minutes: 5),
  })  : _flags = Map<String, dynamic>.from(initialFlags ?? const <String, dynamic>{}),
        _refreshInterval = refreshInterval;

  final StreamController<Map<String, dynamic>> _controller =
      StreamController<Map<String, dynamic>>.broadcast();
  Map<String, dynamic> _flags;
  final Duration _refreshInterval;
  bool _disposed = false;

  @override
  Duration get refreshInterval => _refreshInterval;

  @override
  Stream<Map<String, dynamic>> get stream => _controller.stream;

  @override
  Map<String, dynamic> get snapshot => Map<String, dynamic>.unmodifiable(_flags);

  @override
  Future<Map<String, dynamic>> bootstrap({bool forceRefresh = false}) async {
    _ensureNotDisposed();
    _controller.add(snapshot);
    return snapshot;
  }

  @override
  Future<Map<String, dynamic>> refreshFlags() async {
    _ensureNotDisposed();
    _controller.add(snapshot);
    return snapshot;
  }

  @override
  bool isEnabled(String flag, {bool defaultValue = false}) {
    _ensureNotDisposed();
    final value = _flags[flag];
    if (value is bool) {
      return value;
    }
    if (value is String) {
      final lowered = value.toLowerCase();
      if (lowered == 'true') {
        return true;
      }
      if (lowered == 'false') {
        return false;
      }
    }
    return defaultValue;
  }

  @override
  T? value<T>(String flag) {
    _ensureNotDisposed();
    final value = _flags[flag];
    if (value is T) {
      return value;
    }
    return null;
  }

  @override
  Future<void> overrideLocal(String flag, dynamic value) async {
    _ensureNotDisposed();
    _flags = {
      ..._flags,
      flag: value,
    };
    _controller.add(snapshot);
  }

  @override
  Future<void> dispose() async {
    if (_disposed) {
      return;
    }
    _disposed = true;
    await _controller.close();
  }

  void setFlags(Map<String, dynamic> flags) {
    _ensureNotDisposed();
    _flags = Map<String, dynamic>.from(flags);
    _controller.add(snapshot);
  }

  void _ensureNotDisposed() {
    if (_disposed) {
      throw StateError('TestFeatureFlagService has been disposed.');
    }
  }
}
