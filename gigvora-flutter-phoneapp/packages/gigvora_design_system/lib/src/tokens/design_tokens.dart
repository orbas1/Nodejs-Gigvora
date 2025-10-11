import 'dart:convert';

import 'package:flutter/services.dart';
import 'package:gigvora_foundation/gigvora_foundation.dart';

class DesignTokens {
  DesignTokens({
    required this.name,
    required this.version,
    required this.description,
    required this.colors,
    required this.typography,
    required this.spacing,
    required this.radius,
    required this.motion,
    required this.opacity,
  });

  final String name;
  final String version;
  final String description;
  final ColorTokens colors;
  final TypographyTokens typography;
  final SpacingTokens spacing;
  final RadiusTokens radius;
  final MotionTokens motion;
  final OpacityTokens opacity;

  factory DesignTokens.fromJson(Map<String, dynamic> json) {
    return DesignTokens(
      name: json['name'] as String,
      version: json['version'] as String,
      description: json['description'] as String,
      colors: ColorTokens.fromJson(json['colors'] as Map<String, dynamic>),
      typography:
          TypographyTokens.fromJson(json['typography'] as Map<String, dynamic>),
      spacing: SpacingTokens.fromJson(json['spacing'] as Map<String, dynamic>),
      radius: RadiusTokens.fromJson(json['radius'] as Map<String, dynamic>),
      motion: MotionTokens.fromJson(json['motion'] as Map<String, dynamic>),
      opacity: OpacityTokens.fromJson(json['opacity'] as Map<String, dynamic>),
    );
  }
}

class ColorTokens {
  ColorTokens(Map<String, String> values) : _values = Map.unmodifiable(values);

  final Map<String, String> _values;

  String? operator [](String key) => _values[key];

  Map<String, String> toMap() => _values;
}

class TypographyTokens {
  TypographyTokens({
    required this.fontFamily,
    required this.display,
    required this.headline,
    required this.title,
    required this.body,
    required this.label,
  });

  final String fontFamily;
  final TypographyStyle display;
  final TypographyStyle headline;
  final TypographyStyle title;
  final TypographyStyle body;
  final TypographyStyle label;

  factory TypographyTokens.fromJson(Map<String, dynamic> json) {
    return TypographyTokens(
      fontFamily: json['fontFamily'] as String,
      display: TypographyStyle.fromJson(json['display'] as Map<String, dynamic>),
      headline:
          TypographyStyle.fromJson(json['headline'] as Map<String, dynamic>),
      title: TypographyStyle.fromJson(json['title'] as Map<String, dynamic>),
      body: TypographyStyle.fromJson(json['body'] as Map<String, dynamic>),
      label: TypographyStyle.fromJson(json['label'] as Map<String, dynamic>),
    );
  }
}

class TypographyStyle {
  TypographyStyle({
    required this.size,
    required this.weight,
    required this.lineHeight,
  });

  final double size;
  final int weight;
  final double lineHeight;

  factory TypographyStyle.fromJson(Map<String, dynamic> json) {
    return TypographyStyle(
      size: (json['size'] as num).toDouble(),
      weight: (json['weight'] as num).toInt(),
      lineHeight: (json['lineHeight'] as num).toDouble(),
    );
  }
}

class SpacingTokens {
  SpacingTokens(Map<String, double> values)
      : _values = Map.unmodifiable(values);

  final Map<String, double> _values;

  double operator [](String key) => _values[key] ?? 0;

  Map<String, double> toMap() => _values;
}

class RadiusTokens {
  RadiusTokens(Map<String, double> values)
      : _values = Map.unmodifiable(values);

  final Map<String, double> _values;

  double operator [](String key) => _values[key] ?? 0;

  Map<String, double> toMap() => _values;
}

class MotionTokens {
  MotionTokens({required this.duration, required this.easing});

  final DurationTokens duration;
  final EasingTokens easing;

  factory MotionTokens.fromJson(Map<String, dynamic> json) {
    return MotionTokens(
      duration: DurationTokens.fromJson(json['duration'] as Map<String, dynamic>),
      easing: EasingTokens.fromJson(json['easing'] as Map<String, dynamic>),
    );
  }
}

class DurationTokens {
  DurationTokens(Map<String, int> values)
      : _values = Map.unmodifiable(values);

  final Map<String, int> _values;

  Duration operator [](String key) => Duration(milliseconds: _values[key] ?? 0);

  Map<String, int> toMap() => _values;
}

class EasingTokens {
  EasingTokens(Map<String, String> values)
      : _values = Map.unmodifiable(values);

  final Map<String, String> _values;

  String operator [](String key) => _values[key] ?? 'linear';

  Map<String, String> toMap() => _values;
}

class OpacityTokens {
  OpacityTokens(Map<String, double> values)
      : _values = Map.unmodifiable(values);

  final Map<String, double> _values;

  double operator [](String key) => _values[key] ?? 1;

  Map<String, double> toMap() => _values;
}

class DesignTokenLoader {
  DesignTokenLoader({AssetBundle? bundle}) : _bundle = bundle ?? rootBundle;

  final AssetBundle _bundle;
  final Map<String, Future<DesignTokens>> _cache = {};

  Future<DesignTokens> loadBlueTokens() {
    return loadFromAsset('packages/gigvora_design_system/assets/tokens/gigvora_blue.json');
  }

  Future<DesignTokens> loadFromAsset(String assetPath) {
    return _cache.putIfAbsent(assetPath, () async {
      final contents = await _bundle.loadString(assetPath);
      final decoded = jsonDecode(contents) as Map<String, dynamic>;
      return DesignTokens.fromJson(decoded);
    });
  }

  Future<DesignTokens> warmUp({List<String>? assetPaths}) async {
    final paths = assetPaths ??
        const ['packages/gigvora_design_system/assets/tokens/gigvora_blue.json'];
    final futures = paths.map(loadFromAsset).toList(growable: false);
    final results = await Future.wait(futures);
    return results.first;
  }
}

extension DesignTokensExtensions on DesignTokens {
  Map<String, dynamic> asConfigJson() => {
        'name': name,
        'version': version,
        'description': description,
        'colors': colors.toMap(),
        'typography': {
          'fontFamily': typography.fontFamily,
          'display': typography.display.toJson(),
          'headline': typography.headline.toJson(),
          'title': typography.title.toJson(),
          'body': typography.body.toJson(),
          'label': typography.label.toJson(),
        },
        'spacing': spacing.toMap(),
        'radius': radius.toMap(),
        'motion': {
          'duration': motion.duration.toMap(),
          'easing': motion.easing.toMap(),
        },
        'opacity': opacity.toMap(),
      };
}

extension TypographyStyleJson on TypographyStyle {
  Map<String, dynamic> toJson() => {
        'size': size,
        'weight': weight,
        'lineHeight': lineHeight,
      };
}
