import 'package:gigvora_design_system/gigvora_design_system.dart';
import 'package:gigvora_foundation/gigvora_foundation.dart';

class ContinuityBootstrap {
  const ContinuityBootstrap({
    required this.version,
    required this.theme,
    this.components,
    this.routes,
    this.offline,
    this.metadata,
  });

  factory ContinuityBootstrap.fromJson(Map<String, dynamic> json) {
    return ContinuityBootstrap(
      version: json['version'] as String? ?? 'unknown',
      theme: (json['theme'] as Map<String, dynamic>?) ?? const {},
      components: json['components'] as Map<String, dynamic>?,
      routes: json['routes'] as Map<String, dynamic>?,
      offline: json['offline'] as Map<String, dynamic>?,
      metadata: json['metadata'] as Map<String, dynamic>?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'version': version,
      'theme': theme,
      if (components != null) 'components': components,
      if (routes != null) 'routes': routes,
      if (offline != null) 'offline': offline,
      if (metadata != null) 'metadata': metadata,
    };
  }

  final String version;
  final Map<String, dynamic> theme;
  final Map<String, dynamic>? components;
  final Map<String, dynamic>? routes;
  final Map<String, dynamic>? offline;
  final Map<String, dynamic>? metadata;

  Map<String, dynamic> get _blueprint =>
      (theme['blueprint'] as Map<String, dynamic>?) ?? const {};

  Map<String, dynamic> get _modeDefinitions =>
      (_blueprint['modes'] as Map<String, dynamic>?) ?? const {};

  Map<String, dynamic> get _accentDefinitions =>
      (_blueprint['accents'] as Map<String, dynamic>?) ?? const {};

  Map<String, dynamic> get _densityScale =>
      (_blueprint['densityScale'] as Map<String, dynamic>?) ?? const {};

  Map<String, dynamic> get _spacingBase =>
      (_blueprint['spacing'] as Map<String, dynamic>?) ?? const {};

  String get defaultMode =>
      (theme['defaults'] as Map<String, dynamic>?)?['mode'] as String? ??
      'system';

  String get defaultAccent =>
      (theme['defaults'] as Map<String, dynamic>?)?['accent'] as String? ??
      'azure';

  String get defaultDensity =>
      (theme['defaults'] as Map<String, dynamic>?)?['density'] as String? ??
      'comfortable';

  double _resolveDensityScale(String key) {
    final value = _densityScale[key];
    if (value is num) {
      return value.toDouble();
    }
    return 1.0;
  }

  Map<String, String> _resolveModeColors(String mode) {
    final definition = _modeDefinitions[mode];
    if (definition is Map<String, dynamic>) {
      final colors = definition['colors'];
      if (colors is Map<String, dynamic>) {
        return colors.map((key, value) => MapEntry('$key', '$value'));
      }
    }
    return const {};
  }

  Map<String, dynamic> _resolveAccentPalette(String accent) {
    final definition = _accentDefinitions[accent];
    if (definition is Map<String, dynamic>) {
      return definition;
    }
    return const {};
  }

  Map<String, double> _resolveSpacing(double densityScale) {
    final result = <String, double>{};
    _spacingBase.forEach((key, value) {
      final numeric = value is num ? value.toDouble() : double.tryParse('$value');
      if (numeric != null) {
        result[key] = (numeric * densityScale).toDouble();
      }
    });
    return result;
  }

  DesignTokens applyToDesignTokens(DesignTokens base) {
    final modeKey = defaultMode == 'system' ? 'light' : defaultMode;
    final modeColors = _resolveModeColors(modeKey);
    final accentPalette = _resolveAccentPalette(defaultAccent);
    final densityScale = _resolveDensityScale(defaultDensity);

    final colors = Map<String, String>.from(base.colors.toMap());

    void assignColor(String key, dynamic value) {
      if (value is String && value.isNotEmpty) {
        colors[key] = value;
      }
    }

    assignColor('primary', accentPalette['accent']);
    assignColor('onPrimary', modeColors['textOnAccent'] ?? colors['onPrimary']);
    assignColor('primaryContainer', accentPalette['accentSoft'] ?? colors['primaryContainer']);
    assignColor('secondary', accentPalette['accentStrong'] ?? colors['secondary']);
    assignColor('background', modeColors['background']);
    assignColor('onBackground', modeColors['text']);
    assignColor('surface', modeColors['surface']);
    assignColor('onSurface', modeColors['text']);
    assignColor('surfaceVariant', modeColors['surfaceMuted'] ?? colors['surfaceVariant']);
    assignColor('onSurfaceVariant', modeColors['textMuted'] ?? colors['onSurfaceVariant']);

    final spacing = Map<String, double>.from(base.spacing.toMap());
    final resolvedSpacing = _resolveSpacing(densityScale);
    spacing.addAll(resolvedSpacing);

    return DesignTokens(
      name: base.name,
      version: base.version,
      description: base.description,
      colors: ColorTokens(colors),
      typography: base.typography,
      spacing: SpacingTokens(spacing),
      radius: base.radius,
      motion: base.motion,
      opacity: base.opacity,
    );
  }
}

class ContinuityBootstrapLoader {
  ContinuityBootstrapLoader({
    required OfflineCache cache,
    required ApiClient apiClient,
  })  : _cache = cache,
        _apiClient = apiClient;

  final OfflineCache _cache;
  final ApiClient _apiClient;

  static const cacheKey = 'platform:continuity:bootstrap';

  ContinuityBootstrap? readFromCache() {
    final entry = _cache.read<ContinuityBootstrap>(
      cacheKey,
      (raw) {
        if (raw is Map<String, dynamic>) {
          return ContinuityBootstrap.fromJson(raw);
        }
        return ContinuityBootstrap.fromJson({});
      },
    );
    return entry?.value;
  }

  Future<ContinuityBootstrap> load({bool forceRefresh = false}) async {
    ContinuityBootstrap? cached;
    if (!forceRefresh) {
      cached = readFromCache();
      if (cached != null) {
        return cached;
      }
    }

    try {
      final response = await _apiClient.get('/platform/continuity/bootstrap');
      final payload = response is Map<String, dynamic>
          ? (response['bootstrap'] as Map<String, dynamic>? ?? response)
          : <String, dynamic>{};
      final bootstrap = ContinuityBootstrap.fromJson(payload);
      await _cache.write(cacheKey, bootstrap.toJson(), ttl: const Duration(hours: 12));
      return bootstrap;
    } catch (error) {
      if (cached != null) {
        return cached;
      }
      rethrow;
    }
  }
}
