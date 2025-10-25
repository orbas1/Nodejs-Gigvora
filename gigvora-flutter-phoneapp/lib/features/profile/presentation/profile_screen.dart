import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:gigvora_mobile/router/app_routes.dart';
import 'package:intl/intl.dart';

import '../../../core/providers.dart';
import '../../../theme/widgets.dart';
import '../../auth/application/session_controller.dart';
import '../../marketing/gigvora_ads.dart';
import '../application/profile_controller.dart';
import '../application/profile_reputation_controller.dart';
import '../data/models/profile.dart';
import '../data/models/profile_update.dart';
import '../data/models/reputation.dart';

const _profileAccessRoles = <String>{
  'freelancer',
  'mentor',
  'agency',
  'client',
  'company',
  'user',
  'admin',
  'headhunter',
};

const _availabilityStatusLabels = <String, String>{
  'available_now': 'Available now',
  'limited_capacity': 'Limited capacity',
  'booked_out': 'Booked out',
  'on_leave': 'On leave',
};

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key, this.profileId});

  final String? profileId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final sessionState = ref.watch(sessionControllerProvider);
    final session = sessionState.session;
    final config = ref.watch(appConfigProvider);
    final fallbackId = config.featureFlags['demoProfileId'] as String?;
    final resolvedProfileId = profileId ?? session?.profileId ?? fallbackId ?? 'usr_demo';
    final hasProfileId = resolvedProfileId.isNotEmpty;
    final accessAllowed = sessionState.isAuthenticated &&
        session != null &&
        session.memberships.any(_profileAccessRoles.contains);

    if (!sessionState.isAuthenticated) {
      return GigvoraScaffold(
        title: 'Profile',
        subtitle: 'Secure workspace',
        useAppDrawer: true,
        body: Center(
          child: GigvoraCard(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Sign in to access your profile',
                  style: Theme.of(context).textTheme.titleLarge,
                ),
                const SizedBox(height: 12),
                Text(
                  'Authenticate with your Gigvora account to review availability, metrics, and collaboration history.',
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
                const SizedBox(height: 16),
                FilledButton(
                  onPressed: () =>
                      context.go(AppRoute.login.path),
                  child: const Text('Go to secure login'),
                ),
              ],
            ),
          ),
        ),
      );
    }

    if (!accessAllowed) {
      return GigvoraScaffold(
        title: 'Profile',
        subtitle: session?.roleLabel(session.activeMembership) ?? 'Workspace access required',
        useAppDrawer: true,
        body: Center(
          child: GigvoraCard(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Profile workspace required',
                  style: Theme.of(context).textTheme.titleLarge,
                ),
                const SizedBox(height: 12),
                Text(
                  'Switch to a freelancer, agency, or admin role to view the profile cockpit. Contact your organisation admin if you need access.',
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
                const SizedBox(height: 16),
                FilledButton.tonal(
                  onPressed: () =>
                      context.go(AppRoute.home.path),
                  child: const Text('Return to home'),
                ),
              ],
            ),
          ),
        ),
      );
    }

    if (!hasProfileId) {
      return GigvoraScaffold(
        title: 'Profile',
        subtitle: 'No profile linked',
        useAppDrawer: true,
        body: Center(
          child: GigvoraCard(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'No profile is linked to this account yet',
                  style: Theme.of(context).textTheme.titleLarge,
                ),
                const SizedBox(height: 12),
                Text(
                  'Ask your workspace admin to provision a profile or reach out to support@gigvora.com for assistance.',
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
              ],
            ),
          ),
        ),
      );
    }

    final state = ref.watch(profileControllerProvider(resolvedProfileId));
    final controller = ref.read(profileControllerProvider(resolvedProfileId).notifier);
    final canEditProfile = sessionState.isAuthenticated &&
        session != null &&
        (session.profileId == resolvedProfileId || session.memberships.contains('admin'));
    const allowedReputationMemberships = <String>{'freelancer', 'agency', 'admin', 'trust'};
    final hasAuthorizedMembership =
        (session?.memberships ?? const <String>[]).any(allowedReputationMemberships.contains);
    final hasValidProfileId = _isNumericProfileId(resolvedProfileId);
    final canAccessReputation = sessionState.isAuthenticated && hasAuthorizedMembership && hasValidProfileId;
    final reputationAccessMessage = _reputationAccessMessage(
      isAuthenticated: sessionState.isAuthenticated,
      hasAuthorizedMembership: hasAuthorizedMembership,
      hasValidProfileId: hasValidProfileId,
    );

    final profile = state.data;
    late final ResourceState<ReputationOverview> reputationState;
    ProfileReputationController? reputationController;
    if (canAccessReputation) {
      reputationState = ref.watch(profileReputationControllerProvider(resolvedProfileId));
      reputationController = ref.read(profileReputationControllerProvider(resolvedProfileId).notifier);
    } else {
      reputationState = const ResourceState<ReputationOverview>();
    }

    Future<void> refresh() => controller.refresh();

    Future<void> openEditDetails(ProfileModel profile) async {
      final request = await showModalBottomSheet<ProfileUpdateRequest>(
        context: context,
        isScrollControlled: true,
        builder: (context) => _ProfileDetailsSheet(profile: profile),
      );
      if (request == null) {
        return;
      }
      try {
        await controller.updateProfileDetails(request);
        if (!context.mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Profile updated successfully.')),
        );
      } catch (error) {
        if (!context.mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Unable to update profile. $error')),
        );
      }
    }

    Future<void> openExperienceEditor({ProfileExperience? experience}) async {
      final result = await showModalBottomSheet<_ExperienceEditorResult>(
        context: context,
        isScrollControlled: true,
        builder: (context) => _ExperienceEditorSheet(experience: experience),
      );
      if (result == null) {
        return;
      }
      try {
        await controller.saveExperience(
          result.draft,
          experienceId: result.experienceId,
        );
        if (!context.mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(result.experienceId == null
                ? 'Experience added to your profile.'
                : 'Experience updated successfully.'),
          ),
        );
      } catch (error) {
        if (!context.mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Unable to save experience. $error')),
        );
      }
    }

    Future<void> confirmDeleteExperience(ProfileExperience experience) async {
      final confirmed = await showDialog<bool>(
        context: context,
        builder: (dialogContext) {
          return AlertDialog(
            title: const Text('Delete experience'),
            content: Text('Remove ${experience.title} at ${experience.organisation}?'),
            actions: [
              TextButton(
                onPressed: () => Navigator.of(dialogContext).pop(false),
                child: const Text('Cancel'),
              ),
              FilledButton.tonal(
                onPressed: () => Navigator.of(dialogContext).pop(true),
                child: const Text('Delete'),
              ),
            ],
          );
        },
      );
      if (confirmed != true) {
        return;
      }
      try {
        await controller.removeExperience(experience.id);
        if (!context.mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Experience removed.')),
        );
      } catch (error) {
        if (!context.mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Unable to remove experience. $error')),
        );
      }
    }

    return GigvoraScaffold(
      title: profile?.fullName ?? 'Profile',
      subtitle: profile?.headline ?? 'Your Gigvora presence',
      useAppDrawer: true,
      actions: [
        IconButton(
          tooltip: 'Refresh profile',
          onPressed: () {
            controller.refresh();
          },
          icon: const Icon(Icons.refresh),
        ),
      ],
      body: RefreshIndicator(
        onRefresh: refresh,
        child: ListView(
          padding: const EdgeInsets.only(bottom: 32),
          children: [
            if (state.loading && profile == null)
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 48),
                child: Center(child: CircularProgressIndicator()),
              ),
            if (state.hasError && profile == null)
              _ErrorState(
                error: state.error,
                onRetry: () => controller.refresh(),
              ),
            if (profile != null) ...[
              GigvoraAdBanner(data: profileAdBanner),
              const SizedBox(height: 16),
              _ProfileHeaderCard(
                profile: profile,
                onEdit: canEditProfile ? () => openEditDetails(profile) : null,
              ),
              const SizedBox(height: 16),
              if (profile.metrics.isNotEmpty) ...[
                _ProfileMetricsCard(metrics: profile.metrics),
                const SizedBox(height: 16),
              ],
              if (canAccessReputation &&
                  (reputationState.loading ||
                      reputationState.data != null ||
                      reputationState.hasError)) ...[
                _ReputationCard(
                  state: reputationState,
                  onRefresh: reputationController!.refresh,
                ),
                const SizedBox(height: 16),
              ],
              if (!canAccessReputation && reputationAccessMessage != null) ...[
                _ReputationAccessNotice(message: reputationAccessMessage),
                const SizedBox(height: 16),
              ],
              if (profile.skills.isNotEmpty) ...[
                _SkillsCard(
                  skills: profile.skills,
                  onSkillTap: controller.recordSkillTap,
                ),
                const SizedBox(height: 16),
              ],
              _AvailabilityCard(availability: profile.availability, focusAreas: profile.focusAreas),
              const SizedBox(height: 16),
              _ReferencesCard(
                references: profile.references,
                settings: profile.referenceSettings,
                onToggleSetting: controller.updateReferenceSettings,
                onRequestInvite: controller.sendReferenceInvite,
              ),
              const SizedBox(height: 16),
              if (profile.groups.isNotEmpty) ...[
                _GroupsCard(
                  groups: profile.groups,
                  onGroupTap: (group) async {
                    unawaited(controller.recordGroupTap(group));
                    if (context.mounted) {
                      GoRouter.of(context).push('/groups/${group.id}');
                    }
                  },
                ),
                const SizedBox(height: 16),
              ],
              _ExperienceCard(
                experiences: profile.experiences,
                canManage: canEditProfile,
                onCreate: canEditProfile ? () => openExperienceEditor() : null,
                onEdit: canEditProfile ? (experience) => openExperienceEditor(experience: experience) : null,
                onDelete: canEditProfile ? (experience) => confirmDeleteExperience(experience) : null,
              ),
              const SizedBox(height: 16),
              GigvoraAdGrid(ads: profileAds, margin: const EdgeInsets.only(top: 8)),
            ],
          ],
        ),
      ),
    );
  }
}

