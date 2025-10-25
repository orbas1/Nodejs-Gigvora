import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'package:gigvora_foundation/gigvora_foundation.dart';
import 'package:gigvora_mobile/core/localization/gigvora_localizations.dart';
import 'package:gigvora_mobile/core/localization/language_menu_button.dart';
import 'package:share_plus/share_plus.dart';

import '../../../core/providers.dart';
import '../../auth/application/session_controller.dart';
import '../../auth/domain/session.dart';
import '../../ads/presentation/ad_coupon_strip.dart';
import '../../finance/domain/finance_access_policy.dart';
import '../../feed/application/feed_controller.dart';
import '../../feed/data/models/feed_post.dart';
import '../../feed/data/models/feed_comment.dart';
import '../../connections/application/connections_controller.dart';
import '../../connections/domain/connection_network.dart';
import '../../../theme/widgets.dart';
import '../../blog/presentation/blog_spotlight_card.dart';
import '../../governance/presentation/domain_governance_summary_card.dart';
import '../../governance/presentation/user_consent_card.dart';
import '../../governance/presentation/rbac_matrix_card.dart';
import '../application/role_management_controller.dart';
import '../data/models/role_membership.dart';
import 'widgets/role_management_sheet.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final sessionState = ref.watch(sessionControllerProvider);
    final controller = ref.read(sessionControllerProvider.notifier);
    final l10n = GigvoraLocalizations.of(context);

    if (!sessionState.isAuthenticated) {
      return GigvoraScaffold(
        title: l10n.translate('home.guestTitle'),
        subtitle: l10n.translate('home.guestSubtitle'),
        useAppDrawer: true,
        body: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              l10n.translate('home.guestDescription'),
              style: Theme.of(context).textTheme.bodyLarge,
            ),
            const SizedBox(height: 24),
            Wrap(
              spacing: 12,
              runSpacing: 12,
              children: [
                SizedBox(
                  width: 280,
                  child: ElevatedButton.icon(
                    onPressed: () => GoRouter.of(context).go('/login'),
                    icon: const Icon(Icons.lock_open),
                    label: Text(l10n.translate('home.guestLogin')),
                  ),
                ),
                SizedBox(
                  width: 280,
                  child: OutlinedButton.icon(
                    onPressed: () => GoRouter.of(context).go('/signup'),
                    icon: const Icon(Icons.person_add_alt),
                    label: Text(l10n.translate('home.guestRegister')),
                  ),
                ),
                const SizedBox(
                  width: 280,
                  child: LanguageMenuButton(variant: LanguageMenuVariant.cta),
                ),
              ],
            ),
            const SizedBox(height: 24),
            Text(
              l10n.translate('home.guestInfo'),
              style: Theme.of(context)
                  .textTheme
                  .bodySmall
                  ?.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant),
            ),
          ],
        ),
      );
    }

    final session = sessionState.session!;
    final membershipState = ref.watch(roleManagementControllerProvider);
    final membershipController = ref.read(roleManagementControllerProvider.notifier);
    final feedState = ref.watch(feedControllerProvider);
    final feedController = ref.read(feedControllerProvider.notifier);
    final feedPreview = feedState.data?.take(3).toList(growable: false) ?? const <FeedPost>[];
    final connectionsState = ref.watch(connectionsControllerProvider);
    final connectionsController = ref.read(connectionsControllerProvider.notifier);
    final resolvedMemberships = membershipState.data ??
        session.memberships
            .map(
              (role) => RoleMembership(
                id: role,
                role: role,
                label: session.roleLabel(role),
                isActive: role == session.activeMembership,
                isPrimary: role == session.activeMembership,
              ),
            )
            .toList(growable: false);

    Future<void> openRoleSheet({RoleMembership? membership}) {
      return showModalBottomSheet<void>(
        context: context,
        isScrollControlled: true,
        builder: (context) {
          return RoleManagementSheet(
            initial: membership,
            onSubmit: (draft) async {
              if (membership == null) {
                await membershipController.create(draft);
              } else {
                await membershipController.update(
                  membership,
                  RoleMembershipUpdate(
                    label: draft.label,
                    description: draft.description,
                    permissions: draft.permissions,
                    primary: draft.primary,
                  ),
                );
              }
            },
          );
        },
      );
    }

    Future<void> activateMembership(RoleMembership membership) async {
      try {
        await membershipController.activate(membership);
      } catch (error) {
        if (!context.mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Unable to activate role. $error')),
        );
      }
    }

    Future<void> deleteMembership(RoleMembership membership) async {
      final currentMemberships = membershipState.data ?? resolvedMemberships;
      if (currentMemberships.length <= 1) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('At least one role must remain linked to your account.')),
        );
        return;
      }
      final confirmed = await showDialog<bool>(
        context: context,
        builder: (dialogContext) {
          return AlertDialog(
            title: const Text('Remove workspace role'),
            content: Text(
              'Remove ${membership.label}? Dashboards and automations for this workspace will no longer be available.',
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.of(dialogContext).pop(false),
                child: const Text('Cancel'),
              ),
              FilledButton.tonal(
                onPressed: () => Navigator.of(dialogContext).pop(true),
                child: const Text('Remove role'),
              ),
            ],
          );
        },
      );
      if (confirmed != true) {
        return;
      }
      try {
        await membershipController.delete(membership);
        if (!context.mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('${membership.label} role removed.')),
        );
      } catch (error) {
        if (!context.mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Unable to remove role. $error')),
        );
      }
    }

    Uri buildShareUri(FeedPost post) {
      final base = ref.watch(appConfigProvider).apiBaseUrl;
      final segments = base.pathSegments
          .where((segment) => segment.toLowerCase() != 'api' && segment.isNotEmpty)
          .toList(growable: true)
        ..addAll(['feed', post.id]);
      return base.replace(pathSegments: segments);
    }

    Future<void> shareFeedPost(FeedPost post) async {
      final uri = buildShareUri(post);
      try {
        await Share.shareUri(uri);
        await feedController.recordShare(post, channel: 'system_share');
      } catch (error) {
        await Clipboard.setData(ClipboardData(text: uri.toString()));
        await feedController.recordShare(post, channel: 'clipboard');
        if (!context.mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Share unavailable. Link copied to clipboard. ($error)')),
        );
      }
    }

    Future<FeedComment?> commentOnFeedPost(FeedPost post) async {
      final controller = TextEditingController();
      final focusNode = FocusNode();
      try {
        final draft = await showModalBottomSheet<String>(
          context: context,
          isScrollControlled: true,
          builder: (sheetContext) {
            return Padding(
              padding: EdgeInsets.only(
                left: 24,
                right: 24,
                top: 24,
                bottom: MediaQuery.of(sheetContext).viewInsets.bottom + 24,
              ),
              child: SafeArea(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Comment on ${post.author.name}\'s update',
                      style: Theme.of(sheetContext).textTheme.titleMedium,
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: controller,
                      focusNode: focusNode,
                      autofocus: true,
                      minLines: 3,
                      maxLines: 6,
                      textInputAction: TextInputAction.newline,
                      decoration: const InputDecoration(
                        hintText: 'Share your insight or next step…',
                        border: OutlineInputBorder(),
                      ),
                    ),
                    const SizedBox(height: 16),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.end,
                      children: [
                        TextButton(
                          onPressed: () => Navigator.of(sheetContext).pop(),
                          child: const Text('Cancel'),
                        ),
                        const SizedBox(width: 12),
                        FilledButton(
                          onPressed: () => Navigator.of(sheetContext).pop(controller.text.trim()),
                          child: const Text('Post'),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            );
          },
        );

        if (draft == null || draft.trim().isEmpty) {
          return null;
        }

        final comment = await feedController.submitComment(post, draft);
        if (!context.mounted) {
          return comment;
        }
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Comment published to the timeline.')),
        );
        return comment;
      } catch (error) {
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Unable to post comment. $error')),
          );
        }
        return null;
      } finally {
        controller.dispose();
        focusNode.dispose();
      }
    }

    Future<void> reactToPost(FeedPost post, bool liked) {
      return feedController.toggleReaction(post, active: liked).then((_) => null);
    }

    Future<void> requestIntroduction(ConnectionNode node) async {
      try {
        await connectionsController.requestIntroduction(node);
        if (!context.mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Introduction request sent to ${node.name}.')),
        );
      } catch (error) {
        if (!context.mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Unable to request introduction. $error')),
        );
      }
    }

    final activeRole = session.activeMembership;
    final activeDashboard = session.dashboardFor(activeRole) ??
        session.dashboardFor(session.memberships.first) ??
        session.dashboards.values.first;

      return GigvoraScaffold(
        title: 'Hi, ${session.name.split(' ').first}',
        subtitle: '${session.title} • ${session.location}',
        useAppDrawer: true,
        actions: [
        IconButton(
          tooltip: 'Log out',
          onPressed: () {
            controller.logout();
            GoRouter.of(context).go('/login');
          },
          icon: const Icon(Icons.logout_outlined),
        ),
      ],
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Switch context',
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 12),
            _RoleSwitcher(
              state: membershipState,
              memberships: resolvedMemberships,
              onCreate: () => openRoleSheet(),
              onActivate: activateMembership,
              onEdit: (membership) => openRoleSheet(membership: membership),
              onDelete: deleteMembership,
            ),
            const SizedBox(height: 24),
            _DashboardHero(
              session: session,
              dashboard: activeDashboard,
            ),
            const SizedBox(height: 24),
            _MetricsWrap(metrics: activeDashboard.metrics),
            const SizedBox(height: 24),
            _FeedPreviewCard(
              state: feedState,
              posts: feedPreview,
              onOpenTimeline: () => GoRouter.of(context).go('/feed'),
              onRefresh: () => feedController.refresh(),
              onReact: reactToPost,
              onComment: commentOnFeedPost,
              onShare: shareFeedPost,
            ),
            const SizedBox(height: 24),
            const BlogSpotlightCard(),
            const SizedBox(height: 24),
            const UserConsentCard(),
            if (FinanceAccessPolicy.hasAccess(session)) ...[
              const SizedBox(height: 24),
              _FinanceCallout(onTap: () => GoRouter.of(context).go('/finance')),
            ],
            const SizedBox(height: 24),
            ...activeDashboard.sections
                .map((section) => Padding(
                      padding: const EdgeInsets.only(bottom: 16),
                      child: _DashboardSectionCard(section: section),
                    ))
                .toList(),
            if (activeDashboard.role == 'admin') ...[
              const SizedBox(height: 24),
              const DomainGovernanceSummaryCard(),
              const SizedBox(height: 16),
              const RbacMatrixCard(),
              const SizedBox(height: 16),
              const _AdminAdsCallout(),
            ],
            if (activeDashboard.actions.isNotEmpty) ...[
              const SizedBox(height: 8),
              _DashboardActions(actions: activeDashboard.actions),
            ],
            const SizedBox(height: 24),
            AdCouponStrip(surface: _surfaceForRole(activeRole)),
            const SizedBox(height: 16),
            _NetworkHighlightsCard(
              state: connectionsState,
              onRefresh: () => connectionsController.refresh(),
              onOpenNetwork: () => GoRouter.of(context).go('/connections'),
              onRequestIntroduction: requestIntroduction,
            ),
            const SizedBox(height: 16),
            const _SupportAndInfoCard(),
            const SizedBox(height: 12),
          ],
        ),
      ),
    );
  }
}

