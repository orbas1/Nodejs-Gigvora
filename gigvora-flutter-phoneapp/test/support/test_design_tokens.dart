import 'package:gigvora_design_system/gigvora_design_system.dart';

DesignTokens buildTestDesignTokens() {
  return DesignTokens(
    name: 'Test Tokens',
    version: '0.0.1',
    description: 'Lightweight tokens for widget testing.',
    colors: ColorTokens({
      'surface': '#FFFFFF',
      'surfaceVariant': '#E2E8F0',
      'background': '#F8FAFC',
      'primary': '#2563EB',
      'onPrimary': '#FFFFFF',
      'secondary': '#7C3AED',
      'onSecondary': '#FFFFFF',
      'tertiary': '#0EA5E9',
      'onTertiary': '#FFFFFF',
      'primaryContainer': '#BFDBFE',
      'secondaryContainer': '#DDD6FE',
      'tertiaryContainer': '#BAE6FD',
      'error': '#DC2626',
      'onError': '#FFFFFF',
      'onSurface': '#0F172A',
      'onSurfaceVariant': '#475569',
    }),
    typography: TypographyTokens(
      fontFamily: 'Inter',
      display: TypographyStyle(size: 48, weight: 600, lineHeight: 56),
      headline: TypographyStyle(size: 32, weight: 600, lineHeight: 40),
      title: TypographyStyle(size: 24, weight: 600, lineHeight: 32),
      body: TypographyStyle(size: 16, weight: 400, lineHeight: 24),
      label: TypographyStyle(size: 14, weight: 500, lineHeight: 20),
    ),
    spacing: SpacingTokens({
      'xs': 8.0,
      'sm': 12.0,
      'md': 16.0,
      'lg': 20.0,
      'xl': 24.0,
    }),
    radius: RadiusTokens({
      'sm': 12.0,
      'md': 16.0,
      'lg': 24.0,
    }),
    motion: MotionTokens(
      duration: DurationTokens({
        'short': 120,
        'medium': 200,
        'long': 320,
      }),
      easing: EasingTokens({
        'standard': 'easeInOut',
        'decelerate': 'easeOut',
      }),
    ),
    opacity: OpacityTokens({
      'overlay': 0.08,
      'border': 0.12,
    }),
  );
}
