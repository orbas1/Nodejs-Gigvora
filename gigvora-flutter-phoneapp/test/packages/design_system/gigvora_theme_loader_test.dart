import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:gigvora_design_system/gigvora_design_system.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  test('loads blue theme tokens from bundled asset', () async {
    final loader = GigvoraThemeLoader();
    final theme = await loader.loadBlue();

    expect(theme.tokens.name, 'Gigvora Blue');
    expect(theme.tokens.colors['primary'], '#2563EB');

    final themeData = theme.toThemeData();
    expect(themeData.colorScheme.primary, equals(const Color(0xFF2563EB)));
    expect(themeData.textTheme.titleMedium?.fontFamily, isNotNull);
  });

  test('warmUp caches token futures for repeated lookups', () async {
    final loader = DesignTokenLoader();
    final first = await loader.warmUp();
    final second = await loader.loadBlueTokens();

    expect(first.name, 'Gigvora Blue');
    expect(identical(first, second), isFalse);
    expect(first.colors['surface'], isNotEmpty);
  });
}