class _RoleSwitcher extends StatelessWidget {
  const _RoleSwitcher({
    required this.state,
    required this.memberships,
    required this.onCreate,
    required this.onActivate,
    required this.onEdit,
    required this.onDelete,
  });

  final ResourceState<List<RoleMembership>> state;
  final List<RoleMembership> memberships;
  final VoidCallback onCreate;
  final ValueChanged<RoleMembership> onActivate;
  final ValueChanged<RoleMembership> onEdit;
  final ValueChanged<RoleMembership> onDelete;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    return GigvoraCard(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Workspace memberships', style: theme.textTheme.titleMedium),
                    const SizedBox(height: 4),
                    Text(
                      'Switch roles to unlock tailored dashboards, controls, and automations across Gigvora.',
                      style: theme.textTheme.bodySmall?.copyWith(color: colorScheme.onSurfaceVariant),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 12),
              FilledButton.tonalIcon(
                onPressed: onCreate,
                icon: const Icon(Icons.add),
                label: const Text('Add role'),
              ),
            ],
          ),
          if (state.loading) ...[
            const SizedBox(height: 16),
            LinearProgressIndicator(
              minHeight: 4,
              backgroundColor: colorScheme.surfaceVariant,
            ),
          ],
          if (state.hasError && !state.loading) ...[
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: colorScheme.errorContainer,
                borderRadius: BorderRadius.circular(16),
              ),
              child: Text(
                'We had trouble syncing memberships. Pull to refresh or try again later.',
                style: theme.textTheme.bodySmall?.copyWith(color: colorScheme.onErrorContainer),
              ),
            ),
          ],
          if (memberships.isEmpty && !state.loading) ...[
            const SizedBox(height: 16),
            Text(
              'No roles are linked to this account yet. Add a workspace role to begin.',
              style: theme.textTheme.bodyMedium,
            ),
          ] else ...[
            const SizedBox(height: 16),
            for (final membership in memberships) ...[
              _MembershipTile(
                membership: membership,
                onActivate: () => onActivate(membership),
                onEdit: () => onEdit(membership),
                onDelete: () => onDelete(membership),
              ),
              const SizedBox(height: 12),
            ],
          ],
        ],
      ),
    );
  }
}

