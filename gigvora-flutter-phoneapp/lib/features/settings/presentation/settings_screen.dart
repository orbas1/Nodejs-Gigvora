import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../theme/widgets.dart';
import '../../auth/application/session_controller.dart';
import '../application/settings_controller.dart';
import '../data/models/account_settings.dart';

class SettingsScreen extends ConsumerStatefulWidget {
  const SettingsScreen({super.key});

  @override
  ConsumerState<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends ConsumerState<SettingsScreen> {
  double? _sessionTimeout;
  bool _resetting = false;

  static const _weekdays = <String, String>{
    'monday': 'Mondays',
    'tuesday': 'Tuesdays',
    'wednesday': 'Wednesdays',
    'thursday': 'Thursdays',
    'friday': 'Fridays',
    'saturday': 'Saturdays',
    'sunday': 'Sundays',
  };

  static const _timezones = <String>[
    'UTC',
    'Europe/Berlin',
    'America/New_York',
    'America/Los_Angeles',
    'Asia/Singapore',
    'Australia/Sydney',
  ];

  @override
  Widget build(BuildContext context) {
    final router = GoRouter.of(context);
    final state = ref.watch(settingsControllerProvider);
    final controller = ref.read(settingsControllerProvider.notifier);
    final sessionState = ref.watch(sessionControllerProvider);
    final settings = state.data ?? AccountSettings.demo();

    _sessionTimeout ??= settings.security.sessionTimeoutMinutes.toDouble();

    final destinations = [
      const GigvoraNavigationDestination(
        label: 'Home',
        icon: Icon(Icons.home_outlined),
        selectedIcon: Icon(Icons.home),
        route: '/home',
      ),
      const GigvoraNavigationDestination(
        label: 'Calendar',
        icon: Icon(Icons.event_available_outlined),
        selectedIcon: Icon(Icons.event_available),
        route: '/calendar',
      ),
      const GigvoraNavigationDestination(
        label: 'Purchase',
        icon: Icon(Icons.shopping_bag_outlined),
        selectedIcon: Icon(Icons.shopping_bag),
        route: '/gigs/purchase',
      ),
      const GigvoraNavigationDestination(
        label: 'Settings',
        icon: Icon(Icons.settings_outlined),
        selectedIcon: Icon(Icons.settings),
        route: '/settings',
      ),
    ];

    Future<void> resetToRecommended() async {
      if (_resetting) {
        return;
      }
      setState(() {
        _resetting = true;
      });
      try {
        await controller.updateNotifications(const NotificationPreferences());
        await controller.updatePrivacy(const PrivacyPreferences());
        await controller.updateSecurity(const SecurityPreferences());
        await controller.updateWorkspace(const WorkspacePreferences());
        if (mounted) {
          setState(() {
            _sessionTimeout = const SecurityPreferences().sessionTimeoutMinutes.toDouble();
          });
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Settings restored to recommended defaults.')),
          );
        }
      } finally {
        if (mounted) {
          setState(() {
            _resetting = false;
          });
        }
      }
    }

    return GigvoraScaffold(
      title: 'Account settings',
      subtitle: sessionState.isAuthenticated
          ? '${settings.workspace.timezone} • Updated ${_formatUpdatedAt(settings.updatedAt)}'
          : 'Authenticate to persist workspace controls',
      useAppDrawer: true,
      navigationDestinations: destinations,
      selectedDestination: 3,
      onDestinationSelected: (index) {
        final destination = destinations[index];
        if (destination.route != null && destination.route != '/settings') {
          router.go(destination.route!);
        }
      },
      actions: [
        IconButton(
          tooltip: 'Refresh settings',
          onPressed: controller.refresh,
          icon: const Icon(Icons.refresh),
        ),
      ],
      body: RefreshIndicator(
        onRefresh: controller.refresh,
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          children: [
            if (state.loading)
              const LinearProgressIndicator(minHeight: 2),
            if (!sessionState.isAuthenticated)
              const Padding(
                padding: EdgeInsets.only(bottom: 16),
                child: _GuestNotice(),
              ),
            if (state.error != null)
              Padding(
                padding: const EdgeInsets.only(bottom: 16),
                child: _ErrorBanner(message: '${state.error}'),
              ),
            _SectionHeader(
              title: 'Notification preferences',
              description:
                  'Control how we reach you for gig launches, calendar escalations, and governance updates.',
            ),
            GigvoraCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  SwitchListTile.adaptive(
                    title: const Text('Push announcements'),
                    subtitle: const Text('Mobile alerts for gig approvals, project escalations, and team invites.'),
                    value: settings.notifications.pushAnnouncements,
                    onChanged: (value) {
                      controller.updateNotifications(
                        settings.notifications.copyWith(pushAnnouncements: value),
                      );
                    },
                  ),
                  SwitchListTile.adaptive(
                    title: const Text('Weekly digest emails'),
                    subtitle: const Text('Summary of calendar highlights, pipeline alerts, and community spotlights.'),
                    value: settings.notifications.emailDigests,
                    onChanged: (value) {
                      controller.updateNotifications(
                        settings.notifications.copyWith(emailDigests: value),
                      );
                    },
                  ),
                  SwitchListTile.adaptive(
                    title: const Text('SMS escalations'),
                    subtitle: const Text('Text me if critical deliverables slip or contracts need my signature.'),
                    value: settings.notifications.smsEscalations,
                    onChanged: (value) {
                      controller.updateNotifications(
                        settings.notifications.copyWith(smsEscalations: value),
                      );
                    },
                  ),
                  const SizedBox(height: 12),
                  DropdownButtonFormField<String>(
                    decoration: const InputDecoration(
                      labelText: 'Weekly digest arrives on',
                      border: OutlineInputBorder(),
                    ),
                    value: settings.notifications.weeklyReportDay,
                    items: _weekdays.entries
                        .map(
                          (entry) => DropdownMenuItem(
                            value: entry.key,
                            child: Text(entry.value),
                          ),
                        )
                        .toList(),
                    onChanged: (value) {
                      if (value == null) return;
                      controller.updateNotifications(
                        settings.notifications.copyWith(weeklyReportDay: value),
                      );
                    },
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
            _SectionHeader(
              title: 'Privacy controls',
              description:
                  'Fine-tune how your profile appears across search, networking, and automated introductions.',
            ),
            GigvoraCard(
              child: Column(
                children: [
                  SwitchListTile.adaptive(
                    title: const Text('Discoverable profile'),
                    subtitle: const Text('Allow vetted clients, agencies, and mentors to find you in search results.'),
                    value: settings.privacy.profileDiscoverable,
                    onChanged: (value) {
                      controller.updatePrivacy(
                        settings.privacy.copyWith(profileDiscoverable: value),
                      );
                    },
                  ),
                  SwitchListTile.adaptive(
                    title: const Text('Show availability'),
                    subtitle: const Text('Expose booking windows and lead time directly on your profile.'),
                    value: settings.privacy.showAvailability,
                    onChanged: (value) {
                      controller.updatePrivacy(
                        settings.privacy.copyWith(showAvailability: value),
                      );
                    },
                  ),
                  SwitchListTile.adaptive(
                    title: const Text('Share engagement metrics'),
                    subtitle: const Text('Share profile views, shortlist trends, and ad reach with your network.'),
                    value: settings.privacy.shareEngagementMetrics,
                    onChanged: (value) {
                      controller.updatePrivacy(
                        settings.privacy.copyWith(shareEngagementMetrics: value),
                      );
                    },
                  ),
                  SwitchListTile.adaptive(
                    title: const Text('Allow direct messages'),
                    subtitle: const Text('Let talent partners and project collaborators DM you from Gigvora inbox.'),
                    value: settings.privacy.allowDirectMessages,
                    onChanged: (value) {
                      controller.updatePrivacy(
                        settings.privacy.copyWith(allowDirectMessages: value),
                      );
                    },
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
            _SectionHeader(
              title: 'Security & sign-in',
              description:
                  'Keep your workspace hardened with biometric unlock, tailored session limits, and login alerts.',
            ),
            GigvoraCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  SwitchListTile.adaptive(
                    title: const Text('Two-factor authentication'),
                    subtitle: const Text('Require a verification code on every new device sign-in.'),
                    value: settings.security.twoFactorEnabled,
                    onChanged: (value) {
                      controller.updateSecurity(
                        settings.security.copyWith(twoFactorEnabled: value),
                      );
                    },
                  ),
                  SwitchListTile.adaptive(
                    title: const Text('Biometric unlock'),
                    subtitle: const Text('Use Face ID or fingerprint for quick access on trusted devices.'),
                    value: settings.security.biometricUnlock,
                    onChanged: (value) {
                      controller.updateSecurity(
                        settings.security.copyWith(biometricUnlock: value),
                      );
                    },
                  ),
                  SwitchListTile.adaptive(
                    title: const Text('Login alerts'),
                    subtitle: const Text('Receive alerts whenever a new device authenticates with your account.'),
                    value: settings.security.loginAlerts,
                    onChanged: (value) {
                      controller.updateSecurity(
                        settings.security.copyWith(loginAlerts: value),
                      );
                    },
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Session timeout',
                    style: Theme.of(context).textTheme.titleSmall,
                  ),
                  Slider(
                    value: _sessionTimeout!.clamp(15, 120),
                    min: 15,
                    max: 120,
                    divisions: 7,
                    label: '${_sessionTimeout!.round()} minutes',
                    onChanged: (value) {
                      setState(() {
                        _sessionTimeout = value;
                      });
                    },
                    onChangeEnd: (value) {
                      controller.updateSecurity(
                        settings.security
                            .copyWith(sessionTimeoutMinutes: value.round()),
                      );
                    },
                  ),
                  Text(
                    'Active sessions automatically sign out after ${_sessionTimeout!.round()} minutes of inactivity.',
                    style: Theme.of(context)
                        .textTheme
                        .bodySmall
                        ?.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
            _SectionHeader(
              title: 'Workspace defaults',
              description:
                  'Choose your default landing destination, calendar sync posture, and visual theme.',
            ),
            GigvoraCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  DropdownButtonFormField<String>(
                    value: settings.workspace.timezone,
                    decoration: const InputDecoration(
                      labelText: 'Timezone',
                      border: OutlineInputBorder(),
                    ),
                    items: _timezones
                        .map(
                          (zone) => DropdownMenuItem(
                            value: zone,
                            child: Text(zone),
                          ),
                        )
                        .toList(),
                    onChanged: (value) {
                      if (value == null) return;
                      controller.updateWorkspace(
                        settings.workspace.copyWith(timezone: value),
                      );
                    },
                  ),
                  const SizedBox(height: 16),
                  SwitchListTile.adaptive(
                    title: const Text('Sync calendar automatically'),
                    subtitle: const Text('Keep your native calendar aligned with Gigvora booking windows.'),
                    value: settings.workspace.autoSyncCalendar,
                    onChanged: (value) {
                      controller.updateWorkspace(
                        settings.workspace.copyWith(autoSyncCalendar: value),
                      );
                    },
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Theme',
                    style: Theme.of(context).textTheme.titleSmall,
                  ),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 12,
                    children: [
                      'blue',
                      'midnight',
                      'sunrise',
                    ]
                        .map(
                          (theme) => ChoiceChip(
                            label: Text(theme.toUpperCase()),
                            selected: settings.workspace.theme == theme,
                            onSelected: (selected) {
                              if (!selected) return;
                              controller.updateWorkspace(
                                settings.workspace.copyWith(theme: theme),
                              );
                            },
                          ),
                        )
                        .toList(),
                  ),
                  const SizedBox(height: 16),
                  DropdownButtonFormField<String>(
                    value: settings.workspace.defaultLandingRoute,
                    decoration: const InputDecoration(
                      labelText: 'Default landing screen',
                      border: OutlineInputBorder(),
                    ),
                    items: const [
                      DropdownMenuItem(value: '/home', child: Text('Home dashboard')),
                      DropdownMenuItem(value: '/calendar', child: Text('Calendar orchestration')),
                      DropdownMenuItem(value: '/gigs/purchase', child: Text('Gig purchase console')),
                      DropdownMenuItem(value: '/profile', child: Text('Profile cockpit')),
                    ],
                    onChanged: (value) {
                      if (value == null) return;
                      controller.updateWorkspace(
                        settings.workspace.copyWith(defaultLandingRoute: value),
                      );
                    },
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
            Align(
              alignment: Alignment.centerRight,
              child: FilledButton.tonalIcon(
                icon: const Icon(Icons.restore),
                onPressed: _resetting ? null : resetToRecommended,
                label: Text(_resetting ? 'Restoring…' : 'Restore defaults'),
              ),
            ),
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }

  String _formatUpdatedAt(DateTime? updatedAt) {
    if (updatedAt == null) {
      return 'just now';
    }
    final difference = DateTime.now().difference(updatedAt);
    if (difference.inMinutes < 1) {
      return 'just now';
    }
    if (difference.inMinutes < 60) {
      return '${difference.inMinutes} min ago';
    }
    if (difference.inHours < 24) {
      return '${difference.inHours} hr ago';
    }
    return '${difference.inDays} days ago';
  }
}

class _SectionHeader extends StatelessWidget {
  const _SectionHeader({required this.title, required this.description});

  final String title;
  final String description;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: 4),
          Text(
            description,
            style: Theme.of(context)
                .textTheme
                .bodySmall
                ?.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant),
          ),
          const SizedBox(height: 12),
        ],
      ),
    );
  }
}

class _ErrorBanner extends StatelessWidget {
  const _ErrorBanner({required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFFEE2E2),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(Icons.error_outline, color: Color(0xFFB91C1C)),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              message,
              style: Theme.of(context)
                  .textTheme
                  .bodyMedium
                  ?.copyWith(color: const Color(0xFFB91C1C)),
            ),
          ),
        ],
      ),
    );
  }
}

class _GuestNotice extends StatelessWidget {
  const _GuestNotice();

  @override
  Widget build(BuildContext context) {
    return GigvoraCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Preview mode',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: 8),
          Text(
            'Update settings live by signing in with your Gigvora workspace credentials.',
            style: Theme.of(context)
                .textTheme
                .bodyMedium
                ?.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant),
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 12,
            children: [
              FilledButton(
                onPressed: () => GoRouter.of(context).go('/login'),
                child: const Text('Secure login'),
              ),
              FilledButton.tonal(
                onPressed: () => GoRouter.of(context).go('/register'),
                child: const Text('Create account'),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
