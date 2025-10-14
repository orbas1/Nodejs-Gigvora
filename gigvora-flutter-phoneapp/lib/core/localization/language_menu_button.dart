import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'gigvora_localizations.dart';
import 'language_controller.dart';

enum LanguageMenuVariant { compact, cta }

class LanguageMenuButton extends ConsumerWidget {
  const LanguageMenuButton({super.key, this.variant = LanguageMenuVariant.compact});

  final LanguageMenuVariant variant;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final locale = ref.watch(languageControllerProvider);
    final controller = ref.read(languageControllerProvider.notifier);
    final l10n = GigvoraLocalizations.of(context);
    final options = GigvoraLocalizations.supportedLocales;
    final activeName = GigvoraLocalizations.nativeName(locale.languageCode);

    return PopupMenuButton<String>(
      tooltip: l10n.translate('language.ariaLabel'),
      onSelected: (value) => unawaited(controller.setLanguageCode(value)),
      position: PopupMenuPosition.under,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
      itemBuilder: (context) {
        final theme = Theme.of(context);
        final items = <PopupMenuEntry<String>>[
          PopupMenuItem<String>(
            enabled: false,
            child: Text(
              l10n.translate('language.menuTitle'),
              style: theme.textTheme.labelSmall?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
                fontWeight: FontWeight.w600,
                letterSpacing: 0.6,
              ),
            ),
          ),
          const PopupMenuDivider(),
        ];
        for (final option in options) {
          final isActive = option.languageCode == locale.languageCode;
          items.add(
            PopupMenuItem<String>(
              value: option.languageCode,
              child: Row(
                children: [
                  AnimatedOpacity(
                    opacity: isActive ? 1 : 0,
                    duration: const Duration(milliseconds: 120),
                    child: Icon(
                      Icons.check_circle,
                      size: 18,
                      color: theme.colorScheme.primary,
                    ),
                  ),
                  if (!isActive)
                    const SizedBox(
                      width: 18,
                      height: 18,
                    ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          GigvoraLocalizations.nativeName(option.languageCode),
                          style: theme.textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w600),
                        ),
                        Text(
                          option.languageCode.toUpperCase(),
                          style: theme.textTheme.labelSmall?.copyWith(color: theme.colorScheme.onSurfaceVariant),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          );
        }
        return items;
      },
      child: _LanguageButtonShell(
        variant: variant,
        label: activeName,
        hint: l10n.translate('language.label'),
      ),
    );
  }
}

class _LanguageButtonShell extends StatelessWidget {
  const _LanguageButtonShell({required this.variant, required this.label, required this.hint});

  final LanguageMenuVariant variant;
  final String label;
  final String hint;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    switch (variant) {
      case LanguageMenuVariant.cta:
        return Container(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(28),
            border: Border.all(color: theme.colorScheme.primary.withOpacity(0.25)),
            color: theme.colorScheme.primary.withOpacity(0.08),
          ),
          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.language_outlined, color: theme.colorScheme.primary),
              const SizedBox(width: 12),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    hint,
                    style: theme.textTheme.labelSmall?.copyWith(
                      color: theme.colorScheme.primary,
                      letterSpacing: 0.7,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  Text(
                    label,
                    style: theme.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w700),
                  ),
                ],
              ),
            ],
          ),
        );
      case LanguageMenuVariant.compact:
      default:
        return Container(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(999),
            border: Border.all(color: theme.colorScheme.outlineVariant),
            color: theme.colorScheme.surface,
          ),
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.language_outlined, color: theme.colorScheme.primary, size: 18),
              const SizedBox(width: 8),
              Text(
                label,
                style: theme.textTheme.labelSmall?.copyWith(fontWeight: FontWeight.w600),
              ),
            ],
          ),
        );
    }
  }
}