class _MembershipTile extends StatelessWidget {
  const _MembershipTile({
    required this.membership,
    required this.onActivate,
    required this.onEdit,
    required this.onDelete,
  });

  final RoleMembership membership;
  final VoidCallback onActivate;
  final VoidCallback onEdit;
  final VoidCallback onDelete;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final isActive = membership.isActive;
    final isPrimary = membership.isPrimary;
    final baseColor = isActive ? colorScheme.primaryContainer : colorScheme.surfaceVariant;
    final borderColor = isActive ? colorScheme.primary : colorScheme.outlineVariant;

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: baseColor,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: borderColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                height: 44,
                width: 44,
                decoration: BoxDecoration(
                  color: isActive ? colorScheme.primary.withOpacity(0.12) : colorScheme.surface,
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Icon(
                  isActive ? Icons.rocket_launch : Icons.swap_horiz,
                  color: isActive ? colorScheme.primary : colorScheme.onSurfaceVariant,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            membership.label,
                            style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600),
                          ),
                        ),
                        PopupMenuButton<String>(
                          tooltip: 'Role actions',
                          onSelected: (value) {
                            switch (value) {
                              case 'edit':
                                onEdit();
                                break;
                              case 'delete':
                                onDelete();
                                break;
                            }
                          },
                          itemBuilder: (context) => [
                            const PopupMenuItem<String>(
                              value: 'edit',
                              child: ListTile(
                                leading: Icon(Icons.edit_outlined),
                                title: Text('Edit role'),
                              ),
                            ),
                            const PopupMenuItem<String>(
                              value: 'delete',
                              child: ListTile(
                                leading: Icon(Icons.delete_outline),
                                title: Text('Remove role'),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        Text(
                          'Identifier: ${membership.role}',
                          style: theme.textTheme.bodySmall?.copyWith(color: colorScheme.onSurfaceVariant),
                        ),
                        const SizedBox(width: 12),
                        if (isActive)
                          Chip(
                            label: const Text('Active'),
                            avatar: const Icon(Icons.check_circle, size: 18),
                            backgroundColor: colorScheme.primary.withOpacity(0.1),
                            visualDensity: VisualDensity.compact,
                          ),
                        if (isPrimary)
                          Padding(
                            padding: const EdgeInsets.only(left: 8),
                            child: Chip(
                              label: const Text('Primary'),
                              avatar: const Icon(Icons.star, size: 18),
                              backgroundColor: colorScheme.secondaryContainer,
                              visualDensity: VisualDensity.compact,
                            ),
                          ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
          if ((membership.description ?? '').isNotEmpty) ...[
            const SizedBox(height: 12),
            Text(
              membership.description!,
              style: theme.textTheme.bodyMedium,
            ),
          ],
          if (membership.permissions.isNotEmpty) ...[
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: membership.permissions
                  .map(
                    (permission) => Chip(
                      label: Text(permission),
                      backgroundColor: colorScheme.surfaceTint.withOpacity(0.1),
                      visualDensity: VisualDensity.compact,
                    ),
                  )
                  .toList(),
            ),
          ],
          const SizedBox(height: 16),
          Align(
            alignment: Alignment.centerRight,
            child: FilledButton.icon(
              onPressed: isActive ? null : onActivate,
              icon: Icon(isActive ? Icons.workspace_premium : Icons.login),
              label: Text(isActive ? 'Current workspace' : 'Switch to this role'),
            ),
          ),
        ],
      ),
    );
  }
}

