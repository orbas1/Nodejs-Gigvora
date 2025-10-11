import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../tokens/design_tokens.dart';

class GigvoraThemeLoader {
  GigvoraThemeLoader({DesignTokenLoader? loader})
      : _loader = loader ?? DesignTokenLoader();

  final DesignTokenLoader _loader;

  Future<GigvoraTheme> loadBlue() async {
    final tokens = await _loader.loadBlueTokens();
    return GigvoraTheme(tokens: tokens);
  }

  Future<ThemeData> loadBlueThemeData() async {
    final theme = await loadBlue();
    return theme.toThemeData();
  }
}

class GigvoraTheme {
  GigvoraTheme({required this.tokens});

  final DesignTokens tokens;

  ThemeData toThemeData({Brightness brightness = Brightness.light}) {
    final colorScheme = _buildColorScheme(brightness);
    final textTheme = _buildTextTheme();

    final base = ThemeData(
      colorScheme: colorScheme,
      useMaterial3: true,
      brightness: brightness,
      scaffoldBackgroundColor: _parseColor(tokens.colors['background']!),
      textTheme: textTheme,
      applyElevationOverlayColor: brightness == Brightness.dark,
    );

    return base.copyWith(
      appBarTheme: AppBarTheme(
        backgroundColor: colorScheme.surface,
        foregroundColor: colorScheme.onSurface,
        elevation: 0,
        surfaceTintColor: Colors.transparent,
        titleTextStyle: textTheme.titleMedium,
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: colorScheme.primary,
          foregroundColor: colorScheme.onPrimary,
          padding: EdgeInsets.symmetric(
            horizontal: tokens.spacing['lg'],
            vertical: tokens.spacing['sm'],
          ),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(tokens.radius['md']),
          ),
          textStyle: textTheme.labelLarge?.copyWith(fontWeight: FontWeight.w600),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: colorScheme.primary,
          side: BorderSide(
            color: _parseColor(tokens.colors['primaryContainer']!),
          ),
          padding: EdgeInsets.symmetric(
            horizontal: tokens.spacing['lg'],
            vertical: tokens.spacing['sm'],
          ),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(tokens.radius['md']),
          ),
          textStyle: textTheme.labelLarge?.copyWith(fontWeight: FontWeight.w600),
        ),
      ),
      chipTheme: base.chipTheme.copyWith(
        backgroundColor: _parseColor(tokens.colors['surfaceVariant']!),
        labelStyle: textTheme.labelMedium?.copyWith(
          color: colorScheme.primary,
          fontWeight: FontWeight.w600,
        ),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(tokens.radius['lg']),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: _parseColor(tokens.colors['background']!),
        contentPadding: EdgeInsets.symmetric(
          horizontal: tokens.spacing['md'],
          vertical: tokens.spacing['sm'],
        ),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(tokens.radius['md']),
          borderSide: BorderSide(color: _parseColor(tokens.colors['surfaceVariant']!)),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(tokens.radius['md']),
          borderSide: BorderSide(color: _parseColor(tokens.colors['surfaceVariant']!)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(tokens.radius['md']),
          borderSide: BorderSide(color: colorScheme.primary, width: 1.4),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(tokens.radius['md']),
          borderSide: BorderSide(color: colorScheme.error, width: 1.2),
        ),
        labelStyle: textTheme.bodyMedium?.copyWith(
          color: _parseColor(tokens.colors['onSurfaceVariant']!),
        ),
      ),
      snackBarTheme: SnackBarThemeData(
        backgroundColor: _parseColor('#1E293B'),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(tokens.radius['md']),
        ),
        contentTextStyle: textTheme.bodyMedium?.copyWith(
          color: colorScheme.onPrimary,
          fontWeight: FontWeight.w600,
        ),
      ),
      cardTheme: CardTheme(
        elevation: 2,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(tokens.radius['lg']),
        ),
        margin: EdgeInsets.zero,
        clipBehavior: Clip.antiAlias,
      ),
      dividerTheme: DividerThemeData(
        color: _parseColor(tokens.colors['surfaceVariant']!).withOpacity(tokens.opacity['border']),
      ),
    );
  }

  ColorScheme _buildColorScheme(Brightness brightness) {
    final colors = tokens.colors;
    final seed = _parseColor(colors['primary']!);
    final base = ColorScheme.fromSeed(seedColor: seed, brightness: brightness);

    final primary = _parseColor(colors['primary']!);
    final onPrimary = _parseColor(colors['onPrimary']!);
    final secondary = _parseColor(colors['secondary']!);
    final onSecondary = _parseColor(colors['onSecondary']!);
    final tertiary = _parseColor(colors['tertiary']!);
    final onTertiary = _parseColor(colors['onTertiary']!);
    final surface = _parseColor(colors['surface']!);
    final onSurface = _parseColor(colors['onSurface']!);
    final background = _parseColor(colors['background']!);
    final onBackground = _parseColor(colors['onBackground']!);
    final surfaceVariant = _parseColor(colors['surfaceVariant']!);
    final onSurfaceVariant = _parseColor(colors['onSurfaceVariant']!);
    final error = _parseColor(colors['error']!);
    final onError = _parseColor(colors['onError']!);

    return base.copyWith(
      primary: primary,
      onPrimary: onPrimary,
      secondary: secondary,
      onSecondary: onSecondary,
      tertiary: tertiary,
      onTertiary: onTertiary,
      background: background,
      onBackground: onBackground,
      surface: surface,
      onSurface: onSurface,
      surfaceVariant: surfaceVariant,
      onSurfaceVariant: onSurfaceVariant,
      error: error,
      onError: onError,
      primaryContainer: _parseColor(colors['primaryContainer']!),
      secondaryContainer: _parseColor(colors['secondaryContainer']!),
      tertiaryContainer: tertiary.withOpacity(0.08),
      onTertiaryContainer: onTertiary,
      errorContainer: error.withOpacity(0.12),
      onErrorContainer: onError,
      outline: surfaceVariant,
      outlineVariant: surfaceVariant.withOpacity(tokens.opacity['border']),
      surfaceTint: primary,
      shadow: Colors.black.withOpacity(0.16),
      scrim: Colors.black.withOpacity(0.32),
      inverseSurface: onSurface,
      onInverseSurface: surface,
      inversePrimary: onPrimary,
    );
  }

  TextTheme _buildTextTheme() {
    final typography = tokens.typography;
    final base = GoogleFonts.getTextTheme(typography.fontFamily);

    TextStyle resolve(TypographyStyle style) {
      final weightIndex = _resolveWeightIndex(style.weight);
      final weights = const [
        FontWeight.w100,
        FontWeight.w200,
        FontWeight.w300,
        FontWeight.w400,
        FontWeight.w500,
        FontWeight.w600,
        FontWeight.w700,
        FontWeight.w800,
        FontWeight.w900,
      ];
      return TextStyle(
        fontFamily: typography.fontFamily,
        fontSize: style.size,
        height: style.lineHeight / style.size,
        fontWeight: weights[weightIndex],
        color: _parseColor(tokens.colors['onSurface']!),
      );
    }

    return base.copyWith(
      displayLarge: resolve(typography.display),
      displayMedium: resolve(typography.display).copyWith(fontSize: typography.display.size * 0.85),
      headlineMedium: resolve(typography.headline),
      headlineSmall: resolve(typography.headline).copyWith(fontSize: typography.headline.size * 0.85),
      titleLarge: resolve(typography.title),
      titleMedium: resolve(typography.title).copyWith(fontSize: typography.title.size * 0.85),
      bodyLarge: resolve(typography.body),
      bodyMedium: resolve(typography.body).copyWith(fontSize: typography.body.size),
      labelLarge: resolve(typography.label),
      labelMedium: resolve(typography.label).copyWith(fontSize: typography.label.size * 0.9),
    );
  }
}

Color _parseColor(String hex) {
  final buffer = StringBuffer();
  if (hex.length == 6 || hex.length == 7) buffer.write('ff');
  buffer.write(hex.replaceFirst('#', ''));
  return Color(int.parse(buffer.toString(), radix: 16));
}

int _resolveWeightIndex(int weight) {
  final normalized = ((weight - 100) / 100).round();
  if (normalized < 0) {
    return 0;
  }
  if (normalized > 8) {
    return 8;
  }
  return normalized;
}
