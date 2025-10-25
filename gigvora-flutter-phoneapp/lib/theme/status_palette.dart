import 'package:flutter/material.dart';
import 'package:gigvora_design_system/gigvora_design_system.dart';

import 'app_theme.dart';

class StatusPalette {
  const StatusPalette({
    required this.positive,
    required this.warning,
    required this.negative,
    required this.info,
    required this.accent,
  });

  factory StatusPalette.fromTokens(DesignTokens tokens) {
    final colors = tokens.colors;
    Color resolve(String key, {String? fallbackKey}) {
      final candidate = colors[key] ??
          (fallbackKey != null ? colors[fallbackKey]! : colors['primary']!);
      return parseDesignColor(candidate);
    }

    return StatusPalette(
      positive: resolve('success', fallbackKey: 'primary'),
      warning: resolve('warning', fallbackKey: 'secondary'),
      negative: resolve('error'),
      info: resolve('info', fallbackKey: 'tertiary'),
      accent: resolve('primary'),
    );
  }

  static const fallback = StatusPalette(
    positive: Color(0xFF22C55E),
    warning: Color(0xFFF59E0B),
    negative: Color(0xFFEF4444),
    info: Color(0xFF3B82F6),
    accent: Color(0xFF2563EB),
  );

  final Color positive;
  final Color warning;
  final Color negative;
  final Color info;
  final Color accent;
}