class _FinanceCallout extends StatelessWidget {
  const _FinanceCallout({required this.onTap});

  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    return GigvoraCard(
      child: Row(
        children: [
          Container(
            height: 48,
            width: 48,
            decoration: BoxDecoration(
              color: colorScheme.primary.withOpacity(0.12),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Icon(Icons.account_balance_wallet_outlined, color: colorScheme.primary),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Finance, escrow & disputes',
                  style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600),
                ),
                const SizedBox(height: 4),
                Text(
                  'Open the finance control tower to review safeguarding balances, release queues, and dispute health.',
                  style: theme.textTheme.bodySmall?.copyWith(color: colorScheme.onSurfaceVariant),
                ),
              ],
            ),
          ),
          const SizedBox(width: 16),
          FilledButton.tonal(
            onPressed: onTap,
            child: const Text('Open'),
          ),
        ],
      ),
    );
  }
}

class _DashboardHero extends StatelessWidget {
  const _DashboardHero({required this.session, required this.dashboard});

  final UserSession session;
  final RoleDashboard dashboard;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final textTheme = theme.textTheme;
    final colorScheme = theme.colorScheme;
    final emphasisColor = colorScheme.primary.withOpacity(0.12);

    return GigvoraCard(
      padding: EdgeInsets.zero,
      child: ClipRRect(
        borderRadius: BorderRadius.circular(24),
        child: Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [
                colorScheme.primary.withOpacity(0.12),
                colorScheme.primaryContainer.withOpacity(0.18),
              ],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
          ),
          padding: const EdgeInsets.fromLTRB(28, 28, 28, 32),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                dashboard.heroTitle,
                style: textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.w700,
                  color: colorScheme.onPrimaryContainer,
                ),
              ),
              const SizedBox(height: 12),
              Text(
                dashboard.heroSubtitle,
                style: textTheme.bodyMedium?.copyWith(
                  color: colorScheme.onPrimaryContainer.withOpacity(0.82),
                ),
              ),
              const SizedBox(height: 20),
              Wrap(
                spacing: 12,
                runSpacing: 12,
                children: [
                  _HeroPill(
                    icon: Icons.people_outline,
                    label: 'Connections',
                    value: session.connections.toString(),
                    backgroundColor: emphasisColor,
                  ),
                  _HeroPill(
                    icon: Icons.favorite_outline,
                    label: 'Followers',
                    value: session.followers.toString(),
                    backgroundColor: emphasisColor,
                  ),
                  if (session.companies.isNotEmpty)
                    _HeroPill(
                      icon: Icons.business,
                      label: 'Companies',
                      value: session.companies.join(', '),
                      backgroundColor: emphasisColor,
                    ),
                  if (session.agencies.isNotEmpty)
                    _HeroPill(
                      icon: Icons.apartment_outlined,
                      label: 'Agencies',
                      value: session.agencies.join(', '),
                      backgroundColor: emphasisColor,
                    ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _HeroPill extends StatelessWidget {
  const _HeroPill({
    required this.icon,
    required this.label,
    required this.value,
    required this.backgroundColor,
  });

  final IconData icon;
  final String label;
  final String value;
  final Color backgroundColor;

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 18),
          const SizedBox(width: 8),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label, style: textTheme.labelSmall),
              Text(
                value,
                style: textTheme.labelLarge?.copyWith(fontWeight: FontWeight.w600),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

String _surfaceForRole(String role) {
  switch (role) {
    case 'admin':
      return 'admin_dashboard';
    case 'freelancer':
      return 'freelancer_dashboard';
    case 'company':
      return 'company_dashboard';
    case 'agency':
      return 'agency_dashboard';
    case 'headhunter':
      return 'headhunter_dashboard';
    default:
      return 'user_dashboard';
  }
}

class _MetricsWrap extends StatelessWidget {
  const _MetricsWrap({required this.metrics});

  final List<DashboardMetric> metrics;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final maxWidth = constraints.maxWidth;
        const spacing = 16.0;
        final twoColumn = maxWidth > 520;
        final cardWidth = twoColumn ? (maxWidth - spacing) / 2 : maxWidth;
        return Wrap(
          spacing: spacing,
          runSpacing: spacing,
          children: metrics
              .map(
                (metric) => SizedBox(
                  width: cardWidth,
                  child: _MetricCard(metric: metric),
                ),
              )
              .toList(),
        );
      },
    );
  }
}