bool _isNumericProfileId(String value) {
  final parsed = int.tryParse(value);
  return parsed != null && parsed > 0;
}

String? _reputationAccessMessage({
  required bool isAuthenticated,
  required bool hasAuthorizedMembership,
  required bool hasValidProfileId,
}) {
  if (!isAuthenticated) {
    return 'Sign in with an authorised freelancer or agency workspace to unlock live reputation controls.';
  }
  if (!hasAuthorizedMembership) {
    return 'Reputation controls are limited to freelancer, agency, trust, or admin workspaces. Switch workspaces to continue.';
  }
  if (!hasValidProfileId) {
    return 'Reputation insights require a numeric freelancer profile identifier before they can be loaded.';
  }
  return null;
typedef ReferenceSettingsHandler = Future<void> Function(ProfileReferenceSettings settings);

typedef ReferenceInviteHandler = Future<void> Function({
  required String clientName,
  String? email,
  String? relationship,
  String? message,
});

class _ReferencesCard extends StatefulWidget {
  const _ReferencesCard({
    required this.references,
    required this.settings,
    required this.onToggleSetting,
    required this.onRequestInvite,
  });

  final List<ProfileReference> references;
  final ProfileReferenceSettings settings;
  final ReferenceSettingsHandler onToggleSetting;
  final ReferenceInviteHandler onRequestInvite;

  @override
  State<_ReferencesCard> createState() => _ReferencesCardState();
}

class _ReferencesCardState extends State<_ReferencesCard> {
  late ProfileReferenceSettings _settings;
  bool _savingSettings = false;
  bool _sendingInvite = false;

  final _formKey = GlobalKey<FormState>();
  final _clientController = TextEditingController();
  final _emailController = TextEditingController();
  final _relationshipController = TextEditingController();
  final _messageController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _settings = widget.settings;
  }

  @override
  void didUpdateWidget(covariant _ReferencesCard oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.settings != widget.settings) {
      _settings = widget.settings;
    }
  }

  @override
  void dispose() {
    _clientController.dispose();
    _emailController.dispose();
    _relationshipController.dispose();
    _messageController.dispose();
    super.dispose();
  }

  Future<void> _updateSetting(ProfileReferenceSettings next) async {
    setState(() {
      _savingSettings = true;
      _settings = next;
    });
    try {
      await widget.onToggleSetting(next);
    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Unable to update reference settings: $error'),
          ),
        );
      }
      setState(() {
        _settings = widget.settings;
      });
    } finally {
      if (mounted) {
        setState(() {
          _savingSettings = false;
        });
      }
    }
  }

  Future<void> _handleInvite() async {
    final form = _formKey.currentState;
    if (form == null || !form.validate()) {
      return;
    }

    setState(() {
      _sendingInvite = true;
    });

    try {
      await widget.onRequestInvite(
        clientName: _clientController.text.trim(),
        email: _emailController.text.trim().isEmpty ? null : _emailController.text.trim(),
        relationship: _relationshipController.text.trim().isEmpty
            ? null
            : _relationshipController.text.trim(),
        message: _messageController.text.trim().isEmpty ? null : _messageController.text.trim(),
      );

      if (mounted) {
        _formKey.currentState?.reset();
        _clientController.clear();
        _emailController.clear();
        _relationshipController.clear();
        _messageController.clear();
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Secure reference invite sent.')),
        );
      }
    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Invite failed: $error')),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _sendingInvite = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final references = widget.references;
    final verifiedCount = references.where((reference) => reference.verified).length;
    final averageRating = references
        .where((reference) => reference.rating != null)
        .map((reference) => reference.rating!)
        .toList();

    final double? ratingValue =
        averageRating.isEmpty ? null : averageRating.reduce((a, b) => a + b) / averageRating.length;

    final pending = references.where((reference) => reference.status != 'published').toList();

    return GigvoraCard(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('References & endorsements', style: theme.textTheme.titleMedium),
          const SizedBox(height: 12),
          Wrap(
            spacing: 16,
            runSpacing: 16,
            children: [
              _ReferenceMetricChip(label: 'Total', value: '${references.length}'),
              _ReferenceMetricChip(label: 'Verified', value: '$verifiedCount'),
              _ReferenceMetricChip(
                label: 'Average rating',
                value: ratingValue == null ? '—' : ratingValue.toStringAsFixed(1),
              ),
              _ReferenceMetricChip(label: 'Pending', value: '${pending.length}'),
            ],
          ),
          const SizedBox(height: 16),
          Text('Automation preferences', style: theme.textTheme.titleSmall),
          const SizedBox(height: 8),
          Column(
            children: [
              SwitchListTile.adaptive(
                value: _settings.allowPrivate,
                onChanged: _savingSettings
                    ? null
                    : (value) => _updateSetting(_settings.copyWith(allowPrivate: value)),
                title: const Text('Allow private references'),
                subtitle: const Text('Keep sensitive testimonials shielded for enterprise diligence.'),
                contentPadding: EdgeInsets.zero,
              ),
              SwitchListTile.adaptive(
                value: _settings.showBadges,
                onChanged: _savingSettings
                    ? null
                    : (value) => _updateSetting(_settings.copyWith(showBadges: value)),
                title: const Text('Showcase review badges'),
                subtitle: const Text('Display verified trust badges across public surfaces.'),
                contentPadding: EdgeInsets.zero,
              ),
              SwitchListTile.adaptive(
                value: _settings.autoShareToFeed,
                onChanged: _savingSettings
                    ? null
                    : (value) => _updateSetting(_settings.copyWith(autoShareToFeed: value)),
                title: const Text('Share wins to feed'),
                subtitle: const Text('Publish celebratory posts when new testimonials arrive.'),
                contentPadding: EdgeInsets.zero,
              ),
              SwitchListTile.adaptive(
                value: _settings.autoRequest,
                onChanged: _savingSettings
                    ? null
                    : (value) => _updateSetting(_settings.copyWith(autoRequest: value)),
                title: const Text('Auto-request after delivery'),
                subtitle: const Text('Invite clients when milestones close, respecting quiet hours.'),
                contentPadding: EdgeInsets.zero,
              ),
              SwitchListTile.adaptive(
                value: _settings.escalateConcerns,
                onChanged: _savingSettings
                    ? null
                    : (value) => _updateSetting(_settings.copyWith(escalateConcerns: value)),
                title: const Text('Escalate flagged responses'),
                subtitle: const Text('Route negative feedback to success engineers immediately.'),
                contentPadding: EdgeInsets.zero,
              ),
            ],
          ),
          if (_savingSettings)
            const Padding(
              padding: EdgeInsets.only(top: 8),
              child: Align(
                alignment: Alignment.centerLeft,
                child: Text(
                  'Syncing settings…',
                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
                ),
              ),
            ),
          const SizedBox(height: 16),
          Text('Request a reference', style: theme.textTheme.titleSmall),
          const SizedBox(height: 8),
          Form(
            key: _formKey,
            child: Column(
              children: [
                TextFormField(
                  controller: _clientController,
                  decoration: const InputDecoration(labelText: 'Client name'),
                  validator: (value) {
                    if (value == null || value.trim().isEmpty) {
                      return 'Please add the client name';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _emailController,
                  decoration: const InputDecoration(labelText: 'Email (optional)'),
                  keyboardType: TextInputType.emailAddress,
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return null;
                    }
                    final emailRegex = RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$');
                    if (!emailRegex.hasMatch(value.trim())) {
                      return 'Enter a valid email address';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _relationshipController,
                  decoration: const InputDecoration(labelText: 'Relationship (optional)'),
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _messageController,
                  maxLines: 3,
                  decoration: const InputDecoration(labelText: 'Personal note (optional)'),
                ),
                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: _sendingInvite ? null : _handleInvite,
                    child: Text(_sendingInvite ? 'Sending secure invite…' : 'Send reference invite'),
                  ),
                ),
              ],
            ),
          ),
          if (references.isNotEmpty) ...[
            const SizedBox(height: 20),
            Text('Recent testimonials', style: theme.textTheme.titleSmall),
            const SizedBox(height: 8),
            Column(
              children: references.take(3).map((reference) {
                final status = reference.verified ? 'Verified' : reference.status;
                final subtitle = [
                  if (reference.company.isNotEmpty) reference.company,
                  if (reference.lastInteractionAt != null)
                    'Last updated ${DateFormat('MMM d').format(reference.lastInteractionAt!)}',
                ].join(' • ');
                return ListTile(
                  contentPadding: EdgeInsets.zero,
                  title: Text(reference.client, style: theme.textTheme.titleMedium),
                  subtitle: Text(subtitle, style: theme.textTheme.bodySmall),
                  trailing: reference.rating != null
                      ? Chip(
                          label: Text(reference.rating!.toStringAsFixed(1)),
                          backgroundColor: theme.colorScheme.secondaryContainer,
                        )
                      : Text(status, style: theme.textTheme.bodySmall),
                );
              }).toList(),
            ),
          ],
        ],
      ),
    );
  }
}

