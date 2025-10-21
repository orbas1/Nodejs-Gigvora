/// Re-export of the shared in-memory cache used across repository tests.
///
/// Keeping the implementation in a single location prevents divergence between
/// helper imports (`test/helpers/*`) and the broader support utilities.
export '../support/test_offline_cache.dart' show InMemoryOfflineCache;