class _FeedPreviewCard extends StatelessWidget {
  const _FeedPreviewCard({
    required this.state,
    required this.posts,
    required this.onOpenTimeline,
    required this.onRefresh,
    required this.onReact,
    required this.onComment,
    required this.onShare,
  });

  final ResourceState<List<FeedPost>> state;
  final List<FeedPost> posts;
  final VoidCallback onOpenTimeline;
  final Future<void> Function() onRefresh;
  final Future<void> Function(FeedPost post, bool liked) onReact;
  final Future<FeedComment?> Function(FeedPost post) onComment;
  final Future<void> Function(FeedPost post) onShare;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final isLoading = state.loading && posts.isEmpty;
    final hasError = state.hasError && !state.loading;

    return GigvoraCard(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Timeline snapshot', style: theme.textTheme.titleMedium),
                    const SizedBox(height: 4),
                    Text(
                      'See how your network is engaging before jumping into the full feed.',
                      style: theme.textTheme.bodySmall?.copyWith(color: colorScheme.onSurfaceVariant),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 12),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                alignment: WrapAlignment.end,
                children: [
                  if (state.lastUpdated != null)
                    Chip(
                      avatar: const Icon(Icons.schedule, size: 18),
                      label: Text(formatRelativeTime(state.lastUpdated!)),
                      visualDensity: VisualDensity.compact,
                    ),
                  if (state.fromCache)
                    Chip(
                      avatar: const Icon(Icons.offline_bolt, size: 18),
                      label: const Text('Offline copy'),
                      visualDensity: VisualDensity.compact,
                      backgroundColor: colorScheme.secondaryContainer,
                    ),
                  FilledButton.tonalIcon(
                    onPressed: state.loading ? null : () => onRefresh(),
                    icon: const Icon(Icons.refresh),
                    label: const Text('Refresh'),
                  ),
                ],
              ),
            ],
          ),
          if (isLoading) ...[
            const SizedBox(height: 16),
            LinearProgressIndicator(minHeight: 4, backgroundColor: colorScheme.surfaceVariant),
          ] else if (hasError) ...[
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: colorScheme.errorContainer,
                borderRadius: BorderRadius.circular(16),
              ),
              child: Text(
                'We had trouble syncing the latest timeline posts. Try refreshing or open the feed to retry.',
                style: theme.textTheme.bodySmall?.copyWith(color: colorScheme.onErrorContainer),
              ),
            ),
          ] else if (posts.isEmpty) ...[
            const SizedBox(height: 16),
            Text(
              'Your network hasn\'t shared anything new yet. Post an update or explore the feed to spark activity.',
              style: theme.textTheme.bodyMedium,
            ),
          ] else ...[
            const SizedBox(height: 16),
            ...posts.map(
              (post) => Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: _FeedPreviewTile(
                  post: post,
                  onReact: onReact,
                  onComment: onComment,
                  onShare: onShare,
                ),
              ),
            ),
          ],
          const SizedBox(height: 8),
          Align(
            alignment: Alignment.centerLeft,
            child: FilledButton.icon(
              onPressed: onOpenTimeline,
              icon: const Icon(Icons.forum_outlined),
              label: const Text('Open timeline'),
            ),
          ),
        ],
      ),
    );
  }
}

class _FeedPreviewTile extends StatefulWidget {
  const _FeedPreviewTile({
    required this.post,
    required this.onReact,
    required this.onComment,
    required this.onShare,
  });

  final FeedPost post;
  final Future<void> Function(FeedPost post, bool liked) onReact;
  final Future<FeedComment?> Function(FeedPost post) onComment;
  final Future<void> Function(FeedPost post) onShare;

  @override
  State<_FeedPreviewTile> createState() => _FeedPreviewTileState();
}

class _FeedPreviewTileState extends State<_FeedPreviewTile> {
  late bool _liked;
  late int _reactionCount;
  late int _commentCount;
  FeedComment? _latestComment;

  @override
  void initState() {
    super.initState();
    _syncFromWidget(resetComment: true);
  }

