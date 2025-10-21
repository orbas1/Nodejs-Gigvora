import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../core/localization/language_menu_button.dart';
import '../core/providers.dart';
import '../features/auth/application/session_controller.dart';

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
    this.useAppDrawer = false,
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
  final bool useAppDrawer;

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

    final resolvedDrawer = drawer ?? (useAppDrawer ? const GigvoraAppDrawer() : null);

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
      drawer: resolvedDrawer,
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

class GigvoraAppDrawer extends ConsumerWidget {
  const GigvoraAppDrawer({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final sessionState = ref.watch(sessionControllerProvider);
    final router = GoRouter.of(context);
    final theme = Theme.of(context);

    void goTo(String route) {
      Navigator.of(context).maybePop();
      router.go(route);
    }

    Widget buildHeader() {
      if (sessionState.isAuthenticated && sessionState.session != null) {
        final session = sessionState.session!;
        final initials = session.name.isNotEmpty
            ? session.name
                .trim()
                .split(RegExp(r'\s+'))
                .map((part) => part.isNotEmpty ? part[0] : '')
                .where((value) => value.isNotEmpty)
                .take(2)
                .join()
                .toUpperCase()
            : 'GV';
        final memberships = session.memberships
            .map((membership) => session.roleLabel(membership))
            .toList(growable: false);

        return DrawerHeader(
          margin: EdgeInsets.zero,
          padding: const EdgeInsets.fromLTRB(20, 24, 16, 16),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [
                theme.colorScheme.primaryContainer,
                theme.colorScheme.primaryContainer.withOpacity(0.6),
              ],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: const BorderRadius.only(
              bottomLeft: Radius.circular(32),
              bottomRight: Radius.circular(32),
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              CircleAvatar(
                radius: 28,
                backgroundColor: theme.colorScheme.primary,
                child: Text(
                  initials,
                  style: theme.textTheme.titleLarge?.copyWith(
                    color: theme.colorScheme.onPrimary,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
              const SizedBox(height: 16),
              Text(
                session.name,
                style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600),
              ),
              const SizedBox(height: 4),
              Text(
                '${session.title} • ${session.location}',
                style: theme.textTheme.bodySmall?.copyWith(
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ),
              const SizedBox(height: 12),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: memberships
                    .take(3)
                    .map(
                      (membership) => Chip(
                        label: Text(
                          membership,
                          style: theme.textTheme.labelSmall?.copyWith(
                            color: theme.colorScheme.onPrimaryContainer,
                          ),
                        ),
                        backgroundColor: theme.colorScheme.primaryContainer,
                        padding: const EdgeInsets.symmetric(horizontal: 8),
                      ),
                    )
                    .toList(growable: false),
              ),
            ],
          ),
        );
      }

      return DrawerHeader(
        margin: EdgeInsets.zero,
        padding: const EdgeInsets.fromLTRB(20, 32, 16, 16),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [
              theme.colorScheme.primaryContainer,
              theme.colorScheme.secondaryContainer,
            ],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: const BorderRadius.only(
            bottomLeft: Radius.circular(32),
            bottomRight: Radius.circular(32),
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.end,
          children: [
            Text(
              'Welcome to Gigvora',
              style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 12),
            Text(
              'Create a free account to unlock calendar orchestration, profile insights, and gig purchasing tools.',
              style: theme.textTheme.bodySmall?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                FilledButton(
                  onPressed: () => goTo('/login'),
                  style: FilledButton.styleFrom(
                    backgroundColor: theme.colorScheme.primary,
                    foregroundColor: theme.colorScheme.onPrimary,
                  ),
                  child: const Text('Login'),
                ),
                const SizedBox(width: 12),
                FilledButton.tonal(
                  onPressed: () => goTo('/register'),
                  child: const Text('Register'),
                ),
              ],
            ),
          ],
        ),
      );
    }

    final menuItems = <_DrawerMenuItem>[
      _DrawerMenuItem(
        label: 'Home dashboard',
        icon: Icons.home_outlined,
        onTap: () => goTo('/home'),
      ),
      _DrawerMenuItem(
        label: 'Calendar orchestration',
        icon: Icons.event_available_outlined,
        onTap: () => goTo('/calendar'),
      ),
      _DrawerMenuItem(
        label: 'Marketplace & gigs',
        icon: Icons.storefront_outlined,
        onTap: () => goTo('/gigs'),
      ),
      _DrawerMenuItem(
        label: 'Gig purchases',
        icon: Icons.shopping_bag_outlined,
        onTap: () => goTo('/gigs/purchase'),
      ),
      _DrawerMenuItem(
        label: 'Profile cockpit',
        icon: Icons.person_outline,
        onTap: () => goTo('/profile'),
      ),
      _DrawerMenuItem(
        label: 'Account settings',
        icon: Icons.settings_outlined,
        onTap: () => goTo('/settings'),
      ),
      _DrawerMenuItem(
        label: 'Support centre',
        icon: Icons.support_agent_outlined,
        onTap: () => goTo('/support'),
      ),
    ];

    final showAdsEntry = sessionState.session?.memberships.contains('admin') ?? false;
    if (showAdsEntry) {
      menuItems.insert(
        5,
        _DrawerMenuItem(
          label: 'Gigvora Ads console',
          icon: Icons.campaign_outlined,
          onTap: () => goTo('/admin/ads'),
        ),
      );
    }

    return Drawer(
      child: SafeArea(
        child: Column(
          children: [
            buildHeader(),
            Expanded(
              child: ListView.separated(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 12),
                itemBuilder: (context, index) {
                  final item = menuItems[index];
                  return ListTile(
                    leading: Icon(item.icon),
                    title: Text(item.label),
                    onTap: item.onTap,
                  );
                },
                separatorBuilder: (context, _) => const Divider(height: 1),
                itemCount: menuItems.length,
              ),
            ),
            const Divider(height: 1),
            if (sessionState.isAuthenticated)
              ListTile(
                leading: const Icon(Icons.logout_outlined),
                title: const Text('Sign out'),
                onTap: () {
                  ref.read(sessionControllerProvider.notifier).logout();
                  goTo('/login');
                },
              )
            else
              ListTile(
                leading: const Icon(Icons.help_outline),
                title: const Text('Why join Gigvora?'),
                subtitle: const Text('Explore success stories and onboarding guides.'),
                onTap: () => goTo('/pages'),
              ),
          ],
        ),
      ),
    );
  }
}

class _DrawerMenuItem {
  const _DrawerMenuItem({
    required this.label,
    required this.icon,
    required this.onTap,
  });

  final String label;
  final IconData icon;
  final VoidCallback onTap;
}
