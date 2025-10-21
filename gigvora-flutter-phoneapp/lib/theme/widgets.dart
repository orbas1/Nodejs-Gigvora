import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../core/localization/language_menu_button.dart';
import '../core/providers.dart';

class GigvoraScaffold extends ConsumerWidget {
  const GigvoraScaffold({
    required this.title,
    this.subtitle,
    required this.body,
    this.actions,
    this.floatingActionButton,
    this.drawer,
    this.navigationDestinations,
    this.selectedDestination = 0,
    this.onDestinationSelected,
    super.key,
  });

  final String title;
  final String? subtitle;
  final Widget body;
  final List<Widget>? actions;
  final Widget? floatingActionButton;
  final Widget? drawer;
  final List<GigvoraNavigationDestination>? navigationDestinations;
  final int selectedDestination;
  final ValueChanged<int>? onDestinationSelected;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tokens = ref.watch(designTokensProvider).maybeWhen(
          data: (value) => value,
          orElse: () => null,
        );
    final bottomNav = navigationDestinations == null
        ? null
        : NavigationBar(
            selectedIndex: selectedDestination,
            destinations:
                navigationDestinations!.map((destination) => destination.toNavigationDestination()).toList(),
            onDestinationSelected: onDestinationSelected ?? (_) {},
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
        actions: [
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 4),
            child: LanguageMenuButton(),
          ),
          if (actions != null) ...actions!,
        ],
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
      floatingActionButton: floatingActionButton,
      drawer: drawer,
      bottomNavigationBar: bottomNav,
    );
  }
}

class GigvoraNavigationDestination {
  const GigvoraNavigationDestination({
    required this.icon,
    required this.selectedIcon,
    required this.label,
    this.route,
  });

  final Icon icon;
  final Icon selectedIcon;
  final String label;
  final String? route;

  NavigationDestination toNavigationDestination() {
    return NavigationDestination(icon: icon, selectedIcon: selectedIcon, label: label);
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