  @override
  void didUpdateWidget(covariant _FeedPreviewTile oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.post.id != widget.post.id) {
      _syncFromWidget(resetComment: true);
    } else if (oldWidget.post.reactionCount != widget.post.reactionCount ||
        oldWidget.post.commentCount != widget.post.commentCount ||
        oldWidget.post.viewerHasReacted != widget.post.viewerHasReacted) {
      _syncFromWidget(resetComment: false);
    }
  }

  void _syncFromWidget({required bool resetComment}) {
    _liked = widget.post.viewerHasReacted;
    _reactionCount = widget.post.reactionCount;
    _commentCount = widget.post.commentCount;
    if (resetComment) {
      _latestComment = null;
    }
  }

  void _toggleReaction() {
    final nextLiked = !_liked;
    setState(() {
      _liked = nextLiked;
      _reactionCount = (nextLiked ? _reactionCount + 1 : _reactionCount - 1).clamp(0, 1000000);
    });
    unawaited(widget.onReact(widget.post, nextLiked));
  }

  void _comment() {
    unawaited(() async {
      final comment = await widget.onComment(widget.post);
      if (!mounted || comment == null) {
        return;
      }
      setState(() {
        _commentCount += 1;
        _latestComment = comment;
      });
    }());
  }

  void _share() {
    unawaited(widget.onShare(widget.post));
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final summaryText = widget.post.summary?.isNotEmpty == true ? widget.post.summary! : widget.post.content;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: colorScheme.surfaceVariant,
        borderRadius: BorderRadius.circular(18),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              CircleAvatar(
                backgroundColor: colorScheme.primaryContainer,
                child: Text(
                  widget.post.author.name.isNotEmpty
                      ? widget.post.author.name.characters.first.toUpperCase()
                      : '?',
                  style: theme.textTheme.titleMedium?.copyWith(color: colorScheme.onPrimaryContainer),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      widget.post.author.name,
                      style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600),
                    ),
                    if ((widget.post.author.headline ?? '').isNotEmpty)
                      Text(
                        widget.post.author.headline!,
                        style: theme.textTheme.bodySmall?.copyWith(color: colorScheme.onSurfaceVariant),
                      ),
                    const SizedBox(height: 4),
                    Text(
                      formatRelativeTime(widget.post.publishedAt ?? widget.post.createdAt),
                      style: theme.textTheme.bodySmall?.copyWith(color: colorScheme.onSurfaceVariant),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            summaryText,
            style: theme.textTheme.bodyMedium,
            maxLines: 3,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 8),
          Wrap(
            spacing: 12,
            runSpacing: 8,
            children: [
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(_liked ? Icons.favorite : Icons.favorite_border, size: 18),
                  const SizedBox(width: 4),
                  Text('$_reactionCount'),
                ],
              ),
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.chat_bubble_outline, size: 18),
                  const SizedBox(width: 4),
                  Text('$_commentCount'),
                ],
              ),
              if (widget.post.link != null)
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: const [
                    Icon(Icons.link, size: 18),
                    SizedBox(width: 4),
                    Text('Link attached'),
                  ],
                ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: _toggleReaction,
                  icon: Icon(_liked ? Icons.favorite : Icons.favorite_border),
                  label: Text(_reactionCount > 0 ? '$_reactionCount' : 'Appreciate'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: _liked ? colorScheme.primary : colorScheme.onSurface,
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: _comment,
                  icon: const Icon(Icons.mode_comment_outlined),
                  label: Text(_commentCount > 0 ? '$_commentCount' : 'Comment'),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: _share,
                  icon: const Icon(Icons.share_outlined),
                  label: const Text('Share'),
                ),
              ),
            ],
          ),
          if (_latestComment != null) ...[
            const SizedBox(height: 8),
            Text(
              'You: ${_latestComment!.message}',
              style: theme.textTheme.bodySmall?.copyWith(color: colorScheme.onSurfaceVariant),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ],
      ),
    );
  }
}

class _NetworkHighlightsCard extends StatelessWidget {
  const _NetworkHighlightsCard({
    required this.state,
    required this.onRefresh,
    required this.onOpenNetwork,
    required this.onRequestIntroduction,
  });

  final ResourceState<ConnectionNetwork> state;
  final Future<void> Function() onRefresh;
  final VoidCallback onOpenNetwork;
  final Future<void> Function(ConnectionNode node) onRequestIntroduction;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final network = state.data;
    final summary = network?.summary;
    final suggestions = network == null
        ? const <ConnectionNode>[]
        : <ConnectionNode>[...network.secondDegree, ...network.thirdDegree]
            .where((node) => node.actions.canRequestConnection || node.actions.canMessage)
            .take(3)
            .toList(growable: false);
    final isLoading = state.loading && network == null;
    final hasError = state.hasError && !state.loading;

    return GigvoraCard(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Connection intelligence', style: theme.textTheme.titleMedium),
                    const SizedBox(height: 4),
                    Text(
                      'Review mutual introductions, degree summaries, and top warm leads before diving into the network graph.',
                      style: theme.textTheme.bodySmall?.copyWith(color: colorScheme.onSurfaceVariant),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 12),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                alignment: WrapAlignment.end,
                children: [
                  if (network?.generatedAt != null)
                    Chip(
                      avatar: const Icon(Icons.schedule, size: 18),
                      label: Text('Synced ${formatRelativeTime(network!.generatedAt)}'),
                      visualDensity: VisualDensity.compact,
                    ),
                  if (state.fromCache)
                    Chip(
                      avatar: const Icon(Icons.offline_pin, size: 18),
                      label: const Text('Cached insights'),
                      backgroundColor: colorScheme.secondaryContainer,
                      visualDensity: VisualDensity.compact,
                    ),
                  FilledButton.tonalIcon(
                    onPressed: state.loading ? null : () => onRefresh(),
                    icon: const Icon(Icons.refresh),
                    label: const Text('Refresh'),
                  ),
                ],
              ),
            ],
          ),
          if (isLoading) ...[
            const SizedBox(height: 16),
            LinearProgressIndicator(minHeight: 4, backgroundColor: colorScheme.surfaceVariant),
          ] else if (hasError) ...[
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: colorScheme.errorContainer,
                borderRadius: BorderRadius.circular(16),
              ),
              child: Text(
                'We couldn\'t update your networking insights. Pull to refresh or open the graph for the latest data.',
                style: theme.textTheme.bodySmall?.copyWith(color: colorScheme.onErrorContainer),
              ),
            ),
          ] else if (network == null) ...[
            const SizedBox(height: 16),
            Text(
              'Network insights will appear once you connect with more members and organisers share session data.',
              style: theme.textTheme.bodyMedium,
            ),
          ] else ...[
            const SizedBox(height: 16),
            if (summary != null)
              Wrap(
                spacing: 12,
                runSpacing: 12,
                children: [
                  _NetworkSummaryChip(
                    icon: Icons.people_outline,
                    label: '1st-degree',
                    value: '${summary.firstDegree}',
                    background: colorScheme.primaryContainer,
                  ),
                  _NetworkSummaryChip(
                    icon: Icons.groups_2_outlined,
                    label: '2nd-degree',
                    value: '${summary.secondDegree}',
                    background: colorScheme.secondaryContainer,
                  ),
                  _NetworkSummaryChip(
                    icon: Icons.hub_outlined,
                    label: '3rd-degree',
                    value: '${summary.thirdDegree}',
                    background: colorScheme.tertiaryContainer,
                  ),
                  _NetworkSummaryChip(
                    icon: Icons.auto_graph,
                    label: 'Total reach',
                    value: '${summary.total}',
                    background: colorScheme.surfaceVariant,
                  ),
                ],
              ),
            if (suggestions.isNotEmpty) ...[
              const SizedBox(height: 16),
              Text('Warm introductions to pursue', style: theme.textTheme.titleSmall),
              const SizedBox(height: 12),
              ...suggestions.map(
                (node) => Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: _NetworkSuggestionTile(
                    node: node,
                    onRequestIntroduction: onRequestIntroduction,
                  ),
                ),
              ),
            ] else ...[
              const SizedBox(height: 16),
              Text(
                'We\'ll highlight warm introductions as soon as organisers schedule more networking sessions.',
                style: theme.textTheme.bodyMedium,
              ),
            ],
          ],
          const SizedBox(height: 8),
          Align(
            alignment: Alignment.centerLeft,
            child: FilledButton.icon(
              onPressed: onOpenNetwork,
              icon: const Icon(Icons.hub_outlined),
              label: const Text('Open network graph'),
            ),
          ),
        ],
      ),
    );
  }
}