class _ReferenceMetricChip extends StatelessWidget {
  const _ReferenceMetricChip({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: theme.colorScheme.surfaceVariant,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(value, style: theme.textTheme.titleLarge),
          const SizedBox(height: 4),
          Text(label, style: theme.textTheme.bodySmall),
        ],
      ),
    );
  }
}

class _ProfileHeaderCard extends StatelessWidget {
  const _ProfileHeaderCard({required this.profile, this.onEdit});

  final ProfileModel profile;
  final VoidCallback? onEdit;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final statusLabel = _availabilityStatusLabels[profile.availability.status] ??
        profile.availability.status.replaceAll('_', ' ');
    final nextAvailability = profile.availability.nextAvailability != null
        ? DateFormat('MMM d').format(profile.availability.nextAvailability!.toLocal())
        : null;

    return GigvoraCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              CircleAvatar(
                radius: 32,
                backgroundImage: profile.avatarUrl != null && profile.avatarUrl!.isNotEmpty
                    ? NetworkImage(profile.avatarUrl!)
                    : null,
                child: profile.avatarUrl == null || profile.avatarUrl!.isEmpty
                    ? Text(
                        profile.fullName.isNotEmpty ? profile.fullName[0] : '?',
                        style: theme.textTheme.titleLarge,
                      )
                    : null,
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(profile.fullName, style: theme.textTheme.headlineSmall),
                    const SizedBox(height: 4),
                    if (profile.headline.isNotEmpty)
                      Text(
                        profile.headline,
                        style: theme.textTheme.bodySmall?.copyWith(fontWeight: FontWeight.w600),
                      ),
                    if (profile.location.isNotEmpty)
                      Padding(
                        padding: const EdgeInsets.only(top: 8),
                        child: Row(
                          children: [
                            Icon(Icons.location_on_outlined, size: 18, color: colorScheme.primary),
                            const SizedBox(width: 4),
                            Expanded(
                              child: Text(
                                profile.location,
                                style: theme.textTheme.bodySmall,
                              ),
                            ),
                          ],
                        ),
                      ),
                    if (profile.bio.isNotEmpty)
                      Padding(
                        padding: const EdgeInsets.only(top: 12),
                        child: Text(profile.bio, style: theme.textTheme.bodyMedium),
                      ),
                  ],
                ),
              ),
              if (onEdit != null) ...[
                const SizedBox(width: 12),
                FilledButton.tonalIcon(
                  onPressed: onEdit,
                  icon: const Icon(Icons.edit_outlined),
                  label: const Text('Edit profile'),
                ),
              ],
            ],
          ),
          const SizedBox(height: 16),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              Chip(
                avatar: const Icon(Icons.av_timer, size: 18),
                label: Text(statusLabel),
                backgroundColor: colorScheme.secondaryContainer,
              ),
              if (nextAvailability != null)
                Chip(
                  avatar: const Icon(Icons.calendar_month, size: 18),
                  label: Text('Next availability • $nextAvailability'),
                ),
              if (profile.availability.acceptingVolunteers)
                Chip(
                  avatar: const Icon(Icons.volunteer_activism, size: 18),
                  label: const Text('Accepting volunteers'),
                ),
              if (profile.availability.acceptingLaunchpad)
                Chip(
                  avatar: const Icon(Icons.rocket_launch, size: 18),
                  label: const Text('Open to launchpad'),
                ),
            ],
          ),
          if (profile.focusAreas.isNotEmpty) ...[
            const SizedBox(height: 16),
            Text('Focus areas', style: theme.textTheme.labelLarge),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: profile.focusAreas
                  .map(
                    (area) => Chip(
                      label: Text(area),
                      backgroundColor: colorScheme.surfaceVariant,
                    ),
                  )
                  .toList(),
            ),
          ],
        ],
      ),
    );
  }
}

