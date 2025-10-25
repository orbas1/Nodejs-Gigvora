import 'package:flutter/material.dart';
import 'package:gigvora_design_system/gigvora_design_system.dart';

import 'status_palette.dart';

Color parseDesignColor(String hex) {
  final buffer = StringBuffer();
  if (hex.length == 6 || hex.length == 7) {
    buffer.write('ff');
  }
  buffer.write(hex.replaceFirst('#', ''));
  return Color(int.parse(buffer.toString(), radix: 16));
}

class AppThemeBundle {
  const AppThemeBundle({
    required this.light,
    required this.dark,
    required this.tokens,
    required this.statusPalette,
  });

  factory AppThemeBundle.fromGigvoraTheme(GigvoraTheme theme) {
    final tokens = theme.tokens;
    final light = _applyExtensions(
      theme.toThemeData(brightness: Brightness.light),
      tokens,
    );
    final darkBase = theme.toThemeData(brightness: Brightness.dark);
    final dark = _applyExtensions(
      darkBase.copyWith(
        colorScheme: darkBase.colorScheme.copyWith(
          surface: parseDesignColor(tokens.colors['onSurface']!),
          onSurface: parseDesignColor(tokens.colors['surface']!),
          background: parseDesignColor(tokens.colors['onSurface']!).withOpacity(0.92),
          onBackground: parseDesignColor(tokens.colors['surface']!),
        ),
        scaffoldBackgroundColor: parseDesignColor(tokens.colors['onSurface']!).withOpacity(0.94),
      ),
      tokens,
    );

    return AppThemeBundle(
      light: light,
      dark: dark,
      tokens: tokens,
      statusPalette: StatusPalette.fromTokens(tokens),
    );
  }

  final ThemeData light;
  final ThemeData dark;
  final DesignTokens tokens;
  final StatusPalette statusPalette;
}

ThemeData _applyExtensions(ThemeData data, DesignTokens tokens) {
  final spacing = GigvoraSpacing(tokens.spacing);
  final radius = GigvoraRadius(tokens.radius);
  final extensions = Map<Object, ThemeExtension<dynamic>>.from(data.extensions);
  extensions[GigvoraSpacing] = spacing;
  extensions[GigvoraRadius] = radius;
  return data.copyWith(extensions: extensions);
}

class GigvoraSpacing extends ThemeExtension<GigvoraSpacing> {
  const GigvoraSpacing(this.tokens);

  final SpacingTokens tokens;

  double operator [](String key) => tokens[key];

  @override
  GigvoraSpacing copyWith({SpacingTokens? tokens}) {
    return GigvoraSpacing(tokens ?? this.tokens);
  }

  @override
  GigvoraSpacing lerp(ThemeExtension<GigvoraSpacing>? other, double t) {
    if (other is! GigvoraSpacing) {
      return this;
    }
    return t < 0.5 ? this : other;
  }
}

class GigvoraRadius extends ThemeExtension<GigvoraRadius> {
  const GigvoraRadius(this.tokens);

  final RadiusTokens tokens;

  double operator [](String key) => tokens[key];

  @override
  GigvoraRadius copyWith({RadiusTokens? tokens}) {
    return GigvoraRadius(tokens ?? this.tokens);
  }

  @override
  GigvoraRadius lerp(ThemeExtension<GigvoraRadius>? other, double t) {
    if (other is! GigvoraRadius) {
      return this;
    }
    return t < 0.5 ? this : other;
  }
}