class _NetworkSummaryChip extends StatelessWidget {
  const _NetworkSummaryChip({
    required this.icon,
    required this.label,
    required this.value,
    required this.background,
  });

  final IconData icon;
  final String label;
  final String value;
  final Color background;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(18),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 20, color: colorScheme.onSurface),
          const SizedBox(width: 8),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label, style: theme.textTheme.labelSmall),
              Text(value, style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600)),
            ],
          ),
        ],
      ),
    );
  }
}

class _NetworkSuggestionTile extends StatefulWidget {
  const _NetworkSuggestionTile({
    required this.node,
    required this.onRequestIntroduction,
  });

  final ConnectionNode node;
  final Future<void> Function(ConnectionNode node) onRequestIntroduction;

  @override
  State<_NetworkSuggestionTile> createState() => _NetworkSuggestionTileState();
}

class _NetworkSuggestionTileState extends State<_NetworkSuggestionTile> {
  bool _requesting = false;

  Future<void> _handleRequest() async {
    if (_requesting || !widget.node.actions.canRequestConnection) {
      return;
    }
    setState(() => _requesting = true);
    try {
      await widget.onRequestIntroduction(widget.node);
    } finally {
      if (mounted) {
        setState(() => _requesting = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final connectorNames = widget.node.connectors.map((connector) => connector.name).take(3).join(', ');

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: colorScheme.surfaceVariant,
        borderRadius: BorderRadius.circular(18),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              CircleAvatar(
                backgroundColor: colorScheme.primaryContainer,
                child: Text(
                  widget.node.name.isNotEmpty ? widget.node.name.characters.first.toUpperCase() : '?',
                  style: theme.textTheme.titleMedium?.copyWith(color: colorScheme.onPrimaryContainer),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(widget.node.name, style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600)),
                    if ((widget.node.headline ?? '').isNotEmpty)
                      Text(
                        widget.node.headline!,
                        style: theme.textTheme.bodySmall?.copyWith(color: colorScheme.onSurfaceVariant),
                      ),
                    const SizedBox(height: 4),
                    Wrap(
                      spacing: 8,
                      runSpacing: 4,
                      children: [
                        Chip(
                          label: Text('${widget.node.mutualConnections} mutual'),
                          avatar: const Icon(Icons.group_add, size: 18),
                          visualDensity: VisualDensity.compact,
                        ),
                        Chip(
                          label: Text(widget.node.degreeLabel),
                          avatar: const Icon(Icons.timeline, size: 18),
                          visualDensity: VisualDensity.compact,
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
          if (connectorNames.isNotEmpty) ...[
            const SizedBox(height: 8),
            Text(
              'Warm path via $connectorNames',
              style: theme.textTheme.bodySmall?.copyWith(color: colorScheme.onSurfaceVariant),
            ),
          ],
          if (widget.node.actions.reason != null) ...[
            const SizedBox(height: 8),
            Text(
              widget.node.actions.reason!,
              style: theme.textTheme.bodySmall?.copyWith(color: colorScheme.onSurfaceVariant),
            ),
          ],
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              if (widget.node.actions.canRequestConnection)
                FilledButton.tonalIcon(
                  onPressed: _requesting ? null : _handleRequest,
                  icon: _requesting
                      ? SizedBox(
                          height: 16,
                          width: 16,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            valueColor: AlwaysStoppedAnimation<Color>(colorScheme.onPrimaryContainer),
                          ),
                        )
                      : const Icon(Icons.handshake_outlined),
                  label: Text(widget.node.actions.requiresIntroduction ? 'Request intro' : 'Connect'),
                ),
              if (widget.node.actions.canMessage)
                OutlinedButton.icon(
                  onPressed: () => GoRouter.of(context).go('/inbox'),
                  icon: const Icon(Icons.chat_outlined),
                  label: const Text('Message'),
                ),
            ],
          ),
        ],
      ),
    );
  }
}

class _SupportAndInfoCard extends StatelessWidget {
  const _SupportAndInfoCard();

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final router = GoRouter.of(context);
    return GigvoraCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Need help or context?', style: theme.textTheme.titleMedium),
          const SizedBox(height: 8),
          Text(
            'Access live support, learn about Gigvora, or review our privacy commitments in a few taps.',
            style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant),
          ),
          const SizedBox(height: 16),
          _SupportTile(
            icon: Icons.support_agent_outlined,
            title: 'Support centre',
            description: 'Escalate tickets, browse knowledge base articles, and manage SLAs.',
            actionLabel: 'Open support',
            onTap: () => router.go('/support'),
          ),
          const Divider(height: 28),
          _SupportTile(
            icon: Icons.info_outline,
            title: 'About Gigvora',
            description: 'Meet the team, explore our mission, and review partnership milestones.',
            actionLabel: 'Explore story',
            onTap: () => router.go('/about'),
          ),
          const Divider(height: 28),
          _SupportTile(
            icon: Icons.privacy_tip_outlined,
            title: 'Privacy & compliance',
            description: 'Manage consent, monitor request history, and download compliance docs.',
            actionLabel: 'Privacy hub',
            onTap: () => router.go('/privacy'),
          ),
        ],
      ),
    );
  }
}

