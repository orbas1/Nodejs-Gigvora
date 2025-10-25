import 'package:flutter/material.dart';

/// Shared severity levels used across governance, support, and notification surfaces.
enum SeverityLevel { success, info, warning, danger, neutral }

/// Resolved colour pairing for a severity level.
class SeverityPalette {
  const SeverityPalette({
    required this.background,
    required this.foreground,
  });

  final Color background;
  final Color foreground;

  SeverityPalette withBackgroundOpacity(double opacity) {
    final clamped = opacity.clamp(0.0, 1.0);
    return SeverityPalette(
      background: background.withOpacity(clamped),
      foreground: foreground,
    );
  }
}

/// Maps severity tokens to shared colour/icon treatments so the mobile surfaces stay aligned.
class SeverityTheme {
  const SeverityTheme._();

  static SeverityPalette colors(ColorScheme colorScheme, SeverityLevel severity) {
    switch (severity) {
      case SeverityLevel.success:
        return SeverityPalette(
          background: colorScheme.primaryContainer,
          foreground: colorScheme.onPrimaryContainer,
        );
      case SeverityLevel.info:
        return SeverityPalette(
          background: colorScheme.secondaryContainer,
          foreground: colorScheme.onSecondaryContainer,
        );
      case SeverityLevel.warning:
        return SeverityPalette(
          background: colorScheme.tertiaryContainer,
          foreground: colorScheme.onTertiaryContainer,
        );
      case SeverityLevel.danger:
        return SeverityPalette(
          background: colorScheme.errorContainer,
          foreground: colorScheme.onErrorContainer,
        );
      case SeverityLevel.neutral:
        return SeverityPalette(
          background: colorScheme.surfaceVariant,
          foreground: colorScheme.onSurfaceVariant,
        );
    }
  }

  static IconData icon(SeverityLevel severity) {
    switch (severity) {
      case SeverityLevel.success:
        return Icons.check_circle_outline;
      case SeverityLevel.warning:
        return Icons.warning_amber_outlined;
      case SeverityLevel.danger:
        return Icons.error_outline;
      case SeverityLevel.info:
        return Icons.info_outline;
      case SeverityLevel.neutral:
        return Icons.info_outline;
    }
  }
}