class _ReputationAccessNotice extends StatelessWidget {
  const _ReputationAccessNotice({required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return GigvoraCard(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(Icons.lock_outline, color: theme.colorScheme.primary),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Reputation access unavailable', style: theme.textTheme.titleSmall),
                const SizedBox(height: 4),
                Text(
                  message,
                  style: theme.textTheme.bodySmall,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _ProfileMetricsCard extends StatelessWidget {
  const _ProfileMetricsCard({required this.metrics});

  final List<ProfileMetric> metrics;

  @override
  Widget build(BuildContext context) {
    return GigvoraCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Impact metrics', style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 12),
          Wrap(
            spacing: 16,
            runSpacing: 16,
            children: metrics
                .map(
                  (metric) => _MetricTile(
                    label: metric.label,
                    value: metric.value,
                  ),
                )
                .toList(),
          ),
        ],
      ),
    );
  }
}

class _MetricTile extends StatelessWidget {
  const _MetricTile({required this.label, required this.value});

  final String label;
  final num value;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return SizedBox(
      width: 120,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '$value',
            style: theme.textTheme.headlineSmall?.copyWith(color: theme.colorScheme.primary),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: theme.textTheme.bodySmall,
          ),
        ],
      ),
    );
  }
}

class _ReputationCard extends StatelessWidget {
  const _ReputationCard({
    required this.state,
    required this.onRefresh,
  });

  final ResourceState<ReputationOverview> state;
  final Future<void> Function() onRefresh;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final data = state.data;
    final stats = _buildStats(data);
    final badges = _mergeBadges(data);
    final testimonials = data?.recentTestimonials ?? const <ReputationTestimonial>[];
    final automation = data?.automationPlaybooks ?? const <String>[];
    final integrations = data?.integrationTouchpoints ?? const <String>[];
    final shareableLinks = data?.shareableLinks ?? const <ReputationShareableLink>[];

