import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/providers.dart';
import '../../router/app_routes.dart';
import '../auth/application/session_controller.dart';

class SplashScreen extends ConsumerStatefulWidget {
  const SplashScreen({super.key});

  @override
  ConsumerState<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends ConsumerState<SplashScreen> with TickerProviderStateMixin {
  late final AnimationController _controller;
  late final Animation<double> _fade;
  bool _bootstrapped = false;
  Timer? _fallbackTimer;
  bool _navigated = false;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(vsync: this, duration: const Duration(milliseconds: 900));
    _fade = CurvedAnimation(parent: _controller, curve: Curves.easeInOut);
    _controller.forward();

    WidgetsBinding.instance.addPostFrameCallback((_) async {
      final featureFlags = ref.read(featureFlagsBootstrapProvider);
      final analytics = ref.read(analyticsBootstrapProvider);
      final pushNotifications = ref.read(pushNotificationBootstrapProvider);
      await Future.wait([
        featureFlags.future,
        analytics.future,
        pushNotifications.future,
      ]);
      if (!mounted) return;
      setState(() {
        _bootstrapped = true;
      });
    });

    _fallbackTimer = Timer(const Duration(seconds: 3), () {
      if (!mounted) return;
      setState(() {
        _bootstrapped = true;
      });
    });
  }

  @override
  void dispose() {
    _fallbackTimer?.cancel();
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final sessionState = ref.watch(sessionControllerProvider);
    final isAuthenticated = sessionState.isAuthenticated;
    final theme = Theme.of(context);

    if (_bootstrapped && !_navigated) {
      Future.microtask(() {
        if (!_navigated && mounted) {
          _navigate(
            isAuthenticated ? AppRoute.home.path : AppRoute.login.path,
          );
        }
      });
    }

    ref.listen<AsyncValue<void>>(featureFlagsBootstrapProvider, (_, next) {
      next.whenOrNull(error: (error, _) => _showSnack('Feature flag sync failed: $error'));
    });
    ref.listen<AsyncValue<void>>(pushNotificationBootstrapProvider, (_, next) {
      next.whenOrNull(error: (error, _) => _showSnack('Push bootstrap failed: $error'));
    });

    final destinations = [
      _OnboardingCard(
        icon: Icons.workspace_premium_outlined,
        title: 'Operational analytics',
        description: 'Monitor projects, finances, and governance in a single workspace.',
      ),
      _OnboardingCard(
        icon: Icons.schedule,
        title: 'Calendar orchestration',
        description: 'Manage delivery milestones and stakeholder reviews with automated reminders.',
      ),
      _OnboardingCard(
        icon: Icons.security_outlined,
        title: 'Enterprise-grade security',
        description: 'SOC2 aligned controls guard every profile, gig purchase, and notification.',
      ),
    ];

    return Scaffold(
      backgroundColor: theme.colorScheme.surfaceTint.withOpacity(0.05),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Gigvora', style: theme.textTheme.headlineMedium),
                      Text(
                        'Network operations platform',
                        style: theme.textTheme.bodyMedium
                            ?.copyWith(color: theme.colorScheme.onSurfaceVariant),
                      ),
                    ],
                  ),
                  FilledButton.tonalIcon(
                    onPressed: () => _navigate(
                      isAuthenticated
                          ? AppRoute.home.path
                          : AppRoute.login.path,
                    ),
                    icon: const Icon(Icons.support_agent),
                    label: const Text('Contact support'),
                  ),
                ],
              ),
              const Spacer(),
              FadeTransition(
                opacity: _fade,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Bootstrapping workspace', style: theme.textTheme.headlineSmall),
                    const SizedBox(height: 12),
                    const LinearProgressIndicator(minHeight: 6),
                    const SizedBox(height: 24),
                    Wrap(
                      spacing: 16,
                      runSpacing: 16,
                      children: destinations,
                    ),
                  ],
                ),
              ),
              const Spacer(),
              AnimatedSwitcher(
                duration: const Duration(milliseconds: 350),
                child: _bootstrapped
                    ? Column(
                        key: const ValueKey('cta'),
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          FilledButton(
                            onPressed: () => _navigate(
                              isAuthenticated
                                  ? AppRoute.home.path
                                  : AppRoute.login.path,
                            ),
                            child: Text(
                              isAuthenticated ? 'Enter workspace' : 'Sign in',
                            ),
                          ),
                          const SizedBox(height: 12),
                          OutlinedButton(
                            onPressed: () =>
                                _navigate(AppRoute.explorer.path),
                            child: const Text('Explore gigs'),
                          ),
                        ],
                      )
                    : Column(
                        key: const ValueKey('status'),
                        children: const [
                          Padding(
                            padding: EdgeInsets.symmetric(vertical: 16),
                            child: Text(
                              'Synchronising runtime health, notifications, and analytics…',
                              textAlign: TextAlign.center,
                            ),
                          ),
                        ],
                      ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _navigate(String route) {
    if (!mounted) return;
    _navigated = true;
    GoRouter.of(context).go(route);
  }

  void _showSnack(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message)),
    );
  }
}

class _OnboardingCard extends StatelessWidget {
  const _OnboardingCard({
    required this.icon,
    required this.title,
    required this.description,
  });

  final IconData icon;
  final String title;
  final String description;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      width: 220,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: theme.colorScheme.shadow.withOpacity(0.06),
            blurRadius: 20,
            offset: const Offset(0, 12),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          CircleAvatar(
            backgroundColor: theme.colorScheme.primary.withOpacity(0.12),
            foregroundColor: theme.colorScheme.primary,
            child: Icon(icon),
          ),
          const SizedBox(height: 12),
          Text(title, style: theme.textTheme.titleMedium),
          const SizedBox(height: 8),
          Text(
            description,
            style:
                theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.onSurfaceVariant),
          ),
        ],
      ),
    );
  }
}
