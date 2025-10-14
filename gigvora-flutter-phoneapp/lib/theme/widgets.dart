import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../core/providers.dart';

class GigvoraScaffold extends ConsumerWidget {
  const GigvoraScaffold({
    required this.title,
    this.subtitle,
    required this.body,
    this.actions,
    super.key,
  });

  final String title;
  final String? subtitle;
  final Widget body;
  final List<Widget>? actions;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tokens = ref.watch(designTokensProvider).maybeWhen(
          data: (value) => value,
          orElse: () => null,
        );
    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: Theme.of(context).textTheme.titleLarge),
            if (subtitle != null)
              Text(
                subtitle!,
                style: Theme.of(context)
                    .textTheme
                    .bodySmall
                    ?.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant),
              ),
          ],
        ),
        actions: actions,
      ),
      body: SafeArea(
        child: Padding(
          padding: EdgeInsets.symmetric(
            horizontal: tokens?.spacing['xl'] ?? 24,
            vertical: tokens?.spacing['lg'] ?? 24,
          ),
          child: body,
        ),
      ),
      backgroundColor: Theme.of(context).colorScheme.background,
    );
  }
}

class GigvoraCard extends ConsumerWidget {
  const GigvoraCard({
    required this.child,
    this.padding,
    super.key,
  });

  final Widget child;
  final EdgeInsetsGeometry? padding;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tokens = ref.watch(designTokensProvider).maybeWhen(
          data: (value) => value,
          orElse: () => null,
        );
    final colorScheme = Theme.of(context).colorScheme;
    return Container(
      decoration: BoxDecoration(
        color: colorScheme.surface,
        borderRadius: BorderRadius.circular(tokens?.radius['lg'] ?? 24),
        border: Border.all(
          color: colorScheme.surfaceVariant
              .withOpacity(tokens?.opacity['border'] ?? 0.12),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.08),
            offset: const Offset(0, 12),
            blurRadius: 24,
          ),
        ],
      ),
      padding: padding ?? EdgeInsets.all(tokens?.spacing['lg'] ?? 20),
      child: child,
    );
  }
}