    return GigvoraCard(
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
                    Text('Reputation & reviews', style: theme.textTheme.titleMedium),
                    const SizedBox(height: 4),
                    Text(
                      'Operationalise testimonials, trust scores, and review widgets from one mission control.',
                      style: theme.textTheme.bodySmall,
                    ),
                  ],
                ),
              ),
              IconButton(
                tooltip: 'Refresh reputation insights',
                onPressed: state.loading ? null : onRefresh,
                icon: const Icon(Icons.refresh),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              if (state.fromCache)
                Chip(
                  label: const Text('Offline snapshot'),
                  avatar: const Icon(Icons.cloud_off, size: 16),
                  backgroundColor: theme.colorScheme.secondaryContainer.withOpacity(0.6),
                  labelStyle: theme.textTheme.labelSmall?.copyWith(
                    color: theme.colorScheme.onSecondaryContainer,
                  ),
                ),
              if (state.lastUpdated != null)
                Tooltip(
                  message: _formatAbsoluteTime(context, state.lastUpdated!),
                  child: Chip(
                    label: Text('Updated ${_formatRelativeTime(state.lastUpdated!)}'),
                    avatar: const Icon(Icons.schedule, size: 16),
                  ),
                ),
            ],
          ),
          if (state.loading) ...[
            const SizedBox(height: 8),
            const LinearProgressIndicator(minHeight: 3),
          ],
          if (data?.freelancer != null) ...[
            const SizedBox(height: 16),
            _FreelancerHeader(freelancer: data!.freelancer!),
          ],
          if (state.hasError && !state.loading) ...[
            const SizedBox(height: 16),
            _ErrorBanner(message: '${state.error}'),
          ],
          if (stats.isNotEmpty) ...[
            const SizedBox(height: 16),
            Wrap(
              spacing: 12,
              runSpacing: 12,
              children: stats
                  .map(
                    (stat) => _StatChip(
                      label: stat.label,
                      value: stat.value,
                      caption: stat.caption,
                    ),
                  )
                  .toList(),
            ),
          ],
          if (data?.featuredTestimonial != null) ...[
            const SizedBox(height: 24),
            Text('Featured testimonial', style: theme.textTheme.titleSmall),
            const SizedBox(height: 8),
            _TestimonialTile(testimonial: data!.featuredTestimonial!, highlight: true),
          ],
          if (testimonials.isNotEmpty) ...[
            const SizedBox(height: 24),
            Text('Recent testimonials', style: theme.textTheme.titleSmall),
            const SizedBox(height: 8),
            Column(
              children: testimonials
                  .take(3)
                  .map(
                    (testimonial) => Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: _TestimonialTile(testimonial: testimonial),
                    ),
                  )
                  .toList(),
            ),
          ],
          if (data?.featuredStory != null || (data?.stories.isNotEmpty ?? false)) ...[
            const SizedBox(height: 24),
            Text('Success stories', style: theme.textTheme.titleSmall),
            const SizedBox(height: 8),
            if (data?.featuredStory != null)
              _SuccessStoryTile(story: data!.featuredStory!),
            if (data?.stories.isNotEmpty ?? false)
              ...data!.stories
                  .where((story) => story.id != data.featuredStory?.id)
                  .take(2)
                  .map(
                    (story) => Padding(
                      padding: const EdgeInsets.only(top: 12),
                      child: _SuccessStoryTile(story: story),
                    ),
                  ),
          ],
          if (badges.isNotEmpty) ...[
            const SizedBox(height: 24),
            Text('Badges & credentials', style: theme.textTheme.titleSmall),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: badges
                  .map(
                    (badge) => Chip(
                      label: Text(badge.name),
                      avatar: Icon(
                        badge.isPromoted ? Icons.verified : Icons.shield,
                        size: 16,
                        color: badge.isPromoted
                            ? theme.colorScheme.primary
                            : theme.colorScheme.secondary,
                      ),
                      backgroundColor: badge.isPromoted
                          ? theme.colorScheme.primaryContainer.withOpacity(0.6)
                          : theme.colorScheme.surfaceVariant,
                    ),
                  )
                  .toList(),
            ),
          ],
          if (data?.reviewWidgets.isNotEmpty ?? false) ...[
            const SizedBox(height: 24),
            Text('Review widgets', style: theme.textTheme.titleSmall),
            const SizedBox(height: 8),
            Column(
              children: data!.reviewWidgets
                  .take(2)
                  .map(
                    (widget) => Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: _WidgetTile(widget: widget),
                    ),
                  )
                  .toList(),
            ),
          ],
          if (automation.isNotEmpty) ...[
            const SizedBox(height: 24),
            Text('Automation playbooks', style: theme.textTheme.titleSmall),
            const SizedBox(height: 8),
            ...automation.map(
              (item) => Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Icon(Icons.auto_awesome, color: theme.colorScheme.primary, size: 16),
                    const SizedBox(width: 8),
                    Expanded(child: Text(item)),
                  ],
                ),
              ),
            ),
          ],
          if (integrations.isNotEmpty) ...[
            const SizedBox(height: 24),
            Text('Integration touchpoints', style: theme.textTheme.titleSmall),
            const SizedBox(height: 8),
            ...integrations.map(
              (item) => Padding(
                padding: const EdgeInsets.only(bottom: 6),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Icon(Icons.call_split, color: theme.colorScheme.secondary, size: 16),
                    const SizedBox(width: 8),
                    Expanded(child: Text(item)),
                  ],
                ),
              ),
            ),
          ],
          if (shareableLinks.isNotEmpty) ...[
            const SizedBox(height: 24),
            Text('Shareable links', style: theme.textTheme.titleSmall),
            const SizedBox(height: 8),
            ...shareableLinks.map(
              (link) => Padding(
                padding: const EdgeInsets.only(bottom: 6),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(link.label, style: theme.textTheme.bodyMedium),
                    Text(
                      link.url,
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: theme.colorScheme.primary,
                        decoration: TextDecoration.underline,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  List<_ReputationStat> _buildStats(ReputationOverview? data) {
    if (data == null) {
      return const <_ReputationStat>[];
    }
    final metrics = data.metrics;
    final summary = data.summary;
    final stats = <_ReputationStat>[
      _ReputationStat(
        label: 'Testimonials',
        value: _formatCount(summary.totals.testimonials),
        caption: 'Approved social proof',
      ),
      _ReputationStat(
        label: 'Average CSAT',
        value: _formatMetric(metrics.byType('average_csat')) ??
            _formatDouble(summary.performance.averageCsat, suffix: '/5'),
        caption: metrics.byType('average_csat')?.periodLabel,
      ),
      _ReputationStat(
        label: 'Review score',
        value: _formatMetric(metrics.byType('review_score')) ??
            _formatDouble(summary.performance.averageCsat, suffix: '/5'),
        caption: metrics.byType('review_score')?.periodLabel ?? 'Rolling average',
      ),
      _ReputationStat(
        label: 'On-time delivery',
        value: _formatMetric(metrics.byType('on_time_delivery_rate')) ??
            _formatPercent(summary.performance.onTimeDeliveryRate),
        caption: metrics.byType('on_time_delivery_rate')?.periodLabel ?? 'Milestone compliance',
      ),
      _ReputationStat(
        label: 'Active widgets',
        value: _formatCount(summary.totals.activeWidgets),
        caption: 'Live embeds across surfaces',
      ),
      _ReputationStat(
        label: 'Referral-ready clients',
        value: _formatDouble(summary.performance.referralReadyClients, fractionDigits: 0),
        caption: 'Nurture pool',
      ),
    ];
    return stats
        .where((stat) => stat.value.trim().isNotEmpty)
        .take(6)
        .toList(growable: false);
  }

  List<ReputationBadge> _mergeBadges(ReputationOverview? data) {
    if (data == null) {
      return const <ReputationBadge>[];
    }
    final promotedIds = data.promotedBadges.map((badge) => badge.id).toSet();
    final additional = data.badges.where((badge) => !promotedIds.contains(badge.id));
    return [...data.promotedBadges, ...additional];
  }

  static String _formatRelativeTime(DateTime dateTime) {
    final now = DateTime.now();
    final diff = now.difference(dateTime.toLocal());
    if (diff.inSeconds.abs() < 60) {
      return 'just now';
    }
    if (diff.inMinutes.abs() < 60) {
      return '${diff.inMinutes.abs()}m ago';
    }
    if (diff.inHours.abs() < 24) {
      return '${diff.inHours.abs()}h ago';
    }
    if (diff.inDays.abs() < 7) {
      return '${diff.inDays.abs()}d ago';
    }
    if (diff.inDays.abs() < 30) {
      final weeks = (diff.inDays.abs() / 7).round();
      return '${weeks}w ago';
    }
    if (diff.inDays.abs() < 365) {
      final months = (diff.inDays.abs() / 30).round();
      return '${months}mo ago';
    }
    final years = (diff.inDays.abs() / 365).round();
    return '${years}y ago';
  }

  static String _formatAbsoluteTime(BuildContext context, DateTime dateTime) {
    final local = dateTime.toLocal();
    final localizations = MaterialLocalizations.of(context);
    final dateLabel = localizations.formatFullDate(local);
    final timeLabel = localizations.formatTimeOfDay(
      TimeOfDay.fromDateTime(local),
      alwaysUse24HourFormat: false,
    );
    return '$dateLabel • $timeLabel';
  }

  static String _formatCount(int value) => value.toString();

  static String _formatDouble(double? value, {int fractionDigits = 1, String? suffix}) {
    if (value == null) {
      return '—';
    }
    final formatted = value.toStringAsFixed(fractionDigits);
    return suffix != null ? '$formatted$suffix' : formatted;
  }

  static String _formatPercent(double? value) {
    if (value == null) {
      return '—';
    }
    final normalized = value <= 1 ? value * 100 : value;
    return '${normalized.toStringAsFixed(1)}%';
  }

  static String? _formatMetric(ReputationMetric? metric) {
    if (metric == null) {
      return null;
    }
    if (metric.formattedValue != null && metric.formattedValue!.isNotEmpty) {
      return metric.formattedValue;
    }
    if (metric.unit == 'percentage') {
      return _formatPercent(metric.value.toDouble());
    }
    if (metric.unit == 'csat') {
      return metric.value.toStringAsFixed(2);
    }
    return metric.value.toString();
  }
}

class _ReputationStat {
  const _ReputationStat({
    required this.label,
    required this.value,
    this.caption,
  });

  final String label;
  final String value;
  final String? caption;
}

class _StatChip extends StatelessWidget {
  const _StatChip({
    required this.label,
    required this.value,
    this.caption,
  });

  final String label;
  final String value;
  final String? caption;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      width: 150,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: theme.colorScheme.surfaceVariant.withOpacity(0.5),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            value,
            style: theme.textTheme.titleMedium,
          ),
          const SizedBox(height: 4),
          Text(label, style: theme.textTheme.bodySmall),
          if (caption != null && caption!.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(top: 4),
              child: Text(
                caption!,
                style: theme.textTheme.bodySmall?.copyWith(
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _FreelancerHeader extends StatelessWidget {
  const _FreelancerHeader({required this.freelancer});

  final ReputationFreelancer freelancer;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      decoration: BoxDecoration(
        color: theme.colorScheme.primaryContainer.withOpacity(0.35),
        borderRadius: BorderRadius.circular(18),
      ),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            freelancer.name,
            style: theme.textTheme.titleMedium?.copyWith(
              color: theme.colorScheme.primary,
              fontWeight: FontWeight.w600,
            ),
          ),
          if (freelancer.title.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(top: 4),
              child: Text(
                freelancer.title,
                style: theme.textTheme.bodySmall,
              ),
            ),
          Wrap(
            spacing: 12,
            runSpacing: 6,
            children: [
              if (freelancer.location != null && freelancer.location!.isNotEmpty)
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.location_on, size: 14),
                    const SizedBox(width: 4),
                    Text(
                      freelancer.location!,
                      style: theme.textTheme.bodySmall,
                    ),
                  ],
                ),
              if (freelancer.timezone != null && freelancer.timezone!.isNotEmpty)
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.access_time, size: 14),
                    const SizedBox(width: 4),
                    Text(freelancer.timezone!, style: theme.textTheme.bodySmall),
                  ],
                ),
              Chip(
                label: Text(
                  freelancer.trustScore != null
                      ? 'Trust score ${freelancer.trustScore!.toStringAsFixed(1)}'
                      : 'Trust score pending',
                ),
                avatar: const Icon(Icons.shield_outlined, size: 16),
                backgroundColor: theme.colorScheme.onPrimary.withOpacity(0.08),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _TestimonialTile extends StatelessWidget {
  const _TestimonialTile({
    required this.testimonial,
    this.highlight = false,
  });

  final ReputationTestimonial testimonial;
  final bool highlight;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      decoration: BoxDecoration(
        color: highlight
            ? theme.colorScheme.primaryContainer.withOpacity(0.4)
            : theme.colorScheme.surfaceVariant.withOpacity(0.4),
        borderRadius: BorderRadius.circular(16),
      ),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            testimonial.comment,
            style: theme.textTheme.bodyMedium,
          ),
          const SizedBox(height: 12),
          Text(
            testimonial.clientName,
            style: theme.textTheme.titleSmall,
          ),
          if ((testimonial.clientRole ?? '').isNotEmpty || (testimonial.company ?? '').isNotEmpty)
            Text(
              [testimonial.clientRole, testimonial.company]
                  .where((value) => value != null && value!.isNotEmpty)
                  .map((value) => value!)
                  .join(' • '),
              style: theme.textTheme.bodySmall?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
          if (testimonial.rating != null)
            Padding(
              padding: const EdgeInsets.only(top: 8),
              child: Row(
                children: [
                  Icon(Icons.star_rounded, color: theme.colorScheme.primary, size: 18),
                  const SizedBox(width: 4),
                  Text('${testimonial.rating!.toStringAsFixed(1)} / 5'),
                ],
              ),
            ),
        ],
      ),
    );
  }
}

class _SuccessStoryTile extends StatelessWidget {
  const _SuccessStoryTile({required this.story});