class _SupportTile extends StatelessWidget {
  const _SupportTile({
    required this.icon,
    required this.title,
    required this.description,
    required this.actionLabel,
    required this.onTap,
  });

  final IconData icon;
  final String title;
  final String description;
  final String actionLabel;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: 48,
          height: 48,
          decoration: BoxDecoration(
            color: theme.colorScheme.primary.withOpacity(0.12),
            borderRadius: BorderRadius.circular(16),
          ),
          child: Icon(icon, color: theme.colorScheme.primary),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: theme.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w600)),
              const SizedBox(height: 6),
              Text(description, style: theme.textTheme.bodyMedium),
            ],
          ),
        ),
        const SizedBox(width: 12),
        FilledButton.tonal(
          onPressed: onTap,
          child: Text(actionLabel),
        ),
      ],
    );
  }
}

class _MetricCard extends StatelessWidget {
  const _MetricCard({required this.metric});

  final DashboardMetric metric;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    return GigvoraCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            metric.label,
            style: theme.textTheme.labelLarge,
          ),
          const SizedBox(height: 12),
          Text(
            metric.value,
            style: theme.textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w600),
          ),
          if (metric.trend != null) ...[
            const SizedBox(height: 8),
            Text(
              metric.trend!,
              style: theme.textTheme.bodySmall?.copyWith(
                color: colorScheme.onSurfaceVariant,
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _DashboardSectionCard extends StatelessWidget {
  const _DashboardSectionCard({required this.section});

  final DashboardSection section;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final accent = section.accentColor ?? colorScheme.primary;
    return GigvoraCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                decoration: BoxDecoration(
                  color: accent.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(16),
                ),
                padding: const EdgeInsets.all(10),
                child: Icon(section.icon, color: accent),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      section.title,
                      style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      section.subtitle,
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: colorScheme.onSurfaceVariant,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: section.highlights
                .map(
                  (item) => Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Icon(Icons.brightness_1, size: 8, color: accent),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            item,
                            style: theme.textTheme.bodyMedium,
                          ),
                        ),
                      ],
                    ),
                  ),
                )
                .toList(),
          ),
        ],
      ),
    );
  }
}

class _DashboardActions extends StatelessWidget {
  const _DashboardActions({required this.actions});

  final List<DashboardAction> actions;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    return GigvoraCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Next best actions',
            style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: 12),
          ...actions.map(
            (action) => Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    margin: const EdgeInsets.only(top: 4),
                    width: 8,
                    height: 8,
                    decoration: BoxDecoration(
                      color: colorScheme.primary,
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          action.label,
                          style: theme.textTheme.labelLarge?.copyWith(fontWeight: FontWeight.w600),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          action.description,
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: colorScheme.onSurfaceVariant,
                          ),
                        ),
                        if (action.route != null) ...[
                          const SizedBox(height: 8),
                          Align(
                            alignment: Alignment.centerLeft,
                            child: FilledButton.tonal(
                              onPressed: () => GoRouter.of(context).go(action.route!),
                              child: const Text('Open'),
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _AdminAdsCallout extends StatelessWidget {
  const _AdminAdsCallout();

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    return GigvoraCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Gigvora Ads console',
            style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: 8),
          Text(
            'Review campaign coverage, placements, and recommendations to keep monetisation surfaces healthy.',
            style: theme.textTheme.bodyMedium?.copyWith(color: colorScheme.onSurfaceVariant),
          ),
          const SizedBox(height: 16),
          FilledButton.icon(
            onPressed: () => GoRouter.of(context).go('/admin/ads'),
            icon: const Icon(Icons.campaign_outlined),
            label: const Text('Open console'),
          ),
        ],
      ),
    );
  }
}
