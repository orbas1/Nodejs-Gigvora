class AppConfig {
  const AppConfig._();

  static const apiBaseUrl = String.fromEnvironment(
    'GIGVORA_API_URL',
    defaultValue: 'http://localhost:4000/api',
  );

  static const defaultCacheTtl = Duration(minutes: 5);
}