  final ReputationSuccessStory story;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      decoration: BoxDecoration(
        color: theme.colorScheme.surfaceVariant.withOpacity(0.5),
        borderRadius: BorderRadius.circular(16),
      ),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(story.title, style: theme.textTheme.titleSmall),
          const SizedBox(height: 6),
          Text(story.summary, style: theme.textTheme.bodySmall),
          if (story.impactMetrics.isNotEmpty) ...[
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: story.impactMetrics.entries
                  .map(
                    (entry) => Chip(
                      label: Text('${entry.key}: ${entry.value}'),
                    ),
                  )
                  .toList(),
            ),
          ],
          if (story.ctaUrl != null && story.ctaUrl!.isNotEmpty) ...[
            const SizedBox(height: 8),
            Text(
              story.ctaUrl!,
              style: theme.textTheme.bodySmall?.copyWith(
                color: theme.colorScheme.primary,
                decoration: TextDecoration.underline,
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _WidgetTile extends StatelessWidget {
  const _WidgetTile({required this.widget});

  final ReputationWidget widget;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      decoration: BoxDecoration(
        color: theme.colorScheme.surfaceVariant.withOpacity(0.5),
        borderRadius: BorderRadius.circular(16),
      ),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(widget.name, style: theme.textTheme.titleSmall),
          const SizedBox(height: 4),
          Text(
            widget.placement ?? 'Active placement',
            style: theme.textTheme.bodySmall?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: 8),
          Wrap(
            spacing: 12,
            children: [
              _WidgetStat(label: 'Impressions', value: widget.impressions),
              _WidgetStat(label: 'CTA clicks', value: widget.ctaClicks),
            ],
          ),
        ],
      ),
    );
  }
}

class _WidgetStat extends StatelessWidget {
  const _WidgetStat({required this.label, this.value});

  final String label;
  final int? value;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          value != null ? value!.toString() : '—',
          style: theme.textTheme.titleMedium,
        ),
        Text(label, style: theme.textTheme.bodySmall),
      ],
    );
  }
}

class _ErrorBanner extends StatelessWidget {
  const _ErrorBanner({required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: theme.colorScheme.errorContainer,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        message,
        style: theme.textTheme.bodySmall?.copyWith(
          color: theme.colorScheme.onErrorContainer,
        ),
      ),
    );
  }
}

class _SkillsCard extends StatelessWidget {
  const _SkillsCard({required this.skills, required this.onSkillTap});

  final List<String> skills;
  final Future<void> Function(String skill) onSkillTap;

  @override
  Widget build(BuildContext context) {
    return GigvoraCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Skills & capabilities', style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: skills
                .map(
                  (skill) => ActionChip(
                    label: Text(skill),
                    onPressed: () => onSkillTap(skill),
                  ),
                )
                .toList(),
          ),
        ],
      ),
    );
  }
}

class _GroupsCard extends StatelessWidget {
  const _GroupsCard({required this.groups, required this.onGroupTap});

  final List<ProfileGroup> groups;
  final Future<void> Function(ProfileGroup group) onGroupTap;

  @override
  Widget build(BuildContext context) {
    return GigvoraCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Communities & programmes', style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 12),
          ...groups.map(
            (group) => ListTile(
              contentPadding: EdgeInsets.zero,
              title: Text(group.name, style: Theme.of(context).textTheme.titleSmall),
              subtitle: group.description != null && group.description!.isNotEmpty
                  ? Text(group.description!)
                  : null,
              trailing: const Icon(Icons.chevron_right),
              onTap: () => onGroupTap(group),
            ),
          ),
        ],
      ),
    );
  }
}

class _AvailabilityCard extends StatelessWidget {
  const _AvailabilityCard({
    required this.availability,
    required this.focusAreas,
  });

  final ProfileAvailability availability;
  final List<String> focusAreas;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return GigvoraCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Availability & focus areas', style: theme.textTheme.titleMedium),
          const SizedBox(height: 12),
          Row(
            children: [
              Icon(
                availability.status == 'available_now' ? Icons.check_circle : Icons.schedule,
                color: availability.status == 'available_now'
                    ? theme.colorScheme.primary
                    : theme.colorScheme.secondary,
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      availability.status == 'available_now'
                          ? 'Available for new engagements now'
                          : 'Next availability ${availability.nextAvailability != null ? availability.nextAvailability!.toLocal().toString().split(' ').first : 'TBC'}',
                      style: theme.textTheme.bodyMedium,
                    ),
                    if (availability.acceptingVolunteers || availability.acceptingLaunchpad)
                      Padding(
                        padding: const EdgeInsets.only(top: 4),
                        child: Text(
                          [
                            if (availability.acceptingVolunteers) 'Open to volunteer invitations',
                            if (availability.acceptingLaunchpad) 'Launchpad opportunities welcomed',
                          ].join(' • '),
                          style: theme.textTheme.bodySmall,
                        ),
                      ),
                  ],
                ),
              ),
            ],
          ),
          if (focusAreas.isNotEmpty) ...[
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: focusAreas
                  .map((area) => Chip(
                        label: Text(area),
                        backgroundColor: theme.colorScheme.primaryContainer,
                        labelStyle: theme.textTheme.labelSmall?.copyWith(color: theme.colorScheme.onPrimaryContainer),
                      ))
                  .toList(),
            ),
          ],
        ],
      ),
    );
  }
}

class _ExperienceCard extends StatelessWidget {
  const _ExperienceCard({
    required this.experiences,
    required this.canManage,
    this.onCreate,
    this.onEdit,
    this.onDelete,
  });

  final List<ProfileExperience> experiences;
  final bool canManage;
  final VoidCallback? onCreate;
  final ValueChanged<ProfileExperience>? onEdit;
  final ValueChanged<ProfileExperience>? onDelete;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    return GigvoraCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(child: Text('Experience', style: theme.textTheme.titleMedium)),
              if (canManage)
                FilledButton.tonalIcon(
                  onPressed: onCreate,
                  icon: const Icon(Icons.add),
                  label: const Text('Add'),
                ),
            ],
          ),
          const SizedBox(height: 12),
          if (experiences.isEmpty)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: colorScheme.surfaceVariant,
                borderRadius: BorderRadius.circular(16),
              ),
              child: Text(
                canManage
                    ? 'Showcase your gigs, projects, and achievements by adding experience highlights.'
                    : 'Experience history has not been published yet.',
                style: theme.textTheme.bodyMedium?.copyWith(color: colorScheme.onSurfaceVariant),
              ),
            )
          else
            ...experiences.map(
              (experience) => Padding(
                padding: const EdgeInsets.only(bottom: 16),
                child: Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: colorScheme.surfaceVariant.withOpacity(0.6),
                    borderRadius: BorderRadius.circular(20),
                  ),
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
                                Text(experience.title, style: theme.textTheme.titleSmall),
                                const SizedBox(height: 4),
                                Text(experience.organisation, style: theme.textTheme.bodySmall),
                              ],
                            ),
                          ),
                          if (canManage && (onEdit != null || onDelete != null))
                            PopupMenuButton<String>(
                              tooltip: 'Experience actions',
                              onSelected: (value) {
                                switch (value) {
                                  case 'edit':
                                    onEdit?.call(experience);
                                    break;
                                  case 'delete':
                                    onDelete?.call(experience);
                                    break;
                                }
                              },
                              itemBuilder: (context) => [
                                if (onEdit != null)
                                  const PopupMenuItem<String>(
                                    value: 'edit',
                                    child: ListTile(
                                      leading: Icon(Icons.edit_outlined),
                                      title: Text('Edit'),
                                    ),
                                  ),
                                if (onDelete != null)
                                  const PopupMenuItem<String>(
                                    value: 'delete',
                                    child: ListTile(
                                      leading: Icon(Icons.delete_outline),
                                      title: Text('Delete'),
                                    ),
                                  ),
                              ],
                            ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Text(
                        _formatExperienceDates(experience),
                        style: theme.textTheme.bodySmall?.copyWith(color: colorScheme.onSurfaceVariant),
                      ),
                      if (experience.summary != null && experience.summary!.isNotEmpty)
                        Padding(
                          padding: const EdgeInsets.only(top: 8),
                          child: Text(
                            experience.summary!,
                            style: theme.textTheme.bodyMedium,
                          ),
                        ),
                      if (experience.achievements.isNotEmpty)
                        Padding(
                          padding: const EdgeInsets.only(top: 12),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: experience.achievements
                                .map(
                                  (achievement) => Padding(
                                    padding: const EdgeInsets.only(bottom: 6),
                                    child: Row(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        const Padding(
                                          padding: EdgeInsets.only(top: 2),
                                          child: Icon(Icons.circle, size: 6),
                                        ),
                                        const SizedBox(width: 8),
                                        Expanded(child: Text(achievement)),
                                      ],
                                    ),
                                  ),
                                )
                                .toList(),
                          ),
                        ),
                    ],
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }

  String _formatExperienceDates(ProfileExperience experience) {
    final format = DateFormat('MMM yyyy');
    final start = format.format(experience.startDate.toLocal());
    final end = experience.endDate != null
        ? format.format(experience.endDate!.toLocal())
        : 'Present';
    return '$start — $end';
  }
}

class _ProfileDetailsSheet extends StatefulWidget {
  const _ProfileDetailsSheet({required this.profile});

  final ProfileModel profile;

  @override
  State<_ProfileDetailsSheet> createState() => _ProfileDetailsSheetState();
}

class _ProfileDetailsSheetState extends State<_ProfileDetailsSheet> {
  late final TextEditingController _nameController;
  late final TextEditingController _headlineController;
  late final TextEditingController _locationController;
  late final TextEditingController _bioController;
  late final TextEditingController _focusAreaController;
  late String _availabilityStatus;
  late bool _acceptingVolunteers;
  late bool _acceptingLaunchpad;
  final _formKey = GlobalKey<FormState>();
  late List<String> _focusAreas;

  @override
  void initState() {
    super.initState();
    final profile = widget.profile;
    _nameController = TextEditingController(text: profile.fullName);
    _headlineController = TextEditingController(text: profile.headline);
    _locationController = TextEditingController(text: profile.location);
    _bioController = TextEditingController(text: profile.bio);
    _focusAreaController = TextEditingController();
    _availabilityStatus = profile.availability.status;
    _acceptingVolunteers = profile.availability.acceptingVolunteers;
    _acceptingLaunchpad = profile.availability.acceptingLaunchpad;
    _focusAreas = List<String>.from(profile.focusAreas);
  }

  @override
  void dispose() {
    _nameController.dispose();
    _headlineController.dispose();
    _locationController.dispose();
    _bioController.dispose();
    _focusAreaController.dispose();
    super.dispose();
  }

  void _addFocusArea() {
    final value = _focusAreaController.text.trim();
    if (value.isEmpty) {
      return;
    }
    if (!_focusAreas.any((element) => element.toLowerCase() == value.toLowerCase())) {
      setState(() {
        _focusAreas = [..._focusAreas, value];
      });
    }
    _focusAreaController.clear();
  }

  void _removeFocusArea(String value) {
    setState(() {
      _focusAreas = _focusAreas.where((element) => element != value).toList();
    });
  }

  void _handleSubmit() {
    final form = _formKey.currentState;
    if (form == null || !form.validate()) {
      return;
    }

    final profile = widget.profile;
    final name = _nameController.text.trim();
    final headline = _headlineController.text.trim();
    final location = _locationController.text.trim();
    final bio = _bioController.text.trim();
    final focusAreas = _focusAreas.map((area) => area.trim()).where((area) => area.isNotEmpty).toList();

    final request = ProfileUpdateRequest(
      fullName: name != profile.fullName ? name : null,
      headline: headline != profile.headline ? headline : null,
      location: location != profile.location ? location : null,
      bio: bio != profile.bio ? bio : null,
      focusAreas: listEquals(focusAreas, profile.focusAreas) ? null : focusAreas,
      acceptingVolunteers: _acceptingVolunteers == profile.availability.acceptingVolunteers
          ? null
          : _acceptingVolunteers,
      acceptingLaunchpad: _acceptingLaunchpad == profile.availability.acceptingLaunchpad
          ? null
          : _acceptingLaunchpad,
      availabilityStatus:
          _availabilityStatus == profile.availability.status ? null : _availabilityStatus,
    );

    if (request.toJson().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('No changes to update.')),
      );
      return;
    }

    Navigator.of(context).pop(request);
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final bottomPadding = MediaQuery.of(context).viewInsets.bottom + 24;

    return SafeArea(
      child: Padding(
        padding: EdgeInsets.only(bottom: bottomPadding),
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(24, 24, 24, 0),
          child: Form(
            key: _formKey,
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
                          Text('Edit profile details', style: theme.textTheme.titleLarge),
                          const SizedBox(height: 8),
                          Text(
                            'Update how clients and collaborators discover your Gigvora presence.',
                            style: theme.textTheme.bodyMedium?.copyWith(
                              color: colorScheme.onSurfaceVariant,
                            ),
                          ),
                        ],
                      ),
                    ),
                    IconButton(
                      onPressed: () => Navigator.of(context).maybePop(),
                      icon: const Icon(Icons.close),
                    ),
                  ],
                ),
                const SizedBox(height: 20),
                TextFormField(
                  controller: _nameController,
                  decoration: const InputDecoration(labelText: 'Full name'),
                  validator: (value) {
                    if (value == null || value.trim().isEmpty) {
                      return 'Enter your full name';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _headlineController,
                  decoration: const InputDecoration(labelText: 'Headline'),
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _locationController,
                  decoration: const InputDecoration(labelText: 'Location'),
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _bioController,
                  maxLines: 4,
                  decoration: const InputDecoration(
                    labelText: 'Bio',
                    hintText: 'Tell your story, major outcomes, and values.',
                  ),
                ),
                const SizedBox(height: 24),
                Text('Availability', style: theme.textTheme.titleSmall),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  value: _availabilityStatus,
                  decoration: const InputDecoration(labelText: 'Status'),
                  items: _availabilityStatusLabels.entries
                      .map(
                        (entry) => DropdownMenuItem<String>(
                          value: entry.key,
                          child: Text(entry.value),
                        ),
                      )
                      .toList(),
                  onChanged: (value) {
                    if (value != null) {
                      setState(() => _availabilityStatus = value);
                    }
                  },
                ),
                SwitchListTile.adaptive(
                  contentPadding: EdgeInsets.zero,
                  title: const Text('Accepting volunteers'),
                  subtitle: const Text('Surface your profile to volunteer marketplaces.'),
                  value: _acceptingVolunteers,
                  onChanged: (value) => setState(() => _acceptingVolunteers = value),
                ),
                SwitchListTile.adaptive(
                  contentPadding: EdgeInsets.zero,
                  title: const Text('Accepting launchpad missions'),
                  subtitle: const Text('Invite emerging talent to collaborate on projects.'),
                  value: _acceptingLaunchpad,
                  onChanged: (value) => setState(() => _acceptingLaunchpad = value),
                ),
                const SizedBox(height: 24),
                Text('Focus areas', style: theme.textTheme.titleSmall),
                const SizedBox(height: 8),
                TextFormField(
                  controller: _focusAreaController,
                  decoration: InputDecoration(
                    labelText: 'Add focus area',
                    suffixIcon: IconButton(
                      onPressed: _addFocusArea,
                      icon: const Icon(Icons.add),
                    ),
                  ),
                  onFieldSubmitted: (_) => _addFocusArea(),
                ),
                const SizedBox(height: 12),
                if (_focusAreas.isEmpty)
                  Text(
                    'Focus areas help Gigvora route the right gigs and clients to you.',
                    style: theme.textTheme.bodySmall?.copyWith(color: colorScheme.onSurfaceVariant),
                  )
                else
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: _focusAreas
                        .map(
                          (area) => Chip(
                            label: Text(area),
                            onDeleted: () => _removeFocusArea(area),
                          ),
                        )
                        .toList(),
                  ),
                const SizedBox(height: 24),
                SizedBox(
                  width: double.infinity,
                  child: FilledButton.icon(
                    onPressed: _handleSubmit,
                    icon: const Icon(Icons.save_outlined),
                    label: const Text('Save profile'),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _ExperienceEditorResult {
  const _ExperienceEditorResult({required this.draft, this.experienceId});

  final ProfileExperienceDraft draft;
  final String? experienceId;
}

class _ExperienceEditorSheet extends StatefulWidget {
  const _ExperienceEditorSheet({this.experience});

  final ProfileExperience? experience;

  @override
  State<_ExperienceEditorSheet> createState() => _ExperienceEditorSheetState();
}

class _ExperienceEditorSheetState extends State<_ExperienceEditorSheet> {
  late final TextEditingController _titleController;
  late final TextEditingController _organisationController;
  late final TextEditingController _summaryController;
  late final TextEditingController _achievementController;
  late DateTime _startDate;
  DateTime? _endDate;
  bool _currentRole = false;
  List<String> _achievements = const <String>[];
  final _formKey = GlobalKey<FormState>();

  @override
  void initState() {
    super.initState();
    final experience = widget.experience;
    _titleController = TextEditingController(text: experience?.title ?? '');
    _organisationController = TextEditingController(text: experience?.organisation ?? '');
    _summaryController = TextEditingController(text: experience?.summary ?? '');
    _achievementController = TextEditingController();
    _startDate = experience?.startDate ?? DateTime.now();
    _endDate = experience?.endDate;
    _currentRole = experience?.endDate == null;
    _achievements = List<String>.from(experience?.achievements ?? const <String>[]);
  }

  @override
  void dispose() {
    _titleController.dispose();
    _organisationController.dispose();
    _summaryController.dispose();
    _achievementController.dispose();
    super.dispose();
  }

  Future<void> _pickStartDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _startDate,
      firstDate: DateTime(1995),
      lastDate: DateTime.now().add(const Duration(days: 365 * 5)),
    );
    if (picked != null) {
      setState(() => _startDate = picked);
    }
  }

  Future<void> _pickEndDate() async {
    final initial = _endDate ?? DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: initial,
      firstDate: _startDate,
      lastDate: DateTime.now().add(const Duration(days: 365 * 5)),
    );
    if (picked != null) {
      setState(() => _endDate = picked);
    }
  }

  void _addAchievement() {
    final text = _achievementController.text.trim();
    if (text.isEmpty) {
      return;
    }
    setState(() {
      _achievements = [..._achievements, text];
    });
    _achievementController.clear();
  }

  void _removeAchievement(String value) {
    setState(() {
      _achievements = _achievements.where((item) => item != value).toList();
    });
  }

  void _handleSubmit() {
    final form = _formKey.currentState;
    if (form == null || !form.validate()) {
      return;
    }

    final draft = ProfileExperienceDraft(
      title: _titleController.text.trim(),
      organisation: _organisationController.text.trim(),
      startDate: _startDate,
      endDate: _currentRole ? null : _endDate,
      summary: _summaryController.text.trim().isEmpty ? null : _summaryController.text.trim(),
      achievements: _achievements,
    );

    Navigator.of(context).pop(
      _ExperienceEditorResult(
        draft: draft,
        experienceId: widget.experience?.id,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final bottomPadding = MediaQuery.of(context).viewInsets.bottom + 24;
    final dateFormat = DateFormat('MMM d, yyyy');

    return SafeArea(
      child: Padding(
        padding: EdgeInsets.only(bottom: bottomPadding),
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(24, 24, 24, 0),
          child: Form(
            key: _formKey,
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
                          Text(
                            widget.experience == null
                                ? 'Add experience highlight'
                                : 'Edit experience',
                            style: theme.textTheme.titleLarge,
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'Share the mission, results, and impact of this engagement.',
                            style: theme.textTheme.bodyMedium,
                          ),
                        ],
                      ),
                    ),
                    IconButton(
                      onPressed: () => Navigator.of(context).maybePop(),
                      icon: const Icon(Icons.close),
                    ),
                  ],
                ),
                const SizedBox(height: 20),
                TextFormField(
                  controller: _titleController,
                  decoration: const InputDecoration(labelText: 'Role or title'),
                  validator: (value) {
                    if (value == null || value.trim().isEmpty) {
                      return 'Add a title';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _organisationController,
                  decoration: const InputDecoration(labelText: 'Organisation'),
                  validator: (value) {
                    if (value == null || value.trim().isEmpty) {
                      return 'Add the organisation or client';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      child: InkWell(
                        onTap: _pickStartDate,
                        borderRadius: BorderRadius.circular(16),
                        child: InputDecorator(
                          decoration: const InputDecoration(labelText: 'Start date'),
                          child: Text(dateFormat.format(_startDate)),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: InkWell(
                        onTap: _currentRole ? null : _pickEndDate,
                        borderRadius: BorderRadius.circular(16),
                        child: InputDecorator(
                          decoration: const InputDecoration(labelText: 'End date'),
                          child: Text(
                            _currentRole || _endDate == null
                                ? 'Present'
                                : dateFormat.format(_endDate!),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
                SwitchListTile.adaptive(
                  contentPadding: EdgeInsets.zero,
                  title: const Text('I currently operate in this role'),
                  value: _currentRole,
                  onChanged: (value) => setState(() {
                    _currentRole = value;
                    if (value) {
                      _endDate = null;
                    }
                  }),
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _summaryController,
                  maxLines: 4,
                  decoration: const InputDecoration(
                    labelText: 'Summary',
                    hintText: 'Key outcomes, stakeholders, or deliverables.',
                  ),
                ),
                const SizedBox(height: 16),
                Text('Achievements', style: theme.textTheme.titleSmall),
                const SizedBox(height: 8),
                TextField(
                  controller: _achievementController,
                  maxLines: 2,
                  decoration: InputDecoration(
                    hintText: 'Add measurable impact statements',
                    suffixIcon: IconButton(
                      onPressed: _addAchievement,
                      icon: const Icon(Icons.add_task),
                    ),
                  ),
                  onSubmitted: (_) => _addAchievement(),
                ),
                const SizedBox(height: 8),
                if (_achievements.isNotEmpty)
                  Column(
                    children: _achievements
                        .map(
                          (item) => ListTile(
                            contentPadding: EdgeInsets.zero,
                            title: Text(item),
                            trailing: IconButton(
                              icon: const Icon(Icons.close),
                              onPressed: () => _removeAchievement(item),
                            ),
                          ),
                        )
                        .toList(),
                  ),
                const SizedBox(height: 24),
                SizedBox(
                  width: double.infinity,
                  child: FilledButton.icon(
                    onPressed: _handleSubmit,
                    icon: const Icon(Icons.save_alt),
                    label: Text(widget.experience == null ? 'Add experience' : 'Save changes'),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _ErrorState extends StatelessWidget {
  const _ErrorState({required this.error, required this.onRetry});

  final Object? error;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 48, horizontal: 24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.error_outline, size: 48, color: Color(0xFFB91C1C)),
          const SizedBox(height: 12),
          const Text(
            'We couldn\'t load this profile right now.',
            style: TextStyle(fontWeight: FontWeight.w600),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 8),
          Text(
            '${error ?? 'Unexpected error'}',
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 16),
          FilledButton(
            onPressed: onRetry,
            child: const Text('Try again'),
          ),
        ],
      ),
    );
  }
}
